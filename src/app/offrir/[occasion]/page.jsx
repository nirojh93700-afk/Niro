import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getRatingSummaries, getSettings } from "@/lib/stock";
import { faqOccasion, texteReponse } from "@/lib/faqOccasions";
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
  // Questions-réponses de l'occasion (24/11/2026) : produits et prix relus dans le catalogue en direct.
  const settings = await getSettings().catch(() => ({}));
  const faq = faqOccasion(o.slug, catalog, settings);
  const faqLd = faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: texteReponse(f.parts) } })),
  } : null;

  return (
    <section className="section">
      <div className="container">
        <nav className="guide-fil" aria-label="Fil d'Ariane">
          <Link href="/offrir">Offrir</Link> <span>/</span> <span>{o.label}</span>
        </nav>
        <div className="section-head">
          <span className="eyebrow">Offrir · {o.label}</span>
          <h1>{o.titre}</h1>
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

        {faq.length > 0 && (
          <div style={{ maxWidth: 760, margin: "44px auto 0" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
            <h2 style={{ textAlign: "center" }}>Vos questions pour {o.label}</h2>
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>Les réponses aux questions qu'on nous pose le plus avant les fêtes.</p>
            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              {faq.map((f, i) => (
                <details key={i} open={i === 0} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
                  <p style={{ margin: "10px 0 2px", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                    {f.parts.map((x, j) => (typeof x === "string" ? x : (
                      <span key={j}><Link href={x.href} className="link-underline">{x.label}</Link> ({x.prix})</span>
                    )))}
                  </p>
                </details>
              ))}
            </div>
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
