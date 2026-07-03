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
    },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
