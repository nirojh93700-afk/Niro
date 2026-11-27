import { isAdmin, getJobNote } from "@/lib/stock";
import { syncRemboursementsStripe } from "@/lib/remboursementsStripe";

// Remboursements faits directement dans Stripe (27/11/2026) : Gestion les relit pour que les Bénéfices,
// les Ventes et le montant à déclarer ne comptent plus ce qui a été rendu.
//   GET  → ce que Stripe a remboursé et que Gestion ne sait pas encore (lecture seule, rien n'est écrit)
//   POST → met les commandes à jour maintenant (le battement le fait aussi, une fois par heure)
// Aucun remboursement n'est fait ici, aucun e-mail ne part.
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  try {
    const r = await syncRemboursementsStripe({ dryRun: true });
    return Response.json({ ...r, dernierPassage: await getJobNote("remboursementsStripe", true).catch(() => null) });
  } catch (e) { return Response.json({ ok: false, erreur: "Stripe n'a pas répondu : " + (e.message || "erreur") }, { status: 200 }); }
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  try { return Response.json(await syncRemboursementsStripe()); }
  catch (e) { return Response.json({ ok: false, erreur: "Stripe n'a pas répondu : " + (e.message || "erreur") }, { status: 200 }); }
}
