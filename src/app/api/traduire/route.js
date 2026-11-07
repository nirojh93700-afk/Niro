// Traduction en direct du texte à graver (fiche produit), 07/11/2026.
// Public : texte court seulement, 40 traductions / 10 min par adresse IP. Jamais bloquant :
// en cas d'échec la fiche dit « La traduction n'a pas répondu, réessayez ».
import { traduireGravure } from "@/lib/traductionServeur";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const vus = new Map();
function tropDeDemandes(ip) {
  const t = Date.now();
  const l = (vus.get(ip) || []).filter((x) => t - x < 600_000);
  l.push(t); vus.set(ip, l);
  return l.length > 40;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }); }
  const texte = String(body?.texte || "").slice(0, 120);
  const langue = String(body?.langue || "");
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (tropDeDemandes(ip)) return Response.json({ ok: false, raison: "trop" });
  const r = await traduireGravure(texte, langue);
  return Response.json({ ok: Boolean(r.ok), texte: r.texte || "", source: r.source || "" });
}
