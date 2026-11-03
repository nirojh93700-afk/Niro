// PAYS DE LIVRAISON d'une commande, dit en clair partout dans Gestion (03/11/2026, gérant, commande 1PCACXUM
// envoyée en Belgique : « heureusement que j'ai vu, sinon j'aurais pris un timbre pour la France… tu dois me
// dire pour quel pays c'est »). Fonction pure : fiche atelier, fiche papier, file de production, e-mail d'alerte.

export const NOMS_PAYS = {
  FR: "France", MC: "Monaco", BE: "Belgique", LU: "Luxembourg", NL: "Pays-Bas", DE: "Allemagne",
  ES: "Espagne", IT: "Italie", PT: "Portugal", CH: "Suisse", AT: "Autriche", IE: "Irlande",
  GB: "Royaume-Uni", DK: "Danemark", SE: "Suède", PL: "Pologne", GR: "Grèce", FI: "Finlande",
  CZ: "Tchéquie", RE: "La Réunion", GP: "Guadeloupe", MQ: "Martinique", GF: "Guyane", YT: "Mayotte",
};
const DRAPEAUX = { FR: "🇫🇷", MC: "🇲🇨", BE: "🇧🇪", LU: "🇱🇺", NL: "🇳🇱", DE: "🇩🇪", ES: "🇪🇸", IT: "🇮🇹", PT: "🇵🇹", CH: "🇨🇭" };

/** { code, nom, drapeau, etranger, texte } ; etranger = tout pays autre que la France (et Monaco, au tarif France). */
export function paysDeLaCommande(order) {
  const brut = String(order?.shippingAddress?.country || "").trim().toUpperCase();
  // Pas d'adresse (retrait en main propre) ou pays absent : France par défaut, sans alerte.
  const code = brut || "FR";
  const nom = NOMS_PAYS[code] || code;
  // Monaco s'affranchit au tarif France chez La Poste : pas d'alerte « international », mais le pays est dit.
  const etranger = code !== "FR" && code !== "MC";
  const drapeau = DRAPEAUX[code] || "🌍";
  const texte = etranger
    ? `${drapeau} ${nom.toUpperCase()} — envoi hors de France : affranchir pour l'international, jamais un timbre France`
    : code === "MC" ? `${drapeau} Monaco (affranchi au tarif France)` : `${drapeau} France`;
  return { code, nom, drapeau, etranger, texte, connu: Boolean(brut) };
}
