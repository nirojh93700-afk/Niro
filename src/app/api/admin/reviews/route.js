import { isAdmin, getReviews, moderateReview } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Tous les avis (admin) — pour modération.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const all = await getReviews();
  const flat = [];
  for (const [slug, list] of Object.entries(all)) {
    for (const r of list) flat.push({ slug, ...r });
  }
  flat.sort((a, b) => (a.approved === b.approved ? 0 : a.approved ? 1 : -1) || (b.date || "").localeCompare(a.date || ""));
  return Response.json({ reviews: flat });
}

// Approuver / supprimer un avis.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { slug, id, action } = body || {};
  if (!slug || !id || !["approve", "delete"].includes(action)) {
    return Response.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  await moderateReview(slug, id, action);
  return Response.json({ ok: true });
}
