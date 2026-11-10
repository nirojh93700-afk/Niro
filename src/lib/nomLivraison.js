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
  "09SZ9VYH": "Yohan Dufour", // adresse tapée dans le champ « nom » ; nom donné par le client par e-mail le 18/10/2026
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

// Nom d'un LIEU tapé à la place d'un nom de personne (10/11/2026, commande 0FUPET23 : « Résidence fond Vert »
// dans le champ « nom », l'étiquette sortait sans le nom de la cliente). Sans chiffre, donc invisible pour
// `ressembleAUneAdresse`. Mots d'établissement seulement (jamais un prénom ni un nom de famille courant).
const LIEU = /(^|[^a-zà-ÿ])(r[ée]sidence|ehpad|h[ôo]tel|h[ôo]pital|clinique|maison de retraite|maison de sant[ée]|soci[ée]t[ée]|sarl|sasu?|eurl|entreprise|mairie|[ée]cole|coll[èe]ge|lyc[ée]e|universit[ée]|restaurant|brasserie|pharmacie|association|cabinet|agence|magasin|boutique|camping|foyer|cr[èe]che|[ée]tablissement|institut|gendarmerie|caserne|[ée]glise|paroisse|internat|copropri[ée]t[ée]|b[âa]timent|immeuble)($|[^a-zà-ÿ])/i;

/** Vrai si la chaîne est le nom d'un lieu (résidence, EHPAD, hôtel, société…) et non d'une personne. */
export function estUnLieu(s) {
  const t = String(s || "").trim();
  return Boolean(t) && LIEU.test(t);
}

/** Vrai si la chaîne n'est pas un nom de personne : une adresse OU un nom de lieu. */
export function pasUnNomDePersonne(s) {
  return ressembleAUneAdresse(s) || estUnLieu(s);
}

/**
 * @returns {{ complet:string, prenom:string, nom:string, suspect:boolean, source:string, lieu:string }}
 *   `lieu` = nom d'établissement tapé dans le champ « nom » (à mettre sur la ligne « société » de l'étiquette).
 *   `suspect` = le nom enregistré ressemblait à une adresse (à signaler à l'écran).
 */
export function nomLivraison(order) {
  const brut = String(order?.shippingName || order?.customerName || "").trim();
  const corrige = NOMS_CORRIGES[order?.ref] || "";
  const devis = String(order?.quoteClientName || "").trim();
  // Nom de la personne qui a payé (PayPal : nom du compte ; carte : nom du titulaire), relevé au
  // paiement depuis le 10/11/2026 (commande 07UNS8IG : adresse dans le champ « nom », aucun nom ailleurs).
  const payeur = String(order?.payeurNom || "").trim();
  const suspect = !brut || pasUnNomDePersonne(brut);
  // Le lieu va sur la ligne « société » de l'étiquette, sauf si une société est déjà saisie.
  const lieu = !corrige && estUnLieu(brut) && !String(order?.shippingCompany || "").trim() ? brut : "";
  let complet = brut, source = "paiement";
  if (corrige) { complet = corrige; source = "correction connue"; }
  else if (suspect && devis && !pasUnNomDePersonne(devis)) { complet = devis; source = "nom du devis"; }
  else if (suspect && order?.customerName && !pasUnNomDePersonne(order.customerName)) { complet = String(order.customerName).trim(); source = "nom du client"; }
  else if (suspect && payeur && !pasUnNomDePersonne(payeur)) { complet = payeur; source = `nom du payeur${order?.payeurSource ? ` (${order.payeurSource})` : ""}`; }
  const [prenom, ...reste] = complet.split(/\s+/);
  return { complet, prenom: prenom || "", nom: reste.join(" ") || prenom || "", suspect: suspect && !corrige && source === "paiement", source, lieu: complet === lieu ? "" : lieu };
}

/**
 * Nom manquant pour l'étiquette : le champ « nom » du paiement est vide ou contient une adresse.
 * `propose` = le nom qu'on peut mettre à la place (devis, client, payeur), à confirmer ; vide si aucun.
 * Sert à l'e-mail 🛎️, à la carte de la file de production et à la fiche commande.
 * @returns {{ manquant:boolean, ecrit:string, propose:string, source:string }}
 */
export function nomManquant(order) {
  if (NOMS_CORRIGES[order?.ref]) return { manquant: false, ecrit: "", propose: "", source: "", motif: "" };
  const ecrit = String(order?.shippingName || order?.customerName || "").trim();
  if (ecrit && !pasUnNomDePersonne(ecrit)) return { manquant: false, ecrit, propose: "", source: "", motif: "" };
  const n = nomLivraison(order);
  const trouve = n.source !== "paiement" && n.complet && !pasUnNomDePersonne(n.complet);
  // motif : « vide » (rien saisi), « lieu » (résidence, hôtel… à la place du nom), « adresse » (rue, numéro…).
  const motif = !ecrit ? "vide" : ressembleAUneAdresse(ecrit) ? "adresse" : "lieu";
  return { manquant: true, ecrit, propose: trouve ? n.complet : "", source: trouve ? n.source : "", motif };
}

/** Phrase courte qui dit ce qui a été écrit à la place du nom (e-mail 🛎️, fiche, file de production). */
export function texteNomManquant(m) {
  if (m.motif === "vide") return "aucun nom saisi au paiement";
  if (m.motif === "lieu") return `un nom de lieu a été écrit à la place du nom de la personne (« ${m.ecrit} »)`;
  return `l'adresse a été écrite à la place du nom (« ${m.ecrit} »)`;
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

/**
 * Nom à AFFICHER pour une commande dans Gestion (10/11/2026, capture du gérant : « #07UNS8IG — »
 * sans aucun nom, « je peux pas voir ce qu'il a commandé »). Le nom de la cliente s'il est un vrai
 * nom, sinon le nom de livraison / du payeur, sinon ce qui a été tapé, sinon l'e-mail. Jamais vide.
 */
export function nomAffiche(order) {
  const client = String(order?.customerName || "").trim();
  if (client && !pasUnNomDePersonne(client)) return client;
  const n = nomLivraison(order);
  if (n.complet && !pasUnNomDePersonne(n.complet)) return n.complet;
  const tape = String(order?.shippingName || client || "").trim();
  if (tape) return tape;
  return String(order?.customerEmail || "").trim() || "Cliente sans nom";
}
