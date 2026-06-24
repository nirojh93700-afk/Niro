import { isAdmin, getSubscribers, getBirthdays } from "@/lib/stock";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

// Nombre d'abonnées (admin).
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const subs = await getSubscribers();
  const birthdays = await getBirthdays();
  return Response.json({ count: subs.length, subscribers: subs, birthdays });
}

// Envoi d'une campagne newsletter à toutes les abonnées (via Resend / e-mail du site).
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "E-mail non configuré (RESEND_API_KEY manquant)." }, { status: 503 });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  if (!subject || !message) return Response.json({ error: "Sujet et message obligatoires." }, { status: 400 });

  const subs = await getSubscribers();
  if (!subs.length) return Response.json({ error: "Aucune abonnée pour le moment." }, { status: 400 });

  const bodyHtml = `<div style="white-space:pre-line;font-size:15px;line-height:1.6;">${escapeHtml(message)}</div>
    <p style="margin-top:20px;"><a href="https://nivcreation.fr" style="color:#a98935;">Voir la boutique →</a></p>`;
  const html = emailLayout({ heading: subject, bodyHtml });

  let sent = 0;
  for (const to of subs) {
    try {
      const r = await sendEmail({ to, subject, html });
      if (r.ok) sent++;
    } catch { /* continue */ }
  }
  return Response.json({ ok: true, sent, total: subs.length });
}
