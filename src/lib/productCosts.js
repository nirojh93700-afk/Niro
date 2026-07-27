// =============================================================================
// Coûts d'achat (coût rendu) par variante — pour la page Bénéfices uniquement.
// Sources : reçu Alibaba avr. 2026 (cristaux, transport compris, voir
// docs/couts-cristal-alibaba.md) + Metro (verres/flûtes).
// Clé = stockId de la variante (ou id si pas de stockId).
// N'affecte PAS la boutique : sert seulement au calcul du bénéfice.
// =============================================================================
export const VARIANT_COSTS = {
  // Blocs cristal (coût rendu par taille)
  "bloc-cristal-petit": 4.40,
  "bloc-cristal-moyen": 6.90,
  "bloc-cristal-grand": 12.60,
  "bloc-cristal-xl": 20.30,
  // Porte-clés cristal LED
  "pc-cristal-coeur": 1.10,
  "pc-cristal-rectangle": 1.00,
  // Verre à vin (Metro ~3,05 € / verre)
  "verre-vin-1": 3.05,
  "verre-vin-2": 6.10,
  "verre-vin-4": 12.20,
  // Flûte à champagne (Metro ~2,34 € / flûte)
  "flute-1": 2.34,
  "flute-2": 4.68,
  "flute-4": 9.36,
};

// Trouve le coût d'achat unitaire d'un article de commande, en retrouvant la
// bonne variante (par le titre présent dans le libellé de l'article).
export function unitCostForItem(item, product) {
  if (!product) return null;
  const vs = product.variants || [];
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const text = norm((item?.name || "") + " " + (item?.details || ""));
  const costOf = (v) => VARIANT_COSTS[v.stockId] ?? VARIANT_COSTS[v.id];

  if (vs.length === 1) {
    const c = costOf(vs[0]);
    return c != null ? c : (Number(product.cost) > 0 ? Number(product.cost) : null);
  }
  for (const v of vs) {
    const t = norm(v.title);
    if (t && text.includes(t)) {
      const c = costOf(v);
      if (c != null) return c;
    }
  }
  return Number(product.cost) > 0 ? Number(product.cost) : null;
}
