// =============================================================================
// CARTE CADEAU NIV CRÉATION (audit du 19/09/2026, validé « applique »).
// -----------------------------------------------------------------------------
// Le parcours : la cliente choisit un montant + écrit un mot → paiement Stripe
// (une session dédiée, PAS une commande de la boutique) → au webhook, le code
// est créé POUR DE VRAI (règle : aucune promesse qui ne marche pas au paiement)
// puis l'e-mail part au destinataire — tout de suite, ou à la date choisie via
// les envois programmés du site.
//
// Le code créé = un code promo `kind:"cadeau"` :
//   · `value` = le SOLDE restant (débité au webhook à chaque utilisation) ;
//   · `email` = verrouillé sur l'adresse du destinataire (le partager ne sert
//     à rien — même mécanique que les codes « gravure offerte ») ;
//   · `reusable: true` = utilisable en PLUSIEURS FOIS jusqu'à épuisement ;
//   · expire au bout d'un an.
// =============================================================================

export const MONTANTS_CARTE = [20, 30, 50, 75, 100];
export const CARTE_VALIDITE_JOURS = 365;

// Alphabet sans 0/O/1/I/L : un code recopiable à la main sans hésitation.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genCodeCadeau(codesExistants = {}) {
  for (let essai = 0; essai < 50; essai++) {
    let suffixe = "";
    for (let i = 0; i < 5; i++) suffixe += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    const code = `CADEAU-${suffixe}`;
    if (!codesExistants[code]) return code;
  }
  return `CADEAU-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

const euros = (n) => `${Number(n).toFixed(2).replace(".", ",").replace(",00", "")} €`;

// Texte (brut) de l'e-mail au DESTINATAIRE — mis en forme par brandedMessage.
export function texteEmailDestinataire({ destName = "", montant, message = "", code, siteUrl }) {
  const prenom = String(destName || "").trim();
  const mot = String(message || "").trim();
  return (
    `${prenom ? `${prenom},\n\n` : ""}` +
    `Quelqu'un qui vous aime vous offre une carte cadeau de ${euros(montant)} chez Niv Création — ` +
    `des bijoux, verres et créations personnalisés, gravés dans notre atelier français.\n\n` +
    `${mot ? `« ${mot} »\n\n` : ""}` +
    `Votre code, à saisir au panier :\n\n${code}\n\n` +
    `Il est valable un an, en une ou plusieurs fois, sur toute la boutique, et il est personnel ` +
    `(réservé à votre adresse e-mail).\n\n` +
    `Choisissez la pièce qui vous ressemble :\n${siteUrl}/boutique`
  );
}

// Texte (brut) de la confirmation à l'ACHETEUSE.
export function texteEmailAcheteur({ destName = "", destEmail, montant, envoyeeMaintenant, dateEnvoi = "" }) {
  const qui = String(destName || "").trim() || destEmail;
  return (
    `Merci pour votre achat : votre carte cadeau de ${euros(montant)} pour ${qui} est prête.\n\n` +
    (envoyeeMaintenant
      ? `Elle vient d'être envoyée à ${destEmail}, avec votre petit mot et son code personnel.`
      : `Elle sera envoyée à ${destEmail} le ${dateEnvoi}, avec votre petit mot et son code personnel.`) +
    `\n\nLe code est valable un an, en une ou plusieurs fois, sur toute la boutique.`
  );
}
