import { isAdmin, getHubHistory, appendHubHistory, markHubMessage, clearHubHistory } from "@/lib/stock";
import { runHub } from "@/lib/agents/hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Fil unifié de l'assistant : la conversation est mémorisée côté serveur.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ history: await getHubHistory() });
}

// { text } → ajoute le message, fait travailler l'assistant, mémorise sa réponse.
// { markAt, done } → marque un message (« appliqué ✓ », « envoyé ✓ »).
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }

  if (body?.markAt) {
    await markHubMessage(body.markAt, body.done || "✓");
    return Response.json({ ok: true, history: await getHubHistory() });
  }

  const text = String(body?.text || "").trim();
  if (!text) return Response.json({ error: "Message vide." }, { status: 400 });
  const userMsg = { role: "user", content: text, at: Date.now() };
  const history = await appendHubHistory([userMsg]);
  const r = await runHub(history);
  if (r.error) return Response.json({ error: r.error, history }, { status: 500 });
  const assistantMsg = {
    role: "assistant", content: r.reply || "…", at: Date.now() + 1,
    ...(r.agent ? { agent: r.label || r.agent } : {}),
    ...(r.actions ? { actions: r.actions } : {}),
    ...(r.action ? { action: r.action } : {}),
  };
  const full = await appendHubHistory([assistantMsg]);
  return Response.json({ ok: true, history: full });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  await clearHubHistory();
  return Response.json({ ok: true, history: [] });
}
