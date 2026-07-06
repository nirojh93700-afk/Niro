// Supplément de gravure : chaque page de TEXTE gravée en plus de la couverture
// (incluse) ajoute un montant. Utilisé côté client (affichage) ET côté serveur
// (recalcul de confiance au paiement), pour éviter toute triche.

export function engravingExtra(product, fields = {}, variantId = null) {
  const cfg = product?.engravingPricing;
  if (!cfg) return { pages: 0, amount: 0 };

  // Suppléments "à plat" : un champ rempli (ou égal à une valeur) ajoute un montant.
  // Ex. graver à un 2e emplacement. S'additionne aux autres modes.
  // `amountByVariant` permet un montant différent selon la taille choisie
  // (ex. socle du Petit bloc moins cher que celui des grandes tailles).
  let flat = (cfg.flatExtras || []).reduce((s, e) => {
    const v = (fields[e.key] || "").toString().trim();
    const hit = e.value ? v === e.value : Boolean(v);
    const amt = (e.amountByVariant && variantId && e.amountByVariant[variantId] != null)
      ? e.amountByVariant[variantId]
      : (e.amount || 0);
    return hit ? s + amt : s;
  }, 0);

  // Supplément "texte ajouté sous un modèle" : payant tant que la case est cochée
  // (addText !== false dans l'objet du modèle envoyé).
  if (cfg.modeleSubExtra) {
    const mv = fields[cfg.modeleSubExtra.key];
    if (mv && typeof mv === "object" && mv.addText !== false) flat += cfg.modeleSubExtra.amount || 0;
  }

  // Mode "pages" : par page supplémentaire, +pageMotif si un motif y est posé,
  // sinon +pageText si un texte y est gravé (la couverture, elle, est incluse).
  if (Array.isArray(cfg.pages)) {
    let amount = 0, pages = 0;
    for (const pg of cfg.pages) {
      const hasMotif = pg.motifKey && (fields[pg.motifKey] || "").toString().trim();
      const hasText = pg.textKey && (fields[pg.textKey] || "").toString().trim();
      if (hasMotif) { amount += cfg.pageMotif || 0; pages += 1; }
      else if (hasText) { amount += cfg.pageText || 0; pages += 1; }
    }
    return { pages, amount: amount + flat };
  }

  // Mode "textKeys / motifKeys" : chaque texte en plus = textExtra ; pour les
  // motifs, le 1er est OFFERT et chaque motif suivant = motifExtra ; photo en option.
  if (cfg.textKeys || cfg.motifKeys) {
    const filled = (k) => k && (fields[k] || "").toString().trim();
    let amount = 0, pages = 0;
    for (const k of cfg.textKeys || []) if (filled(k)) { amount += cfg.textExtra || 0; pages += 1; }
    const motifs = (cfg.motifKeys || []).filter((k) => filled(k)).length;
    if (motifs > 1) amount += (motifs - 1) * (cfg.motifExtra || 0); // 1er motif offert
    const photo = Boolean(cfg.photoKey && filled(cfg.photoKey));
    if (photo) amount += cfg.photoSurcharge || 0;
    return { pages, motifs, photo, amount: amount + flat };
  }
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
  // Supplément photo (si une photo a été ajoutée).
  const photoVal = cfg.photoKey ? (fields[cfg.photoKey] || "").toString().trim() : "";
  const photo = Boolean(photoVal);
  const amount = pages * (cfg.perExtraPage || 0) + (photo ? (cfg.photoSurcharge || 0) : 0) + flat;
  return { pages, photo, amount };
}
