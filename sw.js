// Service worker mínimo: solo lo necesario para que el navegador
// considere la app "instalable" (PWA). NO guarda nada en caché,
// así que cada vez que entrás se piden los archivos actualizados
// a la red. Esto evita quedarte con una versión vieja de la app.
self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  // Borra cualquier caché vieja que haya quedado de versiones
  // anteriores de este service worker.
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Siempre a la red, nunca desde caché.
  event.respondWith(fetch(event.request));
});
