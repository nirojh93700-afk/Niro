// =============================================================================
// VISIBILITÉ PAR CATÉGORIE / RAYON (22/10/2026, gérant : « si j'ai envie de masquer toute
// la catégorie lampe, bougeoir… pas que les produits »). Pur : aucune lecture de base ici.
// -----------------------------------------------------------------------------
// Réglage (section `visibilite` du catalogue) :
//   { univers: { maison: { at } }, rayons: { "maison:bougeoirs": { at } } }
// Une catégorie masquée retire TOUS ses produits (ses rayons + les créations rangées
// chez elle par leur catégorie) et son onglet du menu. Un rayon masqué retire ses produits.
// Un produit présent dans un rayon masqué disparaît du site entier (il n'a qu'une fiche),
// même s'il est aussi rangé ailleurs. Le « masqué seul » (Produits & stock) n'est pas touché :
// réafficher un groupe ne republie jamais un produit masqué seul.
// =============================================================================
import { UNIVERS, CAT_VERS_UNIVERS } from "./univers";

const sansAccents = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
export const cleRayon = (uid, nom) =>
  `${uid}:${sansAccents(nom).toLowerCase().replace(/&/g, " et ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// Produits de chaque rayon, sans dédoublonnage (un produit peut être dans plusieurs rayons).
export function rayonsDe(products) {
  const parSlug = new Map((products || []).map((p) => [p.slug, p]));
  const out = [];
  const range = new Set();
  for (const u of UNIVERS) {
    u.rayons.forEach((r) => {
      if (r.bientot) return;
      let slugs = r.slugs ? r.slugs.filter((s) => parSlug.has(s)) : (products || []).filter((p) => { try { return r.regle(p); } catch { return false; } }).map((p) => p.slug);
      slugs = [...new Set(slugs)];
      slugs.forEach((s) => range.add(s));
      out.push({ uid: u.id, unom: u.nom, cle: cleRayon(u.id, r.nom), nom: r.nom, slugs });
    });
  }
  // Créations rangées dans aucun rayon : rayon « Autres créations » de l'univers de leur catégorie.
  for (const p of products || []) {
    if (range.has(p.slug)) continue;
    const uid = CAT_VERS_UNIVERS[p.category] || "cadeaux";
    const u = UNIVERS.find((x) => x.id === uid);
    let r = out.find((x) => x.uid === uid && x.autres);
    if (!r) { r = { uid, unom: u?.nom || uid, cle: cleRayon(uid, "Autres créations"), nom: "Autres créations", slugs: [], autres: true }; out.push(r); }
    r.slugs.push(p.slug);
  }
  return out;
}

const masque = (bloc, cle) => Boolean(bloc && bloc[cle]);
export const universMasque = (vis, uid) => masque(vis?.univers, uid);
export const rayonMasque = (vis, cle) => masque(vis?.rayons, cle);

// slug → raison (« catégorie Maison & Déco » / « rayon Bougeoirs ») pour chaque produit retiré par un groupe.
export function retiresParGroupe(products, vis) {
  const out = new Map();
  if (!vis || (!Object.keys(vis.univers || {}).length && !Object.keys(vis.rayons || {}).length)) return out;
  for (const r of rayonsDe(products)) {
    const raison = universMasque(vis, r.uid) ? `catégorie ${r.unom}` : rayonMasque(vis, r.cle) ? `rayon ${r.nom}` : "";
    if (!raison) continue;
    for (const s of r.slugs) if (!out.has(s)) out.set(s, raison);
  }
  return out;
}

// Ne garde que des clés connues, une date par clé (fusion, jamais de remplacement en bloc côté serveur).
export function nettoyerVisibilite(v) {
  const ids = new Set(UNIVERS.map((u) => u.id));
  const out = { univers: {}, rayons: {} };
  for (const [k, x] of Object.entries(v?.univers || {})) if (ids.has(k) && x) out.univers[k] = { at: String(x.at || "") };
  for (const [k, x] of Object.entries(v?.rayons || {})) if (/^[a-z]+:[a-z0-9-]+$/.test(k) && ids.has(k.split(":")[0]) && x) out.rayons[k] = { at: String(x.at || "") };
  return out;
}
