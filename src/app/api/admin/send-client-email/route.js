import { isAdmin, getGmailCreds , logComm } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";
import { boutonsAvis } from "@/lib/clientMail";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";

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
  const html = emailLayout({
    heading: subject,
    bodyHtml: `${imageHtml}<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      ${boutons}
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
