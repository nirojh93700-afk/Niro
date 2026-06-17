"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/CartContext";

export const dynamic = "force-dynamic";

export default function MerciPage() {
  const { clearCart } = useCart();

  // La commande est payée : on vide le panier.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Statistiques Google Analytics : « achat » (n'a lieu que si un ID GA est réglé).
  // On lit le panier mémorisé au moment du paiement, puis on l'efface pour ne pas
  // compter deux fois si la page est rechargée.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem("ga-pending-purchase") || "null"); } catch { /* ignore */ }
    if (!pending) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
    window.gtag("event", "purchase", {
      transaction_id: sessionId || `niv-${Date.now()}`,
      currency: "EUR",
      value: pending.value || 0,
      items: pending.items || [],
    });
    try { localStorage.removeItem("ga-pending-purchase"); } catch { /* ignore */ }
  }, []);

  return (
    <div className="center-card">
      <div className="big-emoji">🎉</div>
      <h1>Merci pour votre commande !</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Votre paiement a bien été reçu. Vous allez recevoir un e-mail de
        confirmation. Pour les créations personnalisées, nous reviendrons vers
        vous afin de valider les détails de la gravure.
      </p>
      <p style={{ color: "var(--ink-soft)" }}>
        Une question ?{" "}
        <a href="mailto:contact.nivcreation@gmail.com" style={{ color: "var(--gold-dark)" }}>
          contact.nivcreation@gmail.com
        </a>
      </p>
      <Link href="/boutique" className="btn btn-gold" style={{ marginTop: 8 }}>
        Continuer mes achats
      </Link>
    </div>
  );
}
