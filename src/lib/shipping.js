// =============================================================================
// Frais de livraison — livraison à domicile (un prix), + retrait en main propre
// -----------------------------------------------------------------------------
// La cliente reçoit chez elle (Stripe collecte l'adresse complète).
// Le retrait en main propre (déco/mariage, Val-d'Oise) est proposé en plus,
// uniquement si le code postal est dans la zone autorisée (géré côté checkout).
//
// 👉 Tous les montants sont modifiables ci-dessous. Montants en euros.
// =============================================================================

// --- Bijoux / petits objets (lettre suivie, ≤ 2 kg) ------------------------
export const BIJOUX_HOME = 3.9;          // livraison à domicile
export const BIJOUX_FREE_THRESHOLD = 45; // livraison offerte dès ce montant

// --- Décoration / colis (tarif selon le nombre d'articles déco) -------------
export const DECO_TIERS = [
  { maxQty: 4, price: 6.9 },         // 1 à 4 articles déco
  { maxQty: 12, price: 12.9 },       // 5 à 12
  { maxQty: Infinity, price: 19.9 }, // 13 et plus
];

// --- Verres (fragiles) : envoi CROISSANT selon le nombre de verres ----------
// La Poste facture plus cher quand le colis est plus lourd → le prix monte.
export const GLASS_TIERS = [
  { maxQty: 2, price: 11.9 },         // 1 à 2 verres
  { maxQty: 4, price: 16.9 },         // 3 à 4 verres
  { maxQty: Infinity, price: 21.9 },  // 5 verres et plus
];

// --- Retrait en main propre -------------------------------------------------
export const PICKUP_FEE = 0;

// Le retrait en main propre est proposé automatiquement dès que le panier
// dépasse ce poids (colis lourd = expédition chère → venir chercher est
// intéressant). Il reste aussi proposé pour les articles « mariage » marqués
// `pickup: true`, quel que soit le poids.
export const PICKUP_MIN_GRAMS = 2000; // 2 kg

// La lettre suivie est limitée à 2 kg : au-delà, on bascule en colis.
const LETTER_MAX_GRAMS = 2000;

// -----------------------------------------------------------------------------
// Tarifs personnalisés (admin) : les montants ci-dessus sont les tarifs par
// défaut ; l'admin peut les remplacer via Gestion → Réglages → 🚚 Livraison
// (stockés dans les réglages, clé `shipping`). Un champ absent/invalide
// retombe TOUJOURS sur le tarif du code — rien ne peut casser le paiement.
// Dans les paliers stockés, `maxQty: null` = « et plus » (dernier palier).
// -----------------------------------------------------------------------------
export function resolveShippingConfig(over) {
  const o = over && typeof over === "object" ? over : {};
  const num = (v, def, max = 1000) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : def;
  };
  const tiers = (arr, def) => {
    if (!Array.isArray(arr) || !arr.length) return def;
    const clean = arr
      .map((t) => ({
        maxQty: Number(t?.maxQty) > 0 ? Math.round(Number(t.maxQty)) : Infinity,
        price: Number(t?.price),
      }))
      .filter((t) => Number.isFinite(t.price) && t.price >= 0 && t.price <= 1000)
      .sort((a, b) => a.maxQty - b.maxQty);
    if (!clean.length) return def;
    clean[clean.length - 1].maxQty = Infinity; // dernier palier = « et plus »
    return clean;
  };
  return {
    bijouxHome: num(o.bijouxHome, BIJOUX_HOME),
    bijouxFreeThreshold: num(o.bijouxFreeThreshold, BIJOUX_FREE_THRESHOLD, 10000),
    decoTiers: tiers(o.decoTiers, DECO_TIERS),
    glassTiers: tiers(o.glassTiers, GLASS_TIERS),
    pickupFee: num(o.pickupFee, PICKUP_FEE),
  };
}

function tierPrice(tiers, qty) {
  const t = tiers.find((x) => qty <= x.maxQty) || tiers[tiers.length - 1];
  return t.price;
}

// Prix « point relais » calculé AUTOMATIQUEMENT selon le poids, à partir de la
// grille tarifaire Boxtal (Mondial Relay point relais). Coûts réels TTC extraits
// de la grille (HT × 1,20) + petite marge pour couvrir emballage/temps :
//   ≤ 1 kg  : coût ~4,21 € → 4,90 €
//   1–2 kg  : coût ~5,88 € → 6,50 €
//   2–5 kg  : coût ~6,25 € → 6,90 €
// La cliente ne perd jamais d'argent : chaque palier est au-dessus du coût réel.
// Le plancher admin (défaut 4,90 €) s'applique par-dessus côté buildShippingOptions.
const POINT_RELAIS_TIERS = [
  { maxGrams: 1000, price: 4.9 },
  { maxGrams: 2000, price: 6.5 },
  { maxGrams: 5000, price: 6.9 },
  { maxGrams: Infinity, price: 8.9 },
];

function pointRelaisPriceByWeight(grams) {
  const g = Number.isFinite(Number(grams)) && Number(grams) > 0 ? Number(grams) : 0;
  const t = POINT_RELAIS_TIERS.find((x) => g <= x.maxGrams) || POINT_RELAIS_TIERS[POINT_RELAIS_TIERS.length - 1];
  return t.price;
}

