const CACHE = 'limad-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only cache same-origin GET requests. Leave cross-origin calls
  // (AI Coach / Telegram backup / anything else) untouched so they
  // always go straight to the network, online or not.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  // Network-first: always try to get the freshest version when online.
  // Only fall back to the cached copy if the network request fails
  // (e.g. offline). This way a new deploy shows up immediately instead
  // of getting stuck behind an old cached version.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
