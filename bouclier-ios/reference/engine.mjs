// Référence JS du moteur d'analyse (miroir exact de Shared/FraudEngine.swift).
// Sert à VALIDER l'algorithme localement (Node) avant portage Swift.
// Toute modification de règle doit être répercutée à l'identique dans le fichier Swift.

// ─────────────────────────────────────────────────────────────────────────────
//  Données ARCEP + patterns de fraude (miroir de Shared/ArcepData.swift)
// ─────────────────────────────────────────────────────────────────────────────

// Préfixes réservés au démarchage téléphonique par l'ARCEP (obligatoires depuis 2023).
// Un appel/SMS commercial NON sollicité utilisant ces plages = démarchage encadré.
export const ARCEP_TELEMARKETING_PREFIXES = [
  "0162", "0163", "0270", "0271", "0377", "0378",
  "0424", "0425", "0568", "0569", "0948", "0949",
];

// Domaines officiels légitimes (une URL vers ces hôtes n'est PAS du phishing).
export const LEGIT_HOSTS = [
  "gouv.fr", "ameli.fr", "laposte.fr", "colissimo.fr", "chronopost.fr",
  "impots.gouv.fr", "service-public.fr", "moncompteformation.gouv.fr",
  "antai.gouv.fr", "mondialrelay.fr", "edf.fr", "sfr.fr", "orange.fr",
  "free.fr", "bouyguestelecom.fr",
];

// Raccourcisseurs d'URL (fortement corrélés au smishing).
export const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "ow.ly",
  "rebrand.ly", "urlz.fr", "u.to", "rb.gy", "shorturl.at", "lc.cx",
];

// TLD à risque très fréquents dans les campagnes frauduleuses.
export const SUSPICIOUS_TLDS = [
  ".xyz", ".top", ".icu", ".buzz", ".click", ".live", ".shop",
  ".online", ".info", ".cn", ".ru", ".tk", ".ml", ".ga", ".cf", ".rest", ".sbs",
];

// Marques usurpées : si le texte cite la marque avec une URL non officielle → usurpation.
export const IMPERSONATED_BRANDS = [
  "ameli", "impots", "laposte", "colissimo", "chronopost", "mondial relay",
  "cpf", "compte formation", "carte vitale", "antai", "edf", "engie",
  "netflix", "amazon", "paypal", "boursorama", "sfr", "orange", "free mobile",
];

// Groupes de mots-clés (thème => liste). Détectés sur texte replié (sans accents, minuscules).
export const KEYWORD_GROUPS = {
  colis: [
    "colis", "livraison", "chronopost", "colissimo", "point relais", "mondial relay",
    "frais de douane", "douane", "reexpedition", "redevance", "suivi de votre colis",
    "colis est en attente", "adresse incomplete", "frais de livraison",
  ],
  banque: [
    "compte a ete bloque", "compte bloque", "carte bancaire", "operation suspecte",
    "activite suspecte", "code confidentiel", "identifiant bancaire", "virement",
    "votre rib", "coordonnees bancaires", "plafond", "prelevement non autorise",
  ],
  cpf: ["cpf", "compte formation", "compte personnel de formation", "mon compte formation"],
  sante: ["carte vitale", "ameli", "assurance maladie", "cpam", "nouvelle carte vitale"],
  impots: ["impots", "tresor public", "remboursement fiscal", "dgfip", "remboursement d impot"],
  amende: ["amende", "antai", "stationnement", "infraction", "forfait post-stationnement", "crit air", "critair"],
  gain: ["gagne", "gagnant", "tirage au sort", "felicitations", "iphone gratuit", "cadeau", "recompense"],
};

// Signaux transverses.
export const URGENCY = [
  "urgent", "immediatement", "sous 24h", "sous 48h", "dernier avertissement",
  "derniere relance", "expire", "suspendu", "des aujourd hui", "delai depasse",
];
export const CALL_TO_ACTION = [
  "cliquez", "cliquer ici", "mettre a jour vos informations", "confirmez", "validez",
  "regularisez", "reactivez", "renseignez", "verifiez vos informations", "veuillez cliquer",
];

// ─────────────────────────────────────────────────────────────────────────────
//  Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

