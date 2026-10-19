import { isAdmin, getSettings, getPromoCodes, purgeExpiredPromoCodes, getJobNote, getOffreGravureSent, getCodeUsage, getLoginsAll } from "@/lib/stock";
import { connexionDepuis } from "@/lib/suiviConnexion";
import { getSiteOrders } from "@/lib/firebase";
import { runOffreGravureJob } from "@/lib/jobs";
import { offreActive, OFFRE_GRAVURE_JOURS } from "@/lib/offreGravure";

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
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const s = await getSettings();
  const offre = s.gravureOfferte || {};
  const compte = await runOffreGravureJob({ dryRun: true });
  // Depuis le 17/09/2026, chaque cliente reçoit SON code (préfixe + 5 caractères,
  // réservé à son adresse, une seule fois, qui meurt à la fin de l'offre). On
  // compte ici les codes nominatifs encore vivants et ceux à nettoyer.
  let codesNominatifs = 0, codesANettoyer = 0, codes = {};
  try {
    codes = await getPromoCodes();
    const now = Date.now();
    for (const def of Object.values(codes)) {
      if (!def?.email) continue;
      codesNominatifs++;
      if (def.expiresAt && now > def.expiresAt) codesANettoyer++;
    }
  } catch { /* ignore */ }
  let dernierPassage = null;
  try { dernierPassage = await getJobNote("offreGravure"); } catch { /* ignore */ }
  const suivi = await suiviDesCodes(codes);
  return Response.json({ offre, ouverte: Boolean(offreActive(offre)), codesNominatifs, codesANettoyer, dernierPassage, suivi, ...compte });
}

// SUIVI DES CODES (18/10/2026, maquette validée par le gérant) : une ligne par cliente servie —
// son adresse, son code, la date d'envoi, la date limite, et s'il a été utilisé (commande reliée,
// remise accordée). Le code est verrouillé sur l'adresse : « utilisé » = par sa destinataire.
async function suiviDesCodes(codes) {
  try {
    const [envoyes, usage, commandes, logins] = await Promise.all([
      getOffreGravureSent(), getCodeUsage().catch(() => ({})), getSiteOrders(1000).catch(() => []),
      getLoginsAll().catch(() => ({})),
    ]);
    // Journal des connexions à l'espace client, clé = e-mail en minuscules (18/10/2026).
    const parEmail = new Map(Object.entries(logins || {}).map(([k, v]) => [String(k).trim().toLowerCase(), v]));
    const parCode = new Map();
    for (const o of commandes || []) {
      for (const brut of [o.promoCode, o.promoCode2]) {
        const c = String(brut || "").trim().toUpperCase();
        if (c && !parCode.has(c)) parCode.set(c, o);
      }
    }
    const now = Date.now();
    return Object.entries(envoyes || {}).map(([email, v]) => {
      const at = typeof v === "number" ? v : Number(v?.at) || 0;
      const code = typeof v === "object" && v?.code ? String(v.code).toUpperCase() : "";
      const def = code ? codes[code] : null;
      const fin = def?.expiresAt || (at ? at + OFFRE_GRAVURE_JOURS * 86400000 : 0);
      const o = code ? parCode.get(code) : null;
      const utiliseSansCommande = !o && code && (usage[code]?.emails || []).length > 0;
      const etat = o || utiliseSansCommande ? "utilise" : fin && now > fin ? "expire" : "attente";
      const toTs = (x) => (x?.toMillis ? x.toMillis() : x?._seconds ? x._seconds * 1000 : Number(new Date(x)) || 0);
      return {
        email, code, at, fin, etat,
        connexion: connexionDepuis(parEmail.get(String(email).trim().toLowerCase()), at),
        commande: o ? {
          id: o.id, ref: o.ref || "", date: toTs(o.createdAt), remise: Number(o.discount) || 0, total: Number(o.total) || 0,
          produit: (o.items || [])[0]?.name || "",
        } : null,
      };
    }).sort((a, b) => (b.at || 0) - (a.at || 0));
  } catch (e) {
    console.error("Suivi des codes :", e.message);
    return [];
  }
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide accepté */ }
  // Nettoyage des codes nominatifs morts (expirés ou déjà utilisés). Les codes
  // ouverts (BIENVENUE10, ambassadeurs, codes à la main) ne sont jamais touchés.
  if (body?.action === "purge") {
    const r = await purgeExpiredPromoCodes();
    return Response.json({ ok: true, ...r });
  }
  // Envoi de TEST à une seule adresse (celle du gérant / de l'atelier) : même
  // e-mail, même code nominatif, mais rien n'est mémorisé et personne d'autre
  // ne reçoit quoi que ce soit. Renvoie l'erreur exacte si l'envoi échoue.
  if (body?.action === "test") {
    const to = String(body?.to || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return Response.json({ error: "Adresse invalide." }, { status: 400 });
    const s0 = await getSettings();
    if (!offreActive(s0.gravureOfferte)) return Response.json({ error: "L'offre n'est pas active." }, { status: 400 });
    const r = await runOffreGravureJob({ testTo: to });
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
