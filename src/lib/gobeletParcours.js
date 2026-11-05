// Gobelet isotherme 40 oz — parcours guidé (maquette validée du 03/10/2026, exemples et retours du gérant du 05/11/2026).
// Pur : utilisé par la fiche (GobeletParcours.jsx), le paiement (/api/checkout) ET l'atelier (consignesGravure), pour que
// le prix affiché = le prix payé et que l'atelier lise exactement ce que la cliente a choisi.
// Règle du gérant (03/10) : « le premier gravure c'est gratuit, après c'est payant, même un prénom » → 1 élément
// compris, chaque élément en plus +3 €.
//
// Une gravure = une LISTE D'ÉLÉMENTS. Chaque élément : quoi (dessin 1–74, cadre ou banderole 75–102 + nom, lettre
// fleurie + nom, texte, photo), écriture si texte, et OÙ (face / côté gauche / côté droit / tout autour, puis au
// milieu / en haut / en bas / à gauche / à droite).
// Champs écrits (clés de la fiche, lues telles quelles par l'atelier) :
//   1er élément (compris)   mode (dessin | cadre | lettre | texte | photo), dessin, cadre, lettre, nom, texte, photo,
//                           texteSousPhoto (+3 €), police, cote, place
//   éléments en plus        autour : un élément par ligne, écrit par ligneElement() et relu par lireLigne()

import { getFontLabel } from "./fonts";

export const GOB_DESSINS_MAX = 74;
export const GOB_CADRE_MIN = 75;
export const GOB_CADRE_MAX = 102;
export const GOB_CADRES_ABSENTS = [97, 99]; // 96, 98 et 102 sont des cadres complets (24/10/2026)
export const GOB_ELEMENTS_MAX = 13;

export const cadreValide = (n) => Number.isInteger(n) && n >= GOB_CADRE_MIN && n <= GOB_CADRE_MAX && !GOB_CADRES_ABSENTS.includes(n);
export const dessinValide = (n) => Number.isInteger(n) && n >= 1 && n <= GOB_DESSINS_MAX;

const t = (v) => (typeof v === "string" ? v.trim() : "");

export const GOB_COTES = { face: "Face", gauche: "Côté gauche", droite: "Côté droit", tour: "Tout autour" };
export const GOB_PLACES = { milieu: "au milieu", haut: "en haut", bas: "en bas", gauche: "à gauche", droite: "à droite" };
export const placesDuCote = (c) => (c === "tour" ? ["haut", "bas"] : c === "face" ? ["milieu", "haut", "bas", "gauche", "droite"] : ["milieu", "haut", "bas"]);
const ecritureCourte = (p) => (p ? getFontLabel(p).split(" — ")[0] : "");
const COTE_PAR_LIBELLE = Object.fromEntries(Object.entries(GOB_COTES).map(([k, v]) => [v.toLowerCase(), k]));
const PLACE_PAR_LIBELLE = Object.fromEntries(Object.entries(GOB_PLACES).map(([k, v]) => [v, k]));
const POLICE_PAR_LIBELLE = (lib) => {
  const l = String(lib || "").toLowerCase();
  for (const k of ["playfair", "cinzel-deco", "cinzel", "montserrat", "inter", "great-vibes", "allura", "pacifico"]) {
    if (ecritureCourte(k).toLowerCase() === l) return k;
  }
  return "";
};

/** Lignes « autour » (un élément en plus par ligne). */
export function lignesAutour(fields) {
  return t(fields?.autour).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, GOB_ELEMENTS_MAX);
}

/** Ce qu'est l'élément, en mots (sans l'endroit). */
export function quoiElement(e) {
  if (!e) return "";
  if (e.kind === "dessin") return `Dessin n° ${e.num}`;
  if (e.kind === "cadre") return `Cadre n° ${e.num} avec « ${e.nom} »`;
  if (e.kind === "lettre") return `Lettre fleurie ${e.lettre} avec « ${e.nom} »`;
  if (e.kind === "texte") return `Texte « ${e.texte} »`;
  if (e.kind === "photo") return "Photo / logo de la cliente";
  if (e.kind === "sous") return `Texte sous la photo « ${e.texte} »`;
  return "";
}
export const ouElement = (e) => `${GOB_COTES[e.side] || "Face"}, ${GOB_PLACES[e.zone] || "au milieu"}`;

