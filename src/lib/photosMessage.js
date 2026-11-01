// Photos jointes à un message de cliente (01/11/2026, gérant : « je reçois pas les photos
// qu'ils m'envoient »). Les formulaires du site (Contact, « Une question ? », « Faire une
// demande particulière », page « Répondre ») envoient les photos par /api/upload, puis
// seulement leurs identifiants. Partagé serveur ET navigateur : rien d'autre que du texte ici.
export const PHOTOS_MAX = 3;

// Identifiants Firestore des téléversements (/api/upload → siteUploads/<id>).
export function nettoyerPhotos(liste) {
  if (!Array.isArray(liste)) return [];
  const vus = new Set();
  const out = [];
  for (const x of liste) {
    const id = String(x || "").trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id) || vus.has(id)) continue;
    vus.add(id); out.push(id);
    if (out.length >= PHOTOS_MAX) break;
  }
  return out;
}

export function urlPhoto(id, site = "") {
  return `${String(site || "").replace(/\/$/, "")}/api/img/${encodeURIComponent(id)}`;
}
