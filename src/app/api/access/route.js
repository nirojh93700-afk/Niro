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

  cookies().set("site-access", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 jours
  });
  return Response.json({ ok: true });
}
