import { isAdmin, exportAllData } from "@/lib/stock";

// Export complet des données du site (catalogue, promos, réglages, stock…)
// pour la migration Netlify → Firebase. Protégé par le mot de passe admin.
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const data = await exportAllData();
  return Response.json(data);
}
