// Résout les imports « @/… » (alias Next.js) quand on lance un script Node
// autonome depuis tools/, et ajoute l'extension .js quand elle est omise
// (Next l'accepte, Node non). Utilisé par les scripts d'inventaire du catalogue.
import { existsSync } from "node:fs";
const SRC = new URL("../src/", import.meta.url);
export function resolve(specifier, context, next) {
  if (!specifier.startsWith("@/")) return next(specifier, context);
  const url = new URL(specifier.slice(2), SRC);
  if (!/\.[a-z]+$/i.test(url.pathname) && existsSync(new URL(url.href + ".js"))) {
    return next(url.href + ".js", context);
  }
  return next(url.href, context);
}
