#!/usr/bin/env python3
"""
G.A.N.D.A.L.F. — LangGraph Cyclic Dev-Cycle Workflow CLI
========================================================
Führt einen zyklischen Dev-Loop (Code -> Test -> Refactor) via LangGraph aus.

Verwendung:
    python graph_workflow.py --task "Schreibe eine Funktion reverse_words(s: str) -> str"
    python graph_workflow.py --task "Fixe den Edge-Case für leere Strings" --max-iterations 5 --json
"""

import argparse
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

# Ensure proper UTF-8 stdout/stderr on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Dynamically ensure backend directory is on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))


# Import settings and agent from graph
try:
    from config import BASE_DIR, settings, set_api_key
    from graph import agent_app
except ImportError:
    from .config import BASE_DIR, settings, set_api_key
    from .graph import agent_app

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


# ANSI styling helpers (safe for Windows terminals)
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def supports_color() -> bool:
    """Check if color is supported in the current terminal."""
    if os.name == "nt":
        return os.getenv("TERM") is not None or "ANSICON" in os.environ or "WT_SESSION" in os.environ
    return sys.stdout.isatty()


USE_COLOR = supports_color()


def colorize(text: str, color_code: str) -> str:
    if USE_COLOR:
        return f"{color_code}{text}{Colors.RESET}"
    return text


