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
