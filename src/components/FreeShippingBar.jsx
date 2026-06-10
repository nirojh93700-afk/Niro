"use client";

import { useCart } from "./CartContext";
import { getProductBySlug } from "@/lib/products";
import { BIJOUX_FREE_THRESHOLD as SEUIL } from "@/lib/shipping";
import { formatEuro } from "@/lib/format";

// Barre de progression « livraison offerte » (s'affiche pour un panier 100 %
// bijoux, livraison offerte dès 45 €) + petit bandeau de réassurance.
export default function FreeShippingBar({ compact = false }) {
  const { items, total } = useCart();
  if (!items.length) return null;

  const allBijoux = items.every((i) => getProductBySlug(i.productSlug)?.category === "bijoux");
  const remaining = Math.max(0, SEUIL - total);
  const pct = Math.min(100, Math.round((total / SEUIL) * 100));

  return (
    <div style={{ margin: compact ? "0 0 10px" : "0 0 14px" }}>
      {allBijoux && (
        <div style={{ background: "#faf6ee", border: "1px solid #ece3d2", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          {remaining > 0 ? (
            <div style={{ fontSize: "0.86rem", color: "var(--ink, #2b2620)" }}>
              Plus que <strong style={{ color: "var(--gold-dark)" }}>{formatEuro(remaining)}</strong> pour la <strong>livraison offerte</strong> ✦
            </div>
          ) : (
            <div style={{ fontSize: "0.9rem", color: "#256b34", fontWeight: 600 }}>🎉 Livraison offerte débloquée !</div>
          )}
          <div style={{ height: 7, background: "#ece3d2", borderRadius: 20, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#d8bd6e,#a98935)", transition: "width .4s ease" }} />
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", fontSize: "0.74rem", color: "var(--ink-soft)" }}>
        <span>🇫🇷 Personnalisé en France</span>
        <span>🔒 Paiement sécurisé</span>
        <span>🕒 Fabrication 2 à 5 j</span>
      </div>
    </div>
  );
}
