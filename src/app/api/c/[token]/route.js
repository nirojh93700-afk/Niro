import { recordEmailClick } from "@/lib/stock";
import { readTrackToken, safeRedirect } from "@/lib/emailTrack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lien tracé d'un e-mail de campagne : on note le clic, puis on redirige.
// La cliente ne voit qu'un passage instantané. En cas de pépin on redirige
// quand même : le clic ne doit JAMAIS mener à une page d'erreur.
export async function GET(req, { params }) {
  const url = new URL(req.url).searchParams.get("u") || "";
  const cible = safeRedirect(url);
  try {
    const t = readTrackToken(params?.token);
    if (t) await recordEmailClick(t.campaignId, t.email, cible);
  } catch { /* la redirection prime toujours */ }
  return Response.redirect(cible, 302);
}
