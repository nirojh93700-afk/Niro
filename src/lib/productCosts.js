// =============================================================================
// Coûts d'achat (coût rendu) par variante — pour la page Bénéfices uniquement.
// Sources : reçu Alibaba avr. 2026 (cristaux, transport compris, voir
// docs/couts-cristal-alibaba.md) + Metro (verres/flûtes : facture du 28/09/2026, voir plus bas).
// Clé = stockId de la variante (ou id si pas de stockId).
// N'affecte PAS la boutique : sert seulement au calcul du bénéfice.
// =============================================================================
export const VARIANT_COSTS = {
  // Bon Nihao NHFR604292155222 (relevé le 24/11/2026, prix × 1,083 = livraison 36,51 € répartie sur 439,07 €).
  // Seulement les prix d'achat qui manquaient (gérant : « tu prends que les trucs qui te manquaient »). Stock non touché.
  "chaine-acier-argente": 2.45,
  "gourm-sans": 0.76,
  "empreinte-bebe-dore": 0.62,
  // Collier Plaque Acier = pendentif (NHFR604292155222) + sa chaîne (argent 60 cm même bon ; noire / dorée 55 cm,
  // bon NHFR606272237502, prix × 1,066).
  "plaque-argente": 1.80,
  "plaque-noir": 2.44,
  "plaque-argente-noir": 2.44,
  "plaque-dore": 2.55,
  "env-recto-argent": 1.71,
  "env-recto-dore": 1.96,
  "env-recto-rose": 1.96,
  // Bon Nihao NHFR609012328045 (prix × 1,077 : livraison 17,86 € sur 232,72 €).
  "bracelet-cordon-plaque-noir-noir": 1.91,
  "bracelet-cordon-plaque-noir-acier": 1.91,
  "bracelet-cordon-plaque-gris": 1.91,
  "collier-double-coeur-dore": 2.93,
  "collier-double-coeur-orrose": 5.99,
  "collier-coeur-grave-dore": 1.14,
  "collier-coeur-grave-orrose": 1.14,
  "bracelet-coeur-dore": 1.43,
  "bracelet-coeur-or-rose": 1.65,
  "collier-medaillon-pivotant-orrose": 2.93,
  // Commande xTool (livrée le 18/07/2026) : gobelet 40 oz 22,00 € pièce, carafe 740 ml 25,20 € pièce
  // (crème et bleu marine = même gobelet, même prix que le blanc et le rose de la facture).
  "gobelet-40oz-creme": 22.00,
  "gobelet-40oz-blanc": 22.00,
  "gobelet-40oz-marine": 22.00,
  "gobelet-40oz-rose": 22.00,
  "carafe-whisky-gravee": 25.20,
  // Bon Nihao NHFR606272237502 (prix × 1,066 : livraison 10,06 € − bon 4,50 € sur 84,68 €).
  "med-argent-texte": 3.43,
  "med-dore-texte": 4.71,
  "med-bicolore-texte": 4.23,
  "geo-argente": 1.01,
  "geo-noir": 1.39,
  "geo-or-rose": 1.41,
  // Bon Nihao NHFR610292420591 (15/11/2026) : prix × 1,12 (port net réparti), voir docs/commande-fournisseur-NHFR610292420591.md.
  "collier-papillon-bleu": 0.95,
  "collier-papillon-rose": 0.97,
  "collier-papillon-rouge": 1.09,
  "collier-papillon-noir": 0.95,
  "collier-papillon-dore": 1.29,
  "collier-papillons-scintillants-dore": 1.86,
  "collier-papillon-ajoure-dore": 1.48,
  "collier-envol-papillons-dore": 1.61,
  "collier-noeud-scintillant-dore": 1.06,
  "bracelet-plaque-breloque-dore-coeur": 2.18,
  "bracelet-plaque-breloque-dore-etoile": 2.18,
  "bracelet-plaque-breloque-argente-coeur": 1.39,
  "bracelet-plaque-breloque-argente-etoile": 1.39,
  "bracelet-plaque-breloque-argente-papillon": 1.39,
  "bracelet-homme-trois-rangs-noir-dore": 2.54,
  "bracelet-homme-trois-rangs-noir-argente": 2.54,
  "bracelet-homme-trois-rangs-tout-noir": 2.54,
  "bracelet-homme-plaque-longue-acier": 1.37,
  "bracelet-homme-plaque-longue-noir": 1.56,
  "bracelet-homme-deux-rangs": 3.62,
  "bracelet-homme-tresse-dore": 1.39,
  "bracelet-homme-tresse-camel": 1.39,
  "bracelet-homme-maille-venitienne-dore": 1.76,
  "bracelet-homme-maille-venitienne-argente": 1.06,
  "bracelet-homme-perles-tresse": 1.3,
  "ensemble-homme-plaque-noire-noir": 1.66,
  "ensemble-homme-plaque-acier-argente": 3.43,
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
  // Socles LED : anciens (reçu Alibaba avr. 2026) · nouveaux, reçu n° 33855788501043880 (commande du 11/10/2026,
  // 142,87 € payés pour 69,11 € d'articles : port, taxes et frais répartis au prorata, × 2,067).
  "socle-led-carre": 2.70,
  "socle-led-rectangle": 3.10,
  "socle-led-carre-gris": 1.56,
  "socle-led-rectangle-noir": 5.58,
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
  // Carnet A5 gravé : reçu Alibaba du 23/10/2026, 60 carnets, 0,89 € + port 153,94 € + frais → 3,55 € rendu (les 3 couleurs).
  "carnet-marron": 3.55,
  "carnet-noir": 3.55,
  "carnet-gris": 3.55,
  // Bracelet Ange : commande Nihao NHFR607182266419 (XLY228 argent 0,48 € · XLJ228 or 0,59 €), port compris ×1,188.
  "bracelet-ange-argente": 0.57,
  "bracelet-ange-dore": 0.70,
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
