// =============================================================================
// Cloud Functions Crafia — envoi d'emails d'authentification 100% white-label.
// -----------------------------------------------------------------------------
// Principe (approche "design parfait") :
//   1. On NE laisse PAS Firebase envoyer ses emails natifs.
//   2. Le SDK Admin GÉNÈRE le lien sécurisé Firebase (oobCode) ...
//   3. ... et NOUS envoyons notre propre email HTML (design Crafia) via SMTP.
// Le lien pointe vers la page custom app.crafia.fr/auth/action (à configurer
// dans la console Firebase → Authentication → Templates → URL d'action).
//
// Région : europe-west1.
// =============================================================================

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const { sendMail } = require("./mailer");
const templates = require("./emails/templates");

const REGION = "europe-west1";

// URL de continuation (où l'utilisateur est renvoyé après l'action).
// La page d'action elle-même (app.crafia.fr/auth/action) se règle dans la
// console Firebase, PAS ici.
const CONTINUE_URL = process.env.APP_URL || "https://app.crafia.fr";

const actionCodeSettings = {
  url: CONTINUE_URL,
  handleCodeInApp: false,
};

// Petit utilitaire : récupère un prénom lisible si disponible.
async function displayNameFor(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    return user.displayName || "";
  } catch (e) {
    return "";
  }
}

// --- 1. Mot de passe oublié -------------------------------------------------
// Appelée par l'app (utilisateur NON connecté). Renvoie toujours un succès
// neutre pour ne pas révéler si un compte existe (anti-énumération).
exports.sendPasswordResetEmail = functions
  .region(REGION)
  .https.onCall(async (data) => {
    const email = String((data && data.email) || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Adresse email invalide."
      );
    }

    try {
      const link = await admin
        .auth()
        .generatePasswordResetLink(email, actionCodeSettings);
      const displayName = await displayNameFor(email);
      const mail = templates.passwordReset({ link, displayName });
      await sendMail({ to: email, ...mail });
    } catch (e) {
      // Compte inexistant -> on NE révèle rien. Autre erreur -> on log.
      if (e.code !== "auth/user-not-found") {
        console.error("sendPasswordResetEmail:", e.message);
      }
    }

    // Réponse neutre dans tous les cas.
    return { ok: true };
  });

// --- 2. Vérification d'email ------------------------------------------------
// Appelée par l'app pour l'utilisateur CONNECTÉ (envoi/renvoi du lien).
exports.sendVerificationEmail = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté."
      );
    }
    const email = context.auth.token.email;
    if (!email) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Aucune adresse email sur ce compte."
      );
    }
    if (context.auth.token.email_verified) {
      return { ok: true, alreadyVerified: true };
    }

    try {
      const link = await admin
        .auth()
        .generateEmailVerificationLink(email, actionCodeSettings);
      const displayName = context.auth.token.name || (await displayNameFor(email));
      const mail = templates.emailVerification({ link, displayName });
      await sendMail({ to: email, ...mail });
    } catch (e) {
      console.error("sendVerificationEmail:", e.message);
      throw new functions.https.HttpsError(
        "internal",
        "L'envoi de l'email a échoué. Réessayez plus tard."
      );
    }

    return { ok: true };
  });

// --- 3. Dispatcher unifié ---------------------------------------------------
// Pratique pour l'app : un seul point d'entrée crafiaCallFn('sendAuthEmail', ...).
//   { type: "reset",  email }  -> email de réinitialisation (utilisateur non connecté)
//   { type: "verify" }         -> email de vérification (utilisateur connecté)
exports.sendAuthEmail = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const type = String((data && data.type) || "").trim();

    if (type === "reset") {
      const email = String((data && data.email) || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        throw new functions.https.HttpsError("invalid-argument", "Adresse email invalide.");
      }
      try {
        const link = await admin
          .auth()
          .generatePasswordResetLink(email, actionCodeSettings);
        const displayName = await displayNameFor(email);
        await sendMail({ to: email, ...templates.passwordReset({ link, displayName }) });
      } catch (e) {
        if (e.code !== "auth/user-not-found") {
          console.error("sendAuthEmail/reset:", e.message);
        }
      }
      return { ok: true }; // réponse neutre (anti-énumération)
    }

    if (type === "verify") {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
      }
      const email = context.auth.token.email;
      if (!email) {
        throw new functions.https.HttpsError("failed-precondition", "Aucune adresse email sur ce compte.");
      }
      if (context.auth.token.email_verified) {
        return { ok: true, alreadyVerified: true };
      }
      try {
        const link = await admin
          .auth()
          .generateEmailVerificationLink(email, actionCodeSettings);
        const displayName = context.auth.token.name || (await displayNameFor(email));
        await sendMail({ to: email, ...templates.emailVerification({ link, displayName }) });
      } catch (e) {
        console.error("sendAuthEmail/verify:", e.message);
        throw new functions.https.HttpsError("internal", "L'envoi de l'email a échoué. Réessayez plus tard.");
      }
      return { ok: true };
    }

    throw new functions.https.HttpsError(
      "invalid-argument",
      'Type inconnu. Utilisez "reset" ou "verify".'
    );
  });

// =============================================================================
// STRUCTURE PRÉ-CÂBLÉE (à activer plus tard avec tes données d'abonnement).
// Les templates existent déjà ; il reste à décider QUAND les déclencher.
// =============================================================================

// Exemple : rappel de fin d'essai. À appeler depuis une fonction planifiée
// (Cloud Scheduler) qui parcourt les comptes en essai. Laissé en stub callable
// pour pouvoir le tester manuellement.
exports.sendTrialReminder = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    // TODO: protéger (admin only) avant usage réel.
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    }
    const email = String((data && data.email) || "").trim().toLowerCase();
    const daysLeft = Number((data && data.daysLeft) != null ? data.daysLeft : 3);
    if (!email) {
      throw new functions.https.HttpsError("invalid-argument", "Email requis.");
    }
    const displayName = await displayNameFor(email);
    const mail = templates.trialReminder({ displayName, daysLeft });
    await sendMail({ to: email, ...mail });
    return { ok: true };
  });

// Exemple : confirmation d'abonnement. À appeler depuis ton webhook de paiement
// (Stripe checkout.session.completed), une fois l'abonnement validé.
exports.sendSubscriptionConfirmation = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    // TODO: protéger (admin only) avant usage réel.
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Connexion requise.");
    }
    const email = String((data && data.email) || "").trim().toLowerCase();
    const planLabel = String((data && data.planLabel) || "");
    if (!email) {
      throw new functions.https.HttpsError("invalid-argument", "Email requis.");
    }
    const displayName = await displayNameFor(email);
    const mail = templates.subscriptionConfirmation({ displayName, planLabel });
    await sendMail({ to: email, ...mail });
    return { ok: true };
  });
