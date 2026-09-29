// Vérifications de logique du parcours guidé (carafe) — `npm run test-parcours`.
// Pure : aucune compilation, aucun navigateur.
import { parcoursEtat, PARCOURS_CHAMPS } from "../../src/lib/parcoursGuide.js";
import { products } from "../../src/lib/products.js";

const carafe = products.find((p) => p.slug === "carafe-a-whisky-gravee");
let n = 0, ko = 0;
const check = (nom, cond) => { n++; if (!cond) { ko++; console.log("❌", nom); } else console.log("✅", nom); };
const e = (fv) => parcoursEtat(carafe, fv);

check("carafe : parcoursGuide présent avec 33 modèles", carafe?.parcoursGuide && Object.keys(carafe.parcoursGuide.modeles).length === 33);
check("chaque modèle a une image dans styleImages", Object.keys(carafe.parcoursGuide.modeles).every((k) => carafe.styleImages[k]));
check("chaque champ demandé existe dans PARCOURS_CHAMPS", Object.values(carafe.parcoursGuide.modeles).every((m) => m.champs.every((c) => PARCOURS_CHAMPS[c])));
check("les groupes couvrent les 33 modèles sans doublon", (() => { const all = carafe.parcoursGuide.groupes.flatMap((g) => g.nums); return all.length === 33 && new Set(all).size === 33; })());
check("clés écrites par le parcours = clés de personalizationFields", ["mode","numstyle","lettreFleurie","initiale","prenom","role","texte","date","police","coffret"].every((k) => carafe.personalizationFields.some((f) => f.key === k)));
check("plus aucun champ obligatoire dans la liste (le parcours valide lui-même)", carafe.personalizationFields.every((f) => f.optional || f.type === "note"));
check("rien choisi → bloqué (étape 1)", !e({}).ok && /étape 1/.test(e({}).manque));
check("mode modèle sans numéro → bloqué (étape 2)", !e({ mode: "modele" }).ok);
check("n°5 sans initiale ni prénom → il manque les deux", (() => { const r = e({ mode: "modele", numstyle: "5" }); return !r.ok && /initiale/.test(r.manque) && /prénom/.test(r.manque); })());
check("n°5 initiale + prénom → OK, détail lisible", (() => { const r = e({ mode: "modele", numstyle: "5", initiale: "S", prenom: "Stephan" }); return r.ok && /S/.test(r.detail) && /Stephan/.test(r.detail); })());
check("n°18 date facultative : prénom + rôle suffisent", e({ mode: "modele", numstyle: "18", prenom: "Connor", role: "Papa" }).ok);
check("n°29 sans texte → OK direct, « gravé tel quel »", (() => { const r = e({ mode: "modele", numstyle: "29" }); return r.ok && /tel quel/.test(r.detail); })());
check("numéro inconnu → bloqué", !e({ mode: "modele", numstyle: "99" }).ok);
check("lettre sans lettre → bloqué", !e({ mode: "lettre" }).ok);
check("lettre S → OK, prénom facultatif", e({ mode: "lettre", lettreFleurie: "S" }).ok && /sans prénom/.test(e({ mode: "lettre", lettreFleurie: "S" }).detail));
check("lettre + prénom + police → détail avec l'écriture", /Great Vibes/.test(e({ mode: "lettre", lettreFleurie: "S", prenom: "Stephan", police: "great-vibes" }).detail));
check("texte vide → bloqué", !e({ mode: "texte" }).ok && !e({ mode: "texte", texte: "   " }).ok);
check("texte + date → OK, date signalée +3 €", /\+3 €/.test(e({ mode: "texte", texte: "Pour Papa", date: "1989" }).detail));
check("un champ d'un AUTRE mode ne débloque rien (prénom seul sans mode)", !e({ prenom: "Stephan" }).ok);
check("un modèle choisi n'est pas validé par un texte du mode « texte »", !e({ mode: "modele", numstyle: "5", texte: "Pour Papa" }).ok);

check("photo sans fichier → bloqué", !e({ mode: "photo" }).ok);
check("photo envoyée → OK, texte facultatif", e({ mode: "photo", photo: "/api/img/abc" }).ok && /Stephan/.test(e({ mode: "photo", photo: "/api/img/abc", texte: "Stephan" }).detail));
check("champ photo présent dans personalizationFields", carafe.personalizationFields.some((f) => f.key === "photo" && f.type === "photo"));

console.log(`\n${n - ko}/${n} vérifications au vert`);
process.exit(ko ? 1 : 0);
