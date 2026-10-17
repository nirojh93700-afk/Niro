// Les photos de la boutique sont toutes hébergées par le site lui-même (public/produits/catalogue/).
// Certaines venaient de l'ancienne boutique en ligne (17/10/2026 : rapatriées, fichiers d'origine
// sans retouche). Si une ancienne adresse traîne encore quelque part — réglage enregistré dans
// Gestion, description, ancienne commande —, elle est remplacée ici par la copie du site : rien ne
// dépend plus d'un hébergeur extérieur. Le logo est servi à /logo-niv-creation.jpg.
const ANCIEN = /https?:\/\/cdn\.shopify\.com\/s\/files\/1\/0675\/7738\/0907\/files\/([A-Za-z0-9._-]+)(?:\?[A-Za-z0-9=&._-]*)?/g;

export const LOGO_FICHIER = "/logo-niv-creation.jpg";

// Adresse complète du logo (e-mails, icônes, Google). LOGO_URL peut la remplacer, sauf si elle
// pointe encore vers l'ancien hébergeur.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://nivcreation.fr").trim().replace(/\/$/, "");
const LOGO_ENV = (process.env.LOGO_URL || "").trim();
export const LOGO_URL = LOGO_ENV && !LOGO_ENV.includes("cdn.shopify.com") ? LOGO_ENV : SITE + LOGO_FICHIER;

export function photoLocale(texte) {
  if (typeof texte !== "string" || !texte.includes("cdn.shopify.com")) return texte;
  return texte.replace(ANCIEN, (_m, nom) => (nom === "IMG_6758.jpg" ? LOGO_FICHIER : `/produits/catalogue/${nom}`));
}

// Même remplacement dans tout un objet (produit, réglages, commande).
export function sansAncienHebergeur(objet) {
  if (objet == null) return objet;
  if (typeof objet === "string") return photoLocale(objet);
  const json = JSON.stringify(objet);
  if (!json || !json.includes("cdn.shopify.com")) return objet;
  return JSON.parse(photoLocale(json));
}
