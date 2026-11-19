// =============================================================================
// Carnet A5 gravé (mis en vente le 07/11/2026, gérant : « Papeterie avec le carnet »).
// Reproduit la maquette enregistrée v9 (artifact QSD8HCrAzEqrSEYA7viFMh) : 3 couleurs, 15,90 € (12,90 € jusqu'au 07/11/2026) ;
// QUATRE emplacements sur la couverture et QUATRE au dos (en haut · au milieu · en bas à gauche ·
// en bas à droite), chacun = rien / un texte (2 lignes) / un de nos dessins ou cadres (n°) / mon logo.
// PRIX PAR ÉLÉMENT GRAVÉ (16/11/2026, gérant : « 3 € le texte, 4 € la photo… je t'ai déjà dit qu'il y a UN truc qui est
// gratuit ») : chaque texte +3 €, chaque dessin / cadre / logo / photo +4 € (le texte écrit dans un cadre = un texte
// de plus), et SEUL le 1er élément gravé du carnet est offert (19/11/2026 ; du 16/11 au 19/11 : le moins cher). Avant (07/11 → 16/11) : +7 € par face, et du
// 15/11 au 16/11 une face entière offerte — erreur : toute la couverture était gratuite (commande 1IQXA36I).
// UN SEUL calcul pour la fiche ET le paiement (pur, sans dépendance serveur).
// =============================================================================
import { getFontLabel } from "./fonts";
import { MP_NUMS_OK } from "./marquePages";

export const CN_TEXTE = 3; // un texte (une ou deux lignes au même emplacement)
export const CN_IMAGE = 4; // un de nos dessins ou cadres, un logo ou une photo
export const CN_GRAVURE = CN_TEXTE; // compat : prix d'une gravure de base
export const CN_FACES = [["face", "Couverture"], ["dos", "Dos"]];
export const CN_ZONES = [
  ["haut", "En haut", "titre, sur une ligne"],
  ["milieu", "Au milieu", "grand : dessin, logo, texte"],
  ["basg", "En bas à gauche", "petit, discret"],
  ["basd", "En bas à droite", "petit, discret"],
];
// Zones (fractions du visuel carré) relevées sur la couverture dessinée (maquette v9) : élastique à droite ;
// au dos l'élastique est à gauche, la surface libre est décalée de 5 % vers la droite.
const ZF = { haut: [0.26, 0.14, 0.42, 0.10, "c"], milieu: [0.25, 0.30, 0.44, 0.32, "c"], basg: [0.26, 0.76, 0.20, 0.09, "g"], basd: [0.48, 0.76, 0.20, 0.09, "d"] };
export const CN_ZONES_POS = { face: ZF, dos: Object.fromEntries(Object.entries(ZF).map(([k, z]) => [k, [z[0] + 0.05, z[1], z[2], z[3], z[4]]])) };
// Teinte de la gravure sur chaque couleur (le noir se grave clair).
export const CN_ENCRE = { marron: "#2c160a", noir: "#c9c2b6", gris: "#2f2f31" };
const NUMS = new Set(MP_NUMS_OK);
const COURT = Object.fromEntries(CN_ZONES.map(([k, l]) => [k, l.toLowerCase()]));

// ts / ts2 = le français tapé quand le texte est traduit (fiche seulement : au panier il part dans les champs à plat).
export const cnVide = () => Object.fromEntries(CN_FACES.map(([s]) => [s, Object.fromEntries(CN_ZONES.map(([z]) => [z, { k: "", t: "", t2: "", n: 0, src: null, ts: "", ts2: "" }]))]));

export function cnPlein(e) {
  // Un texte en cours de traduction (français tapé, traduction pas encore arrivée) compte déjà : le prix ne bouge pas.
  return Boolean(e && ((e.k === "texte" && String(e.t || e.ts || "").trim()) || (e.k === "dessin" && e.n) || (e.k === "logo" && e.src)));
}
export function cnFaceGravee(v, side) {
  return Object.values(v?.[side] || {}).some(cnPlein);
}
/** Les éléments gravés du carnet, dans l'ordre de la fiche (couverture puis dos, haut → bas droite) :
 *  [{ side, zone, kind: "texte"|"image", prix, cle, offert }]. Le texte au milieu d'un cadre compte comme un texte.
 *  Offert = le PREMIER élément gravé (19/11/2026 ; du 16/11 au 19/11 : le moins cher). */
