import { isAdmin, saveModelFile } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Reçoit un fichier 3D (.glb / .gltf) depuis l'admin et le stocke.
// Renvoie l'URL interne /api/model3d/<id> à enregistrer comme modèle du produit.
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Accès refusé." }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }
    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".glb") && !name.endsWith(".gltf")) {
      return Response.json({ error: "Format non supporté. Utilisez un fichier .glb (recommandé) ou .gltf." }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "Fichier trop lourd (25 Mo maximum)." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const type = name.endsWith(".gltf") ? "model/gltf+json" : "model/gltf-binary";
    const id = await saveModelFile(buf, type);
    if (!id) return Response.json({ error: "Stockage indisponible (vérifiez Netlify)." }, { status: 503 });
    return Response.json({ ok: true, url: "/api/model3d/" + id });
  } catch {
    return Response.json({ error: "Envoi impossible, réessayez." }, { status: 500 });
  }
}
