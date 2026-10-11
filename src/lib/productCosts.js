// =============================================================================
// Coûts d'achat (coût rendu) par variante — pour la page Bénéfices uniquement.
// Sources : reçu Alibaba avr. 2026 (cristaux, transport compris, voir
// docs/couts-cristal-alibaba.md) + Metro (verres/flûtes : facture du 28/09/2026, voir plus bas).
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
  // Metro — facture INV-26-FR-137934 du 28/09/2026 (commande du 25/09, 149,89 € TTC).
  // Coût = prix du carton TTC / nombre de verres + part de la livraison (8,95 € TTC pour
  // toute la commande, répartie à la valeur : +6,35 %). Le gérant compte TTC (pas de TVA récupérée).
  // Verre à vin 36 cl : carton de 6 à 18,30 € → 3,05 € + port = 3,24 €
  "verre-vin-1": 3.24,
  "verre-vin-2": 6.48,
  "verre-vin-4": 12.96,
  // Verre à vin 47 cl : carton de 6 à 29,23 € → 4,87 € + port = 5,18 €
  // (avant la facture : 6,54 € = carton + 10 € de port annoncés pour un carton seul)
  "verre-vin-47-1": 5.18,
  "verre-vin-47-2": 10.36,
  "verre-vin-47-4": 20.72,
  // Flûte à champagne 21 cl : carton de 6 à 14,03 € → 2,34 € + port = 2,49 €
  "flute-1": 2.49,
  "flute-2": 4.98,
  "flute-4": 9.96,
  // Verre à whisky 30 cl : carton de 12 à 20,28 € → 1,69 € + port = 1,80 €
  "verre-whisky-grave": 1.80,
  "verre-whisky-grave-2": 3.60,
  "verre-whisky-grave-4": 7.20,
  "verre-whisky-fete-des-peres": 1.80,
  // Verre à cocktail 17 cl : carton de 12 à 15,84 € → 1,32 € + port = 1,40 €
  "verre-cocktail-grave": 1.40,
  "verre-cocktail-grave-2": 2.80,
  "verre-cocktail-grave-4": 5.60,
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
