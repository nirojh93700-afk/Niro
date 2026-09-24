// =============================================================================
// HISTORIQUE COMPLET DES E-MAILS D'UNE COMMANDE (24/09/2026)
// -----------------------------------------------------------------------------
// Demande du gérant : « j'ai des mails, ils sont pas complets dans mon dossier
// dans la commande… relis tous les mails que j'ai reçus par rapport aux
// commandes ». Avant, le fil d'une commande ne recevait que :
//   · les réponses arrivées APRÈS notre dernier message (10 derniers mails) ;
//   · ce que la boîte surveillée voyait passer (25 derniers mails, < 10 jours,
//     boîte de réception seulement — un mail archivé ou plus ancien était perdu).
// Tout ce qui précédait (demande sur mesure, photo renvoyée, précisions…) ou
// qui avait été lu/archivé n'apparaissait jamais dans « Communications ».
//
// Ici on reconstitue TOUT : les e-mails reçus DE la cliente et envoyés À elle
// (Gmail, 12 mois, archivés compris), plus son dossier du site (formulaire de
// contact, page « Répondre »…). Rangé dans le fil de la commande ET dans son
// dossier, sans doublon, SANS changer le statut ni la pastille « non lu ».
// Lecture seule côté Gmail. Jamais bloquant.
// =============================================================================

import { getGmailCreds, getCommsFor, logComm, getBatThread, batImportHistorique } from "@/lib/stock";
import { gmailAccessToken, gmailSearchIds, gmailGetMessage } from "@/lib/gmail";
import { separerCitation } from "@/lib/mailQuote";

// Envois automatiques sans intérêt dans le fil d'une commande.
const BRUIT = /code de bienvenue|lien de connexion|newsletter|gravure offerte|nouveaut|parrainage|vos favoris|baisse de prix/i;
const norm = (e) => String(e || "").trim().toLowerCase();
const estEtsy = (m) => /etsy/i.test(`${m.fromEmail || ""} ${m.toEmail || ""} ${m.subject || ""}`);

export async function syncHistoriqueCommande(order, { maxMails = 80 } = {}) {
  const email = norm(order?.customerEmail);
  if (!order?.id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ajoutes: 0, lus: 0 };
  const msgs = [];

  // 1) Le dossier du site (formulaire, page « Répondre », envois du site…).
  try {
    const dossier = await getCommsFor(email);
    for (const m of dossier.messages || []) {
      if (m.from === "nous" && BRUIT.test(m.subject || "")) continue;
      msgs.push({ key: m.gmailId || `c:${m.id}`, from: m.from === "cliente" ? "cliente" : "atelier", text: m.text, at: m.at, subject: m.subject });
    }
  } catch { /* dossier illisible : on continue avec Gmail */ }

  // 2) Gmail : tout ce qui vient d'elle ou lui a été envoyé (archivés compris).
  let lus = 0;
  try {
    const creds = await getGmailCreds();
    if (creds?.refreshToken) {
      const token = await gmailAccessToken(creds);
      const th = await getBatThread(order.id);
      const dejaVus = new Set([...(th?.importedGmailIds || []), ...msgs.map((m) => m.key)]);
      const ids = await gmailSearchIds(token, `(from:${email} OR to:${email}) newer_than:365d`, maxMails);
      for (const id of ids) {
        if (dejaVus.has(id)) continue;
        const m = await gmailGetMessage(token, id, true);
        if (!m || estEtsy(m)) continue;
        lus++;
        const deLaCliente = norm(m.fromEmail) === email;
        if (!deLaCliente && BRUIT.test(m.subject || "")) continue;
        const at = Date.parse(m.date || "") || 0;
        // On ne garde que le message lui-même, sans le texte cité en dessous (il
        // est déjà dans le fil) : le fil de toutes les commandes tient dans un
        // seul document de la base, limité en taille.
        const brut = String(m.body || m.snippet || "").trim();
        const text = (separerCitation(brut).main || brut).trim().slice(0, 3000);
        if (!text) continue;
        msgs.push({ key: id, from: deLaCliente ? "cliente" : "atelier", text, at, subject: m.subject || "" });
        // Le dossier de la cliente se complète au passage (même règle anti-doublon).
        try {
          await logComm({ email, name: deLaCliente ? m.fromName : "", from: deLaCliente ? "cliente" : "nous", text, subject: m.subject || "", at, via: "gmail", orderId: order.id, orderRef: order.ref || "", gmailId: id, dedupeWindowMs: deLaCliente ? 0 : 5 * 60 * 1000 });
        } catch { /* jamais bloquant */ }
      }
    }
  } catch { /* Gmail indisponible : on range au moins le dossier du site */ }

  const ajoutes = await batImportHistorique(order.id, msgs, {
    ref: order.ref || "", customerEmail: order.customerEmail || email, customerName: order.customerName || "",
  }).catch(() => 0);
  return { ajoutes, lus };
}
