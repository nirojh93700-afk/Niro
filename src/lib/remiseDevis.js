// Remise d'un code promo sur un DEVIS (03/10/2026) — calcul pur, sans accès base.
// Demande du gérant : le client s'inscrit, reçoit son code (ex. BIENVENUE10) puis le saisit
// sur le lien du devis. La remise porte sur les lignes d'articles, JAMAIS sur la livraison
// (même règle qu'au panier, où le coupon ne touche pas au port).

const LIGNE_PORT = /^\s*(livraison|port\b|frais de (port|livraison)|expédition|expedition)/i;

export function estLignePort(desc) {
  return LIGNE_PORT.test(String(desc || ""));
}

export function totalRemisable(items) {
  const t = (Array.isArray(items) ? items : [])
    .filter((it) => !estLignePort(it?.desc))
    .reduce((s, it) => s + (Number(it?.qty) || 0) * (Number(it?.price) || 0), 0);
  return Math.round(t * 100) / 100;
}

// pc = { type: "percent" | "fixed", value }. Renvoie le montant déduit en euros (0 = rien).
export function calculRemiseDevis(pc, items) {
  const base = totalRemisable(items);
  const v = Number(pc?.value) || 0;
  if (!(base > 0) || !(v > 0)) return 0;
  const brut = pc.type === "fixed" ? v : (base * Math.min(100, v)) / 100;
  return Math.round(Math.min(brut, base) * 100) / 100;
}
