// Coût d'achat d'une ligne de commande (16/11/2026, commande 09NRJIZA : « tu m'expliques comment je peux avoir un gain
// de 35,30 € » — le verre à whisky n'était pas compté). Les lignes d'un devis n'ont pas d'identifiant de produit : avant,
// leur coût valait 0 € sans le dire. Maintenant :
//  · ligne d'un produit du catalogue → coût de sa variante (productCosts.js) ;
//  · ligne de service (texte, prénom, gravure, livraison, emballage, remise) → 0 €, il n'y a rien à acheter ;
//  · ligne de devis qui nomme un verre / une flûte / un socle → coût de ce verre (lot compris) ;
//  · sinon → null = « coût manquant », affiché comme tel (jamais 0 en silence).
import { unitCostForItem, VARIANT_COSTS } from "./productCosts";

const n = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ligne qui ne correspond à aucun objet acheté (gravure, texte, livraison…). */
export function ligneSansAchat(it) {
  return /^\s*(livraison|lettre suivie|colis|point relais|retrait|texte|textes|prenom|prenoms|date|gravure|emballage|option|remise|reduction|frais|supplement)\b/.test(n(it?.name));
}

/** Variante « à l'unité » d'un verre nommé dans le libellé d'une ligne de devis (null si aucun verre). */
export function varianteDuLibelle(it) {
  const t = n(`${it?.name || ""} ${it?.details || ""}`);
  if (/verres? a vin/.test(t)) return /47 ?cl|grand format/.test(t) ? "verre-vin-47-1" : "verre-vin-1";
  if (/flute/.test(t)) return "flute-1";
  if (/verres? a whisky/.test(t)) return "verre-whisky-grave";
  if (/verres? a cocktail/.test(t)) return /33 ?cl/.test(t) ? "verre-cocktail-33" : "verre-cocktail-grave";
  if (/tumbler/.test(t)) return /39 ?cl/.test(t) ? "verre-tumbler-39-1" : "verre-tumbler-1";
  return null;
}

/** Coût unitaire d'une ligne de devis sans produit, lu dans son libellé (null si inconnu). */
export function coutLibelle(it) {
  const t = n(`${it?.name || ""} ${it?.details || ""}`);
  const lot = Number((t.match(/lot de (\d+)/) || [])[1]) || 1;
  const c = (k) => (VARIANT_COSTS[k] != null ? VARIANT_COSTS[k] * lot : null);
  const v = varianteDuLibelle(it);
  if (v) return c(v);
  if (/socle/.test(t)) {
    const unite = (Number(it?.total) || 0) / (Number(it?.quantity) || 1);
    return unite >= 17 || /rectangle|grand/.test(t) ? VARIANT_COSTS["socle-led-rectangle"] : VARIANT_COSTS["socle-led-carre"];
  }
  return null;
}

/** Coût d'achat UNITAIRE d'une ligne (null = inconnu, à signaler). */
export function coutLigne(it, product, stock) {
  if (product) return unitCostForItem(it, product, stock);
  if (ligneSansAchat(it)) return 0;
  return coutLibelle(it);
}

/** Coût des produits d'une commande : { produit, manquants: [noms] }. */
export function coutProduitsCommande(order, bySlug) {
  let produit = 0;
  const manquants = [];
  for (const it of order?.items || []) {
    const c = coutLigne(it, bySlug[it.slug], order.stock);
    if (c == null) { manquants.push(it.name || it.slug || "?"); continue; }
    produit += c * (Number(it.quantity) || 1);
  }
  return { produit: Math.round(produit * 100) / 100, manquants };
}
