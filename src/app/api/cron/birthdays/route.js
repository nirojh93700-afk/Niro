import { runBirthdayJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Remise anniversaire AUTOMATIQUE — 1×/jour par un planificateur :
//   /api/cron/birthdays?token=SECRET
// (La même logique est aussi déclenchée automatiquement par /api/heartbeat.)
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (token !== secret) return Response.json({ error: "Jeton invalide." }, { status: 401 });

  const r = await runBirthdayJobs();
  return Response.json({ ok: true, ...r });
}
