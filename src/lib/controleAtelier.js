// =============================================================================
// Contrôle « tout ce que la cliente a choisi est dans l'atelier » (gérant, 16/10/2026,
// après la commande 10OPUHMO : « je veux plus le même problème pour les commandes »).
// -----------------------------------------------------------------------------
// Pour un article commandé, on liste CHAQUE choix de la cliente (texte, photo, liste,
// modèle, lettre, motif, couverts…) et on vérifie qu'il apparaît dans ce que l'atelier
// affiche : le tableau « À graver » (consignesGravure), les photos envoyées
// (photosEnvoyees) et « Vendu en plus » (optionsArticle).
// Ce qui manque est renvoyé par `oubliesAtelier(item)` :
//   · affiché en rouge sur la page Atelier et la fiche commande (filet de sécurité :
//     rien de ce qu'elle a choisi ne peut plus être caché) ;
//   · signalé par la surveillance du catalogue, produit par produit, AVANT toute
//     commande (`controleProduitAtelier`, simulation de tous les champs remplis).
// Pur (pas de JSX) — `npm run test-controle-atelier`.
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { consignesGravure } from "@/lib/consignesGravure";
import { photosEnvoyees } from "@/lib/apercuCote";
import { optionsArticle } from "@/lib/optionsVendues";
import { MODELES } from "@/lib/modeles";

const IGNORES = new Set(["emplacement", "mode", "police", "deuxEmplacement"]);
const estUrl = (s) => typeof s === "string" && /^(\/api\/img\/|https?:\/\/|data:image\/|\/produits\/)/.test(s);
const norme = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Feuilles texte d'une valeur (chaîne, objet, tableau), sans les clés techniques. */
function feuilles(v, out = []) {
  if (v == null) return out;
  if (typeof v === "string") { if (v.trim()) out.push(v.trim()); return out; }
  if (typeof v === "number" || typeof v === "boolean") return out;
  if (Array.isArray(v)) { v.forEach((x) => feuilles(x, out)); return out; }
  if (typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      if (/^(fonts?|layout|bg|cls|id|key|scale|size|cx|cy|x|y|w|h|color|couleur)$/i.test(k)) continue;
      feuilles(x, out);
    }
  }
  return out;
}

/** Tout ce que l'atelier affiche pour cet article, en chaînes normalisées + les photos. */
function affiche(item) {
  const c = consignesGravure(item);
  const textes = [];
  const pousse = (l) => { if (l) { textes.push(norme(l.k)); textes.push(norme(l.v)); } };
  c.general.forEach(pousse); c.autres.forEach(pousse); c.placement.forEach(pousse);
  c.faces.forEach((f) => { textes.push(norme(f.nom)); f.lignes.forEach(pousse); });
  for (const o of optionsArticle(item) || []) { textes.push(norme(o.libelle)); textes.push(norme(o.detail)); }
  const photos = new Set(photosEnvoyees(item).map((p) => p.src));
  return { textes, photos };
}

/** Un libellé d'option de liste (« ♥ » → « Cœurs ♥ texte ♥ »). */
function libelleOption(f, v) {
  const o = (f?.options || []).find((x) => String(x.value) === String(v));
  return o ? String(o.label).replace(/,?\s*\(?\+\s*[\d.,]+\s*€\)?/g, "").trim() : null;
}

/**
 * Choix de la cliente absents de l'atelier : [{ cle, libelle, valeur, photo }].
 * Vide = tout est affiché.
 */
export function oubliesAtelier(item) {
  if (!item) return [];
  const produit = getProductBySlug(item.slug);
  const champs = { ...(item.fields || {}) };
  if (item.modele && !champs.modele) champs.modele = item.modele;
  const defs = new Map((produit?.personalizationFields || []).map((f) => [f.key, f]));
  const { textes, photos } = affiche(item);
  const vu = (s) => { const n = norme(s); return !n || textes.some((t) => t.includes(n)); };
  const out = [];
  for (const [cle, valeur] of Object.entries(champs)) {
    if (IGNORES.has(cle)) continue;
    const f = defs.get(cle);
    if (f && (f.type === "note" || f.type === "font")) continue;
    const libelle = String(f?.label || cle).replace(/\s*\(\+[^)]*\)/g, "").trim();
    if (typeof valeur === "string") {
      const v = valeur.trim();
      if (!v) continue;
      if (f?.type === "photo" || estUrl(v)) {
        if (!photos.has(v)) out.push({ cle, libelle, valeur: v, photo: true });
        continue;
      }
      const lib = libelleOption(f, v);
      if (vu(v) || (lib && vu(lib))) continue;
      out.push({ cle, libelle, valeur: lib || v, photo: false });
      continue;
    }
    // Valeur composée (modèle, couverts, motifs…) : chaque texte qu'elle contient doit être affiché.
    const manquants = feuilles(valeur).filter((x) => !estUrl(x) && !vu(x));
    if (manquants.length) out.push({ cle, libelle, valeur: manquants.join(" · "), photo: false });
  }
  return out;
}

