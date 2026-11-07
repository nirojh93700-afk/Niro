// Écriture d'une langue de gravure pour l'aperçu de la fiche (07/11/2026) : seulement les lettres du texte.
import { sousEnsemble, FAMILLES } from "@/lib/policeGravure";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const u = new URL(req.url);
  const l = u.searchParams.get("l") || "";
  const t = (u.searchParams.get("t") || "").slice(0, 300);
  if (!FAMILLES[l] || l === "latin") return new Response("", { status: 404 });
  const buf = await sousEnsemble(l, t);
  if (!buf) return new Response("", { status: 404 });
  return new Response(buf, { headers: { "Content-Type": "font/ttf", "Cache-Control": "public, max-age=31536000, immutable" } });
}
