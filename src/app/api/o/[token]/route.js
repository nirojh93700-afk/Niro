import { recordEmailOpen } from "@/lib/stock";
import { readTrackToken } from "@/lib/emailTrack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GIF transparent 1×1 : le plus petit fichier image valide.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// Pixel d'ouverture d'un e-mail de campagne. Renvoie TOUJOURS l'image, même si
// le jeton est invalide ou si l'enregistrement échoue : une cliente ne doit
// jamais voir une image cassée dans son e-mail à cause de nos statistiques.
export async function GET(req, { params }) {
  try {
    const t = readTrackToken(params?.token);
    if (t) await recordEmailOpen(t.campaignId, t.email);
  } catch { /* on n'empêche jamais l'affichage */ }
  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // Sans cela, Gmail met l'image en cache et une seule ouverture est comptée.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
