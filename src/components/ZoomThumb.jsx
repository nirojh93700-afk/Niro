"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// Petite photo cliquable : au clic, une bulle s'ouvre JUSTE À CÔTÉ de la photo
// (pas au milieu de l'écran) avec l'image agrandie. Utilisé pour les photos
// d'emballage sur la fiche produit. Le clic n'active PAS le bouton parent
// (stopPropagation) — il ne fait qu'ouvrir/fermer l'aperçu.
export default function ZoomThumb({ photo, label, size = 40 }) {
  const [pos, setPos] = useState(null); // {left, top} ou null (fermé)
  const [mounted, setMounted] = useState(false);
  const thumbRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const place = useCallback(() => {
    const el = thumbRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pw = 150, gap = 10, ph = 178; // taille approx de la bulle
    let left = r.right + gap;
    if (left + pw > window.innerWidth - 8) left = r.left - gap - pw; // pas de place à droite → à gauche
    if (left < 8) left = 8;
    let top = r.top + r.height / 2 - ph / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
    setPos({ left, top });
  }, []);

  const open = (e) => { e.preventDefault(); e.stopPropagation(); place(); };
  const close = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    const onScroll = () => close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [pos]);

  const popup = pos && (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 4000 }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 4001, width: 150, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 7, boxShadow: "0 12px 32px rgba(0,0,0,.28)" }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          style={{ position: "absolute", top: -9, right: -9, width: 26, height: 26, borderRadius: "50%", border: 0, background: "#fff", boxShadow: "0 3px 9px rgba(0,0,0,.2)", fontSize: "1rem", lineHeight: 1, cursor: "pointer", color: "var(--ink)" }}
        >
          ×
        </button>
        <img src={photo} alt={label || ""} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block" }} />
        {label && <div style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 700, marginTop: 5, color: "var(--ink)" }}>{label}</div>}
      </div>
    </>
  );

  return (
    <>
      <span
        ref={thumbRef}
        onClick={open}
        role="button"
        tabIndex={0}
        aria-label={`Agrandir la photo${label ? " : " + label : ""}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") open(e); }}
        style={{ position: "relative", flex: `0 0 ${size}px`, width: size, height: size, borderRadius: 8, overflow: "hidden", cursor: "zoom-in", display: "block" }}
      >
        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <span style={{ position: "absolute", bottom: 1, right: 1, fontSize: "0.55rem", background: "rgba(255,255,255,.85)", borderRadius: 4, padding: "0 2px", lineHeight: 1.3 }}>🔍</span>
      </span>
      {mounted && popup && createPortal(popup, document.body)}
    </>
  );
}
