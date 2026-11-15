// Tests « Niv Admin » (15/11/2026) : comptabilité, heures calmes, classeur des factures, photos du colis.
// npm run test-niv-admin
import assert from "node:assert/strict";
import { livreRecettes, caParMois, declarationsUrssaf, tableauDeBord, reglageCompta, cotisations, rapprocherVersement, SEUILS_2026 } from "@/lib/comptabilite";
import { reglageTelephone, dansHeuresCalmes } from "@/lib/notifTelephone";
import { etatClasseur, chercher } from "@/lib/classeurFactures";
import { etatPhotosColis } from "@/lib/photosColis";
import { textePdf } from "@/lib/dossierPreuve";

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m); n++; };

// --- Comptabilité ---
const orders = [
  { id: "a", ref: "AAA", createdAt: "2026-10-05T10:00:00Z", total: 31.8, customerName: "Inés", items: [{ name: "Verre", quantity: 1 }, { name: "Livraison", quantity: 1 }] },
  { id: "b", ref: "BBB", createdAt: "2026-10-20T10:00:00Z", total: 100, customerName: "Paul", quoteNumber: "DEV-1", items: [] },
  { id: "c", ref: "CCC", createdAt: "2026-10-21T10:00:00Z", total: 50, status: "remboursee" },
  { id: "d", ref: "DDD", createdAt: "2026-10-22T10:00:00Z", total: 40, status: "annulee" },
  { id: "e", ref: "EEE", createdAt: "2026-10-23T10:00:00Z", total: 60, test: true },
  { id: "f", ref: "FFF", createdAt: "2026-11-02T10:00:00Z", total: 80, remboursements: [{ montant: 20, at: Date.parse("2026-11-04T10:00:00Z") }] },
];
const rec = livreRecettes({ orders, ventesExternes: [{ id: "v1", mois: "2026-10", montant: 15.8, source: "Marché" }] });
eq(rec.filter((r) => r.type === "vente").map((r) => r.piece).sort(), ["AAA", "BBB", "FFF"], "ventes : sans annulée, remboursée, test");
ok(rec.some((r) => r.type === "remboursement" && r.montant === -20 && r.mois === "2026-11"), "remboursement partiel en négatif, au mois du remboursement");
ok(rec.find((r) => r.piece === "AAA").nature === "Verre", "nature sans la ligne de livraison");
const pm = caParMois(rec);
eq(pm["2026-10"], 147.6, "CA octobre = 31,80 + 100 + 15,80");
eq(pm["2026-11"], 60, "CA novembre = 80 − 20");
const regl = reglageCompta({});
eq(regl, { taux: 12.3, cfp: 0.1, vl: 0 }, "taux par défaut vérifiés le 15/11/2026");
eq(cotisations(1000, regl), 124, "12,4 % de 1 000 €");
eq(reglageCompta({ compta: { taux: 9.3, cfp: 0.3, vl: 1 } }), { taux: 9.3, cfp: 0.3, vl: 1 }, "taux réglés");
const decl = declarationsUrssaf({ recettes: rec, declared: { "2026-09": "2026-10-28" }, regl, maintenant: new Date("2026-11-15T12:00:00Z") });
eq(decl[0].mois, "2026-10", "dernier mois terminé en tête");
eq(decl[0].echeance, "2026-11-30", "octobre se déclare avant le 30 novembre");
eq(decl[0].detail, { site: 31.8, devis: 100, horsSite: 15.8, remb: 0 }, "détail d'octobre");
ok(!decl.some((x) => x.mois === "2026-11"), "le mois en cours n'est pas encore à déclarer");
ok(decl.find((x) => x.mois === "2026-09").declareLe, "septembre déclaré");
eq(decl[decl.length - 1].mois, "2026-06", "depuis le début d'activité (juin 2026)");
const bord = tableauDeBord({ recettes: rec, achats: [{ date: "2026-11-03", montant: 41.52 }], regl, declarations: decl, maintenant: new Date("2026-11-15T12:00:00Z") });
eq(bord.caAnnee, 207.6, "CA de l'année");
eq(bord.aDeclarer.mois, "2026-06", "plus ancien mois non déclaré d'abord");
eq(bord.mois6[5], { mois: "2026-11", recettes: 60, achats: 41.52 }, "graphique : novembre");
eq(bord.jauges[0].seuil, 85000, "franchise de TVA ventes 2026 = 85 000 €");
eq(SEUILS_2026.tva.majore, 93500, "seuil majoré 93 500 €");
eq(bord.jauges[1].seuil, 203100, "plafond micro ventes 203 100 €");
const v = rapprocherVersement({ id: "po", montant: 104.93, transactions: [{ type: "charge", montant: 31.8, frais: 0.73, paymentIntent: "pi_a" }, { type: "charge", montant: 74.7, frais: 0.84, paymentIntent: "pi_x" }] }, { pi_a: { ref: "AAA" }, pi_x: { ref: "XXX" } });
eq([v.brut, v.frais, v.ecart, v.etat], [106.5, 1.57, 0, "ok"], "versement qui concorde");
const v2 = rapprocherVersement({ id: "po2", montant: 50, transactions: [{ type: "charge", montant: 60, frais: 1, paymentIntent: "pi_inconnu" }] }, {});
eq([v2.sansCommande, v2.etat], [1, "ecart"], "paiement sans commande = écart");

