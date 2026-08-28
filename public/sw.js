// The production build replaces this development fallback with a versioned
// worker whose shell list is generated from the emitted assets.
const CACHE = 'lesson-replay-site-development';
const SHELL = ['/', '/privacy/', '/terms/', '/site.css', '/legal.css', '/main.ts', '/assets/replay-bench.avif', '/assets/replay-bench.webp', '/icons/icon-32.png', '/icons/icon-128.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(event.request, { ignoreSearch: true, ignoreVary: true })) || caches.match('/')));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) void caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => new Response('Unavailable while offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
});
