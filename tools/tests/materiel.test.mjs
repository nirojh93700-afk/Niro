// Matériel & conditionnement : décompte du stock, validation idempotente, correction, annulation.
// Lance : npm run test-materiel  (utilise la mémoire du serveur : aucune écriture en base).
import assert from "node:assert/strict";
const S = await import("../../src/lib/stock.js");
const stockDe = async (id) => (await S.getMateriel(true)).items.find((i) => i.id === id)?.stock;
let n = 0; const ok = (m) => { n++; console.log("✓", m); };

const dep = await stockDe("sac"); // départ : 89 (seed)
assert.equal(dep, 89); ok("stock de départ du sac = 89 (colis déjà emballés déduits)");

let r = await S.validerMateriel({ orderId: "T1", ref: "TEST1", lines: { sac: 1, carton15: 1, chips: 1 }, etiquette: 6.12, stripe: 0.54, produit: 3.24, encaisse: 19.21 });
assert.equal(await stockDe("sac"), 88); assert.equal(await stockDe("carton15"), 14); ok("valider décompte le stock");
assert.equal(r.usage.matCost, 1 + 1.87 + 0.71); ok("coût du matériel = somme des coûts × quantités");
assert.equal(r.usage.gain, Math.round((19.21 - 3.24 - 3.58 - 6.12 - 0.54) * 100) / 100); ok("gain = encaissé − produit − matériel − étiquette − Stripe");

r = await S.validerMateriel({ orderId: "T1", ref: "TEST1", lines: { sac: 1, carton15: 1 }, etiquette: 6.12, stripe: 0.54, produit: 3.24, encaisse: 19.21 });
assert.equal(await stockDe("sac"), 88); assert.equal(await stockDe("carton15"), 14); assert.equal(await stockDe("chips"), 50); ok("re-valider CORRIGE sans décompter deux fois (les chips retirées sont rendues)");

await S.validerMateriel({ orderId: "T2", ref: "TEST2", lines: { sac: 2 }, etiquette: 0, stripe: 0, produit: 0, encaisse: 10 });
assert.equal(await stockDe("sac"), 86); ok("deux commandes cumulent");

await S.annulerMateriel("T1");
assert.equal(await stockDe("sac"), 87); assert.equal(await stockDe("carton15"), 15); ok("annuler rend le matériel au stock");
assert.equal(await S.annulerMateriel("T1"), null); ok("annuler deux fois ne rend rien de plus");

await S.validerMateriel({ orderId: "T3", ref: "T3", lines: { boitea: 500 }, etiquette: 0, stripe: 0, produit: 0, encaisse: 0 });
assert.equal(await stockDe("boitea"), 0); ok("le stock ne descend jamais sous zéro");
await S.annulerMateriel("T3");
const it = await S.recevoirMateriel("sac", 50);
assert.equal(it.stock, 137); assert.equal(it.achete, 150); ok("réception d'un achat : stock et « acheté » montent");
const m = await S.saveMaterielItem({ id: "sac", cout: "1,25", seuil: "30" });
assert.equal(m.cout, 1.25); assert.equal(m.seuil, 30); ok("coût saisi avec une virgule, seuil modifiable");
const nv = await S.saveMaterielItem({ nouveau: true, nom: "Scotch fragile", cout: 0.2, stock: 10, cat: "eti" });
assert.ok(nv.id && (await S.getMateriel(true)).items.some((i) => i.nom === "Scotch fragile")); ok("ajout d'un nouveau matériel");
console.log(`\n${n} vérifications au vert`);
