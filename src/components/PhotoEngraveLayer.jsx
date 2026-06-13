"use client";

import { useRef, useState, useEffect } from "react";

// Éditeur de placement du logo/photo sur la photo du produit :
// - glisser pour déplacer (souris + tactile iOS),
// - 2 curseurs : largeur ET hauteur, avec la mesure réelle en cm en direct,
// - la taille + position choisies sont renvoyées au parent (→ commande).
//
// cfg (product.engrave) : box {top,left,width,height} (fractions du cadre),
//   widthMm / heightMm (mm réels pour maxWidthFrac / maxHeightFrac),
//   maxWidthFrac / minWidthFrac / maxHeightFrac / minHeightFrac.
export default function PhotoEngraveLayer({ photoSrc, cfg, onChange }) {
  const box = cfg?.box || { top: 0.3, left: 0.2, width: 0.6, height: 0.45 };
  const widthMm = cfg?.widthMm || 65;
  const heightMm = cfg?.heightMm || widthMm;
  const maxW = cfg?.maxWidthFrac || box.width;
  const minW = cfg?.minWidthFrac || 0.12;
  const maxH = cfg?.maxHeightFrac || box.height;
  const minH = cfg?.minHeightFrac || 0.12;

  const ref = useRef(null);
  const drag = useRef(null);
  const [sw, setSw] = useState((minW + maxW) / 2); // largeur (fraction du cadre)
  const [sh, setSh] = useState((minH + maxH) / 2); // hauteur (fraction du cadre)
  const [cx, setCx] = useState(box.left + box.width / 2);
  const [cy, setCy] = useState(box.top + box.height / 2);

  const wMm = Math.round((sw / maxW) * widthMm * 10) / 10;
  const hMm = Math.round((sh / maxH) * heightMm * 10) / 10;
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
  function reclamp(nx, ny, w, h) {
    return [
      clamp(nx, box.left + w / 2, box.left + box.width - w / 2),
      clamp(ny, box.top + h / 2, box.top + box.height - h / 2),
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
    const [nx, ny] = reclamp(d.cx + (e.clientX - d.px) / d.w, d.cy + (e.clientY - d.py) / d.h, sw, sh);
    setCx(nx);
    setCy(ny);
  }
  function onUp() {
    drag.current = null;
  }
  function setSize(which, v) {
    const val = Number(v);
    const nw = which === "w" ? val : sw;
    const nh = which === "h" ? val : sh;
    if (which === "w") setSw(val); else setSh(val);
    const [nx, ny] = reclamp(cx, cy, nw, nh);
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
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ width: `${sw * 100}%`, height: `${sh * 100}%`, left: `${cx * 100}%`, top: `${cy * 100}%` }}
      />
      <div className="ee-toolbar">
        <span className="ee-size">≈ {cm(wMm)} × {cm(hMm)} cm</span>
        <label className="ee-ctrl">
          <span>L</span>
          <input type="range" min={minW} max={maxW} step="0.005" value={sw} onChange={(e) => setSize("w", e.target.value)} aria-label="Largeur de la gravure" />
        </label>
        <label className="ee-ctrl">
          <span>H</span>
          <input type="range" min={minH} max={maxH} step="0.005" value={sh} onChange={(e) => setSize("h", e.target.value)} aria-label="Hauteur de la gravure" />
        </label>
      </div>
    </div>
  );
}
