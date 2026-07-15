const CACHE_NAME = 'ppl-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ppl-icon-192.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap',
];

// Install: cache les ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch(() => {
        // Si une ressource fail (ex: icon manquante), continuer quand même
        console.warn('Some resources failed to cache');
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: nettoie les anciens caches
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

// Fetch: cache-first strategy (offline-first)
self.addEventListener('fetch', (event) => {
  // Ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourner depuis le cache si dispo
      if (response) return response;

      // Sinon, fetch et mettre en cache
      return fetch(event.request).then((response) => {
        // Ne pas cacher les réponses non-ok
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline: retourner une page de fallback si besoin
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
