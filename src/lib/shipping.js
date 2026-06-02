// =============================================================================
// Frais de livraison — FORFAITS SIMPLES par type de produit
// -----------------------------------------------------------------------------
// Les poids variant beaucoup, on applique un tarif fixe et lisible :
//   • Bijoux / petits objets fins  -> forfait "Lettre suivie"
//   • Décoration bois / colis        -> forfait "Colis"
//   • Décoration bois & mariage      -> remise en main propre GRATUITE
//
// 👉 Pour changer tes tarifs, modifie simplement les montants ci-dessous.
// Montants en euros.
// =============================================================================

export const LETTER_FLAT = 3.9; // bijoux & petits objets (lettre suivie)
export const PARCEL_FLAT = 6.9; // décoration bois / colis
export const PICKUP_FLAT = 0; // remise en main propre

// Livraison offerte à partir de ce montant d'achat (null = désactivé).
// Ex. : mettre 60 pour offrir la livraison dès 60 € d'achat.
export const FREE_SHIPPING_THRESHOLD = null;

// La lettre suivie est limitée à 2 kg : au-delà, on bascule en colis.
const LETTER_MAX_GRAMS = 2000;

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
//   subtotal      : sous-total produits (€)
//   pickupEligible: au moins un article éligible à la remise en main propre
//   letterOnly    : TOUS les articles sont expédiables en lettre suivie
//   totalGrams    : poids total estimé (sert seulement au plafond lettre 2 kg)
export function buildShippingOptions({ subtotal, pickupEligible, letterOnly, totalGrams = 0 }) {
  const free = FREE_SHIPPING_THRESHOLD != null && subtotal >= FREE_SHIPPING_THRESHOLD;
  const options = [];

  // Remise en main propre gratuite (déco bois / mariage).
  if (pickupEligible) {
    options.push(rate(PICKUP_FLAT, "Remise en main propre (atelier) — Gratuit", [1, 7]));
  }

  if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    // Bijoux & petits objets : forfait lettre suivie.
    options.push(
      rate(free ? 0 : LETTER_FLAT, free ? "Lettre suivie — Offerte" : "Lettre suivie La Poste", [2, 4])
    );
  } else {
    // Décoration / colis : forfait colis.
    options.push(
      rate(free ? 0 : PARCEL_FLAT, free ? "Livraison — Offerte" : "Livraison (colis suivi)", [2, 5])
    );
  }

  return options;
}
