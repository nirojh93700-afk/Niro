// Table « identifiant de variante → { product, variant } » lue dans le catalogue EN DIRECT
// (réglages de l'admin compris : prix, poids, options…). Sert au calcul du port des devis.
import { getCatalog } from "@/lib/catalog";

export async function indexVariantes() {
  const index = new Map();
  for (const product of await getCatalog()) {
    for (const variant of product.variants || []) index.set(variant.id, { product, variant });
  }
  return index;
}
