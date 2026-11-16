/* Офлайн-робота: при наявності інтернету береться свіжа версія (оновлення), без інтернету — збережена копія. */
const CACHE = 'pervynnyi-ohliad-v0.9.3.136';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin){
    // мережа першою — щоб оновлення приходили одразу; помилка мережі або сервера — збережена копія
    e.respondWith(fetch(r).then(res => {
      if (res.ok){ const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; }
      return caches.match(r).then(m => m || res);
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
  }
});
