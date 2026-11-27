// Lecture des remboursements chez Stripe + mise à jour des commandes (voir remboursementsPlan.js pour la règle).
// Lancé par le battement une fois par heure, et à la demande par /api/admin/remboursements-stripe.
// AUCUN remboursement n'est fait ici : on ne fait que recopier dans Gestion ce que Stripe a déjà rendu.
// Aucun e-mail ne part. La cagnotte suit, comme pour un remboursement fait depuis Gestion (idempotent).
import Stripe from "stripe";
import { getSiteOrders, updateSiteOrder } from "@/lib/firebase";
import { reverseCagnotteForOrder, reduireCashbackRemboursementPartiel, setJobNote } from "@/lib/stock";
import { planRemboursements } from "@/lib/remboursementsPlan";

async function lireRemboursements(stripe, max = 300) {
  const out = [];
  let apres;
  while (out.length < max) {
    const page = await stripe.refunds.list({ limit: 100, ...(apres ? { starting_after: apres } : {}) });
    for (const r of page.data) {
      out.push({
        id: r.id, status: r.status, montant: (r.amount || 0) / 100, at: (r.created || 0) * 1000,
        paymentIntent: typeof r.payment_intent === "string" ? r.payment_intent : r.payment_intent?.id || "",
      });
    }
    if (!page.has_more || !page.data.length) break;
    apres = page.data[page.data.length - 1].id;
  }
  return out;
}

export async function syncRemboursementsStripe({ dryRun = false } = {}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, erreur: "Stripe n'est pas configuré." };
  const stripe = new Stripe(secret);
  const [refunds, lus] = await Promise.all([lireRemboursements(stripe), getSiteOrders(3000)]);
  const orders = Array.isArray(lus) ? lus : [];
  const plan = planRemboursements(orders, refunds);
  const parId = Object.fromEntries(orders.map((o) => [o.id, o]));
  const resume = plan.map((p) => ({ ref: p.ref, client: p.client, total: p.total, rendu: p.rendu, type: p.type, nouveaux: p.nouveaux.length }));
  if (dryRun) return { ok: true, dryRun: true, lus: refunds.length, aCorriger: resume };
  const faits = [];
  for (const p of plan) {
    const ok = await updateSiteOrder(p.id, p.patch);
    if (!ok) continue;
    const order = parId[p.id];
    try {
      if (p.type === "total") await reverseCagnotteForOrder(order);
      else for (const n of p.nouveaux) await reduireCashbackRemboursementPartiel(order, n.montant, n.stripeId);
    } catch { /* la cagnotte ne bloque jamais la mise à jour des comptes */ }
    faits.push({ ref: p.ref, type: p.type, rendu: p.rendu });
  }
  const note = { at: Date.now(), lus: refunds.length, corrigees: faits };
  if (faits.length) await setJobNote("remboursementsStripe", note).catch(() => {});
  return { ok: true, lus: refunds.length, corrigees: faits };
}
