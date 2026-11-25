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

  initAudioVisualizer();
  initGarmentPublisher({ showToast: function () {} });
  initialized = true;
  return true;
}

// El módulo se evalúa antes de DOMContentLoaded. La aplicación principal
// registra primero su arranque en ese evento; inicializar el publicador
// después evita competir con la preparación inicial de las vistas.
if (document.readyState === 'complete') {
  initializePublisher();
} else {
  document.addEventListener('DOMContentLoaded', initializePublisher, { once: true });
}
