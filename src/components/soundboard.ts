import { audioEngine } from '../audio/audioEngine.ts';
import { SOUND_CATALOG, SoundItem } from '../data/soundCatalog.ts';

export class Soundboard {
  private tilesContainer = document.getElementById('soundboard-tiles-container');
  private hotkeysRibbon = document.getElementById('hotkeys-ribbon');
  private searchInput = document.getElementById('sound-search') as HTMLInputElement;
  private clearSearchBtn = document.getElementById('clear-search-btn');
  private nowPlayingLabel = document.getElementById('now-playing-label');

  private selectDropFreq = document.getElementById('select-drop-freq') as HTMLSelectElement;
  private lastDropTime = document.getElementById('last-drop-time');
  private lastDropText = document.getElementById('last-drop-text');

  private currentCategory: string = 'all';
  private localFiles: File[] = [];
  private autoDropTimer: any = null;
  private lastDropSecCount: number = 0;

  private appendLog: (prefix: string, text: string, cls?: string) => void;
  private showToast: (tag: string, msg: string) => void;
  private onTriggerBump: () => void;
  private getIsActive: () => boolean;

  constructor(
    appendLog: (prefix: string, text: string, cls?: string) => void,
    showToast: (tag: string, msg: string) => void,
    onTriggerBump: () => void,
    getIsActive: () => boolean
  ) {
    this.appendLog = appendLog;
    this.showToast = showToast;
    this.onTriggerBump = onTriggerBump;
    this.getIsActive = getIsActive;
    this.init();
  }

  public updateLocalFiles(files: File[]) {
    this.localFiles = files;
  }

