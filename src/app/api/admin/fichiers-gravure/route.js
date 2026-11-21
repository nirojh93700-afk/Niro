// Gestion › Commandes › Fichiers à graver (21/11/2026) : décisions du gérant sur les SVG préparés par l'agent.
// GET  → toutes les décisions (ou ?orderId= pour une commande).
// POST { action:"valider", orderId, ref, imageId, src, largeurMm, cadre:{w,h}, paths:[d…] } → SVG enregistré, rangé dans la commande.
// POST { action:"refuser", orderId, ref, imageId } → « pas besoin ». POST { action:"annuler", orderId, imageId } → décision retirée.
import { isAdmin, getFichiersGravure, setFichierGravure } from "@/lib/stock";
import { storeCustomerUpload } from "@/lib/firebase";
import { svgGravure, D_VALIDE } from "@/lib/traceurGravure";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  const tout = await getFichiersGravure(true);
  const oid = new URL(req.url).searchParams.get("orderId");
  return Response.json({ ok: true, fichiers: oid ? { [oid]: tout[oid] || null } : tout });
}

export async function POST(req) {
  if (!(await isAdmin(req))) return Response.json({ error: "Accès refusé." }, { status: 401 });
  let b;
  try { b = await req.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const { action, orderId, ref, imageId } = b || {};
  try {
    if (action === "refuser") {
      return Response.json({ ok: true, commande: await setFichierGravure(orderId, imageId, ref, { statut: "refuse", src: String(b.src || "").slice(0, 200) }) });
    }
    if (action === "annuler") {
      return Response.json({ ok: true, commande: await setFichierGravure(orderId, imageId, ref, null) });
    }
    if (action === "valider") {
      const paths = Array.isArray(b.paths) ? b.paths.map(String) : [];
      const total = paths.reduce((a, d) => a + d.length, 0);
      if (!paths.length || total > 3_500_000 || !paths.every((d) => D_VALIDE.test(d))) return Response.json({ error: "Tracé invalide." }, { status: 400 });
      const largeurMm = Math.max(5, Math.min(400, Number(b.largeurMm) || 50));
      const svg = svgGravure(paths, b.cadre, largeurMm);
      const svgId = await storeCustomerUpload("data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64"), { kind: "svgGravure", orderId: String(orderId || "").slice(0, 120) });
      if (!svgId) return Response.json({ error: "Enregistrement du fichier impossible." }, { status: 500 });
      const commande = await setFichierGravure(orderId, imageId, ref, { statut: "valide", svgId, largeurMm, src: String(b.src || "").slice(0, 200) });
      return Response.json({ ok: true, svgId, commande });
    }
    return Response.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message || "Erreur." }, { status: 400 });
  }
}
