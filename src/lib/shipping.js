// =============================================================================
// Calcul des frais de livraison selon le POIDS et le TYPE du panier
// -----------------------------------------------------------------------------
// Tarifs La Poste / Mondial Relay 2025 (France métropolitaine).
// → Objets légers & fins (bijoux, clé USB, ronds de serviette) : LETTRE SUIVIE
//   (jusqu'à 2 kg et 3 cm d'épaisseur) — l'option la moins chère.
// → Décoration bois volumineuse : COLIS (point relais ou domicile Colissimo).
// Tout est librement ajustable ici. Montants en euros.
// =============================================================================

// --- Lettre Suivie La Poste (objets fins < 3 cm, jusqu'à 2 kg) -------------
const LETTER_TIERS = [
  { maxGrams: 100, price: 3.28 },
  { maxGrams: 250, price: 5.25 },
  { maxGrams: 500, price: 7.2 },
  { maxGrams: 1000, price: 8.9 },
  { maxGrams: 2000, price: 10.75 },
];

// --- Colis : point relais (Mondial Relay) & domicile (Colissimo suivi) -----
const PARCEL_TIERS = [
  { maxGrams: 250, relais: 4.55, domicile: 5.25 },
  { maxGrams: 500, relais: 3.9, domicile: 7.35 },
  { maxGrams: 1000, relais: 4.9, domicile: 9.4 },
  { maxGrams: 2000, relais: 5.9, domicile: 10.7 },
  { maxGrams: 5000, relais: 6.9, domicile: 16.6 },
  { maxGrams: 10000, relais: 9.5, domicile: 24.2 },
  { maxGrams: Infinity, relais: 14.9, domicile: 30.55 },
];

// Livraison offerte à partir de ce montant d'achat (null = désactivé).
export const FREE_SHIPPING_THRESHOLD = null;

function pickTier(tiers, grams) {
  return tiers.find((t) => grams <= t.maxGrams) || tiers[tiers.length - 1];
}

export function getLetterTier(grams) {
  return pickTier(LETTER_TIERS, grams);
}
export function getParcelTier(grams) {
  return pickTier(PARCEL_TIERS, grams);
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

// Construit les options Stripe selon le contenu du panier.
//   totalGrams    : poids total (g)
//   subtotal      : sous-total produits (€)
//   pickupEligible: au moins un article éligible à la remise en main propre
//   letterOnly    : TOUS les articles sont expédiables en lettre suivie
export function buildShippingOptions({ totalGrams, subtotal, pickupEligible, letterOnly }) {
  const free = FREE_SHIPPING_THRESHOLD != null && subtotal >= FREE_SHIPPING_THRESHOLD;
  const options = [];

  // Remise en main propre gratuite (déco bois / mariage).
  if (pickupEligible) {
    options.push(rate(0, "Remise en main propre (atelier) — Gratuit", [1, 7]));
  }

  // Lettre suivie possible uniquement si tout est léger/fin ET ≤ 2 kg.
  if (letterOnly && totalGrams <= 2000) {
    const t = getLetterTier(totalGrams);
    options.push(rate(free ? 0 : t.price, free ? "Lettre suivie — Offerte" : "Lettre suivie La Poste", [2, 4]));
    // On propose aussi le domicile suivi en alternative (réassurance).
    const p = getParcelTier(totalGrams);
    options.push(rate(free ? 0 : p.domicile, "Colissimo domicile (suivi)", [2, 4]));
    return options;
  }

  // Sinon : colis (relais + domicile) selon le poids.
  const p = getParcelTier(totalGrams);
  options.push(rate(free ? 0 : p.relais, free ? "Point relais — Offert" : "Point relais (Mondial Relay)", [3, 6]));
  options.push(rate(free ? 0 : p.domicile, free ? "Domicile — Offert" : "Livraison à domicile (Colissimo suivi)", [2, 5]));
  return options;
}
