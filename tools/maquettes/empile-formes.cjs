/* Suspension à prénoms (d'après « Create Your Stack » d'Atomm) : les 21 formes ramenées à leur taille de travail.
   Pour chaque forme : le contour extérieur (o) et la fenêtre du prénom (i), en mm, centrés sur (0,0), avec leurs boîtes.
   Même règle que l'outil d'Atomm : contour mis à targetWidth ; fenêtre = 2e tracé du fichier « -paths » s'il fait plus de
   40 % de la largeur, sinon le contour réduit (0,76 ou innerTargetWidth / innerTargetHeight, + innerTranslateY).

   NODE_PATH=$(npm root -g) node tools/maquettes/empile-formes.cjs <paper-full.min.js> docs/maquettes/assets/empile/brut <sortie.json> */
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const [PAPER, BRUT, OUT] = process.argv.slice(2);
const pathTypes = ['heart','diamond','flower','canal','cloud','bell','shell','skull','scallop','ornamental','tree','ball'];
const defaut = { eyeX: 76.01, rightOffsetX: 70, baseStep: 42, targetWidth: 44, textOffsetY: 0 };
const lib = {
  heart:{targetWidth:56,textOffsetY:-4,eyeOffsetY:2.7}, flower:{targetWidth:42,textOffsetY:0,eyeOffsetY:-2.5},
  ornamental:{targetWidth:44,textOffsetY:0,eyeOffsetY:-3.5}, shield:{targetWidth:40,textOffsetY:-2,eyeOffsetY:-2.5},
  hex:{targetWidth:55,textOffsetY:0,eyeOffsetY:-3.5},
  diamond:{targetWidth:50,textOffsetY:-8,eyeOffsetY:-2.5,innerTargetWidth:60,innerTargetHeight:35},
  droplet:{targetWidth:38,textOffsetY:5,eyeOffsetY:-2,innerTranslateY:1.5},
  cloud:{targetWidth:62,textOffsetY:5,eyeOffsetY:-2,rightOffsetX:90}, shell:{targetWidth:49,textOffsetY:2,eyeOffsetY:-2.5},
  bell:{targetWidth:46,textOffsetY:10,eyeOffsetY:-2.5}, tree:{targetWidth:42,textOffsetY:13,eyeOffsetY:-2.2},
  ball:{targetWidth:40,textOffsetY:4,eyeOffsetY:-2.2}, star:{targetWidth:57,textOffsetY:-0.9,eyeOffsetY:-2.5},
  house:{targetWidth:44,textOffsetY:3.5,eyeOffsetY:-2,innerTranslateY:1.5}, canal:{targetWidth:28,textOffsetY:10,eyeOffsetY:-2},
  scallop:{targetWidth:44,textOffsetY:0,eyeOffsetY:-2.5}, skull:{targetWidth:44,textOffsetY:0,eyeOffsetY:-2.5},
  ghost:{targetWidth:45,textOffsetY:8,eyeOffsetY:-2.2}, circle:{targetWidth:48,textOffsetY:0,eyeOffsetY:-3.5},
  ellipse:{targetWidth:78,innerTargetWidth:65,innerTargetHeight:35,rightOffsetX:100,textOffsetY:0,eyeOffsetY:-3.5},
  egg:{targetWidth:36,textOffsetY:4,eyeOffsetY:-2.5} };
(async () => {
  const svg = {};
  for (const s of Object.keys(lib)) svg[s] = fs.readFileSync(path.join(BRUT, (pathTypes.includes(s) ? s + '-paths' : s) + '.svg'), 'utf8');
  const b = await chromium.launch({ args: ['--no-sandbox'] }), p = await b.newPage();
  await p.setContent('<canvas id="c" width="10" height="10"></canvas>');
  await p.addScriptTag({ path: PAPER });
  const res = await p.evaluate(({ svg, lib, defaut }) => {
    paper.setup(document.getElementById('c'));
    const cx = 76.01, cy = 50, out = {};
    function faire(type, inner) {
      const conf = Object.assign({}, defaut, lib[type]);
      const imp = paper.project.importSVG(svg[type]);
      const paths = imp.getItems({ recursive: true, class: paper.Path });
      if (!paths.length) throw new Error('aucun tracé : ' + type);
      paths.sort((a, b) => b.bounds.width - a.bounds.width);
      const o = paths[0], k = conf.targetWidth / o.bounds.width;
      imp.position = new paper.Point(cx, cy);
      const c = o.bounds.center;
      imp.translate(new paper.Point(cx - c.x, cy - c.y));
      imp.scale(k, new paper.Point(cx, cy));
      let r, source = 'contour';
      if (inner) {
        const ok = paths.slice(1).filter(q => q.bounds.width > o.bounds.width * 0.4);
        if (ok.length) { r = ok[0].clone(); source = 'fichier'; }
        else {
          r = o.clone(); source = 'réduit';
          const sx = (conf.innerTargetWidth || conf.targetWidth * 0.76) / o.bounds.width;
          const sy = conf.innerTargetHeight ? conf.innerTargetHeight / o.bounds.height : sx;
          r.scale(sx, sy, new paper.Point(cx, cy));
          if (conf.innerTranslateY) r.translate(new paper.Point(0, conf.innerTranslateY));
        }
      } else r = o.clone();
      /* la matrice du groupe importé est appliquée au tracé copié */
      const m = r.globalMatrix; imp.remove(); paper.project.activeLayer.addChild(r); r.transform(new paper.Matrix()); r.closed = true;
      r.translate(new paper.Point(-cx, -cy));
      const bb = r.bounds;
      return { d: r.pathData, b: [bb.x, bb.y, bb.width, bb.height].map(v => Math.round(v * 1000) / 1000), source };
    }
    for (const t of Object.keys(lib)) {
      const o = faire(t, false), i = faire(t, true), conf = Object.assign({}, defaut, lib[t]);
      out[t] = { o: o.d, ob: o.b, i: i.d, ib: i.b, fen: i.source, ty: conf.textOffsetY || 0, ey: conf.eyeOffsetY || 0, pas: conf.baseStep, ecart: conf.rightOffsetX };
    }
    return out;
  }, { svg, lib, defaut });
  await b.close();
  /* arrondi des nombres des tracés à 3 décimales */
  for (const t of Object.keys(res)) for (const k of ['o', 'i']) res[t][k] = res[t][k].replace(/-?\d+\.\d{4,}/g, v => String(Math.round(parseFloat(v) * 1000) / 1000));
  fs.writeFileSync(OUT, JSON.stringify(res));
  for (const t of Object.keys(res)) console.log(t.padEnd(11), 'contour', res[t].ob.slice(2).join(' × ').padEnd(18), 'fenêtre', res[t].ib.slice(2).join(' × ').padEnd(18), res[t].fen, 'haut', res[t].ob[1]);
  console.log(OUT, Math.round(fs.statSync(OUT).size / 1024), 'Ko');
})();
