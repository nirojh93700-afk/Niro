// Commande liée (18/11/2026, gérant : « pourquoi t'as mis deux fois la même commande ? », 0BXF7CYC → 0FUPET23).
// Un devis payé pour COMPLÉTER une commande (nouvel envoi, supplément…) est rattaché à la commande d'origine :
// il ne fait plus une deuxième carte dans la file ni dans les compteurs « à préparer », mais son paiement
// reste compté (Bénéfices, Comptabilité, chiffres du mois).
// La commande rattachée porte `rattacheA = { id, ref }`. Fonctions pures (testées par npm run test-commande-liee).

/** Référence de commande propre : « #0fupet23 » → « 0FUPET23 ». */
export function nettoyerRef(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

/** La commande est-elle un complément rattaché à une autre ? */
export function estComplement(o) {
  return Boolean(o && o.rattacheA && o.rattacheA.id);
}

/** Résumé d'un complément affiché sur la commande d'origine. */
export function resumeComplement(o) {
  return {
    id: o.id, ref: o.ref || "", total: Number(o.total) || 0, createdAt: o.createdAt || "",
    quoteNumber: o.quoteNumber || "", shippingMethod: o.shippingMethod || "", shippingPrice: Number(o.shippingPrice) || 0,
    relaisPoint: o.relaisPoint || "", status: o.status || "", tracking: o.tracking || "",
    items: (o.items || []).map((it) => ({ name: it.name || "", quantity: it.quantity || 1, amount: it.amount })),
  };
}

/**
 * Range chaque complément sous sa commande d'origine : il sort de la liste et va dans `parent.complements`.
 * Un complément dont la commande d'origine n'est pas dans la liste reste visible (rien ne disparaît).
 */
export function regrouperComplements(orders) {
  const liste = Array.isArray(orders) ? orders : [];
  const parId = new Map(liste.map((o) => [o.id, o]));
  const enfants = new Map();
  for (const o of liste) {
    if (!estComplement(o) || !parId.has(o.rattacheA.id) || o.rattacheA.id === o.id) continue;
    (enfants.get(o.rattacheA.id) || enfants.set(o.rattacheA.id, []).get(o.rattacheA.id)).push(o);
  }
  const caches = new Set([...enfants.values()].flat().map((o) => o.id));
  return liste
    .filter((o) => !caches.has(o.id))
    .map((o) => (enfants.has(o.id) ? { ...o, complements: enfants.get(o.id).map(resumeComplement) } : o));
}

/** Total payé des compléments d'une commande (pour les chiffres du tableau de bord). */
export function totalComplements(o) {
  return Math.round((o?.complements || []).reduce((s, c) => s + (Number(c.total) || 0), 0) * 100) / 100;
}
