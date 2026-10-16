// =============================================================================
// COMPTEUR DES PANIERS ABANDONNÉS — refait le 14/10/2026 (gérant : « pourquoi il y a autant
// d'abandons ? … refais le compteur »). Avant, « abandons » = clics « Ajouter au panier » −
// retours sur /merci : un panier de 3 articles payé comptait 2 abandons, et une cliente qui
// payait sans revenir sur /merci comptait comme un abandon. Maintenant :
//   · les VENTES viennent des vraies commandes (Gestion → Commandes), pas de la page /merci ;
//   · les PANIERS et PAIEMENTS LANCÉS sont des personnes (une fois par visite : cart_open /
//     checkout_session), mesurés à partir du jour où ce compteur est en ligne.
// Fonctions pures (testées par `npm run test-stats`).
// =============================================================================

// Date AAAA-MM-JJ à Paris (même découpage que le compteur serveur).
export function dateParis(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
}

// Commandes passées par la BOUTIQUE (panier → paiement) : ni test, ni devis (ceux-là ne
// passent pas par le panier), ni carte cadeau (pas une commande).
export function estVenteBoutique(o) {
  return Boolean(o && !o.test && !o.surMesure && !o.quoteNumber && o.createdAt);
}

// { "2026-10-14": { n, ca } } sur les dates demandées.
export function ventesParJour(orders, dates) {
  const out = Object.fromEntries((dates || []).map((d) => [d, { n: 0, ca: 0 }]));
  for (const o of orders || []) {
    if (!estVenteBoutique(o)) continue;
    const j = dateParis(o.createdAt);
    if (!out[j]) continue;
    out[j].n += 1;
    out[j].ca = Math.round((out[j].ca + (Number(o.total) || 0)) * 100) / 100;
  }
  return out;
}

// Bilan des paniers sur la période, seulement sur les jours où le nouveau compteur existait.
// series : [{ date, cartSessions, checkoutSessions, ventes }]
export function bilanPaniers(series) {
  const s = series || [];
  const i0 = s.findIndex((d) => (d.cartSessions || 0) > 0 || (d.checkoutSessions || 0) > 0);
  if (i0 < 0) return { mesure: false };
  const jours = s.slice(i0);
  const somme = (k) => jours.reduce((t, d) => t + (Number(d[k]) || 0), 0);
  const paniers = somme("cartSessions"), paiements = somme("checkoutSessions"), ventes = somme("ventes");
  const abandons = Math.max(0, paniers - ventes);
  const auPaiement = Math.min(abandons, Math.max(0, paiements - ventes));
  return { mesure: true, depuis: jours[0].date, paniers, paiements, ventes, abandons, auPaiement, avantPaiement: abandons - auPaiement };
}
