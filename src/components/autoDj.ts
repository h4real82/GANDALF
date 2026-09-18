import { audioEngine } from '../audio/audioEngine.ts';

export interface DemoTrack {
  name: string;
  bpm: number;
  approxSec: number;
}

export class AutoDJ {
  public isRunning: boolean = false;
  public localFiles: File[] = [];
  public currentTrackIndex: number = 0;
  private currentObjectUrl: string | null = null;

  // Demo fallback
  public isSynthRunning: boolean = false;
  private synthTimer: any = null;
  private synthStep: number = 0;
  private demoTimer: any = null;
  private demoSeconds: number = 0;

  private demoPlaylist: DemoTrack[] = [
    { name: 'mix.mp3', bpm: 148, approxSec: 270 },
    { name: 'annuschka.mp3', bpm: 130, approxSec: 180 },
    { name: 'musica_1.mp3', bpm: 140, approxSec: 210 },
    { name: 'alles-wird-aus-hack-gemacht-mastered-version-mp3cut.mp3', bpm: 144, approxSec: 15 },
    { name: 'rick-astley-never-gonna-give-you-up-youtube-00_00_00-00_00_17.mp3', bpm: 128, approxSec: 18 }
  ];

  // DOM Elements
  private folderInput = document.getElementById('folder-input-picker') as HTMLInputElement;
  private filesDirectInput = document.getElementById('files-direct-picker') as HTMLInputElement;
  private folderStatusText = document.getElementById('folder-status-text');
  private activeFileSizeInfo = document.getElementById('active-file-size-info');
  private poolCountLabel = document.getElementById('pool-count-label');
  private headerPoolCount = document.getElementById('header-pool-count');
  private btnToggleAutoDj = document.getElementById('btn-toggle-autodj');
  private autodjBtnIcon = document.getElementById('autodj-btn-icon');
  private autodjBtnLabel = document.getElementById('autodj-btn-label');
  private autodjStatusPill = document.getElementById('autodj-status-pill');
  private headerAutoDjInd = document.getElementById('header-autodj-indicator');
  private djTrackTitle = document.getElementById('dj-track-title');
  private djTrackBpm = document.getElementById('dj-track-bpm');
  private djTrackTime = document.getElementById('dj-track-time');
  private djProgressBar = document.getElementById('dj-progress-bar');
  private djTimeline = document.getElementById('dj-timeline-container');
  private btnNextTrack = document.getElementById('btn-next-track');
  private btnPrevTrack = document.getElementById('btn-prev-track');
  private tracklistPillsRow = document.getElementById('tracklist-pills-row');
  private dropTargetBox = document.getElementById('drop-target-box');
  private albumSpinIcon = document.getElementById('album-spin-icon');
  private soundboardModeStatus = document.getElementById('soundboard-mode-status');
  private unlockBanner = document.getElementById('audio-unlock-banner');
  private btnMasterLoop = document.getElementById('btn-master-loop');
  private loopIcon = document.getElementById('loop-icon-symbol');
  private loopLabel = document.getElementById('loop-btn-label');

  private appendLog: (prefix: string, text: string, cls?: string) => void;
  private showToast: (tag: string, msg: string) => void;
  private onFilesChanged?: (files: File[]) => void;

  constructor(
    appendLog: (prefix: string, text: string, cls?: string) => void,
    showToast: (tag: string, msg: string) => void,
    onFilesChanged?: (files: File[]) => void
  ) {
    this.appendLog = appendLog;
    this.showToast = showToast;
    this.onFilesChanged = onFilesChanged;
    this.init();
  }

