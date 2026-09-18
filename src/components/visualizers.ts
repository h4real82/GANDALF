import { audioEngine } from '../audio/audioEngine.ts';

export function initVisualizers(getIsPlaying: () => boolean) {
  // 1. Dynamic DJ Waveform Canvas Visualizer
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
      const isAudioActive = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || 
                            (Date.now() - audioEngine.lastTriggerTime < 2500) ||
                            getIsPlaying();

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
      const active = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || 
                     (Date.now() - audioEngine.lastTriggerTime < 2500) ||
                     getIsPlaying();
      fills.forEach((fill) => {
        const h = active ? Math.floor(Math.random() * 85 + 15) : Math.floor(Math.random() * 25 + 8);
        fill.style.height = `${h}%`;
        if (h > 70) {
          fill.style.background = 'linear-gradient(to top, #f43f5e, #f59e0b)';
        } else {
          fill.style.background = 'linear-gradient(to top, #7c3aed, #06b6d4)';
        }
      });
    }, 120);
  }

  // 3. Quantum Arc Reactor Canvas (from spatial_rave_hologram.html)
  const coreCanvases = document.querySelectorAll<HTMLCanvasElement>('.quantum-core-canvas');
  coreCanvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const particles: Array<{ radius: number; speed: number; angle: number; size: number; color: string }> = [];
    for (let i = 0; i < 28; i++) {
      particles.push({
        radius: Math.random() * (canvas.width / 2 - 20) + 15,
        speed: (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        angle: Math.random() * Math.PI * 2,
        size: Math.random() * 2.5 + 1,
        color: Math.random() > 0.4 ? '#00f0ff' : '#ffd19c'
      });
    }

    function renderCore() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const isAudioActive = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || 
                            (Date.now() - audioEngine.lastTriggerTime < 2500) ||
                            getIsPlaying();

      // Pulsing concentric rings
      const pulseFactor = isAudioActive ? Math.sin(angle * 4) * 6 + 4 : 0;

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, (canvas.width * 0.38) + pulseFactor, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 185, 95, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, (canvas.width * 0.28) - pulseFactor / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Orbiting particles
      particles.forEach(p => {
        p.angle += isAudioActive ? p.speed * 2.5 : p.speed;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isAudioActive ? 8 : 4;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (isAudioActive ? 1.4 : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      angle += 0.03;
      requestAnimationFrame(renderCore);
    }
    renderCore();
  });

  // 4. Live Oscilloscope Canvas (from spatial_rave_hologram.html)
  const oscCanvas = document.getElementById('oscilloscope-canvas') as HTMLCanvasElement;
  if (oscCanvas) {
    const oscCtx = oscCanvas.getContext('2d');
    let oscPhase = 0;

    function drawOscilloscope() {
      if (!oscCtx) return;
      oscCtx.clearRect(0, 0, oscCanvas.width, oscCanvas.height);
      oscCtx.lineWidth = 2;
      oscCtx.strokeStyle = '#00f0ff';
      oscCtx.beginPath();

      const isAudioActive = (!audioEngine.mainAudio.paused && audioEngine.mainAudio.currentTime > 0) || 
                            (Date.now() - audioEngine.lastTriggerTime < 2500) ||
                            getIsPlaying();

      const sliceWidth = oscCanvas.width / 60;
      let x = 0;

      for (let i = 0; i <= 60; i++) {
        const amp = isAudioActive ? 22 : 8;
        const acidMod = Math.sin(oscPhase * 2 + i * 0.4) > 0 ? 3 : -3;
        const y = (oscCanvas.height / 2) + Math.sin(oscPhase + i * 0.28) * amp + acidMod + (isAudioActive ? (Math.random() - 0.5) * 6 : 0);
        if (i === 0) oscCtx.moveTo(x, y);
        else oscCtx.lineTo(x, y);
        x += sliceWidth;
      }

      oscCtx.stroke();
      oscPhase += isAudioActive ? 0.28 : 0.12;
      requestAnimationFrame(drawOscilloscope);
    }
    drawOscilloscope();
  }

  // 5. Interactive Synth Cutoff & Resonance Sliders
  const cutoffSlider = document.getElementById('slider-cutoff') as HTMLInputElement;
  const valCutoff = document.getElementById('val-cutoff');
  if (cutoffSlider && valCutoff) {
    cutoffSlider.addEventListener('input', (e: any) => {
      const khz = (e.target.value / 1000).toFixed(2);
      valCutoff.textContent = `${khz} kHz`;
      audioEngine.playAcidNote(parseInt(e.target.value, 10) / 10);
    });
  }

  const resSlider = document.getElementById('slider-resonance') as HTMLInputElement;
  const valRes = document.getElementById('val-resonance');
  if (resSlider && valRes) {
    resSlider.addEventListener('input', (e: any) => {
      valRes.textContent = `${e.target.value}%`;
      audioEngine.playHiHat();
    });
  }

  // 6. Arc Reactor Shockwave Generator
  const reactorCores = document.querySelectorAll('.arc-reactor-core');
  reactorCores.forEach(core => {
    core.addEventListener('click', () => {
      audioEngine.playClubKick(160);
      audioEngine.playHiHat();

      const shockLayer = core.querySelector('.shockwave-layer');
      if (shockLayer) {
        const wave = document.createElement('div');
        wave.className = 'absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none';
        wave.style.animation = 'shockwave 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
        shockLayer.appendChild(wave);
        setTimeout(() => wave.remove(), 850);
      }
    });
  });

  // 7. Tactical Rave Protocols (Späti, Pfeffi, Sunglasses, Kater)
  document.querySelectorAll('.rave-protocol-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (action === 'SPAETI_RADAR') {
        audioEngine.playClubKick(140);
        audioEngine.playSoundFile('mix.mp3');
      } else if (action === 'PFEFFI_SHOT') {
        audioEngine.playHiHat();
        audioEngine.playSoundFile('jagermeister-schrei.mp3');
      } else if (action === 'SUNGLASSES') {
        audioEngine.playAcidNote(220);
        audioEngine.playSoundFile('boar-alta-geil-ey-unnormal-ey-mp3cut.mp3');
      } else if (action === 'KATER_PROPHYLAXE') {
        audioEngine.playAcidNote(165);
        audioEngine.playSoundFile('auf-alkohol.mp3');
      }
    });
  });
}
