import { getSettings } from "@/lib/stock";
import { CRYSTAL_ZONES_LOCK } from "@/lib/crystalZonesLock";

export const dynamic = "force-dynamic";

// Lecture publique des zones de gravure des cristaux (réglées dans l'admin).
// Sert à l'aperçu côté client. Renvoie {} si rien n'est réglé (repli sur le cristal dessiné).
export async function GET() {
  try {
    const s = await getSettings();
    // Les réglages CRISTAL verrouillés (code) priment sur la base → ne se dérèglent plus.
    // Les verres/carafe restent pilotés par l'admin (base de données).
    const zones = { ...(s?.crystalZones || {}), ...CRYSTAL_ZONES_LOCK };
    return Response.json({ zones, textZones: s?.motifTextZones || {} });
  } catch {
    return Response.json({ zones: { ...CRYSTAL_ZONES_LOCK }, textZones: {} });
  }
}
