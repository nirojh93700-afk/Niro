"use client";

import { track } from "@/lib/track";

// Envoie le panier au serveur pour créer une session Stripe Checkout,
// puis redirige le client vers la page de paiement sécurisée Stripe.
export async function startCheckout(items, postalCode = "", promoCode = "", delivery = null, country = "FR", useCagnotte = false, promoEmail = "") {
  const payload = items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
    personalization: i.personalization || "",
    fields: i.fields,
    packaging: Array.isArray(i.packaging) ? i.packaging : [], // emballages payants choisis (ids)
    spec: i.spec || null, // réglages détaillés (fiche atelier)
  }));

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: payload,
      postalCode,
      promoCode,
      // E-mail saisi au panier pour le code promo : sert à vérifier qu'un code à
      // usage unique n'a pas déjà été utilisé PAR CETTE PERSONNE.
      promoEmail,
      country, // pays de livraison (France par défaut ; sinon tarif Europe)
      // Choix de livraison fait sur le panier : "domicile" ou "relais" + le
      // point relais sélectionné sur la carte (le cas échéant).
      deliveryMethod: delivery?.method || "",
      relaisPoint: delivery?.relais || null,
      useCagnotte: Boolean(useCagnotte), // payer une partie avec la cagnotte fidélité
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Le paiement est momentanément indisponible.");
  }
  // Statistiques Google Analytics : « paiement lancé » (n'a lieu que si un ID GA est réglé).
  // On mémorise aussi le panier pour déclencher l'événement « achat » sur /merci
  // (où le panier est déjà vidé).
  if (typeof window !== "undefined") {
    const gaItems = items.map((i) => ({ item_id: i.variantId, item_name: i.name, item_variant: i.variantTitle, price: i.price, quantity: i.quantity }));
    const total = Number(items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0).toFixed(2));
    track("begin_checkout", { value: total });
    if (typeof window.gtag === "function") {
      window.gtag("event", "begin_checkout", { currency: "EUR", value: total, items: gaItems });
    }
    try { localStorage.setItem("ga-pending-purchase", JSON.stringify({ value: total, items: gaItems })); } catch { /* ignore */ }
  }
  window.location.href = data.url;
}
