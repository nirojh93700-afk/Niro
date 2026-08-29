import { isAdmin, listCagnottes, getSettings, getCagnotte, creditCagnotte, CAGNOTTE_EXPIRY_DAYS } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vue d'ensemble de la fidélité (admin) : soldes de cagnotte par cliente + total.
// Lecture seule — aucune modification ici (le % se règle via /api/admin/settings).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let cagnottes = [];
  try {
    const list = await listCagnottes(); // uniquement les soldes > 0
    const DAY = 86400000;
    cagnottes = list
      .map((c) => ({
        email: c.email,
        balance: c.balance,
        updatedAt: c.updatedAt || 0,
        expiresAt: c.updatedAt ? c.updatedAt + CAGNOTTE_EXPIRY_DAYS * DAY : 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  } catch { /* liste vide si souci */ }
  const total = Math.round(cagnottes.reduce((s, c) => s + c.balance, 0) * 100) / 100;
  let cashbackPercent = 5;
  try { cashbackPercent = Number((await getSettings()).cashbackPercent) || 0; } catch { /* 5 */ }
  return Response.json({ cagnottes, total, count: cagnottes.length, cashbackPercent });
}

// Crédit MANUEL d'une cagnotte (geste commercial décidé par la gérante).
// Ajouté le 29/08/2026 (geste pour Nina B.). Garde-fous : montant 0,01–100 €.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const email = String(body?.email || "").trim().toLowerCase();
  const amount = Number(body?.amount);
  const reason = String(body?.reason || "Geste commercial").slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Adresse invalide." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100) return Response.json({ error: "Montant invalide (0,01 à 100 €)." }, { status: 400 });
  await creditCagnotte(email, amount, reason, "");
  const c = await getCagnotte(email);
  return Response.json({ ok: true, email, balance: c?.balance ?? null });
}
