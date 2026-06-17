import { recordAnalyticsEvent } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Réception des événements du compteur intégré (visites, vues produit, panier…).
// Public, mais n'accepte qu'une liste fermée d'événements et ne stocke aucune
// donnée personnelle. Répond toujours 200 (ne casse jamais le site).
const ALLOWED = new Set(["session", "pageview", "view_item", "add_to_cart", "begin_checkout", "purchase"]);

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false });
  }
  const event = body?.event;
  if (!ALLOWED.has(event)) return Response.json({ ok: false });
  try {
    await recordAnalyticsEvent(event, { slug: body.slug, value: body.value });
  } catch {
    // ignore : les statistiques ne doivent jamais bloquer un achat
  }
  return Response.json({ ok: true });
}
