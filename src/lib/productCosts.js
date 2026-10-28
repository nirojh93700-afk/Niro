// =============================================================================
// Coûts d'achat (coût rendu) par variante — pour la page Bénéfices uniquement.
// Sources : reçu Alibaba avr. 2026 (cristaux, transport compris, voir
// docs/couts-cristal-alibaba.md) + Metro (verres/flûtes : facture du 28/09/2026, voir plus bas).
// Clé = stockId de la variante (ou id si pas de stockId).
// N'affecte PAS la boutique : sert seulement au calcul du bénéfice.
// =============================================================================
export const VARIANT_COSTS = {
  // Marque-pages — reçu Alibaba n° 33852424501043880 (23/10/2026) : prix × 1,574 (logistique + frais de paiement
  // répartis au prorata), voir docs/marque-pages-commande-alibaba-2026-10-12.md.
  "mp1-caramel": 1.15, "mp1-blond": 1.15, "mp1-rouge": 1.15, "mp1-cuivre": 1.15, "mp1-anthracite": 1.15, "mp1-sable": 1.15,
  "mp2-blond": 2.14, "mp2-roux": 2.14, "mp2-sable": 2.14, "mp2-brun": 2.14,
  "mp3-amandier": 1.15, "mp3-iris": 1.15, "mp3-nympheas": 1.15, "mp3-roses": 1.15, "mp3-iris-dore": 1.15,
  "mp3-nympheas-dore": 1.15, "mp3-papillon": 1.72, "mp3-tournesols": 1.15,
  "mp-boite-1": 1.07, "mp-boite-2": 1.43, "mp-boite-4": 2.14,
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
  // Verre à cocktail 33 cl : 2 cartons de 12 à 20,10 € + 3,00 € de port (Metro, 19/10/2026) → 1,80 €
  "verre-cocktail-33": 1.80,
  "verre-cocktail-33-2": 3.60,
  "verre-cocktail-33-4": 7.20,
  // Verre tumbler cristal 37 cl : Metro 14,82 € les 6 × 2 cartons + 10 € de livraison = 3,30 € (28/10/2026).
  // 39 cl : prix Metro pas encore donné.
  "verre-tumbler-1": 3.30,
  "verre-tumbler-2": 6.60,
  "verre-tumbler-4": 13.20,
};

// Trouve le coût d'achat unitaire d'un article de commande, en retrouvant la
// bonne variante (par le titre présent dans le libellé de l'article).
// `stockIds` (facultatif) = lignes de stock payées par la commande (`order.stock`) :
// elles désignent la variante EXACTE (ex. « Lot de 4 » existe en 36 cl et en 47 cl).
export function unitCostForItem(item, product, stockIds = []) {
  if (!product) return null;
  const vs = product.variants || [];
  // `order.stock` arrive parfois en TEXTE JSON (métadonnée Stripe) : sans ce garde-fou, la page
  // Bénéfices plantait (27/10/2026, « (stockIds || []).map is not a function »).
  let liste = stockIds;
  if (typeof liste === "string") { try { liste = JSON.parse(liste || "[]"); } catch { liste = []; } }
  if (!Array.isArray(liste)) liste = [];
  const payes = new Set(liste.map((x) => (Array.isArray(x) ? x[0] : x)).filter(Boolean));
  const vid = item?.variantId;
  const norm0 = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const texte0 = norm0((item?.name || "") + " " + (item?.details || ""));
  const parVid = vid ? vs.find((v) => v.id === vid) : null;
  const payees = vs.filter((v) => payes.has(v.stockId) || payes.has(v.id));
  // Plusieurs lignes du même produit : la variante payée dont le titre est dans le libellé.
  const exacte = parVid || (payees.length === 1 ? payees[0] : payees.find((v) => norm0(v.title) && texte0.includes(norm0(v.title))));
  if (exacte) {
    const c = VARIANT_COSTS[exacte.stockId] ?? VARIANT_COSTS[exacte.id];
    if (c != null) return c;
  }
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
