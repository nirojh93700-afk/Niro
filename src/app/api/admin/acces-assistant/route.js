import {
  isAdmin, roleAdminKey, assistantInfo, setAssistantPassword, couperAssistant,
  getDemandesAssistant, accepterDemandeAssistant, finirDemandeAssistant, refuserDemandeAssistant,
} from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Réglages › Accès de l'assistant (19/11/2026). RÉSERVÉ AU GÉRANT (voir droitsAssistant.js : « acces-assistant »).
// GET : l'accès est-il ouvert, les demandes qui attendent son feu vert, les refus et ce que l'assistant a fait.
// POST { action: "definir", motDePasse } · { action: "couper" } · { action: "accepter", id } · { action: "refuser", id }.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Réservé au gérant." }, { status: 401 });
  const [info, d] = await Promise.all([assistantInfo(), getDemandesAssistant()]);
  const demandes = d.demandes.slice().reverse().map(({ rejeu, ...e }) => e);
  return Response.json({ ...info, demandes, refus: d.refus.slice().reverse(), faits: d.faits.slice().reverse() });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Réservé au gérant." }, { status: 401 });
  let body = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const action = String(body?.action || "");

  if (action === "definir") {
    const pw = typeof body.motDePasse === "string" ? body.motDePasse : "";
    if (pw.length < 16) return Response.json({ error: "Le mot de passe de l'assistant doit faire au moins 16 caractères." }, { status: 400 });
    if (pw.length > 200) return Response.json({ error: "Mot de passe trop long." }, { status: 400 });
    if ((await roleAdminKey(pw)) === "gerant") return Response.json({ error: "C'est votre mot de passe : choisissez-en un autre pour l'assistant." }, { status: 400 });
    const at = await setAssistantPassword(pw);
    return Response.json({ ok: true, at });
  }

  if (action === "couper") {
    await couperAssistant();
    return Response.json({ ok: true });
  }

  if (action === "refuser") {
    await refuserDemandeAssistant(String(body.id || ""));
    return Response.json({ ok: true });
  }

  if (action === "accepter") {
    const r = await rejouer(req, String(body.id || ""));
    if (!r) return Response.json({ error: "Demande introuvable, déjà traitée ou trop grosse pour être rejouée." }, { status: 404 });
    return Response.json(r, { status: r.ok ? 200 : 502 });
  }

  // « Tout accepter » pour un même motif (ex. les mails de la cagnotte, une demande par cliente), dans l'ordre.
  if (action === "accepterTout") {
    const motif = String(body.motif || "");
    const d = await getDemandesAssistant();
    const ids = d.demandes.filter((e) => e.statut === "attente" && !e.tropGros && (!motif || e.motif === motif)).map((e) => e.id);
    let faits = 0, echecs = 0;
    for (const id of ids) {
      const r = await rejouer(req, id);
      if (r?.ok) faits++; else echecs++;
    }
    return Response.json({ ok: echecs === 0, faits, echecs });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}

async function rejouer(req, id) {
  const r = await accepterDemandeAssistant(id);
  if (!r) return null;
  const { demande, jeton } = r;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/+$/, "");
  let ok = false, texte = "";
  try {
    const res = await fetch(base + demande.chemin, {
      method: demande.methode,
      headers: { "Content-Type": "application/json", "x-admin-key": jeton },
      body: demande.corps == null ? undefined : JSON.stringify(demande.corps),
      cache: "no-store",
    });
    texte = (await res.text()).slice(0, 300);
    ok = res.ok;
  } catch (e) { texte = String(e?.message || e); }
  await finirDemandeAssistant(demande.id, { ok, texte });
  return { ok, resultat: texte };
}
