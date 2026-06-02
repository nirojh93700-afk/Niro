import { setPromo, isAdmin } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Définit (ou retire) le prix promo d'une variante (réservé à l'admin).
export async function POST(req) {
  if (!isAdmin(req)) {
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
  const promos = await setPromo(body.variantId, body.salePrice);
  return Response.json({ ok: true, salePrice: promos[body.variantId] ?? null });
}
