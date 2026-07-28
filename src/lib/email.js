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
          <div style="margin-top:12px;color:#bdab86;letter-spacing:1px;">✦ Personnalisé en France · Gravure &amp; découpe laser ✦</div>
        </td></tr>
      </table>
    </td></tr></table>
  </div>`;
}

export async function sendEmail({ to, subject, html, replyTo, bcc }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY manquant." };
  if (!to) return { ok: false, error: "Destinataire manquant." };

  async function post(payload) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok ? { ok: true } : { ok: false, error: await res.text() };
  }

  const base = { from, to: [to], subject, html };
  if (replyTo) base.reply_to = replyTo;
  // Copie cachée (ex. la gérante reçoit une copie des mails envoyés aux clientes).
  const useBcc = bcc && String(bcc).toLowerCase() !== String(to).toLowerCase();

  // 1er essai AVEC le bcc. Si Resend le refuse, on renvoie SANS le bcc pour
  // que la cliente reçoive quand même son e-mail (la copie est secondaire).
  let r = await post(useBcc ? { ...base, bcc: [bcc] } : base);
  if (!r.ok && useBcc) {
    r = await post(base);
  }
  return r;
}

// E-mail de bienvenue (newsletter) avec le code promo, envoyé automatiquement
// dès l'inscription via la fenêtre d'arrivée.
export function welcomeEmail(code, offerText) {
  const offer = (offerText && offerText.trim()) || "Profitez d'une remise sur votre première commande";
  const body = `
    <p style="margin:0 0 12px;">Bonjour,</p>
    <p style="margin:0 0 16px;">Merci de rejoindre <strong>Niv Création</strong> ! 💌 Voici votre <strong>code de bienvenue</strong> :</p>
    <div style="text-align:center;margin:0 0 8px;">
      <div style="display:inline-block;font-size:22px;font-weight:bold;letter-spacing:3px;color:${BRAND.gold};background:${BRAND.cream};border:1px dashed #dcc88f;border-radius:10px;padding:14px 26px;">${escapeHtml(code)}</div>
    </div>
    <p style="margin:0 0 20px;text-align:center;color:#7a7268;">${escapeHtml(offer)} — à entrer au moment du paiement.</p>
    <p style="margin:0 0 22px;text-align:center;">
      <a href="${BRAND.siteUrl}/boutique" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Découvrir la boutique</a>
    </p>
    <p style="margin:0;color:#7a7268;">À très vite,<br><strong>L'atelier Niv Création</strong></p>`;
  return { subject: `Votre code de bienvenue : ${code} ✦`, html: emailLayout({ heading: "Bienvenue chez Niv Création", bodyHtml: body }) };
}

// E-mail de rappel « cagnotte fidélité » : la cliente a un solde à utiliser
// (et, si `daysLeft` est fourni, qui expire bientôt). Ton professionnel, non alarmant.
export function cashbackReminderEmail({ firstName = "", balance = 0, daysLeft = null } = {}) {
  const eur = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";
  const name = firstName ? " " + escapeHtml(String(firstName)) : "";
  const soon = Number.isFinite(daysLeft) && daysLeft != null && daysLeft <= 45;
  const heading = soon ? "Votre cagnotte expire bientôt" : "Votre cagnotte fidélité vous attend";
  const alerte = soon
    ? `<p style="margin:0 0 16px;text-align:center;color:#a24336;font-weight:bold;">⏳ Attention : votre cagnotte expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}. Pensez à en profiter avant qu'elle ne disparaisse.</p>`
    : `<p style="margin:0 0 16px;text-align:center;color:#7a7268;">Utilisable dès votre prochaine commande (jusqu'à 50 % du panier).</p>`;
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name},</p>
    <p style="margin:0 0 18px;">Bonne nouvelle : il vous reste de l'argent à dépenser dans votre <strong>cagnotte fidélité</strong> Niv Création.</p>
    <div style="text-align:center;margin:0 0 6px;">
      <div style="display:inline-block;background:linear-gradient(150deg,#241a0c,#3a2c12);border-radius:14px;padding:20px 34px;color:#fff;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e2c67e;">Ma cagnotte</div>
        <div style="font-family:Georgia,serif;font-size:36px;font-weight:bold;margin-top:4px;">${eur(balance)}</div>
      </div>
    </div>
    ${alerte}
    <p style="margin:0 0 22px;text-align:center;">
      <a href="${BRAND.siteUrl}/espace" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Voir ma cagnotte</a>
      &nbsp;
      <a href="${BRAND.siteUrl}/boutique" style="display:inline-block;background:${BRAND.cream};color:${BRAND.gold};border:1px solid #dcc88f;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Faire un achat</a>
    </p>
    <p style="margin:0;color:#7a7268;">À très vite,<br><strong>L'atelier Niv Création</strong></p>`;
  const subject = soon
    ? `⏳ Votre cagnotte de ${eur(balance)} expire bientôt`
    : `Vous avez ${eur(balance)} dans votre cagnotte ✦`;
  return { subject, html: emailLayout({ heading, bodyHtml: body }) };
}

