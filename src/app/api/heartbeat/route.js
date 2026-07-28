import { maybeRunJobs } from "@/lib/heartbeat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Déclencheur automatique des tâches (messages programmés, règles auto, rappels
// de cagnotte, anniversaires). Appelé discrètement par le site à la visite.
// Aucun secret nécessaire : la route ne fait QUE des tâches throttlées (elle
// n'accepte aucune commande), donc l'appeler souvent ne fait rien de plus.
export async function GET() {
  try {
    const r = await maybeRunJobs();
    return Response.json({ ok: true, ran: r });
  } catch (e) {
    return Response.json({ ok: false, error: e.message });
  }
}
