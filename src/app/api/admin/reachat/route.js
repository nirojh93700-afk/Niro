import { isAdmin } from "@/lib/stock";
import { calculReachat } from "@/lib/reachatServeur";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  try { return Response.json(await calculReachat()); }
  catch { return Response.json({ produits: [], materiel: [], erreur: true }); }
}
