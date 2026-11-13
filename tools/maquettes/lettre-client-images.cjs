// Images d'exemple de la maquette « Lettre de naissance » côté cliente (13/11/2026) : la lettre seule, la boîte fermée, la boîte ouverte.
// Le gérant : « il faut que tu fasses des images aussi pour montrer que c'est des boîtes, tu ouvres la boîte ».
// Elles sont dessinées par l'outil lui-même (vue 3D de l'exemple « Camille »), pas par un autre moteur.
//
//   NODE_PATH=$(npm root -g) node tools/maquettes/lettre-client-images.cjs <page fabriquée par lettre-client.py> <three.min.js> <dossier de sortie>
//
// puis relancer lettre-client.py : il range les trois images .webp dans la page.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const [page, three, out] = process.argv.slice(2);
const VUES = [['lettre-seule', false, { rx: -0.32, ry: 0.5, ouv: 0 }], ['boite-fermee', true, { rx: -0.5, ry: 0.62, ouv: -14 }], ['boite-ouverte', true, { rx: -0.78, ry: 0.42, ouv: 6, dx: 27 }]];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.route('**/three.min.js', r => r.fulfill({ path: three }));
  await p.goto('file://' + path.resolve(page)); await p.waitForTimeout(1200);
  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(1200);
  await p.addStyleTag({ content: '.lc-vue,.lc-ex,.lc-tour{visibility:hidden!important}.lc-stage{background:none!important}.lc-stage .li-scene canvas{padding:0}' });
  await p.evaluate(() => document.getElementById('v3d').click()); await p.waitForTimeout(1500);
  for (const [nom, boite, pose] of VUES) {
    await p.evaluate(([bo, po]) => { const C = NivLettreCliente.etat(); C.boite = bo; NivLettreCliente.appliquer(); NivLettreCliente.pose(po); }, [boite, pose]);
    await p.waitForTimeout(900);
    const png = path.join(out, nom + '.png'); await p.locator('#scene').screenshot({ path: png, omitBackground: true });
    execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open(r'${png}').convert('RGBA'); bb=im.getbbox(); im=im.crop(bb); c=max(im.size)+int(max(im.size)*.08)
o=Image.new('RGBA',(c,c),(0,0,0,0)); o.paste(im,((c-im.size[0])//2,(c-im.size[1])//2),im); o=o.resize((560,560),Image.LANCZOS); o.save(r'${path.join(out, nom + '.webp')}','WEBP',quality=86)
`]); fs.unlinkSync(png); console.log(nom + '.webp', fs.statSync(path.join(out, nom + '.webp')).size, 'octets'); }
  await b.close();
})();
