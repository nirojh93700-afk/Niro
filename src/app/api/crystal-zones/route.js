import { getSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

// Lecture publique des zones de gravure des cristaux (réglées dans l'admin).
// Sert à l'aperçu côté client. Renvoie {} si rien n'est réglé (repli sur le cristal dessiné).
export async function GET() {
  try {
    const s = await getSettings();
    return Response.json({ zones: s?.crystalZones || {}, textZones: s?.motifTextZones || {} });
  } catch {
    return Response.json({ zones: {}, textZones: {} });
  }
}
