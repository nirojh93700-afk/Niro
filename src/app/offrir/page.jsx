import Reveal from "@/components/univers/Reveal";
import Finder from "@/components/univers/Finder";
import { UvTabs, Crumb } from "@/components/univers/UvTabs";
import { getCatalog } from "@/lib/catalog";
import { rangerCatalogue } from "@/lib/univers";
import { QUI_TILES, OCC_TILES, FETE_PHOTO, carteLegere } from "@/lib/universFinder";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offrir — trouver un cadeau en deux étapes",
  description:
    "Pour qui ? Pour quelle occasion ? Trouvez le cadeau personnalisé qui correspond, gravé dans notre atelier français : bijoux, cristal photo, verres, cadeaux de naissance.",
  alternates: { canonical: "/offrir" },
};

// =============================================================================
// PAGE « OFFRIR » = le parcours « Trouver le bon cadeau » en deux étapes (maquette
// « Mélange », appliquée le 09/10/2026), avec TOUTES les idées. ?qui= et ?occ=
// pré-cochent les tuiles (liens de l'accueil et des bandeaux).
// =============================================================================
export default async function OffrirPage({ searchParams }) {
  const catalog = await getCatalog().catch(() => []);
  const R = rangerCatalogue(catalog);
  const initial = { qui: String(searchParams?.qui || ""), occ: String(searchParams?.occ || "") };
  return (
    <div className="mx">
      <Reveal />
      <div className="uv">
        <UvTabs univers={R.univers} courant="offrir" total={R.boutique.count} />
        <article className="mxup" id="u-offrir">
          <header className="mxup-head mxup-head-solo">
            <div className="mxup-txt">
              <Crumb items={[{ label: "Offrir" }]} />
              <h1 style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Trouver un cadeau</h1>
              <p>Toutes nos créations, selon la personne et l’occasion.</p>
            </div>
          </header>
          <Finder qui={QUI_TILES} occ={OCC_TILES} fetePhotos={FETE_PHOTO} cards={R.cartes.map(carteLegere)} limit={999} initial={initial} page />
        </article>
      </div>
    </div>
  );
}
