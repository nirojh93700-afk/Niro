// Formatage des prix en euros (français).
const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEuro(amount) {
  return formatter.format(amount);
}

// Arrondit un montant pour qu'il finisse par ,90 (utilisé pour les prix barrés).
export function roundTo90(amount) {
  return Math.round(amount - 0.9) + 0.9;
}

// Convertit un montant en euros (ex: 17.92) en centimes pour Stripe (1792).
export function toCents(amount) {
  return Math.round(amount * 100);
}
