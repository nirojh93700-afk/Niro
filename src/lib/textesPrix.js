// =============================================================================
// Contrôle « texte gravé ↔ prix affiché » (gérant, 16/10/2026 : « je veux pas que ça ait ce problème
// ailleurs », après une case « Texte sous la photo » sans prix écrit).
// Pour chaque case de texte d'une fiche, option par option, on compare :
//   · ce que le PAIEMENT fait payer (engravingExtra, le même calcul que /api/checkout) ;
//   · ce que la FICHE écrit à côté de la case (« +3 € » dans le libellé du champ).
// Deux anomalies : « payé sans prix affiché » et « prix affiché mais pas payé ».
// Pur (aucun accès réseau), utilisé par la surveillance du catalogue (catalogAudit.js) et testé par
// `npm run test-textes-prix`.
// =============================================================================
import { engravingExtra } from "./engravingPrice.js";

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
    // 2. Parcours guidé : ses libellés (« +3 € ») sont CALCULÉS par ParcoursGuide.jsx avec engravingExtra
    //    (prixDe) depuis le 16/10/2026 → ils ne peuvent pas diverger du paiement. Le test
    //    `npm run test-textes-prix` vérifie qu'aucun prix n'y est réécrit à la main.
  }
  return out;
}

// =============================================================================
// Contrôle « prix écrit ↔ prix payé » sur TOUTE la fiche (17/10/2026, gérant : « vérifie partout… je veux
// plus de problème »). Trouvé ce jour-là : le pendentif géométrique annonçait « chaque motif +3 € » mais
// une 2e clé `engravingPricing` en double effaçait la 1re → motifs jamais payés ; et la description du
// médaillon cœur enregistrée dans Gestion disait « +3 € par page / photo +5 € » alors que le paiement
// prend 5 € et 8 €. Ici : chaque supplément écrit (« +X € », « X € par face ») dans les notes, libellés,
// options, l'accroche et la description doit correspondre à un supplément que le paiement fait vraiment
// payer ; et des motifs annoncés payants doivent l'être.
// =============================================================================
const plat = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
const nombre = (s) => arrondi(Number(String(s).replace(",", ".")));

/** Tous les montants qu'une case, une option ou un motif ajoute au paiement, sur toutes les variantes. */
export function supplementsPayes(product) {
  const out = new Set();
  const vars = Array.isArray(product.variants) && product.variants.length ? product.variants : [{ id: null, title: "" }];
  const champs = product.personalizationFields || [];
  for (const v of vars) {
    const base = (ctx) => engravingExtra(product, { ...ctx }, v.id).amount || 0;
    for (const f of champs) {
      if (!f || f.type === "note" || f.type === "font") continue;
      const ctx = contexteDu(f);
      const valeurs = Array.isArray(f.options) && f.options.length ? f.options.map((o) => o.value) : ["Test"];
      for (const val of valeurs) {
        const d = arrondi((engravingExtra(product, { ...ctx, [f.key]: String(val) }, v.id).amount || 0) - base(ctx));
        if (d > 0) out.add(d);
      }
    }
    // Motifs : le 1er peut être offert, les suivants payants → on regarde chaque motif ajouté.
    const motifs = champs.filter((f) => f && f.type === "motif");
    let ctx = {}, avant = base(ctx);
    for (const m of motifs) {
      ctx = { ...ctx, [m.key]: String(m.options?.[0]?.value || "x") };
      const apres = engravingExtra(product, ctx, v.id).amount || 0;
      const d = arrondi(apres - avant);
      if (d > 0) out.add(d);
      avant = apres;
    }
  }
  return out;
}

/** Montants écrits comme SUPPLÉMENTS (« +3 € », « 3 € par face ») dans un texte. */
export function supplementsEcrits(texte) {
  const t = plat(texte);
  const out = [];
  for (const m of t.matchAll(/\+\s?(\d+(?:[.,]\d+)?)\s?€/g)) out.push({ montant: nombre(m[1]), extrait: t.slice(Math.max(0, m.index - 50), m.index + 25).trim() });
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s?€\s+(?:par|la|le)\s+(face|page|zone|cœur|coeur|motif|texte|élément|plaque)\b/gi)) out.push({ montant: nombre(m[1]), extrait: t.slice(Math.max(0, m.index - 50), m.index + 30).trim() });
  return out;
}

/**
 * Anomalies de prix écrits d'une fiche : [{ ou, montant, message }].
 * `extra` = textes en plus à contrôler (ex. fiche détaillée), { nom: texte }.
 */
export function controlePrixEcrits(product, extra = {}) {
  const out = [];
  if (!product) return out;
  // Verres « règle de prix » : leurs montants (+2 / +5 € par verre) viennent de prixGravureVerres, pas
  // d'engravingExtra — contrôlés à part par `npm run test-prix-verres`.
  if (product.regleVerres) return out;
  const payes = supplementsPayes(product);
  const sources = [];
  for (const f of product.personalizationFields || []) {
    if (!f) continue;
    if (f.type === "note") sources.push(["note de la fiche", f.text]);
    // Le libellé d'une case de texte est déjà contrôlé par controleTextesPrix.
    else if (!TEXTE.has(f.type || "text")) sources.push([`« ${f.label || f.key} »`, [f.label, ...(f.options || []).map((o) => o.label)].join(" · ")]);
  }
  sources.push(["accroche", product.tagline], ["description", product.descriptionHtml]);
  for (const [nom, t] of Object.entries(extra || {})) sources.push([nom, t]);
  const vus = new Set();
  for (const [ou, texte] of sources) {
    for (const e of supplementsEcrits(texte)) {
      if (payes.has(e.montant)) continue;
      const k = `${ou}|${e.montant}`;
      if (vus.has(k)) continue;
      vus.add(k);
      out.push({ ou, montant: e.montant, message: `${ou} : « …${e.extrait}… » annonce ${euros(e.montant)}, mais aucun choix de la fiche ne fait payer ce montant au paiement (payé : ${[...payes].sort((a, b) => a - b).map(euros).join(", ") || "rien"})` });
    }
  }
  // Motifs annoncés payants mais jamais payés.
  const champs = product.personalizationFields || [];
  if (champs.some((f) => f && f.type === "motif")) {
    const annonce = champs.some((f) => f && /motif[^.]*\+\s?\d/i.test(`${f.text || ""} ${f.label || ""}`));
    const motifs = champs.filter((f) => f && f.type === "motif");
    const tous = Object.fromEntries(motifs.map((m) => [m.key, String(m.options?.[0]?.value || "x")]));
    const v = product.variants?.[0]?.id;
    const paye = (engravingExtra(product, tous, v).amount || 0) - (engravingExtra(product, {}, v).amount || 0);
    if (annonce && motifs.length > 1 && paye <= 0) out.push({ ou: "motifs", montant: 0, message: `Les motifs sont annoncés payants sur la fiche, mais ${motifs.length} motifs choisis ne coûtent rien au paiement (réglage engravingPricing.motifKeys manquant ?)` });
  }
  return out;
}
