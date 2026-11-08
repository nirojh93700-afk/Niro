// État du système (08/11/2026) : GET → { at, feux: [{ id, nom, etat: ok|warn|bad, detail, action? }] }. Lecture seule.
import { isAdmin } from "@/lib/stock";
import { etatSysteme } from "@/lib/etatSysteme";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  try {
    return Response.json(await etatSysteme());
  } catch (e) {
    return Response.json({ at: Date.now(), feux: [{ id: "err", nom: "Vérification", etat: "bad", detail: String(e?.message || e).slice(0, 200) }] });
  }
}
