// Exemples de gravure des marque-pages (24/10 soir) : rendus avec le moteur d'aperçu de la maquette (window.mqDemo → face + dos
// dans la grande photo), capturés pour la galerie. ⛔ Jamais le nom du gérant dans un exemple. Prénoms : Camille, Léa, Paul, Inès.
// Usage : node tools/maquettes/marque-pages-exemples.mjs 1|2   (après le générateur ; puis relancer le générateur)
import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
const m = process.argv[2] || '1';
const file = m === '2' ? 'docs/maquettes/marque-pages-fenetre.html' : 'docs/maquettes/marque-pages.html';
const out = `docs/maquettes/assets/marque-pages/exemples/m${m}/`;
const T = (text, side, zone, font) => ({ kind: 'texte', text, side, zone, font: font || 'fnt-playfair' });
const Dz = (num, side, zone, text, font) => ({ kind: 'dessin', num, side, zone, text: text || '', font: font || 'fnt-playfair' });
// 24/10 soir (gérant : « des photos de personnes gravées… modèle 1 où tu veux, modèle 2 en haut de la face ou au dos ») :
// portraits d'exemple = recadrages des photos de cristaux du site (docs/maquettes/assets/marque-pages/exemples/portraits/).
import { readFileSync } from 'fs';
const P = (name, side, zone) => ({ kind: 'photo', src: 'data:image/jpeg;base64,' + readFileSync(`docs/maquettes/assets/marque-pages/exemples/portraits/${name}.jpg`).toString('base64'), side, zone });
const EX = m === '2' ? [
  ['Blond clair', [T('Camille', 'face', 'haut'), Dz(62, 'dos', 'bas')]],
  ['Brun roux', [T('Léa', 'face', 'bas', 'fnt-great-vibes'), Dz(92, 'dos', 'bas', 'Paul')]],
  ['Sable', [T('Mes lectures', 'face', 'haut'), T('2026', 'dos', 'haut'), Dz(65, 'dos', 'bas')]],
  ['Blond clair', [P('femme-visage', 'face', 'haut'), T('Léa', 'dos', 'haut', 'fnt-great-vibes')]],
  ['Brun roux', [T('Camille', 'face', 'haut'), P('enfant-chien', 'dos', 'bas')]],
  ['Sable', [T('2026', 'dos', 'haut'), P('couple', 'dos', 'bas')]],
] : [
  ['Caramel', [T('Camille', 'face', 'haut'), Dz(8, 'face', 'bas')]],
  ['Gris anthracite', [Dz(92, 'face', 'bas', 'Léa'), T('2026', 'dos', 'haut')]],
  ['Rouge', [T('Paul', 'face', 'haut', 'fnt-great-vibes'), Dz(65, 'face', 'bas'), Dz(7, 'dos', 'bas')]],
  ['Blond clair', [T('Bonne lecture', 'face', 'bas'), T('Inès', 'dos', 'haut', 'fnt-allura')]],
  ['Caramel', [T('Camille', 'face', 'haut'), P('enfant-chien', 'face', 'bas')]],
  ['Gris sable', [T('Paul', 'face', 'haut', 'fnt-great-vibes'), P('couple', 'dos', 'bas')]],
  ['Cuivré', [P('femme-visage', 'face', 'haut'), T('Pour Mamie', 'face', 'bas'), P('femme', 'dos', 'bas')]],
];
execSync(`mkdir -p ${out}`);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('file://' + process.cwd() + '/' + file); await pg.waitForTimeout(800); await pg.evaluate(() => document.fonts.ready);
await pg.addStyleTag({ content: '.gallery-arrow,.mq-galap-l{display:none!important}' });
let i = 0;
for (const [c, items] of EX) {
  await pg.evaluate(([c, items]) => window.mqDemo(c, items), [c, items]); await pg.waitForTimeout(400); await pg.evaluate(() => document.fonts.ready); await pg.evaluate(([c, items]) => window.mqDemo(c, items), [c, items]); await pg.waitForTimeout(300);
  await (await pg.$('.gallery-main')).screenshot({ path: out + `ex${++i}.png` });
}
await br.close();
execSync(`python3 - <<'PY'
import os
from PIL import Image
d='${out}'
for f in sorted(os.listdir(d)):
    if f.endswith('.png'):
        im=Image.open(d+f).convert('RGB'); s=min(im.size); im=im.crop(((im.width-s)//2,(im.height-s)//2,(im.width+s)//2,(im.height+s)//2)).resize((900,900),Image.LANCZOS)
        im.save(d+f[:-4]+'.jpg','JPEG',quality=84,optimize=True); os.remove(d+f); print(f, im.size)
PY`, { stdio: 'inherit' });
