// Les images de la page « Créez le vôtre » : l'aperçu de chaque outil de création, photographié sur fond transparent.
//   NODE_PATH=$(npm root -g) node tools/maquettes/creez-le-votre-images.cjs <racine des maquettes> <paper-full.min.js> <dossier de sortie>
// <racine> contient les six pages : createur/support-createur.html, arbre/site/index.html, orn/decoration-createur.html,
// nom/maq/index.html, empile/maq/index.html, fleur/maq/index.html. Aucun serveur : les fichiers sont donnés au navigateur un par un.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(process.argv[2]);
const PAPER = fs.readFileSync(process.argv[3], 'utf8');
const SORTIE = path.resolve(process.argv[4]);
fs.mkdirSync(SORTIE, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const CACHER = '#stage{border:0!important}.sc-mur,.sc-vue,.sc-tag,#stage button,#stage [class*=bulle],#stage [class*=dim],#stage [class*=hint]{display:none!important}';
const SANS_FOND = 'html,body,main,div,section,header,nav,p,span{background-color:transparent!important;background-image:none!important;box-shadow:none!important}';

(async () => {
  const nav = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  await ctx.route('http://maq.local/**', (r) => {
    const f = path.join(RACINE, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!f.startsWith(RACINE) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await ctx.route('**/paper-full.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: PAPER }));

  const ouvrir = async (u) => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log('ERREUR', u, e.message.slice(0, 120)));
    await p.goto('http://maq.local/' + u, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    return p;
  };
  const photo = async (p, nom, avecFond) => {
    await p.addStyleTag({ content: CACHER + (avecFond ? '' : SANS_FOND + '#stage [stroke-dasharray],#stage>p,#stage>div{display:none!important}') });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.scrollTo(0, 0));
    await (await p.$('#stage')).screenshot({ path: path.join(SORTIE, nom + '.png'), omitBackground: !avecFond });
    console.log('ok', nom);
  };
  let p;

  p = await ouvrir('createur/support-createur.html');
  await photo(p, 'support', true);
  await p.close();

  p = await ouvrir('arbre/site/index.html');
  await photo(p, 'arbre');
  await p.close();

  p = await ouvrir('orn/decoration-createur.html');
  const modeles = await p.$$eval('.sc-modeles button', (c) => c.map((x) => x.innerText.replace(/\s+/g, ' ').slice(0, 90)));
  console.log('modèles de la décoration', JSON.stringify(modeles));
  await p.close();
  for (let i = 0; i < modeles.length; i++) {
    p = await ouvrir('orn/decoration-createur.html');
    await (await p.$$('.sc-modeles button'))[i].click();
    await p.waitForTimeout(900);
    await photo(p, 'deco-' + (i + 1));
    await p.close();
  }

  p = await ouvrir('nom/maq/index.html');
  console.log('décoration à prénom', JSON.stringify(await p.evaluate(() => window.pnAtelier.S)).slice(0, 400));
  await photo(p, 'prenom-1');
  await p.close();
  p = await ouvrir('nom/maq/index.html');
  await p.evaluate(() => { const S = window.pnAtelier.S; if (Array.isArray(S.noms)) S.noms = ['Léo']; window.pnAtelier.maj(); });
  const autre = (await p.$$('.pn-mod'))[1];
  if (autre) await autre.click();
  await p.waitForTimeout(700);
  await photo(p, 'prenom-2');
  await p.close();

  p = await ouvrir('empile/maq/index.html');
  await photo(p, 'empile-1');
  await p.close();
  p = await ouvrir('empile/maq/index.html');
  await p.evaluate(() => { const S = window.epAtelier.S; S.forme = 'star'; S.noms = ['Inès', 'Tom']; S.pol = 'lobster2'; window.epAtelier.maj(); });
  await p.waitForTimeout(900);
  await photo(p, 'empile-2');
  await p.close();

  p = await ouvrir('fleur/maq/index.html');
  await photo(p, 'fleur-1');
  await p.close();
  p = await ouvrir('fleur/maq/index.html');
  await p.evaluate(() => { const S = window.flAtelier.S; S.fleur = 'f16'; S.nom = 'Maman'; S.fond = 'rose'; S.pol = 'lobster'; window.flAtelier.maj(); });
  await p.waitForTimeout(500);
  await photo(p, 'fleur-2');
  await p.close();
  p = await ouvrir('fleur/maq/index.html');
  await p.evaluate(() => { const S = window.flAtelier.S; S.fleur = 'f04'; S.nom = 'Léa'; S.fond = 'vert'; S.feu = 'l5'; S.th = 129; S.xh = -10; S.tb = 124; S.xb = 3; window.flAtelier.maj(); });
  await p.waitForTimeout(500);
  await photo(p, 'fleur-3');
  await p.close();

  await nav.close();
})();
