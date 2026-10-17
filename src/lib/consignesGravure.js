// =============================================================================
// Consignes de gravure d'un article commandé, rangées pour l'atelier.
// -----------------------------------------------------------------------------
// Gérant, 16/10/2026 (commande 0XIF6DDO, pendentif géométrique) : « il faut que
// ce soit bien détaillé, je dois graver du haut vers le bas ou en bas, tout doit
// être détaillé par rapport aux réglages qu'on a faits dans l'admin ».
// Avant : une seule liste à plat (« Face avant — texte », « Face droite —
// texte », … puis « Sens du nom » perdu à la fin, faces vides absentes, taille
// et place de la gravure pour un seul élément).
// Maintenant, pour TOUT produit, à partir des réglages de la fiche
// (`personalizationFields`) et de ce que la cliente a choisi :
//   · `general`   : ce qui vaut pour toute la pièce (emplacement face / fond,
//                    sens d'écriture avec une flèche, police) ;
//   · `faces`     : un bloc par face / zone (préfixe du libellé avant « — »,
//                    ou recto / verso), y compris les faces À LAISSER VIERGES ;
//   · `autres`    : les champs qui ne dépendent d'aucune face ;
//   · `placement` : où et à quelle taille graver (enregistré à la commande).
// Module pur (pas de JSX) : testé par `npm run test-consignes`.
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { getFontLabel } from "@/lib/fonts";
import { aEmplacement, emplacementDe, photosEnvoyees } from "@/lib/apercuCote";
import { MODELES, layoutLabel } from "@/lib/modeles";

function champVisible(f, champs, variantTitle) {
  if (f.showIfField && String(champs[f.showIfField] || "") !== String(f.showIfValue)) return false;
  if (f.variantContains && !String(variantTitle || "").includes(f.variantContains)) return false;
  return true;
}
const estTexte = (f) => !f.type || f.type === "text" || f.type === "textarea";
const nettoie = (s) => String(s || "")
  .replace(/^Gravure\s*[—-]\s*/i, "")
  .replace(/,?\s*\+\s*[\d.,]+\s*€/gi, "")
  .replace(/\s*\(\s*\)/g, "")
  .replace(/\s*\(texte inclus\)/gi, "")
  .replace(/\s*\((facultatif|optionnel)\)/gi, "")
  .replace(/\s*\(si texte\)/gi, "")
  .replace(/\s*\?\s*$/, "")
  .trim();
const maj = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Libellé lisible d'une valeur (choix d'une liste, n° de modèle, police). */
function valeurLisible(f, brut) {
  const v = String(brut).trim();
  if (f.type === "font") return getFontLabel(v) || v;
  if (f.type === "stylepicker") return `n° ${v}`;
  const opt = (f.options || []).find((o) => String(o.value) === v);
  return opt ? nettoie(opt.label) : v;
}

/** Face / zone à laquelle appartient un champ, et le nom du réglage dans cette face. */
// « Gravure — page 1 », « Motif — page 1 », « Prénom — 1er cœur », « Texte à graver — verso » : le mot
// générique est AVANT le tiret, la face après (17/10/2026 : sinon « Motif » devenait une face à part).
const GENERIQUE = /^(gravure|motif|texte(\s+à\s+graver)?|prénom|prenom)$/i;
function faceDuChamp(f) {
  const brut = String(f.label || f.key).replace(/,?\s*\+\s*[\d.,]+\s*€/gi, "").replace(/\s*\([^)]*\)/g, "").trim();
  const g = brut.match(/^(.+?)\s+[—–]\s+(.+)$/);
  if (g && GENERIQUE.test(g[1].trim()) && !/,/.test(g[2]) && g[2].trim().split(/\s+/).length <= 3) {
    const a = g[1].trim();
    return { face: maj(g[2].trim()), quoi: /^(gravure|texte)/i.test(a) ? "Texte" : maj(a.toLowerCase()) };
  }
  const lab = nettoie(f.label || f.key);
  const m = lab.match(/^(.+?)\s+[—–]\s+(.+)$/);
  if (m) return { face: maj(m[1].trim()), quoi: maj(m[2].trim()) };
  const rv = lab.match(/\bau\s+(recto|verso)\b/i);
  if (rv) return { face: maj(rv[1].toLowerCase()), quoi: maj(lab.replace(/\s*au\s+(recto|verso)\b/i, "").trim() || "Texte") };
  return null;
}

/** Flèche + phrase pour un sens d'écriture. */
function sensLisible(label) {
  const l = String(label || "").toLowerCase();
  if (/haut vers le bas/.test(l)) return "↓ Du haut vers le bas";
  if (/bas vers le haut/.test(l)) return "↑ Du bas vers le haut";
  if (/gauche vers la droite/.test(l)) return "→ De gauche à droite";
  if (/droite vers la gauche/.test(l)) return "← De droite à gauche";
  return label;
}

