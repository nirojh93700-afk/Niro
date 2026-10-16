// =============================================================================
// Prix de la gravure des VERRES (règle validée par le gérant le 15-16/10/2026).
// -----------------------------------------------------------------------------
// Les prix des verres ne changent pas. Seule la gravure suit cette règle :
//   · verre 1 : image / logo / modèle OFFERT, chaque texte au prix de la fiche
//     (+3 €), options de la fiche (gravure face + fond +7 €…) ;
//   · chaque verre DIFFÉRENT (autre image et/ou autre texte) : +5 € tout compris,
//     + 7 € s'il est gravé face ET fond ;
//   · verres IDENTIQUES au verre 1 : frais de gravure UNE fois pour la ligne :
//     1 ou 2 verres aucun · 3 ou 4 verres +2 € · 5 verres et plus +5 €
//     (+ 7 € par verre gravé face ET fond) ;
//   · un verre laissé sans gravure ne coûte rien de plus.
// Une même fonction sert à la fiche (affichage), au panier et au paiement
// (recalcul de confiance) : le prix affiché est toujours le prix payé.
// Pur, testé par `npm run test-prix-verres`.
// =============================================================================
import { engravingExtra } from "./engravingPrice.js";

export const PRIX_VERRE_DIFFERENT = 5;
export const FRAIS_IDENTIQUES = [
  { max: 2, montant: 0 },
  { max: 4, montant: 2 },
  { max: Infinity, montant: 5 },
];

export const estRegleVerres = (product) => Boolean(product?.regleVerres);

/** Nombre de verres d'une variante (« Lot de 4 » = 4, sinon 1). */
export function verresParVariante(variant) {
  const m = /lot de\s*(\d+)/i.exec(String(variant?.title || ""));
  return m ? parseInt(m[1], 10) : 1;
}

// Champs qui ne font pas, à eux seuls, une gravure.
const NEUTRES = new Set(["police", "emplacement", "mode", "decor", "coffret", "deuxEmplacement", "sens", "motifCount"]);
const plein = (v) => (v && typeof v === "object") ? Object.keys(v).length > 0 : String(v ?? "").trim() !== "";

/** Le verre porte-t-il une gravure (photo, modèle, lettre, texte…) ? */
export function verreGrave(fv) {
  return Object.entries(fv || {}).some(([k, v]) => !NEUTRES.has(k) && plein(v));
}

/** Empreinte d'une gravure : deux verres « identiques » ont la même. */
export function empreinte(fv) {
  const e = Object.entries(fv || {}).filter(([, v]) => plein(v)).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(e.map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v).trim()]));
}

export function fraisIdentiques(n) {
  return (FRAIS_IDENTIQUES.find((f) => n <= f.max) || FRAIS_IDENTIQUES[FRAIS_IDENTIQUES.length - 1]).montant;
}

const arrondi = (x) => Math.round(x * 100) / 100;

/**
 * Supplément de gravure d'une ligne de verres.
 * @returns {{ total, lignes:[{libelle, montant}], nbVerres, identiques, differents, vierges, weight, stockIds }}
 */
export function prixGravureVerres(product, variant, quantite, fields = {}, perGlass = null) {
  const qte = Math.max(1, parseInt(quantite, 10) || 1);
  const parLot = verresParVariante(variant);
  const n = Math.min(parLot * qte, 200);
  const variantId = variant?.id ?? null;
  // Gravure de chaque verre : réglage par verre si « chacun différent », sinon le même partout.
  const liste = Array.isArray(perGlass) && perGlass.length ? perGlass : null;
  const verre = (i) => (liste ? (liste[i % (parLot > 1 ? Math.min(parLot, liste.length) : liste.length)] || {}) : fields) || {};

  const v1 = verre(0);
  const e1 = engravingExtra(product, v1, variantId);
  const empl = (fv) => (fv?.emplacement === "deux" ? engravingExtra(product, { emplacement: "deux" }, variantId).amount : 0);
  const cle1 = empreinte(v1);

  const lignes = [];
  if (verreGrave(v1)) {
    lignes.push({ libelle: "Verre 1 · image, logo ou modèle", montant: 0 });
    if (e1.amount > 0) lignes.push({ libelle: "Verre 1 · texte et options", montant: arrondi(e1.amount) });
  }
  let identiques = verreGrave(v1) ? 1 : 0, differents = 0, vierges = verreGrave(v1) ? 0 : 1;
  let plusDiff = 0, plusEmplIdent = 0;
  for (let i = 1; i < n; i++) {
    const fv = verre(i);
    if (!verreGrave(fv)) { vierges++; continue; }
    if (empreinte(fv) === cle1) { identiques++; plusEmplIdent += empl(fv); continue; }
    differents++;
    plusDiff += PRIX_VERRE_DIFFERENT + empl(fv);
  }
  if (differents) lignes.push({ libelle: `${differents} verre${differents > 1 ? "s" : ""} différent${differents > 1 ? "s" : ""} (image et texte compris)`, montant: arrondi(plusDiff) });
  const frais = identiques > 1 ? fraisIdentiques(identiques) : 0;
  if (identiques > 1) lignes.push({ libelle: `${identiques - 1} verre${identiques > 2 ? "s" : ""} identique${identiques > 2 ? "s" : ""} au verre 1 · frais de gravure`, montant: frais });
  if (plusEmplIdent) lignes.push({ libelle: "Gravure face et fond des verres identiques", montant: arrondi(plusEmplIdent) });

  const total = arrondi((verreGrave(v1) ? e1.amount : 0) + plusDiff + frais + plusEmplIdent);
  return { total, lignes, nbVerres: n, identiques, differents, vierges, weight: e1.weight || 0, stockIds: e1.stockIds || [] };
}

/** Texte court du détail, pour la description de la commande (panier, Stripe, e-mails). */
export function detailEnTexte(res) {
  return (res?.lignes || [])
    .map((l) => `${l.libelle} : ${l.montant ? `+${l.montant.toFixed(2).replace(".", ",")} €` : "offert"}`)
    .join(" · ");
}