export function cnElements(v) {
  const out = [];
  for (const [s] of CN_FACES) for (const [z] of CN_ZONES) {
    const e = v?.[s]?.[z];
    if (!cnPlein(e)) continue;
    if (e.k === "texte") out.push({ side: s, zone: z, kind: "texte", prix: CN_TEXTE, cle: `${s}.${z}` });
    else {
      out.push({ side: s, zone: z, kind: "image", prix: CN_IMAGE, cle: `${s}.${z}` });
      if (e.k === "dessin" && e.n >= 75 && String(e.t || e.ts || "").trim()) out.push({ side: s, zone: z, kind: "texte", prix: CN_TEXTE, cle: `${s}.${z}.cadre` });
    }
  }
  if (out.length) out[0].offert = true; // 19/11/2026 (gérant : « carnet, pareil, juste une gravure offerte ») : la 1re, ordre de la fiche
  return out;
}
/** Supplément de gravure : tout, sauf le 1er élément gravé (offert). */
export function cnPrixGravure(v) {
  return cnElements(v).reduce((t, x) => t + (x.offert ? 0 : x.prix), 0);
}
/** Code « gravure offerte » : la gravure PAYANTE la moins chère (0 s'il n'y en a pas). */
export function cnPremiereGravure(v) {
  const payes = cnElements(v).filter((x) => !x.offert).map((x) => x.prix);
  return payes.length ? Math.min(...payes) : 0;
}
/** Supplément d'une face (ce qui y est payé). */
export function cnPrixFace(v, side) {
  return cnElements(v).filter((x) => x.side === side && !x.offert).reduce((t, x) => t + x.prix, 0);
}
/** Étiquette d'un emplacement : « offert », « +3 € », « +4 € », « +7 € » (cadre + texte), ou "" s'il est vide. */
export function cnPrixZone(v, side, zone) {
  const els = cnElements(v).filter((x) => x.side === side && x.zone === zone);
  if (!els.length) return "";
  const paye = els.filter((x) => !x.offert).reduce((t, x) => t + x.prix, 0);
  if (!paye) return "offert";
  return els.some((x) => x.offert) ? `+${paye} € (une partie offerte)` : `+${paye} €`;
}
/** Compat (anciens appels) : la face qui contient l'élément offert. */
export function cnFaceComprise(v) {
  const o = cnElements(v).find((x) => x.offert);
  return o ? o.side : null;
}
const photoSite = (s) => typeof s === "string" && /^\/api\/img\/[A-Za-z0-9_-]{6,64}$/.test(s);

/** Réglages envoyés (fiche → panier → paiement) remis au propre ; null si invalides. */
export function cnNormaliser(product, cn) {
  if (!product?.carnet || !cn || typeof cn !== "object") return null;
  const police = typeof cn.police === "string" && /^[a-z-]{2,24}$/.test(cn.police) ? cn.police : "playfair";
  const v = cnVide();
  for (const [s] of CN_FACES) for (const [z] of CN_ZONES) {
    const e = cn.v?.[s]?.[z];
    if (!e || typeof e !== "object") continue;
    const k = ["texte", "dessin", "logo"].includes(e.k) ? e.k : "";
    // Limites larges : une traduction peut être plus longue que le texte tapé (30 / 40 / 24 caractères sur la fiche).
    const t = String(e.t || "").slice(0, 90);
    const t2 = String(e.t2 || "").slice(0, 120);
    if (k === "texte" && t.trim()) v[s][z] = { k, t, t2: t2.trim() ? t2 : "", n: 0, src: null };
    else if (k === "dessin") {
      const n = Number(e.n);
      if (!NUMS.has(n)) return null; // un dessin sans numéro valable : la fiche ne laisse pas passer
      v[s][z] = { k, t: n >= 75 ? String(e.t || "").slice(0, 72) : "", t2: "", n, src: null };
    } else if (k === "logo") {
      if (!photoSite(e.src)) return null;
      v[s][z] = { k, t: "", t2: "", n: 0, src: e.src };
    }
  }
  return { police, v };
}

