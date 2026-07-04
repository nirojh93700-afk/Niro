"use client";

import { useEffect, useRef, useState } from "react";

// Placement déplaçable du texte gravé sur l'aperçu cristal.
// Le client glisse le texte où il veut ; on renvoie la position + un libellé
// lisible (« en bas au centre »…) pour l'atelier.
function labelFor(x, y) {
  const v = y < 34 ? "en haut" : y > 66 ? "en bas" : "au milieu";
  const h = x < 34 ? "à gauche" : x > 66 ? "à droite" : "au centre";
  return `${v} ${h}`;
}

export default function CrystalTextDrag({ lines, fontClass, onChange }) {
  const zoneRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 80 });
  const dragging = useRef(false);

  useEffect(() => {
    onChange && onChange({ x: Math.round(pos.x), y: Math.round(pos.y), label: labelFor(pos.x, pos.y) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y]);

  function point(e) {
    const r = zoneRef.current && zoneRef.current.getBoundingClientRect();
    if (!r) return null;
    const t = e.touches && e.touches[0];
    const cx = t ? t.clientX : e.clientX;
    const cy = t ? t.clientY : e.clientY;
    return {
      x: Math.max(12, Math.min(88, ((cx - r.left) / r.width) * 100)),
      y: Math.max(12, Math.min(88, ((cy - r.top) / r.height) * 100)),
    };
  }
  function onDown(e) { dragging.current = true; const p = point(e); if (p) setPos(p); }
  function onMove(e) { if (!dragging.current) return; const p = point(e); if (p) { e.preventDefault(); setPos(p); } }
  function onUp() { dragging.current = false; }

  return (
    <div
      ref={zoneRef}
      className="ctd-zone"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      <div
        className="ctd-text"
        style={{ left: pos.x + "%", top: pos.y + "%" }}
        onMouseDown={onDown}
        onTouchStart={onDown}
      >
        {lines.map((l, i) => (
          <span key={i} className={fontClass}>{l}</span>
        ))}
      </div>
    </div>
  );
}
