"use client";

import { useRef, useState, useEffect } from "react";

// Éditeur de placement du logo/photo sur la photo du produit :
// - glisser pour déplacer (souris + tactile iOS),
// - curseur pour agrandir / réduire,
// - mesure réelle en cm affichée en direct (calibrée sur la taille du verre).
// La taille + position choisies sont renvoyées au parent (→ commande).
//
// cfg (product.engrave) :
//   box          : zone de placement en fraction du cadre carré { top, left, width, height }
//   widthMm      : largeur réelle gravable (mm) correspondant à maxWidthFrac
//   maxWidthFrac : taille max du logo, en fraction de la largeur du cadre
//   minWidthFrac : taille mini
export default function PhotoEngraveLayer({ photoSrc, cfg, onChange }) {
  const box = cfg?.box || { top: 0.3, left: 0.2, width: 0.6, height: 0.45 };
  const widthMm = cfg?.widthMm || 65;
  const maxFrac = cfg?.maxWidthFrac || box.width;
  const minFrac = cfg?.minWidthFrac || 0.12;

  const ref = useRef(null);
  const drag = useRef(null);
  const [aspect, setAspect] = useState(1); // hauteur / largeur de l'image
  const [size, setSize] = useState((minFrac + maxFrac) / 2); // largeur logo en fraction du cadre
  const [cx, setCx] = useState(box.left + box.width / 2);
  const [cy, setCy] = useState(box.top + box.height / 2);

  const wMm = Math.round((size / maxFrac) * widthMm * 10) / 10;
  const hMm = Math.round(wMm * aspect * 10) / 10;
  const cm = (mm) => (mm / 10).toFixed(1).replace(".", ",");

  useEffect(() => {
    if (!onChange) return;
    onChange({
      wMm,
      hMm,
      cxPct: Math.round(cx * 100),
      cyPct: Math.round(cy * 100),
      label: `≈ ${cm(wMm)} × ${cm(hMm)} cm · position ${Math.round(cx * 100)} % / ${Math.round(cy * 100)} %`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wMm, hMm, cx, cy]);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function reclamp(nx, ny, s) {
    const halfW = s / 2;
    const halfH = (s * aspect) / 2;
    return [
      clamp(nx, box.left + halfW, box.left + box.width - halfW),
      clamp(ny, box.top + halfH, box.top + box.height - halfH),
    ];
  }

  function onDown(e) {
    const rect = ref.current.getBoundingClientRect();
    drag.current = { px: e.clientX, py: e.clientY, cx, cy, w: rect.width, h: rect.height };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!drag.current) return;
    const d = drag.current;
    const [nx, ny] = reclamp(d.cx + (e.clientX - d.px) / d.w, d.cy + (e.clientY - d.py) / d.h, size);
    setCx(nx);
    setCy(ny);
  }
  function onUp() {
    drag.current = null;
  }
  function onSize(v) {
    const s = Number(v);
    setSize(s);
    const [nx, ny] = reclamp(cx, cy, s);
    setCx(nx);
    setCy(ny);
  }

  return (
    <div className="engrave-editor" ref={ref}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoSrc}
        alt="Logo à graver — glissez pour déplacer"
        className="ee-logo"
        draggable={false}
        onLoad={(e) => setAspect((e.target.naturalHeight / e.target.naturalWidth) || 1)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ width: `${size * 100}%`, left: `${cx * 100}%`, top: `${cy * 100}%` }}
      />
      <div className="ee-toolbar">
        <span className="ee-size">≈ {cm(wMm)} × {cm(hMm)} cm</span>
        <input
          type="range"
          min={minFrac}
          max={maxFrac}
          step="0.005"
          value={size}
          onChange={(e) => onSize(e.target.value)}
          aria-label="Taille de la gravure"
        />
      </div>
    </div>
  );
}
