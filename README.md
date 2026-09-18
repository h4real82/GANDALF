# 🧙 G.A.N.D.A.L.F. — Cyber-Tactile HUD, Auto-DJ & LangGraph AI Dev-Deck

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-FF6F00?style=for-the-badge&logo=python&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Futuristisches Cyber-Tactile HUD Interface & Voice Assistant Deck mit integrierter autonomer LangGraph Code-Test-Refactor Engine.**

[Schnellstart](#-schnellstart) • [Features](#-features) • [LangGraph Dev-Cycle](#-langgraph-dev-cycle-cli) • [Hotkeys](#-hotkeys) • [Architektur](#-architektur)

</div>

---

## 🌟 Übersicht

**G.A.N.D.A.L.F.** (*General Audio-Neural Deck & Autonomous Logic Framework*) verbindet ein taktiles Sci-Fi DJ-Deck im Silk-Glassmorphism-Stil mit einem hochgradig autonomen Programmier-Agenten. Angetrieben von **Google Gemini** und **LangGraph** führt das System selbstständig zyklische Entwicklungsrunden (*Coder ➔ Sandbox-Pytest ➔ Refactoring*) durch und streamt Fortschritte in Echtzeit in das HUD.

---

## 🚀 Schnellstart

### Methode 1: 1-Klick-Start (Empfohlen für Windows)

Einfach die Datei **[`start.bat`](./start.bat)** doppelklicken!
Das Skript erledigt automatisch:
1. Erstellt `backend/.env` aus der Vorlage (falls noch nicht vorhanden).
2. Installiert fehlende Node- & Python-Abhängigkeiten.
3. Startet das FastAPI-Backend auf Port `8000`.
4. Startet das Vite-Frontend auf Port `5173` und öffnet die App im Browser.

### Methode 2: Manueller Start

#### 1. Repository klonen
```bash
git clone https://github.com/h4real82/GANDALF.git
cd GANDALF
```

#### 2. Backend starten (Python 3.10+)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Trage deinen GEMINI_API_KEY in .env ein
python -m uvicorn backend.main:app --reload --port 8000
```

#### 3. Frontend starten (Node.js 18+)
In einem zweiten Terminal im Hauptverzeichnis:
```bash
npm install
npm run dev
```

App im Browser öffnen: **`http://localhost:5173/`**

---

## ⚙️ Konfiguration (`.env`)

Kopiere `backend/.env.example` nach `backend/.env` oder trage den API-Key direkt im laufenden HUD-Interface unter **Einstellungen** ein:

```env
# Google Gemini API Key (Google AI Studio)
GEMINI_API_KEY=dein_gemini_api_key_hier

# Standard-Modell (z. B. gemini-3.7-flash, gemini-3.8-flash, gemini-2.5-pro)
DEFAULT_MODEL=gemini-3.7-flash

PORT=8000
```

---

## ✨ Features

### 🎛️ Echte MP3-Engine & Auto-DJ
- **Echte Audio-Wiedergabe:** Drag & Drop von MP3/WAV-Dateien direkt ins Fenster oder Ordnerauswahl (`webkitdirectory`).
- **Interactive Scrubber:** Präziser Waveform-Scrubber mit Spulen und Millisekunden-Zeitanzeige.
- **Pitch & BPM-Regelung:** Stufenlos von 120 bis 175 BPM mit automatischer Audio-Playback-Geschwindigkeit.
- **808 Club-Synthesizer:** Integrierter 808-Sub-Bass Rave-Beat-Generator.

### ⚡ Silk Soundboard Matrix
- **52 kuratierte Sounds & Zitate:** Kategorisiert in *Memes*, *Alkohol*, *Aggro*, *Drops* und *Philosophie*.
- **Echtzeit-Synthese:** Lokale Sprachsynthese mit Sub-Bass-Boost und automatisches Sample-Matching.
- **Auto-Drop System:** Zufallsgesteuerte Drop-Ins auf Tastendruck.

### 🔮 Cyber HUD & Visuals
- **Silk Glassmorphism:** Neon-Glows, rotierende Lotus-Halo-Ringe und Ripple-Effekte.
- **Faxxen- & Glitch-System:** CRT-Scanlines, Turbo-Strobe und einstellbare Glitch-Intensität.
- **Spatial Modal Hub:** Zen-Patron Hologramm-Modal für Agenten, Einstellungen und Sound-Verwaltung.
- **Audio-Visualizer:** Dynamischer 48-Bar Waveform-Canvas und 16-Band Spectrum Analyzer.

### 🧙 Autonome LangGraph Dev-Cycle Engine
- **Zyklischer Dev-Loop:** 
  1. **Coder-Node:** Analysiert Task und generiert `solution.py` sowie umfassende `test_solution.py`.
  2. **Tester-Node:** Führt Pytest isoliert im Sandbox-Verzeichnis aus.
  3. **Router-Node:** Bei Fehlern wird der vollständige Traceback zurück an den Coder übergeben (Refactor-Schleife bis Tests grün sind).
- **Resilientes Modell-Fallback:** Automatisches Ausweichen (`gemini-3.7-flash`, `gemini-3.8-flash`, etc.) bei temporären Lastspitzen (503).
- **SSE-Streaming:** Beobachte den Denk- und Testprozess des Agenten live im Terminal oder im HUD.

---

## ⌨️ Hotkeys

| Taste | Funktion |
| :--- | :--- |
| `[1]` – `[9]` | Schnellauslöser für die ersten 9 Soundboard-Zitate |
| `[Leertaste]` | Wuchtiger 808 Club Sub-Bass Kick |
| `[D]` | Smarter Auto-Drop (Zufallssound) |

---

## 🛠️ LangGraph Dev-Cycle CLI (`graph_workflow.py`)

Das Backend enthält ein eigenständiges CLI-Tool, mit dem Programmieraufgaben autonom gelöst und getestet werden können:

```powershell
# Interaktiver Lauf mit farbiger Konsole:
python backend/graph_workflow.py --task "Implementiere einen Bubble-Sort mit Typ-Validierung"

# Maschinenlesbarer JSON-Modus (perfekt für Agenten & Tool-Calling):
python backend/graph_workflow.py --task "Schreibe einen LRU-Cache" --json
```

### Als Tool in eigenen Agenten einbinden:
```json
{
  "name": "graph_dev_cycle",
  "description": "Führt einen zyklischen Dev-Loop (Code -> Test -> Refactor) via LangGraph aus",
  "parameters": {
    "type": "object",
    "properties": {
      "task": {
        "type": "string",
        "description": "Die Entwicklungsaufgabe oder der Test-Fix"
      }
    },
    "required": ["task"]
  },
  "command": "python backend/graph_workflow.py --task \"{{task}}\""
}
```

---

## 📂 Projektstruktur

```text
GANDALF/
├── backend/                  # FastAPI & LangGraph Backend
│   ├── main.py               # SSE-Streaming API & Endpunkte
│   ├── graph.py              # LangGraph StateGraph (Coder, Tester, Router)
│   ├── graph_workflow.py     # CLI-Tool für zyklische Dev-Loops
│   ├── config.py             # Settings & Umgebungsvariablen
│   ├── requirements.txt      # Python-Abhängigkeiten
│   └── .env.example          # Vorlage für API-Keys
├── src/                      # Vite Frontend (TypeScript)
│   ├── audio/                # WebAudio API Sound-Engine & Synthesizer
│   ├── components/           # HUD-Module (Auto-DJ, Soundboard, AI Agent, Visualizer)
│   ├── data/                 # Sound-Katalog (52 Audio-Snippets)
│   └── styles/               # Silk Glassmorphism & Cyber HUD Styles
├── index.html                # Haupt-HUD Interface
├── package.json              # Frontend-Abhängigkeiten
├── start.bat                 # 1-Klick Starter für Windows
└── vite.config.ts            # Vite Konfiguration
```

---

## 👥 Mit Freunden teilen

Dieses Repository ist so vorbereitet, dass jeder mit Git und Node/Python sofort loslegen kann:
1. Teile einfach deinen GitHub-Link: `https://github.com/h4real82/GANDALF`
2. Dein Freund klont das Repo und klickt auf `start.bat`.
3. Persönliche API-Keys bleiben durch die `.gitignore` geschützt und werden nicht versehentlich ins Repository gepusht.

---

## 📄 Lizenz

MIT License © 2026 G.A.N.D.A.L.F. Team
