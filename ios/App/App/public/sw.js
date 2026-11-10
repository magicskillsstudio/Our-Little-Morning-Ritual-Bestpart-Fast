/**
 * Our Little Morning Ritual Bestpart ❤️
 * Service Worker — Offline-First Cache Strategy
 */

const CACHE_NAME = 'morning-ritual-v4';

// Essential assets cached during Service Worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/audio/our_beautiful_morning.wav',
  '/audio/romantic_piano.wav',
  '/audio/endless_love.wav',
  '/audio/morning_embrace.wav',
  '/audio/sweet_romance.wav',
  '/audio/loves_sunrise.wav',
  '/audio/forever_together.wav',
  '/audio/golden_memories.wav',
  '/audio/heavens_melody.wav',
  '/audio/tender_hearts.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache all essential app assets and WAV tracks
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW Precache non-critical note:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 0. EXPLICIT BYPASS: Never intercept or cache administrative API or auth endpoints
  if (url.pathname.startsWith('/api/owner')) {
    return;
  }

  // 1. Google Fonts CacheFirst Strategy
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 200, statusText: 'OK' });
        });
      })
    );
    return;
  }

  // 2. NetworkFirst Strategy for HTML Navigation Requests (prevents stale index.html white screen)
  const isHTMLRequest = event.request.mode === 'navigate' || 
                        (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHTMLRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback to cached index.html
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Cache First Strategy with smooth network fallback for audio, images, static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Safe fallback for failed asset fetches
      });
    })
  );
});
