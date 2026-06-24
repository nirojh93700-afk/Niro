import { getBirthdays, setPromoCode } from "@/lib/stock";
import { sendEmail, emailLayout, BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Remise anniversaire AUTOMATIQUE — à appeler une fois par jour par un
// planificateur (Google Cloud Scheduler). Protégé par un jeton secret :
//   /api/cron/birthdays?token=VOTRE_SECRET
// Le secret est défini dans la variable d'environnement CRON_SECRET.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (token !== secret) return Response.json({ error: "Jeton invalide." }, { status: 401 });

  const birthdays = await getBirthdays();
  const now = new Date();
  const mm = now.getMonth() + 1, dd = now.getDate();
  const todays = Object.entries(birthdays).filter(([, date]) => {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date || "");
    return m && +m[1] === mm && +m[2] === dd;
  }).map(([email]) => email);

  if (!todays.length) return Response.json({ ok: true, sent: 0 });

  const code = "ANNIV15";
  try { await setPromoCode(code, { type: "percent", value: 15 }); } catch { /* ignore */ }

  let sent = 0;
  for (const to of todays) {
    try {
      const html = emailLayout({
        heading: "Joyeux anniversaire ✦",
        bodyHtml: `<p style="margin:0 0 12px;">Bonjour,</p>
          <p style="margin:0 0 12px;">Toute l'équipe Niv Création vous souhaite un très <strong>joyeux anniversaire</strong> !</p>
          <p style="margin:0 0 16px;">Pour l'occasion, profitez de <strong>−15 %</strong> sur votre commande avec le code <strong>${code}</strong>.</p>
          <p style="margin:0;color:#7a7268;">Belle journée,<br>L'atelier Niv Création</p>`,
      });
      const r = await sendEmail({ to, subject: "Joyeux anniversaire ✦ une surprise pour vous", html, replyTo: BRAND.contact });
      if (r?.ok) sent++;
    } catch { /* ignore */ }
  }
  return Response.json({ ok: true, sent });
}
