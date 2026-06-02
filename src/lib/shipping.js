// =============================================================================
// Frais de livraison — CALCUL AUTOMATIQUE (un seul tarif, sans choix client)
// -----------------------------------------------------------------------------
// Le site détermine lui-même le frais de port selon le contenu du panier :
//   • Panier de bijoux / petits objets        -> forfait "Lettre suivie"
//   • Panier contenant de la déco bois (colis) -> tarif par paliers selon le
//     NOMBRE d'articles déco (fiable même quand les poids varient).
//
// 👉 Pour changer tes tarifs, modifie simplement les montants ci-dessous.
// Montants en euros.
// =============================================================================

export const LETTER_FLAT = 3.9; // bijoux & petits objets (lettre suivie)

// Tarif colis selon le nombre d'articles "déco" (non expédiables en lettre).
export const PARCEL_TIERS = [
  { maxQty: 4, price: 6.9 }, // jusqu'à 4 articles déco
  { maxQty: 12, price: 12.9 }, // de 5 à 12
  { maxQty: Infinity, price: 19.9 }, // 13 et plus
];

// Livraison offerte à partir de ce montant d'achat (null = désactivé).
// Ex. : mettre 60 pour offrir la livraison dès 60 € d'achat.
export const FREE_SHIPPING_THRESHOLD = null;

// La lettre suivie est limitée à 2 kg : au-delà, on bascule en colis.
const LETTER_MAX_GRAMS = 2000;

function parcelPriceForQty(qty) {
  const tier = PARCEL_TIERS.find((t) => qty <= t.maxQty) || PARCEL_TIERS[PARCEL_TIERS.length - 1];
  return tier.price;
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

// Renvoie UN SEUL frais de livraison, calculé automatiquement.
//   subtotal   : sous-total produits (€)
//   letterOnly : TOUS les articles sont expédiables en lettre suivie
//   totalGrams : poids total estimé (sert au plafond lettre 2 kg)
//   parcelQty  : nombre d'articles "déco" (colis) dans le panier
export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0 }) {
  const free = FREE_SHIPPING_THRESHOLD != null && subtotal >= FREE_SHIPPING_THRESHOLD;

  // Panier 100 % bijoux/petits objets et ≤ 2 kg -> lettre suivie.
  if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    return [rate(free ? 0 : LETTER_FLAT, free ? "Lettre suivie — Offerte" : "Lettre suivie La Poste", [2, 4])];
  }

  // Sinon -> colis, tarif selon le nombre d'articles déco.
  const price = parcelPriceForQty(parcelQty || 1);
  return [rate(free ? 0 : price, free ? "Livraison — Offerte" : "Livraison (colis suivi)", [2, 5])];
}
