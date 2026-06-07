// =============================================================================
// CONFIGURATION CENTRALE DE LA MARQUE  ◆  source unique de vérité
// =============================================================================
// Pour DUPLIQUER ce site chez un nouveau client, c'est ICI qu'on commence.
// On change les valeurs ci-dessous (nom, couleurs, contact, domaine), puis on
// suit la checklist : docs/REVENDRE-SITES/PROCEDURE-NOUVEAU-CLIENT.md
//
// Règle d'or : ne JAMAIS réécrire le nom de la marque « en dur » dans les pages.
// On l'importe d'ici : import { MARQUE } from "@/config/marque";
// =============================================================================

export const MARQUE = {
  // --- Identité ------------------------------------------------------------
  nom: "Niv Création",
  // Mot-clé court (pour les balises <title>, ex. "... | Niv Création")
  nomCourt: "Niv Création",
  baseline: "Atelier français — gravure & découpe laser",
  // Phrase de description générale (SEO + page d'accueil)
  description:
    "Atelier français de gravure et découpe laser. Bijoux personnalisés, décorations de mariage et cadeaux gravés sur mesure, fabriqués à la main.",

  // --- Couleurs de la charte (e-mails, accents) ---------------------------
  couleurs: {
    or: "#a98935", // couleur principale (doré)
    creme: "#faf6ee", // fond clair
    encre: "#2b2620", // texte foncé
  },

  // --- Coordonnées (surchargeable par variables d'environnement) ----------
  // En production, on renseigne plutôt les variables .env (voir .env.example) ;
  // les valeurs ci-dessous servent de repli si la variable est absente.
  domaine: "nivcreation.fr",
  contactEmail: "contact.nivcreation@gmail.com",
  instagram: "https://instagram.com/nivcreation",
  logoUrl:
    "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111",
};

// URL publique du site, résolue depuis l'environnement (sans / final).
export function siteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || `https://${MARQUE.domaine}`).trim();
  return raw.replace(/\/$/, "");
}

// Coordonnées effectives = variable d'environnement si présente, sinon repli.
export function coordonnees() {
  return {
    nom: MARQUE.nom,
    contactEmail: (process.env.CONTACT_EMAIL || MARQUE.contactEmail).trim(),
    instagram: (process.env.INSTAGRAM_URL || MARQUE.instagram).trim(),
    logoUrl: (process.env.LOGO_URL || MARQUE.logoUrl).trim(),
    siteUrl: siteUrl(),
    domaine: MARQUE.domaine,
  };
}
