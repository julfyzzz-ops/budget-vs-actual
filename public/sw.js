self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Базовий обробник fetch необхідний для того, щоб Chrome та Android 
  // сприймали додаток як повноцінний PWA і дозволили його встановлення.
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Offline', { status: 200, statusText: 'Offline representation' });
  }));
});
