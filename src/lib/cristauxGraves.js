// « Cristaux déjà gravés » — données de la page /cristaux-graves (maquette validée v14, en ligne le 10/10/2026).
// Recopiées du générateur tools/maquettes/cristaux-graves.py (MODELES, DESSINS, ZODIAQUE, FAMILLES) : une
// modification se fait des DEUX côtés. Prix des tailles = ceux des blocs photo ; texte compris (10/10) ; zodiaque :
// prénom, date (avec l'heure) et ville +2 € chacun (gérant, 09/10/2026). Prix de confiance : products.js
// (produit « cristal-deja-grave », engravingPricing) ; ce fichier ne sert qu'à l'affichage.
export const CG_DOSSIER = "/produits/cristaux-graves";

export const CG_MODELES = [
  {"k": "ourson", "nom": "Ourson à la rose", "fam": "amour", "phrase": "Un ourson qui offre sa rose, avec « I Love You » gravé dessous."},
  {"k": "rose", "nom": "Rose éternelle", "fam": "amour", "phrase": "Une rose qui ne fanera jamais."},
  {"k": "coeur", "nom": "Cœur dans le cœur", "fam": "amour", "phrase": "Deux cœurs l'un dans l'autre, en relief."},
  {"k": "fillette-ballon", "nom": "Fillette au ballon cœur", "fam": "amour", "phrase": "Une petite fille qui tend la main vers son ballon."},
  {"k": "colibri", "nom": "Colibri et sa fleur", "fam": "animaux", "phrase": "Le colibri en plein vol, butinant sa fleur."},
  {"k": "perroquets", "nom": "Envol de perroquets", "fam": "animaux", "phrase": "Trois perroquets en vol, plume par plume."},
  {"k": "cheval", "nom": "Cheval de feu", "fam": "animaux", "phrase": "Un cheval cabré, la crinière en flammes."},
  {"k": "ours-mandala", "nom": "Ours mandala", "fam": "animaux", "phrase": "Une tête d'ours ciselée de motifs mandala."},
  {"k": "panda", "nom": "Panda et bambou", "fam": "animaux", "phrase": "Un panda assis, son bambou dans les pattes."},
  {"k": "chat-sapin", "nom": "Chaton au pied du sapin", "fam": "noel", "phrase": "Un chaton qui joue avec une boule de Noël."},
  {"k": "sapin", "nom": "Sapin étoilé", "fam": "noel", "phrase": "Un sapin de Noël coiffé de son étoile."},
  {"k": "bouddha", "nom": "Bouddha au lotus", "fam": "zen", "phrase": "Un visage apaisé posé sur une fleur de lotus."},
  {"k": "ange", "nom": "Ange aux ailes déployées", "fam": "zen", "phrase": "Un ange gardien, ailes grandes ouvertes."},
  {"k": "genie", "nom": "Génie de la lampe", "fam": "legendes", "phrase": "Le génie qui sort de sa lampe."},
  {"k": "lys-dragon", "nom": "Dragon et lys", "fam": "legendes", "phrase": "Un petit dragon lové au pied d'un lys."},
  {"k": "tour-eiffel", "nom": "Tour Eiffel", "fam": "voyage", "phrase": "La Dame de fer, dans tous ses détails."},
];

export const CG_DESSINS = [
  {"k": "maries-couronne", "nom": "Mariés en couronne fleurie", "fam": "amour"},
  {"k": "maries-coeur", "nom": "Mariés dans un cœur", "fam": "amour"},
  {"k": "maries-bouquet", "nom": "Mariés au bouquet", "fam": "amour"},
  {"k": "couple-roses", "nom": "Couple et roses", "fam": "amour"},
  {"k": "ange-ciel", "nom": "Ange vers la lumière", "fam": "zen"},
  {"k": "bouddha-lotus", "nom": "Bouddha sur le lotus", "fam": "zen"},
  {"k": "bouddha-mandala", "nom": "Bouddha au mandala", "fam": "zen"},
  {"k": "fee-rose", "nom": "Fée sur la rose", "fam": "legendes"},
  {"k": "fee-lune", "nom": "Fée de lune", "fam": "legendes"},
  {"k": "fee-silhouette", "nom": "Fée aux ailes ciselées", "fam": "legendes"},
  {"k": "archere", "nom": "L'archère", "fam": "legendes"},
  {"k": "colibri-rose", "nom": "Colibri à la rose", "fam": "animaux"},
  {"k": "colibri-couleur", "nom": "Colibri à la rose (version pleine)", "fam": "animaux"},
  {"k": "cheval-tete", "nom": "Cheval à la crinière", "fam": "animaux"},
  {"k": "cle-de-sol", "nom": "Clé de sol et papillon", "fam": "musique"},
];

export const CG_ZODIAQUE = [
  {"k": "belier", "nom": "Bélier", "dates": "21 mars – 19 avril"},
  {"k": "taureau", "nom": "Taureau", "dates": "20 avril – 20 mai"},
  {"k": "gemeaux", "nom": "Gémeaux", "dates": "21 mai – 20 juin"},
  {"k": "cancer", "nom": "Cancer", "dates": "21 juin – 22 juillet"},
  {"k": "lion", "nom": "Lion", "dates": "23 juillet – 22 août"},
  {"k": "vierge", "nom": "Vierge", "dates": "23 août – 22 septembre"},
  {"k": "balance", "nom": "Balance", "dates": "23 septembre – 22 octobre"},
  {"k": "scorpion", "nom": "Scorpion", "dates": "23 octobre – 21 novembre"},
  {"k": "sagittaire", "nom": "Sagittaire", "dates": "22 novembre – 21 décembre"},
  {"k": "capricorne", "nom": "Capricorne", "dates": "22 décembre – 19 janvier"},
  {"k": "verseau", "nom": "Verseau", "dates": "20 janvier – 18 février"},
  {"k": "poissons", "nom": "Poissons", "dates": "19 février – 20 mars"},
];

export const CG_FAMILLES = [
  {"k": "tous", "nom": "Tous les modèles"},
  {"k": "amour", "nom": "Amour"},
  {"k": "animaux", "nom": "Animaux"},
  {"k": "noel", "nom": "Noël"},
  {"k": "zen", "nom": "Zen & spirituel"},
  {"k": "legendes", "nom": "Légendes"},
  {"k": "voyage", "nom": "Voyage"},
];

export const CG_TAILLES = [
  { id: "petit", nom: "Petit", v: "5×5×8 cm", h: "8×5×5 cm", prix: 39.9, socle: 14.9 },
  { id: "moyen", nom: "Moyen", v: "5×6×10 cm", h: "10×6×5 cm", prix: 59.9, socle: 19.9 },
  { id: "grand", nom: "Grand", v: "6×8×12 cm", h: "12×8×6 cm", prix: 99.9, socle: 19.9 },
  { id: "xl", nom: "XL", v: "6×10×15 cm", h: "15×10×6 cm", prix: 149.9, socle: 19.9 },
];

// Gérant, 10/10/2026 : « le premier texte c'est gratuit » (modèles et dessins) ; le nom du signe est compris ;
// zodiaque : prénom, date et ville +2 € chacun.
export const CG_TEXTE_PRIX = 0;
export const CG_ZOD_PRIX = 2;
export const CG_SLUG = "cristal-deja-grave";
// Identifiant de variante : cristal-grave-<v|h>-<taille>
export const cgVariantId = (fmt, taille) => `cristal-grave-${fmt}-${taille}`;
