// =============================================================================
// Frais de livraison — livraison à domicile (un prix), + retrait en main propre
// -----------------------------------------------------------------------------
// La cliente reçoit chez elle (Stripe collecte l'adresse complète).
// Le retrait en main propre (déco/mariage, Val-d'Oise) est proposé en plus,
// uniquement si le code postal est dans la zone autorisée (géré côté checkout).
//
// 👉 Tous les montants sont modifiables ci-dessous. Montants en euros.
// =============================================================================

// --- Bijoux / petits objets (lettre suivie, ≤ 2 kg) ------------------------
export const BIJOUX_HOME = 3.9;          // livraison à domicile
export const BIJOUX_FREE_THRESHOLD = 45; // livraison offerte dès ce montant

// --- Décoration / colis (tarif selon le nombre d'articles déco) -------------
export const DECO_TIERS = [
  { maxQty: 4, price: 6.9 },         // 1 à 4 articles déco
  { maxQty: 12, price: 12.9 },       // 5 à 12
  { maxQty: Infinity, price: 19.9 }, // 13 et plus
];

// --- Verres (fragiles) : envoi CROISSANT selon le nombre de verres ----------
// La Poste facture plus cher quand le colis est plus lourd → le prix monte.
export const GLASS_TIERS = [
  { maxQty: 2, price: 11.9 },         // 1 à 2 verres
  { maxQty: 4, price: 16.9 },         // 3 à 4 verres
  { maxQty: Infinity, price: 21.9 },  // 5 verres et plus
];

// --- Retrait en main propre -------------------------------------------------
export const PICKUP_FEE = 0;

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

// Options de livraison proposées au paiement.
//   subtotal      : sous-total produits (€)
//   letterOnly    : TOUS les articles sont des bijoux/petits objets (≤ 2 kg)
//   totalGrams    : poids total estimé (plafond 2 kg)
//   parcelQty     : nombre d'articles "déco" (colis) dans le panier
//   pickupEligible: retrait en main propre autorisé (déco/mariage + zone OK)
export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, glassQty = 0, pickupEligible = false, freeShipping = false }) {
  const options = [];

  if (freeShipping) {
    // Tous les articles ont la livraison incluse → livraison offerte.
    options.push(rate(0, "Livraison à domicile — Offerte", [2, 5]));
  } else if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    const free = subtotal >= BIJOUX_FREE_THRESHOLD;
    options.push(rate(free ? 0 : BIJOUX_HOME, free ? "Livraison à domicile — Offerte" : "Livraison à domicile", [2, 4]));
  } else {
    // Colis : on prend le plus cher entre les verres (fragiles) et la déco.
    const decoQty = Math.max(0, parcelQty - glassQty);
    const prices = [];
    if (glassQty > 0) prices.push(tierPrice(GLASS_TIERS, glassQty));
    if (decoQty > 0) prices.push(tierPrice(DECO_TIERS, decoQty));
    const price = prices.length ? Math.max(...prices) : tierPrice(DECO_TIERS, parcelQty || 1);
    options.push(rate(price, "Livraison à domicile", [2, 5]));
  }

  if (pickupEligible) {
    options.push(rate(PICKUP_FEE, "Retrait en main propre — Val-d'Oise (95), sur rendez-vous", [1, 7]));
  }
  return options;
}
