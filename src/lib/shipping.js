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
// grille tarifaire Boxtal (Mondial Relay point relais) + marge emballage/temps.
// Paliers relevés (06/07/2026) pour ne JAMAIS perdre d'argent sur les colis
// lourds / paniers à plusieurs objets, tout en restant dans les prix du marché :
//   ≤ 1 kg : 4,90 € · ≤ 2 kg : 6,50 € · ≤ 3 kg : 7,50 € · ≤ 5 kg : 8,50 €
//   ≤ 10 kg : 9,90 € · ≤ 15 kg : 12,90 € · > 15 kg : 15,90 €
// La cliente ne perd jamais d'argent : chaque palier est au-dessus du coût réel.
// Le plancher admin (défaut 4,90 €) s'applique par-dessus côté buildShippingOptions.
const POINT_RELAIS_TIERS = [
  { maxGrams: 1000, price: 4.9 },
  { maxGrams: 2000, price: 6.5 },
  { maxGrams: 3000, price: 7.5 },
  { maxGrams: 5000, price: 8.5 },
  { maxGrams: 10000, price: 9.9 },
  { maxGrams: 15000, price: 12.9 },
  { maxGrams: Infinity, price: 15.9 },
];

// -----------------------------------------------------------------------------
// TRANSPORTEURS point relais (Boxtal). Le client voit TOUS les points relais
// autour de lui (tous transporteurs) et clique sur le plus proche ; le prix
// s'ajuste au transporteur du point choisi. `offer` = code d'offre Boxtal (sert
// à récupérer les points ET à créer l'étiquette). `tiers` = grille par poids
// (au-dessus du coût réel → jamais de perte). Mondial Relay = grille de base
// validée ; les autres un peu au-dessus (coût réel plus élevé).
// Pour retirer un transporteur : l'enlever de cette liste. Pour l'activer, il
// doit aussi être activé sur le compte Boxtal (sinon aucun point ne remonte).
// -----------------------------------------------------------------------------
export const RELAIS_CARRIERS = [
  { code: "MONR", offer: "MONR-CpourToi", name: "Mondial Relay", tiers: [[1000, 4.9], [2000, 6.5], [3000, 7.5], [5000, 8.5], [10000, 9.9], [15000, 12.9], [Infinity, 15.9]] },
  { code: "SOGP", offer: "SOGP-RelaisColis", name: "Relais Colis", tiers: [[1000, 5.5], [2000, 6.9], [3000, 7.9], [5000, 8.9], [10000, 10.9], [15000, 13.9], [Infinity, 16.9]] },
  { code: "POFR", offer: "POFR-ColissimoPickupStation", name: "Colissimo (La Poste)", tiers: [[1000, 5.5], [2000, 7.5], [5000, 10.9], [10000, 15.9], [15000, 20.9], [Infinity, 25.9]] },
  { code: "CHRP", offer: "CHRP-ChronoShoptoShop", name: "Chrono Shop2Shop", tiers: [[1000, 5.9], [2000, 7.5], [3000, 8.5], [5000, 9.9], [10000, 12.9], [Infinity, 16.9]] },
  { code: "UPSE", offer: "UPSE-StandardAccessPoint", name: "UPS Point Relais", tiers: [[1000, 6.9], [2000, 8.9], [5000, 12.9], [10000, 17.9], [Infinity, 24.9]] },
];

export function relaisCarrierByCode(code) {
  const c = String(code || "").toUpperCase();
  return RELAIS_CARRIERS.find((x) => x.code === c) || RELAIS_CARRIERS[0];
}

// Prix point relais pour un transporteur donné, selon le poids (repli : Mondial Relay).
export function pointRelaisPriceByWeight(grams, carrierCode) {
  const g = Number.isFinite(Number(grams)) && Number(grams) > 0 ? Number(grams) : 0;
  const c = relaisCarrierByCode(carrierCode);
  for (const [max, price] of c.tiers) if (g <= max) return price;
  return c.tiers[c.tiers.length - 1][1];
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
  { maxGrams: 15000, price: 28.9 },
  { maxGrams: Infinity, price: 34.9 },
];

function homePriceByWeight(grams) {
  const g = Number.isFinite(Number(grams)) && Number(grams) > 0 ? Number(grams) : 0;
  const t = HOME_WEIGHT_TIERS.find((x) => g <= x.maxGrams) || HOME_WEIGHT_TIERS[HOME_WEIGHT_TIERS.length - 1];
  return t.price;
}

