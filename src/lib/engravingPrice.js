// Supplément de gravure : chaque page de TEXTE gravée en plus de la couverture
// (incluse) ajoute un montant. Utilisé côté client (affichage) ET côté serveur
// (recalcul de confiance au paiement), pour éviter toute triche.

// =============================================================================
// « LE MOINS CHER EST COMPRIS » (gérant, 15/11/2026 : « si la cliente prend plusieurs trucs, tu offres que le moins
// cher, on va faire ça pour tout le site ») — `engravingPricing.moinsCherCompris` :
//   true                         → parmi les gravures payantes choisies (textes, motifs, photo, suppléments à plat
//                                  qui sont de la GRAVURE), la moins chère est comprise ; les autres se paient.
//   { inclusSi: ["photo"] }      → idem, SAUF si le champ « photo » est rempli : la gravure comprise dans le prix
//                                  existe déjà (ex. clé USB cristal : photo comprise, texte +5 €).
//   { inclusSi: { mode: [...] } }→ idem, sauf si « mode » vaut l'une de ces valeurs (carafe : modèle, lettre, photo).
// Un objet physique (socle, coffret : stock ou poids) n'est jamais une gravure, jamais offert.
// =============================================================================
const plein = (fields, k) => Boolean(k && (fields?.[k] || "").toString().trim());
const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

/** Gravures payantes choisies, dans l'ordre de la fiche : [{ cle, prix }] (sans le moins-cher-compris). */
export function articlesGravure(product, fields = {}, variantId = null) {
  const cfg = product?.engravingPricing;
  if (!cfg) return [];
  const out = [];
  for (const k of cfg.textKeys || []) if (plein(fields, k) && (cfg.textExtra || 0) > 0) out.push({ cle: k, prix: cfg.textExtra });
  for (const k of cfg.motifKeys || []) if (plein(fields, k) && (cfg.motifExtra || 0) > 0) out.push({ cle: k, prix: cfg.motifExtra });
  if (cfg.photoKey && plein(fields, cfg.photoKey) && (cfg.photoSurcharge || 0) > 0) out.push({ cle: cfg.photoKey, prix: cfg.photoSurcharge });
  for (const e of cfg.flatExtras || []) {
    if (e.stockId || e.stockIdByVariant || e.weight || e.weightByVariant) continue;
    const v = (fields[e.key] || "").toString().trim();
    if (!(e.value ? v === e.value : Boolean(v))) continue;
    const prix = (e.amountByVariant && variantId && e.amountByVariant[variantId] != null) ? e.amountByVariant[variantId] : (e.amount || 0);
    if (prix > 0) out.push({ cle: e.key, prix });
  }
  if (cfg.modeleSubExtra) {
    const mv = fields[cfg.modeleSubExtra.key];
    if (mv && typeof mv === "object" && mv.addText !== false && (cfg.modeleSubExtra.amount || 0) > 0) out.push({ cle: cfg.modeleSubExtra.key, prix: cfg.modeleSubExtra.amount });
  }
  return out;
}

/** Une gravure comprise dans le prix existe-t-elle déjà (photo du cristal, modèle de la carafe…) ? */
function dejaInclus(cfg, fields) {
  const r = cfg?.moinsCherCompris?.inclusSi;
  if (!r) return false;
  if (Array.isArray(r)) return r.some((k) => plein(fields, k));
  return Object.entries(r).some(([k, vals]) => (vals || []).includes((fields?.[k] || "").toString().trim()));
}

/** La gravure offerte (la moins chère, la 1re en cas d'égalité) : { cle, prix } ou null. */
export function gravureComprise(product, fields = {}, variantId = null) {
  const cfg = product?.engravingPricing;
  if (!cfg?.moinsCherCompris || dejaInclus(cfg, fields)) return null;
  let best = null;
  for (const a of articlesGravure(product, fields, variantId)) if (!best || a.prix < best.prix) best = a;
  return best;
}

/** Ce que la fiche écrit à côté d'une case de gravure : « compris » ou le supplément, si on la remplissait. */
export function etiquettePrixGravure(product, fields = {}, variantId = null, cle) {
  const cfg = product?.engravingPricing;
  if (!cfg?.moinsCherCompris || !cle) return null;
  const essai = plein(fields, cle) ? fields : { ...fields, [cle]: "x" };
  const a = articlesGravure(product, essai, variantId).find((x) => x.cle === cle);
  if (!a) return null;
  const off = gravureComprise(product, essai, variantId);
  return off && off.cle === cle ? { compris: true, prix: 0 } : { compris: false, prix: a.prix };
}

export function engravingExtra(product, fields = {}, variantId = null) {
  const r = extraBrut(product, fields, variantId);
  const off = gravureComprise(product, fields, variantId);
  return off ? { ...r, amount: r2(r.amount - off.prix), comprise: off } : r;
}

function extraBrut(product, fields = {}, variantId = null) {
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
    // Textes offerts (Collier Quatre Mots, 02/11/2026) : la 1re face remplie est offerte, quelle qu'elle soit.
    const offerts = cfg.moinsCherCompris ? 0 : Math.min(pages, Number(cfg.textesOfferts) || 0);
    amount -= offerts * (cfg.textExtra || 0);
    const motifs = (cfg.motifKeys || []).filter((k) => filled(k)).length;
    // 1er motif offert (avant le 15/11/2026) ; avec « le moins cher compris », chaque motif se compte puis le moins cher est retiré.
    const motifsPayes = cfg.moinsCherCompris ? motifs : Math.max(0, motifs - 1);
    if (motifsPayes > 0) amount += motifsPayes * (cfg.motifExtra || 0);
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
  // Fiche « le moins cher compris » : le code offre la gravure payante la moins chère qui RESTE après la comprise.
  if (cfg.moinsCherCompris) {
    const off = gravureComprise(product, fields, variantId);
    let reste = articlesGravure(product, fields, variantId);
    if (off) { const i = reste.findIndex((a) => a.cle === off.cle); if (i >= 0) reste = reste.filter((_, k) => k !== i); }
    return reste.length ? Math.min(...reste.map((a) => a.prix)) : 0;
  }
  const filled = (k) => k && (fields[k] || "").toString().trim();

  // 1) Zones de texte (recto/verso, cœur/plaques…) : une zone remplie = textExtra.
  if (Array.isArray(cfg.textKeys) && cfg.textKeys.some(filled) && (cfg.textExtra || 0) > 0) {
    // Si des faces sont déjà offertes par la fiche, le code n'offre que la face payante suivante.
    const remplies = cfg.textKeys.filter(filled).length;
    if (remplies > (Number(cfg.textesOfferts) || 0)) return cfg.textExtra;
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

/** Faces offertes d'une fiche à `textesOfferts` : les N premières remplies (dans l'ordre de la fiche), sinon les N premières. */
export function facesOffertes(product, fields = {}) {
  const cfg = product?.engravingPricing;
  const n = Number(cfg?.textesOfferts) || 0;
  if (!n || !Array.isArray(cfg.textKeys)) return { cles: [], aucune: true };
  const remplies = cfg.textKeys.filter((k) => (fields[k] || "").toString().trim());
  return remplies.length ? { cles: remplies.slice(0, n), aucune: false } : { cles: cfg.textKeys.slice(0, n), aucune: true };
}
