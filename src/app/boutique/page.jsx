import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  CATEGORIES,
  JEWEL_TYPES,
  getCategoryLabel,
  getSubcategories,
  getSubcategoryLabel,
  getJewelType,
  getJewelTypeLabel,
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
  const activeType = searchParams?.type; // bijoux : collier / bracelet
  const withImages = await getCatalog();

  let filtered = activeCat ? withImages.filter((p) => p.category === activeCat) : withImages;
  if (activeCat && activeSub) {
    filtered = filtered.filter((p) => p.subcategory === activeSub);
  }
  if (activeCat === "bijoux" && activeType) {
    filtered = filtered.filter((p) => getJewelType(p) === activeType);
  }

  const subs = activeCat ? getSubcategories(activeCat) : null;
  const isBijoux = activeCat === "bijoux";

  // Catégories à afficher en filtre : celles qui ont au moins un produit visible.
  const presentCats = new Set(withImages.map((p) => p.category));
  const menuCategories = CATEGORIES.filter((c) => presentCats.has(c.slug) || c.slug === activeCat);

  // Conserve l'autre facette dans les liens (femme + collier combinables).
  const baseQs = `cat=${activeCat}`;
  const subHref = (sub) =>
    `/boutique?${baseQs}${sub ? `&sub=${sub}` : ""}${activeType ? `&type=${activeType}` : ""}`;
  const typeHref = (type) =>
    `/boutique?${baseQs}${activeSub ? `&sub=${activeSub}` : ""}${type ? `&type=${type}` : ""}`;

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

  // Titre : combine le type et le « pour qui » pour les bijoux.
  let title;
  if (isBijoux && (activeType || activeSub)) {
    const typePart = activeType ? getJewelTypeLabel(activeType) : "Bijoux";
    const subPart = activeSub ? getSubcategoryLabel(activeCat, activeSub).toLowerCase() : "";
    title = subPart ? `${typePart} ${subPart}` : typePart;
  } else if (activeSub) {
    title = getSubcategoryLabel(activeCat, activeSub);
  } else if (activeCat) {
    title = getCategoryLabel(activeCat);
  } else {
    title = "Toutes nos créations";
  }

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
          {menuCategories.map((c) => (
            <Link
              key={c.slug}
              href={`/boutique?cat=${c.slug}`}
              className={`filter-chip ${activeCat === c.slug && !activeSub ? "active" : ""}`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Bijoux : deux axes combinables — Pour qui (femme/homme…) puis Type */}
        {isBijoux && (
          <div className="facet-bar">
            <div className="facet-row">
              <span className="facet-label">Pour qui</span>
              <div className="facet-chips">
                <Link href={subHref(null)} className={`filter-chip ${!activeSub ? "active" : ""}`}>
                  Tous
                </Link>
                {subs.map((s) => (
                  <Link
                    key={s.slug}
                    href={subHref(s.slug)}
                    className={`filter-chip ${activeSub === s.slug ? "active" : ""}`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="facet-row">
              <span className="facet-label">Type</span>
              <div className="facet-chips">
                <Link href={typeHref(null)} className={`filter-chip ${!activeType ? "active" : ""}`}>
                  Tous
                </Link>
                {JEWEL_TYPES.map((t) => (
                  <Link
                    key={t.slug}
                    href={typeHref(t.slug)}
                    className={`filter-chip ${activeType === t.slug ? "active" : ""}`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Autres catégories avec sous-catégories simples */}
        {!isBijoux && subs && (
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

        {activeCat ? (
          <div className="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : (
          // Vue « Tout » : produits regroupés par thème (au lieu d'être mélangés).
          menuCategories.map((c) => {
            const items = withImages.filter((p) => p.category === c.slug);
            if (!items.length) return null;
            return (
              <div key={c.slug} style={{ marginBottom: 44 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: 8,
                    marginBottom: 18,
                  }}
                >
                  <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontWeight: "normal", color: "var(--gold-dark)" }}>
                    {c.label}
                  </h3>
                  <Link href={`/boutique?cat=${c.slug}`} className="link-underline" style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                    Tout voir →
                  </Link>
                </div>
                <div className="product-grid">
                  {items.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
