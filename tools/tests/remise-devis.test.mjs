// Remise d'un code promo sur un devis (03/10/2026) : `npm run test-remise-devis`
import { calculRemiseDevis, estLignePort, totalRemisable } from "../../src/lib/remiseDevis.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.log("✗", nom); } };
const devis = [{ desc: "Clé USB 64 Go gravée", qty: 1, price: 44.9 }, { desc: "Livraison en colis suivi", qty: 1, price: 6.9 }];
t("la ligne livraison est reconnue", estLignePort("Livraison en colis suivi") && estLignePort("Frais de port") && estLignePort("Port 6,90"));
t("un article n'est pas pris pour du port", !estLignePort("Portrait gravé") && !estLignePort("Clé USB"));
t("base = articles seuls", totalRemisable(devis) === 44.9);
t("−10 % sur la clé = 4,49 €", calculRemiseDevis({ type: "percent", value: 10 }, devis) === 4.49);
t("la livraison n'est jamais remisée", calculRemiseDevis({ type: "percent", value: 100 }, devis) === 44.9);
t("montant fixe plafonné aux articles", calculRemiseDevis({ type: "fixed", value: 80 }, devis) === 44.9);
t("montant fixe", calculRemiseDevis({ type: "fixed", value: 5 }, devis) === 5);
t("devis sans article remisable = 0", calculRemiseDevis({ type: "percent", value: 10 }, [{ desc: "Livraison", qty: 1, price: 6.9 }]) === 0);
t("valeur nulle = 0", calculRemiseDevis({ type: "percent", value: 0 }, devis) === 0);
t("quantités multipliées", calculRemiseDevis({ type: "percent", value: 10 }, [{ desc: "Clé", qty: 3, price: 40 }]) === 12);
console.log(ko ? `${ko} échec(s)` : `OK — ${ok} vérifications`);
process.exit(ko ? 1 : 0);
