"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartContext";

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

function LignePills({ value, onChange }) {
  return (
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
  );
}

// Depuis le 20/09/2026 (maquette `docs/maquettes/cadeau-colis.html`), l'encadré
// vit aussi SANS le mode vacances : l'interrupteur « 🎁 Cadeau dans chaque colis »
// (Gestion → Apparence) l'allume seul — alors plus aucun paragraphe de délai,
// et « cadeau d'attente » devient « cadeau dans votre colis ».
export default function CadeauChoix({ value, onChange, value2, onChange2 }) {
  const [cfg, setCfg] = useState(null); // { vac: {message} | null, cadeau: {text, viaVacances} }
  const { total } = useCart(); // « 2 cadeaux dès 80 € » : la ligne suit le panier en direct
  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cadeau) setCfg({ vac: d.vacation?.message ? d.vacation : null, cadeau: d.cadeau });
        else if (d?.vacation?.message) setCfg({ vac: d.vacation, cadeau: { text: "", viaVacances: true } }); // repli : ancien serveur
      })
      .catch(() => {});
  }, []);
  if (!cfg) return null;
  const { vac, cadeau } = cfg;
  const viaVacances = Boolean(vac);

  return (
    <div style={{ background: "#fdf6e8", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 12px 14px", margin: "0 0 14px" }}>
      {/* 1) Le message complet du délai — le MÊME texte que le bandeau, lu en
          direct dans les réglages (le panier suit toute modification). Absent
          hors mode vacances. */}
      {viaVacances ? <div style={{ fontSize: ".84rem", color: "#6b5516", lineHeight: 1.5, marginBottom: 10 }}>{vac.message}</div> : null}
      {/* 2) La phrase du cadeau + 3) le choix, dans le même encadré. */}
      <div style={{ fontWeight: 700, color: "#8a6d1f", fontSize: ".92rem", marginBottom: 4 }}>
        {viaVacances ? <>🎁 Votre cadeau d&apos;attente — offert</> : <>🎁 Un cadeau dans votre colis — offert</>}
      </div>
      <div style={{ fontSize: ".82rem", color: "#6b5516", lineHeight: 1.45, marginBottom: 8 }}>
        {viaVacances
          ? "Pour vous remercier de votre patience, un cadeau surprise est glissé dans votre commande. Dites-nous votre préférence :"
          : `${cadeau.text || "Un cadeau surprise est glissé dans chaque commande."} Dites-nous votre préférence :`}
      </div>
      {(Number(total) || 0) >= 80 ? (
        <>
          {/* ≥ 80 € : DEUX cadeaux → un choix par cadeau (panachage possible). */}
          <div style={{ fontSize: ".82rem", color: "#256b34", fontWeight: 700, marginBottom: 10 }}>🎁🎁 Votre commande contient deux cadeaux !</div>
          <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#8a6d1f", margin: "0 0 5px" }}>Cadeau 1 :</div>
          <LignePills value={value} onChange={onChange} />
          <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#8a6d1f", margin: "10px 0 5px" }}>Cadeau 2 :</div>
          <LignePills value={value2} onChange={onChange2} />
        </>
      ) : (
        <>
          <div style={{ fontSize: ".82rem", color: "#8a6d1f", marginBottom: 10 }}>✨ Et dès 80 € d&apos;achat, <strong>deux cadeaux</strong> vous sont offerts.</div>
          <LignePills value={value} onChange={onChange} />
        </>
      )}
    </div>
  );
}
