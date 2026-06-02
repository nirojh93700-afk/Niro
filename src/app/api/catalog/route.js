import { getImageOverrides, getPromos } from "@/lib/stock";

// Photos + promotions ajoutées depuis l'admin (lecture publique).
export const dynamic = "force-dynamic";

export async function GET() {
  const [images, promos] = await Promise.all([getImageOverrides(), getPromos()]);
  return Response.json({ images, promos });
}
