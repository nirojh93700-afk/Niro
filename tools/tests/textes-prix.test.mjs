// Contrôle « texte gravé ↔ prix affiché » (src/lib/textesPrix.js) — npm run test-textes-prix
import { products } from "../../src/lib/products.js";
import { controleTextesPrix } from "../../src/lib/textesPrix.js";

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

// 2 bis. Parcours : une date affichée « +3 € » qui n'est plus payée est attrapée.
p = fiche("verre-a-whisky-grave");
p.engravingPricing.flatExtras = p.engravingPricing.flatExtras.filter((e) => e.key !== "texte2");
verif(controleTextesPrix(p).some((a) => a.cle === (p.parcoursGuide.dateKey || "date") && a.affiche && a.paye === 0), "whisky (parcours) : date écrite +3 € mais plus payée → signalée");

// 3. Un prix écrit qui n'est plus payé est attrapé.
p = fiche("bracelet-femme-coeur");
p.engravingPricing = {};
verif(controleTextesPrix(p).some((a) => a.cle === "texte" && a.affiche && a.paye === 0), "bracelet : « +3 € » écrit mais rien payé → signalé");

// 4. Parcours guidé : verre à vin, texte payé (règle des verres) et libellé du parcours avec +3 €.
p = fiche("verre-a-vin-grave");
verif(controleTextesPrix(p).length === 0, "verre à vin (parcours) : texte et prénom payés 3 € et affichés +3 €");
delete p.regleVerres;
verif(controleTextesPrix(p).some((a) => a.cle === "texte" && !a.affiche), "verre à vin sans la règle des verres : le parcours n'écrit plus +3 € → signalé");

// 5. Carafe : la date est payée ET affichée ; prénom gratuit et non affiché → rien à signaler.
verif(controleTextesPrix(fiche("carafe-a-whisky-gravee")).length === 0, "carafe : date +3 € affichée et payée, prénom gratuit sans prix → cohérent");

// 6. Option par option : le support téléphone fait payer le texte seulement avec un dessin ou une photo.
verif(controleTextesPrix(fiche("support-telephone-bois-grave")).length === 0, "support téléphone : +3 € écrit seulement sur les options qui le font payer");

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