// --- Heures calmes ---
const t = reglageTelephone({ telephone: { calme: true, calmeDe: "22:00", calmeA: "07:30" } });
ok(dansHeuresCalmes(t, new Date("2026-11-15T22:30:00Z")), "23 h 30 à Paris = calme");
ok(!dansHeuresCalmes(t, new Date("2026-11-15T12:00:00Z")), "13 h à Paris = pas calme");
ok(dansHeuresCalmes(t, new Date("2026-11-16T05:00:00Z")), "6 h à Paris = calme");
ok(!dansHeuresCalmes(reglageTelephone(null), new Date("2026-11-15T22:30:00Z")), "heures calmes éteintes par défaut");
eq(reglageTelephone(null).litige, true, "litige sonne par défaut");

// --- Classeur ---
const cl = etatClasseur({
  factures: [{ id: "fac1", fournisseur: "METRO", date: "2026-11-14", montant: 41.52, categorie: "marchandises", fichier: { id: "f_1", sha: "x" }, achatId: "ach1" }],
  purchases: [{ id: "ach1", supplier: "METRO", total: 41.52, at: 1, expenseId: "dep1" }, { id: "ach2", supplier: "Alibaba", total: 153.94, date: "2026-10-23", at: 2, fileName: "recu.pdf" }],
  expenses: [{ id: "dep1", label: "Achat METRO", amount: 41.52, date: "2026-11-14" }, { id: "dep2", label: "xTool acompte", amount: 40, date: "2026-11-01" }],
}, new Date("2026-11-15T12:00:00Z"));
eq(cl.lignes.length, 3, "facture rangée + achat sans fichier + dépense sans pièce (pas de doublon METRO)");
eq(cl.kpis.manquantes, 2, "2 manquantes");
eq(cl.kpis.mois, { montant: 81.52, n: 2 }, "achats de novembre");
eq(chercher(cl.lignes, "alibaba").length, 1, "recherche fournisseur");
eq(chercher(cl.lignes, "41,52").length, 1, "recherche montant à la française");

// --- Photos du colis / PDF ---
const e = etatPhotosColis({ photosColis: [{ k: "contenu" }, { k: "autre" }] });
eq([e.n, e.manquent.map((x) => x.k), e.autres], [1, ["ferme", "etiquette"], 1], "1 photo guidée sur 3");
eq(textePdf("Œuvre « l’été » — 5 €"), "OEuvre « l'été » - 5 €", "texte du PDF : caractères remplacés");

console.log(`✓ niv-admin : ${n} vérifications`);
