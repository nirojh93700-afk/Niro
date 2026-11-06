// Devis tel qu'il sera payé, pour le nombre de pièces choisi par la cliente (01/11/2026)
// et les options qu'elle a cochées sur la page du devis (socle, texte : 06/11/2026).
// Serveur seulement (lit le catalogue en direct). Sans quantité modifiable ni option : le devis tel quel.
import { indexVariantes } from "@/lib/indexVariantes";
import { configQuantite, appliquerQuantite } from "@/lib/devisQuantite";
import { optionsDisponibles, appliquerOptions } from "@/lib/devisOptions";

export async function devisEffectif(q, n, choix) {
  const index = await indexVariantes();
  const cfg = configQuantite(q, index);
  let app = appliquerQuantite(q, cfg, n);
  // Options : seulement sur un devis à nombre fixe (pas de mélange avec les lots).
  const opts = cfg ? null : optionsDisponibles(q, index);
  if (opts && choix) app = appliquerOptions(app, opts, choix);
  const change = cfg || (app.options && app.options.length);
  return { index, cfg, app, opts, q: change ? { ...q, items: app.items, total: app.total } : q };
}
