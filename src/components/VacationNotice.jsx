"use client";
import { useEffect, useState } from "react";

// 🏖️ Encart « mode vacances » (fiche produit + panier). N'affiche RIEN tant que
// le mode vacances n'est pas activé dans Gestion → Apparence : l'info vient de
// /api/shipping-config, qui renvoie `vacation: null` quand il est éteint.
export default function VacationNotice({ compact = false }) {
  const [vac, setVac] = useState(null);

  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.vacation?.message) setVac(d.vacation); })
      .catch(() => { /* silencieux : jamais bloquant */ });
  }, []);

  if (!vac) return null;

  return (
    <div style={{
      background: "#fdf6e8", border: "1px solid #e7d3a1", borderRadius: 10,
      padding: compact ? "8px 12px" : "10px 14px", margin: "10px 0",
      fontSize: compact ? "0.84rem" : "0.9rem", color: "#6b5516", lineHeight: 1.45,
    }}>
      {vac.message}
      {vac.gift ? (
        <span style={{ display: "block", marginTop: 4, color: "#8a6d1f", fontSize: compact ? "0.8rem" : "0.85rem" }}>
          🎁 {vac.gift}
        </span>
      ) : null}
    </div>
  );
}
