import { isAdmin, getSubscribers, getSubscribersDetailed, getBirthdays, getGmailCreds } from "@/lib/stock";
import { emailLayout, escapeHtml, newsletterProductsEmail } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { getCatalog, priceFrom } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const euro = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace(".", ",") + " €";

// Abonnées + liste de produits (pour le sélecteur de nouveautés).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
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
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
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
      image: (p.images || [])[0] || "",
      url: `/produit/${p.slug}`,
    }));
    if (!products.length) return Response.json({ error: "Aucun produit valide sélectionné." }, { status: 400 });
    ({ html } = newsletterProductsEmail({ subject, intro, products }));
  } else {
    if (!message) return Response.json({ error: "Écris un message ou choisis des produits." }, { status: 400 });
    const bodyHtml = `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      <p style="margin-top:20px;"><a href="https://nivcreation.fr" style="color:#a98935;">Voir la boutique →</a></p>`;
    html = emailLayout({ heading: subject, bodyHtml });
  }

  // Envoi de masse : on récupère le jeton Gmail UNE SEULE fois (bien plus rapide
  // et fiable que de le refaire à chaque e-mail — évite les timeouts). Repli
  // Resend par e-mail si Gmail n'est pas connecté.
  let sent = 0, failed = 0;
  let gmailToken = null;
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) gmailToken = await gmailAccessToken(creds);
  } catch { gmailToken = null; }

  for (const to of subs) {
    try {
      if (gmailToken) {
        await gmailSendHtml(gmailToken, { to, subject, html, bcc: "" });
        sent++;
      } else {
        const r = await sendClientMail({ to, subject, html, bcc: "" });
        if (r?.ok) sent++; else failed++;
      }
    } catch { failed++; }
  }
  return Response.json({ ok: true, sent, total: subs.length, failed });
}
