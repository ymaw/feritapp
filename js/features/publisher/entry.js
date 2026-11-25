import { initGarmentPublisher } from './garment-publisher.js';
import { initAudioVisualizer } from './audio-visualizer.js';

let initialized = false;

function initializePublisher() {
  if (initialized) return;
  initialized = true;

  initAudioVisualizer();
  initGarmentPublisher({ showToast: function () {} });
}

// Los módulos pueden terminar de evaluarse después de DOMContentLoaded.
// En ese caso, esperar el evento dejaría el publicador sin inicializar.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePublisher, { once: true });
} else {
  initializePublisher();
}
