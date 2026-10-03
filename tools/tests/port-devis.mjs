// Livraison choisie par le client sur un devis (03/10/2026) : `npm run test-port-devis`
// Le devis calcule le port avec le MÊME code que le panier (src/lib/panierPort.js).
import { lignesPort, livraisonActive, poidsDevis, portDevis, nettoyerRelais } from "../../src/lib/portDevis.js";
import { nouvelEtatPort, ajouterLignePort, optionsPort } from "../../src/lib/panierPort.js";
let ok = 0, ko = 0;
const t = (nom, cond, extra = "") => { if (cond) ok++; else { ko++; console.log("✗", nom, extra); } };

// Faux catalogue : un bijou (lettre), la carafe (offerte dès 45 €), un verre.
const index = new Map([
  ["bijou-1", { product: { letter: true, weight: 72, category: "bijoux", pickup: false }, variant: { id: "bijou-1", weight: 72 } }],
  ["carafe-1", { product: { letter: false, weight: 1500, category: "verres", pickup: false, freeShipThreshold: 45 }, variant: { id: "carafe-1" } }],
  ["verre-1", { product: { letter: false, weight: 400, category: "verres", pickup: false, freeShipThreshold: 45 }, variant: { id: "verre-1", weight: 400 } }],
  ["deco-1", { product: { letter: false, weight: 300, category: "mariage", pickup: true }, variant: { id: "deco-1" } }],
]);
const settings = { boxtal: { enabled: true } };
const prix = (items, method = "domicile", rp = null, total) => portDevis({ items, total: total ?? items.reduce((s, i) => s + i.qty * i.price, 0) }, settings, index, method, rp);

// --- ligne libre (ex. clé USB 64 Go avec coffret)
const cle = { desc: "Clé USB 64 Go gravée", qty: 1, price: 44.9, weight: 150 };
t("ligne libre : poids saisi", poidsDevis([cle], index) === 150);
t("ligne libre : choix actif", livraisonActive([cle], index));
t("clé libre à domicile = 6,90 €", prix([cle]).price === 6.9, String(prix([cle]).price));
const rp = { carrier: "MONR", carrierName: "Mondial Relay", name: "Tabac Le Balto", street: "12 rue de la Gare", zipCode: "95350", city: "Saint-Brice" };
const rel = prix([cle], "relais", rp);
t("clé libre en relais Mondial Relay = 4,90 €", rel.ok && rel.price === 4.9, String(rel.price));
t("adresse du point relais complète", rel.relaisFull === "Mondial Relay — Tabac Le Balto — 12 rue de la Gare — 95350 Saint-Brice", rel.relaisFull);
t("relais sans point = pas d'adresse", prix([cle], "relais", null).relaisFull === "");
t("relais refusé si coupé dans Gestion", !portDevis({ items: [cle], total: 44.9 }, { boxtal: { enabled: false } }, index, "relais", rp).ok);
t("l'option Stripe est en centimes", prix([cle]).option.shipping_rate_data.fixed_amount.amount === 690);

// --- cas où il NE FAUT PAS de choix (anciens devis, ligne livraison manuelle…)
t("ancien devis (rien de rattaché, pas de poids)", !livraisonActive([{ desc: "Carafe", qty: 1, price: 54.9 }], index));
t("une ligne sans poids ni article bloque tout", !livraisonActive([cle, { desc: "Boîte", qty: 1, price: 5 }], index));
t("ligne « Livraison » ajoutée à la main = pas de choix", !livraisonActive([cle, { desc: "Livraison", qty: 1, price: 6.9 }], index));
t("article inconnu du catalogue sans poids", !livraisonActive([{ desc: "x", qty: 1, price: 5, variantId: "n-existe-pas" }], index));
t("devis vide", !livraisonActive([], index));

// --- règles du SITE reprises pour les lignes rattachées à un produit
const carafe = { desc: "Carafe", qty: 1, price: 54.9, variantId: "carafe-1" };
t("carafe ≥ 45 € : livraison offerte (comme le site)", prix([carafe]).price === 0, String(prix([carafe]).price));
t("carafe ≥ 45 € : relais offert aussi", prix([carafe], "relais", rp).price === 0);
t("poids de la fiche utilisé quand rien n'est saisi", poidsDevis([carafe], index) === 1500);
t("poids saisi prime sur la fiche (grosse commande)", poidsDevis([{ ...carafe, weight: 8000 }], index) === 8000);
t("colis plus lourd = port plus cher", prix([{ ...carafe, price: 20, weight: 8000 }]).price > prix([{ ...carafe, price: 20 }]).price);
const bijou = { desc: "Collier", qty: 1, price: 30, variantId: "bijou-1" };
t("bijou léger = lettre suivie (4,90 €)", prix([bijou]).price === 4.9, String(prix([bijou]).price));
t("bijou dès 45 € = offert", prix([{ ...bijou, price: 50 }]).price === 0);
t("bijou en boîte rigide = colis, plus cher que la lettre", prix([{ ...bijou, boite: true }]).price > 4.9, String(prix([{ ...bijou, boite: true }]).price));
t("la case boîte est ignorée sur un produit non-lettre", prix([{ ...carafe, price: 20, boite: true }]).price === prix([{ ...carafe, price: 20 }]).price);
const verres3 = { desc: "Verres", qty: 3, price: 10, variantId: "verre-1" };
t("3 verres = tarif verres du site (plus que le tarif déco)", prix([verres3]).price > prix([{ ...verres3, variantId: "deco-1" }]).price, `${prix([verres3]).price} vs ${prix([{ ...verres3, variantId: "deco-1" }]).price}`);

// --- identique au panier, par construction : on recalcule à la main avec le code partagé
{
  const items = [bijou, { ...verres3, price: 12 }];
  const e = nouvelEtatPort();
  for (const l of lignesPort(items, index)) ajouterLignePort(e, l);
  const direct = optionsPort(e, { settings, country: "FR", express: false, retraitOk: false, deliveryMethod: "domicile" });
  t("devis ≡ calcul partagé du panier (panier mixte)", JSON.stringify(direct[0]) === JSON.stringify(prix(items).option));
}
t("le point relais est nettoyé", nettoyerRelais({ ...rp, name: "x".repeat(200) }).name.length === 80 && nettoyerRelais({ carrier: "MONR" }) === null);
console.log(ko ? `${ko} échec(s)` : `OK — ${ok} vérifications`);
process.exit(ko ? 1 : 0);
