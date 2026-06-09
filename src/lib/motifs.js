// Source unique des motifs gravables (fleurs = images fournies, symboles = SVG/glyphes).

export const MOTIFS = [
  { value: "fleur2", label: "Fleur — modèle 1", kind: "image", url: "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_7707.jpg?v=1780606227" },
  { value: "fleur3", label: "Fleur — modèle 2", kind: "image", url: "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_7706.jpg?v=1780606227" },
  { value: "fleur4", label: "Fleur — modèle 3", kind: "image", url: "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_7705.jpg?v=1780606227" },
  { value: "fleur5", label: "Fleur — modèle 4", kind: "image", url: "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_7705_8e43e2a1-3cba-4e9e-8eaf-c38765e67998.jpg?v=1780606227" },
  { value: "coeur", label: "Cœur", kind: "glyph", char: "♥", thumb: "/motifs/coeur.svg" },
  { value: "etoile", label: "Étoile", kind: "glyph", char: "★", thumb: "/motifs/etoile.svg" },
  { value: "infini", label: "Infini", kind: "glyph", char: "∞", thumb: "/motifs/infini.svg" },
  { value: "lune", label: "Lune", kind: "glyph", char: "☾", thumb: "/motifs/lune.svg" },
  { value: "soleil", label: "Soleil", kind: "glyph", char: "☀", thumb: "/motifs/soleil.svg" },
];

// value -> SVG (pour dessiner le symbole de façon fiable dans les aperçus 3D).
export const GLYPH_THUMBS = Object.fromEntries(
  MOTIFS.filter((m) => m.kind === "glyph").map((m) => [m.value, m.thumb])
);

export function motifThumb(m) {
  return m.kind === "image" ? m.url : m.thumb;
}

export const FLOWER_URLS = Object.fromEntries(
  MOTIFS.filter((m) => m.kind === "image").map((m) => [m.value, m.url])
);
export const GLYPHS = Object.fromEntries(
  MOTIFS.filter((m) => m.kind === "glyph").map((m) => [m.value, m.char])
);
export const MOTIF_OPTIONS = MOTIFS.map((m) => ({ value: m.value, label: m.label }));
