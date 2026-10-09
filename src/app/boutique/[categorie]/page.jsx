import { redirect } from "next/navigation";
import UniversPage from "@/components/univers/UniversPage";
import { RAYON_JEUX } from "@/lib/lienCategorie";
import { UNIVERS_IDS, ANCIENNES_CATEGORIES, getUnivers } from "@/lib/univers";

export const dynamic = "force-dynamic";

// Titres/descriptions SEO par univers (maquette « accueil + univers », appliquée le 09/10/2026).
const META = {
  bijoux: { t: "Bijoux personnalisés gravés — femme & homme", d: "Colliers, bracelets et bijoux personnalisés en acier inoxydable, gravés au laser dans notre atelier français." },
  cristal: { t: "Cristal photo 3D personnalisé — tous nos modèles", d: "Blocs, porte-clés et clé USB en cristal, votre photo gravée en 3D à l'intérieur. Réalisé dans notre atelier en France." },
  verres: { t: "Verres gravés personnalisés — vin, champagne, whisky, cocktail", d: "Verres à whisky, à cocktail, à vin, flûtes à champagne et carafe gravés à votre prénom, date ou message. Gravure laser permanente." },
  enfants: { t: "Bébé & Enfant — cadeaux personnalisés au prénom de votre enfant", d: "Plaques de naissance, cartes étapes, couverts, veilleuse et plaque de porte personnalisés, gravés dans notre atelier français." },
  mariage: { t: "Décorations de mariage personnalisées", d: "Numéros de table, menus, ronds de serviette et verres de réception personnalisés, gravés et découpés au laser." },
  maison: { t: "Maison & Déco — lampes, veilleuses et bougeoirs gravés", d: "Lampes, veilleuses et bougeoirs personnalisés, gravés au laser dans notre atelier français." },
  cadeaux: { t: "Petits cadeaux personnalisés gravés", d: "Clés USB, porte-clés, pièce à graver et accessoires de bureau personnalisés, faits en France." },
};

export async function generateMetadata({ params }) {
  const u = getUnivers(params.categorie);
  if (!u) return {};
  const m = META[u.id] || { t: u.nom, d: u.accroche };
  return { title: m.t, description: m.d, alternates: { canonical: `/boutique/${u.id}` } };
}

// /boutique/<univers>. Les anciennes catégories (deco, naissance) renvoient vers leur univers.
export default async function CategoryPage({ params, searchParams }) {
  const id = params.categorie;
  if (id === "jeux") redirect(RAYON_JEUX);
  if (ANCIENNES_CATEGORIES[id]) redirect(`/boutique/${ANCIENNES_CATEGORIES[id]}`);
  if (!UNIVERS_IDS.includes(id)) redirect("/boutique");
  // Anciennes adresses / liens du pied de page : ?sub=femme|homme pré-coche « Pour elle » / « Pour lui ».
  const quiInitial = id === "bijoux" ? ({ femme: "elle", homme: "lui" }[searchParams?.sub] || "") : "";
  return <UniversPage uid={id} quiInitial={quiInitial} />;
}
