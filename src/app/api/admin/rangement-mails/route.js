import { isAdmin } from "@/lib/stock";
import { runRangementMails, lireRangementMails } from "@/lib/rangementMails";

export const dynamic = "force-dynamic";

// GET  → compte rendu du dernier rangement des mails (fait chaque soir dès 21 h).
// POST → « Ranger maintenant » : un lot tout de suite (à relancer tant que fini = false).
// Gmail en lecture seule ; rien n'est envoyé à une cliente.
export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const r = await lireRangementMails();
  return Response.json({ ok: true, rangement: r ? { ...r, faits: (r.faits || []).length } : null });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const r = await runRangementMails({ force: true });
  return Response.json({ ok: true, rangement: { ...r, faits: (r.faits || []).length } });
}
