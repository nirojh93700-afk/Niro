// =============================================================================
// Cumul de deux codes promo (19/10/2026, gérant : « laisse la personne utiliser
// les 10 % même si elle utilise le code pour gravure »).
// -----------------------------------------------------------------------------
// Seule paire permise : UN code « gravure offerte » (kind "gravure") + UN code
// ordinaire (pourcentage ou montant : bienvenue, parrainage, ambassadeur…).
// Jamais deux codes gravure, jamais une carte cadeau dans la paire.
// La gravure est offerte d'abord, puis le code ordinaire s'applique sur le reste
// du panier. Pur, partagé par le panier et le paiement (`npm run test-cumul`).
// =============================================================================

/** Code ordinaire : ni gravure offerte, ni carte cadeau. */
export const estOrdinaire = (kind) => kind !== "gravure" && kind !== "cadeau";

/** Deux codes de ces genres peuvent-ils se cumuler ? */
export function cumulPermis(kindA, kindB) {
  return (kindA === "gravure" && estOrdinaire(kindB)) || (kindB === "gravure" && estOrdinaire(kindA));
}

/**
 * Remise totale d'une paire : gravure offerte + code ordinaire sur le reste.
 * @param {number} sousTotal  articles (hors livraison)
 * @param {number} gravure    prix de la première gravure payante du panier
 * @param {{type:"percent"|"fixed", value:number}} code  le code ordinaire
 * @returns {number} remise en euros, au centime, jamais plus que le sous-total
 */
export function remiseCumulee(sousTotal, gravure, code) {
  const st = Math.max(0, Number(sousTotal) || 0);
  const g = Math.min(st, Math.max(0, Number(gravure) || 0));
  const v = Math.max(0, Number(code?.value) || 0);
  const reste = st - g;
  const partCode = code?.type === "fixed" ? Math.min(reste, v) : reste * Math.min(100, v) / 100;
  return Math.round((g + partCode) * 100) / 100;
}

/**
 * SEUIL DE LIVRAISON OFFERTE APRÈS LA REMISE (28/10/2026, gérant : « il faut
 * qu'elle atteigne 45 € sans les −10 % », pour TOUS les codes promo).
 * Montant que les codes appliqués retirent du panier, à déduire du sous-total
 * AVANT de comparer aux seuils (45 € bijoux, 60 € verres…). Une carte cadeau
 * n'est pas comptée : c'est de l'argent déjà payé. Pur (panier ET paiement).
 * @param {number} sousTotal  articles (hors livraison)
 * @param {Array<{kind?:string, type:"percent"|"fixed", value:number}>} codes
 * @returns {number} remise en euros, au centime
 */
export function remisePourPort(sousTotal, codes) {
  const st = Math.max(0, Number(sousTotal) || 0);
  const liste = (Array.isArray(codes) ? codes : []).filter((c) => c && c.kind !== "cadeau" && Number(c.value) > 0);
  if (!liste.length) return 0;
  const g = liste.find((c) => c.kind === "gravure");
  const o = liste.find((c) => estOrdinaire(c.kind));
  if (g && o) return remiseCumulee(st, g.value, o);
  const c = liste[0];
  const v = Number(c.value);
  const r = c.type === "fixed" || c.kind === "gravure" ? Math.min(st, v) : st * Math.min(100, v) / 100;
  return Math.round(r * 100) / 100;
}
