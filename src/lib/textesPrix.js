// =============================================================================
// Contrôle « texte gravé ↔ prix affiché » (gérant, 16/10/2026 : « je veux pas que ça ait ce problème
// ailleurs », après une case « Texte sous la photo » sans prix écrit).
// Pour chaque case de texte d'une fiche, option par option, on compare :
//   · ce que le PAIEMENT fait payer (engravingExtra, le même calcul que /api/checkout) ;
//   · ce que la FICHE écrit à côté de la case (« +3 € » dans le libellé, ou le libellé du parcours guidé).
// Deux anomalies : « payé sans prix affiché » et « prix affiché mais pas payé ».
// Pur (aucun accès réseau), utilisé par la surveillance du catalogue (catalogAudit.js) et testé par
// `npm run test-textes-prix`.
// =============================================================================
import { engravingExtra } from "./engravingPrice.js";
import { PARCOURS_CHAMPS } from "./parcoursGuide.js";

const TEXTE = new Set(["text", "textarea"]);
// Cases de texte que le parcours guidé dessine lui-même (son propre libellé, pas celui du champ).
const CLES_PARCOURS = new Set(["texte", "prenom", "initiale", "role", "date", "texteFond", "texte2"]);

const prixDans = (label) => /\+\s?\d+(?:[.,]\d+)?\s?€/.test(String(label || ""));
const arrondi = (x) => Math.round((Number(x) || 0) * 100) / 100;
const euros = (x) => `${arrondi(x).toFixed(2).replace(".", ",")} €`;

/** Supplément payé pour `cle` remplie, à réglages égaux (`contexte`), sur la variante `v`. */
function supplement(product, v, contexte, cle) {
  const base = engravingExtra(product, { ...contexte }, v.id).amount || 0;
  const avec = engravingExtra(product, { ...contexte, [cle]: "Test" }, v.id).amount || 0;
  return arrondi(avec - base);
}

function visibleDans(f, v) {
  if (f.variantContains && !String(v.title || "").includes(f.variantContains)) return false;
  return true;
}

function contexteDu(f) {
  const c = {};
  if (f.showIfField) c[f.showIfField] = f.showIfValue;
  if (f.showIfEmplacement) c.emplacement = f.showIfEmplacement;
  return c;
}

/**
 * Anomalies d'une fiche : [{ cle, libelle, option, paye, affiche, message }].
 */
export function controleTextesPrix(product) {
  const out = [];
  if (!product || !Array.isArray(product.personalizationFields)) return out;
  const vars = Array.isArray(product.variants) && product.variants.length ? product.variants : [{ id: null, title: "" }];
  const cfg = product.parcoursGuide || null;
  const RV = Boolean(product.regleVerres);
  const E = Boolean(cfg?.emplacement);
  const vus = new Set();
  const noter = (cle, libelle, v, paye, affiche) => {
    const k = `${cle}|${libelle}|${paye > 0}|${affiche}`;
    if (vus.has(k)) return;
    vus.add(k);
    const option = vars.length > 1 ? v.title || "" : "";
    if (paye > 0 && !affiche) out.push({ cle, libelle, option, paye, affiche, message: `« ${libelle} » est payé ${euros(paye)} au paiement, mais aucun prix n'est écrit à côté de la case${option ? ` (option « ${option} »)` : ""}` });
    else if (paye <= 0 && affiche) out.push({ cle, libelle, option, paye, affiche, message: `« ${libelle} » affiche un prix, mais rien n'est payé au paiement${option ? ` (option « ${option} »)` : ""}` });
  };

  for (const v of vars) {
    // 1. Cases de texte classiques : le libellé du champ est ce que la cliente lit.
    for (const f of product.personalizationFields) {
      if (!f || !TEXTE.has(f.type || "text")) continue;
      if (cfg && CLES_PARCOURS.has(f.key)) continue; // dessinées par le parcours guidé (point 2)
      if (!visibleDans(f, v)) continue;
      noter(f.key, f.label || f.key, v, supplement(product, v, contexteDu(f), f.key), prixDans(f.label));
    }
    // 2. Parcours guidé : mêmes règles d'affichage que ParcoursGuide.jsx.
    if (cfg) {
      const cles = new Set(product.personalizationFields.map((f) => f?.key));
      // Seuls les champs qu'au moins un modèle demande s'affichent (table `champs` des modèles).
      const demandes = new Set();
      for (const m of [...Object.values(cfg.modeles || {}), ...(cfg.modelesPhoto || [])]) for (const ch of m?.champs || []) demandes.add(ch);
      for (const [id, F] of Object.entries(PARCOURS_CHAMPS)) {
        if (!demandes.has(id) || !cles.has(F.key)) continue;
        const affiche = Boolean(F.extra || (RV && F.key === "prenom"));
        noter(F.key, F.label, v, supplement(product, v, { mode: "modele" }, F.key), affiche);
      }
      if (cles.has("prenom")) noter("prenom", "Prénom dans la bande (lettre fleurie)", v, supplement(product, v, { mode: "lettre" }, "prenom"), RV);
      // Date du mode « texte » (et du bloc commun du verre à whisky) : toujours écrite « +3 € ».
      const dateKey = cfg.dateKey || "date";
      if (cles.has("texte") && cles.has(dateKey)) noter(dateKey, "Date ou année", v, supplement(product, v, { mode: "texte", texte: "Test" }, dateKey), true);
      if (cles.has("texte")) {
        noter("texte", "Votre texte à graver", v, supplement(product, v, { mode: "texte" }, "texte"), E || RV);
        noter("texte", "Texte sous la photo", v, supplement(product, v, { mode: "photo" }, "texte"), E || RV);
      }
    }
  }
  return out;
}
