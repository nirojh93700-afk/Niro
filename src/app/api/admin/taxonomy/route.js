import { isAdmin, getTaxonomy, saveTaxonomy } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const taxonomy = await getTaxonomy();
  return Response.json({ ok: true, taxonomy });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const action = body?.action;

  if (action === "save") {
    const t = body.taxonomy || {};
    // Nettoyage minimal : on ne garde que des entrées valides.
    const clean = {
      categories: Array.isArray(t.categories)
        ? t.categories.filter((c) => c && c.slug).map((c) => ({
            slug: String(c.slug),
            label: String(c.label || c.slug),
            short: String(c.short || c.label || c.slug),
          }))
        : undefined,
      subcategories: t.subcategories && typeof t.subcategories === "object"
        ? Object.fromEntries(
            Object.entries(t.subcategories).map(([cat, list]) => [
              cat,
              (Array.isArray(list) ? list : []).filter((s) => s && s.slug).map((s) => ({
                slug: String(s.slug),
                label: String(s.label || s.slug),
              })),
            ])
          )
        : undefined,
      productOrder: t.productOrder && typeof t.productOrder === "object" ? t.productOrder : undefined,
    };
    Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
    const saved = await saveTaxonomy(clean);
    return Response.json({ ok: true, taxonomy: saved });
  }

  if (action === "reset") {
    const saved = await saveTaxonomy({});
    return Response.json({ ok: true, taxonomy: saved });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
