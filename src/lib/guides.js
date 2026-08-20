// Pages « Idées & conseils » (/idees/…) — guides de conseil pour le référencement.
// Le contenu vient des maquettes validées (docs/maquettes/guide-*.html), converti
// par tools/generer-guides.mjs dans src/lib/guidesContent.js.
import { GUIDES_BLOCS, GUIDES_META } from "./guidesContent";

// Ordre d'affichage sur /idees + titre & description pour Google.
export const GUIDES = [
  {
    slug: "cadeau-femme-personnalise",
    auto: { category: "bijoux", subcategory: "femme" },
    nav: "Cadeau femme",
    title: "Idées cadeaux femme personnalisés — bijoux gravés",
    description:
      "Quel bijou personnalisé offrir à une femme ? Nos conseils pour choisir le collier ou le bracelet à graver, et quoi faire graver dessus. Gravure laser en France.",
  },
  {
    slug: "idees-gravure-bijoux",
    auto: { category: "bijoux" },
    nav: "Que faire graver",
    title: "Que graver sur un bijou ? Idées de gravure et conseils",
    description:
      "Prénom, date, message, coordonnées GPS : nos idées de gravure pour un bracelet ou un collier, avec le nombre de caractères conseillé et le choix de la police.",
  },
  {
    slug: "bijoux-homme-graves",
    auto: { category: "bijoux", subcategory: "homme" },
    nav: "Bijoux homme",
    title: "Bijoux homme à graver — bracelets et colliers personnalisés",
    description:
      "Bracelets et colliers homme à graver : cuir tressé, gourmette d'identité, chaîne acier. Nos conseils pour choisir la bonne largeur et la bonne gravure.",
  },
  {
    slug: "cadeau-couple",
    auto: { category: "bijoux", motCle: /couple|duo|puzzle|amour|coeur|cœur/i },
    nav: "Cadeau de couple",
    title: "Cadeaux de couple personnalisés — idées à graver",
    description:
      "Colliers duo, cristal photo 3D, verres gravés : nos idées de cadeaux de couple personnalisés pour un anniversaire de rencontre, la Saint-Valentin ou un mariage.",
  },
  {
    slug: "cadeau-naissance",
    auto: { category: "naissance" },
    nav: "Cadeau de naissance",
    title: "Cadeaux de naissance personnalisés — plaque et bijoux gravés",
    description:
      "Plaque de naissance en bois gravé, bracelet empreinte de pied, plaque de porte : nos idées de cadeaux de naissance et de baptême personnalisés au prénom de bébé.",
  },
  {
    slug: "deco-mariage-personnalisee",
    auto: { category: "mariage" },
    nav: "Mariage",
    title: "Déco de mariage personnalisée en bois gravé",
    description:
      "Numéros de table, menus, ronds de serviette et étiquettes gravés au laser : nos conseils pour préparer une décoration de mariage personnalisée, quantités comprises.",
  },
  {
    slug: "cristal-photo-3d",
    auto: { category: "cristal" },
    nav: "Cristal photo 3D",
    title: "Cristal photo 3D — comment ça marche, prix et idées cadeau",
    description:
      "La gravure photo 3D dans le cristal expliquée simplement : quelle photo choisir, quelle taille, quel prix, avec ou sans socle lumineux. Réalisé en France.",
  },
  {
    slug: "verres-carafes-graves",
    auto: { category: "verres" },
    nav: "Verres & carafes",
    title: "Verres et carafes gravés personnalisés — prénom et date",
    description:
      "Verres à vin, à whisky, flûtes et carafes gravés au prénom ou à la date : nos conseils pour choisir le modèle, le texte et la quantité. Gravure laser en France.",
  },
  {
    slug: "deco-lumineuse-bois",
    auto: { motCle: /lampe|veilleuse|lumineu|bougeoir|arbre de vie/i },
    nav: "Déco lumineuse",
    title: "Lampes et décorations lumineuses en bois gravé",
    description:
      "Veilleuses, arbres de vie lumineux et lampes LED en bois gravé personnalisé : nos conseils pour choisir le modèle, la lumière et le texte à graver.",
  },
  {
    slug: "cle-usb-personnalisee-gravee",
    auto: { motCle: /cl(é|e) usb|usb/i },
    nav: "Clé USB gravée",
    title: "Clé USB personnalisée gravée — mariage, photographe, souvenirs",
    description:
      "Clé USB en bois gravée aux prénoms et à la date, avec ou sans coffret : le cadeau des mariés, le livrable des photographes. Nos conseils et quoi faire graver.",
  },
  {
    slug: "porte-cles-piece-a-graver",
    auto: { motCle: /porte-cl(é|e)s|pi(è|e)ce ronde|m(é|e)daille/i },
    nav: "Porte-clés & pièce",
    title: "Porte-clés et pièce porte-bonheur à graver personnalisés",
    description:
      "Porte-clés en cuir gravé, pièce porte-bonheur en laiton : les petits objets personnalisés qu'on garde sur soi, et ce qu'il vaut mieux faire graver dessus.",
  },
  {
    slug: "cadeau-enfant-personnalise",
    auto: { motCle: /couverts|plaque de porte|enfant/i },
    nav: "Cadeau enfant",
    title: "Cadeaux personnalisés pour un enfant — plaque, couverts gravés",
    description:
      "Plaque de porte au prénom, couverts gravés, souvenir de naissance : les cadeaux d'enfant personnalisés qui se gardent, et quoi faire graver dessus.",
  },
  {
    slug: "porte-stylo-bois-personnalise",
    auto: { motCle: /porte-stylo|support t(é|e)l(é|e)phone/i },
    nav: "Objets de bureau",
    title: "Objets de bureau en bois — porte-stylo et support téléphone personnalisés",
    description:
      "Porte-stylo aux couleurs de son équipe, support téléphone à photo gravée ou ajouré : les objets de bureau en bois personnalisés, et comment choisir.",
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug) {
  const base = GUIDES.find((g) => g.slug === slug);
  if (!base) return null;
  const meta = GUIDES_META[slug] || {};
  const blocs = GUIDES_BLOCS[slug];
  if (!blocs) return null;
  return {
    ...base,
    h1: meta.h1 || base.title,
    eyebrow: meta.eyebrow || "Idées & conseils · Niv Création",
    chapo: meta.chapo || base.description,
    image: meta.image || "",
    faq: Array.isArray(meta.faq) ? meta.faq : [],
    cites: Array.isArray(meta.cites) ? meta.cites : [],
    blocs,
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
  if (/porte-stylo|support t(é|e)l(é|e)phone/.test(nom)) return getGuide("porte-stylo-bois-personnalise");
  if (/usb/.test(nom)) return getGuide("cle-usb-personnalisee-gravee");
  if (/porte-cl(é|e)s|piece ronde|pièce ronde|laiton/.test(nom)) return getGuide("porte-cles-piece-a-graver");
  if (/couverts|plaque de porte/.test(nom)) return getGuide("cadeau-enfant-personnalise");
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

// ---------------------------------------------------------------------------
// AUTOMATIQUE — un nouveau produit apparaît tout seul dans le bon guide.
// `auto` (défini plus haut sur chaque guide) dit quels produits du catalogue
// concernent la page : par catégorie/sous-catégorie, ou par mot-clé du nom.
// ---------------------------------------------------------------------------
export function produitConcerneGuide(guide, product) {
  const regle = guide?.auto;
  if (!regle || !product) return false;
  if (regle.category && product.category !== regle.category) return false;
  if (regle.subcategory && product.subcategory !== regle.subcategory) return false;
  if (regle.motCle && !regle.motCle.test(`${product.slug || ""} ${product.name || ""}`)) return false;
  return true;
}

// Produits du catalogue qui concernent le guide mais ne sont PAS déjà cités
// dedans (= les nouveaux). Les « Nouveau » d'abord, puis l'ordre du catalogue.
export function produitsEnPlus(guide, catalogue, max = 4) {
  if (!guide?.auto || !Array.isArray(catalogue)) return [];
  const deja = new Set(guide.cites || []);
  return catalogue
    .filter((p) => !deja.has(p.slug) && produitConcerneGuide(guide, p))
    .sort((a, b) => (b.badge === "Nouveau" ? 1 : 0) - (a.badge === "Nouveau" ? 1 : 0))
    .slice(0, max);
}
