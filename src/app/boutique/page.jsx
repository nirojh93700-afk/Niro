import Link from "next/link";
import { redirect } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { JEWEL_TYPES, getJewelType, getJewelTypeLabel } from "@/lib/products";
import { getCatalog } from "@/lib/catalog";
import { getRatingSummaries, getTaxonomy } from "@/lib/stock";
import {
  resolveCategories,
  resolveSubcategories,
  resolveProductOrder,
  categoryLabelFrom,
  subcategoryLabelFrom,
  makeProductSorter,
} from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boutique — toutes nos créations personnalisées",
  description:
    "Découvrez tous les bijoux (femme & homme), décorations de mariage et cadeaux personnalisés Niv Création, gravés au laser dans notre atelier français.",
};

export default async function BoutiquePage({ searchParams }) {
  // Les familles cristal et naissance ont leur page dédiée : on évite un doublon
  // dans la boutique en y renvoyant directement.
  if (searchParams?.cat === "cristal") redirect("/cristaux");
  if (searchParams?.cat === "naissance") redirect("/naissance");
  const activeCat = searchParams?.cat;
  const activeSub = searchParams?.sub;
  const activeType = searchParams?.type; // bijoux : collier / bracelet
  const activeQ = (searchParams?.q || "").trim().toLowerCase();
  const ratings = await getRatingSummaries().catch(() => ({}));
  const allWithImages = (await getCatalog()).map((p) => (ratings[p.slug] ? { ...p, rating: ratings[p.slug] } : p));
  // Les cristaux vivent sur /cristaux : on ne les liste pas dans la grille boutique.
  const withImages = allWithImages.filter((p) => !p.crystal3d && p.category !== "cristal" && p.category !== "naissance");

  // Taxonomie vivante (réglée dans l'admin, repli sur le code).
  const taxonomy = await getTaxonomy().catch(() => ({}));
  const CATS = resolveCategories(taxonomy);
  const SUBS = resolveSubcategories(taxonomy);
  const PRODUCT_ORDER = resolveProductOrder(taxonomy);
  const getCategoryLabel = (slug) => categoryLabelFrom(CATS, slug);
  const getSubcategoryLabel = (cat, sub) => subcategoryLabelFrom(SUBS, cat, sub);
  const getSubcategories = (cat) => SUBS[cat] || null;

  const searchResults = activeQ
    ? withImages.filter((p) => `${p.name} ${p.title} ${p.tagline} ${p.type}`.toLowerCase().includes(activeQ))
    : null;

  let filtered = activeCat ? withImages.filter((p) => p.category === activeCat) : withImages;
  if (activeCat && activeSub) {
    filtered = filtered.filter((p) => p.subcategory === activeSub);
  }
  if (activeCat === "bijoux" && activeType) {
    filtered = filtered.filter((p) => getJewelType(p) === activeType);
  }

  // Ordre des produits : réglage admin (productOrder) puis ordre des sous-catégories.
  if (activeCat) {
    filtered = [...filtered].sort(makeProductSorter(activeCat, SUBS, PRODUCT_ORDER));
  }

  const subs = activeCat ? getSubcategories(activeCat) : null;
  const isBijoux = activeCat === "bijoux";

  // Catégories à afficher en filtre : celles qui ont au moins un produit visible.
  // On garde « Cristal Photo 3D » comme raccourci (il renvoie vers /cristaux).
  const presentCats = new Set(withImages.map((p) => p.category));
  const menuCategories = CATS.filter((c) => presentCats.has(c.slug) || c.slug === activeCat || c.slug === "cristal" || c.slug === "naissance");

  // Conserve l'autre facette dans les liens (femme + collier combinables).
  const baseQs = `cat=${activeCat}`;
  const subHref = (sub) =>
    `/boutique?${baseQs}${sub ? `&sub=${sub}` : ""}${activeType ? `&type=${activeType}` : ""}`;
  const typeHref = (type) =>
    `/boutique?${baseQs}${activeSub ? `&sub=${activeSub}` : ""}${type ? `&type=${type}` : ""}`;

  // Catégories pour lesquelles on propose le contact direct (sur mesure).
  const showCustomContact = activeCat === "mariage" || activeCat === "cadeaux" || activeCat === "deco";
  const customContactHeading =
    activeCat === "mariage"
      ? "Un projet pour votre grand jour ?"
      : "Une création rien que pour vous ?";
  const customContactText =
    activeCat === "mariage"
      ? "Numéros de table, menus, décoration… Dites-nous votre idée, nous la réalisons sur mesure :"
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
          <h2>{activeQ ? `Recherche : « ${searchParams.q} »` : title}</h2>
          <p>Chaque création est personnalisable et réalisée avec soin en France.</p>
        </div>

        {/* Recherche */}
        <form method="get" action="/boutique" style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto 22px" }}>
          <input
            type="search"
            name="q"
            defaultValue={searchParams?.q || ""}
            placeholder="Rechercher une création…"
            style={{ flex: 1, minWidth: 0, padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 10, font: "inherit" }}
          />
          <button type="submit" className="btn btn-gold">Rechercher</button>
        </form>

        {activeQ ? (
          searchResults.length > 0 ? (
            <div className="product-grid">
              {searchResults.map((p) => (<ProductCard key={p.slug} product={p} />))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "var(--ink-soft)" }}>Aucun résultat pour « {searchParams.q} ».</p>
              <Link href="/boutique" className="btn btn-outline">Voir toute la boutique</Link>
            </div>
          )
        ) : (
        <>
        {/* Catégories principales */}
        <div className="filters">
          <Link href="/boutique" className={`filter-chip ${!activeCat ? "active" : ""}`}>
            Tout
          </Link>
          {menuCategories.map((c) => (
            <Link
              key={c.slug}
              href={c.slug === "cristal" ? "/cristaux" : c.slug === "naissance" ? "/naissance" : `/boutique?cat=${c.slug}`}
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
            const items = withImages
              .filter((p) => p.category === c.slug)
              .sort(makeProductSorter(c.slug, SUBS, PRODUCT_ORDER));
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
        </>
        )}
      </div>
    </section>
  );
}
