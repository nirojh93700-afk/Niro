import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import { getCatalogBySlug, getCatalog, priceFrom } from "@/lib/catalog";
import { getReviews } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const product = await getCatalogBySlug(params.handle);
  if (!product) return {};
  const text = (product.descriptionHtml || "").replace(/<[^>]+>/g, " ").trim().slice(0, 155);
  return {
    title: product.title,
    description: text,
    openGraph: {
      title: product.title,
      description: text,
      images: product.images?.length ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getCatalogBySlug(params.handle);
  if (!product) notFound();

  // Ventes croisées : 4 autres produits (même catégorie en priorité).
  let related = [];
  try {
    const all = (await getCatalog()).filter((p) => p.slug !== product.slug);
    const sameCat = all.filter((p) => p.category === product.category);
    related = [...sameCat, ...all.filter((p) => p.category !== product.category)].slice(0, 4);
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
    </>
  );
}
