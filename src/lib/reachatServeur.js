import { getStockMap, getMateriel } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { reachatProduits, reachatMateriel, FENETRE_JOURS, HORIZON_JOURS, COUVERTURE_JOURS } from "@/lib/reachat";

// Ce qui va manquer, calculé sur la vitesse de vente (lecture seule, rien n'est écrit).
export async function calculReachat() {
  const [orders, stock, products, mat] = await Promise.all([
    getSiteOrders(600).catch(() => []),
    getStockMap().catch(() => ({})),
    getCatalogAdmin().catch(() => []),
    getMateriel(false).catch(() => ({ items: [], usage: {} })),
  ]);
  const rows = []; const vus = new Set();
  for (const p of products || []) {
    for (const v of p.variants || []) {
      const id = v.stockId || v.id;
      if (!id || vus.has(id)) continue; vus.add(id);
      rows.push({ stockId: id, product: p.name, variant: v.title || "" });
    }
    for (const e of p.engravingPricing?.flatExtras || []) {
      for (const id of [e.stockId, ...Object.values(e.stockIdByVariant || {})].filter(Boolean)) {
        if (vus.has(id)) continue; vus.add(id);
        rows.push({ stockId: id, product: p.name, variant: `Option : ${e.label || e.key || id}` });
      }
    }
  }
  return {
    produits: reachatProduits({ orders: orders || [], stock: stock || {}, rows }),
    materiel: reachatMateriel({ items: mat.items || [], usage: mat.usage || {} }),
    fenetre: FENETRE_JOURS, horizon: HORIZON_JOURS, couverture: COUVERTURE_JOURS,
  };
}

