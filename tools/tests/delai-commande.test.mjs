// Délai des commandes en jours ouvrés / calendaires (26/10/2026). `npm run test-delai`.
import { delaiCommande, texteDelai, estOuvre, joursFeries, numJour, ajouterOuvres } from "@/lib/delaiCommande";
let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };
const J = (s) => numJour(Date.parse(s));
// Fériés 2026 : Pâques 5 avril → lundi 6 avril, Ascension 14 mai, Pentecôte lundi 25 mai.
const f = joursFeries(2026);
v(f.has(J("2026-04-06T12:00:00+02:00")) && f.has(J("2026-05-14T12:00:00+02:00")) && f.has(J("2026-05-25T12:00:00+02:00")), "fériés mobiles 2026");
v(!estOuvre(J("2026-11-11T12:00:00+01:00")) && !estOuvre(J("2026-10-25T12:00:00+01:00")) && estOuvre(J("2026-10-26T12:00:00+01:00")), "11 novembre et dimanche non ouvrés, lundi ouvré");
const demain = Date.parse("2026-10-27T10:00:00+01:00");
// Pierre, mercredi 21/10 17 h 44, fabrication immédiate → limite = 5e jour ouvré = mercredi 28/10.
const p = delaiCommande({ createdAt: "2026-10-21T15:44:00Z", immediateStart: true, status: "a_preparer" }, demain);
v(p.limite === J("2026-10-28T12:00:00+01:00"), "limite Pierre = mer. 28/10");
v(p.ouvresEcoules === 4 && p.calendairesEcoules === 6, "Pierre : 4 j ouvrés, 6 j calendaires au 27/10");
v(p.ouvresRestants === 1 && p.etat === "bientot", "Pierre : encore 1 j ouvré");
// Jeudi 22/10 → limite jeudi 29/10.
const k = delaiCommande({ createdAt: "2026-10-22T14:02:00Z", immediateStart: true, status: "a_preparer" }, demain);
v(k.limite === J("2026-10-29T12:00:00+01:00") && k.ouvresEcoules === 3 && k.etat === "ok", "Karine : limite jeu. 29/10, 3 j ouvrés écoulés");
// Sans fabrication immédiate : un jour de plus.
const s = delaiCommande({ createdAt: "2026-10-22T14:02:00Z", immediateStart: false, status: "a_preparer" }, demain);
v(s.limite === J("2026-10-30T12:00:00+01:00"), "sans fabrication immédiate : ven. 30/10");
// Lundi 12/10 regardé le 27/10 : dépassé.
const m = delaiCommande({ createdAt: "2026-10-12T17:16:00Z", immediateStart: true, status: "en_gravure" }, demain);
v(m.etat === "depasse" && m.ouvresRestants === -6, "12/10 : dépassé de 6 j ouvrés");
// Expédiée : figée au jour de l'expédition.
const e = delaiCommande({ createdAt: "2026-10-19T09:15:00Z", immediateStart: true, status: "expediee", shippedAt: "2026-10-22T14:28:00Z" }, demain);
v(e.etat === "parti" && e.ouvresEcoules === 3 && e.calendairesEcoules === 3 && e.aTemps, "expédiée en 3 j ouvrés, dans les temps");
v(/au plus tard le mer\. 28 oct\./.test(texteDelai(p)) && /4 j ouvrés · 6 j calendaires/.test(texteDelai(p)), "phrase : " + texteDelai(p));
v(/^Expédiée en 3 j ouvrés · 3 j calendaires · dans les temps$/.test(texteDelai(e)), "phrase expédiée : " + texteDelai(e));
// Vendredi soir → limite le vendredi suivant (week-end sauté) ; veille du 11 novembre.
v(ajouterOuvres(J("2026-11-06T20:00:00+01:00"), 5) === J("2026-11-16T12:00:00+01:00"), "ven. 6/11 + 5 j ouvrés = lun. 16/11 (11/11 férié)");
v(delaiCommande({}) === null, "sans date → rien");
console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);
