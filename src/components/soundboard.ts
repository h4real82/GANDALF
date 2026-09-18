import { audioEngine } from '../audio/audioEngine.ts';
import { SOUND_CATALOG, SoundItem } from '../data/soundCatalog.ts';

export class Soundboard {
  private tilesContainer = document.getElementById('soundboard-tiles-container');
  private mpcGridContainer = document.getElementById('mpc-matrix-grid');
  private hotkeysRibbon = document.getElementById('hotkeys-ribbon');
  private mpcHotkeysRibbon = document.getElementById('mpc-hotkeys-ribbon');
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

    // Category pills click handler
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

    // Auto-Drops timer counter
    setInterval(() => {
      this.lastDropSecCount++;
      if (this.lastDropTime) this.lastDropTime.textContent = `vor ${this.lastDropSecCount}s`;
    }, 1000);

    if (this.selectDropFreq) {
      this.selectDropFreq.addEventListener('change', () => this.setupAutoDropInterval());
      this.setupAutoDropInterval();
    }

    // Global Keydown listener for hotkeys 1-9 & spacebar
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === this.searchInput || (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'))) {
        return;
      }

      // Hotkeys 1-9: Trigger corresponding sound from catalog
      if (e.key >= '1' && e.key <= '9') {
        const matched = SOUND_CATALOG.find(s => s.key === e.key);
        if (matched) {
          e.preventDefault();
          this.triggerSound(matched);
        }
      }

      // Spacebar = Club Bass Kick
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

  // --- TRIGGER SOUND: SPIELT DIREKT DAS ECHTE MP3 AUDIO AB (0% SPRACHSYNTHESE) ---
  public triggerSound(sound: SoundItem, isAuto = false) {
    audioEngine.ensureContext();

    // Check if user has uploaded a custom MP3 matching this sound
    const matchingFile = this.localFiles.find(f => {
      const fn = f.name.toLowerCase();
      return fn.includes(sound.id.toLowerCase()) || 
             fn.includes(sound.title.toLowerCase()) ||
             sound.tags.some(t => fn.includes(t));
    });

    if (matchingFile) {
      const url = URL.createObjectURL(matchingFile);
      audioEngine.playSoundFile(url);
      this.appendLog('PLAY_LOCAL_MP3', `Eigene MP3 abgespielt: ${matchingFile.name}`, 'text-emerald-400');
    } else {
      // ECHTES GOOGLE DRIVE MP3 DIREKT ABSPIELEN!
      audioEngine.playSoundFile(sound.filename);
      // Punchy sub-bass accentuation
      audioEngine.playClubKick(sound.freq || 110);
    }

    this.onTriggerBump();

    // Update HUD Now Playing
    if (this.nowPlayingLabel) {
      this.nowPlayingLabel.textContent = `${sound.title} — ${sound.quote}`;
      this.nowPlayingLabel.classList.add('text-pink-300');
      setTimeout(() => {
        if (this.nowPlayingLabel) this.nowPlayingLabel.classList.remove('text-pink-300');
      }, 500);
    }

    // Visual Feedback on Pad / Card
    const card = document.getElementById(`sound-card-${sound.id}`);
    const mpcPad = document.getElementById(`mpc-pad-${sound.id}`);
    [card, mpcPad].forEach(el => {
      if (el) {
        el.classList.add('playing-active');
        setTimeout(() => el.classList.remove('playing-active'), 450);
      }
    });

    // Animate Hotkey Badge
    if (sound.key) {
      const badge = document.getElementById(`hk-badge-${sound.key}`);
      const ribbonBadge = document.getElementById(`ribbon-hk-${sound.key}`);
      const mpcBadge = document.getElementById(`mpc-hk-badge-${sound.key}`);
      [badge, ribbonBadge, mpcBadge].forEach(b => {
        if (b) {
          b.classList.add('hotkey-lit');
          setTimeout(() => b.classList.remove('hotkey-lit'), 400);
        }
      });
    }

    if (!isAuto) {
      this.appendLog('SOUND_FIRE', `[${sound.filename}] ${sound.title}`, 'text-pink-400');
    }
  }

  public triggerSmartDrop() {
    const dropsPool = SOUND_CATALOG.filter(s => s.cat === 'drops' || s.cat === 'alkohol' || s.cat === 'memes');
    const randomSound = dropsPool[Math.floor(Math.random() * dropsPool.length)];
    this.triggerSound(randomSound, true);

    this.lastDropSecCount = 0;
    if (this.lastDropText) this.lastDropText.textContent = `${randomSound.title}: ${randomSound.quote}`;
    this.showToast(`AUTO-DROP [${randomSound.cat.toUpperCase()}]`, randomSound.title);
    this.appendLog('AUTO_DROP_FIRED', `Smarte Injektion: [${randomSound.filename}] -> ${randomSound.title}`, 'text-amber-300');
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
    [this.hotkeysRibbon, this.mpcHotkeysRibbon].forEach(ribbon => {
      if (!ribbon) return;
      ribbon.innerHTML = '';
      SOUND_CATALOG.filter(s => s.key).forEach(s => {
        const btn = document.createElement('button');
        btn.id = `ribbon-hk-${s.key}`;
        btn.className = 'hotkey-badge flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-violet-500/40 text-violet-300 hover:text-white hover:border-pink-400 cursor-pointer transition-all active:scale-95';
        btn.innerHTML = `<span class="w-4 h-4 rounded bg-pink-500/30 text-pink-300 font-bold flex items-center justify-center text-[10px] border border-pink-400/40">${s.key}</span> <span class="truncate max-w-[90px] text-xs font-semibold">${s.title}</span>`;
        btn.addEventListener('click', () => this.triggerSound(s));
        ribbon.appendChild(btn);
      });
    });
  }

