"use client";

import { useEffect } from "react";

// Lien d'affiliation (ex. nivcreation.fr/?ref=MARIE10) : à l'arrivée sur le site,
// on mémorise le code de l'ambassadeur (30 jours) pour l'appliquer au paiement,
// même si le client ne tape pas le code lui-même.
export default function RefCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const ref = (p.get("ref") || p.get("REF") || "").trim().toUpperCase();
      if (ref && /^[A-Z0-9._-]{2,20}$/.test(ref)) {
        localStorage.setItem("niv-ref", JSON.stringify({ code: ref, ts: Date.now() }));
      }
    } catch { /* ignore */ }
  }, []);
  return null;
}
