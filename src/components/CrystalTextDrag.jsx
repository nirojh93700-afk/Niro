"use client";

import { useEffect, useRef, useState } from "react";

// Placement + redimensionnement du texte gravé sur l'aperçu cristal.
// Utilise les Pointer Events + setPointerCapture : le doigt/souris reste
// « capturé » pendant le glissement (pas de scroll parasite sur mobile),
// exactement comme le verre gravé. On renvoie position + taille + libellé.
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

  function moveTo(clientX, clientY) {
    const r = zoneRef.current && zoneRef.current.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: Math.max(10, Math.min(90, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(10, Math.min(90, ((clientY - r.top) / r.height) * 100)),
    });
  }

  function onPointerMove(e) {
    if (!mode.current) return;
    e.preventDefault();
    if (mode.current === "move") {
      moveTo(e.clientX, e.clientY);
    } else {
      const s = startRef.current.scale + (e.clientY - startRef.current.cy) / 120;
      setScale(Math.max(0.6, Math.min(2.4, s)));
    }
  }
  function endPointer(e) {
    mode.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  }
  function startMove(e) {
    e.preventDefault();
    mode.current = "move";
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    moveTo(e.clientX, e.clientY);
  }
  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    mode.current = "resize";
    startRef.current = { cy: e.clientY, scale };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  return (
    <div ref={zoneRef} className="ctd-zone">
      <div
        className="ctd-text"
        style={{ left: pos.x + "%", top: pos.y + "%", fontSize: `calc(clamp(1.05rem, 4.2vw, 1.6rem) * ${scale})` }}
        onPointerDown={startMove}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {lines.map((l, i) => (
          <span key={i} className={fontClass}>{l}</span>
        ))}
        <span
          className="ctd-handle"
          onPointerDown={startResize}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          title="Redimensionner"
          aria-hidden="true"
        >⤡</span>
      </div>
    </div>
  );
}
