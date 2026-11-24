const VOSK_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/vosk-browser@0.0.5/dist/vosk.js';
const SPANISH_MODEL_URL = 'https://huggingface.co/Andesprit/vosk-small/resolve/main/vosk-model-small-es-0.42.tar.gz';

const status = document.getElementById('status');
const loadButton = document.getElementById('loadEngine');
const startButton = document.getElementById('startDictation');
const stopButton = document.getElementById('stopDictation');
const releaseButton = document.getElementById('releaseEngine');
const transcriptField = document.getElementById('transcript');

let model = null;
let recognizer = null;
let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let silentGain = null;
let isLoading = false;
let isRecording = false;
let committedText = '';

function setStatus(message) {
  status.textContent = message;
}

function updateControls() {
  loadButton.disabled = isLoading || Boolean(model);
  startButton.disabled = isLoading || !model || isRecording;
  stopButton.disabled = !isRecording;
  releaseButton.disabled = isLoading || !model || isRecording;
}

function loadVoskLibrary() {
  if (window.Vosk) return Promise.resolve(window.Vosk);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = VOSK_SCRIPT_URL;
    script.async = true;
    script.onload = () => window.Vosk
      ? resolve(window.Vosk)
      : reject(new Error('La biblioteca se cargó, pero Vosk no está disponible.'));
    script.onerror = () => reject(new Error('No se pudo descargar la biblioteca Vosk.'));
    document.head.appendChild(script);
  });
}

async function loadEngine() {
  if (model || isLoading) return;
  isLoading = true;
  updateControls();
  setStatus('Descargando biblioteca y modelo español (aprox. 40 MB). Esto puede tardar según la conexión…');
  try {
    const Vosk = await loadVoskLibrary();
    model = await Vosk.createModel(SPANISH_MODEL_URL);
    model.setLogLevel(-1);
    setStatus('Motor local preparado. El modelo permanece en memoria hasta que lo liberes.');
  } catch (error) {
    if (model) model.terminate();
    model = null;
    setStatus('No se pudo preparar el motor: ' + (error.message || 'error desconocido'));
  } finally {
    isLoading = false;
    updateControls();
  }
}

function appendFinalText(text) {
  if (!text) return;
  committedText = [committedText, text].filter(Boolean).join(' ').trim();
  transcriptField.value = committedText;
}

async function startDictation() {
  if (!model || isRecording) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Este navegador no permite acceder al micrófono en este contexto.');
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      video: false
    });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('AudioContext no está disponible.');

    audioContext = new AudioContextClass({ sampleRate: 16000 });
    if (audioContext.state === 'suspended') await audioContext.resume();

    recognizer = new model.KaldiRecognizer();
    recognizer.on('result', message => {
      appendFinalText(message && message.result ? message.result.text : '');
      setStatus('Dictado local activo. Se recibió un segmento final.');
    });
    recognizer.on('partialresult', message => {
      const partial = message && message.result ? message.result.partial : '';
      setStatus(partial ? 'Escuchando: ' + partial : 'Escuchando…');
    });

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    processorNode.onaudioprocess = event => {
      if (!recognizer) return;
      try {
        recognizer.acceptWaveform(event.inputBuffer);
      } catch (error) {
        setStatus('Error procesando audio local: ' + (error.message || 'error desconocido'));
      }
    };
    sourceNode.connect(processorNode);
    processorNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
    isRecording = true;
    setStatus('Micrófono activo. El audio se procesa localmente.');
  } catch (error) {
    stopDictation();
    setStatus('No se pudo iniciar el dictado: ' + (error.message || 'revisá el permiso del micrófono.'));
  }
  updateControls();
}

function disconnectSafely(node) {
  if (!node) return;
  try {
    node.disconnect();
  } catch {
    // Continue cleanup even if a Web Audio node is already disconnected.
  }
}

function stopDictation() {
  isRecording = false;

  if (processorNode) processorNode.onaudioprocess = null;
  disconnectSafely(processorNode);
  disconnectSafely(sourceNode);
  disconnectSafely(silentGain);
  processorNode = null;
  sourceNode = null;
  silentGain = null;

  const activeRecognizer = recognizer;
  recognizer = null;
  if (activeRecognizer) {
    try {
      activeRecognizer.remove();
    } catch {
      // Microphone and AudioContext cleanup must not depend on recognizer teardown.
    }
  }

  const activeStream = mediaStream;
  mediaStream = null;
  if (activeStream) {
    activeStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // Continue stopping any remaining tracks.
      }
    });
  }

  const activeAudioContext = audioContext;
  audioContext = null;
  if (activeAudioContext && activeAudioContext.state !== 'closed') {
    activeAudioContext.close().catch(() => {});
  }

  updateControls();
}

function releaseEngine() {
  if (isRecording) stopDictation();
  if (model) model.terminate();
  model = null;
  committedText = transcriptField.value.trim();
  setStatus('Motor liberado. La transcripción permanece en el campo para que puedas copiarla.');
  updateControls();
}

loadButton.addEventListener('click', loadEngine);
startButton.addEventListener('click', startDictation);
stopButton.addEventListener('click', () => {
  stopDictation();
  setStatus(transcriptField.value.trim() ? 'Dictado detenido. Revisá la transcripción.' : 'Dictado detenido sin texto reconocido.');
});
releaseButton.addEventListener('click', releaseEngine);
transcriptField.addEventListener('input', () => { committedText = transcriptField.value; });

window.addEventListener('pagehide', () => {
  stopDictation();
  if (model) model.terminate();
  model = null;
}, { once: true });

updateControls();