/**
 * Simulation sur un PRODUIT (surveillance du catalogue) : chaque option, chaque emplacement,
 * chaque valeur des listes qui en montrent d'autres, tous les champs remplis.
 * Renvoie [{ option, cle, libelle }] pour ce qui ne serait pas affiché à l'atelier.
 */
export function controleProduitAtelier(product) {
  const champsDef = (product?.personalizationFields || []).filter((f) => f && f.key);
  if (!champsDef.length) return [];
  const vars = Array.isArray(product.variants) && product.variants.length ? product.variants : [{ id: null, title: "" }];
  const empl = champsDef.find((f) => f.key === "emplacement");
  const emplacements = empl ? (empl.options || []).map((o) => o.value) : [null];
  const pilotes = [...new Set(champsDef.map((f) => f.showIfField).filter(Boolean))];
  const scenarios = [{}];
  for (const k of pilotes) {
    const vals = [...new Set(champsDef.filter((f) => f.showIfField === k).map((f) => String(f.showIfValue)))];
    const copie = scenarios.splice(0);
    for (const s of copie) for (const v of vals) scenarios.push({ ...s, [k]: v });
  }
  const out = [];
  const vus = new Set();
  for (const v of vars) for (const e of emplacements) for (const sc of scenarios.slice(0, 12)) {
    const fields = { ...sc };
    if (e) fields.emplacement = e;
    for (const f of champsDef) {
      if (f.key in fields || f.type === "note" || f.type === "font" || IGNORES.has(f.key)) continue;
      if (f.variantContains && !String(v.title || "").includes(f.variantContains)) continue;
      if (f.showIfField && String(sc[f.showIfField]) !== String(f.showIfValue)) continue;
      if (f.showIfEmplacement && e && f.showIfEmplacement !== e) continue;
      if (f.type === "photo") fields[f.key] = `/api/img/TEST-${f.key}`;
      else if (f.type === "select" || f.type === "color") { const o = (f.options || []).find((x) => String(x.value || "").trim()); if (o) fields[f.key] = String(o.value); }
      else if (!f.type || f.type === "text" || f.type === "textarea" || f.type === "stylepicker" || f.type === "lettreFleurie" || f.type === "lettering") fields[f.key] = f.type === "stylepicker" ? "7" : f.type === "lettreFleurie" ? "K" : `Essai ${f.key}`;
    }
    const item = { slug: product.slug, variantId: v.id, variantTitle: v.title, emplacement: e || "face", photoSrc: fields.photo || null, fields };
    for (const f of champsDef) {
      if (f.type === "couverts") {
        const th = (f.themes || [])[0];
        if (th) fields[f.key] = { theme: th.key, animals: Object.fromEntries((f.pieces || []).map((pc) => [pc.key, (th.animals || [])[0]?.key]).filter(([, a]) => a)) };
      }
      if (f.type === "modele" && MODELES[f.template]) {
        item.modeleTemplate = f.template;
        item.modele = { text: Object.fromEntries(MODELES[f.template].lines.map((l) => [l.key, `Essai ${l.key}`])), motif: MODELES[f.template].defaultMotif || "aucun" };
      }
    }
    let oublis = [];
    try { oublis = oubliesAtelier(item); } catch { continue; }
    for (const o of oublis) {
      const k = `${o.cle}`;
      if (vus.has(k)) continue;
      vus.add(k);
      out.push({ option: [v.title, e].filter(Boolean).join(" · "), cle: o.cle, libelle: o.libelle });
    }
  }
  return out;
}
