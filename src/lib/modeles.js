// Modèles de gravure (fiches de définition) — propulsent les pages "une gravure = une page".
// Chaque modèle décrit ses lignes de texte (style + taille relative) et son motif par défaut.
// Pour créer une nouvelle page de gravure : ajouter un produit avec un champ
//   { key: "modele", type: "modele", template: "<clé ci-dessous>" }

export const MODELES = {
  embleme: {
    label: "Emblème vintage",
    lines: [
      { key: "top", label: "Texte du haut", placeholder: "OLD STYLE", font: "fnt-cinzel", em: 0.5, spacing: "0.18em" },
      { key: "mid", label: "Mot central", placeholder: "BOURBON", font: "fnt-cinzel", em: 1, bold: true, spacing: "0.05em" },
      { key: "bot", label: "Texte du bas", placeholder: "EST. 2024", font: "fnt-cinzel", em: 0.42, spacing: "0.12em" },
    ],
    defaultMotif: "etoile",
  },
  peres: {
    label: "Fête des pères",
    layout: "classic", // défaut : maquette empilée (élu / ★ PAPY ★ / DE L'ANNÉE + ancre)
    layouts: ["classic", "badge"], // styles vectoriels éditables
    // Designs "image" fidèles (cadre/textes fixes) : ajouter ici suffit à créer une vignette.
    imageDesigns: [
      { id: "papa-poule", name: "Papa poule", dark: "/produits/papa-poule-dark.png", light: "/produits/papa-poule-light.png" },
      { id: "meilleur-papa", name: "Meilleur Papa", dark: "/produits/meilleur-papa-dark.png", light: "/produits/meilleur-papa-light.png" },
      { id: "jetaime-papa", name: "Je t'aime papa", dark: "/produits/fp-jetaime-dark.png", light: "/produits/fp-jetaime-light.png" },
      { id: "meilleur-monde", name: "Meilleur papa du monde", dark: "/produits/fp-meilleurmonde-dark.png", light: "/produits/fp-meilleurmonde-light.png" },
      { id: "poing-coeurs", name: "Poing & cœurs", dark: "/produits/fp-poing-dark.png", light: "/produits/fp-poing-light.png" },
      { id: "motocross", name: "Motocross", dark: "/produits/fp-motocross-dark.png", light: "/produits/fp-motocross-light.png" },
      { id: "route66", name: "Route 66", dark: "/produits/fp-route66-dark.png", light: "/produits/fp-route66-light.png" },
      { id: "jackdaniels", name: "Jack Daniel's", dark: "/produits/fp-jackdaniels-dark.png", light: "/produits/fp-jackdaniels-light.png" },
      { id: "bourbonroom", name: "The Bourbon Room", dark: "/produits/fp-bourbonroom-dark.png", light: "/produits/fp-bourbonroom-light.png" },
      { id: "colombes", name: "Colombes & cœur", dark: "/produits/fp-colombes-dark.png", light: "/produits/fp-colombes-light.png" },
      { id: "whiskyde", name: "Whisky de… (prénom au choix)", dark: "/produits/fp-whiskyde-dark.png", light: "/produits/fp-whiskyde-light.png" },
    ],
    lines: [
      { key: "top", label: "Texte du haut", placeholder: "élu", font: "fnt-great-vibes", em: 0.85 },
      { key: "mid", label: "Mot central", placeholder: "PAPA", font: "fnt-cinzel", em: 1, bold: true, spacing: "0.08em" },
      { key: "bot", label: "Texte du bas", placeholder: "DE L'ANNÉE", font: "fnt-cinzel", em: 0.42, spacing: "0.14em" },
      { key: "sub", label: "Ajouter un prénom ou une date", placeholder: "Ex : Papa • 2026", font: "fnt-pacifico", em: 0.5, optional: true, below: true },
    ],
    defaultMotif: "ancre",
  },
  tendresse: {
    label: "Tendresse",
    lines: [
      { key: "mid", label: "Votre texte", placeholder: "Mon Papounet", font: "fnt-great-vibes", em: 0.95 },
    ],
    defaultMotif: "coeur",
  },
};

// Liste des vignettes (styles vectoriels + designs image).
export function layoutOptions(t) {
  return [...(t?.layouts || []), ...((t?.imageDesigns || []).map((d) => d.id))];
}
// Renvoie le design image correspondant à un layout (ou null si style vectoriel).
export function imageDesign(t, layout) {
  return (t?.imageDesigns || []).find((d) => d.id === layout) || null;
}
// Libellé d'un layout (nom du design image, ou nom du style vectoriel).
const VECTOR_LABELS = { classic: "élu Papa de l'année", badge: "Médaillon rond", stack: "Simple" };
export function layoutLabel(t, layout) {
  const d = imageDesign(t, layout);
  return d ? d.name : (VECTOR_LABELS[layout] || layout);
}

// Valeur par défaut d'un modèle (textes vides, polices et motif du modèle).
export function defaultModele(template) {
  const t = MODELES[template];
  if (!t) return { text: {}, fonts: {}, motif: "aucun" };
  const fonts = {};
  t.lines.forEach((l) => (fonts[l.key] = l.font));
  return { text: {}, fonts, motif: t.defaultMotif || "aucun", bg: "trait", layout: t.layout || t.style || "stack", addText: false };
}
