// =============================================================================
// ÉTAT DES BIJOUX — génère docs/etat-bijoux.md depuis le CODE du site.
//
// À quoi ça sert : retrouver, depuis n'importe quelle conversation, la config
// exacte de chaque bijou (prix affichés, options, prix de chaque gravure,
// emballages, poids/livraison) sans avoir à relire products.js à la main.
// Le fichier est REGÉNÉRABLE : rien à tenir à jour à la main.
//
//   node --import data:text/javascript,'import{register}from"node:module";register("file:///tmp/ldr/loader.mjs");' tools/etat-bijoux.mjs
//   (ou simplement : npm run etat-bijoux)
//
// ⚠️ Ce fichier reflète le CODE. Les prix, options et champs de gravure peuvent
// être réécrits depuis Gestion → Produits & stock : l'admin PRIME sur le code.
// En cas d'écart entre ce document et le site en ligne, c'est qu'un réglage a
// été enregistré dans l'admin (cf. applyOverride dans src/lib/catalog.js).
// =============================================================================
import { writeFileSync } from "node:fs";
import { products } from "../src/lib/products.js";
import { productInfo } from "../src/lib/productInfo.js";
import { engravingExtra } from "../src/lib/engravingPrice.js";
import { roundTo90 } from "../src/lib/format.js";
import { defaultPackagingFor } from "../src/lib/packaging.js";
import { DEFAULT_PRODUCT_PACKAGING, DEFAULT_PACKAGING } from "../src/lib/packagingSeed.js";
import { PRODUCT_DATES } from "../src/lib/productDates.js";

const BIJOUX_SALE = 0.1;
const eur = (n) => `${n.toFixed(2).replace(".", ",")} €`;
// Prix réellement affichés : barré arrondi en ,90 puis −10 % (cf. catalog.js).
function prixAffiche(price) {
  const barre = roundTo90(price * (1 - BIJOUX_SALE));
  return { barre, paye: Math.round(barre * (1 - BIJOUX_SALE) * 100) / 100 };
}

// Toutes les clés de texte facturées par le moteur de gravure, avec leur montant.
function optionsGravure(p) {
  const cfg = p.engravingPricing;
  if (!cfg) return [];
  const out = [];
  for (const e of cfg.flatExtras || []) {
    out.push({ cle: e.key, valeur: e.value || "(rempli)", montant: e.amount || 0 });
  }
  for (const k of cfg.textKeys || []) out.push({ cle: k, valeur: "(rempli)", montant: cfg.textExtra || 0 });
  if (cfg.photoKey) out.push({ cle: cfg.photoKey, valeur: "(photo)", montant: cfg.photoSurcharge || 0 });
  if (cfg.perExtraPage) out.push({ cle: "chaque page en plus", valeur: "(rempli)", montant: cfg.perExtraPage });
  return out;
}

// Le bijou est-il gravable DU TOUT ? Beaucoup de bijoux sont vendus tels quels
// (Bracelet Ange, Collier Perle solitaire…) : aucun champ de personnalisation,
// rien à graver. Il ne faut JAMAIS leur ajouter de gravure, et surtout ne pas
// les compter comme « gravure incluse » — c'était une erreur de ce tableau.
function gravable(p) {
  return (p.personalizationFields || []).some(
    (f) => f.type === undefined || f.type === "text" || f.type === "textarea"
      || f.type === "photo" || f.type === "stylepicker" || f.type === "modele"
  );
}

// La PREMIÈRE gravure est-elle payante ? On remplit le premier champ de texte
// de la fiche (celui que la cliente voit en haut) et on regarde si le moteur
// facture quelque chose. Une case « Avec gravure (+3 €) » compte aussi.
function premiereGravurePayante(p) {
  if (!p.engravingPricing) return false;
  const champs = (p.personalizationFields || []).filter(
    (f) => f.type === undefined || f.type === "text" || f.type === "textarea"
  );
  const g = (p.personalizationFields || []).find((f) => f.key === "gravure" && f.type === "select");
  const base = g ? { gravure: "oui" } : {};
  if (g && engravingExtra(p, base, p.variants[0].id).amount > 0) return true;
  if (!champs.length) return false;
  return engravingExtra(p, { ...base, [champs[0].key]: "X" }, p.variants[0].id).amount > 0;
}

