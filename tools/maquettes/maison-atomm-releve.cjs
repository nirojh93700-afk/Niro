// Dans l'outil d'Atomm ouvert dans le navigateur : change les réglages et relève les pièces qu'il calcule (références pour maison-test.cjs).
//   NODE_PATH=$(npm root -g) node tools/maquettes/maison-atomm-releve.cjs <ref-atomm.json>
// Rien de leur programme n'est lancé sur la machine : c'est LEUR page, dans le navigateur.
const { chromium } = require('playwright');
const fs = require('fs');
const SORTIE = process.argv[2];
const JEUX = {
  A: {},
  B: { topMode: 'lights', windowShape: 'circle', windowFrame: 1.5, windowRows: 3, windowCols: 3, decoration: 'heart', decorCount: 12, front: 'christmas_tree', back: 'star', syncFaces: false, tiles: false },
  C: { width: 120, depth: 100, wallHeight: 110, roofHeight: 50, baseInset: 8, thickness: 4, motifSize: 60, motifY: 55, windowShape: 'square', windowWidth: 16, windowHeight: 24, windowGap: 10, decoration: 'circle', decorCount: 8, decorSize: 9, decorInset: 12, front: 'christmas_snowman' },
  D: { width: 45, depth: 40, wallHeight: 42, roofHeight: 18, baseInset: 0, front: 'heart' },
  E: { front: 'moon', kerf: 0, fit: 0, topPosition: 20, windowShape: 'arch', windowFrame: 2, syncWindows: false, decoration: 'none', tileSize: 14, eave: 10 },
  F: { front: 'none', decorCount: 12, decorSize: 3, decorInset: 7, windowShape: 'none', roofHeight: 65, loopInner: 8, loopOuter: 18, baseMargin: 10 },
};
(async () => {
  const nav = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 950 }, locale: 'en-US' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 200)));
  await p.goto('https://www.atomm.com/creativetools/generator/house-ornament-generator/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(9000);
  const ref = {};
  for (const [nom, jeu] of Object.entries(JEUX)) {
    const r = await p.evaluate((jeu) => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia;
      const st = pinia._s.get('houseOrnamentGeneratorConfig');
      st.reset();
      Object.assign(st.params, jeu);
      const m = st.model;
      const a = (v) => Math.round(v * 1000) / 1000;
      return {
        params: JSON.parse(JSON.stringify(st.params)), warnings: m.warnings, bulbFits: m.bulbFits, bulb: m.bulb, joints: m.joints,
        parts: m.parts.map((q) => ({ id: q.id, origin: q.origin, u: q.u, v: q.v, normal: q.normal, explode: q.explode, rings: q.rings.map((g) => g.map((c) => [a(c.x), a(c.y)])), nscores: q.scores.length, lscores: a(q.scores.reduce((t, l) => t + l.slice(1).reduce((u, c, i) => u + Math.hypot(c.x - l[i].x, c.y - l[i].y), 0), 0)) })),
        cut: m.cutParts.map((q) => ({ id: q.id, rings: q.rings.map((g) => g.map((c) => [a(c.x), a(c.y)])) })),
      };
    }, jeu);
    ref[nom] = r;
    console.log(nom, 'pièces', r.parts.map((q) => q.id + ':' + q.rings.length + '/' + q.nscores).join(' '), 'alertes', JSON.stringify(r.warnings), 'ampoule', r.bulbFits);
  }
  fs.writeFileSync(SORTIE, JSON.stringify(ref));
  console.log('écrit', SORTIE, fs.statSync(SORTIE).size, 'octets');
  await nav.close();
})();
