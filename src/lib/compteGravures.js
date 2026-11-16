// Combien de choses à graver, par article d'une commande (récap en haut de la fiche commande).
// Lit les consignes de l'atelier (consignesGravure) : un texte, une photo, un dessin, un modèle,
// une lettre, un motif choisi = 1 gravure. Les réglages (police, sens, emplacement) ne comptent pas.
import { consignesGravure } from "@/lib/consignesGravure";

const QUOI = /photo|logo|dessin|motif|mod[eè]le|lettre|image|cadre|initiale|pr[ée]nom|date|texte|message|nom|n°/i;
const REGLAGE = /^(police|écriture|sens|emplacement|langue|th[eè]me|coffret|emballage|couleur|taille|format|forme|o[uù] placer|place du|placer|d[ée]cor|texte tap[ée])/i;

function elementsDe(lignes, face) {
  const out = [];
  for (const l of lignes || []) {
    const v = String(l.v ?? "").trim();
    if (!v || /^aucun/i.test(v)) continue;
    if (REGLAGE.test(String(l.k || ""))) continue;
    if (l.texte || l.img || QUOI.test(String(l.k || ""))) out.push({ face, quoi: String(l.k || "").split(" · ")[0], valeur: v, texte: Boolean(l.texte) });
  }
  return out;
}

export function compteGravures(item) {
  let c;
  try { c = consignesGravure(item); } catch { return { n: 0, faces: [], elements: [] }; }
  const elements = [];
  for (const g of c.general || []) if (/^mod[eè]le/i.test(g.k)) elements.push({ face: "", quoi: g.k, valeur: g.v, texte: false });
  for (const f of c.faces || []) elements.push(...elementsDe(f.lignes, f.nom));
  elements.push(...elementsDe(c.autres, ""));
  // Photo envoyée par la cliente (cristal, verre, porte-clés…) : une gravure, si les consignes ne l'ont pas déjà.
  const ch = item?.fields || {};
  if (!elements.some((e) => /photo|logo/i.test(e.quoi))) {
    if (ch.photo || item?.photoSrc) elements.unshift({ face: ch.photoFond ? "Face avant" : "", quoi: "Photo", valeur: "envoyée par la cliente", texte: false });
    if (ch.photoFond) elements.push({ face: "Fond du verre", quoi: "Photo", valeur: "envoyée par la cliente", texte: false });
  }
  const faces = [...new Set(elements.map((e) => e.face).filter(Boolean))];
  return { n: elements.length, faces, elements };
}

/** Nombre de pièces physiques d'une ligne (Lot de 4 × 2 = 8). */
export function piecesDeLigne(ligne, spec) {
  const q = Number(ligne?.quantity) || 1;
  const m = String(spec?.variantTitle || ligne?.details || "").match(/lot de (\d+)/i);
  return q * (m ? Number(m[1]) : 1);
}

/** Ligne d'une commande sur devis (sans réglages) : « Prénom gravé « Elodie » » = 1 gravure. */
export function compteLigneDevis(ligne) {
  const nom = String(ligne?.name || "");
  return /grav/i.test(nom) && !/^(verre|cristal|carafe|flûte|collier|bracelet|carnet|gobelet)/i.test(nom)
    ? { n: 1, faces: [], elements: [{ face: "", quoi: "Gravure du devis", valeur: nom, texte: true }] }
    : { n: 0, faces: [], elements: [] };
}
