import { isAdmin } from "@/lib/stock";
import { getAnalyticsSummary, getSiteOrders } from "@/lib/firebase";
import { ventesParJour } from "@/lib/statsVisites";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Tableau de bord des visites (admin) : agrège les N derniers jours.
export async function GET(req) {
  if (!(await isAdmin(req))) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get("days")) || 30));
  const data = await getAnalyticsSummary(days);
  // Ventes = les VRAIES commandes de la boutique (14/10/2026), pas les retours sur /merci.
  if (data?.series) {
    try {
      const orders = await getSiteOrders(1000);
      if (orders) {
        const vj = ventesParJour(orders, data.series.map((d) => d.date));
        for (const d of data.series) { d.ventes = vj[d.date]?.n || 0; d.ventesCA = vj[d.date]?.ca || 0; }
        data.totals.ventes = data.series.reduce((t, d) => t + d.ventes, 0);
        data.totals.ventesCA = Math.round(data.series.reduce((t, d) => t + d.ventesCA, 0) * 100) / 100;
        data.ventesReelles = true;
      }
    } catch { /* repli : les chiffres de /merci */ }
  }
  // Noms lisibles pour les produits (top produits).
  let names = {};
  try {
    const catalog = await getCatalog();
    for (const p of catalog) names[p.slug] = p.name;
  } catch {
    // si le catalogue n'est pas dispo, on affichera le slug
  }
  return Response.json({ data: data || null, names });
}
