// Contrôle « texte gravé ↔ prix affiché » (src/lib/textesPrix.js) — npm run test-textes-prix
import { products } from "../../src/lib/products.js";
import { controleTextesPrix } from "../../src/lib/textesPrix.js";
import { engravingExtra } from "../../src/lib/engravingPrice.js";
import fs from "node:fs";

let ok = 0, ko = 0;
const verif = (cond, msg) => { if (cond) { ok++; console.log("✅ " + msg); } else { ko++; console.log("❌ " + msg); } };
const copie = (o) => JSON.parse(JSON.stringify(o));
const fiche = (slug) => copie(products.find((p) => p.slug === slug));

// 1. Le catalogue du code passe sans anomalie.
const anomalies = products.flatMap((p) => controleTextesPrix(p).map((a) => `${p.slug} : ${a.message}`));
verif(anomalies.length === 0, `catalogue : aucune case de texte payée sans prix ou affichée sans être payée${anomalies.length ? "\n   " + anomalies.join("\n   ") : ""}`);

// 2. Une case payée dont le libellé perd son « +3 € » est attrapée.
let p = fiche("verre-a-cocktail-grave");
p.personalizationFields.find((f) => f.key === "texte2").label = "Date (sous la photo)";
verif(controleTextesPrix(p).some((a) => a.cle === "texte2" && a.paye === 3 && !a.affiche), "cocktail : date payée 3 € sans prix écrit → signalée");

// 3. Un prix écrit qui n'est plus payé est attrapé.
p = fiche("bracelet-femme-coeur");
p.engravingPricing = {};
verif(controleTextesPrix(p).some((a) => a.cle === "texte" && a.affiche && a.paye === 0), "bracelet : « +3 € » écrit mais rien payé → signalé");

// 4. Parcours guidé : aucun prix écrit à la main, tout est lu dans le calcul du paiement (prixDe).
const pg = fs.readFileSync(new URL("../../src/components/ParcoursGuide.jsx", import.meta.url), "utf8");
const enDur = (pg.match(/\(facultatif,\s*\+\d|\(\+\d+(?:,\d+)?\s*€\)/g) || []);
verif(enDur.length === 0, `parcours guidé : aucun « +X € » écrit à la main à côté d'une case${enDur.length ? " → " + enDur.join(" ; ") : ""}`);

// 5. Carafe : chaque texte gravé est payé +3 € (gérant, 16/10/2026), le coffret reste à part.
const carafe = fiche("carafe-a-whisky-gravee");
const px = (fv) => engravingExtra(carafe, fv).amount;
verif(px({ mode: "modele", numstyle: "18", prenom: "Paul" }) === 3, "carafe : prénom sur un modèle = +3 €");
verif(px({ mode: "modele", initiale: "PB", prenom: "Paul", role: "Papa", date: "1989" }) === 12, "carafe : initiales + prénom + rôle + date = +12 €");
verif(px({ mode: "texte", texte: "Pour Papa" }) === 3 && px({ mode: "lettre", lettreFleurie: "B" }) === 0, "carafe : texte seul +3 €, lettre fleurie sans prénom = rien");
verif(px({ mode: "modele", numstyle: "29", coffret: "2verres" }) === 35.8, "carafe : modèle sans texte + coffret 2 verres = 35,80 € (aucun supplément de texte)");

// 6. Option par option : le support téléphone fait payer le texte seulement avec un dessin ou une photo.
verif(controleTextesPrix(fiche("support-telephone-bois-grave")).length === 0, "support téléphone : +3 € écrit seulement sur les options qui le font payer");

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
