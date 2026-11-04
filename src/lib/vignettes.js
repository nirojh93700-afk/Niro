// Vignettes allégées des cartes et du mur (voir tools/vignettes.mjs).
// `vignette(src)` renvoie la copie WebP de 480 px quand elle existe, sinon la
// photo d'origine : une photo sans vignette (téléversée depuis Gestion, nouveau
// produit avant `npm run vignettes`) s'affiche toujours.
import manifest from "./vignettes.json";

export function vignette(src) {
  if (!src || typeof src !== "string") return src;
  return manifest[src] || src;
}
