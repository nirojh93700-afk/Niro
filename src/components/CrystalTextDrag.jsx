"use client";

import { useEffect, useRef, useState } from "react";

// Placement + redimensionnement du texte gravé sur l'aperçu cristal
// (comme le verre gravé / les bijoux). Le client glisse le texte et change sa
// taille avec la poignée. On renvoie position + taille + libellé pour l'atelier.
function labelFor(x, y, scale) {
  const v = y < 34 ? "en haut" : y > 66 ? "en bas" : "au milieu";
  const h = x < 34 ? "à gauche" : x > 66 ? "à droite" : "au centre";
  const t = scale < 0.85 ? " (petit)" : scale > 1.3 ? " (grand)" : "";
  return `${v} ${h}${t}`;
}

export default function CrystalTextDrag({ lines, fontClass, onChange }) {
  const zoneRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 78 });
  const [scale, setScale] = useState(1);
  const mode = useRef(null); // "move" | "resize"
  const startRef = useRef(null);

  useEffect(() => {
    onChange && onChange({ x: Math.round(pos.x), y: Math.round(pos.y), scale: Math.round(scale * 100) / 100, label: labelFor(pos.x, pos.y, scale) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, scale]);

  function coords(e) {
    const t = e.touches && e.touches[0];
    return { cx: t ? t.clientX : e.clientX, cy: t ? t.clientY : e.clientY };
  }
  function onMove(e) {
    if (!mode.current) return;
    const r = zoneRef.current && zoneRef.current.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    const { cx, cy } = coords(e);
    if (mode.current === "move") {
      setPos({
        x: Math.max(12, Math.min(88, ((cx - r.left) / r.width) * 100)),
        y: Math.max(12, Math.min(88, ((cy - r.top) / r.height) * 100)),
      });
    } else {
      const s = startRef.current.scale + (cy - startRef.current.cy) / 120;
      setScale(Math.max(0.6, Math.min(2.4, s)));
    }
  }
  function startMove(e) { mode.current = "move"; onMove(e); }
  function startResize(e) { e.stopPropagation(); mode.current = "resize"; startRef.current = { cy: coords(e).cy, scale }; }
  function end() { mode.current = null; }

  return (
    <div
      ref={zoneRef}
      className="ctd-zone"
      onMouseMove={onMove}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchMove={onMove}
      onTouchEnd={end}
    >
      <div
        className="ctd-text"
        style={{ left: pos.x + "%", top: pos.y + "%", fontSize: `calc(clamp(1.05rem, 4.2vw, 1.6rem) * ${scale})` }}
        onMouseDown={startMove}
        onTouchStart={startMove}
      >
        {lines.map((l, i) => (
          <span key={i} className={fontClass}>{l}</span>
        ))}
        <span
          className="ctd-handle"
          onMouseDown={startResize}
          onTouchStart={startResize}
          title="Redimensionner"
          aria-hidden="true"
        >⤡</span>
      </div>
    </div>
  );
}
