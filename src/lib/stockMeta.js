// La liste « quoi retirer du stock » voyage dans les métadonnées Stripe (500 caractères par valeur).
// Avant le 09/11/2026 elle était COUPÉE à 480 caractères : sur un gros panier le texte devenait
// illisible et RIEN n'était retiré du stock. Maintenant : lignes identiques additionnées, puis la liste
// est répartie sur plusieurs clés (stock, stock2, stock3…), chacune lisible seule.
const MAX = 480;
const CLES = ["stock", "stock2", "stock3", "stock4", "stock5", "stock6"];

export function regrouperStock(pairs) {
  const total = new Map();
  for (const p of pairs || []) {
    const id = String(Array.isArray(p) ? p[0] : p?.variantId || p?.stockId || "").trim();
    const q = Number(Array.isArray(p) ? p[1] : p?.qty) || 0;
    if (!id || q <= 0) continue;
    total.set(id, (total.get(id) || 0) + q);
  }
  return [...total.entries()];
}

// → { stock: '[["a",1],…]', stock2: '…' } (aucune clé si la liste est vide).
export function decouperStock(pairs) {
  const out = {};
  let lot = [], n = 0;
  const poser = () => { if (lot.length && n < CLES.length) { out[CLES[n]] = JSON.stringify(lot); n += 1; } lot = []; };
  for (const p of regrouperStock(pairs)) {
    if (JSON.stringify([...lot, p]).length > MAX) poser();
    lot.push(p);
  }
  poser();
  return out;
}

// Relit toutes les clés ; une clé abîmée (anciennes commandes coupées) est sautée, pas les autres.
export function lireStockMeta(metadata) {
  const pairs = [];
  for (const k of CLES) {
    const raw = metadata?.[k];
    if (!raw) continue;
    try { const l = JSON.parse(raw); if (Array.isArray(l)) pairs.push(...l); } catch { /* clé illisible */ }
  }
  return regrouperStock(pairs);
}

// Le texte unique rangé sur la commande (`order.stock`), lu par Gestion (détail produit, bénéfices, réachat).
export function texteStock(metadata) {
  const p = lireStockMeta(metadata);
  return p.length ? JSON.stringify(p) : "";
}
