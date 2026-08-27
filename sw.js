// Service worker mínimo: solo lo necesario para que el navegador
// considere la app "instalable" (PWA). No cachea datos de Supabase,
// así que siempre vas a ver la información más actualizada.
const CACHE_NAME = 'registro-ventas-v1';
const SHELL_FILES = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Solo el "shell" estático se sirve desde caché; todo lo demás
  // (Supabase, fuentes, etc.) va siempre a la red.
  var url = new URL(event.request.url);
  if(url.origin === self.location.origin && SHELL_FILES.some(function(f){ return url.pathname.endsWith(f.replace('./','')); })){
    event.respondWith(
      caches.match(event.request).then(function(cached){
        return cached || fetch(event.request);
      })
    );
  }
});
