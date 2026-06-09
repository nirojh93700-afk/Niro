// Source unique des motifs gravables — tous en SVG local (fiable, vectoriel,
// rendu identique partout, idéal pour la gravure). Pas de dépendance aux
// polices système ni aux images externes.

export const MOTIFS = [
  { value: "fleur", label: "Fleur", svg: "/motifs/fleur.svg" },
  { value: "branche", label: "Branche fleurie", svg: "/motifs/fleurs/branche-fleurie.svg" },
  { value: "lavande", label: "Lavande", svg: "/motifs/fleurs/lavande.svg" },
  { value: "marguerites", label: "Marguerites", svg: "/motifs/fleurs/marguerites-montantes.svg" },
  { value: "coeur", label: "Cœur", svg: "/motifs/coeur.svg" },
  { value: "coeur-infini", label: "Cœur infini", svg: "/motifs/coeur-infini.svg" },
  { value: "etoile", label: "Étoile", svg: "/motifs/etoile.svg" },
  { value: "infini", label: "Infini", svg: "/motifs/infini.svg" },
  { value: "lune", label: "Lune", svg: "/motifs/lune.svg" },
  { value: "soleil", label: "Soleil", svg: "/motifs/soleil.svg" },
  { value: "eclair", label: "Éclair", svg: "/motifs/eclair.svg" },
  { value: "patte", label: "Patte", svg: "/motifs/patte.svg" },
];

export function motifThumb(m) {
  return m.svg;
}

// value -> chemin SVG (utilisé par les aperçus 3D / canvas).
export const MOTIF_SVG = Object.fromEntries(MOTIFS.map((m) => [m.value, m.svg]));

export const MOTIF_OPTIONS = MOTIFS.map((m) => ({ value: m.value, label: m.label }));
