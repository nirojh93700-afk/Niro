// Ventes par produit (25/11/2026, gérant : « un tableau précis, professionnel, dans admin, pour savoir quel
// produit j'ai vendu à combien »). PUR : aucune lecture de base ici, on lui passe les commandes et le catalogue.
//
// Pour chaque ligne de commande payée (hors tests, annulées, remboursées) on garde :
//  · le produit et sa VARIANTE (taille, couleur, lot) — 1er morceau du libellé Stripe, avant « — » ;
//  · le prix catalogue payé à l'unité (options comprises) et le total réellement encaissé (remise déduite) ;
//  · les options payées en plus, lues dans le libellé : « (+X €) » de la gravure / du socle et de l'emballage ;
//  · la remise accordée (code promo) = prix catalogue × quantité − total encaissé ;
//  · le coût d'achat (productCosts.js / coutLignes.js), null si inconnu (jamais 0 en silence).
// Puis on regroupe : produit → variante → ventes.
import { coutLigne } from "./coutLignes";

const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const STATUTS_EXCLUS = new Set(["annulee", "remboursee", "test"]);

/** Variante lue dans le libellé : « Petit — 8×5×5 cm · Couple (1-2) — … » → « Petit — 8×5×5 cm · Couple (1-2) ». */
export function varianteDeLigne(it) {
  const d = String(it?.details || "").trim();
  if (!d) return "—";
  const premier = d.split(" — ")[0].trim();
  if (/^(\d+ gravure|emballage|personnalisation|option)/i.test(premier)) return "—";
  return premier || "—";
}

/** Montants « (+X €) » ajoutés au prix de base dans le libellé : { options, emballage }. */
export function optionsDeLigne(it) {
  const d = String(it?.details || "");
  const lire = (re) => { const m = d.match(re); return m ? Number(String(m[1]).replace(",", ".")) || 0 : 0; };
  const options = lire(/gravure\(s\) en plus \(\+([\d.,]+) ?€\)/i);
  const emballage = lire(/Emballage[^(]*\(\+([\d.,]+) ?€\)/i);
  return { options: r2(options), emballage: r2(emballage) };
}

/** Une ligne de commande → une vente, ou null si elle ne compte pas. */
export function venteDeLigne(it, order, bySlug) {
  const qte = Number(it?.quantity) || 1;
  const total = r2(it?.total ?? it?.subtotal ?? 0);
  if (!(total > 0) && !(Number(it?.unitPrice) > 0)) return null;
  const product = bySlug[it?.slug] || null;
  const unitaire = r2(it?.unitPrice ?? total / qte);
  const brut = r2(unitaire * qte);
  const { options, emballage } = optionsDeLigne(it);
  const cout = coutLigne(it, product, order?.stock);
  const devis = !it?.slug;
  return {
    ref: order?.ref || "",
    orderId: order?.id || "",
    date: order?.createdAt || "",
    cliente: order?.customerName || order?.shippingName || order?.customerEmail || "",
    statut: order?.status || "",
    slug: it?.slug || "",
    produit: product?.name || it?.name || "Article",
    image: it?.image || product?.images?.[0] || "",
    categorie: devis ? "devis" : (product?.category || "autre"),
    variante: devis ? (it?.name || "Ligne de devis") : (it?.variantDetail || varianteDeLigne(it)),
    details: it?.details || "",
    qte,
    prixUnitaire: unitaire,              // prix catalogue payé, options comprises
    options: r2(options * qte),          // gravure, socle, texte… payés en plus
    emballage: r2(emballage * qte),
    remise: r2(Math.max(0, brut - total)),
    encaisse: total,                     // ce que la cliente a payé pour cette ligne (hors livraison)
    cout: cout == null ? null : r2(cout * qte),
  };
}

/** Toutes les ventes des commandes payées, entre `du` et `au` (dates ISO, facultatives). */
export function ventesDesCommandes(orders, bySlug, { du, au } = {}) {
  const t0 = du ? Date.parse(du) : -Infinity;
  const t1 = au ? Date.parse(au) : Infinity;
  const out = [];
  for (const o of orders || []) {
    if (o?.test || STATUTS_EXCLUS.has(o?.status) || o?.rattacheA) continue;
    const t = Date.parse(o?.createdAt || "");
    if (Number.isFinite(t) && (t < t0 || t > t1)) continue;
    for (const it of o?.items || []) {
      const v = venteDeLigne(it, o, bySlug);
      if (v) out.push(v);
    }
  }
  return out;
}

function cumuler(acc, v) {
  acc.qte += v.qte;
  acc.encaisse = r2(acc.encaisse + v.encaisse);
  acc.options = r2(acc.options + v.options);
  acc.emballage = r2(acc.emballage + v.emballage);
  acc.remise = r2(acc.remise + v.remise);
  if (v.cout == null) acc.coutManquant = true; else acc.cout = r2(acc.cout + v.cout);
  acc.commandes.add(v.ref);
  return acc;
}
const vide = () => ({ qte: 0, encaisse: 0, options: 0, emballage: 0, remise: 0, cout: 0, coutManquant: false, commandes: new Set() });
function finir(a) {
  const gain = a.coutManquant ? null : r2(a.encaisse - a.cout);
  return {
    ...a,
    commandes: a.commandes.size,
    prixMoyen: a.qte ? r2(a.encaisse / a.qte) : 0,
    gain,
    marge: gain != null && a.encaisse > 0 ? Math.round((gain / a.encaisse) * 100) : null,
  };
}

/** Regroupe : produit → variante → ventes, triés par montant encaissé (le plus gros d'abord). */
export function tableauParProduit(ventes) {
  const prods = new Map();
  for (const v of ventes) {
    const k = v.slug || `devis:${v.produit}`;
    if (!prods.has(k)) prods.set(k, { cle: k, slug: v.slug, produit: v.produit, image: v.image, categorie: v.categorie, ...vide(), variantes: new Map() });
    const p = prods.get(k);
    cumuler(p, v);
    if (!p.variantes.has(v.variante)) p.variantes.set(v.variante, { variante: v.variante, ...vide(), ventes: [] });
    const va = p.variantes.get(v.variante);
    cumuler(va, v);
    va.ventes.push(v);
  }
  const lignes = [...prods.values()].map((p) => ({
    ...finir(p),
    variantes: [...p.variantes.values()].map((va) => ({ ...finir(va), ventes: va.ventes.sort((a, b) => String(b.date).localeCompare(String(a.date))) }))
      .sort((a, b) => b.encaisse - a.encaisse),
  })).sort((a, b) => b.encaisse - a.encaisse);
  const total = finir(ventes.reduce(cumuler, vide()));
  return { lignes, total };
}
