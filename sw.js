// Service worker mínimo para mantener la capacidad de instalación PWA
// y mostrar notificaciones locales. No intercepta solicitudes de red ni
// utiliza Cache Storage: los recursos se gestionan directamente por el navegador.
self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});
