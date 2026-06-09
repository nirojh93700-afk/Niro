import Stripe from "stripe";
import { decrementMany, recordCodeUsage } from "@/lib/stock";
import { recordSiteOrder, updateQuoteStatus } from "@/lib/firebase";

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

// =============================================================================
// Marque & mise en page des e-mails (or & crème — identité Niv Création)
// -----------------------------------------------------------------------------
// LOGO_URL : laisser vide tant que le logo n'est pas hébergé (en-tête typographique
// élégant en repli). Dès qu'on a le lien (Shopify/Cloudinary/site), le coller ici
// ou définir la variable d'environnement LOGO_URL.
// =============================================================================
const BRAND = {
  gold: "#a98935",
  cream: "#faf6ee",
  ink: "#2b2620",
  logoUrl: (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim(),
  siteUrl: ((process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "")),
  siteLabel: "nivcreation.fr",
  contact: process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com",
  instagram: (process.env.INSTAGRAM_URL || "https://instagram.com/nivcreation").trim(),
};

function brandHeader() {
  if (BRAND.logoUrl) {
    // Logo en bannière pleine largeur (son propre fond crème devient l'en-tête).
    return `<img src="${BRAND.logoUrl}" alt="Niv Création — Atelier de personnalisation" style="display:block;width:100%;max-width:600px;height:auto;border:0;">`;
  }
  // Repli typographique (sans image) — élégant et lisible partout.
  return `<div style="text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1;color:${BRAND.gold};font-weight:bold;letter-spacing:1px;">NiV</div>
      <div style="font-family:Georgia,serif;font-size:17px;letter-spacing:7px;color:${BRAND.gold};margin-top:6px;">CRÉATION</div>
      <div style="font-size:10px;letter-spacing:3px;color:#bdab86;margin-top:8px;">ATELIER DE PERSONNALISATION</div>
    </div>`;
}

// Enveloppe une zone de contenu HTML dans la mise en page de marque complète.
function emailLayout({ heading, bodyHtml }) {
  return `
  <div style="background:#f1e9da;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ece3d2;">
        <tr><td style="background:${BRAND.cream};padding:${BRAND.logoUrl ? "0" : "30px 24px"};border-bottom:3px solid #dcc88f;">${brandHeader()}</td></tr>
        <tr><td style="padding:30px 30px 6px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:23px;color:${BRAND.gold};">${heading}</h1>
        </td></tr>
        <tr><td style="padding:0 30px 26px;font-size:15px;line-height:1.55;">${bodyHtml}</td></tr>
        <tr><td style="background:${BRAND.ink};padding:24px;text-align:center;color:#e9dfca;font-size:12px;line-height:1.7;">
          <div style="font-family:Georgia,serif;color:#dcc88f;font-size:16px;letter-spacing:3px;margin-bottom:10px;">NiV CRÉATION</div>
          <a href="${BRAND.siteUrl}" style="color:#e9dfca;text-decoration:none;">${BRAND.siteLabel}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${BRAND.contact}" style="color:#e9dfca;text-decoration:none;">${BRAND.contact}</a>
          &nbsp;·&nbsp;
          <a href="${BRAND.instagram}" style="color:#e9dfca;text-decoration:none;">Instagram</a>
          <div style="margin-top:12px;color:#bdab86;letter-spacing:1px;">✦ Personnalisé en France · Gravure &amp; découpe laser ✦</div>
        </td></tr>
      </table>
      <div style="color:#bdab86;font-size:11px;margin-top:14px;">© Niv Création — Atelier de personnalisation</div>
    </td></tr></table>
  </div>`;
}

async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("RESEND_API_KEY manquant : e-mail non envoyé.");
    return;
  }
  if (!to) return;
  const payload = { from, to: [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error("Resend erreur:", await res.text());
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

  // Si c'est le paiement d'un devis, on le marque "payé".
  try {
    const quoteId = event.data.object?.metadata?.quoteId;
    if (quoteId) await updateQuoteStatus(quoteId, "paye");
  } catch (e) {
    console.error("MAJ statut devis:", e.message);
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

  // Enregistre l'utilisation du code promo (une seule fois par IP / e-mail).
  try {
    const md = event.data.object?.metadata || {};
    if (md.promoCode) {
      await recordCodeUsage(md.promoCode, {
        ip: md.clientIp || "",
        email: event.data.object?.customer_details?.email || "",
      });
    }
  } catch (e) {
    console.error("Enregistrement code promo:", e.message);
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

    // Choix « lancement de la fabrication » (à part, pas une personnalisation).
    const immediateStart =
      (session.custom_fields || []).find((f) => f.key === "fabrication")?.dropdown?.value === "immediate";

    const customFields = (session.custom_fields || [])
      .filter((f) => f.key !== "fabrication")
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

    const sectionTitle = (t) =>
      `<h3 style="font-family:Georgia,serif;font-weight:normal;font-size:15px;color:${BRAND.gold};border-bottom:1px solid #ece3d2;padding-bottom:6px;margin:22px 0 10px;">${t}</h3>`;

    const ownerBody = `
        <p style="margin:0 0 16px;">Réf. commande : <strong>${escapeHtml(orderRef)}</strong></p>
        ${immediateStart ? `<p style="background:#fbf3e6;padding:12px 14px;border-radius:10px;border:1px solid #e7d3a1;margin:0 0 14px;"><strong>⚡ Fabrication immédiate demandée</strong> — la cliente a renoncé au délai de 24 h. Tu peux lancer la fabrication tout de suite (commande verrouillée).</p>` : ""}

        ${sectionTitle("Livraison")}
        <p style="margin:0 0 8px;"><strong>Méthode :</strong> ${escapeHtml(shippingRateName)} (${euro(shippingAmount, currency)})</p>
        <p style="background:${BRAND.cream};padding:14px;border-radius:10px;white-space:pre-line;border:1px solid #ece3d2;">
<strong>Adresse de livraison (pour ton étiquette) :</strong>
${escapeHtml(formatAddress(shipping) || formatAddress(customer))}</p>

        ${sectionTitle("Client")}
        <p style="margin:0;">
          ${escapeHtml(customer.name || "—")}<br>
          ✉️ ${escapeHtml(customer.email || "—")}<br>
          📞 ${escapeHtml(customer.phone || "—")}
        </p>

        ${sectionTitle("Articles")}
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="text-align:left;color:#998;font-size:12px;">
              <th style="padding:8px;">Produit</th>
              <th style="padding:8px;text-align:center;">Qté</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
        </table>

        ${customFields ? `${sectionTitle("Personnalisation")}${customFields}` : ""}

        <p style="text-align:right;font-size:18px;margin-top:18px;color:${BRAND.gold};">
          <strong>Total payé : ${euro(session.amount_total, currency)}</strong>
        </p>
        <p style="color:#998;font-size:12px;background:#fbf3e6;border-radius:8px;padding:10px;">Pense à demander au client sa photo / son texte de gravure si nécessaire (réponds directement à son e-mail ci-dessus).</p>`;

    const html = emailLayout({ heading: "🛎️ Nouvelle commande", bodyHtml: ownerBody });

    // 1) E-mail récapitulatif pour la boutique (toi).
    const ownerEmail = process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com";
    await sendEmail({
      to: ownerEmail,
      subject: `🛎️ Commande ${orderRef} — ${customer.name || "Client"} (${euro(session.amount_total, currency)})`,
      html,
      replyTo: customer.email || undefined,
    });

    // 2) E-mail de confirmation pour la cliente.
    if (customer.email) {
      const clientSection = (t) =>
        `<h3 style="font-family:Georgia,serif;font-weight:normal;font-size:15px;color:${BRAND.gold};border-bottom:1px solid #ece3d2;padding-bottom:6px;margin:22px 0 10px;">${t}</h3>`;
      const clientBody = `
          <p style="margin:0 0 12px;">Bonjour ${escapeHtml(customer.name || "")},</p>
          <p style="margin:0 0 12px;">Nous avons bien reçu votre commande chez <strong>Niv Création</strong> et nous vous en remercions chaleureusement. Chaque pièce étant personnalisée et gravée avec soin, nous la préparons avec le plus grand soin.</p>
          <p style="margin:0 0 4px;">Référence de votre commande : <strong>${escapeHtml(orderRef)}</strong></p>

          ${clientSection("Votre commande")}
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${lines}</tbody>
          </table>
          <p style="text-align:right;font-size:15px;margin-top:12px;">
            Livraison : ${escapeHtml(shippingRateName)} (${euro(shippingAmount, currency)})<br>
            <strong style="color:${BRAND.gold};font-size:17px;">Total payé : ${euro(session.amount_total, currency)}</strong>
          </p>

          ${customFields ? `${clientSection("Votre personnalisation")}${customFields}` : ""}

          ${/retrait en main propre/i.test(shippingRateName)
            ? `<p style="background:#fbf3e6;padding:14px;border-radius:10px;border:1px solid #e7d3a1;margin-top:18px;"><strong>Retrait en main propre :</strong> nous vous contacterons très vite (par e-mail ou téléphone) pour convenir ensemble du <strong>lieu et de l'horaire</strong> de retrait. Inutile de vous déplacer avant notre message.</p>`
            : `<p style="background:${BRAND.cream};padding:14px;border-radius:10px;border:1px solid #ece3d2;margin-top:18px;">Nous vous tiendrons informée de l'expédition. Pour toute question, ou pour nous transmettre une photo ou un texte de gravure, répondez simplement à cet e-mail.</p>`}
          <p style="color:#7a7268;font-size:14px;margin-top:16px;">Avec toute notre gratitude,<br><strong>L'atelier Niv Création</strong></p>`;
      const clientHtml = emailLayout({ heading: "Merci pour votre commande", bodyHtml: clientBody });
      await sendEmail({
        to: customer.email,
        subject: `Votre commande Niv Création est confirmée (réf. ${orderRef})`,
        html: clientHtml,
        replyTo: ownerEmail,
      });
    }

    // Enregistre la vente dans la base (collection siteOrders, sans risque).
    await recordSiteOrder({
      ref: orderRef,
      paymentIntentId: (session.payment_intent || "").toString(),
      total: (session.amount_total || 0) / 100,
      currency,
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      shippingName: shipping?.name || "",
      shippingAddress: shipping?.address || null,
      shippingMethod: shippingRateName,
      immediateStart,
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
