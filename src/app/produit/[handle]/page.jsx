import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import { getCatalogBySlug, getCatalog, getCatalogAdmin, priceFrom } from "@/lib/catalog";
import { getCategoryLabel } from "@/lib/products";

// Jeton d'aperçu privé : permet d'afficher une fiche d'un produit caché
// (non publié) via ?apercu=<JETON>, sans qu'il soit visible des clients.
const PREVIEW_TOKEN = "niv2026";
import { getReviews, getRatingSummaries } from "@/lib/stock";
import RecentlyViewed from "@/components/RecentlyViewed";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const product = await getCatalogBySlug(params.handle);
  if (!product) return {};
  const text = (product.descriptionHtml || "").replace(/<[^>]+>/g, " ").trim().slice(0, 155);
  return {
    title: product.title,
    description: text,
    alternates: { canonical: `/produit/${params.handle}` },
    openGraph: {
      title: product.title,
      description: text,
      images: product.images?.length ? [product.images[0]] : [],
    },
  };
}

// URL de la catégorie du produit (cristal et naissance ont leur page dédiée).
function categoryUrl(cat) {
  if (cat === "cristal") return "/cristaux";
  if (cat === "naissance") return "/naissance";
  return `/boutique?cat=${cat}`;
}

export default async function ProductPage({ params, searchParams }) {
  let product = await getCatalogBySlug(params.handle);
  // Aperçu privé d'un produit caché (non publié) via ?apercu=<JETON>.
  let isPreview = false;
  if (!product && searchParams?.apercu === PREVIEW_TOKEN) {
    const all = await getCatalogAdmin();
    product = all.find((p) => p.slug === params.handle) || null;
    isPreview = !!product;
  }
  if (!product) notFound();

  // Note d'avis du produit (affichée près du prix + étoiles Google).
  try {
    const sum = await getRatingSummaries();
    if (sum[product.slug]) product = { ...product, rating: sum[product.slug] };
  } catch { /* ignore */ }

  // Ventes croisées : 4 autres produits (même catégorie en priorité).
  let related = [];
  try {
    const all = (await getCatalog()).filter((p) => p.slug !== product.slug);
    const sameCat = all.filter((p) => p.category === product.category);
    related = [...sameCat, ...all.filter((p) => p.category !== product.category)].slice(0, 4);
    const ratings = await getRatingSummaries().catch(() => ({}));
    related = related.map((p) => (ratings[p.slug] ? { ...p, rating: ratings[p.slug] } : p));
  } catch { /* ignore */ }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: (product.descriptionHtml || "").replace(/<[^>]+>/g, " ").trim(),
    brand: { "@type": "Brand", name: "Niv Création" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: priceFrom(product).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `https://nivcreation.fr/produit/${product.slug}`,
    },
  };

  // Fil d'Ariane (BreadcrumbList) : « Accueil › Boutique › Catégorie › Produit »
  // → affiché par Google à la place de l'URL brute (meilleur taux de clic).
  const catLabel = getCategoryLabel(product.category) || "Boutique";
  const catUrl = categoryUrl(product.category);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://nivcreation.fr" },
      { "@type": "ListItem", position: 2, name: "Boutique", item: "https://nivcreation.fr/boutique" },
      { "@type": "ListItem", position: 3, name: catLabel, item: `https://nivcreation.fr${catUrl}` },
      { "@type": "ListItem", position: 4, name: product.title },
    ],
  };

  // Étoiles d'avis dans Google (si le produit a des avis approuvés).
  try {
    const approved = ((await getReviews())[product.slug] || []).filter((r) => r.approved);
    if (approved.length) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1),
        reviewCount: approved.length,
      };
    }
  } catch { /* ignore */ }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Fil d'Ariane visible (bon pour la cliente ET pour Google). */}
      <nav className="container" aria-label="Fil d'Ariane" style={{ fontSize: "0.82rem", color: "var(--ink-soft)", padding: "12px 0 0" }}>
        <a href="/" style={{ color: "inherit", textDecoration: "none" }}>Accueil</a>
        <span style={{ margin: "0 6px" }}>›</span>
        <a href="/boutique" style={{ color: "inherit", textDecoration: "none" }}>Boutique</a>
        <span style={{ margin: "0 6px" }}>›</span>
        <a href={catUrl} style={{ color: "inherit", textDecoration: "none" }}>{catLabel}</a>
      </nav>
      {isPreview && (
        <div style={{ background: "#fbeec9", color: "#5a4a1d", textAlign: "center", padding: "10px 16px", fontSize: "0.9rem", fontWeight: 600, borderBottom: "1px solid #e7d6a8" }}>
          Aperçu privé — ce produit n'est pas encore publié (invisible pour les clients).
        </div>
      )}
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">À découvrir</span>
              <h2>Vous aimerez aussi</h2>
            </div>
            <div className="product-grid">
              {related.map((p) => (<ProductCard key={p.slug} product={p} />))}
            </div>
          </div>
        </section>
      )}
      <ProductReviews slug={product.slug} />
      <RecentlyViewed currentSlug={product.slug} />
    </>
  );
}
