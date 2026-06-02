import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  products,
  CATEGORIES,
  getCategoryLabel,
  getSubcategories,
  getSubcategoryLabel,
} from "@/lib/products";
import { getImageOverrides } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boutique — toutes nos créations personnalisées",
  description:
    "Découvrez tous les bijoux (femme & homme), décorations de mariage et cadeaux personnalisés Niv Création, gravés au laser dans notre atelier français.",
};

export default async function BoutiquePage({ searchParams }) {
  const activeCat = searchParams?.cat;
  const activeSub = searchParams?.sub;
  const overrides = await getImageOverrides();

  const withImages = products.map((p) =>
    overrides[p.slug]?.length ? { ...p, images: overrides[p.slug] } : p
  );
  let filtered = activeCat ? withImages.filter((p) => p.category === activeCat) : withImages;
  if (activeCat && activeSub) {
    filtered = filtered.filter((p) => p.subcategory === activeSub);
  }

  const subs = activeCat ? getSubcategories(activeCat) : null;

  const title = activeSub
    ? getSubcategoryLabel(activeCat, activeSub)
    : activeCat
      ? getCategoryLabel(activeCat)
      : "Toutes nos créations";

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Boutique</span>
          <h2>{title}</h2>
          <p>Chaque création est personnalisable et réalisée avec soin en France.</p>
        </div>

        {/* Catégories principales */}
        <div className="filters">
          <Link href="/boutique" className={`filter-chip ${!activeCat ? "active" : ""}`}>
            Tout
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/boutique?cat=${c.slug}`}
              className={`filter-chip ${activeCat === c.slug && !activeSub ? "active" : ""}`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Sous-catégories (ex : bijoux femme / homme) */}
        {subs && (
          <div className="filters subfilters">
            <Link
              href={`/boutique?cat=${activeCat}`}
              className={`filter-chip ${!activeSub ? "active" : ""}`}
            >
              Tous les {getCategoryLabel(activeCat).toLowerCase()}
            </Link>
            {subs.map((s) => (
              <Link
                key={s.slug}
                href={`/boutique?cat=${activeCat}&sub=${s.slug}`}
                className={`filter-chip ${activeSub === s.slug ? "active" : ""}`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}

        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
