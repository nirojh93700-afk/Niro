import { isAdmin, getUrssafDeclared, setUrssafDeclared, getMateriel, getRates } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { unitCostForItem } from "@/lib/productCosts";
import { etiquetteEstimee, perteRate } from "@/lib/etiquetteEnvoi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Page Bénéfices (lecture seule) : CA encaissé − coût d'achat des produits vendus.
// Le coût vient du champ « coût » (prix d'achat) renseigné sur chaque produit.
const PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" });
const monthKey = (ts) => { try { const s = PARIS.format(new Date(ts)); return s.slice(3) + "-" + s.slice(0, 2); } catch { return ""; } };

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });

  const [orders, catalog] = await Promise.all([getSiteOrders(500), getCatalogAdmin()]);
  // Matériel d'emballage validé commande par commande (Gestion → file de production → Conditionnement).
  const matUsage = await getMateriel(true).then((m) => m.usage || {}).catch(() => ({}));
  // Pièces ratées / refaites (12/10/2026) : leur coût d'achat est perdu, déduit commande par commande.
  const perteParCommande = {};
  for (const r of await getRates(true).catch(() => [])) perteParCommande[r.orderId] = (perteParCommande[r.orderId] || 0) + perteRate(r);

  // --- LIVRE DES RECETTES (?recettes=1) ---------------------------------------
  // Registre chronologique OBLIGATOIRE du micro-entrepreneur. Mentions requises :
  // date d'encaissement, référence de la pièce, client, nature de l'opération,
  // montant, mode d'encaissement. Ici : une ligne par commande PAYÉE (les
  // commandes test, annulées ou remboursées sont exclues), triée par date.
  if (new URL(req.url).searchParams.get("recettes")) {
    const rows = (orders || [])
      .filter((o) => !o.test && !["annulee", "remboursee"].includes(o.status))
      .map((o) => ({
        date: o.createdAt || "",
        reference: o.ref || (o.id || "").slice(-8).toUpperCase(),
        client: o.customerName || "—",
        nature: "Vente de marchandises (création personnalisée)",
        montant: round(Number(o.total) || 0),
        mode: "Carte bancaire (Stripe)",
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    return Response.json({ ok: true, rows });
  }
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
  const monthly = {}; // "YYYY-MM" -> {revenue,cost,profit,shipping,orders}
  let missing = new Set();
  let missingUnits = 0;

  for (const o of real) {
    const mk = monthKey(o.createdAt);
    const inMonth = mk === curMonth;
    const inYear = mk.startsWith(curYear);
    // Livraison (27/10/2026, gérant : « les bénéfices… par rapport au prix d'envoi ») : la livraison
    // payée par la cliente ENTRE dans le bénéfice, l'étiquette payée au transporteur en SORT. Avant, la
    // livraison était dite « neutre » : faux quand elle est offerte (seuil 45 / 60 €) ou quand
    // l'étiquette coûte moins / plus que ce que la cliente a payé.
    // Étiquette = celle saisie à « Valider » dans Conditionnement, sinon le prix Boxtal du mode d'envoi.
    const ship = Number(o.shippingPrice) || 0;
    const u = matUsage[o.id];
    const etiq = u && u.etiquette !== undefined && u.etiquette !== null && u.etiquette !== "" ? Number(u.etiquette) || 0 : etiquetteEstimee(o, (slug) => bySlug[slug]);
    const addShip = (b) => { b.shipping += ship; b.etiquettes += etiq; };
    addShip(per.all); if (inYear) addShip(per.year); if (inMonth) addShip(per.month);
    monthly[mk] = monthly[mk] || { revenue: 0, cost: 0, shipping: 0, etiquettes: 0, orders: 0, materiel: 0, rates: 0 };
    monthly[mk].shipping += ship; monthly[mk].etiquettes += etiq;
    const mat = Number(matUsage[o.id]?.matCost) || 0;
    if (mat) { per.all.materiel += mat; if (inYear) per.year.materiel += mat; if (inMonth) per.month.materiel += mat; monthly[mk].materiel = (monthly[mk].materiel || 0) + mat; }
    const perte = Number(perteParCommande[o.id]) || 0;
    if (perte) { per.all.rates += perte; if (inYear) per.year.rates += perte; if (inMonth) per.month.rates += perte; monthly[mk].rates = (monthly[mk].rates || 0) + perte; }
    monthly[mk].orders += 1;
    for (const it of (o.items || [])) {
      const qty = Number(it.quantity) || 1;
      const rev = Number(it.total) || 0;
      const slug = it.slug || "";
      const unitCost = unitCostForItem(it, bySlug[slug], o.stock);
      const hasCost = unitCost != null;
      const cost = hasCost ? unitCost * qty : 0;
      if (!hasCost) { missing.add(it.name || slug || "?"); missingUnits += qty; }

      const add = (b) => { b.revenue += rev; b.cost += cost; b.units += qty; };
      add(per.all); if (inYear) add(per.year); if (inMonth) add(per.month);

      monthly[mk].revenue += rev; monthly[mk].cost += cost;

      const key = slug || (it.name || "?");
      byProduct[key] = byProduct[key] || { name: nameBySlug[slug] || it.name || key, units: 0, revenue: 0, cost: 0, hasCost };
      const bp = byProduct[key];
      bp.units += qty; bp.revenue += rev; bp.cost += cost; if (hasCost) bp.hasCost = true;
    }
  }

  const finish = (b) => { b.profit = round(b.revenue + b.shipping - b.etiquettes - b.cost - b.materiel - b.rates); b.etiquettes = round(b.etiquettes); b.livraisonNette = round(b.shipping - b.etiquettes); b.materiel = round(b.materiel); b.rates = round(b.rates); b.revenue = round(b.revenue); b.cost = round(b.cost); b.shipping = round(b.shipping); b.margin = b.revenue > 0 ? Math.round((b.profit / b.revenue) * 100) : 0; return b; };
  finish(per.month); finish(per.year); finish(per.all);

  // Série des 12 derniers mois (ordre chronologique).
  const series = [];
  const d0 = curMonth;
  for (let i = 11; i >= 0; i--) {
    const [yy, mm] = d0.split("-").map(Number);
    let m = mm - i, y = yy;
    while (m <= 0) { m += 12; y -= 1; }
    const k = `${y}-${String(m).padStart(2, "0")}`;
    const v = monthly[k] || { revenue: 0, cost: 0, shipping: 0, etiquettes: 0, orders: 0, materiel: 0, rates: 0 };
    // « ca » = ce qui a été réellement ENCAISSÉ ce mois-là (produits + livraison
    // payée par les clientes) : c'est ce chiffre-là qui sert pour une déclaration
    // (URSSAF…), pas seulement le CA produits utilisé pour calculer la marge.
    series.push({
      month: k,
      revenue: round(v.revenue),
      shipping: round(v.shipping),
      ca: round(v.revenue + v.shipping),
      cost: round(v.cost),
      materiel: round(v.materiel),
      rates: round(v.rates || 0),
      etiquettes: round(v.etiquettes || 0),
      profit: round(v.revenue + v.shipping - (v.etiquettes || 0) - v.cost - (v.materiel || 0) - (v.rates || 0)),
      orders: v.orders || 0,
    });
  }

  const productsList = Object.values(byProduct).map((b) => ({
    name: b.name, units: b.units, revenue: round(b.revenue), cost: round(b.cost),
    profit: round(b.revenue - b.cost), margin: b.revenue > 0 ? Math.round(((b.revenue - b.cost) / b.revenue) * 100) : 0,
    hasCost: b.hasCost,
  })).sort((a, b) => b.profit - a.profit);

  // Mois cochés « Déclarée » par la gérante (pour calculer ce qu'il reste à déclarer).
  const declared = await getUrssafDeclared().catch(() => ({}));

  return Response.json({
    ok: true,
    month: per.month, year: per.year, all: per.all,
    series, products: productsList, declared,
    missingCost: { count: missingUnits, names: [...missing].slice(0, 30) },
  });
}

// Cocher / décocher « Déclarée » sur un mois (Gestion → Bénéfices).
export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const declared = await setUrssafDeclared(String(body?.month || ""), Boolean(body?.declared));
  if (!declared) return Response.json({ error: "Mois invalide." }, { status: 400 });
  return Response.json({ ok: true, declared });
}

function blank() { return { revenue: 0, cost: 0, units: 0, profit: 0, margin: 0, shipping: 0, etiquettes: 0, materiel: 0, rates: 0 }; }
function round(n) { return Math.round((Number(n) || 0) * 100) / 100; }
