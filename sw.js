/* Offline support: keeps a copy of the game on the phone so it opens without signal.
   The game's own files are fetched fresh when the network answers quickly (so updates arrive on their own),
   and come from the phone's copy when it doesn't. Fonts and icons never change, so they always come from the copy.
   Bump CACHE when files are renamed or removed, so phones drop the old copy. */
const CACHE = "pyramid-v75";
const FONTS = ["barlow-condensed-latin-500", "barlow-condensed-latin-600", "barlow-condensed-latin-700", "barlow-condensed-latin-ext-500", "barlow-condensed-latin-ext-600", "barlow-condensed-latin-ext-700",
  "barlow-latin-400", "barlow-latin-500", "barlow-latin-600", "barlow-latin-700", "barlow-latin-ext-400", "barlow-latin-ext-500", "barlow-latin-ext-600", "barlow-latin-ext-700",
  "big-shoulders-display-latin", "big-shoulders-display-latin-ext"].map(f => `fonts/${f}.woff2`);
const FILES = ["./", "index.html", "game.css", "game.js", "account.js", "matchcentre.js", "sound.js", "moments.js", "targets.js", "shop.js", "squads.js", "league.js", "cups.js", "europe.js", "tournament.js", "drills.js", "labgames.js", "p90.js", "lab.js", "crests.js", "g3d.js", "vendor/three.min.js", "vendor/GLTFLoader.js", "vendor/SkeletonUtils.js", "vendor/people/sm02.glb", "vendor/people/sm03.glb", "vendor/people/gaits.glb", "vendor/people/m301_body.jpg", "vendor/people/m301_head.jpg", "vendor/people/m007_head.jpg", "vendor/people/m006_head.jpg", "vendor/people/m017_head.jpg", "vendor/people/m019_head.jpg", "vendor/people/m003_head.jpg", "vendor/people/m013_head.jpg", "vendor/people/m001_head.jpg", "vendor/people/m301_body_n.jpg", "vendor/people/m301_head_n.jpg", "vendor/people/m300_body.jpg", "vendor/people/m300_head.jpg", "vendor/people/m300_body_n.jpg", "vendor/people/m300_head_n.jpg", "vendor/people/m300_hair.png", "manifest.webmanifest", "fonts/fonts.css",
  "icons/favicon-64.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", ...FONTS];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const fresh = async (req, key) => {
  const res = await fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
  if (res.ok) { const c = await caches.open(CACHE); await c.put(key || req, res.clone()); }
  return res;
};
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const page = req.mode === "navigate";
  const key = page ? "./" : req;
  if (!page && /\/(fonts|icons)\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fresh(req)));
    return;
  }
  // network first, but give up after 3s on a bad connection and use the phone's copy
  e.respondWith((async () => {
    const net = fresh(req, key);
    net.catch(() => {});
    const timeout = new Promise(r => setTimeout(r, 3000));
    try {
      const res = await Promise.race([net, timeout]);
      if (res) return res;
    } catch (err) {}
    const hit = await caches.match(key, { ignoreSearch: page });
    return hit || net;
  })());
});
