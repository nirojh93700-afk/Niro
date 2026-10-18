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

// 7. Prix écrits partout (17/10/2026) : le catalogue du code passe, et les deux erreurs trouvées ce jour-là
//    sont attrapées si elles reviennent.
import { controlePrixEcrits } from "../../src/lib/textesPrix.js";
import { productInfo } from "../../src/lib/productInfo.js";
const ecrits = products.flatMap((pr) => controlePrixEcrits(pr, { "fiche détaillée": [productInfo[pr.slug]?.material, productInfo[pr.slug]?.usage].join("\n") }).map((a) => `${pr.slug} : ${a.message}`));
verif(ecrits.length === 0, `catalogue : chaque prix écrit correspond à un supplément payé${ecrits.length ? "\n   " + ecrits.join("\n   ") : ""}`);
p = fiche("collier-femme-pendentif-geometrique");
delete p.engravingPricing.motifKeys;
verif(controlePrixEcrits(p).some((a) => a.ou === "motifs"), "pendentif : motifs annoncés +3 € mais non payés → signalé");
p = fiche("collier-medaillon-coeur-ouvrable");
// Depuis le 18/10/2026 la page coûte 3 € : l'ancienne erreur inverse (« +5 € par page ») doit être attrapée.
p.descriptionHtml = "<li><strong>Pages 1 à 3</strong> — gravure de texte à +5 € par page</li>";
verif(controlePrixEcrits(p).some((a) => a.montant === 5), "médaillon cœur : description « +5 € par page » alors que la page coûte 3 € → signalé");

// 8. Aucune propriété écrite deux fois dans un même objet de products.js (la 2e efface la 1re sans bruit :
//    c'est ce qui rendait les motifs du pendentif gratuits). Analyse du code source.
{
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);
  let acorn = null;
  try { acorn = req("next/dist/compiled/acorn/acorn.js"); } catch { /* pas d'analyseur : on saute */ }
  if (acorn) {
    const src = fs.readFileSync(new URL("../../src/lib/products.js", import.meta.url), "utf8");
    const doublons = [];
    (function walk(n) {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "ObjectExpression") {
        const vu = {};
        for (const pr of n.properties) {
          if (pr.type !== "Property" || pr.computed) continue;
          const k = pr.key.name ?? pr.key.value;
          if (vu[k]) doublons.push(`« ${k} » ligne ${pr.loc.start.line} (déjà ligne ${vu[k]})`); else vu[k] = pr.loc.start.line;
        }
      }
      for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object" && v.type) walk(v); }
    })(acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", locations: true }));
    verif(doublons.length === 0, `products.js : aucune propriété en double${doublons.length ? " → " + doublons.join(" ; ") : ""}`);
  }
}

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
