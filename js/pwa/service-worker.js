export function registerServiceWorker({
  windowRef = window,
  navigatorRef = navigator
} = {}) {
  if (!('serviceWorker' in navigatorRef)) return;
  windowRef.addEventListener('load', function() {
    navigatorRef.serviceWorker.register('sw.js').catch(function() {
      // Si falla el registro, la app sigue funcionando sin instalación PWA.
    });
  });
}
