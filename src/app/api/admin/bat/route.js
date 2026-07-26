import { isAdmin, getBatThread, batAtelierMessage, resetBatThread, batImportEmails, getGmailCreds } from "@/lib/stock";
import { sendEmail, batProofEmail, BRAND } from "@/lib/email";
import { gmailAccessToken, gmailListFromSender } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Va chercher dans Gmail les réponses de la cliente (mails venant de son
// adresse, reçus APRÈS notre dernier message) et les importe dans le fil.
// Silencieux si Gmail non connecté ou en cas d'erreur (la discussion s'affiche
// quand même).
async function syncGmailReplies(orderId, th) {
  try {
    if (!th?.customerEmail) return;
    const creds = await getGmailCreds();
    if (!creds?.refreshToken) return;
    // Dernier message envoyé par l'atelier = point de départ pour les réponses.
    const lastAtelierAt = (th.messages || [])
      .filter((m) => m.from === "atelier")
      .reduce((mx, m) => Math.max(mx, Number(m.at) || 0), 0);
    if (!lastAtelierAt) return;
    const token = await gmailAccessToken(creds);
    const mails = await gmailListFromSender(token, th.customerEmail, 10);
    const toImport = [];
    for (const m of mails) {
      const at = Date.parse(m.date || "") || 0;
      // On ne garde que ce qui est arrivé après notre message (= une réponse).
      if (at && at < lastAtelierAt - 60000) continue;
      toImport.push({ gmailId: m.id, text: m.body || m.snippet || "", at: at || Date.now() });
    }
    if (toImport.length) await batImportEmails(orderId, toImport);
  } catch { /* Gmail indisponible : on n'empêche jamais l'affichage du fil. */ }
}

// Effacer la conversation d'aperçu d'une commande (recommencer à zéro).
export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get("orderId") || "";
  if (!orderId) return Response.json({ error: "Commande manquante." }, { status: 400 });
  await resetBatThread(orderId);
  return Response.json({ ok: true });
}

// Lire le fil de discussion / BAT d'une commande (admin).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get("orderId") || "";
  let th = await getBatThread(orderId);
  // Remonte les réponses reçues par e-mail (Gmail) dans le fil, puis relit.
  if (th) {
    await syncGmailReplies(orderId, th);
    th = await getBatThread(orderId);
  }
  return Response.json({ thread: th });
}

// Envoyer un aperçu / message à la cliente (admin) + e-mail avec lien sécurisé.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const orderId = String(body?.orderId || "").trim();
  const text = String(body?.text || "").trim();
  const image = String(body?.image || "").trim();
  if (!orderId) return Response.json({ error: "Commande manquante." }, { status: 400 });
  if (!text && !image) return Response.json({ error: "Ajoutez un message ou un aperçu." }, { status: 400 });

  const th = await batAtelierMessage(orderId, {
    text, image,
    ref: body?.ref || "",
    customerEmail: body?.customerEmail || "",
    customerName: body?.customerName || "",
  });
  if (!th) return Response.json({ error: "Échec." }, { status: 500 });

  let emailed = false;
  let emailError = "";
  const to = (th.customerEmail || body?.customerEmail || "").trim();
  if (!to) {
    emailError = "Aucune adresse e-mail sur cette commande.";
  } else if (!process.env.RESEND_API_KEY) {
    emailError = "Envoi d'e-mails non configuré (RESEND_API_KEY).";
  } else {
    const link = `${BRAND.siteUrl}/suivi/${th.token}`;
    const { subject, html } = batProofEmail({ customerName: th.customerName, ref: th.ref, message: text, imageUrl: image, link });
    // Copie cachée à la gérante : elle reçoit une copie de chaque mail envoyé à la cliente.
    const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact, bcc: BRAND.contact });
    emailed = Boolean(r?.ok);
    if (!emailed) emailError = String(r?.error || "Envoi refusé.").slice(0, 300);
  }
  return Response.json({ ok: true, thread: th, emailed, emailError, to });
}
