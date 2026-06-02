import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { products, getProductBySlug, getPriceFrom } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ handle: p.slug }));
}

export function generateMetadata({ params }) {
  const product = getProductBySlug(params.handle);
  if (!product) return {};
  const text = product.descriptionHtml.replace(/<[^>]+>/g, " ").trim().slice(0, 155);
  return {
    title: product.title,
    description: text,
    openGraph: {
      title: product.title,
      description: text,
      images: product.images.length ? [product.images[0]] : [],
    },
  };
}

export default function ProductPage({ params }) {
  const product = getProductBySlug(params.handle);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.descriptionHtml.replace(/<[^>]+>/g, " ").trim(),
    brand: { "@type": "Brand", name: "Niv Création" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: getPriceFrom(product).toFixed(2),
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
    </>
  );
}
