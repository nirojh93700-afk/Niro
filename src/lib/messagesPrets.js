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
export const MESSAGES_PRETS = [];

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
