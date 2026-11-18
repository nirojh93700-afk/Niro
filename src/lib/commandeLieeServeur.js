// Rattacher une commande (complément payé par devis) à sa commande d'origine — côté serveur (18/11/2026).
import { getSiteOrders, updateSiteOrder } from "@/lib/firebase";
import { nettoyerRef } from "@/lib/commandeLiee";

/** Retrouve une commande par sa référence (parmi les 800 dernières). */
export async function commandeParRef(ref) {
  const r = nettoyerRef(ref);
  if (!r) return null;
  const orders = (await getSiteOrders(800).catch(() => null)) || [];
  return orders.find((o) => nettoyerRef(o.ref) === r) || null;
}

/**
 * Rattache la commande `enfantId` à la commande de référence `parentRef`.
 * Le complément prend le statut et le suivi de la commande d'origine (il partira avec elle).
 * Renvoie { ok, parent } ou { ok:false, error }.
 */
export async function rattacherCommande(enfantId, parentRef) {
  const parent = await commandeParRef(parentRef);
  if (!parent) return { ok: false, error: `Commande ${nettoyerRef(parentRef)} introuvable.` };
  if (parent.id === enfantId) return { ok: false, error: "Une commande ne peut pas se compléter elle-même." };
  if (parent.rattacheA?.id) return { ok: false, error: `La commande ${parent.ref} est elle-même un complément de ${parent.rattacheA.ref}.` };
  const patch = { rattacheA: { id: parent.id, ref: parent.ref || nettoyerRef(parentRef) } };
  if (parent.status) patch.status = parent.status;
  if (parent.tracking) patch.tracking = parent.tracking;
  const ok = await updateSiteOrder(enfantId, patch);
  return ok ? { ok: true, parent, patch } : { ok: false, error: "Enregistrement impossible." };
}

/** Détache un complément (il redevient une commande à part). */
export async function detacherCommande(enfantId) {
  const ok = await updateSiteOrder(enfantId, { rattacheA: null });
  return { ok };
}

/** Les compléments suivent la commande d'origine : statut et suivi recopiés, sans e-mail. */
export async function suivreCommandeOrigine(parentId, patch) {
  const orders = (await getSiteOrders(800).catch(() => null)) || [];
  const enfants = orders.filter((o) => o.rattacheA?.id === parentId);
  const p = {};
  for (const k of ["status", "tracking", "shippedAt", "deliveredAt", "remisAt"]) if (patch[k] !== undefined) p[k] = patch[k];
  if (!Object.keys(p).length) return 0;
  await Promise.all(enfants.map((o) => updateSiteOrder(o.id, p).catch(() => false)));
  return enfants.length;
}
