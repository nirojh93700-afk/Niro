import { getReplyLink, recordReplyLinkUse, logComm, ensureCommThread, batImportEmails, getGmailCreds } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Bouton « Répondre » des e-mails clients (maquette validée le 15/09/2026).
// GET = infos affichées sur la page /reponse/<jeton> ; POST = la réponse de la
// cliente → rangée dans son DOSSIER (logComm) + fil de sa commande (pastille
// « nouvelle réponse ») + UNE alerte au gérant. AUCUN e-mail à la cliente.
export async function GET(_req, { params }) {
  const it = await getReplyLink(params.token);
  if (!it) return Response.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  return Response.json({
    link: { name: it.name, orderRef: it.orderRef || "", subject: it.subject || "", excerpt: it.excerpt || "", at: it.at },
  });
}

export async function POST(req, { params }) {
  const it = await getReplyLink(params.token);
  if (!it) return Response.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  // Garde-fou : au-delà de 10 messages sur le même lien, on renvoie vers l'e-mail.
  if ((it.replies || 0) >= 10) {
    return Response.json({ error: "Ce lien a déjà beaucoup servi — répondez simplement à notre e-mail." }, { status: 429 });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  // Pas de limite de longueur pour la cliente (demande du gérant, 15/09) —
  // seul un plafond technique très haut protège la base contre un abus.
  const text = String(body?.text || "").trim().slice(0, 100000);
  if (text.length < 2) return Response.json({ error: "Écrivez votre message avant d'envoyer." }, { status: 400 });

  // 1) Dossier de communication de la cliente (toujours).
  try {
    await logComm({
      email: it.email, name: it.name, from: "cliente", text,
      subject: `Re : ${it.subject || "votre message"}`, via: "bouton",
      orderId: it.orderId || "", orderRef: it.orderRef || "",
    });
  } catch { /* jamais bloquant */ }

  // 2) Fil de sa commande → pastille « 📬 nouvelle réponse » dans Gestion.
  if (it.orderId) {
    try {
      await ensureCommThread(it.orderId, { ref: it.orderRef || "", customerEmail: it.email, customerName: it.name });
      await batImportEmails(it.orderId, [{ gmailId: `bouton-${params.token}-${Date.now()}`, text, at: Date.now() }]);
    } catch { /* jamais bloquant */ }
  }
  try { await recordReplyLinkUse(params.token); } catch { /* ignore */ }

  // 3) UNE alerte au gérant (reply-to = la cliente). Gmail d'abord, Resend en secours.
  const alertHtml = emailLayout({
    heading: "Réponse d'une cliente (bouton Répondre)",
    bodyHtml: `<p style="margin:0 0 10px;"><strong>${escapeHtml(it.name || it.email)}</strong> &lt;${escapeHtml(it.email)}&gt;${it.orderRef ? ` · commande #${escapeHtml(it.orderRef)}` : ""}</p>
      <p style="margin:0 0 12px;color:#7a7268;">En réponse à : ${escapeHtml(it.subject || "votre message")}</p>
      <div style="white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;">${escapeHtml(text)}</div>
      <p style="margin:14px 0 0;color:#7a7268;">Rangée dans son dossier${it.orderRef ? " et dans le fil de sa commande" : ""}. Répondez depuis Gestion → Clients (« Écrire à ce client ») ou depuis la commande.</p>`,
  });
  const subject = `📬 Réponse de ${it.name || it.email}${it.orderRef ? ` — #${it.orderRef}` : ""}`;
  let alerted = false;
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      const tok = await gmailAccessToken(creds);
      await gmailSendHtml(tok, { to: BRAND.contact, subject, html: alertHtml });
      alerted = true;
    }
  } catch { /* on tente Resend */ }
  if (!alerted) {
    try { await sendEmail({ to: BRAND.contact, subject, html: alertHtml, replyTo: it.email }); } catch { /* la réponse est déjà rangée */ }
  }

  return Response.json({ ok: true });
}
