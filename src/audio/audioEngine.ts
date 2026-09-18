// Audio Engine: HTML5 Direct Streaming, Audio Pool & Web Audio API Synthesizers

class AudioEngine {
  public ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public mainAudio: HTMLAudioElement;
  public soundboardAudio: HTMLAudioElement;
  public masterVolume: number = 0.85;
  public playbackRate: number = 1.0;
  private activeSounds: HTMLAudioElement[] = [];
  private onUnlockCallbacks: Array<() => void> = [];
  public lastTriggerTime: number = 0;

  constructor() {
    this.mainAudio = document.getElementById('main-audio-player') as HTMLAudioElement || new Audio();
    this.soundboardAudio = document.getElementById('soundboard-audio-player') as HTMLAudioElement || new Audio();

    this.mainAudio.volume = this.masterVolume;
    this.soundboardAudio.volume = this.masterVolume;

    // Listen for first user click to resume context
    window.addEventListener('click', () => {
      this.ensureContext();
    }, { once: true });
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const banner = document.getElementById('audio-unlock-banner');
    if (banner) banner.classList.add('hidden');

    this.onUnlockCallbacks.forEach(cb => cb());
    this.onUnlockCallbacks = [];
    return this.ctx;
  }

  public onUnlock(cb: () => void) {
    if (this.ctx && this.ctx.state === 'running') {
      cb();
    } else {
      this.onUnlockCallbacks.push(cb);
    }
  }

  // --- ECHTES DIRECT PLAYBACK FÜR MP3 SOUNDFILES (KEINE SPRACHSYNTHESE!) ---
  public playSoundFile(filenameOrUrl: string, volumeScale = 1.0): HTMLAudioElement {
    this.ensureContext();
    this.lastTriggerTime = Date.now();

    const src = (filenameOrUrl.startsWith('http') || filenameOrUrl.startsWith('blob:') || filenameOrUrl.startsWith('/'))
      ? filenameOrUrl
      : `/sounds/${filenameOrUrl}`;

    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, this.masterVolume * volumeScale));
    audio.playbackRate = this.playbackRate;

    this.activeSounds.push(audio);
    audio.addEventListener('ended', () => {
      const idx = this.activeSounds.indexOf(audio);
      if (idx !== -1) this.activeSounds.splice(idx, 1);
    });

    audio.play().catch(err => {
      console.warn(`[AudioEngine] Playback failed for ${src}:`, err);
    });

    return audio;
  }

  // Punchy 808 Sub Pitch Drop
  public playClubKick(freq = 150) {
    try {
      const ctx = this.ensureContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.35);

      gain.gain.setValueAtTime(0.85 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.40);
      this.lastTriggerTime = Date.now();
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // Multi-oscillator detuned rave chord
  public playRaveStab(noteFreq = 220) {
    try {
      const ctx = this.ensureContext();
      const t = ctx.currentTime;

      [-7, 0, 7, 12].forEach(semi => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const f = noteFreq * Math.pow(2, semi / 12);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4500, t);
        filter.frequency.exponentialRampToValueAtTime(600, t + 0.35);

        gain.gain.setValueAtTime(0.22 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.38);
      });
      this.lastTriggerTime = Date.now();
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // 303 Acid Resonant Filter Synth
  public playAcidNote(freq = 160) {
    try {
      const ctx = this.ensureContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.28);
      filter.Q.setValueAtTime(14, t);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
      this.lastTriggerTime = Date.now();
    } catch (e) {}
  }

  // Crisp Hi-Hat Synth
  public playHiHat() {
    try {
      const ctx = this.ensureContext();
      const t = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.05);
    } catch (e) {}
  }

  // Massive Psytrance Bass Drop
  public playPsytranceDrop() {
    this.playClubKick(180);
    setTimeout(() => this.playRaveStab(140), 120);
    setTimeout(() => this.playAcidNote(110), 240);
    setTimeout(() => this.playClubKick(160), 380);
  }

  // Optional AI Speech Synthesis (used exclusively by AI Terminal, NOT for soundboard files!)
  public speakText(text: string) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[»«"]/g, '');
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = 'de-DE';
        utter.rate = 1.05;
        utter.pitch = 0.95;
        utter.volume = this.masterVolume;

        const voices = window.speechSynthesis.getVoices();
        const deVoice = voices.find(v => v.lang.startsWith('de'));
        if (deVoice) utter.voice = deVoice;

        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn('speechSynthesis error:', e);
      }
    }
  }

  public speakQuote(text: string) {
    this.speakText(text);
  }

  public setMasterVolume(volPercent: number) {
    this.masterVolume = Math.max(0, Math.min(100, volPercent)) / 100;
    this.mainAudio.volume = this.masterVolume;
    this.soundboardAudio.volume = this.masterVolume;
    this.activeSounds.forEach(a => { a.volume = this.masterVolume; });
  }

  public setPlaybackRate(rate: number) {
    if (rate > 0) {
      this.playbackRate = rate;
      this.mainAudio.playbackRate = rate;
      this.activeSounds.forEach(a => { a.playbackRate = rate; });
    }
  }

  public panicMute() {
    this.mainAudio.pause();
    this.soundboardAudio.pause();
    this.activeSounds.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
    this.activeSounds = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.masterVolume = 0;
    this.mainAudio.volume = 0;
    this.soundboardAudio.volume = 0;
  }
}

export const audioEngine = new AudioEngine();
