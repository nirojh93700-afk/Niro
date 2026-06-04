import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  CATEGORIES,
  getCategoryLabel,
  getSubcategories,
  getSubcategoryLabel,
} from "@/lib/products";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boutique — toutes nos créations personnalisées",
  description:
    "Découvrez tous les bijoux (femme & homme), décorations de mariage et cadeaux personnalisés Niv Création, gravés au laser dans notre atelier français.",
};

export default async function BoutiquePage({ searchParams }) {
  const activeCat = searchParams?.cat;
  const activeSub = searchParams?.sub;
  const withImages = await getCatalog();

  let filtered = activeCat ? withImages.filter((p) => p.category === activeCat) : withImages;
  if (activeCat && activeSub) {
    filtered = filtered.filter((p) => p.subcategory === activeSub);
  }

  const subs = activeCat ? getSubcategories(activeCat) : null;

  // Catégories pour lesquelles on propose le contact direct (sur mesure).
  const showCustomContact = activeCat === "mariage" || activeCat === "cadeaux";
  const customContactHeading =
    activeCat === "mariage"
      ? "Un projet pour votre grand jour ?"
      : "Une création rien que pour vous ?";
  const customContactText =
    activeCat === "mariage"
      ? "Numéros de table, menus, décoration… Dites-moi votre idée, je la réalise sur mesure :"
      : "Une décoration ou un cadeau personnalisé sur bois, une idée unique ? Parlons-en directement :";

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

        {showCustomContact && (
          <div
            style={{
              background: "#fbf4e6",
              border: "1px solid #e7d3a1",
              borderRadius: 14,
              padding: "18px 20px",
              margin: "0 0 26px",
              textAlign: "center",
            }}
          >
            <strong style={{ color: "var(--gold-dark)" }}>
              {customContactHeading}
            </strong>
            <p style={{ margin: "6px 0 12px", color: "var(--ink-soft)", fontSize: "0.95rem" }}>
              {customContactText}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a className="btn btn-gold" href="mailto:contact.nivcreation@gmail.com">
                ✉️ contact.nivcreation@gmail.com
              </a>
              <a className="btn btn-outline" href="tel:+33766153102">
                📞 07 66 15 31 02
              </a>
            </div>
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
