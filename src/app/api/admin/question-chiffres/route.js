// Gestion → Finances → Ventes → « Posez une question sur vos chiffres » (08/11/2026).
// POST { question } (admin) → agrégats calculés sur les vraies commandes (lecture seule) → Claude.
import { isAdmin } from "@/lib/stock";
import { getSiteOrders } from "@/lib/firebase";
import { getCatalogAdmin } from "@/lib/catalog";
import { agregats, repondre } from "@/lib/questionChiffres";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const vus = new Map(); // garde-fou simple : 30 questions / 10 min par adresse IP
function tropDeDemandes(ip) {
  const t = Date.now();
  const l = (vus.get(ip) || []).filter((x) => t - x < 600_000);
  l.push(t); vus.set(ip, l);
  return l.length > 30;
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ ok: false, error: "Accès refusé." }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: "La clé Claude du site (ANTHROPIC_API_KEY) n'est pas configurée : la question ne peut pas être posée." }, { status: 503 });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 }); }
  const question = String(body?.question || "").trim().slice(0, 400);
  if (question.length < 2) return Response.json({ ok: false, error: "Écrivez une question." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (tropDeDemandes(ip)) return Response.json({ ok: false, error: "Trop de questions d'un coup : patientez quelques minutes." }, { status: 429 });

  const [orders, catalog] = await Promise.all([
    getSiteOrders(500).catch(() => null),
    getCatalogAdmin().catch(() => []),
  ]);
  const ag = agregats(orders || [], catalog || []);
  const r = await repondre(question, ag);
  if (!r.ok) return Response.json({ ok: false, error: r.raison || "Réponse impossible." }, { status: 502 });
  return Response.json({ ok: true, texte: r.texte, barres: r.barres, source: r.source, commandesLues: ag.nbCommandesLues });
}
