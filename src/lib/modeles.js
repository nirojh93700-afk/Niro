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
    style: "badge", // médaillon rond éditable (couronne d'étoiles + bandeau)
    lines: [
      { key: "top", label: "Texte du haut", placeholder: "ÉLU", font: "fnt-montserrat", em: 0.62, spacing: "0.12em" },
      { key: "mid", label: "Mot central", placeholder: "PAPA", font: "fnt-montserrat", em: 1, bold: true },
      { key: "bot", label: "Texte du bas", placeholder: "de l'année", font: "fnt-great-vibes", em: 0.62 },
      { key: "sub", label: "Ajouter un prénom ou une date (sous le badge)", placeholder: "Ex : Papa • 2026", font: "fnt-great-vibes", em: 0.5, optional: true, below: true },
    ],
    defaultMotif: "aucun",
  },
  tendresse: {
    label: "Tendresse",
    lines: [
      { key: "mid", label: "Votre texte", placeholder: "Mon Papounet", font: "fnt-great-vibes", em: 0.95 },
    ],
    defaultMotif: "coeur",
  },
};

// Valeur par défaut d'un modèle (textes vides, polices et motif du modèle).
export function defaultModele(template) {
  const t = MODELES[template];
  if (!t) return { text: {}, fonts: {}, motif: "aucun" };
  const fonts = {};
  t.lines.forEach((l) => (fonts[l.key] = l.font));
  return { text: {}, fonts, motif: t.defaultMotif || "aucun" };
}
