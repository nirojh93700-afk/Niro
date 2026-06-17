"use client";

// =============================================================================
// Compteur de visites intégré (façon Shopify) — version FRUGALE.
// -----------------------------------------------------------------------------
// Envoie un minuscule "beacon" au serveur uniquement pour les événements utiles
// (visite, vue produit, ajout panier, paiement, achat). Conçu pour rester dans
// le quota GRATUIT de Firebase :
//   - n'écrit QUE depuis un vrai navigateur (les robots sans JS n'écrivent rien),
//   - dédoublonne par session (1 seule visite, 1 seule vue par produit),
//   - aucune donnée personnelle.
// Échoue toujours en silence : ne casse jamais le site.
// =============================================================================
export function track(event, data = {}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ event, slug: data.slug, value: data.value });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    // ignore
  }
}

// N'envoie un événement qu'une seule fois par session (évite les écritures
// répétées : la même visite, le même produit revu ne comptent qu'une fois).
export function trackOnce(token, event, data = {}) {
  if (typeof window === "undefined") return;
  try {
    const key = "niv-trk-" + token;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage indisponible : on envoie quand même (rare)
  }
  track(event, data);
}
