import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductReviews from "@/components/ProductReviews";
import { getCatalogBySlug, priceFrom } from "@/lib/catalog";

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
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
      <ProductReviews slug={product.slug} />
    </>
  );
}