// Exemples de totaux : rien gravé, puis chaque option payante ajoutée une à une.
function exemples(p, variant) {
  const { paye } = prixAffiche(variant.price);
  const opts = optionsGravure(p).filter((o) => o.montant > 0);
  const lignes = [[`sans rien graver`, paye]];
  const champs = {};
  for (const o of opts) {
    champs[o.cle] = o.valeur === "(rempli)" || o.valeur === "(photo)" ? "X" : o.valeur;
    const r = engravingExtra(p, { ...champs }, variant.id);
    lignes.push([`+ ${o.cle}`, paye + r.amount]);
  }
  return lignes;
}

const bijoux = products.filter((p) => p.category === "bijoux");
const alertes = [];
const L = [];

L.push("# 💍 État des bijoux — config exacte, prix affichés, gravures");
L.push("");
L.push("> **FICHIER GÉNÉRÉ — ne pas le modifier à la main.** Régénérer avec `npm run etat-bijoux`");
L.push("> après toute modification de `src/lib/products.js`. Il sert à retrouver l'état réglé");
L.push("> d'un bijou depuis n'importe quelle conversation, sans relire le code.");
L.push("");
const nbGravables = bijoux.filter(gravable).length;
L.push(`> Généré le ${new Date().toISOString().slice(0, 10)} · ${bijoux.length} bijoux dans le code, dont ${nbGravables} gravables et ${bijoux.length - nbGravables} vendus tels quels (aucune gravure — ne rien leur ajouter).`);
L.push("");
L.push("⚠️ **Ce document reflète le CODE.** Les prix, options et champs de gravure peuvent être");
L.push("réécrits depuis **Gestion → Produits & stock** : l'admin **prime toujours** sur le code");
L.push("(`applyOverride` dans `src/lib/catalog.js`). Un écart entre ce document et la fiche en");
L.push("ligne signifie qu'un réglage a été enregistré dans l'admin — c'est là qu'il faut le corriger.");
L.push("");
L.push("**Prix affichés** = `roundTo90(prix du code × 0,9)` barré, puis **−10 %** payés (remise bijoux");
L.push("permanente). **Les suppléments de gravure ne sont PAS remisés** : +3 € = 3 € pile.");
L.push("");
L.push("---");
L.push("");

// ---- Tableau de synthèse
L.push("## Vue d'ensemble");
L.push("");
L.push("| Bijou | Rayon | Prix payé | Gravure | Ce qui est facturé |");
L.push("|---|---|---|---|---|");
for (const p of bijoux) {
  const prix = [...new Set(p.variants.map((v) => prixAffiche(v.price).paye))].sort((a, b) => a - b);
  const prixTxt = prix.length === 1 ? eur(prix[0]) : `${eur(prix[0])} – ${eur(prix[prix.length - 1])}`;
  const opts = optionsGravure(p).filter((o) => o.montant > 0);
  const varAvec = p.variants.some((v) => /avec/i.test(v.title));
  const etat = !gravable(p)
    ? "_pas de gravure_"
    : (varAvec || premiereGravurePayante(p)) ? "**payante**" : "comprise dans le prix";
  const detail = !gravable(p) ? "—"
    : opts.length ? opts.map((o) => `${o.cle} +${o.montant.toFixed(2).replace(".", ",").replace(",00", "")} €`).join(" · ")
    : (varAvec ? "par l'option choisie" : "—");
  L.push(`| **${p.name}** | ${p.subcategory || "—"} | ${prixTxt} | ${etat} | ${detail} |`);
}
L.push("");
L.push("---");
L.push("");

