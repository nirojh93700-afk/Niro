import { isAdmin, listCagnottes, getSettings, CAGNOTTE_EXPIRY_DAYS } from "@/lib/stock";

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
