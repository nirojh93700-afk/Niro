// Avis clients RÉELS reçus hors site (Instagram, WhatsApp, e-mail, retours de
// commande) et recopiés ici pour qu'ils s'affichent sur les fiches produit.
//
// Ils fusionnent avec les avis ajoutés depuis Gestion → Avis : le dédoublonnage
// se fait sur « prénom + texte », donc si un avis identique est ajouté dans
// l'admin, il n'apparaît pas en double (la version de l'admin, modifiable, gagne).
//
// Pour AJOUTER un avis : ajouter une entrée { name, rating, text, date } sous le
// bon slug produit ci-dessous. La date est au format AAAA-MM-JJ.
// Pour RETIRER un avis semé : supprimer son entrée ici (les avis semés ne sont
// pas supprimables depuis l'admin, ils viennent du code).
export const REVIEWS_SEED = {
  "verre-a-whisky-fete-des-peres": [
    {
      name: "Thomas D.",
      rating: 5,
      text:
        "J'ai commandé le verre à whisky personnalisé avec le modèle Route 66 et mon prénom. Reçu très rapidement, emballage ultra sécurisé. Le rendu du laser sur le verre est top, ça fait un super verre perso pour mes petites soirées. Je recommande à 100 %.",
      date: "2026-07-28",
    },
    {
      name: "Yoann D.",
      rating: 4,
      text: "Très joli verre personnalisé, emballage nickel. Bon rapport qualité-prix.",
      date: "2026-07-30",
    },
  ],
  "carafe-a-whisky-gravee": [
    {
      name: "Marc L.",
      rating: 5,
      text:
        "Offert à mon mari pour la fête des Pères avec sa date de naissance et ses initiales gravées. La carafe fait vraiment très haut de gamme, le verre est lourd et brillant, et la gravure est super nette. Il était bluffé par la qualité, un magnifique cadeau d'exception !",
      date: "2026-07-29",
    },
  ],
  "verre-a-vin-grave": [
    {
      name: "Camille D.",
      rating: 5,
      text: "Super idée cadeau pour une amie fan de vin. Reçu très vite et très bien emballé.",
      date: "2026-07-30",
    },
  ],
  "flute-a-champagne-gravee": [
    {
      name: "Romane T.",
      rating: 5,
      text: "Offert à des amis pour leur anniversaire de mariage, ils étaient émus aux larmes.",
      date: "2026-07-29",
    },
    {
      name: "Alexia P.",
      rating: 4,
      text: "Très satisfaite de mon achat, belle finition de l'atelier.",
      date: "2026-07-30",
    },
  ],
  "porte-stylo-coq-coupe-du-monde": [
    {
      name: "Vincent L.",
      rating: 4,
      text: "Reçu rapidement, emballage soigné. Très satisfait !",
      date: "2026-07-30",
    },
  ],
};
