// =============================================================================
// Taxonomie « vivante » — fusionne la taxonomie du code (products.js) avec les
// réglages faits depuis l'admin (catégories, sous-catégories, ordre des produits).
// Fonctions PURES (utilisables côté client ET serveur) : on leur passe l'objet
// `taxonomy` stocké (ou {}). Repli sûr : sans réglage, on renvoie le code.
// =============================================================================
import { CATEGORIES as DEF_CATEGORIES, SUBCATEGORIES as DEF_SUBCATEGORIES } from "./products";

// Liste ordonnée des catégories (familles). Repli : CATEGORIES du code.
export function resolveCategories(stored) {
  const arr = stored?.categories;
  if (Array.isArray(arr) && arr.length) {
    const resolved = arr
      .filter((c) => c && c.slug)
      .map((c) => ({ slug: c.slug, label: c.label || c.slug, short: c.short || c.label || c.slug }));
    // Ajoute automatiquement les catégories du code absentes du réglage admin
    // (nouvelles familles comme « naissance ») → elles apparaissent dans le menu
    // sans avoir à les recréer à la main dans Gestion → Catégories.
    const have = new Set(resolved.map((c) => c.slug));
    for (const c of DEF_CATEGORIES) if (!have.has(c.slug)) resolved.push(c);
    return resolved;
  }
  return DEF_CATEGORIES;
}

// Sous-catégories par catégorie. On part du code, et on remplace par catégorie
// si l'admin en a défini.
export function resolveSubcategories(stored) {
  const out = { ...DEF_SUBCATEGORIES };
  const s = stored?.subcategories;
  if (s && typeof s === "object") {
    for (const cat of Object.keys(s)) {
      if (Array.isArray(s[cat])) {
        out[cat] = s[cat].filter((x) => x && x.slug).map((x) => ({ slug: x.slug, label: x.label || x.slug }));
      }
    }
  }
  return out;
}

// Ordre manuel des produits par catégorie : { cat: [slug, slug, ...] }.
export function resolveProductOrder(stored) {
  return stored && stored.productOrder && typeof stored.productOrder === "object" ? stored.productOrder : {};
}

export function categoryLabelFrom(categories, slug) {
  return categories.find((c) => c.slug === slug)?.label || slug;
}

export function subcategoryLabelFrom(subs, catSlug, subSlug) {
  return (subs[catSlug] || []).find((s) => s.slug === subSlug)?.label || subSlug;
}

// Comparateur d'ordre des produits dans une catégorie :
// 1) ordre manuel (productOrder) si défini, 2) sinon ordre des sous-catégories,
// 3) sinon ordre d'origine (tri stable).
export function makeProductSorter(catSlug, subs, productOrder) {
  const manual = Array.isArray(productOrder?.[catSlug]) ? productOrder[catSlug] : null;
  const subOrder = (subs[catSlug] || []).map((s) => s.slug);
  const manualRank = (p) => {
    if (!manual) return null;
    const i = manual.indexOf(p.slug);
    return i < 0 ? 9999 : i;
  };
  const subRank = (p) => {
    const i = subOrder.indexOf(p.subcategory);
    return i < 0 ? 999 : i;
  };
  return (a, b) => {
    if (manual) {
      const d = manualRank(a) - manualRank(b);
      if (d !== 0) return d;
    }
    return subRank(a) - subRank(b);
  };
}
