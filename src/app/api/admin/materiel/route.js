import { isAdmin, getMateriel, saveMaterielItem, recevoirMateriel, validerMateriel, annulerMateriel } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { unitCostForItem } from "@/lib/productCosts";
import { MATERIEL_CATS, MATERIEL_KITS } from "@/lib/materielSeed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// MATÉRIEL & CONDITIONNEMENT (11/10/2026) — Gestion → Matériel & emballages.
//   GET  ?orderId=…  → { items, cats, kits, usage (cette commande), estimation, utilise }
//   POST { action:"valider", orderId, lines, etiquette }   décompte le stock, calcule le gain
//        { action:"annuler", orderId }                     rend le matériel au stock
//        { action:"item", id | nouveau:true, …champs }     modifie / crée un article
//        { action:"recevoir", id, qty }                    réception d'un achat (+ stock)
// Rien n'est écrit sans un clic du gérant. Écritures ciblées + lecture fraîche (cf. stock.js).
// =============================================================================

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const stripe = (total) => r2(total * 0.015 + 0.25); // carte européenne : 1,5 % + 0,25 €

// Étiquette d'envoi estimée (modifiable à l'écran) : colis ou point relais ≈ 6,12 € TTC
// (Mondial Relay 5,10 € HT) ; bijou en lettre suivie ≤ 100 g ≈ 4,45 € (La Poste).
function etiquetteEstimee(order, bySlug) {
  const lignes = (order.items || []).filter((i) => !/livraison|point relais|retrait/i.test(i.name || ""));
  const retrait = /main propre/i.test(String(order.shippingMethod || ""));
  if (retrait) return 0;
  const lettre = lignes.length && lignes.every((i) => bySlug[i.slug]?.letter) && !lignes.some((i) => /bo[iî]te|pack/i.test(i.details || ""));
  if (lettre && !order.relaisPoint) return 4.45;
  return 6.12;
}

function utilise(usage) {
  const u = {};
  for (const rec of Object.values(usage || {})) for (const [id, q] of Object.entries(rec.lines || {})) u[id] = (u[id] || 0) + q;
  return u;
}

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get("orderId") || "";
  const { items, usage } = await getMateriel(true);
  const out = { ok: true, items, cats: MATERIEL_CATS, kits: MATERIEL_KITS, utilise: utilise(usage), usages: usage, nbCommandes: Object.keys(usage).length };
  if (orderId) {
    out.usage = usage[orderId] || null;
    const [orders, catalog] = await Promise.all([getSiteOrders(500), getCatalogAdmin()]);
    const order = (orders || []).find((o) => o.id === orderId);
    if (order) {
      const bySlug = {}; for (const p of Array.isArray(catalog) ? catalog : []) bySlug[p.slug] = p;
      let produit = 0, manque = false;
      for (const it of order.items || []) {
        if (/livraison|point relais|retrait/i.test(it.name || "")) continue;
        const c = unitCostForItem(it, bySlug[it.slug]);
        if (c == null) { if (it.slug) manque = true; continue; }
        produit += c * (Number(it.quantity) || 1);
      }
      const encaisse = Number(order.total) || 0;
      out.estimation = { ref: order.ref || "", encaisse: r2(encaisse), produit: r2(produit), produitIncomplet: manque, etiquette: etiquetteEstimee(order, bySlug), stripe: stripe(encaisse) };
    }
  }
  return Response.json(out);
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const action = String(b?.action || "");

  if (action === "valider") {
    const orderId = String(b.orderId || "");
    const orders = await getSiteOrders(500);
    const order = (orders || []).find((o) => o.id === orderId);
    if (!order) return Response.json({ error: "Commande introuvable." }, { status: 404 });
    const catalog = await getCatalogAdmin();
    const bySlug = {}; for (const p of Array.isArray(catalog) ? catalog : []) bySlug[p.slug] = p;
    let produit = 0;
    for (const it of order.items || []) {
      if (/livraison|point relais|retrait/i.test(it.name || "")) continue;
      const c = unitCostForItem(it, bySlug[it.slug]);
      if (c != null) produit += c * (Number(it.quantity) || 1);
    }
    const encaisse = Number(order.total) || 0;
    const etiquette = b.etiquette === undefined || b.etiquette === "" ? etiquetteEstimee(order, bySlug) : Math.max(0, Number(b.etiquette) || 0);
    const r = await validerMateriel({ orderId, ref: order.ref || "", lines: b.lines || {}, etiquette, stripe: stripe(encaisse), produit, encaisse });
    return Response.json({ ok: true, usage: r.usage, items: r.items });
  }
  if (action === "annuler") {
    const r = await annulerMateriel(String(b.orderId || ""));
    if (!r) return Response.json({ error: "Rien à annuler pour cette commande." }, { status: 404 });
    return Response.json({ ok: true, items: r.items });
  }
  if (action === "item") {
    const it = await saveMaterielItem(b);
    if (!it) return Response.json({ error: "Article introuvable." }, { status: 404 });
    return Response.json({ ok: true, item: it });
  }
  if (action === "recevoir") {
    const it = await recevoirMateriel(String(b.id || ""), b.qty);
    if (!it) return Response.json({ error: "Quantité ou article invalide." }, { status: 400 });
    return Response.json({ ok: true, item: it });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
