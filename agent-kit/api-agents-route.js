// Route API des agents — KIT PORTABLE.
// Placement (Next.js App Router) : src/app/api/admin/agents/route.js
//
// >>> À ADAPTER : la fonction isAdmin (sécurité). Remplace par le contrôle
//     d'accès admin de TON app (clé, session, cookie…). Ici : en-tête x-admin-key
//     comparé à process.env.ADMIN_KEY.

import { listAgents, runAgent } from "@/lib/agents/registry";

export const dynamic = "force-dynamic";

function isAdmin(req) {
  const key = req.headers.get("x-admin-key") || "";
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ agents: listAgents() });
}

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