/** Une ligne de « autour » pour un élément en plus. */
export function ligneElement(e) {
  const ecr = ["cadre", "lettre", "texte"].includes(e.kind) && e.police ? `, écriture ${ecritureCourte(e.police)}` : "";
  const quoi = e.kind === "photo" ? `Photo / logo de la cliente (${e.photo})` : quoiElement(e);
  return `${quoi} — ${ouElement(e)}${ecr}`;
}

/** Ordre dans lequel les nouveaux éléments prennent leur place (la cliente peut la changer ensuite). */
export const ORDRE_PLACES = [
  ["face", "milieu"], ["face", "haut"], ["face", "bas"], ["gauche", "milieu"], ["droite", "milieu"], ["face", "gauche"], ["face", "droite"],
  ["gauche", "haut"], ["gauche", "bas"], ["droite", "haut"], ["droite", "bas"], ["tour", "haut"], ["tour", "bas"],
];
/** La 1re place libre (côté, place) parmi ORDRE_PLACES, ou null si tout est pris. */
export function premiereLibre(elements) {
  const prises = new Set((elements || []).map((e) => `${e.side}|${e.zone}`));
  const p = ORDRE_PLACES.find(([c, z]) => !prises.has(`${c}|${z}`));
  return p ? { side: p[0], zone: p[1] } : null;
}

/** Écrit une liste complète d'éléments dans les champs : le 1er dans les champs du 1er, les autres en lignes. */
export function champsDepuisListe(liste) {
  const [p, ...autres] = liste || [];
  return { ...champsPremier(p || null), autour: autres.map(ligneElement).join("\n") };
}

/** Relit une ligne écrite par ligneElement (et les anciennes lignes « … — Face, en haut, écriture … »). */
export function lireLigne(l) {
  const m = /^(.*) — (Face|Côté gauche|Côté droit|Tout autour), (au milieu|au centre|en haut|en bas|à gauche|à droite)(?:, écriture (.+))?$/.exec(String(l || "").trim());
  const quoi = m ? m[1] : String(l || "").trim();
  const side = m ? COTE_PAR_LIBELLE[m[2].toLowerCase()] : "face";
  const zone = m ? (PLACE_PAR_LIBELLE[m[3]] || "milieu") : "milieu";
  const police = m ? POLICE_PAR_LIBELLE(m[4]) : "";
  let e = { kind: "texte", texte: quoi };
  let x;
  if ((x = /^Dessin n° (\d+)$/.exec(quoi))) e = { kind: "dessin", num: +x[1] };
  else if ((x = /^Cadre n° (\d+) avec « (.*) »$/.exec(quoi))) e = { kind: "cadre", num: +x[1], nom: x[2] };
  else if ((x = /^Lettre fleurie ([A-Z]) avec « (.*) »$/.exec(quoi))) e = { kind: "lettre", lettre: x[1], nom: x[2] };
  else if ((x = /^Texte « (.*) »$/.exec(quoi))) e = { kind: "texte", texte: x[1] };
  else if ((x = /^Photo \/ logo de la cliente \((.*)\)$/.exec(quoi))) e = { kind: "photo", photo: x[1] };
  return { ...e, side, zone, police, ligne: String(l || "").trim() };
}

/** Le 1er élément (compris), lu dans les champs. null s'il n'est pas commencé. */
export function premierElement(fields) {
  const f = fields || {};
  const kind = t(f.mode);
  if (!kind) return null;
  const side = GOB_COTES[t(f.cote)] ? t(f.cote) : "face";
  const zone = GOB_PLACES[t(f.place)] && placesDuCote(side).includes(t(f.place)) ? t(f.place) : "milieu";
  const base = { kind, side, zone, police: t(f.police) };
  if (kind === "dessin") return { ...base, num: parseInt(f.dessin, 10) };
  if (kind === "cadre") return { ...base, num: parseInt(f.cadre, 10), nom: t(f.nom) };
  if (kind === "lettre") return { ...base, lettre: t(f.lettre), nom: t(f.nom) };
  if (kind === "texte") return { ...base, texte: t(f.texte) };
  if (kind === "photo") return { ...base, photo: t(f.photo), sous: t(f.texteSousPhoto) };
  return null;
}

