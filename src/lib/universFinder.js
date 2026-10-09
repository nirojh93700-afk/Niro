// Tuiles photo du parcours « Trouver le bon cadeau » (maquette « Mélange ») :
// une pièce GRAVÉE pour illustrer chaque choix. Les fêtes à venir reçoivent la
// photo de leur occasion.
export const QUI_TILES = [
  { v: "elle", label: "Pour elle", image: "/produits/collier-coeur-grave-2.jpg" },
  { v: "lui", label: "Pour lui", image: "/produits/verre_a_whisky_exemple_face.jpg" },
  { v: "couple", label: "Pour un couple", image: "/produits/cristal-v-couple.jpg" },
  { v: "enfant", label: "Pour bébé & enfant", image: "/produits/couverts_enfants_ex_enfant.jpg" },
  { v: "parents", label: "Pour des parents", image: "/produits/cristal-h-famille.jpg" },
];
export const OCC_TILES = [
  { v: "naissance", label: "Naissance & baptême", image: "/produits/couverts_enfants_ex_prenom.jpg" },
  { v: "mariage", label: "Mariage", image: "/produits/numero_table_arche_geometrique_relief_bois.jpeg" },
  { v: "anniversaire", label: "Anniversaire", image: "/produits/collier-coeur-plaques-1.jpg" },
  { v: "amour", label: "Amour", image: "/produits/collier-double-coeur-6.jpg" },
];
export const FETE_PHOTO = {
  noel: "/produits/carafe_gravee.jpg",
  amour: "/produits/collier-double-coeur-6.jpg",
  "pour-elle famille": "/produits/collier-coeur-grave-2.jpg",
  "pour-lui famille": "/produits/verre_a_whisky_exemple_face.jpg",
};
// Ce que le parcours transmet aux cartes (pas de date, pas de champ inutile).
export const carteLegere = (c) => ({ slug: c.slug, name: c.name, href: c.href, image: c.image, badge: c.badge, perso: c.perso, prix: c.prix, lo: c.lo, hi: c.hi, qui: c.qui, occ: c.occ });
