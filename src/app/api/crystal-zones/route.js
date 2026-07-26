import { getSettings } from "@/lib/stock";
import { CRYSTAL_ZONES_LOCK } from "@/lib/crystalZonesLock";

export const dynamic = "force-dynamic";

// Lecture publique des zones de gravure des cristaux (réglées dans l'admin).
// Sert à l'aperçu côté client. Renvoie {} si rien n'est réglé (repli sur le cristal dessiné).
export async function GET() {
  try {
    const s = await getSettings();
    // Priorité : TES réglages admin (base de données) priment. Le verrou (code)
    // ne sert que de valeur par défaut de secours pour un cristal jamais réglé
    // (il évite un placement « au hasard » si la base est vide). Ainsi, dès que
    // tu ajustes un cristal dans l'admin, TON réglage s'applique et reste.
    const zones = { ...CRYSTAL_ZONES_LOCK, ...(s?.crystalZones || {}) };
    return Response.json({ zones, textZones: s?.motifTextZones || {} });
  } catch {
    return Response.json({ zones: { ...CRYSTAL_ZONES_LOCK }, textZones: {} });
  }
}
