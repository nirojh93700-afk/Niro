import { isAdmin } from "@/lib/stock";
import { listAgents, runAgent } from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

// Liste les agents disponibles (pour l'interface).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ agents: listAgents() });
}

// Fait travailler un agent : { agent: "email", messages: [...] }
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const agent = String(body?.agent || "").trim();
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!agent) return Response.json({ error: "Agent manquant." }, { status: 400 });
  const result = await runAgent(agent, messages);
  if (result.error) return Response.json({ error: result.error }, { status: 500 });
  return Response.json(result);
}
