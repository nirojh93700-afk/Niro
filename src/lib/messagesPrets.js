// =============================================================================
// MESSAGES PRÊTS À ENVOYER — préparés pour le gérant, affichés en haut de
// Gestion → Clients → Messages clients.
// Un clic sur « Remplir » recopie l'adresse, le sujet et le texte dans le
// formulaire d'envoi : il relit, puis clique « Envoyer maintenant ».
// RIEN NE PART TOUT SEUL. Ce fichier ne contient que du texte.
//
// Rédigés le 12/09/2026 (réassurance des commandes en attente). Règles
// respectées : jamais de machine/panne/laser (motif = forte demande), aucune
// date promise, signature « Niv Création » sans nom de personne.
// Quand un message est envoyé, retirer son entrée d'ici.
// =============================================================================

// ✅ Les trois messages de réassurance (DEJA_ENVOYES) sont partis le 12/09 à 07 h 13.
// En attente ci-dessous : la réponse à Rose, validée par le gérant le 14/09.
export const MESSAGES_PRETS = [
  {
    id: "rose-verre-whisky-portugais",
    client: "Rose",
    ref: "",
    piece: "Verre à whisky à personnaliser — gravure en portugais (demande du 12/09, acceptée par le gérant)",
    note: "Elle n'a envoyé AUCUNE image, seulement le texte. Le message confirme que c'est réalisable, demande les précisions manquantes, annonce le délai AVANT le paiement, et l'oriente vers la fiche produit.",
    to: "rose75013@icloud.com",
    subject: "Votre verre à whisky gravé — ce qu'il nous faut pour lancer",
    body: `Bonjour Rose,

Bonne nouvelle : votre gravure est réalisable. Nous graverons votre texte tel que vous l'avez écrit, en portugais, accents compris.

Une précision utile avant de commencer : votre message fait une soixantaine de caractères, et le verre mesure moins de huit centimètres de diamètre. Pour qu'il reste parfaitement lisible, nous le répartirons sur plusieurs lignes, par exemple ainsi :

  JOSÉ LUIS
  OBRIGADA POR TODOS OS ORGASMOS
  CONTINUA ASSIM!
  A TUA MULHER

Dites-nous si cette répartition vous convient, ou indiquez-nous celle que vous préférez.

Trois petites choses à nous confirmer :
- combien de verres souhaitez-vous ?
- quelle écriture parmi celles proposées sur la fiche ?
- gardons-nous les majuscules, comme dans votre message ?

Pour lancer la fabrication, la commande se passe directement sur la fiche du produit, où vous choisirez votre écriture et votre texte :
https://nivcreation.fr/produit/verre-a-whisky-fete-des-peres

Un point d'honnêteté sur le délai : en raison d'une forte demande, notre délai de confection est actuellement de trois à quatre semaines minimum. Les commandes sont traitées dans leur ordre d'arrivée. Nous préférons vous le dire avant que vous commandiez.

Et comme promis, nous vous enverrons un aperçu de la gravure à valider avant de graver quoi que ce soit.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
];

const DEJA_ENVOYES = [
  {
    id: "16GFEMQP-rassurance",
    client: "Sonia",
    ref: "16GFEMQP",
    piece: "Bracelet empreinte pied de bébé — gravure « Ayden 19/07/2026 »",
    to: "soniagailhac1307@gmail.com",
    subject: "Des nouvelles de votre commande",
    body: `Bonjour,

Un petit mot pour vous rassurer : votre commande est bien prise en compte, tout est noté de notre côté. Le bracelet empreinte, gravé « Ayden 19/07/2026 ».

Ne vous inquiétez pas si cela prend quelques jours : chaque pièce est gravée une par une, dans l'ordre d'arrivée des commandes, et la demande est forte en ce moment. Nous préférons prendre le temps de bien faire.

Vous recevrez un e-mail avec le numéro de suivi dès que votre colis partira. Un petit cadeau surprise sera glissé dedans.

Merci pour votre confiance — vos commandes font vivre un vrai atelier.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
  {
    id: "0KVSBXKR-cadeau",
    client: "Ophélie Terraz",
    ref: "0KVSBXKR",
    piece: "Verre à vin gravé, lot de 4 — modèle 28, « Éléonore · 27 Août 2026 »",
    note: "Colis envoyé directement au destinataire : on lui demande ce qu'elle veut faire du cadeau, SANS proposer d'envoi séparé (un second port serait à notre charge).",
    to: "ophelie.terraz@gmail.com",
    subject: "Votre commande est bien prise en compte",
    body: `Bonjour,

Un petit mot pour vous confirmer que votre commande est bien prise en compte, et que tout ce que vous avez indiqué est noté : le lot de quatre verres, le modèle 28, le prénom Éléonore et la date du 27 août 2026.

Vous avez bien fait de le préciser : le prénom et la date seront gravés dans l'écriture du modèle 28, exactement comme sur l'exemple que vous avez choisi.

Une question, puisque le colis part directement chez la personne à qui vous l'offrez. Nous glissons un petit cadeau surprise dans chaque commande, et vous avez choisi « plutôt femme ». Dites-nous ce que vous préférez pour ce cadeau, nous ferons selon votre souhait.

Chaque verre est gravé un par un dans notre atelier, alors laissez-nous quelques jours. Vous recevrez un e-mail avec le numéro de suivi dès que le colis partira vers le point relais de Montbéliard.

Merci pour votre confiance.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
  {
    id: "0C1CGL2Q-pas-oubliee",
    client: "Sophie Berardo",
    ref: "0C1CGL2Q",
    piece: "Verre à whisky gravé sur mesure (devis DEV-0003)",
    note: "Elle a accepté d'attendre le 02/09 et un cadeau lui est promis dans le colis. Ne pas réexpliquer le délai : juste montrer qu'elle n'est pas oubliée.",
    to: "miegesophie@gmail.com",
    subject: "Nous ne vous avons pas oubliée",
    body: `Bonjour Sophie,

Un petit mot, simplement pour que vous ne restiez pas sans nouvelles : votre commande est toujours bien là, nous ne vous avons pas oubliée.

Merci encore d'avoir accepté de patienter, c'est une vraie marque de confiance et nous y sommes sensibles.

Vous serez prévenue par e-mail avec le numéro de suivi dès que votre colis partira. Et le petit cadeau que nous vous avions promis y sera bien, comme convenu.

Si vous avez la moindre question d'ici là, répondez simplement à ce message.

Bien cordialement,
Niv Création
nivcreation.fr`,
  },
];