  private init() {
    this.populateHotkeysRibbon();
    this.renderCards('all', '');

    // Category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(p => {
          p.classList.remove('active', 'bg-gradient-to-r', 'from-violet-600', 'to-indigo-600', 'text-white', 'font-bold', 'shadow-[0_0_15px_rgba(124,58,237,0.4)]');
          p.classList.add('silk-glass', 'text-slate-300');
        });
        pill.classList.add('active', 'bg-gradient-to-r', 'from-violet-600', 'to-indigo-600', 'text-white', 'font-bold', 'shadow-[0_0_15px_rgba(124,58,237,0.4)]');
        pill.classList.remove('silk-glass', 'text-slate-300');

        this.currentCategory = pill.getAttribute('data-category') || 'all';
        this.renderCards(this.currentCategory, this.searchInput?.value || '');
      });
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e: any) => {
        const val = e.target.value;
        if (this.clearSearchBtn) this.clearSearchBtn.style.display = val ? 'block' : 'none';
        this.renderCards(this.currentCategory, val);
      });
    }

    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        this.clearSearchBtn!.style.display = 'none';
        this.renderCards(this.currentCategory, '');
      });
    }

    // Auto-Drops timer
    setInterval(() => {
      this.lastDropSecCount++;
      if (this.lastDropTime) this.lastDropTime.textContent = `vor ${this.lastDropSecCount}s`;
    }, 1000);

    if (this.selectDropFreq) {
      this.selectDropFreq.addEventListener('change', () => this.setupAutoDropInterval());
      this.setupAutoDropInterval();
    }

    // Global Keydown listener
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === this.searchInput) return;

      // 1-9 Sounds
      if (e.key >= '1' && e.key <= '9') {
        const matched = SOUND_CATALOG.find(s => s.key === e.key);
        if (matched) {
          e.preventDefault();
          this.triggerSound(matched);
        }
      }

      // Spacebar = Club Kick
      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.playClubKick(180);
        this.onTriggerBump();
        this.appendLog('HOTKEY_SPACE', 'Club Bass-Kick manuell geschlagen!', 'text-emerald-400');
      }

      // 'd' or 'D' = Manual Smart Drop
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.triggerSmartDrop();
      }
    });
  }

  public triggerSound(sound: SoundItem, isAuto = false) {
    audioEngine.ensureContext();

    // Check if user has uploaded an MP3 matching this sound's ID or name
    const matchingFile = this.localFiles.find(f => {
      const fn = f.name.toLowerCase();
      return fn.includes(sound.id.toLowerCase()) || 
             fn.includes(sound.title.toLowerCase()) ||
             sound.tags.some(t => fn.includes(t));
    });

    if (matchingFile) {
      const url = URL.createObjectURL(matchingFile);
      audioEngine.soundboardAudio.src = url;
      audioEngine.soundboardAudio.play().catch(() => {});
      this.appendLog('PLAY_LOCAL_SAMPLE', `Eigene MP3 abgespielt: ${matchingFile.name}`, 'text-emerald-400');
    } else {
      audioEngine.playClubKick(sound.freq || 130);
      audioEngine.playRaveStab(sound.freq ? sound.freq * 2 : 240);
      audioEngine.speakQuote(sound.quote);
    }

    this.onTriggerBump();

    if (this.nowPlayingLabel) {
      this.nowPlayingLabel.textContent = `${sound.id}.mp3 — ${sound.quote}`;
      this.nowPlayingLabel.classList.add('text-pink-300');
      setTimeout(() => {
        if (this.nowPlayingLabel) this.nowPlayingLabel.classList.remove('text-pink-300');
      }, 400);
    }

    const card = document.getElementById(`sound-card-${sound.id}`);
    if (card) {
      card.classList.add('playing-active');
      setTimeout(() => card.classList.remove('playing-active'), 450);
    }

    if (sound.key) {
      const badge = document.getElementById(`hk-badge-${sound.key}`);
      const ribbonBadge = document.getElementById(`ribbon-hk-${sound.key}`);
      [badge, ribbonBadge].forEach(b => {
        if (b) {
          b.classList.add('hotkey-lit');
          setTimeout(() => b.classList.remove('hotkey-lit'), 400);
        }
      });
    }

    if (!isAuto) {
      this.appendLog('SOUND_FIRE', `[${sound.id}.mp3] ${sound.quote}`, 'text-pink-400');
    }
  }

  public triggerSmartDrop() {
    const dropsPool = SOUND_CATALOG.filter(s => s.cat === 'drops' || s.cat === 'alkohol' || s.cat === 'memes');
    const randomSound = dropsPool[Math.floor(Math.random() * dropsPool.length)];
    this.triggerSound(randomSound, true);

    this.lastDropSecCount = 0;
    if (this.lastDropText) this.lastDropText.textContent = randomSound.quote;
    this.showToast(`AUTO-DROP [${randomSound.cat.toUpperCase()}]`, randomSound.quote);
    this.appendLog('AUTO_DROP_FIRED', `Smarte Injektion: [${randomSound.id}.mp3] -> ${randomSound.quote}`, 'text-amber-300');
  }

  private setupAutoDropInterval() {
    clearInterval(this.autoDropTimer);
    if (!this.selectDropFreq) return;
    const val = this.selectDropFreq.value;
    if (val === 'off') return;

    let intervalMs = 30000;
    if (val === '15') intervalMs = 15000;
    else if (val === 'delirium') intervalMs = Math.floor(Math.random() * 18000 + 8000);
    else if (val === 'breakdown') intervalMs = 24000;

    this.autoDropTimer = setInterval(() => {
      if (this.getIsActive()) {
        this.triggerSmartDrop();
      }
    }, intervalMs);
  }

  private populateHotkeysRibbon() {
    if (!this.hotkeysRibbon) return;
    this.hotkeysRibbon.innerHTML = '';
    SOUND_CATALOG.filter(s => s.key).forEach(s => {
      const btn = document.createElement('button');
      btn.id = `ribbon-hk-${s.key}`;
      btn.className = 'hotkey-badge flex items-center gap-1 px-2 py-0.5 rounded-lg border border-violet-500/40 text-violet-300 hover:text-white hover:border-pink-400 cursor-pointer transition-all';
      btn.innerHTML = `<span class="w-4 h-4 rounded bg-pink-500/30 text-pink-300 font-bold flex items-center justify-center text-[9px] border border-pink-400/40">${s.key}</span> <span class="truncate max-w-[80px]">${s.title.split(' ')[0]}</span>`;
      btn.addEventListener('click', () => this.triggerSound(s));
      this.hotkeysRibbon!.appendChild(btn);
    });
  }

  public renderCards(filterCat = 'all', filterSearch = '') {
    if (!this.tilesContainer) return;
    this.tilesContainer.innerHTML = '';
    const searchLower = filterSearch.toLowerCase().trim();

    const filtered = SOUND_CATALOG.filter(sound => {
      const matchCat = filterCat === 'all' || sound.cat === filterCat;
      const matchSearch = !searchLower || 
                          sound.title.toLowerCase().includes(searchLower) || 
                          sound.quote.toLowerCase().includes(searchLower) ||
                          sound.id.toLowerCase().includes(searchLower);
      return matchCat && matchSearch;
    });

    filtered.forEach(sound => {
      const card = document.createElement('div');
      card.id = `sound-card-${sound.id}`;
      card.className = 'silk-glass-card rounded-xl p-3 flex flex-col justify-between gap-2.5 cursor-pointer relative group overflow-hidden';

      let iconColor = 'text-cyan-300';
      if (sound.cat === 'alkohol') iconColor = 'text-pink-400';
      else if (sound.cat === 'aggro') iconColor = 'text-rose-400';
      else if (sound.cat === 'drops') iconColor = 'text-amber-400';
      else if (sound.cat === 'philosophie') iconColor = 'text-emerald-400';

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-[18px]">${sound.icon || 'play_arrow'}</span>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">${sound.title}</h3>
              <span class="text-[9px] font-mono text-slate-400">${sound.id}.mp3</span>
            </div>
          </div>
          ${sound.key ? `
            <div id="hk-badge-${sound.key}" class="hotkey-badge shrink-0 px-1.5 py-0.5 rounded-md border border-pink-400/40 text-pink-300 font-mono font-bold text-[10px] flex items-center gap-0.5 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
              <span>KEY</span>
              <span class="text-white font-extrabold text-[11px]">${sound.key}</span>
            </div>
          ` : `
            <span class="text-[9px] font-mono text-slate-500">${sound.duration}</span>
          `}
        </div>
        
        <p class="text-[10px] text-slate-300 line-clamp-2 italic bg-black/20 p-1.5 rounded-lg border border-white/5">${sound.quote}</p>
        
        <div class="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/5 text-slate-400">
          <span class="uppercase tracking-wider ${iconColor}">${sound.cat}</span>
          <span class="flex items-center gap-1 group-hover:text-white transition-colors">
            <span>PLAY SOUND</span>
            <span class="material-symbols-outlined text-[13px]">volume_up</span>
          </span>
        </div>
      `;

      card.addEventListener('click', () => this.triggerSound(sound));
      this.tilesContainer!.appendChild(card);
    });

    if (filtered.length === 0) {
      this.tilesContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 font-mono text-xs">
          <span class="material-symbols-outlined text-4xl text-slate-600 block mb-2">search_off</span>
          Keine Sounds für "${filterSearch}" gefunden.
        </div>
      `;
    }
  }
}
