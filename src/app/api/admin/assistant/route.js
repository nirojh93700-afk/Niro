import { isAdmin } from "@/lib/stock";
import { runCatalogAssistant } from "@/lib/agents/catalogAssistant";

export const dynamic = "force-dynamic";

// Assistant catalogue (ancienne interface) — la logique vit dans
// src/lib/agents/catalogAssistant.js, partagée avec le fil unifié.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const history = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  if (!history.length) return Response.json({ error: "Message manquant." }, { status: 400 });
  const r = await runCatalogAssistant(history);
  if (r.error) return Response.json({ error: r.error }, { status: 500 });
  return Response.json(r);
}
