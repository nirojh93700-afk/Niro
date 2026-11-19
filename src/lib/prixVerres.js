// =============================================================================
// Prix de la gravure des VERRES (règle du 15-16/10/2026, REMPLACÉE le 19/10/2026 puis le 18/11/2026 :
// voir prixGravureVerres plus bas ; les frais « verres identiques » ne servent plus).
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
// Pas une gravure : les réglages, et la langue de la gravure (09/11/2026 : « langue » rempli comptait comme
// une image, et le verre 1 perdait son texte offert dès qu'une autre langue que le français était choisie).
const NEUTRES = new Set(["police", "emplacement", "mode", "decor", "coffret", "deuxEmplacement", "sens", "motifCount",
  "langue", "texteSource", "direct", "tradOk", "decorPlace", "langueCles"]);
// Le texte tapé en français avant traduction (texteSource, rectoSource…) n'est pas une gravure de plus.
const neutre = (k) => NEUTRES.has(k) || /Source$/.test(k);
// Façon de graver choisie dans le parcours guidé : une image (modèle, lettre fleurie, photo / logo, dessin de Noël)
// compte comme l'image offerte du verre 1 DÈS QU'ELLE EST CHOISIE (avant même l'envoi de la photo), donc le texte
// qui l'accompagne coûte +3 €. Seul « Mon propre texte » laisse le premier texte offert (09/11/2026).
const MODES_IMAGE = new Set(["modele", "lettre", "photo", "noel"]);
export const modeImage = (fv) => MODES_IMAGE.has(String(fv?.mode || ""));
const plein = (v) => (v && typeof v === "object") ? Object.keys(v).length > 0 : String(v ?? "").trim() !== "";

