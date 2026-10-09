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

// -----------------------------------------------------------------------------
// NOM DE LIVRAISON ≠ NOM DE LA CLIENTE (09/10/2026, commande 1PUMYQBL : « Nollez Jessica » a tapé
// « cipresso fybie » dans le nom de l'adresse de livraison). Ce n'est pas une erreur du site : c'est
// ce que Stripe a reçu. Mais c'est LE nom à mettre sur l'étiquette (sinon colis refusé) et il faut
// que l'atelier le voie. On ne signale que si les deux noms n'ont AUCUN mot en commun (accents,
// majuscules, ordre prénom/nom sans importance) — un simple « M. Dupont » vs « Dupont Marie » ne sonne pas.
const motsDuNom = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !["mme", "madame", "monsieur", "mr", "mlle", "m"].includes(w));

// Vrai si les deux mots ne diffèrent que d'une lettre (ajoutée, retirée ou remplacée).
function distance1(x, y) {
  if (Math.abs(x.length - y.length) > 1) return false;
  let i = 0, j = 0, diff = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (x.length > y.length) i++; else if (x.length < y.length) j++; else { i++; j++; }
  }
  return diff + (x.length - i) + (y.length - j) <= 1;
}

/** @returns {{ different:boolean, livraison:string, cliente:string }} */
export function nomLivraisonDifferent(order) {
  const livraison = String(order?.shippingName || "").trim();
  const cliente = String(order?.customerName || "").trim();
  if (!livraison || !cliente) return { different: false, livraison, cliente };
  if (ressembleAUneAdresse(livraison) || ressembleAUneAdresse(cliente)) return { different: false, livraison, cliente }; // déjà signalé à part
  const a = new Set(motsDuNom(livraison));
  // Un mot en commun, ou presque (faute de frappe : « Vimalanathan » / « Vimalanthan » = même personne).
  const commun = motsDuNom(cliente).some((w) => a.has(w) || [...a].some((x) => w.length >= 5 && x.length >= 5 && distance1(w, x)));
  return { different: a.size > 0 && !commun, livraison, cliente };
}
