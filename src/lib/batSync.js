// Réponses des clientes dans les fils « Aperçu / communications » des commandes :
// une seule lecture Gmail, rangement dans les bons fils, liste des commandes non lues.
// Sorti de /api/admin/bat le 02/10/2026 pour être lancé par le BATTEMENT du site
// (toutes les 5 min) au lieu d'être attendu par l'écran (≈ 5 s à chaque ouverture).
import { getBatThreadsMeta, getGmailCreds, batImportEmails } from "@/lib/stock";
import { gmailAccessToken, gmailListInboxIds, gmailGetMessage } from "@/lib/gmail";

export async function syncAllAndListUnread() {
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
