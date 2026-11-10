import Stripe from "stripe";
import { isAdmin, reverseCagnotteForOrder, reduireCashbackRemboursementPartiel } from "@/lib/stock";
import { getSiteOrder, updateSiteOrderStatus, updateSiteOrder } from "@/lib/firebase";

// Remboursement d'une commande (réservé à l'admin) : TOTAL, ou PARTIEL avec `amount` en euros
// (10/11/2026). Partiel = la commande garde son statut, le montant rendu est noté sur la commande
// (`rembourse`, `remboursements`) et le cashback gagné baisse dans la même proportion.
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await isAdmin(req))) {
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

  const total = Math.round((Number(order.total) || 0) * 100) / 100;
  const deja = Math.round((Number(order.rembourse) || 0) * 100) / 100;
  const reste = Math.round((total - deja) * 100) / 100;
  const demande = body?.amount != null && body.amount !== "" ? Math.round(Number(String(body.amount).replace(",", ".")) * 100) / 100 : null;
  if (demande != null && !(demande > 0)) return Response.json({ error: "Montant invalide." }, { status: 400 });
  if (demande != null && demande > reste + 0.001) return Response.json({ error: `Montant trop élevé : il reste ${reste.toFixed(2).replace(".", ",")} € remboursables.` }, { status: 400 });

  // Remboursement PARTIEL (montant inférieur à ce qui reste) : la commande reste dans son statut.
  if (demande != null && demande < reste - 0.001) {
    try {
      const stripe = new Stripe(secret);
      const r = await stripe.refunds.create({ payment_intent: pi, amount: Math.round(demande * 100) });
      const rembourse = Math.round((deja + demande) * 100) / 100;
      const remboursements = [...(Array.isArray(order.remboursements) ? order.remboursements : []), { montant: demande, at: Date.now(), stripeId: r.id }];
      await updateSiteOrder(id, { rembourse, remboursements });
      let cagnotte = null;
      try { cagnotte = await reduireCashbackRemboursementPartiel(order, demande, r.id); } catch { /* l'argent est déjà rendu */ }
      return Response.json({ ok: true, partiel: true, montant: demande, rembourse, cagnotte });
    } catch (e) {
      console.error("Remboursement partiel Stripe:", e.message);
      return Response.json({ error: e.message || "Échec du remboursement." }, { status: 500 });
    }
  }

  try {
    const stripe = new Stripe(secret);
    // Total (ou le reste après un remboursement partiel) : Stripe rend tout ce qui n'a pas encore été rendu.
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
