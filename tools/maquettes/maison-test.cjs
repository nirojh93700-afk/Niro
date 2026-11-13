// Vérifie le calcul des pièces de la maisonnette (maison-geo.js) contre les pièces relevées dans l'outil d'Atomm.
//   node tools/maquettes/maison-test.cjs <clipper.js> <motifs.json> <ref.json>
// <ref.json> = docs/maquettes/assets/maison/ref-atomm.json, le relevé fait dans LEUR outil ouvert dans le navigateur (maison-atomm-releve.cjs) : pour chaque jeu de réglages, les pièces qu'il calcule.
const fs = require('fs');
const path = require('path');
const [fclip, fmotifs, fref] = process.argv.slice(2);
globalThis.ClipperLib = require(path.resolve(fclip));
require('./maison-geo.js');
const M = globalThis.NivMaison;
M.motifs(JSON.parse(fs.readFileSync(fmotifs, 'utf8')));
const ref = JSON.parse(fs.readFileSync(fref, 'utf8'));
const aire = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
const boite = (rs) => { const xs = rs.flat().map((p) => p[0]), ys = rs.flat().map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const long = (ls) => ls.reduce((s, l) => s + l.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - l[i][0], p[1] - l[i][1]), 0), 0);
let ko = 0, ok = 0;
const voir = (nom, cond, detail) => { if (cond) ok++; else { ko++; console.log('  ✗', nom, detail || ''); } };
for (const [jeu, r] of Object.entries(ref)) {
  const m = M.calculer(r.params);
  console.log('Jeu', jeu, '·', m.parts.length, 'pièces · alertes', JSON.stringify(m.warnings));
  voir(jeu + ' nombre de pièces', m.parts.length === r.parts.length, m.parts.length + ' / ' + r.parts.length);
  voir(jeu + ' alertes', JSON.stringify(m.warnings) === JSON.stringify(r.warnings), JSON.stringify(m.warnings) + ' / ' + JSON.stringify(r.warnings));
  voir(jeu + ' ampoule', m.bulbFits === r.bulbFits);
  r.parts.forEach((q, i) => {
    const p = m.parts[i];
    if (!p) return;
    const mien = p.rings.map((g) => g.map((c) => [c.X / M.E, c.Y / M.E]));
    const a1 = mien.reduce((s, g) => s + aire(g), 0), a2 = q.rings.reduce((s, g) => s + aire(g), 0);
    const b1 = boite(mien), b2 = boite(q.rings);
    voir(jeu + ' ' + q.id + ' nom', p.id === q.id, p.id);
    voir(jeu + ' ' + q.id + ' anneaux', mien.length === q.rings.length, mien.length + ' / ' + q.rings.length);
    voir(jeu + ' ' + q.id + ' surface', Math.abs(Math.abs(a1) - Math.abs(a2)) < 0.08, a1.toFixed(3) + ' / ' + a2.toFixed(3));
    voir(jeu + ' ' + q.id + ' boîte', b1.every((v, k) => Math.abs(v - b2[k]) < 0.01), b1.map((v) => v.toFixed(3)) + ' / ' + b2.map((v) => v.toFixed(3)));
    ['origin', 'u', 'v', 'normal', 'explode'].forEach((c) => voir(jeu + ' ' + q.id + ' ' + c, p[c].every((v, k) => Math.abs(v - q[c][k]) < 1e-6), p[c] + ' / ' + q[c]));
    if (q.nscores) { const l1 = long(p.scores.map((g) => g.map((c) => [c.X / M.E, c.Y / M.E]))), l2 = q.lscores;
      voir(jeu + ' ' + q.id + ' tuiles', Math.abs(l1 - l2) < Math.max(0.6, l2 * 0.002), l1.toFixed(2) + ' / ' + l2.toFixed(2)); }
    const c1 = m.cutParts[i].rings.map((g) => g.map((c) => [c.X / M.E, c.Y / M.E])), c2 = r.cut[i].rings;
    const k1 = c1.reduce((s, g) => s + aire(g), 0), k2 = c2.reduce((s, g) => s + aire(g), 0);
    voir(jeu + ' ' + q.id + ' coupe', Math.abs(Math.abs(k1) - Math.abs(k2)) < 0.15 && c1.length === c2.length, k1.toFixed(3) + ' / ' + k2.toFixed(3) + ' · ' + c1.length + ' / ' + c2.length);
  });
}
console.log(ko ? ko + ' écart(s), ' + ok + ' vérifications justes' : 'Tout est juste : ' + ok + ' vérifications');
process.exit(ko ? 1 : 0);
