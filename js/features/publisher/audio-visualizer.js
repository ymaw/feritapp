export function initPublisherAudioVisualizer() {
  const startButton = document.getElementById('publisherDictationStart');
  const stopButton = document.getElementById('publisherDictationStop');
  const visualizer = document.getElementById('publisherAudioVisualizer');
  const levelLabel = document.getElementById('publisherAudioLevel');
  if (!startButton || !stopButton || !visualizer || !levelLabel) return;

  const bars = Array.from(visualizer.querySelectorAll('span'));
  let stream = null;
  let context = null;
  let analyser = null;
  let frame = 0;
  let stopped = true;

  function stop() {
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (context && context.state !== 'closed') context.close().catch(() => {});
    context = null;
    analyser = null;
    visualizer.classList.remove('is-active');
    bars.forEach(bar => { bar.style.height = '4px'; });
    levelLabel.textContent = 'El nivel de voz se mostrará mientras hablás.';
  }

  function animate() {
    if (stopped || !analyser) return;
    const values = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(values);
    const stride = Math.max(1, Math.floor(values.length / bars.length));
    bars.forEach((bar, index) => {
      const value = values[Math.min(values.length - 1, index * stride)] || 0;
      bar.style.height = (4 + Math.round(value / 255 * 38)) + 'px';
    });
    const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    levelLabel.textContent = average < 3 ? 'Micrófono activo · No se detecta voz' : 'Micrófono activo · Nivel de voz ' + Math.round(average / 255 * 100) + '%';
    frame = requestAnimationFrame(animate);
  }

  async function start() {
    stop();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.AudioContext) {
      levelLabel.textContent = 'Este navegador no permite visualizar el nivel de audio. La transcripción puede seguir funcionando.';
      return;
    }
    stopped = false;
    levelLabel.textContent = 'Solicitando permiso para visualizar el audio…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (stopped) { stream.getTracks().forEach(track => track.stop()); stream = null; return; }
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 128;
      context.createMediaStreamSource(stream).connect(analyser);
      visualizer.classList.add('is-active');
      levelLabel.textContent = 'Micrófono activo · Hablá para ver las fluctuaciones.';
      animate();
    } catch (error) {
      stop();
      levelLabel.textContent = error && error.name === 'NotAllowedError'
        ? 'No se concedió permiso para visualizar el micrófono. La transcripción podría seguir disponible.'
        : 'No se pudo activar el visualizador. La transcripción puede seguir funcionando.';
    }
  }

  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', stop);
  const status = document.getElementById('publisherDictationStatus');
  if (status && typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => {
      if (!stopButton.disabled) return;
      stop();
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }
  window.addEventListener('pagehide', stop, { once: true });
}
