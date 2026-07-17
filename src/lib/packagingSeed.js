// =============================================================================
// Configuration de DÉPART du packaging (pré-remplie dans Gestion → Packaging).
// Utilisée UNIQUEMENT tant que la gérante n'a rien enregistré : elle ouvre la
// page déjà remplie (ses prix, ses règles), ajoute ses photos, et enregistre.
// RIEN n'est visible sur le site tant que settings.packagingLive n'est pas true.
// =============================================================================

// Bibliothèque d'emballages (prix confirmés par la gérante).
// Hausse INTERMÉDIAIRE à l'unité (entre-deux : ni trop, ni trop peu → le pack
// affiche ~2,80 € d'économie). Coûts inchangés. Packs inchangés (5,50 / 7,50).
export const DEFAULT_PACKAGING = [
  { id: "sac", name: "Sac cadeau", desc: "Sac carton beige", buy: 1.0, sell: 1.7, weight: 10, photo: "" },
  { id: "boite-carree", name: "Boîte cadeau", desc: "Boîte carton 9×9 cm (colliers)", buy: 0.97, sell: 3.9, weight: 60, photo: "" },
  { id: "boite-allongee", name: "Boîte cadeau", desc: "Boîte carton, format bracelet", buy: 0.95, sell: 5.9, weight: 70, photo: "" },
  { id: "microfibre", name: "Pochette microfibre", desc: "Protection / voyage", buy: 1.0, sell: 2.7, weight: 15, photo: "" },
  { id: "pack-collier", name: "Pack Collier", desc: "Sac + boîte cadeau + microfibre", buy: 2.97, sell: 5.5, weight: 85, photo: "" },
  { id: "pack-bracelet", name: "Pack Bracelet", desc: "Sac + boîte cadeau + microfibre", buy: 2.95, sell: 7.5, weight: 95, photo: "" },
];

const COLLIERS = ["collier-enveloppe-message-secret", "collier-medaillon-coeur-ouvrable", "collier-couple-coeur-lot2", "collier-plaque-acier", "collier-medaillon-livre", "collier-couple-puzzle", "collier-femme-pendentif-geometrique"];
const BRACELETS_LONG = ["bracelet-homme-identite-gourmette", "bracelet-homme-acier-silicone", "bracelet-homme-cuir-tresse-acier", "bracelet-homme-chaine-acier", "bracelet-empreinte-pied-bebe"];
const BRACELETS_CARRE = ["bracelet-femme-acier", "bracelet-femme-coeur", "bracelet-femme-papillon"];

// Attribution par produit : { slug: { on, ids, free } }.
export const DEFAULT_PRODUCT_PACKAGING = (() => {
  const out = {};
  for (const s of COLLIERS) out[s] = { on: true, ids: ["sac", "boite-carree", "microfibre", "pack-collier"], free: [] };
  for (const s of BRACELETS_LONG) out[s] = { on: true, ids: ["sac", "boite-allongee", "microfibre", "pack-bracelet"], free: [] };
  for (const s of BRACELETS_CARRE) out[s] = { on: true, ids: ["sac", "boite-carree", "microfibre", "pack-collier"], free: [] };
  return out;
})();
