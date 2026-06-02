import Stripe from "stripe";
import { decrementMany } from "@/lib/stock";
import { recordSiteOrder } from "@/lib/firebase";

// Webhook Stripe : reçoit l'événement "paiement réussi" et envoie à la
// boutique un e-mail récapitulatif (produits + perso + adresse de livraison).
//
// Variables d'environnement nécessaires :
//   STRIPE_SECRET_KEY     -> clé secrète Stripe
//   STRIPE_WEBHOOK_SECRET -> secret de signature du webhook (whsec_...)
//   RESEND_API_KEY        -> clé Resend (envoi e-mail)
//   CONTACT_EMAIL         -> ton adresse qui reçoit les récaps
//   CONTACT_FROM          -> expéditeur (onboarding@resend.dev en test)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function euro(cents, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format((cents || 0) / 100);
}

function formatAddress(details) {
  if (!details) return "—";
  const a = details.address || {};
  return [
    details.name,
    a.line1,
    a.line2,
    `${a.postal_code || ""} ${a.city || ""}`.trim(),
    a.country,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail({ subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com";
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("RESEND_API_KEY manquant : e-mail de commande non envoyé.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) console.error("Resend (commande) erreur:", await res.text());
}

export async function POST(req) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return Response.json({ error: "Webhook non configuré." }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const body = await req.text(); // corps brut requis pour vérifier la signature
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Signature webhook invalide:", err.message);
    return Response.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  // Décrémente le stock des variantes achetées (si suivi).
  try {
    const raw = event.data.object?.metadata?.stock;
    if (raw) {
      const pairs = JSON.parse(raw); // [[variantId, qty], ...]
      await decrementMany(pairs.map(([variantId, qty]) => ({ variantId, qty })));
    }
  } catch (e) {
    console.error("Décrément stock impossible:", e.message);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ["line_items.data.price.product", "shipping_cost.shipping_rate"],
    });

    const customer = session.customer_details || {};
    const shipping =
      session.shipping_details || session.collected_information?.shipping_details || null;
    const currency = session.currency || "eur";

    const lines = (session.line_items?.data || [])
      .map((li) => {
        const name = li.price?.product?.name || li.description || "Article";
        const details = li.price?.product?.description || "";
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <strong>${escapeHtml(name)}</strong><br>
            <span style="color:#666;font-size:13px;">${escapeHtml(details)}</span>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${li.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${euro(li.amount_total, currency)}</td>
        </tr>`;
      })
      .join("");

    const customFields = (session.custom_fields || [])
      .map((f) => {
        const val = f.text?.value || f.dropdown?.value || f.numeric?.value || "";
        if (!val) return "";
        const label = f.label?.custom || f.key;
        return `<p style="margin:4px 0;"><strong>${escapeHtml(label)} :</strong> ${escapeHtml(val)}</p>`;
      })
      .join("");

    const shippingRateName = session.shipping_cost?.shipping_rate?.display_name || "—";
    const shippingAmount = session.shipping_cost?.amount_total ?? 0;
    const orderRef = (session.payment_intent || session.id || "").toString().slice(-8).toUpperCase();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#2b2620;">
        <h2 style="color:#a98935;">🛎️ Nouvelle commande — Niv Création</h2>
        <p>Réf. commande : <strong>${escapeHtml(orderRef)}</strong></p>

        <h3 style="border-bottom:2px solid #eee;padding-bottom:6px;">📦 Livraison</h3>
        <p><strong>Méthode :</strong> ${escapeHtml(shippingRateName)} (${euro(shippingAmount, currency)})</p>
        <p style="background:#faf6ef;padding:12px;border-radius:8px;white-space:pre-line;">
<strong>Adresse de livraison (pour ton étiquette) :</strong>
${escapeHtml(formatAddress(shipping) || formatAddress(customer))}</p>

        <h3 style="border-bottom:2px solid #eee;padding-bottom:6px;">👤 Client</h3>
        <p>
          ${escapeHtml(customer.name || "—")}<br>
          ✉️ ${escapeHtml(customer.email || "—")}<br>
          📞 ${escapeHtml(customer.phone || "—")}
        </p>

        <h3 style="border-bottom:2px solid #eee;padding-bottom:6px;">🛒 Articles</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="text-align:left;color:#666;font-size:13px;">
              <th style="padding:8px;">Produit</th>
              <th style="padding:8px;text-align:center;">Qté</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>

        ${customFields ? `<h3 style="border-bottom:2px solid #eee;padding-bottom:6px;">✎ Personnalisation</h3>${customFields}` : ""}

        <p style="text-align:right;font-size:18px;margin-top:18px;">
          <strong>Total payé : ${euro(session.amount_total, currency)}</strong>
        </p>
        <p style="color:#888;font-size:12px;">⚠️ Pense à demander au client sa photo / son texte de gravure si nécessaire (réponds directement à son e-mail ci-dessus).</p>
      </div>`;

    await sendEmail({
      subject: `🛎️ Commande ${orderRef} — ${customer.name || "Client"} (${euro(session.amount_total, currency)})`,
      html,
    });

    // Enregistre la vente dans la base (collection siteOrders, sans risque).
    await recordSiteOrder({
      ref: orderRef,
      total: (session.amount_total || 0) / 100,
      currency,
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      shippingName: shipping?.name || "",
      shippingAddress: shipping?.address || null,
      shippingMethod: shippingRateName,
      items: (session.line_items?.data || []).map((li) => ({
        name: li.price?.product?.name || li.description || "",
        details: li.price?.product?.description || "",
        quantity: li.quantity,
        total: (li.amount_total || 0) / 100,
      })),
      stock: event.data.object?.metadata?.stock || "",
    });

    return Response.json({ received: true });
  } catch (err) {
    console.error("Erreur traitement commande:", err);
    // On renvoie 200 pour éviter que Stripe ne réessaie en boucle un échec d'e-mail.
    return Response.json({ received: true, warning: "email_failed" });
  }
}
