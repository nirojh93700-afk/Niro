// DEVIS DE RAJOUT (27/11/2026, gérant : « tu mets juste frais de livraison en plus, il n'a pas à
// choisir de livraison… même le code promo tu peux l'enlever », puis « un autre devis pour des
// rajouts quand d'autres commandes voudront rajouter »).
// Un client veut ajouter un article à une commande DÉJÀ passée : le devis porte `rajout: true` et
// la référence de la commande (`commandeLiee`). Sur ce devis : les articles, une ligne « Frais de
// livraison en plus » tapée par l'atelier, le total, le bouton Payer. Pas de choix de livraison,
// pas de code promo, pas d'emballage, pas de « Compléter votre commande », pas d'adresse à
// retaper : le rajout part dans le colis de la commande d'origine. Calcul pur, sans accès base.
import { nettoyerRef } from "@/lib/commandeLiee";

export const LIGNE_FRAIS_RAJOUT = "Frais de livraison en plus";

/** Vrai si ce document est un devis de rajout (il lui faut la commande qu'il complète). */
export function estRajout(q) {
  return Boolean(q && q.rajout === true && q.type !== "facture" && nettoyerRef(q.commandeLiee));
}

/** Montant des frais de livraison en plus, nettoyé (0 = pas de ligne). */
export function fraisRajout(v) {
  const n = Math.round((parseFloat(String(v ?? "").replace(",", ".")) || 0) * 100) / 100;
  return n > 0 && n <= 500 ? n : 0;
}
