import assert from "node:assert/strict";
import { regionTexte, positionTexteCristal, POSITIONS_TEXTE } from "../../src/lib/cristalTexte.js";
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
ok(regionTexte(50, 78) === "bas", "bas par défaut");
ok(regionTexte(50, 22) === "haut", "haut");
ok(regionTexte(22, 50) === "gauche", "gauche");
ok(regionTexte(78, 50) === "droite", "droite");
ok(regionTexte(50, 50) === "", "milieu");
ok(regionTexte(20, 80) === "bas", "coin bas-gauche = bas");
for (const [k, v] of Object.entries(POSITIONS_TEXTE)) ok(regionTexte(v.x, v.y) === k, "aller-retour " + k);
// commande 1P5XZKRP : menu « haut », aperçu resté en bas → on suit le menu, avec alerte
let p = positionTexteCristal({ fields: { textePos: "haut" }, layout: { crystalText: { x: 50, y: 78, scale: 1 } } });
ok(p.region === "haut" && p.y === 22 && p.conflit && p.conflit.apercu === "bas", "conflit menu/aperçu");
// cohérent → pas d'alerte, position glissée gardée
p = positionTexteCristal({ fields: { textePos: "bas" }, layout: { crystalText: { x: 40, y: 85, scale: 1.4 } } });
ok(p.x === 40 && p.y === 85 && p.scale === 1.4 && !p.conflit, "cohérent");
// sans menu → la position glissée
p = positionTexteCristal({ fields: {}, layout: { crystalText: { x: 80, y: 50, scale: 1 } } });
ok(p.region === "droite" && !p.conflit, "sans menu");
// ancienne commande sans rien → bas par défaut
p = positionTexteCristal({ fields: {} });
ok(p.region === "bas" && !p.conflit, "défaut");
// menu seul (pas d'aperçu enregistré)
p = positionTexteCristal({ fields: { textePos: "gauche" } });
ok(p.x === 22 && !p.conflit, "menu seul");
console.log(`cristal-texte : ${n} vérifications OK`);
