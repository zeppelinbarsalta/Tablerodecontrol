const CACHE_NAME = 'tablero-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './zeppelin-logo.png',
  './sexshop-logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear la API de Google Sheets ni requests externos
  if (url.hostname.includes('script.google.com') || url.hostname.includes('google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para el resto: cache primero, luego red
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request).then((response) => {
        // Solo cachear assets locales exitosos
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});
