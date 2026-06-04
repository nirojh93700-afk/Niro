// Supplément de gravure : chaque page de TEXTE gravée en plus de la couverture
// (incluse) ajoute un montant. Utilisé côté client (affichage) ET côté serveur
// (recalcul de confiance au paiement), pour éviter toute triche.

export function engravingExtra(product, fields = {}) {
  const cfg = product?.engravingPricing;
  if (!cfg) return { pages: 0, amount: 0 };
  const included = cfg.includedKey;
  // On compte les champs de texte non vides, hors couverture incluse.
  const textFields = (product.personalizationFields || []).filter((f) => {
    const t = f.type;
    return (t === undefined || t === "text" || t === "textarea") && f.key !== included;
  });
  let pages = 0;
  for (const f of textFields) {
    if ((fields[f.key] || "").toString().trim()) pages++;
  }
  const amount = pages * (cfg.perExtraPage || 0);
  return { pages, amount };
}
