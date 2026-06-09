import { getProductBySlug } from "./products";

// Contenu commun aux 3 maquettes d'accueil (sans emoji).
export const brand = {
  eyebrow: "Atelier français — gravure & découpe laser",
  headline: "L'art de graver vos émotions",
  intro:
    "Bijoux, décorations de mariage et cadeaux personnalisés par gravure laser, préparés avec soin dans notre atelier français. Chaque pièce raconte votre histoire.",
  statementEyebrow: "Notre savoir-faire",
  statement:
    "Nous gravons au laser vos bijoux, cristaux et cadeaux personnalisés. Nos créations en bois sont, elles, dessinées, gravées et découpées sur mesure dans notre atelier.",
  quote: "Chaque pièce raconte votre histoire.",
  trust: ["Personnalisé en France", "Gravure sur mesure", "Paiement sécurisé", "Expédition soignée"],
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
