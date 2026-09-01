"use client";

import { useState } from "react";

// « 📩 Prévenez-moi dès son retour » — affiché sous « Épuisé » sur une fiche
// en rupture (maquette validée le 01/09/2026). Enregistre l'e-mail via
// /api/restock-alert ; AUCUN envoi automatique (la gérante déclenche depuis
// Gestion → Produits & Stock).
export default function RestockAlerte({ slug }) {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState(""); // "" | "envoi" | "ok" | "deja" | "erreur"

  async function inscrire() {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setEtat("erreur"); return; }
    setEtat("envoi");
    try {
      const res = await fetch("/api/restock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: e }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setEtat(d.deja ? "deja" : "ok");
      else setEtat("erreur");
    } catch { setEtat("erreur"); }
  }

  if (etat === "ok" || etat === "deja") {
    return (
      <div style={{ marginTop: 10, background: "#fdf6e8", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 14px", fontSize: "0.86rem", color: "#256b34", fontWeight: 600 }}>
        ✓ C&apos;est noté ! Nous vous écrirons dès son retour.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, background: "#fdf6e8", border: "1px solid #e7d3a1", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontWeight: 700, color: "#8a6d1f", fontSize: "0.88rem", marginBottom: 8 }}>📩 Prévenez-moi dès son retour</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (etat === "erreur") setEtat(""); }}
          placeholder="Votre e-mail"
          style={{ flex: 1, border: "1px solid #d8bd6e", borderRadius: 999, padding: "9px 12px", fontSize: "0.85rem", background: "#fff", color: "inherit", minWidth: 0 }}
        />
        <button
          type="button"
          onClick={inscrire}
          disabled={etat === "envoi"}
          style={{ background: "#c9a24b", color: "#fff", fontWeight: 700, border: "none", borderRadius: 999, padding: "9px 14px", fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {etat === "envoi" ? "…" : "Me prévenir"}
        </button>
      </div>
      {etat === "erreur" && <div style={{ marginTop: 6, fontSize: "0.8rem", color: "#b4452f" }}>Vérifiez votre adresse e-mail.</div>}
    </div>
  );
}
