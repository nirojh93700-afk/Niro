import { sendEmail, emailLayout, escapeHtml as esc, BRAND } from "@/lib/email";

// =============================================================================
// ALERTE « À VALIDER » ENVOYÉE AU GÉRANT : le message de la cliente, la réponse
// préparée par l'agent, et UN bouton « Relire, modifier et envoyer ».
// Partagée par le formulaire de contact ET la boîte mail surveillée.
// Rien ne part à la cliente d'ici : seul le clic du gérant envoie.
// =============================================================================
export function buildDraftAlertHtml(item, { orderRef = "", reason = "", source = "contact" } = {}) {
  const lien = `${BRAND.siteUrl}/repondre/${item.token}`;
  const boxCream = `white-space:pre-line;background:${BRAND.cream};border:1px solid #ece3d2;border-radius:10px;padding:12px;margin:6px 0 14px;`;
  const boxWhite = `white-space:pre-line;background:#fff;border:1px solid #e6d7b8;border-radius:10px;padding:12px;margin:6px 0 14px;`;
  const origine = source === "gmail" ? "Reçu dans la boîte mail" : "Reçu via le formulaire du site";
  const bodyHtml = `
    <p style="margin:0 0 6px;"><strong>${esc(item.name)}</strong> &lt;${esc(item.email)}&gt;${item.phone ? ` · ${esc(item.phone)}` : ""}</p>
    <p style="margin:0 0 4px;color:#7a7268;">${origine}${orderRef ? ` · commande <strong>#${esc(orderRef)}</strong> (rangé dans son fil)` : ""}</p>
    <p style="margin:0 0 4px;color:#7a7268;">Sujet : ${esc(item.subject || "(sans sujet)")}</p>
    <div style="${boxCream}">${esc(item.message)}</div>
    <p style="margin:0 0 4px;"><strong>Réponse préparée par l'agent</strong>${reason ? ` <span style="color:#9a6b00;">— ${esc(reason)}</span>` : ""}</p>
    ${item.draft
      ? `<div style="${boxWhite}">${esc(item.draft)}</div>`
      : `<p style="color:#9a6b00;">L'agent n'a pas pu préparer de réponse : vous l'écrirez sur la page ci-dessous.</p>`}
    <p style="margin:18px 0 8px;text-align:center;">
      <a href="${lien}" style="display:inline-block;background:${BRAND.gold};color:#fff;text-decoration:none;padding:13px 28px;border-radius:9px;font-weight:bold;">Relire, modifier et envoyer</a>
    </p>
    <p style="margin:0;color:#7a7268;font-size:13px;text-align:center;">Rien ne part à la cliente tant que vous n'avez pas cliqué « Envoyer » sur cette page. Vous pouvez y modifier le texte avant.</p>`;
  return emailLayout({ heading: "À valider — réponse à une cliente", bodyHtml });
}

export async function sendDraftAlert(item, opts = {}) {
  const html = buildDraftAlertHtml(item, opts);
  const ref = opts.orderRef ? ` #${opts.orderRef}` : "";
  return sendEmail({
    to: BRAND.contact,
    subject: `[À valider] ${item.name}${ref} — ${item.subject || "message"}`,
    html,
    replyTo: item.email,
  });
}
