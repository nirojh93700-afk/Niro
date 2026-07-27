import { isAdmin, getBatThread, batAtelierMessage, resetBatThread, batImportEmails, getGmailCreds, getBatThreadsMeta, markBatRead } from "@/lib/stock";
import { sendEmail, batProofEmail, BRAND } from "@/lib/email";
import { gmailAccessToken, gmailListFromSender, gmailListInboxIds, gmailGetMessage, gmailSendHtml } from "@/lib/gmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Traduit les erreurs Resend courantes en message clair et actionnable.
function friendlyEmailError(raw) {
  const s = String(raw || "").toLowerCase();
  if (/only send testing emails|verify a domain|not verified|own email address/.test(s)) {
    return "Le service d'e-mails (Resend) refuse d'envoyer vers une adresse cliente tant que le domaine nivcreation.fr n'est pas vérifié. → À faire une seule fois : vérifier le domaine dans Resend (resend.com/domains) puis mettre CONTACT_FROM = une adresse @nivcreation.fr.";
  }
  if (/rate limit|too many/.test(s)) return "Trop d'envois d'un coup (limite Resend). Réessaie dans une minute.";
  if (/invalid.*from|from.*invalid/.test(s)) return "Adresse expéditeur (CONTACT_FROM) invalide : elle doit être une adresse @nivcreation.fr d'un domaine vérifié.";
  return String(raw || "Envoi refusé par le service d'e-mails.").slice(0, 300);
}

// Va chercher dans Gmail les réponses de la cliente (mails venant de son
// adresse, reçus APRÈS notre dernier message) et les importe dans le fil.
// Silencieux si Gmail non connecté ou en cas d'erreur (la discussion s'affiche
// quand même).
async function syncGmailReplies(orderId, th) {
  try {
    if (!th?.customerEmail) return;
    const creds = await getGmailCreds();
    if (!creds?.refreshToken) return;
    // Dernier message envoyé par l'atelier = point de départ pour les réponses.
    const lastAtelierAt = (th.messages || [])
      .filter((m) => m.from === "atelier")
      .reduce((mx, m) => Math.max(mx, Number(m.at) || 0), 0);
    if (!lastAtelierAt) return;
    const token = await gmailAccessToken(creds);
    const mails = await gmailListFromSender(token, th.customerEmail, 10);
    const toImport = [];
    for (const m of mails) {
      const at = Date.parse(m.date || "") || 0;
      // On ne garde que ce qui est arrivé après notre message (= une réponse).
      if (at && at < lastAtelierAt - 60000) continue;
      toImport.push({ gmailId: m.id, text: m.body || m.snippet || "", at: at || Date.now() });
    }
    if (toImport.length) await batImportEmails(orderId, toImport);
  } catch { /* Gmail indisponible : on n'empêche jamais l'affichage du fil. */ }
}

// Effacer la conversation d'aperçu d'une commande (recommencer à zéro).
export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const orderId = new URL(req.url).searchParams.get("orderId") || "";
  if (!orderId) return Response.json({ error: "Commande manquante." }, { status: 400 });
  await resetBatThread(orderId);
  return Response.json({ ok: true });
}

// Lire le fil de discussion / BAT d'une commande (admin).
// Vérification GLOBALE : une seule lecture Gmail, on importe les réponses dans
// tous les fils concernés, et on renvoie la liste des commandes « non lues »
// (pour les pastilles côté page Commandes).
async function syncAllAndListUnread() {
  const metas = await getBatThreadsMeta();
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      // Adresses des fils en attente d'une réponse (on a déjà écrit à la cliente).
      const byEmail = new Map();
      for (const m of metas) {
        if (m.customerEmail && m.lastAtelierAt) byEmail.set(m.customerEmail.toLowerCase(), m);
      }
      if (byEmail.size) {
        const token = await gmailAccessToken(creds);
        const ids = await gmailListInboxIds(token, 30);
        // On ignore les mails déjà importés (dans n'importe quel fil).
        const alreadyImported = new Set(metas.flatMap((m) => m.importedGmailIds));
        for (const id of ids) {
          if (alreadyImported.has(id)) continue;
          const msg = await gmailGetMessage(token, id, true);
          if (!msg) continue;
          const meta = byEmail.get((msg.fromEmail || "").toLowerCase());
          if (!meta) continue;
          const at = Date.parse(msg.date || "") || 0;
          if (at && at < meta.lastAtelierAt - 60000) continue;
          await batImportEmails(meta.orderId, [{ gmailId: id, text: msg.body || msg.snippet || "", at: at || Date.now() }]);
        }
      }
    }
  } catch { /* Gmail indisponible : on renvoie les non-lus déjà connus. */ }
  const fresh = await getBatThreadsMeta();
  return fresh.filter((m) => m.clientUnread).map((m) => m.orderId);
}

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const url = new URL(req.url);
  // Vérification globale des nouvelles réponses (pastilles).
  if (url.searchParams.get("action") === "unread") {
    return Response.json({ unread: await syncAllAndListUnread() });
  }
  const orderId = url.searchParams.get("orderId") || "";
  let th = await getBatThread(orderId);
  // Remonte les réponses reçues par e-mail (Gmail) dans le fil, puis relit.
  if (th) {
    await syncGmailReplies(orderId, th);
    await markBatRead(orderId); // ouvert = lu (retire la pastille)
    th = await getBatThread(orderId);
  }
  return Response.json({ thread: th });
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
  let emailError = "";
  let via = "";
  const to = (th.customerEmail || body?.customerEmail || "").trim();
  if (!to) {
    emailError = "Aucune adresse e-mail sur cette commande.";
  } else {
    const link = `${BRAND.siteUrl}/suivi/${th.token}`;
    // L'e-mail a besoin d'une adresse d'image COMPLÈTE (une URL relative
    // « /api/img/… » s'affiche cassée dans la boîte mail de la cliente).
    const absImage = image && image.startsWith("/") ? BRAND.siteUrl + image : image;
    const { subject, html } = batProofEmail({ customerName: th.customerName, ref: th.ref, message: text, imageUrl: absImage, link });

    // 1) PRIORITÉ : envoi via Gmail (ta boîte connectée) — fonctionne vers
    //    n'importe quelle cliente, SANS domaine vérifié. Le mail part de ta
    //    vraie adresse et les réponses reviennent dans ta boîte (→ discussion).
    try {
      const creds = await getGmailCreds();
      if (creds?.refreshToken) {
        const token = await gmailAccessToken(creds);
        await gmailSendHtml(token, { to, subject, html, bcc: BRAND.contact });
        emailed = true;
        via = "gmail";
      }
    } catch (e) {
      emailError = "Gmail : " + String(e?.message || "").slice(0, 200);
    }

    // 2) SECOURS : Resend (si Gmail non connecté ou en échec).
    if (!emailed && process.env.RESEND_API_KEY) {
      const r = await sendEmail({ to, subject, html, replyTo: BRAND.contact, bcc: BRAND.contact });
      if (r?.ok) { emailed = true; via = "resend"; emailError = ""; }
      else emailError = friendlyEmailError(r?.error);
    }
    if (!emailed && !emailError) emailError = "Aucun service d'e-mail disponible (Gmail non connecté et RESEND_API_KEY manquant).";
  }
  return Response.json({ ok: true, thread: th, emailed, emailError, to, via });
}
