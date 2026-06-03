"use client";

import { useState, useEffect } from "react";

const FONTS = [
  { v: "", label: "Par défaut" },
  { v: "playfair", label: "Playfair — élégante (serif)" },
  { v: "cinzel", label: "Cinzel — chic (serif)" },
  { v: "cinzel-deco", label: "Cinzel Decorative" },
  { v: "montserrat", label: "Montserrat — moderne" },
  { v: "great-vibes", label: "Great Vibes — manuscrite" },
  { v: "allura", label: "Allura — manuscrite fine" },
  { v: "pacifico", label: "Pacifico — décontractée" },
  { v: "inter", label: "Inter — simple" },
];
const CAT_NAMES = ["Carte 1 (Bijoux)", "Carte 2 (Mariage)", "Carte 3 (Cadeaux)"];

export default function AppearanceAdmin({ adminKey }) {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
        if (res.ok) {
          const data = (await res.json()).settings;
          // garantit 3 cartes catégories éditables
          data.categories = [0, 1, 2].map((i) => data.categories?.[i] || { label: "", sub: "", image: "" });
          setS(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  async function save(patch, label) {
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = (await res.json()).settings;
      setMsg((label || "Enregistré") + " ✓ (visible sur le site dans 1-2 min)");
    } else {
      setMsg("Échec de l'enregistrement.");
    }
  }

  if (loading) return <p style={{ color: "var(--ink-soft)" }}>Chargement…</p>;
  if (!s) return <div className="notice">Impossible de charger les réglages.</div>;

  const set = (patch) => setS({ ...s, ...patch });
  const setHero = (patch) => setS({ ...s, hero: { ...s.hero, ...patch } });
  const setAtelier = (patch) => setS({ ...s, atelier: { ...s.atelier, ...patch } });
  const setCat = (i, patch) => setS({ ...s, categories: s.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setSection = (k, v) => setS({ ...s, sections: { ...s.sections, [k]: v } });

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Personnalise l'apparence de ton site. Laisse un champ vide pour garder la valeur par défaut.
      </p>
      {msg && <div className="notice">{msg}</div>}

      {/* COULEUR */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🎨 Couleur principale</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="color" value={s.color || "#c2a14e"} onChange={(e) => set({ color: e.target.value })}
            style={{ width: 56, height: 40, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} />
          <input className="admin-field" value={s.color || ""} placeholder="#c2a14e (vide = défaut)"
            onChange={(e) => set({ color: e.target.value })} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-gold" onClick={() => save({ color: s.color || "" }, "Couleur enregistrée")}>Enregistrer</button>
          <button className="btn btn-outline" onClick={() => { set({ color: "" }); save({ color: "" }, "Couleur réinitialisée"); }}>Réinitialiser</button>
        </div>
      </div>

      {/* POLICES */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🔤 Polices du site</h3>
        <label className="admin-field">Police des titres
          <select value={s.fontHeading || ""} onChange={(e) => set({ fontHeading: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </label>
        <label className="admin-field">Police du texte
          <select value={s.fontBody || ""} onChange={(e) => set({ fontBody: e.target.value })}>
            {FONTS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
          </select>
        </label>
        <button className="btn btn-gold" onClick={() => save({ fontHeading: s.fontHeading || "", fontBody: s.fontBody || "" }, "Polices enregistrées")}>Enregistrer les polices</button>
      </div>

      {/* BANDEAU */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>📢 Bandeau d'annonce</h3>
        <label className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={s.announce?.enabled || false} style={{ width: "auto" }}
            onChange={(e) => set({ announce: { ...s.announce, enabled: e.target.checked } })} />
          Afficher le bandeau en haut du site
        </label>
        <label className="admin-field">Message
          <input value={s.announce?.text || ""} placeholder="Ex : Livraison offerte dès 45 € 🚚"
            onChange={(e) => set({ announce: { ...s.announce, text: e.target.value } })} />
        </label>
        <label className="admin-field">Lien (facultatif)
          <input value={s.announce?.link || ""} placeholder="/boutique"
            onChange={(e) => set({ announce: { ...s.announce, link: e.target.value } })} />
        </label>
        <button className="btn btn-gold" onClick={() => save({ announce: s.announce }, "Bandeau enregistré")}>Enregistrer le bandeau</button>
      </div>

      {/* ACCUEIL — HERO */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🏠 Accueil — bandeau principal</h3>
        <label className="admin-field">Petit titre
          <input value={s.hero?.eyebrow || ""} placeholder="Atelier français · gravure laser" onChange={(e) => setHero({ eyebrow: e.target.value })} />
        </label>
        <label className="admin-field">Grand titre
          <input value={s.hero?.title || ""} placeholder="Des créations uniques…" onChange={(e) => setHero({ title: e.target.value })} />
        </label>
        <label className="admin-field">Paragraphe
          <textarea value={s.hero?.text || ""} style={{ minHeight: 70 }} onChange={(e) => setHero({ text: e.target.value })} />
        </label>
        <label className="admin-field">Bouton principal
          <input value={s.hero?.cta1 || ""} placeholder="Découvrir la boutique" onChange={(e) => setHero({ cta1: e.target.value })} />
        </label>
        <label className="admin-field">Bouton secondaire
          <input value={s.hero?.cta2 || ""} placeholder="Collection mariage" onChange={(e) => setHero({ cta2: e.target.value })} />
        </label>
        <label className="admin-field">Image principale (lien)
          <input value={s.hero?.image || ""} placeholder="https://… (vide = image par défaut)" onChange={(e) => setHero({ image: e.target.value })} />
        </label>
        <button className="btn btn-gold" onClick={() => save({ hero: s.hero }, "Accueil enregistré")}>Enregistrer le bandeau principal</button>
      </div>

      {/* ACCUEIL — CARTES CATÉGORIES */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🗂️ Accueil — 3 cartes catégories</h3>
        {s.categories.map((c, i) => (
          <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 10 : 0, display: "grid", gap: 8 }}>
            <strong style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{CAT_NAMES[i]}</strong>
            <label className="admin-field">Titre<input value={c.label || ""} onChange={(e) => setCat(i, { label: e.target.value })} /></label>
            <label className="admin-field">Sous-titre<input value={c.sub || ""} onChange={(e) => setCat(i, { sub: e.target.value })} /></label>
            <label className="admin-field">Image (lien)<input value={c.image || ""} placeholder="https://…" onChange={(e) => setCat(i, { image: e.target.value })} /></label>
          </div>
        ))}
        <button className="btn btn-gold" onClick={() => save({ categories: s.categories }, "Cartes enregistrées")}>Enregistrer les cartes</button>
      </div>

      {/* ACCUEIL — ATELIER */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>🪵 Accueil — section atelier</h3>
        <label className="admin-field">Petit titre<input value={s.atelier?.eyebrow || ""} onChange={(e) => setAtelier({ eyebrow: e.target.value })} /></label>
        <label className="admin-field">Titre<input value={s.atelier?.title || ""} onChange={(e) => setAtelier({ title: e.target.value })} /></label>
        <label className="admin-field">Paragraphe 1<textarea value={s.atelier?.text1 || ""} style={{ minHeight: 60 }} onChange={(e) => setAtelier({ text1: e.target.value })} /></label>
        <label className="admin-field">Paragraphe 2<textarea value={s.atelier?.text2 || ""} style={{ minHeight: 60 }} onChange={(e) => setAtelier({ text2: e.target.value })} /></label>
        <label className="admin-field">Image (lien)<input value={s.atelier?.image || ""} placeholder="https://…" onChange={(e) => setAtelier({ image: e.target.value })} /></label>
        <button className="btn btn-gold" onClick={() => save({ atelier: s.atelier }, "Atelier enregistré")}>Enregistrer l'atelier</button>
      </div>

      {/* SECTIONS ON/OFF */}
      <div className="admin-block" style={{ display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>👁️ Sections de l'accueil (afficher / masquer)</h3>
        {[["categories", "Cartes catégories"], ["trust", "Bandeau confiance (4 atouts)"], ["featured", "Produits phares"], ["atelier", "Section atelier"]].map(([k, lbl]) => (
          <label key={k} className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={s.sections?.[k] !== false} style={{ width: "auto" }} onChange={(e) => setSection(k, e.target.checked)} />
            {lbl}
          </label>
        ))}
        <button className="btn btn-gold" onClick={() => save({ sections: s.sections }, "Sections enregistrées")}>Enregistrer les sections</button>
      </div>

      {/* PAGE À PROPOS */}
      <div className="admin-block" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>📄 Page « À propos »</h3>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
          Le contenu central de la page À propos. Tu peux écrire du texte simple, ou utiliser du HTML (titres &lt;h3&gt;, paragraphes &lt;p&gt;). Vide = texte par défaut.
        </p>
        <textarea value={s.apropos || ""} style={{ minHeight: 160 }}
          placeholder="<h3>Mon histoire</h3><p>…</p>" onChange={(e) => set({ apropos: e.target.value })} />
        <button className="btn btn-gold" onClick={() => save({ apropos: s.apropos || "" }, "Page À propos enregistrée")}>Enregistrer la page À propos</button>
      </div>
    </>
  );
}
