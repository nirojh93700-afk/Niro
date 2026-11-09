// « À racheter » calculé sur la VITESSE DE VENTE, plus seulement sur un seuil fixe (09/11/2026).
// Pur : reçoit les commandes, le stock et le matériel, rend la liste de ce qui va manquer.
//  · produit : ventes des 60 derniers jours (lignes de stock payées, `order.stock`) → pièces par jour →
//    jours de stock restants. Alerte si le stock tient moins de HORIZON jours, ou s'il est à zéro
//    alors que le produit se vend.
//  · matériel : même calcul sur le matériel validé dans les colis (`materielUsage`), et le seuil
//    « à racheter » réglé à la main reste une alerte à lui seul.
export const FENETRE_JOURS = 60;
export const HORIZON_JOURS = 21;
export const COUVERTURE_JOURS = 45;
const JOUR = 86400000;

// Les lignes de stock payées d'une commande : texte JSON « [["id",2],…] » ou tableau.
export function lignesStock(order) {
  let s = order?.stock;
  if (typeof s === "string") { try { s = JSON.parse(s); } catch { s = null; } }
  if (!Array.isArray(s)) return [];
  return s.map((l) => (Array.isArray(l) ? [String(l[0] || ""), Number(l[1]) || 0] : [String(l?.stockId || l?.id || ""), Number(l?.qty) || 0])).filter((l) => l[0] && l[1] > 0);
}

const dateDe = (o) => { const t = new Date(Number(o?.createdAt) || o?.createdAt || 0).getTime(); return Number.isFinite(t) ? t : 0; };
const horsJeu = (o) => !o || o.test || ["annulee", "remboursee"].includes(o.status);

function verdict({ stock, vendus, fenetre, horizon, couverture }) {
  const parJour = vendus / fenetre;
  const jours = parJour > 0 ? stock / parJour : Infinity;
  const alerte = vendus > 0 && (stock <= 0 || jours <= horizon);
  return { parJour, jours: Number.isFinite(jours) ? Math.max(0, Math.floor(jours)) : null, alerte, aCommander: alerte ? Math.max(1, Math.ceil(parJour * couverture - Math.max(0, stock))) : 0 };
}

// rows = [{ stockId, product, variant }] (lignes de stock du catalogue) ; stock = { stockId: nombre }.
export function reachatProduits({ orders = [], stock = {}, rows = [], now = Date.now(), fenetre = FENETRE_JOURS, horizon = HORIZON_JOURS, couverture = COUVERTURE_JOURS } = {}) {
  const depuis = now - fenetre * JOUR;
  const vendus = {};
  for (const o of orders) {
    if (horsJeu(o) || dateDe(o) < depuis) continue;
    for (const [id, q] of lignesStock(o)) vendus[id] = (vendus[id] || 0) + q;
  }
  const out = [];
  for (const r of rows) {
    const st = stock[r.stockId];
    if (typeof st !== "number") continue; // stock non suivi = illimité, rien à dire
    const v = verdict({ stock: st, vendus: vendus[r.stockId] || 0, fenetre, horizon, couverture });
    if (!v.alerte) continue;
    out.push({ type: "produit", id: r.stockId, nom: `${r.product}${r.variant ? " · " + r.variant : ""}`, stock: st, vendus: vendus[r.stockId] || 0, jours: v.jours, aCommander: v.aCommander, rupture: st <= 0 });
  }
  return out.sort((a, b) => (a.jours ?? 0) - (b.jours ?? 0));
}

// items = matériel ([{ id, nom, stock, seuil, archive }]) ; usage = { orderId: { at, lines: { id: qté } } }.
export function reachatMateriel({ items = [], usage = {}, now = Date.now(), fenetre = FENETRE_JOURS, horizon = HORIZON_JOURS, couverture = COUVERTURE_JOURS } = {}) {
  const depuis = now - fenetre * JOUR;
  const sortis = {};
  for (const u of Object.values(usage || {})) {
    if (!u || (Number(u.at) || 0) < depuis) continue;
    for (const [id, q] of Object.entries(u.lines || {})) sortis[id] = (sortis[id] || 0) + (Number(q) || 0);
  }
  const out = [];
  for (const it of items) {
    if (!it || it.archive || typeof it.stock !== "number") continue;
    const v = verdict({ stock: it.stock, vendus: sortis[it.id] || 0, fenetre, horizon, couverture });
    const sousSeuil = typeof it.seuil === "number" && it.seuil > 0 && it.stock <= it.seuil;
    if (!v.alerte && !sousSeuil) continue;
    out.push({ type: "materiel", id: it.id, nom: it.nom || it.id, stock: it.stock, vendus: sortis[it.id] || 0, jours: v.jours, aCommander: v.aCommander, rupture: it.stock <= 0, sousSeuil, seuil: sousSeuil ? it.seuil : null });
  }
  return out.sort((a, b) => (a.jours ?? 9999) - (b.jours ?? 9999));
}

// La phrase lue par le gérant.
export function phraseReachat(l) {
  if (l.rupture) return "plus de stock";
  if (l.jours == null) return `${l.stock} en stock, sous le seuil de ${l.seuil}`;
  const base = `${l.stock} en stock, environ ${l.jours} jour${l.jours > 1 ? "s" : ""} au rythme actuel`;
  return l.sousSeuil ? `${base} (sous le seuil de ${l.seuil})` : base;
}
