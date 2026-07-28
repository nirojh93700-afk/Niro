// Modèles de message PRÊTS À L'EMPLOI (chargés d'un clic dans Gestion → Messages).
// Balises remplacées automatiquement : {prenom} {nom} {ref} {solde}.
// Ton chaleureux et professionnel, aux couleurs de la marque (mise en page ajoutée à l'envoi).
export const MESSAGE_TEMPLATES_SEED = [
  {
    id: "seed_merci",
    name: "Merci pour votre commande",
    subject: "Merci pour votre commande, {prenom} ✦",
    body:
`Bonjour {prenom},

Un grand merci pour votre commande {ref} ! Elle nous fait très plaisir.

Nous préparons votre création personnalisée avec le plus grand soin dans notre atelier. Vous recevrez un e-mail dès qu'elle sera expédiée.

À très vite,
L'atelier Niv Création`,
  },
  {
    id: "seed_avis",
    name: "Relance avis (après réception)",
    subject: "Votre avis compte pour nous, {prenom}",
    body:
`Bonjour {prenom},

Nous espérons que votre création vous plaît ! Votre avis est précieux pour notre petit atelier et aide d'autres clientes à choisir.

Prendriez-vous un instant pour la noter sur notre site ? Un clic suffit, et cela nous encourage énormément.

Merci infiniment,
L'atelier Niv Création`,
  },
  {
    id: "seed_cagnotte",
    name: "Rappel cagnotte fidélité",
    subject: "Vous avez {solde} dans votre cagnotte ✦",
    body:
`Bonjour {prenom},

Petit rappel gourmand : il vous reste {solde} dans votre cagnotte fidélité Niv Création.

Vous pouvez l'utiliser dès votre prochaine commande, jusqu'à 50 % du panier. Il suffit de vous connecter à votre espace « Mon compte ».

Belle journée,
L'atelier Niv Création`,
  },
  {
    id: "seed_nouveaute",
    name: "Nouveauté en boutique",
    subject: "Une nouvelle création vient d'arriver ✦",
    body:
`Bonjour {prenom},

Nous avons le plaisir de vous présenter une nouveauté dans notre boutique. Nous avons pensé qu'elle pourrait vous plaire.

Découvrez-la sur notre site — et n'oubliez pas votre cagnotte fidélité qui vous attend.

À très vite,
L'atelier Niv Création`,
  },
  {
    id: "seed_expedie",
    name: "Commande expédiée",
    subject: "Votre commande {ref} est en route ✦",
    body:
`Bonjour {prenom},

Bonne nouvelle : votre commande {ref} vient de partir de notre atelier !

Vous la recevrez très bientôt. Pour toute question, il vous suffit de répondre à cet e-mail.

À très vite,
L'atelier Niv Création`,
  },
  {
    id: "seed_fidele",
    name: "Merci cliente fidèle",
    subject: "Merci pour votre fidélité, {prenom}",
    body:
`Bonjour {prenom},

Nous tenions à vous remercier personnellement pour votre confiance et votre fidélité. Des clientes comme vous font vivre notre petit atelier, et nous en sommes très touchés.

Pour vous gâter, pensez à votre cagnotte fidélité ({solde}) à utiliser sur votre prochaine commande.

Avec toute notre gratitude,
L'atelier Niv Création`,
  },
  {
    id: "seed_anniv",
    name: "Joyeux anniversaire",
    subject: "Joyeux anniversaire, {prenom} ✦",
    body:
`Bonjour {prenom},

Toute l'équipe Niv Création vous souhaite un très joyeux anniversaire !

Pour l'occasion, faites-vous plaisir : votre cagnotte fidélité ({solde}) vous attend sur votre prochaine commande.

Belle journée à vous,
L'atelier Niv Création`,
  },
  {
    id: "seed_retard",
    name: "Petit retard (geste attentionné)",
    subject: "Un petit mot sur votre commande {ref}",
    body:
`Bonjour {prenom},

Nous revenons vers vous au sujet de votre commande {ref}. Sa préparation demande un tout petit peu plus de temps que prévu, car chaque pièce est réalisée à la main avec soin.

Merci pour votre patience : nous mettons tout en œuvre pour vous l'expédier au plus vite.

À très vite,
L'atelier Niv Création`,
  },
];