/** « centré, en haut » à partir d'un repère en % sur la photo du produit. */
export function positionEnMots(cxPct, cyPct) {
  if (!Number.isFinite(cxPct) || !Number.isFinite(cyPct)) return "";
  const h = cxPct < 40 ? "à gauche" : cxPct > 60 ? "à droite" : "centré";
  const v = cyPct < 36 ? "en haut" : cyPct > 64 ? "en bas" : "au milieu";
  return `${h}, ${v}`;
}

const NOMS_ZONES = [
  ["photo", "Photo / logo"],
  ["text", "Texte"],
  ["modele", "Modèle"],
  ["photoFond", "Photo / logo — fond du verre"],
  ["textFond", "Texte — fond du verre"],
  ["motifFond", "Motif — fond du verre"],
];

/** Où et à quelle taille graver, d'après ce qui a été enregistré à la commande. */
export function placementGravure(item) {
  const L = item?.layout || {};
  const out = [];
  for (const [cle, nom] of NOMS_ZONES) {
    const z = L[cle];
    if (!z || !z.label) continue;
    const taille = String(z.label).split(/\s*·\s*position/i)[0].trim()
      .replace(/^texte\s*≈\s*([\d,.]+)\s*cm de haut/i, "lettres de ≈ $1 cm de haut")
      .replace(/^gravure\s*≈/i, "≈");
    const px = Number.isFinite(z.cxPct) ? z.cxPct : Number.isFinite(z.cx) ? Math.round(z.cx * 100) : NaN;
    const py = Number.isFinite(z.cyPct) ? z.cyPct : Number.isFinite(z.cy) ? Math.round(z.cy * 100) : NaN;
    const mots = positionEnMots(px, py);
    const repere = Number.isFinite(px) ? ` (repère ${px} % / ${py} % sur la photo)` : "";
    out.push({ k: nom, v: [taille, mots].filter(Boolean).join(" · ") + repere });
  }
  if (L.crystalText?.label) out.push({ k: "Texte dans le cristal", v: L.crystalText.label });
  return out;
}

const EMPLACEMENTS = { face: "Face avant du verre", fond: "Fond du verre (lu à travers le verre)", deux: "Face avant ET fond du verre" };

