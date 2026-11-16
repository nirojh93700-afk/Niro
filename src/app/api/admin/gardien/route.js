import { isAdmin, getSettings } from "@/lib/stock";
import { lireGardien, runGardien, reglageGardien } from "@/lib/gardien";
import { rapportAgents } from "@/lib/rapportAgents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// Gardien du site + rapport des agents (16/11/2026). GET : dernier rapport, historique, agents, réglages.
// POST {action:"lancer"} : vérifier maintenant (même contrôle que le battement, LECTURE SEULE).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const [g, r, s] = await Promise.all([lireGardien(), rapportAgents(), getSettings(true).catch(() => ({}))]);
  return Response.json({ ...g, agents: r.agents, reglage: reglageGardien(s) });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* vide */ }
  if (body?.action !== "lancer") return Response.json({ error: "Action inconnue." }, { status: 400 });
  const rapport = await runGardien({ alerter: true });
  return Response.json({ ok: true, rapport });
}
