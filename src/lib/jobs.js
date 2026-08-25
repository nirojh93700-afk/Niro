// =============================================================================
// Tâches périodiques (envois auto, cagnotte, anniversaires) — logique PARTAGÉE
// entre les crons protégés par jeton (/api/cron/*) ET le déclencheur intégré au
// site (/api/heartbeat). Aucune de ces fonctions n'envoie quoi que ce soit au
// public sans règle explicite de la gérante ; tout est isolé (try/catch).
// =============================================================================
import {
  getScheduledEmails, markScheduledSent, getSettings, hasAutoSent, markAutoSent,
  listCagnottes, markCagnotteReminded, expireCagnotte, getBirthdays, setPromoCode,
  getSubscribersDetailed,
  CAGNOTTE_EXPIRY_DAYS, CAGNOTTE_REMIND_BEFORE,
} from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { sendClientMail, brandedMessage, boutonsAvis } from "@/lib/clientMail";
import { cashbackReminderEmail, emailLayout, BRAND } from "@/lib/email";

const DAY = 86400000;

function fill(tpl, o) {
  const prenom = (o.customerName || "").split(" ")[0];
  return String(tpl || "")
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{nom\}/gi, o.customerName || "")
    .replace(/\{ref\}/gi, o.ref || (o.id || "").slice(-6));
}

// --- 1) Messages programmés + règles automatiques --------------------------
export async function runScheduledJobs() {
  const now = Date.now();
  let sentManual = 0, sentAuto = 0, failed = 0;

  const queue = await getScheduledEmails();
  for (const s of queue) {
    if (s.sent || (s.sendAt || 0) > now) continue;
    const html = brandedMessage(s.subject, s.body);
    const r = await sendClientMail({ to: s.to, subject: s.subject, html });
    await markScheduledSent(s.id, { ok: r.ok, error: r.error });
    if (r.ok) sentManual++; else failed++;
  }

  const settings = await getSettings();
  const rules = (settings?.autoRules || []).filter((r) => r.active && r.body && r.delayDays >= 0);
  if (rules.length) {
    const orders = (await getSiteOrders(300)) || [];
    // Règles basées sur les commandes (commande / livrée).
    for (const rule of rules) {
      if (rule.trigger === "inscription") continue; // traité séparément ci-dessous
      for (const o of orders) {
        if (o.test || !o.customerEmail) continue;
        if (["annulee", "remboursee"].includes(o.status)) continue;
        // Les dates sont stockées en chaîne ISO (ex. "2026-07-20T10:00:00Z") :
        // on parse avec Date (Number() renverrait NaN sur une date ISO).
        const ts = (v) => { const n = new Date(v).getTime(); return Number.isFinite(n) ? n : 0; };
        let baseTs;
        if (rule.trigger === "livree") {
          if (o.status !== "livree") continue;
          baseTs = ts(o.deliveredAt) || ts(o.shippedAt) || ts(o.updatedAt) || ts(o.createdAt);
        } else {
          baseTs = ts(o.createdAt);
        }
        if (!baseTs) continue;
        const dueAt = baseTs + rule.delayDays * DAY;
        if (dueAt > now || now - dueAt > 3 * DAY) continue;
        if (await hasAutoSent(rule.id, o.id)) continue;

        const subject = fill(rule.subject || "Un message de Niv Création", o);
        // Règle d'AVIS (après livraison) → on joint les boutons « ★ Noter ».
        const estRegleAvis = rule.trigger === "livree" && /avis/i.test(`${rule.name || ""} ${rule.subject || ""}`);
        const html = brandedMessage(subject, fill(rule.body, o), estRegleAvis ? boutonsAvis(o.items) : "");
        const r = await sendClientMail({ to: o.customerEmail, subject, html });
        await markAutoSent(rule.id, o.id);
        if (r.ok) sentAuto++; else failed++;
      }
    }

    // Règles "inscription" : relance des abonnées newsletter X jours après leur
    // inscription, UNIQUEMENT si elles n'ont pas commandé. Une seule fois chacune.
    const inscRules = rules.filter((r) => r.trigger === "inscription");
    if (inscRules.length) {
      const detailed = await getSubscribersDetailed().catch(() => []);
      const buyers = new Set((orders || []).map((o) => (o.customerEmail || "").toLowerCase()).filter(Boolean));
      const ts = (v) => { const n = new Date(v).getTime(); return Number.isFinite(n) ? n : 0; };
      for (const rule of inscRules) {
        for (const s of detailed) {
          const email = (s.email || "").toLowerCase();
          if (!email || !s.date) continue;          // pas de date connue → on ne relance pas
          if (buyers.has(email)) continue;           // a déjà commandé → pas de relance
          const baseTs = ts(s.date);
          if (!baseTs) continue;
          const dueAt = baseTs + rule.delayDays * DAY;
          if (dueAt > now || now - dueAt > 3 * DAY) continue;
          if (await hasAutoSent(rule.id, "sub:" + email)) continue;
          const subject = fill(rule.subject || "Un message de Niv Création", {});
          const html = brandedMessage(subject, fill(rule.body, {}));
          const r = await sendClientMail({ to: email, subject, html, bcc: "" });
          await markAutoSent(rule.id, "sub:" + email);
          if (r.ok) sentAuto++; else failed++;
        }
      }
    }
  }
  return { sentManual, sentAuto, failed };
}

// --- 2) Rappels / expiration de la cagnotte fidélité -----------------------
export async function runCashbackJobs() {
  const now = Date.now();
  const list = await listCagnottes();

  const names = {};
  try {
    const orders = (await getSiteOrders(1000)) || [];
    for (const o of orders) {
      const e = (o.customerEmail || "").toLowerCase();
      if (e && !names[e] && o.customerName) names[e] = String(o.customerName).split(" ")[0];
    }
  } catch { /* e-mail sans prénom */ }

  let reminded = 0, expired = 0;
  for (const c of list) {
    const inactiveDays = c.updatedAt ? (now - c.updatedAt) / DAY : 0;
    if (inactiveDays >= CAGNOTTE_EXPIRY_DAYS) {
      try { await expireCagnotte(c.email); expired++; } catch { /* ignore */ }
      continue;
    }
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
  return { scanned: list.length, reminded, expired };
}

// --- 3) Anniversaires : code de remise + e-mail ----------------------------
export async function runBirthdayJobs() {
  const birthdays = await getBirthdays();
  const now = new Date();
  const mm = now.getMonth() + 1, dd = now.getDate();
  const todays = Object.entries(birthdays).filter(([, date]) => {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date || "");
    return m && +m[1] === mm && +m[2] === dd;
  }).map(([email]) => email);
  if (!todays.length) return { sent: 0 };

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
      const r = await sendClientMail({ to, subject: "Joyeux anniversaire ✦ une surprise pour vous", html, bcc: BRAND.contact });
      if (r?.ok) sent++;
    } catch { /* ignore */ }
  }
  return { sent };
}
