// Questions-réponses en bas des pages « Offrir » (24/11/2026, gérant : « applique le bloc Noël »,
// maquette https://claude.ai/artifact/EApVv3qejZPQEQgUV1F8YJ). Lues aussi par Google et les IA (FAQPage).
// ⛔ Aucun produit ni prix écrit à la main dans les réponses : chaque produit cité est relu dans le
// catalogue EN DIRECT (prix du jour, produit masqué = retiré de la phrase, phrase vide = question retirée).
// La question « date limite pour Noël » n'y est pas : le gérant ne l'a pas encore donnée.
import { prixCarte } from "@/lib/univers";
import { configNoel, prochaineFete } from "@/lib/fetes";
import { GUIDE_CRISTAL_TEXTE } from "@/lib/products";

const euro = (n) => `${Number(n).toFixed(2).replace(/\.00$/, "").replace(".", ",")} €`;

// Morceau de phrase : texte, ou liste de produits { s: slug, l: libellé, max?: prix maximum }.
const FAQ = {
  noel: [
    {
      q: "Quel cadeau de Noël personnalisé offrir à moins de 30 € ?",
      a: [
        "Plusieurs créations gravées restent sous 30 € : ",
        { liste: [
          { s: "porte-cles-cuir-a-graver", l: "le porte-clés aspect cuir à graver" },
          { s: "marque-page-bois-pompon", l: "le marque-page en bois gravé" },
          { s: "collier-papillon-ajoure", l: "le collier papillon ajouré" },
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "puzzle-savane", l: "le puzzle en bois au prénom de l'enfant" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
        ], max: 30 },
        ". Chaque pièce est gravée à la commande dans notre atelier, en France.",
      ],
    },
    {
      q: "Quel cadeau de Noël offrir à un homme ou à un papa ?",
      a: [
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
        ] },
        " se gravent d'un prénom, d'une date, d'un logo ou d'une photo.",
        { liste: [{ s: "bracelet-homme-plaque-cuir", l: "le bracelet homme cuir et plaque" }], avant: " Pour un bijou, ", apres: " se grave d'un prénom ou d'une date." },
      ],
    },
    {
      q: "Peut-on offrir une photo gravée pour Noël ?",
      a: [
        "Oui. ",
        { liste: [{ s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" }], apres: " grave votre photo en relief à l'intérieur du bloc." },
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky" },
          { s: "puzzle-photo-grave", l: "le puzzle photo en bois" },
          { s: "support-telephone-bois-grave", l: "le support de téléphone en bois" },
        ], avant: " Sur ", apres: ", on peut aussi graver une photo." },
      ],
    },
    { q: "Les bijoux peuvent-ils être emballés pour Noël ?", noelEmballages: true },
  ],
  mariage: [
    {
      q: "Quel cadeau de mariage personnalisé offrir aux mariés ?",
      a: [
        { liste: [
          { s: "flute-a-champagne-gravee", l: "les flûtes à champagne gravées" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent aux prénoms des mariés et à la date du mariage. Le cristal garde aussi une photo du couple, gravée en relief à l'intérieur du bloc.",
      ],
    },
    {
      q: "Quelle décoration de mariage gravée pour les tables ?",
      a: [
        "Pour la salle, nous gravons ",
        { liste: [
          { s: "numero-table-eucalyptus", l: "les numéros de table" },
          { s: "menu-de-mariage-bois-grave", l: "le menu de mariage en bois" },
          { s: "ronds-de-serviette-bois", l: "les ronds de serviette" },
          { s: "etiquette-serviette-initiales", l: "les étiquettes aux initiales" },
        ] },
        ", à vos prénoms et à votre date.",
      ],
    },
    {
      q: "Peut-on commander pour un mariage avec une date proche ?",
      statique: true,
      a: ["Oui, mais à moins de 15 jours de l'événement, contactez-nous avant de commander pour confirmer que la date peut être tenue."],
    },
    {
      q: "Peut-on récupérer la décoration de mariage sur place ?",
      statique: true,
      a: ["Oui, pour les décorations et créations de mariage, un retrait en main propre gratuit, sur rendez-vous, est possible dans le Val-d'Oise (95) et les départements voisins. L'option s'affiche au paiement si votre code postal le permet."],
    },
  ],
  naissance: [
    {
      q: "Quel cadeau de naissance personnalisé offrir ?",
      a: [
        { liste: [
          { s: "plaque-de-naissance", l: "la plaque de naissance en bois" },
          { s: "plaque-de-naissance-coeur", l: "la plaque cœur porte-bracelet" },
          { s: "cartes-etapes-bebe-animaux", l: "les cartes étapes bébé" },
          { s: "couverts-enfants-personnalises", l: "les couverts enfant au prénom" },
        ] },
        " se gravent au prénom de bébé et gardent le souvenir de ses premiers mois.",
      ],
    },
    {
      q: "Que graver sur une plaque de naissance ?",
      a: [
        "Le prénom, la date et l'heure de naissance, le poids et la taille. ",
        { liste: [{ s: "plaque-de-naissance", l: "la plaque de naissance" }], apres: " existe en modèle fille ou garçon." },
      ],
    },
    {
      q: "Un cadeau de naissance pour les parents ?",
      a: [
        { liste: [{ s: "bracelet-empreinte-pied-bebe", l: "le bracelet empreinte de pied de bébé" }], apres: " se porte sur soi." },
        { liste: [{ s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" }], avant: " ", apres: " garde la première photo de bébé gravée en relief." },
        { liste: [{ s: "veilleuse-arbre-de-vie-prenom", l: "la veilleuse arbre de vie au prénom" }], avant: " Pour la chambre, ", apres: " s'allume le soir." },
      ],
    },
  ],
  amour: [
    {
      q: "Quel cadeau personnalisé offrir à son amoureux ou à son amoureuse ?",
      a: [
        { liste: [
          { s: "collier-couple-coeur-lot2", l: "le collier couple cœur, vendu par deux" },
          { s: "collier-couple-puzzle", l: "le collier couple puzzle" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent de vos prénoms, de votre date ou de votre photo.",
      ],
    },
    {
      q: "Quel bijou à partager à deux ?",
      a: [
        { liste: [
          { s: "collier-couple-coeur-lot2", l: "le collier couple cœur" },
          { s: "collier-couple-puzzle", l: "le collier couple puzzle" },
        ] },
        " se portent à deux : chacun garde une moitié, gravée de l'autre prénom ou d'une date.",
      ],
    },
    {
      q: "Que faire graver pour un couple ?",
      statique: true,
      a: ["Vos deux prénoms, la date de votre rencontre ou de votre mariage, un mot doux ou les coordonnées d'un lieu qui compte pour vous. D'autres idées dans notre guide ", { lien: "/idees/idees-gravure-bijoux", l: "que graver sur un bijou" }, "."],
    },
  ],
  "pour-lui": [
    {
      q: "Quel cadeau personnalisé offrir à un homme ?",
      a: [
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
          { s: "bracelet-homme-identite-gourmette", l: "la gourmette d'identité" },
        ] },
        " se gravent d'un prénom, d'une date, d'un logo ou d'un message.",
      ],
    },
    {
      q: "Quel bracelet homme à graver ?",
      a: [
        { liste: [
          { s: "bracelet-gourmette-plaque", l: "la gourmette à plaque" },
          { s: "bracelet-homme-cuir-tresse-acier", l: "le bracelet tressé et acier" },
          { s: "bracelet-homme-chaine-acier", l: "le bracelet chaîne acier" },
          { s: "bracelet-homme-plaque-cuir", l: "le bracelet cuir et plaque" },
        ] },
        " ont une plaque à graver d'un prénom, d'une date ou d'un message.",
      ],
    },
    {
      q: "Un cadeau gravé pour lui à moins de 20 € ?",
      a: [
        { liste: [
          { s: "porte-cles-cuir-a-graver", l: "le porte-clés aspect cuir à graver" },
          { s: "bracelet-cordon-plaque", l: "le bracelet cordon à plaque gravée" },
          { s: "bracelet-homme-cuir-tresse-acier", l: "le bracelet tressé et acier" },
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
        ], max: 20 },
        " commencent sous 20 €.",
      ],
    },
  ],
  "pour-elle": [
    {
      q: "Quel bijou personnalisé offrir à une femme ?",
      a: [
        { liste: [
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" },
          { s: "collier-medaillon-coeur-ouvrable", l: "le médaillon cœur ouvrable" },
          { s: "bracelet-femme-coeur", l: "le bracelet femme cœur" },
        ] },
        " se gravent d'un prénom, d'une date ou d'un mot qui lui est cher.",
      ],
    },
    {
      q: "Un bijou pour elle à moins de 20 € ?",
      a: [
        "À graver : ",
        { liste: [
          { s: "collier-pastille", l: "le collier pastille" },
          { s: "collier-barre-verticale", l: "le collier Quatre Mots" },
        ], max: 20 },
        ".",
        { liste: [
          { s: "collier-noeud-scintillant", l: "le collier nœud scintillant" },
          { s: "collier-papillon-ajoure", l: "le collier papillon ajouré" },
          { s: "bracelet-ange", l: "le bracelet ange" },
        ], max: 20, avant: " Prêts à offrir : ", apres: "." },
      ],
    },
    {
      q: "Le bijou peut-il être emballé pour l'offrir ?",
      statique: true,
      a: ["Oui. Sur chaque fiche de bijou, vous choisissez son emballage : sac cadeau, boîte cadeau, pochette microfibre ou pack."],
    },
  ],
  famille: [
    {
      q: "Quel cadeau personnalisé pour toute la famille ?",
      a: [
        { liste: [
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
          { s: "puzzle-photo-grave", l: "le puzzle photo en bois" },
          { s: "cle-usb-bois-coffret", l: "la clé USB en bois dans son coffret" },
        ] },
        " gardent une photo de famille ou vos souvenirs, avec vos prénoms gravés.",
      ],
    },
    {
      q: "Quelle photo choisir pour un cristal photo 3D ?",
      statique: true,
      a: [GUIDE_CRISTAL_TEXTE + " Plus de conseils dans notre guide ", { lien: "/idees/cristal-photo-3d", l: "cristal photo 3D" }, "."],
    },
  ],
  "saint-valentin": [
    {
      q: "Quand tombe la Saint-Valentin ?",
      statique: true,
      a: ["La prochaine Saint-Valentin tombe le ", { fete: "valentin" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour la Saint-Valentin ?",
      a: [
        { liste: [
          { s: "collier-couple-coeur-lot2", l: "le collier couple cœur, vendu par deux" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
          { s: "porte-cles-cristal-led-coeur", l: "le porte-clés cristal cœur" },
        ] },
        " se gravent de vos prénoms, de votre date ou de votre photo.",
      ],
    },
    {
      q: "Un cadeau de Saint-Valentin pour lui ?",
      a: [
        { liste: [
          { s: "bracelet-homme-plaque-cuir", l: "le bracelet cuir et plaque" },
          { s: "bracelet-gourmette-plaque", l: "la gourmette à plaque" },
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
        ] },
        " se gravent d'un prénom, d'une date ou d'un mot doux.",
      ],
    },
  ],
  "fete-des-meres": [
    {
      q: "Quand tombe la Fête des mères ?",
      statique: true,
      a: ["En France, la prochaine Fête des mères tombe le ", { fete: "meres" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour la Fête des mères ?",
      a: [
        { liste: [
          { s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" },
          { s: "collier-medaillon-coeur-ouvrable", l: "le médaillon cœur ouvrable" },
          { s: "bracelet-femme-coeur", l: "le bracelet femme cœur" },
          { s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" },
        ] },
        " se gravent des prénoms de ses enfants, d'une date ou d'une photo.",
      ],
    },
    {
      q: "Comment graver les prénoms de plusieurs enfants ?",
      a: [
        { liste: [{ s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" }], apres: " porte un prénom dans chaque cœur." },
        { liste: [{ s: "collier-barre-verticale", l: "le collier Quatre Mots" }], avant: " ", apres: " se grave sur ses quatre faces." },
        { liste: [{ s: "collier-medaillon-coeur-ouvrable", l: "le médaillon cœur ouvrable" }], avant: " ", apres: " s'ouvre comme un livre, avec plusieurs faces à graver." },
      ],
    },
  ],
  paques: [
    {
      q: "Quand tombe Pâques ?",
      statique: true,
      a: ["Le prochain dimanche de Pâques tombe le ", { fete: "paques" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir à un enfant pour Pâques ?",
      a: [
        { liste: [
          { s: "puzzle-foret", l: "le puzzle en bois au prénom de l'enfant" },
          { s: "couverts-enfants-personnalises", l: "les couverts enfant au prénom" },
          { s: "plaque-de-porte-enfant", l: "la plaque de porte au prénom" },
          { s: "marque-page-bois-pompon", l: "le marque-page en bois gravé" },
        ] },
        " se gravent au prénom de l'enfant et se gardent bien après Pâques.",
      ],
    },
    {
      q: "Un cadeau de Pâques pour un adulte ?",
      a: [
        { liste: [
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" },
          { s: "verre-a-vin-grave", l: "le verre à vin gravé" },
        ] },
        " se gravent d'un prénom, d'une date ou d'une photo.",
      ],
    },
  ],
  "fete-des-grands-meres": [
    {
      q: "Quand tombe la Fête des grands-mères ?",
      statique: true,
      a: ["En France, la Fête des grands-mères tombe le premier dimanche de mars : la prochaine est le ", { fete: "grands-meres" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir à une grand-mère ?",
      a: [
        { liste: [
          { s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" },
          { s: "collier-medaillon-coeur-ouvrable", l: "le médaillon cœur ouvrable" },
          { s: "cristal-photo-3d-vertical", l: "le cristal photo 3D" },
          { s: "marque-page-bois-pompon", l: "le marque-page en bois gravé" },
        ] },
        " se gravent des prénoms de ses petits-enfants, d'une date ou d'une photo de famille.",
      ],
    },
    {
      q: "Comment graver les prénoms de tous les petits-enfants ?",
      a: [
        { liste: [{ s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" }], apres: " porte un prénom dans chaque cœur." },
        { liste: [{ s: "collier-barre-verticale", l: "le collier Quatre Mots" }], avant: " ", apres: " se grave sur ses quatre faces." },
        { liste: [{ s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D horizontal" }], avant: " Pour une grande famille, ", apres: " garde la photo de tous les petits-enfants." },
      ],
    },
  ],
  "fete-des-grands-peres": [
    {
      q: "Quand tombe la Fête des grands-pères ?",
      statique: true,
      a: ["En France, la Fête des grands-pères tombe le premier dimanche d'octobre : la prochaine est le ", { fete: "grands-peres" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir à un grand-père ?",
      a: [
        { liste: [
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
          { s: "porte-cles-cuir-a-graver", l: "le porte-clés aspect cuir à graver" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent de son prénom, des prénoms de ses petits-enfants ou d'une photo de famille.",
      ],
    },
  ],
  "nouvel-an-chinois": [
    {
      q: "Quand tombe le Nouvel An chinois ?",
      statique: true,
      a: ["Le prochain Nouvel An chinois tombe le ", { fete: "nouvel-an-chinois" }, ". Sa date change chaque année, car elle suit le calendrier lunaire. Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Peut-on faire graver un texte en chinois ?",
      statique: true,
      a: ["Oui. Sous le champ du texte, choisissez « Chinois » dans « Langue de la gravure » : votre texte est traduit, ou vous écrivez directement en chinois, puis vous le relisez avant de commander. Il est gravé exactement comme il s'affiche."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour le Nouvel An chinois ?",
      a: [
        { liste: [
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "bracelet-femme-coeur", l: "le bracelet femme cœur" },
          { s: "verre-a-vin-grave", l: "le verre à vin gravé" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent d'un vœu, d'un prénom ou d'une photo.",
      ],
    },
  ],
  "aid-el-fitr": [
    {
      q: "Quand tombe l'Aïd el-Fitr ?",
      statique: true,
      a: ["Le prochain Aïd el-Fitr est attendu le ", { fete: "aid" }, ", à un jour près selon l'observation de la lune. Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Peut-on faire graver un texte en arabe ?",
      statique: true,
      a: ["Oui. Sous le champ du texte, choisissez « Arabe » dans « Langue de la gravure » : votre texte est traduit, ou vous écrivez directement en arabe, puis vous le relisez avant de commander. Il est gravé exactement comme il s'affiche."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour l'Aïd ?",
      a: [
        { liste: [
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "bracelet-femme-coeur", l: "le bracelet femme cœur" },
          { s: "couverts-enfants-personnalises", l: "les couverts enfant au prénom" },
        ] },
        " se gravent d'un prénom, d'un vœu ou d'une photo de famille.",
      ],
    },
  ],
  hanoukka: [
    {
      q: "Quand tombe Hanoukka ?",
      statique: true,
      a: ["La prochaine fête de Hanoukka commence le soir du ", { fete: "hanoukka" }, " et dure huit jours. Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Peut-on faire graver un texte en hébreu ?",
      statique: true,
      a: ["Oui. Sous le champ du texte, choisissez « Hébreu » dans « Langue de la gravure » : votre texte est traduit, ou vous écrivez directement en hébreu, puis vous le relisez avant de commander. Il est gravé exactement comme il s'affiche."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour Hanoukka ?",
      a: [
        { liste: [
          { s: "verre-a-vin-grave", l: "le verre à vin gravé" },
          { s: "carafe-a-whisky-gravee", l: "la carafe gravée" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent d'un prénom, d'un vœu ou d'une photo.",
      ],
    },
  ],
  deepavali: [
    {
      q: "Quand tombe Deepavali (Diwali) ?",
      statique: true,
      a: ["Le prochain Deepavali tombe le ", { fete: "deepavali" }, ". Sa date change chaque année. Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Peut-on faire graver un texte en tamoul ?",
      statique: true,
      a: ["Oui. Sous le champ du texte, choisissez « Tamoul » dans « Langue de la gravure » : votre texte est traduit, ou vous écrivez directement en tamoul, puis vous le relisez avant de commander. Il est gravé exactement comme il s'affiche."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour Deepavali ?",
      a: [
        { liste: [
          { s: "bougeoir-fleur-de-lotus", l: "le bougeoir fleur de lotus" },
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "bracelet-femme-coeur", l: "le bracelet femme cœur" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent d'un prénom, d'un vœu ou d'une photo de famille.",
      ],
    },
  ],
  "fetes-tamoules": [
    {
      q: "Quand tombent Thai Pongal et le Nouvel An tamoul ?",
      statique: true,
      a: ["Le prochain Thai Pongal tombe le ", { fete: "pongal" }, ", et le prochain Nouvel An tamoul (Puthandu) le ", { fete: "puthandu" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Peut-on faire graver un texte en tamoul ?",
      statique: true,
      a: ["Oui. Sous le champ du texte, choisissez « Tamoul » dans « Langue de la gravure » : votre texte est traduit, ou vous écrivez directement en tamoul, puis vous le relisez avant de commander. Il est gravé exactement comme il s'affiche."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour Pongal ou le Nouvel An tamoul ?",
      a: [
        { liste: [
          { s: "collier-coeur-grave", l: "le collier cœur à graver" },
          { s: "bracelet-homme-identite-gourmette", l: "la gourmette d'identité" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
          { s: "bougeoir-fleur-de-lotus", l: "le bougeoir fleur de lotus" },
        ] },
        " se gravent d'un prénom, d'un vœu ou d'une photo de famille.",
      ],
    },
  ],
  "grands-parents": [
    {
      q: "Quand ont lieu les fêtes des grands-parents ?",
      statique: true,
      a: ["En France, la Fête des grands-mères tombe le premier dimanche de mars (la prochaine : le ", { fete: "grands-meres" }, ") et la Fête des grands-pères le premier dimanche d'octobre (la prochaine : le ", { fete: "grands-peres" }, "). Voir nos idées pour la ", { lien: "/offrir/fete-des-grands-meres", l: "Fête des grands-mères" }, " et pour la ", { lien: "/offrir/fete-des-grands-peres", l: "Fête des grands-pères" }, "."],
    },
    {
      q: "Quel cadeau offrir à ses deux grands-parents ?",
      a: [
        { liste: [
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
          { s: "puzzle-photo-grave", l: "le puzzle photo en bois" },
          { s: "cle-usb-bois-coffret", l: "la clé USB en bois dans son coffret" },
          { s: "verre-a-vin-grave", l: "les verres à vin gravés" },
        ] },
        " se gravent d'une photo de famille, des prénoms des petits-enfants ou d'une date.",
      ],
    },
    {
      q: "Comment graver les prénoms de tous les petits-enfants ?",
      a: [
        { liste: [{ s: "collier-3coeurs", l: "le collier 3 cœurs entrelacés" }], apres: " porte un prénom dans chaque cœur." },
        { liste: [{ s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D horizontal" }], avant: " ", apres: " garde la photo de tous les petits-enfants réunis." },
      ],
    },
  ],
  halloween: [
    {
      q: "Quand tombe Halloween ?",
      statique: true,
      a: ["Halloween tombe chaque année le 31 octobre : le prochain est le ", { fete: "halloween" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé pour une soirée d'Halloween ?",
      a: [
        { liste: [
          { s: "verre-a-cocktail-grave", l: "les verres à cocktail gravés" },
          { s: "gobelet-isotherme-40oz", l: "le gobelet isotherme gravé" },
          { s: "verre-a-whisky-grave", l: "le verre à whisky gravé" },
        ] },
        " se gravent d'un prénom, d'un dessin ou de votre image.",
      ],
    },
    {
      q: "Peut-on faire graver un dessin d'Halloween ?",
      statique: true,
      a: ["Oui. Sur les verres, la carafe, le gobelet et le cristal, envoyez votre dessin avec le bouton « Choisir une photo » sur la fiche du produit, ou décrivez votre idée avec « Faire une demande particulière »."],
    },
    {
      q: "Un cadeau d'Halloween pour un enfant ?",
      a: [
        { liste: [
          { s: "puzzle-foret", l: "le puzzle en bois au prénom de l'enfant" },
          { s: "plaque-de-porte-enfant", l: "la plaque de porte au prénom" },
        ] },
        " se gravent au prénom de l'enfant.",
      ],
    },
  ],
  "saint-nicolas": [
    {
      q: "Quand tombe la Saint-Nicolas ?",
      statique: true,
      a: ["La Saint-Nicolas tombe chaque année le 6 décembre : la prochaine est le ", { fete: "saint-nicolas" }, ". Elle est surtout fêtée dans le Nord et l'Est de la France, en Belgique et au Luxembourg. Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir à un enfant pour la Saint-Nicolas ?",
      a: [
        { liste: [
          { s: "puzzle-foret", l: "le puzzle en bois au prénom de l'enfant" },
          { s: "couverts-enfants-personnalises", l: "les couverts enfant au prénom" },
          { s: "plaque-de-porte-enfant", l: "la plaque de porte au prénom" },
          { s: "veilleuse-arbre-de-vie-prenom", l: "la veilleuse arbre de vie au prénom" },
        ] },
        " se gravent au prénom de l'enfant.",
      ],
    },
    {
      q: "Livrez-vous en Belgique et au Luxembourg ?",
      statique: true,
      a: ["Oui. Choisissez votre pays dans le panier : le prix de la livraison s'affiche avant le paiement."],
    },
  ],
  "nouvel-an": [
    {
      q: "Quel cadeau personnalisé offrir pour le Nouvel An ?",
      a: [
        { liste: [
          { s: "flute-a-champagne-gravee", l: "les flûtes à champagne gravées" },
          { s: "verre-a-cocktail-grave", l: "les verres à cocktail gravés" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
          { s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" },
        ] },
        " se gravent de vos prénoms, de la nouvelle année ou d'une photo souvenir.",
      ],
    },
    {
      q: "Que faire graver pour le Nouvel An ?",
      statique: true,
      a: ["« Bonne année » et l'année qui commence, vos prénoms, la date du réveillon ou un vœu. Le prochain jour de l'An tombe le ", { fete: "nouvel-an" }, " : chaque pièce est gravée à la commande, pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Un souvenir de l'année écoulée ?",
      a: [
        { liste: [{ s: "cristal-photo-3d-horizontal", l: "le cristal photo 3D" }], apres: " garde votre plus belle photo de l'année, gravée en relief." },
        { liste: [{ s: "puzzle-photo-grave", l: "le puzzle photo en bois" }], avant: " ", apres: " en fait un jeu à reconstituer en famille." },
      ],
    },
  ],
  "fete-des-peres": [
    {
      q: "Quand tombe la Fête des pères ?",
      statique: true,
      a: ["En France, la prochaine Fête des pères tombe le ", { fete: "peres" }, ". Chaque pièce est gravée à la commande : pensez à commander quelques jours à l'avance."],
    },
    {
      q: "Quel cadeau personnalisé offrir pour la Fête des pères ?",
      a: [
        { liste: [
          { s: "verre-a-whisky-fete-des-peres", l: "le verre à whisky à modèles" },
          { s: "carafe-a-whisky-gravee", l: "la carafe à whisky gravée" },
          { s: "bracelet-homme-identite-gourmette", l: "la gourmette d'identité" },
        ] },
        " se gravent de son prénom, d'un message ou du prénom de ses enfants.",
      ],
    },
    {
      q: "Un cadeau gravé pour papa à moins de 20 € ?",
      a: [
        { liste: [
          { s: "porte-cles-cuir-a-graver", l: "le porte-clés aspect cuir à graver" },
          { s: "verre-a-whisky-fete-des-peres", l: "le verre à whisky à modèles" },
          { s: "bracelet-cordon-plaque", l: "le bracelet cordon à plaque gravée" },
          { s: "support-telephone-bois-grave", l: "le support de téléphone en bois gravé" },
        ], max: 20 },
        " commencent sous 20 €.",
      ],
    },
  ],
};

const JOURS_L = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS_L = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
// Fêtes au calendrier lunaire ou solaire (dates qui bougent) : dates VÉRIFIÉES le 24/11/2026 sur plusieurs
// sources (Chabad.org pour Hanoukka, calendrier Umm al-Qura pour l'Aïd, drikpanchang / publicholidays.in pour
// les fêtes tamoules, travelchinaguide / CUNY pour le Nouvel An chinois et Deepavali). Quand la dernière date
// est passée, la question « quand tombe… » disparaît toute seule : ajouter alors l'année suivante, vérifiée.
const DATES_FIXES = {
  "nouvel-an-chinois": ["2027-02-06", "2028-01-26"],
  aid: ["2027-03-09", "2028-02-26"],
  hanoukka: ["2026-12-04", "2027-12-24", "2028-12-12"],
  deepavali: ["2027-10-28"],
  pongal: ["2027-01-15"],
  puthandu: ["2027-04-14"],
};
const premierDimanche = (an, mois) => { const d = new Date(Date.UTC(an, mois, 1)); d.setUTCDate(1 + ((7 - d.getUTCDay()) % 7)); return d; };
function prochaineDate(k) {
  const auj = new Date(); auj.setUTCHours(0, 0, 0, 0);
  if (DATES_FIXES[k]) return DATES_FIXES[k].map((x) => new Date(`${x}T00:00:00Z`)).find((d) => d >= auj) || null;
  const FIXES = { halloween: [9, 31], "saint-nicolas": [11, 6], "nouvel-an": [0, 1] }; // [mois 0-11, jour]
  if (FIXES[k]) {
    const [m, j] = FIXES[k];
    let d = new Date(Date.UTC(auj.getUTCFullYear(), m, j));
    if (d < auj) d = new Date(Date.UTC(auj.getUTCFullYear() + 1, m, j));
    return d;
  }
  if (k === "grands-meres" || k === "grands-peres") {
    const mois = k === "grands-meres" ? 2 : 9; // 1er dimanche de mars / d'octobre
    let d = premierDimanche(auj.getUTCFullYear(), mois);
    if (d < auj) d = premierDimanche(auj.getUTCFullYear() + 1, mois);
    return d;
  }
  return prochaineFete(k).date;
}
/** « dimanche 30 mai 2027 » : prochaine date de la fête, calculée ou tirée de la table vérifiée. null si inconnue. */
function dateFete(k) {
  const d = prochaineDate(k);
  return d ? `${JOURS_L[d.getUTCDay()]} ${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MOIS_L[d.getUTCMonth()]} ${d.getUTCFullYear()}` : null;
}

function prixTexte(p) {
  const pc = prixCarte(p);
  if (!pc) return null;
  return { lo: pc.lo, texte: pc.hi > pc.lo ? `dès ${euro(pc.lo)}` : euro(pc.lo) };
}

function joindre(items) {
  if (items.length <= 1) return items;
  const out = [];
  items.forEach((it, i) => {
    if (i > 0) out.push(i === items.length - 1 ? " et " : ", ");
    out.push(it);
  });
  return out;
}

/** Morceaux d'une réponse : chaînes et liens { href, label, prix }. null si la phrase n'a plus de produit. */
function construire(segments, parSlug, statique = false) {
  const out = [];
  let produits = 0;
  for (const seg of segments) {
    if (typeof seg === "string") { out.push(seg); continue; }
    if (seg.lien) { out.push({ href: seg.lien, label: seg.l, prix: null }); continue; }
    if (seg.fete) { const t = dateFete(seg.fete); if (!t) return null; out.push(t); continue; }
    const items = [];
    for (const it of seg.liste) {
      const p = parSlug.get(it.s);
      const prix = p && prixTexte(p);
      if (!prix || (seg.max && prix.lo >= seg.max)) continue;
      items.push({ href: p.pageDediee || `/produit/${p.slug}`, label: it.l, prix: prix.texte });
    }
    if (!items.length) {
      if (!seg.avant && !seg.apres) return null; // morceau principal sans produit → question retirée
      continue;
    }
    produits += items.length;
    if (seg.avant) out.push(seg.avant);
    const liste = joindre(items);
    out.push(...liste);
    if (seg.apres) out.push(seg.apres);
  }
  if (!produits && !statique) return null;
  // Majuscule au libellé qui ouvre une phrase (début de réponse ou après un point).
  for (let i = 0; i < out.length; i++) {
    if (typeof out[i] === "string") continue;
    const avant = out.slice(0, i).map((x) => (typeof x === "string" ? x : x.label)).join("");
    if (!avant.trim() || /[.!?]\s*$/.test(avant)) out[i] = { ...out[i], label: out[i].label.charAt(0).toUpperCase() + out[i].label.slice(1) };
  }
  return out;
}

/** Questions-réponses prêtes à afficher pour une occasion ([] si aucune). */
export function faqOccasion(slug, catalog, settings) {
  const liste = FAQ[slug];
  if (!liste) return [];
  const parSlug = new Map((catalog || []).map((p) => [p.slug, p]));
  const out = [];
  for (const f of liste) {
    if (f.noelEmballages) {
      const cfg = configNoel(settings);
      if (!cfg.on) continue; // Noël éteint dans Gestion → pas un mot sur les emballages de Noël
      const emb = cfg.emballages.filter((e) => !e.masque);
      if (!emb.length) continue;
      const pack = emb.find((e) => e.id === "pack");
      const autres = emb.filter((e) => e.id !== "pack").map((e) => e.nom.charAt(0).toLowerCase() + e.nom.slice(1));
      const noms = pack ? [...autres, `le Pack de Noël à ${euro(pack.prix)}`] : autres;
      const phrase = `Oui. Pour les bijoux, nous proposons des emballages de Noël : ${joindre(noms).join("")}. Chacun est livré avec son étiquette offerte.`;
      out.push({ q: f.q, parts: [phrase] });
      continue;
    }
    const parts = construire(f.a, parSlug, f.statique === true);
    if (parts) out.push({ q: f.q, parts });
  }
  return out;
}

/** Texte brut d'une réponse (données structurées FAQPage). */
export function texteReponse(parts) {
  return parts.map((x) => (typeof x === "string" ? x : x.prix ? `${x.label} (${x.prix})` : x.label)).join("").replace(/\s+/g, " ").trim();
}

// Titre du bloc, par occasion (« Vos questions pour Mariage » ne se dit pas).
const TITRES = {
  noel: "Vos questions pour Noël",
  mariage: "Vos questions pour un mariage",
  naissance: "Vos questions pour une naissance",
  amour: "Vos questions pour un cadeau d'amour",
  "pour-lui": "Vos questions pour un cadeau pour lui",
  "pour-elle": "Vos questions pour un cadeau pour elle",
  famille: "Vos questions pour un cadeau de famille",
  "saint-valentin": "Vos questions pour la Saint-Valentin",
  "fete-des-meres": "Vos questions pour la Fête des mères",
  "fete-des-peres": "Vos questions pour la Fête des pères",
  paques: "Vos questions pour Pâques",
  "fete-des-grands-meres": "Vos questions pour la Fête des grands-mères",
  "fete-des-grands-peres": "Vos questions pour la Fête des grands-pères",
  "nouvel-an-chinois": "Vos questions pour le Nouvel An chinois",
  "aid-el-fitr": "Vos questions pour l'Aïd el-Fitr",
  hanoukka: "Vos questions pour Hanoukka",
  deepavali: "Vos questions pour Deepavali",
  "fetes-tamoules": "Vos questions pour Pongal et le Nouvel An tamoul",
  "grands-parents": "Vos questions pour les fêtes des grands-parents",
  halloween: "Vos questions pour Halloween",
  "saint-nicolas": "Vos questions pour la Saint-Nicolas",
  "nouvel-an": "Vos questions pour le Nouvel An",
};
export const titreFaq = (slug, label) => TITRES[slug] || `Vos questions : ${label}`;
