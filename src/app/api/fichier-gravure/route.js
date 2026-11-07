// Fichier à graver (SVG, lettres en tracés) d'un texte dans une autre langue, 07/11/2026.
// /api/fichier-gravure?l=ta&t=<texte>&d=<date>&nom=<nom du fichier>  — ne fabrique qu'un dessin de texte.
import { svgGravure } from "@/lib/fichierGravure";
import { langueDe } from "@/lib/traductionGravure";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req) {
  const u = new URL(req.url);
  const l = u.searchParams.get("l") || "";
  if (!langueDe(l)?.police) return new Response("Langue sans écriture propre", { status: 400 });
  const t = (u.searchParams.get("t") || "").slice(0, 200);
  const d = (u.searchParams.get("d") || "").slice(0, 60);
  const w = Math.min(400, Math.max(10, Number(u.searchParams.get("w")) || 60));
  const h = Math.min(400, Math.max(5, Number(u.searchParams.get("h")) || 30));
  const nom = (u.searchParams.get("nom") || "gravure.svg").replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 120);
  let svg = null, erreur = "";
  try { svg = await svgGravure({ lignes: [t, d], langue: l, largeurMm: w, hauteurMm: h }); } catch (e) { erreur = String(e?.message || e).slice(0, 120); console.error("Fichier à graver:", erreur); }
  if (!svg) return new Response("Fichier indisponible pour l'instant, réessayez.", { status: 503, headers: { "X-Raison": encodeURIComponent(erreur || "polices") } });
  const telecharger = u.searchParams.get("voir") !== "1";
  return new Response(svg, { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
    ...(telecharger ? { "Content-Disposition": `attachment; filename="${nom.endsWith(".svg") ? nom : nom + ".svg"}"` } : {}),
  } });
}
