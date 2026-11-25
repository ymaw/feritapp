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

// DOMContentLoaded solo se espera mientras el documento sigue cargándose.
// En estado "interactive" el evento ya pudo haberse disparado; registrarse
// entonces dejaría al publicador sin inicializar hasta una navegación nueva.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePublisher, { once: true });
} else {
  initializePublisher();
}
