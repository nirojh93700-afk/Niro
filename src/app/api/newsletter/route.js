import { addSubscriber } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Inscription à la newsletter (public).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const ok = await addSubscriber(body?.email);
  if (!ok) return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  return Response.json({ ok: true });
}
