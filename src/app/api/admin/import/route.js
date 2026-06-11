import { isAdmin, importAllData } from "@/lib/stock";

// Import des données exportées depuis l'ancien hébergement (migration
// Netlify → Firebase). Protégé par le mot de passe admin.
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const result = await importAllData(body || {});
  return Response.json({ ok: true, ...result });
}
