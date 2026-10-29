// Rappel URSSAF mensuel (gérant, 29/10/2026 : « tous les mois ça me rappelle une semaine avant la fin pour pas que
// j'oublie de payer… dès que j'ai payé je valide, après pour le mois prochain ça me répète »).
// Règle micro-entreprise, déclaration mensuelle : le chiffre d'affaires d'un mois se déclare ET se paie avant la
// fin du mois SUIVANT (ventes d'octobre → avant le 30 novembre). Le rappel commence 7 jours avant cette date.
// Début d'activité : juin 2026. Mois validés = section « urssafDeclared » ({ "2026-09": date du clic }).
// Pur : aucune lecture de base ici (fiche Gestion, e-mail du battement et tests utilisent la même règle).

export const URSSAF_DEBUT = "2026-06";
export const URSSAF_JOURS_AVANT = 7;
export const URSSAF_URL = "https://www.autoentrepreneur.urssaf.fr/";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const cle = (a, m) => `${a}-${String(m + 1).padStart(2, "0")}`;
export const nomMois = (k) => { const [a, m] = String(k).split("-").map(Number); return `${MOIS[m - 1]} ${a}`; };
export const dateCourte = (d) => `${d.getDate()} ${MOIS[d.getMonth()]}`;

// Échéance d'un mois de chiffre d'affaires : dernier jour du mois suivant, 23 h 59 (heure de l'appareil).
export function echeance(k) {
  const [a, m] = String(k).split("-").map(Number);
  return new Date(a, m + 1, 0, 23, 59, 59);
}

const JOUR = 86400000;
const debutJour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Chaque mois de chiffre d'affaires terminé (depuis le début d'activité) avec son état.
// etat : "fait" (validé) · "retard" (échéance passée) · "rappel" (7 jours avant l'échéance ou moins) · "attente".
export function moisUrssaf(declared = {}, now = new Date()) {
  const [a0, m0] = URSSAF_DEBUT.split("-").map(Number);
  const out = [];
  for (let a = a0, m = m0 - 1; a < now.getFullYear() || (a === now.getFullYear() && m < now.getMonth()); m === 11 ? (a++, m = 0) : m++) {
    const k = cle(a, m), fin = echeance(k);
    const rappel = new Date(debutJour(fin).getTime() - URSSAF_JOURS_AVANT * JOUR);
    const jours = Math.ceil((debutJour(fin) - debutJour(now)) / JOUR);
    const fait = Boolean(declared?.[k]);
    const etat = fait ? "fait" : now > fin ? "retard" : now >= rappel ? "rappel" : "attente";
    out.push({ mois: k, nom: nomMois(k), echeance: fin, rappel, jours, fait, faitLe: declared?.[k] || "", etat });
  }
  return out;
}

// Ce que Gestion affiche : les mois à régler maintenant (retard / rappel), sinon le prochain à venir.
export function etatUrssaf(declared = {}, now = new Date()) {
  const tous = moisUrssaf(declared, now);
  const urgents = tous.filter((x) => x.etat === "retard" || x.etat === "rappel");
  const attente = tous.filter((x) => x.etat === "attente");
  // Le mois EN COURS se déclarera le mois prochain : on l'annonce comme prochaine échéance.
  const k = cle(now.getFullYear(), now.getMonth());
  const fin = echeance(k);
  const suivant = attente[0] || { mois: k, nom: nomMois(k), echeance: fin,
    rappel: new Date(debutJour(fin).getTime() - URSSAF_JOURS_AVANT * JOUR),
    jours: Math.ceil((debutJour(fin) - debutJour(now)) / JOUR), fait: false, etat: "attente", enCours: true };
  const dernierFait = [...tous].reverse().find((x) => x.fait) || null;
  return { urgents, suivant, dernierFait, tous };
}