  public renderCards(filterCat = 'all', filterSearch = '') {
    const searchLower = filterSearch.toLowerCase().trim();

    const filtered = SOUND_CATALOG.filter(sound => {
      const matchCat = filterCat === 'all' || sound.cat === filterCat;
      const matchSearch = !searchLower || 
                          sound.title.toLowerCase().includes(searchLower) || 
                          sound.quote.toLowerCase().includes(searchLower) ||
                          sound.filename.toLowerCase().includes(searchLower) ||
                          sound.tags.some(t => t.includes(searchLower));
      return matchCat && matchSearch;
    });

    // Render to standard tiles container
    if (this.tilesContainer) {
      this.tilesContainer.innerHTML = '';
      filtered.forEach(sound => {
        const card = document.createElement('div');
        card.id = `sound-card-${sound.id}`;
        card.className = 'silk-glass-card rounded-xl p-3 flex flex-col justify-between gap-2.5 cursor-pointer relative group overflow-hidden border border-white/10 hover:border-violet-400/60 transition-all';

        let iconColor = 'text-cyan-300';
        let borderColor = 'border-cyan-500/30';
        if (sound.cat === 'alkohol') { iconColor = 'text-pink-400'; borderColor = 'border-pink-500/30'; }
        else if (sound.cat === 'aggro') { iconColor = 'text-rose-400'; borderColor = 'border-rose-500/30'; }
        else if (sound.cat === 'drops') { iconColor = 'text-indigo-400'; borderColor = 'border-indigo-500/30'; }
        else if (sound.cat === 'kult') { iconColor = 'text-emerald-400'; borderColor = 'border-emerald-500/30'; }
        else if (sound.cat === 'memes') { iconColor = 'text-amber-400'; borderColor = 'border-amber-500/30'; }

        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-white/5 border ${borderColor} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shrink-0">
                <span class="material-symbols-outlined text-[18px]">${sound.icon || 'play_arrow'}</span>
              </div>
              <div class="min-w-0">
                <h3 class="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">${sound.title}</h3>
                <span class="text-[9px] font-mono text-slate-400 truncate block">${sound.filename}</span>
              </div>
            </div>
            ${sound.key ? `
              <div id="hk-badge-${sound.key}" class="hotkey-badge shrink-0 px-2 py-0.5 rounded-md border border-pink-400/40 text-pink-300 font-mono font-bold text-[10px] flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                <span>[${sound.key}]</span>
              </div>
            ` : `
              <span class="text-[9px] font-mono text-slate-500 shrink-0">${sound.duration}</span>
            `}
          </div>
          
          <p class="text-[10px] text-slate-300 line-clamp-2 italic bg-black/25 p-1.5 rounded-lg border border-white/5">${sound.quote}</p>
          
          <div class="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-white/5 text-slate-400">
            <span class="uppercase tracking-wider ${iconColor} font-bold">${sound.cat}</span>
            <span class="flex items-center gap-1 text-emerald-400 group-hover:text-white transition-colors">
              <span>MP3 AUDIO</span>
              <span class="material-symbols-outlined text-[13px]">play_circle</span>
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

    // Render to MPC matrix grid if container exists
    if (this.mpcGridContainer) {
      this.mpcGridContainer.innerHTML = '';
      filtered.forEach(sound => {
        const pad = document.createElement('button');
        pad.id = `mpc-pad-${sound.id}`;
        pad.className = 'mpc-tactile-pad rounded-xl p-3 flex flex-col justify-between text-left transition-all duration-150 cursor-pointer relative overflow-hidden group active:scale-95';

        let catGlow = 'glow-indigo';
        let badgeColor = 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
        if (sound.cat === 'alkohol') { catGlow = 'glow-peach'; badgeColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10'; }
        else if (sound.cat === 'aggro') { catGlow = 'glow-rose'; badgeColor = 'text-rose-400 border-rose-500/40 bg-rose-500/10'; }
        else if (sound.cat === 'kult') { catGlow = 'glow-lime'; badgeColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'; }
        else if (sound.cat === 'memes') { catGlow = 'glow-cyan'; badgeColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'; }

        pad.classList.add(catGlow);

        pad.innerHTML = `
          <div class="flex items-start justify-between gap-1 w-full">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="material-symbols-outlined text-base ${sound.cat === 'alkohol' ? 'text-amber-400' : sound.cat === 'aggro' ? 'text-rose-400' : 'text-cyan-400'}">${sound.icon || 'album'}</span>
              <span class="font-bold text-xs text-white group-hover:text-pink-300 truncate">${sound.title}</span>
            </div>
            ${sound.key ? `
              <span id="mpc-hk-badge-${sound.key}" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-black border border-pink-400/60 bg-pink-500/20 text-pink-300 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.4)]">[${sound.key}]</span>
            ` : `
              <span class="text-[9px] font-mono text-slate-500 shrink-0">${sound.duration}</span>
            `}
          </div>
          <p class="text-[10px] text-slate-300 line-clamp-1 italic my-1 font-mono">${sound.quote}</p>
          <div class="flex items-center justify-between w-full pt-1 border-t border-white/5 font-mono text-[9px]">
            <span class="uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}">${sound.cat}</span>
            <span class="text-emerald-400 flex items-center gap-1 font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              MP3 DIRECT
            </span>
          </div>
        `;

        pad.addEventListener('click', () => this.triggerSound(sound));
        this.mpcGridContainer!.appendChild(pad);
      });
    }
  }
}
