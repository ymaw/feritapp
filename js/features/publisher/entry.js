import { initGarmentPublisher } from './garment-publisher.js';
import { initAudioVisualizer } from './audio-visualizer.js';

document.addEventListener('DOMContentLoaded', function () {
  initAudioVisualizer();
  initGarmentPublisher({ showToast: function () {} });
});
