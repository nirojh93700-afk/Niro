// Formatage des prix en euros (français).
const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEuro(amount) {
  return formatter.format(amount);
}

// Convertit un montant en euros (ex: 17.92) en centimes pour Stripe (1792).
export function toCents(amount) {
  return Math.round(amount * 100);
}
