// Avis clients RÉELS reçus hors site (Instagram, WhatsApp, e-mail, retours de
// commande) et recopiés ici. Ils sont IMPORTÉS UNE SEULE FOIS dans la base au
// premier chargement du site (voir ensureSeedReviews() dans stock.js), puis ils
// deviennent de vrais avis en base : entièrement MODIFIABLES et SUPPRIMABLES
// depuis Gestion → Avis, comme n'importe quel autre.
//
// Chaque avis a un `id` stable et unique : c'est lui qui garantit qu'un avis
// n'est importé qu'une fois (même après une modification/suppression dans
// l'admin, il ne réapparaît pas).
//
// Pour AJOUTER un avis : ajouter une entrée { id, name, rating, text, date } sous
// le bon slug produit, avec un `id` NOUVEAU et unique (jamais réutilisé). La date
// est au format AAAA-MM-JJ. Il sera importé au prochain déploiement.
// Ne PAS réutiliser un ancien `id`, ne pas renuméroter : l'id est la mémoire de
// « déjà importé ».
export const REVIEWS_SEED = {
  "verre-a-whisky-fete-des-peres": [
    {
      id: "avis-thomas-d-whisky-route66",
      name: "Thomas D.",
      rating: 5,
      text:
        "J'ai commandé le verre à whisky personnalisé avec le modèle Route 66 et mon prénom. Reçu très rapidement, emballage ultra sécurisé. Le rendu du laser sur le verre est top, ça fait un super verre perso pour mes petites soirées. Je recommande à 100 %.",
      date: "2026-07-28",
    },
    {
      id: "avis-yoann-d-whisky",
      name: "Yoann D.",
      rating: 4,
      text: "Très joli verre personnalisé, emballage nickel. Bon rapport qualité-prix.",
      date: "2026-07-30",
    },
  ],
  "carafe-a-whisky-gravee": [
    {
      id: "avis-marc-l-carafe",
      name: "Marc L.",
      rating: 5,
      text:
        "Offert à mon mari avec sa date de naissance et ses initiales gravées. La carafe fait vraiment très haut de gamme, le verre est lourd et brillant, et la gravure est super nette. Il était bluffé par la qualité, un magnifique cadeau d'exception !",
      date: "2026-07-29",
    },
  ],
  "verre-a-vin-grave": [
    {
      id: "avis-camille-d-vin",
      name: "Camille D.",
      rating: 5,
      text: "Super idée cadeau pour une amie fan de vin. Reçu très vite et très bien emballé.",
      date: "2026-07-30",
    },
  ],
  "flute-a-champagne-gravee": [
    {
      id: "avis-romane-t-flute",
      name: "Romane T.",
      rating: 5,
      text: "Offert à des amis pour leur anniversaire de mariage, ils étaient émus aux larmes.",
      date: "2026-07-29",
    },
    {
      id: "avis-alexia-p-flute",
      name: "Alexia P.",
      rating: 4,
      text: "Très satisfaite de mon achat, belle finition de l'atelier.",
      date: "2026-07-30",
    },
  ],
  "porte-stylo-coq-coupe-du-monde": [
    {
      id: "avis-vincent-l-porte-stylo",
      name: "Vincent L.",
      rating: 4,
      text: "Reçu rapidement, emballage soigné. Très satisfait !",
      date: "2026-07-30",
    },
  ],
};
