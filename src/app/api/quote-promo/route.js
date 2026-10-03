import { getQuote } from "@/lib/firebase";
import { verifierCodeDevis } from "@/lib/promoDevis";

export const dynamic = "force-dynamic";

// Vérifie un code promo sur un devis (public, comme /api/promo-validate) et renvoie la
// remise réelle + le nouveau total. Rien n'est enregistré ici : le code n'est consommé
// qu'au paiement (webhook Stripe).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ valid: false }); }
  const q = body?.id ? await getQuote(body.id) : null;
  if (!q || q.type === "facture" || q.status === "paye") return Response.json({ valid: false });
  const email = String(body?.email || q.client?.email || "");
  const r = await verifierCodeDevis(body?.code, email, q.items);
  if (!r.valid) return Response.json(r);
  return Response.json({ ...r, total: Math.round((q.total - r.remise) * 100) / 100 });
}
