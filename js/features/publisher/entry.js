import { initGarmentPublisher } from './garment-publisher.js';
import { initAudioVisualizer } from './audio-visualizer.js';

let initialized = false;
let initializing = false;
let domObserver = null;

const REQUIRED_PUBLISHER_ELEMENTS = [
  'viewPublisher',
  'publisherCategory',
  'publisherPhoto',
  'publisherCamera',
  'publisherChoosePhoto',
  'publisherTakePhoto',
  'publisherPhotoPreview',
  'publisherPostText',
  'publisherFeedback',
  'publisherQueuedGarments',
  'publisherDictationStart',
  'publisherDictationStop',
  'publisherTranscript',
  'publisherDictationStatus',
  'publisherUseTranscript',
  'publisherMeasurements',
  'publisherAddGarment',
  'publisherGenerate',
  'publisherCopy',
  'publisherShare',
  'publisherOpenPreview',
  'publisherClosePreview',
  'publisherPreviewModal',
  'publisherPreviewModalContent',
  'publisherAudioVisualizer',
  'publisherAudioLevel'
];

function getMissingPublisherElements() {
  return REQUIRED_PUBLISHER_ELEMENTS.filter(function(id) {
    return !document.getElementById(id);
  });
}

function setInitializationState(state, detail) {
  document.documentElement.dataset.publisherInitState = state;
  if (detail) {
    document.documentElement.dataset.publisherInitDetail = detail;
  } else {
    delete document.documentElement.dataset.publisherInitDetail;
  }
}

function initializePublisher() {
  if (initialized || initializing) return initialized;

  const missingElements = getMissingPublisherElements();
  if (missingElements.length) {
    setInitializationState('waiting-for-dom', missingElements.join(','));
    return false;
  }

  initializing = true;
  setInitializationState('initializing');

  try {
    initAudioVisualizer();
    initGarmentPublisher({ showToast: function () {} });
    initialized = true;
    setInitializationState('initialized');
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setInitializationState('failed', message.slice(0, 240));
    console.error('[FeritApp] No se pudo inicializar el Publicador:', error);
    return false;
  } finally {
    initializing = false;
  }
}

// El módulo puede ejecutarse antes o después de DOMContentLoaded. No asumimos
// que readyState por sí solo garantice que todos los nodos del Publicador existan:
// si el HTML llega de forma progresiva, esperamos a que estén disponibles.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePublisher, { once: true });
}

if (document.documentElement && typeof MutationObserver !== 'undefined') {
  domObserver = new MutationObserver(initializePublisher);
  domObserver.observe(document.documentElement, { childList: true, subtree: true });
}

window.addEventListener('load', initializePublisher, { once: true });
initializePublisher();
