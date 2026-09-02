import { getGmailCreds, getBatThreadsMeta, batImportEmails, batImportOutgoing, ensureCommThread, getBatThread, addPendingReply, listPendingReplies, getInboxState, saveInboxState, getSettings, logComm } from "@/lib/stock";
import { gmailAccessToken, gmailListInboxIds, gmailListSentIds, gmailGetMessage, looksLikeRealCustomer } from "@/lib/gmail";
import { getSiteOrders } from "@/lib/firebase";
import { triageIncomingEmail } from "@/lib/agents/registry";
import { sendDraftAlert } from "@/lib/replyAlert";
import { BRAND } from "@/lib/email";

// =============================================================================
// BOÎTE MAIL SURVEILLÉE — « il prépare, le gérant décide », pour TOUS les e-mails
// -----------------------------------------------------------------------------
// À chaque passage (ouverture de la gestion, planificateur) :
//   1. on lit les derniers e-mails reçus dans Gmail ;
//   2. chaque e-mail d'une vraie cliente est RANGÉ dans le fil de sa commande
//      (retrouvée par son adresse) → tout l'historique est tracé au même endroit ;
//   3. l'agent e-mail prépare une réponse EN CONNAISSANT la commande et les
//      échanges précédents → rangée « à valider » ;
//   4. le gérant reçoit UNE alerte avec le bouton « Relire, modifier et envoyer ».
// RIEN ne part à la cliente d'ici. Chaque e-mail n'est traité qu'une seule fois.
// =============================================================================

const THROTTLE_MS = 3 * 60 * 1000;      // au plus une lecture Gmail toutes les 3 min
const MAX_AGE_MS = 10 * 24 * 3600 * 1000; // on ignore les e-mails de plus de 10 jours (pas de rattrapage massif)
const STATUS_LABEL = { a_preparer: "à préparer", en_gravure: "en fabrication", expediee: "expédiée", livree: "livrée", remise_main_propre: "remise en main propre", annulee: "annulée", remboursee: "remboursée" };

function ownAddresses() {
  return new Set([BRAND.contact, process.env.CONTACT_EMAIL || "", "contact.nivcreation@gmail.com"].filter(Boolean).map((e) => e.toLowerCase()));
}

