import { isAdmin, getProspectsAll, upsertProspects, updateProspect, deleteProspect, getCommsFor } from "@/lib/stock";
import { lireListe, PROSPECTS_LOT1, PROSPECTS_LOT2, PROSPECT_STATUTS } from "@/lib/prospects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =============================================================================
// GESTION → CLIENTS → RESTAURANTS & BARS (prospection B2B, 26/09/2026).
// GET              → liste + chiffres clés (+ ?email= : le fil complet de l'établissement)
// POST {action}    → "import" {texte} · "lot1" · "lot2" · "update" {email, …} · "delete" {email}
// AUCUN e-mail ne part d'ici : l'envoi passe par Messages clients (bouton « Écrire »).
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
  if (action === "import") {
    const list = lireListe(body?.texte);
    if (!list.length) return Response.json({ error: "Aucune adresse e-mail trouvée dans le texte collé." }, { status: 400 });
    return Response.json({ ok: true, lus: list.length, ...(await upsertProspects(list)) });
  }
  if (action === "update") {
    const p = await updateProspect(body?.email, body || {});
    return p ? Response.json({ ok: true }) : Response.json({ error: "Établissement introuvable." }, { status: 404 });
  }
  if (action === "delete") {
    return (await deleteProspect(body?.email)) ? Response.json({ ok: true }) : Response.json({ error: "Établissement introuvable." }, { status: 404 });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
