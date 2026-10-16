// =============================================================================
// Adresse e-mail mal tapée (16/10/2026, commande 10OPUHMO : « naulinceline71@gmail.comn »
// tapé au paiement → confirmation rebondie, cliente inquiète ; gérant : « tu peux construire »).
// -----------------------------------------------------------------------------
// `suggestionEmail(email)` (pur) : propose l'adresse corrigée quand le domaine ressemble
// à un fournisseur courant (gmail.comn, gmial.com, hotmial.fr, orange.f, yahoo.con…).
// Côté serveur (MX, décision au paiement) : `src/lib/emailTypoServeur.js`.
// Utilisé au panier (« Vouliez-vous dire … ? ») et au webhook Stripe (correction
// automatique quand le domaine tapé ne peut recevoir AUCUN mail, sinon alerte au gérant).
// `npm run test-email-typo`.
// =============================================================================

export const DOMAINES_COURANTS = [
  "gmail.com", "hotmail.fr", "hotmail.com", "outlook.fr", "outlook.com", "live.fr", "live.com",
  "yahoo.fr", "yahoo.com", "icloud.com", "me.com", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr",
  "laposte.net", "neuf.fr", "bbox.fr", "aol.com", "gmx.fr", "msn.com", "protonmail.com", "proton.me",
];

const VRAIES_EXTENSIONS = new Set(["fr", "com", "net", "org", "eu", "be", "ch", "lu", "de", "es", "it", "nl", "pt", "at", "ie",
  "ca", "us", "uk", "co.uk", "ma", "tn", "dz", "sn", "ci", "re", "mc", "pl", "se", "dk", "no", "fi", "gr", "ro", "cz", "hu"]);

/** Distance d'édition (insertion, suppression, remplacement, inversion de deux lettres voisines). */
function distance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/** Forme générale d'une adresse (pas de vérification du domaine). */
export function formeEmailValide(email) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(email || "").trim());
}

/**
 * Adresse corrigée proposée, ou null si l'adresse paraît juste.
 * Ne touche jamais à la partie avant « @ » ; ne propose qu'un domaine courant très proche.
 */
export function suggestionEmail(email) {
  const brut = String(email || "").trim().replace(/[.,;]+$/, "");
  const at = brut.lastIndexOf("@");
  if (at < 1) return null;
  const local = brut.slice(0, at);
  const dom = brut.slice(at + 1).toLowerCase().replace(/\.{2,}/g, ".");
  if (!dom || DOMAINES_COURANTS.includes(dom)) return null;
  // Fournisseur à adresse unique avec une autre extension (gmail.fr, icloud.fr…) → la seule qui existe.
  const nom0 = dom.split(".")[0];
  const unique = { gmail: "gmail.com", icloud: "icloud.com", wanadoo: "wanadoo.fr", laposte: "laposte.net", free: "free.fr", sfr: "sfr.fr", bbox: "bbox.fr", neuf: "neuf.fr" }[nom0];
  if (unique && dom !== unique) return `${local}@${unique}`;
  let meilleur = null, d0 = Infinity;
  for (const c of DOMAINES_COURANTS) {
    const d = distance(dom, c);
    if (d < d0) { d0 = d; meilleur = c; }
  }
  // Seuil : 1 faute pour un domaine court, 2 pour un domaine plus long (gmail.comn, hotmial.fr…).
  const seuil = dom.length <= 7 ? 1 : 2;
  if (!meilleur || d0 === 0 || d0 > seuil) return null;
  // Même fournisseur avec une vraie extension de pays (yahoo.it, hotmail.be, gmx.de…) : adresse normale.
  const [nomT, ...extT] = dom.split("."), [nomC] = meilleur.split(".");
  // … sauf pour les fournisseurs qui n'ont qu'une seule adresse (gmail.fr, icloud.fr, free.com n'existent pas).
  const UNIQUES = ["gmail", "icloud", "wanadoo", "laposte", "free", "sfr", "bbox", "neuf"];
  if (nomT === nomC && VRAIES_EXTENSIONS.has(extT.join(".")) && !UNIQUES.includes(nomT)) return null;
  return `${local}@${meilleur}`;
}

