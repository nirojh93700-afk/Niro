import { isAdmin, listPendingReplies } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Liste des réponses à valider (et des récentes déjà traitées), pour Gestion.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const all = await listPendingReplies();
  const items = all.map((it) => ({
    id: it.id, token: it.token, name: it.name, email: it.email, subject: it.subject,
    message: it.message, draft: it.draft || "", reason: it.reason || "",
    at: it.at, status: it.status, resolvedAt: it.resolvedAt || 0,
  }));
  return Response.json({
    pending: items.filter((i) => i.status === "pending"),
    recent: items.filter((i) => i.status !== "pending").slice(0, 20),
  });
}