/** Champs à écrire pour que l'élément e devienne le 1er (compris). */
export function champsPremier(e) {
  const vide = { mode: "", dessin: "", cadre: "", lettre: "", nom: "", texte: "", photo: "", texteSousPhoto: "", police: "", cote: "", place: "" };
  if (!e) return vide;
  const out = { ...vide, mode: e.kind, cote: e.side || "face", place: e.zone || "milieu" };
  if (e.kind === "dessin") out.dessin = String(e.num);
  if (e.kind === "cadre") { out.cadre = String(e.num); out.nom = e.nom || ""; out.police = e.police || ""; }
  if (e.kind === "lettre") { out.lettre = e.lettre || ""; out.nom = e.nom || ""; out.police = e.police || ""; }
  if (e.kind === "texte") { out.texte = e.texte || ""; out.police = e.police || ""; }
  if (e.kind === "photo") { out.photo = e.photo || ""; out.texteSousPhoto = e.sous || ""; out.police = e.sous ? (e.police || "") : ""; }
  return out;
}

/** Ce qui manque à un élément (null = complet). */
export function manqueElement(e) {
  if (!e) return "Choisissez ce que vous voulez graver.";
  if (e.kind === "dessin") return dessinValide(e.num) ? null : `Indiquez le numéro du dessin (1 à ${GOB_DESSINS_MAX}).`;
  if (e.kind === "cadre") {
    if (!cadreValide(e.num)) return `Indiquez le numéro du cadre ou de la banderole (${GOB_CADRE_MIN} à ${GOB_CADRE_MAX} ; 97 et 99 n'existent pas).`;
    return e.nom ? null : "Écrivez le nom à graver dans le cadre.";
  }
  if (e.kind === "lettre") return !e.lettre ? "Choisissez la lettre." : e.nom ? null : "Écrivez le nom à graver dans la lettre.";
  if (e.kind === "texte") return e.texte ? null : "Écrivez votre texte.";
  if (e.kind === "photo") return e.photo ? null : "Ajoutez votre photo ou votre logo.";
  return "Choisissez ce que vous voulez graver.";
}

/** Tous les éléments, dans l'ordre : le 1er (compris), le texte sous la photo, puis les éléments en plus. */
export function gobeletElements(fields) {
  const out = [];
  const p = premierElement(fields);
  if (p) {
    out.push({ ...p, compris: true });
    if (p.kind === "photo" && p.sous) out.push({ kind: "sous", texte: p.sous, side: p.side, zone: p.zone, police: p.police, compris: false });
  }
  for (const l of lignesAutour(fields)) out.push({ ...lireLigne(l), compris: false });
  return out;
}

/** La gravure est-elle complète ? `centre` = le 1er élément en mots, avec son endroit. */
export function gobeletEtat(fields) {
  const p = premierElement(fields);
  if (!p) return { ok: false, centre: null, manque: "Choisissez ce que vous voulez graver (étape 1)." };
  const manque = manqueElement(p);
  if (manque) return { ok: false, centre: null, manque };
  const sous = p.kind === "photo" && p.sous ? ` + « ${p.sous} »` : "";
  return { ok: true, centre: `${quoiElement(p)}${sous} — ${ouElement(p)}` };
}

/** Nombre d'éléments gravés : le 1er (compris) + le texte sous la photo + chaque élément en plus. */
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

/** Résumé lisible (panier, paiement, e-mails) : « 1. Dessin n° 12 — Face, au milieu (compris) · 2. … (+3 €) ». */
export function gobeletResume(fields, cfg = {}) {
  const extra = String(Number(cfg.extra) || 3).replace(".", ",");
  return gobeletElements(fields).map((e, i) => {
    const ecr = ["cadre", "lettre", "texte", "sous"].includes(e.kind) && e.police ? `, écriture ${ecritureCourte(e.police)}` : "";
    return `${i + 1}. ${quoiElement(e)} — ${ouElement(e)}${ecr} (${e.compris ? "compris" : `+${extra} €`})`;
  }).join(" · ");
}

/** La planche (image) qui contient le numéro n — pour le montrer à l'atelier. */
export function plancheDuNumero(cfg, n) {
  for (const p of [...(cfg?.dessins || []), ...(cfg?.cadres || [])]) {
    const nums = String(p.nums || "");
    const r = /(\d+)\s*[–-]\s*(\d+)/.exec(nums);
    if (r && n >= +r[1] && n <= +r[2]) return p.src;
    if (nums.split(/[,\s]+/).map(Number).includes(n)) return p.src;
  }
  return null;
}
