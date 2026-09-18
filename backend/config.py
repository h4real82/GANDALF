import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or parent directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKSPACE_DIR: Path = BASE_DIR / "workspace"

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
