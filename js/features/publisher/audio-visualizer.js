export function initAudioVisualizer() {
  const visualizer = document.getElementById('publisherAudioVisualizer');
  const levelLabel = document.getElementById('publisherAudioLevel');
  if (!visualizer || !levelLabel) return;

  const bars = Array.from(visualizer.querySelectorAll('span'));
  const getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    : null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let stream = null;
  let audioContext = null;
  let sourceNode = null;
  let analyser = null;
  let animationFrame = 0;
  let requestId = 0;
  let speaking = false;

  function stop() {
    requestId += 1;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (error) {}
    }
    sourceNode = null;
    if (analyser) {
      try { analyser.disconnect(); } catch (error) {}
    }
    analyser = null;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    audioContext = null;
    speaking = false;
    visualizer.classList.remove('is-active', 'is-speaking');
    visualizer.classList.add('is-listening');
    visualizer.style.setProperty('--voice-level', '0');
    bars.forEach(bar => { bar.style.height = '4px'; });
    levelLabel.textContent = 'Micrófono activo · esperando que hables.';
  }

  function animate() {
    if (!analyser) return;
    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const amplitude = (samples[index] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const rms = Math.sqrt(sum / samples.length);
    const level = Math.min(1, rms * 7);
    const isSpeaking = rms > 0.035;
    if (isSpeaking !== speaking) {
      speaking = isSpeaking;
      visualizer.classList.toggle('is-speaking', speaking);
      visualizer.classList.toggle('is-listening', !speaking);
    }
    visualizer.style.setProperty('--voice-level', String(level));
    bars.forEach((bar, index) => {
      const wave = Math.abs(Math.sin(index * 0.72 + performance.now() / 115));
      const height = 4 + level * (10 + wave * 27);
      bar.style.height = Math.round(height) + 'px';
    });
    levelLabel.textContent = isSpeaking
      ? 'Voz detectada · dictando'
      : 'Micrófono activo · esperando que hables';
    animationFrame = requestAnimationFrame(animate);
  }

  async function start() {
    stop();
    if (!getUserMedia || !AudioContextClass) {
      levelLabel.textContent = 'No se puede mostrar el nivel de voz en este navegador; el dictado puede continuar si está disponible.';
      return;
    }
    const currentRequest = ++requestId;
    levelLabel.textContent = 'Activando indicador de voz…';
    try {
      const nextStream = await getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false
      });
      if (currentRequest !== requestId) {
        nextStream.getTracks().forEach(track => track.stop());
        return;
      }
      stream = nextStream;
      audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (currentRequest !== requestId) {
        stop();
        return;
      }
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
      visualizer.classList.add('is-active', 'is-listening');
      visualizer.classList.remove('is-speaking');
      visualizer.style.setProperty('--voice-level', '0');
      levelLabel.textContent = 'Micrófono activo · esperando que hables';
      animate();
    } catch (error) {
      stop();
      visualizer.classList.remove('is-listening', 'is-speaking');
      levelLabel.textContent = error && error.name === 'NotAllowedError'
        ? 'No se concedió permiso para mostrar el nivel del micrófono; el dictado podría seguir disponible.'
        : 'No se pudo activar el indicador de voz; podés continuar con el dictado.';
    }
  }

  window.addEventListener('publisher:dictation-start', start);
  window.addEventListener('publisher:dictation-stop', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
  });
  window.addEventListener('pagehide', stop, { once: true });
}
