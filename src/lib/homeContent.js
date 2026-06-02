import { getProductBySlug } from "./products";

// Contenu commun aux 3 maquettes d'accueil (sans emoji).
export const brand = {
  eyebrow: "Atelier français — gravure & découpe laser",
  headline: "L'art de graver vos émotions",
  intro:
    "Bijoux, décorations de mariage et cadeaux personnalisés, façonnés à la main dans notre atelier. Chaque pièce raconte votre histoire.",
  statementEyebrow: "Notre savoir-faire",
  statement:
    "Chaque création est dessinée puis gravée au laser dans des matières nobles — bois, acier inoxydable, acrylique. Des pièces uniques, pensées pour traverser le temps.",
  quote: "Chaque pièce raconte votre histoire.",
  trust: ["Fait main en France", "Gravure sur mesure", "Paiement sécurisé", "Expédition soignée"],
};

export const categoryCards = [
  {
    slug: "bijoux",
    label: "Bijoux personnalisés",
    sub: "Colliers & bracelets gravés",
    image: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0],
  },
  {
    slug: "mariage",
    label: "Mariage & Réception",
    sub: "Numéros de table, menus, ronds de serviette",
    image: getProductBySlug("menu-de-mariage-bois-grave").images[0],
  },
  {
    slug: "cadeaux",
    label: "Cadeaux & Décoration",
    sub: "Plaques, objets souvenirs gravés",
    image: getProductBySlug("plaque-de-porte-enfant").images[0],
  },
];

export const featured = [
  "collier-medaillon-coeur-ouvrable",
  "numero-table-arches-bohemes",
  "bracelet-homme-cuir-acier",
  "ronds-de-serviette-bois",
  "plaque-de-porte-enfant",
  "menu-de-mariage-bois-grave",
].map(getProductBySlug);

export const heroImages = {
  editorial: getProductBySlug("menu-de-mariage-bois-grave").images[0],
  immersive: getProductBySlug("numero-table-arches-bohemes").images[0],
  manifesto: getProductBySlug("collier-medaillon-coeur-ouvrable").images[0],
};
