// CALCUL DU PORT PARTAGÉ entre le PANIER et les DEVIS (03/10/2026, « option 1 » choisie par le gérant :
// le devis doit calculer la livraison EXACTEMENT comme le site, et les deux ne doivent jamais se
// contredire). Ces fonctions sont l'ancien calcul de `/api/checkout`, sorti tel quel — toute règle de
// port (seuils offerts, lettre / colis, verres, bijou en boîte) vit donc ICI, à un seul endroit.
// Parité prouvée par `npm run test-port-parite` (milliers de paniers aléatoires : ancien code ≡ nouveau).
import { buildShippingOptions, resolveShippingConfig } from "@/lib/shipping";

export function nouvelEtatPort() {
  return {
    totalGrams: 0,
    subtotal: 0,
    parcelQty: 0,           // nombre d'articles "déco" (colis) dans le panier
    glassQty: 0,            // nombre de verres (fragiles) — envoi croissant dédié
    letterOnly: true,
    tousBijouxLettre: true, // tous les articles sont des bijoux/petits objets (avant emballage)
    bijouEnBoite: false,    // au moins un bijou emballé dans une boîte rigide
    allFreeShip: true,      // tous les articles ont la livraison offerte
    allPickup: true,        // retrait proposé seulement si TOUS les articles sont éligibles
    // Livraison offerte par SEUIL sur colis (ex. verres : lot de 4 ≥ 45 € → offerte).
    // Sûr : ne s'applique que si TOUS les colis du panier portent freeShipThreshold.
    allColisThreshFree: true,
    colisThresh: Infinity,
  };
}

// Ajoute UNE ligne (produit × quantité). `pkgBoite` = emballage en boîte rigide (→ colis).
export function ajouterLignePort(e, { product, unitGrams, unitPrice, quantity, pkgBoite = false }) {
  e.totalGrams += unitGrams * quantity;
  e.subtotal += unitPrice * quantity;
  // 📦 Un bijou emballé dans une BOÎTE rigide dépasse les 3 cm de la Lettre Suivie → petit colis.
  if (product.letter && pkgBoite) e.bijouEnBoite = true;
  if (!product.letter) e.tousBijouxLettre = false;
  if (!product.letter || pkgBoite) {
    e.letterOnly = false;
    e.parcelQty += quantity;
  }
  if (!product.letter) {
    // Un produit « livraison toujours offerte » ne doit PAS annuler la gratuité au seuil.
    if (product.freeShipping) { /* toujours offert → ne bloque rien */ }
    else if (product.freeShipThreshold) e.colisThresh = Math.min(e.colisThresh, Number(product.freeShipThreshold));
    else e.allColisThreshFree = false;
  }
  if (product.category === "verres") e.glassQty += quantity;
  if (!product.freeShipping) e.allFreeShip = false;
  if (!product.pickup) e.allPickup = false;
}

// Options de livraison (format Stripe `shipping_options`) pour l'état accumulé.
export function optionsPort(e, { settings, deliveryMethod = "", relaisLabel = "", relaisCarrier = "", country = "FR", express = false, retraitOk = false }) {
  return buildShippingOptions({
    totalGrams: e.totalGrams, subtotal: e.subtotal, parcelQty: e.parcelQty, glassQty: e.glassQty, letterOnly: e.letterOnly,
    bijouxOnly: e.tousBijouxLettre, // bijou en boîte : jamais moins cher qu'en lettre
    // Gratuité : produits toujours offerts, seuil des colis (verres…), ET la promesse bijoux
    // « offerte dès 45 € » — qui reste vraie même quand une boîte cadeau fait passer le bijou en petit colis.
    freeShipping: e.allFreeShip
      || (e.allColisThreshFree && e.parcelQty > 0 && e.subtotal >= e.colisThresh)
      || (e.tousBijouxLettre && e.bijouEnBoite && e.subtotal >= resolveShippingConfig(settings?.shipping).bijouxFreeThreshold),
    country,
    pickupEligible: e.allPickup && retraitOk,
    express,
    config: settings?.shipping, // tarifs personnalisés (admin)
    boxtal: settings?.boxtal,   // option point relais (admin)
    deliveryMethod, relaisLabel, relaisCarrier,
  });
}
