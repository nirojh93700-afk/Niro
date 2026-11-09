// « Stock à recompter » (09/11/2026) : après la correction du stock qui ne baissait pas toujours à la
// vente, la liste de ce qui s'est VENDU depuis le début, ligne de stock par ligne de stock, pour que le
// gérant ne recompte que ça. Pur : commandes + stock + noms → lignes triées (les plus vendues d'abord).
import { lignesStock } from "./reachat.js";

export function listeRecomptage({ orders = [], stock = {}, rows = [] } = {}) {
  const nom = new Map(rows.map((r) => [r.stockId, `${r.product}${r.variant ? " · " + r.variant : ""}`]));
  const par = new Map();
  for (const o of orders) {
    if (!o || o.test) continue;
    const annulee = ["annulee", "remboursee"].includes(o.status);
    const t = new Date(Number(o.createdAt) || o.createdAt || 0).getTime() || 0;
    for (const [id, q] of lignesStock(o)) {
      const l = par.get(id) || { id, vendus: 0, annules: 0, commandes: 0, derniere: 0 };
      if (annulee) l.annules += q; else { l.vendus += q; l.commandes += 1; if (t > l.derniere) l.derniere = t; }
      par.set(id, l);
    }
  }
  return [...par.values()]
    .map((l) => ({ ...l, nom: nom.get(l.id) || l.id, connu: nom.has(l.id), stock: typeof stock[l.id] === "number" ? stock[l.id] : null }))
    .filter((l) => l.vendus > 0 || l.annules > 0)
    .sort((a, b) => (b.stock !== null) - (a.stock !== null) || b.vendus - a.vendus);
}
