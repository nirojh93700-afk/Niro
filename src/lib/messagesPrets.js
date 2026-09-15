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

// Rédigés le 15/09/2026, validés par le gérant : les 4 commandes arrivées
// depuis les envois du 12/09 n'avaient reçu que la confirmation automatique.
//
// ⚠️ DEUX COMMANDES PORTENT UNE DATE GRAVÉE TRÈS PROCHE (26/09 et 24/09).
// Formulation validée par le gérant : on NOMME la date, on annonce qu'on fera
// « notre maximum », et on dit franchement que « ce sera juste » — sans jamais
// promettre la date. Ces deux textes promettent aussi un suivi (« nous vous
// tiendrons au courant ») : s'il apparaît que la date ne peut pas être tenue,
// il faut leur écrire un mot AVANT le 24 et le 26, sinon la phrase se retourne
// contre nous.
export const MESSAGES_PRETS = [
  {
    id: "0URL2JQA-50ans",
    client: "Valérine Zaghini",
    ref: "0URL2JQA",
    piece: "Flûtes à champagne, lot de 2 — « 50 ans d'amour » · « 26 septembre 1976 », police Allura",
    note: "Commande du 12/09, point relais Mondial Relay Châtillon-sur-Seine, cadeau « Surprise ». DATE PROCHE : noces d'or le 26/09. Le texte ne promet pas la date, il annonce « ce sera juste ».",
    to: "valerinezaghini@gmail.com",
    subject: "Votre commande est bien prise en compte",
    body: `Bonjour,

Votre commande est bien prise en compte, et tout est noté : les deux flûtes, gravées « 50 ans d'amour » et « 26 septembre 1976 », dans l'écriture Allura.

Nous avons bien vu la date du 26 septembre. Nous ferons notre maximum pour que les flûtes soient prêtes à temps — mais nous préférons être honnêtes avec vous : ce sera juste. La demande est forte en ce moment, et les commandes sont traitées dans leur ordre d'arrivée. Nous vous tiendrons au courant de l'avancée de la vôtre.

Chaque verre est gravé un par un dans notre atelier. Vous recevrez un e-mail avec le numéro de suivi dès que le colis partira vers votre point relais de Châtillon-sur-Seine, et un petit cadeau surprise sera glissé dedans.

Si vous avez la moindre question, répondez simplement à ce message.

Merci pour votre confiance.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
  {
    id: "00CUYR2U-deux-lots",
    client: "Cécilia Herrera",
    ref: "00CUYR2U",
    piece: "2 lots de 2 flûtes — « Chloé & Nico » et « Salomé & Bernard · 24.09.2026 » (modèle 15), police Cinzel Decorative",
    note: "Commande du 14/09 au soir, livraison à domicile à Nice, cadeau « Surprise ». DATE PROCHE : 24/09 gravée sur les flûtes. Le texte ne promet pas la date, il annonce « ce sera juste ».",
    to: "cecilia.herrera@hotmail.fr",
    subject: "Votre commande est bien prise en compte",
    body: `Bonjour Cécilia,

Votre commande est bien prise en compte, et tout est noté : deux lots de flûtes, « Chloé & Nico » pour l'un, « Salomé & Bernard » avec la date du 24.09.2026 pour l'autre, dans l'écriture Cinzel Decorative, sur le modèle 15.

Nous avons bien vu la date du 24 septembre. Nous ferons notre maximum pour que les flûtes soient prêtes à temps — mais nous préférons être honnêtes avec vous : ce sera juste. La demande est forte en ce moment, et les commandes sont traitées dans leur ordre d'arrivée. Nous vous tiendrons au courant de l'avancée de la vôtre.

Chaque flûte est gravée une par une dans notre atelier. Vous recevrez un e-mail avec le numéro de suivi dès que le colis partira, et un petit cadeau surprise sera glissé dedans.

Si vous avez la moindre question, répondez simplement à ce message.

Merci pour votre confiance.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
  {
    id: "1Z17IKQ8-rose-portugais",
    client: "Rose Catarino",
    ref: "1Z17IKQ8",
    piece: "Verre à whisky portrait — photo gravée au fond, texte et décor saisis sur la fiche",
    note: "Elle avait demandé une gravure EN PORTUGAIS (réponse envoyée le 14/09 au matin), puis a commandé 7 h plus tard avec un texte EN FRANÇAIS. Le message pose UNE seule question : est-ce bien le texte français qu'elle veut ? On ne récapitule pas ce qu'elle a saisi (demande du gérant) et on ne recopie pas le texte portugais (très personnel).",
    to: "rose75013@icloud.com",
    subject: "Votre verre gravé — une question avant de lancer",
    body: `Bonjour Rose,

Merci pour votre commande, elle est bien prise en compte.

Une seule question avant de lancer la gravure : vous nous aviez demandé une gravure en portugais, et le texte indiqué sur votre commande est en français. Est-ce bien celui-ci que vous souhaitez faire graver ?

Répondez simplement à ce message, même en une ligne, et nous nous occupons du reste.

Comme promis, vous recevrez un aperçu de la gravure à valider avant que nous ne gravions quoi que ce soit. Le délai reste celui que nous vous avions indiqué : trois à quatre semaines minimum, les commandes étant traitées dans leur ordre d'arrivée.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
  {
    id: "1GIP8RR1-maelys",
    client: "Maëlys Georges",
    ref: "1GIP8RR1",
    piece: "Verre à vin gravé, à l'unité — lettre fleurie J + « Jean Michel », police Allura",
    note: "Commande du 13/09, livraison à domicile à Merville, cadeau « Plutôt homme ». Aucune date à surveiller : réassurance simple + annonce du délai de trois à quatre semaines.",
    to: "mae31340@gmail.com",
    subject: "Des nouvelles de votre commande",
    body: `Bonjour Maëlys,

Un petit mot pour vous rassurer : votre commande est bien prise en compte, tout est noté de notre côté. Le verre à vin, avec la lettre fleurie J et « Jean Michel » dans l'écriture Allura.

Un mot sur le délai, pour que vous sachiez à quoi vous attendre : en raison d'une forte demande, notre délai de confection est actuellement de trois à quatre semaines minimum, et les commandes sont traitées dans leur ordre d'arrivée. Chaque verre est gravé un par un, et nous préférons prendre le temps de bien faire.

Vous recevrez un e-mail avec le numéro de suivi dès que votre colis partira. Un petit cadeau surprise sera glissé dedans.

Merci pour votre confiance — vos commandes font vivre un vrai atelier.

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
// Textes complets : docs/messages/rassurance-3-commandes.md et l'historique git.
// ---------------------------------------------------------------------------
