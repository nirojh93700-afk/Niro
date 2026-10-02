import { isAdmin, listPendingReplies, addInboxBlock, classerPendingSi } from "@/lib/stock";
import { nettoyerMessagesATraiter } from "@/lib/inbox";
import { cleBlocage, expediteurIgnore } from "@/lib/inboxFilter";

export const dynamic = "force-dynamic";

// Liste des réponses à valider (et des récentes déjà traitées), pour Gestion.
// L'agent tient la page à jour : avant de répondre, il classe tout seul les pubs,
// les expéditeurs marqués « Pub », les dossiers sans suite et ce qui a déjà reçu réponse.
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const nettoyage = await nettoyerMessagesATraiter();
  const all = await listPendingReplies();
  const items = all.map((it) => ({
    id: it.id, token: it.token, name: it.name, email: it.email, subject: it.subject,
    source: it.source || "contact", orderRef: it.orderRef || "", orderId: it.orderId || "",
    productSlug: it.productSlug || "", productName: it.productName || "",
    message: it.message, draft: it.draft || "", reason: it.reason || "",
    at: it.at, status: it.status, resolvedAt: it.resolvedAt || 0, resolvedVia: it.resolvedVia || "",
  }));
  return Response.json({
    pending: items.filter((i) => i.status === "pending"),
    recent: items.filter((i) => i.status !== "pending").slice(0, 20),
    nettoyage,
  });
}

// Actions rapides du tableau de bord :
//   { action: "pub",   id }  → c'est une pub / une notification : classée, et l'expéditeur
//                             (adresse, ou domaine pro) est ignoré à l'avenir par la boîte surveillée ;
//   { action: "traite", id } → déjà réglé hors du site : classée, sans rien bloquer.
// Rien n'est jamais envoyé d'ici.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const action = String(body.action || "");
  const id = String(body.id || "");
  if (!["pub", "traite"].includes(action) || !id) return Response.json({ error: "Action inconnue." }, { status: 400 });
  const all = await listPendingReplies();
  const it = all.find((r) => r.id === id);
  if (!it) return Response.json({ error: "Message introuvable (déjà classé ?)." }, { status: 404 });

  if (action === "traite") {
    const n = await classerPendingSi((r) => r.id === id, "traite");
    return Response.json({ ok: true, classes: n });
  }
  const cle = cleBlocage(it.email);
  const blocage = await addInboxBlock(cle, it.name || it.email);
  // Tout ce qui vient du même expéditeur est classé d'un coup.
  const n = await classerPendingSi((r) => expediteurIgnore(r.email, blocage), "pub");
  return Response.json({ ok: true, classes: n, ignore: cle });
}
