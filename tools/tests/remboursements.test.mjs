// Remboursements faits dans Stripe → ce que Gestion doit corriger (27/11/2026).
import { planRemboursements } from "../../src/lib/remboursementsPlan.js";
import { livreRecettes } from "../../src/lib/comptabilite.js";

let n = 0;
const ok = (c, m) => { if (!c) { console.error("✗ " + m); process.exit(1); } n++; console.log("✓ " + m); };
const J = Date.parse("2026-11-20T10:00:00Z");
const orders = [
  { id: "a", ref: "AAAA", status: "livree", total: 78.32, paymentIntentId: "pi_a", createdAt: "2026-11-05T10:00:00Z" },
  { id: "b", ref: "BBBB", status: "en_gravure", total: 50, paymentIntentId: "pi_b", createdAt: "2026-11-06T10:00:00Z" },
  { id: "c", ref: "CCCC", status: "remboursee", total: 30, paymentIntentId: "pi_c", createdAt: "2026-10-06T10:00:00Z" },
  { id: "d", ref: "DDDD", status: "annulee", total: 31.8, paymentIntentId: "pi_d", createdAt: "2026-08-23T10:00:00Z" },
  { id: "e", ref: "EEEE", status: "livree", total: 40, paymentIntentId: "pi_e", rembourse: 10, remboursements: [{ montant: 10, at: J, stripeId: "re_e1" }], createdAt: "2026-11-07T10:00:00Z" },
  { id: "f", ref: "FFFF", status: "livree", total: 20, paymentIntentId: "pi_f", createdAt: "2026-11-08T10:00:00Z" },
  { id: "g", ref: "GGGG", status: "livree", total: 60, paymentIntentId: "pi_g", createdAt: "2026-11-08T10:00:00Z" },
  { id: "t", ref: "TEST", status: "livree", total: 5, test: true, paymentIntentId: "pi_t", createdAt: "2026-11-08T10:00:00Z" },
];
const refunds = [
  { id: "re_a", paymentIntent: "pi_a", montant: 78.32, at: J, status: "succeeded" },
  { id: "re_b", paymentIntent: "pi_b", montant: 12.5, at: J, status: "succeeded" },
  { id: "re_c", paymentIntent: "pi_c", montant: 30, at: J, status: "succeeded" },
  { id: "re_d", paymentIntent: "pi_d", montant: 31.8, at: J, status: "succeeded" },
  { id: "re_e1", paymentIntent: "pi_e", montant: 10, at: J, status: "succeeded" },
  { id: "re_g1", paymentIntent: "pi_g", montant: 20, at: J, status: "succeeded" },
  { id: "re_g2", paymentIntent: "pi_g", montant: 40, at: J + 1000, status: "succeeded" },
  { id: "re_f", paymentIntent: "pi_f", montant: 20, at: J, status: "failed" },
  { id: "re_t", paymentIntent: "pi_t", montant: 5, at: J, status: "succeeded" },
  { id: "re_x", paymentIntent: "pi_inconnu", montant: 9, at: J, status: "succeeded" },
];
const plan = planRemboursements(orders, refunds);
const de = (ref) => plan.find((p) => p.ref === ref);
ok(de("AAAA")?.type === "total" && de("AAAA").patch.status === "remboursee", "tout rendu dans Stripe : la commande passe « remboursée »");
ok(de("BBBB")?.type === "partiel" && de("BBBB").patch.rembourse === 12.5 && !de("BBBB").patch.status, "une partie rendue : montant noté, statut gardé");
ok(!de("CCCC") && !de("DDDD"), "commande déjà remboursée ou annulée : rien à faire");
ok(!de("EEEE"), "remboursement partiel déjà connu de Gestion : rien à refaire");
ok(!de("FFFF"), "remboursement échoué chez Stripe : la commande reste comptée");
ok(de("GGGG")?.type === "total" && de("GGGG").nouveaux.length === 2, "deux remboursements qui font le total : « remboursée »");
ok(!de("TEST") && plan.length === 3, "commande de test et paiement inconnu ignorés");
// Rejouer après correction ne change plus rien (pas de boucle).
const apres = orders.map((o) => { const p = plan.find((x) => x.id === o.id); return p ? { ...o, ...p.patch } : o; });
ok(planRemboursements(apres, refunds).length === 0, "deuxième passage : plus rien à corriger");
// Effet sur le livre des recettes (ce qu'il faut déclarer).
const avant = livreRecettes({ orders, ventesExternes: [] }).reduce((s, r) => s + r.montant, 0);
const apr = livreRecettes({ orders: apres, ventesExternes: [] }).reduce((s, r) => s + r.montant, 0);
ok(Math.abs(avant - apr - (78.32 + 12.5 + 60)) < 0.01, "le livre des recettes baisse de ce qui a été rendu (150,82 €)");
console.log(`\n${n} vérifications au vert`);
