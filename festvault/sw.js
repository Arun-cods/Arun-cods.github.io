// FestVault Service Worker for Android PWA & Play Store Instant OTA Updates
const CACHE_NAME = 'festvault-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass API requests, uploads, and non-GET directly to network
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('/uploads/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-first: Always fetch latest version from the live server so updates apply seamlessly.
  // Falls back to offline cache only when device has no internet connection.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
