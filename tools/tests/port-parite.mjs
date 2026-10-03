// PARITÉ du calcul du port : l'ANCIEN code de /api/checkout (copié tel quel ci-dessous, figé) contre
// le calcul partagé src/lib/panierPort.js, sur des milliers de paniers aléatoires. `npm run test-port-parite`
import { buildShippingOptions, resolveShippingConfig } from "../../src/lib/shipping.js";
import { nouvelEtatPort, ajouterLignePort, optionsPort } from "../../src/lib/panierPort.js";

// ===== ANCIEN CODE (copie figée de /api/checkout avant le 03/10/2026) =====
function ancien(lignes, ctx) {
  let totalGrams = 0, subtotal = 0, parcelQty = 0, glassQty = 0, letterOnly = true, tousBijouxLettre = true, bijouEnBoite = false, allFreeShip = true, allPickup = true, allColisThreshFree = true, colisThresh = Infinity;
  for (const { product, unitGrams, unitPrice, quantity, pkgBoite } of lignes) {
    totalGrams += unitGrams * quantity;
    subtotal += unitPrice * quantity;
    if (product.letter && pkgBoite) bijouEnBoite = true;
    if (!product.letter) tousBijouxLettre = false;
    if (!product.letter || pkgBoite) { letterOnly = false; parcelQty += quantity; }
    if (!product.letter) {
      if (product.freeShipping) { }
      else if (product.freeShipThreshold) colisThresh = Math.min(colisThresh, Number(product.freeShipThreshold));
      else allColisThreshFree = false;
    }
    if (product.category === "verres") glassQty += quantity;
    if (!product.freeShipping) allFreeShip = false;
    if (!product.pickup) allPickup = false;
  }
  const settings = ctx.settings;
  return buildShippingOptions({
    totalGrams, subtotal, parcelQty, glassQty, letterOnly,
    bijouxOnly: tousBijouxLettre,
    freeShipping: allFreeShip
      || (allColisThreshFree && parcelQty > 0 && subtotal >= colisThresh)
      || (tousBijouxLettre && bijouEnBoite && subtotal >= resolveShippingConfig(settings?.shipping).bijouxFreeThreshold),
    country: ctx.country,
    pickupEligible: allPickup && ctx.retraitOk,
    express: ctx.express,
    config: settings?.shipping, boxtal: settings?.boxtal,
    deliveryMethod: ctx.deliveryMethod, relaisLabel: ctx.relaisLabel, relaisCarrier: ctx.relaisCarrier,
  });
}
// ===== FIN ANCIEN CODE =====

function nouveau(lignes, ctx) {
  const e = nouvelEtatPort();
  for (const l of lignes) ajouterLignePort(e, l);
  return optionsPort(e, ctx);
}

let graine = 12345;
const rnd = () => (graine = (graine * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const produit = () => ({
  letter: rnd() < 0.45, freeShipping: rnd() < 0.15, freeShipThreshold: pick([0, 0, 45, 60]),
  category: pick(["verres", "bijoux", "cadeaux", "mariage", "cristal"]), pickup: rnd() < 0.35,
});
const settingsPossibles = [
  undefined, {}, { boxtal: { enabled: true } }, { boxtal: { enabled: true, pointRelaisPrice: 5.5 } },
  { boxtal: { enabled: false } }, { shipping: { bijouxHome: 5.9, bijouxFreeThreshold: 60 }, boxtal: { enabled: true } },
];
let ok = 0, ko = 0;
for (let i = 0; i < 6000; i++) {
  const n = 1 + Math.floor(rnd() * 4);
  const lignes = Array.from({ length: n }, () => ({
    product: produit(), unitGrams: pick([20, 72, 100, 150, 320, 550, 1100, 2800]), unitPrice: Math.round(rnd() * 12000) / 100,
    quantity: 1 + Math.floor(rnd() * 6), pkgBoite: rnd() < 0.25,
  }));
  const ctx = {
    settings: pick(settingsPossibles), country: pick(["FR", "FR", "FR", "MC", "BE", "DE", "ES", "CH"]),
    retraitOk: rnd() < 0.5, express: rnd() < 0.3, deliveryMethod: pick(["", "domicile", "relais", "retrait"]),
    relaisLabel: pick(["", "Tabac, Paris"]), relaisCarrier: pick(["", "MONR", "SOGP", "CHRP", "UPSE"]),
  };
  const a = JSON.stringify(ancien(lignes, ctx)), b = JSON.stringify(nouveau(lignes, ctx));
  if (a === b) ok++; else { ko++; if (ko < 4) console.log("✗ divergence", JSON.stringify(lignes), JSON.stringify(ctx), "\n ancien:", a, "\n nouveau:", b); }
}
console.log(ko ? `${ko} divergence(s) sur ${ok + ko}` : `OK — ${ok} paniers : ancien code ≡ calcul partagé`);
process.exit(ko ? 1 : 0);
