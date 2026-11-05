// Gobelet isotherme 40 oz — parcours guidé (maquette validée du 03/10/2026, exemples du 05/11/2026).
// Pur : utilisé par la fiche (GobeletParcours.jsx) ET par le paiement (/api/checkout), pour que le prix
// affiché = le prix payé. Règle du gérant (03/10) : « le premier gravure c'est gratuit, après c'est
// payant, même un prénom » → 1 élément compris (le centre), chaque élément en plus +3 €.
//
// Champs écrits (clés de la fiche, lues telles quelles par l'atelier) :
//   mode            dessin | texte | photo        (la gravure PRINCIPALE, obligatoire)
//   cote            face | gauche | droite         (où graver la gravure principale ; vide = face)
//   dessin          n° du dessin au centre (1–74)
//   texte           texte au centre
//   photo           photo / logo envoyé (adresse)
//   texteSousPhoto  texte sous la photo (élément en plus)
//   police          écriture du texte du centre / sous la photo
//   autour          un élément autour par ligne (élément en plus chacun)

import { getFontLabel } from "./fonts";

export const GOB_DESSINS_MAX = 74;
export const GOB_CADRE_MIN = 75;
export const GOB_CADRE_MAX = 102;
export const GOB_CADRES_ABSENTS = [97, 99]; // 96, 98 et 102 sont des cadres complets (24/10/2026)
export const GOB_ELEMENTS_MAX = 12;

export const cadreValide = (n) => Number.isInteger(n) && n >= GOB_CADRE_MIN && n <= GOB_CADRE_MAX && !GOB_CADRES_ABSENTS.includes(n);
export const dessinValide = (n) => Number.isInteger(n) && n >= 1 && n <= GOB_DESSINS_MAX;

const t = (v) => (typeof v === "string" ? v.trim() : "");

/** Lignes « autour » (un élément par ligne). */
export function lignesAutour(fields) {
  return t(fields?.autour).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, GOB_ELEMENTS_MAX);
}

export const GOB_COTES = { face: "face", gauche: "côté gauche", droite: "côté droit" };
export const coteCentre = (fields) => (GOB_COTES[t(fields?.cote)] ? t(fields.cote) : "face");

/** La gravure principale est-elle complète ? (centre = libellé + l'endroit si ce n'est pas la face) */
export function gobeletEtat(fields) {
  const e = etatSansCote(fields);
  const c = coteCentre(fields);
  if (e.ok && c !== "face") e.centre = `${e.centre} — ${GOB_COTES[c]}`;
  return e;
}
function etatSansCote(fields) {
  const f = fields || {};
  const mode = t(f.mode);
  if (mode === "dessin") {
    const n = parseInt(f.dessin, 10);
    return dessinValide(n) ? { ok: true, centre: `Dessin n° ${n}` } : { ok: false, centre: "Un dessin — numéro à indiquer", manque: `Indiquez le numéro du dessin (1 à ${GOB_DESSINS_MAX}).` };
  }
  if (mode === "texte") return t(f.texte) ? { ok: true, centre: `« ${t(f.texte)} »` } : { ok: false, centre: "Mon propre texte — à écrire", manque: "Écrivez votre texte." };
  if (mode === "photo") return t(f.photo) ? { ok: true, centre: "Votre photo / logo" + (t(f.texteSousPhoto) ? ` + « ${t(f.texteSousPhoto)} »` : "") } : { ok: false, centre: "Ma photo ou mon logo — à ajouter", manque: "Ajoutez votre photo ou votre logo." };
  return { ok: false, centre: null, manque: "Choisissez votre gravure principale (étape 1)." };
}

/** Nombre d'éléments gravés : le centre (compris) + le texte sous la photo + chaque élément autour. */
export function gobeletNbElements(fields) {
  const f = fields || {};
  let n = t(f.mode) ? 1 : 0;
  if (t(f.mode) === "photo" && t(f.texteSousPhoto)) n += 1;
  n += lignesAutour(f).length;
  return Math.min(n, GOB_ELEMENTS_MAX + 2);
}

/** Supplément de gravure : 1 élément compris, chaque élément en plus au prix `extra` (3 €). */
export function gobeletSupplement(fields, cfg = {}) {
  const inclus = Number(cfg.inclus) || 1;
  const extra = Number(cfg.extra) || 3;
  const n = gobeletNbElements(fields);
  const enPlus = Math.max(0, n - inclus);
  return { n, enPlus, montant: Math.round(enPlus * extra * 100) / 100 };
}

/** Résumé lisible (panier, paiement, e-mails) : « Au centre : Dessin n° 12 · Autour : … ». */
export function gobeletResume(fields) {
  const e = gobeletEtat(fields);
  const autour = lignesAutour(fields);
  const f = fields || {};
  const ecrit = (t(f.mode) === "texte" || (t(f.mode) === "photo" && t(f.texteSousPhoto))) && t(f.police) ? `, écriture ${getFontLabel(t(f.police)).split(" — ")[0]}` : "";
  return [e.centre ? `Gravure principale : ${e.centre}${ecrit}` : "", ...autour.map((l) => `En plus : ${l}`)].filter(Boolean).join(" · ");
}
