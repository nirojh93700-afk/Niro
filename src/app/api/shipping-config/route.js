import { getSettings } from "@/lib/stock";
import { resolveShippingConfig } from "@/lib/shipping";
import { vacationActive, vacationMessage, vacationGiftMessage, cadeauColisActif } from "@/lib/vacation";

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
      // 🏖️ Mode vacances actif ? (null si éteint — la fiche produit et le panier
      // affichent le délai annoncé, voir src/lib/vacation.js)
      vacation: (() => {
        const v = vacationActive(settings?.vacation);
        return v ? { message: vacationMessage(v), gift: vacationGiftMessage(v) } : null;
      })(),
      // 🎁 Cadeau dans chaque colis ? { text, viaVacances } ou null (le panier
      // affiche alors le choix Surprise / femme / homme — voir CadeauChoix).
      cadeau: cadeauColisActif(settings),
    },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
