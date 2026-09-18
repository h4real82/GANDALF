import './styles/silk-aurora.css';
import { audioEngine } from './audio/audioEngine.ts';
import { AutoDJ } from './components/autoDj.ts';
import { Soundboard } from './components/soundboard.ts';
import { FaxxenSystem } from './components/faxxen.ts';
import { initModals } from './components/modals.ts';
import { initVisualizers } from './components/visualizers.ts';
import { initAiAgent } from './components/aiAgent.ts';
import { SOUND_CATALOG } from './data/soundCatalog.ts';

// 1. Clock Display
const clockEl = document.getElementById('clock-display');
function updateClock() {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const ms = String(Math.floor(now.getMilliseconds())).padStart(3, '0');
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

// 5. Initialize Visualizers
initVisualizers(() => autoDj.isRunning || autoDj.isSynthRunning);

// 6. Audio Unlock Banner
const unlockBtn = document.getElementById('btn-unlock-audio');
if (unlockBtn) {
  unlockBtn.addEventListener('click', () => {
    audioEngine.ensureContext();
    appendLog('AUDIO_UNLOCK', 'Audio-Engine durch Benutzeraktion entsperrt!', 'text-emerald-400');
  });
}

// 7. DSP Master Sliders
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

// 8. Panic Mute & Clear Feed
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

// 9. Zen Patron & Notfall-Pfeffi
const zenLotusCore = document.getElementById('zen-lotus-core');
const headerAvatar = document.getElementById('header-avatar-btn');
[zenLotusCore, headerAvatar].forEach(el => {
  if (el) {
    el.addEventListener('click', () => {
      audioEngine.playClubKick(140);
      audioEngine.playRaveStab(170);
      const nirvana = SOUND_CATALOG.find(s => s.id === 'buddha-giggle');
      if (nirvana) soundboard.triggerSound(nirvana);
      showToast('ZEN-SEGNUNG', 'Patron Buddha segnet das Partydeck!');
    });
  }
});

const btnPfeffi = document.getElementById('btn-emergency-pfeffi');
if (btnPfeffi) {
  btnPfeffi.addEventListener('click', () => {
    const pfeffiSound = SOUND_CATALOG.find(s => s.id === 'pfeffi-notstand');
    if (pfeffiSound) soundboard.triggerSound(pfeffiSound);
    showToast('NOTFALL-PFEFFI', 'Pfeffi-Sirene heult durch ganz Berlin!');
  });
}

appendLog('SYSTEM_READY', 'G.A.N.D.A.L.F. Silk Auto-DJ & Real MP3 Sound-Deck v5.5 initialisiert!', 'text-emerald-400');
