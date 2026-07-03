import { getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";

export const dynamic = "force-dynamic";

// Config de livraison PUBLIQUE (aucune donnée sensible) : sert à la barre
// « livraison offerte » du panier pour suivre les tarifs réglés dans l'admin.
export async function GET() {
  const settings = await getSettings().catch(() => ({}));
  const cfg = resolveShippingConfig(settings?.shipping);
  return Response.json(
    {
      bijouxHome: cfg.bijouxHome,
      bijouxFreeThreshold: cfg.bijouxFreeThreshold,
      // Option point relais activée dans l'admin ? (pour afficher la carte au panier)
      pointRelais: settings?.boxtal?.enabled === true,
    },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
