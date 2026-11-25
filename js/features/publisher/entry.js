import { initGarmentPublisher } from './garment-publisher.js';
import { initAudioVisualizer } from './audio-visualizer.js';

let initialized = false;

const REQUIRED_PUBLISHER_ELEMENTS = [
  'publisherCategory',
  'publisherPhoto',
  'publisherCamera',
  'publisherPhotoPreview',
  'publisherPostText',
  'publisherDictationStart',
  'publisherDictationStop',
  'publisherTranscript',
  'publisherDictationStatus',
  'publisherUseTranscript',
  'publisherMeasurements'
];

function hasPublisherDom() {
  return REQUIRED_PUBLISHER_ELEMENTS.every(function(id) {
    return document.getElementById(id);
  });
}

function initializePublisher() {
  if (initialized || !hasPublisherDom()) return false;

  // Marcar como inicializado solamente después de confirmar que el DOM
  // completo del publicador está disponible. Si el módulo se evalúa antes
  // de que termine de parsearse el HTML, DOMContentLoaded volverá a intentarlo.
  initAudioVisualizer();
  initGarmentPublisher({ showToast: function () {} });
  initialized = true;
  return true;
}

// Intento inmediato para documentos ya parseados y reintento al finalizar
// el parseo para cubrir cargas de módulos que comiencen mientras readyState
// todavía sea "loading". La protección evita una doble inicialización.
document.addEventListener('DOMContentLoaded', initializePublisher, { once: true });
initializePublisher();
