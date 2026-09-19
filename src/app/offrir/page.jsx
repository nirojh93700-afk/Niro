import Link from "next/link";
import { OCCASIONS } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offrir — trouver un cadeau par occasion",
  description:
    "Mariage, naissance, amour, pour lui, pour elle, famille : trouvez le cadeau personnalisé qui correspond à l'occasion, gravé dans notre atelier français.",
  alternates: { canonical: "/offrir" },
};

// =============================================================================
// PAGE « OFFRIR » — navigation par occasion (audit 19/09/2026, « applique »).
// Six portes d'entrée ; chaque occasion pioche dans le catalogue en direct.
// =============================================================================
export default function OffrirPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Offrir</span>
          <h2>Pour quelle occasion ?</h2>
          <p>Dites-nous ce que vous célébrez : nous vous montrons les créations qui vont avec.</p>
        </div>
        <div className="occ-grid">
          {OCCASIONS.map((o) => (
            <Link key={o.slug} href={`/offrir/${o.slug}`} className="occ-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.titre} loading="lazy" />
              <span>{o.label}</span>
            </Link>
          ))}
          <Link href="/carte-cadeau" className="occ-card occ-carte">
            <div className="occ-carte-int">
              <div>
                <div className="gc-marque">NiV CRÉATION</div>
                <div className="gc-lib">Carte cadeau</div>
              </div>
              <div className="occ-carte-txt">Laissez-lui le choix — de 20 à 100 €</div>
            </div>
            <span>Carte cadeau</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
