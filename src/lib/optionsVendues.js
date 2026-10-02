// =============================================================================
// « VENDU EN PLUS » — tout ce qui a été acheté AVEC la pièce, article par article.
// -----------------------------------------------------------------------------
// Demande du gérant (02/10/2026) : « dans les fiches de travail de gravure, il faut
// que ça soit bien détaillé tout ce qui est vendu en plus, par exemple les
// emballages, il faut que ça soit bien précisé, faut pas que je me trompe ».
//
// Avant, ces informations étaient noyées dans la ligne Stripe (« Carafe gravée —
// Emballage : Sac cadeau — Personnalisation : … ») ou dans les réglages bruts.
// Ici on les RECALCULE depuis les réglages enregistrés (`order.spec[].fields`) et
// la configuration du produit (`engravingPricing`, `personalizationFields`), pour
// obtenir une liste lisible : emballage, coffret, socle, date, 2e face, lot…
// Repli : si une ligne n'a pas de réglages (vieille commande), on relit la
// description Stripe (`items[].details`).
//
// Pure (aucun accès réseau) : testée par `npm run test-options` (tools/tests).
// =============================================================================
import { getProductBySlug } from "@/lib/products";
import { apparierSpec } from "@/lib/orderSpec";

const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
const plus = (n) => (Number(n) > 0 ? ` (+${euro(n)})` : "");

// Libellé d'un champ, sans son prix (« Date / année (+3 €) » → « Date / année »).
function libelleChamp(f) {
  return String(f?.label || f?.key || "")
    .replace(/,?\s*\+\s*[\d.,]+\s*€/gi, "")
    .replace(/\s*\(\s*\)/g, "")
    .replace(/\s*\(facultatif\)/gi, "")
    .trim();
}

// Valeur lisible d'un champ (option d'une liste → son libellé).
function valeurChamp(f, v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (f?.type === "select" || Array.isArray(f?.options)) {
    const o = (f.options || []).find((x) => x.value === s);
    if (o) return String(o.label || s).replace(/\s*\(\+[^)]*\)\s*$/, "").trim();
  }
  return s;
}

const montantPour = (e, variantId) =>
  e.amountByVariant && variantId && e.amountByVariant[variantId] != null ? e.amountByVariant[variantId] : (e.amount || 0);

/**
 * Les options vendues en plus pour UN réglage d'article (order.spec[i]).
 * @returns {Array<{libelle:string, detail:string, montant:number, physique:boolean}>}
 *   `physique` = un objet à mettre dans le colis (emballage, socle, verres du coffret),
 *   par opposition à une gravure en plus.
 */
