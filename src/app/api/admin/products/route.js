import { getStockMap, getImageOverrides, getPromos, isAdmin } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Liste tous les produits + variantes + stock + photos + promos (admin).
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const map = await getStockMap();
  const overrides = await getImageOverrides();
  const promos = await getPromos();
  const products = await getCatalogAdmin();
  const rows = [];
  const catalog = [];
  const editable = [];
  for (const p of products) {
    editable.push({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline || "",
      descriptionHtml: p.descriptionHtml || "",
      category: p.category,
      subcategory: p.subcategory || "",
      hidden: Boolean(p.hidden),
      badge: p.badge || "",
      custom: Boolean(p.custom),
      image: p.images?.[0] || "",
      images: p.images || [],
      overrideImages: overrides[p.slug] || [],
      model3d: p.model3d || "",
      preview: p.preview || null,
      personalizationFields: p.personalizationFields || [],
      engravingPricing: p.engravingPricing || null,
      variants: (p.variants || []).map((v) => ({ id: v.id, title: v.title, price: v.price })),
    });
    catalog.push({
      slug: p.slug,
      name: p.name,
      category: p.category,
      model3d: p.model3d || "",
      baseImages: p.images || [],
      overrideImages: overrides[p.slug] || [],
    });
    for (const v of p.variants) {
      const sk = v.stockId || v.id; // stock partagé par couleur (recto/recto-verso)
      rows.push({
        productSlug: p.slug,
        productName: p.name,
        category: p.category,
        variantId: v.id,
        stockId: sk,
        variantTitle: v.title,
        price: v.price,
        salePrice: typeof promos[v.id] === "number" ? promos[v.id] : null,
        stock: typeof map[sk] === "number" ? map[sk] : null,
      });
    }
  }

  // Options suivies en stock (ex. socle lumineux LED) : ce sont de vrais articles
  // achetés en quantité limitée, mais vendus comme une OPTION et non comme une
  // variante — sans cette ligne, elles n'apparaîtraient nulle part dans le stock.
  const extrasVus = new Set();
  for (const p of products) {
    for (const e of p.engravingPricing?.flatExtras || []) {
      const ids = [e.stockId, ...Object.values(e.stockIdByVariant || {})].filter(Boolean);
      for (const sid of ids) {
        if (extrasVus.has(sid)) continue; // stock commun à plusieurs produits
        extrasVus.add(sid);
        rows.push({
          productSlug: p.slug,
          productName: "Options (accessoires)",
          category: p.category,
          variantId: sid,
          stockId: sid,
          variantTitle: sid === "socle-led-carre" ? "Socle LED — petit (carré)"
            : sid === "socle-led-rectangle" ? "Socle LED — grand (rectangle)"
            : sid,
          price: null,
          salePrice: null,
          stock: typeof map[sid] === "number" ? map[sid] : null,
          isOption: true,
        });
      }
    }
  }
  return Response.json({ rows, catalog, editable });
}
