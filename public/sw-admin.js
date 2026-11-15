// Service worker de l'application « Niv Admin » (02/10/2026) : uniquement les alertes
// sur le téléphone (nouvelle commande, réponse de cliente). Aucune mise en cache de pages.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: "Niv Création", body: event.data ? event.data.text() : "" }; }
  const titre = d.title || "Niv Création";
  // Chiffre sur l'icône de l'application (15/11/2026) : iPhone 16.4+ et navigateurs qui le savent.
  try {
    if (typeof d.badge === "number" && self.navigator && self.navigator.setAppBadge) {
      if (d.badge > 0) self.navigator.setAppBadge(d.badge).catch(() => {}); else self.navigator.clearAppBadge().catch(() => {});
    }
  } catch (e) { /* ignore */ }
  event.waitUntil(self.registration.showNotification(titre, {
    body: d.body || "",
    tag: d.tag || undefined,
    icon: "/gestion/icon",
    badge: "/gestion/icon",
    data: { url: d.url || "/gestion" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/gestion";
  event.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of fenetres) {
      if (w.url.includes("/gestion")) { await w.focus(); try { await w.navigate(url); } catch { /* ignore */ } return; }
    }
    await self.clients.openWindow(url);
  })());
});