/** Le verre porte-t-il une gravure (photo, modèle, lettre, texte…) ? */
export function verreGrave(fv) {
  return Object.entries(fv || {}).some(([k, v]) => !neutre(k) && plein(v));
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

// RÈGLE DU 18/11/2026 (gérant : « le moins cher offert… change partout ») — remplace le forfait du 19/10
// (2e verre +5 € logo et texte / +3 € logo ou texte seul) :
//   · UNE seule gravure offerte par COMMANDE, la première : sur le verre 1 de la 1re ligne de verres,
//     l'image / le logo / le modèle, ou, s'il n'y en a pas, le premier texte ;
//   · TOUT le reste se paie à l'élément : chaque logo / image / modèle +3 € (PRIX_LOGO_VERRE),
//     chaque texte au prix de la fiche (+3 €), gravure face + fond +7 € par verre ;
//   · un verre laissé sans gravure ne coûte rien.
// opts.offre = false : la gravure offerte a déjà servi sur une autre ligne de verres de la commande
// (panier et paiement) → rien d'offert sur cette ligne.
export const PRIX_LOGO_VERRE = 3;

/**
 * Supplément de gravure d'une ligne de verres.
 * @returns {{ total, offert, lignes:[{libelle, montant}], nbVerres, identiques, differents, vierges, weight, stockIds }}
 *   offert = valeur de la gravure offerte sur cette ligne (0 si aucune).
 */
export function prixGravureVerres(product, variant, quantite, fields = {}, perGlass = null, opts = {}) {
  const avecOffre = opts?.offre !== false;
  const qte = Math.max(1, parseInt(quantite, 10) || 1);
  const parLot = verresParVariante(variant);
  const n = Math.min(parLot * qte, 200);
  const variantId = variant?.id ?? null;
  const cfg = product?.engravingPricing || {};
  // Gravure de chaque verre : réglage par verre si « chacun différent », sinon le même partout.
  const liste = Array.isArray(perGlass) && perGlass.length ? perGlass : null;
  const verre = (i) => (liste ? (liste[i % (parLot > 1 ? Math.min(parLot, liste.length) : liste.length)] || {}) : fields) || {};

  const v1 = verre(0);
  const e1 = engravingExtra(product, v1, variantId);
  const empl = (fv) => (fv?.emplacement === "deux" ? engravingExtra(product, { emplacement: "deux" }, variantId).amount : 0);
  // Le verre porte-t-il une image / un logo / un modèle (un champ gravé qui, seul, ne coûte rien) ?
  const aImage = (fv) => modeImage(fv) || Object.entries(fv || {}).some(([k, v]) => !neutre(k) && plein(v)
    && (k === cfg.modeleSubExtra?.key || engravingExtra(product, { [k]: v }, variantId).amount === 0));
  const textes = (fv) => arrondi(engravingExtra(product, fv, variantId).amount - empl(fv));
  const cle1 = empreinte(v1);

  const grave1 = verreGrave(v1);
  const image1 = grave1 && aImage(v1);
  // La gravure offerte (la 1re, 19/11/2026) : l'image du verre 1, sinon son premier texte.
  const kOffert = avecOffre && grave1 && !image1 ? texteOffertVerre1(product, v1, variantId) : null;
  const offert = !avecOffre || !grave1 ? 0
    : image1 ? PRIX_LOGO_VERRE
      : (kOffert ? engravingExtra(product, { [kOffert]: v1[kOffert] }, variantId).amount : 0);
  const lignes = [];
  let montant1 = 0;
  if (grave1) {
    const brut1 = arrondi((image1 ? PRIX_LOGO_VERRE : 0) + e1.amount);
    montant1 = arrondi(brut1 - offert);
    if (offert > 0) lignes.push({ libelle: image1 ? "Verre 1 · image, logo ou modèle" : "Verre 1 · premier texte", montant: 0 });
    if (montant1 > 0) lignes.push({ libelle: offert > 0 ? (image1 ? "Verre 1 · textes et options" : "Verre 1 · textes en plus et options") : "Verre 1 · gravure (la gravure offerte est sur un autre article)", montant: montant1 });
  }
  let identiques = grave1 ? 1 : 0, differents = 0, vierges = grave1 ? 0 : 1;
  let logos = 0, montantTextes = 0, plusEmpl = 0;
  for (let i = 1; i < n; i++) {
    const fv = verre(i);
    if (!verreGrave(fv)) { vierges++; continue; }
    if (empreinte(fv) === cle1) identiques++; else differents++;
    if (aImage(fv)) logos++;
    montantTextes += textes(fv);
    plusEmpl += empl(fv);
  }
  montantTextes = arrondi(montantTextes);
  const pl = (k) => (k > 1 ? "s" : "");
  if (logos) lignes.push({ libelle: `${logos} logo${pl(logos)}, image${pl(logos)} ou modèle${pl(logos)} sur les autres verres (+${PRIX_LOGO_VERRE} € chacun)`, montant: logos * PRIX_LOGO_VERRE });
  if (montantTextes) lignes.push({ libelle: "Textes des autres verres (+3 € chacun)", montant: montantTextes });
  if (plusEmpl) lignes.push({ libelle: "Gravure face et fond des autres verres", montant: arrondi(plusEmpl) });

  const total = arrondi(montant1 + logos * PRIX_LOGO_VERRE + montantTextes + plusEmpl);
  return { total, offert, lignes, nbVerres: n, identiques, differents, vierges, weight: e1.weight || 0, stockIds: e1.stockIds || [] };
}

/**
 * Le texte OFFERT sur le verre 1 quand il n'y a ni image, ni logo, ni modèle : le premier champ
 * payant REMPLI dans l'ordre de la fiche (ou de `candidats`), sinon le premier candidat payant
 * (pour l'étiquette « offert » avant la saisie). null s'il y a une image (elle est l'offre) ou rien de payant.
 * Même fonction pour le prix (prixGravureVerres) et les étiquettes des champs : jamais de contradiction.
 */
export function texteOffertVerre1(product, fields = {}, variantId = null, candidats = null) {
  const fv = fields || {};
  const ordre = candidats || (product?.personalizationFields || []).map((f) => f.key);
  const payant = (k) => !neutre(k) && engravingExtra(product, { [k]: fv[k] ?? "x" }, variantId).amount > 0;
  const image = Object.entries(fv).some(([k, v]) => !neutre(k) && plein(v)
    && (k === product?.engravingPricing?.modeleSubExtra?.key || engravingExtra(product, { [k]: v }, variantId).amount === 0));
  if (image || modeImage(fv)) return null;
  const cles = [...ordre, ...Object.keys(fv).filter((k) => !ordre.includes(k))];
  return cles.find((k) => plein(fv[k]) && payant(k)) || cles.find((k) => payant(k)) || null;
}

/** Texte court du détail, pour la description de la commande (panier, Stripe, e-mails). */
export function detailEnTexte(res) {
  return (res?.lignes || [])
    .map((l) => `${l.libelle} : ${l.montant ? `+${l.montant.toFixed(2).replace(".", ",")} €` : "offert"}`)
    .join(" · ");
}
