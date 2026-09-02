import { getPendingReplyByToken, resolvePendingReply, reopenPendingReply, batAtelierMessage, logComm } from "@/lib/stock";
import { emailLayout, escapeHtml } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Page de validation d'une réponse (lien reçu par le gérant dans son alerte).
// Le jeton, long et aléatoire, n'est connu que de lui. GET = lecture ;
// POST = « envoyer » (après relecture/modification) ou « ne pas répondre ».
function view(it) {
  return {
    id: it.id, name: it.name, email: it.email, phone: it.phone || "",
    subject: it.subject, message: it.message,
    draft: it.draft || "", draftSubject: it.draftSubject || "", reason: it.reason || "",
    at: it.at, status: it.status, finalText: it.finalText || "", resolvedAt: it.resolvedAt || 0,
    orderId: it.orderId || "", orderRef: it.orderRef || "", source: it.source || "contact",
  };
}

export async function GET(_req, { params }) {
  const it = await getPendingReplyByToken(params.token);
  if (!it) return Response.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  return Response.json({ reply: view(it) });
}

export async function POST(req, { params }) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const action = body?.action === "send" ? "send" : body?.action === "dismiss" ? "dismiss" : "";
  if (!action) return Response.json({ error: "Action inconnue." }, { status: 400 });

  const it = await getPendingReplyByToken(params.token);
  if (!it) return Response.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  if (it.status !== "pending") return Response.json({ error: "Cette réponse a déjà été traitée.", reply: view(it) }, { status: 409 });

  if (action === "dismiss") {
    const r = await resolvePendingReply(params.token, { status: "dismissed" });
    return Response.json({ ok: true, reply: view(r?.item || it) });
  }

  const text = String(body?.text || "").trim();
  const subject = String(body?.subject || "").trim() || it.draftSubject || "Votre message — Niv Création";
  if (!text) return Response.json({ error: "Le texte de la réponse est vide." }, { status: 400 });

  // 1) On réserve AVANT d'envoyer : un double clic ne peut pas partir deux fois.
  const claim = await resolvePendingReply(params.token, { status: "sent", finalText: text, finalSubject: subject });
  if (!claim?.claimed) return Response.json({ error: "Cette réponse a déjà été traitée.", reply: view(claim?.item || it) }, { status: 409 });

  // 2) Envoi à la cliente, à l'image de la marque (Gmail d'abord, Resend en secours),
  //    copie au gérant. Le texte est celui qu'il a relu et éventuellement modifié.
  const html = emailLayout({
    heading: "Votre message — Niv Création",
    bodyHtml: `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(text)}</div>`,
  });
  const thread = it.gmailThreadId ? { threadId: it.gmailThreadId, messageId: it.messageId || "", references: it.references || "" } : null;
  const sent = await sendClientMail({ to: it.email, subject, html, thread });
  if (!sent?.ok) {
    // 3) Échec : on rouvre pour qu'il puisse réessayer, et on lui dit pourquoi.
    await reopenPendingReply(params.token);
    return Response.json({ error: sent?.error || "L'envoi a échoué. Réessayez." }, { status: 502 });
  }
  // 4) Traçabilité : dossier de la cliente + fil de la commande.
  try { await logComm({ email: it.email, name: it.name, from: "nous", text, subject, via: sent.via || "site", orderId: it.orderId || "", orderRef: it.orderRef || "" }); } catch { /* ignore */ }
  if (it.orderId) {
    try { await batAtelierMessage(it.orderId, { text, ref: it.orderRef || "", customerEmail: it.email, customerName: it.name, keepStatus: true }); } catch { /* jamais bloquant */ }
  }
  return Response.json({ ok: true, via: sent.via || "", reply: view(claim.item) });
}
