// Exemples de gravure du carnet A5 (24/10 soir) : rendus avec le moteur d'aperçu de la maquette (window.cnDemo), pour la galerie.
// ⛔ Jamais le nom du gérant dans un exemple (sa consigne). Prénoms d'exemple : Camille, Léa, Paul, Inès.
// Usage : python3.13 carnet-a5-emplacements.py <base v2> → node tools/maquettes/carnet-a5-exemples.mjs → relancer le générateur.
import { chromium } from 'playwright-core';
import fs from 'fs';
const out = 'docs/maquettes/assets/carnet/exemples/';
const EX = [
  ['marron', 'face', { haut: { k: 'texte', t: 'Carnet de voyage' }, milieu: { k: 'dessin', n: 64 }, basg: { k: 'texte', t: 'Camille', t2: '2026' } }],
  ['noir', 'face', { haut: { k: 'texte', t: 'Mes recettes' }, milieu: { k: 'dessin', n: 92, t: 'Léa' }, basd: { k: 'texte', t: 'Depuis 2026' } }],
  ['gris', 'face', { milieu: { k: 'texte', t: 'Journal', t2: 'de bord' }, basd: { k: 'texte', t: 'Paul' } }],
  ['marron', 'face', { haut: { k: 'texte', t: 'Inès' }, milieu: { k: 'dessin', n: 65 }, basg: { k: 'texte', t: 'Mes idées' } }],
];
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('file://' + process.cwd() + '/docs/maquettes/carnet-a5.html'); await pg.waitForTimeout(800);
await pg.addStyleTag({ content: '.gallery-arrow{display:none!important}' });
let i = 0;
for (const [c, side, v] of EX) {
  await pg.evaluate(([c, side, v]) => window.cnDemo(c, side, v), [c, side, v]); await pg.waitForTimeout(400);
  const gm = await pg.$('.gallery-main');
  await gm.screenshot({ path: out + `ex${++i}.png` });
}
await br.close();
// PNG → JPEG carré 900 px (Pillow)
const { execSync } = await import('child_process');
execSync(`python3 - <<'PY'
import os
from PIL import Image
d='${out}'
for f in sorted(os.listdir(d)):
    if f.endswith('.png'):
        im=Image.open(d+f).convert('RGB'); s=min(im.size); im=im.crop(((im.width-s)//2,(im.height-s)//2,(im.width+s)//2,(im.height+s)//2)).resize((900,900),Image.LANCZOS)
        im.save(d+f[:-4]+'.jpg','JPEG',quality=84,optimize=True); os.remove(d+f); print(f, im.size)
PY`, { stdio: 'inherit' });
