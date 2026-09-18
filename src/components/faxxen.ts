import { audioEngine } from '../audio/audioEngine.ts';

export class FaxxenSystem {
  private intensity: number = 75;
  private scanlinesActive: boolean = false;
  private strobeActive: boolean = false;

  private zenAvatar = document.getElementById('zen-avatar-main');
  private sliderFaxxen = document.getElementById('slider-faxxen') as HTMLInputElement;
  private faxxenValDisplay = document.getElementById('faxxen-val-display');
  private headerFaxxenVal = document.getElementById('header-faxxen-val');
  private btnScanlines = document.getElementById('btn-toggle-scanlines');
  private crtOverlay = document.getElementById('crt-overlay');
  private btnFaxxenBurst = document.getElementById('btn-trigger-faxxen');
  private turboStrobeOverlay = document.getElementById('turbo-strobe-overlay');
  private btnRave = document.getElementById('btn-rave-strobe');

  private appendLog: (prefix: string, text: string, cls?: string) => void;

  constructor(appendLog: (prefix: string, text: string, cls?: string) => void) {
    this.appendLog = appendLog;
    this.init();
  }

  private init() {
    if (this.sliderFaxxen) {
      this.sliderFaxxen.addEventListener('input', (e) => {
        this.updateIntensity(parseInt((e.target as HTMLInputElement).value, 10));
      });
      this.updateIntensity(parseInt(this.sliderFaxxen.value, 10));
    }

    if (this.btnScanlines && this.crtOverlay) {
      this.btnScanlines.addEventListener('click', () => {
        this.scanlinesActive = !this.scanlinesActive;
        this.crtOverlay!.style.opacity = this.scanlinesActive ? '0.75' : '0';
        this.btnScanlines!.classList.toggle('bg-pink-500/40');
        this.appendLog('FAXXEN_CRT', this.scanlinesActive ? 'CRT Scanlines aktiviert.' : 'CRT Scanlines aus.', 'text-pink-300');
      });
    }

    if (this.btnFaxxenBurst && this.turboStrobeOverlay) {
      this.btnFaxxenBurst.addEventListener('click', () => {
        this.turboStrobeOverlay!.style.opacity = '0.85';
        setTimeout(() => {
          if (this.turboStrobeOverlay) this.turboStrobeOverlay.style.opacity = '0';
        }, 90);
        audioEngine.playClubKick(220);
        audioEngine.playRaveStab(180);
        this.triggerBump();
        this.appendLog('FAXXEN_BURST', '⚡ Koma-Faxxen Burst manuell gezündet!', 'text-amber-300');
      });
    }

    if (this.btnRave && this.turboStrobeOverlay) {
      this.btnRave.addEventListener('click', () => {
        this.strobeActive = !this.strobeActive;
        this.turboStrobeOverlay!.classList.toggle('strobe-turbo-active', this.strobeActive);
        if (this.strobeActive) {
          audioEngine.playClubKick(185);
          this.appendLog('STROBE_RAVE', 'PSYTRANCE STROBE FLUTLICHT AKTIV!', 'text-pink-400');
        }
      });
    }
  }

  public updateIntensity(val: number) {
    this.intensity = val;
    let desc = 'Party-Modus';
    if (this.intensity < 30) desc = 'Chillig';
    else if (this.intensity > 140) desc = 'KOMA-GLITCH';
    else if (this.intensity > 90) desc = 'Extrem Eskaliert';

    if (this.faxxenValDisplay) this.faxxenValDisplay.textContent = `${this.intensity}% (${desc})`;
    if (this.headerFaxxenVal) this.headerFaxxenVal.textContent = `${this.intensity}% ${desc.toUpperCase()}`;

    if (this.zenAvatar) {
      if (this.intensity > 50) {
        this.zenAvatar.classList.add('faxxen-active-glitch');
      } else {
        this.zenAvatar.classList.remove('faxxen-active-glitch');
      }
    }
  }

  public triggerBump() {
    const body = document.getElementById('main-silk-body');
    if (body && this.intensity > 40) {
      body.classList.add('beat-bump-active');
      setTimeout(() => body.classList.remove('beat-bump-active'), 180);
    }
    if (this.zenAvatar) {
      this.zenAvatar.style.filter = `hue-rotate(${Math.floor(Math.random() * 90)}deg) saturate(${100 + this.intensity}%)`;
      setTimeout(() => {
        if (this.zenAvatar) this.zenAvatar.style.filter = 'saturate(125%) brightness(105%)';
      }, 120);
    }
  }

  public triggerStrobeBurst(durationMs = 1200) {
    if (!this.turboStrobeOverlay) return;
    this.turboStrobeOverlay.classList.add('strobe-turbo-active');
    setTimeout(() => {
      if (!this.strobeActive && this.turboStrobeOverlay) {
        this.turboStrobeOverlay.classList.remove('strobe-turbo-active');
      }
    }, durationMs);
  }

  public stopStrobe() {
    this.strobeActive = false;
    if (this.turboStrobeOverlay) {
      this.turboStrobeOverlay.classList.remove('strobe-turbo-active');
      this.turboStrobeOverlay.style.opacity = '0';
    }
  }
}
