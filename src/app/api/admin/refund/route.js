import Stripe from "stripe";
import { isAdmin, reverseCagnotteForOrder } from "@/lib/stock";
import { getSiteOrder, updateSiteOrderStatus } from "@/lib/firebase";

// Remboursement TOTAL d'une commande (réservé à l'admin).
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: "Stripe n'est pas configuré." }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const id = String(body?.id || "");
  if (!id) {
    return Response.json({ error: "Commande manquante." }, { status: 400 });
  }

  const order = await getSiteOrder(id);
  if (!order) {
    return Response.json({ error: "Commande introuvable." }, { status: 404 });
  }
  if (order.status === "remboursee") {
    return Response.json({ error: "Cette commande est déjà remboursée." }, { status: 400 });
  }
  const pi = order.paymentIntentId;
  if (!pi) {
    return Response.json(
      { error: "Commande trop ancienne (sans identifiant de paiement). Rembourse-la depuis Stripe." },
      { status: 400 }
    );
  }

  try {
    const stripe = new Stripe(secret);
    await stripe.refunds.create({ payment_intent: pi });
    await updateSiteOrderStatus(id, "remboursee");
    // La cagnotte suit la commande : on retire le cashback gagné et on rend
    // celle qui avait été dépensée. Ne bloque jamais le remboursement.
    let cagnotte = null;
    try { cagnotte = await reverseCagnotteForOrder(order); } catch { /* l'argent est déjà rendu */ }
    return Response.json({ ok: true, cagnotte });
  } catch (e) {
    console.error("Remboursement Stripe:", e.message);
    return Response.json({ error: e.message || "Échec du remboursement." }, { status: 500 });
  }
}
