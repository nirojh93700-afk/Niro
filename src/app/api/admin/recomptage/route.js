import { isAdmin, getStockMap, getMateriel } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { listeRecomptage } from "@/lib/recomptage";

export const dynamic = "force-dynamic";

// Lecture seule : ce qui s'est vendu depuis le début, par ligne de stock (les corrections passent par /api/admin/stock).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const [orders, stock, products] = await Promise.all([
    getSiteOrders(3000).catch(() => []),
    getStockMap(true).catch(() => ({})),
    getCatalogAdmin().catch(() => []),
  ]);
  const rows = []; const vus = new Set();
  for (const p of products || []) {
    for (const v of p.variants || []) {
      const id = v.stockId || v.id;
      if (!id || vus.has(id)) continue; vus.add(id);
      rows.push({ stockId: id, product: p.name, variant: v.title || "" });
    }
    for (const e of p.engravingPricing?.flatExtras || []) {
      for (const id of [e.stockId, ...Object.values(e.stockIdByVariant || {})].filter(Boolean)) {
        if (vus.has(id)) continue; vus.add(id);
        rows.push({ stockId: id, product: p.name, variant: `Option : ${e.label || e.key || id}` });
      }
    }
  }
  const lignes = listeRecomptage({ orders: orders || [], stock: stock || {}, rows });
  const reelles = (orders || []).filter((o) => o && !o.test);
  const sansListe = reelles.filter((o) => !o.stock).length;
  return Response.json({ lignes, commandes: reelles.length, sansListe });
}
