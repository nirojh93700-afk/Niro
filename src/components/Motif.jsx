"use client";

// Bibliothèque de motifs de gravure. Les dessins sont des fichiers SVG dans
// /public/motifs ; on les recolore (teinte de gravure) via un masque CSS.

export const MOTIF_LIST = [
  { id: "aucun", label: "Aucun" },
  { id: "coeur", label: "Cœur" },
  { id: "ancre", label: "Ancre" },
  { id: "cloche", label: "Cloche" },
  { id: "gouvernail", label: "Gouvernail" },
  { id: "soleil", label: "Soleil" },
];

// Rend un motif (fichier /motifs/<id>.svg) dans la couleur demandée.
export function Motif({ id, color = "#fff", size = 46 }) {
  if (!id || id === "aucun") return null;
  const url = `url(/motifs/${id}.svg)`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