export function optionsArticle(item) {
  if (!item) return [];
  const out = [];
  const produit = getProductBySlug(item.slug);
  const champs = item.fields || {};
  const cfg = produit?.engravingPricing || {};
  const defs = produit?.personalizationFields || [];
  const def = (k) => defs.find((f) => f.key === k) || null;
  const rempli = (k) => k && String(champs[k] ?? "").trim();

  // 1) Emballage choisi (sac, boîte, pack…) — toujours un objet à glisser dans le colis.
  if (item.packaging) out.push({ libelle: "Emballage", detail: String(item.packaging), montant: 0, physique: true });

  // 2) Suppléments « à plat » : coffret, socle LED, date, 2e emplacement, texte sur un support…
  for (const e of cfg.flatExtras || []) {
    const v = rempli(e.key);
    const hit = e.value ? v === e.value : Boolean(v);
    if (!hit) continue;
    const f = def(e.key);
    const physique = Boolean(e.stockId || e.stockIdByVariant || e.weight || e.weightByVariant);
    const montant = montantPour(e, item.variantId);
    const libelle = f ? libelleChamp(f) : e.key;
    const detail = f ? valeurChamp(f, v) : v;
    out.push({ libelle, detail: detail === "oui" ? "oui" : detail, montant, physique });
  }

  // 3) Texte ajouté sous un modèle numéroté (verre fête des pères).
  if (cfg.modeleSubExtra) {
    const mv = champs[cfg.modeleSubExtra.key];
    if (mv && typeof mv === "object" && mv.addText !== false) {
      out.push({ libelle: "Texte ajouté sous le modèle", detail: "oui", montant: cfg.modeleSubExtra.amount || 0, physique: false });
    }
  }

  // 4) Zones de texte payantes (recto / verso, cœur / plaques…) : une ligne par zone remplie.
  for (const k of cfg.textKeys || []) {
    const v = rempli(k);
    if (!v) continue;
    const f = def(k);
    out.push({ libelle: f ? libelleChamp(f) : k, detail: `« ${v} »`, montant: cfg.textExtra || 0, physique: false });
  }
  const motifs = (cfg.motifKeys || []).filter((k) => rempli(k)).length;
  if (motifs > 1 && (cfg.motifExtra || 0) > 0) {
    out.push({ libelle: "Motifs en plus", detail: `${motifs - 1} motif(s) au-delà du premier (offert)`, montant: (motifs - 1) * cfg.motifExtra, physique: false });
  }

  // 5) Pages (médaillon livre…) : une ligne par page gravée.
  if (Array.isArray(cfg.pages)) {
    cfg.pages.forEach((pg, i) => {
      const hasMotif = pg.motifKey && rempli(pg.motifKey);
      const hasText = pg.textKey && rempli(pg.textKey);
      if (hasMotif) out.push({ libelle: `Page ${i + 1} — motif`, detail: String(rempli(pg.motifKey)), montant: cfg.pageMotif || 0, physique: false });
      else if (hasText) out.push({ libelle: `Page ${i + 1} — texte`, detail: `« ${rempli(pg.textKey)} »`, montant: cfg.pageText || 0, physique: false });
    });
  }

  // 6) Pages au-delà de la couverture incluse (plaque acier…).
  if ((cfg.perExtraPage || 0) > 0 && !cfg.textKeys && !Array.isArray(cfg.pages)) {
    const vues = new Set();
    let n = 0;
    for (const f of defs) {
      const t = f.type;
      if (!(t === undefined || t === "text" || t === "textarea") || f.key === cfg.includedKey || vues.has(f.key)) continue;
      vues.add(f.key);
      if (rempli(f.key)) { n += 1; out.push({ libelle: libelleChamp(f), detail: `« ${rempli(f.key)} »`, montant: cfg.perExtraPage, physique: false }); }
    }
    void n;
  }

  // 7) Photo gravée en supplément (plaque acier, médaillon…).
  if (cfg.photoKey && rempli(cfg.photoKey) && (cfg.photoSurcharge || 0) > 0) {
    out.push({ libelle: "Photo gravée", detail: "photo fournie par la cliente", montant: cfg.photoSurcharge, physique: false });
  }

  // 8) Configurateur gobelet : motifs au-delà de ceux compris.
  if (item.composition && typeof item.composition === "object") {
    const c = item.composition;
    if (c.count) out.push({ libelle: "Motifs composés", detail: `${c.count} élément(s)${c.extraAmount ? ` dont supplément` : ""}`, montant: c.extraAmount || 0, physique: false });
  }

  // 9) Lot « chacun différent » : autant de gravures différentes que de verres.
  if (Array.isArray(item.perGlass) && item.perGlass.length > 1) {
    out.push({ libelle: "Lot « chacun différent »", detail: `${item.perGlass.length} verres, ${item.perGlass.length} gravures DIFFÉRENTES`, montant: 0, physique: false });
  }

  return out;
}

// Repli pour une ligne SANS réglages : on relit la description Stripe.
function optionsDepuisDetails(details) {
  const out = [];
  for (const part of String(details || "").split(/\s+—\s+/)) {
    const p = part.trim();
    if (!p) continue;
    if (/^emballage\s*:/i.test(p)) out.push({ libelle: "Emballage", detail: p.replace(/^emballage\s*:\s*/i, ""), montant: 0, physique: true });
    else if (/en plus/i.test(p)) out.push({ libelle: "Supplément", detail: p, montant: 0, physique: false });
  }
  return out;
}

/** Mode de livraison : express = à graver EN PRIORITÉ. */
export function livraisonCommande(order) {
  const mode = String(order?.shippingMethod || "");
  const relais = String(order?.relaisPoint || "");
  return {
    texte: relais || mode,
    express: /express|chronopost/i.test(mode),
    relais: Boolean(relais) || /relais/i.test(mode),
    retrait: /retrait|main propre/i.test(mode) || order?.status === "remise_main_propre",
  };
}

/**
 * Tout ce qui est vendu en plus sur une commande, article par article.
 * @returns {{ articles: Array<{nom, variantTitle, quantite, prix, options, sansReglages}>, livraison, nbOptions }}
 */
export function optionsCommande(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const specs = apparierSpec(items, order?.spec);
  const articles = items.map((it, i) => {
    const s = specs[i];
    const options = s ? optionsArticle(s) : optionsDepuisDetails(it.details);
    return {
      nom: String(it.name || s?.name || "Article"),
      variantTitle: s?.variantTitle || "",
      quantite: Number(it.quantity) || 1,
      prix: Number(it.total ?? it.subtotal) || 0,
      options,
      sansReglages: !s,
    };
  });
  const nbOptions = articles.reduce((n, a) => n + a.options.length, 0);
  return { articles, livraison: livraisonCommande(order), nbOptions };
}
