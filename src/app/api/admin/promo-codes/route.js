import { isAdmin, getPromoCodes, setPromoCode, deletePromoCode, getCodeStats, setCommissionPaid } from "@/lib/stock";

import { journaliser } from "@/lib/journal";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ codes: await getPromoCodes(), stats: await getCodeStats() });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  // Action « marquer payé » (commission versée à un ambassadeur).
  if (body?.action === "markPaid") {
    const stats = await setCommissionPaid(String(body?.code || ""), Number(body?.paid) || 0);
    return Response.json({ ok: true, codes: await getPromoCodes(), stats });
  }
  const code = String(body?.code || "").trim().toUpperCase();
  const value = Number(body?.value);
  if (!code || !Number.isFinite(value) || value <= 0) {
    return Response.json({ error: "Code et valeur obligatoires." }, { status: 400 });
  }
  if (body?.type === "percent" && value > 90) {
    return Response.json({ error: "Le pourcentage doit être ≤ 90." }, { status: 400 });
  }
  const avantCode = (await getPromoCodes().catch(() => ({})))?.[code] || null;
  const codes = await setPromoCode(code, {
    type: body?.type, value,
    ambassador: body?.ambassador, commission: body?.commission, reusable: body?.reusable,
    days: body?.days,
  });
  journaliser({ type: "promo", cible: code, label: `Code ${code}`, avant: avantCode, apres: codes?.[code] || null, source: "promotions", retablir: { kind: "promo", code, valeur: avantCode } }).catch(() => {});
  return Response.json({ ok: true, codes, stats: await getCodeStats() });
}

export async function DELETE(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const codeSup = String(body?.code || "").trim().toUpperCase();
  const avantCode = (await getPromoCodes().catch(() => ({})))?.[codeSup] || null;
  const codes = await deletePromoCode(body?.code);
  if (avantCode) journaliser({ type: "promo", cible: codeSup, label: `Code ${codeSup} supprimé`, avant: avantCode, apres: null, source: "promotions", retablir: { kind: "promo", code: codeSup, valeur: avantCode } }).catch(() => {});
  return Response.json({ ok: true, codes });
}
