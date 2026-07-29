import Stripe from "stripe";
import { decrementMany, recordCodeUsage, recordCommission, getSettings, creditCagnotte, debitCagnotte, getPromoCodes, logOrderEmail } from "@/lib/stock";
import { sendClientMail } from "@/lib/clientMail";
import { recordSiteOrder, updateQuoteStatus, getQuote, getOrderSpec, deleteOrderSpec, findSiteOrderBySession, findSiteOrderByPaymentIntent } from "@/lib/firebase";

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

  // Panier abandonné : la session a expiré sans paiement → e-mail de relance
  // avec le lien de reprise Stripe (si la cliente avait saisi son e-mail).
  if (event.type === "checkout.session.expired") {
    try {
      const s = event.data.object || {};
      const to = (s.customer_details?.email || s.customer_email || "").trim();
      const url = s.after_expiration?.recovery?.url || "";
      if (to && url && process.env.RESEND_API_KEY) {
        const html = emailLayout({
          heading: "Votre panier vous attend",
          bodyHtml: `
            <p style="margin:0 0 12px;">Bonjour,</p>
            <p style="margin:0 0 14px;">Vous étiez sur le point de commander une création personnalisée chez <strong>Niv Création</strong>, mais votre commande n'a pas été finalisée.</p>
            <p style="margin:0 0 14px;">Bonne nouvelle : votre panier est toujours là. Vous pouvez reprendre exactement là où vous en étiez :</p>
            <p style="margin:0 0 20px;text-align:center;">
              <a href="${url}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Reprendre ma commande</a>
            </p>
            <p style="margin:0;color:#7a7268;">Une question, une hésitation sur la gravure ? Répondez simplement à cet e-mail, nous serons ravies de vous aider.<br>L'atelier Niv Création</p>`,
        });
        await sendEmail({ to, subject: "Votre panier vous attend ✦ Niv Création", html, replyTo: BRAND.contact });
      }
    } catch (e) {
      console.error("Relance panier abandonné:", e.message);
    }
    return Response.json({ received: true });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  // ANTI-DOUBLON : si Stripe renvoie le même événement (ou le rejoue), on ne
  // retraite pas la commande. On vérifie la session ET l'identifiant de paiement
  // (ce dernier couvre aussi les anciennes commandes sans sessionId).
  try {
    const sid = event.data.object?.id;
    const pi = (event.data.object?.payment_intent || "").toString();
    if ((sid && (await findSiteOrderBySession(sid))) || (pi && (await findSiteOrderByPaymentIntent(pi)))) {
      return Response.json({ received: true, duplicate: true });
    }
  } catch (e) {
    console.error("Vérif doublon commande:", e.message);
  }

  // Si c'est le paiement d'un devis (commande sur mesure), on le marque "payé"
  // ET on récupère la demande du client pour la JOINDRE à la commande.
  let quote = null;
  try {
    const quoteId = event.data.object?.metadata?.quoteId;
    if (quoteId) {
      quote = await getQuote(quoteId);
      await updateQuoteStatus(quoteId, "paye");
    }
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
    const obj = event.data.object || {};
    const md = obj.metadata || {};
    if (md.promoCode) {
      await recordCodeUsage(md.promoCode, {
        ip: md.clientIp || "",
        email: obj.customer_details?.email || "",
      });
      // Commission ambassadeur : ventes = total payé − livraison (en euros).
      const shipping = obj.shipping_cost?.amount_total ?? 0;
      const sales = Math.max(0, ((obj.amount_total ?? 0) - shipping) / 100);
      await recordCommission(md.promoCode, sales);
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

    // Fiche atelier : réglages détaillés enregistrés à la création du paiement.
    // Récupérés ici pour les JOINDRE à l'e-mail (photo du client + récap des réglages).
    let orderSpec = null;
    try { orderSpec = await getOrderSpec(session.id); } catch { /* ignore */ }

    // Met une URL d'image en absolu (pour qu'elle s'affiche dans l'e-mail).
    const absUrl = (u) => {
      if (!u || typeof u !== "string") return "";
      if (u.startsWith("http") || u.startsWith("data:")) return u;
      if (u.startsWith("/")) return BRAND.siteUrl + u;
      return "";
    };

    // Section « Personnalisation » : pour chaque article personnalisé, la photo
    // envoyée par le client (si présente) + le récap exact de ses réglages.
    const specItems = Array.isArray(orderSpec) ? orderSpec.filter(Boolean) : (orderSpec ? [orderSpec] : []);
    const imgTag = (u, alt) => {
      const a = absUrl(u);
      return a.startsWith("http") ? `<img src="${a}" alt="${alt}" style="display:inline-block;max-width:230px;width:100%;border-radius:8px;border:1px solid #ddd;margin:0 8px 10px 0;vertical-align:top;">` : "";
    };
    const persoBlocks = specItems.map((it) => {
      const empl = it.emplacement === "fond" ? "Au fond du verre"
        : it.deuxEmplacement ? "Face avant + fond du verre" : "Face avant";
      const recap = (it.personalization || "").trim();
      // Visuel exact préparé par le client (capture) ; sinon la photo brute envoyée.
      const visuals = [it.previewImage, it.previewImageFond].filter(Boolean);
      const imagesHtml = visuals.length
        ? visuals.map((u, i) => imgTag(u, i === 0 ? "Gravure face — placée par le client" : "Gravure fond — placée par le client")).join("")
        : imgTag(it.photoSrc, "Photo / logo envoyé par le client");
      return `
        <div style="border:1px solid #ece3d2;border-radius:10px;padding:12px;margin:0 0 12px;background:${BRAND.cream};">
          <p style="margin:0 0 8px;font-weight:bold;">${escapeHtml(it.name || "Article")}${it.variantTitle ? ` — ${escapeHtml(it.variantTitle)}` : ""}</p>
          ${imagesHtml}
          <p style="margin:0 0 4px;"><strong>Emplacement :</strong> ${escapeHtml(empl)}</p>
          ${recap ? `<p style="margin:0;white-space:pre-line;">${escapeHtml(recap)}</p>` : ""}
        </div>`;
    }).join("");
    const persoSection = persoBlocks
      ? `${sectionTitle("Personnalisation — réglages du client")}${persoBlocks}<p style="color:#998;font-size:12px;margin:0 0 6px;">Page complète + fichiers à graver (SVG/PDF) : <a href="${BRAND.siteUrl}/gestion/atelier" style="color:${BRAND.gold};">gestion/atelier</a>.</p>`
      : "";

    // Commande sur mesure (issue d'un devis) : on met la demande du client EN HAUT,
    // c'est ce que la gérante doit fabriquer.
    const demandeText = (quote?.note || "").trim();
    const demandeBlock = quote
      ? `<div style="background:#eef6ff;border:1px solid #bcd4ea;padding:14px 16px;border-radius:10px;margin:0 0 16px;">
           <strong style="color:#2b5d8a;">📋 Commande sur mesure${quote.number ? ` (devis ${escapeHtml(quote.number)})` : ""}</strong>
           ${demandeText ? `<p style="margin:8px 0 0;white-space:pre-line;">${escapeHtml(demandeText)}</p>` : `<p style="margin:8px 0 0;color:#7a7268;">Voir le détail des articles ci-dessous.</p>`}
         </div>`
      : "";

    const ownerBody = `
        <p style="margin:0 0 16px;">Réf. commande : <strong>${escapeHtml(orderRef)}</strong></p>
        ${demandeBlock}
        ${immediateStart ? `<p style="background:#fbf3e6;padding:12px 14px;border-radius:10px;border:1px solid #e7d3a1;margin:0 0 14px;"><strong>⚡ Fabrication immédiate demandée</strong> — la cliente a renoncé au délai de 24 h. Tu peux lancer la fabrication tout de suite (commande verrouillée).</p>` : ""}

        ${sectionTitle("Livraison")}
        <p style="margin:0 0 8px;"><strong>Méthode :</strong> ${escapeHtml(shippingRateName)} (${euro(shippingAmount, currency)})</p>
        ${session.metadata?.relaisPoint ? `<p style="background:#fbf3e6;padding:12px 14px;border-radius:10px;border:1px solid #e7d3a1;margin:0 0 8px;"><strong>📍 Point relais choisi par le client :</strong><br>${escapeHtml(session.metadata.relaisPoint)}</p>` : ""}
        <p style="background:${BRAND.cream};padding:14px;border-radius:10px;white-space:pre-line;border:1px solid #ece3d2;">
<strong>${session.metadata?.relaisPoint ? "Coordonnées du client (contact) :" : "Adresse de livraison (pour ton étiquette) :"}</strong>
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

        ${persoSection}

        ${customFields ? `${sectionTitle("Personnalisation (champs Stripe)")}${customFields}` : ""}

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
    let clientConfirmed = false, clientConfirmSubject = "";
    if (customer.email) {
      // Bloc parrainage (uniquement si activé dans l'admin).
      let referralBlock = "";
      try {
        const ref = (await getSettings()).referral || {};
        if (ref.enabled && ref.code) {
          referralBlock = `<div style="margin-top:20px;background:${BRAND.cream};border:1px dashed #dcc88f;border-radius:12px;padding:16px;text-align:center;">
            <div style="font-weight:bold;color:${BRAND.gold};margin-bottom:6px;">Faites plaisir à une amie 💛</div>
            <div style="font-size:14px;color:#7a7268;margin-bottom:8px;">${escapeHtml(ref.text || "Offrez une remise à une amie")} — partagez ce code :</div>
            <div style="display:inline-block;font-size:18px;font-weight:bold;letter-spacing:2px;color:${BRAND.gold};background:#fff;border:1px solid #e7d3a1;border-radius:8px;padding:8px 18px;">${escapeHtml(ref.code)}</div>
          </div>`;
        }
      } catch { /* ignore */ }
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
          ${referralBlock}

          ${/retrait en main propre/i.test(shippingRateName)
            ? `<p style="background:#fbf3e6;padding:14px;border-radius:10px;border:1px solid #e7d3a1;margin-top:18px;"><strong>Retrait en main propre :</strong> nous vous contacterons très vite (par e-mail ou téléphone) pour convenir ensemble du <strong>lieu et de l'horaire</strong> de retrait. Inutile de vous déplacer avant notre message.</p>`
            : `<p style="background:${BRAND.cream};padding:14px;border-radius:10px;border:1px solid #ece3d2;margin-top:18px;">Nous vous tiendrons au courant de l'expédition. Pour toute question, ou pour nous transmettre une photo ou un texte de gravure, répondez simplement à cet e-mail.</p>`}
          <p style="color:#7a7268;font-size:14px;margin-top:16px;">Avec toute notre gratitude,<br><strong>L'atelier Niv Création</strong></p>`;
      const clientHtml = emailLayout({ heading: "Merci pour votre commande", bodyHtml: clientBody });
      // Gmail en priorité (arrive vers toute adresse) ; Resend en secours. Isolé :
      // ne doit jamais empêcher l'enregistrement de la commande.
      clientConfirmSubject = `Votre commande Niv Création est confirmée (réf. ${orderRef})`;
      try {
        const rc = await sendClientMail({ to: customer.email, subject: clientConfirmSubject, html: clientHtml });
        clientConfirmed = Boolean(rc?.ok);
      } catch { clientConfirmed = false; }
    }

    // Cagnotte : on traite le débit + le cashback AVANT d'enregistrer la commande,
    // pour que le débit ne soit jamais sauté si l'enregistrement échoue (chaque bloc
    // est isolé et anti-double via orderRef → aucun risque de double débit/crédit).
    // Cagnotte UTILISÉE au paiement (débit).
    try {
      const mdC = session.metadata || event.data.object?.metadata || {};
      const cEmail = String(mdC.cagnotteEmail || "").trim();
      const cAmount = Number(mdC.cagnotteAmount) || 0;
      if (cEmail && cAmount > 0) {
        await debitCagnotte(cEmail, cAmount, orderRef);
      }
    } catch (e) {
      console.error("Débit cagnotte:", e.message);
    }

    // Cashback fidélité gagné sur cette commande (crédit).
    try {
      const st = await getSettings();
      const pct = Number(st.cashbackPercent) || 0;
      // Montant produits (hors livraison), en euros. Base du cashback.
      const produits = Math.max(0, ((session.amount_total || 0) - (shippingAmount || 0)) / 100);
      // 1) Cashback de la cliente (crédité sur SA cagnotte, réutilisable ensuite).
      if (pct > 0 && customer.email && produits > 0) {
        const gain = Math.round(produits * pct) / 100; // produits × pct / 100, arrondi centime
        await creditCagnotte(customer.email, gain, "Cashback fidélité", orderRef);
      }
      // 2) Cashback ambassadeur : si le code porte une adresse e-mail d'ambassadeur,
      //    sa commission est aussi versée sur SA cagnotte (en plus du suivi codeStats).
      const md2 = session.metadata || event.data.object?.metadata || {};
      if (md2.promoCode) {
        const codes = await getPromoCodes();
        const pc = codes[String(md2.promoCode).trim().toUpperCase()];
        const amb = String(pc?.ambassador || "").trim();
        const commPct = Number(pc?.commission) || 0;
        if (commPct > 0 && produits > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(amb)) {
          const gainAmb = Math.round(produits * commPct) / 100;
          await creditCagnotte(amb, gainAmb, "Commission ambassadeur", orderRef);
        }
      }
    } catch (e) {
      console.error("Cashback cagnotte:", e.message);
    }

    // Enregistre la vente dans la base (collection siteOrders, sans risque).
    const newOrderId = await recordSiteOrder({
      ref: orderRef,
      sessionId: session.id, // anti-doublon (si l'événement est rejoué)
      spec: orderSpec || null,
      // Textes tapés par la cliente au paiement (précisions gravure + date/message à graver).
      demandeGravure: (session.custom_fields || []).find((f) => f.key === "personnalisation")?.text?.value || "",
      messageGraver: (session.custom_fields || []).find((f) => f.key === "message_cadeau")?.text?.value || "",
      // Commande sur mesure : demande du client + n° de devis (visibles dans l'admin).
      demande: quote ? (quote.note || "").trim() : "",
      quoteNumber: quote?.number || "",
      surMesure: Boolean(quote),
      paymentIntentId: (session.payment_intent || "").toString(),
      total: (session.amount_total || 0) / 100,
      currency,
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      shippingName: shipping?.name || "",
      shippingAddress: shipping?.address || null,
      shippingMethod: shippingRateName,
      shippingPrice: (shippingAmount || 0) / 100, // frais de livraison payés (pour le détail commande)
      relaisPoint: session.metadata?.relaisPoint || "",
      immediateStart,
      items: (session.line_items?.data || []).map((li) => ({
        name: li.price?.product?.name || li.description || "",
        details: li.price?.product?.description || "",
        slug: li.price?.product?.metadata?.slug || "", // pour le lien avis direct
        quantity: li.quantity,
        total: (li.amount_total || 0) / 100,
      })),
      stock: event.data.object?.metadata?.stock || "",
    });

    // Journalise l'e-mail de confirmation dans le fil de la commande (suivi admin,
    // invisible au client). Uniquement si l'e-mail est bien parti et la commande créée.
    if (clientConfirmed && newOrderId && typeof newOrderId === "string") {
      try {
        await logOrderEmail(newOrderId, { subject: clientConfirmSubject, customerEmail: customer.email, customerName: customer.name || "", ref: orderRef });
      } catch { /* le journal ne doit jamais bloquer */ }
    }

    // La fiche est désormais dans la commande : on supprime la copie temporaire.
    try { if (orderSpec) await deleteOrderSpec(session.id); } catch { /* ignore */ }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Erreur traitement commande:", err);
    // On renvoie 200 pour éviter que Stripe ne réessaie en boucle un échec d'e-mail.
    return Response.json({ received: true, warning: "email_failed" });
  }
}
