import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph

# LangSmith Tracing integration
try:
    from langsmith import traceable
except ImportError:
    def traceable(name=None, run_type="chain", **kwargs):
        def decorator(f):
            return f
        if callable(name):
            return name
        return decorator

try:
    from .config import settings
except ImportError:
    try:
        from config import settings
    except ImportError:
        from backend.config import settings


class AgentState(TypedDict):
    run_id: str
    task: str
    model: str
    code: str
    test_code: str
    test_output: str
    iterations: int
    max_iterations: int
    status: str
    success: bool
    logs: List[Dict[str, Any]]

def extract_code_blocks(text: str) -> tuple[str, str]:
    """Extracts solution.py and test_solution.py from model output."""
    solution_code = ""
    test_code = ""

    # Look for demarcated files
    sol_match = re.search(r"```python\s*#\s*solution\.py\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE)
    test_match = re.search(r"```python\s*#\s*test_solution\.py\s*\n(.*?)```", text, re.DOTALL | re.IGNORECASE)

    if sol_match:
        solution_code = sol_match.group(1).strip()
    if test_match:
        test_code = test_match.group(1).strip()

    # Fallback if tags not explicitly placed: parse any code blocks
    if not solution_code or not test_code:
        blocks = re.findall(r"```python(.*?)```", text, re.DOTALL)
        if len(blocks) >= 2:
            solution_code = solution_code or blocks[0].strip()
            test_code = test_code or blocks[1].strip()
        elif len(blocks) == 1:
            if not solution_code:
                solution_code = blocks[0].strip()

    # If still no test code, generate a basic assert import
    if not test_code:
        test_code = """import pytest
from solution import *

def test_basic_execution():
    assert True
"""

    return solution_code, test_code

@traceable(name="gemini_code_generation", run_type="llm")
def call_gemini_models(
    client: Any,
    candidate_models: List[str],
    prompt: str,
    system_instruction: str,
    types: Any
) -> tuple[str, str]:
    """Generates code with Gemini, trying candidate models in order with automatic fallback."""
    last_err = None
    for cand in candidate_models:
        try:
            response = client.models.generate_content(
                model=cand,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2
                )
            )
            return response.text or "", cand
        except Exception as e:
            last_err = e
            err_str = str(e)
            if any(code in err_str for code in ("503", "UNAVAILABLE", "429", "404")):
                continue
            raise
    if last_err:
        raise last_err
    raise RuntimeError("Kein Gemini-Modell konnte erfolgreich antworten.")


@traceable(name="coder_node", run_type="chain")
def coder_node(state: AgentState) -> Dict[str, Any]:
    """Uses Gemini 2.5 Pro to write or fix code and unit tests."""
    iterations = state.get("iterations", 0) + 1
    model_name = state.get("model") or settings.DEFAULT_MODEL
    api_key = settings.GEMINI_API_KEY

    logs = list(state.get("logs", []))

    if not api_key:
        err_msg = "KEIN GEMINI_API_KEY HINTERLEGT! Bitte API-Key in den Einstellungen eingeben."
        logs.append({
            "step": "coder",
            "iteration": iterations,
            "type": "error",
            "message": err_msg
        })
        return {
            "iterations": iterations,
            "status": "error",
            "success": False,
            "test_output": err_msg,
            "logs": logs
        }

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        try:
            from langsmith import wrappers
            if hasattr(wrappers, "wrap_gemini"):
                client = wrappers.wrap_gemini(
                    client,
                    tracing_extra={
                        "tags": ["gemini", "gandalf", "coder"],
                        "metadata": {
                            "integration": "google-genai",
                            "component": "gandalf-coder"
                        }
                    }
                )
        except Exception:
            pass

        system_instruction = (
            "Du bist ein Elite-Softwareentwickler und KI-Assistent für das GANDALF HUD System.\n"
            "Deine Aufgabe ist es, für die übergebene Programmieraufgabe zwei saubere, hochperformante Python-Dateien zu erstellen:\n"
            "1. 'solution.py': Die vollständige, produktionsreife Implementierung.\n"
            "2. 'test_solution.py': Umfassende Pytest-Unit-Tests (Edge Cases, Validierungen, Typen).\n\n"
            "Formatierungs-Regel:\n"
            "Gib deine Antwort IMMER in zwei eindeutig beschrifteten Markdown-Python-Blöcken aus:\n\n"
            "```python\n"
            "# solution.py\n"
            "# Dein Code hier\n"
            "```\n\n"
            "```python\n"
            "# test_solution.py\n"
            "# Deine Pytest Tests hier (importiert aus solution import *)\n"
            "```\n"
            "Kein überflüssiges Blabla drumherum, nur hochqualitativer Code und präzise Tests."
        )

        if iterations == 1:
            prompt = f"Neue Aufgabe:\n{state['task']}\n\nErstelle solution.py und test_solution.py."
        else:
            prompt = (
                f"AUFGABE:\n{state['task']}\n\n"
                f"BISHERIGER CODE (solution.py):\n```python\n{state['code']}\n```\n\n"
                f"BISHERIGE TESTS (test_solution.py):\n```python\n{state['test_code']}\n```\n\n"
                f"FEHLERMELDUNGEN AUS DEM PYTEST-LAUF:\n{state['test_output']}\n\n"
                f"Bitte analysiere den Fehler sorgfältig und korrigiere solution.py bzw. test_solution.py, sodass alle Tests erfolgreich durchlaufen."
            )

        logs.append({
            "step": "coder",
            "iteration": iterations,
            "type": "thinking",
            "message": f"Gemini ({model_name}) generiert Lösung für Iteration {iterations}..."
        })

        import warnings
        warnings.filterwarnings("ignore", message=".*automatic function calling.*")

        candidate_models = [model_name]
        for fallback in ["gemini-3.7-flash", "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        raw_text, used_model = call_gemini_models(
            client=client,
            candidate_models=candidate_models,
            prompt=prompt,
            system_instruction=system_instruction,
            types=types
        )

        if used_model != model_name:
            logs.append({
                "step": "coder",
                "iteration": iterations,
                "type": "info",
                "message": f"Modell '{model_name}' überlastet/nicht verfügbar. Automatisch auf '{used_model}' ausgewichen."
            })

        sol_code, test_code = extract_code_blocks(raw_text)

        logs.append({
            "step": "coder",
            "iteration": iterations,
            "type": "code_ready",
            "message": f"Code & Tests für Iteration {iterations} erfolgreich generiert.",
            "code_preview": sol_code[:200] + "..." if len(sol_code) > 200 else sol_code
        })

        return {
            "code": sol_code,
            "test_code": test_code,
            "iterations": iterations,
            "status": "testing",
            "logs": logs
        }

    except Exception as e:
        err_text = f"Fehler beim Gemini API-Aufruf: {str(e)}"
        logs.append({
            "step": "coder",
            "iteration": iterations,
            "type": "error",
            "message": err_text
        })
        return {
            "iterations": iterations,
            "status": "error",
            "success": False,
            "test_output": err_text,
            "logs": logs
        }

