const CACHE_NAME = 'budget-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Кешуємо найнеобхідніше для офлайн-запуску
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './icon-192x192.png',
        './icon-512x512.png'
      ]);
    })
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

  event.respondWith(
    fetch(event.request).then((response) => {
      // При успішному мережевому запиті оновлюємо кеш (Network First)
      const resClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, resClone);
      });
      return response;
    }).catch(() => {
      // Якщо інтернету немає – дістаємо сторінку з кешу (Offline Fallback)
      return caches.match(event.request).then((response) => {
        if (response) return response;
        // Для будь-якої HTML-сторінки (navigate) завжди віддаємо index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