export function consignesGravure(item) {
  const produit = getProductBySlug(item?.slug);
  const champs = item?.fields || {};
  const vus = (produit?.personalizationFields || []).filter((f) => champVisible(f, champs, item?.variantTitle));
  const general = [];
  const autres = [];
  const faces = new Map(); // ordre de la fiche

  // Emplacement (verres à whisky / cocktail : face, fond ou les deux).
  const empl = champs.emplacement || item?.emplacement || (item?.deuxEmplacement ? "deux" : null);
  if (empl && (produit?.fondImage || produit?.engraveFond) && EMPLACEMENTS[empl]) {
    general.push({ k: "Emplacement", v: EMPLACEMENTS[empl], fort: true });
  }

  // Verre face / fond / les deux (16/10/2026, commande 10OPUHMO) : un bloc PAR CÔTÉ, avec sa photo
  // et son texte (avant : texte de la face et texte du fond mélangés dans « autres »).
  const parCote = aEmplacement(produit);
  const deux = parCote && emplacementDe(item) === "deux";
  const nomCote = (f) => (deux ? (/Fond$/.test(f.key) ? "Fond du verre" : "Face avant") : (emplacementDe(item) === "fond" ? "Fond du verre" : "Face avant"));
  const quoiCote = (f) => maj(nettoie(f.label || f.key).replace(/^ajouter\s+(un|une)\s+/i, "").replace(/\s+(pour|du|au)\s+(le\s+)?fond(\s+du\s+verre)?$/i, "").trim()) || "Texte";
  if (deux) { faces.set("Face avant", []); faces.set("Fond du verre", []); }
  if (parCote) {
    const photos = photosEnvoyees(item, produit);
    for (const ph of photos) {
      const cote = /fond/.test(ph.titre) && !/face/.test(ph.titre) ? "Fond du verre" : (/ET fond/.test(ph.titre) ? null : (deux ? "Face avant" : nomCote({ key: "photo" })));
      const cibles = cote ? [cote] : ["Face avant", "Fond du verre"];
      for (const c of cibles) {
        if (!faces.has(c)) faces.set(c, []);
        faces.get(c).push({ k: "Photo / logo", v: "envoyée par la cliente (voir la photo)", texte: false });
      }
    }
  }

  let aDuTexte = false;
  // Motifs proposés / choisis, par face (« _ » = hors face) : pour écrire « aucun » quand la cliente
  // n'en a pas pris (gérant, 17/10/2026, pendentif 0XIF6DDO : « y a pas de motif, il a pas choisi »).
  const motifsFace = new Map();
  for (const f of vus) {
    if (f.type === "note" || f.type === "photo" || f.type === "font") continue;
    if (f.key === "emplacement" || f.key === "mode") continue;
    const groupe = parCote ? { face: nomCote(f), quoi: quoiCote(f) } : faceDuChamp(f);
    if (groupe && !faces.has(groupe.face)) faces.set(groupe.face, []);
    const brut = champs[f.key];
    if (f.type === "motif") {
      const cle = groupe ? groupe.face : "_";
      const m = motifsFace.get(cle) || { choisi: false };
      if (typeof brut === "string" && brut.trim()) m.choisi = true;
      motifsFace.set(cle, m);
    }
    if (typeof brut !== "string" || !brut.trim()) continue;
    if (estTexte(f)) aDuTexte = true;
    const valeur = valeurLisible(f, brut);
    if (/^sens\b/i.test(nettoie(f.label || f.key)) || f.key === "sens") {
      general.push({ k: "Sens d'écriture", v: sensLisible(valeur) + (faces.size > 1 ? " (toutes les faces)" : ""), fort: true });
      continue;
    }
    if (groupe) faces.get(groupe.face).push({ k: groupe.quoi, v: valeur, texte: estTexte(f) });
    else autres.push({ k: maj(nettoie(f.label || f.key)), v: valeur, texte: estTexte(f) });
  }

  // Face gravée (un texte) avec un motif possible mais non choisi : on l'écrit, pour ne pas croire à un oubli.
  const AUCUN = { k: "Motif", v: "aucun (la cliente n'en a pas choisi)", texte: false };
  for (const [cle, m] of motifsFace) {
    if (m.choisi) continue;
    if (cle === "_") { if (aDuTexte) autres.push({ ...AUCUN }); continue; }
    const lignes = faces.get(cle);
    if (lignes && lignes.some((l) => l.texte)) lignes.push({ ...AUCUN });
  }

  // Modèle décoré (Fête des pères…) : ses textes ne sont pas dans les champs (16/10/2026, contrôle
  // « tout ce que la cliente a choisi est dans l'atelier » : commande 1JXNFE0L sans ses textes).
  const mv = item?.modele;
  const tpl = item?.modeleTemplate ? MODELES[item.modeleTemplate] : null;
  if (mv && tpl) {
    const style = mv.layout || tpl.layout || "stack";
    general.push({ k: "Modèle", v: `${tpl.label} — ${layoutLabel(tpl, style)}`, fort: true });
    for (const l of tpl.lines || []) {
      if (l.below && mv.addText === false) continue;
      const t = String(mv.text?.[l.key] || "").trim();
      if (!t) continue;
      const fonte = String((mv.fonts || {})[l.key] || l.font || "").replace(/^fnt-/, "");
      autres.push({ k: l.below ? "Texte ajouté" : l.label, v: fonte ? `${t}  (écriture ${getFontLabel(fonte) || fonte})` : t, texte: true });
    }
    if (mv.motif && mv.motif !== "aucun") autres.push({ k: "Motif", v: String(mv.motif), texte: false });
  }
  // Couverts enfants : le thème et l'animal choisi pour chaque couvert.
  for (const f of vus) {
    if (f.type !== "couverts") continue;
    const cv = champs[f.key];
    if (!cv || typeof cv !== "object") continue;
    const th = (f.themes || []).find((t) => t.key === cv.theme);
    if (th) autres.push({ k: "Thème des couverts", v: th.label || cv.theme, texte: false });
    for (const pc of f.pieces || []) {
      const ak = cv.animals?.[pc.key];
      if (!ak) continue;
      const al = ((th?.animals || []).find((a) => a.key === ak) || {}).label || ak;
      autres.push({ k: pc.label, v: al, texte: false });
    }
  }

  // Police : une seule ligne, écrite dès qu'il y a un texte (même règle que la fiche atelier).
  const fonte = vus.find((f) => f.type === "font");
  if (fonte && aDuTexte && champs.mode !== "modele") {
    const choisie = String(champs[fonte.key] || "").trim();
    general.push({ k: "Police", v: choisie ? (getFontLabel(choisie) || choisie) : `${getFontLabel("playfair")} (police proposée, non changée)` });
  }

  const listeFaces = [...faces.entries()].map(([nom, lignes]) => ({ nom, lignes, vide: lignes.length === 0 }));
  // Une seule « face » = pas de découpage utile : ses lignes rejoignent les autres.
  const vraiesFaces = listeFaces.length > 1 ? listeFaces : [];
  if (listeFaces.length === 1) {
    const g = listeFaces[0];
    autres.unshift(...g.lignes.map((l) => ({ ...l, k: g.lignes.length > 1 ? `${g.nom} · ${l.k}` : g.nom })));
  }

  // Cristal : la place choisie dans la liste prime sur le repère de l'aperçu.
  const placement = placementGravure(item);
  const choix = autres.find((a) => /placer le texte|place du texte/i.test(a.k));
  const repere = placement.find((p) => p.k === "Texte dans le cristal");
  if (choix && repere) {
    const mot = String(choix.v).toLowerCase().split(/\s+/).pop();
    if (mot && !String(repere.v).toLowerCase().includes(mot)) {
      repere.v = `⚠️ la cliente a choisi « ${choix.v} » : suivre son choix (l'aperçu indiquait « ${repere.v} »)`;
      repere.alerte = true;
    }
  }

  return { general, faces: vraiesFaces, autres, placement };
}
