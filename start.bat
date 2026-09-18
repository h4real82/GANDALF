@echo off
title G.A.N.D.A.L.F. Auto-DJ & AI Agent System
echo ==========================================================
echo   G.A.N.D.A.L.F. Auto-DJ & Real MP3 Sound-Deck v5.5
echo   + LangGraph & Google Gemini AI Dev-Cycle Engine
echo ==========================================================
echo.

cd /d "%~dp0"

:: 0. .env Datei initialisieren falls nicht vorhanden
if not exist backend\.env (
  if exist backend\.env.example (
    echo [INFO] Erstelle backend\.env aus .env.example...
    copy backend\.env.example backend\.env
    echo [HINWEIS] Bitte trage deinen GEMINI_API_KEY in backend\.env ein oder nutze das UI im GANDALF HUD!
    echo.
  )
)

:: 1. Frontend-Dependencies pruefen
if not exist node_modules (
  echo [INFO] Installiere Frontend-Abhaengigkeiten...
  call npm.cmd install
  echo.
)

:: 2. Python Backend-Dependencies pruefen (optional / quick)
python -c "import fastapi, langgraph, google.genai, pytest" >nul 2>&1
if %errorlevel% neq 0 (
  echo [INFO] Installiere Python Backend-Pakete...
  python -m pip install -r backend\requirements.txt
  echo.
)

:: 3. Starte Python FastAPI Backend (Port 8000)
echo [INFO] Starte GANDALF AI Agent Backend auf Port 8000...
start "GANDALF AI Agent Backend (Port 8000)" python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

:: 4. Starte Vite Frontend (Port 5173)
echo [INFO] Starte lokalen Vite Dev-Server auf Port 5173...
call npm.cmd run dev
pause
