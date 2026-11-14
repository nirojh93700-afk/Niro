// =============================================================================
// LA PIÈCE À PRENDRE DANS LE STOCK POUR GRAVER UN ARTICLE (14/11/2026)
// -----------------------------------------------------------------------------
// Gérant, commande d'un verre à whisky Fête des pères : « c'est marqué où quel verre utiliser,
// quels centilitres ? Je cherche partout… je veux une case avec tout le détail, le verre, la commande ».
// Pur (pas de JSX) : le vrai verre (modèle du fournisseur, contenance, mesures), le nombre de pièces
// à graver (lot × quantité) et l'endroit. Les références fournisseur ne s'écrivent QUE dans Gestion.
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { emplacementDe, aEmplacement } from "@/lib/apercuCote";

const WHISKY = { nom: "Verre à whisky 30 cl", ref: "Tumbler Lario 30 cl (Metro)", mesures: "Ø 7,9 × H 9,3 cm, fond épais, paroi lisse" };

// slug → pièce ; une fonction quand la taille choisie change le verre.
const PIECES = {
  "verre-a-whisky-grave": (t) => (t === "20"
    ? { nom: "Verre à whisky 20 cl", ref: "Tumbler Lario 20 cl (Metro, réf. AAA0045442429)", mesures: "Ø 7 × H 8,35 cm, fond épais" }
    : WHISKY),
  "verre-a-whisky-fete-des-peres": () => WHISKY,
  "verre-a-cocktail-grave": (t) => (t === "33"
    ? { nom: "Verre à cocktail 33 cl", ref: "Grand verre long drink 33 cl (Metro)", mesures: "grand verre haut" }
    : { nom: "Verre à cocktail 17 cl", ref: "Verre à cocktail Lario 17 cl (Metro)", mesures: "forme haute, ≈ Ø 5,2 × H 12,5 cm" }),
  "verre-a-vin-grave": (t) => (t === "47"
    ? { nom: "Verre à vin 47 cl", ref: "Grand verre à vin 47 cl, coupe ronde (Metro)", mesures: "coupe ronde, pour les vins rouges" }
    : { nom: "Verre à vin 36 cl", ref: "Verre à vin Montese 36 cl, cristal (Metro)", mesures: "coupe tulipe" }),
  "flute-a-champagne-gravee": () => ({ nom: "Flûte à champagne 21 cl", ref: "Flûte Pinomaro 21 cl (Metro)", mesures: "Ø 6,3 × H 21,4 cm" }),
  "verre-tumbler-cristal-grave": (t) => (t === "39"
    ? { nom: "Grand tumbler 39 cl", ref: "Montese High Tumbler 39 cl, cristal (Metro)", mesures: "Ø 7 × H 14,4 cm" }
    : { nom: "Tumbler 37 cl", ref: "Montese Tumbler 37 cl, cristal (Metro)", mesures: "Ø 8,5 × H 10 cm, évasé" }),
  "carafe-a-whisky-gravee": () => ({ nom: "Carafe à whisky", ref: "Carafe en verre taillé, bouchon à facettes, base étoilée", mesures: "" }),
};

/** Nombre de pièces dans une option « Lot de N » (1 sinon). */
export function piecesParOption(titre) {
  const m = String(titre || "").match(/lot\s+de\s+(\d+)/i);
  return m ? Number(m[1]) : 1;
}

/**
 * item : réglages d'un article (spec) ; quantite : nombre d'options commandées (ligne de commande).
 * → { produit, option, nom, ref, mesures, couleur, nb, endroit } ou null.
 */
export function pieceAUtiliser(item, quantite = 1) {
  if (!item) return null;
  const p = getProductBySlug(item.slug);
  const v = (p?.variants || []).find((x) => x.id === item.variantId) || null;
  const titre = item.variantTitle || v?.title || "";
  const taille = v?.taille ? String(v.taille) : (String(item.variantDetail || "").match(/(\d+)\s*cl/) || [])[1] || "";
  const piece = PIECES[item.slug] ? PIECES[item.slug](taille) : null;
  // Un verre d'un lot « chacun différent » : une seule pièce à graver.
  const nb = item.verre ? 1 : piecesParOption(titre) * Math.max(1, Number(quantite) || 1);
  let endroit = "";
  if (aEmplacement(p)) {
    const e = emplacementDe(item);
    endroit = e === "deux" ? "Face avant ET fond du verre" : e === "fond" ? "Au fond du verre" : "Face avant";
  } else if (item.emplacement === "fond") endroit = "Au fond du verre";
  // Gobelet, bijou en couleurs… : la couleur commandée est l'option elle-même.
  const couleur = p?.gobeletParcours || p?.category === "bijoux" ? titre : "";
  return {
    produit: item.name || p?.name || item.slug,
    option: item.variantDetail || titre,
    nom: piece?.nom || "",
    ref: piece?.ref || "",
    mesures: piece?.mesures || "",
    couleur,
    nb,
    endroit,
  };
}
