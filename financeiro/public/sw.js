const CACHE_NAME = 'financeiroapp-cache-v1.0.0';

// Arquivos básicos para cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/wallet.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Forçar ativação imediata do novo Service Worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpar caches antigos
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

// Estratégia Stale-While-Revalidate (Serve rápido do cache e atualiza por trás)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições de API e externas não HTTP/HTTPS
  if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((response) => {
        // Se a resposta for válida, clonar e colocar no cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Silenciar falhas de rede se o arquivo já estiver no cache
        return cachedResponse;
      });

      return cachedResponse || networkFetch;
    })
  );
});
