"use client";

import { useRef, useState, useEffect } from "react";

// Transforme une photo en "gravure" : monochrome, fond clair rendu transparent,
// bords adoucis (pas de carré), teinte FONCÉE pour la face (verre clair) ou
// BLANCHE pour le fond (intérieur sombre). Rend un aperçu proche du laser réel.
function engrave(img, light) {
  const maxW = 700;
  const scale = Math.min(1, maxW / Math.max(img.naturalWidth, 1));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  let data;
  try { data = ctx.getImageData(0, 0, w, h); } catch { return img.src; }
  const d = data.data;
  const tr = light ? 248 : 42, tg = light ? 248 : 42, tb = light ? 244 : 42;
  const cxC = w / 2, cyC = h / 2, rx = w / 2, ry = h / 2;
  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) % w, py = Math.floor((i / 4) / w);
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // zones sombres = gravure, zones claires = transparent (fond retiré)
    let a = 255 - lum;
    a = a < 28 ? 0 : Math.min(255, (a - 28) * 1.3);
    // adoucissement elliptique des bords (supprime le carré)
    const nx = (px - cxC) / rx, ny = (py - cyC) / ry;
    const r = Math.sqrt(nx * nx + ny * ny);
    const f = r < 0.80 ? 1 : Math.max(0, 1 - (r - 0.80) / 0.40);
    d[i] = tr; d[i + 1] = tg; d[i + 2] = tb; d[i + 3] = Math.round(a * f);
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL();
}

// Éditeur de placement du logo/photo sur la photo du produit :
// - glisser pour déplacer (souris + tactile iOS),
// - 1 curseur de taille : agrandit / réduit la photo EN GARDANT SES PROPORTIONS
//   (jamais coupée, jamais déformée), avec la mesure réelle en cm,
// - la taille + position choisies sont renvoyées au parent (→ commande).
export default function PhotoEngraveLayer({ photoSrc, cfg, onChange, light = false }) {
  const box = cfg?.box || { top: 0.3, left: 0.2, width: 0.6, height: 0.45 };
  const widthMm = cfg?.widthMm || 65;
  const maxW = cfg?.maxWidthFrac || box.width;
  const minW = cfg?.minWidthFrac || 0.10;

  const ref = useRef(null);
  const drag = useRef(null);
  const [aspect, setAspect] = useState(1); // hauteur / largeur de l'image
  const [displaySrc, setDisplaySrc] = useState(photoSrc); // image affichée (frostée si fond)
  const [size, setSize] = useState((minW + maxW) / 2); // largeur (fraction du cadre)
  const [cx, setCx] = useState(box.left + box.width / 2);
  const [cy, setCy] = useState(box.top + box.height / 2);

  // On transforme TOUJOURS la photo en gravure (face foncée / fond blanc),
  // fond retiré + bords adoucis, pour un aperçu fidèle.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { if (!cancelled) { try { setDisplaySrc(engrave(img, light)); } catch { setDisplaySrc(photoSrc); } } };
    img.onerror = () => { if (!cancelled) setDisplaySrc(photoSrc); };
    img.src = photoSrc;
    return () => { cancelled = true; };
  }, [photoSrc, light]);

  const wMm = Math.round((size / maxW) * widthMm * 10) / 10;
  const hMm = Math.round(wMm * aspect * 10) / 10;
  const cm = (mm) => (mm / 10).toFixed(1).replace(".", ",");

  useEffect(() => {
    if (!onChange) return;
    onChange({
      wMm,
      hMm,
      cx,
      cy,
      size,
      aspect,
      cxPct: Math.round(cx * 100),
      cyPct: Math.round(cy * 100),
      label: `≈ ${cm(wMm)} × ${cm(hMm)} cm · position ${Math.round(cx * 100)} % / ${Math.round(cy * 100)} %`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wMm, hMm, cx, cy]);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function reclamp(nx, ny, w, h) {
    const halfW = w / 2;
    const halfH = h / 2;
    // si l'élément est plus grand que la zone, on le centre (pas de saut)
    const lx = box.left + Math.min(halfW, box.width / 2);
    const hx = box.left + box.width - Math.min(halfW, box.width / 2);
    const ly = box.top + Math.min(halfH, box.height / 2);
    const hy = box.top + box.height - Math.min(halfH, box.height / 2);
    return [clamp(nx, lx, hx), clamp(ny, ly, hy)];
  }

  function onDown(e) {
    const rect = ref.current.getBoundingClientRect();
    drag.current = { px: e.clientX, py: e.clientY, cx, cy, w: rect.width, h: rect.height };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!drag.current) return;
    const d = drag.current;
    const [nx, ny] = reclamp(d.cx + (e.clientX - d.px) / d.w, d.cy + (e.clientY - d.py) / d.h, size, size * aspect);
    setCx(nx);
    setCy(ny);
  }
  function onUp() {
    drag.current = null;
  }
  function onSize(v) {
    const s = Number(v);
    setSize(s);
    const [nx, ny] = reclamp(cx, cy, s, s * aspect);
    setCx(nx);
    setCy(ny);
  }

  return (
    <div className="engrave-editor" ref={ref}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt="Logo à graver — glissez pour déplacer"
        className={`ee-logo ee-logo-proc${light ? " ee-logo-on-dark" : ""}`}
        draggable={false}
        onLoad={(e) => setAspect((e.target.naturalHeight / e.target.naturalWidth) || 1)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ width: `${size * 100}%`, height: "auto", left: `${cx * 100}%`, top: `${cy * 100}%` }}
      />
      <div className="ee-toolbar">
        <span className="ee-size">≈ {cm(wMm)} × {cm(hMm)} cm</span>
        <label className="ee-ctrl">
          <span>Taille</span>
          <input type="range" min={minW} max={maxW} step="0.005" value={size} onChange={(e) => onSize(e.target.value)} aria-label="Taille de la gravure" />
        </label>
      </div>
    </div>
  );
}
