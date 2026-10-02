// Envoi d'une alerte sur le(s) téléphone(s) du gérant (02/10/2026). JAMAIS bloquant :
// une erreur n'empêche ni la commande, ni le rangement d'un message. Les abonnements
// morts (téléphone changé, alertes retirées) sont supprimés tout seuls.
import { getPushKeys, listPushSubs, removePushSub } from "@/lib/stock";
import { BRAND } from "@/lib/email";

export async function envoyerAlerteAdmin({ title, body = "", url = "/gestion", tag = "" }) {
  try {
    const subs = await listPushSubs();
    if (!subs.length) return { envoyees: 0 };
    const keys = await getPushKeys(false);
    if (!keys) return { envoyees: 0 };
    const { default: webpush } = await import("web-push");
    webpush.setVapidDetails(`mailto:${BRAND.contact || "contact@nivcreation.fr"}`, keys.publicKey, keys.privateKey);
    const payload = JSON.stringify({ title: String(title || "Niv Création").slice(0, 120), body: String(body).slice(0, 240), url, tag: tag || undefined });
    let envoyees = 0;
    await Promise.all(subs.map(async (s) => {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 24 * 3600 }); envoyees++; }
      catch (e) { if (e?.statusCode === 404 || e?.statusCode === 410) { try { await removePushSub(s.sub.endpoint); } catch { /* ignore */ } } }
    }));
    return { envoyees };
  } catch { return { envoyees: 0 }; }
}
