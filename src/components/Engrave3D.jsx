"use client";

import { useEffect, useRef, useState } from "react";

// Aperçu 3D d'un bijou à forme simple (barre / plaque rectangulaire).
// Le client fait pivoter l'objet et voit son texte gravé sur les 4 faces,
// en direct. Pas de photo nécessaire, pas de dépendance (CSS 3D pur).

const FINISHES = {
  silver: { grad: "linear-gradient(135deg,#f2f2f2,#b7b7b7 45%,#e0e0e0)", edge: "#9a9a9a", ink: "rgba(55,50,44,.9)" },
  gold:   { grad: "linear-gradient(135deg,#f8ecc0,#c9a648 48%,#eedb93)", edge: "#b1893a", ink: "rgba(70,50,12,.92)" },
  rose:   { grad: "linear-gradient(135deg,#f4d6d6,#cf9a9a 48%,#e9bfbf)", edge: "#bd8585", ink: "rgba(80,40,40,.9)" },
  black:  { grad: "linear-gradient(135deg,#4a4a4a,#1b1b1b 48%,#363636)", edge: "#111", ink: "rgba(238,238,238,.92)" },
  rainbow:{ grad: "linear-gradient(135deg,#ff7eb3,#7ec8ff,#9cff9c,#ffd47e)", edge: "#bbb", ink: "rgba(45,35,35,.9)" },
};

const W = 48;   // largeur faces avant/arrière
const D = 32;   // profondeur (faces latérales)
const H = 240;  // hauteur de la barre

export default function Engrave3D({ faces = [], finish = "silver", fontClass = "" }) {
  const [angle, setAngle] = useState(18);
  const dragging = useRef(false);
  const lastX = useRef(0);

  // Rotation automatique lente tant que l'utilisateur ne touche pas.
  useEffect(() => {
    let id;
    const tick = () => {
      if (!dragging.current) setAngle((a) => a + 0.25);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);
  const onDown = (e) => { dragging.current = true; lastX.current = getX(e); };
  const onMove = (e) => {
    if (!dragging.current) return;
    const x = getX(e);
    setAngle((a) => a + (x - lastX.current) * 0.6);
    lastX.current = x;
  };
  const onUp = () => { dragging.current = false; };

  const f = FINISHES[finish] || FINISHES.silver;

  const faceStyle = (w, h) => ({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: w,
    height: h,
    marginLeft: -w / 2,
    marginTop: -h / 2,
    background: f.grad,
    border: `1px solid ${f.edge}`,
    borderRadius: 5,
    boxShadow: "inset 0 0 16px rgba(0,0,0,.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    overflow: "hidden",
  });

  const textStyle = {
    writingMode: "vertical-rl",
    textOrientation: "upright",
    color: f.ink,
    fontWeight: 600,
    letterSpacing: 3,
    fontSize: 14,
    lineHeight: 1,
    whiteSpace: "nowrap",
    maxHeight: H - 16,
    overflow: "hidden",
  };

  // Ordre : avant (face1), droite (face3), arrière (face2), gauche (face4).
  const cfg = [
    { t: faces[0], w: W, h: H, tf: `translateZ(${D / 2}px)` },
    { t: faces[2], w: D, h: H, tf: `rotateY(90deg) translateZ(${W / 2}px)` },
    { t: faces[1], w: W, h: H, tf: `rotateY(180deg) translateZ(${D / 2}px)` },
    { t: faces[3], w: D, h: H, tf: `rotateY(-90deg) translateZ(${W / 2}px)` },
  ];

  const anyText = faces.some((t) => (t || "").trim());

  return (
    <div className="engrave3d" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "6px 0 4px" }}>
      <div
        style={{ perspective: "1000px", width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      >
        <div style={{ position: "relative", width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(-10deg) rotateY(${angle}deg)` }}>
          {cfg.map((c, i) => (
            <div key={i} style={{ ...faceStyle(c.w, c.h), transform: c.tf }}>
              <span className={fontClass} style={textStyle}>
                {(c.t || "").trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
        ↔ Faites pivoter le bijou {anyText ? "pour voir vos 4 faces gravées" : "(votre texte apparaîtra sur chaque face)"}
      </span>
    </div>
  );
}
