// =============================================================================
// Contenus des emails Crafia (français) — un template par type.
// -----------------------------------------------------------------------------
// Chaque fonction renvoie { subject, html, text }.
//  - html : version riche (gabarit Crafia)
//  - text : version texte brut (repli pour les clients sans HTML)
// =============================================================================

const { BRAND, renderEmail, esc } = require("./layout");

// Salutation : "Bonjour Prénom," ou "Bonjour," si pas de nom.
function hello(displayName) {
  const name = (displayName || "").trim();
  return name ? `Bonjour ${esc(name)},` : "Bonjour,";
}

// Version texte brut simple (à partir des éléments clés).
function plain({ title, lines, ctaLabel, ctaUrl }) {
  const parts = [`${BRAND.name}`, "", title, "", ...lines];
  if (ctaLabel && ctaUrl) parts.push("", `${ctaLabel} : ${ctaUrl}`);
  parts.push(
    "",
    "—",
    `Une question ? ${BRAND.supportEmail}`,
    `${BRAND.siteUrl}`
  );
  return parts.join("\n");
}

// --- 1. Réinitialisation du mot de passe ------------------------------------
function passwordReset({ link, displayName }) {
  const subject = "Réinitialisez votre mot de passe Crafia";
  const greeting = hello(displayName);
  const paragraphs = [
    "Vous avez demandé à réinitialiser le mot de passe de votre compte Crafia. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.",
    "Pour votre sécurité, ce lien expire dans <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.",
  ];
  const html = renderEmail({
    title: "Réinitialisation de votre mot de passe",
    preheader: "Choisissez un nouveau mot de passe pour votre compte Crafia.",
    greeting,
    paragraphs,
    ctaLabel: "Choisir un nouveau mot de passe",
    ctaUrl: link,
    footerNote:
      "Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement cet email : votre mot de passe actuel reste inchangé.",
  });
  const text = plain({
    title: "Réinitialisation de votre mot de passe",
    lines: [
      greeting.replace(/<[^>]+>/g, ""),
      "",
      "Vous avez demandé à réinitialiser le mot de passe de votre compte Crafia.",
      "Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.",
    ],
    ctaLabel: "Choisir un nouveau mot de passe",
    ctaUrl: link,
  });
  return { subject, html, text };
}

// --- 2. Vérification de l'adresse email -------------------------------------
function emailVerification({ link, displayName }) {
  const subject = "Confirmez votre adresse email — Crafia";
  const greeting = hello(displayName);
  const paragraphs = [
    "Bienvenue chez Crafia&nbsp;! Il ne reste qu'une étape : confirmer votre adresse email pour activer pleinement votre compte.",
    "Cliquez sur le bouton ci-dessous pour valider votre inscription.",
  ];
  const html = renderEmail({
    title: "Confirmez votre adresse email",
    preheader: "Une dernière étape pour activer votre compte Crafia.",
    greeting,
    paragraphs,
    ctaLabel: "Confirmer mon adresse",
    ctaUrl: link,
    footerNote:
      "Si vous n'avez pas créé de compte Crafia, vous pouvez ignorer cet email.",
  });
  const text = plain({
    title: "Confirmez votre adresse email",
    lines: [
      greeting.replace(/<[^>]+>/g, ""),
      "",
      "Bienvenue chez Crafia ! Confirmez votre adresse email pour activer votre compte.",
    ],
    ctaLabel: "Confirmer mon adresse",
    ctaUrl: link,
  });
  return { subject, html, text };
}

// --- 3. Récupération d'email (recoverEmail) ---------------------------------
// Envoyé quand l'adresse d'un compte a été modifiée : on prévient l'ancienne.
function recoverEmail({ link, displayName }) {
  const subject = "Votre adresse email Crafia a été modifiée";
  const greeting = hello(displayName);
  const paragraphs = [
    "L'adresse email associée à votre compte Crafia vient d'être modifiée.",
    "Si vous êtes à l'origine de ce changement, aucune action n'est nécessaire. Dans le cas contraire, cliquez ci-dessous pour rétablir votre adresse et sécuriser votre compte.",
  ];
  const html = renderEmail({
    title: "Modification de votre adresse email",
    preheader: "L'adresse email de votre compte Crafia a changé.",
    greeting,
    paragraphs,
    ctaLabel: "Rétablir mon adresse",
    ctaUrl: link,
    footerNote:
      "Par précaution, nous vous conseillons aussi de réinitialiser votre mot de passe.",
  });
  const text = plain({
    title: "Modification de votre adresse email",
    lines: [
      greeting.replace(/<[^>]+>/g, ""),
      "",
      "L'adresse email de votre compte Crafia a été modifiée.",
      "Si ce n'est pas vous, utilisez le lien ci-dessous pour la rétablir.",
    ],
    ctaLabel: "Rétablir mon adresse",
    ctaUrl: link,
  });
  return { subject, html, text };
}

