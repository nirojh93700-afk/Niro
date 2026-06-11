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
      rows.push({
        productSlug: p.slug,
        productName: p.name,
        category: p.category,
        variantId: v.id,
        variantTitle: v.title,
        price: v.price,
        salePrice: typeof promos[v.id] === "number" ? promos[v.id] : null,
        stock: typeof map[v.id] === "number" ? map[v.id] : null,
      });
    }
  }
  return Response.json({ rows, catalog, editable });
}
