import { setProductImages, isAdmin } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Définit les photos d'un produit (réservé à l'admin).
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
  if (!body?.slug) {
    return Response.json({ error: "slug manquant." }, { status: 400 });
  }
  const images = Array.isArray(body.images) ? body.images : [];
  const map = await setProductImages(body.slug, images);
  return Response.json({ ok: true, images: map[body.slug] || [] });
}
