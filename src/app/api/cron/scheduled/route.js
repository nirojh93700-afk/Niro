import { getScheduledEmails, markScheduledSent, getSettings, hasAutoSent, markAutoSent } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { sendClientMail, brandedMessage } from "@/lib/clientMail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY = 86400000;

// Remplace {prenom} / {nom} / {ref} par les infos de la commande.
function fill(tpl, o) {
  const prenom = (o.customerName || "").split(" ")[0];
  return String(tpl || "")
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, o.customerName || "")
    .replace(/\{ref\}/gi, o.ref || (o.id || "").slice(-6));
}

// Cron d'envoi automatique — à appeler régulièrement (toutes les 10-15 min) par
// un planificateur (Google Cloud Scheduler) :  /api/cron/scheduled?token=SECRET
export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (token !== secret) return Response.json({ error: "Jeton invalide." }, { status: 401 });

  const now = Date.now();
  let sentManual = 0, sentAuto = 0, failed = 0;

  // 1) Messages PROGRAMMÉS (manuels) arrivés à échéance.
  const queue = await getScheduledEmails();
  for (const s of queue) {
    if (s.sent || (s.sendAt || 0) > now) continue;
    const html = brandedMessage(s.subject, s.body);
    const r = await sendClientMail({ to: s.to, subject: s.subject, html });
    await markScheduledSent(s.id, { ok: r.ok, error: r.error });
    if (r.ok) sentManual++; else failed++;
  }

  // 2) RÈGLES automatiques appliquées à toutes les commandes.
  const settings = await getSettings();
  const rules = (settings?.autoRules || []).filter((r) => r.active && r.body && r.delayDays >= 0);
  if (rules.length) {
    const orders = (await getSiteOrders(300)) || [];
    for (const rule of rules) {
      for (const o of orders) {
        if (o.test || !o.customerEmail) continue;
        if (["annulee", "remboursee"].includes(o.status)) continue;
        // Base de temps selon le déclencheur.
        let baseTs;
        if (rule.trigger === "livree") {
          if (o.status !== "livree") continue;
          baseTs = Number(o.deliveredAt || o.shippedAt || o.updatedAt || o.createdAt) || 0;
        } else {
          baseTs = Number(o.createdAt) || 0;
        }
        if (!baseTs) continue;
        const dueAt = baseTs + rule.delayDays * DAY;
        // Échéance passée mais récente (≤ 3 j) → évite d'arroser l'historique.
        if (dueAt > now || now - dueAt > 3 * DAY) continue;
        if (await hasAutoSent(rule.id, o.id)) continue;

        const subject = fill(rule.subject || "Un message de Niv Création", o);
        const html = brandedMessage(subject, fill(rule.body, o));
        const r = await sendClientMail({ to: o.customerEmail, subject, html });
        await markAutoSent(rule.id, o.id); // marqué même si échec pour ne pas boucler
        if (r.ok) sentAuto++; else failed++;
      }
    }
  }

  return Response.json({ ok: true, sentManual, sentAuto, failed });
}
