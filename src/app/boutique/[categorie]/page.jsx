import { redirect } from "next/navigation";
import BoutiquePage from "../page";
import { getCategoryLabel } from "@/lib/products";

export const dynamic = "force-dynamic";

// Catégories qui vivent DANS la boutique (cristal et naissance ont leur page dédiée).
const VALID = ["bijoux", "verres", "mariage", "deco", "cadeaux"];

// Titres/descriptions SEO par catégorie.
const META = {
  bijoux: { t: "Bijoux personnalisés gravés — femme & homme", d: "Colliers, bracelets et bijoux personnalisés en acier inoxydable, gravés au laser dans notre atelier français." },
  verres: { t: "Verres gravés personnalisés — vin, champagne, whisky", d: "Verres à vin, flûtes à champagne et carafes gravés à votre prénom, date ou message. Gravure laser permanente." },
  mariage: { t: "Décorations de mariage personnalisées", d: "Numéros de table, marque-places, menus et décorations de mariage personnalisés, gravés et découpés au laser." },
  deco: { t: "Décorations personnalisées en bois & LED", d: "Lampes, veilleuses et décorations personnalisées gravées au laser dans notre atelier français." },
  cadeaux: { t: "Cadeaux personnalisés gravés", d: "Des idées cadeaux personnalisées et gravées pour toutes les occasions, faites en France." },
};

export async function generateMetadata({ params }) {
  const cat = params.categorie;
  if (!VALID.includes(cat)) return {};
  const m = META[cat] || { t: `${getCategoryLabel(cat) || "Boutique"} personnalisés`, d: "" };
  return {
    title: m.t,
    description: m.d,
    alternates: { canonical: `/boutique/${cat}` },
  };
}

// Rend exactement la même chose que /boutique?cat=X, mais sur une vraie adresse
// /boutique/X (meilleur référencement). On délègue à la page boutique existante
// pour ne PAS dupliquer la logique de filtres/tri (zéro divergence).
export default async function CategoryPage({ params, searchParams }) {
  const cat = params.categorie;
  if (cat === "cristal") redirect("/cristaux");
  if (cat === "naissance") redirect("/naissance");
  if (!VALID.includes(cat)) redirect("/boutique");
  return BoutiquePage({ searchParams: { ...(searchParams || {}), cat } });
}
