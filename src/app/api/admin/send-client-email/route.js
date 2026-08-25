import { isAdmin, getGmailCreds } from "@/lib/stock";
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
  const html = emailLayout({
    heading: subject,
    bodyHtml: `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      ${boutons}
      <p style="margin-top:18px;color:#7a7268;">Niv Création</p>`,
  });

  // 1) Gmail en priorité.
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      const token = await gmailAccessToken(creds);
      await gmailSendHtml(token, { to, subject, html, bcc: BRAND.contact });
      return Response.json({ ok: true, via: "gmail" });
    }
  } catch { /* on tente Resend */ }

  // 2) Secours Resend.
  if (process.env.RESEND_API_KEY) {
    const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact, bcc: BRAND.contact });
    if (r.ok) return Response.json({ ok: true, via: "resend" });
  }
  return Response.json({ error: "Échec de l'envoi (Gmail non connecté et Resend indisponible)." }, { status: 500 });
}
