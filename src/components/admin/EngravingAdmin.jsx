"use client";

import { useState, Fragment } from "react";
import { getCategoryLabel } from "@/lib/products";

const CAT_ORDER = ["bijoux", "verres", "mariage", "deco", "cadeaux"];
const catRank = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? 99 : i; };

// Réglage de la zone de gravure sur la photo de chaque produit.
export default function EngravingAdmin({ adminKey, products, onReload }) {
  const [openSlug, setOpenSlug] = useState(null);
  const [msg, setMsg] = useState("");

  async function save(slug, preview) {
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "edit", slug, patch: { preview } }),
    });
    setMsg(res.ok ? "Zone de gravure enregistrée ✓ (visible sur le site dans 1-2 min)" : "Échec.");
    if (res.ok) onReload();
  }

  const withPhoto = products.filter((p) => p.image)
    .sort((a, b) => (catRank(a.category) - catRank(b.category)) || (a.name || "").localeCompare(b.name || ""));

  // Position par défaut quand on "Active" sans avoir encore réglé (centrée, ajustable ensuite).
  const DEFAULT_PREVIEW = { inset: "auto", top: "42%", left: "25%", width: "50%", fontSize: "1.4rem" };

  return (
    <>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Pour chaque produit : <strong>Activer</strong> l'aperçu de gravure sur la photo (le texte du client apparaît
        directement sur l'image), puis <strong>Régler</strong> sa position et sa taille. Désactivé = aucun texte sur la photo.
      </p>
      {msg && <div className="notice">{msg}</div>}

      {withPhoto.map((p, idx) => (
        <Fragment key={p.slug}>
        {(idx === 0 || withPhoto[idx - 1].category !== p.category) && (
          <h3 style={{ fontFamily: "Georgia,serif", color: "var(--gold-dark)", margin: "20px 0 6px", borderBottom: "2px solid #e7d9bd", paddingBottom: 4 }}>{getCategoryLabel(p.category)}</h3>
        )}
        <div className="admin-block">
          <div className="admin-row" style={{ gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8 }}>
            <span className="admin-variant">
              <strong>{p.name}</strong>{" "}
              {p.preview
                ? <span style={{ color: "#256b34" }}>· aperçu activé ✓</span>
                : <span style={{ color: "var(--ink-soft)" }}>· aperçu désactivé</span>}
            </span>
            <button
              className="btn btn-outline"
              style={{ padding: "4px 12px", fontSize: "0.85rem", color: p.preview ? "#b4452f" : "#256b34", borderColor: p.preview ? "#e7b7ad" : "#bfe2c6" }}
              onClick={() => save(p.slug, p.preview ? null : DEFAULT_PREVIEW)}
            >
              {p.preview ? "Désactiver" : "Activer"}
            </button>
            <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "0.85rem" }}
              onClick={() => setOpenSlug(openSlug === p.slug ? null : p.slug)}>
              {openSlug === p.slug ? "Fermer" : "Régler"}
            </button>
          </div>
          {openSlug === p.slug && (
            <EngraveEditor product={p} onSave={(prev) => save(p.slug, prev)} onDisable={() => save(p.slug, null)} />
          )}
        </div>
        </Fragment>
      ))}
    </>
  );
}

function parsePct(v, def) {
  if (typeof v !== "string") return def;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

function EngraveEditor({ product, onSave, onDisable }) {
  const pv = product.preview || {};
  const [top, setTop] = useState(parsePct(pv.top, 42));
  const [left, setLeft] = useState(parsePct(pv.left, 25));
  const [width, setWidth] = useState(parsePct(pv.width, 50));
  const [size, setSize] = useState(parsePct(pv.fontSize, 1.4));

  const overlayStyle = {
    position: "absolute",
    inset: "auto",
    top: `${top}%`,
    left: `${left}%`,
    width: `${width}%`,
    fontSize: `${size}rem`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#3a2f1d",
    pointerEvents: "none",
    fontFamily: "var(--font-display), serif",
    textShadow: "0 1px 0 rgba(255,255,255,.55), 0 -1px 1px rgba(0,0,0,.35)",
    lineHeight: 1.2,
  };

  const Row = ({ label, val, set, min, max, step }) => (
    <label className="admin-field">{label} : {val}{label.includes("Taille") ? "" : "%"}
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => set(parseFloat(e.target.value))} style={{ width: "100%" }} />
    </label>
  );

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
      {/* Aperçu en direct */}
      <div style={{ position: "relative", width: "100%", maxWidth: 320, margin: "0 auto", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} style={{ display: "block", width: "100%" }} />
        <div style={overlayStyle}>Texte gravé</div>
      </div>
      <Row label="Position verticale (haut)" val={top} set={setTop} min={0} max={90} step={1} />
      <Row label="Position horizontale (gauche)" val={left} set={setLeft} min={0} max={90} step={1} />
      <Row label="Largeur de la zone" val={width} set={setWidth} min={15} max={90} step={1} />
      <Row label="Taille du texte" val={size} set={setSize} min={0.6} max={3} step={0.1} />
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-gold" onClick={() => onSave({ inset: "auto", top: `${top}%`, left: `${left}%`, width: `${width}%`, fontSize: `${size}rem` })}>
          Enregistrer la zone
        </button>
        <button className="btn btn-outline" onClick={onDisable} style={{ color: "#b4452f" }}>Désactiver (pas de gravure)</button>
      </div>
    </div>
  );
}
