"use client";

// =============================================================================
// Éditeur « Couverts enfants » — méthode FIABLE par gros plan.
// Chaque couvert a son propre gros plan (manche centré). Le prénom et l'animal
// sont posés selon UN réglage commun (même taille/position pour tous) → toujours
// cohérent et bien placé. Réglage lu depuis l'admin (/api/couverts-zones).
// =============================================================================
import { useEffect, useRef, useState } from "react";
import { getFontClass } from "@/lib/fonts";

const DEF = { cx: 0.5, nameY: 0.47, animalY: 0.71, nameSize: 0.17, animalH: 0.11 };

function Closeup({ image, prenom, fontClass, animal, pos }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const u = () => setW(el.clientWidth); u();
    const ro = new ResizeObserver(u); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const z = { ...DEF, ...(pos || {}) };
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 170, margin: "0 auto", aspectRatio: "174 / 615", background: "#fff", borderRadius: 12, border: "1px solid var(--line)", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      {prenom ? (
        <span className={fontClass} style={{
          position: "absolute", left: `${z.cx * 100}%`, top: `${z.nameY * 100}%`,
          transform: `translate(-50%,-50%) rotate(-90deg) scaleX(${z.nameW ?? 1})`, transformOrigin: "center",
          fontSize: w ? `${z.nameSize * w}px` : "26px", color: "#3a2f1d", whiteSpace: "nowrap", fontWeight: 600, pointerEvents: "none",
        }}>{prenom}</span>
      ) : null}
      {animal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={animal.img} alt={animal.label} style={{ position: "absolute", left: `${z.cx * 100}%`, top: `${z.animalY * 100}%`, transform: "translate(-50%,-50%)", height: `${z.animalH * 100}%`, width: z.animalW ? `${z.animalW * 100}%` : "auto", opacity: 0.9, pointerEvents: "none" }} />
      ) : null}
    </div>
  );
}

export default function CouvertsDesigner({ field, value, onChange, prenom = "", fontKey = "" }) {
  const themes = field.themes || [];
  const pieces = field.pieces || [];
  const v = value && value.animals ? value : { theme: themes[0]?.key, animals: {} };
  const theme = themes.find((t) => t.key === v.theme) || themes[0];
  const fontClass = getFontClass(fontKey);

  const [pos, setPos] = useState(DEF);
  useEffect(() => {
    let on = true;
    fetch("/api/couverts-zones").then((r) => r.json()).then((d) => {
      if (on && d.zones?.handle) setPos({ ...DEF, ...d.zones.handle });
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  function setTheme(k) { onChange({ theme: k, animals: {} }); }
  function setAnimal(pieceKey, animalKey) { onChange({ theme: v.theme, animals: { ...v.animals, [pieceKey]: animalKey } }); }

  const handleImg = (p) => p.handleImg || `/produits/couverts_manche_${p.key}.jpg`;

  return (
    <div className="field">
      {field.label && <label>{field.label}</label>}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "6px 0 16px" }}>
        {pieces.map((p) => {
          const ak = v.animals[p.key];
          const animal = ak ? (theme?.animals || []).find((a) => a.key === ak) : null;
          return (
            <div key={p.key} style={{ width: "23%", minWidth: 78, maxWidth: 130 }}>
              <Closeup image={handleImg(p)} prenom={prenom} fontClass={fontClass} animal={animal} pos={pos} />
              <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--ink-soft)", margin: "4px 0 0" }}>{p.label}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {themes.map((t) => (
          <button type="button" key={t.key} className={`filter-chip ${v.theme === t.key ? "active" : ""}`}
            style={{ padding: "4px 16px" }} onClick={() => setTheme(t.key)}>{t.label}</button>
        ))}
      </div>

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
