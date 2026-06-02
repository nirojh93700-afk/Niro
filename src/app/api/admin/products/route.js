import { products } from "@/lib/products";
import { getStockMap, getImageOverrides, isAdmin } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Liste tous les produits + variantes + stock + photos (réservé à l'admin).
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const map = await getStockMap();
  const overrides = await getImageOverrides();
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
        stock: typeof map[v.id] === "number" ? map[v.id] : null,
      });
    }
  }
  return Response.json({ rows, catalog });
}
