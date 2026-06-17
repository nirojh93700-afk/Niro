import { getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Lecture publique des positions de gravure des couverts (réglées dans l'admin).
// Sert à l'éditeur côté client. Renvoie {} si rien n'est réglé (le code prend le relais).
export async function GET() {
  try {
    const s = await getSettings();
    return Response.json({ zones: s?.couvertsZones || {} });
  } catch {
    return Response.json({ zones: {} });
  }
}
