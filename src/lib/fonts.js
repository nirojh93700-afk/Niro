// Palette de polices de gravure Niv Création (correspond aux planches fournies).
// Chaque police a une classe CSS pour l'aperçu en direct sur la fiche produit.
export const FONTS = [
  { key: "playfair", label: "Playfair — Serif élégante", cls: "fnt-playfair" },
  { key: "cinzel", label: "Cinzel — Capitales romaines", cls: "fnt-cinzel" },
  { key: "cinzel-deco", label: "Cinzel Decorative — Décoratif luxe", cls: "fnt-cinzel-deco" },
  { key: "montserrat", label: "Montserrat — Moderne géométrique", cls: "fnt-montserrat" },
  { key: "inter", label: "Inter — Minimaliste épuré", cls: "fnt-inter" },
  { key: "great-vibes", label: "Great Vibes — Calligraphie mariage", cls: "fnt-great-vibes" },
  { key: "allura", label: "Allura — Script élégant", cls: "fnt-allura" },
  { key: "pacifico", label: "Pacifico — Script rétro", cls: "fnt-pacifico" },
];

export function getFontClass(key) {
  return FONTS.find((f) => f.key === key)?.cls || "fnt-playfair";
}

export function getFontLabel(key) {
  const label = FONTS.find((f) => f.key === key)?.label || "";
  return label.split(" — ")[0]; // nom court (ex : "Great Vibes")
}
