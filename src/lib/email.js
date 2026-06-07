// =============================================================================
// E-mails de marque Niv Création (or & crème) — utilisé pour les tests d'envoi.
// Reprend la même mise en page que l'e-mail de confirmation client.
// =============================================================================

export const BRAND = {
  gold: "#a98935",
  cream: "#faf6ee",
  ink: "#2b2620",
  logoUrl: (process.env.LOGO_URL || "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111").trim(),
  siteUrl: ((process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "")),
  siteLabel: "nivcreation.fr",
  contact: process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com",
  instagram: (process.env.INSTAGRAM_URL || "https://instagram.com/nivcreation").trim(),
};

export function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function brandHeader() {
  if (BRAND.logoUrl) {
    return `<img src="${BRAND.logoUrl}" alt="Niv Création — Atelier de personnalisation" style="display:block;width:100%;max-width:600px;height:auto;border:0;">`;
  }
  return `<div style="text-align:center;">
      <div style="font-family:Georgia,serif;font-size:38px;line-height:1;color:${BRAND.gold};font-weight:bold;letter-spacing:1px;">NiV</div>
      <div style="font-family:Georgia,serif;font-size:17px;letter-spacing:7px;color:${BRAND.gold};margin-top:6px;">CRÉATION</div>
    </div>`;
}

export function emailLayout({ heading, bodyHtml }) {
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
          <div style="margin-top:12px;color:#bdab86;letter-spacing:1px;">✦ Fait main en France · Gravure &amp; découpe laser ✦</div>
        </td></tr>
      </table>
    </td></tr></table>
  </div>`;
}

export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY manquant." };
  if (!to) return { ok: false, error: "Destinataire manquant." };
  const payload = { from, to: [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    return { ok: false, error: detail };
  }
  return { ok: true };
}

// E-mail « commande expédiée » avec numéro de suivi, envoyé à la cliente.
export function shippedEmail(order, tracking) {
  const ref = order?.ref || order?.id?.slice(-6) || "";
  const name = order?.customerName ? order.customerName.split(" ")[0] : "";
  const trackUrl = `https://parcelsapp.com/en/tracking/${encodeURIComponent(tracking)}`;
  const items = (order?.items || [])
    .map((it) => `<tr><td style="padding:6px 0;border-bottom:1px solid #f0eadd;">${escapeHtml(`${it.quantity}× ${it.name}`)}</td></tr>`)
    .join("");
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 12px;">Bonne nouvelle : votre commande <strong>#${escapeHtml(ref)}</strong> vient d'être <strong>expédiée</strong> ! 📦</p>
    <p style="margin:0 0 4px;">Numéro de suivi :</p>
    <p style="margin:0 0 16px;font-size:18px;font-weight:bold;color:${BRAND.gold};">${escapeHtml(tracking)}</p>
    <p style="margin:0 0 20px;">
      <a href="${trackUrl}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">Suivre mon colis</a>
    </p>
    ${items ? `<table style="width:100%;border-collapse:collapse;font-size:14px;"><tbody>${items}</tbody></table>` : ""}
    <p style="margin:18px 0 0;">Merci pour votre confiance,<br>Niv Création</p>`;
  return { subject: `Votre commande #${ref} est en route ✦`, html: emailLayout({ heading: "Votre commande est expédiée", bodyHtml: body }) };
}

// E-mail « commande annulée », envoyé à la cliente.
export function cancelledEmail(order) {
  const ref = order?.ref || order?.id?.slice(-6) || "";
  const name = order?.customerName ? order.customerName.split(" ")[0] : "";
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 12px;">Nous vous informons que votre commande <strong>#${escapeHtml(ref)}</strong> a été <strong>annulée</strong>.</p>
    <p style="margin:0 0 12px;">Si vous avez déjà réglé cette commande, un remboursement vous sera adressé. Pour toute question concernant cette annulation, répondez simplement à cet e-mail : nous sommes à votre écoute.</p>
    <p style="margin:18px 0 0;color:#7a7268;">Avec toutes nos excuses pour ce contretemps,<br><strong>L'atelier Niv Création</strong></p>`;
  return { subject: `Votre commande #${ref} a été annulée`, html: emailLayout({ heading: "Votre commande a été annulée", bodyHtml: body }) };
}

// E-mail « demande d'avis » envoyé après livraison.
export function reviewRequestEmail(order) {
  const name = order?.customerName ? order.customerName.split(" ")[0] : "";
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 12px;">Nous espérons que votre commande vous plaît ! 🌸 Votre avis compte beaucoup pour notre petit atelier.</p>
    <p style="margin:0 0 18px;">Prendriez-vous un instant pour partager votre expérience ? Cela aide d'autres clientes et nous encourage énormément.</p>
    <p style="margin:0 0 20px;">
      <a href="${BRAND.siteUrl}/boutique" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">Laisser un avis</a>
    </p>
    <p style="margin:0;color:#7a7268;">Merci infiniment,<br>L'atelier Niv Création</p>`;
  return { subject: "Votre avis sur votre création Niv Création ✦", html: emailLayout({ heading: "Comment s'est passée votre commande ?", bodyHtml: body }) };
}

// E-mail de démonstration (mêmes style et structure que la confirmation client réelle).
export function sampleClientEmailHtml() {
  const body = `
    <p style="margin:0 0 12px;">Bonjour,</p>
    <p style="margin:0 0 12px;">Ceci est un <strong>e-mail de test</strong> : c'est exactement le message que recevront vos clients après une commande chez <strong>Niv Création</strong>.</p>
    <p style="margin:0 0 4px;">Référence (exemple) : <strong>TEST1234</strong></p>
    <h3 style="font-family:Georgia,serif;font-weight:normal;font-size:15px;color:${BRAND.gold};border-bottom:1px solid #ece3d2;padding-bottom:6px;margin:22px 0 10px;">Votre commande</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tbody>
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;"><strong>Bracelet personnalisé</strong><br><span style="color:#666;font-size:13px;">Gravure prénom</span></td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">1</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">22,80 €</td>
        </tr>
      </tbody>
    </table>
    <p style="text-align:right;font-size:15px;margin-top:12px;">
      Livraison : Lettre suivie (3,90 €)<br>
      <strong style="color:${BRAND.gold};font-size:17px;">Total : 22,80 €</strong>
    </p>
    <p style="background:${BRAND.cream};padding:14px;border-radius:10px;border:1px solid #ece3d2;margin-top:18px;">Nous vous tiendrons informée de l'expédition. Pour toute question, répondez simplement à cet e-mail.</p>
    <p style="color:#7a7268;font-size:14px;margin-top:16px;">Avec toute notre gratitude,<br><strong>L'atelier Niv Création</strong></p>`;
  return emailLayout({ heading: "Merci pour votre commande", bodyHtml: body });
}
