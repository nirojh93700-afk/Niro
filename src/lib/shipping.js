// =============================================================================
// Frais de livraison — UN SEUL PRIX affiché au client, calculé automatiquement
// -----------------------------------------------------------------------------
// Le client ne choisit pas le transporteur : c'est NOUS qui décidons ensuite
// d'expédier en point relais ou à domicile (le prix payé est le même).
//
// Règles :
//  • Bijoux / petits objets seuls : forfait lettre suivie, OFFERT dès 35 €.
//  • Dès qu'il y a une déco (colis) : tout part ensemble dans un seul colis,
//    on facture le tarif déco selon le NOMBRE d'articles déco. Les bijoux
//    voyagent avec, sans frais supplémentaire (méthode "article dominant").
//  • Remise en main propre proposée en plus pour la déco : 7 €.
//  • Cristal (futurs produits) : offert dès 80 € (réglage prêt).
//
// 👉 Tous les montants sont modifiables ci-dessous. Montants en euros.
// =============================================================================

// --- Bijoux / lettre -------------------------------------------------------
export const LETTER_FLAT = 3.9; // forfait lettre suivie
export const BIJOUX_FREE_THRESHOLD = 45; // livraison bijoux offerte dès ce montant

// --- Décoration / colis (UN prix, selon le nombre d'articles déco) ----------
export const DECO_TIERS = [
  { maxQty: 4, price: 6.9 }, // 1 à 4 articles déco
  { maxQty: 12, price: 12.9 }, // 5 à 12
  { maxQty: Infinity, price: 19.9 }, // 13 et plus
];

// --- Remise en main propre -------------------------------------------------
export const PICKUP_FEE = 7;

// --- Cristal (réglage prêt pour de futurs produits) ------------------------
export const CRYSTAL_FREE_THRESHOLD = 80;

// La lettre suivie est limitée à 2 kg : au-delà, on bascule en colis.
const LETTER_MAX_GRAMS = 2000;

function tierPrice(tiers, qty) {
  const t = tiers.find((x) => qty <= x.maxQty) || tiers[tiers.length - 1];
  return t.price;
}

function rate(amount, name, days) {
  return {
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: { amount: Math.round(amount * 100), currency: "eur" },
      display_name: name,
      delivery_estimate: {
        minimum: { unit: "business_day", value: days[0] },
        maximum: { unit: "business_day", value: days[1] },
      },
    },
  };
}

// Construit l'option de livraison (un seul prix) + éventuellement la main propre.
//   subtotal      : sous-total produits (€)
//   letterOnly    : TOUS les articles sont des bijoux/petits objets (lettre)
//   totalGrams    : poids total estimé (plafond lettre 2 kg)
//   parcelQty     : nombre d'articles "déco" (colis) dans le panier
//   pickupEligible: au moins un article éligible à la remise en main propre
export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, pickupEligible = false }) {
  // --- Panier 100 % bijoux / petits objets (≤ 2 kg) ------------------------
  if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    const free = subtotal >= BIJOUX_FREE_THRESHOLD; // offerte dès 35 €
    return [rate(free ? 0 : LETTER_FLAT, free ? "Livraison — Offerte" : "Livraison (lettre suivie)", [2, 4])];
  }

  // --- Panier avec déco (ou mixte) : un seul colis, tarif selon la déco -----
  const options = [
    rate(tierPrice(DECO_TIERS, parcelQty || 1), "Livraison (colis suivi)", [2, 5]),
  ];
  if (pickupEligible) {
    options.push(rate(PICKUP_FEE, "Remise en main propre (atelier)", [1, 7]));
  }
  return options;
}
