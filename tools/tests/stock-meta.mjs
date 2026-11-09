// npm run test-stock-meta — la liste de stock envoyée au paiement n'est plus jamais coupée.
import { decouperStock, lireStockMeta, texteStock, regrouperStock } from "../../src/lib/stockMeta.js";
let ok = 0, ko = 0;
const t = (nom, c) => { if (c) ok++; else { ko++; console.log("❌", nom); } };
t("petit panier : une clé", Object.keys(decouperStock([["verre-vin-2", 1]])).join() === "stock");
t("lignes identiques additionnées", JSON.stringify(regrouperStock([["a", 1], ["a", 2], ["b", 1]])) === '[["a",3],["b",1]]');
t("panier vide : aucune clé", Object.keys(decouperStock([])).length === 0);
const gros = Array.from({ length: 40 }, (_, i) => [`bracelet-homme-cuir-tresse-acier-couleur-${i}`, i + 1]);
const meta = decouperStock(gros);
t("gros panier : plusieurs clés", Object.keys(meta).length > 1);
t("chaque clé ≤ 480 caractères", Object.values(meta).every((v) => v.length <= 480));
t("chaque clé est lisible seule", Object.values(meta).every((v) => { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }));
t("rien n'est perdu", JSON.stringify(lireStockMeta(meta)) === JSON.stringify(gros));
t("ancienne commande coupée : sautée sans planter", lireStockMeta({ stock: '[["a",1],["b' }).length === 0);
t("clé abîmée + clé saine : la saine est gardée", lireStockMeta({ stock: '[["a",1],["b', stock2: '[["c",2]]' })[0][0] === "c");
t("texte de la commande", texteStock({ stock: '[["a",1]]', stock2: '[["a",2]]' }) === '[["a",3]]');
t("pas de stock : texte vide", texteStock({}) === "");
console.log(ko ? `❌ ${ko} échec(s)` : `✅ test-stock-meta : ${ok} vérifications au vert`);
process.exit(ko ? 1 : 0);
