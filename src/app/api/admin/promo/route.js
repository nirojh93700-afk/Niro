import { setPromo, isAdmin } from "@/lib/stock";
import { getCatalogAdmin } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Définit (ou retire) le prix promo d'une variante, ou applique une remise
// en lot sur toute une catégorie (réservé à l'admin).
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

  // Remise en lot sur une catégorie : { action:"bulk", category, percent }
  if (body?.action === "bulk") {
    const percent = Number(body.percent);
    if (!body.category || !Number.isFinite(percent) || percent < 0 || percent > 90) {
      return Response.json({ error: "Paramètres invalides." }, { status: 400 });
    }
    const products = await getCatalogAdmin();
    let count = 0;
    for (const p of products) {
      if (p.category !== body.category) continue;
      for (const v of p.variants || []) {
        const sale = percent > 0 ? Math.round(v.price * (1 - percent / 100) * 100) / 100 : null;
        await setPromo(v.id, sale);
        count++;
      }
    }
    return Response.json({ ok: true, count });
  }

  if (!body?.variantId) {
    return Response.json({ error: "variantId manquant." }, { status: 400 });
  }
  const promos = await setPromo(body.variantId, body.salePrice);
  return Response.json({ ok: true, salePrice: promos[body.variantId] ?? null });
}
