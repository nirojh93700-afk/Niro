// Date d'AJOUT de chaque produit (retrouvée dans l'historique git le 21/08/2026).
// Sert à : 1) trier le bandeau « Vient d'arriver » de la page d'accueil (les plus
// récents d'abord) ; 2) éteindre automatiquement l'étiquette « Nouveau » au bout
// de 30 jours (voir NOUVEAU_JOURS).
// ⚠️ RÈGLE : à CHAQUE nouveau produit, ajouter ici son slug avec la date du jour
// (AAAA-MM-JJ). Un produit absent de cette liste est traité comme ancien
// (pas d'étiquette « Nouveau », pas de bandeau).

export const NOUVEAU_JOURS = 30;

export const PRODUCT_DATES = {
  "collier-enveloppe-message-secret": "2026-06-02",
  "collier-medaillon-coeur-ouvrable": "2026-06-02",
  "bracelet-homme-identite-gourmette": "2026-06-02",
  "bracelet-homme-acier-silicone": "2026-06-02",
  "numero-table-arches-bohemes": "2026-06-02",
  "numero-table-eucalyptus": "2026-06-02",
  "numero-table-feuillage": "2026-06-11",
  "etiquette-serviette-initiales": "2026-06-11",
  "numero-table-arche-geometrique": "2026-06-11",
  "ronds-de-serviette-bois": "2026-06-02",
  "menu-de-mariage-bois-grave": "2026-06-02",
  "plaque-de-porte-enfant": "2026-06-02",
  "cle-usb-personnalisee": "2026-06-02",
  "pyramide-cristal-gravure-3d": "2026-06-02",
  "bracelet-homme-cuir-tresse-acier": "2026-06-02",
  "porte-cles-cuir-a-graver": "2026-06-02",
  "trophee-cristal-vierge-3d": "2026-06-02",
  "cristal-photo-3d-vertical": "2026-07-04",
  "cristal-photo-3d-horizontal": "2026-07-04",
  "bracelet-homme-chaine-acier": "2026-06-02",
  "bracelet-femme-acier": "2026-06-02",
  "bracelet-empreinte-pied-bebe": "2026-06-02",
  "bracelet-femme-coeur": "2026-06-02",
  "bracelet-femme-papillon": "2026-06-02",
  "bracelet-coeur-acier": "2026-07-31",
  "bracelet-maille-trombone": "2026-08-01",
  "bracelet-ange": "2026-08-01",
  "bracelet-coeur-a-graver-ot": "2026-07-31",
  "collier-couple-coeur-lot2": "2026-06-02",
  "collier-plaque-acier": "2026-06-02",
  "collier-coeur-scintillant": "2026-08-01",
  "collier-perle-solitaire": "2026-08-01",
  "collier-coeur-zircon": "2026-07-31",
  "collier-double-coeur": "2026-09-01",
  "collier-coeur-plaques": "2026-09-01",
  "collier-3coeurs": "2026-09-01",
  "bracelet-coeur-chaine": "2026-09-01",
  "bracelet-cordon-plaque": "2026-09-01",
  "collier-medaillon-pivotant": "2026-09-01",
  "bracelet-homme-plaque-cuir": "2026-09-01",
  "collier-pastille": "2026-09-01",
  "collier-medaillon-livre": "2026-06-02",
  "collier-couple-puzzle": "2026-06-02",
  "collier-femme-pendentif-geometrique": "2026-06-02",
  "cle-usb-cristal-3d": "2026-06-02",
  "cle-usb-bois-coffret": "2026-06-02",
  "porte-cles-cristal-led-coeur": "2026-06-04",
  "porte-cles-cristal-led-rectangle": "2026-06-04",
  "piece-ronde-laiton": "2026-06-02",
  "verre-a-whisky-grave": "2026-06-13",
  "verre-a-whisky-fete-des-peres": "2026-06-14",
  "verre-a-vin-grave": "2026-07-23",
  "flute-a-champagne-gravee": "2026-07-23",
  "carafe-a-whisky-gravee": "2026-07-23",
  "couverts-enfants-personnalises": "2026-06-17",
  "lampe-led-paris-saint-germain": "2026-06-25",
  "arbre-de-vie-lumineux": "2026-06-26",
  "veilleuse-arbre-de-vie-ronde": "2026-06-26",
  "bougeoir-mandala-bois": "2026-06-26",
  "bougeoir-fleur-de-lotus": "2026-06-26",
  "photophore-fee-bois": "2026-08-21",
  "cartes-etapes-bebe-animaux": "2026-08-21",
  "cartes-etapes-bebe-girafe": "2026-08-21",
  "veilleuse-arbre-de-vie-prenom": "2026-08-21",
  "support-telephone-bois-grave": "2026-08-20",
  "support-telephone-bois-ajoure": "2026-08-20",
  "porte-serviettes-bois-fleur": "2026-08-20",
  "porte-serviettes-colombes": "2026-08-20",
  "porte-stylo-coq-coupe-du-monde": "2026-07-03",
  "porte-stylo-portugal-coupe-du-monde": "2026-07-03",
  "porte-stylo-argentine-coupe-du-monde": "2026-07-03",
  "porte-stylo-espagne-coupe-du-monde": "2026-07-03",
  "gobelet-isotherme-40oz": "2026-07-22",
  "plaque-de-naissance": "2026-07-10",
  "plaque-de-naissance-coeur": "2026-07-11",
};

// Date d'ajout d'un produit (chaîne AAAA-MM-JJ) ou null si inconnue.
export function dateAjout(slug) {
  return PRODUCT_DATES[slug] || null;
}

// Le produit a-t-il été ajouté il y a moins de NOUVEAU_JOURS jours ?
export function estRecent(slug, maintenant = Date.now()) {
  const d = PRODUCT_DATES[slug];
  if (!d) return false;
  const t = Date.parse(d + "T00:00:00Z");
  if (Number.isNaN(t)) return false;
  return maintenant - t < NOUVEAU_JOURS * 24 * 60 * 60 * 1000;
}
