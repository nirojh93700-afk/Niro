// npm run test-prix-verres — règle de prix de la gravure des verres (16/10/2026).
import { prixGravureVerres, fraisIdentiques, verreGrave } from "../../src/lib/prixVerres.js";
let ok = 0, ko = 0;
const t = (nom, cond, info = "") => { if (cond) ok++; else { ko++; console.log("✗", nom, info); } };
const P = { engravingPricing: { textKeys: ["texte", "prenom", "date", "initiale"], textExtra: 3 } };            // vin / flûte
const W = { engravingPricing: { flatExtras: [{ key: "texte", amount: 3 }, { key: "texte2", amount: 3 }, { key: "emplacement", value: "deux", amount: 7 }] } }; // whisky / cocktail
const U = { id: "u", title: "À l'unité" }, L2 = { id: "l2", title: "Lot de 2" }, L4 = { id: "l4", title: "Lot de 4" };
const photo = { mode: "photo", photo: "/api/img/a" }, photoTexte = { ...photo, texte: "Fabien" }, logo = { mode: "photo", photo: "/api/img/b", texte: "Zoo Bar" };

t("frais 1-2 = 0", fraisIdentiques(1) === 0 && fraisIdentiques(2) === 0);
t("frais 3-4 = 2", fraisIdentiques(3) === 2 && fraisIdentiques(4) === 2);
t("frais 5+ = 5", fraisIdentiques(5) === 5 && fraisIdentiques(6) === 5 && fraisIdentiques(9) === 5);
t("1 verre photo seule = 0", prixGravureVerres(P, U, 1, photo).total === 0);
t("1 verre photo + texte = 3", prixGravureVerres(P, U, 1, photoTexte).total === 3);
t("2 identiques (à l'unité × 2) = 3", prixGravureVerres(P, U, 2, photoTexte).total === 3);
t("lot de 2 identiques = 3", prixGravureVerres(P, L2, 1, photoTexte).total === 3);
t("3 identiques = 3 + 2", prixGravureVerres(P, U, 3, photoTexte).total === 5);
t("lot de 4 identiques = 3 + 2", prixGravureVerres(P, L4, 1, photoTexte).total === 5);
t("6 identiques = 3 + 5", prixGravureVerres(P, U, 6, photoTexte).total === 8);
const r = prixGravureVerres(P, U, 2, photoTexte, [photoTexte, logo]);
t("2 verres, le 2e différent = 3 + 5 (cas 0E3Y9OBX)", r.total === 8 && r.differents === 1, JSON.stringify(r));
t("lot de 4 tous différents = 3 + 15", prixGravureVerres(P, L4, 1, {}, [photoTexte, logo, { texte: "A" }, { texte: "B" }]).total === 18);
t("lot de 4 : 2 identiques + 2 différents = 3 + 10", prixGravureVerres(P, L4, 1, {}, [photoTexte, photoTexte, logo, { texte: "B" }]).total === 13);
t("verre laissé vierge = gratuit", prixGravureVerres(P, L2, 1, {}, [photoTexte, {}]).total === 3);
t("2 lots de 2 « chacun différent » : le motif se répète par lot", prixGravureVerres(P, L2, 2, {}, [photoTexte, logo]).identiques === 2);
const w = prixGravureVerres(W, U, 2, { texte: "Papa", emplacement: "deux" });
t("whisky 2 identiques face+fond = 3 + 7 + 7", w.total === 17, JSON.stringify(w));
t("whisky 2e différent face+fond = 3+7 + 5+7", prixGravureVerres(W, U, 2, {}, [{ texte: "Papa", emplacement: "deux" }, { texte: "Papy", emplacement: "deux" }]).total === 22);
t("police seule = pas une gravure", !verreGrave({ police: "allura", emplacement: "face" }));
t("le détail liste les lignes", r.lignes.some((l) => /différent/.test(l.libelle)) && r.lignes.some((l) => l.montant === 0));
console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
