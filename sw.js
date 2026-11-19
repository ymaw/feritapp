// Service worker mínimo para mantener la capacidad de instalación PWA
// y mostrar notificaciones locales. No intercepta solicitudes de red ni
// utiliza Cache Storage: los recursos se gestionan directamente por el navegador.
self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  // No borrar caches del origen: pueden pertenecer a otras partes de la aplicación
  // o a recursos compartidos. Este worker no crea ni administra caches propias.
  event.waitUntil(self.clients.claim());
});
