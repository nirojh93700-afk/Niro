// Réception des messages du formulaire de contact.
// Envoi de l'e-mail via Resend (https://resend.com) si configuré.
// Variables d'environnement nécessaires (voir .env.example) :
//   RESEND_API_KEY  -> ta clé API Resend
//   CONTACT_EMAIL   -> l'adresse qui reçoit les messages (ex : contact.nivcreation@gmail.com)
//   CONTACT_FROM    -> l'expéditeur vérifié dans Resend (sinon onboarding@resend.dev en test)
//
// AGENT E-MAIL AUTONOME : si la réponse automatique est activée (Réglages →
// Équipe d'agents), l'agent lit le message, rédige une réponse et décide :
//   - cas simple  -> il répond TOUT SEUL à la cliente (copie envoyée à la gérante) ;
//   - cas spécial -> il ne répond pas, il remonte à la gérante « à valider ».

import { getSettings } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml as esc } from "@/lib/email";
import { triageIncomingEmail } from "@/lib/agents/registry";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const phone = String(body?.phone || "").trim();
  const subject = String(body?.subject || "").trim() || "Nouveau message";
  const message = String(body?.message || "").trim();

  if (!name || !email || !message) {
    return Response.json({ error: "Merci de remplir tous les champs obligatoires." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL || "contact.nivcreation@gmail.com";
  const from = process.env.CONTACT_FROM || "Niv Création <onboarding@resend.dev>";

  // Si l'e-mail n'est pas encore configuré, on l'indique clairement.
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Le formulaire n'est pas encore relié à l'e-mail (clé RESEND_API_KEY manquante).",
      },
      { status: 503 }
    );
  }

  // --- Agent e-mail autonome (si activé dans les réglages) -------------------
  let triage = null;
  let autoReplied = false;
  try {
    const settings = await getSettings();
    if (settings?.agents?.emailAutoReply) {
      triage = await triageIncomingEmail({ name, email, subject, message });
      // Cas simple : l'agent répond tout seul à la cliente.
      if (triage?.ok && !triage.needsValidation && triage.reply) {
        const clientHtml = emailLayout({
          heading: "Votre message — Niv Création",
          bodyHtml: `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${esc(triage.reply)}</div>`,
        });
        const sent = await sendEmail({ to: email, subject: triage.subject, html: clientHtml, replyTo: to });
        autoReplied = sent.ok;
      }
    }
  } catch (e) {
    console.error("Agent e-mail (contact) :", e?.message);
    // On n'interrompt jamais : la gérante reçoit le message dans tous les cas.
  }

  // --- Encart « agent » ajouté à la notification de la gérante --------------
  let agentBlock = "";
  if (autoReplied) {
    agentBlock = `
      <div style="margin-top:18px;padding:14px;border-radius:10px;background:#e7f4ea;border:1px solid #bfe3c8;">
        <strong>Réponse automatique envoyée à la cliente</strong>
        <p style="margin:8px 0 0;white-space:pre-line;">${escapeHtml(triage.reply)}</p>
      </div>`;
  } else if (triage?.reply) {
    agentBlock = `
      <div style="margin-top:18px;padding:14px;border-radius:10px;background:#fff5e0;border:1px solid #f0d28a;">
        <strong>À valider — l'agent a préparé une réponse mais préfère ton avis</strong>
        ${triage.reason ? `<p style="margin:6px 0;color:#9a6b00;"><em>${escapeHtml(triage.reason)}</em></p>` : ""}
        <p style="margin:8px 0 0;white-space:pre-line;">${escapeHtml(triage.reply)}</p>
        <p style="margin:10px 0 0;font-size:13px;color:#7a7268;">Pour répondre : ouvre le Centre des agents (Gestion → Équipe d'agents), colle ce message dans l'agent e-mail, ajuste et envoie.</p>
      </div>`;
  }

  const html = `
    <h2>Nouveau message — Niv Création</h2>
    <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
    <p><strong>E-mail :</strong> ${escapeHtml(email)}</p>
    ${phone ? `<p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>` : ""}
    <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message :</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    ${agentBlock}
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Contact site] ${subject}${autoReplied ? " — répondu auto" : triage?.reply ? " — à valider" : ""}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error:", detail);
      return Response.json({ error: "L'envoi a échoué. Réessayez plus tard." }, { status: 502 });
    }

    return Response.json({ ok: true, autoReplied });
  } catch (err) {
    console.error("Contact error:", err);
    return Response.json({ error: "Erreur réseau lors de l'envoi." }, { status: 500 });
  }
}
