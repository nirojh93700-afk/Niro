import { getReviews, addReview } from "@/lib/stock";
import { emailOrderedProduct, emailACommande } from "@/lib/firebase";

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

// Dépôt d'un avis (en attente de validation par le gérant dans Gestion → Avis).
// 27/10/2026 (gérant : « il faut que tout le monde puisse noter, c'est moi qui valide ») :
// plus de refus si l'adresse n'a pas acheté CE produit (les clientes sur devis étaient
// refusées). L'avis est seulement marqué pour aider à valider : « produit » = a commandé
// ce produit sur la boutique, « client » = a une commande chez nous (devis compris),
// « non » = aucune commande trouvée. L'e-mail n'est jamais renvoyé publiquement.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { slug, name, rating, text, photo, email } = body || {};
  if (!slug || !text || String(text).trim().length < 2) {
    return Response.json({ error: "Avis incomplet." }, { status: 400 });
  }
  const e = String(email || "").trim();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return Response.json({ error: "Merci d'indiquer votre e-mail." }, { status: 400 });
  }
  let verifie = "non";
  try {
    if (await emailOrderedProduct(e, slug)) verifie = "produit";
    else if (await emailACommande(e)) verifie = "client";
  } catch { verifie = "non"; }
  await addReview(slug, { name, rating, text, photo, email: e, verifie });
  return Response.json({ ok: true });
}
