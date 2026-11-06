// FestVault Service Worker for Android Standalone App & Play Store Instant OTA Updates
const CACHE_NAME = 'festvault-v7-live';
const ASSETS_TO_CACHE = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old FestVault cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass non-GET directly to network
  if (event.request.method !== 'GET') {
    return;
  }

  // HTML documents & API calls: ALWAYS NETWORK ONLY to ensure instant updates without caching leaks
  const url = event.request.url;
  if (event.request.mode === 'navigate' || url.endsWith('.html') || url.includes('/api/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets (images, icons): Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone).catch(() => {}));
        }
        return res;
      });
    })
  );
});
