// =============================================================================
// Ce que la cliente a vu, CÔTÉ PAR CÔTÉ, sur un verre à graver face / fond / les deux.
// -----------------------------------------------------------------------------
// Gérant, 16/10/2026 (commande 10OPUHMO, verre à whisky, photo + texte sur la face ET
// au fond) : « je n'ai pas la deuxième photo dans l'atelier… comme la cliente a choisi,
// il faut que ce soit pareil dans l'atelier ». Avant, l'atelier ne montrait que la photo
// de la face, l'aperçu de la face portait AUSSI le texte du fond, et l'aperçu du fond
// n'avait pas son texte.
// Ce module dit, pour un article commandé, quels côtés graver et ce qui va sur chacun
// (photo du verre vierge, photo de la cliente et sa place, lignes de texte et leur place),
// exactement comme l'éditeur de la fiche produit (ProductDetail : editPhotoSrc / editLines).
// Pur (pas de JSX), utilisé par la fiche produit (capture), l'atelier et la fiche commande.
// =============================================================================
import { getProductBySlug } from "@/lib/products";

const estUrl = (s) => typeof s === "string" && (s.startsWith("/") || s.startsWith("http") || s.startsWith("data:"));
const lignes = (txt) => String(txt || "").split("\n").map((l) => l.trim()).filter(Boolean);

/** Le produit se grave-t-il face / fond / les deux (champ « emplacement ») ? */
export function aEmplacement(product) {
  return Boolean(product && (product.personalizationFields || []).some((f) => f.key === "emplacement") && (product.fondImage || product.engraveFond));
}

/** Emplacement choisi : "face" | "fond" | "deux". */
export function emplacementDe(item) {
  const f = item?.fields || {};
  const e = f.emplacement || item?.emplacement || (item?.deuxEmplacement ? "deux" : "");
  return e === "fond" || e === "deux" ? e : "face";
}

/** Côtés à graver, dans l'ordre. */
export function cotesDeLArticle(item) {
  const e = emplacementDe(item);
  return e === "deux" ? ["face", "fond"] : [e];
}

/**
 * Lignes de texte d'un côté, comme dans l'éditeur de la fiche :
 *  · les deux côtés : face = texte + texte2 (le décor encadre la 1re ligne), fond = texteFond ;
 *  · un seul côté : texte + texte2 (+ décor), posés sur ce côté.
 */
export function lignesDuCote(fields, side, dual) {
  const f = fields || {};
  if (dual && side === "fond") return lignes(f.texteFond);
  const l = ["texte", "texte2"].flatMap((k) => lignes(f[k]));
  if (f.decor && l.length) l[0] = `${f.decor} ${l[0]} ${f.decor}`;
  return l;
}

/**
 * Tout ce qu'il faut pour redessiner un côté tel que la cliente l'a vu.
 * { side, glass, box, photo, photoLayout, lines, textLayout, fontKey }
 */
export function contenuCote(item, side, product = getProductBySlug(item?.slug)) {
  const f = item?.fields || {};
  const lay = item?.layout || {};
  const dual = emplacementDe(item) === "deux";
  const fond = side === "fond";
  const variante = (product?.variants || []).find((v) => v.id === item?.variantId);
  const glass = fond ? product?.fondImage : (variante?.engraveImage || product?.engraveImage || product?.images?.[0]);
  const cfg = fond ? product?.engraveFond : product?.engrave;
  // Les deux côtés : chaque côté a SA photo et SA place ; un seul côté : la photo et la place « principales ».
  const photoBrute = dual && fond ? f.photoFond : (f.photo || item?.photoSrc);
  const photoLayout = dual && fond ? lay.photoFond : lay.photo;
  const textLayout = dual && fond ? lay.textFond : lay.text;
  return {
    side,
    glass: glass || null,
    box: cfg?.box || null,
    photo: estUrl(photoBrute) ? photoBrute : null,
    photoLayout: photoLayout || null,
    lines: lignesDuCote(f, side, dual),
    textLayout: textLayout || null,
    fontKey: f.police || "playfair",
  };
}

/**
 * Photos envoyées par la cliente pour cet article, une par côté (face, fond), sans doublon.
 * [{ src, titre }]
 */
export function photosEnvoyees(item, product = getProductBySlug(item?.slug)) {
  const out = [];
  const ajoute = (src, titre) => { if (estUrl(src) && !out.some((p) => p.src === src)) out.push({ src, titre }); };
  if (aEmplacement(product)) {
    if (emplacementDe(item) !== "deux") { ajoute(contenuCote(item, cotesDeLArticle(item)[0], product).photo, "Photo envoyée"); return out; }
    const face = contenuCote(item, "face", product).photo;
    const fond = contenuCote(item, "fond", product).photo;
    if (face && face === fond) ajoute(face, "Photo envoyée — face avant ET fond");
    ajoute(face, "Photo envoyée — face avant");
    ajoute(fond, "Photo envoyée — fond du verre");
    return out;
  }
  ajoute(item?.photoSrc, "Photo envoyée");
  return out;
}
