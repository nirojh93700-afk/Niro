// Lecture en direct de l'image envoyée sur une fiche (26/10/2026) : l'agent dit s'il voit une date.
// Public (appelé par la fiche), mais ne lit QUE les photos téléversées sur le site (/api/img/<id>).
// Ne bloque jamais rien : en cas d'erreur, la fiche affiche simplement le choix de la cliente.
import { lireDateImage, idPhoto } from "@/lib/lectureImage";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const vus = new Map(); // garde-fou simple : 20 lectures / 10 min par adresse IP
function tropDeDemandes(ip) {
  const t = Date.now();
  const l = (vus.get(ip) || []).filter((x) => t - x < 600_000);
  l.push(t); vus.set(ip, l);
  return l.length > 20;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ verifiee: false }); }
  const url = String(body?.url || "");
  if (!idPhoto(url)) return Response.json({ verifiee: false });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  if (tropDeDemandes(ip)) return Response.json({ verifiee: false });
  const r = await lireDateImage(url);
  return Response.json({ verifiee: Boolean(r.verifiee), date: r.date || "", certain: r.certain !== false });
}
