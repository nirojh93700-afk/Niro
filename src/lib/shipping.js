// =============================================================================
// Frais de livraison — plusieurs options proposées, le client choisit
// -----------------------------------------------------------------------------
// • Bijoux / petits objets (lettre) : livraison OFFERTE dès 35 € d'achat,
//   sinon forfait lettre suivie (+ option Colissimo domicile).
// • Décoration bois (colis) : TOUJOURS payant, prix par paliers selon le
//   nombre d'articles déco. Options : point relais, domicile, main propre (7 €).
// • Cristal (futurs produits) : offert dès 80 € — réglage prêt (CRYSTAL_*).
//
// 👉 Tous les montants sont modifiables ci-dessous. Montants en euros.
// =============================================================================

// --- Bijoux / lettre -------------------------------------------------------
export const LETTER_FLAT = 3.9; // lettre suivie La Poste
export const LETTER_DOMICILE = 5.9; // Colissimo domicile (alternative suivie)
export const BIJOUX_FREE_THRESHOLD = 35; // livraison bijoux offerte dès ce montant

// --- Décoration / colis (par quantité d'articles déco) ---------------------
export const PARCEL_RELAIS = [
  { maxQty: 4, price: 6.9 },
  { maxQty: 12, price: 12.9 },
  { maxQty: Infinity, price: 19.9 },
];
export const PARCEL_DOMICILE = [
  { maxQty: 4, price: 8.9 },
  { maxQty: 12, price: 14.9 },
  { maxQty: Infinity, price: 22.9 },
];

// --- Remise en main propre -------------------------------------------------
export const PICKUP_FEE = 7; // forfait remise en main propre

// --- Cristal (réglage prêt pour de futurs produits) ------------------------
// Mettre `crystal: true` sur un produit dans products.js pour l'activer.
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

// Construit les options de livraison proposées au client.
//   subtotal      : sous-total produits (€)
//   letterOnly    : TOUS les articles sont expédiables en lettre (bijoux)
//   totalGrams    : poids total estimé (plafond lettre 2 kg)
//   parcelQty     : nombre d'articles "déco" (colis)
//   pickupEligible: au moins un article éligible à la remise en main propre
export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, pickupEligible = false }) {
  const options = [];

  // --- Panier de bijoux / petits objets (≤ 2 kg) ---------------------------
  if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    const free = subtotal >= BIJOUX_FREE_THRESHOLD; // offerte dès 35 €
    options.push(rate(free ? 0 : LETTER_FLAT, free ? "Lettre suivie — Offerte" : "Lettre suivie La Poste", [2, 4]));
    options.push(rate(free ? 0 : LETTER_DOMICILE, free ? "Colissimo domicile — Offert" : "Colissimo domicile (suivi)", [2, 4]));
    return options;
  }

  // --- Panier avec décoration (colis) : toujours payant --------------------
  options.push(rate(tierPrice(PARCEL_RELAIS, parcelQty || 1), "Point relais (Mondial Relay)", [3, 6]));
  options.push(rate(tierPrice(PARCEL_DOMICILE, parcelQty || 1), "Livraison à domicile (Colissimo suivi)", [2, 5]));
  if (pickupEligible) {
    options.push(rate(PICKUP_FEE, "Remise en main propre (atelier)", [1, 7]));
  }
  return options;
}
