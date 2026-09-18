import { audioEngine } from '../audio/audioEngine.ts';

export function initVisualizers(getIsPlaying: () => boolean) {
  // 1. Dynamic Waveform Canvas Visualizer
  const waveCanvas = document.getElementById('dj-waveform-canvas') as HTMLCanvasElement;
  if (waveCanvas) {
    const wCtx = waveCanvas.getContext('2d');
    function resizeWave() {
      if (waveCanvas.parentElement) {
        waveCanvas.width = waveCanvas.parentElement.clientWidth;
        waveCanvas.height = waveCanvas.parentElement.clientHeight;
      }
    }
    window.addEventListener('resize', resizeWave);
    resizeWave();

    let wavePhase = 0;
    function drawWaveform() {
      if (!wCtx) return;
      wCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
      const w = waveCanvas.width;
      const h = waveCanvas.height;
      const mid = h / 2;

      const numBars = 48;
      const barWidth = w / numBars;
      const isAudioActive = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || getIsPlaying();

      for (let i = 0; i < numBars; i++) {
        const amp = isAudioActive
          ? (Math.sin(i * 0.3 + wavePhase) * 0.5 + 0.5) * (h * 0.75) + 4
          : 4;

        const grad = wCtx.createLinearGradient(0, mid - amp / 2, 0, mid + amp / 2);
        grad.addColorStop(0, '#d946ef');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#7c3aed');

        wCtx.fillStyle = grad;
        wCtx.fillRect(i * barWidth + 1, mid - amp / 2, barWidth - 2, amp);
      }

      wavePhase += isAudioActive ? 0.15 : 0.02;
      requestAnimationFrame(drawWaveform);
    }
    drawWaveform();
  }

  // 2. 16-Band Spectrum LED Bank
  const spectrumBank = document.getElementById('silk-spectrum-bank');
  if (spectrumBank) {
    spectrumBank.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const col = document.createElement('div');
      col.className = 'flex-1 bg-white/5 rounded-xs overflow-hidden flex flex-col justify-end h-full';
      const fill = document.createElement('div');
      fill.className = 'w-full rounded-xs transition-all duration-150';
      fill.style.height = `${Math.floor(Math.random() * 50 + 20)}%`;
      fill.style.background = 'linear-gradient(to top, #7c3aed, #06b6d4)';
      col.appendChild(fill);
      spectrumBank.appendChild(col);
    }

    setInterval(() => {
      const fills = spectrumBank.querySelectorAll<HTMLDivElement>('div > div');
      const active = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || getIsPlaying();
      fills.forEach((fill) => {
        const h = active ? Math.floor(Math.random() * 85 + 15) : Math.floor(Math.random() * 25 + 8);
        fill.style.height = `${h}%`;
        if (h > 70) {
          fill.style.background = 'linear-gradient(to top, #f43f5e, #f59e0b)';
        } else {
          fill.style.background = 'linear-gradient(to top, #7c3aed, #06b6d4)';
        }
      });
    }, 140);
  }
}
