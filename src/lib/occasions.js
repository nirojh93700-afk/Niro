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

// 🎄 NOËL — 7ᵉ occasion (maquette validée « tu peux mettre en ligne », 25/09/2026).
// Liste FERMÉE de produits (pas de règle par mots-clés : c'est une sélection
// choisie), mais toujours lue dans le catalogue EN DIRECT : un produit masqué
// dans Gestion disparaît tout seul, un prix changé suit. 17 produits, d'où
// `max: 20` (les autres occasions gardent 12).
export const NOEL_SLUGS = [
  "cristal-photo-3d-vertical", "cristal-photo-3d-horizontal",
  "verre-a-whisky-grave", "carafe-a-whisky-gravee", "verre-a-vin-grave", "flute-a-champagne-gravee",
  "collier-plaque-acier", "collier-coeur-grave", "bracelet-homme-cuir-tresse-acier", "collier-couple-puzzle",
  "porte-cles-cuir-a-graver", "cle-usb-bois-coffret", "veilleuse-arbre-de-vie-prenom",
  "couverts-enfants-personnalises", "plaque-de-porte-enfant", "photophore-fee-bois",
  "porte-cles-cristal-led-coeur", "piece-ronde-laiton",
];
OCCASIONS.push({
  slug: "noel",
  label: "Noël",
  titre: "Des cadeaux de Noël uniques, gravés dans notre atelier",
  description: "Cristal photo 3D, verres et carafe gravés, bijoux personnalisés, souvenirs en bois : des cadeaux de Noël uniques, gravés à la commande dans notre atelier français.",
  intro: "Un prénom, une date, une photo : ce qui fait de l'objet un cadeau unique. Toutes ces pièces sont gravées à la commande et partent en colis suivi.",
  image: "/produits/collier-coeur-grave-1.jpg",
  max: 20,
  ordre: NOEL_SLUGS,
  match: (p) => NOEL_SLUGS.includes(p.slug),
});

export function getOccasion(slug) {
  return OCCASIONS.find((o) => o.slug === slug) || null;
}

// Produits du catalogue vivant qui correspondent à l'occasion (12 max par
// défaut : une page riche mais qui reste un CHOIX, pas tout le magasin).
export function produitsPourOccasion(catalog, occasion, max) {
  const o = typeof occasion === "string" ? getOccasion(occasion) : occasion;
  if (!o) return [];
  const lim = Number.isFinite(max) ? max : (o.max || 12);
  const found = catalog.filter((p) => { try { return o.match(p); } catch { return false; } });
  // Liste fermée (Noël) : on garde l'ordre voulu de la sélection, pas celui du catalogue.
  if (Array.isArray(o.ordre)) found.sort((a, b) => o.ordre.indexOf(a.slug) - o.ordre.indexOf(b.slug));
  return found.slice(0, lim);
}
