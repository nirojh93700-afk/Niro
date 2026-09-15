import { isAdmin, getGmailCreds , logComm, addReplyLink } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";
import { boutonsAvis } from "@/lib/clientMail";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { getSiteOrders } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Envoie un e-mail à une cliente depuis l'admin (avec l'e-mail du site, à ton image).
// Priorité Gmail (marche vers toute adresse, sans domaine vérifié), Resend en secours.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const to = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse invalide." }, { status: 400 });
  if (!subject || !message) return Response.json({ error: "Sujet et message obligatoires." }, { status: 400 });

  // avisProduits (optionnel) : [{slug, name}] → boutons « ★ Noter » vers la
  // section avis de chaque produit (même rendu que la règle d'avis automatique).
  const boutons = Array.isArray(body?.avisProduits) ? boutonsAvis(body.avisProduits.slice(0, 6)) : "";
  // imageUrl (optionnel) : visuel/aperçu à afficher DANS l'e-mail (ex. montage
  // gravure), URL absolue déjà hébergée (via /api/upload). Ajouté 01/09/2026.
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Aperçu" style="display:block;width:100%;max-width:520px;height:auto;border-radius:10px;border:1px solid #ece3d2;margin:0 0 16px;">`
    : "";
  // Bouton « Répondre » (appliqué le 15/09/2026, maquette validée) : jeton de
  // 30 jours → page /reponse/<jeton> → la réponse revient dans le DOSSIER de la
  // cliente et le fil de sa commande. Jamais bloquant : sans jeton, l'e-mail
  // part quand même (et la boîte surveillée rattrape les réponses classiques).
  let replyBtn = "";
  try {
    let order = null;
    try {
      const orders = (await getSiteOrders(300)).filter((o) => !o.test);
      for (const o of orders) {
        if (String(o.customerEmail || "").toLowerCase() !== to.toLowerCase()) continue;
        if (!order || Date.parse(o.createdAt || 0) > Date.parse(order.createdAt || 0)) order = o;
      }
    } catch { /* sans commande : le bouton marche quand même */ }
    const token = await addReplyLink({
      email: to, name: order?.customerName || "", subject,
      excerpt: message.slice(0, 240), orderId: order?.id || "", orderRef: order?.ref || "",
    });
    if (token) {
      replyBtn = `<p style="margin:22px 0 6px;text-align:center;">
        <a href="${BRAND.siteUrl}/reponse/${token}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:bold;">✉️ Répondre à ce message</a></p>
      <p style="margin:0;text-align:center;color:#8a7a56;font-size:12px;">Votre réponse arrive directement dans votre dossier — pas besoin d'écrire un e-mail.</p>`;
    }
  } catch { /* jamais bloquant */ }

  const html = emailLayout({
    heading: subject,
    bodyHtml: `${imageHtml}<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      ${boutons}
      ${replyBtn}
      <p style="margin-top:18px;color:#7a7268;">Niv Création</p>`,
  });

  // 1) Gmail en priorité.
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      const token = await gmailAccessToken(creds);
      await gmailSendHtml(token, { to, subject, html, bcc: BRAND.contact });
      try { await logComm({ email: to, from: "nous", text: message, subject, via: "gmail" }); } catch { /* ignore */ }
      return Response.json({ ok: true, via: "gmail" });
    }
  } catch { /* on tente Resend */ }

  // 2) Secours Resend.
  if (process.env.RESEND_API_KEY) {
    const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact, bcc: BRAND.contact });
    if (r.ok) { try { await logComm({ email: to, from: "nous", text: message, subject, via: "resend" }); } catch { /* ignore */ } return Response.json({ ok: true, via: "resend" }); }
  }
  return Response.json({ error: "Échec de l'envoi (Gmail non connecté et Resend indisponible)." }, { status: 500 });
}
