// DISPOSITION DU TEXTE VUE PAR LA CLIENTE SUR L'APERÇU 3D (03/11/2026, commande 0QEIXDI5, Vanessa Gorgol :
// l'aperçu de la plaque passait « Axandre Maxim » sur DEUX lignes, la commande ne gardait que le texte tapé,
// sur une ligne, et l'atelier l'a lu « côte à côte »). Gérant : « il faut que ce soit comme le client veut ».
//
// Chaque aperçu 3D (plaque, enveloppe, médaillons, gourmette) note ici les lignes qu'il vient de dessiner
// pour un texte ; à l'ajout au panier, la fiche retrouve les lignes de chaque champ et les range dans la
// commande (`spec.apercuLignes = { recto: ["Axandre", "Maxim"], … }`). L'atelier les affiche telles quelles.

const NOTES = new Map();

function norm(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}

/** Appelé par un aperçu 3D chaque fois qu'il dessine un texte. */
export function noterLignes(texte, lignes) {
  const t = norm(texte);
  if (!t || !Array.isArray(lignes) || !lignes.length) return;
  NOTES.delete(t); // le dernier dessin est celui que la cliente voit
  NOTES.set(t, lignes.map((l) => String(l)));
  if (NOTES.size > 300) NOTES.delete(NOTES.keys().next().value);
}

/** Lignes notées pour chaque champ texte des réglages ; null si aucun. */
export function lignesPourChamps(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (typeof v !== "string") continue;
    const l = NOTES.get(norm(v));
    if (l && l.length) out[k] = l;
  }
  return Object.keys(out).length ? out : null;
}

/** Type d'aperçu 3D d'un produit (même ordre de priorité que la fiche produit). */
export function genreApercu(product) {
  if (!product || product.model3d) return null;
  if (product.engraveGourmette3d || product.engraveSilicone3d || product.engraveLeather3d || product.engraveBar3d) return "gourmette";
  if (product.engravePlate3d) return "plaque";
  if (product.engraveEnvelope3d) return "enveloppe";
  if (product.engraveBook3d) return "livre";
  if (product.engraveHeart3d) return "coeur";
  return null;
}

/** Champs texte que dessine chaque aperçu, dans l'ordre des faces. */
export const CHAMPS_APERCU = {
  gourmette: ["texte"],
  plaque: ["recto", "verso"],
  enveloppe: ["recto", "verso"],
  livre: ["couverture", "page1", "page2", "page3"],
  coeur: ["cover", "page1", "page2", "page3", "backcover"],
};
