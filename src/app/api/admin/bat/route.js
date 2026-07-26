import { isAdmin, getBatThread, batAtelierMessage } from "@/lib/stock";
import { sendEmail, batProofEmail, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

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
  const to = (th.customerEmail || body?.customerEmail || "").trim();
  if (to && process.env.RESEND_API_KEY) {
    const link = `${BRAND.siteUrl}/suivi/${th.token}`;
    const { subject, html } = batProofEmail({ customerName: th.customerName, ref: th.ref, message: text, imageUrl: image, link });
    // Copie cachée à la gérante : elle reçoit une copie de chaque mail envoyé à la cliente.
    const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact, bcc: BRAND.contact });
    emailed = Boolean(r?.ok);
  }
  return Response.json({ ok: true, thread: th, emailed });
}
