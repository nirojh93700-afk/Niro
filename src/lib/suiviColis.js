// =============================================================================
// LIEN DE SUIVI D'UN COLIS (14/10/2026, gérant : « je veux suivre aussi les colis
// que j'envoie à La Poste, tu peux me faire un lien aussi comme pour Boxtal »).
// On reconnaît le numéro : un numéro La Poste (lettre suivie, Colissimo, Chronopost) ouvre
// directement SON suivi sur laposte.fr ; un numéro Mondial Relay (26/10/2026, commande 15HSMV8X :
// la cliente « ne voyait rien » sur parcelsapp, et Gestion affichait « suivre sur La Poste » pour un
// colis en point relais) ouvre le suivi mondialrelay.fr avec le code postal de la cliente ;
// tout le reste garde le lien Boxtal d'avant. Fonctions pures (testées par `npm run test-suivi`).
// =============================================================================
export const SUIVI_BOXTAL = "https://shipping.boxtal.com/fr/fr/centrale-expeditions/suivi";

export function nettoyerNumero(n) {
  return String(n || "").replace(/[\s.-]+/g, "").toUpperCase();
}

// Formats La Poste : lettre suivie et Colissimo = 13 caractères « chiffre + lettre + 11 chiffres »
// (ex. 1L01234567890, 6A12345678901) ; envois internationaux et Chronopost = format
// international « 2 lettres + 9 chiffres + 2 lettres » (ex. LL123456789FR, XY123456789FR) ;
// lettre suivie achetée en ligne = 14 chiffres + 1 lettre (ex. 87001500427259Z, commande 0ZH3LP9M,
// capture du gérant du 14/10 : ce numéro tombait sur Boxtal).
export function estNumeroLaPoste(n) {
  const x = nettoyerNumero(n);
  return /^[0-9][A-Z][0-9]{11}$/.test(x) || /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(x) || /^[0-9]{14}[A-Z]$/.test(x);
}

export function lienLaPoste(n) {
  return `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(nettoyerNumero(n))}`;
}

// La commande est-elle un envoi Mondial Relay ? (point relais choisi au paiement : `shippingMethod`
// « Point relais Mondial Relay — … », `relaisPoint` « Mondial Relay — … », ou `relaisCarrier`).
export function estEnvoiMondialRelay(order) {
  const s = [order?.shippingMethod, order?.relaisPoint, order?.relaisCarrier, order?.relaisCarrierName]
    .filter(Boolean).join(" ").toLowerCase();
  return /mondial\s*relay|\bmonr\b/.test(s);
}

// Numéro d'expédition Mondial Relay : 8 chiffres (le format de l'étiquette Boxtal, ex. 74550444) ;
// les formats plus longs (10 à 12 chiffres, tout en chiffres) ne sont pris pour du Mondial Relay que si
// la commande dit « Mondial Relay » (un numéro tout en chiffres peut aussi être Colis Privé).
export function estNumeroMondialRelay(n, order) {
  const x = nettoyerNumero(n);
  if (/^[0-9]{8}$/.test(x)) return true;
  return /^[0-9]{10,12}$/.test(x) && estEnvoiMondialRelay(order);
}

// Code postal de la cliente pour le suivi Mondial Relay : adresse de la commande, sinon lu dans le
// libellé du point relais (« … — 83170 TOURVES »).
export function codePostalCommande(order) {
  const cp = String(order?.shippingAddress?.postal_code || order?.shippingAddress?.postalCode || "").replace(/\s+/g, "");
  if (/^[0-9]{5}$/.test(cp)) return cp;
  const m = String(order?.relaisPoint || order?.shippingMethod || "").match(/\b([0-9]{5})\b/);
  return m ? m[1] : "";
}

export function lienMondialRelay(n, order) {
  const cp = codePostalCommande(order);
  return `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${encodeURIComponent(nettoyerNumero(n))}${cp ? `&codePostal=${cp}` : ""}`;
}

// Lien pour GESTION : La Poste → laposte.fr · Mondial Relay → mondialrelay.fr · sinon Boxtal.
// `order` (facultatif) donne le mode de livraison et le code postal.
export function lienSuivi(numero, order) {
  const x = nettoyerNumero(numero);
  if (!x) return null;
  if (estNumeroLaPoste(x)) {
    return { nom: "La Poste", url: lienLaPoste(x) };
  }
  if (estNumeroMondialRelay(x, order)) {
    return { nom: "Mondial Relay", url: lienMondialRelay(x, order) };
  }
  // Numéro non reconnu : Boxtal comme avant, MAIS le lien La Poste reste proposé à côté
  // (`autre`) — un format La Poste qu'on ne connaît pas encore ne doit jamais laisser sans suivi.
  return { nom: "Boxtal", url: SUIVI_BOXTAL, autre: { nom: "La Poste", url: lienLaPoste(x) } };
}

// Lien pour la CLIENTE (e-mail « expédiée », espace client) : La Poste et Mondial Relay ouvrent le suivi
// du transporteur ; un numéro inconnu garde parcelsapp (le suivi multi-transporteurs d'avant), jamais
// Boxtal (c'est notre compte expéditeur).
export function lienSuiviClient(numero, order) {
  const x = nettoyerNumero(numero);
  if (!x) return null;
  if (estNumeroLaPoste(x)) return { nom: "La Poste", url: lienLaPoste(x) };
  if (estNumeroMondialRelay(x, order)) return { nom: "Mondial Relay", url: lienMondialRelay(x, order) };
  return { nom: "suivi du colis", url: `https://parcelsapp.com/fr/tracking/${encodeURIComponent(x)}` };
}
