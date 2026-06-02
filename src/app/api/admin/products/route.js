import { products } from "@/lib/products";
import { getStockMap, getImageOverrides, getPromos, isAdmin } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Liste tous les produits + variantes + stock + photos + promos (admin).
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const map = await getStockMap();
  const overrides = await getImageOverrides();
  const promos = await getPromos();
  const rows = [];
  const catalog = [];
  for (const p of products) {
    catalog.push({
      slug: p.slug,
      name: p.name,
      category: p.category,
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
  return Response.json({ rows, catalog });
}
