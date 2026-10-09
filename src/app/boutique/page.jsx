import Link from "next/link";
import UniversPage from "@/components/univers/UniversPage";
import Reveal from "@/components/univers/Reveal";
import Carte from "@/components/univers/Carte";
import { UvTabs, Crumb } from "@/components/univers/UvTabs";
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue } from "@/lib/univers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boutique — toutes nos créations personnalisées",
  description:
    "Découvrez tous les bijoux (femme & homme), cristaux photo 3D, verres gravés, cadeaux de naissance, décorations de mariage et cadeaux personnalisés Niv Création, gravés au laser dans notre atelier français.",
  alternates: { canonical: "/boutique" },
};

// « Toute la boutique » (maquette « accueil + univers », appliquée le 09/10/2026) :
// un rayon par univers, chaque création une seule fois. La recherche (?q=)
// reste disponible : elle montre les créations dont le nom correspond.
export default async function BoutiquePage({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  if (!q) return <UniversPage uid="boutique" />;
  const catalog = await getCatalog().catch(() => []);
  const R = rangerCatalogue(catalog);
  const ql = q.toLowerCase();
  const trouves = catalog
    .filter((p) => `${p.name} ${p.title || ""} ${p.tagline || ""} ${p.type || ""}`.toLowerCase().includes(ql))
    .map((p) => R.carteDe(p.slug)).filter(Boolean);
  return (
    <div className="mx">
      <Reveal />
      <div className="uv">
        <UvTabs univers={R.univers} courant="boutique" total={R.boutique.count} />
        <article className="mxup">
          <header className="mxup-head mxup-head-solo">
            <div className="mxup-txt">
              <Crumb items={[{ label: "Boutique", href: "/boutique" }, { label: "Recherche" }]} />
              <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>Recherche : « {q} »</h1>
              <p className="mxup-count">{trouves.length} création{trouves.length > 1 ? "s" : ""}</p>
            </div>
          </header>
          {trouves.length ? (
            <div className="ug">{trouves.map((c) => <Carte key={c.slug} c={c} />)}</div>
          ) : (
            <p className="ur-empty">Aucun résultat pour « {q} ». <Link className="link" href="/boutique">Voir toute la boutique</Link></p>
          )}
        </article>
      </div>
    </div>
  );
}
