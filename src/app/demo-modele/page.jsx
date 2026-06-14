"use client";

// PAGE DE DÉMONSTRATION (maquette) — pour comprendre le "moteur de modèles".
// Séparée de la boutique, non reliée au catalogue. Sert juste à visualiser l'idée.

import { useState } from "react";

// --- Petite bibliothèque de motifs (dessins au trait, blancs) ---
const MOTIFS = {
  aucun: null,
  coeur: (
    <path d="M32 56 C 6 38 8 16 24 16 C 32 16 32 24 32 28 C 32 24 32 16 40 16 C 56 16 58 38 32 56 Z"
      fill="none" stroke="#fff" strokeWidth="2.5" />
  ),
  ancre: (
    <g fill="none" stroke="#fff" strokeWidth="2.5">
      <circle cx="32" cy="14" r="5" />
      <line x1="32" y1="19" x2="32" y2="52" />
      <line x1="20" y1="28" x2="44" y2="28" />
      <path d="M14 40 C 14 52 26 54 32 54 C 38 54 50 52 50 40" />
    </g>
  ),
  etoile: (
    <path d="M32 10 L38 26 L55 26 L41 36 L46 53 L32 43 L18 53 L23 36 L9 26 L26 26 Z"
      fill="none" stroke="#fff" strokeWidth="2.5" />
  ),
  volute: (
    <g fill="none" stroke="#fff" strokeWidth="2.5">
      <path d="M6 32 C 18 18 26 18 32 32 C 38 46 46 46 58 32" />
      <circle cx="6" cy="32" r="3" /><circle cx="58" cy="32" r="3" />
    </g>
  ),
  rose: (
    <g fill="none" stroke="#fff" strokeWidth="2.2">
      <circle cx="32" cy="32" r="20" />
      <path d="M32 12 L36 32 L32 52 L28 32 Z M12 32 L32 28 L52 32 L32 36 Z" />
    </g>
  ),
};

// --- Modèles prêts (la "fiche de définition" dont je parlais) ---
const TEMPLATES = {
  peres: {
    label: "Fête des pères (3 lignes)",
    lines: [
      { key: "l1", label: "Texte du haut", value: "élu", font: "fnt-great-vibes", size: 34 },
      { key: "l2", label: "Mot central", value: "PAPY", font: "fnt-cinzel", size: 44, bold: true, spacing: 3 },
      { key: "l3", label: "Texte du bas", value: "DE L'ANNÉE", font: "fnt-cinzel", size: 18, spacing: 2 },
    ],
    motif: "etoile",
  },
  amour: {
    label: "Tendresse (1 ligne + motif)",
    lines: [
      { key: "l1", label: "Votre texte", value: "Mon Papounet", font: "fnt-great-vibes", size: 38 },
    ],
    motif: "coeur",
  },
};

export default function DemoModele() {
  const [tplKey, setTplKey] = useState("peres");
  const [values, setValues] = useState(() => textDefaults("peres"));
  const [motif, setMotif] = useState(TEMPLATES["peres"].motif);

  function textDefaults(k) {
    const o = {};
    TEMPLATES[k].lines.forEach((l) => (o[l.key] = l.value));
    return o;
  }
  function switchTpl(k) {
    setTplKey(k);
    setValues(textDefaults(k));
    setMotif(TEMPLATES[k].motif);
  }

  const tpl = TEMPLATES[tplKey];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 60px" }}>
      <p style={{ fontSize: "0.75rem", letterSpacing: 1, textTransform: "uppercase", color: "#b08d3a", fontWeight: 700 }}>
        Maquette — démonstration
      </p>
      <h1 style={{ fontSize: "1.35rem", margin: "4px 0 6px" }}>Atelier de composition</h1>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 18 }}>
        Le client choisit un modèle, écrit ses textes, choisit un motif — l'aperçu se met à jour sur le verre.
        (Page de test, non reliée à la boutique.)
      </p>

      {/* APERÇU sur le verre */}
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#111", marginBottom: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/produits/verre_a_whisky_grave_vide.jpg" alt="Verre" style={{ width: "100%", display: "block", opacity: 0.95 }} />
        <div style={{
          position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)",
          textAlign: "center", color: "#fff", width: "70%",
          textShadow: "0 0 6px rgba(255,255,255,0.35)",
        }}>
          {tpl.lines.map((l) => (
            <div key={l.key} className={values[l.key + "_font"] || l.font}
              style={{ fontSize: l.size, fontWeight: l.bold ? 700 : 400, letterSpacing: l.spacing || 0, lineHeight: 1.1, margin: "2px 0" }}>
              {values[l.key]}
            </div>
          ))}
          {motif && MOTIFS[motif] && (
            <svg viewBox="0 0 64 64" width="46" height="46" style={{ marginTop: 6 }}>{MOTIFS[motif]}</svg>
          )}
        </div>
      </div>

      {/* Choix du modèle */}
      <label style={lbl}>Modèle</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <button key={k} onClick={() => switchTpl(k)} style={chip(tplKey === k)}>{t.label}</button>
        ))}
      </div>

      {/* Champs texte */}
      {tpl.lines.map((l) => (
        <div key={l.key} style={{ marginBottom: 14 }}>
          <label style={lbl}>{l.label}</label>
          <input value={values[l.key]} onChange={(e) => setValues({ ...values, [l.key]: e.target.value })} style={inp} />
          {/* choix de la police pour cette ligne */}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {["fnt-great-vibes", "fnt-allura", "fnt-cinzel", "fnt-playfair", "fnt-montserrat"].map((f) => (
              <button key={f} onClick={() => setValues({ ...values, [l.key + "_font"]: f })}
                className={f} style={fontChip((values[l.key + "_font"] || l.font) === f)}>Aa</button>
            ))}
          </div>
        </div>
      ))}

      {/* Choix du motif */}
      <label style={lbl}>Graphisme</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 6 }}>
        {Object.keys(MOTIFS).map((k) => (
          <button key={k} onClick={() => setMotif(k)} style={motifCell(motif === k)}>
            {k === "aucun" ? <span style={{ color: "#999", fontSize: "0.8rem" }}>Aucun</span> : (
              <svg viewBox="0 0 64 64" width="40" height="40" style={{ filter: "invert(1)" }}>{MOTIFS[k]}</svg>
            )}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.78rem", color: "#888", marginTop: 22, lineHeight: 1.5 }}>
        Aperçu indicatif — la gravure finale est optimisée par l'atelier. Ceci est une maquette de principe :
        le vrai outil placerait la composition sur le verre (face ou fond), déplaçable et redimensionnable,
        avec une bibliothèque de motifs bien plus large.
      </p>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#444", marginBottom: 5 };
const inp = { width: "100%", padding: "9px 11px", border: "1px solid #d8d2c4", borderRadius: 8, fontSize: "1rem" };
const chip = (on) => ({
  padding: "8px 12px", borderRadius: 20, fontSize: "0.82rem", cursor: "pointer",
  border: on ? "1px solid #b08d3a" : "1px solid #d8d2c4", background: on ? "#faf3e2" : "#fff", color: "#333",
});
const fontChip = (on) => ({
  width: 42, height: 34, borderRadius: 7, cursor: "pointer", fontSize: "1.1rem",
  border: on ? "2px solid #b08d3a" : "1px solid #d8d2c4", background: "#fff",
});
const motifCell = (on) => ({
  aspectRatio: "1", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  border: on ? "2px solid #b08d3a" : "1px solid #d8d2c4", background: "#fff",
});
