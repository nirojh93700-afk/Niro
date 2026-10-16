// =============================================================================
// LIEN DE SUIVI D'UN COLIS DANS GESTION (14/10/2026, gérant : « je veux suivre aussi les colis
// que j'envoie à La Poste, tu peux me faire un lien aussi comme pour Boxtal »).
// On reconnaît le numéro : un numéro La Poste (lettre suivie, Colissimo, Chronopost) ouvre
// directement SON suivi sur laposte.fr ; tout le reste garde le lien Boxtal d'avant.
// Fonction pure (testée par `npm run test-suivi`).
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

export function lienSuivi(numero) {
  const x = nettoyerNumero(numero);
  if (!x) return null;
  if (estNumeroLaPoste(x)) {
    return { nom: "La Poste", url: lienLaPoste(x) };
  }
  // Numéro non reconnu : Boxtal comme avant, MAIS le lien La Poste reste proposé à côté
  // (`autre`) — un format La Poste qu'on ne connaît pas encore ne doit jamais laisser sans suivi.
  return { nom: "Boxtal", url: SUIVI_BOXTAL, autre: { nom: "La Poste", url: lienLaPoste(x) } };
}
