import Link from "next/link";
import { getReviews } from "@/lib/stock";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avis clients — Niv Création",
  description: "Les avis vérifiés de nos clients sur les créations personnalisées Niv Création.",
};

function Stars({ value }) {
  const n = Math.round(value);
  return (
    <span style={{ color: "#d8a93a", letterSpacing: 1 }} aria-label={`${value}/5`}>
      {"★".repeat(n)}
      <span style={{ color: "#e4d5b0" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default async function AvisPage() {
  const [reviewsBySlug, catalog] = await Promise.all([
    getReviews().catch(() => ({})),
    getCatalog().catch(() => []),
  ]);
  const nameOf = {};
  for (const p of catalog) nameOf[p.slug] = p.name || p.title || p.slug;

  // Tous les avis approuvés, avec le nom du produit, les plus récents d'abord.
  const all = [];
  for (const [slug, list] of Object.entries(reviewsBySlug)) {
    for (const r of list || []) {
      if (r.approved) all.push({ ...r, slug, product: nameOf[slug] || null });
    }
  }
  all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const count = all.length;
  const average = count ? Math.round((all.reduce((s, r) => s + (r.rating || 0), 0) / count) * 10) / 10 : 0;

  return (
    <main className="container" style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 60px" }}>
      <div className="section-head" style={{ textAlign: "center", marginBottom: 8 }}>
        <span className="eyebrow">Ils nous ont fait confiance</span>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}>Avis clients</h1>
      </div>

      {count > 0 ? (
        <div className="site-rating" style={{ margin: "0 auto 28px" }}>
          <span className="sr-stars" aria-hidden="true">
            {"★★★★★".slice(0, Math.round(average))}
            <span className="sr-stars-empty">{"★★★★★".slice(Math.round(average))}</span>
          </span>
          <strong>{average.toFixed(1).replace(".", ",")}/5</strong>
          <span className="sr-count">· {count} avis</span>
          <span className="sr-verified">Avis vérifiés</span>
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>Aucun avis pour le moment.</p>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {all.map((r, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px", background: "var(--card, #fffdf8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <strong>{r.name || "Cliente"}</strong>
              <Stars value={r.rating} />
            </div>
            <p style={{ margin: "8px 0 0", whiteSpace: "pre-line", lineHeight: 1.55 }}>{r.text}</p>
            {r.product && (
              <Link href={`/produit/${r.slug}`} style={{ display: "inline-block", marginTop: 10, fontSize: "0.85rem", color: "var(--gold-dark, #a98935)", textDecoration: "none", fontWeight: 600 }}>
                {r.product} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
