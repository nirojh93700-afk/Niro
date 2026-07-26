import { isAdmin, getBatThread, batAtelierMessage, resetBatThread } from "@/lib/stock";
import { sendEmail, batProofEmail, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

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
  return Response.json({ thread: await getBatThread(orderId) });
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
