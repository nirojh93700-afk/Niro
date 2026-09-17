// Supplément de gravure : chaque page de TEXTE gravée en plus de la couverture
// (incluse) ajoute un montant. Utilisé côté client (affichage) ET côté serveur
// (recalcul de confiance au paiement), pour éviter toute triche.

export function engravingExtra(product, fields = {}, variantId = null) {
  const cfg = product?.engravingPricing;
  if (!cfg) return { pages: 0, amount: 0, weight: 0, stockIds: [] };

  // Suppléments "à plat" : un champ rempli (ou égal à une valeur) ajoute un montant.
  // Ex. graver à un 2e emplacement, ou ajouter un socle. S'additionne aux autres modes.
  // `amountByVariant` permet un montant différent selon la taille choisie
  // (ex. socle du Petit bloc moins cher que celui des grandes tailles).
  // `weight`/`weightByVariant` = poids (g) ajouté par l'option (ex. socle) pour
  // que les frais de port restent corrects.
  // `stockId`/`stockIdByVariant` : une option qui consomme un vrai article du
  // stock (ex. socle lumineux LED, acheté en quantité limitée). On remonte les
  // identifiants choisis pour que le paiement les contrôle et les décrémente.
  let flat = 0;
  let flatWeight = 0;
  const stockIds = [];
  for (const e of cfg.flatExtras || []) {
    const v = (fields[e.key] || "").toString().trim();
    const hit = e.value ? v === e.value : Boolean(v);
    if (!hit) continue;
    flat += (e.amountByVariant && variantId && e.amountByVariant[variantId] != null)
      ? e.amountByVariant[variantId]
      : (e.amount || 0);
    flatWeight += (e.weightByVariant && variantId && e.weightByVariant[variantId] != null)
      ? e.weightByVariant[variantId]
      : (e.weight || 0);
    const sid = (e.stockIdByVariant && variantId && e.stockIdByVariant[variantId])
      ? e.stockIdByVariant[variantId]
      : e.stockId;
    if (sid) stockIds.push(sid);
  }

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
    return { pages, amount: amount + flat, weight: flatWeight, stockIds };
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
    return { pages, motifs, photo, amount: amount + flat, weight: flatWeight, stockIds };
  }
  const included = cfg.includedKey;
  // On compte les champs de texte non vides, hors couverture incluse.
  // ⚠️ Une même clé peut exister en PLUSIEURS exemplaires (un champ par option,
  // affiché selon la variante — ex. support téléphone) : on ne la compte qu'une fois.
  const clesVues = new Set();
  const textFields = (product.personalizationFields || []).filter((f) => {
    const t = f.type;
    if (!(t === undefined || t === "text" || t === "textarea") || f.key === included) return false;
    if (clesVues.has(f.key)) return false;
    clesVues.add(f.key);
    return true;
  });
  let pages = 0;
  for (const f of textFields) {
    if ((fields[f.key] || "").toString().trim()) pages++;
  }
  // Le compteur de « pages » ne sert qu'aux produits facturés à la page : sans
  // tarif par page, on ne l'affiche pas (le libellé « N pages de texte » serait faux).
  if (!cfg.perExtraPage) pages = 0;
  // Supplément photo (si une photo a été ajoutée).
  const photoVal = cfg.photoKey ? (fields[cfg.photoKey] || "").toString().trim() : "";
  const photo = Boolean(photoVal);
  const amount = pages * (cfg.perExtraPage || 0) + (photo ? (cfg.photoSurcharge || 0) : 0) + flat;
  return { pages, photo, amount, weight: flatWeight, stockIds };
}

// =============================================================================
// PRIX D'UNE SEULE GRAVURE — pour l'offre « gravure offerte » (17/09/2026)
// -----------------------------------------------------------------------------
// Règle tranchée par le gérant : le code offre UNE gravure, une seule, à son
// PRIX RÉEL (3 € sur un bijou, 5 € sur un cristal ou une page de médaillon…),
// sur N'IMPORTE QUEL produit. Restent payants : les zones/pages suivantes, la
// PHOTO gravée (photoSurcharge), et toute option PHYSIQUE (socle LED, coffret de
// verres : un flatExtra qui porte un article de stock ou un poids).
// Renvoie 0 si aucune gravure payante n'est présente dans les champs.
// Utilisé au panier (affichage) ET au paiement (recalcul de confiance).
// =============================================================================
export function prixPremiereGravure(product, fields = {}, variantId = null) {
  const cfg = product?.engravingPricing;
  if (!cfg) return 0;
  const filled = (k) => k && (fields[k] || "").toString().trim();

  // 1) Zones de texte (recto/verso, cœur/plaques…) : une zone remplie = textExtra.
  if (Array.isArray(cfg.textKeys) && cfg.textKeys.some(filled) && (cfg.textExtra || 0) > 0) {
    return cfg.textExtra;
  }
  // 2) Pages : la première page gravée (texte → pageText, motif → pageMotif).
  if (Array.isArray(cfg.pages)) {
    for (const pg of cfg.pages) {
      if (pg.textKey && filled(pg.textKey) && (cfg.pageText || 0) > 0) return cfg.pageText;
      if (pg.motifKey && filled(pg.motifKey) && (cfg.pageMotif || 0) > 0) return cfg.pageMotif;
    }
  }
  // 3) Page au-delà de la couverture incluse (perExtraPage).
  if ((cfg.perExtraPage || 0) > 0 && !cfg.textKeys && !Array.isArray(cfg.pages)) {
    const e = engravingExtra(product, fields, variantId);
    if (e.pages > 0) return cfg.perExtraPage;
  }
  // 4) Texte ajouté sous un modèle numéroté.
  if (cfg.modeleSubExtra) {
    const mv = fields[cfg.modeleSubExtra.key];
    if (mv && typeof mv === "object" && mv.addText !== false && (cfg.modeleSubExtra.amount || 0) > 0) {
      return cfg.modeleSubExtra.amount;
    }
  }
  // 5) Suppléments « à plat » qui sont de la GRAVURE (texte +3 €, gravure : oui,
  //    prénom sur le support…). Une option qui consomme un article de stock ou
  //    ajoute du poids est un OBJET (socle, coffret), pas une gravure : ignorée.
  for (const e of cfg.flatExtras || []) {
    if (e.stockId || e.stockIdByVariant || e.weight || e.weightByVariant) continue;
    const v = (fields[e.key] || "").toString().trim();
    const hit = e.value ? v === e.value : Boolean(v);
    if (!hit) continue;
    const amount = (e.amountByVariant && variantId && e.amountByVariant[variantId] != null)
      ? e.amountByVariant[variantId]
      : (e.amount || 0);
    if (amount > 0) return amount;
  }
  return 0;
}
