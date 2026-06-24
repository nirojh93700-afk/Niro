// =============================================================================
// Catalogue "vivant" — fusionne les produits de base (products.js) avec les
// modifications et ajouts faits depuis l'admin (Netlify Blobs).
// Repli sûr : sans modification, on renvoie exactement les produits de base.
// (Server-only : utilise les Blobs.)
// =============================================================================
import { products as baseProducts } from "./products";
import { roundTo90 } from "./format";
import {
  getImageOverrides,
  getPromos,
  getProductOverrides,
  getCustomProducts,
  getSettings,
} from "./stock";

const EDITABLE = ["name", "tagline", "title", "descriptionHtml", "category", "subcategory", "type", "personalizationLabel", "model3d", "badge"];

function applyOverride(product, ov, images, promos) {
  const p = { ...product };
  if (ov) {
    for (const f of EDITABLE) {
      if (ov[f] !== undefined && ov[f] !== "") p[f] = ov[f];
    }
    if (ov.badge === "none") p.badge = ""; // "Aucun" choisi dans l'admin → retire le badge du catalogue
    if (ov.hidden !== undefined) p.hidden = Boolean(ov.hidden); // l'admin décide (publier/masquer) — prime TOUJOURS sur le code
    if (ov.preview) p.preview = ov.preview; // zone de gravure réglée dans l'admin
    // Liste de variantes modifiée dans l'admin (ajout/suppression d'options).
    if (Array.isArray(ov.variants) && ov.variants.length) {
      p.variants = ov.variants
        .filter((v) => v && v.id && v.title && typeof v.price === "number")
        .map((v) => ({ id: v.id, title: v.title, price: v.price, ...(v.stockId ? { stockId: v.stockId } : {}) }));
    }
    if (ov.prices) {
      p.variants = p.variants.map((v) =>
        typeof ov.prices[v.id] === "number" ? { ...v, price: ov.prices[v.id] } : v
      );
    }
  }
  // Photos ajoutées depuis l'admin (sauf si le produit verrouille ses images)
  if (!p.lockImages && images[p.slug]?.length) p.images = images[p.slug];
  // Prix promo (sur la 1re variante, pour l'affichage en vignette)
  const sale = promos[p.variants?.[0]?.id];
  if (typeof sale === "number") p.salePrice = sale;
  return p;
}

// Remise permanente −10 % sur les bijoux. Le prix d'origine (barré) est arrondi
// pour finir en ,90 ; la cliente paie 10 % de moins (badge −10 % pile).
// Ex. prix catalogue 24,90 € → barré 22,90 € → payé 20,61 €.
// Pour arrêter la remise, supprimer ce bloc et l'appel à applyBijouxSale ci-dessous.
const BIJOUX_SALE = 0.1; // 10 %
function applyBijouxSale(p) {
  if (p.category !== "bijoux" || !Array.isArray(p.variants)) return p;
  const variants = p.variants.map((v) => {
    const barre = roundTo90(v.price * (1 - BIJOUX_SALE)); // prix d'origine barré, fini en ,90
    const paid = Math.round(barre * (1 - BIJOUX_SALE) * 100) / 100; // −10 % appliqué
    return { ...v, price: paid, compareAt: barre };
  });
  // La remise −10 % remplace toute ancienne remise rapide (ex. −20 %) sur les bijoux.
  const { salePrice, ...rest } = p;
  return { ...rest, variants };
}

// Ensemble des ids de variantes "bijoux" (pour neutraliser toute ancienne remise
// rapide : la remise des bijoux est désormais la remise permanente ci-dessus).
async function getBijouxVariantIds() {
  const custom = await getCustomProducts().catch(() => []);
  const ids = new Set();
  for (const p of [...baseProducts, ...(custom || [])]) {
    if (p.category === "bijoux") for (const v of p.variants || []) ids.add(v.id);
  }
  return ids;
}

// Retire les promos (remise rapide) qui visent des variantes bijoux : sur les
// bijoux, seule la remise permanente −10 % s'applique.
export async function stripBijouxPromos(promos) {
  const ids = await getBijouxVariantIds();
  const out = {};
  for (const k of Object.keys(promos || {})) if (!ids.has(k)) out[k] = promos[k];
  return out;
}

// Renvoie TOUT le catalogue public fusionné (sans les produits masqués).
export async function getCatalog() {
  const [images, promos, overrides, custom, settings] = await Promise.all([
    getImageOverrides(),
    getPromos(),
    getProductOverrides(),
    getCustomProducts(),
    getSettings().catch(() => ({})),
  ]);
  const refMarkup = Number(settings?.refMarkup) || 0;
  const base = baseProducts.map((p) => applyBijouxSale(applyOverride(p, overrides[p.slug], images, promos)));
  const customApplied = (custom || []).map((p) => applyBijouxSale(applyOverride(p, overrides[p.slug], images, promos)));
  const all = [...base, ...customApplied].filter((p) => !p.hidden);
  return refMarkup > 0 ? all.map((p) => ({ ...p, refMarkup })) : all;
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
