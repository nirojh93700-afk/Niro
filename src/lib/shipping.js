// =============================================================================
// Frais de livraison — la CLIENTE choisit son mode au paiement (comme partout)
// -----------------------------------------------------------------------------
// Deux options proposées au paiement, la cliente sélectionne :
//   • Point relais (le moins cher)
//   • Livraison à domicile
// + Remise en main propre (atelier) proposée en plus pour la déco.
//
// Règles :
//  • Bijoux / petits objets (≤ 2 kg) : tarifs "lettre/relais", point relais
//    OFFERT dès 45 €.
//  • Déco (colis) : tarif selon le NOMBRE d'articles déco ; domicile = relais + supplément.
//
// 👉 Tous les montants sont modifiables ci-dessous. Montants en euros.
// =============================================================================

// --- Bijoux / petits objets ------------------------------------------------
export const BIJOUX_RELAY = 3.9;        // point relais
export const BIJOUX_HOME = 4.9;         // à domicile
export const BIJOUX_FREE_THRESHOLD = 45; // point relais offert dès ce montant

// --- Décoration / colis (tarif selon le nombre d'articles déco) -------------
export const DECO_RELAY_TIERS = [
  { maxQty: 4, price: 6.9 },        // 1 à 4 articles déco
  { maxQty: 12, price: 12.9 },      // 5 à 12
  { maxQty: Infinity, price: 19.9 }, // 13 et plus
];
export const DECO_HOME_EXTRA = 2; // domicile = tarif relais + ce supplément

// --- Remise en main propre -------------------------------------------------
export const PICKUP_FEE = 0;

// La lettre suivie / petit colis relais est limitée à 2 kg.
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

// Construit les options de livraison que la CLIENTE choisit au paiement.
//   subtotal      : sous-total produits (€)
//   letterOnly    : TOUS les articles sont des bijoux/petits objets (lettre/relais)
//   totalGrams    : poids total estimé (plafond 2 kg)
//   parcelQty     : nombre d'articles "déco" (colis) dans le panier
//   pickupEligible: au moins un article éligible à la remise en main propre
export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, pickupEligible = false }) {
  const options = [];

  // --- Panier 100 % bijoux / petits objets (≤ 2 kg) ------------------------
  if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    const relayFree = subtotal >= BIJOUX_FREE_THRESHOLD;
    options.push(rate(relayFree ? 0 : BIJOUX_RELAY, relayFree ? "Point relais — Offert" : "Point relais", [2, 4]));
    options.push(rate(BIJOUX_HOME, "Livraison à domicile", [2, 4]));
  } else {
    // --- Panier avec déco (ou mixte) : un seul colis, tarif selon la déco ---
    const relay = tierPrice(DECO_RELAY_TIERS, parcelQty || 1);
    options.push(rate(relay, "Point relais", [2, 5]));
    options.push(rate(relay + DECO_HOME_EXTRA, "Livraison à domicile", [2, 5]));
  }

  // --- Retrait en main propre (en plus), si éligible -----------------------
  if (pickupEligible) {
    options.push(rate(PICKUP_FEE, "Retrait en main propre — Val-d'Oise (95), sur rendez-vous", [1, 7]));
  }
  return options;
}
