import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { guidePourProduit } from "@/lib/guides";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import { getCatalogBySlug, getCatalog, getCatalogAdmin, priceFrom } from "@/lib/catalog";
import { getCategoryLabel } from "@/lib/products";

// Jeton d'aperçu privé : permet d'afficher une fiche d'un produit caché
// (non publié) via ?apercu=<JETON>, sans qu'il soit visible des clients.
const PREVIEW_TOKEN = "niv2026";
import { getReviews, getRatingSummaries, getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";
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
  return `/boutique/${cat}`;
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

  // --- Balisage produit pour Google ------------------------------------------
  // Google Search Console signalait « shippingDetails » et « hasMerchantReturnPolicy »
  // manquants (rapports « Extraits de produits » et « Fiches de marchand »).
  // On déclare EXACTEMENT ce qui est déjà publié sur le site :
  //  · livraison France, offerte dès le seuil bijoux (page Livraison / FAQ) ;
  //  · retours : produit PERSONNALISÉ = non remboursable (art. L221-28, page
  //    Retours) ; produit sans personnalisation = 14 jours, retour à la charge
  //    du client. Rien n'est promis de plus que les CGV.
  const shipCfg = resolveShippingConfig((await getSettings().catch(() => ({})))?.shipping);
  const livraisonFr = {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: product.letter ? shipCfg.bijouxHome : 0,
      currency: "EUR",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "FR" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      // Fabrication à la commande (3 à 5 jours ouvrés, cf. FAQ) puis transport.
      handlingTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
    },
  };
  const retour = product.personalizable
    ? {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "FR",
        // Bien confectionné selon les spécifications du client : pas de rétractation.
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      }
    : {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "FR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: (product.descriptionHtml || "").replace(/<[^>]+>/g, " ").trim(),
    brand: { "@type": "Brand", name: "Niv Création" },
    sku: product.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: priceFrom(product).toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `https://nivcreation.fr/produit/${product.slug}`,
      shippingDetails: livraisonFr,
      hasMerchantReturnPolicy: retour,
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

  const guide = guidePourProduit(product);

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
      {guide && (
        <div className="guide-lien-fiche">
          <div className="container">
            <span>Vous hésitez&nbsp;?</span>{" "}
            <a href={`/idees/${guide.slug}`}>{guide.h1} — nos conseils</a>
          </div>
        </div>
      )}
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
