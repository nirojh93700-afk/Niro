"use client";

// Envoie le panier au serveur pour créer une session Stripe Checkout,
// puis redirige le client vers la page de paiement sécurisée Stripe.
export async function startCheckout(items) {
  const payload = items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
    personalization: i.personalization || "",
  }));

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: payload }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Le paiement est momentanément indisponible.");
  }
  window.location.href = data.url;
}
