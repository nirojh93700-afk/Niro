import { getReviews, addReview } from "@/lib/stock";
import { emailOrderedProduct } from "@/lib/firebase";

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
// Réservé aux vraies acheteuses (27/09/2026, demande du gérant « comme
// Amazon/Etsy ») : l'e-mail donné doit correspondre à une commande contenant
// CE produit. L'e-mail n'est jamais renvoyé publiquement (voir /api/reviews GET).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { slug, name, rating, text, photo, email } = body || {};
  if (!slug || !text || String(text).trim().length < 2) {
    return Response.json({ error: "Avis incomplet." }, { status: 400 });
  }
  const e = String(email || "").trim();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return Response.json({ error: "Merci d'indiquer l'e-mail utilisé pour votre commande." }, { status: 400 });
  }
  const bought = await emailOrderedProduct(e, slug);
  if (!bought) {
    return Response.json({ error: "Cet e-mail ne correspond à aucune commande de ce produit — seules les clientes ayant acheté peuvent laisser un avis." }, { status: 403 });
  }
  await addReview(slug, { name, rating, text, photo, email: e });
  return Response.json({ ok: true });
}
