import { getStockMap } from "@/lib/stock";

// Lecture publique du stock (pour les badges "épuisé" côté boutique).
export const dynamic = "force-dynamic";

export async function GET() {
  const map = await getStockMap();
  return Response.json({ stock: map });
}
