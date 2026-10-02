// =============================================================================
// NOM DE LIVRAISON — prénom / nom pour l'étiquette Boxtal et la fiche atelier.
// -----------------------------------------------------------------------------
// Incident 0GTB1LZ5 (02/10/2026) : le client a tapé son ADRESSE dans le champ « nom »
// de la page de paiement Stripe → formulaire Boxtal avec « 23quater » en prénom et
// « avenue du president coty… » en nom. Ici on détecte un « nom » qui est en réalité
// une adresse et on prend, dans l'ordre : le nom du devis (`quoteClientName`), une
// correction connue (NOMS_CORRIGES), le nom du client, sinon on garde tel quel en
// prévenant. Pur, testé par `npm run test-options`.
// =============================================================================

// Nom réel de commandes dont le champ « nom » de Stripe est faux (à compléter au besoin).
export const NOMS_CORRIGES = {
  "0GTB1LZ5": "Lorenzo Franchi", // remplacement de 1YPJVC5R (nom relu dans l'alerte du 25/08)
};

const VOIE = /\b(avenue|av\.?|rue|boulevard|bd|chemin|all[ée]e|impasse|route|place|r[ée]sidence|lotissement|quai|cours|square|bis|ter|quater|app(?:art(?:ement)?)?\.?)\b/i;

/** Vrai si la chaîne ressemble à une adresse plutôt qu'à un nom de personne. */
export function ressembleAUneAdresse(s) {
  const t = String(s || "").trim();
  if (!t) return false;
  if (/^\d/.test(t)) return true;        // commence par un numéro de voie
  if (/\d{4,}/.test(t)) return true;     // code postal / long numéro
  return VOIE.test(t) && /\d/.test(t);   // mot de voirie + un chiffre
}

/**
 * @returns {{ complet:string, prenom:string, nom:string, suspect:boolean, source:string }}
 *   `suspect` = le nom enregistré ressemblait à une adresse (à signaler à l'écran).
 */
export function nomLivraison(order) {
  const brut = String(order?.shippingName || order?.customerName || "").trim();
  const corrige = NOMS_CORRIGES[order?.ref] || "";
  const devis = String(order?.quoteClientName || "").trim();
  const suspect = ressembleAUneAdresse(brut);
  let complet = brut, source = "paiement";
  if (corrige) { complet = corrige; source = "correction connue"; }
  else if (suspect && devis && !ressembleAUneAdresse(devis)) { complet = devis; source = "nom du devis"; }
  else if (suspect && order?.customerName && !ressembleAUneAdresse(order.customerName)) { complet = String(order.customerName).trim(); source = "nom du client"; }
  const [prenom, ...reste] = complet.split(/\s+/);
  return { complet, prenom: prenom || "", nom: reste.join(" ") || prenom || "", suspect: suspect && !corrige && source === "paiement", source };
}