// ---- Fiche par fiche
L.push("## Fiche par fiche");
L.push("");
for (const p of bijoux) {
  L.push(`### ${p.name}`);
  L.push("");
  L.push(`\`${p.slug}\` · /produit/${p.slug}${p.hidden ? " · ⛔ **MASQUÉ**" : ""}`);
  L.push("");
  L.push(`- **Rayon** : bijoux / ${p.subcategory || "(aucune sous-catégorie)"} · type « ${p.type || "—"} »`);
  const dj = PRODUCT_DATES[p.slug];
  L.push(`- **Ajouté le** : ${dj || "⚠️ aucune date (pas de bandeau « Vient d'arriver », étiquette « Nouveau » jamais éteinte)"}`);
  L.push(`- **Livraison** : ${p.weight} g emballé · ${p.letter ? "lettre suivie possible" : "colis"}${p.pickup ? " · retrait en main propre" : ""}${p.freeShipThreshold ? ` · port offert dès ${p.freeShipThreshold} €` : ""}`);
  const pk = DEFAULT_PRODUCT_PACKAGING[p.slug] || defaultPackagingFor(p);
  const noms = (pk?.ids || []).map((id) => DEFAULT_PACKAGING.find((x) => x.id === id)?.name || id);
  L.push(`- **Emballages proposés** : ${noms.length ? noms.join(", ") : "⚠️ aucun"}${pk && !DEFAULT_PRODUCT_PACKAGING[p.slug] ? " _(attribution automatique par type)_" : ""}`);
  L.push(`- **Fiche détaillée** (Taille & Matériaux…) : ${productInfo[p.slug] ? "oui" : "⚠️ manquante"}`);
  if (!gravable(p)) L.push("- **Gravure : AUCUNE** — ce bijou se vend tel quel. ⛔ Ne rien ajouter ici.");
  L.push("");

  L.push("**Options / prix**");
  L.push("");
  L.push("| Option | Prix du code | Barré | Payé | Stock suivi |");
  L.push("|---|---|---|---|---|");
  for (const v of p.variants) {
    const { barre, paye } = prixAffiche(v.price);
    L.push(`| ${v.title} | ${eur(v.price)} | ${eur(barre)} | **${eur(paye)}** | ${v.stockId || "—"} |`);
  }
  L.push("");

  const champs = (p.personalizationFields || []).filter((f) => f.type !== "note");
  if (champs.length) {
    L.push("**Personnalisation**");
    L.push("");
    L.push("| Champ | Type | Obligatoire | Supplément | Affiché |");
    L.push("|---|---|---|---|---|");
    const opts = optionsGravure(p);
    for (const f of champs) {
      const o = opts.find((x) => x.cle === f.key);
      const cond = f.variantContains ? `si l'option contient « ${f.variantContains} »`
        : f.showIfField ? `si « ${f.showIfField} » = ${f.showIfValue}`
        : "toujours";
      L.push(`| ${f.label || f.key} | ${f.type || "texte"}${f.maxLength ? ` (${f.maxLength} car.)` : ""} | ${f.optional ? "non" : "oui"} | ${o && o.montant ? `+${o.montant} €` : "—"} | ${cond} |`);
    }
    L.push("");
  }

  const ex = exemples(p, p.variants[0]);
  if (ex.length > 1) {
    L.push(`**Ce que paie la cliente** (option « ${p.variants[0].title} »)`);
    L.push("");
    for (const [quoi, total] of ex) L.push(`- ${quoi} : **${eur(total)}**`);
    L.push("");
  }

  // ---- contrôles
  const pbs = [];
  if (!p.images?.length) pbs.push("aucune photo");
  if (!productInfo[p.slug]) pbs.push("fiche détaillée manquante");
  if (!PRODUCT_DATES[p.slug]) pbs.push("date d'ajout manquante");
  if (!p.subcategory) pbs.push("pas de sous-catégorie (femme/homme) → absent des filtres et des guides");
  const condDure = (p.personalizationFields || []).filter((f) => f.type !== "note" && (f.variantContains || f.showIfField));
  const saisie = (p.personalizationFields || []).filter((f) => f.type !== "note");
  if (saisie.length && condDure.length === saisie.length) {
    pbs.push("TOUS les champs de gravure sont conditionnés : si les options sont renommées dans l'admin, la gravure disparaît de la fiche");
  }
  const cachablePayant = (p.personalizationFields || []).filter(
    (f) => f.showIfField && optionsGravure(p).some((o) => o.cle === f.key && o.montant > 0)
  );
  if (cachablePayant.length) {
    pbs.push(`champ payant masquable (${cachablePayant.map((f) => f.key).join(", ")}) : un texte saisi puis caché reste facturé sans être affiché`);
  }
  if (pbs.length) {
    L.push("**⚠️ À surveiller** : " + pbs.join(" · "));
    L.push("");
    alertes.push({ nom: p.name, slug: p.slug, pbs });
  }
  L.push("---");
  L.push("");
}

// ---- Récap des alertes
L.push("## Récapitulatif des points à surveiller");
L.push("");
if (!alertes.length) L.push("Aucun. Tous les bijoux sont configurés de la même façon.");
else {
  for (const a of alertes) {
    L.push(`- **${a.nom}** (\`${a.slug}\`)`);
    for (const t of a.pbs) L.push(`  - ${t}`);
  }
}
L.push("");

writeFileSync(new URL("../docs/etat-bijoux.md", import.meta.url), L.join("\n"), "utf8");
console.log(`docs/etat-bijoux.md écrit — ${bijoux.length} bijoux, ${alertes.length} fiche(s) avec un point à surveiller.`);
