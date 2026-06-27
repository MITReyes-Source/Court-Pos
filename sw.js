const CACHE_NAME = 'courtpos-v3';
const BASE = '/Court-Pos';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-72.png',
  BASE + '/icons/icon-96.png',
  BASE + '/icons/icon-128.png',
  BASE + '/icons/icon-144.png',
  BASE + '/icons/icon-152.png',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-384.png',
  BASE + '/icons/icon-512.png',
  BASE + '/icons/icon-192-maskable.png',
  BASE + '/icons/icon-512-maskable.png',
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.log('Cache install error:', err);
        self.skipWaiting();
      })
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for assets, network first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Google Sheets API calls — always go to network
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com')) {
    return; // let browser handle it normally
  }

  // For everything else: try cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          // Cache valid responses
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — return cached index
          if (event.request.destination === 'document') {
            return caches.match(BASE + '/index.html');
          }
        });
    })
  );
});

// Background sync message
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
