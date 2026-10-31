// Envois programmés « N jours après la livraison » (31/10/2026). GET = liste ; POST {action:"add", items} = programmer ;
// POST {action:"annuler", id} = retirer un envoi encore en attente.
import { isAdmin, getEnvoisApresLivraison, addEnvoisApresLivraison, majEnvoiApresLivraison } from "@/lib/stock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const tous = await getEnvoisApresLivraison(true);
  return Response.json({ envois: Object.entries(tous).map(([id, e]) => ({ id, ...e, message: undefined })) });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  if (body?.action === "add") return Response.json({ ok: true, ajoutes: await addEnvoisApresLivraison(body.items) });
  if (body?.action === "annuler") {
    const tous = await getEnvoisApresLivraison(true);
    if (tous[body.id]?.status !== "attente") return Response.json({ error: "Envoi introuvable ou déjà traité." }, { status: 400 });
    await majEnvoiApresLivraison(body.id, { status: "annule" });
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Action inconnue." }, { status: 400 });
}
