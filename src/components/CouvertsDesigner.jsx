"use client";

// =============================================================================
// Éditeur « Couverts enfants » — la cliente choisit un thème puis un animal
// pour chaque couvert (couteau, fourchette, grande/petite cuillère). L'animal
// + le prénom s'affichent automatiquement au bon endroit sur l'aperçu.
// Auto-suffisant : reçoit prénom + police en props (depuis les autres champs).
// =============================================================================
import { useEffect, useRef, useState } from "react";
import { getFontClass } from "@/lib/fonts";

export default function CouvertsDesigner({ field, value, onChange, prenom = "", fontKey = "" }) {
  const themes = field.themes || [];
  const pieces = field.pieces || [];
  const v = value && value.animals ? value : { theme: themes[0]?.key, animals: {} };
  const theme = themes.find((t) => t.key === v.theme) || themes[0];
  const fontClass = getFontClass(fontKey);

  // Positions réglées dans l'admin (priment sur les valeurs du code).
  const [zones, setZones] = useState({});
  useEffect(() => {
    let on = true;
    fetch("/api/couverts-zones").then((r) => r.json()).then((d) => { if (on) setZones(d.zones || {}); }).catch(() => {});
    return () => { on = false; };
  }, []);
  // Largeur réelle de l'aperçu (pour dimensionner le prénom à partir d'une fraction).
  const boxRef = useRef(null);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const upd = () => setBoxW(el.clientWidth);
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function setTheme(k) { onChange({ theme: k, animals: {} }); } // changer de thème remet les animaux à zéro
  function setAnimal(pieceKey, animalKey) {
    onChange({ theme: v.theme, animals: { ...v.animals, [pieceKey]: animalKey } });
  }

  return (
    <div className="field">
      {field.label && <label>{field.label}</label>}

      {/* Aperçu : les 4 couverts de face + animal/prénom posés sur chaque manche */}
      <div ref={boxRef} style={{ position: "relative", width: "100%", maxWidth: 440, margin: "0 auto 16px", aspectRatio: "1 / 1", background: "#fff", borderRadius: 12, border: "1px solid var(--line)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={field.base} alt="Couverts enfants" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        {pieces.map((p) => {
          const ak = v.animals[p.key];
          const animal = ak ? (theme?.animals || []).find((a) => a.key === ak) : null;
          const z = { ...(p.zone || {}), ...(zones[p.key] || {}) }; // réglage admin prioritaire
          const cx = z.cx ?? 0.5;
          const nameCy = z.nameCy ?? 0.64;
          const animalCy = z.animalCy ?? 0.77;
          const animalH = z.animalH ?? 0.07; // taille limitée par la HAUTEUR (petit)
          const nameSize = z.nameSize; // fraction de la largeur (si réglée dans l'admin)
          return (
            <div key={p.key}>
              {prenom ? (
                <span className={fontClass} style={{
                  position: "absolute", left: `${cx * 100}%`, top: `${nameCy * 100}%`,
                  transform: "translate(-50%, -50%) rotate(-90deg)", transformOrigin: "center",
                  fontSize: nameSize && boxW ? `${nameSize * boxW}px` : "clamp(13px, 4.2vw, 20px)", lineHeight: 1, color: "#3a2f1d",
                  whiteSpace: "nowrap", fontWeight: 600, pointerEvents: "none",
                }}>{prenom}</span>
              ) : null}
              {animal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={animal.img} alt={animal.label} style={{
                  position: "absolute", left: `${cx * 100}%`, top: `${animalCy * 100}%`,
                  height: `${animalH * 100}%`, width: "auto", transform: "translate(-50%, -50%)",
                  opacity: 0.9, pointerEvents: "none",
                }} />
              ) : null}
            </div>
          );
        })}
      </div>

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
