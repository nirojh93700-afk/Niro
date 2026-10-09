// Où mène un clic sur le nom de la catégorie d'une fiche produit (fil d'Ariane) :
// « Jeux en bois » n'a pas de page à part, ses puzzles sont un rayon de l'univers
// Bébé & Enfant → on arrive DIRECTEMENT sur ce rayon, pas en haut de la page.
// L'ancre vient du rangement (univers.js : id de rayon `r-<univers>-<rang>`) ; le test
// `npm run test-lien-categorie` vérifie qu'elle pointe bien le rayon « Jeux en bois ».
export const RAYON_JEUX = "/boutique/enfants#r-enfants-2";

export function lienCategorie(category) {
  if (category === "cristal") return "/cristaux";
  if (category === "naissance") return "/naissance";
  if (category === "jeux") return RAYON_JEUX;
  return `/boutique/${category}`;
}
