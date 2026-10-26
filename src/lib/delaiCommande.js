// =============================================================================
// DÉLAI D'UNE COMMANDE EN JOURS OUVRÉS ET EN JOURS CALENDAIRES (26/10/2026, gérant : « les commandes que j'ai
// reçues, si j'envoie tout demain je suis dans les temps ? … affiche les deux, la date avec ouvrables et non
// ouvrables »). Le site promet « 3 à 5 jours ouvrés de fabrication » (FAQ, fiches) : on compte donc du lundi au
// vendredi, sans les jours fériés français, à l'heure de Paris. Sans « fabrication immédiate », la cliente a
// 24 h pour modifier : le délai démarre un jour plus tard. Fonctions pures (`npm run test-delai`).
// =============================================================================
export const DELAI_OUVRES = 5;

const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
// Numéro du jour (jours depuis 1970) du calendrier de Paris.
export const numJour = (t) => Math.round(Date.parse(JOUR_PARIS.format(new Date(t)) + "T00:00:00Z") / 86400000);
const dateDe = (n) => new Date(n * 86400000);

function paques(annee) {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31), jour = ((h + l - 7 * m + 114) % 31) + 1;
  return Math.round(Date.UTC(annee, mois - 1, jour) / 86400000);
}

const feriesCache = {};
export function joursFeries(annee) {
  if (feriesCache[annee]) return feriesCache[annee];
  const j = (m, d) => Math.round(Date.UTC(annee, m - 1, d) / 86400000);
  const p = paques(annee);
  const s = new Set([j(1, 1), p + 1, j(5, 1), j(5, 8), p + 39, p + 50, j(7, 14), j(8, 15), j(11, 1), j(11, 11), j(12, 25)]);
  feriesCache[annee] = s;
  return s;
}

export function estOuvre(n) {
  const d = dateDe(n);
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) return false;
  return !joursFeries(d.getUTCFullYear()).has(n);
}

// Jours ouvrés strictement après `de` jusqu'à `a` inclus.
export function ouvresEntre(de, a) {
  let n = 0;
  for (let x = de + 1; x <= a; x++) if (estOuvre(x)) n++;
  return n;
}

// Le N-ième jour ouvré après le jour `de`.
export function ajouterOuvres(de, nb) {
  let x = de, n = 0;
  while (n < nb) { x++; if (estOuvre(x)) n++; }
  return x;
}

const STATUTS_FINIS = new Set(["expediee", "livree", "remise_main_propre"]);

// { commande, depart, limite (jours ouvrés), limiteCal (jours calendaires), ouvresEcoules, calendairesEcoules, ouvresRestants, etat, expedieEn? }
// etat : "ok" (2 jours ouvrés ou plus devant soi) · "bientot" (0 ou 1) · "depasse" · "parti" (déjà expédiée).
export function delaiCommande(order, maintenant = Date.now()) {
  const t = Date.parse(order?.createdAt || "");
  if (!t) return null;
  const commande = numJour(t);
  const depart = order?.immediateStart === false ? commande + 1 : commande;
  const limite = ajouterOuvres(depart, DELAI_OUVRES);
  // Même délai compté en jours calendaires (week-ends et fériés compris), affiché à côté pour comparer.
  const limiteCal = depart + DELAI_OUVRES;
  const fin = STATUTS_FINIS.has(order?.status) && Date.parse(order?.shippedAt || order?.remisAt || order?.deliveredAt || "")
    ? numJour(Date.parse(order.shippedAt || order.remisAt || order.deliveredAt))
    : null;
  const jour = fin ?? numJour(maintenant);
  const ouvresEcoules = ouvresEntre(commande, jour);
  const calendairesEcoules = Math.max(0, jour - commande);
  if (fin != null) {
    return { commande, depart, limite, limiteCal, ouvresEcoules, calendairesEcoules, ouvresRestants: 0, etat: "parti", aTemps: fin <= limite };
  }
  const ouvresRestants = jour > limite ? -ouvresEntre(limite, jour) : ouvresEntre(jour, limite);
  const etat = jour > limite ? "depasse" : ouvresRestants <= 1 ? "bientot" : "ok";
  return { commande, depart, limite, limiteCal, ouvresEcoules, calendairesEcoules, ouvresRestants, etat };
}

export function jourFr(n) {
  return dateDe(n).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

// Deux lignes pour l'écran, sur la carte de la file de production (gérant, 26/10 : « c'est là que tu dois afficher les deux dates ») :
// « À expédier au plus tard : mer. 28 oct. (jours ouvrés) · lun. 26 oct. (jours calendaires) »
// « Encore 1 j ouvré · écoulés : 4 j ouvrés · 6 j calendaires ».
export function lignesDelai(d) {
  if (!d) return [];
  const pl = (n, mot) => `${n} j ${mot}${n > 1 ? "s" : ""}`;
  const ecoule = `${pl(d.ouvresEcoules, "ouvré")} · ${pl(d.calendairesEcoules, "calendaire")}`;
  const dates = `${jourFr(d.limite)} (jours ouvrés) · ${jourFr(d.limiteCal)} (jours calendaires)`;
  if (d.etat === "parti") {
    return [`Expédiée en ${ecoule}${d.aTemps ? " · dans les temps" : " · après la date limite"}`, `Date limite : ${dates}`];
  }
  const reste = d.etat === "depasse"
    ? `Dépassé de ${pl(-d.ouvresRestants, "ouvré")}`
    : d.ouvresRestants === 0 ? "Dernier jour" : `Encore ${pl(d.ouvresRestants, "ouvré")}`;
  return [`À expédier au plus tard : ${dates}`, `${reste} · écoulés : ${ecoule}`];
}

export function texteDelai(d) {
  return lignesDelai(d).join(" · ");
}
