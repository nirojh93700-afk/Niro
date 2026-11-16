// Pages qui plantent dans le navigateur (« Application error ») :
// rechargement automatique après une mise à jour + rapport envoyé au serveur.
export function estErreurDeVersion(err) {
  const t = `${err?.name || ""} ${err?.message || ""}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(t);
}

// Recharge la page une seule fois par minute (jamais en boucle).
export function rechargerUneFois() {
  try {
    const k = "niv-recharge-erreur";
    const avant = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - avant < 60000) return false;
    sessionStorage.setItem(k, String(Date.now()));
  } catch { /* stockage refusé : on recharge quand même une fois */ }
  window.location.reload();
  return true;
}

export function signalerErreur(err, origine) {
  try {
    const corps = JSON.stringify({
      message: String(err?.message || err || "").slice(0, 500),
      nom: String(err?.name || "").slice(0, 80),
      pile: String(err?.stack || "").slice(0, 1500),
      digest: String(err?.digest || "").slice(0, 80),
      page: String(location.pathname + location.search).slice(0, 300),
      navigateur: String(navigator.userAgent || "").slice(0, 300),
      origine: String(origine || "").slice(0, 40),
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/erreur-page", new Blob([corps], { type: "application/json" }));
    else fetch("/api/erreur-page", { method: "POST", body: corps, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch { /* jamais bloquant */ }
}
