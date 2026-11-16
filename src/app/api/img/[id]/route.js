import { getCustomerUpload } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Sert une photo téléversée (stockée en data URL dans Firebase) comme une
// vraie image, accessible via une URL : /api/img/<id>.
export async function GET(req, { params }) {
  const { id } = await params;
  const dataUrl = await getCustomerUpload(id);
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return new Response("Not found", { status: 404 });
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return new Response("Invalid", { status: 400 });
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  // ?dl=<nom> : l'image est ENREGISTRÉE (bouton « Télécharger » de Gestion, 16/11/2026 ; sur iPhone un simple
  // lien ouvre l'image au lieu de la télécharger). Nom nettoyé, extension tirée du type de l'image.
  const dl = new URL(req.url).searchParams.get("dl");
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" }[mime] || "img";
  const nom = dl ? String(dl).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "image" : "";
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": mime,
      ...(nom ? { "Content-Disposition": `attachment; filename="${nom}.${ext}"` } : {}),
      "Cache-Control": "public, max-age=31536000, immutable",
      // CORS : permet d'utiliser la photo dans un canvas (compo du verre) sans
      // « contaminer » le canvas sur iOS.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
