import asyncio
import json
import uuid
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .config import settings, set_api_key
from .graph import agent_app

app = FastAPI(
    title="G.A.N.D.A.L.F. AI Agent API",
    description="LangGraph + Google AI Studio Pro (Gemini 2.5 Pro) Code- & Test-Engine",
    version="1.0.0"
)

# CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory queue store for SSE streaming
run_queues: Dict[str, asyncio.Queue] = {}
run_results: Dict[str, Any] = {}

class RunRequest(BaseModel):
    task: str
    model: Optional[str] = None
    max_iterations: Optional[int] = 3

class KeyRequest(BaseModel):
    key: str

@app.get("/api/health")
async def health_check():
    has_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10)
    masked_key = f"{settings.GEMINI_API_KEY[:6]}...{settings.GEMINI_API_KEY[-4:]}" if has_key else ""
    return {
        "status": "online",
        "has_api_key": has_key,
        "masked_key": masked_key,
        "default_model": settings.DEFAULT_MODEL,
        "langsmith_active": getattr(settings, "LANGCHAIN_TRACING_V2", False),
        "langchain_project": getattr(settings, "LANGCHAIN_PROJECT", "antigravity-graph")
    }

@app.post("/api/agent/key")
async def update_key(payload: KeyRequest):
    if not payload.key or len(payload.key.strip()) < 8:
        raise HTTPException(status_code=400, detail="Ungültiger API-Key.")
    set_api_key(payload.key.strip())
    return {
        "status": "updated",
        "masked_key": f"{payload.key[:6]}...{payload.key[-4:]}"
    }

async def execute_agent(run_id: str, task: str, model: str, max_iterations: int):
    queue = run_queues.get(run_id)
    if not queue:
        return

    initial_state = {
        "run_id": run_id,
        "task": task,
        "model": model,
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
                "message": f"Agent gestartet mit Modell '{model}' (Max. {max_iterations} Runden)..."
            }
        ]
    }

    await queue.put({
        "event": "start",
        "state": initial_state
    })

    try:
        current_state = initial_state
        # Stream intermediate graph updates
        for step_output in agent_app.stream(initial_state):
            for node_name, node_state in step_output.items():
                current_state = {**current_state, **node_state}
                await queue.put({
                    "event": "update",
                    "node": node_name,
                    "state": current_state
                })
                # Small yield pause to ensure clean SSE dispatching
                await asyncio.sleep(0.05)

        run_results[run_id] = current_state
        await queue.put({
            "event": "complete",
            "state": current_state
        })

    except Exception as e:
        err_state = {
            **current_state,
            "status": "error",
            "success": False,
            "test_output": f"Fataler Fehler im Agenten-Workflow: {str(e)}"
        }
        await queue.put({
            "event": "error",
            "state": err_state
        })
    finally:
        await queue.put(None)  # Sentinel to close stream

@app.post("/api/agent/run")
async def start_run(payload: RunRequest):
    run_id = str(uuid.uuid4())[:8]
    queue = asyncio.Queue()
    run_queues[run_id] = queue

    model = payload.model or settings.DEFAULT_MODEL
    max_iter = payload.max_iterations or 3

    # Launch agent task in background
    asyncio.create_task(execute_agent(run_id, payload.task, model, max_iter))

    return {
        "run_id": run_id,
        "model": model,
        "status": "running"
    }

@app.get("/api/agent/stream/{run_id}")
async def stream_run(run_id: str):
    queue = run_queues.get(run_id)
    if not queue:
        raise HTTPException(status_code=404, detail="Run ID nicht gefunden.")

    async def event_generator():
        try:
            while True:
                data = await queue.get()
                if data is None:
                    break
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if run_id in run_queues:
                del run_queues[run_id]

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
