/* Service worker — Diogo Gomes portfólio (PWA) */
const CACHE = 'dg-portfolio-v3';
const CORE = [
  '/index.html',
  '/projects.html',
  '/blog/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/img/DIo.jpeg',
  '/assets/img/icon-192.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Não interceptar terceiros (YouTube, GoatCounter, fontes, etc.)
  if (url.origin !== self.location.origin) return;

  // HTML: network-first (conteúdo sempre fresco; offline cai no cache)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Estáticos (CSS/JS/imagens): stale-while-revalidate.
  // Serve do cache (rápido) e, em paralelo, busca a versão nova e atualiza o
  // cache — assim correções de JS/CSS chegam ao usuário no carregamento seguinte
  // sem depender de trocar o nome do cache a cada deploy.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
