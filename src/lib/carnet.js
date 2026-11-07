// =============================================================================
// Carnet A5 gravé (mis en vente le 07/11/2026, gérant : « Papeterie avec le carnet »).
// Reproduit la maquette enregistrée v9 (artifact QSD8HCrAzEqrSEYA7viFMh) : 3 couleurs, 12,90 € ;
// QUATRE emplacements sur la couverture et QUATRE au dos (en haut · au milieu · en bas à gauche ·
// en bas à droite), chacun = rien / un texte (2 lignes) / un de nos dessins ou cadres (n°) / mon logo.
// Couverture gravée +7 € quel que soit le nombre d'emplacements remplis, dos gravé +7 € pareil.
// UN SEUL calcul pour la fiche ET le paiement (pur, sans dépendance serveur).
// =============================================================================
import { getFontLabel } from "./fonts";
import { MP_NUMS_OK } from "./marquePages";

export const CN_GRAVURE = 7;
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

export const cnVide = () => Object.fromEntries(CN_FACES.map(([s]) => [s, Object.fromEntries(CN_ZONES.map(([z]) => [z, { k: "", t: "", t2: "", n: 0, src: null }]))]));

export function cnPlein(e) {
  return Boolean(e && ((e.k === "texte" && String(e.t || "").trim()) || (e.k === "dessin" && e.n) || (e.k === "logo" && e.src)));
}
export function cnFaceGravee(v, side) {
  return Object.values(v?.[side] || {}).some(cnPlein);
}
export function cnPrixGravure(v) {
  return CN_FACES.reduce((a, [s]) => a + (cnFaceGravee(v, s) ? CN_GRAVURE : 0), 0);
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
    const t = String(e.t || "").slice(0, 30);
    const t2 = String(e.t2 || "").slice(0, 40);
    if (k === "texte" && t.trim()) v[s][z] = { k, t, t2: t2.trim() ? t2 : "", n: 0, src: null };
    else if (k === "dessin") {
      const n = Number(e.n);
      if (!NUMS.has(n)) return null; // un dessin sans numéro valable : la fiche ne laisse pas passer
      v[s][z] = { k, t: n >= 75 ? String(e.t || "").slice(0, 24) : "", t2: "", n, src: null };
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
    morceaux.push(l.length ? `${nom} (+7 €) — ${l.map((x) => `${COURT[x.zone]} : ${x.valeur}`).join(" ; ")}` : `${nom} : sans gravure`);
  }
  if (texte) morceaux.push(`Écriture : ${getFontLabel(cn.police) || cn.police}`);
  return morceaux.filter(Boolean).join(" · ");
}
