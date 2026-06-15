"use client";

import { useId } from "react";

// Étoile 5 branches (points pour <polygon>).
function starPoints(cx, cy, r, inner = 0.42) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}

// Couleur contrastée (pour le texte quand le fond est plein).
function contrast(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#f4f1ea";
  const n = parseInt(m[1], 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 128 ? "#f4f1ea" : "#1c1c1c";
}

// Badge rond "ÉLU ★ PAPA ★ de l'année" — mise en page fidèle, textes/polices
// modifiables. Deux rendus : "trait" (gravure au trait, sans fond) ou
// "plein" (fond plein, façon image d'origine). Une seule teinte de gravure.
export default function RoundBadge({ size = 200, top, mid, bot, fontTop, fontMid, fontBot, color = "#3a2f1d", filled = false }) {
  const uid = useId().replace(/:/g, "");
  const ink = color;            // teinte de la gravure
  const paper = contrast(ink);  // texte quand le fond est plein

  const txtColor = filled ? paper : ink;
  const lineColor = filled ? paper : ink;

  // Couronne d'étoiles (deux rangées décalées → effet dense/festonné).
  const ring = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    ring.push(<polygon key={`o${i}`} points={starPoints(150 + 142 * Math.cos(a), 150 + 142 * Math.sin(a), 8)} fill={ink} />);
    const a2 = ((i + 0.5) / N) * 2 * Math.PI;
    ring.push(<polygon key={`i${i}`} points={starPoints(150 + 128 * Math.cos(a2), 150 + 128 * Math.sin(a2), 6.5)} fill={ink} />);
  }

  return (
    <svg viewBox="0 0 300 300" width={size} height={size} aria-hidden="true">
      {ring}
      {/* disque : plein ou simple contour */}
      <circle cx="150" cy="150" r="120" fill={filled ? ink : "none"} stroke={ink} strokeWidth="2.5" />
      <circle cx="150" cy="150" r="72" fill="none" stroke={lineColor} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.85" />

      <defs>
        <path id={`top-${uid}`} d="M 81.6 88.4 A 92 92 0 0 1 218.4 88.4" />
        <path id={`bot-${uid}`} d="M 71.2 220.9 A 106 106 0 0 0 228.8 220.9" />
      </defs>

      {/* texte du haut, courbé */}
      <text className={fontTop} fontSize="30" fill={txtColor} textAnchor="middle" style={{ fontWeight: 700, letterSpacing: "0.12em" }}>
        <textPath href={`#top-${uid}`} startOffset="50%">{top}</textPath>
      </text>

      {/* bandeau central + mot central + étoiles latérales */}
      <rect x="14" y="126" width="272" height="48" rx="2" fill={filled ? ink : "none"} stroke={lineColor} strokeWidth="2.5" />
      <text x="150" y="151" className={fontMid} fontSize="46" fill={txtColor} textAnchor="middle" dominantBaseline="central" style={{ fontWeight: 800, letterSpacing: "0.03em" }}>
        {mid}
      </text>
      <polygon points={starPoints(40, 150, 13)} fill={filled ? paper : "none"} stroke={lineColor} strokeWidth="2.2" />
      <polygon points={starPoints(260, 150, 13)} fill={filled ? paper : "none"} stroke={lineColor} strokeWidth="2.2" />

      {/* texte du bas, courbé */}
      <text className={fontBot} fontSize="26" fill={txtColor} textAnchor="middle">
        <textPath href={`#bot-${uid}`} startOffset="50%">{bot}</textPath>
      </text>
    </svg>
  );
}