export function fold(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Normalisation d'un numéro FR en format national 0XXXXXXXXX (best effort).
export function normalizeFR(raw) {
  if (!raw) return "";
  let s = raw.replace(/[\s.\-() ]/g, "");
  if (s.startsWith("+33")) s = "0" + s.slice(3);
  else if (s.startsWith("0033")) s = "0" + s.slice(4);
  else if (s.startsWith("33") && s.length === 11) s = "0" + s.slice(2);
  return s;
}

function isAllDigits(s) { return /^[0-9]+$/.test(s); }

// ─────────────────────────────────────────────────────────────────────────────
//  Analyse d'un numéro (appel entrant / expéditeur SMS numérique)
// ─────────────────────────────────────────────────────────────────────────────

export const Level = { SAFE: "SAFE", INFO: "INFO", SUSPECT: "SUSPECT", FRAUD: "FRAUD" };

export function classifyNumber(raw, { allowlist = [], blocklist = [] } = {}) {
  const reasons = [];
  const n = normalizeFR(raw);
  const inList = (list) => list.map(normalizeFR).includes(n);

  if (!n || raw === "" ) {
    return { level: Level.SUSPECT, label: "Numéro masqué", number: n, reasons: ["Appelant masqué ou inconnu"] };
  }
  if (inList(allowlist)) {
    return { level: Level.SAFE, label: "Autorisé", number: n, reasons: ["Numéro dans votre liste blanche"] };
  }
  if (inList(blocklist)) {
    return { level: Level.FRAUD, label: "Signalé frauduleux", number: n, reasons: ["Numéro que vous avez signalé"] };
  }

  const prefix4 = n.slice(0, 4);
  if (ARCEP_TELEMARKETING_PREFIXES.includes(prefix4)) {
    return {
      level: Level.SUSPECT, label: "Démarchage (ARCEP)", number: n,
      reasons: [`Plage ${prefix4} réservée au démarchage téléphonique (ARCEP)`],
    };
  }
  if (n.startsWith("089")) {
    return { level: Level.SUSPECT, label: "Numéro surtaxé", number: n, reasons: ["Numéro surtaxé (08 9x)"] };
  }
  if (n.startsWith("00") || raw.trim().startsWith("+")) {
    if (!n.startsWith("0033") && !raw.startsWith("+33")) {
      reasons.push("Appel international");
      return { level: Level.INFO, label: "International", number: n, reasons };
    }
  }
  if (n.startsWith("0") && isAllDigits(n) && n.length !== 10) {
    return { level: Level.SUSPECT, label: "Numéro irrégulier", number: n, reasons: [`Longueur inhabituelle (${n.length} chiffres)`] };
  }
  return { level: Level.SAFE, label: "Aucun signalement", number: n, reasons: ["Aucun indicateur de fraude"] };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Analyse d'un SMS
// ─────────────────────────────────────────────────────────────────────────────

function extractHosts(text) {
  const hosts = [];
  const re = /(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:\/[^\s]*)?/gi;
  let m;
  while ((m = re.exec(text)) !== null) hosts.push(m[1].toLowerCase());
  return hosts;
}

function hostEndsWithLegit(host) {
  return LEGIT_HOSTS.some((legit) => host === legit || host.endsWith("." + legit));
}

// Détecte un code à usage unique (OTP/2FA) => message transactionnel légitime.
function looksLikeOTP(folded) {
  const hasCodeWord = /\b(code|verification|confirmation|otp|securite)\b/.test(folded);
  const hasShortCode = /\b\d{4,8}\b/.test(folded);
  const hasURL = extractHosts(folded).length > 0;
  return hasCodeWord && hasShortCode && !hasURL;
}

export function analyzeSMS(sender, body, { allowlist = [], blocklist = [] } = {}) {
  const folded = fold(body);
  const reasons = [];
  let score = 0;

  // OTP légitime → court-circuit.
  if (looksLikeOTP(folded)) {
    return { level: Level.SAFE, label: "Code de vérification", score: 0, reasons: ["Ressemble à un code à usage unique (2FA)"] };
  }

  // Expéditeur.
  const senderVerdict = classifyNumber(sender, { allowlist, blocklist });
  if (senderVerdict.level === Level.FRAUD) { score += 6; reasons.push("Expéditeur déjà signalé"); }
  else if (senderVerdict.label.startsWith("Démarchage")) { score += 2; reasons.push("Expéditeur sur une plage de démarchage ARCEP"); }
  else if (senderVerdict.level === Level.SAFE && senderVerdict.label === "Autorisé") { score -= 4; reasons.push("Expéditeur autorisé"); }

  // Groupes thématiques.
  let themeHits = 0;
  for (const [theme, words] of Object.entries(KEYWORD_GROUPS)) {
    if (words.some((w) => folded.includes(fold(w)))) {
      themeHits += 1;
      reasons.push(`Thème sensible : ${theme}`);
    }
  }
  if (themeHits > 0) score += 2 + (themeHits - 1); // premier thème +2, chaque thème suppl. +1

  // Urgence / incitation à l'action.
  if (URGENCY.some((w) => folded.includes(fold(w)))) { score += 2; reasons.push("Ton d'urgence"); }
  if (CALL_TO_ACTION.some((w) => folded.includes(fold(w)))) { score += 2; reasons.push("Incitation à cliquer / agir"); }

  // Analyse d'URL.
  const hosts = extractHosts(body);
  if (hosts.length > 0) {
    const anyLegit = hosts.some(hostEndsWithLegit);
    const anyShortener = hosts.some((h) => URL_SHORTENERS.includes(h));
    const anySuspTLD = hosts.some((h) => SUSPICIOUS_TLDS.some((t) => h.endsWith(t)));

    score += 1;
    reasons.push("Contient un lien");
    if (anyShortener) { score += 3; reasons.push("Lien raccourci (masque la destination)"); }
    if (anySuspTLD) { score += 3; reasons.push("Extension de domaine à risque"); }

    // Usurpation : marque citée + lien non officiel.
    const brandCited = IMPERSONATED_BRANDS.find((b) => folded.includes(fold(b)));
    if (brandCited && !anyLegit) {
      score += 4;
      reasons.push(`Usurpation probable : « ${brandCited} » avec un lien non officiel`);
    }
    if (anyLegit && !anyShortener && !anySuspTLD) {
      score -= 2;
      reasons.push("Lien vers un domaine officiel");
    }
  }

  if (score < 0) score = 0;

  let level, label;
  if (score >= 6) { level = Level.FRAUD; label = "Frauduleux"; }
  else if (score >= 3) { level = Level.SUSPECT; label = "Suspect"; }
  else { level = Level.SAFE; label = "Sûr"; }

  return { level, label, score, reasons };
}
