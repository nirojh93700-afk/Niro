// Les motifs proposés aux clientes (cœur, étoile, infini, lune, soleil) doivent être des FORMES PLEINES.
// 27/11/2026, commande 1GHIGERG : « Infini » était dessiné en trait épais (fill="none" + stroke-width) ;
// le logiciel du laser ignore l'épaisseur du trait et remplit les boucles → deux ronds noirs.
import fs from "node:fs";
import path from "node:path";
import { MOTIFS } from "@/lib/motifs";

let ko = 0, n = 0;
const dit = (ok, texte) => { n++; if (!ok) { ko++; console.error("✗ " + texte); } };
for (const m of MOTIFS.filter((x) => x.kind === "glyph")) {
  const fichier = path.join(process.cwd(), "public", m.thumb);
  dit(fs.existsSync(fichier), `${m.label} : fichier absent (${m.thumb})`);
  if (!fs.existsSync(fichier)) continue;
  const svg = fs.readFileSync(fichier, "utf8");
  dit(!/stroke-width/i.test(svg), `${m.label} : dessiné en trait épais (stroke-width) — le laser le remplira. Le refaire en forme pleine.`);
  dit(!/fill\s*=\s*"none"/i.test(svg), `${m.label} : fill="none" — le laser le remplira. Le refaire en forme pleine.`);
  dit(/<path|<ellipse|<circle|<polygon/i.test(svg), `${m.label} : aucune forme dans le fichier`);
}
if (ko) { console.error(`\n${ko} problème(s) sur ${n} vérifications`); process.exit(1); }
console.log(`✓ motifs pleins : ${n} vérifications`);
