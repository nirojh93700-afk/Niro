import { isAdmin } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { unitCostForItem } from "@/lib/productCosts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Page Bénéfices (lecture seule) : CA encaissé − coût d'achat des produits vendus.
// Le coût vient du champ « coût » (prix d'achat) renseigné sur chaque produit.
const PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" });
const monthKey = (ts) => { try { const s = PARIS.format(new Date(ts)); return s.slice(3) + "-" + s.slice(0, 2); } catch { return ""; } };

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });

  const [orders, catalog] = await Promise.all([getSiteOrders(500), getCatalogAdmin()]);
  const products = Array.isArray(catalog) ? catalog : [];
  // Index produit par slug (pour retrouver la variante + son coût d'achat).
  const bySlug = {}, nameBySlug = {};
  for (const p of products) { bySlug[p.slug] = p; nameBySlug[p.slug] = p.name || p.slug; }

  const now = Date.now();
  const curMonth = monthKey(now);
  const curYear = curMonth.slice(0, 4);

  const real = (orders || []).filter((o) => !o.test && !["annulee", "remboursee"].includes(o.status));

  // Agrégats période + par produit + série mensuelle (12 derniers mois).
  const per = { month: blank(), year: blank(), all: blank() };
  const byProduct = {};
  const monthly = {}; // "YYYY-MM" -> {revenue,cost,profit}
  let missing = new Set();
  let missingUnits = 0;

  for (const o of real) {
    const mk = monthKey(o.createdAt);
    const inMonth = mk === curMonth;
    const inYear = mk.startsWith(curYear);
    // Livraison encaissée (pour info) — couverte par les clientes, neutre sur le bénéfice.
    const ship = Number(o.shippingPrice) || 0;
    per.all.shipping += ship; if (inYear) per.year.shipping += ship; if (inMonth) per.month.shipping += ship;
    for (const it of (o.items || [])) {
      const qty = Number(it.quantity) || 1;
      const rev = Number(it.total) || 0;
      const slug = it.slug || "";
      const unitCost = unitCostForItem(it, bySlug[slug]);
      const hasCost = unitCost != null;
      const cost = hasCost ? unitCost * qty : 0;
      if (!hasCost) { missing.add(it.name || slug || "?"); missingUnits += qty; }

      const add = (b) => { b.revenue += rev; b.cost += cost; b.units += qty; };
      add(per.all); if (inYear) add(per.year); if (inMonth) add(per.month);

      monthly[mk] = monthly[mk] || { revenue: 0, cost: 0 };
      monthly[mk].revenue += rev; monthly[mk].cost += cost;

      const key = slug || (it.name || "?");
      byProduct[key] = byProduct[key] || { name: nameBySlug[slug] || it.name || key, units: 0, revenue: 0, cost: 0, hasCost };
      const bp = byProduct[key];
      bp.units += qty; bp.revenue += rev; bp.cost += cost; if (hasCost) bp.hasCost = true;
    }
  }

  const finish = (b) => { b.profit = round(b.revenue - b.cost); b.revenue = round(b.revenue); b.cost = round(b.cost); b.shipping = round(b.shipping); b.margin = b.revenue > 0 ? Math.round((b.profit / b.revenue) * 100) : 0; return b; };
  finish(per.month); finish(per.year); finish(per.all);

  // Série des 12 derniers mois (ordre chronologique).
  const series = [];
  const d0 = curMonth;
  for (let i = 11; i >= 0; i--) {
    const [yy, mm] = d0.split("-").map(Number);
    let m = mm - i, y = yy;
    while (m <= 0) { m += 12; y -= 1; }
    const k = `${y}-${String(m).padStart(2, "0")}`;
    const v = monthly[k] || { revenue: 0, cost: 0 };
    series.push({ month: k, revenue: round(v.revenue), cost: round(v.cost), profit: round(v.revenue - v.cost) });
  }

  const productsList = Object.values(byProduct).map((b) => ({
    name: b.name, units: b.units, revenue: round(b.revenue), cost: round(b.cost),
    profit: round(b.revenue - b.cost), margin: b.revenue > 0 ? Math.round(((b.revenue - b.cost) / b.revenue) * 100) : 0,
    hasCost: b.hasCost,
  })).sort((a, b) => b.profit - a.profit);

  return Response.json({
    ok: true,
    month: per.month, year: per.year, all: per.all,
    series, products: productsList,
    missingCost: { count: missingUnits, names: [...missing].slice(0, 30) },
  });
}

function blank() { return { revenue: 0, cost: 0, units: 0, profit: 0, margin: 0, shipping: 0 }; }
function round(n) { return Math.round((Number(n) || 0) * 100) / 100; }
