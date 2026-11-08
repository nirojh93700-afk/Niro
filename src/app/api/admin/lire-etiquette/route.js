// Lecture d'une étiquette d'expédition photographiée depuis le formulaire « Expédier » de
// Gestion (08/11/2026) : l'agent lit le numéro de suivi et le transporteur. Admin seulement.
// Ne modifie rien : le numéro lu est proposé dans le champ, le gérant confirme.
import { isAdmin } from "@/lib/stock";
import { lireEtiquette } from "@/lib/lectureEtiquette";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const vus = new Map(); // garde-fou simple : 10 lectures / 10 min par adresse IP
function tropDeDemandes(ip) {
  const t = Date.now();
  const l = (vus.get(ip) || []).filter((x) => t - x < 600_000);
  l.push(t); vus.set(ip, l);
  return l.length > 10;
}

export async function POST(req) {
  if (!(await isAdmin(req))) {
    return Response.json({ error: "Accès refusé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const dataUrl = String(body?.dataUrl || "");
  if (!dataUrl.startsWith("data:image/")) {
    return Response.json({ ok: false, raison: "image", error: "Photo manquante ou illisible." }, { status: 400 });
  }
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (tropDeDemandes(ip)) {
    return Response.json({ ok: false, raison: "limite", error: "Trop de lectures en peu de temps : patientez quelques minutes." }, { status: 429 });
  }
  const r = await lireEtiquette(dataUrl);
  return Response.json(r);
}
