import {
  listCagnottes, markCagnotteReminded, expireCagnotte,
  CAGNOTTE_EXPIRY_DAYS, CAGNOTTE_REMIND_BEFORE,
} from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { cashbackReminderEmail } from "@/lib/email";
import { sendClientMail } from "@/lib/clientMail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Rappels de cagnotte AUTOMATIQUES — à appeler 1×/jour par un planificateur
// (Google Cloud Scheduler), comme /api/cron/birthdays :
//   /api/cron/cashback?token=VOTRE_SECRET
// Le secret est la variable d'environnement CRON_SECRET.
//
// Règles (inactivité) :
//   • 12 mois sans activité (CAGNOTTE_EXPIRY_DAYS) → la cagnotte expire (remise à 0).
//   • 30 jours avant (CAGNOTTE_REMIND_BEFORE) → e-mail « votre cagnotte expire bientôt »
//     (une seule fois, grâce à remindedAt).
// Rien n'est diffusé au public : uniquement des e-mails personnels aux clientes concernées.
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (token !== secret) return Response.json({ error: "Jeton invalide." }, { status: 401 });

  const DAY = 86400000;
  const now = Date.now();
  const list = await listCagnottes();

  // Prénoms depuis l'historique des commandes (pour personnaliser l'e-mail).
  const names = {};
  try {
    const orders = (await getSiteOrders(1000)) || [];
    for (const o of orders) {
      const e = (o.customerEmail || "").toLowerCase();
      if (e && !names[e] && o.customerName) names[e] = String(o.customerName).split(" ")[0];
    }
  } catch { /* pas grave : e-mail sans prénom */ }

  let reminded = 0, expired = 0;
  for (const c of list) {
    const inactiveDays = c.updatedAt ? (now - c.updatedAt) / DAY : 0;

    // 1) Expiration.
    if (inactiveDays >= CAGNOTTE_EXPIRY_DAYS) {
      try { await expireCagnotte(c.email); expired++; } catch { /* ignore */ }
      continue;
    }

    // 2) Rappel ~30 jours avant l'expiration (une seule fois par cycle).
    const daysLeft = Math.ceil(CAGNOTTE_EXPIRY_DAYS - inactiveDays);
    const alreadyReminded = c.remindedAt && (now - c.remindedAt) < 60 * DAY;
    if (daysLeft <= CAGNOTTE_REMIND_BEFORE && !alreadyReminded) {
      try {
        const { subject, html } = cashbackReminderEmail({ firstName: names[c.email.toLowerCase()] || "", balance: c.balance, daysLeft });
        const r = await sendClientMail({ to: c.email, subject, html, bcc: "" });
        if (r?.ok) { await markCagnotteReminded(c.email); reminded++; }
      } catch { /* ignore */ }
    }
  }

  return Response.json({ ok: true, scanned: list.length, reminded, expired });
}
