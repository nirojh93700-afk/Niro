// Envoi d'une alerte sur le(s) téléphone(s) du gérant (02/10/2026). JAMAIS bloquant :
// une erreur n'empêche ni la commande, ni le rangement d'un message. Les abonnements
// morts (téléphone changé, alertes retirées) sont supprimés tout seuls.
// 15/11/2026 (maquette Niv Admin) : le gérant choisit ce qui sonne (type), des heures calmes
// (sauf litige) et le chiffre posé sur l'icône de l'application (badge).
import { getPushKeys, listPushSubs, removePushSub, getSettings } from "@/lib/stock";
import { BRAND } from "@/lib/email";
import { reglageTelephone, dansHeuresCalmes } from "@/lib/notifTelephone";

async function chiffreIcone(regl) {
  if (regl.badge === "rien") return 0;
  try {
    if (regl.badge === "messages") {
      const { getAdminCountsData } = await import("@/lib/stock");
      const c = await getAdminCountsData();
      return (c.unread || 0) + (c.replies || 0);
    }
    const { getSiteOrders } = await import("@/lib/firebase");
    const orders = await getSiteOrders(300);
    return (orders || []).filter((x) => !x.test && !x.rattacheA?.id && (!x.status || x.status === "a_preparer")).length;
  } catch { return undefined; }
}

export async function envoyerAlerteAdmin({ title, body = "", url = "/gestion", tag = "", type = "", urgent = false }) {
  try {
    let regl = reglageTelephone(null);
    try { regl = reglageTelephone((await getSettings())?.notifications); } catch { /* réglages par défaut */ }
    if (type && regl[type] === false) return { envoyees: 0, coupe: "type" };
    if (type !== "litige" && !urgent && dansHeuresCalmes(regl, new Date())) return { envoyees: 0, coupe: "calme" };
    const subs = await listPushSubs();
    if (!subs.length) return { envoyees: 0 };
    const keys = await getPushKeys(false);
    if (!keys) return { envoyees: 0 };
    const { default: webpush } = await import("web-push");
    webpush.setVapidDetails(`mailto:${BRAND.contact || "contact@nivcreation.fr"}`, keys.publicKey, keys.privateKey);
    const badge = await chiffreIcone(regl);
    const payload = JSON.stringify({ title: String(title || "Niv Création").slice(0, 120), body: String(body).slice(0, 240), url, tag: tag || undefined, badge });
    let envoyees = 0;
    await Promise.all(subs.map(async (s) => {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 24 * 3600 }); envoyees++; }
      catch (e) { if (e?.statusCode === 404 || e?.statusCode === 410) { try { await removePushSub(s.sub.endpoint); } catch { /* ignore */ } } }
    }));
    return { envoyees };
  } catch { return { envoyees: 0 }; }
}
