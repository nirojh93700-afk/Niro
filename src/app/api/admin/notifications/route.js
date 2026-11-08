// Notifications & résumés (08/11/2026) : GET → réglage + dernier envoi + aperçu du résumé tel qu'il partirait ;
// POST { action:"envoyer" } → envoie le résumé maintenant au gérant (force). Le RÉGLAGE s'enregistre par
// /api/admin/settings { notifications } (sanitizer + journal), jamais ici.
import { isAdmin, getSettings, getJobNote } from "@/lib/stock";
import { resumeDuJour, runResumeMatin, CLE_RESUME } from "@/lib/resumeMatin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const [settings, dernier, resume] = await Promise.all([
    getSettings(true).catch(() => ({})),
    getJobNote(CLE_RESUME, true).catch(() => null),
    resumeDuJour().catch((e) => ({ texte: `Aperçu indisponible : ${String(e?.message || e).slice(0, 120)}`, points: 0 })),
  ]);
  return Response.json({ notifications: settings?.notifications || { resumeMatin: false, heure: "07:30", joursOff: [] }, dernier, apercu: resume.texte || "", sujet: resume.sujet || "", points: resume.points || 0 });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  if (body?.action === "envoyer") {
    const r = await runResumeMatin(Date.now(), { force: true });
    return Response.json(r.ok ? { ok: true, points: r.points, at: r.at } : { ok: false, error: r.erreur || "Envoi refusé." }, { status: r.ok ? 200 : 500 });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
