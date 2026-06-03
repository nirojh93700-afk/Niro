"use client";

import { useState, useEffect } from "react";

// Réglages d'apparence : couleur principale, bandeau d'annonce, textes d'accueil.
export default function AppearanceAdmin({ adminKey }) {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (res.ok) setS((await res.json()).settings);
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  async function save(patch) {
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setS((await res.json()).settings);
      setMsg("Enregistré ✓ (visible sur le site dans 1-2 min)");
    } else {
      setMsg("Échec de l'enregistrement.");
    }
  }

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;
  if (!s) return <div className="notice">Impossible de charger les réglages.</div>;

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Personnalise l'apparence de ton site. Laisse vide pour garder les valeurs par défaut.
      </p>
      {msg && <div className="notice">{msg}</div>}

      {/* Couleur principale */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Couleur principale (or)</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="color" value={s.color || "#c2a14e"}
            onChange={(e) => setS({ ...s, color: e.target.value })}
            style={{ width: 56, height: 40, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} />
          <input className="admin-field" value={s.color || ""} placeholder="#c2a14e (vide = défaut)"
            onChange={(e) => setS({ ...s, color: e.target.value })} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-gold" onClick={() => save({ color: s.color || "" })}>Enregistrer la couleur</button>
          <button className="btn btn-outline" onClick={() => { setS({ ...s, color: "" }); save({ color: "" }); }}>Réinitialiser</button>
        </div>
      </div>

      {/* Bandeau d'annonce */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Bandeau d'annonce (en haut du site)</h3>
        <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={s.announce?.enabled || false} style={{ width: "auto" }}
            onChange={(e) => setS({ ...s, announce: { ...s.announce, enabled: e.target.checked } })} />
          Afficher le bandeau
        </label>
        <label className="admin-field">Message
          <input value={s.announce?.text || ""} placeholder="Ex : Livraison offerte dès 45 € d'achat 🚚"
            onChange={(e) => setS({ ...s, announce: { ...s.announce, text: e.target.value } })} />
        </label>
        <label className="admin-field">Lien (facultatif)
          <input value={s.announce?.link || ""} placeholder="/boutique"
            onChange={(e) => setS({ ...s, announce: { ...s.announce, link: e.target.value } })} />
        </label>
        <button className="btn btn-gold" onClick={() => save({ announce: s.announce })}>Enregistrer le bandeau</button>
      </div>

      {/* Textes d'accueil */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Page d'accueil (textes)</h3>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>Laisse vide pour garder le texte par défaut.</p>
        <label className="admin-field">Petit titre (au-dessus)
          <input value={s.hero?.eyebrow || ""} placeholder="Atelier français · gravure laser"
            onChange={(e) => setS({ ...s, hero: { ...s.hero, eyebrow: e.target.value } })} />
        </label>
        <label className="admin-field">Grand titre
          <input value={s.hero?.title || ""} placeholder="Des créations uniques, gravées avec émotion."
            onChange={(e) => setS({ ...s, hero: { ...s.hero, title: e.target.value } })} />
        </label>
        <label className="admin-field">Paragraphe
          <textarea value={s.hero?.text || ""} style={{ minHeight: 70 }} placeholder="Bijoux, décorations de mariage…"
            onChange={(e) => setS({ ...s, hero: { ...s.hero, text: e.target.value } })} />
        </label>
        <label className="admin-field">Bouton principal
          <input value={s.hero?.cta1 || ""} placeholder="Découvrir la boutique"
            onChange={(e) => setS({ ...s, hero: { ...s.hero, cta1: e.target.value } })} />
        </label>
        <label className="admin-field">Bouton secondaire
          <input value={s.hero?.cta2 || ""} placeholder="Collection mariage"
            onChange={(e) => setS({ ...s, hero: { ...s.hero, cta2: e.target.value } })} />
        </label>
        <button className="btn btn-gold" onClick={() => save({ hero: s.hero })}>Enregistrer les textes</button>
      </div>
    </>
  );
}