function fmtDate(ts) {
  const d = new Date(Number(ts) || ts || 0);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Résumé lisible de la commande + des échanges, donné à l'agent pour répondre juste.
async function buildContext(order, email) {
  const parts = [];
  if (order) {
    const items = (order.items || []).map((it) => `${it.quantity || 1}× ${it.name}${it.details ? ` (${String(it.details).slice(0, 120)})` : ""}`).join(" ; ");
    parts.push(`Commande #${order.ref || ""} du ${fmtDate(order.createdAt)} — statut : ${STATUS_LABEL[order.status || "a_preparer"] || order.status}.`);
    if (items) parts.push(`Articles : ${items}.`);
    if (order.total != null) parts.push(`Montant : ${Number(order.total).toFixed(2).replace(".", ",")} €${order.shippingMethod ? ` — livraison : ${order.shippingMethod}` : ""}.`);
    if (order.tracking) parts.push(`Numéro de suivi : ${order.tracking}.`);
    if (order.cadeauChoix) parts.push(`Cadeau d'attente choisi : ${order.cadeauChoix}.`);
    if (order.alerteInterne || order.adminNote) parts.push(`NOTES INTERNES DU GÉRANT (à connaître, NE JAMAIS les citer ni parler de leur contenu technique) : ${[order.alerteInterne, order.adminNote].filter(Boolean).join(" / ").slice(0, 500)}`);
    try {
      const th = await getBatThread(order.id);
      const msgs = (th?.messages || []).slice(-8);
      if (msgs.length) {
        parts.push("Échanges précédents sur cette commande (du plus ancien au plus récent) :");
        for (const m of msgs) parts.push(`- [${m.from === "atelier" ? "Nous" : "Cliente"} · ${fmtDate(m.at)}] ${String(m.text || "").replace(/\s+/g, " ").slice(0, 400)}`);
      }
    } catch { /* sans historique */ }
  } else {
    parts.push("Aucune commande trouvée à cette adresse e-mail : c'est peut-être une future cliente (question avant achat).");
  }
  try {
    const prev = (await listPendingReplies()).filter((r) => r.email === email && r.status === "sent" && r.finalText).slice(0, 3);
    if (prev.length) {
      parts.push("Réponses que nous lui avons déjà envoyées (les plus récentes) :");
      for (const r of prev) parts.push(`- [${fmtDate(r.resolvedAt)}] ${String(r.finalText).replace(/\s+/g, " ").slice(0, 300)}`);
    }
  } catch { /* ignore */ }
  return parts.join("\n");
}

// Nettoie un corps d'e-mail : retire la citation du message précédent.
function cleanBody(text) {
  const t = String(text || "").replace(/\r/g, "");
  const cut = t.search(/\n(Le .{3,80} a écrit ?:|On .{3,80} wrote:|-{3,} ?Original Message|De ?: .+\nEnvoyé ?:|> )/i);
  const body = (cut > 0 ? t.slice(0, cut) : t).trim();
  return body.slice(0, 4000);
}

export async function syncInbox({ force = false } = {}) {
  const state = await getInboxState();
  const now = Date.now();
  if (!force && now - state.lastRun < THROTTLE_MS) return { skipped: true, lastRun: state.lastRun, lastResult: state.lastResult };
  // On réserve tout de suite le créneau (deux passages simultanés ne traitent pas deux fois).
  await saveInboxState({ ids: {}, lastRun: now });

  const result = { checked: 0, imported: 0, drafted: [], ignored: 0, errors: [] };
  const creds = await getGmailCreds().catch(() => null);
  if (!creds?.refreshToken) {
    result.errors.push("Gmail non connecté");
    await saveInboxState({ ids: {}, lastRun: now, lastResult: { ...result, at: now } });
    return result;
  }
  let settings = null;
  try { settings = await getSettings(); } catch { settings = null; }
  const draftOn = settings?.agents?.emailDraft !== false;

  // Tout premier passage : on ne prépare PAS de réponse pour les e-mails de plus
  // de 24 h (déjà traités à la main) — on les range seulement dans les commandes.
  const firstRun = !state.lastRun;
  const seen = {};
  try {
    const token = await gmailAccessToken(creds);
    const ids = await gmailListInboxIds(token, 25);
    const metas = await getBatThreadsMeta();
    const alreadyImported = new Set(metas.flatMap((m) => m.importedGmailIds || []));
    const pendings = await listPendingReplies();
    const drafted = new Set(pendings.map((r) => r.gmailId).filter(Boolean));
    const own = ownAddresses();

    // Commandes par adresse (la plus récente d'abord), hors tests.
    const orders = (await getSiteOrders(300).catch(() => [])).filter((o) => !o.test);
    const byEmail = new Map();
    for (const o of orders) {
      const e = String(o.customerEmail || "").toLowerCase();
      if (!e) continue;
      const cur = byEmail.get(e);
      if (!cur || Date.parse(o.createdAt || 0) > Date.parse(cur.createdAt || 0)) byEmail.set(e, o);
    }

    // Lecture des nouveaux e-mails, puis on ne prépare une réponse que pour le
    // DERNIER message de chaque expéditrice (pas pour ses messages plus anciens).
    const fresh = [];
    for (const id of ids) {
      if (state.ids[id] || alreadyImported.has(id) || drafted.has(id)) continue;
      result.checked++;
      const msg = await gmailGetMessage(token, id, true);
      if (!msg) { seen[id] = now; continue; }
      const from = String(msg.fromEmail || "").toLowerCase();
      const at = Date.parse(msg.date || "") || now;
      // Seulement les e-mails liés au SITE : tout ce qui touche Etsy reste dans Etsy
      // (demande du gérant, 02/09/2026).
      const etsy = /etsy/i.test(String(msg.subject || "")) || /etsy\./i.test(from);
      if (etsy || !looksLikeRealCustomer(from, msg.labelIds) || own.has(from) || now - at > MAX_AGE_MS) {
        seen[id] = now; result.ignored++; continue;
      }
      const body = cleanBody(msg.body || msg.snippet || "");
      if (!body) { seen[id] = now; result.ignored++; continue; }
      fresh.push({ id, msg, from, at, body });
    }
    const latestBySender = new Map();
    for (const f of fresh) { const cur = latestBySender.get(f.from); if (!cur || f.at > cur.at) latestBySender.set(f.from, f); }

    for (const { id, msg, from, at, body } of fresh) {

      // 1) Traçabilité : dossier de la cliente (toujours) + fil de sa commande.
      const order = byEmail.get(from) || null;
      try { await logComm({ email: from, name: msg.fromName, from: "cliente", text: body, subject: msg.subject || "", at, via: "gmail", orderId: order?.id || "", orderRef: order?.ref || "", gmailId: id }); } catch { /* jamais bloquant */ }
      if (order) {
        try {
          await ensureCommThread(order.id, { ref: order.ref || "", customerEmail: order.customerEmail || from, customerName: order.customerName || msg.fromName });
          const added = await batImportEmails(order.id, [{ gmailId: id, text: body, at }]);
          if (added) result.imported++;
        } catch (e) { result.errors.push(`fil ${order.ref || order.id}: ${e?.message || e}`); }
      }

      // Déjà répondu ? (un message de l'atelier plus récent existe dans le fil)
      let dejaRepondu = false;
      if (order) {
        try {
          const th = await getBatThread(order.id);
          dejaRepondu = (th?.messages || []).some((m) => m.from === "atelier" && (Number(m.at) || 0) > at);
        } catch { dejaRepondu = false; }
      }
      const isLatest = latestBySender.get(from)?.id === id;

      // 2) Réponse préparée, à valider par le gérant — seulement pour le dernier
      //    message de la cliente, pas encore répondu.
      if (draftOn && isLatest && !dejaRepondu && !(firstRun && now - at > 24 * 3600 * 1000)) {
        let draft = null;
        try {
          const context = await buildContext(order, from);
          draft = await triageIncomingEmail({ name: msg.fromName || from, email: from, subject: msg.subject || "", message: body, context });
        } catch { draft = null; }
        try {
          const item = await addPendingReply({
            name: msg.fromName || from, email: from, subject: msg.subject || "", message: body,
            draft: draft?.reply || "", draftSubject: draft?.subject || (msg.subject ? `Re : ${msg.subject}` : "Votre message — Niv Création"),
            reason: draft?.reason || "",
            orderId: order?.id || "", orderRef: order?.ref || "",
            gmailId: id, gmailThreadId: msg.threadId || "", messageId: msg.messageId || "", references: [msg.references, msg.messageId].filter(Boolean).join(" "),
            source: "gmail",
          });
          if (item) {
            result.drafted.push({ name: item.name, email: item.email, orderRef: order?.ref || "", subject: item.subject });
            try { await sendDraftAlert(item, { orderRef: order?.ref || "", reason: draft?.reason || "", source: "gmail" }); } catch { /* l'alerte peut rater, la réponse reste dans Gestion */ }
          }
        } catch (e) { result.errors.push(`brouillon ${from}: ${e?.message || e}`); }
      }
      seen[id] = now;
    }
  } catch (e) {
    result.errors.push(e?.message || String(e));
  }

  // 3) Ce que NOUS avons envoyé à la main depuis Gmail : rangé aussi dans le
  //    dossier de la cliente et le fil de sa commande (rien ne se perd).
  result.sent = 0;
  try {
    const token = await gmailAccessToken(creds);
    const sentIds = await gmailListSentIds(token, 25);
    const metas = await getBatThreadsMeta();
    const alreadyImported = new Set(metas.flatMap((m) => m.importedGmailIds || []));
    const orders = (await getSiteOrders(300).catch(() => [])).filter((o) => !o.test);
    const byEmail = new Map();
    for (const o of orders) {
      const e = String(o.customerEmail || "").toLowerCase();
      if (!e) continue;
      const cur = byEmail.get(e);
      if (!cur || Date.parse(o.createdAt || 0) > Date.parse(cur.createdAt || 0)) byEmail.set(e, o);
    }
    for (const id of sentIds) {
      if (state.ids["s:" + id] || alreadyImported.has(id)) continue;
      const msg = await gmailGetMessage(token, id, true);
      seen["s:" + id] = now;
      if (!msg) continue;
      const to = String(msg.toEmail || "").toLowerCase();
      const at = Date.parse(msg.date || "") || now;
      const own = ownAddresses();
      const subj = String(msg.subject || "");
      // Ni nos propres adresses, ni les notifications internes (alertes, copies).
      if (!to || own.has(to) || !looksLikeRealCustomer(to, []) || now - at > MAX_AGE_MS) continue;
      if (/^(📧|🛎️|🛎|\[À valider\]|\[A valider\]|Nouvelle commande|Alerte)/i.test(subj)) continue;
      if (/etsy/i.test(subj) || /etsy\./i.test(to)) continue; // Etsy reste dans Etsy
      const body = cleanBody(msg.body || msg.snippet || "");
      if (!body) continue;
      const order = byEmail.get(to) || null;
      // Fenêtre de 5 min : un e-mail envoyé PAR LE SITE est déjà rangé (on ne le double pas).
      const logged = await logComm({ email: to, from: "nous", text: body, subject: subj, at, via: "gmail", orderId: order?.id || "", orderRef: order?.ref || "", gmailId: id, dedupeWindowMs: 5 * 60 * 1000 }).catch(() => null);
      if (logged) result.sent++;
      if (order && logged) {
        try {
          await ensureCommThread(order.id, { ref: order.ref || "", customerEmail: order.customerEmail || to, customerName: order.customerName || "" });
          await batImportOutgoing(order.id, [{ gmailId: id, text: body, at }]);
        } catch { /* ignore */ }
      }
    }
  } catch (e) { result.errors.push("envoyés : " + (e?.message || e)); }

  await saveInboxState({ ids: seen, lastRun: now, lastResult: { ...result, at: now } });
  return result;
}
