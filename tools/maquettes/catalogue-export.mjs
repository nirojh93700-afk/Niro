// Exporte le catalogue du code (produits visibles) en JSON pour les maquettes.
// node --import ./tools/alias-register.mjs tools/maquettes/catalogue-export.mjs > sortie.json
import { products, CATEGORIES, SUBCATEGORIES } from "../../src/lib/products.js";
import { OCCASIONS } from "../../src/lib/occasions.js";
const out = products.filter((p) => !p.hidden).map((p) => {
  const prices = (p.variants || []).map((v) => v.price).filter((x) => typeof x === "number");
  const imgs = (p.images || []).map((i) => (typeof i === "string" ? i : i?.src || i?.url)).filter(Boolean);
  return { slug: p.slug, name: p.name, category: p.category, subcategory: p.subcategory || "", type: p.type || "",
    badge: p.badge || "", min: prices.length ? Math.min(...prices) : null, multi: new Set(prices).size > 1,
    occ: OCCASIONS.filter((o) => { try { return o.match(p); } catch { return false; } }).map((o) => o.slug),
    tagline: p.tagline || "", local: imgs.filter((s) => s.startsWith("/produits/")), img0: imgs[0] || "" };
});
console.log(JSON.stringify({ CATEGORIES, SUBCATEGORIES, products: out }, null, 1));
