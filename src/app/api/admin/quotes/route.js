import { isAdmin } from "@/lib/stock";
import { createQuote, listQuotes, updateQuoteStatus } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const quotes = await listQuotes(150);
  return Response.json({ quotes: quotes || [], firebase: quotes !== null });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  if (body.action === "status") {
    const ok = await updateQuoteStatus(body.id, String(body.status || "").slice(0, 20));
    return Response.json({ ok });
  }

  // Création d'un devis ou d'une facture
  const type = body.type === "facture" ? "facture" : "devis";
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((it) => ({
      desc: String(it.desc || "").slice(0, 200),
      qty: Math.max(1, parseInt(it.qty, 10) || 1),
      price: Math.max(0, Math.round((parseFloat(it.price) || 0) * 100) / 100),
    }))
    .filter((it) => it.desc);
  if (!items.length) return Response.json({ error: "Ajoute au moins une ligne." }, { status: 400 });
  const total = Math.round(items.reduce((s, it) => s + it.qty * it.price, 0) * 100) / 100;

  const data = {
    type,
    client: {
      name: String(body.client?.name || "").slice(0, 100),
      email: String(body.client?.email || "").slice(0, 120),
      address: String(body.client?.address || "").slice(0, 300),
    },
    items,
    total,
    note: String(body.note || "").slice(0, 500),
  };
  const created = await createQuote(data);
  if (!created) return Response.json({ error: "Connexion à la base requise (Firebase)." }, { status: 500 });
  return Response.json({ ok: true, ...created });
}
