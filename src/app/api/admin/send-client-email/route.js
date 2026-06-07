import { isAdmin } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";

// Envoie un e-mail à une cliente depuis l'admin (avec l'e-mail du site, à ton image).
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "E-mail non configuré (RESEND_API_KEY)." }, { status: 503 });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const to = String(body?.to || "").trim();
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse invalide." }, { status: 400 });
  if (!subject || !message) return Response.json({ error: "Sujet et message obligatoires." }, { status: 400 });

  const html = emailLayout({
    heading: subject,
    bodyHtml: `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
      <p style="margin-top:18px;color:#7a7268;">Niv Création</p>`,
  });
  const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact });
  if (!r.ok) return Response.json({ error: "Échec de l'envoi." }, { status: 500 });
  return Response.json({ ok: true });
}
