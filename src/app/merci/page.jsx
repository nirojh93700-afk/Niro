"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

export default function MerciPage() {
  const { clearCart } = useCart();

  // La commande est payée : on vide le panier.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Statistiques « achat » : compteur intégré (toujours) + Google Analytics (si
  // un ID GA est réglé). On lit le panier mémorisé au moment du paiement, puis on
  // l'efface pour ne pas compter deux fois si la page est rechargée.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem("ga-pending-purchase") || "null"); } catch { /* ignore */ }
    if (!pending) return;
    track("purchase", { value: pending.value || 0 });
    if (typeof window.gtag === "function") {
      const sessionId = new URLSearchParams(window.location.search).get("session_id") || "";
      window.gtag("event", "purchase", {
        transaction_id: sessionId || `niv-${Date.now()}`,
        currency: "EUR",
        value: pending.value || 0,
        items: pending.items || [],
      });
    }
    try { localStorage.removeItem("ga-pending-purchase"); } catch { /* ignore */ }
  }, []);

  return (
    <div className="center-card">
      <div className="big-emoji">🎉</div>
      <h1>Merci pour votre commande !</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Votre paiement a bien été reçu. Voici ce qui se passe ensuite :
      </p>
      <div className="merci-steps">
        <div className="merci-step"><span className="n">1</span><div className="ic">📧</div><b>Confirmation</b><small>Un e-mail récapitulatif vous est envoyé</small></div>
        <div className="merci-step"><span className="n">2</span><div className="ic">✏️</div><b>Gravure</b><small>Pour les pièces personnalisées, nous validons les détails avec vous</small></div>
        <div className="merci-step"><span className="n">3</span><div className="ic">🚚</div><b>Expédition</b><small>Envoi suivi + numéro de suivi par e-mail</small></div>
      </div>
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
