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
check("n°5 seul (rien d'autre) → OK, aucun champ obligatoire (règle du 29/09)", (() => { const r = e({ mode: "modele", numstyle: "5" }); return r.ok && /tel quel/.test(r.detail); })());
check("aucun champ n'est marqué obligatoire", Object.values(PARCOURS_CHAMPS).every((F) => !F.req));
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
check("en mode modèle, un texte du mode « texte » ne remplace pas le choix du modèle", !e({ mode: "modele", texte: "Pour Papa" }).ok);

check("photo sans fichier → bloqué", !e({ mode: "photo" }).ok);
check("photo envoyée → OK, texte facultatif", e({ mode: "photo", photo: "/api/img/abc" }).ok && /Stephan/.test(e({ mode: "photo", photo: "/api/img/abc", texte: "Stephan" }).detail));
check("champ photo présent dans personalizationFields", carafe.personalizationFields.some((f) => f.key === "photo" && f.type === "photo"));

// ---- verre à vin + flûte (mêmes règles, leurs modèles) ----
const vin = products.find((p) => p.slug === "verre-a-vin-grave"), flute = products.find((p) => p.slug === "flute-a-champagne-gravee");
check("vin : 30 modèles, tous avec image, plus d'onglets", vin.parcoursGuide && Object.keys(vin.parcoursGuide.modeles).length === 30 && Object.keys(vin.parcoursGuide.modeles).every((k) => vin.styleImages[k]) && !vin.personaTabs);
check("vin : groupes = exactement les 30 numéros", (() => { const all = vin.parcoursGuide.groupes.flatMap((g) => g.nums); return all.length === 30 && new Set(all).size === 30; })());
check("vin : champs mode/texte/photo présents", ["mode","texte","photo","numstyle","lettreFleurie","prenom","date","initiale","police"].every((k) => vin.personalizationFields.some((f) => f.key === k)));
check("vin : n°10 + prénoms + date → OK, détail", (() => { const r = parcoursEtat(vin, { mode: "modele", numstyle: "10", prenom: "Elli & Ben", date: "23.07.2024" }); return r.ok && /Elli/.test(r.detail) && /23\.07/.test(r.detail); })());
check("flûte : 35 modèles + 5 en photo (36-40), groupes = 40 numéros", flute.parcoursGuide.modelesPhoto.length === 5 && flute.parcoursGuide.modelesPhoto.every((m) => m.n >= 36 && m.n <= 40 && m.image && m.value) && flute.parcoursGuide.groupes.flatMap((g) => g.nums).length === 40);
check("flûte : gravure en photo choisie (gravureExemple) → modèle n° 38 OK", (() => { const r = parcoursEtat(flute, { mode: "modele", gravureExemple: "monogramme", initiale: "CL" }); return r.ok && /n° 38/.test(r.grav) && /CL/.test(r.detail); })());
check("flûte : valeurs de gravureExemple = celles du champ lettering (clé inchangée)", flute.parcoursGuide.modelesPhoto.every((m) => flute.personalizationFields.find((f) => f.key === "gravureExemple").options.some((o) => o.value === m.value)));
check("flûte : mode modèle sans rien → bloqué", !parcoursEtat(flute, { mode: "modele" }).ok);

// --- Verre à whisky perso : photo OU texte, face / fond / les deux (02/10/2026) ---
const wh = products.find((p) => p.slug === "verre-a-whisky-grave");
const ew = (fv) => parcoursEtat(wh, fv);
check("whisky : parcoursGuide présent (2 modes, 3 emplacements)", wh.parcoursGuide && wh.parcoursGuide.modes.join() === "photo,texte" && wh.parcoursGuide.emplacement.options.length === 3);
check("whisky : clés écrites par le parcours = clés de personalizationFields", ["mode","emplacement","photo","texte","texte2","decor","police","photoFond","texteFond"].every((k) => wh.personalizationFields.some((f) => f.key === k)));
check("whisky : prix inchangés (texte +3, date +3, face+fond +7)", (() => { const f = wh.engravingPricing.flatExtras; return f.find((x) => x.key === "texte").amount === 3 && f.find((x) => x.key === "texte2").amount === 3 && f.find((x) => x.key === "emplacement" && x.value === "deux").amount === 7; })());
check("whisky : rien choisi → bloqué (étape 1)", !ew({}).ok && /étape 1/.test(ew({}).manque));
check("whisky : photo sans fichier → bloqué", !ew({ mode: "photo" }).ok);
check("whisky : photo seule (face par défaut) → OK", (() => { const r = ew({ mode: "photo", photo: "/api/img/x" }); return r.ok && /photo seule/.test(r.detail); })());
check("whisky : texte vide → bloqué ; texte → OK (+3 €)", !ew({ mode: "texte" }).ok && /\+3 €/.test(ew({ mode: "texte", texte: "Papa" }).grav));
check("whisky : date (texte2) + décor + écriture dans le détail", (() => { const r = ew({ mode: "texte", texte: "Papa", decor: "★", texte2: "12.06.2024", police: "cinzel" }); return r.ok && /★ Papa ★/.test(r.grav) && /12\.06\.2024/.test(r.detail) && /Cinzel/.test(r.detail); })());
check("whisky : face + fond sans rien au fond → bloqué (on ne facture pas une gravure vide)", !ew({ mode: "texte", texte: "Papa", emplacement: "deux" }).ok);
check("whisky : face + fond avec texte du fond → OK, résumé du fond", (() => { const r = ew({ mode: "texte", texte: "Papa", emplacement: "deux", texteFond: "Merci" }); return r.ok && /Merci/.test(r.fond); })());
check("whisky : fond seul → OK sans rien d'autre à préciser", ew({ mode: "photo", photo: "/api/img/x", emplacement: "fond" }).ok);
check("carafe / vin / flûte inchangés : pas d'emplacement dans leur config", !carafe.parcoursGuide.emplacement && !vin.parcoursGuide.emplacement && !flute.parcoursGuide.emplacement);

console.log(`\n${n - ko}/${n} vérifications au vert`);
process.exit(ko ? 1 : 0);
