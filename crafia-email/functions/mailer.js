// =============================================================================
// Transport d'envoi (nodemailer) — UN SEUL endroit à configurer.
// -----------------------------------------------------------------------------
// Fonctionne avec n'importe quel SMTP : crafia.fr, Brevo ou Gmail.
// Tu ne changes QUE les variables d'environnement (functions/.env) :
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM
// Voir .env.example pour les réglages des 3 fournisseurs.
// =============================================================================

const nodemailer = require("nodemailer");

let transporter = null;

function getTransport() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  // secure=true pour le port 465 (SSL), false pour 587 (STARTTLS).
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Configuration SMTP incomplète : renseignez SMTP_HOST, SMTP_USER et SMTP_PASS dans functions/.env"
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

// Expéditeur affiché. Doit correspondre à une adresse autorisée par ton SMTP
// (ex. "Crafia <support@crafia.fr>").
function fromAddress() {
  return process.env.MAIL_FROM || "Crafia <support@crafia.fr>";
}

// Envoie un email. mail = { to, subject, html, text }
async function sendMail(mail) {
  const tx = getTransport();
  return tx.sendMail({
    from: fromAddress(),
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    replyTo: process.env.MAIL_REPLY_TO || "support@crafia.fr",
  });
}

module.exports = { getTransport, sendMail, fromAddress };
