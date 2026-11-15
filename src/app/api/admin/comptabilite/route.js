// 📒 Finances › Comptabilité (15/11/2026, maquette « Niv Admin »). Lecture seule, sauf le réglage des taux.
//   GET                 → livre des recettes, registre des achats, URSSAF, tableau de bord, pièces manquantes
//   GET ?rappro=1       → derniers versements Stripe vers la banque, comparés aux commandes
//   POST { taux, cfp, vl } → réglage des taux (Réglages enregistrés dans settings.compta)
import Stripe from "stripe";
import { isAdmin, getSettings, setSettings, getPurchases, getFactures, getUrssafDeclared } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { livreRecettes, declarationsUrssaf, tableauDeBord, reglageCompta, rapprocherVersement, SEUILS_2026 } from "@/lib/comptabilite";
import { etatClasseur } from "@/lib/classeurFactures";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function rapprochement(orders) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { erreur: "Stripe n'est pas configuré." };
  const stripe = new Stripe(secret);
  const parPI = {};
  for (const o of orders) if (o.paymentIntentId) parPI[o.paymentIntentId] = { id: o.id, ref: o.ref, total: o.total, client: o.customerName || "" };
  const payouts = await stripe.payouts.list({ limit: 8 });
  const versements = [];
  for (const p of payouts.data) {
    const tx = await stripe.balanceTransactions.list({ payout: p.id, limit: 100, expand: ["data.source"] });
    const transactions = tx.data.filter((t) => t.type !== "payout").map((t) => {
      const src = t.source && typeof t.source === "object" ? t.source : {};
      return {
        type: t.type, montant: t.amount / 100, frais: t.fee / 100, net: t.net / 100, date: new Date(t.created * 1000).toISOString(),
        paymentIntent: typeof src.payment_intent === "string" ? src.payment_intent : src.payment_intent?.id || "",
        moyen: src.payment_method_details?.type || "",
      };
    });
    versements.push(rapprocherVersement({ id: p.id, montant: p.amount / 100, date: new Date(p.arrival_date * 1000).toISOString().slice(0, 10), statut: p.status, transactions }, parPI));
  }
  return { versements };
}

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const url = new URL(req.url);
  const lus = await getSiteOrders(3000).catch(() => []);
  const orders = Array.isArray(lus) ? lus : [];
  if (url.searchParams.get("rappro") === "1") {
    try { return Response.json(await rapprochement(orders)); }
    catch (e) { return Response.json({ erreur: "Stripe n'a pas répondu : " + (e.message || "erreur") }, { status: 200 }); }
  }
  const [settings, purchases, factures, declared] = await Promise.all([
    getSettings().catch(() => ({})), getPurchases().catch(() => []), getFactures().catch(() => []), getUrssafDeclared(true).catch(() => ({})),
  ]);
  const regl = reglageCompta(settings);
  const recettes = livreRecettes({ orders, ventesExternes: settings?.ventesExternes || [] });
  const classeur = etatClasseur({ factures, purchases, expenses: Array.isArray(settings?.expenses) ? settings.expenses : [] });
  const achats = classeur.lignes;
  const declarations = declarationsUrssaf({ recettes, declared, regl });
  const bord = tableauDeBord({ recettes, achats, regl, declarations });
  const pieces = achats.filter((x) => x.etat !== "rangee");
  return Response.json({ regl, seuils: SEUILS_2026, recettes, achats, declarations, bord, pieces });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const nb = (v, max) => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : null; };
  const taux = nb(b.taux, 30), cfp = nb(b.cfp, 1), vl = nb(b.vl, 3);
  if (taux === null || cfp === null || vl === null) return Response.json({ error: "Taux invalide." }, { status: 400 });
  await setSettings({ compta: { taux, cfp, vl } });
  return Response.json({ ok: true, regl: { taux, cfp, vl } });
}
