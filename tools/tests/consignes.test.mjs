// npm run test-consignes — consignes de gravure rangées face par face (16/10/2026).
import { consignesGravure, positionEnMots } from "../../src/lib/consignesGravure.js";
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) ok++; else { ko++; console.log("✗", nom); } };

// Pendentif 4 faces (commande 0XIF6DDO) : face arrière vide, sens global avec flèche.
const p = consignesGravure({ slug: "collier-femme-pendentif-geometrique", variantTitle: "Doré",
  fields: { police: "allura", face1: "Dayan", face3: "Mayleen", face4: "Jayleen", sens: "down" } });
t("4 faces listées", p.faces.length === 4);
t("face arrière à laisser vierge", p.faces.find((f) => f.nom === "Face arrière")?.vide === true);
t("face droite = Mayleen", p.faces.find((f) => f.nom === "Face droite")?.lignes[0]?.v === "Mayleen");
t("sens avec flèche", /↓ Du haut vers le bas/.test(p.general.find((g) => g.k === "Sens d'écriture")?.v || ""));
t("police Allura", p.general.find((g) => g.k === "Police")?.v === "Allura");

// Verre à cocktail : emplacement + placement en mots.
const c = consignesGravure({ slug: "verre-a-cocktail-grave", variantTitle: "À l'unité", emplacement: "face",
  fields: { texte: "Bonne fête", police: "cinzel" },
  layout: { text: { cxPct: 50, cyPct: 70, label: "texte ≈ 1,5 cm de haut · position 50 % / 70 %" } } });
t("emplacement face avant", c.general.some((g) => g.k === "Emplacement" && /Face avant/.test(g.v)));
t("placement texte en bas", /lettres de ≈ 1,5 cm de haut · centré, en bas/.test(c.placement[0]?.v || ""));

// Cristal : la place choisie prime sur le repère de l'aperçu.
const k = consignesGravure({ slug: "cristal-photo-3d-vertical", variantTitle: "Petit",
  fields: { texte: "Mon amour", textePos: "haut", police: "cinzel" }, layout: { crystalText: { label: "en bas au centre" } } });
t("alerte si l'aperçu contredit le choix", k.placement.some((x) => x.alerte) || !k.autres.some((a) => /placer/i.test(a.k)));

t("positionEnMots", positionEnMots(50, 20) === "centré, en haut" && positionEnMots(20, 80) === "à gauche, en bas");
t("produit inconnu sans plantage", Array.isArray(consignesGravure({ slug: "inconnu", fields: { x: "y" } }).faces));

console.log(`${ok} vérifications au vert, ${ko} en échec`);
process.exit(ko ? 1 : 0);
