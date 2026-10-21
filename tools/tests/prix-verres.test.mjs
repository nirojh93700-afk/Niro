// npm run test-prix-verres — règle de prix de la gravure des verres (16/10/2026).
import { prixGravureVerres, verreGrave } from "../../src/lib/prixVerres.js";
let ok = 0, ko = 0;
const t = (nom, cond, info = "") => { if (cond) ok++; else { ko++; console.log("✗", nom, info); } };
const P = { engravingPricing: { textKeys: ["texte", "prenom", "date", "initiale"], textExtra: 3 } };            // vin / flûte
const W = { engravingPricing: { flatExtras: [{ key: "texte", amount: 3 }, { key: "texte2", amount: 3 }, { key: "emplacement", value: "deux", amount: 7 }] } }; // whisky / cocktail
const U = { id: "u", title: "À l'unité" }, L2 = { id: "l2", title: "Lot de 2" }, L4 = { id: "l4", title: "Lot de 4" };
const photo = { mode: "photo", photo: "/api/img/a" }, photoTexte = { ...photo, texte: "Fabien" }, logo = { mode: "photo", photo: "/api/img/b", texte: "Zoo Bar" };

t("1 verre photo seule = 0", prixGravureVerres(P, U, 1, photo).total === 0);
t("1 verre photo + texte = 3", prixGravureVerres(P, U, 1, photoTexte).total === 3);
t("2 identiques logo + texte = 3 + 5", prixGravureVerres(P, U, 2, photoTexte).total === 8);
t("lot de 2 identiques logo + texte = 3 + 5", prixGravureVerres(P, L2, 1, photoTexte).total === 8);
t("2 identiques logo seul = 0 + 3", prixGravureVerres(P, L2, 1, photo).total === 3);
t("3 identiques logo + texte = 3 + 5 + 5", prixGravureVerres(P, U, 3, photoTexte).total === 13);
t("6 identiques logo + texte = 3 + 5 × 5", prixGravureVerres(P, U, 6, photoTexte).total === 28);
t("6 identiques logo seul = 3 × 5", prixGravureVerres(P, U, 6, photo).total === 15);
t("2e verre différent logo + texte = 3 + 5", prixGravureVerres(P, U, 2, {}, [photoTexte, logo]).total === 8);
t("2e verre texte seul = 3 + 3", prixGravureVerres(P, U, 2, {}, [photoTexte, { texte: "B" }]).total === 6);
t("2e verre vierge = 3", prixGravureVerres(P, U, 2, {}, [photoTexte, {}]).total === 3);
t("lot de 4 : logo+texte, logo+texte, logo seul, texte seul = 3 + 5 + 3 + 3", prixGravureVerres(P, L4, 1, {}, [photoTexte, logo, photo, { texte: "B" }]).total === 14);
const w = prixGravureVerres(W, U, 2, { mode: "photo", photo: "x", texte: "Papa", emplacement: "deux" });
t("whisky 2 identiques logo + texte face+fond = 3+7 + 5+7", w.total === 22, JSON.stringify(w));
t("whisky 2e verre texte seul face+fond = 0+7 + 3+7 (1er texte offert depuis le 21/10)", prixGravureVerres(W, U, 2, {}, [{ texte: "Papa", emplacement: "deux" }, { texte: "Papy", emplacement: "deux" }]).total === 17);
// 21/10/2026 : verre 1 sans logo → le premier texte est offert, les suivants +3 €.
t("1 verre texte seul = 0", prixGravureVerres(P, U, 1, { mode: "texte", texte: "Léa" }).total === 0);
t("1 verre texte + date sans logo = 3", prixGravureVerres(P, U, 1, { mode: "texte", texte: "Léa", date: "2024" }).total === 3);
t("1 verre logo + texte = 3 (inchangé)", prixGravureVerres(P, U, 1, photoTexte).total === 3);
t("2 identiques texte seul = 0 + 3", prixGravureVerres(P, U, 2, { mode: "texte", texte: "Léa" }).total === 3);
t("whisky 1 verre texte seul = 0", prixGravureVerres(W, U, 1, { texte: "Papa" }).total === 0);
t("whisky 1 verre texte + date = 3", prixGravureVerres(W, U, 1, { texte: "Papa", texte2: "2024" }).total === 3);
t("whisky 1 verre texte seul face+fond = 7", prixGravureVerres(W, U, 1, { texte: "Papa", emplacement: "deux" }).total === 7);
t("whisky 2 verres texte seul = 0 + 3", prixGravureVerres(W, U, 2, { texte: "Papa" }).total === 3);
const t1 = prixGravureVerres(W, U, 1, { texte: "Papa" });
t("détail : premier texte offert", t1.lignes.length === 1 && /premier texte/.test(t1.lignes[0].libelle) && t1.lignes[0].montant === 0, JSON.stringify(t1.lignes));
t("verre vierge = pas grave", verreGrave({ police: "playfair" }) === false);
const r = prixGravureVerres(P, U, 2, {}, [photoTexte, logo]);
t("le détail liste les lignes", r.lignes.some((l) => /logo et texte/.test(l.libelle)) && r.lignes.some((l) => l.montant === 0));
console.log(`${ok} vérifications au vert, ${ko} en échec`);
if (ko) process.exit(1);
