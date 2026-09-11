/* Duo — service worker.
   IMPORTANT : incrémenter SW_VERSION à chaque modification de index.html,
   sinon les appareils gardent l'ancienne version en cache. */

const SW_VERSION = 'duo-v2';

const COQUILLE = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SW_VERSION)
      .then((c) => c.addAll(COQUILLE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Firebase et les polices : toujours le réseau, jamais de cache.
  if (e.request.method !== 'GET'
      || url.hostname.includes('firebase')
      || url.hostname.includes('googleapis')
      || url.hostname.includes('gstatic')) {
    return;
  }

  // Le reste : réseau d'abord, cache en secours si hors ligne.
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        const copie = rep.clone();
        caches.open(SW_VERSION).then((c) => c.put(e.request, copie)).catch(() => {});
        return rep;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
