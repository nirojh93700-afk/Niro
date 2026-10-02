// =============================================================================
// FILTRE DE LA BOÎTE SURVEILLÉE — pubs, notifications, expéditeurs ignorés.
// -----------------------------------------------------------------------------
// Le gérant (02/10/2026) : « tu me mets à côté un bouton Pub : l'agent doit savoir
// que c'est une pub, il retire, et il doit tout contrôler cette page pour la
// mettre à jour ». Deux briques, pures et testables :
//   · `expediteurIgnore(email, blocage)` — l'adresse (ou son domaine PRO) a été
//     marquée « pub » par le gérant ;
//   · `pubEvidente(email)` — gabarits d'expéditeurs jamais cliente (codes de
//     vérification Metro, notifications DPD, démarchages médias…).
// La section `inboxBlock` du blob vit dans `stock.js` (`getInboxBlock` / `addInboxBlock`).
// =============================================================================

// Domaines de messagerie publique : on bloque l'ADRESSE seule, jamais tout le domaine
// (sinon une pub reçue depuis un gmail.com bloquerait toutes les clientes Gmail).
const WEBMAIL = /^(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|mac|orange|wanadoo|free|sfr|neuf|laposte|bbox|numericable|aol|proton|protonmail|pm|mailo|gmx|web|yandex|zoho|skynet|telenet|bluewin)\./i;

export function domaine(email) {
  const e = String(email || "").toLowerCase().trim();
  const i = e.lastIndexOf("@");
  return i >= 0 ? e.slice(i + 1) : "";
}

/** Ce qu'on range dans la liste quand le gérant clique « Pub » sur cette adresse. */
export function cleBlocage(email) {
  const e = String(email || "").toLowerCase().trim();
  const d = domaine(e);
  if (!d) return e;
  return WEBMAIL.test(d) ? e : `@${d}`;
}

/** L'expéditeur est-il dans la liste « pub » du gérant ? (adresse exacte ou domaine pro) */
export function expediteurIgnore(email, blocage = {}) {
  const e = String(email || "").toLowerCase().trim();
  if (!e) return false;
  if (blocage[e]) return true;
  const d = domaine(e);
  if (!d) return false;
  if (blocage[`@${d}`]) return true;
  // sous-domaines : « idam@emails.metro.fr » est couvert par « @metro.fr »
  const parts = d.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    if (blocage[`@${parts.slice(i).join(".")}`]) return true;
  }
  return false;
}

// Expéditeurs qui ne sont JAMAIS une cliente (constatés dans la boîte du 02/10/2026).
const PUB_RE = /@emails?\.metro\.|@(?:[a-z0-9-]+\.)*dpd\.(?:fr|com)|@information\.dpd|@voc\.dpd|medias-france\.fr|@(?:[a-z0-9-]+\.)*(?:mailchimp|sendgrid|sendinblue|brevo|klaviyo|hubspot|mailjet|mailgun|substack)\./;

export function pubEvidente(email) {
  return PUB_RE.test(String(email || "").toLowerCase());
}

/** Faut-il écarter ce message ? (pub évidente OU expéditeur marqué « pub » par le gérant) */
export function aEcarter(email, blocage = {}) {
  return pubEvidente(email) || expediteurIgnore(email, blocage);
}
