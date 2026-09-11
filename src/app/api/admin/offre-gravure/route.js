import { isAdmin, getSettings, getPromoCodes } from "@/lib/stock";
import { runOffreGravureJob } from "@/lib/jobs";
import { offreActive } from "@/lib/offreGravure";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// OFFRE « GRAVURE OFFERTE » — état + envoi à la demande
// GET  : réglages, offre ouverte ou non, et le compte des destinataires
//        (éligibles / en attente des 3 jours / déjà servies). Ne touche à rien.
// POST : { action:"send" } → envoie MAINTENANT aux éligibles. Réservé au clic
//        du gérant : rien ne part de soi-même en dehors du battement du site.
// =============================================================================
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const s = await getSettings();
  const offre = s.gravureOfferte || {};
  const compte = await runOffreGravureJob({ dryRun: true });
  let codeExiste = false;
  try {
    const codes = await getPromoCodes();
    codeExiste = Boolean(codes[String(offre.code || "").toUpperCase()]);
  } catch { /* ignore */ }
  return Response.json({ offre, ouverte: Boolean(offreActive(offre)), codeExiste, ...compte });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide accepté */ }
  if (body?.action !== "send") return Response.json({ error: "Action inconnue." }, { status: 400 });
  const s = await getSettings();
  if (!offreActive(s.gravureOfferte)) {
    return Response.json({ error: "L'offre n'est pas active : activez-la et enregistrez d'abord." }, { status: 400 });
  }
  const r = await runOffreGravureJob();
  return Response.json({ ok: true, ...r });
}
