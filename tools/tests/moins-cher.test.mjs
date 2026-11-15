// « Le moins cher est compris » (gérant, 15/11/2026 : « si la cliente prend plusieurs trucs, tu offres que le moins cher,
// on va faire ça pour tout le site ») : un seul calcul pour la fiche, le paiement, l'atelier et le code « gravure offerte ».
import { getProductBySlug } from "../../src/lib/products.js";
import { engravingExtra, prixPremiereGravure, etiquettePrixGravure } from "../../src/lib/engravingPrice.js";
import { gobeletSupplement } from "../../src/lib/gobeletParcours.js";
import { cnVide, cnPrixGravure } from "../../src/lib/carnet.js";

let ok = 0, ko = 0;
const t = (nom, v) => { if (v) { ok++; console.log("✅ " + nom); } else { ko++; console.log("❌ " + nom); } };
const ex = (slug, f, v = null) => engravingExtra(getProductBySlug(slug), f, v).amount;

t("bracelet à une face : la gravure est comprise", ex("bracelet-femme-coeur", { texte: "Léa" }) === 0);
const dc = getProductBySlug("collier-double-coeur");
const [k1, k2] = dc.engravingPricing.textKeys;
t("collier double cœur : 2 faces = 3 €", ex("collier-double-coeur", { [k1]: "Léa", [k2]: "2026" }) === 3);
t("collier double cœur : étiquette « compris » sur la face remplie, « +3 € » sur l'autre", etiquettePrixGravure(dc, { [k1]: "Léa" }, null, k1).compris && etiquettePrixGravure(dc, { [k1]: "Léa" }, null, k2).prix === 3);
t("plaque acier : photo seule comprise", ex("collier-plaque-acier", { photo: "/api/img/abcdef12" }) === 0);
const pa = getProductBySlug("collier-plaque-acier").engravingPricing.textKeys;
t("plaque acier : photo + 1 texte = 8 € (le texte est compris)", ex("collier-plaque-acier", { photo: "/api/img/abcdef12", [pa[0]]: "Léa" }) === 8);
const pg = getProductBySlug("collier-femme-pendentif-geometrique").engravingPricing;
t("pendentif : 1 motif + 1 texte = 3 €", ex("collier-femme-pendentif-geometrique", { [pg.motifKeys[0]]: "coeur", [pg.textKeys[0]]: "Léa" }) === 3);
t("pendentif : 2 textes sans motif = 3 €", ex("collier-femme-pendentif-geometrique", { [pg.textKeys[0]]: "Léa", [pg.textKeys[1]]: "Tom" }) === 3);
t("carafe : texte seul compris", ex("carafe-a-whisky-gravee", { mode: "texte", texte: "Pour Papa" }) === 0);
t("carafe : texte + date = 3 €", ex("carafe-a-whisky-gravee", { mode: "texte", texte: "Pour Papa", date: "2026" }) === 3);
t("carafe : modèle (compris) + prénom = 3 €", ex("carafe-a-whisky-gravee", { mode: "modele", numstyle: "5", prenom: "Paul" }) === 3);
t("clé USB cristal : photo comprise, texte +5 €", ex("cle-usb-cristal-3d", { photo: "/api/img/abcdef12", texte: "Léa" }) === 5);
t("clé USB cristal : texte seul compris", ex("cle-usb-cristal-3d", { texte: "Léa" }) === 0);
t("bougeoir lotus : gravure comprise", ex("bougeoir-fleur-de-lotus", { texte: "Marie" }) === 0);
t("cristal photo : inchangé (photo comprise, texte +5 €)", ex("cristal-photo-3d-vertical", { photo: "/api/img/abcdef12", texte: "Léa" }, "cristal-v-petit") === 5);
t("pièce laiton : inchangée (recto compris, verso +3 €)", ex("piece-ronde-laiton", { gravure: "texte", recto: "A", verso: "B" }) === 3);
t("code gravure offerte : 1 face seule → rien à offrir", prixPremiereGravure(dc, { [k1]: "Léa" }) === 0);
t("code gravure offerte : 2 faces → 3 €", prixPremiereGravure(dc, { [k1]: "Léa", [k2]: "2026" }) === 3);

const cfg = getProductBySlug("gobelet-isotherme-40oz").gobeletParcours;
const sup = (f) => gobeletSupplement(f, cfg).montant;
t("gobelet : un dessin seul compris", sup({ mode: "dessin", dessin: "12" }) === 0);
t("gobelet : une photo seule comprise", sup({ mode: "photo", photo: "/api/img/abcdef12" }) === 0);
t("gobelet : photo + dessin = 6 € (le dessin est compris)", sup({ mode: "photo", photo: "/api/img/abcdef12", autour: "Dessin n° 12 — Face, en haut" }) === 6);
t("gobelet : photo + texte dessous = 6 €", sup({ mode: "photo", photo: "/api/img/abcdef12", texteSousPhoto: "Maman" }) === 6);
t("gobelet : 2 dessins = 3 €", sup({ mode: "dessin", dessin: "12", autour: "Dessin n° 3 — Face, en haut" }) === 3);

const v = cnVide();
v.face.haut = { ...v.face.haut, k: "texte", t: "Carnet" };
t("carnet : couverture seule comprise", cnPrixGravure(v) === 0);
v.dos.haut = { ...v.dos.haut, k: "texte", t: "Léa" };
t("carnet : couverture + dos = 7 €", cnPrixGravure(v) === 7);

console.log(`\n${ok} vérifications au vert, ${ko} en échec`);
if (ko) process.exit(1);
