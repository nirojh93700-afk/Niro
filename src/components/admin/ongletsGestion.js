// Une ADRESSE par écran de l'accueil Gestion (02/10/2026) : /gestion/avis, /gestion/devis…
// au lieu de /gestion#avis. Les anciens liens « #onglet » marchent toujours.
// ⚠️ Les noms évitent les dossiers existants : /gestion/commandes (= file de production)
// et /gestion/reglages (= réglages produits) gardent leur page ; leurs onglets homonymes
// deviennent /gestion/fiches et /gestion/parametres.
export const ONGLETS = {
  accueil: "/gestion",
  assistant: "/gestion/assistant",
  commandes: "/gestion/fiches",
  devis: "/gestion/devis",
  avis: "/gestion/avis",
  produits: "/gestion/produits",
  categories: "/gestion/categories",
  gravure: "/gestion/gravure",
  newsletter: "/gestion/newsletter",
  promos: "/gestion/promotions",
  stats: "/gestion/ventes",
  apparence: "/gestion/apparence",
  livraison: "/gestion/livraison",
  reglages: "/gestion/parametres",
};

const PAR_CHEMIN = Object.fromEntries(Object.entries(ONGLETS).map(([k, v]) => [v, k]));

/** Onglet de l'accueil Gestion correspondant à une adresse, ou "" si ce n'en est pas un. */
export function ongletDuChemin(path) {
  return PAR_CHEMIN[String(path || "").replace(/\/+$/, "") || "/gestion"] || "";
}

/** Adresse d'un onglet (repli : l'ancienne ancre pour les onglets sans adresse propre). */
export function cheminDeLOnglet(id) {
  return ONGLETS[id] || `/gestion#${id}`;
}
