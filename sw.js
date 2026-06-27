const CACHE_NAME = 'courtpos-v4';
const ASSETS = [
  '/Court-Pos/',
  '/Court-Pos/index.html',
  '/Court-Pos/manifest.json',
  '/Court-Pos/icons/icon-192x192.png',
  '/Court-Pos/icons/icon-512x512.png',
  '/Court-Pos/icons/icon-192x192-maskable.png',
  '/Court-Pos/icons/icon-512x512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip Google API calls — never cache these
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/Court-Pos/index.html'));
    })
  );
});
