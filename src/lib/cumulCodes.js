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
