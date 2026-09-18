// Audio Engine: HTML5 Direct Streaming & Web Audio API Synthesizers

class AudioEngine {
  public ctx: AudioContext | null = null;
  public mainAudio: HTMLAudioElement;
  public soundboardAudio: HTMLAudioElement;
  public masterVolume: number = 0.85;
  private onUnlockCallbacks: Array<() => void> = [];

  constructor() {
    this.mainAudio = document.getElementById('main-audio-player') as HTMLAudioElement || new Audio();
    this.soundboardAudio = document.getElementById('soundboard-audio-player') as HTMLAudioElement || new Audio();

    this.mainAudio.volume = this.masterVolume;
    this.soundboardAudio.volume = this.masterVolume;

    // Listen for first user click to resume context if suspended
    window.addEventListener('click', () => {
      this.ensureContext();
    }, { once: true });
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
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
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  // German Speech Synthesis for Quotes
  public speakQuote(text: string) {
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

  public setMasterVolume(volPercent: number) {
    this.masterVolume = Math.max(0, Math.min(100, volPercent)) / 100;
    this.mainAudio.volume = this.masterVolume;
    this.soundboardAudio.volume = this.masterVolume;
  }

  public setPlaybackRate(rate: number) {
    if (rate > 0) {
      this.mainAudio.playbackRate = rate;
    }
  }

  public panicMute() {
    this.mainAudio.pause();
    this.soundboardAudio.pause();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.masterVolume = 0;
    this.mainAudio.volume = 0;
    this.soundboardAudio.volume = 0;
  }
}

export const audioEngine = new AudioEngine();