@traceable(name="gandalf_dev_cycle", run_type="chain")
def run_graph_cycle(
    task: str,
    model: Optional[str] = None,
    max_iterations: int = 3,
    api_key: Optional[str] = None,
    output_dir: Optional[str] = None,
    quiet: bool = False,
    verbose: bool = False
) -> Dict[str, Any]:
    """
    Executes the LangGraph cyclic dev-loop (Coder -> Tester -> Router -> Coder).
    """
    # Configure API key if provided
    if api_key:
        set_api_key(api_key.strip())

    current_key = settings.GEMINI_API_KEY
    chosen_model = model or settings.DEFAULT_MODEL
    run_id = uuid.uuid4().hex[:8]

    if not quiet:
        print("\n" + "=" * 64)
        print(colorize(f"  🧙 G.A.N.D.A.L.F. — LangGraph Dev-Cycle", Colors.HEADER + Colors.BOLD))
        print(f"  Task: {colorize(task, Colors.CYAN)}")
        print(f"  Model: {chosen_model} | Max Iterations: {max_iterations} | Run ID: {run_id}")
        if getattr(settings, "LANGCHAIN_TRACING_V2", False):
            print(colorize(f"  🔍 LangSmith Tracing: Aktiv (Projekt: {settings.LANGCHAIN_PROJECT})", Colors.DIM + Colors.CYAN))
        print("=" * 64 + "\n")

    if not current_key and not quiet:
        print(colorize(
            "⚠️  HINWEIS: Kein GEMINI_API_KEY gefunden!\n"
            "   Bitte setze GEMINI_API_KEY als Umgebungsvariable, in backend/.env oder via --api-key.",
            Colors.YELLOW
        ))

    initial_state = {
        "run_id": run_id,
        "task": task,
        "model": chosen_model,
        "code": "",
        "test_code": "",
        "test_output": "",
        "iterations": 0,
        "max_iterations": max_iterations,
        "status": "starting",
        "success": False,
        "logs": [
            {
                "step": "init",
                "iteration": 0,
                "type": "info",
                "message": f"Dev-Cycle gestartet: Modell '{chosen_model}', Max Iterationen: {max_iterations}"
            }
        ]
    }

    current_state = initial_state.copy()

    # Stream execution through LangGraph
    try:
        for step in agent_app.stream(initial_state):
            for node_name, node_state in step.items():
                current_state.update(node_state)
                iteration = current_state.get("iterations", 1)

                if node_name == "coder":
                    status = current_state.get("status")
                    if status == "error":
                        if not quiet:
                            print(colorize(f"❌ [Runde {iteration}] Coder-Fehler: {current_state.get('test_output')}", Colors.RED))
                    else:
                        if not quiet:
                            if iteration == 1:
                                print(colorize(f"🤖 [Runde {iteration}/{max_iterations}] Coder: Erstelle initiale Lösung & Pytest-Unit-Tests...", Colors.BLUE))
                            else:
                                print(colorize(f"🔄 [Runde {iteration}/{max_iterations}] Refactoring: Korrigiere Code basierend auf Testergebnissen...", Colors.YELLOW))
                        if verbose and current_state.get("code"):
                            print(colorize("--- Generierter Code (solution.py) ---", Colors.DIM))
                            print(current_state["code"][:400] + ("\n..." if len(current_state["code"]) > 400 else ""))

                elif node_name == "tester":
                    if current_state.get("status") == "error":
                        continue
                    success = current_state.get("success", False)
                    test_output = current_state.get("test_output", "")

                    if success:
                        if not quiet:
                            print(colorize(f"✅ [Runde {iteration}/{max_iterations}] Pytest: ALLE TESTS BESTANDEN!", Colors.GREEN + Colors.BOLD))
                    else:
                        if not quiet:
                            print(colorize(f"❌ [Runde {iteration}/{max_iterations}] Pytest: Tests fehlgeschlagen! Traceback übergeben...", Colors.RED))
                        if verbose and test_output:
                            print(colorize("--- Test Output ---", Colors.DIM))
                            print(test_output.strip())

    except Exception as exc:
        err_msg = f"LangGraph Ausführungsfehler: {str(exc)}"
        if not quiet:
            print(colorize(f"💥 {err_msg}", Colors.RED + Colors.BOLD))
        current_state["status"] = "error"
        current_state["success"] = False
        current_state["test_output"] = err_msg

    # Final workspace paths
    run_dir = settings.WORKSPACE_DIR / f"run_{run_id}"
    sol_file = run_dir / "solution.py"
    test_file = run_dir / "test_solution.py"

    # Save to custom output-dir if requested
    if output_dir and current_state.get("code"):
        out_path = Path(output_dir).resolve()
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "solution.py").write_text(current_state["code"], encoding="utf-8")
        if current_state.get("test_code"):
            (out_path / "test_solution.py").write_text(current_state["test_code"], encoding="utf-8")
        out_msg = f"Artefakte exportiert nach: {out_path}"
    else:
        out_path = run_dir if run_dir.exists() else None
        out_msg = f"Artefakte im Sandbox-Ordner: {run_dir}" if run_dir.exists() else ""

    result = {
        "run_id": run_id,
        "task": task,
        "model": chosen_model,
        "success": current_state.get("success", False),
        "status": current_state.get("status", "unknown"),
        "iterations": current_state.get("iterations", 0),
        "max_iterations": max_iterations,
        "solution_path": str(sol_file) if sol_file.exists() else "",
        "test_path": str(test_file) if test_file.exists() else "",
        "output_directory": str(out_path) if out_path else "",
        "code": current_state.get("code", ""),
        "test_code": current_state.get("test_code", ""),
        "test_output": current_state.get("test_output", ""),
        "logs": current_state.get("logs", [])
    }

    if not quiet:
        print("\n" + "=" * 64)
        if result["success"]:
            print(colorize("🎉 DEV-CYCLE ERFOLGREICH ABGESCHLOSSEN!", Colors.GREEN + Colors.BOLD))
        else:
            print(colorize("⚠️  DEV-CYCLE NICHT ERFOLGREICH (Max Iterationen oder Fehler)", Colors.RED + Colors.BOLD))
        if out_msg:
            print(colorize(f"📁 {out_msg}", Colors.CYAN))
        print("=" * 64 + "\n")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Führt einen zyklischen Dev-Loop (Code -> Test -> Refactor) via LangGraph aus.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        "--task", "-t",
        required=True,
        type=str,
        help="Die Entwicklungsaufgabe oder der Test-Fix"
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=settings.DEFAULT_MODEL,
        help="Gemini Modell für Coder/Refactor (z. B. gemini-3.7-flash, gemini-3.8-flash)"
    )

    parser.add_argument(
        "--max-iterations", "-i",
        type=int,
        default=3,
        help="Maximale Anzahl der Code-Test-Refactor Zyklen"
    )
    parser.add_argument(
        "--api-key", "-k",
        type=str,
        default=None,
        help="Google Gemini API Key (optional, überschreibt .env)"
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default=None,
        help="Verzeichnis zum Speichern der finalen solution.py und test_solution.py"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Gibt das Ergebnis als formatiertes JSON auf stdout aus"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Unterdrückt interaktive Ausgaben (nur JSON oder Exit-Code)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Ausführliche Logs inkl. Pytest-Ausgaben anzeigen"
    )

    args = parser.parse_args()

    # If --json is set, default to quiet mode so stdout only contains valid JSON
    quiet = args.quiet or args.json

    result = run_graph_cycle(
        task=args.task,
        model=args.model,
        max_iterations=args.max_iterations,
        api_key=args.api_key,
        output_dir=args.output_dir,
        quiet=quiet,
        verbose=args.verbose
    )

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))

    # Exit code: 0 if success, 1 otherwise
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