/** Lignes « à graver » d'une face : [{ zone, libelle, valeur, texte, img }]. */
export function cnLignes(v, side) {
  const out = [];
  for (const [z, lib] of CN_ZONES) {
    const e = v?.[side]?.[z];
    if (!cnPlein(e)) continue;
    if (e.k === "texte") out.push({ zone: z, libelle: lib, valeur: `Texte « ${e.t.trim()} »${String(e.t2 || "").trim() ? ` + 2ᵉ ligne « ${e.t2.trim()} »` : ""}`, texte: true });
    else if (e.k === "dessin") {
      const cadre = e.n >= 75;
      out.push({ zone: z, libelle: lib, valeur: (cadre ? `Cadre n° ${e.n}` : `Dessin n° ${e.n}`) + (cadre && String(e.t || "").trim() ? `, texte au milieu « ${e.t.trim()} »` : ""), texte: cadre && Boolean(String(e.t || "").trim()), img: `/marque-pages/dessins/${String(e.n).padStart(3, "0")}.png` });
    } else out.push({ zone: z, libelle: lib, valeur: "Logo / dessin envoyé par la cliente", img: e.src });
  }
  return out;
}

/** Résumé court (panier, e-mails, Stripe). */
export function cnResume(product, cn, couleur) {
  const morceaux = [couleur ? `Couleur ${couleur}` : ""];
  let texte = false;
  for (const [s, nom] of CN_FACES) {
    const l = cnLignes(cn.v, s);
    if (l.some((x) => x.texte)) texte = true;
    morceaux.push(l.length ? `${nom} — ${l.map((x) => `${COURT[x.zone]} (${cnPrixZone(cn.v, s, x.zone)}) : ${x.valeur}`).join(" ; ")}` : `${nom} : sans gravure`);
  }
  if (texte) morceaux.push(`Écriture : ${getFontLabel(cn.police) || cn.police}`);
  return morceaux.filter(Boolean).join(" · ");
}

// ── Langue de la gravure (09/11/2026) : UNE langue pour le carnet, appliquée à chacun de ses textes.
const maj1 = (x) => x.charAt(0).toUpperCase() + x.slice(1);
/** Clé à plat d'un texte du carnet : « cnFaceHaut », « cnDosBasg2 » (2ᵉ ligne). */
export const cnCleTexte = (side, zone, ligne2 = false) => `cn${maj1(side)}${maj1(zone)}${ligne2 ? "2" : ""}`;
/** « Couverture · en haut », « Dos · en bas à gauche · 2ᵉ ligne » (vide si la clé n'est pas celle d'un carnet). */
export function cnLibelleCle(cle) {
  for (const [s, nom] of CN_FACES) for (const [z] of CN_ZONES) {
    if (cle === cnCleTexte(s, z)) return `${nom} · ${COURT[z]}`;
    if (cle === cnCleTexte(s, z, true)) return `${nom} · ${COURT[z]} · 2ᵉ ligne`;
  }
  return "";
}
/** Tous les textes du carnet (emplacements « texte » : ligne 1 et 2 ; cadres : le texte au milieu) : [{ key, label, t, ts, side, zone, champ }]. */
export function cnTextes(v) {
  const out = [];
  for (const [s] of CN_FACES) for (const [z] of CN_ZONES) {
    const e = v?.[s]?.[z];
    if (!e) continue;
    if (e.k === "texte") {
      out.push({ key: cnCleTexte(s, z), label: cnLibelleCle(cnCleTexte(s, z)), t: e.t || "", ts: e.ts || "", side: s, zone: z, champ: "t" });
      out.push({ key: cnCleTexte(s, z, true), label: cnLibelleCle(cnCleTexte(s, z, true)), t: e.t2 || "", ts: e.ts2 || "", side: s, zone: z, champ: "t2" });
    } else if (e.k === "dessin" && e.n >= 75) {
      out.push({ key: cnCleTexte(s, z), label: cnLibelleCle(cnCleTexte(s, z)), t: e.t || "", ts: e.ts || "", side: s, zone: z, champ: "t" });
    }
  }
  return out;
}