// =============================================================================
// STRUCTURE PRÉ-CÂBLÉE pour les futurs emails (essai / abonnement).
// Le design est prêt ; il restera à brancher l'envoi sur tes données Stripe.
// =============================================================================

// --- 4. Rappel de fin d'essai (J-3, J-1, J0) --------------------------------
function trialReminder({ displayName, daysLeft, ctaUrl }) {
  const url = ctaUrl || BRAND.appUrl;
  const greeting = hello(displayName);
  let title, lead, sub, subject;
  if (daysLeft >= 3) {
    subject = "Votre essai Crafia se termine dans 3 jours";
    title = "Plus que 3 jours d'essai";
    lead =
      "Votre période d'essai gratuite Crafia se termine dans <strong>3 jours</strong>. Nous espérons qu'elle vous plaît&nbsp;!";
    sub = "Activez votre abonnement dès maintenant pour ne rien perdre de vos créations.";
  } else if (daysLeft === 1) {
    subject = "Dernier jour : votre essai Crafia se termine demain";
    title = "Votre essai se termine demain";
    lead =
      "Il ne reste plus qu'<strong>un jour</strong> d'essai gratuit. Pour continuer sans interruption, activez votre abonnement.";
    sub = "Vos créations et vos réglages restent intacts.";
  } else {
    subject = "Votre essai Crafia se termine aujourd'hui";
    title = "Dernier jour d'essai";
    lead =
      "Votre période d'essai gratuite se termine <strong>aujourd'hui</strong>.";
    sub = "Activez votre abonnement pour garder l'accès à toutes les fonctionnalités.";
  }
  const html = renderEmail({
    title,
    preheader: subject,
    greeting,
    paragraphs: [lead, sub],
    ctaLabel: "Activer mon abonnement",
    ctaUrl: url,
    footerNote:
      "Vous pouvez gérer votre abonnement à tout moment depuis votre espace Crafia.",
  });
  const text = plain({
    title,
    lines: [greeting.replace(/<[^>]+>/g, ""), "", lead.replace(/<[^>]+>/g, ""), sub],
    ctaLabel: "Activer mon abonnement",
    ctaUrl: url,
  });
  return { subject, html, text };
}

// --- 5. Confirmation d'abonnement -------------------------------------------
function subscriptionConfirmation({ displayName, planLabel, ctaUrl }) {
  const url = ctaUrl || BRAND.appUrl;
  const greeting = hello(displayName);
  const subject = "Bienvenue dans l'aventure Crafia — abonnement confirmé";
  const html = renderEmail({
    title: "Votre abonnement est actif",
    preheader: "Merci de votre confiance. Votre abonnement Crafia est confirmé.",
    greeting,
    paragraphs: [
      "Merci&nbsp;! Votre abonnement Crafia <strong>" +
        esc(planLabel || "") +
        "</strong> est désormais actif.",
      "Vous avez accès à l'ensemble des fonctionnalités. Retrouvez vos créations dans votre espace.",
    ],
    ctaLabel: "Accéder à mon espace",
    ctaUrl: url,
    footerNote:
      "Un reçu détaillé vous est envoyé séparément. Pour toute question de facturation, écrivez-nous.",
  });
  const text = plain({
    title: "Votre abonnement est actif",
    lines: [
      greeting.replace(/<[^>]+>/g, ""),
      "",
      `Votre abonnement Crafia ${planLabel || ""} est actif.`,
    ],
    ctaLabel: "Accéder à mon espace",
    ctaUrl: url,
  });
  return { subject, html, text };
}

module.exports = {
  passwordReset,
  emailVerification,
  recoverEmail,
  trialReminder,
  subscriptionConfirmation,
};
