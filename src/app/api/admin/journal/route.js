// Journal d'activité de Gestion (08/11/2026) : GET la liste (12 mois), POST { action:"retablir", id }.
import { isAdmin, getJournal } from "@/lib/stock";
import { retablirEntree } from "@/lib/journal";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const u = new URL(req.url);
  const n = Math.min(2000, Math.max(1, parseInt(u.searchParams.get("n"), 10) || 400));
  const journal = await getJournal(true);
  return Response.json({ journal: journal.slice(0, n), total: journal.length });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  if (body?.action === "retablir") {
    const r = await retablirEntree(String(body.id || ""));
    return Response.json(r, { status: r.ok ? 200 : 400 });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
