import { isAdmin, addPendingReply, listPendingReplies } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { sendDraftAlert } from "@/lib/replyAlert";
import { MESSAGES_PRETS } from "@/lib/messagesPrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// MESSAGES PRÊTS → CIRCUIT HABITUEL « À VALIDER »
// -----------------------------------------------------------------------------
// Le gérant clique une fois sur « Préparer pour validation » : chaque message
// déjà rédigé est rangé dans les réponses à valider (`pendingReplies`) et il
// reçoit, pour chacun, l'alerte habituelle avec le bouton « Relire, modifier
// et envoyer ». RIEN NE PART À LA CLIENTE ICI : l'e-mail ne s'envoie que
// lorsqu'il valide sur la page /repondre/<jeton> — et il est alors tracé dans
// le dossier de la cliente ET dans le fil de sa commande.
// =============================================================================
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let enAttente = [];
  try {
    enAttente = (await listPendingReplies())
      .filter((p) => p.status === "pending" && p.source === "atelier")
      .map((p) => ({ email: p.email, subject: p.subject, at: p.at }));
  } catch { /* ignore */ }
  return Response.json({ messages: MESSAGES_PRETS.map((m) => ({ id: m.id, client: m.client, ref: m.ref, to: m.to })), enAttente });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide accepté */ }
  if (body?.action !== "queue") return Response.json({ error: "Action inconnue." }, { status: 400 });

  // On ne prépare qu'un message précis si `id` est fourni, sinon les trois.
  const voulus = body?.id ? MESSAGES_PRETS.filter((m) => m.id === body.id) : MESSAGES_PRETS;
  if (!voulus.length) return Response.json({ error: "Message introuvable." }, { status: 400 });

  // Retrouver la commande de chaque cliente pour que la réponse validée soit
  // tracée au bon endroit (par référence, sinon par adresse e-mail).
  let commandes = [];
  try { commandes = await getSiteOrders(500); } catch { commandes = []; }
  const trouveCommande = (m) => {
    const ref = String(m.ref || "").toUpperCase();
    const mail = String(m.to || "").toLowerCase();
    return commandes.find((o) => String(o.ref || "").toUpperCase() === ref)
      || commandes.find((o) => String(o.customerEmail || "").toLowerCase() === mail)
      || null;
  };

  // Ne pas préparer deux fois le même message s'il attend déjà validation.
  let dejaEnAttente = new Set();
  try {
    dejaEnAttente = new Set(
      (await listPendingReplies())
        .filter((p) => p.status === "pending")
        .map((p) => `${p.email}|${p.subject}`)
    );
  } catch { /* ignore */ }

  const prepares = [];
  const ignores = [];
  for (const m of voulus) {
    if (dejaEnAttente.has(`${String(m.to).toLowerCase()}|${m.subject}`)) { ignores.push(m.client); continue; }
    const cmd = trouveCommande(m);
    const item = await addPendingReply({
      name: m.client,
      email: m.to,
      subject: m.subject,
      // « message » = le contexte affiché dans l'alerte (ce n'est pas envoyé).
      message: `Message de suivi préparé par l'atelier${m.ref ? ` — commande #${m.ref}` : ""}${m.piece ? `\n${m.piece}` : ""}${m.note ? `\n\nÀ savoir : ${m.note}` : ""}`,
      draft: m.body,
      draftSubject: m.subject,
      reason: "message de suivi, à relire avant envoi",
      orderId: cmd?.id || "",
      orderRef: cmd?.ref || m.ref || "",
      source: "atelier",
    });
    if (!item) { ignores.push(m.client); continue; }
    try {
      await sendDraftAlert(item, { orderRef: item.orderRef, reason: "message de suivi préparé par l'atelier", source: "atelier" });
    } catch { /* l'alerte peut échouer : la réponse reste visible dans Gestion */ }
    prepares.push({ client: m.client, ref: item.orderRef, lien: `/repondre/${item.token}` });
  }

  return Response.json({ ok: true, prepares, ignores });
}
