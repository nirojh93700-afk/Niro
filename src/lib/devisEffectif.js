// Devis tel qu'il sera payé, pour le nombre de pièces choisi par la cliente (01/11/2026).
// Serveur seulement (lit le catalogue en direct). Sans quantité modifiable : le devis tel quel.
import { indexVariantes } from "@/lib/indexVariantes";
import { configQuantite, appliquerQuantite } from "@/lib/devisQuantite";

export async function devisEffectif(q, n) {
  const index = await indexVariantes();
  const cfg = configQuantite(q, index);
  const app = appliquerQuantite(q, cfg, n);
  return { index, cfg, app, q: cfg ? { ...q, items: app.items, total: app.total } : q };
}
