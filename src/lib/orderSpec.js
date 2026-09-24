// =============================================================================
// APPARIER LES RÉGLAGES DE GRAVURE AVEC LES LIGNES DE LA COMMANDE.
// -----------------------------------------------------------------------------
// 🔴 BUG CORRIGÉ LE 24/09/2026 (commande #00CUYR2U, Cécilia Herrera — remarque du
// gérant : « je comprends pas, c'est mal écrit »). L'admin retrouvait le réglage
// d'une ligne avec `spec.find(x => x.slug === it.slug)`. Quand une commande porte
// DEUX LIGNES DU MÊME PRODUIT (deux lots de flûtes, gravés différemment),
// `find` renvoyait TOUJOURS le premier réglage : le tableau « À graver » de la
// 2ᵉ ligne affichait le texte de la 1ʳᵉ. Risque réel de graver deux fois la même
// chose.
//
// Ici on apparie DANS L'ORDRE, en consommant chaque réglage une seule fois.
// L'ordre est fiable : le paiement enregistre les réglages dans l'ordre du panier
// (`items.map(...).filter(Boolean)` dans /api/checkout) et Stripe rend les lignes
// dans ce même ordre. Le `filter(Boolean)` retire les articles sans gravure, d'où
// le décalage possible des rangs — c'est pourquoi on apparie par identifiant
// produit d'abord, et par rang seulement en dernier recours.
// =============================================================================

/**
 * @param {Array} items  les lignes de la commande (order.items)
 * @param {Array} spec   les réglages enregistrés (order.spec)
 * @returns {Array} un réglage (ou null) PAR ligne, dans l'ordre des lignes
 */
export function apparierSpec(items, spec) {
  const libres = (Array.isArray(spec) ? spec : [])
    .filter(Boolean)
    .map((s) => ({ s, pris: false }));
  const prendre = (e) => {
    if (!e) return null;
    e.pris = true;
    return e.s;
  };
  return (Array.isArray(items) ? items : []).map((it, i) => {
    if (it && it.slug) {
      // 1. même produit, premier réglage encore libre : c'est le bon lot.
      const parSlug = libres.find((x) => !x.pris && x.s.slug === it.slug);
      if (parSlug) return prendre(parSlug);
      // 2. un réglage d'avant, enregistré sans identifiant produit.
      const sansSlug = libres.find((x) => !x.pris && !x.s.slug);
      if (sansSlug) return prendre(sansSlug);
      // Sinon RIEN. On ne prête JAMAIS à une ligne les réglages d'un autre
      // produit : mieux vaut « aucun réglage » qu'une gravure fausse. C'est ce
      // qui arrivait à l'article non gravé posé au milieu de la commande.
      return null;
    }
    // 3. ligne sans identifiant produit (vieille commande) : on suit l'ordre.
    const sansSlug = libres.find((x) => !x.pris && !x.s.slug);
    if (sansSlug) return prendre(sansSlug);
    return prendre(libres[i] && !libres[i].pris ? libres[i] : null);
  });
}
