import { addSubscriber, setBirthday, getSettings } from "@/lib/stock";
import { sendEmail, welcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Inscription à la newsletter (public). Envoie automatiquement l'e-mail de
// bienvenue avec le code promo si la fenêtre de bienvenue est configurée.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const email = (body?.email || "").toString().trim();
  const ok = await addSubscriber(email);
  if (!ok) return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  // Anniversaire facultatif (pour la remise d'anniversaire).
  if (body?.birthday) { try { await setBirthday(email, body.birthday); } catch { /* ignore */ } }

  // E-mail de bienvenue avec le code (n'empêche pas l'inscription si l'envoi échoue).
  let emailed = false;
  try {
    const settings = await getSettings().catch(() => ({}));
    const w = settings?.welcome || {};
    const code = (w.code || "").toString().trim();
    if (code) {
      const { subject, html } = welcomeEmail(code, w.text);
      const r = await sendEmail({ to: email, subject, html });
      emailed = Boolean(r?.ok);
    }
  } catch { /* ignore */ }

  return Response.json({ ok: true, emailed });
}
