"use client";

import { useEffect, useState } from "react";

// Affiche la mention du délai NORMAL (« fabrication 3 à 5 jours ») UNIQUEMENT
// quand le mode « délai allongé » (settings.vacation) est éteint. Pendant le
// mode, elle contredirait le bandeau « 3 à 4 semaines » → on la masque
// (demande de la gérante, 01/09/2026). Utilisé dans le panier (FreeShippingBar),
// la section confiance (TrustSection) et la fiche produit (ProductDetail).
export default function DelaiFabrication({ children }) {
  const [allonge, setAllonge] = useState(false);
  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.vacation?.message) setAllonge(true); })
      .catch(() => {});
  }, []);
  if (allonge) return null;
  return children;
}
