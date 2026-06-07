// =============================================================================
// PLATEFORME — données du tableau de bord (Phase 1)
// =============================================================================
// Pour l'instant, les clientes sont définies ici (données d'exemple). Plus tard
// (Phase 2+), on les lira depuis Firebase. La structure est volontairement
// identique à ce qu'on stockera en base, pour ne rien réécrire ensuite.
// =============================================================================

// Une cliente = une boutique gérée depuis la plateforme.
export const clients = [
  {
    id: "niv-creation",
    nom: "Niv Création",
    domaine: "nivcreation.fr",
    etatSite: "en-ligne",
    abonnement: { formule: null, prix: 0, etat: "aucun" },
    adminUrl: "/gestion",
    depuis: "2026-03",
    vous: true, // votre propre boutique, reliée à la plateforme
  },
  {
    id: "boutique-marie",
    nom: "Boutique Marie",
    domaine: "boutique-marie.fr",
    etatSite: "en-ligne", // en-ligne | maintenance | preparation
    abonnement: { formule: "Active", prix: 59, etat: "actif" }, // actif | retard | aucun
    adminUrl: "https://boutique-marie.fr/gestion",
    depuis: "2026-03",
  },
  {
    id: "atelier-du-bois",
    nom: "Atelier du Bois",
    domaine: "atelierdubois.fr",
    etatSite: "en-ligne",
    abonnement: { formule: "Sérénité", prix: 29, etat: "actif" },
    adminUrl: "https://atelierdubois.fr/gestion",
    depuis: "2026-04",
  },
  {
    id: "savonnerie-lou",
    nom: "Savonnerie Lou",
    domaine: "savonnerie-lou.fr",
    etatSite: "en-ligne",
    abonnement: { formule: "Sérénité", prix: 29, etat: "retard" },
    adminUrl: "https://savonnerie-lou.fr/gestion",
    depuis: "2026-04",
  },
  {
    id: "ceramique-claire",
    nom: "Céramique Claire",
    domaine: "ceramique-claire.fr",
    etatSite: "maintenance",
    abonnement: { formule: "Premium", prix: 99, etat: "actif" },
    adminUrl: "https://ceramique-claire.fr/gestion",
    depuis: "2026-05",
  },
  {
    id: "fleurs-de-sel",
    nom: "Fleurs de Sel",
    domaine: "fleursdesel.fr",
    etatSite: "preparation",
    abonnement: { formule: null, prix: 0, etat: "aucun" },
    adminUrl: null,
    depuis: "2026-06",
  },
];

// Calcule les chiffres affichés en haut du tableau de bord.
export function getStats(liste = clients) {
  const enLigne = liste.filter((c) => c.etatSite === "en-ligne").length;
  const abosActifs = liste.filter((c) => c.abonnement?.etat === "actif").length;
  const revenusMois = liste
    .filter((c) => c.abonnement?.etat === "actif")
    .reduce((somme, c) => somme + (c.abonnement?.prix || 0), 0);
  const alertes = liste.filter(
    (c) => c.abonnement?.etat === "retard" || c.etatSite === "maintenance"
  ).length;
  return { total: liste.length, enLigne, abosActifs, revenusMois, alertes };
}
