import { getReviews, addReview } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Avis approuvés d'un produit (public).
export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return Response.json({ reviews: [], average: 0, count: 0 });
  const all = await getReviews();
  const approved = (all[slug] || []).filter((r) => r.approved);
  const count = approved.length;
  const average = count ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return Response.json({
    reviews: approved.map((r) => ({ name: r.name, rating: r.rating, text: r.text, photo: r.photo || "", date: r.date })),
    average,
    count,
  });
}

// Dépôt d'un avis par une cliente (en attente de validation).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { slug, name, rating, text, photo } = body || {};
  if (!slug || !text || String(text).trim().length < 2) {
    return Response.json({ error: "Avis incomplet." }, { status: 400 });
  }
  await addReview(slug, { name, rating, text, photo });
  return Response.json({ ok: true });
}
