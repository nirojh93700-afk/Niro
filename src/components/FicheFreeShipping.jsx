"use client";

import { useEffect, useState } from "react";
import { BIJOUX_FREE_THRESHOLD } from "@/lib/shipping";
import { formatEuro } from "@/lib/format";

// Barre « livraison offerte » affichée sur la FICHE produit (bijoux), calculée
// sur le prix affiché du produit. Le seuil suit les tarifs réglés dans l'admin
// (Gestion → Réglages → 🚚 Livraison), repli sur le code. N'affiche rien hors bijoux.
export default function FicheFreeShipping({ price = 0, category = "" }) {
  const [seuil, setSeuil] = useState(BIJOUX_FREE_THRESHOLD);
  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const n = Number(d?.bijouxFreeThreshold);
        if (Number.isFinite(n) && n >= 0) setSeuil(n);
      })
      .catch(() => {});
  }, []);

  if (category !== "bijoux" || !(seuil > 0)) return null;

  const remaining = Math.max(0, seuil - price);
  const pct = Math.min(100, Math.round((price / seuil) * 100));

  return (
    <div style={{ background: "var(--paper, #fffdf9)", border: "1px solid var(--line, #e7ddcd)", borderRadius: 12, padding: "11px 14px", margin: "10px 0 4px" }}>
      {remaining > 0 ? (
        <div style={{ fontSize: "0.88rem", color: "var(--ink, #2b2620)" }}>
          🚚 Plus que <strong style={{ color: "var(--gold-dark, #a98935)" }}>{formatEuro(remaining)}</strong> et votre <strong>livraison est offerte</strong> !
        </div>
      ) : (
        <div style={{ fontSize: "0.9rem", color: "#256b34", fontWeight: 600 }}>🎉 Livraison offerte !</div>
      )}
      <div style={{ height: 8, background: "#eee4cf", borderRadius: 20, marginTop: 9, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#e2c67e,#a98935)", borderRadius: 20, transition: "width .4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--ink-soft, #6b6252)", marginTop: 6 }}>
        <span>0 €</span>
        <span>Livraison offerte dès {formatEuro(seuil)}</span>
      </div>
    </div>
  );
}
