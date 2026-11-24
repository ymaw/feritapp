export function initAudioVisualizer() {
  const startButton = document.getElementById('publisherDictationStart');
  const stopButton = document.getElementById('publisherDictationStop');
  const visualizer = document.getElementById('publisherAudioVisualizer');
  const levelLabel = document.getElementById('publisherAudioLevel');
  const status = document.getElementById('publisherDictationStatus');
  if (!startButton || !stopButton || !visualizer || !levelLabel) return;

  const bars = Array.from(visualizer.querySelectorAll('span'));
  const getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    : null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let stream = null;
  let audioContext = null;
  let analyser = null;
  let animationFrame = 0;
  let requestId = 0;

  function stop() {
    requestId += 1;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    audioContext = null;
    analyser = null;
    visualizer.classList.remove('is-active');
    bars.forEach(bar => { bar.style.height = '4px'; });
    levelLabel.textContent = 'El nivel de voz se mostrará mientras hablás.';
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
    const level = Math.min(1, rms * 4.5);
    bars.forEach((bar, index) => {
      const variation = 0.72 + 0.28 * Math.abs(Math.sin(index * 1.7 + performance.now() / 170));
      bar.style.height = Math.max(4, Math.round(4 + level * 42 * variation)) + 'px';
    });
    levelLabel.textContent = level > 0.035 ? 'Micrófono activo · detectando voz' : 'Micrófono activo · esperando voz';
    animationFrame = requestAnimationFrame(animate);
  }

  async function start() {
    if (!getUserMedia || !AudioContextClass) {
      levelLabel.textContent = 'Este navegador no permite visualizar el nivel del micrófono.';
      return;
    }
    if (stream || audioContext) return;
    const currentRequest = ++requestId;
    try {
      const nextStream = await getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (currentRequest !== requestId) {
        nextStream.getTracks().forEach(track => track.stop());
        return;
      }
      stream = nextStream;
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          if (stream && stream.getTracks().every(item => item.readyState === 'ended')) stop();
        }, { once: true });
      });
      audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      visualizer.classList.add('is-active');
      animate();
    } catch (error) {
      stop();
      levelLabel.textContent = error && error.name === 'NotAllowedError'
        ? 'Sin permiso de micrófono para mostrar el nivel de voz.'
        : 'No se pudo activar el visualizador; la transcripción puede funcionar por separado.';
    }
  }

  startButton.addEventListener('click', start);
  stopButton.addEventListener('click', stop);

  if (typeof MutationObserver !== 'undefined') {
    const publisherView = document.getElementById('viewPublisher');
    if (publisherView) {
      const viewObserver = new MutationObserver(() => {
        if (publisherView.style.display === 'none') stop();
      });
      viewObserver.observe(publisherView, { attributes: true, attributeFilter: ['style'] });
      window.addEventListener('pagehide', () => viewObserver.disconnect(), { once: true });
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
  });

  if (status && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (/transcripci[oó]n lista|no se obtuvo|no se concedi[oó]|bloque[oó]|no se encontr[oó]|problema con el reconocimiento|no se pudo iniciar/i.test(status.textContent)) stop();
    });
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    window.addEventListener('pagehide', () => {
      stop();
      observer.disconnect();
    }, { once: true });
  } else {
    window.addEventListener('pagehide', stop, { once: true });
  }
}
