import { setStock, isAdmin, getStockMap } from "@/lib/stock";
import { journaliser } from "@/lib/journal";

export const dynamic = "force-dynamic";

// Met à jour le stock d'une variante (réservé à l'admin).
export async function POST(req) {
  if (!(await isAdmin(req))) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!body?.variantId) {
    return Response.json({ error: "variantId manquant." }, { status: 400 });
  }
  const avant = (await getStockMap().catch(() => ({})))[body.variantId] ?? null;
  const map = await setStock(body.variantId, body.stock);
  const apres = map[body.variantId] ?? null;
  // Journal d'activité (08/11/2026).
  journaliser({ type: "stock", cible: body.variantId, label: `Stock ${body.variantId}`, avant, apres, source: "produits", retablir: { kind: "stock", variantId: body.variantId, valeur: avant } }).catch(() => {});
  return Response.json({ ok: true, stock: apres });
}
