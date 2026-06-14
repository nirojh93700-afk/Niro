"use client";

// Bibliothèque de motifs de gravure (dessins au trait). Rangés par usage.
// Réutilisée par le sélecteur (formulaire) et par l'aperçu sur le verre.

export const MOTIF_LIST = [
  { id: "aucun", label: "Aucun" },
  { id: "coeur", label: "Cœur" },
  { id: "ancre", label: "Ancre" },
  { id: "etoile", label: "Étoile" },
  { id: "volute", label: "Volute" },
  { id: "rose", label: "Rose des vents" },
  { id: "laurier", label: "Laurier" },
];

export function Motif({ id, color = "#fff", size = 46 }) {
  const s = { fill: "none", stroke: color, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" };
  let inner = null;
  switch (id) {
    case "coeur":
      inner = <path d="M32 56 C 6 38 8 16 24 16 C 32 16 32 24 32 28 C 32 24 32 16 40 16 C 56 16 58 38 32 56 Z" {...s} />;
      break;
    case "ancre":
      inner = (
        <g {...s}>
          <circle cx="32" cy="14" r="5" />
          <line x1="32" y1="19" x2="32" y2="52" />
          <line x1="20" y1="28" x2="44" y2="28" />
          <path d="M14 40 C 14 52 26 54 32 54 C 38 54 50 52 50 40" />
        </g>
      );
      break;
    case "etoile":
      inner = <path d="M32 10 L38 26 L55 26 L41 36 L46 53 L32 43 L18 53 L23 36 L9 26 L26 26 Z" {...s} />;
      break;
    case "volute":
      inner = (
        <g {...s}>
          <path d="M6 32 C 18 18 26 18 32 32 C 38 46 46 46 58 32" />
          <circle cx="6" cy="32" r="2.5" /><circle cx="58" cy="32" r="2.5" />
        </g>
      );
      break;
    case "rose":
      inner = (
        <g {...s}>
          <circle cx="32" cy="32" r="20" />
          <path d="M32 8 L36 32 L32 56 L28 32 Z M8 32 L32 28 L56 32 L32 36 Z" />
        </g>
      );
      break;
    case "laurier":
      inner = (
        <g {...s}>
          <path d="M24 54 C 14 44 14 24 24 12" />
          <path d="M40 54 C 50 44 50 24 40 12" />
          <path d="M24 22 C 18 20 16 24 18 28 M24 32 C 18 30 16 34 18 38 M24 42 C 18 40 16 44 18 48" />
          <path d="M40 22 C 46 20 48 24 46 28 M40 32 C 46 30 48 34 46 38 M40 42 C 46 40 48 44 46 48" />
        </g>
      );
      break;
    default:
      return null;
  }
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">{inner}</svg>;
}
