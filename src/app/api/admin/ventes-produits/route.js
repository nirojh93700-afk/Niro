// Gestion → Finances → Ventes → « Ventes par produit » (25/11/2026, maquette https://claude.ai/artifact/JNfZA75BXSsnLUiujb2oen).
// GET (admin, lecture seule) → une ligne par article vendu (commandes payées, hors tests / annulées / remboursées),
// avec sa variante exacte, le prix payé, les options, la remise et le coût d'achat. Le regroupement se fait à l'écran.
import { isAdmin } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { detaillerCommande } from "@/lib/detailProduit";
import { ventesDesCommandes } from "@/lib/ventesProduits";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ ok: false, error: "Accès refusé." }, { status: 401 });
  const [orders, catalog] = await Promise.all([
    getSiteOrders(2000).catch(() => null),
    getCatalogAdmin().catch(() => []),
  ]);
  if (!orders) return Response.json({ ok: false, error: "Commandes illisibles pour le moment." }, { status: 503 });
  const bySlug = Object.fromEntries((catalog || []).map((p) => [p.slug, p]));
  const detaillees = orders.map((o) => { try { return detaillerCommande(o); } catch { return o; } });
  const ventes = ventesDesCommandes(detaillees, bySlug).map(({ details, statut, orderId, image, ...v }) => ({ ...v, id: orderId }));
  return Response.json({ ok: true, ventes, commandesLues: orders.length, at: new Date().toISOString() });
}
