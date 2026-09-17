import { isAdmin, getSettings, getPromoCodes, purgeExpiredPromoCodes } from "@/lib/stock";
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
  // Depuis le 17/09/2026, chaque cliente reçoit SON code (préfixe + 5 caractères,
  // réservé à son adresse, une seule fois, qui meurt à la fin de l'offre). On
  // compte ici les codes nominatifs encore vivants et ceux à nettoyer.
  let codesNominatifs = 0, codesANettoyer = 0;
  try {
    const codes = await getPromoCodes();
    const now = Date.now();
    for (const def of Object.values(codes)) {
      if (!def?.email) continue;
      codesNominatifs++;
      if (def.expiresAt && now > def.expiresAt) codesANettoyer++;
    }
  } catch { /* ignore */ }
  return Response.json({ offre, ouverte: Boolean(offreActive(offre)), codesNominatifs, codesANettoyer, ...compte });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide accepté */ }
  // Nettoyage des codes nominatifs morts (expirés ou déjà utilisés). Les codes
  // ouverts (BIENVENUE10, ambassadeurs, codes à la main) ne sont jamais touchés.
  if (body?.action === "purge") {
    const r = await purgeExpiredPromoCodes();
    return Response.json({ ok: true, ...r });
  }
  if (body?.action !== "send") return Response.json({ error: "Action inconnue." }, { status: 400 });
  const s = await getSettings();
  if (!offreActive(s.gravureOfferte)) {
    return Response.json({ error: "L'offre n'est pas active : activez-la et enregistrez d'abord." }, { status: 400 });
  }
  const r = await runOffreGravureJob();
  return Response.json({ ok: true, ...r });
}