  private init() {
    this.renderTracklistPills();

    // Time update on audio player
    audioEngine.mainAudio.addEventListener('timeupdate', () => {
      if (audioEngine.mainAudio.duration) {
        const cur = audioEngine.mainAudio.currentTime;
        const dur = audioEngine.mainAudio.duration;
        if (this.djTrackTime) this.djTrackTime.textContent = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;
        if (this.djProgressBar) this.djProgressBar.style.width = `${(cur / dur) * 100}%`;
      }
    });

    audioEngine.mainAudio.addEventListener('ended', () => {
      this.appendLog('TRACK_ENDED', 'Track beendet. Auto-DJ wählt nächsten Track.', 'text-slate-400');
      this.playRealTrack(this.currentTrackIndex + 1, true);
    });

    // Timeline Scrubbing
    if (this.djTimeline) {
      this.djTimeline.addEventListener('click', (e) => {
        const rect = this.djTimeline!.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (audioEngine.mainAudio.duration) {
          audioEngine.mainAudio.currentTime = pos * audioEngine.mainAudio.duration;
        } else {
          this.demoSeconds = Math.floor(pos * (this.demoPlaylist[this.currentTrackIndex]?.approxSec || 300));
        }
        if (this.djProgressBar) this.djProgressBar.style.width = `${pos * 100}%`;
        this.appendLog('SEEK', `Position gespult auf ${Math.round(pos * 100)}%`, 'text-cyan-300');
      });
    }

    // Toggle Play/Pause
    if (this.btnToggleAutoDj) {
      this.btnToggleAutoDj.addEventListener('click', () => {
        audioEngine.ensureContext();
        if (this.localFiles.length > 0) {
          if (audioEngine.mainAudio.paused) {
            audioEngine.mainAudio.play().then(() => this.setPlayState(true)).catch(() => {});
          } else {
            audioEngine.mainAudio.pause();
            this.setPlayState(false);
          }
        } else {
          // Toggle Demo State
          if (!this.isRunning) {
            this.setPlayState(true);
            this.playDemoTrack(this.currentTrackIndex);
            this.startDemoSynthLoop();
          } else {
            this.setPlayState(false);
            this.stopDemoSynthLoop();
          }
        }
      });
    }

    if (this.btnNextTrack) {
      this.btnNextTrack.addEventListener('click', () => {
        this.playRealTrack(this.currentTrackIndex + 1, true);
      });
    }

    if (this.btnPrevTrack) {
      this.btnPrevTrack.addEventListener('click', () => {
        this.playRealTrack(this.currentTrackIndex - 1, true);
      });
    }

    if (this.folderInput) {
      this.folderInput.addEventListener('change', (e: any) => {
        if (e.target.files && e.target.files.length) {
          this.ingestAudioFiles(e.target.files);
        }
      });
    }

    if (this.filesDirectInput) {
      this.filesDirectInput.addEventListener('change', (e: any) => {
        if (e.target.files && e.target.files.length) {
          this.ingestAudioFiles(e.target.files);
        }
      });
    }

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.dropTargetBox) this.dropTargetBox.classList.add('dragover-zone');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      window.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.dropTargetBox) this.dropTargetBox.classList.remove('dragover-zone');
      }, false);
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        this.ingestAudioFiles(e.dataTransfer.files);
      }
    });

    if (this.btnMasterLoop) {
      this.btnMasterLoop.addEventListener('click', () => {
        audioEngine.ensureContext();
        if (!this.isSynthRunning) this.startDemoSynthLoop();
        else this.stopDemoSynthLoop();
      });
    }
  }

  public ingestAudioFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(f => {
      const isAudioType = f.type && f.type.startsWith('audio');
      const hasAudioExt = f.name.match(/\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i);
      return isAudioType || hasAudioExt;
    });

    if (incoming.length === 0) {
      this.showToast('KEINE AUDIO-DATEIEN', 'Bitte MP3-, WAV- oder OGG-Dateien auswählen.');
      return;
    }

    const existingNames = new Set(this.localFiles.map(f => f.name));
    const newlyAdded = incoming.filter(f => !existingNames.has(f.name));

    this.localFiles = [...this.localFiles, ...newlyAdded];

    const totalBytes = this.localFiles.reduce((acc, f) => acc + f.size, 0);
    if (this.activeFileSizeInfo) this.activeFileSizeInfo.textContent = `${this.formatBytes(totalBytes)} geladen`;
    if (this.folderStatusText) this.folderStatusText.textContent = `✓ ${this.localFiles.length} echte Audio-Dateien im Party-Pool bereit!`;
    if (this.poolCountLabel) this.poolCountLabel.textContent = `${this.localFiles.length} MP3-DATEIEN`;
    if (this.headerPoolCount) this.headerPoolCount.textContent = `${this.localFiles.length} MP3s GELADEN`;
    if (this.soundboardModeStatus) {
      this.soundboardModeStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span> ${this.localFiles.length} LOKALE MP3s VERKNÜPFT`;
    }

    this.renderTracklistPills();
    this.appendLog('MP3_IMPORTED', `${newlyAdded.length} neue Tracks eingelesen. Total: ${this.localFiles.length} Dateien.`, 'text-emerald-400');
    this.showToast('MP3s BEREIT', `${this.localFiles.length} Tracks im Player-Pool`);

    if (this.onFilesChanged) {
      this.onFilesChanged(this.localFiles);
    }

    if (!this.isRunning && this.localFiles.length > 0) {
      this.playRealTrack(0, true);
    }
  }

  public renderTracklistPills() {
    if (!this.tracklistPillsRow) return;
    this.tracklistPillsRow.innerHTML = '';

    if (this.localFiles.length === 0) {
      this.demoPlaylist.forEach((item, idx) => {
        const pill = document.createElement('button');
        pill.className = `px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
          idx === this.currentTrackIndex ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'silk-glass text-slate-400 border-white/10 hover:text-white'
        }`;
        pill.innerHTML = `<span class="material-symbols-outlined text-xs">music_note</span> <span class="truncate max-w-[160px]">${item.name}</span>`;
        pill.addEventListener('click', () => {
          this.currentTrackIndex = idx;
          this.playDemoTrack(idx);
        });
        this.tracklistPillsRow!.appendChild(pill);
      });
      return;
    }

    this.localFiles.forEach((file, idx) => {
      const isCurrent = idx === this.currentTrackIndex;
      const pill = document.createElement('button');
      pill.className = `px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
        isCurrent ? 'bg-pink-500/30 text-pink-300 border-pink-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'silk-glass text-slate-300 border-white/10 hover:border-violet-400 hover:text-white'
      }`;
      pill.innerHTML = `
        <span class="material-symbols-outlined text-xs ${isCurrent ? 'text-pink-400' : 'text-slate-400'}">${isCurrent && !audioEngine.mainAudio.paused ? 'equalizer' : 'play_circle'}</span>
        <span class="truncate max-w-[160px] font-medium">${file.name}</span>
        <span class="text-[9px] text-slate-500">${this.formatBytes(file.size)}</span>
      `;
      pill.addEventListener('click', () => {
        this.playRealTrack(idx, true);
      });
      this.tracklistPillsRow!.appendChild(pill);
    });
  }

  public playRealTrack(index: number, autoPlay = true) {
    if (this.localFiles.length === 0) {
      this.playDemoTrack(index);
      return;
    }

    this.currentTrackIndex = (index + this.localFiles.length) % this.localFiles.length;
    const file = this.localFiles[this.currentTrackIndex];

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }
    this.currentObjectUrl = URL.createObjectURL(file);
    audioEngine.mainAudio.src = this.currentObjectUrl;

    const pitchCtl = document.getElementById('slider-pitch-ctl') as HTMLInputElement;
    if (pitchCtl) {
      audioEngine.setPlaybackRate(parseFloat(pitchCtl.value) / 148);
    }

    if (this.djTrackTitle) this.djTrackTitle.textContent = file.name;
    const fakeBpm = 135 + (file.name.length % 25);
    if (this.djTrackBpm) this.djTrackBpm.textContent = `${fakeBpm} BPM`;

    if (autoPlay) {
      audioEngine.mainAudio.play().then(() => {
        this.setPlayState(true);
        this.appendLog('MP3_PLAYING', `Echte MP3 gestartet: "${file.name}"`, 'text-emerald-400');
        this.showToast('PLAY MP3', file.name);
      }).catch(err => {
        this.appendLog('AUDIO_WAIT', 'Klicke auf den Player, um Browser-Wiedergabe zu gestatten.', 'text-amber-300');
        if (this.unlockBanner) this.unlockBanner.classList.remove('hidden');
      });
    }

    this.renderTracklistPills();
  }

  public playDemoTrack(index: number) {
    this.currentTrackIndex = (index + this.demoPlaylist.length) % this.demoPlaylist.length;
    const item = this.demoPlaylist[this.currentTrackIndex];
    if (this.djTrackTitle) this.djTrackTitle.textContent = item.name;
    if (this.djTrackBpm) this.djTrackBpm.textContent = `${item.bpm} BPM`;
    this.demoSeconds = 0;

    audioEngine.mainAudio.src = `/sounds/${item.name}`;
    audioEngine.mainAudio.play().then(() => {
      this.setPlayState(true);
      this.appendLog('TRACK_PLAYING', `Original Google Drive Track: "${item.name}"`, 'text-emerald-400');
    }).catch(() => {
      this.startDemoSynthLoop();
    });

    clearInterval(this.demoTimer);
    this.demoTimer = setInterval(() => {
      if (!this.isRunning && !this.isSynthRunning) return;
      this.demoSeconds++;
      if (this.demoSeconds >= item.approxSec) {
        this.playRealTrack(this.currentTrackIndex + 1, true);
      }
      if (this.djTrackTime) this.djTrackTime.textContent = `${this.formatTime(this.demoSeconds)} / ${this.formatTime(item.approxSec)}`;
      if (this.djProgressBar) this.djProgressBar.style.width = `${(this.demoSeconds / item.approxSec) * 100}%`;
    }, 1000);

    this.appendLog('DEMO_TRACK', `Demo Playlist Track geladen: ${item.name}`, 'text-cyan-300');
  }

  public setPlayState(playing: boolean) {
    this.isRunning = playing;
    if (playing) {
      if (this.btnToggleAutoDj) {
        this.btnToggleAutoDj.classList.remove('from-emerald-600', 'to-cyan-600');
        this.btnToggleAutoDj.classList.add('from-rose-600', 'to-pink-600', 'shadow-[0_0_25px_rgba(244,63,94,0.6)]');
      }
      if (this.autodjBtnIcon) this.autodjBtnIcon.textContent = 'pause';
      if (this.autodjBtnLabel) this.autodjBtnLabel.textContent = 'PAUSIEREN';
      if (this.autodjStatusPill) {
        this.autodjStatusPill.textContent = 'DECK LÄUFT';
        this.autodjStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse';
      }
      if (this.headerAutoDjInd) {
        this.headerAutoDjInd.textContent = 'SPIELT';
        this.headerAutoDjInd.className = 'text-pink-400 font-bold';
      }
      if (this.albumSpinIcon) this.albumSpinIcon.style.animationPlayState = 'running';
    } else {
      if (this.btnToggleAutoDj) {
        this.btnToggleAutoDj.classList.add('from-emerald-600', 'to-cyan-600');
        this.btnToggleAutoDj.classList.remove('from-rose-600', 'to-pink-600', 'shadow-[0_0_25px_rgba(244,63,94,0.6)]');
      }
      if (this.autodjBtnIcon) this.autodjBtnIcon.textContent = 'play_arrow';
      if (this.autodjBtnLabel) this.autodjBtnLabel.textContent = 'AUTO-DJ STARTEN';
      if (this.autodjStatusPill) {
        this.autodjStatusPill.textContent = 'STANDBY / BEREIT';
        this.autodjStatusPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      }
      if (this.headerAutoDjInd) {
        this.headerAutoDjInd.textContent = 'PAUSIERT';
        this.headerAutoDjInd.className = 'text-cyan-300 font-bold';
      }
      if (this.albumSpinIcon) this.albumSpinIcon.style.animationPlayState = 'paused';
    }
  }

  public startDemoSynthLoop() {
    if (this.isSynthRunning) return;
    this.isSynthRunning = true;
    this.synthStep = 0;
    const step = () => {
      if (!this.isSynthRunning) return;
      if (this.synthStep % 4 === 0) {
        audioEngine.playClubKick(160);
      } else if (this.synthStep % 2 === 0) {
        audioEngine.playRaveStab(110 + (this.synthStep * 12));
      }
      this.synthStep = (this.synthStep + 1) % 16;
      const pitchCtl = document.getElementById('slider-pitch-ctl') as HTMLInputElement;
      const bpm = pitchCtl ? parseInt(pitchCtl.value, 10) : 148;
      this.synthTimer = setTimeout(step, (60 / bpm) / 4 * 1000);
    };
    step();
    if (this.btnMasterLoop) {
      this.btnMasterLoop.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200');
      if (this.loopIcon) this.loopIcon.textContent = 'pause';
      if (this.loopLabel) this.loopLabel.textContent = 'STOP RAVE BEAT';
    }
  }

  public stopDemoSynthLoop() {
    this.isSynthRunning = false;
    clearTimeout(this.synthTimer);
    if (this.btnMasterLoop) {
      this.btnMasterLoop.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200');
      if (this.loopIcon) this.loopIcon.textContent = 'play_arrow';
      if (this.loopLabel) this.loopLabel.textContent = 'RAVE SYNTH BEAT';
    }
  }

  public formatTime(sec: number): string {
    if (!sec || isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
