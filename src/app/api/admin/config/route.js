import { getConfigStatus, isAdmin } from "@/lib/stock";
import { firebaseDiagnostic } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// État des intégrations (configurées ou non) — réservé à l'admin.
export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  const firebase = await firebaseDiagnostic();
  return Response.json({ config: getConfigStatus(), firebase });
}
