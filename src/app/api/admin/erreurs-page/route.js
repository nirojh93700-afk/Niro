import { isAdmin, getJobNote } from "@/lib/stock";

export const dynamic = "force-dynamic";

// GET → les 30 dernières pages qui ont planté dans un navigateur (message, page, téléphone).
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const n = await getJobNote("erreursNavigateur", true);
  return Response.json({ ok: true, erreurs: n?.liste || [] });
}
