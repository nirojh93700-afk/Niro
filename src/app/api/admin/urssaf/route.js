import { isAdmin, getUrssafDeclared, setUrssafDeclared } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Rappel URSSAF mensuel du tableau de bord (29/10/2026).
// GET → { declared:{ "2026-09": date } } · POST { month:"2026-10", declared:true|false } → même réponse.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json({ declared: await getUrssafDeclared().catch(() => ({})) });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const declared = await setUrssafDeclared(String(b.month || ""), b.declared !== false);
  if (!declared) return Response.json({ error: "Mois invalide." }, { status: 400 });
  return Response.json({ declared });
}
