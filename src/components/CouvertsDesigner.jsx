"use client";

// =============================================================================
// Éditeur « Couverts enfants » — choix d'un animal par couvert + prénom.
// Deux vues : photo normale (4 couverts) et gros plan des manches (vraies photos).
// Les positions de gravure (par vue) sont réglées dans l'admin et lues ici.
// =============================================================================
import { useEffect, useRef, useState } from "react";
import { getFontClass } from "@/lib/fonts";

function Board({ image, aspect, pieces, zoneKey, zones, v, theme, prenom, fontClass }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const u = () => setW(el.clientWidth); u();
    const ro = new ResizeObserver(u); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 540, margin: "0 auto 14px", aspectRatio: aspect, background: "#fff", borderRadius: 12, border: "1px solid var(--line)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      {pieces.map((p) => {
        const base = zoneKey === "zoom" ? (p.zoomZone || {}) : (p.zone || {});
        const ov = (zones[zoneKey] || {})[p.key] || {};
        const z = { ...base, ...ov };
        const cx = z.cx ?? 0.5, nameCy = z.nameCy ?? 0.6, animalCy = z.animalCy ?? 0.78, animalH = z.animalH ?? 0.07, nameSize = z.nameSize;
        const ak = v.animals[p.key];
        const animal = ak ? (theme?.animals || []).find((a) => a.key === ak) : null;
        return (
          <div key={p.key}>
            {prenom ? (
              <span className={fontClass} style={{
                position: "absolute", left: `${cx * 100}%`, top: `${nameCy * 100}%`,
                transform: `translate(-50%, -50%) rotate(-90deg) scaleX(${z.nameW ?? 1})`, transformOrigin: "center",
                fontSize: nameSize && w ? `${nameSize * w}px` : "clamp(12px, 3.6vw, 18px)", lineHeight: 1, color: "#3a2f1d",
                whiteSpace: "nowrap", fontWeight: 600, pointerEvents: "none",
              }}>{prenom}</span>
            ) : null}
            {animal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={animal.img} alt={animal.label} style={{
                position: "absolute", left: `${cx * 100}%`, top: `${animalCy * 100}%`,
                height: `${animalH * 100}%`, width: z.animalW ? `${z.animalW * 100}%` : "auto",
                transform: "translate(-50%, -50%)", opacity: 0.9, pointerEvents: "none",
              }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function CouvertsDesigner({ field, value, onChange, prenom = "", fontKey = "" }) {
  const themes = field.themes || [];
  const pieces = field.pieces || [];
  const v = value && value.animals ? value : { theme: themes[0]?.key, animals: {} };
  const theme = themes.find((t) => t.key === v.theme) || themes[0];
  const fontClass = getFontClass(fontKey);

  const [zones, setZones] = useState({ base: {}, zoom: {} });
  useEffect(() => {
    let on = true;
    fetch("/api/couverts-zones").then((r) => r.json()).then((d) => {
      if (on) setZones({ base: d.zones?.base || {}, zoom: d.zones?.zoom || {} });
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  function setTheme(k) { onChange({ theme: k, animals: {} }); }
  function setAnimal(pieceKey, animalKey) { onChange({ theme: v.theme, animals: { ...v.animals, [pieceKey]: animalKey } }); }

  return (
    <div className="field">
      {field.label && <label>{field.label}</label>}

      <Board image={field.base} aspect="1 / 1" pieces={pieces} zoneKey="base" zones={zones} v={v} theme={theme} prenom={prenom} fontClass={fontClass} />

      {field.zoomImage ? (
        <>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", textAlign: "center", margin: "0 0 6px" }}>Gros plan des manches</p>
          <Board image={field.zoomImage} aspect={field.zoomAspect || "1076 / 565"} pieces={pieces} zoneKey="zoom" zones={zones} v={v} theme={theme} prenom={prenom} fontClass={fontClass} />
        </>
      ) : null}

      {/* Choix du thème */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {themes.map((t) => (
          <button type="button" key={t.key} className={`filter-chip ${v.theme === t.key ? "active" : ""}`}
            style={{ padding: "4px 16px" }} onClick={() => setTheme(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Un animal par couvert */}
      {pieces.map((p) => (
        <div key={p.key} style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>{p.label}</label>
          <div className="modele-motifs">
            <button type="button" className={`modele-motif-cell${!v.animals[p.key] ? " on" : ""}`} onClick={() => setAnimal(p.key, "")} aria-label="Aucun">
              <span className="modele-motif-none">Aucun</span>
            </button>
            {(theme?.animals || []).map((a) => (
              <button type="button" key={a.key} className={`modele-motif-cell${v.animals[p.key] === a.key ? " on" : ""}`} onClick={() => setAnimal(p.key, a.key)} aria-label={a.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.label} style={{ width: 40, height: 40, objectFit: "contain" }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
