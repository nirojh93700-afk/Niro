// Gravure traduite dans la langue de la cliente (maquette v5 enregistrée le 06/11/2026,
// mise en ligne le 07/11/2026 : « La maquette avec les langues tu peux mettre en ligne »).
// La cliente écrit en français, choisit une langue, le site traduit ; elle relit et coche
// la case de confirmation. Rien n'est gravé traduit sans la case cochée (garde-fou du paiement).
// Fichier PUR (fiche, paiement, atelier, tests).
//
// Champs écrits dans la commande (mêmes clés partout) :
//   texte       = le texte GRAVÉ (la traduction, ou le texte tel quel)
//   texteSource = ce que la cliente a tapé en français (seulement si traduit)
//   langue      = code de la langue (vide ou « fr » = français, rien ne change)
//   direct      = « oui » si elle a écrit elle-même dans sa langue (pas de traduction)
//   tradOk      = « oui » quand la case « J'ai relu le texte traduit » est cochée
//   decorPlace  = texte | date | deux (où mettre le décor ; vide = autour du texte)

// [code, nom, nom écrit dans la langue (menu, 09/11/2026), écriture Noto (vide = l'écriture choisie par la cliente), sens]
export const LANGUES = [
  { code: "de", nom: "Allemand", natif: "Deutsch", police: "", dir: "ltr" },
  { code: "en", nom: "Anglais", natif: "English", police: "", dir: "ltr" },
  { code: "ar", nom: "Arabe", natif: "العربية", police: "Noto Naskh Arabic", dir: "rtl" },
  { code: "zh", nom: "Chinois", natif: "中文", police: "Noto Serif SC", dir: "ltr" },
  { code: "es", nom: "Espagnol", natif: "Español", police: "", dir: "ltr" },
  { code: "fr", nom: "Français", natif: "Français", police: "", dir: "ltr" },
  { code: "he", nom: "Hébreu", natif: "עברית", police: "Noto Serif Hebrew", dir: "rtl" },
  { code: "it", nom: "Italien", natif: "Italiano", police: "", dir: "ltr" },
  { code: "pt", nom: "Portugais", natif: "Português", police: "", dir: "ltr" },
  { code: "ta", nom: "Tamoul", natif: "தமிழ்", police: "Noto Serif Tamil", dir: "ltr" },
];

// Phrases déjà préparées (rapport « Marché tamoul » + images réseaux du 06/11). Elles portent la
// MÊME mention que la traduction en direct tant qu'un locuteur ne les a pas relues (maquette v4).
export const PHRASES = {
  "joyeux anniversaire": { en: "Happy birthday", es: "Feliz cumpleaños", pt: "Feliz aniversário", it: "Buon compleanno", de: "Alles Gute zum Geburtstag", ta: "பிறந்தநாள் வாழ்த்துகள்", ar: "عيد ميلاد سعيد", he: "יום הולדת שמח", zh: "生日快乐" },
  "je t'aime": { en: "I love you", ta: "நான் உன்னை காதலிக்கிறேன்", ar: "أحبك", he: "אני אוהב אותך", zh: "我爱你" },
  "amour": { en: "Love", ta: "அன்பு", ar: "حب", he: "אהבה", zh: "爱" },
  "mon amour": { en: "My love", ta: "என் அன்பே", ar: "حبيبي", he: "אהובי", zh: "我的爱" },
  "maman": { en: "Mom", ta: "அம்மா", ar: "ماما", he: "אמא", zh: "妈妈" },
  "papa": { en: "Dad", ta: "அப்பா", ar: "بابا", he: "אבא", zh: "爸爸" },
  "mon papa": { en: "My dad", ta: "என் அப்பா", ar: "أبي", he: "אבא שלי", zh: "我的爸爸" },
  "merci": { en: "Thank you", ta: "நன்றி", ar: "شكرا", he: "תודה", zh: "谢谢" },
  "bonne année": { en: "Happy New Year", ta: "இனிய புத்தாண்டு நல்வாழ்த்துகள்", ar: "سنة سعيدة", he: "שנה טובה", zh: "新年快乐" },
  "félicitations": { en: "Congratulations", ta: "வாழ்த்துகள்", ar: "مبروك", he: "מזל טוב", zh: "恭喜" },
  "joyeux deepavali": { en: "Happy Deepavali", ta: "இனிய தீபாவளி நல்வாழ்த்துகள்" },
  "bonne fête de l'aïd": { en: "Eid Mubarak", ar: "عيد مبارك" },
  "joyeux noël": { en: "Merry Christmas", ta: "கிறிஸ்துமஸ் வாழ்த்துகள்", ar: "عيد ميلاد مجيد", zh: "圣诞快乐" },
  "meilleur papa du monde": { en: "Best dad in the world", ta: "உலகின் சிறந்த அப்பா", ar: "أفضل أب في العالم", he: "האבא הכי טוב בעולם", zh: "世界上最好的爸爸" },
};

