import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getRatingSummaries } from "@/lib/stock";
import { OCCASIONS, getOccasion, produitsPourOccasion } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const o = getOccasion(params.occasion);
  if (!o) return {};
  return {
    title: o.titre,
    description: o.description,
    alternates: { canonical: `/offrir/${o.slug}` },
  };
}

// =============================================================================
// PAGE D'UNE OCCASION — les produits viennent du catalogue EN DIRECT :
// prix à jour, produits masqués absents, nouveautés rangées toutes seules.
// =============================================================================
export default async function OccasionPage({ params }) {
  const o = getOccasion(params.occasion);
  if (!o) notFound();

  const ratings = await getRatingSummaries().catch(() => ({}));
  const catalog = (await getCatalog()).map((p) => (ratings[p.slug] ? { ...p, rating: ratings[p.slug] } : p));
  const produits = produitsPourOccasion(catalog, o);
  const autres = OCCASIONS.filter((x) => x.slug !== o.slug);

  return (
    <section className="section">
      <div className="container">
        <nav className="guide-fil" aria-label="Fil d'Ariane">
          <Link href="/offrir">Offrir</Link> <span>/</span> <span>{o.label}</span>
        </nav>
        <div className="section-head">
          <span className="eyebrow">Offrir · {o.label}</span>
          <h2>{o.titre}</h2>
          <p>{o.intro}</p>
        </div>

        {produits.length > 0 ? (
          <div className="product-grid">
            {produits.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--ink-soft)" }}>Nos créations pour cette occasion arrivent bientôt.</p>
            <Link href="/boutique" className="btn btn-outline">Voir toute la boutique</Link>
          </div>
        )}

        <div className="occ-autres">
          <span>Autre occasion&nbsp;:</span>
          {autres.map((x) => (
            <Link key={x.slug} href={`/offrir/${x.slug}`} className="filter-chip">{x.label}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}
