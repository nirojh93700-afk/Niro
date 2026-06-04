import { getCustomerUpload } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// Sert une photo téléversée (stockée en data URL dans Firebase) comme une
// vraie image, accessible via une URL : /api/img/<id>.
export async function GET(_req, { params }) {
  const { id } = await params;
  const dataUrl = await getCustomerUpload(id);
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return new Response("Not found", { status: 404 });
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return new Response("Invalid", { status: 400 });
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
