// =============================================================================
// PRODUIT COMMANDÉ EN DÉTAIL (13/10/2026, gérant : « dans la fiche de gravure je veux les produits en
// détail… comment tu veux que je sache si le verre de vin fait quelle centilitres… tout le site, il faut
// que ça soit bien détaillé dans l'admin »).
// Le verre à vin a deux tailles (36 / 47 cl) aux MÊMES titres (« À l'unité », « Lot de 2 »…) : le titre
// seul ne dit pas la taille. On retrouve la variante exacte, dans l'ordre :
//   1. l'identifiant de variante enregistré avec la commande (commandes depuis le 13/10/2026) ;
//   2. les lignes de stock décomptées au paiement (métadonnée Stripe `stock` de la commande) ;
//   3. le titre, s'il ne désigne qu'une seule variante.
// Si rien ne tranche, on le DIT (« taille non enregistrée ») au lieu d'afficher un titre trompeur.
// =============================================================================
import { getProductBySlug } from "@/lib/products";

export function tailleDe(product, variant) {
  if (!variant?.taille) return "";
  return product?.tailles?.options?.find((o) => o.id === variant.taille)?.title || `${variant.taille} cl`;
}

function stockIdsCommande(order) {
  try { return (JSON.parse(order?.stock || "[]") || []).map((x) => String(x[0])); } catch { return []; }
}

export function varianteCommandee(order, slug, { variantId, variantTitle } = {}) {
  const product = getProductBySlug(slug);
  if (!product) return { product: null, variant: null, cands: [] };
  const vs = product.variants || [];
  if (variantId) {
    const v = vs.find((x) => x.id === variantId);
    if (v) return { product, variant: v, cands: [v] };
  }
  const titre = String(variantTitle || "").trim();
  let cands = titre ? vs.filter((v) => v.title === titre) : [];
  if (!cands.length && titre) cands = vs.filter((v) => v.title && titre.startsWith(v.title));
  if (!cands.length && vs.length === 1) cands = vs;
  const payes = stockIdsCommande(order);
  const parPaiement = cands.filter((v) => payes.includes(v.stockId || v.id) || payes.includes(v.id));
  if (parPaiement.length === 1) return { product, variant: parPaiement[0], cands };
  if (cands.length === 1) return { product, variant: cands[0], cands };
  return { product, variant: null, cands };
}

// Libellé complet de la variante : « 47 cl · Lot de 2 », ou une alerte si la taille ne peut pas être retrouvée.
export function detailVariante(order, slug, opts = {}) {
  const { product, variant, cands } = varianteCommandee(order, slug, opts);
  const titre = String(opts.variantTitle || "").trim();
  if (variant) {
    const t = tailleDe(product, variant);
    return { texte: [t, variant.title].filter(Boolean).join(" · "), variantId: variant.id, incertain: false };
  }
  const tailles = [...new Set((cands || []).map((v) => tailleDe(product, v)).filter(Boolean))];
  if (tailles.length > 1) {
    return { texte: `${titre} — ⚠️ taille non enregistrée (${tailles.join(" ou ")}) : à vérifier avec la cliente`, variantId: null, incertain: true };
  }
  return { texte: titre, variantId: null, incertain: false };
}

// Ajoute `variantDetail` (+ `variantId` quand il manque) aux réglages ET aux lignes d'une commande,
// pour que tous les écrans de Gestion affichent le produit exact sans recalculer.
export function detaillerCommande(order) {
  if (!order || typeof order !== "object") return order;
  const spec = Array.isArray(order.spec) ? order.spec.map((s) => {
    if (!s || !s.slug) return s;
    const d = detailVariante(order, s.slug, { variantId: s.variantId, variantTitle: s.variantTitle });
    return { ...s, variantDetail: d.texte || s.variantTitle || "", variantId: s.variantId || d.variantId || undefined, tailleIncertaine: d.incertain || undefined };
  }) : order.spec;
  const items = Array.isArray(order.items) ? order.items.map((it) => {
    if (!it?.slug) return it;
    const premier = String(it.details || "").split(" — ")[0].trim();
    const d = detailVariante(order, it.slug, { variantTitle: premier });
    return d.texte && d.texte !== premier ? { ...it, variantDetail: d.texte } : it;
  }) : order.items;
  return { ...order, spec, items };
}