// -----------------------------------------------------------------------------
// LIVRAISON EUROPE (hors France) — par ZONE et par POIDS réel.
// Tarifs relevés le 06/07/2026 sur les grilles Colissimo International (Zone A/B)
// + Lettre suivie internationale pour les petits objets, avec marge → la cliente
// ne perd JAMAIS d'argent. La France (+ Monaco) garde ses tarifs habituels.
//   EU1 = Belgique, Luxembourg, Pays-Bas, Allemagne (proche)
//   EU2 = Espagne, Italie, Portugal
//   CH  = Suisse (hors UE : douane, plus cher)
// -----------------------------------------------------------------------------
const EU_ZONE_OF = { BE: "EU1", LU: "EU1", NL: "EU1", DE: "EU1", ES: "EU2", IT: "EU2", PT: "EU2", CH: "CH" };
const EU_TIERS = {
  // letter = petits objets (bijoux) en lettre suivie internationale (≤ 2 kg)
  // parcel = colis (dès qu'il y a un objet plus gros/fragile)
  EU1: {
    letter: [[250, 6.9], [500, 9.9], [2000, 12.9]],
    parcel: [[1000, 16.9], [2000, 22.9], [5000, 32.9], [10000, 46.9], [Infinity, 74.9]],
  },
  EU2: {
    letter: [[250, 7.9], [500, 10.9], [2000, 14.9]],
    parcel: [[1000, 18.9], [2000, 24.9], [5000, 36.9], [10000, 52.9], [Infinity, 84.9]],
  },
  CH: {
    letter: [[250, 8.9], [500, 12.9], [2000, 17.9]],
    parcel: [[1000, 22.9], [2000, 29.9], [5000, 44.9], [10000, 64.9], [Infinity, 99.9]],
  },
};

// Zone d'un pays : "FR" (France + Monaco, tarifs habituels), sinon EU1/EU2/CH.
export function shippingZone(country) {
  const c = String(country || "").toUpperCase();
  if (!c || c === "FR" || c === "MC") return "FR";
  return EU_ZONE_OF[c] || "FR";
}

function tierByGrams(tiers, grams) {
  const g = Number.isFinite(Number(grams)) && Number(grams) > 0 ? Number(grams) : 0;
  for (const [max, price] of tiers) if (g <= max) return price;
  return tiers[tiers.length - 1][1];
}

// Option de livraison Europe : un seul tarif « à domicile », au poids réel.
function europeOptions(zoneKey, { letterOnly, totalGrams }) {
  const z = EU_TIERS[zoneKey] || EU_TIERS.EU1;
  const grid = letterOnly && totalGrams <= 2000 ? z.letter : z.parcel;
  return [rate(tierByGrams(grid, totalGrams), "Livraison en Europe — à domicile", [4, 8])];
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
function pointRelaisPrice(totalGrams, boxtal, freeShipping, carrierCode) {
  if (freeShipping) return 0;
  const floor = Number.isFinite(Number(boxtal?.pointRelaisPrice)) ? Number(boxtal.pointRelaisPrice) : 4.9;
  return Math.max(floor, pointRelaisPriceByWeight(totalGrams, carrierCode));
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

export function buildShippingOptions({ subtotal, letterOnly, totalGrams = 0, parcelQty = 0, glassQty = 0, pickupEligible = false, freeShipping = false, config, boxtal, deliveryMethod = "", relaisLabel = "", relaisCarrier = "", country = "" }) {
  const cfg = resolveShippingConfig(config);
  // Hors France (+ Monaco) : tarif Europe par zone/poids, une seule option.
  const zone = shippingZone(country);
  if (zone !== "FR") {
    return europeOptions(zone, { letterOnly, totalGrams });
  }
  const boxtalOn = Boolean(boxtal && boxtal.enabled);
  const home = () => homeOptions(cfg, { subtotal, letterOnly, totalGrams, parcelQty, glassQty, freeShipping });

  // --- Choix explicite fait sur la page panier -----------------------------
  // Point relais : Stripe n'affiche QUE cette option (prix par poids + nom du
  // point relais choisi sur la carte).
  if (deliveryMethod === "relais" && boxtalOn) {
    const price = pointRelaisPrice(totalGrams, boxtal, freeShipping, relaisCarrier);
    const carrierName = relaisCarrier ? relaisCarrierByCode(relaisCarrier).name : "";
    const label = [carrierName, relaisLabel].filter(Boolean).join(" — ").slice(0, 90);
    const name = label ? `Point relais ${label}` : "Livraison en point relais";
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