export const MENTION_TRAD = "Traduction automatique : à vérifier avant de commander";
export const TEXTE_CASE = "J'ai relu le texte traduit et je confirme qu'il est exact. Il sera gravé exactement comme il s'affiche ci-dessus et ne pourra plus être modifié.";

export function langueDe(code) {
  return LANGUES.find((l) => l.code === code) || null;
}
/** Une langue autre que le français est choisie. */
export function langueActive(fv) {
  const c = String(fv?.langue || "");
  return Boolean(c && c !== "fr" && langueDe(c));
}
/** Le texte gravé passe par une traduction (langue choisie et pas « j'écris moi-même »). */
export function estTraduit(fv) {
  return langueActive(fv) && fv?.direct !== "oui";
}
/** La langue a sa propre écriture (Noto) : le choix « Écriture » ne s'applique pas à ce texte. */
export function ecritureLangue(fv) {
  return langueActive(fv) ? langueDe(fv.langue).police || "" : "";
}
export function cleNormale(t) {
  return String(t || "").toLowerCase().replace(/[’`]/g, "'").replace(/[\s.!]+$/, "").replace(/\s+/g, " ").trim();
}
export function phraseConnue(texte, code) {
  return PHRASES[cleNormale(texte)]?.[code] || "";
}
/** Nom de fichier sans accent : « tamoul ». */
export function nomFichierLangue(code) {
  const l = langueDe(code);
  return (l ? l.nom : "francais").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ── Plusieurs textes sur une même pièce (bijoux recto / verso, décoration de Noël, bois…, 09/11/2026 :
// « les langues… pour tout, même les bijoux, partout il y a du texte à graver »). UNE langue par pièce,
// appliquée à chacun de ses textes. Pour chaque texte de clé k : fv[k] = le texte GRAVÉ, fv[k + "Source"] =
// ce que la cliente a tapé en français (si traduit). fv.langueCles = « recto,verso » (absent = « texte »).
export const cleSource = (k) => `${k}Source`;
export function clesLangue(fv) {
  const c = String(fv?.langueCles || "").split(",").map((x) => x.trim()).filter(Boolean);
  return c.length ? c : ["texte"];
}
/** Les textes de la pièce dans la langue choisie : [{ cle, grave, source }]. */
export function textesEnLangue(fv) {
  if (!langueActive(fv)) return [];
  return clesLangue(fv)
    .map((k) => ({ cle: k, grave: String(fv[k] ?? "").trim(), source: String(fv[cleSource(k)] ?? "").trim() }))
    .filter((t) => t.grave || (estTraduit(fv) && t.source));
}
/** La pièce porte au moins un texte gravé dans une autre langue que le français. */
export function aTexteEnLangue(fv) {
  return textesEnLangue(fv).some((t) => t.grave);
}

/**
 * Contrôle de la commande : null si tout va bien, sinon la phrase qui dit ce qui manque.
 * Même règle sur la fiche (bouton grisé) et au paiement (ligne refusée).
 */
export function manqueLangue(fv) {
  if (!estTraduit(fv)) return null;
  const ts = clesLangue(fv).map((k) => ({ s: String(fv[cleSource(k)] || "").trim(), g: String(fv[k] || "").trim() })).filter((t) => t.s);
  if (!ts.length) return null; // rien d'écrit
  if (ts.some((t) => !t.g)) return "La traduction arrive…";
  if (fv.tradOk !== "oui") return "Cochez « J'ai relu le texte traduit » pour continuer.";
  return null;
}

/** Ligne pour l'atelier : « Tamoul — traduit depuis « Merci », relu et validé par la cliente ». */
export function resumeLangue(fv) {
  if (!langueActive(fv)) return "";
  const l = langueDe(fv.langue);
  if (fv.direct === "oui") return `${l.nom} — texte fourni par la cliente dans sa langue, gravé tel quel`;
  const src = clesLangue(fv).map((k) => String(fv[cleSource(k)] || "").trim()).filter(Boolean);
  return `${l.nom} — traduit depuis ${src.map((x) => `« ${x} »`).join(", ") || "« »"} (traduction automatique, relue et validée par la cliente, case cochée)`;
}

// ── Fiches à part (carnet, marque-pages, gobelet, cristaux déjà gravés — 09/11/2026 : « RESTE : carnet,
// marque-pages, gobelet, cristaux déjà gravés »). Leurs textes sont rangés dans des emplacements
// ({ t: texte GRAVÉ, ts: français tapé }) ; au panier, ils sont recopiés à plat (mêmes clés que partout :
// langue, langueCles, k, kSource, tradOk, direct) pour que le paiement et l'atelier les lisent sans rien changer.
/** Le texte contient au moins une lettre (une date, un numéro, une heure ne se traduisent jamais). */
export const aDesLettres = (t) => /\p{L}/u.test(String(t || ""));
/** Ce que le champ de saisie montre : le français tapé quand le texte est traduit. */
export const texteMontre = (lg, t, ts) => (estTraduit(lg) ? ts || t || "" : t || "");
/** Ce que la frappe écrit dans l'emplacement : { t, ts }. Sans lettre (date, numéro) : gravé tel quel. */
export function texteFrappe(lg, v) {
  return estTraduit(lg) && aDesLettres(v) ? { t: "", ts: v } : { t: v, ts: "" };
}
/**
 * Champs à plat pour le panier et l'atelier. lg = { langue, direct, tradOk } ; textes = [{ key, t, ts }].
 * Français, ou aucun texte avec des lettres : {} (rien de plus dans le panier).
 */
export function champsLangueAPlat(lg, textes) {
  if (!langueActive(lg)) return {};
  const direct = lg.direct === "oui";
  const ts = (textes || [])
    .map((x) => ({ cle: x.key, grave: String(x.t || "").trim(), source: direct ? "" : String(x.ts || "").trim() }))
    .filter((x) => aDesLettres(x.source || x.grave));
  if (!ts.length) return {};
  const out = { langue: lg.langue, langueCles: ts.map((x) => x.cle).join(",") };
  if (direct) out.direct = "oui";
  else if (lg.tradOk === "oui") out.tradOk = "oui";
  for (const x of ts) {
    out[x.cle] = x.grave;
    if (x.source) out[cleSource(x.cle)] = x.source;
  }
  return out;
}
/**
 * Remet d'accord les textes à plat avec la langue choisie (page des cristaux déjà gravés : le texte libre et
 * les champs du zodiaque ne sont pas affichés en même temps, le menu de langue ne bascule que ceux qu'il voit).
 * Traduit : un texte sans son français tapé repart en traduction ; français ou « j'écris moi-même » : le texte
 * tapé redevient le texte gravé. Renvoie le même objet si rien ne change.
 */
export function alignerTextes(fv, cles) {
  let n = fv;
  const pose = (patch) => { n = { ...n, ...patch }; };
  for (const k of cles || []) {
    const g = String(n[k] || ""), s = String(n[cleSource(k)] || "");
    if (estTraduit(n)) { if (g.trim() && !s.trim() && aDesLettres(g)) pose({ [cleSource(k)]: g, [k]: "", tradOk: "" }); }
    else if (s) pose({ [k]: s, [cleSource(k)]: "" });
  }
  return n;
}

/** Où mettre le décor : autour du texte (défaut), de la date, ou des deux. */
export function decorSur(fv, cible) {
  const p = fv?.decorPlace || "texte";
  if (cible === "date") return p === "date" || p === "deux";
  return p !== "date";
}

/**
 * Langues (autres que le français) d'une commande, pour la signaler PARTOUT dans Gestion
 * (gérant, 08/11/2026 : « si quelqu'un commande dans une autre langue, il faut que ce soit
 * bien précisé »). Lit les réglages de chaque article ET de chaque verre d'un lot.
 * → [{ code, nom, direct, article }] (une entrée par langue et par article).
 */
export function languesDeLaCommande(order) {
  const spec = Array.isArray(order?.spec) ? order.spec : order?.spec ? [order.spec] : [];
  const out = [];
  for (const it of spec.filter(Boolean)) {
    const lots = [it.fields || {}, ...(Array.isArray(it.perGlass) ? it.perGlass : [])];
    for (const fv of lots) {
      if (!aTexteEnLangue(fv)) continue;
      const l = langueDe(fv.langue);
      if (out.some((x) => x.code === l.code && x.article === it.name)) continue;
      out.push({ code: l.code, nom: l.nom, direct: fv.direct === "oui", article: it.name || "" });
    }
  }
  return out;
}

/** « TAMOUL » ou « ARABE + HÉBREU » ; vide si tout est en français. */
export function nomsLangues(liste) {
  return [...new Set((liste || []).map((x) => x.nom.toUpperCase()))].join(" + ");
}
