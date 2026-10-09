// Page « Cristaux déjà gravés » — maquette validée docs/maquettes/cristaux-graves.html (v14),
// mise en ligne le 10/10/2026 à la demande du gérant (« les trois »). Page À PART : /cristaux
// (blocs photo) reste la page des cristaux à votre photo.
import CristauxGraves from "@/components/cristal/CristauxGraves";
import { getCatalogBySlug } from "@/lib/catalog";
import { CG_SLUG } from "@/lib/cristauxGraves";
import "../cristaux-graves.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cristaux déjà gravés — modèles, dessins et signes du zodiaque",
  description: "Des cristaux déjà gravés, prêts à offrir : un modèle, un dessin ou votre signe du zodiaque gravé en 3D au cœur d'un cristal optique K9, dans notre atelier en France.",
  alternates: { canonical: "/cristaux-graves" },
};

export default async function CristauxGravesPage() {
  // Prix des tailles lus dans le catalogue (un prix changé dans Gestion s'affiche ici).
  const produit = await getCatalogBySlug(CG_SLUG).catch(() => null);
  const prix = Object.fromEntries((produit?.variants || []).map((v) => [v.id, Number(v.price)]));
  return <CristauxGraves prix={prix} />;
}
