import { isAdmin, getSettings, logOrderEmail, reverseCagnotteForOrder } from "@/lib/stock";
import { getSiteOrders, updateSiteOrder, deleteSiteOrder, getSiteOrder } from "@/lib/firebase";
import { shippedEmail, cancelledEmail, reviewRequestEmail, BRAND } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";

export const dynamic = "force-dynamic";

// Liste des commandes du site (réservé à l'admin).
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const orders = await getSiteOrders(300);
  if (orders === null) {
    return Response.json({ orders: [], firebase: false });
  }
  return Response.json({ orders, firebase: true });
}

// Met à jour le statut d'une commande (à préparer / expédiée).
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
  const { id, status, tracking, notifyCustomer } = body || {};

  // Marquer / démarquer une commande comme "test" (exclue des statistiques).
  if (id && typeof body?.test === "boolean") {
    const ok = await updateSiteOrder(id, { test: body.test });
    return Response.json({ ok });
  }

  // Envoyer MAINTENANT la demande d'avis au client (bouton admin, à la demande).
  // Utilise le même e-mail (avec lien direct vers la fiche produit #avis) que la
  // règle automatique, mais immédiatement.
  if (id && body?.action === "review") {
    const order = await getSiteOrder(id);
    if (!order?.customerEmail) return Response.json({ ok: false, error: "Cette commande n'a pas d'e-mail client." }, { status: 400 });
    const mail = reviewRequestEmail(order);
    const r = await sendClientMail({ to: order.customerEmail, subject: mail.subject, html: mail.html, bcc: BRAND.contact });
    if (r?.ok) {
      try { await logOrderEmail(id, { subject: mail.subject, customerEmail: order.customerEmail, customerName: order.customerName, ref: order.ref }); } catch { /* le journal ne bloque jamais */ }
    }
    return Response.json({ ok: Boolean(r?.ok), emailed: Boolean(r?.ok), error: r?.error });
  }

  // Compléter une commande DÉJÀ passée avec le détail du prix (sous-total avant
  // remise, remise, code promo, photos des articles) en le relisant chez Stripe.
  // Sert aux commandes enregistrées AVANT l'amélioration « Détail du prix » —
  // les nouvelles commandes ont déjà tout dès le paiement.
  // Diagnostic LECTURE SEULE : vérifie chez Stripe combien de fois un paiement
  // a réellement été prélevé (charges), pour distinguer un doublon de COMMANDE
  // (bug d'enregistrement, argent prélevé une fois) d'un doublon de PAIEMENT
  // (deux prélèvements réels — beaucoup plus grave). Ajouté 01/09/2026.
  if (id && body?.action === "checkPayment") {
    const order = await getSiteOrder(id);
    if (!order?.paymentIntentId) return Response.json({ ok: false, error: "Commande sans identifiant de paiement." }, { status: 400 });
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return Response.json({ ok: false, error: "Clé Stripe absente." }, { status: 500 });
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(secret);
      const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId, { expand: ["charges"] });
      const charges = (pi.charges?.data || pi.latest_charge ? [pi.latest_charge].filter(Boolean) : []);
      return Response.json({
        ok: true,
        paymentIntentId: pi.id,
        status: pi.status,
        amount: (pi.amount || 0) / 100,
        amountReceived: (pi.amount_received || 0) / 100,
        nbCharges: pi.charges?.data?.length ?? (pi.latest_charge ? 1 : 0),
        charges: (pi.charges?.data || []).map((c) => ({ id: c.id, amount: (c.amount || 0) / 100, paid: c.paid, refunded: c.refunded, created: c.created })),
      });
    } catch (e) {
      return Response.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  if (id && body?.action === "syncPricing") {
    const order = await getSiteOrder(id);
    if (!order?.sessionId) return Response.json({ ok: false, error: "Commande sans référence de paiement." }, { status: 400 });
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return Response.json({ ok: false, error: "Clé Stripe absente." }, { status: 500 });
    try {
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(secret);
      const session = await stripe.checkout.sessions.retrieve(order.sessionId, {
        expand: ["line_items.data.price.product"],
      });
      const patch = {
        subtotal: (session.amount_subtotal || 0) / 100,
        discount: (session.total_details?.amount_discount || 0) / 100,
        promoCode: order.promoCode || session.metadata?.promoCode || "",
        cagnotteUsed: Number(order.cagnotteUsed || session.metadata?.cagnotteAmount || 0) || 0,
        items: (session.line_items?.data || []).map((li, i) => ({
          ...(order.items?.[i] || {}),
          name: li.price?.product?.name || li.description || order.items?.[i]?.name || "",
          image: (li.price?.product?.images || [])[0] || order.items?.[i]?.image || "",
          quantity: li.quantity,
          unitPrice: (li.price?.unit_amount || 0) / 100,
          subtotal: (li.amount_subtotal || 0) / 100,
          total: (li.amount_total || 0) / 100,
        })),
      };
      const ok = await updateSiteOrder(id, patch);
      return Response.json({ ok, patch: { subtotal: patch.subtotal, discount: patch.discount, promoCode: patch.promoCode } });
    } catch (e) {
      return Response.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  if (!id || !["a_preparer", "en_gravure", "expediee", "livree", "annulee", "remise_main_propre"].includes(status)) {
    return Response.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  const patch = { status };
  if (typeof tracking === "string") patch.tracking = tracking.trim();
  // Horodatage du changement de statut (sert aux règles auto « X jours après
  // expédition/livraison »). Chaîne ISO, comme createdAt.
  const nowIso = new Date().toISOString();
  if (status === "expediee") patch.shippedAt = nowIso;
  if (status === "livree") patch.deliveredAt = nowIso;
  // Remise en main propre = la commande a été remise en personne (déco/mariage).
  // On horodate remisAt ET deliveredAt (elle est "reçue") pour les règles auto.
  if (status === "remise_main_propre") { patch.remisAt = nowIso; patch.deliveredAt = nowIso; }
  const ok = await updateSiteOrder(id, patch);

  // Commande annulée : la cagnotte suit. On retire le cashback gagné sur cette
  // commande et on restitue celle que la cliente avait dépensée dessus.
  if (ok && status === "annulee") {
    try {
      const o = await getSiteOrder(id);
      if (o) await reverseCagnotteForOrder(o);
    } catch { /* l'annulation reste valable même si l'ajustement échoue */ }
  }

  // E-mail au client (expédition avec suivi, ou annulation), si demandé et possible.
  let emailed = false;
  if (ok && notifyCustomer) {
    const order = await getSiteOrder(id);
    if (order?.customerEmail) {
      let mail = null;
      if (status === "expediee" && patch.tracking) mail = shippedEmail(order, patch.tracking);
      else if (status === "annulee") mail = cancelledEmail(order);
      else if (status === "livree") {
        // Si une règle automatique « après la livraison » est active (ex. avis à
        // J+2), elle enverra l'e-mail d'avis au bon moment → on n'envoie PAS
        // l'e-mail immédiat ici, pour éviter un doublon. Sinon, envoi immédiat.
        let hasLivreeRule = false;
        try {
          const st = await getSettings();
          hasLivreeRule = (st?.autoRules || []).some((r) => r.active && r.trigger === "livree" && r.body);
        } catch { /* en cas de doute, on envoie l'e-mail immédiat */ }
        if (!hasLivreeRule) mail = reviewRequestEmail(order);
      }
      if (mail) {
        // Gmail en priorité (arrive vers toute adresse), Resend en secours ; copie à la gérante.
        const r = await sendClientMail({ to: order.customerEmail, subject: mail.subject, html: mail.html, bcc: BRAND.contact });
        emailed = r.ok;
        // Journalise l'e-mail dans le fil de la commande (suivi des messages envoyés).
        if (r.ok) {
          try {
            await logOrderEmail(id, { subject: mail.subject, customerEmail: order.customerEmail, customerName: order.customerName, ref: order.ref });
          } catch { /* le journal ne doit jamais bloquer */ }
        }
      }
    }
  }
  return Response.json({ ok, emailed });
}

// Supprime définitivement une commande (ex : commande de test).
export async function DELETE(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { id } = body || {};
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  const ok = await deleteSiteOrder(id);
  return Response.json({ ok });
}
