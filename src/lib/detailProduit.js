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
    // Dimension de la pièce (puzzles…) écrite à côté de l'option (gérant, 26/11/2026 : « tout doit être en détail »).
    const dim = variant.dimension || product?.dimension || "";
    const base = [t, variant.title].filter(Boolean).join(" · ");
    return { texte: [base, dim && !base.includes(dim) ? dim : ""].filter(Boolean).join(" · "), variantId: variant.id, incertain: false };
  }
  const tailles = [...new Set((cands || []).map((v) => tailleDe(product, v)).filter(Boolean))];
  if (tailles.length > 1) {
    return { texte: `${titre} — ⚠️ taille non enregistrée (${tailles.join(" ou ")}) : à vérifier avec la cliente`, variantId: null, incertain: true };
  }
  return { texte: titre, variantId: null, incertain: false };
}

// Photo à montrer pour une ligne de commande : celle de l'option (couleur) commandée.
// `autreCouleur` = le bijou a plusieurs couleurs mais AUCUNE photo pour celle commandée : la photo du
// produit peut montrer une autre couleur, il faut le dire en rouge à côté (gérant, 27/11/2026 : « je veux
// plus cette erreur dans aucune des commandes, j'ai perdu un bracelet »).
export function photoCommandee(order, slug, titreOption) {
  const trouve = varianteCommandee(order, slug, { variantTitle: titreOption });
  const product = trouve.product;
  if (!product) return { image: "", autreCouleur: false, couleur: "" };
  const cle = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const vs = product.variants || [];
  let variant = trouve.variant;
  // Fiches à part (carnet…) : le détail écrit « Couleur Marron · Couverture », pas le titre seul de l'option.
  if (!variant) {
    const texte = ` ${cle(titreOption)} `;
    const dans = vs.filter((v) => v.title && texte.includes(` ${cle(v.title)} `));
    if (dans.length === 1) variant = dans[0];
  }
  if (variant?.image) return { image: variant.image, autreCouleur: false, couleur: variant.title || "" };
  const couleur = variant?.title || String(titreOption || "").trim();
  // La première photo du produit porte parfois le nom de la couleur (« …_dore.jpg ») : alors elle est juste.
  const mot = cle(couleur).split(" ")[0] || "";
  const fichier = cle(String(product.images?.[0] || "").split("/").pop());
  const memeCouleur = mot.length >= 4 && fichier.split(" ").includes(mot);
  const aCouleurs = vs.length > 1 && (product.category === "bijoux" || vs.some((v) => v.image));
  return { image: "", autreCouleur: aCouleurs && !memeCouleur, couleur };
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
    // Photo de la COULEUR commandée (27/11/2026, 0KCDY9UA : bracelet « Argenté · cœur » montré avec la photo
    // dorée ; la ligne enregistrée au paiement porte la première photo du produit, pas celle de l'option).
    const ph = photoCommandee(order, it.slug, premier);
    let suite = ph.image && ph.image !== it.image ? { ...it, image: ph.image, imageProduit: it.image } : it;
    if (ph.autreCouleur) suite = { ...suite, photoAutreCouleur: ph.couleur || premier || true };
    return d.texte && d.texte !== premier ? { ...suite, variantDetail: d.texte } : suite;
  }) : order.items;
  return { ...order, spec, items };
}
