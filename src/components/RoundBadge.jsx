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

// Badge rond "ÉLU ★ PAPA ★ de l'année" — composition en SVG inline
// (les polices de la page s'appliquent car le SVG est dans le DOM).
// Textes et polices modifiables ; couronne d'étoiles + bandeau central.
export default function RoundBadge({ size = 200, top, mid, bot, fontTop, fontMid, fontBot }) {
  const uid = useId().replace(/:/g, "");
  const dark = "#141414";
  const light = "#f4f1ea";

  // Couronne d'étoiles autour du disque.
  const ring = [];
  const N = 24, R = 137;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    ring.push(<polygon key={i} points={starPoints(150 + R * Math.cos(a), 150 + R * Math.sin(a), 9)} fill={dark} />);
  }

  return (
    <svg viewBox="0 0 300 300" width={size} height={size} aria-hidden="true">
      {ring}
      <circle cx="150" cy="150" r="120" fill={dark} />
      <circle cx="150" cy="150" r="78" fill="none" stroke={light} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.8" />

      {/* texte du haut, courbé */}
      <defs>
        <path id={`top-${uid}`} d="M 81.6 88.4 A 92 92 0 0 1 218.4 88.4" />
        <path id={`bot-${uid}`} d="M 81.6 211.6 A 92 92 0 0 0 218.4 211.6" />
      </defs>
      <text className={fontTop} fontSize="30" fill={light} textAnchor="middle" style={{ fontWeight: 700, letterSpacing: "0.12em" }}>
        <textPath href={`#top-${uid}`} startOffset="50%">{top}</textPath>
      </text>

      {/* bandeau central + mot central + étoiles latérales */}
      <rect x="4" y="125" width="292" height="50" fill={dark} />
      <text x="150" y="151" className={fontMid} fontSize="48" fill={light} textAnchor="middle" dominantBaseline="central" style={{ fontWeight: 800, letterSpacing: "0.04em" }}>
        {mid}
      </text>
      <polygon points={starPoints(34, 150, 13)} fill={light} />
      <polygon points={starPoints(266, 150, 13)} fill={light} />

      {/* texte du bas, courbé */}
      <text className={fontBot} fontSize="30" fill={light} textAnchor="middle">
        <textPath href={`#bot-${uid}`} startOffset="50%">{bot}</textPath>
      </text>
    </svg>
  );
}