@traceable(name="pytest_sandbox_execution", run_type="tool")
def execute_pytest_sandbox(test_path: Path, run_dir: Path, timeout: int = 25) -> tuple[bool, str]:
    """Runs pytest in the isolated workspace sandbox directory."""
    proc = subprocess.run(
        [sys.executable, "-m", "pytest", "-v", "--tb=short", str(test_path)],
        cwd=str(run_dir),
        capture_output=True,
        text=True,
        timeout=timeout
    )
    output = proc.stdout
    if proc.stderr:
        output += "\n" + proc.stderr
    return proc.returncode == 0, output


@traceable(name="tester_node", run_type="chain")
def tester_node(state: AgentState) -> Dict[str, Any]:
    """Writes files to sandbox and executes pytest."""
    iterations = state.get("iterations", 1)
    logs = list(state.get("logs", []))

    if state.get("status") == "error":
        return {"logs": logs}

    run_id = state.get("run_id", "default")
    run_dir = settings.WORKSPACE_DIR / f"run_{run_id}"
    run_dir.mkdir(parents=True, exist_ok=True)

    solution_path = run_dir / "solution.py"
    test_path = run_dir / "test_solution.py"

    solution_path.write_text(state["code"], encoding="utf-8")
    test_path.write_text(state["test_code"], encoding="utf-8")

    logs.append({
        "step": "tester",
        "iteration": iterations,
        "type": "running_tests",
        "message": f"Führe Pytest für Iteration {iterations} im Sandbox-Ordner aus..."
    })

    try:
        is_success, output = execute_pytest_sandbox(test_path, run_dir)

        logs.append({
            "step": "tester",
            "iteration": iterations,
            "type": "test_result",
            "success": is_success,
            "message": "✅ Alle Tests bestanden!" if is_success else "❌ Tests fehlgeschlagen, Traceback an Coder übergeben.",
            "output": output
        })

        return {
            "test_output": output,
            "success": is_success,
            "status": "success" if is_success else "evaluating",
            "logs": logs
        }

    except subprocess.TimeoutExpired:
        timeout_msg = "Pytest Timeout (über 25s) - Mögliche Endlosschleife im generierten Code."
        logs.append({
            "step": "tester",
            "iteration": iterations,
            "type": "error",
            "message": timeout_msg
        })
        return {
            "test_output": timeout_msg,
            "success": False,
            "status": "evaluating",
            "logs": logs
        }
    except Exception as e:
        err_msg = f"Unerwarteter Fehler beim Testen: {str(e)}"
        logs.append({
            "step": "tester",
            "iteration": iterations,
            "type": "error",
            "message": err_msg
        })
        return {
            "test_output": err_msg,
            "success": False,
            "status": "error",
            "logs": logs
        }

def router_node(state: AgentState) -> str:
    """Decides whether to finish or iterate."""
    if state.get("status") == "error":
        return END

    if state.get("success", False):
        return END

    if state.get("iterations", 0) >= state.get("max_iterations", 3):
        return END

    return "coder"

def build_gandalf_agent():
    """Builds and compiles the LangGraph StateGraph."""
    builder = StateGraph(AgentState)
    builder.add_node("coder", coder_node)
    builder.add_node("tester", tester_node)

    builder.set_entry_point("coder")
    builder.add_edge("coder", "tester")
    builder.add_conditional_edges("tester", router_node, {"coder": "coder", END: END})

    return builder.compile()

agent_app = build_gandalf_agent()
