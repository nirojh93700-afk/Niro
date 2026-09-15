// =============================================================================
// MESSAGES PRÊTS À ENVOYER — préparés pour le gérant, affichés en haut de
// Gestion → Clients → Messages clients.
// Un clic sur « Remplir » recopie l'adresse, le sujet et le texte dans le
// formulaire d'envoi : il relit, puis clique « Envoyer maintenant ».
// RIEN NE PART TOUT SEUL. Ce fichier ne contient que du texte.
//
// Règles respectées dans chaque texte : jamais de machine / panne / laser (le
// motif est TOUJOURS la forte demande) · AUCUNE date promise · AUCUNE mention
// de remboursement (consigne du 15/09) · signature « Niv Création », jamais un
// nom de personne.
// Quand un message est envoyé, retirer son entrée d'ici.
// =============================================================================

// ⚠️ RAPPEL TOUJOURS ACTIF : Valérine Zaghini (#0URL2JQA, date gravée 26/09)
// et Cécilia Herrera (#00CUYR2U, date gravée 24/09) ont reçu le 15/09 un
// message « nous ferons notre maximum, ce sera juste » + promesse de suivi.
// Si la date ne peut pas être tenue, leur écrire un mot AVANT le 24 et le 26.
export const MESSAGES_PRETS = [
  {
    id: "1S9IOON5-colis-revenu",
    client: "Hend Musallam",
    ref: "1S9IOON5",
    piece: "Bracelet Femme Cœur doré gravé « Hend » (police Allura) + boîte cadeau — payé 30,21 € le 31/08",
    note: "LE COLIS EST REVENU. Mis à disposition en point relais le 04/09 (avisage e-mail le même jour), jamais retiré, retour déclenché le 11/09, arrivé au relais de Sarcelles le 15/09 — code 536287, À RETIRER AVANT LE 20/09. Décision du gérant le 15/09 : renvoi possible mais AVEC LES FRAIS À SA CHARGE (il ne peut pas offrir le port). Le message annonce le retour sans reproche, demande l'adresse à utiliser, et annonce 4,90 € en point relais ou 6,90 € à domicile. ✅ VÉRIFIÉ SUR BOXTAL (captures du 15/09) : l'envoi était bien une offre « Domicile France », le livreur s'est présenté à son adresse le 03/09 à 14 h 14 (« destinataire absent »), le colis a été dérouté vers un relais (forçage du relais de substitution), elle a été avisée par e-mail DEUX FOIS (03/09 14 h 14 et 04/09 9 h 29) et le colis est resté 7 jours à sa disposition. L'atelier n'a donc commis aucune erreur et demander les frais de réexpédition est défendable. Ce suivi est aussi le dossier à produire en cas de litige PayPal. Pour encaisser les frais : Gestion → Devis & factures, devis de 4,90 € ou 6,90 € payable en ligne.",
    to: "e.varol2012@icloud.com",
    subject: "Votre bracelet nous est revenu — comment on le remet en route",
    body: `Bonjour,

Votre commande nous est revenue aujourd'hui, et nous voulions vous expliquer ce qui s'est passé.

Le transporteur s'est présenté à votre adresse le 3 septembre ; personne n'étant là, il a déposé le colis dans un point relais et vous a prévenue par e-mail. Le colis y est resté à votre disposition jusqu'au 11 septembre, puis il nous a été automatiquement renvoyé.

Votre bracelet est donc bien là, intact dans son écrin, avec la gravure « Hend ».

Nous pouvons vous le renvoyer dès que vous le souhaitez. Le premier envoi ayant été consommé, il reste les frais de réexpédition à prévoir : 4,90 € en point relais, ou 6,90 € en livraison à domicile.

Dites-nous simplement ce que vous préférez, et confirmez-nous l'adresse — ou le point relais — à utiliser : nous voulons être sûrs qu'il arrive entre vos mains cette fois. Nous vous enverrons ensuite un lien de paiement sécurisé pour ces frais, et le bracelet repart dès le règlement reçu.

Désolés pour ce contretemps, et merci de votre compréhension.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
];

// ---------------------------------------------------------------------------
// Historique — déjà partis, gardés pour mémoire (ne s'affichent PAS dans l'admin).
// 12/09 07 h 13 : Sonia (#16GFEMQP), Ophélie Terraz (#0KVSBXKR), Sophie Berardo
//                 (#0C1CGL2Q) — messages de réassurance.
// 14/09 11 h 03 : Rose Catarino — « Votre verre à whisky gravé — ce qu'il nous
//                 faut pour lancer » (réponse à sa demande de gravure en portugais).
// 15/09         : Valérine Zaghini (#0URL2JQA), Cécilia Herrera (#00CUYR2U),
//                 Rose Catarino (#1Z17IKQ8), Maëlys Georges (#1GIP8RR1) —
//                 les 4 messages validés du 15/09, envoyés par send-client-email.
// Textes complets : docs/messages/rassurance-3-commandes.md et l'historique git.
// ---------------------------------------------------------------------------
