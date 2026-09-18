import './styles/silk-aurora.css';
import { audioEngine } from './audio/audioEngine.ts';
import { AutoDJ } from './components/autoDj.ts';
import { Soundboard } from './components/soundboard.ts';
import { FaxxenSystem } from './components/faxxen.ts';
import { initModals } from './components/modals.ts';
import { initVisualizers } from './components/visualizers.ts';
import { initAiAgent } from './components/aiAgent.ts';
import { SOUND_CATALOG } from './data/soundCatalog.ts';

// 1. Live Nano-Clock Display (Berlin UTC)
const clockEl = document.getElementById('clock-display');
function updateClock() {
  const now = new Date();
  const hrs = String(now.getUTCHours()).padStart(2, '0');
  const mins = String(now.getUTCMinutes()).padStart(2, '0');
  const secs = String(now.getUTCSeconds()).padStart(2, '0');
  const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
  if (clockEl) clockEl.textContent = `${hrs}:${mins}:${secs}.${ms}`;
}
setInterval(updateClock, 40);
updateClock();

// 2. Realtime Log Feed & Toasts
const logFeed = document.getElementById('realtime-log-feed');
const toastEl = document.getElementById('auto-drop-toast');
const toastTag = document.getElementById('toast-tag');
const toastMsg = document.getElementById('toast-msg');
let toastTimeout: any = null;

export function appendLog(prefix: string, text: string, highlightClass = 'text-cyan-300') {
  if (!logFeed) return;
  const div = document.createElement('div');
  div.className = 'flex items-baseline gap-2 text-slate-400';
  const time = new Date().toLocaleTimeString('de-DE');
  div.innerHTML = `<span class="text-slate-600 shrink-0">[${time}]</span> <span class="${highlightClass} font-bold shrink-0">${prefix}:</span> <span class="text-slate-200">${text}</span>`;
  logFeed.appendChild(div);
  logFeed.scrollTop = logFeed.scrollHeight;
}

export function showToast(tag: string, msg: string) {
  if (!toastEl || !toastTag || !toastMsg) return;
  toastTag.textContent = tag;
  toastMsg.textContent = msg;
  toastEl.classList.remove('opacity-0', 'translate-y-[-20px]');
  toastEl.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('opacity-100', 'translate-y-0');
    toastEl.classList.add('opacity-0', 'translate-y-[-20px]');
  }, 3500);
}

// 3. Initialize Faxxen, Modals & AI Agent
const faxxen = new FaxxenSystem(appendLog);
initModals(appendLog, showToast);
initAiAgent(appendLog, showToast, () => faxxen.triggerBump());

// 4. Initialize Auto-DJ & Soundboard
let soundboard: Soundboard;

const autoDj = new AutoDJ(
  appendLog,
  showToast,
  (files) => {
    if (soundboard) soundboard.updateLocalFiles(files);
  }
);

soundboard = new Soundboard(
  appendLog,
  showToast,
  () => faxxen.triggerBump(),
  () => autoDj.isRunning || autoDj.isSynthRunning || !audioEngine.mainAudio.paused
);

// Expose global key trigger for 3x3 drumpad
(window as any).gandalfTriggerKey = (key: string) => {
  const item = SOUND_CATALOG.find(s => s.key === key);
  if (item) {
    soundboard.triggerSound(item);
  }
};

// 5. Initialize Visualizers (3D Hologram, Oscilloscope, Waveform & Spectrum)
initVisualizers(() => autoDj.isRunning || autoDj.isSynthRunning);

// 6. View Switcher System (Master Deck, 3D Spatial Radar, 49-Pad MPC, AI Agent)
type ViewKey = 'master' | 'hologram' | 'mpc' | 'agent';

