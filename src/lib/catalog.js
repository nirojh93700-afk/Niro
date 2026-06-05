// =============================================================================
// Catalogue "vivant" — fusionne les produits de base (products.js) avec les
// modifications et ajouts faits depuis l'admin (Netlify Blobs).
// Repli sûr : sans modification, on renvoie exactement les produits de base.
// (Server-only : utilise les Blobs.)
// =============================================================================
import { products as baseProducts } from "./products";
import {
  getImageOverrides,
  getPromos,
  getProductOverrides,
  getCustomProducts,
} from "./stock";

const EDITABLE = ["name", "tagline", "title", "descriptionHtml", "category", "subcategory", "type", "personalizationLabel", "model3d"];

function applyOverride(product, ov, images, promos) {
  const p = { ...product };
  if (ov) {
    for (const f of EDITABLE) {
      if (ov[f] !== undefined && ov[f] !== "") p[f] = ov[f];
    }
    if (ov.hidden) p.hidden = true;
    if (ov.preview) p.preview = ov.preview; // zone de gravure réglée dans l'admin
    if (ov.prices) {
      p.variants = p.variants.map((v) =>
        typeof ov.prices[v.id] === "number" ? { ...v, price: ov.prices[v.id] } : v
      );
    }
  }
  // Photos ajoutées depuis l'admin
  if (images[p.slug]?.length) p.images = images[p.slug];
  // Prix promo (sur la 1re variante, pour l'affichage en vignette)
  const sale = promos[p.variants?.[0]?.id];
  if (typeof sale === "number") p.salePrice = sale;
  return p;
}

// Renvoie TOUT le catalogue public fusionné (sans les produits masqués).
export async function getCatalog() {
  const [images, promos, overrides, custom] = await Promise.all([
    getImageOverrides(),
    getPromos(),
    getProductOverrides(),
    getCustomProducts(),
  ]);
  const base = baseProducts.map((p) => applyOverride(p, overrides[p.slug], images, promos));
  const customApplied = (custom || []).map((p) => applyOverride(p, overrides[p.slug], images, promos));
  return [...base, ...customApplied].filter((p) => !p.hidden);
}

// Renvoie aussi les produits masqués (pour l'admin).
export async function getCatalogAdmin() {
  const [images, promos, overrides, custom] = await Promise.all([
    getImageOverrides(),
    getPromos(),
    getProductOverrides(),
    getCustomProducts(),
  ]);
  const base = baseProducts.map((p) => ({ ...applyOverride(p, overrides[p.slug], images, promos), custom: false }));
  const customApplied = (custom || []).map((p) => ({ ...applyOverride(p, overrides[p.slug], images, promos), custom: true }));
  return [...base, ...customApplied];
}

export async function getCatalogBySlug(slug) {
  const all = await getCatalog();
  return all.find((p) => p.slug === slug) || null;
}

export function priceFrom(product) {
  if (!product?.variants?.length) return 0;
  return Math.min(...product.variants.map((v) => v.price));
}
