import { isAdmin } from "@/lib/stock";
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

  if (!id || !["a_preparer", "en_gravure", "expediee", "livree", "annulee"].includes(status)) {
    return Response.json({ error: "Paramètres invalides." }, { status: 400 });
  }
  const patch = { status };
  if (typeof tracking === "string") patch.tracking = tracking.trim();
  const ok = await updateSiteOrder(id, patch);

  // E-mail au client (expédition avec suivi, ou annulation), si demandé et possible.
  let emailed = false;
  if (ok && notifyCustomer) {
    const order = await getSiteOrder(id);
    if (order?.customerEmail) {
      let mail = null;
      if (status === "expediee" && patch.tracking) mail = shippedEmail(order, patch.tracking);
      else if (status === "annulee") mail = cancelledEmail(order);
      else if (status === "livree") mail = reviewRequestEmail(order);
      if (mail) {
        // Gmail en priorité (arrive vers toute adresse), Resend en secours ; copie à la gérante.
        const r = await sendClientMail({ to: order.customerEmail, subject: mail.subject, html: mail.html, bcc: BRAND.contact });
        emailed = r.ok;
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
