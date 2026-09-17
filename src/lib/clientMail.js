// =============================================================================
// Envoi d'un e-mail à une cliente : Gmail en priorité (fonctionne vers toute
// adresse, sans domaine vérifié), Resend en secours. Réutilisé par l'aperçu,
// le CRM, les messages programmés et les règles automatiques.
// =============================================================================
import { getGmailCreds, addReplyLink } from "@/lib/stock";
import { gmailAccessToken, gmailSendHtml } from "@/lib/gmail";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";

// Bouton « ✉️ Répondre à ce message » (règle du gérant, 17/09/2026 : TOUT e-mail
// envoyé à une cliente par le site doit le porter). Jeton 30 jours → page
// /reponse/<jeton> → la réponse est rangée dans le dossier de la cliente et le
// fil de sa commande. Jamais bloquant : en cas de pépin, renvoie "" et l'e-mail
// part sans bouton (la boîte surveillée rattrape les réponses classiques).
export async function boutonRepondre({ email, name = "", subject = "", excerpt = "", orderId = "", orderRef = "" }) {
  try {
    const token = await addReplyLink({ email, name, subject, excerpt, orderId, orderRef });
    if (!token) return "";
    return `<p style="margin:22px 0 6px;text-align:center;">
      <a href="${BRAND.siteUrl}/reponse/${token}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:bold;">✉️ Répondre à ce message</a></p>
    <p style="margin:0;text-align:center;color:#8a7a56;font-size:12px;">Votre réponse arrive directement dans votre dossier — pas besoin d'écrire un e-mail.</p>`;
  } catch { return ""; }
}

// Construit un e-mail de marque à partir d'un sujet + d'un corps en texte simple.
// extraHtml (optionnel) : bloc HTML déjà sûr inséré APRÈS le texte — sert aux
// boutons d'action (ex. « ★ Noter » de la règle d'avis automatique).
// topHtml (optionnel) : bloc HTML déjà sûr inséré AVANT le texte (ex. image).
export function brandedMessage(subject, body, extraHtml = "", topHtml = "") {
  const html = emailLayout({
    heading: escapeHtml(subject || "Un message de Niv Création"),
    bodyHtml: `${topHtml || ""}<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(body || "")}</div>
      ${extraHtml || ""}
      <p style="margin-top:18px;color:#7a7268;">Niv Création</p>`,
  });
  return html;
}

// Image affichée en haut d'un e-mail de marque (adresse déjà hébergée).
export function imageEnTete(imageUrl) {
  let u = String(imageUrl || "").trim();
  if (!u) return "";
  if (u.startsWith("/")) u = BRAND.siteUrl + u; // adresse relative → absolue (obligatoire dans un e-mail)
  return `<img src="${escapeHtml(u)}" alt="Aperçu" style="display:block;width:100%;max-width:520px;height:auto;border-radius:10px;border:1px solid #ece3d2;margin:0 0 16px;">`;
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
