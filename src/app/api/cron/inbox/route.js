import { syncInbox } from "@/lib/inbox";
import { getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// Planificateur : /api/cron/inbox?token=CRON_SECRET (ou le jeton « boîte mail »
// affiché dans Gestion → Équipe d'agents). Lit les nouveaux e-mails clients,
// les range dans leur commande et prépare une réponse à valider.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  let inboxToken = "";
  try { inboxToken = (await getSettings())?.inboxToken || ""; } catch { inboxToken = ""; }
  const ok = token && ((secret && token === secret) || (inboxToken && token === inboxToken));
  if (!ok) return Response.json({ error: "Jeton invalide." }, { status: 401 });
  const r = await syncInbox({ force: true });
  return Response.json({ ok: true, ...r });
}
