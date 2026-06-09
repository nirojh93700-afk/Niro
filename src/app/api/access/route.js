import { cookies } from "next/headers";
import { getSettings } from "@/lib/stock";

// Vérifie le code d'accès au site (mode "site privé").
// Si correct, pose un cookie qui débloque l'accès sur l'appareil.
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const code = String(body?.code || "").trim();
  const settings = await getSettings();
  const expected = (settings.access?.code || "").trim();

  if (!expected || code !== expected) {
    return Response.json({ error: "Code incorrect." }, { status: 401 });
  }

  // Cookie de SESSION (pas de maxAge) : le code est redemandé à chaque nouvelle
  // visite (quand le navigateur est fermé/rouvert). Pas de mémorisation longue.
  cookies().set("site-access-v3", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return Response.json({ ok: true });
}
