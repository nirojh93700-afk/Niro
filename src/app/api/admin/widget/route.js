import { getBatThreadsMeta } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Données compactes pour le widget iPhone (Scriptable). Protégé par le mot de
// passe admin, transmis en en-tête `x-admin-key` OU en paramètre `?key=`
// (plus simple depuis Scriptable). Ne renvoie que des chiffres + un aperçu des
// dernières commandes — rien de sensible au-delà de ce que la gérante voit déjà.
function authed(req) {
  const url = new URL(req.url);
  const key = req.headers.get("x-admin-key") || url.searchParams.get("key") || "";
  return Boolean(process.env.ADMIN_PASSWORD) && key === process.env.ADMIN_PASSWORD;
}

const PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const dayKey = (ts) => { try { return PARIS.format(new Date(ts)); } catch { return ""; } };

export async function GET(req) {
  if (!authed(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });

  const orders = (await getSiteOrders(300)) || [];
  const now = Date.now();
  const todayStr = PARIS.format(new Date(now));
  const monthStr = todayStr.slice(3); // "MM/YYYY"

  const real = orders.filter((o) => !o.test);
  const active = (o) => !["annulee", "remboursee"].includes(o.status);

  const today = real.filter((o) => dayKey(o.createdAt) === todayStr && active(o));
  const monthOrders = real.filter((o) => dayKey(o.createdAt).slice(3) === monthStr && active(o));
  const sum = (arr) => arr.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const aPreparer = real.filter((o) => active(o) && (!o.status || o.status === "a_preparer")).length;
  const enGravure = real.filter((o) => o.status === "en_gravure").length;
  let newMessages = 0;
  try { newMessages = (await getBatThreadsMeta()).filter((m) => m.clientUnread).length; } catch { /* ignore */ }

  const statusLabel = (o) => o.status === "livree" ? "Livrée" : o.status === "expediee" ? "Expédiée"
    : o.status === "en_gravure" ? "En fabrication" : o.status === "annulee" ? "Annulée"
    : o.status === "remboursee" ? "Remboursée" : "À préparer";

  const recent = real.slice(0, 8).map((o) => ({
    ref: o.ref || (o.id || "").slice(-6),
    total: Number(o.total) || 0,
    name: o.customerName || "—",
    status: statusLabel(o),
    immediate: Boolean(o.immediateStart),
    when: dayKey(o.createdAt),
  }));

  return Response.json({
    ok: true,
    updatedAt: now,
    todayCount: today.length,
    todaySales: Math.round(sum(today) * 100) / 100,
    monthCount: monthOrders.length,
    monthSales: Math.round(sum(monthOrders) * 100) / 100,
    aPreparer,
    enGravure,
    newMessages,
    recent,
  });
}
