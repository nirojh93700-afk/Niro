"use client";

import { useRef, useState, useEffect } from "react";
import ModeleArt from "./ModeleArt";

// Calque MODÈLE déplaçable + redimensionnable sur la photo du verre.
// Reprend la mécanique de TextEngraveLayer (glisser + taille + mesure cm),
// mais affiche une composition stylée (plusieurs polices) + motif.
export default function ModeleEngraveLayer({ template, value, color, cfg, onChange }) {
  const box = cfg?.box || { top: 0.3, left: 0.2, width: 0.6, height: 0.45 };
  const widthMm = cfg?.widthMm || 65;
  const maxW = cfg?.maxWidthFrac || box.width;
  const mmPerFrame = widthMm / maxW;

  const ref = useRef(null);
  const drag = useRef(null);
  const [w, setW] = useState(0);
  const [scale, setScale] = useState(0.08); // taille ligne centrale, fraction de la largeur du cadre
  const [cx, setCx] = useState(box.left + box.width / 2);
  const [cy, setCy] = useState(box.top + box.height / 2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => setW(el.getBoundingClientRect().width);
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const heightMm = Math.round(scale * mmPerFrame * 10) / 10;
  const cm = (mm) => (mm / 10).toFixed(1).replace(".", ",");

  useEffect(() => {
    if (!onChange) return;
    onChange({
      cx, cy, scale,
      label: `gravure ≈ ${cm(heightMm)} cm · position ${Math.round(cx * 100)} % / ${Math.round(cy * 100)} %`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightMm, cx, cy]);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function onDown(e) {
    const rect = ref.current.getBoundingClientRect();
    drag.current = { px: e.clientX, py: e.clientY, cx, cy, w: rect.width, h: rect.height };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!drag.current) return;
    const d = drag.current;
    setCx(clamp(d.cx + (e.clientX - d.px) / d.w, box.left, box.left + box.width));
    setCy(clamp(d.cy + (e.clientY - d.py) / d.h, box.top, box.top + box.height));
  }
  function onUp() { drag.current = null; }

  return (
    <div className="engrave-editor engrave-editor-text" ref={ref}>
      <div
        className="te-block me-block"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
      >
        <ModeleArt template={template} value={value} color={color} base={Math.max(10, scale * w)} placeholder />
      </div>
      <div className="ee-toolbar ee-toolbar-top">
        <span className="ee-size">Gravure ≈ {cm(heightMm)} cm</span>
        <label className="ee-ctrl">
          <span>T</span>
          <input type="range" min="0.05" max="0.16" step="0.005" value={scale} onChange={(e) => setScale(Number(e.target.value))} aria-label="Taille de la gravure" />
        </label>
      </div>
    </div>
  );
}
