import { getModelFile } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Sert un fichier 3D téléversé (stocké dans Netlify Blobs).
export async function GET(_req, { params }) {
  const { id } = await params;
  const file = await getModelFile(id);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.data, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
