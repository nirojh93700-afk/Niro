// npm run test-reachat — « à racheter » calculé sur la vitesse de vente.
import { lignesStock, reachatProduits, reachatMateriel, phraseReachat } from "../../src/lib/reachat.js";
let ok = 0, ko = 0;
const t = (nom, c) => { if (c) ok++; else { ko++; console.log("❌", nom); } };
const now = Date.UTC(2026, 10, 9);
const J = 86400000;
const cmd = (joursAvant, stock, extra = {}) => ({ createdAt: now - joursAvant * J, stock, ...extra });

t("lignes en texte JSON", JSON.stringify(lignesStock({ stock: '[["a",2],["b",1]]' })) === '[["a",2],["b",1]]');
t("lignes en tableau", lignesStock({ stock: [["a", 3]] })[0][1] === 3);
t("texte cassé = rien", lignesStock({ stock: "{oups" }).length === 0);

const rows = [{ stockId: "a", product: "Verre", variant: "36 cl" }, { stockId: "b", product: "Collier", variant: "" }, { stockId: "c", product: "Carafe", variant: "" }];
const orders = [cmd(5, '[["a",10]]'), cmd(20, [["a", 20]]), cmd(10, [["b", 2]]), cmd(90, [["c", 50]]), cmd(3, [["b", 100]], { status: "annulee" }), cmd(3, [["b", 100]], { test: true })];
const r = reachatProduits({ orders, stock: { a: 6, b: 40, c: 1 }, rows, now });
t("le verre qui part vite est signalé", r.length === 1 && r[0].id === "a");
t("jours restants = 12", r[0].jours === 12);
t("quantité conseillée = 45 jours − stock", r[0].aCommander === Math.ceil((30 / 60) * 45 - 6));
t("annulée et test ignorées (collier pas signalé)", !r.some((x) => x.id === "b"));
t("vente trop ancienne ignorée (carafe)", !r.some((x) => x.id === "c"));
t("stock non suivi jamais signalé", reachatProduits({ orders, stock: {}, rows, now }).length === 0);
const rup = reachatProduits({ orders, stock: { a: 0 }, rows, now });
t("rupture signalée", rup[0].rupture && phraseReachat(rup[0]) === "plus de stock");
t("rien vendu = pas d'alerte même à zéro", reachatProduits({ orders: [], stock: { a: 0 }, rows, now }).length === 0);

const items = [{ id: "carton", nom: "Carton", stock: 4, seuil: 5 }, { id: "sac", nom: "Sac", stock: 89, seuil: 20 }, { id: "chips", nom: "Chips", stock: 6, seuil: 0 }, { id: "vieux", nom: "Vieux", stock: 0, seuil: 5, archive: true }];
const usage = { o1: { at: now - 2 * J, lines: { chips: 10, sac: 1 } }, o2: { at: now - 100 * J, lines: { sac: 500 } } };
const m = reachatMateriel({ items, usage, now });
t("matériel sous le seuil signalé", m.some((x) => x.id === "carton" && x.sousSeuil));
t("matériel qui part vite signalé", m.some((x) => x.id === "chips" && x.jours === 36) === false && m.some((x) => x.id === "chips") === false);
const m2 = reachatMateriel({ items, usage: { o1: { at: now - 2 * J, lines: { chips: 30 } } }, now });
t("chips : 30 en 60 j, 6 en stock = 12 jours", m2.find((x) => x.id === "chips")?.jours === 12);
t("sac tranquille", !m.some((x) => x.id === "sac"));
t("archivé ignoré", !m.some((x) => x.id === "vieux"));
t("phrase sous seuil sans vente", phraseReachat(m.find((x) => x.id === "carton")).includes("sous le seuil de 5"));

console.log(ko ? `❌ ${ko} échec(s), ${ok} au vert` : `✅ test-reachat : ${ok} vérifications au vert`);
process.exit(ko ? 1 : 0);
