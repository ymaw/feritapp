const VOSK_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/vosk.js';
const SPANISH_MODEL_URL = 'https://huggingface.co/Andesprit/vosk-small/resolve/4d38d0a236510fb9877d125f2d79e7e6d8edd4a5/vosk-model-small-es-0.42.tar.gz';
const SPANISH_MODEL_SIZE = 39748934;
const SPANISH_MODEL_SHA256 = '357867a8d602f1ce7f605c8ccafadf42ab441e5b34c6b55ba3c65cdad2c28fa2';
const TARGET_SAMPLE_RATE = 16000;

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
let workletNode = null;
let silentGain = null;
let isLoading = false;
let isRecording = false;
let dictationRequestId = 0;
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

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function downloadVerifiedModel() {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Este navegador no permite verificar la integridad del modelo.');
  }
  const response = await fetch(SPANISH_MODEL_URL, { cache: 'force-cache' });
  if (!response.ok) throw new Error('No se pudo descargar el modelo español.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== SPANISH_MODEL_SIZE) {
    throw new Error('El tamaño del modelo descargado no coincide con el esperado.');
  }
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  if (toHex(digest) !== SPANISH_MODEL_SHA256) {
    throw new Error('La verificación SHA-256 del modelo no fue válida.');
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'application/gzip' }));
}

async function loadEngine() {
  if (model || isLoading) return;
  isLoading = true;
  updateControls();
  setStatus('Descargando y verificando el modelo español (39,7 MB). Puede tardar según la conexión…');
  let verifiedModelUrl = null;
  try {
    const Vosk = await loadVoskLibrary();
    verifiedModelUrl = await downloadVerifiedModel();
    model = await Vosk.createModel(verifiedModelUrl);
    model.setLogLevel(-1);
    setStatus('Motor local preparado y verificado. Se ejecuta en este dispositivo.');
  } catch (error) {
    if (model) model.terminate();
    model = null;
    setStatus('No se pudo preparar el motor: ' + (error.message || 'error desconocido'));
  } finally {
    if (verifiedModelUrl) URL.revokeObjectURL(verifiedModelUrl);
    isLoading = false;
    updateControls();
  }
}

function appendFinalText(text) {
  if (!text) return;
  committedText = [committedText, text].filter(Boolean).join(' ').trim();
  transcriptField.value = committedText;
}

function resampleTo16k(samples, sourceRate) {
  if (sourceRate === TARGET_SAMPLE_RATE) return samples;
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(samples.length / ratio);
  const output = new Float32Array(outputLength);
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, samples.length - 1);
    const fraction = position - left;
    output[index] = samples[left] + (samples[right] - samples[left]) * fraction;
  }
  return output;
}

function disconnectSafely(node) {
  if (!node) return;
  try { node.disconnect(); } catch (error) {
    // Continue cleanup even if the node was already disconnected.
  }
}

function stopTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => {
    try { track.stop(); } catch (error) {
      // Continue stopping the remaining tracks.
    }
  });
}

async function startDictation() {
  if (!model || isRecording) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Este navegador no permite acceder al micrófono en este contexto.');
    return;
  }
  const requestId = ++dictationRequestId;
  setStatus('Solicitando permiso para el micrófono…');
  try {
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      video: false
    });
    if (requestId !== dictationRequestId) {
      stopTracks(nextStream);
      return;
    }
    mediaStream = nextStream;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('AudioContext no está disponible.');
    audioContext = new AudioContextClass();
    if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      throw new Error('Este navegador no admite AudioWorklet; el dictado local no se iniciará.');
    }
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (requestId !== dictationRequestId) return;

    await audioContext.audioWorklet.addModule(new URL('./audio-worklet-processor.js', import.meta.url));
    if (requestId !== dictationRequestId) return;

    recognizer = new model.KaldiRecognizer();
    recognizer.on('result', message => {
      appendFinalText(message && message.result ? message.result.text : '');
      setStatus('Dictado local activo. Revisá el texto reconocido.');
    });
    recognizer.on('partialresult', message => {
      const partial = message && message.result ? message.result.partial : '';
      setStatus(partial ? 'Escuchando: ' + partial : 'Escuchando…');
    });

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    workletNode = new AudioWorkletNode(audioContext, 'vosk-pcm-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: 'explicit'
    });
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    workletNode.port.onmessage = event => {
      if (!recognizer || !audioContext || !isRecording) return;
      try {
        const samples = event.data instanceof Float32Array ? event.data : new Float32Array(event.data);
        const normalized = resampleTo16k(samples, audioContext.sampleRate);
        if (!normalized.length) return;
        const audioBuffer = audioContext.createBuffer(1, normalized.length, TARGET_SAMPLE_RATE);
        audioBuffer.copyToChannel(normalized, 0);
        recognizer.acceptWaveform(audioBuffer);
      } catch (error) {
        setStatus('No se pudo procesar un segmento de audio local.');
      }
    };

    isRecording = true;
    sourceNode.connect(workletNode);
    workletNode.connect(silentGain);
    silentGain.connect(audioContext.destination);
    setStatus('Micrófono activo. El audio se procesa localmente y no se guarda.');
  } catch (error) {
    stopDictation();
    setStatus('No se pudo iniciar el dictado: ' + (error.message || 'revisá el permiso del micrófono.'));
  }
  updateControls();
}

function stopDictation() {
  dictationRequestId += 1;
  isRecording = false;
  if (workletNode) {
    workletNode.port.onmessage = null;
    try { workletNode.port.close(); } catch (error) {}
  }
  disconnectSafely(workletNode);
  disconnectSafely(sourceNode);
  disconnectSafely(silentGain);
  workletNode = null;
  sourceNode = null;
  silentGain = null;

  const activeRecognizer = recognizer;
  recognizer = null;
  if (activeRecognizer) {
    try { activeRecognizer.remove(); } catch (error) {}
  }

  const activeStream = mediaStream;
  mediaStream = null;
  stopTracks(activeStream);

  const activeAudioContext = audioContext;
  audioContext = null;
  if (activeAudioContext && activeAudioContext.state !== 'closed') {
    activeAudioContext.close().catch(() => {});
  }
  updateControls();
}

function releaseEngine() {
  if (isRecording || mediaStream || audioContext) stopDictation();
  if (model) model.terminate();
  model = null;
  setStatus('Motor liberado y memoria de Vosk liberada. La transcripción permanece en el campo.');
  updateControls();
}

loadButton.addEventListener('click', loadEngine);
startButton.addEventListener('click', startDictation);
stopButton.addEventListener('click', () => {
  stopDictation();
  setStatus(transcriptField.value.trim()
    ? 'Dictado detenido. Revisá y corregí la transcripción antes de incorporarla.'
    : 'Dictado detenido sin texto reconocido.');
});
releaseButton.addEventListener('click', releaseEngine);
transcriptField.addEventListener('input', () => { committedText = transcriptField.value; });

window.addEventListener('pagehide', () => {
  stopDictation();
  if (model) model.terminate();
  model = null;
}, { once: true });

updateControls();
