// =============================================================================
// Envoi d'un e-mail à une cliente : Gmail en priorité (fonctionne vers toute
// adresse, sans domaine vérifié), Resend en secours. Réutilisé par l'aperçu,
// le CRM, les messages programmés et les règles automatiques.
// =============================================================================
import { getGmailCreds } from "@/lib/stock";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";

// Construit un e-mail de marque à partir d'un sujet + d'un corps en texte simple.
// extraHtml (optionnel) : bloc HTML déjà sûr inséré APRÈS le texte — sert aux
// boutons d'action (ex. « ★ Noter » de la règle d'avis automatique).
export function brandedMessage(subject, body, extraHtml = "") {
  const html = emailLayout({
    heading: escapeHtml(subject || "Un message de Niv Création"),
    bodyHtml: `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(body || "")}</div>
      ${extraHtml || ""}
      <p style="margin-top:18px;color:#7a7268;">Niv Création</p>`,
  });
  return html;
}

// Boutons « ★ Noter » vers la section avis de chaque produit ([{slug, name}]).
// Partagé entre la règle d'avis automatique (jobs.js) et l'envoi admin.
export function boutonsAvis(items) {
  const seen = new Set();
  const produits = (items || []).filter((it) => {
    if (!it?.slug || seen.has(it.slug)) return false;
    seen.add(it.slug);
    return true;
  });
  if (!produits.length) return "";
  const btns = produits.map((it) =>
    `<a href="${BRAND.siteUrl}/produit/${encodeURIComponent(it.slug)}#avis" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:bold;margin:0 8px 10px 0;">★ Noter « ${escapeHtml(String(it.name || "ce produit").slice(0, 40))} »</a>`
  ).join("");
  return `<p style="margin:14px 0 0;">${btns}</p>`;
}

export async function sendClientMail({ to, subject, html, bcc = BRAND.contact, thread = null }) {
  const dest = String(to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest)) return { ok: false, error: "Adresse invalide." };
  // 1) Gmail
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      const token = await gmailAccessToken(creds);
      await gmailSendHtml(token, { to: dest, subject, html, bcc, threadId: thread?.threadId, inReplyTo: thread?.messageId, references: thread?.references });
      return { ok: true, via: "gmail" };
    }
  } catch (e) { /* on tente Resend */ }
  // 2) Resend
  if (process.env.RESEND_API_KEY) {
    const r = await sendEmail({ to: dest, subject, html, replyTo: BRAND.contact, bcc });
    if (r?.ok) return { ok: true, via: "resend" };
    return { ok: false, error: r?.error || "Envoi refusé." };
  }
  return { ok: false, error: "Aucun service e-mail disponible (Gmail non connecté, Resend absent)." };
}
