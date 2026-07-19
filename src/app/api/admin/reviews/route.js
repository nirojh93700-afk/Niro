import { isAdmin, getReviews, moderateReview, addReview, dedupeReviews } from "@/lib/stock";

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

// Approuver / supprimer / ajouter un avis, ou nettoyer les doublons.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { slug, id, action } = body || {};

  // Nettoyage : retire les avis en double (même produit + nom + texte).
  if (action === "dedupe") {
    const removed = await dedupeReviews();
    return Response.json({ ok: true, removed });
  }

  // Ajout manuel par la gérante (avis reçu ailleurs : Instagram, WhatsApp, e-mail…)
  // → publié directement (pas besoin de re-valider son propre ajout).
  if (action === "add") {
    const text = String(body.text || "").trim();
    if (!slug || text.length < 2) {
      return Response.json({ error: "Produit et texte de l'avis obligatoires." }, { status: 400 });
    }
    const added = await addReview(
      slug,
      { name: body.name, rating: body.rating, text, photo: body.photo, date: body.date },
      { approved: true }
    );
    if (!added) return Response.json({ error: "Cet avis existe déjà (doublon)." }, { status: 409 });
    return Response.json({ ok: true });
  }

  if (!slug || !id || !["approve", "delete"].includes(action)) {
    return Response.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  await moderateReview(slug, id, action);
  return Response.json({ ok: true });
}
