// =============================================================================
// TROUVER UN CADEAU PAR OCCASION (audit du 19/09/2026, validé « applique »).
// Une occasion = une règle de sélection sur le CATALOGUE EN DIRECT (même
// principe que les guides « Idées & conseils ») : jamais de produit recopié en
// dur, donc jamais de lien mort ni de vieux prix, et les nouveautés se rangent
// toutes seules dès qu'elles correspondent à la règle.
// =============================================================================

const texteDe = (p) => `${p.slug} ${p.name} ${p.title || ""} ${p.type || ""} ${p.tagline || ""}`.toLowerCase();
const contient = (p, mots) => { const t = texteDe(p); return mots.some((m) => t.includes(m)); };

export const OCCASIONS = [
  {
    slug: "mariage",
    label: "Mariage",
    titre: "Cadeaux de mariage personnalisés",
    description: "Flûtes gravées aux prénoms des mariés, carafe, décorations de cérémonie : des cadeaux de mariage gravés dans notre atelier français.",
    intro: "Des pièces gravées aux prénoms des mariés et à leur date — le cadeau qui reste.",
    image: "/produits/flute_set.jpg",
    match: (p) => p.category === "mariage" || contient(p, ["flute", "flûte", "carafe", "mariage", "maries", "mariés"]),
  },
  {
    slug: "naissance",
    label: "Naissance",
    titre: "Cadeaux de naissance personnalisés",
    description: "Plaques de naissance, souvenirs gravés aux informations de bébé et cristal photo : des cadeaux de naissance personnalisés, faits en France.",
    intro: "Le prénom, la date, le poids — tout ce qui fait ce jour-là, gravé pour toujours.",
    image: "/produits/cristal-v-bebe.jpg",
    match: (p) => p.category === "naissance" || contient(p, ["naissance", "bebe", "bébé"]),
  },
  {
    slug: "amour",
    label: "Amour",
    titre: "Cadeaux d'amour personnalisés — couple",
    description: "Bijoux à graver, colliers de couple et cristal photo : des cadeaux d'amour personnalisés pour un anniversaire de rencontre ou une déclaration.",
    intro: "Un prénom, une date, un mot doux : les cadeaux qui disent je t'aime en toutes lettres.",
    image: "/produits/cristal-h-couple.jpg",
    match: (p) => contient(p, ["coeur", "cœur", "couple", "amour", "toi", "puzzle"]),
  },
  {
    slug: "pour-lui",
    label: "Pour lui",
    titre: "Cadeaux personnalisés pour homme",
    description: "Verre à whisky gravé, bijoux homme, bracelets cuir et cadeaux gravés : des idées de cadeaux personnalisés pour lui.",
    intro: "Whisky, cuir, acier : des pièces gravées qui lui ressemblent.",
    image: "/produits/verre_a_whisky_card.jpg",
    match: (p) => p.subcategory === "homme" || contient(p, ["whisky", "homme", "papa", "pere", "père"]),
  },
  {
    slug: "pour-elle",
    label: "Pour elle",
    titre: "Cadeaux personnalisés pour femme",
    description: "Colliers et bracelets gravés, bijoux personnalisés et attentions gravées : des idées de cadeaux personnalisés pour elle.",
    intro: "Des bijoux gravés à son prénom, des attentions qui ne se rangent jamais dans un tiroir.",
    image: "/produits/bracelet-coeur-ot-dore.jpg",
    match: (p) => (p.category === "bijoux" && p.subcategory !== "homme") || contient(p, ["femme", "maman", "mere", "mère"]),
  },
  {
    slug: "famille",
    label: "Famille",
    titre: "Cadeaux de famille personnalisés",
    description: "Cristal photo 3D, arbre de vie et souvenirs gravés : des cadeaux personnalisés qui rassemblent toute la famille.",
    intro: "Une photo de famille dans le cristal, un arbre de vie gravé : le souvenir qui traverse le temps.",
    image: "/produits/cristal-h-famille.jpg",
    match: (p) => contient(p, ["cristal", "famille", "arbre", "photo 3d", "portrait"]),
  },
];

export function getOccasion(slug) {
  return OCCASIONS.find((o) => o.slug === slug) || null;
}

// Produits du catalogue vivant qui correspondent à l'occasion (12 max par
// défaut : une page riche mais qui reste un CHOIX, pas tout le magasin).
export function produitsPourOccasion(catalog, occasion, max = 12) {
  const o = typeof occasion === "string" ? getOccasion(occasion) : occasion;
  if (!o) return [];
  return catalog.filter((p) => { try { return o.match(p); } catch { return false; } }).slice(0, max);
}