function switchView(viewKey: ViewKey) {
  const views: Record<ViewKey, HTMLElement | null> = {
    master: document.getElementById('view-master'),
    hologram: document.getElementById('view-hologram'),
    mpc: document.getElementById('view-mpc'),
    agent: document.getElementById('view-agent')
  };

  const tabs: Record<ViewKey, HTMLElement | null> = {
    master: document.getElementById('tab-btn-master'),
    hologram: document.getElementById('tab-btn-hologram'),
    mpc: document.getElementById('tab-btn-mpc'),
    agent: document.getElementById('tab-btn-agent')
  };

  Object.entries(views).forEach(([key, el]) => {
    if (!el) return;
    if (key === viewKey) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  Object.entries(tabs).forEach(([key, btn]) => {
    if (!btn) return;
    if (key === viewKey) {
      btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400/60', 'shadow-[0_0_15px_rgba(0,240,255,0.3)]');
      btn.classList.remove('hud-glass', 'text-slate-300', 'border-white/10');
    } else {
      btn.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400/60', 'shadow-[0_0_15px_rgba(0,240,255,0.3)]');
      btn.classList.add('hud-glass', 'text-slate-300', 'border-white/10');
    }
  });

  appendLog('VIEW_SWITCH', `Bildschirm gewechselt zu: [${viewKey.toUpperCase()}]`, 'text-cyan-400');
}

// Bind tabs
const tabMaster = document.getElementById('tab-btn-master');
const tabHolo = document.getElementById('tab-btn-hologram');
const tabMpc = document.getElementById('tab-btn-mpc');
const tabAgent = document.getElementById('tab-btn-agent');

if (tabMaster) tabMaster.addEventListener('click', () => switchView('master'));
if (tabHolo) tabHolo.addEventListener('click', () => switchView('hologram'));
if (tabMpc) tabMpc.addEventListener('click', () => switchView('mpc'));
if (tabAgent) tabAgent.addEventListener('click', () => switchView('agent'));

// Keyboard navigation for view switching (F1-F4)
window.addEventListener('keydown', (e) => {
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    return;
  }
  if (e.key === 'F1' || (e.altKey && e.key === '1')) {
    e.preventDefault();
    switchView('master');
  } else if (e.key === 'F2' || (e.altKey && e.key === '2')) {
    e.preventDefault();
    switchView('hologram');
  } else if (e.key === 'F3' || (e.altKey && e.key === '3')) {
    e.preventDefault();
    switchView('mpc');
  } else if (e.key === 'F4' || (e.altKey && e.key === '4')) {
    e.preventDefault();
    switchView('agent');
  }
});

// 7. Peak-Time Drop / Bassboost Button
const btnComboDrop = document.getElementById('btn-rave-combo-drop');
if (btnComboDrop) {
  btnComboDrop.addEventListener('click', () => {
    audioEngine.playPsytranceDrop();
    document.body.classList.add('overcharge-flash');
    setTimeout(() => document.body.classList.remove('overcharge-flash'), 650);

    // Shockwave ripple
    const reactorCore = document.querySelector('.arc-reactor-core');
    if (reactorCore) {
      const shockLayer = reactorCore.querySelector('.shockwave-layer');
      if (shockLayer) {
        const wave = document.createElement('div');
        wave.className = 'absolute inset-0 rounded-full border-4 border-cyan-400 pointer-events-none';
        wave.style.animation = 'shockwave 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
        shockLayer.appendChild(wave);
        setTimeout(() => wave.remove(), 1250);
      }
    }

    showToast('PEAK-TIME DROP', '150 BPM Psytrance Drop rollt über den Floor!');
    appendLog('PEAK_DROP', 'Fetter Club-Drop & Bassboost abgefeuert!', 'text-amber-300');
  });
}

// 8. Strobe Trigger
const btnStrobe = document.getElementById('btn-rave-strobe');
if (btnStrobe) {
  btnStrobe.addEventListener('click', () => {
    faxxen.triggerStrobeBurst(1400);
    appendLog('STROBE', 'Psychedelic Strobe-Flash gezündet!', 'text-pink-400');
  });
}

// 9. Hologram Synthesis CMD Dispatcher
const holoCmdInput = document.getElementById('holo-cmd-input') as HTMLInputElement;
const holoSendBtn = document.getElementById('holo-send-btn');
function execHoloCmd() {
  if (!holoCmdInput || !holoCmdInput.value.trim()) return;
  const cmd = holoCmdInput.value.trim().toLowerCase();
  holoCmdInput.value = '';

  if (cmd.includes('späti') || cmd.includes('bier')) {
    audioEngine.playSoundFile('auf-alkohol.mp3');
    showToast('SPÄTI-RADAR', 'Noch 42m zum nächsten Wegbier!');
    appendLog('VOX_CMD', 'Späti-Radar zentriert: 42m Nord-Ost.', 'text-cyan-300');
  } else if (cmd.includes('pfeffi') || cmd.includes('shot')) {
    audioEngine.playSoundFile('jagermeister-schrei.mp3');
    showToast('PFEFFI-INJEKTOR', '100% Pfefferminz-Kick verteilt!');
    appendLog('VOX_CMD', 'Pfeffi-Injektor abgefeuert.', 'text-pink-400');
  } else if (cmd.includes('abfahrt') || cmd.includes('drop') || cmd.includes('bass')) {
    audioEngine.playSoundFile('abfahrt.mp3');
    audioEngine.playPsytranceDrop();
    showToast('ABFAHRT', 'Jetzt wird komplett abgerissen!');
    appendLog('VOX_CMD', 'Abfahrt eingeleitet!', 'text-emerald-400');
  } else if (cmd.includes('hack')) {
    audioEngine.playSoundFile('alles-wird-aus-hack-gemacht-mastered-version-mp3cut.mp3');
    showToast('HACK', 'Alles wird aus Hack gemacht!');
  } else {
    audioEngine.playSoundFile('boar-alta-geil-ey-unnormal-ey-mp3cut.mp3');
    showToast('GANDALF', `Befehl verarbeitet: "${cmd}"`);
  }
}
if (holoSendBtn) holoSendBtn.addEventListener('click', execHoloCmd);
if (holoCmdInput) holoCmdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') execHoloCmd(); });

// 10. DSP Master Sliders
const volSlider = document.getElementById('slider-vol') as HTMLInputElement;
const volText = document.getElementById('vol-text');
if (volSlider && volText) {
  volSlider.addEventListener('input', (e: any) => {
    const val = parseInt(e.target.value, 10);
    audioEngine.setMasterVolume(val);
    volText.textContent = `${val}%`;
  });
}

const pitchSlider = document.getElementById('slider-pitch-ctl') as HTMLInputElement;
const pitchText = document.getElementById('pitch-text');
const bpmHeader = document.getElementById('header-bpm-indicator');
const rackBpm = document.getElementById('rack-bpm-display');
if (pitchSlider && pitchText) {
  pitchSlider.addEventListener('input', (e: any) => {
    const bpm = parseInt(e.target.value, 10);
    const rate = bpm / 148;
    pitchText.textContent = `${bpm} BPM (${rate.toFixed(2)}x)`;
    if (bpmHeader) bpmHeader.textContent = `${bpm} BPM SYNC`;
    if (rackBpm) rackBpm.textContent = `${bpm} BPM`;
    audioEngine.setPlaybackRate(rate);
  });
}

// 11. Panic Mute & Clear Feed
const btnClearFeed = document.getElementById('btn-clear-feed');
if (btnClearFeed && logFeed) {
  btnClearFeed.addEventListener('click', () => {
    logFeed.innerHTML = '';
  });
}

const btnPanic = document.getElementById('btn-panic-mute');
if (btnPanic) {
  btnPanic.addEventListener('click', () => {
    audioEngine.panicMute();
    if (autoDj.isRunning) autoDj.setPlayState(false);
    autoDj.stopDemoSynthLoop();
    faxxen.stopStrobe();
    if (volSlider && volText) {
      volSlider.value = '0';
      volText.textContent = '0%';
    }
    appendLog('PANIC_MUTE', 'ALLE AUDIOQUELLEN NOTFALL-GESTUMMT!', 'text-rose-400');
    showToast('PANIC MUTE', 'Stille im Deck aktiviert');
  });
}

// 12. Audio Unlock Banner
const unlockBtn = document.getElementById('btn-unlock-audio');
if (unlockBtn) {
  unlockBtn.addEventListener('click', () => {
    audioEngine.ensureContext();
    appendLog('AUDIO_UNLOCK', 'Audio-Engine durch Benutzeraktion entsperrt!', 'text-emerald-400');
  });
}

// 13. Zen Patron & Header Avatar
const zenLotusCore = document.getElementById('zen-lotus-core');
const headerAvatar = document.getElementById('header-avatar-btn');
[zenLotusCore, headerAvatar].forEach(el => {
  if (el) {
    el.addEventListener('click', () => {
      audioEngine.playClubKick(140);
      audioEngine.playRaveStab(170);
      const abfahrt = SOUND_CATALOG.find(s => s.id === 'abfahrt');
      if (abfahrt) soundboard.triggerSound(abfahrt);
      showToast('ZEN-SEGNUNG', 'Patron Buddha segnet das Partydeck!');
    });
  }
});

appendLog('SYSTEM_READY', 'G.A.N.D.A.L.F. Cyber-Deck v6.0 initialisiert! 49 Soundfiles direct geladen.', 'text-emerald-400');
