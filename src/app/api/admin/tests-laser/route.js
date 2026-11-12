import { isAdmin, getTestsLaser, setTestLaser } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Gestion → Tests → Fichiers laser à essayer (12/11/2026) : ce que le gérant note après ses essais sur la machine.
// GET  → { notes: { [fichier]: { etat, note, at } }, reglages: { [matiere]: { decoupe, gravure, at } } }
// POST { fichier, etat: "ok" | "ko" | "", note }  ou  { matiere, decoupe, gravure } → même réponse (relue fraîche).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json(await getTestsLaser(true));
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { return Response.json({ error: "Demande illisible." }, { status: 400 }); }
  if (!b.fichier && !b.matiere) return Response.json({ error: "Rien à enregistrer." }, { status: 400 });
  try {
    return Response.json(await setTestLaser(b));
  } catch (e) {
    return Response.json({ error: e.message || "Enregistrement impossible." }, { status: 500 });
  }
}
