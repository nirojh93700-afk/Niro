// npm run test-controle-atelier — tout ce que la cliente a choisi apparaît dans l'atelier (16/10/2026).
import { oubliesAtelier, controleProduitAtelier } from "../../src/lib/controleAtelier.js";
import { consignesGravure } from "../../src/lib/consignesGravure.js";
import { products } from "../../src/lib/products.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.log("✗", nom); } };

// Commande 10OPUHMO : face + fond, deux photos, deux textes → rien d'oublié.
const deux = { slug: "verre-a-whisky-grave", emplacement: "deux", photoSrc: "/api/img/A",
  fields: { emplacement: "deux", mode: "photo", photo: "/api/img/A", photoFond: "/api/img/B", texte: "Super papa", texteFond: "Au fond", decor: "♥", police: "cinzel-deco" } };
t("verre face + fond : rien d'oublié", oubliesAtelier(deux).length === 0);

// Un choix que l'atelier ne sait pas montrer est signalé (filet de sécurité).
const inconnu = { ...deux, fields: { ...deux.fields, gravureMystere: "Texte caché" } };
const o = oubliesAtelier(inconnu);
t("choix inconnu signalé", o.length === 1 && o[0].valeur === "Texte caché");
const photoEnTrop = { ...deux, fields: { ...deux.fields, photoBonus: "/api/img/Z" } };
t("photo en trop signalée comme photo", oubliesAtelier(photoEnTrop).some((x) => x.photo && x.valeur === "/api/img/Z"));

// Commande 1JXNFE0L : modèle Fête des pères — ses textes sont maintenant dans le tableau.
const peres = { slug: "verre-a-whisky-fete-des-peres", modeleTemplate: "peres",
  modele: { text: { top: "J'aime", mid: "Ta", bot: "Vie" }, fonts: { top: "fnt-great-vibes" }, motif: "coeur", layout: "classic" }, fields: {} };
t("modèle : textes dans le tableau", consignesGravure(peres).autres.some((l) => /J'aime/.test(l.v)));
t("modèle : rien d'oublié", oubliesAtelier(peres).length === 0);

// Couverts enfants : thème + animal par couvert dans le tableau.
const pc = products.find((p) => p.slug === "couverts-enfants-personnalises");
const cf = pc.personalizationFields.find((f) => f.type === "couverts");
const th = cf.themes[0];
const couv = { slug: pc.slug, variantTitle: pc.variants[0].title, fields: { prenom: "Léo", [cf.key]: { theme: th.key, animals: { [cf.pieces[0].key]: th.animals[0].key } } } };
t("couverts : animal dans le tableau", consignesGravure(couv).autres.some((l) => l.v === th.animals[0].label));
t("couverts : rien d'oublié", oubliesAtelier(couv).length === 0);

// Tout le catalogue : aucun produit dont un champ rempli serait invisible à l'atelier.
const fautifs = products.map((p) => [p.slug, controleProduitAtelier(p)]).filter(([, m]) => m.length);
if (fautifs.length) console.log(JSON.stringify(fautifs));
t("catalogue : aucun champ invisible à l'atelier", fautifs.length === 0);

console.log(`${ok} vérifications au vert, ${ko} en échec`);
if (ko) process.exit(1);
