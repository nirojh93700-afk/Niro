// Mémoire partagée entre les écrans de Gestion (02/10/2026).
// Revenir sur un écran déjà vu = affichage IMMÉDIAT des dernières données connues,
// puis mise à jour silencieuse derrière (« stale-while-revalidate »).
// · en mémoire (survit aux changements d'écran) + sessionStorage (survit à un rechargement
//   de page, s'efface à la fermeture de l'onglet / de l'appli) ;
// · jamais bloquant : stockage plein ou indisponible → simple chargement réseau ;
// · rien d'écrit sur le serveur, rien de partagé entre navigateurs.
const mem = new Map();
const PREFIXE = "niv-cache:";
const DUREE = 6 * 60 * 60 * 1000; // au-delà de 6 h, on n'affiche plus l'ancienne version

export function lireCache(url) {
  const m = mem.get(url);
  if (m && Date.now() - m.at < DUREE) return m.data;
  try {
    const raw = sessionStorage.getItem(PREFIXE + url);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || Date.now() - v.at > DUREE) return null;
    mem.set(url, v);
    return v.data;
  } catch { return null; }
}

export function ecrireCache(url, data) {
  const v = { at: Date.now(), data };
  mem.set(url, v);
  try { sessionStorage.setItem(PREFIXE + url, JSON.stringify(v)); } catch { /* plein : la mémoire suffit */ }
}

export function viderCache() {
  mem.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIXE)) sessionStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

/**
 * Affiche tout de suite la version connue (si elle existe) puis la version fraîche.
 * `onData(data, depuisCache)` est appelé 1 ou 2 fois. Renvoie { ok, status, data }.
 */
export async function chargerAvecCache(url, adminKey, onData, init = {}) {
  const connu = lireCache(url);
  if (connu != null) { try { onData(connu, true); } catch { /* ignore */ } }
  let r;
  try {
    r = await fetch(url, { ...init, headers: { ...(init.headers || {}), "x-admin-key": adminKey } });
  } catch (e) {
    return { ok: false, status: 0, data: connu, reseau: true, error: e };
  }
  if (!r.ok) return { ok: false, status: r.status, data: connu };
  const data = await r.json();
  ecrireCache(url, data);
  try { onData(data, false); } catch { /* ignore */ }
  return { ok: true, status: r.status, data };
}
