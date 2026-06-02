import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products, CATEGORIES, getCategoryLabel } from "@/lib/products";

export const metadata = {
  title: "Boutique — toutes nos créations personnalisées",
  description:
    "Découvrez tous les bijoux, décorations de mariage et cadeaux personnalisés Niv Création, gravés au laser dans notre atelier français.",
};

export default function BoutiquePage({ searchParams }) {
  const activeCat = searchParams?.cat;
  const filtered = activeCat
    ? products.filter((p) => p.category === activeCat)
    : products;

  const title = activeCat ? getCategoryLabel(activeCat) : "Toutes nos créations";

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Boutique</span>
          <h2>{title}</h2>
          <p>Chaque création est personnalisable et fabriquée à la main en France.</p>
        </div>

        <div className="filters">
          <Link href="/boutique" className={`filter-chip ${!activeCat ? "active" : ""}`}>
            Tout
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/boutique?cat=${c.slug}`}
              className={`filter-chip ${activeCat === c.slug ? "active" : ""}`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
