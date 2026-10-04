import { getReplyLink, recordReplyLinkUse, logComm, ensureCommThread, batImportEmails, getGmailCreds, recordProspectReply, addPendingReply, getSettings } from "@/lib/stock";
import { triageIncomingEmail } from "@/lib/agents/registry";
import { sendDraftAlert } from "@/lib/replyAlert";
import { buildContext } from "@/lib/inbox";
import { getSiteOrders } from "@/lib/firebase";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { envoyerAlerteAdmin } from "@/lib/pushAdmin";

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

  // 1 bis) Restaurant / bar démarché ? → rangé dans « Restaurants & bars »
  // (statut « A répondu », ou « Ne plus contacter » s'il écrit STOP).
  let prospect = null;
  try { prospect = await recordProspectReply({ email: it.email, text, via: "bouton" }); } catch { prospect = null; }

  // 2) Fil de sa commande → pastille « 📬 nouvelle réponse » dans Gestion.
  if (it.orderId) {
    try {
      await ensureCommThread(it.orderId, { ref: it.orderRef || "", customerEmail: it.email, customerName: it.name });
      await batImportEmails(it.orderId, [{ gmailId: `bouton-${params.token}-${Date.now()}`, text, at: Date.now() }]);
    } catch { /* jamais bloquant */ }
  }
  try { await recordReplyLinkUse(params.token); } catch { /* ignore */ }

  // 2 bis) « Il prépare, le gérant décide » (04/10/2026) : une réponse par le bouton passait
  // SEULEMENT par l'alerte « 📬 Réponse de… » — l'agent n'était jamais appelé (la boîte mail
  // surveillée ignore nos propres alertes). Maintenant l'agent prépare une réponse à valider
  // + l'alerte « [À valider] » avec le bouton « Relire, modifier et envoyer ». Rien ne part
  // à la cliente. Pas pour les restaurants / bars démarchés (leur écran dédié les gère).
  let drafted = false;
  if (!prospect) {
    try {
      const settings = await getSettings().catch(() => ({}));
      if (settings?.agents?.emailDraft !== false) {
        let order = null;
        try {
          if (it.orderId) order = (await getSiteOrders(300)).find((o) => o.id === it.orderId) || null;
        } catch { order = null; }
        let draft = null;
        try {
          const context = await buildContext(order, String(it.email || "").toLowerCase());
          draft = await triageIncomingEmail({ name: it.name || it.email, email: it.email, subject: it.subject || "", message: text, context });
        } catch { draft = null; }
        const item = await addPendingReply({
          name: it.name || it.email, email: it.email, subject: it.subject || "", message: text,
          draft: draft?.reply || "", draftSubject: draft?.subject || (it.subject ? `Re : ${String(it.subject).replace(/^re\s*:\s*/i, "")}` : "Votre message — Niv Création"),
          reason: draft?.reason || "",
          orderId: it.orderId || "", orderRef: it.orderRef || "", source: "bouton",
        });
        if (item) {
          await sendDraftAlert(item, { orderRef: it.orderRef || "", reason: draft?.reason || "", source: "bouton" });
          drafted = true;
        }
      }
    } catch { drafted = false; /* repli : l'alerte « 📬 » ci-dessous part quand même */ }
  }
  if (drafted) return Response.json({ ok: true });

  // 3) UNE alerte au gérant (reply-to = la cliente). Gmail d'abord, Resend en secours.
  const alertHtml = emailLayout({
    heading: prospect ? (prospect.stop ? "Un restaurant / bar demande à ne plus être contacté (STOP)" : "Réponse d'un restaurant / bar (prospection)") : "Réponse d'une cliente (bouton Répondre)",
    bodyHtml: `<p style="margin:0 0 10px;"><strong>${escapeHtml(it.name || it.email)}</strong> &lt;${escapeHtml(it.email)}&gt;${it.orderRef ? ` · commande #${escapeHtml(it.orderRef)}` : ""}</p>
      <p style="margin:0 0 12px;color:#7a7268;">En réponse à : ${escapeHtml(it.subject || "votre message")}</p>
      <div style="white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;">${escapeHtml(text)}</div>
      ${prospect ? `<p style="margin:14px 0 0;color:#7a7268;">Rangée dans Gestion → Clients → Restaurants &amp; bars.${prospect.stop ? " Statut passé à « Ne plus contacter » : aucun e-mail ne pourra plus lui être envoyé." : ""}</p>` : ""}<p style="margin:14px 0 0;color:#7a7268;">Rangée dans son dossier${it.orderRef ? " et dans le fil de sa commande" : ""}. Répondez depuis Gestion → Clients (« Écrire à ce client ») ou depuis la commande.</p>`,
  });
  const subject = `${prospect ? "🍸 Restaurant / bar — réponse" : "📬 Réponse"} de ${it.name || it.email}${it.orderRef ? ` — #${it.orderRef}` : ""}`;
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

  // 🔔 Alerte sur le téléphone du gérant (02/10/2026).
  try {
    await envoyerAlerteAdmin({
      title: `${prospect ? "🍸 Réponse d'un restaurant" : "📬 Réponse"} de ${it.name || it.email}`,
      body: `${it.orderRef ? `#${it.orderRef} · ` : ""}${text.slice(0, 160)}`,
      url: it.orderRef ? `/gestion/commandes?q=${encodeURIComponent(it.orderRef)}` : (prospect ? "/gestion/restaurants" : "/gestion/messages"),
      tag: `reponse-${it.email}`,
    });
  } catch { /* jamais bloquant */ }

  return Response.json({ ok: true });
}
