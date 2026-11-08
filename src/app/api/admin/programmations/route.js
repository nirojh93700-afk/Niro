// Programmations (08/11/2026) : GET la liste + ce qu'il faut pour le formulaire ; POST ajouter / annuler / supprimer / executer.
// Écriture : liste relue FRAÎCHE puis `setSettings({ programmations })` (fusion de clé, rien d'autre ne bouge).
import { isAdmin, getSettings, setSettings, getPromoCodes } from "@/lib/stock";
import { journaliser } from "@/lib/journal";
import { FETES } from "@/lib/fetes";
import { valider, libelle, produitsPourProgrammation, runProgrammations } from "@/lib/programmations";

export const dynamic = "force-dynamic";

function idAleatoire() {
  const alpha = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return "pg_" + s;
}

async function listeFraiche() {
  const s = await getSettings(true);
  return Array.isArray(s?.programmations) ? s.programmations : [];
}

function avecLibelle(liste, produits) {
  return liste.map((p) => ({ ...p, libelle: libelle(p, produits) }));
}

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const produits = produitsPourProgrammation();
  const [programmations, codes] = await Promise.all([listeFraiche(), getPromoCodes().catch(() => ({}))]);
  return Response.json({
    programmations: avecLibelle(programmations, produits),
    produits,
    fetes: FETES.map((f) => ({ k: f.k, nom: f.nom })),
    codes: Object.keys(codes || {}),
  });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const action = body?.action;
  const produits = produitsPourProgrammation();

  if (action === "ajouter") {
    const v = valider(body.programmation);
    if (!v.ok) return Response.json({ error: v.erreur }, { status: 400 });
    const p = { ...v.programmation, id: idAleatoire(), etat: "a_venir", creeLe: Date.now() };
    delete p.faitLe; delete p.erreur;
    const liste = await listeFraiche();
    const next = [...liste, p];
    await setSettings({ programmations: next });
    const lib = libelle(p, produits);
    journaliser({ type: "programmation", cible: p.cible || p.quoi, label: `Programmé : ${lib}`, avant: null, apres: lib, source: "programmations" }).catch(() => {});
    return Response.json({ ok: true, programmation: { ...p, libelle: lib }, programmations: avecLibelle(next, produits) });
  }

  if (action === "annuler") {
    const id = String(body.id || "");
    const liste = await listeFraiche();
    const p = liste.find((x) => x && x.id === id);
    if (!p) return Response.json({ error: "Programmation introuvable." }, { status: 404 });
    if (p.etat !== "a_venir") return Response.json({ error: "Cette programmation n'est plus à venir : elle ne peut pas être annulée." }, { status: 400 });
    const next = liste.map((x) => (x && x.id === id ? { ...x, etat: "annule", annuleLe: Date.now() } : x));
    await setSettings({ programmations: next });
    const lib = libelle(p, produits);
    journaliser({ type: "programmation", cible: p.cible || p.quoi, label: `Annulé : ${lib}`, avant: lib, apres: null, source: "programmations" }).catch(() => {});
    return Response.json({ ok: true, programmations: avecLibelle(next, produits) });
  }

  if (action === "supprimer") {
    const id = String(body.id || "");
    const liste = await listeFraiche();
    if (!liste.some((x) => x && x.id === id)) return Response.json({ error: "Programmation introuvable." }, { status: 404 });
    const next = liste.filter((x) => !(x && x.id === id));
    await setSettings({ programmations: next });
    return Response.json({ ok: true, programmations: avecLibelle(next, produits) });
  }

  if (action === "executer") {
    const r = await runProgrammations();
    const liste = await listeFraiche();
    return Response.json({ ok: true, ...r, programmations: avecLibelle(liste, produits) });
  }

  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
