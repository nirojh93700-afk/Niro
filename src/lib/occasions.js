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
  "porte-cles-cristal-led-coeur", "piece-ronde-laiton", "decoration-noel-verre-gravee",
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

// 💐 Pages de fête (24/11/2026, gérant : « fais pour toutes les fêtes » → « applique ») : listes FERMÉES,
// lues dans le catalogue en direct. `pageSeule` : elles ont leur page /offrir/<slug> mais ne changent PAS
// les occasions des cartes du parcours « Trouver un cadeau » (qui a ses propres fêtes, Finder.jsx).
const listeFermee = (slug, label, titre, description, intro, image, slugs) => ({
  slug, label, titre, description, intro, image, max: slugs.length, ordre: slugs, pageSeule: true,
  match: (p) => slugs.includes(p.slug),
});
OCCASIONS.push(
  listeFermee("saint-valentin", "Saint-Valentin", "Cadeaux de Saint-Valentin personnalisés, gravés dans notre atelier",
    "Colliers de couple, bijoux cœur gravés, cristal photo 3D et verres gravés : des cadeaux de Saint-Valentin personnalisés, gravés à la commande en France.",
    "Vos prénoms, votre date, votre photo : un cadeau de Saint-Valentin qui ne ressemble qu'à vous deux.",
    "/produits/collier-double-coeur-6.jpg",
    ["collier-couple-coeur-lot2", "collier-couple-puzzle", "collier-coeur-grave", "collier-3coeurs", "collier-medaillon-coeur-ouvrable",
     "bracelet-femme-coeur", "bracelet-homme-plaque-cuir", "bracelet-gourmette-plaque", "cristal-photo-3d-horizontal",
     "flute-a-champagne-gravee", "verre-a-vin-grave", "porte-cles-cristal-led-coeur"]),
  listeFermee("fete-des-meres", "Fête des mères", "Cadeaux de Fête des mères personnalisés, gravés dans notre atelier",
    "Colliers gravés aux prénoms des enfants, médaillon cœur, cristal photo 3D : des cadeaux de Fête des mères personnalisés, gravés à la commande en France.",
    "Les prénoms de ses enfants, une date, une photo : le cadeau qu'elle gardera.",
    "/produits/collier-coeur-grave-2.jpg",
    ["collier-coeur-grave", "collier-3coeurs", "collier-medaillon-coeur-ouvrable", "collier-barre-verticale", "bracelet-femme-coeur",
     "bracelet-empreinte-pied-bebe", "cristal-photo-3d-vertical", "verre-a-vin-grave", "carnet-a5-grave", "marque-page-bois-pompon"]),
  listeFermee("fete-des-peres", "Fête des pères", "Cadeaux de Fête des pères personnalisés, gravés dans notre atelier",
    "Verre à whisky gravé, carafe, gourmettes et porte-clés à graver : des cadeaux de Fête des pères personnalisés, gravés à la commande en France.",
    "Son prénom, un message, le prénom de ses enfants : un cadeau gravé qui lui ressemble.",
    "/produits/verre_a_whisky_exemple_face.jpg",
    ["verre-a-whisky-fete-des-peres", "verre-a-whisky-grave", "verre-tumbler-cristal-grave", "carafe-a-whisky-gravee",
     "bracelet-homme-identite-gourmette", "bracelet-gourmette-plaque", "bracelet-homme-cuir-tresse-acier", "porte-cles-cuir-a-graver",
     "cle-usb-bois-coffret", "support-telephone-bois-grave"]),
  // 24/11/2026 (gérant : « fais pour toutes les fêtes, même étrangères ») : mêmes règles.
  listeFermee("paques", "Pâques", "Cadeaux de Pâques personnalisés, gravés dans notre atelier",
    "Puzzles et couverts au prénom de l'enfant, bijoux gravés, cristal photo 3D : des cadeaux de Pâques personnalisés, gravés à la commande en France.",
    "Un prénom gravé, un cadeau qui se garde bien après les chocolats.",
    "/produits/couverts_enfants_ex_prenom.jpg",
    ["puzzle-foret", "puzzle-savane", "couverts-enfants-personnalises", "plaque-de-porte-enfant", "marque-page-bois-pompon",
     "collier-coeur-grave", "bracelet-femme-coeur", "cristal-photo-3d-vertical", "verre-a-vin-grave", "carnet-a5-grave"]),
  listeFermee("fete-des-grands-meres", "Fête des grands-mères", "Cadeaux de Fête des grands-mères personnalisés, gravés dans notre atelier",
    "Colliers aux prénoms des petits-enfants, médaillon cœur, cristal photo 3D : des cadeaux de Fête des grands-mères personnalisés, gravés en France.",
    "Les prénoms de ses petits-enfants, gravés pour qu'elle les garde près d'elle.",
    "/produits/collier-3coeurs-3.jpg",
    ["collier-3coeurs", "collier-medaillon-coeur-ouvrable", "collier-barre-verticale", "collier-coeur-grave", "bracelet-femme-coeur",
     "cristal-photo-3d-vertical", "cristal-photo-3d-horizontal", "marque-page-bois-pompon", "carnet-a5-grave", "verre-a-vin-grave"]),
  listeFermee("fete-des-grands-peres", "Fête des grands-pères", "Cadeaux de Fête des grands-pères personnalisés, gravés dans notre atelier",
    "Verre à whisky gravé, carafe, porte-clés à graver, cristal photo 3D : des cadeaux de Fête des grands-pères personnalisés, gravés en France.",
    "Son prénom, ceux de ses petits-enfants, une photo de famille : un cadeau gravé qui lui ressemble.",
    "/produits/verre_a_whisky_exemple_face.jpg",
    ["verre-a-whisky-grave", "verre-a-whisky-fete-des-peres", "carafe-a-whisky-gravee", "porte-cles-cuir-a-graver",
     "bracelet-homme-identite-gourmette", "cristal-photo-3d-horizontal", "cle-usb-bois-coffret", "support-telephone-bois-grave"]),
  listeFermee("nouvel-an-chinois", "Nouvel An chinois", "Cadeaux du Nouvel An chinois personnalisés, gravés en chinois",
    "Bijoux, verres et cristal photo 3D gravés d'un vœu en chinois : des cadeaux du Nouvel An chinois personnalisés, gravés à la commande en France.",
    "Un vœu gravé en chinois, relu par vous avant la gravure.",
    "/produits/collier-coeur-grave-1.jpg",
    ["collier-coeur-grave", "collier-3coeurs", "bracelet-femme-coeur", "bracelet-homme-identite-gourmette", "verre-a-vin-grave",
     "flute-a-champagne-gravee", "carafe-a-whisky-gravee", "cristal-photo-3d-horizontal", "gobelet-isotherme-40oz"]),
  listeFermee("aid-el-fitr", "Aïd el-Fitr", "Cadeaux de l'Aïd personnalisés, gravés en arabe",
    "Bijoux, cristal photo 3D et souvenirs gravés d'un prénom ou d'un vœu en arabe : des cadeaux de l'Aïd personnalisés, gravés à la commande en France.",
    "Un prénom ou un vœu gravé en arabe, relu par vous avant la gravure.",
    "/produits/cristal-h-famille.jpg",
    ["cristal-photo-3d-horizontal", "cristal-photo-3d-vertical", "collier-coeur-grave", "collier-3coeurs", "bracelet-femme-coeur",
     "bracelet-homme-identite-gourmette", "couverts-enfants-personnalises", "carnet-a5-grave", "gobelet-isotherme-40oz"]),
  listeFermee("hanoukka", "Hanoukka", "Cadeaux de Hanoukka personnalisés, gravés en hébreu",
    "Verres, carafe, bijoux et cristal photo 3D gravés d'un prénom ou d'un vœu en hébreu : des cadeaux de Hanoukka personnalisés, gravés en France.",
    "Un prénom ou un vœu gravé en hébreu, relu par vous avant la gravure.",
    "/produits/verre_vin_exemple_dale.jpg",
    ["verre-a-vin-grave", "flute-a-champagne-gravee", "carafe-a-whisky-gravee", "collier-coeur-grave", "bracelet-femme-coeur",
     "bracelet-homme-identite-gourmette", "cristal-photo-3d-horizontal", "veilleuse-arbre-de-vie-prenom"]),
  listeFermee("deepavali", "Deepavali", "Cadeaux de Deepavali (Diwali) personnalisés, gravés en tamoul",
    "Bougeoir lotus, bijoux et cristal photo 3D gravés d'un prénom ou d'un vœu en tamoul : des cadeaux de Deepavali personnalisés, gravés en France.",
    "Un prénom ou un vœu gravé en tamoul, relu par vous avant la gravure.",
    "/produits/collier-coeur-grave-2.jpg",
    ["bougeoir-fleur-de-lotus", "collier-coeur-grave", "collier-3coeurs", "bracelet-femme-coeur", "bracelet-homme-identite-gourmette",
     "cristal-photo-3d-horizontal", "verre-a-cocktail-grave", "gobelet-isotherme-40oz"]),
  listeFermee("fetes-tamoules", "Pongal & Nouvel An tamoul", "Cadeaux pour Pongal et le Nouvel An tamoul, gravés en tamoul",
    "Bijoux, cristal photo 3D et bougeoir gravés d'un prénom ou d'un vœu en tamoul : des cadeaux pour Thai Pongal et Puthandu, gravés en France.",
    "Un prénom ou un vœu gravé en tamoul, relu par vous avant la gravure.",
    "/produits/cristal-h-famille.jpg",
    ["collier-coeur-grave", "collier-3coeurs", "bracelet-femme-coeur", "bracelet-homme-identite-gourmette", "cristal-photo-3d-horizontal",
     "bougeoir-fleur-de-lotus", "verre-a-cocktail-grave", "couverts-enfants-personnalises"]),
  // 24/11/2026 (gérant : « fais aussi pour la Fête des grands-parents et Halloween »).
  listeFermee("grands-parents", "Grands-parents", "Cadeaux pour les grands-parents personnalisés, gravés dans notre atelier",
    "Cristal photo 3D, puzzle photo, colliers aux prénoms des petits-enfants, verres gravés : des cadeaux pour les grands-parents, gravés à la commande en France.",
    "Une photo de famille, les prénoms des petits-enfants : le cadeau qu'ils garderont.",
    "/produits/cristal-h-famille.jpg",
    ["cristal-photo-3d-horizontal", "cristal-photo-3d-vertical", "puzzle-photo-grave", "collier-3coeurs", "collier-medaillon-coeur-ouvrable",
     "verre-a-whisky-grave", "carafe-a-whisky-gravee", "verre-a-vin-grave", "porte-cles-cuir-a-graver", "cle-usb-bois-coffret"]),
  listeFermee("halloween", "Halloween", "Cadeaux d'Halloween personnalisés, gravés dans notre atelier",
    "Verres à cocktail, gobelet isotherme et verres gravés d'un prénom ou de votre dessin d'Halloween : des cadeaux personnalisés, gravés en France.",
    "Un prénom ou votre dessin d'Halloween, gravé pour la soirée.",
    "/produits/verre_a_whisky_exemple_face.jpg",
    ["verre-a-cocktail-grave", "gobelet-isotherme-40oz", "verre-a-whisky-grave", "verre-tumbler-cristal-grave", "carafe-a-whisky-gravee",
     "puzzle-foret", "puzzle-dinosaures", "plaque-de-porte-enfant"]),
  // 24/11/2026 (gérant : « fais aussi pour la Saint-Nicolas et le Nouvel An »).
  listeFermee("saint-nicolas", "Saint-Nicolas", "Cadeaux de Saint-Nicolas personnalisés, au prénom de l'enfant",
    "Puzzles en bois, couverts, plaque de porte et veilleuse au prénom de l'enfant : des cadeaux de Saint-Nicolas personnalisés, gravés en France.",
    "Le prénom de l'enfant gravé sur un cadeau qu'il gardera.",
    "/produits/couverts_enfants_ex_prenom.jpg",
    ["puzzle-foret", "puzzle-savane", "puzzle-dinosaures", "puzzle-vehicules-secours", "couverts-enfants-personnalises",
     "plaque-de-porte-enfant", "veilleuse-arbre-de-vie-prenom", "puzzle-photo-grave", "marque-page-bois-pompon"]),
  listeFermee("nouvel-an", "Nouvel An", "Cadeaux du Nouvel An personnalisés, gravés dans notre atelier",
    "Flûtes à champagne, verres à cocktail, carafe et cristal photo 3D gravés de vos prénoms ou de la nouvelle année : des cadeaux du Nouvel An, gravés en France.",
    "« Bonne année », vos prénoms, la date du réveillon : de quoi trinquer avec des verres qui vous ressemblent.",
    "/produits/flute_set.jpg",
    ["flute-a-champagne-gravee", "verre-a-cocktail-grave", "verre-a-vin-grave", "carafe-a-whisky-gravee", "verre-tumbler-cristal-grave",
     "cristal-photo-3d-horizontal", "puzzle-photo-grave", "carnet-a5-grave"]),
);

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
