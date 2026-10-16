// Compteur des paniers abandonnés (14/10/2026) : ventes lues dans les vraies commandes,
// paniers comptés par personne. `npm run test-stats`.
import { ventesParJour, bilanPaniers, estVenteBoutique, dateParis } from "@/lib/statsVisites";
let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };

v(dateParis("2026-10-13T23:30:00Z") === "2026-10-14", "date de Paris (minuit passé à Paris)");
v(!estVenteBoutique({ test: true, createdAt: "x" }) && !estVenteBoutique({ surMesure: true, createdAt: "x" }), "test et devis exclus");
const orders = [
  { createdAt: "2026-10-14T09:00:00Z", total: 30.5 },
  { createdAt: "2026-10-14T10:00:00Z", total: 20 },
  { createdAt: "2026-10-13T10:00:00Z", total: 15, surMesure: true },
  { createdAt: "2026-10-12T10:00:00Z", total: 12, test: true },
];
const vj = ventesParJour(orders, ["2026-10-13", "2026-10-14"]);
v(vj["2026-10-14"].n === 2 && vj["2026-10-14"].ca === 50.5 && vj["2026-10-13"].n === 0, "ventes du jour : 2 commandes, 50,50 €, le devis ne compte pas");

v(bilanPaniers([{ date: "a", cartSessions: 0, ventes: 3 }]).mesure === false, "pas encore de données : pas de faux chiffre");
const b = bilanPaniers([
  { date: "2026-10-13", cartSessions: 0, checkoutSessions: 0, ventes: 5 },   // avant le nouveau compteur : ignoré
  { date: "2026-10-14", cartSessions: 6, checkoutSessions: 3, ventes: 2 },
  { date: "2026-10-15", cartSessions: 4, checkoutSessions: 2, ventes: 1 },
]);
v(b.mesure && b.depuis === "2026-10-14", "mesure à partir du premier jour du nouveau compteur");
v(b.paniers === 10 && b.ventes === 3 && b.abandons === 7, "10 paniers, 3 ventes → 7 abandons (les ventes d'avant ne comptent pas)");
v(b.auPaiement === 2 && b.avantPaiement === 5, "2 partis au paiement, 5 avant");
const c = bilanPaniers([{ date: "d", cartSessions: 2, checkoutSessions: 2, ventes: 4 }]);
v(c.abandons === 0 && c.auPaiement === 0, "plus de ventes que de paniers (achat en 2 visites) : jamais négatif");
console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);
