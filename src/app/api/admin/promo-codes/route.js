import { isAdmin, getPromoCodes, setPromoCode, deletePromoCode } from "@/lib/stock";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ codes: await getPromoCodes() });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const code = String(body?.code || "").trim().toUpperCase();
  const value = Number(body?.value);
  if (!code || !Number.isFinite(value) || value <= 0) {
    return Response.json({ error: "Code et valeur obligatoires." }, { status: 400 });
  }
  if (body?.type === "percent" && value > 90) {
    return Response.json({ error: "Le pourcentage doit être ≤ 90." }, { status: 400 });
  }
  await setPromoCode(code, { type: body?.type, value });
  return Response.json({ ok: true, codes: await getPromoCodes() });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  await deletePromoCode(body?.code);
  return Response.json({ ok: true, codes: await getPromoCodes() });
}
