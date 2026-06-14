"use client";

import { useEffect, useMemo, useState } from "react";

// Échappe le texte pour insertion sûre dans le SVG.
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Construit un emblème vintage (style "OLD STYLE / BOURBON / EST. 2024")
// en SVG, dessin NOIR sur fond transparent : il passe ensuite par le pipeline
// d'aperçu de gravure (clair sur le fond du verre, sombre sur la face avant).
function buildBadgeSvg({ top, est, name, bottom }) {
  const T = esc(top).toUpperCase();
  const E = esc(est).toUpperCase();
  const N = esc(name).toUpperCase();
  const B = esc(bottom).toUpperCase();

  // Taille du nom central ajustée à sa longueur pour rester dans le cadre.
  const nameSize = Math.max(26, Math.min(58, Math.round(560 / Math.max(N.length, 1))));
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "'Arial Narrow', 'Arial', sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <defs>
    <path id="arcTop" d="M 80 175 A 120 105 0 0 1 320 175"/>
    <path id="arcBottom" d="M 95 318 A 120 70 0 0 0 305 318"/>
  </defs>
  <g fill="#111" stroke="none">
    ${T ? `<text font-family="${sans}" font-size="22" font-weight="700" letter-spacing="5" text-anchor="middle">
      <textPath href="#arcTop" startOffset="50%">${T}</textPath>
    </text>` : ""}

    <!-- petits losanges décoratifs en haut -->
    <g transform="translate(0,0)">
      <rect x="95" y="120" width="7" height="7" transform="rotate(45 98.5 123.5)"/>
      <rect x="298" y="120" width="7" height="7" transform="rotate(45 301.5 123.5)"/>
    </g>

    <!-- icône verre / tonneau -->
    <path d="M173 150 H227 L221 205 H179 Z"/>
    <rect x="177" y="170" width="46" height="20" fill="#fff"/>
    <rect x="170" y="146" width="60" height="6"/>

    <!-- EST. et année de part et d'autre -->
    ${E ? `<text x="120" y="185" font-family="${serif}" font-size="15" font-weight="700" letter-spacing="1" text-anchor="middle">EST.</text>
    <text x="280" y="185" font-family="${serif}" font-size="17" font-weight="700" letter-spacing="1" text-anchor="middle">${E}</text>` : ""}

    <!-- filet décoratif -->
    <path d="M120 222 H280" stroke="#111" stroke-width="2"/>
    <circle cx="115" cy="222" r="3"/>
    <circle cx="285" cy="222" r="3"/>

    <!-- nom central -->
    ${N ? `<text x="200" y="262" font-family="${serif}" font-size="${nameSize}" font-weight="700" letter-spacing="2" text-anchor="middle">${N}</text>` : ""}

    <!-- filet décoratif bas -->
    <path d="M130 280 H270" stroke="#111" stroke-width="2"/>
    <circle cx="125" cy="280" r="3"/>
    <circle cx="275" cy="280" r="3"/>

    ${B ? `<text font-family="${sans}" font-size="16" font-weight="700" letter-spacing="3" text-anchor="middle">
      <textPath href="#arcBottom" startOffset="50%">${B}</textPath>
    </text>` : ""}
  </g>
</svg>`;
}

// Sélecteur de modèle emblème : 4 textes éditables + aperçu en direct.
// La valeur produite est une data URL d'image, utilisée comme logo à graver.
export default function BadgeDesigner({ value, onChange }) {
  const [top, setTop] = useState("OLD STYLE");
  const [est, setEst] = useState("2024");
  const [name, setName] = useState("BOURBON");
  const [bottom, setBottom] = useState("");
  const [on, setOn] = useState(Boolean(value));

  const svg = useMemo(() => buildBadgeSvg({ top, est, name, bottom }), [top, est, name, bottom]);

  useEffect(() => {
    if (!on) { onChange(""); return; }
    onChange("data:image/svg+xml;utf8," + encodeURIComponent(svg));
    // onChange volontairement hors dépendances (identité non stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg, on]);

  return (
    <div className="badge-designer">
      {!on ? (
        <button type="button" className="badge-toggle" onClick={() => setOn(true)}>
          Utiliser ce modèle emblème (puis personnaliser les textes)
        </button>
      ) : (
        <>
          <div className="badge-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={"data:image/svg+xml;utf8," + encodeURIComponent(svg)} alt="Aperçu de l'emblème" />
          </div>
          <div className="badge-fields">
            <label>Texte du haut
              <input value={top} onChange={(e) => setTop(e.target.value)} maxLength={18} placeholder="OLD STYLE" />
            </label>
            <label>Année / EST.
              <input value={est} onChange={(e) => setEst(e.target.value)} maxLength={8} placeholder="2024" />
            </label>
            <label>Nom central
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={14} placeholder="BOURBON" />
            </label>
            <label>Texte du bas (facultatif)
              <input value={bottom} onChange={(e) => setBottom(e.target.value)} maxLength={22} placeholder="Ex : Famille Martin" />
            </label>
          </div>
          <button type="button" className="badge-remove" onClick={() => setOn(false)}>
            Ne pas utiliser ce modèle
          </button>
        </>
      )}
    </div>
  );
}
