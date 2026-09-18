import { audioEngine } from '../audio/audioEngine.ts';

export function initAiAgent(
  appendLog: (prefix: string, text: string, cls?: string) => void,
  showToast: (tag: string, msg: string) => void,
  triggerBump: () => void
) {
  const BACKEND_URL = 'http://localhost:8000';

  // DOM Elements
  const btnOpenAgent = document.getElementById('nav-tab-ai-agent');
  const agentModal = document.getElementById('ai-agent-modal');
  const btnCloseAgent = document.getElementById('btn-close-ai-agent');
  const taskInput = document.getElementById('agent-task-input') as HTMLTextAreaElement;
  const btnStartAgent = document.getElementById('btn-start-agent');
  const modelSelect = document.getElementById('agent-model-select') as HTMLSelectElement;
  const maxIterSelect = document.getElementById('agent-max-iter') as HTMLSelectElement;
  const apiKeyInput = document.getElementById('agent-api-key') as HTMLInputElement;
  const btnSaveKey = document.getElementById('btn-save-key');
  const keyStatusPill = document.getElementById('agent-key-status');

  // Display elements in modal
  const agentStatusPill = document.getElementById('agent-status-pill');
  const agentIterDisplay = document.getElementById('agent-iter-display');
  const agentTerminal = document.getElementById('agent-terminal-output');
  const agentCodeOutput = document.getElementById('agent-code-output');
  const tabSolution = document.getElementById('tab-view-solution');
  const tabTests = document.getElementById('tab-view-tests');

  let currentEventSource: EventSource | null = null;
  let activeSolutionCode = '';
  let activeTestCode = '';
  let activeTab: 'solution' | 'tests' = 'solution';

  function openModal() {
    if (agentModal) agentModal.classList.remove('hidden');
    checkHealth();
  }

  function closeModal() {
    if (agentModal) agentModal.classList.add('hidden');
  }

  if (btnOpenAgent) btnOpenAgent.addEventListener('click', openModal);
  if (btnCloseAgent) btnCloseAgent.addEventListener('click', closeModal);

  // Check Backend health & API key
  async function checkHealth() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        if (keyStatusPill) {
          if (data.has_api_key) {
            keyStatusPill.textContent = `✓ Key Aktiv (${data.masked_key})`;
            keyStatusPill.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          } else {
            keyStatusPill.textContent = '! Kein API-Key';
            keyStatusPill.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
          }
        }
      }
    } catch (e) {
      if (keyStatusPill) {
        keyStatusPill.textContent = 'Backend Offline (Port 8000)';
        keyStatusPill.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
      }
    }
  }

  // Save API Key
  if (btnSaveKey && apiKeyInput) {
    btnSaveKey.addEventListener('click', async () => {
      const key = apiKeyInput.value.trim();
      if (!key) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/agent/key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
        if (res.ok) {
          showToast('API KEY GESPEICHERT', 'Gemini 2.5 Pro ist einsatzbereit!');
          apiKeyInput.value = '';
          checkHealth();
        } else {
          showToast('FEHLER', 'Konnte API-Key nicht speichern.');
        }
      } catch (e) {
        showToast('VERBINDUNGSFEHLER', 'Backend auf Port 8000 nicht erreichbar.');
      }
    });
  }

  // Quick prompt chips
  document.querySelectorAll('.agent-sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && taskInput) {
        taskInput.value = prompt;
      }
    });
  });

  // Code Tab switcher
  function updateCodeView() {
    if (!agentCodeOutput) return;
    if (activeTab === 'solution') {
      agentCodeOutput.textContent = activeSolutionCode || '# Noch kein Code generiert...';
      if (tabSolution) tabSolution.className = 'px-3 py-1 rounded-t-lg bg-white/10 text-white font-bold text-xs cursor-pointer border-t border-x border-cyan-400/50';
      if (tabTests) tabTests.className = 'px-3 py-1 rounded-t-lg text-slate-400 hover:text-white text-xs cursor-pointer';
    } else {
      agentCodeOutput.textContent = activeTestCode || '# Noch keine Tests generiert...';
      if (tabTests) tabTests.className = 'px-3 py-1 rounded-t-lg bg-white/10 text-white font-bold text-xs cursor-pointer border-t border-x border-cyan-400/50';
      if (tabSolution) tabSolution.className = 'px-3 py-1 rounded-t-lg text-slate-400 hover:text-white text-xs cursor-pointer';
    }
  }

  if (tabSolution) {
    tabSolution.addEventListener('click', () => {
      activeTab = 'solution';
      updateCodeView();
    });
  }
  if (tabTests) {
    tabTests.addEventListener('click', () => {
      activeTab = 'tests';
      updateCodeView();
    });
  }

  function appendTerminal(msg: string, color = 'text-slate-300') {
    if (!agentTerminal) return;
    const line = document.createElement('div');
    line.className = `${color} font-mono text-[11px] leading-relaxed break-words`;
    line.textContent = msg;
    agentTerminal.appendChild(line);
    agentTerminal.scrollTop = agentTerminal.scrollHeight;
  }

  // Start Agent Run
  if (btnStartAgent) {
    btnStartAgent.addEventListener('click', async () => {
      const task = taskInput?.value.trim();
      if (!task) {
        showToast('EINGABE ERFORDERLICH', 'Bitte gib eine Aufgabe für den Agenten ein.');
        return;
      }

      audioEngine.ensureContext();
      audioEngine.speakQuote('Starte autonomes Coding und Testen mit Gemini 2.5 Pro.');
      audioEngine.playClubKick(140);
      triggerBump();

      if (btnStartAgent) {
        btnStartAgent.setAttribute('disabled', 'true');
        btnStartAgent.classList.add('opacity-50');
      }

      if (agentTerminal) agentTerminal.innerHTML = '';
      appendTerminal(`[INIT] Starte Task: "${task}"`, 'text-cyan-300');
      appendLog('AI_AGENT_START', `Starte TDD-Loop: "${task}"`, 'text-cyan-300');

      if (agentStatusPill) {
        agentStatusPill.textContent = 'AGENT LÄUFT...';
        agentStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse';
      }

      const model = modelSelect?.value || 'gemini-2.5-pro';
      const maxIterations = parseInt(maxIterSelect?.value || '3', 10);

      try {
        const runRes = await fetch(`${BACKEND_URL}/api/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, model, max_iterations: maxIterations })
        });

        if (!runRes.ok) {
          throw new Error('Backend antwortete mit Fehler.');
        }

        const { run_id } = await runRes.json();
        appendTerminal(`[RUN_ID] ${run_id} registriert. Verbinde SSE Live-Stream...`, 'text-slate-500');

        // Connect to SSE Stream
        if (currentEventSource) currentEventSource.close();
        currentEventSource = new EventSource(`${BACKEND_URL}/api/agent/stream/${run_id}`);

        currentEventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const state = payload.state || {};

            if (state.iterations && agentIterDisplay) {
              agentIterDisplay.textContent = `Iteration ${state.iterations} / ${state.max_iterations || maxIterations}`;
            }

            if (state.code) {
              activeSolutionCode = state.code;
              activeTestCode = state.test_code;
              updateCodeView();
            }

            if (payload.event === 'update') {
              if (payload.node === 'coder') {
                appendTerminal(`[CODER] Code & Tests generiert für Runde ${state.iterations}.`, 'text-violet-300');
                appendLog('AI_CODER', `Gemini Code bereit (Iteration ${state.iterations})`, 'text-violet-300');
              } else if (payload.node === 'tester') {
                if (state.success) {
                  appendTerminal(`[PYTEST] ✅ ALLE TESTS BESTANDEN!\n${state.test_output}`, 'text-emerald-400');
                  appendLog('AI_PYTEST', `✅ Tests bestanden nach ${state.iterations} Iteration(en)!`, 'text-emerald-400');
                  audioEngine.playClubKick(180);
                  audioEngine.playRaveStab(260);
                  audioEngine.speakQuote('Erfolg! Alle Tests fehlerfrei bestanden.');
                  showToast('AGENT ERFOLGREICH', `Code erfolgreich nach ${state.iterations} Runden verifiziert!`);
                } else {
                  appendTerminal(`[PYTEST] ❌ Test fehlgeschlagen:\n${state.test_output}`, 'text-rose-400');
                  appendLog('AI_PYTEST_FAIL', `Runde ${state.iterations} fehlgeschlagen. Starte Nachbesserung...`, 'text-rose-400');
                  audioEngine.playRaveStab(130);
                  triggerBump();
                }
              }
            } else if (payload.event === 'complete') {
              if (state.success) {
                if (agentStatusPill) {
                  agentStatusPill.textContent = 'ERFOLG: TESTS BESTANDEN';
                  agentStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                }
              } else {
                if (agentStatusPill) {
                  agentStatusPill.textContent = `BEENDET (MAX. RUNDEN ERREICHT)`;
                  agentStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
                }
                appendTerminal(`[FERTIG] Maximale Iterationen erreicht oder ungelöst.`, 'text-amber-400');
              }
              if (currentEventSource) currentEventSource.close();
              if (btnStartAgent) {
                btnStartAgent.removeAttribute('disabled');
                btnStartAgent.classList.remove('opacity-50');
              }
            } else if (payload.event === 'error') {
              appendTerminal(`[ERROR] ${state.test_output}`, 'text-rose-500');
              appendLog('AI_AGENT_ERROR', state.test_output, 'text-rose-500');
              if (agentStatusPill) {
                agentStatusPill.textContent = 'FEHLER';
                agentStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
              }
              if (currentEventSource) currentEventSource.close();
              if (btnStartAgent) {
                btnStartAgent.removeAttribute('disabled');
                btnStartAgent.classList.remove('opacity-50');
              }
            }
          } catch (err) {
            console.error('Fehler beim Parsen der SSE-Daten:', err);
          }
        };

        currentEventSource.onerror = () => {
          if (currentEventSource) currentEventSource.close();
          if (btnStartAgent) {
            btnStartAgent.removeAttribute('disabled');
            btnStartAgent.classList.remove('opacity-50');
          }
        };

      } catch (err: any) {
        appendTerminal(`[VERBINDUNGSFEHLER] Konnte nicht zum Backend (Port 8000) verbinden: ${err.message}`, 'text-rose-400');
        showToast('BACKEND FEHLER', 'Läuft das FastAPI-Backend auf Port 8000?');
        if (btnStartAgent) {
          btnStartAgent.removeAttribute('disabled');
          btnStartAgent.classList.remove('opacity-50');
        }
      }
    });
  }

  // Initial health check on page load
  checkHealth();
}
