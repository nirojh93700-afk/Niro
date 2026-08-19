// Pages « Idées & conseils » (/idees/…) — guides de conseil pour le référencement.
// Le contenu vient des maquettes validées (docs/maquettes/guide-*.html), converti
// par tools/generer-guides.mjs dans src/lib/guidesContent.js.
import { GUIDES_HTML, GUIDES_META } from "./guidesContent";

// Ordre d'affichage sur /idees + titre & description pour Google.
export const GUIDES = [
  {
    slug: "cadeau-femme-personnalise",
    nav: "Cadeau femme",
    title: "Idées cadeaux femme personnalisés — bijoux gravés",
    description:
      "Quel bijou personnalisé offrir à une femme ? Nos conseils pour choisir le collier ou le bracelet à graver, et quoi faire graver dessus. Gravure laser en France.",
  },
  {
    slug: "idees-gravure-bijoux",
    nav: "Que faire graver",
    title: "Que graver sur un bijou ? Idées de gravure et conseils",
    description:
      "Prénom, date, message, coordonnées GPS : nos idées de gravure pour un bracelet ou un collier, avec le nombre de caractères conseillé et le choix de la police.",
  },
  {
    slug: "bijoux-homme-graves",
    nav: "Bijoux homme",
    title: "Bijoux homme à graver — bracelets et colliers personnalisés",
    description:
      "Bracelets et colliers homme à graver : cuir tressé, gourmette d'identité, chaîne acier. Nos conseils pour choisir la bonne largeur et la bonne gravure.",
  },
  {
    slug: "cadeau-couple",
    nav: "Cadeau de couple",
    title: "Cadeaux de couple personnalisés — idées à graver",
    description:
      "Colliers duo, cristal photo 3D, verres gravés : nos idées de cadeaux de couple personnalisés pour un anniversaire de rencontre, la Saint-Valentin ou un mariage.",
  },
  {
    slug: "cadeau-naissance",
    nav: "Cadeau de naissance",
    title: "Cadeaux de naissance personnalisés — plaque et bijoux gravés",
    description:
      "Plaque de naissance en bois gravé, bracelet empreinte de pied, plaque de porte : nos idées de cadeaux de naissance et de baptême personnalisés au prénom de bébé.",
  },
  {
    slug: "deco-mariage-personnalisee",
    nav: "Mariage",
    title: "Déco de mariage personnalisée en bois gravé",
    description:
      "Numéros de table, menus, ronds de serviette et étiquettes gravés au laser : nos conseils pour préparer une décoration de mariage personnalisée, quantités comprises.",
  },
  {
    slug: "cristal-photo-3d",
    nav: "Cristal photo 3D",
    title: "Cristal photo 3D — comment ça marche, prix et idées cadeau",
    description:
      "La gravure photo 3D dans le cristal expliquée simplement : quelle photo choisir, quelle taille, quel prix, avec ou sans socle lumineux. Réalisé en France.",
  },
  {
    slug: "verres-carafes-graves",
    nav: "Verres & carafes",
    title: "Verres et carafes gravés personnalisés — prénom et date",
    description:
      "Verres à vin, à whisky, flûtes et carafes gravés au prénom ou à la date : nos conseils pour choisir le modèle, le texte et la quantité. Gravure laser en France.",
  },
  {
    slug: "deco-lumineuse-bois",
    nav: "Déco lumineuse",
    title: "Lampes et décorations lumineuses en bois gravé",
    description:
      "Veilleuses, arbres de vie lumineux et lampes LED en bois gravé personnalisé : nos conseils pour choisir le modèle, la lumière et le texte à graver.",
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug) {
  const base = GUIDES.find((g) => g.slug === slug);
  if (!base) return null;
  const meta = GUIDES_META[slug] || {};
  const html = GUIDES_HTML[slug];
  if (!html) return null;
  return {
    ...base,
    h1: meta.h1 || base.title,
    eyebrow: meta.eyebrow || "Idées & conseils · Niv Création",
    chapo: meta.chapo || base.description,
    image: meta.image || "",
    faq: Array.isArray(meta.faq) ? meta.faq : [],
    html,
  };
}

export function getGuides() {
  return GUIDES.map((g) => getGuide(g.slug)).filter(Boolean);
}

// Guide le plus pertinent pour une fiche produit (lien discret sous la fiche).
// Retourne null si aucun guide ne correspond vraiment — on ne met pas de lien
// hors sujet.
export function guidePourProduit(product) {
  if (!product) return null;
  const cat = product.category || "";
  const sub = product.subcategory || "";
  const slug = product.slug || "";
  const nom = `${slug} ${product.name || ""}`.toLowerCase();

  if (cat === "cristal" || nom.includes("cristal")) return getGuide("cristal-photo-3d");
  if (cat === "naissance") return getGuide("cadeau-naissance");
  if (cat === "mariage") return getGuide("deco-mariage-personnalisee");
  if (cat === "verres") return getGuide("verres-carafes-graves");
  if (cat === "bijoux") {
    if (sub === "homme") return getGuide("bijoux-homme-graves");
    if (sub === "femme") return getGuide("cadeau-femme-personnalise");
    return getGuide("idees-gravure-bijoux");
  }
  if (/lampe|veilleuse|lumineu|led|bougeoir/.test(nom)) return getGuide("deco-lumineuse-bois");
  return null;
}
