// Remboursements faits DIRECTEMENT dans Stripe (tableau de bord Stripe, PayPal par Stripe), sans passer par le
// bouton « Rembourser » de Gestion — 27/11/2026 (gérant : « dans le bénéfice et ce qu'il faut déclarer, il faut
// que tu retires les trucs que j'ai remboursés »). Gestion ne les voyait pas : la commande restait comptée.
// Ici, la règle PURE : on compare les remboursements lus chez Stripe aux commandes, et on dit quoi corriger.
//   · tout rendu (à 1 centime près)  → la commande passe « remboursée » (elle sort des Bénéfices, des Ventes
//     et du livre des recettes, comme une commande remboursée depuis Gestion) ;
//   · une partie rendue              → `rembourse` + `remboursements` (déduits des Bénéfices, ligne négative
//     dans le livre des recettes à la date du remboursement).
// Stripe est la source : la liste `remboursements` de la commande est refaite d'après Stripe.

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * @param orders  commandes du site ({ id, ref, status, total, paymentIntentId, rembourse, remboursements })
 * @param refunds remboursements Stripe ({ id, paymentIntent, montant (euros), at (ms), status })
 * @returns [{ id, ref, client, total, rendu, type: "total" | "partiel", nouveaux: [{ stripeId, montant, at }], patch }]
 */
export function planRemboursements(orders, refunds) {
  const parPI = {};
  for (const r of Array.isArray(refunds) ? refunds : []) {
    if (!r || !r.paymentIntent || !(Number(r.montant) > 0)) continue;
    if (r.status && !["succeeded", "pending"].includes(r.status)) continue; // échoué ou annulé : l'argent n'est pas rendu
    (parPI[r.paymentIntent] = parPI[r.paymentIntent] || []).push({ stripeId: String(r.id || ""), montant: r2(r.montant), at: Number(r.at) || 0 });
  }
  const plan = [];
  for (const o of Array.isArray(orders) ? orders : []) {
    if (!o || o.test || !o.paymentIntentId) continue;
    const liste = parPI[o.paymentIntentId];
    if (!liste || !liste.length) continue;
    if (o.status === "remboursee" || o.status === "annulee") continue; // déjà sortie des comptes
    const total = r2(o.total);
    const rendu = r2(liste.reduce((s, x) => s + x.montant, 0));
    const connus = new Set((Array.isArray(o.remboursements) ? o.remboursements : []).map((x) => String(x?.stripeId || "")).filter(Boolean));
    const nouveaux = liste.filter((x) => !connus.has(x.stripeId));
    const remboursements = liste.slice().sort((a, b) => a.at - b.at);
    const base = { id: o.id, ref: o.ref || "", client: o.customerName || "", total, rendu, nouveaux };
    if (total > 0 && rendu >= total - 0.01) {
      plan.push({ ...base, type: "total", patch: { status: "remboursee", rembourse: rendu, remboursements, rembourseVia: "stripe" } });
    } else if (rendu > r2(o.rembourse) + 0.005 || nouveaux.length) {
      plan.push({ ...base, type: "partiel", patch: { rembourse: rendu, remboursements, rembourseVia: "stripe" } });
    }
  }
  return plan;
}
