import { getImageOverrides, getPromos } from "@/lib/stock";
import { stripBijouxPromos } from "@/lib/catalog";

// Photos + promotions ajoutées depuis l'admin (lecture publique).
export const dynamic = "force-dynamic";

export async function GET() {
  const [images, rawPromos] = await Promise.all([getImageOverrides(), getPromos()]);
  const promos = await stripBijouxPromos(rawPromos); // bijoux : remise permanente uniquement
  return Response.json({ images, promos });
}
