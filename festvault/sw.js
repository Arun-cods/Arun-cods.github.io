// FestVault Service Worker for Android Standalone App & Play Store Instant OTA Updates
const CACHE_NAME = 'festvault-v10-live';
const ASSETS_TO_CACHE = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass API requests directly to network
  if (url.pathname.startsWith('/api') || url.hostname.includes('emailjs.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first strategy for fast OTA live updates
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
