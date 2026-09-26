import { isAdmin, getProspectsAll, upsertProspects, updateProspect, deleteProspect, getCommsFor, prospectPourEnvoi, markProspectSent, logComm } from "@/lib/stock";
import { lireListe, PROSPECTS_LOT1, PROSPECTS_LOT2, PROSPECTS_LOT3, PROSPECT_STATUTS, PROSPECT_SUJET, messageProspect } from "@/lib/prospects";
import { sendClientMail, brandedMessage, boutonRepondre } from "@/lib/clientMail";
import { BRAND } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Combien d'envois au maximum par appel de "envoyer-tous" (le bouton rappelle
// l'action toute seule tant qu'il en reste — évite qu'un très gros lot dépasse
// le temps d'une requête serveur).
const ENVOI_LOT = 12;

// =============================================================================
// GESTION → CLIENTS → RESTAURANTS & BARS (prospection B2B, 26/09/2026).
// GET              → liste + chiffres clés (+ ?email= : le fil complet de l'établissement)
// POST {action}    → "import" {texte} · "lot1" · "lot2" · "update" {email, …} · "delete" {email}
//                    · "envoyer-tous" (LE SEUL qui envoie réellement — voir plus bas)
// AUCUN e-mail ne part d'ici EN DEHORS de « envoyer-tous », déclenché par le
// gérant depuis Gestion → Restaurants & bars, jamais tout seul (pas de cron).
// =============================================================================
export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const email = new URL(req.url).searchParams.get("email");
  if (email) {
    const dossier = await getCommsFor(email).catch(() => ({ messages: [] }));
    return Response.json({ messages: dossier.messages || [] });
  }
  const all = await getProspectsAll();
  const rows = Object.entries(all).map(([e, p]) => ({
    email: e, name: p.name || "", ville: p.ville || "", type: p.type || "", source: p.source || "",
    verifie: Boolean(p.verifie), statut: p.statut || "a_contacter", note: p.note || "",
    envoyeAt: p.envoyeAt || 0, nbEnvois: p.nbEnvois || 0, reponduAt: p.reponduAt || 0,
    nonLu: Boolean(p.nonLu), reponses: (p.reponses || []).slice(-5), ajouteAt: p.ajouteAt || 0,
  }));
  // Réponses non lues d'abord, puis les plus récentes, puis par ville.
  rows.sort((a, b) => (b.nonLu - a.nonLu) || ((b.reponduAt || b.envoyeAt) - (a.reponduAt || a.envoyeAt)) || a.ville.localeCompare(b.ville) || a.name.localeCompare(b.name));
  const n = (f) => rows.filter(f).length;
  return Response.json({
    rows,
    statuts: PROSPECT_STATUTS,
    kpis: {
      total: rows.length,
      aVerifier: n((r) => !r.verifie && r.statut === "a_contacter"),
      envoyes: n((r) => r.nbEnvois > 0),
      repondu: n((r) => r.statut === "repondu"),
      invalides: n((r) => r.statut === "invalide"),
      nonLus: n((r) => r.nonLu),
      stop: n((r) => r.statut === "stop"),
    },
  });
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const action = String(body?.action || "");
  if (action === "lot1") return Response.json({ ok: true, ...(await upsertProspects(PROSPECTS_LOT1)) });
  if (action === "lot2") return Response.json({ ok: true, ...(await upsertProspects(PROSPECTS_LOT2)) });
  if (action === "lot3") return Response.json({ ok: true, ...(await upsertProspects(PROSPECTS_LOT3)) });
  if (action === "import") {
    const list = lireListe(body?.texte);
    if (!list.length) return Response.json({ error: "Aucune adresse e-mail trouvée dans le texte collé." }, { status: 400 });
    return Response.json({ ok: true, lus: list.length, ...(await upsertProspects(list)) });
  }
  if (action === "update") {
    const p = await updateProspect(body?.email, body || {});
    if (!p) return Response.json({ error: "Établissement introuvable." }, { status: 404 });
    if (p.error) return Response.json({ error: p.error }, { status: 400 });
    return Response.json({ ok: true });
  }
  if (action === "delete") {
    return (await deleteProspect(body?.email)) ? Response.json({ ok: true }) : Response.json({ error: "Établissement introuvable." }, { status: 404 });
  }
  // ---------------------------------------------------------------------
  // ENVOI GROUPÉ — le seul geste qui envoie réellement, déclenché par le
  // gérant (bouton « Envoyer à tous »). Envoie SEULEMENT aux établissements
  // « à contacter » ET marqués « adresse vérifiée » — jamais aux autres, jamais
  // deux fois (un envoi passe l'établissement en « E-mail envoyé »). Le front
  // rappelle cette action tant qu'il reste des adresses (ENVOI_LOT à la fois).
  // ---------------------------------------------------------------------
  if (action === "envoyer-tous") {
    // Lecture FRAÎCHE obligatoire (incident du 26/09 : deux appels rapprochés
    // arrivant sur deux instances serveur différentes voyaient chacun le cache
    // local de 60 s, pas encore averti de l'envoi fait par l'autre — 20
    // établissements ont reçu le message deux fois avant ce correctif).
    const all = await getProspectsAll(true);
    const aFaire = Object.entries(all)
      .filter(([, p]) => p.statut === "a_contacter" && p.verifie)
      .slice(0, ENVOI_LOT);
    const envoyes = [], echecs = [];
    for (const [email, p] of aFaire) {
      // Revérifié juste avant l'envoi (au cas où l'établissement aurait
      // répondu STOP entre-temps, depuis un autre onglet).
      const check = await prospectPourEnvoi(email).catch(() => null);
      if (check?.stop) continue;
      const subject = PROSPECT_SUJET;
      const texte = messageProspect(p.name, { type: p.type, ville: p.ville });
      const btn = await boutonRepondre({ email, name: p.name, subject, excerpt: texte.slice(0, 240) });
      const html = brandedMessage(subject, texte, btn);
      const r = await sendClientMail({ to: email, subject, html, bcc: BRAND.contact });
      if (r?.ok) {
        try { await markProspectSent(email, { threadId: r.threadId }); } catch { /* ignore */ }
        try { await logComm({ email, name: p.name, from: "nous", text: texte, subject, via: "prospection" }); } catch { /* ignore */ }
        envoyes.push(email);
      } else {
        echecs.push({ email, error: r?.error || "échec" });
      }
    }
    const restantes = Object.values(await getProspectsAll(true)).filter((p) => p.statut === "a_contacter" && p.verifie).length;
    return Response.json({ ok: true, envoyes, echecs, restantes });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
