import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RAYON_JEUX, lienCategorie } from "../../src/lib/lienCategorie.js";
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// Rang du rayon « Jeux en bois » dans l'univers « enfants » (lu dans univers.js : le fichier
// importe sans extension, il ne se charge pas tel quel sous Node).
const src = readFileSync(new URL("../../src/lib/univers.js", import.meta.url), "utf8");
const bloc = src.split('{ id: "enfants"')[1].split('{ id: "mariage"')[0];
const noms = [...bloc.matchAll(/\{ nom: "([^"]+)"/g)].map((m) => m[1]);
const i = noms.indexOf("Jeux en bois");
ok(i >= 0, "le rayon Jeux en bois existe dans l'univers enfants");
ok(RAYON_JEUX === `/boutique/enfants#r-enfants-${i}`, "l'ancre pointe le rayon Jeux en bois (rang " + i + ")");
ok(lienCategorie("jeux") === RAYON_JEUX, "catégorie jeux → rayon");
ok(lienCategorie("deco") === "/boutique/maison", "déco → Maison & Déco directement");
ok(lienCategorie("bijoux") === "/boutique/bijoux", "bijoux inchangé");
ok(lienCategorie("cristal") === "/cristaux" && lienCategorie("naissance") === "/naissance", "cristal / naissance inchangés");
console.log(`lien-categorie : ${n} vérifications OK`);
