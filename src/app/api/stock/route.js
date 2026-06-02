import { getStockMap } from "@/lib/stock";

// Lecture publique du stock (pour les badges "épuisé" côté boutique).
// Le stock est géré côté site (admin /gestion) — fiable et indépendant.
export const dynamic = "force-dynamic";

export async function GET() {
  const map = await getStockMap();
  return Response.json({ stock: map });
}