// Livraison à DOMICILE (Colissimo) : grille par poids réel, pour que les colis
// lourds (plusieurs blocs cristal, ou un mix bijou + bloc) soient facturés au
// juste prix et jamais sous-facturés. Les articles légers (≤ 1 kg) restent sous
// le tarif « déco » (6,90 €) → aucun changement pour les petits produits.
const HOME_WEIGHT_TIERS = [
  { maxGrams: 1000, price: 6.9 },
  { maxGrams: 2000, price: 8.9 },
  { maxGrams: 5000, price: 14.9 },
  { maxGrams: 10000, price: 22.9 },
  { maxGrams: Infinity, price: 29.9 },
];

function homePriceByWeight(grams) {
  const g = Number.isFinite(Number(grams)) && Number(grams) > 0 ? Number(grams) : 0;
  const t = HOME_WEIGHT_TIERS.find((x) => g <= x.maxGrams) || HOME_WEIGHT_TIERS[HOME_WEIGHT_TIERS.length - 1];
  return t.price;
}

function rate(amount, name, days) {
  return {
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: { amount: Math.round(amount * 100), currency: "eur" },
      display_name: name,
      delivery_estimate: {
        minimum: { unit: "business_day", value: days[0] },
        maximum: { unit: "business_day", value: days[1] },
      },
    },
  };
}

// Options de livraison proposées au paiement.
//   subtotal      : sous-total produits (€)
//   letterOnly    : TOUS les articles sont des bijoux/petits objets (≤ 2 kg)
//   totalGrams    : poids total réel du panier (somme des poids × quantités)
//   parcelQty     : nombre d'articles "déco" (colis) dans le panier
//   pickupEligible: retrait en main propre autorisé (déco/mariage + zone OK)
//   config        : tarifs personnalisés (réglages admin) — facultatif
// Calcule le prix « point relais » (par poids), plancher = prix admin (4,90 €).
function pointRelaisPrice(totalGrams, boxtal, freeShipping) {
  if (freeShipping) return 0;
  const floor = Number.isFinite(Number(boxtal?.pointRelaisPrice)) ? Number(boxtal.pointRelaisPrice) : 4.9;
  return Math.max(floor, pointRelaisPriceByWeight(totalGrams));
}

// Construit les options « livraison à domicile » (+ verres/déco selon le panier).
function homeOptions(cfg, { subtotal, letterOnly, totalGrams, parcelQty, glassQty, freeShipping }) {
  const options = [];
  if (freeShipping) {
    options.push(rate(0, "Livraison à domicile — Offerte", [2, 5]));
  } else if (letterOnly && totalGrams <= LETTER_MAX_GRAMS) {
    const free = subtotal >= cfg.bijouxFreeThreshold;
    options.push(rate(free ? 0 : cfg.bijouxHome, free ? "Livraison à domicile — Offerte" : "Livraison à domicile", [2, 4]));
  } else {
    const decoQty = Math.max(0, parcelQty - glassQty);
    const prices = [];
    if (glassQty > 0) prices.push(tierPrice(cfg.glassTiers, glassQty));
    if (decoQty > 0) prices.push(tierPrice(cfg.decoTiers, decoQty));
    const qtyPrice = prices.length ? Math.max(...prices) : tierPrice(cfg.decoTiers, parcelQty || 1);
    // Prix final = le plus élevé entre le tarif « par quantité » (déco/verres) et
    // le tarif « par poids réel » : les colis lourds passent au bon tarif, les
    // petits produits ne changent pas.
    const price = Math.max(qtyPrice, homePriceByWeight(totalGrams));
    options.push(rate(price, "Livraison à domicile", [2, 5]));
  }
  return options;
}

const PICKUP_LABEL = "Retrait en main propre — Val-d'Oise (95), sur rendez-vous";

export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, glassQty = 0, pickupEligible = false, freeShipping = false, config, boxtal, deliveryMethod = "", relaisLabel = "" }) {
  const cfg = resolveShippingConfig(config);
  const boxtalOn = Boolean(boxtal && boxtal.enabled);
  const home = () => homeOptions(cfg, { subtotal, letterOnly, totalGrams, parcelQty, glassQty, freeShipping });

  // --- Choix explicite fait sur la page panier -----------------------------
  // Point relais : Stripe n'affiche QUE cette option (prix par poids + nom du
  // point relais choisi sur la carte).
  if (deliveryMethod === "relais" && boxtalOn) {
    const price = pointRelaisPrice(totalGrams, boxtal, freeShipping);
    const name = relaisLabel ? `Point relais — ${String(relaisLabel).slice(0, 80)}` : "Livraison en point relais";
    return [rate(price, name, [3, 6])];
  }
  // Retrait en main propre : uniquement si le panier y est éligible (déco/mariage)
  // ET le code postal est dans la zone. Sinon repli sûr sur la livraison à domicile.
  if (deliveryMethod === "retrait") {
    return pickupEligible ? [rate(cfg.pickupFee, PICKUP_LABEL, [1, 7])] : home();
  }
  // Domicile : livraison à domicile seule.
  if (deliveryMethod === "domicile") {
    return home();
  }

  // --- Aucun choix explicite (ancien cache JS) : on propose tout le dispo ---
  const options = home();
  if (boxtalOn && !freeShipping) {
    options.push(rate(pointRelaisPrice(totalGrams, boxtal, false), "Livraison en point relais", [3, 6]));
  }
  if (pickupEligible) {
    options.push(rate(cfg.pickupFee, PICKUP_LABEL, [1, 7]));
  }
  return options;
}
