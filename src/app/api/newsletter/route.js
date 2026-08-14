import { addSubscriber, setBirthday, getSettings, ensureWelcomeCode } from "@/lib/stock";
import { welcomeEmail, BRAND } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";

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
      // On s'assure que le code promis dans l'e-mail EXISTE vraiment, sinon il
      // serait refusé au paiement.
      await ensureWelcomeCode();
      const { subject, html } = welcomeEmail(code, w.text);
      // Gmail en priorité (arrive vraiment), Resend en secours ; copie à la gérante.
      const r = await sendClientMail({ to: email, subject, html, bcc: BRAND.contact });
      emailed = Boolean(r?.ok);
    }
  } catch { /* ignore */ }

  return Response.json({ ok: true, emailed });
}
