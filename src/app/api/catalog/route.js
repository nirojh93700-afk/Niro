import { getImageOverrides } from "@/lib/stock";

// Photos ajoutées depuis l'admin (lecture publique, pour la boutique).
export const dynamic = "force-dynamic";

export async function GET() {
  const images = await getImageOverrides();
  return Response.json({ images });
}
