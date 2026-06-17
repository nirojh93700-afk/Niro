import { isAdmin } from "@/lib/stock";
import { getAnalyticsSummary } from "@/lib/firebase";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Tableau de bord des visites (admin) : agrège les N derniers jours.
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get("days")) || 30));
  const data = await getAnalyticsSummary(days);
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
