"use client";

import { useEffect, useState } from "react";

// Encadré « cadeau d'attente » du PANIER (mode délai allongé actif) : annonce
// le délai + laisse choisir la préférence de cadeau AVANT le paiement
// (maquette validée par la gérante le 01/09/2026). Remplace l'ancien encart
// VacationNotice du panier (qui faisait doublon avec le bandeau). Ne rend RIEN
// quand le mode est éteint → le panier revient comme avant automatiquement.
const CHOIX = [
  { value: "surprise", label: "✨ Surprise" },
  { value: "femme", label: "Plutôt femme" },
  { value: "homme", label: "Plutôt homme" },
];

export default function CadeauChoix({ value, onChange }) {
  const [actif, setActif] = useState(false);
  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.vacation?.message) setActif(true); })
      .catch(() => {});
  }, []);
  if (!actif) return null;

  return (
    <div style={{ background: "#fdf6e8", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 12px 14px", margin: "0 0 14px" }}>
      <div style={{ fontWeight: 700, color: "#8a6d1f", fontSize: ".92rem", marginBottom: 4 }}>🎁 Votre cadeau d&apos;attente — offert</div>
      <div style={{ fontSize: ".82rem", color: "#6b5516", lineHeight: 1.45, marginBottom: 10 }}>
        Délai de confection actuel : 3 à 4 semaines minimum. Pour vous remercier de votre patience, un cadeau surprise est glissé dans votre commande. Dites-nous votre préférence :
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {CHOIX.map((c) => {
          const on = (value || "surprise") === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange && onChange(c.value)}
              style={{
                flex: 1, textAlign: "center", borderRadius: 999, padding: "8px 4px", fontSize: ".82rem", cursor: "pointer",
                border: `1.5px solid ${on ? "#c9a24b" : "#d8bd6e"}`,
                background: on ? "#c9a24b" : "#fff",
                color: on ? "#fff" : "#8a6d1f",
                fontWeight: on ? 700 : 400,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
