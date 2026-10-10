import { isAdmin, checkAdminKey, setAdminPassword, adminPasswordInfo } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Changement du mot de passe admin depuis Gestion → Réglages (gérant, 10/10/2026).
// GET : le mot de passe a-t-il déjà été changé, et quand. POST { actuel, nouveau } : change le mot de passe.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  return Response.json(await adminPasswordInfo());
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const actuel = typeof body.actuel === "string" ? body.actuel : "";
  const nouveau = typeof body.nouveau === "string" ? body.nouveau : "";
  if (!(await checkAdminKey(actuel))) return Response.json({ error: "Le mot de passe actuel n'est pas le bon." }, { status: 400 });
  if (nouveau.length < 10) return Response.json({ error: "Le nouveau mot de passe doit faire au moins 10 caractères." }, { status: 400 });
  if (nouveau.length > 200) return Response.json({ error: "Le nouveau mot de passe est trop long." }, { status: 400 });
  if (nouveau === actuel) return Response.json({ error: "Le nouveau mot de passe est le même que l'actuel." }, { status: 400 });
  const at = await setAdminPassword(nouveau);
  return Response.json({ ok: true, at });
}
