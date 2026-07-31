import { isAdmin } from "@/lib/stock";
import { auditCatalog } from "@/lib/catalogAudit";

export const dynamic = "force-dynamic";

// Surveillance du catalogue (admin) : liste des produits mal configurés.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const audit = await auditCatalog();
  return Response.json(audit);
}
