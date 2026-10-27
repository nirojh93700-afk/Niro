import { isAdmin, getSubscribers, getSubscribersDetailed, getBirthdays, getGmailCreds, startEmailCampaign } from "@/lib/stock";
import { addTracking } from "@/lib/emailTrack";
import { BRAND, emailLayout, escapeHtml, newsletterProductsEmail } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { getCatalog, priceFrom } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

// Abonnées + liste de produits (pour le sélecteur de nouveautés).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const subs = await getSubscribersDetailed();
  const birthdays = await getBirthdays();
  let products = [];
  try {
    products = (await getCatalog()).map((p) => ({
      slug: p.slug,
      name: p.name,
      image: (p.images || [])[0] || "",
      price: euro(priceFrom(p)),
      category: p.category || "",
    }));
  } catch { /* ignore */ }
  return Response.json({ count: subs.length, subscribers: subs, birthdays, products });
}

// Envoi d'une campagne à toutes les abonnées.
//  - avec productSlugs → e-mail « Nouveautés » riche (cartes + photos)
//  - sinon → message texte simple (comme avant)
export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  const intro = String(body?.intro || "").trim();
  const slugs = Array.isArray(body?.productSlugs) ? body.productSlugs.slice(0, 8) : [];

  if (!subject) return Response.json({ error: "Sujet obligatoire." }, { status: 400 });

  const allSubs = await getSubscribers();
  // Destinataires : soit une SÉLECTION envoyée par l'admin (recipients), soit
  // toutes les abonnées. On ne garde que des e-mails valides.
  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const picked = Array.isArray(body?.recipients)
    ? body.recipients.map((e) => String(e || "").trim().toLowerCase()).filter((e) => rx.test(e))
    : null;
  const subs = (picked && picked.length) ? [...new Set(picked)] : allSubs;
  if (!subs.length) return Response.json({ error: "Aucun destinataire." }, { status: 400 });

  let html;
  if (slugs.length) {
    // Mode « Nouveautés » : on construit les cartes produits depuis le catalogue.
    const catalog = await getCatalog();
    const bySlug = Object.fromEntries(catalog.map((p) => [p.slug, p]));
    const products = slugs.map((s) => bySlug[s]).filter(Boolean).map((p) => ({
      name: p.name,
      tagline: p.tagline || "",
      price: euro(priceFrom(p)),
      // Photo choisie pour l'e-mail (ex. un exemple GRAVÉ plutôt que la photo vierge du fournisseur), sinon la 1re photo.
      image: (body?.productImages && typeof body.productImages[p.slug] === "string" && body.productImages[p.slug].startsWith("/")) ? body.productImages[p.slug] : ((p.images || [])[0] || ""),
      url: `/produit/${p.slug}`,
      cta: p.personalizable === false ? "Découvrir" : "Personnaliser", // un produit non gravé ne se « personnalise » pas
    }));
    if (!products.length) return Response.json({ error: "Aucun produit valide sélectionné." }, { status: 400 });
    ({ html } = newsletterProductsEmail({ subject, intro, heading: String(body?.heading || "").trim(), products }));
  } else {
    if (!message) return Response.json({ error: "Écris un message ou choisis des produits." }, { status: 400 });
    const bodyHtml = `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      <p style="margin-top:20px;"><a href="https://nivcreation.fr" style="color:#a98935;">Voir la boutique →</a></p>`;
    html = emailLayout({ heading: subject, bodyHtml });
  }

  // Envoi de masse : on récupère le jeton Gmail UNE SEULE fois (bien plus rapide
  // et fiable que de le refaire à chaque e-mail — évite les timeouts). Repli
  // Resend par e-mail si Gmail n'est pas connecté.
  // Suivi des ouvertures et des clics : une campagne = un identifiant, et un
  // jeton par destinataire (pixel + liens tracés). Si l'enregistrement échoue,
  // on envoie quand même : les statistiques ne doivent jamais bloquer un envoi.
  let campaignId = "";
  try {
    campaignId = `c${Date.now().toString(36)}`;
    await startEmailCampaign(campaignId, { subject, recipients: subs });
  } catch { campaignId = ""; }

  let sent = 0, failed = 0;
  const echecs = []; // adresses où l'envoi a échoué (récapitulatif au gérant)
  let gmailToken = null;
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) gmailToken = await gmailAccessToken(creds);
  } catch { gmailToken = null; }

  for (const to of subs) {
    // Chaque destinataire reçoit sa propre version : le pixel et les liens
    // portent son jeton, sinon on ne saurait pas QUI a ouvert ou cliqué.
    const perso = campaignId ? addTracking(html, campaignId, to) : html;
    try {
      if (gmailToken) {
        await gmailSendHtml(gmailToken, { to, subject, html: perso, bcc: "" });
        sent++;
      } else {
        const r = await sendClientMail({ to, subject, html: perso, bcc: "" });
        if (r?.ok) sent++; else { failed++; echecs.push(to); }
      }
    } catch { failed++; echecs.push(to); }
  }
  // UN SEUL récapitulatif au gérant à la fin (27/10/2026, gérant : « je reçois pas 30 accusés… un accusé en disant tout est
  // envoyé ou pas »). Aucune copie par destinataire (bcc vide ci-dessus). Un envoi de test à une seule adresse n'en fait pas.
  if (subs.length > 1) {
    try {
      const recap = `<p style="margin:0 0 12px;">Campagne « ${escapeHtml(subject)} » :</p>
        <p style="margin:0 0 12px;font-size:18px;"><strong>${failed ? "⚠️" : "✓"} ${sent} envoyé${sent > 1 ? "s" : ""} sur ${subs.length}</strong>${failed ? ` · ${failed} échec${failed > 1 ? "s" : ""}` : " — tout est parti."}</p>
        ${echecs.length ? `<p style="margin:0 0 6px;">Adresses non servies :</p><ul style="margin:0 0 12px;">${echecs.slice(0, 50).map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>` : ""}
        <p style="margin:0;color:#7a7268;">Ouvertures et clics : Gestion → Marketing → Newsletter.</p>`;
      await sendClientMail({ to: BRAND.contact, subject: `${failed ? "⚠️" : "✓"} Newsletter envoyée : ${sent}/${subs.length}`, html: emailLayout({ heading: "Récapitulatif d'envoi", bodyHtml: recap }), bcc: "" });
    } catch { /* le récapitulatif ne doit jamais faire échouer la campagne */ }
  }
  return Response.json({ ok: true, sent, total: subs.length, failed, campaignId });
}
