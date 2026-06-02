// =============================================================================
// Calcul des frais de livraison selon le POIDS du panier
// -----------------------------------------------------------------------------
// Tarifs basés sur les grilles 2025 (Mondial Relay point relais & Colissimo
// domicile suivi). À ajuster librement ici si tes tarifs évoluent.
// Les montants sont en euros.
// =============================================================================

// Chaque palier : poids max (en grammes) -> prix point relais / prix domicile.
const TIERS = [
  { maxGrams: 500, relais: 3.9, domicile: 5.9 },
  { maxGrams: 1000, relais: 4.9, domicile: 7.9 },
  { maxGrams: 2000, relais: 5.9, domicile: 9.9 },
  { maxGrams: 5000, relais: 6.9, domicile: 14.9 },
  { maxGrams: 10000, relais: 9.9, domicile: 22.9 },
  { maxGrams: Infinity, relais: 14.9, domicile: 29.9 },
];

// Livraison offerte à partir de ce montant d'achat (null = désactivé).
export const FREE_SHIPPING_THRESHOLD = null;

export function getTierForWeight(grams) {
  return TIERS.find((t) => grams <= t.maxGrams) || TIERS[TIERS.length - 1];
}

// Construit les options de livraison Stripe en fonction du poids total
// et de l'éligibilité à la remise en main propre.
export function buildShippingOptions({ totalGrams, subtotal, pickupEligible }) {
  const tier = getTierForWeight(totalGrams);
  const freeAll =
    FREE_SHIPPING_THRESHOLD != null && subtotal >= FREE_SHIPPING_THRESHOLD;

  const toRate = (amount, name, desc, days = [2, 5]) => ({
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: { amount: Math.round(amount * 100), currency: "eur" },
      display_name: name,
      delivery_estimate: {
        minimum: { unit: "business_day", value: days[0] },
        maximum: { unit: "business_day", value: days[1] },
      },
      metadata: desc ? { info: desc } : undefined,
    },
  });

  const options = [];

  // Option gratuite : remise en main propre (déco bois / mariage).
  if (pickupEligible) {
    options.push(
      toRate(0, "Remise en main propre (atelier) — Gratuit", "Décoration bois & mariage", [1, 7])
    );
  }

  options.push(
    toRate(
      freeAll ? 0 : tier.relais,
      freeAll ? "Point relais — Offert" : "Point relais (Mondial Relay)",
      "Retrait en point relais"
    )
  );
  options.push(
    toRate(
      freeAll ? 0 : tier.domicile,
      freeAll ? "Livraison à domicile — Offerte" : "Livraison à domicile (Colissimo suivi)",
      "Livraison suivie à domicile"
    )
  );

  return options;
}
