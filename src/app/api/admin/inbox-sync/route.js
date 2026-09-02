import { isAdmin, getInboxState, getSettings, setSettings } from "@/lib/stock";
import { syncInbox } from "@/lib/inbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function newToken() {
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 32);
}

// GET  → état de la surveillance (dernier passage, dernier résultat) + jeton du planificateur.
//        ?token=new → génère (ou régénère) le jeton « boîte mail ».
// POST → lance un passage (limité à 1 fois / 3 min, sauf { force:true }).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const url = new URL(req.url);
  let settings = {};
  try { settings = await getSettings(); } catch { settings = {}; }
  let inboxToken = settings?.inboxToken || "";
  if (url.searchParams.get("token") === "new" || !inboxToken) {
    inboxToken = newToken();
    try { await setSettings({ inboxToken }); } catch { /* ignore */ }
  }
  const st = await getInboxState();
  return Response.json({ lastRun: st.lastRun, lastResult: st.lastResult, inboxToken, cronUrl: `/api/cron/inbox?token=${inboxToken}` });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const r = await syncInbox({ force: Boolean(body?.force) });
  return Response.json({ ok: true, ...r });
}
