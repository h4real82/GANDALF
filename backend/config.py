import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory, GANDALF directory, or project root directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR.parent.parent / ".env")

# Synchronize LANGSMITH_* and LANGCHAIN_* environment variables for full interoperability
_tracing_val = os.getenv("LANGSMITH_TRACING") or os.getenv("LANGCHAIN_TRACING_V2", "false")
_is_tracing = _tracing_val.lower() in ("true", "1")
os.environ["LANGSMITH_TRACING"] = "true" if _is_tracing else "false"
os.environ["LANGCHAIN_TRACING_V2"] = "true" if _is_tracing else "false"

_api_key_val = os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY", "")
if _api_key_val:
    os.environ["LANGSMITH_API_KEY"] = _api_key_val
    os.environ["LANGCHAIN_API_KEY"] = _api_key_val

_project_val = os.getenv("LANGSMITH_PROJECT") or os.getenv("LANGCHAIN_PROJECT", "antigravity-graph")
os.environ["LANGSMITH_PROJECT"] = _project_val
os.environ["LANGCHAIN_PROJECT"] = _project_val

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKSPACE_DIR: Path = BASE_DIR / "workspace"
    LANGCHAIN_TRACING_V2: bool = _is_tracing
    LANGCHAIN_PROJECT: str = _project_val
    LANGCHAIN_API_KEY: str = _api_key_val
    LANGSMITH_TRACING: bool = _is_tracing
    LANGSMITH_PROJECT: str = _project_val
    LANGSMITH_API_KEY: str = _api_key_val

settings = Settings()
settings.WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

def set_api_key(key: str):
    """Allows dynamic runtime update of API key from UI."""
    settings.GEMINI_API_KEY = key.strip()
    # Also write/update local .env
    env_file = BASE_DIR / ".env"
    lines = []
    if env_file.exists():
        lines = env_file.read_text(encoding="utf-8").splitlines()
    
    updated = False
    new_lines = []
    for line in lines:
        if line.startswith("GEMINI_API_KEY="):
            new_lines.append(f"GEMINI_API_KEY={key.strip()}")
            updated = True
        else:
            new_lines.append(line)
    if not updated:
        new_lines.append(f"GEMINI_API_KEY={key.strip()}")
    
    env_file.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
