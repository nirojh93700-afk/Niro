/* Service worker — Voyage Inde
   Cache-first pour toute l'app (page, manifest, icônes, polices) -> s'ouvre même en avion.
   Ne touche PAS au réseau du carnet (kvdb, autre origine) : la sync passe toujours en direct. */
var CACHE = "voyage-inde-v53";
var ASSETS = [
  "./", "./index.html", "./manifest.json", "./fonts.css", "./qr.png",
  "./lib/leaflet.js", "./lib/leaflet.css",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "./fonts/f0.woff2", "./fonts/f1.woff2", "./fonts/f2.woff2", "./fonts/f3.woff2",
  "./fonts/f4.woff2", "./fonts/f5.woff2", "./fonts/f6.woff2", "./fonts/f7.woff2", "./fonts/f8.woff2",
  "./photos/chennai.jpg", "./photos/tirupati.jpg", "./photos/mahabalipuram.jpg", "./photos/pondicherry.jpg",
  "./photos/velankanni.jpg", "./photos/madurai.jpg", "./photos/thekkady.jpg", "./photos/munnar.jpg",
  "./photos/alleppey.jpg", "./photos/kochi.jpg"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;                       // laisse passer les PUT/GET du carnet
  var url;
  try { url = new URL(req.url); } catch(_) { return; }
  if(url.origin !== self.location.origin) return;        // ne cache pas le carnet en ligne (kvdb)

  if(req.mode === "navigate"){                           // ouverture de l'app -> page en cache (hors ligne)
    e.respondWith(caches.match("./index.html").then(function(r){ return r || fetch(req); }));
    return;
  }

  e.respondWith(                                         // assets locaux : cache d'abord
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(resp){
        if(resp && resp.ok){ var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
        return resp;
      }).catch(function(){ return r; });
    })
  );
});
