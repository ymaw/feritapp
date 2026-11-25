export function initAudioVisualizer() {
  const visualizer = document.getElementById('publisherAudioVisualizer');
  const levelLabel = document.getElementById('publisherAudioLevel');
  if (!visualizer || !levelLabel) return;

  const bars = Array.from(visualizer.querySelectorAll('span'));
  let animationFrame = 0;
  let speakingTimer = null;
  let active = false;
  let speaking = false;
  let phase = 0;

  function render() {
    if (!active) return;
    phase += speaking ? 0.24 : 0.10;
    bars.forEach((bar, index) => {
      const wave = Math.abs(Math.sin(phase + index * 0.68));
      const emphasis = speaking ? 1 : 0.32;
      const height = 4 + wave * (speaking ? 34 : 8) * emphasis;
      bar.style.height = Math.round(height) + 'px';
      bar.style.opacity = speaking ? String(0.72 + wave * 0.28) : '0.55';
    });
    animationFrame = window.requestAnimationFrame(render);
  }

  function setSpeaking(value) {
    if (!active) return;
    speaking = Boolean(value);
    visualizer.classList.toggle('is-speaking', speaking);
    visualizer.classList.toggle('is-listening', !speaking);
    levelLabel.textContent = speaking
      ? 'Voz detectada · dictando'
      : 'Micrófono activo · esperando que hables';
  }

  function start() {
    stop();
    active = true;
    visualizer.classList.add('is-active', 'is-listening');
    visualizer.classList.remove('is-speaking');
    levelLabel.textContent = 'Micrófono activo · esperando que hables';
    render();
  }

  function stop() {
    active = false;
    speaking = false;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (speakingTimer) window.clearTimeout(speakingTimer);
    speakingTimer = null;
    visualizer.classList.remove('is-active', 'is-listening', 'is-speaking');
    visualizer.style.setProperty('--voice-level', '0');
    bars.forEach(bar => { bar.style.height = '4px'; bar.style.opacity = ''; });
    levelLabel.textContent = 'Micrófono inactivo.';
  }

  function onSpeechDetected() {
    if (!active) return;
    setSpeaking(true);
    if (speakingTimer) window.clearTimeout(speakingTimer);
    speakingTimer = window.setTimeout(() => {
      speakingTimer = null;
      setSpeaking(false);
    }, 850);
  }

  window.addEventListener('publisher:dictation-start', start);
  window.addEventListener('publisher:dictation-stop', stop);
  window.addEventListener('publisher:dictation-speaking', onSpeechDetected);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stop();
  });
  window.addEventListener('pagehide', stop, { once: true });
}
