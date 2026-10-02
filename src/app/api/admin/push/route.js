import { isAdmin, getPushKeys, addPushSub, removePushSub, listPushSubs } from "@/lib/stock";
import { envoyerAlerteAdmin } from "@/lib/pushAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alertes sur le téléphone du gérant (02/10/2026).
// GET  → clé publique + nombre d'appareils abonnés.
// POST { action:"subscribe", subscription, appareil } · { action:"unsubscribe", endpoint } · { action:"test" }
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const keys = await getPushKeys(true);
  const subs = await listPushSubs();
  return Response.json({ publicKey: keys.publicKey, appareils: subs.map((s) => ({ endpoint: s.sub.endpoint, appareil: s.appareil, at: s.at })) });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* vide */ }
  if (body.action === "subscribe") {
    const ok = await addPushSub(body.subscription, body.appareil);
    if (!ok) return Response.json({ error: "Abonnement invalide." }, { status: 400 });
    return Response.json({ ok: true });
  }
  if (body.action === "unsubscribe") {
    await removePushSub(String(body.endpoint || ""));
    return Response.json({ ok: true });
  }
  if (body.action === "test") {
    const r = await envoyerAlerteAdmin({ title: "🔔 Alertes activées", body: "Vous recevrez ici chaque nouvelle commande et chaque réponse de cliente.", url: "/gestion", tag: "test" });
    return Response.json({ ok: true, ...r });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
