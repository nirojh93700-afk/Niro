// Exporte le catalogue du code (produits visibles) en JSON pour les maquettes — lecture seule, rien n'est modifié.
// node --import ./tools/alias-register.mjs tools/maquettes/catalogue-export.mjs > sortie.json
// Champs : prix de la 1re variante (`first`, celui de la vignette du site), mini/maxi, `perso` (personnalisable),
// `badge` « Nouveau » éteint à 30 jours comme sur le site (estRecent), occasions (occasions.js), photos.
import { products, CATEGORIES, SUBCATEGORIES } from "../../src/lib/products.js";
import { OCCASIONS } from "../../src/lib/occasions.js";
import { estRecent, PRODUCT_DATES } from "../../src/lib/productDates.js";
const out = products.filter((p) => !p.hidden).map((p) => {
  const prices = (p.variants || []).map((v) => v.price).filter((x) => typeof x === "number");
  const imgs = (p.images || []).map((i) => (typeof i === "string" ? i : i?.src || i?.url)).filter(Boolean);
  const first = (p.variants || []).map((v) => v.price).find((x) => typeof x === "number");
  return { slug: p.slug, name: p.name, category: p.category, subcategory: p.subcategory || "", type: p.type || "",
    badge: p.badge === "Nouveau" && !estRecent(p.slug) ? "" : (p.badge || ""),
    min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null,
    first: typeof first === "number" ? first : (prices.length ? Math.min(...prices) : null),
    multi: new Set(prices).size > 1, perso: !!p.personalizable,
    occ: OCCASIONS.filter((o) => { try { return o.match(p); } catch { return false; } }).map((o) => o.slug),
    date: PRODUCT_DATES[p.slug] || "", tagline: p.tagline || "", local: imgs.filter((s) => s.startsWith("/produits/")), img0: imgs[0] || "" };
});
console.log(JSON.stringify({ CATEGORIES, SUBCATEGORIES, products: out }, null, 1));