// E-mail newsletter « Nouveautés » — professionnel, avec cartes produits (photo,
// nom, prix, bouton). `products` = [{ name, tagline, price, image, url }].
export function newsletterProductsEmail({ subject, intro, heading, products = [] }) {
  const site = BRAND.siteUrl;
  const abs = (u) => (u && u.toString().startsWith("/") ? site + u : u);
  const H = escapeHtml(heading || "De nouvelles créations viennent d'arriver");
  const introHtml = intro
    ? `<p style="margin:0 auto;max-width:440px;font-size:15px;line-height:1.6;color:#5c5344;">${escapeHtml(intro)}</p>`
    : "";
  const card = (p) => `
      <td width="50%" style="padding:8px;" valign="top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece0c4;border-radius:12px;overflow:hidden;">
          <tr><td><a href="${abs(p.url)}" style="text-decoration:none;"><img src="${abs(p.image)}" width="100%" style="display:block;width:100%;height:190px;object-fit:cover;" alt="${escapeHtml(p.name)}"></a></td></tr>
          <tr><td style="padding:12px 12px 14px;text-align:center;">
            <div style="font-size:15px;font-weight:bold;color:#241a0c;">${escapeHtml(p.name)}</div>
            ${p.tagline ? `<div style="font-size:12px;color:#8a7d63;margin:2px 0 8px;">${escapeHtml(p.tagline)}</div>` : `<div style="margin:2px 0 8px;">&nbsp;</div>`}
            ${p.price ? `<div style="font-size:14px;color:#a98935;font-weight:bold;margin-bottom:10px;">dès ${escapeHtml(p.price)}</div>` : ""}
            <a href="${abs(p.url)}" style="display:inline-block;background:#241a0c;color:#e2c67e;text-decoration:none;padding:8px 18px;border-radius:7px;font-size:12px;font-weight:bold;">Personnaliser</a>
          </td></tr>
        </table>
      </td>`;
  let rows = "";
  for (let i = 0; i < products.length; i += 2) {
    rows += `<tr>${card(products[i])}${products[i + 1] ? card(products[i + 1]) : '<td width="50%">&nbsp;</td>'}</tr>`;
  }
  const html = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe6d4;padding:26px 12px;font-family:Arial,Helvetica,sans-serif;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6d7b8;">
    <tr><td style="background:#faf6ee;padding:26px 30px 18px;border-bottom:3px solid #dcc88f;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:34px;letter-spacing:2px;color:${BRAND.gold};font-weight:bold;line-height:1;">NiV</div>
      <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:6px;color:${BRAND.gold};margin-top:6px;">CRÉATION</div>
    </td></tr>
    <tr><td style="padding:30px 30px 6px;text-align:center;">
      <div style="font-size:12px;letter-spacing:3px;color:#c9a24b;text-transform:uppercase;margin-bottom:8px;">✦ Nouveautés ✦</div>
      <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:#241a0c;">${H}</h1>
      ${introHtml}
    </td></tr>
    <tr><td style="padding:22px 22px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
    <tr><td style="padding:14px 30px 30px;text-align:center;">
      <a href="${site}/boutique" style="display:inline-block;background:${BRAND.gold};color:#241a0c;text-decoration:none;padding:14px 34px;border-radius:9px;font-weight:bold;font-size:15px;">Découvrir toute la boutique →</a>
    </td></tr>
    <tr><td style="background:${BRAND.ink};padding:24px;text-align:center;color:#e9dfca;font-size:12px;line-height:1.7;">
      <div style="font-family:Georgia,serif;color:#dcc88f;font-size:16px;letter-spacing:3px;margin-bottom:10px;">NiV CRÉATION</div>
      <a href="${site}" style="color:#e9dfca;text-decoration:none;">${BRAND.siteLabel}</a> &nbsp;·&nbsp; <a href="mailto:${BRAND.contact}" style="color:#e9dfca;text-decoration:none;">${BRAND.contact}</a>
      <div style="margin-top:12px;color:#bdab86;letter-spacing:1px;">✦ Personnalisé en France · Gravure &amp; découpe laser ✦</div>
    </td></tr>
  </table></td></tr></table>`;
  return { subject: subject || "Nos nouveautés ✦", html };
}

// E-mail « aperçu à valider » (BAT) envoyé à la cliente avant la gravure.
export function batProofEmail({ customerName, ref, message, imageUrl, link }) {
  const name = customerName ? customerName.split(" ")[0] : "";
  const hasImg = Boolean(imageUrl);
  // Wording adaptatif : avec image = « aperçu à valider » ; sans image = simple message.
  const intro = hasImg
    ? `Avant de graver votre commande${ref ? ` <strong>#${escapeHtml(ref)}</strong>` : ""}, voici un <strong>aperçu à valider</strong> :`
    : `Un petit message concernant votre commande${ref ? ` <strong>#${escapeHtml(ref)}</strong>` : ""} :`;
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 14px;">${intro}</p>
    ${message ? `<p style="margin:0 0 14px;white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;">${escapeHtml(message)}</p>` : ""}
    ${hasImg ? `<p style="margin:0 0 16px;text-align:center;"><img src="${imageUrl}" alt="Aperçu de votre gravure" style="max-width:100%;border-radius:10px;border:1px solid #ece3d2;"></p>` : ""}
    <p style="margin:0 0 20px;text-align:center;">
      <a href="${link}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">${hasImg ? "Voir et valider mon aperçu" : "Répondre à ce message"}</a>
    </p>
    <p style="margin:0;color:#7a7268;">Sur cette page, vous pourrez ${hasImg ? "<strong>valider</strong> ou <strong>demander une modification</strong>, et " : ""}échanger avec nous. À très vite,<br>L'atelier Niv Création</p>`;
  return {
    subject: hasImg ? `Votre aperçu à valider${ref ? ` — commande #${ref}` : ""} ✦` : `Votre commande${ref ? ` #${ref}` : ""} — un message de Niv Création ✦`,
    html: emailLayout({ heading: hasImg ? "Votre aperçu avant gravure" : "Un message concernant votre commande", bodyHtml: body }),
  };
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

// E-mail « demande d'avis » envoyé après livraison. Comme Judge.me / Loox :
// un bouton par produit commandé → le client note DIRECTEMENT le bon produit
// (l'avis se rattache tout seul à ce produit, puis tu le valides dans l'admin).
export function reviewRequestEmail(order) {
  const name = order?.customerName ? order.customerName.split(" ")[0] : "";
  // Produits commandés qui ont un identifiant (slug) → lien direct vers leur fiche.
  const seen = new Set();
  const products = (order?.items || []).filter((it) => {
    const s = it && it.slug;
    if (!s || seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  let ctaHtml;
  if (products.length > 0) {
    ctaHtml = products.map((it) => `
      <a href="${BRAND.siteUrl}/produit/${encodeURIComponent(it.slug)}#avis" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold;margin:0 8px 10px 0;">★ Noter « ${escapeHtml(String(it.name || "ce produit").slice(0, 40))} »</a>`).join("");
  } else {
    // Ancienne commande sans identifiant produit : repli sur la boutique.
    ctaHtml = `<a href="${BRAND.siteUrl}/boutique" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">Laisser un avis</a>`;
  }
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + escapeHtml(name) : ""},</p>
    <p style="margin:0 0 12px;">Nous espérons que votre commande vous plaît ! 🌸 Votre avis compte beaucoup pour notre petit atelier.</p>
    <p style="margin:0 0 18px;">Prendriez-vous un instant pour noter ${products.length > 1 ? "vos créations" : "votre création"} ? Un clic suffit — cela aide d'autres clientes et nous encourage énormément.</p>
    <p style="margin:0 0 20px;">${ctaHtml}</p>
    <p style="margin:0;color:#7a7268;">Merci infiniment,<br>L'atelier Niv Création</p>`;
  return { subject: "Votre avis sur votre création Niv Création ✦", html: emailLayout({ heading: "Comment s'est passée votre commande ?", bodyHtml: body }) };
}

// E-mail envoyé à la cliente avec son devis / sa facture + lien pour payer en ligne.
export function quoteEmail(q, link) {
  const isFacture = q?.type === "facture";
  const titre = isFacture ? "facture" : "devis";
  const name = q?.client?.name ? escapeHtml(String(q.client.name).split(" ")[0]) : "";
  const fmt = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
  const rows = (Array.isArray(q?.items) ? q.items : [])
    .map((it) => `<tr><td style="padding:6px 0;border-bottom:1px solid #f0eadd;">${escapeHtml(it.desc || "")}${it.qty > 1 ? ` × ${it.qty}` : ""}</td><td style="padding:6px 0;border-bottom:1px solid #f0eadd;text-align:right;white-space:nowrap;">${fmt(it.qty * it.price)}</td></tr>`)
    .join("");
  const body = `
    <p style="margin:0 0 12px;">Bonjour${name ? " " + name : ""},</p>
    <p style="margin:0 0 14px;">Voici votre <strong>${titre}${q?.number ? ` ${escapeHtml(q.number)}` : ""}</strong> de la part de l'atelier Niv Création.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 8px;">
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:0 0 18px;text-align:right;font-size:16px;"><strong style="color:${BRAND.gold};">Total : ${fmt(q?.total)}</strong></p>
    ${q?.note ? `<p style="margin:0 0 16px;white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;">${escapeHtml(q.note)}</p>` : ""}
    <p style="margin:0 0 20px;text-align:center;">
      <a href="${link}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;">Voir ${isFacture ? "et régler ma facture" : "et accepter mon devis"}</a>
    </p>
    <p style="margin:0;color:#7a7268;font-size:13px;">${isFacture ? "Vous pouvez régler en ligne en toute sécurité par carte bancaire." : "Devis valable 30 jours. La fabrication démarre après acceptation et paiement."} Une question ? Répondez simplement à cet e-mail.<br>L'atelier Niv Création</p>`;
  return {
    subject: `Votre ${titre}${q?.number ? ` ${q.number}` : ""} — Niv Création`,
    html: emailLayout({ heading: `Votre ${titre}`, bodyHtml: body }),
  };
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
    <p style="background:${BRAND.cream};padding:14px;border-radius:10px;border:1px solid #ece3d2;margin-top:18px;">Nous vous tiendrons au courant de l'expédition. Pour toute question, répondez simplement à cet e-mail.</p>
    <p style="color:#7a7268;font-size:14px;margin-top:16px;">Avec toute notre gratitude,<br><strong>L'atelier Niv Création</strong></p>`;
  return emailLayout({ heading: "Merci pour votre commande", bodyHtml: body });
}
