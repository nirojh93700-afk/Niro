/* Outil de l'atelier « Lettre à incruster » (13/11/2026).
   À partir d'un modèle (lettre de naissance) : le fond, le dessus de couleur avec les EMPLACEMENTS,
   les pièces blanches à y poser, la gravure par-dessus, rangés en planches à la taille de la machine.
   Données : window.LI_DONNEES (écritures en base64). Bibliothèques : ClipperLib, opentype (écrites dans la page). */
(function () {
'use strict';
var CL = window.ClipperLib, D = window.LI_DONNEES, E = 100, POL = {}, REF = {}, CACHE = {}, G = null, T3 = null;
function $(i) { return document.getElementById(i); }
function fr(n, d) { return Number(n).toFixed(d == null ? 1 : d).replace('.', ','); }
function ech(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- géométrie (unités : centièmes de millimètre) ---------- */
function pt(x, y) { return { X: Math.round(x * E), Y: Math.round(y * E) }; }
function op(a, b, type) { var c = new CL.Clipper(), r = []; c.AddPaths(a, CL.PolyType.ptSubject, true); if (b && b.length) c.AddPaths(b, CL.PolyType.ptClip, true);
  c.Execute(type, r, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return r; }
function unir(a, b) { return op(a, b, CL.ClipType.ctUnion); }
function moins(a, b) { return b && b.length ? op(a, b, CL.ClipType.ctDifference) : a; }
function inter(a, b) { return op(a, b, CL.ClipType.ctIntersection); }
function decaler(a, d) { if (!a.length || !d) return a; var co = new CL.ClipperOffset(2, 3), r = []; co.AddPaths(a, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(r, d * E); return r; }
function trait(lignes, larg) { var co = new CL.ClipperOffset(2, 3), r = [];
  lignes.forEach(function (l) { co.AddPath(l.map(function (q) { return pt(q[0], q[1]); }), CL.JoinType.jtRound, CL.EndType.etOpenRound); }); co.Execute(r, larg / 2 * E); return r; }
function aire(a) { var s = 0; a.forEach(function (p) { s += CL.Clipper.Area(p); }); return Math.abs(s) / (E * E); }
function boite(a) { var x0 = 1e12, y0 = 1e12, x1 = -1e12, y1 = -1e12; a.forEach(function (p) { p.forEach(function (q) { if (q.X < x0) x0 = q.X; if (q.X > x1) x1 = q.X; if (q.Y < y0) y0 = q.Y; if (q.Y > y1) y1 = q.Y; }); });
  return a.length ? { x: x0 / E, y: y0 / E, w: (x1 - x0) / E, h: (y1 - y0) / E } : { x: 0, y: 0, w: 0, h: 0 }; }
function bouger(a, dx, dy, k) { k = k || 1; return a.map(function (p) { return p.map(function (q) { return { X: Math.round(q.X * k + dx * E), Y: Math.round(q.Y * k + dy * E) }; }); }); }
function centrer(a) { var b = boite(a); return bouger(a, -(b.x + b.w / 2), -(b.y + b.h / 2)); }
function tourner(a, deg) { var t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return a.map(function (p) { return p.map(function (q) { return { X: Math.round(q.X * c - q.Y * s), Y: Math.round(q.X * s + q.Y * c) }; }); }); }
function miroir(a) { return a.map(function (p) { return p.map(function (q) { return { X: -q.X, Y: q.Y }; }).reverse(); }); }
function po(p) { if (!CL.Clipper.Orientation(p)) p.reverse(); return p; }
function ellipse(cx, cy, rx, ry, n) { n = n || 48; var p = []; for (var i = 0; i < n; i++) { var t = i / n * 2 * Math.PI; p.push(pt(cx + rx * Math.cos(t), cy + ry * Math.sin(t))); } return po(p); }
function cercle(cx, cy, r) { return ellipse(cx, cy, r, r, Math.max(28, Math.round(r * 8))); }
function rect(x, y, w, h) { return po([pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h)]); }
function arc(cx, cy, r, a0, a1, n) { var o = []; n = n || 14; for (var i = 0; i <= n; i++) { var t = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return o; }
function dPath(a) { return a.map(function (p) { return 'M' + p.map(function (q) { return (q.X / E).toFixed(2) + ' ' + (q.Y / E).toFixed(2); }).join('L') + 'Z'; }).join(''); }
function exPolys(a) { var c = new CL.Clipper(), t = new CL.PolyTree(); c.AddPaths(a, CL.PolyType.ptSubject, true); c.Execute(CL.ClipType.ctUnion, t, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return CL.JS.PolyTreeToExPolygons(t); }
function pleins(a) { return unir(exPolys(a).map(function (e) { return e.outer; })); }

/* ---------- écritures ---------- */
function police(id) { if (POL[id]) return POL[id]; var p = D.pol.filter(function (q) { return q.id === id; })[0], bin = atob(p.b), buf = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); return POL[id] = window.opentype.parse(buf.buffer); }
function courbe(o, x0, y0, c) { var n, i, t, u;
  if (c.type === 'Q') { n = 8; for (i = 1; i <= n; i++) { t = i / n; u = 1 - t; o.push([u * u * x0 + 2 * u * t * c.x1 + t * t * c.x, u * u * y0 + 2 * u * t * c.y1 + t * t * c.y]); } }
  else { n = 12; for (i = 1; i <= n; i++) { t = i / n; u = 1 - t; o.push([u * u * u * x0 + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x, u * u * u * y0 + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y]); } } }
/* un texte en anneaux ; ligne de base en y = 0. manque = lettres que l'écriture n'a pas */
function ecrit(id, txt, taille, manque) { var f = police(id), gl = f.stringToGlyphs(txt), x = 0, k = taille / f.unitsPerEm, brut = [];
  gl.forEach(function (g, i) { if (g.index === 0 && txt[i] !== ' ' && manque) manque.push(txt[i]);
    var cur = null, px = 0, py = 0; g.getPath(x, 0, taille).commands.forEach(function (c) {
      if (c.type === 'M') { if (cur && cur.length > 2) brut.push(cur); cur = [[c.x, c.y]]; px = c.x; py = c.y; }
      else if (c.type === 'L') { cur.push([c.x, c.y]); px = c.x; py = c.y; }
      else if (c.type === 'Q' || c.type === 'C') { courbe(cur, px, py, c); px = c.x; py = c.y; }
      else if (c.type === 'Z') { if (cur && cur.length > 2) brut.push(cur); cur = null; } });
    if (cur && cur.length > 2) brut.push(cur);
    x += g.advanceWidth * k + (gl[i + 1] ? f.getKerningValue(g, gl[i + 1]) * k : 0); });
  var p = brut.map(function (r) { return r.map(function (q) { return pt(q[0], q[1]); }); });
  /* le sens des anneaux dépend de l'écriture : on met le plus grand dans le sens « plein » */
  var gros = null, ag = 0; p.forEach(function (r) { var a = Math.abs(CL.Clipper.Area(r)); if (a > ag) { ag = a; gros = r; } });
  if (gros && !CL.Clipper.Orientation(gros)) p.forEach(function (r) { r.reverse(); });
  return unir(p); }
function refH(id) { if (!REF[id]) REF[id] = boite(ecrit(id, '0', 100)).h || 70; return REF[id]; }
function texteH(id, txt, h) { return ecrit(id, txt, 100 * h / refH(id)); }

/* ---------- l'état ---------- */
var COULEURS = [['rose', 'Rose', '#f1b3c4'], ['bleu', 'Bleu ciel', '#a8cbea'], ['sauge', 'Vert sauge', '#a9b99a'], ['lilas', 'Lilas', '#c8b5e2'], ['jaune', 'Jaune doux', '#f0d488'], ['bois', 'Bois naturel', '#d9b98a'], ['gris', 'Gris', '#a3a7ad']];
var SIGNES = ['Capricorne', 'Verseau', 'Poissons', 'Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire'];
var SIGNE_CODE = [0x2651, 0x2652, 0x2653, 0x2648, 0x2649, 0x264a, 0x264b, 0x264c, 0x264d, 0x264e, 0x264f, 0x2650];
var ELS = [
  { id: 'date', nom: 'Date', grp: 1, scan: 'hg' }, { id: 'horloge', nom: 'Horloge', grp: 1, scan: 'hg' }, { id: 'heure', nom: 'Heure', grp: 1, scan: 'hg' },
  { id: 'signe', nom: 'Signe', scan: 'bd' },
  { id: 'taille', nom: 'Taille', grp: 2, scan: 'bg' }, { id: 'regle', nom: 'Règle', grp: 2, scan: 'bg' }, { id: 'pieds', nom: 'Pieds', grp: 2, scan: 'bg' }, { id: 'poids', nom: 'Poids', grp: 2, scan: 'bg' },
  { id: 'animal', nom: 'Animal', scan: 'hd' }, { id: 'libre', nom: 'Texte libre', scan: 'loin' },
  { id: 'et1', nom: 'Grande étoile', scan: 'loin', d: 16 }, { id: 'et2', nom: 'Étoile 2', scan: 'loin', d: 10 }, { id: 'et3', nom: 'Étoile 3', scan: 'loin', d: 10 },
  { id: 'et4', nom: 'Étoile 4', scan: 'loin', d: 9 }, { id: 'et5', nom: 'Étoile 5', scan: 'loin', d: 9 }, { id: 'et6', nom: 'Étoile 6', scan: 'loin', d: 8 }];
/* 48 animaux : dessins de la police Noto Emoji de Google (licence libre OFL), gardés dans animaux.ttf */
var ANIMAUX = [['chat', 'Chat', 0x1F408], ['chat-tete', 'Chat (tête)', 0x1F431], ['chien', 'Chien', 0x1F415], ['chien-tete', 'Chien (tête)', 0x1F436], ['lapin', 'Lapin', 0x1F407], ['lapin-tete', 'Lapin (tête)', 0x1F430],
  ['nounours', 'Nounours', 0x1F9F8], ['ours', 'Ours (tête)', 0x1F43B], ['panda', 'Panda', 0x1F43C], ['koala', 'Koala', 0x1F428], ['renard', 'Renard', 0x1F98A], ['lion', 'Lion', 0x1F981], ['tigre', 'Tigre', 0x1F405],
  ['elephant', 'Éléphant', 0x1F418], ['girafe', 'Girafe', 0x1F992], ['singe', 'Singe', 0x1F412], ['souris', 'Souris', 0x1F401], ['herisson', 'Hérisson', 0x1F994], ['ecureuil', 'Écureuil', 0x1F43F], ['faon', 'Faon', 0x1F98C],
  ['licorne', 'Licorne', 0x1F984], ['cheval', 'Cheval', 0x1F40E], ['mouton', 'Mouton', 0x1F411], ['vache', 'Vache', 0x1F404], ['cochon', 'Cochon', 0x1F416], ['poussin', 'Poussin', 0x1F425], ['canard', 'Canard', 0x1F986],
  ['hibou', 'Hibou', 0x1F989], ['cygne', 'Cygne', 0x1F9A2], ['pingouin', 'Pingouin', 0x1F427], ['baleine', 'Baleine', 0x1F40B], ['dauphin', 'Dauphin', 0x1F42C], ['tortue', 'Tortue', 0x1F422], ['papillon', 'Papillon', 0x1F98B],
  ['coccinelle', 'Coccinelle', 0x1F41E], ['abeille', 'Abeille', 0x1F41D], ['escargot', 'Escargot', 0x1F40C], ['grenouille', 'Grenouille', 0x1F438], ['dinosaure', 'Dinosaure', 0x1F995], ['trex', 'Tyrannosaure', 0x1F996],
  ['paon', 'Paon', 0x1F99A], ['flamant', 'Flamant rose', 0x1F9A9], ['loutre', 'Loutre', 0x1F9A6], ['paresseux', 'Paresseux', 0x1F9A5], ['lama', 'Lama', 0x1F999], ['kangourou', 'Kangourou', 0x1F998], ['poisson', 'Poisson', 0x1F420], ['pieuvre', 'Pieuvre', 0x1F419],
  ['bebe', 'Bébé emmailloté', 0x1F476], ['biberon', 'Biberon', 0x1F37C], ['couronne', 'Couronne', 0x1F451], ['ballon', 'Ballon', 0x1F388], ['arcenciel', 'Arc-en-ciel', 0x1F308], ['fleur', 'Fleur', 0x1F338],
  ['soleil', 'Soleil', 0x2600], ['cadeau', 'Cadeau', 0x1F381], ['trefle', 'Trèfle', 0x1F340], ['pattes', 'Empreintes de pattes', 0x1F43E]];
/* les 12 signes en dessins (même collection), dans l'ordre de SIGNES */
/* 13/11/2026 soir, le gérant garde le médaillon mais refuse quatre dessins : « j'aime pas les jumeaux, j'aime pas le lion, tu dois refaire Vierge et Verseau ».
   Ces quatre-là ne viennent plus de Noto Emoji : dessins libres composés et tracés (tools/maquettes/lettre-signes.py, cases U+E001… de la police).
   Verseau : la jarre qui verse l'eau · Gémeaux : deux jumeaux face à face · Lion : lion rugissant de profil · Vierge : dame en robe et épis de blé. */
var SIGNE_DESSIN = [0x1F410, 0xE009, 0x1F41F, 0x1F40F, 0x1F402, 0xE001, 0x1F980, 0xE004, 0xE006, 0x2696, 0x1F982, 0x1F3F9];
var DECORS = { etoiles: ['etoile'], nuages: ['nuage'], coeurs: ['coeur'], lune: ['lune', 'etoile', 'etoile', 'etoile', 'etoile', 'etoile'], melange: ['etoile', 'nuage', 'coeur', 'lune', 'etoile', 'nuage'] }, DECOR_NOM = { etoile: 'Étoile', nuage: 'Nuage', coeur: 'Cœur', lune: 'Lune' };
function decorDe(id) { var l = DECORS[S.decor] || DECORS.etoiles; return l[(+id.slice(2) - 1) % l.length]; }
function decorForme(k, d) { var p = [], i, t;
  if (k === 'nuage') { var w = d * 1.5; return centrer(decaler(decaler(unir([cercle(-0.27 * w, 0.06 * w, 0.19 * w), cercle(-0.04 * w, -0.1 * w, 0.26 * w), cercle(0.25 * w, 0.03 * w, 0.2 * w), rect(-0.27 * w, 0.04 * w, 0.52 * w, 0.21 * w)]), -0.35), 0.35)); }
  if (k === 'coeur') { for (i = 0; i < 64; i++) { t = i / 64 * 2 * Math.PI; p.push(pt(d * 1.08 / 32 * 16 * Math.pow(Math.sin(t), 3), -d * 1.08 / 32 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)))); } return centrer([po(p)]); }
  if (k === 'lune') return centrer(decaler(decaler(moins([cercle(0, 0, d * 0.56)], [cercle(d * 0.26, -d * 0.1, d * 0.47)]), -0.4), 0.4));
  return etoile(d / 2); }
function animalChoisi() { return ANIMAUX.filter(function (a) { return a[0] === S.animal; })[0] || null; }
var EXEMPLE = { nom: 'Katia', date: '2022-04-13', heure: '09:20', taille: '51', poids: '3160' };
function neuf() { var el = { plaque: { on: true, mode: 'inc', k: 1, auto: true, fx: 0, fy: 0 } };
  ELS.forEach(function (e) { el[e.id] = { on: true, mode: 'inc', k: 1, auto: true, fx: 0, fy: 0 }; });
  return { v: 1, modele: 'naissance', nom: '', lettre: '', pol: 'fredoka', polNom: 'pacifico', H: 165, gras: 0, bord: 3, coul: 'rose', date: '', heure: '', taille: '', poids: '', libre: '',
    signe: 'auto', signeStyle: 'dessin', horloge: 'grave', decor: 'etoiles', animal: 'chat', nbEt: 6, el: el, zw: 180, zh: 180, zdef: 180, trait: 0.1, jeu: 0.1, ep: 3, sel: null, vue: 'face', num: false, exemple: false,
    bforme: 'lettre', bw: 120,
    bt: { on: true, prof: 40, rayon: 8, cour: 5, jeuC: 0.2, pas: 2, pad: 10, nb: 0, dos: true, rep: true, plaque: false, poig: true } }; }
/* « boîte seule » : le même outil, sans la lettre décorée. La boîte prend la forme d'une lettre, d'un chiffre ou d'une forme simple ; le couvercle est une pièce pleine */
var SEULE = /boite/.test(location.hash || ''), FORMES = [['lettre', 'Lettre ou chiffre'], ['rect', 'Rectangle'], ['rond', 'Rond'], ['ovale', 'Ovale'], ['coeur', 'Cœur']];
function cleMem() { return SEULE ? 'niv-boite-seule' : 'niv-lettre-incrustee'; }
function formeSimple() { return SEULE && S.bforme !== 'lettre'; }
function bordB() { return formeSimple() ? 0 : +S.bord; }
function nomForme() { return formeSimple() ? (FORMES.filter(function (f) { return f[0] === S.bforme; })[0] || FORMES[1])[1].toLowerCase() : '« ' + lettreChoisie() + ' »'; }
function prefixe() { return SEULE ? 'boite-' + (formeSimple() ? S.bforme : lettreChoisie()) : 'lettre-' + lettreChoisie(); }
var S = neuf();
function garder() { try { localStorage.setItem(cleMem(), JSON.stringify(S)); } catch (e) {} }
function relire() { try { var t = JSON.parse(localStorage.getItem(cleMem()) || 'null'); if (t && t.v === 1) { var n = neuf(); /* zone par défaut passée de 200 à 180 mm (13/11/2026) : un réglage resté à l'ancienne valeur par défaut suit */ if (t.zdef !== 180 && t.zw === 200 && t.zh === 200) { t.zw = 180; t.zh = 180; if (t.H === 170) t.H = 165; /* 170 + le bord ne tient plus dans 180 */ } Object.keys(n).forEach(function (k) { if (t[k] === undefined) t[k] = n[k]; });
  Object.keys(n.el).forEach(function (k) { if (!t.el[k]) t.el[k] = n.el[k]; }); Object.keys(n.bt).forEach(function (k) { if (t.bt[k] === undefined) t.bt[k] = n.bt[k]; }); S = t; S.vue = 'face'; S.sel = null; return true; } } catch (e) {} return false; }

function lettreChoisie() { var l = (S.lettre || S.nom || 'P').trim().charAt(0) || 'P'; l = l.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); return /[A-Z0-9]/.test(l) ? l : 'P'; }
function signeChoisi() { if (S.signe === 'aucun') return -1; if (S.signe !== 'auto') return +S.signe; var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(S.date); if (!m) return -1;
  var j = +m[3], mo = +m[2], lim = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22]; return (j >= lim[mo - 1] ? mo : mo - 1) % 12; }
function textes() { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(S.date), h = /^(\d\d?):(\d\d)/.exec(S.heure);
  return { d1: m ? m[3] + '.' + m[2] : '', d2: m ? m[1] : '', heure: h ? (+h[1]) + ':' + h[2] : '', hh: h ? +h[1] : 0, mm: h ? +h[2] : 0,
    taille: String(S.taille).trim() ? String(S.taille).trim().replace('.', ',') + ' cm' : '', poids: String(S.poids).trim() ? String(S.poids).trim() + ' g' : '' }; }

/* ---------- les formes de base (à la taille d'une lettre de 170 mm, centrées sur 0) ---------- */
function limiter(a, lmax) { var b = boite(a); return b.w > lmax ? bouger(a, 0, 0, lmax / b.w) : a; }
function etoile(R) { var p = []; for (var i = 0; i < 10; i++) { var r = i % 2 ? R * 0.5 : R, t = (-90 + i * 36) * Math.PI / 180; p.push(pt(r * Math.cos(t), r * Math.sin(t))); }
  return decaler(decaler([po(p)], -R * 0.1), R * 0.1); }
function pied() { /* une empreinte de pied gauche (gros orteil à droite) : la plante avec le creux de la voûte, deux plis laissés en blanc, cinq orteils séparés */
  var cx = 0.2, cy = -0.6, rx = 4.1, ry = 3.6, plante = unir([ellipse(cx, cy, rx, ry, 44)], [ellipse(-0.5, 5.7, 2.9, 3.3, 40)]);
  plante = unir(plante, [po([pt(-3.7, -0.4), pt(4.1, 0.1), pt(2.3, 6.2), pt(-3.35, 6)])]);
  plante = moins(plante, [ellipse(4.9, 3.7, 2.9, 3.5, 40)]); plante = decaler(decaler(decaler(plante, -0.5), 1), -0.5);
  function pli(x0, y0, x1, y1, f) { var l = []; for (var i = 0; i <= 10; i++) { var u = i / 10; l.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + f * 4 * u * (1 - u)]); } return l; }
  plante = moins(plante, trait([pli(-3.7, 1.3, 2.6, 1.2, 0.9), pli(-3, 4.2, 0.6, 4.3, 0.6)], 0.34));
  var r = [1.55, 1.1, 0.98, 0.88, 0.78], o = [], an = -60, prec = null;
  r.forEach(function (rr) { var c; for (;;) { var q = an * Math.PI / 180; c = [cx + (rx + 0.6 + rr) * Math.cos(q), cy + (ry + 0.6 + rr) * Math.sin(q)];
      if (!prec || Math.hypot(c[0] - prec[0], c[1] - prec[1]) >= rr + prec[2] + 0.42 || an < -175) break; an -= 0.5; }
    prec = [c[0], c[1], rr]; o.push(ellipse(c[0], c[1], rr * 0.92, rr * 1.08, 28)); });
  return unir(plante, unir(o)); }
function forme(id) { var T = textes(), cle, g = null, P = S.pol;
  if (id === 'date') cle = id + T.d1 + T.d2 + P; else if (id === 'horloge' || id === 'heure') cle = id + T.heure + P + S.horloge; else if (id === 'signe') cle = id + signeChoisi() + S.signeStyle + P; else if (id.indexOf('et') === 0) cle = id + S.decor;
  else if (id === 'taille' || id === 'regle') cle = id + T.taille + P; else if (id === 'pieds' || id === 'poids') cle = id + T.poids + P; else if (id === 'animal') cle = id + S.animal; else if (id === 'libre') cle = id + S.libre + P; else cle = id;
  if (CACHE[cle] !== undefined) return CACHE[cle];
  if (id === 'date' && T.d1) { var l1 = centrer(texteH(P, T.d1, 9)), l2 = centrer(texteH(P, T.d2, 9)); g = { blanc: limiter(centrer(unir(bouger(l1, 0, -6), bouger(l2, 0, 6))), 36) }; }
  else if (id === 'libre' && String(S.libre).trim()) g = { blanc: limiter(centrer(texteH(P, String(S.libre).trim(), 8)), 60) };
  else if (id === 'heure' && T.heure) g = { blanc: limiter(centrer(texteH(P, T.heure, 8)), 34) };
  else if (id === 'taille' && T.taille) g = { blanc: limiter(centrer(texteH(P, T.taille, 8)), 34) };
  else if (id === 'poids' && T.poids) g = { blanc: limiter(centrer(texteH(P, T.poids, 8)), 34) };
  else if (id === 'horloge' && T.heure) { var tr = [], tg = [], i, an, an1 = ((T.hh % 12) + T.mm / 60) * 30 * Math.PI / 180, an2 = T.mm * 6 * Math.PI / 180;
    if (S.horloge === 'ajour') { /* comme le modèle : anneau et aiguilles blancs. Le grand trait de 12 et le trait moyen de 3 font que le centre de couleur ne rentre que dans un sens */
      for (i = 0; i < 12; i++) { an = i * 30 * Math.PI / 180; var r1 = i === 0 ? 8.3 : (i === 3 ? 9.3 : 10.1); tr.push([[Math.sin(an) * 12, -Math.cos(an) * 12], [Math.sin(an) * r1, -Math.cos(an) * r1]]); }
      var anneau = unir(moins([cercle(0, 0, 14)], [cercle(0, 0, 11.5)]), unir(trait(tr.slice(1), 1.4), trait([tr[0]], 2.2)));
      var aig = unir([cercle(0, 0, 1.7)], unir(trait([[[0, 0], [Math.sin(an1) * 5.2, -Math.cos(an1) * 5.2]]], 2), trait([[[0, 0], [Math.sin(an2) * 7.4, -Math.cos(an2) * 7.4]]], 1.8)));
      g = { blanc: unir(anneau, aig) }; }
    else { /* cadran blanc d'une seule pièce : le tour, les traits, 12 · 3 · 6 · 9 et les aiguilles à l'heure donnée sont gravés */
      for (i = 0; i < 12; i++) { an = i * 30 * Math.PI / 180; if (i % 3 === 0) continue; tg.push([[Math.sin(an) * 12.3, -Math.cos(an) * 12.3], [Math.sin(an) * 10.9, -Math.cos(an) * 10.9]]); }
      var gh = unir(moins([cercle(0, 0, 13.1)], [cercle(0, 0, 12.55)]), trait(tg, 0.5));
      [['12', 0, -9.7], ['3', 9.9, 0], ['6', 0, 9.7], ['9', -9.9, 0]].forEach(function (q) { gh = unir(gh, bouger(centrer(texteH(P, q[0], 3.1)), q[1], q[2])); });
      gh = unir(gh, unir([cercle(0, 0, 1.2)], unir(trait([[[0, 0], [Math.sin(an1) * 5, -Math.cos(an1) * 5]]], 1.5), trait([[[0, 0], [Math.sin(an2) * 7.6, -Math.cos(an2) * 7.6]]], 1.0))));
      g = { blanc: [cercle(0, 0, 14)], grav: gh, dessin: gh }; } }
  else if (id === 'signe' && signeChoisi() >= 0 && S.signeStyle !== 'symbole') { /* un médaillon de signe : le symbole en haut, le dessin au milieu, le nom du signe écrit en rond en bas ; tout est gravé sur un rond blanc */
    var si = signeChoisi(), sd = ecrit('animaux', String.fromCodePoint(SIGNE_DESSIN[si]), 100), sb = boite(sd), sz = bouger(centrer(sd), 0, 0.2, 14.2 / Math.max(sb.w, sb.h)), RS = 15.5;
    var sy = ecrit('signes', String.fromCodePoint(SIGNE_CODE[si]), 100), yb = boite(sy), gs = unir(sz, decaler(bouger(centrer(sy), 0, -10.7, 3.9 / Math.max(yb.w, yb.h)), 0.14));
    gs = unir(gs, moins([cercle(0, 0, RS - 0.9)], [cercle(0, 0, RS - 1.4)]));
    var lts = SIGNES[si].split('').map(function (ch) { var q = texteH(P, ch, 2.5), qb = boite(q); return { p: bouger(q, -(qb.x + qb.w / 2), 0), w: qb.w }; }), ec = 0.42, rt = 12.4, tot = -ec, pos = 0; lts.forEach(function (l) { tot += l.w + ec; });
    lts.forEach(function (l) { var th = (pos + l.w / 2 - tot / 2) / rt; pos += l.w + ec; gs = unir(gs, bouger(tourner(bouger(l.p, 0, rt + 1.25), -th * 180 / Math.PI), 0, 0)); });
    gs = bouger(gs, 0, 0, 14 / RS); /* même encombrement que l'ancien rond (28 mm) : les autres pièces gardent leur place */
    g = { blanc: [cercle(0, 0, 14)], grav: gs, dessin: gs }; }
  else if (id === 'signe' && signeChoisi() >= 0) { var s = ecrit('signes', String.fromCodePoint(SIGNE_CODE[signeChoisi()]), 100), b = boite(s), k = 13.5 / Math.max(b.w, b.h);
    g = { blanc: unir(moins([cercle(0, 0, 14)], [cercle(0, 0, 11.6)]), decaler(bouger(centrer(s), 0, 0, k), 0.25)) }; }
  else if (id === 'regle' && T.taille) { /* comme une vraie règle : un trait par millimètre, plus long tous les 5 et tous les 10, les chiffres des centimètres ; tout est gravé */
    var tk = [], gr; for (var j = 0; j <= 25; j++) { var x = -12.5 + j; tk.push([[x, -3.7], [x, -3.7 + (j % 10 === 0 ? 3.3 : (j % 5 === 0 ? 2.5 : 1.6))]]); }
    gr = trait(tk, 0.28); [0, 1, 2].forEach(function (n) { gr = unir(gr, bouger(centrer(texteH(P, String(n), 2.3)), -12.5 + 10 * n + (n ? 0 : 0.9), 2.2)); });
    g = { blanc: decaler([rect(-14, -3.4, 28, 6.8)], 1), grav: gr }; }
  else if (id === 'pieds' && T.poids) { var pz = centrer(unir(bouger(tourner(pied(), -9), -6.2, 0), bouger(tourner(miroir(pied()), 9), 6.2, 0)));
    /* comme l'animal : une pièce blanche à la silhouette des deux pieds (1,2 mm de marge, creux fermés), les empreintes gravées dessus */
    g = { blanc: decaler(pleins(decaler(pz, 3.6)), -2.4), grav: pz, dessin: pz }; }
  else if (id === 'animal' && animalChoisi()) { var an = ecrit('animaux', String.fromCodePoint(animalChoisi()[2]), 100), ab = boite(an), dz = bouger(centrer(an), 0, 0, 36 / Math.max(ab.w, ab.h));
    /* pièce blanche = la silhouette du dessin, avec 1,2 mm de marge, creux fermés ; le dessin lui-même est gravé dessus */
    g = { blanc: decaler(pleins(decaler(dz, 2.6)), -1.4), grav: dz, dessin: dz }; }
  else if (id.indexOf('et') === 0) { var e = ELS.filter(function (q) { return q.id === id; })[0]; g = { blanc: decorForme(decorDe(id), e.d) }; }
  if (g) { g.b = boite(g.blanc); g.grav = g.grav || []; }
  return CACHE[cle] = g; }

/* la lettre : (0,0) en haut à gauche, hauteur H */
function coeurForme(H) { var p = [], i, n = 220, x0 = 1e9, y0 = 1e9, y1 = -1e9; for (i = 0; i < n; i++) { var a = i / n * 2 * Math.PI, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); p.push([x, y]); x0 = Math.min(x0, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  var k = H / (y1 - y0); return [po(p.map(function (q) { return pt((q[0] - x0) * k, (q[1] - y0) * k); }))]; }
function lettre() { if (formeSimple()) { var Hh = +S.H, Ww = Math.max(30, +S.bw || 120);
    if (S.bforme === 'rond') return [ellipse(Hh / 2, Hh / 2, Hh / 2, Hh / 2, 240)]; if (S.bforme === 'ovale') return [ellipse(Ww / 2, Hh / 2, Ww / 2, Hh / 2, 240)]; if (S.bforme === 'coeur') return coeurForme(Hh); return [rect(0, 0, Ww, Hh)]; }
  var L = lettreChoisie(), cle = 'L' + S.pol + L + S.gras, base = CACHE[cle];
  if (!base) { var p = ecrit(S.pol, L, 240), b = boite(p), k = 170 / b.h; p = bouger(p, 0, 0, k); if (S.gras) p = decaler(p, +S.gras);
    b = boite(p); k = 170 / b.h; p = bouger(p, -b.x * k, -b.y * k, k); base = CACHE[cle] = p; }
  return bouger(base, 0, 0, S.H / 170); }
/* le prénom et sa plaque, centrés sur 0 */
function prenom(W, u) { var txt = (S.nom || '').trim() || 'Prénom', cle = 'N' + S.polNom + txt, base = CACHE[cle];
  if (!base) { var manque = [], p = ecrit(S.polNom, txt, 100, manque), b = boite(p); base = CACHE[cle] = { p: centrer(p), w: b.w, manque: manque }; }
  var k = Math.min(1.02 * W / base.w, 0.22 * S.H / boite(base.p).h) * S.el.plaque.k, nom = bouger(base.p, 0, 0, k);
  return { nom: nom, plaque: pleins(decaler(nom, 3.2 * u)), manque: base.manque }; }

/* ---------- la place automatique : une carte de la lettre, 1 point par mm ---------- */
function Carte(L, W, H, marge) { var res = Math.max(W, H) > 420 ? 0.5 : 1, w = Math.ceil(W * res) + 2, h = Math.ceil(H * res) + 2, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  var c = cv.getContext('2d', { willReadFrequently: true }), sat = null;
  function tracer(a) { c.beginPath(); a.forEach(function (p) { p.forEach(function (q, i) { var x = q.X / E * res, y = q.Y / E * res; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); }); c.fill('evenodd'); }
  c.fillStyle = '#000'; tracer(decaler(L, -marge)); c.globalCompositeOperation = 'destination-out';
  this.oter = function (a) { tracer(a); sat = null; };
  this.oterRect = function (x, y, ww, hh) { c.fillRect(x * res, y * res, ww * res, hh * res); sat = null; };
  function lire() { var d = c.getImageData(0, 0, w, h).data; sat = new Int32Array((w + 1) * (h + 1));
    for (var y = 0; y < h; y++) { var ligne = 0; for (var x = 0; x < w; x++) { ligne += d[(y * w + x) * 4 + 3] > 127 ? 0 : 1; sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1] + ligne; } } }
  this.libre = function (x, y, ww, hh) { if (!sat) lire(); var x0 = Math.floor(x * res), y0 = Math.floor(y * res), x1 = Math.ceil((x + ww) * res), y1 = Math.ceil((y + hh) * res);
    if (x0 < 0 || y0 < 0 || x1 > w || y1 > h) return false; var k = w + 1; return sat[y1 * k + x1] - sat[y0 * k + x1] - sat[y1 * k + x0] + sat[y0 * k + x0] === 0; };
  this.W = W; this.H = H; }
/* rend le coin haut-gauche d'un rectangle w × h libre, ou null */
function chercher(carte, w, h, scan) { var W = carte.W, H = carte.H, x, y, pas = Math.max(1, S.H / 170), xs = [], ys = [];
  for (x = 0; x <= W - w; x += pas) xs.push(x); for (y = 0; y <= H - h; y += pas) ys.push(y);
  if (scan === 'loin') { var mieux = null, mm = -1; for (var i = 0; i < ys.length; i += 2) for (var j = 0; j < xs.length; j += 2) { if (!carte.libre(xs[j], ys[i], w, h)) continue; var m = 0;
      while (m < 14 * pas && carte.libre(xs[j] - m - pas, ys[i] - m - pas, w + 2 * (m + pas), h + 2 * (m + pas))) m += pas; if (m > mm) { mm = m; mieux = { x: xs[j], y: ys[i] }; } } return mieux; }
  if (scan.charAt(0) === 'b') ys.reverse(); if (scan.charAt(1) === 'd') xs.reverse();
  for (var a = 0; a < ys.length; a++) for (var b = 0; b < xs.length; b++) if (carte.libre(xs[b], ys[a], w, h)) { var c = b; while (c + 1 < xs.length && carte.libre(xs[c + 1], ys[a], w, h)) c++; return { x: (xs[b] + xs[c]) / 2, y: ys[a] }; }
  return null; }

/* ---------- tout calculer ---------- */
function calculer() { var an0 = animalChoisi(); var nd = {}; ELS.forEach(function (d) { if (d.id === 'animal') d.nom = an0 ? an0[1] : 'Animal'; else if (d.id.indexOf('et') === 0) { var kd = decorDe(d.id); nd[kd] = (nd[kd] || 0) + 1; d.nom = DECOR_NOM[kd] + ' ' + nd[kd]; } });
  var u = S.H / 170, L = lettre(), bl = boite(L), W = bl.w, H = S.H, alertes = [], T = textes();
  var g = { u: u, L: L, W: W, H: H, els: [], alertes: alertes };
  /* le prénom et sa plaque */
  var pq = S.el.plaque, P = pq.on && !SEULE ? prenom(W, u) : null;
  if (P) { if (pq.auto) { pq.fx = (W * 0.5 + Math.max(0, boite(P.plaque).w - W) / 2) / H; pq.fy = 0.565; }
    P.x = pq.fx * H; P.y = pq.fy * H; P.nomA = bouger(P.nom, P.x, P.y); P.plaqueA = bouger(P.plaque, P.x, P.y); P.b = boite(P.plaqueA);
    if (P.manque.length) alertes.push('L\'écriture du prénom n\'a pas le signe « ' + P.manque.join(' ') + ' ».'); }
  g.P = P;
  /* les éléments présents */
  var actifs = []; ELS.forEach(function (d) { var e = S.el[d.id]; if (!e.on || SEULE) return; if (d.id.indexOf('et') === 0 && +d.id.slice(2) > S.nbEt) return; var f = forme(d.id); if (!f) return; if (e.auto) e.k = 1;
    actifs.push({ d: d, e: e, f: f, s: u * e.k, w: f.b.w * u * e.k, h: f.b.h * u * e.k }); });
  /* la place automatique */
  var carte = new Carte(L, W, H, 2.2 * u), jeuP = 2.2 * u;
  if (P) carte.oter(decaler(P.plaqueA, jeuP));
  actifs.forEach(function (a) { if (!a.e.auto) carte.oterRect(a.e.fx * H - a.w / 2 - jeuP, a.e.fy * H - a.h / 2 - jeuP, a.w + 2 * jeuP, a.h + 2 * jeuP); });
  function poser(a, x, y) { a.e.fx = (x + a.w / 2) / H; a.e.fy = (y + a.h / 2) / H; carte.oterRect(x - jeuP, y - jeuP, a.w + 2 * jeuP, a.h + 2 * jeuP); }
  function seul(a) { for (var n = 0; n < 9; n++) { var q = chercher(carte, a.w, a.h, a.d.scan); if (q) { poser(a, q.x, q.y); return true; } a.e.k *= 0.92; a.s = u * a.e.k; a.w = a.f.b.w * a.s; a.h = a.f.b.h * a.s; }
    a.e.k = 1; a.perdu = true; return false; }
  [1, 2].forEach(function (gr) { var bloc = actifs.filter(function (a) { return a.d.grp === gr && a.e.auto; }); if (!bloc.length) return; var ec = 3.2 * u, fait = false, k0 = bloc.map(function (a) { return a.e.k; });
    for (var n = 0; n < 5 && !fait; n++) { var bw = 0, bh = -ec; bloc.forEach(function (a) { bw = Math.max(bw, a.w); bh += a.h + ec; });
      var q = chercher(carte, bw, bh, bloc[0].d.scan); if (q) { var y = q.y; bloc.forEach(function (a) { poser(a, q.x + (bw - a.w) / 2, y); y += a.h + ec; }); fait = true; }
      else bloc.forEach(function (a) { a.e.k *= 0.93; a.s = u * a.e.k; a.w = a.f.b.w * a.s; a.h = a.f.b.h * a.s; }); }
    if (!fait) { bloc.forEach(function (a, i) { a.e.k = k0[i]; a.s = u * a.e.k; a.w = a.f.b.w * a.s; a.h = a.f.b.h * a.s; }); (gr === 2 ? bloc.slice().reverse() : bloc).forEach(seul); } });
  actifs.filter(function (a) { return !a.d.grp && a.e.auto; }).forEach(seul);
  g.perdus = actifs.filter(function (a) { return a.perdu; }); actifs = actifs.filter(function (a) { return !a.perdu; });
  /* les formes en place */
  var poches = [], gravD = [], Lm = decaler(L, -1);
  actifs.forEach(function (a, i) { a.n = i + 1; a.x = a.e.fx * H; a.y = a.e.fy * H; a.B = bouger(a.f.blanc, a.x, a.y, a.s); a.Gv = bouger(a.f.grav, a.x, a.y, a.s); a.bo = boite(a.B); a.al = [];
    if (aire(moins(a.B, Lm)) > 0.05) a.al.push(aire(moins(a.B, L)) > 0.05 ? 'sort de la lettre' : 'trop près du bord');
    if (P && aire(inter(a.B, decaler(P.plaqueA, 0.8))) > 0.02) a.al.push('touche la plaque du prénom');
    var fin = decaler(decaler(a.B, -0.5), 0.5), ar = aire(a.B); a.fin = ar > 0 && (ar - aire(fin)) / ar > 0.12; a.morceaux = exPolys(a.B).length;
    if (a.e.mode === 'inc') { poches = poches.concat(a.B); if (a.fin) a.al.push('traits de moins de 1 mm'); } else gravD = gravD.concat(a.f.dessin ? bouger(a.f.dessin, a.x, a.y, a.s) : a.B); });
  for (var i = 0; i < actifs.length; i++) for (var j = i + 1; j < actifs.length; j++) { var A = actifs[i], B = actifs[j];
    if (A.bo.x > B.bo.x + B.bo.w + 1 || B.bo.x > A.bo.x + A.bo.w + 1 || A.bo.y > B.bo.y + B.bo.h + 1 || B.bo.y > A.bo.y + A.bo.h + 1) continue;
    if (aire(inter(decaler(A.B, 0.4), decaler(B.B, 0.4))) > 0.02) { A.al.push('touche « ' + B.d.nom + ' »'); B.al.push('touche « ' + A.d.nom + ' »'); } }
  g.els = actifs;
  var toutes = unir(poches, P && pq.mode === 'inc' ? P.plaqueA : []);
  g.dessus = moins(L, decaler(toutes, S.jeu)); g.gravD = inter(unir(gravD), L);
  g.fond = unir(decaler(L, bordB()), P && pq.mode === 'inc' ? decaler(P.plaqueA, S.bord) : []); g.bf = boite(g.fond); calculerBoite(g);
  if (SEULE) { g.dessus = []; g.gravD = []; if (g.bt) { g.fond = g.bt.O; g.bf = boite(g.fond); } }
  /* la petite languette du couvercle, pour l'ouvrir (gérant, 13/11/2026 : « des petites poignées discrètes… c'est pour ouvrir ») */
  g.poig = null; if (g.bt && S.bt.poig !== false) { var lg = languette(g); if (lg) { g.poig = lg; g.fond = unir(g.fond, lg.a); g.bf = boite(g.fond); } }
  /* les centres de couleur qui tombent à la découpe */
  var ex = exPolys(g.dessus).map(function (e) { return { a: Math.abs(CL.Clipper.Area(e.outer)) / (E * E), b: boite([e.outer]), p: [e.outer].concat(e.holes) }; }).sort(function (a, b) { return b.a - a.a; });
  var bouche = decaler(pleins(toutes), S.jeu + 0.3); g.centres = ex.filter(function (c, i) { return i > 0 && aire(moins(c.p, bouche)) < 0.01; }); g.parts = ex.length - g.centres.length; g.petits = g.centres.filter(function (c) { return Math.min(c.b.w, c.b.h) < 2; }).length;
  actifs.forEach(function (a) { a.centres = g.centres.filter(function (c) { var x = c.b.x + c.b.w / 2, y = c.b.y + c.b.h / 2; return x > a.bo.x && x < a.bo.x + a.bo.w && y > a.bo.y && y < a.bo.y + a.bo.h; }).length; });
  /* les alertes */
  g.perdus.forEach(function (a) { alertes.push('« ' + a.d.nom + ' » n\'a pas de place dans cette lettre : il n\'est pas découpé. Épaississez la lettre (étape 1), ou posez-le vous-même (étape 3).'); });
  actifs.forEach(function (a) { a.al.forEach(function (t) { alertes.push('« ' + a.d.nom + ' » ' + t + '.'); }); });
  if (g.petits) alertes.push(g.petits + ' centre' + (g.petits > 1 ? 's' : '') + ' de couleur de moins de 2 mm (dans les chiffres) : passez ces éléments en « Gravé », ou agrandissez la lettre.');
  planches(g); G = g; return g; }

/* ---------- la boîte sous la lettre ----------
   Même principe que le « Number Box with Living Hinge » d'Atomm (analysé le 13/11/2026) : un fond à encoches, une bande de côté
   à fentes (elle plie là où le contour tourne), découpée en plusieurs morceaux selon la zone de la machine, une couronne en haut,
   et le couvercle (la lettre décorée) tenu en place par une cale collée dessous. */
function enveloppe(pts) { var a = pts.slice().sort(function (p, q) { return p.X - q.X || p.Y - q.Y; }), h = [], i, t;
  function cr(o, p, q) { return (p.X - o.X) * (q.Y - o.Y) - (p.Y - o.Y) * (q.X - o.X); }
  for (i = 0; i < a.length; i++) { while (h.length >= 2 && cr(h[h.length - 2], h[h.length - 1], a[i]) <= 0) h.pop(); h.push(a[i]); }
  t = h.length + 1; for (i = a.length - 2; i >= 0; i--) { while (h.length >= t && cr(h[h.length - 2], h[h.length - 1], a[i]) <= 0) h.pop(); h.push(a[i]); }
  h.pop(); return po(h); }
function bandeAutour(ligne, demi) { var co = new CL.ClipperOffset(2, 3), r = []; co.AddPath(ligne.map(function (q) { return pt(q[0], q[1]); }), CL.JoinType.jtRound, CL.EndType.etOpenButt); co.Execute(r, demi * E); return r; }
function courbeDe(poly) { var P = poly.map(function (q) { return [q.X / E, q.Y / E]; }), n = P.length, cum = [0];
  for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); } return { P: P, n: n, cum: cum, L: cum[n] }; }
function pointA(c, s) { s = ((s % c.L) + c.L) % c.L; var lo = 0, hi = c.n; while (hi - lo > 1) { var m = (lo + hi) >> 1; if (c.cum[m] <= s) lo = m; else hi = m; }
  var a = c.P[lo], b = c.P[(lo + 1) % c.n], d = c.cum[lo + 1] - c.cum[lo], t = d ? (s - c.cum[lo]) / d : 0; return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, i: lo, tx: d ? (b[0] - a[0]) / d : 1, ty: d ? (b[1] - a[1]) / d : 0 }; }
function morceauDe(c, s1, s2) { var q = pointA(c, s1), o = [[q.x, q.y]], reste = s2 - s1, i = q.i, s = ((s1 % c.L) + c.L) % c.L, garde = 0;
  while (garde++ < 4 * c.n + 8) { var d = c.cum[i + 1] - s; if (d >= reste) { var f = pointA(c, s2); o.push([f.x, f.y]); break; }
    o.push(c.P[(i + 1) % c.n]); reste -= d; i++; if (i >= c.n) { i = 0; s = 0; } else s = c.cum[i]; } return o; }
/* de combien le contour tourne entre deux points de la bande (en radians) */
function virage(c, s1, s2) { if (!c.tr) { c.tr = []; for (var i = 0; i < c.n; i++) { var a = c.P[(i + c.n - 1) % c.n], b = c.P[i], d = c.P[(i + 1) % c.n], ux = b[0] - a[0], uy = b[1] - a[1], vx = d[0] - b[0], vy = d[1] - b[1]; c.tr.push(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)); } }
  var t = 0; for (var k = 0; k < c.n; k++) { var s = c.cum[k]; if ((s >= s1 && s <= s2) || (s + c.L >= s1 && s + c.L <= s2) || (s - c.L >= s1 && s - c.L <= s2)) t += c.tr[k]; } return Math.abs(t); }
/* là où le contour tourne : intervalles (en mm le long de la bande) qui reçoivent des fentes */
function zonesSouples(c, pad) { var z = [], i;
  for (i = 0; i < c.n; i++) { var a = c.P[(i + c.n - 1) % c.n], b = c.P[i], d = c.P[(i + 1) % c.n], ux = b[0] - a[0], uy = b[1] - a[1], vx = d[0] - b[0], vy = d[1] - b[1];
    if (Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)) > 0.014) z.push([c.cum[i] - pad, c.cum[i] + pad]); }
  z.sort(function (p, q) { return p[0] - q[0]; }); var m = []; z.forEach(function (q) { var d = m[m.length - 1]; if (d && q[0] <= d[1] + 0.01) d[1] = Math.max(d[1], q[1]); else m.push([q[0], q[1]]); });
  var tot = 0; m.forEach(function (q) { tot += q[1] - q[0]; });
  return { z: m, part: Math.min(1, tot / c.L), dans: function (s) { s = ((s % c.L) + c.L) % c.L; for (var k = 0; k < m.length; k++) { var q = m[k]; if ((s >= q[0] && s <= q[1]) || (s - c.L >= q[0] && s - c.L <= q[1]) || (s + c.L >= q[0] && s + c.L <= q[1])) return true; } return false; } }; }
/* un morceau de bande à plat : x le long (0 → long), y de 0 (haut des tenons) à Hm. souple(s) dit si la colonne s reçoit des fentes */
function morceauBande(o) { var T = o.T, Hm = o.Hm, p = o.p, len = o.b - o.a, d = o.droit ? 0 : o.d, nf = Math.max(3, 2 * Math.floor((Hm - 2 * T) / 9.7) + 1), hs = (Hm - 2 * T) / nf, P = [], q, i, x;
  var n = Math.round(len / p);
  var i0 = Math.round(o.a / p), ok = function (i) { return !o.tenon || o.tenon(i0 + i); };
  P.push([0, T]); for (i = 0; i < n; i++) { if (!ok(i)) continue; x = (i + 0.25) * p; P.push([x, T], [x, 0], [x + p / 2, 0], [x + p / 2, T]); } P.push([len, T]);
  for (q = 0; q < nf; q++) { x = q % 2 ? len - d : len; P.push([x, T + q * hs], [x, T + (q + 1) * hs]); }
  for (i = n - 1; i >= 0; i--) { if (!ok(i)) continue; x = (i + 0.75) * p; P.push([x, Hm - T], [x, Hm], [x - p / 2, Hm], [x - p / 2, Hm - T]); } P.push([0, Hm - T]);
  for (q = nf - 1; q >= 0; q--) { x = q % 2 ? -d : 0; P.push([x, T + (q + 1) * hs], [x, T + q * hs]); }
  var poly = []; P.forEach(function (a) { var z = poly[poly.length - 1]; if (!z || Math.abs(z[0] - a[0]) > 1e-6 || Math.abs(z[1] - a[1]) > 1e-6) poly.push(a); });
  /* les fentes : une colonne sur deux a ses ponts aux bords, l'autre au milieu (comme Atomm) */
  var lignes = [], pas = o.pas, pont = 4.2, corps = Hm - 2 * T, nb = Math.max(1, Math.round(corps / 34)), U = corps / nb, c0 = Math.ceil((o.a + 2.5) / pas), c1 = Math.floor((o.b - d - 2.5) / pas), cc, k;
  for (cc = c0; cc <= c1; cc++) { var s = cc * pas; if (!o.souple(s)) continue; x = s - o.a;
    if (cc % 2 === 0) for (k = 0; k < nb; k++) lignes.push([[x, T + k * U + (k ? pont / 2 : pont)], [x, T + (k + 1) * U - (k < nb - 1 ? pont / 2 : pont)]]);
    else for (k = 0; k <= nb; k++) { var y0 = k ? T + (k - 0.5) * U + pont / 2 : T, y1 = k < nb ? T + (k + 0.5) * U - pont / 2 : Hm - T; lignes.push([[x, y0], [x, y1]]); } }
  return { poly: [po(poly.map(function (a) { return pt(a[0], a[1]); }))], lignes: lignes, long: len + d, fentes: lignes.length }; }
var BTC = { cle: '', bt: null, al: [] };
/* Languette du couvercle : une petite patte arrondie qui dépasse du bord de la boîte, là où le contour va le plus loin (toujours accessible),
   du côté où le couvercle tient encore dans la zone de la machine. Elle fait partie du couvercle (fond blanc, ou couvercle plein de la boîte seule). */
function languette(g) { var O = g.bt.O[0], u = Math.min(1.6, Math.max(0.8, (S.H || 170) / 170)) /* jamais trop petite pour le doigt, jamais énorme */, W = 14 * u, L0 = 5 * u, P = 6 * u, k2 = S.trait / 2;
  var zw = (+S.zw || 180) - 4 - 2 * k2, zh = (+S.zh || 180) - 4 - 2 * k2, b0 = boite(g.fond), bo = boite([O]), mx = bo.x + bo.w / 2, my = bo.y + bo.h / 2, pts = [], i, j;
  for (i = 0; i < O.length; i++) { var a = O[i], b = O[(i + 1) % O.length], n = Math.max(1, Math.ceil(Math.hypot(b.X - a.X, b.Y - a.Y) / E)); for (j = 0; j < n; j++) pts.push([(a.X + (b.X - a.X) * j / n) / E, (a.Y + (b.Y - a.Y) * j / n) / E]); }
  function essai(dx, dy, Lg) { var m = -1e9, l = [], gr = [], cur = null, best = null, r = Math.min(Lg, W / 2) * 0.9;
    pts.forEach(function (q) { var v = q[0] * dx + q[1] * dy; if (v > m) m = v; });
    pts.forEach(function (q) { if (q[0] * dx + q[1] * dy >= m - 0.3) l.push(-q[0] * dy + q[1] * dx); }); l.sort(function (x, y) { return x - y; });
    l.forEach(function (v) { if (cur && v - cur[1] <= 6) cur[1] = v; else { cur = [v, v]; gr.push(cur); } });
    var cen = -mx * dy + my * dx; gr.forEach(function (q) { var c = (q[0] + q[1]) / 2; if (best === null || Math.abs(c - cen) < Math.abs(best - cen)) best = c; });
    function G2(aa, bb) { return pt(m * dx - best * dy + aa * dx - bb * dy, m * dy + best * dx + aa * dy + bb * dx); }
    var p = [G2(-P, -W / 2), G2(Lg - r, -W / 2)]; arc(Lg - r, -W / 2 + r, r, -90, 0, 8).forEach(function (q) { p.push(G2(q[0], q[1])); }); arc(Lg - r, W / 2 - r, r, 0, 90, 8).forEach(function (q) { p.push(G2(q[0], q[1])); }); p.push(G2(-P, W / 2));
    var t = [po(p)], f = unir(g.fond, t), bb = boite(f);
    /* le pied de la languette est adouci (pas d'angle vif où le bois casserait) */
    var zone = [po([G2(-P - 3, -W / 2 - 6), G2(Lg + 1, -W / 2 - 6), G2(Lg + 1, W / 2 + 6), G2(-P - 3, W / 2 + 6)])], doux = decaler(decaler(inter(f, zone), 2 * u), -2 * u);
    /* elle « tient » si elle n'agrandit pas le couvercle au-delà de la zone (une lettre déjà trop large reste signalée par l'alerte des planches) */
    var dw = bb.w > b0.w + 0.01 ? bb.w - zw : 0, dh = bb.h > b0.h + 0.01 ? bb.h - zh : 0;
    return { a: unir(t, doux), ok: dw <= 0.01 && dh <= 0.01, trop: Math.max(dw, dh, 0), long: Lg, cote: dx > 0 ? 'à droite' : dx < 0 ? 'à gauche' : dy > 0 ? 'en bas' : 'en haut' }; }
  var cs = [[1, 0], [-1, 0], [0, 1], [0, -1]], tous = cs.map(function (c) { return essai(c[0], c[1], L0); });
  for (i = 0; i < 4; i++) if (tous[i].ok) return tous[i];
  /* aucun côté à la taille prévue : un peu plus courte (jamais moins de 3,5 mm), du côté où elle tient */
  for (i = 0; i < 4; i++) { var L2 = L0 - tous[i].trop - 0.05; if (L2 >= 3.5 * u) { var e = essai(cs[i][0], cs[i][1], L2); if (e.ok) return e; } }
  return tous[0]; }
function calculerBoite(g) { var B = S.bt, T = +S.ep || 3, al = g.alertes; g.bt = null; if (!B || (!B.on && !SEULE)) return;
  var pq0 = S.el.plaque, cle = JSON.stringify([SEULE, S.bforme, S.bw, lettreChoisie(), S.pol, S.gras, S.H, S.bord, S.ep, S.jeu, S.trait, S.zw, S.zh, B, B.plaque && g.P ? [S.nom, S.polNom, pq0.fx, pq0.fy, pq0.k, pq0.mode] : 0]);
  if (BTC.cle === cle) { BTC.al.forEach(function (t) { al.push(t); }); if (BTC.bt) { g.bt = BTC.bt; g.fond = unir(pleins(g.fond), BTC.bt.O); g.bf = boite(g.fond); } return; }
  var al0 = al.length; calculerBoite2(g); BTC = { cle: cle, bt: g.bt, al: al.slice(al0) }; }
function calculerBoite2(g) { var B = S.bt, T = +S.ep || 3, al = g.alertes;
  var r = Math.max(T, +B.rayon || 8), Hm = +B.prof || 40, jeu = +S.jeu || 0, k2 = S.trait / 2, d = 1.5 * T;
  /* le contour de la boîte : le fond sans ses trous, creux et pointes arrondis au rayon que la bande peut suivre */
  var plein = pleins(g.fond), src = B.plaque && !SEULE ? plein : pleins(decaler(g.L, bordB())), O = decaler(decaler(pleins(decaler(decaler(src, r), -r)), -r), r);
  O = CL.Clipper.CleanPolygons(O, 3).filter(function (q) { return q.length > 2; });
  /* la ligne du milieu de la bande, lissée (un décalage vers l'intérieur laisse de petites pointes) */
  var C = CL.Clipper.CleanPolygons(decaler(decaler(O, -(T / 2 + 0.8)), 0.8), 5).filter(function (q) { return q.length > 2; }), ouv = decaler(O, -(T + B.cour));
  if (O.length !== 1 || C.length !== 1) { al.push('La boîte : cette ' + (formeSimple() ? 'forme est trop petite' : 'lettre est trop fine') + ' pour une bande pliée (rayon ' + fr(r) + ' mm). Épaississez la lettre (étape 1), agrandissez-la, ou baissez le rayon des angles.'); return; }
  if (Hm < 2 * T + 12) { al.push('La boîte : les côtés sont trop bas pour cette épaisseur de bois (au moins ' + fr(2 * T + 12, 0) + ' mm).'); return; }
  g.fond = unir(plein, O); g.bf = boite(g.fond);
  var c = courbeDe(C[0]), N = Math.max(4, Math.round(c.L / 12)), p = c.L / N, zs = zonesSouples(c, +B.pad || 0), zj = zonesSouples(c, 7), tout = zs.part > 0.85;
  /* le nombre de morceaux : ce qui tient dans la largeur de la zone */
  var Lmax = (+S.zw || 180) - 4 - d - 2 * k2 - 0.5, nAuto = 1; while (nAuto < N / 2 && Math.ceil(N / nAuto) * p > Lmax) nAuto++;
  var n = B.nb > 0 ? Math.min(Math.floor(N / 2), +B.nb) : nAuto, maxP = Math.max(2, Math.floor(Lmax / p), Math.ceil(N / n)), coupes = null, mieux = 1e9, lmin = 1e9, k, j;
  /* où couper la bande : de préférence dans une partie droite, sans dépasser la longueur que la machine accepte */
  for (k = 0; k < N; k++) { var cs = [k], sc = (!tout && zj.dans(k * p)) ? 1 : 0, lm = 0;
    for (j = 1; j < n; j++) { var ideal = k + Math.round(j * N / n), prev = cs[j - 1], pris = null, dd, e2, q2;
      for (dd = 0; dd <= maxP && pris === null; dd++) for (e2 = 0; e2 < 2 && pris === null; e2++) { q2 = ideal + (e2 ? dd : -dd);
        if (q2 - prev < 2 || q2 - prev > maxP || k + N - q2 > (n - j) * maxP || k + N - q2 < 2 * (n - j)) continue; if (tout || !zj.dans(q2 * p)) pris = q2; }
      if (pris === null) { pris = Math.min(prev + maxP, Math.max(prev + 2, ideal)); sc++; } cs.push(pris); lm = Math.max(lm, pris - prev); }
    cs.push(k + N); lm = Math.max(lm, k + N - cs[n - 1]);
    if (sc < mieux || (sc === mieux && lm < lmin)) { mieux = sc; lmin = lm; coupes = cs; } }
  /* les encoches du fond et de la couronne : une par tenon, à la corde (un tenon est droit) */
  var enc = [], i, tenons = [], nT = 0; for (i = 0; i < N; i++) { tenons.push(virage(c, (i + 0.25) * p - 4, (i + 0.75) * p + 4) / (p / 2 + 8) < 0.085); if (!tenons[i]) continue; nT++; var ban = bandeAutour(morceauDe(c, (i + 0.25) * p - jeu / 2, (i + 0.75) * p + jeu / 2), T / 2 + 0.3 + jeu / 2), pts = []; ban.forEach(function (q) { pts = pts.concat(q); }); if (pts.length > 2) enc.push(enveloppe(pts)); }
  var base = moins(O, unir(enc)), cour = moins(base, ouv), cale = decaler(O, -(T + B.cour + B.jeuC));
  if (!ouv.length || !cale.length) al.push('La boîte : le rebord du haut (' + fr(B.cour) + ' mm) ne laisse pas d\'ouverture. Réduisez-le, ou agrandissez la lettre.');
  if (Hm + 2 * k2 > (+S.zh || 180) - 4) al.push('La boîte : les côtés (' + fr(Hm, 0) + ' mm) sont plus hauts que la zone de la machine.');
  /* repères gravés : la même lettre sur le morceau de bande et sur le fond, à côté de sa première encoche */
  function repere(txt, x, y, h) { var t = centrer(texteH(S.pol, txt, h)); return bouger(t, x, y); }
  var dedans = function (x, y) { return CL.Clipper.PointInPolygon(pt(x, y), O[0]) !== 0; }, gravBase = [], mor = [];
  for (j = 0; j < n; j++) { var a = coupes[j] * p, b = coupes[j + 1] * p, nom = String.fromCharCode(65 + j), m = morceauBande({ a: a, b: b, p: p, T: T, Hm: Hm, d: d, pas: +B.pas || 2, souple: tout ? function () { return true; } : zs.dans, tenon: function (i) { return tenons[((i % N) + N) % N]; } });
    m.nom = nom; m.grav = [];
    if (B.rep) { /* sur la bande : au milieu de la plus grande partie sans fentes ; s'il n'y en a pas, en petit sur le premier tenon (caché une fois emboîté) */
      var xs = [2].concat(m.lignes.map(function (l) { return l[0][0]; }).sort(function (u, v) { return u - v; })).concat([b - a - 2]), gx = 0, gl = 0, xi; for (xi = 1; xi < xs.length; xi++) if (xs[xi] - xs[xi - 1] > gl) { gl = xs[xi] - xs[xi - 1]; gx = (xs[xi] + xs[xi - 1]) / 2; }
      if (gl >= 9) m.grav = repere(nom, gx, Hm / 2, Math.min(8, gl - 4, Hm * 0.22));
      else { var it = 0; while (it < Math.round((b - a) / p) - 1 && !tenons[((coupes[j] + it) % N + N) % N]) it++; m.grav = repere(nom, (it + 0.5) * p, T / 2, Math.min(2.4, T - 0.7)); } }
    if (B.rep) { var q = pointA(c, a + p / 2), nx = -q.ty, ny = q.tx; if (!dedans(q.x + nx * (T + 1), q.y + ny * (T + 1))) { nx = -nx; ny = -ny; } var dr = T / 2 + B.cour + 9, hr = 6.5; if (!dedans(q.x + nx * (dr + 5), q.y + ny * (dr + 5))) { dr = T / 2 + 5; hr = 4.5; } gravBase = gravBase.concat(repere(nom, q.x + nx * dr, q.y + ny * dr, hr)); }
    mor.push(m); }
  g.bt = { O: O, I: decaler(O, -T), base: base, cour: cour, cale: cale, dos: B.dos ? O : null, gravBase: gravBase, mor: mor, n: n, nAuto: nAuto, L: c.L, N: nT, p: p, T: T, Hm: Hm, part: zs.part, tout: tout,
    fentes: mor.reduce(function (t, m) { return t + m.fentes; }, 0), haut: Hm + 2 * T + (B.dos ? T : 0), utile: Hm - 2 * T, coupesSouples: mieux }; }
function blocsBoite(g) { var bt = g.bt, k2 = S.trait / 2, o = [];
  function bloc(id, nom, coupe, grav, n, lignes) { return { id: id, nom: nom, n: n, coupe: coupe, grav: grav || [], lignes: lignes || null, b: boite(coupe) }; }
  o.push(bloc('boite-fond', 'Fond de la boîte (à encoches)', decaler(bt.base, k2), bt.gravBase, 'BF'));
  if (bt.cour.length) o.push(bloc('boite-couronne', 'Couronne du haut', decaler(bt.cour, k2), null, 'BC'));
  if (bt.cale.length) o.push(bloc('boite-cale', 'Cale du couvercle', decaler(bt.cale, k2), null, 'BK'));
  if (bt.dos) o.push(bloc('boite-dos', 'Dos (plaque du dessous)', decaler(bt.dos, k2), null, 'BD'));
  bt.mor.forEach(function (m) { o.push(bloc('boite-bande-' + m.nom, 'Bande ' + m.nom, decaler(m.poly, k2), m.grav, m.nom, m.lignes)); });
  return o; }
function essaiCharniere() { var B = S.bt, T = +S.ep || 3, Hm = +B.prof || 40, p = 12, m = morceauBande({ a: 0, b: 6 * p, p: p, T: T, Hm: Hm, d: 0, droit: true, pas: +B.pas || 2, souple: function () { return true; } });
  var bl = { id: 'essai-charniere', nom: 'Essai de pliage', n: 'E', coupe: decaler(m.poly, S.trait / 2), grav: [], lignes: m.lignes }; bl.b = boite(bl.coupe);
  return svgPlanche({ items: [{ bl: bl, x: 2, y: 2 }], w: bl.b.w + 4, h: bl.b.h + 4, titre: 'Essai de pliage · fentes tous les ' + fr(+B.pas || 2) + ' mm' }, false); }

/* ---------- les planches ---------- */
function planches(g) { var k2 = S.trait / 2, blancs = [], coul = [];
  function bloc(id, nom, coupe, grav, n) { var b = boite(coupe); return { id: id, nom: nom, n: n, coupe: coupe, grav: grav || [], b: b }; }
  function gardes(l) { return l.filter(function (b) { return !i3Hors(b.id); }); }
  if (SEULE) { g.pages = g.bt ? ranger(gardes([bloc('boite-couvercle', 'Couvercle (pièce pleine)', decaler(g.fond, k2), null, 'CV')].concat(blocsBoite(g))), 'Bois de la boîte', 'boite') : []; return; }
  blancs.push(bloc('fond', 'Fond', decaler(g.fond, k2), null, 'F'));
  if (g.P && S.el.plaque.mode === 'inc') blancs.push(bloc('plaque', 'Plaque du prénom', decaler(g.P.plaqueA, k2), null, 'P'));
  g.els.forEach(function (a) { if (a.e.mode === 'inc') blancs.push(bloc('piece-' + a.n + '-' + a.d.id, a.d.nom, decaler(a.B, k2), a.Gv, a.n)); });
  coul.push(bloc('dessus', 'Dessus de couleur', decaler(g.dessus, k2), g.gravD, 'D'));
  if (g.P) coul.push(bloc('prenom', 'Prénom', decaler(g.P.nomA, k2), null, 'N'));
  g.pages = ranger(gardes(blancs), 'Blanc').concat(ranger(gardes(coul), 'Couleur')).concat(g.bt ? ranger(gardes(blocsBoite(g)), 'Bois de la boîte', 'boite') : []); }
function ranger(blocs, matiere, cle) { var zw = +S.zw || 180, zh = +S.zh || 180, m = 2, ec = 3, pages = [];
  blocs.slice().sort(function (a, b) { return b.b.h - a.b.h; }).forEach(function (bl) { var w = bl.b.w, h = bl.b.h, mis = false;
    for (var i = 0; i < pages.length && !mis; i++) { var p = pages[i]; if (p.trop) continue;
      for (var j = 0; j < p.rangs.length && !mis; j++) { var r = p.rangs[j]; if (r.x + w <= zw - m && h <= r.h) { p.items.push({ bl: bl, x: r.x, y: r.y }); r.x += w + ec; mis = true; } }
      if (!mis && p.y + h <= zh - m && w <= zw - 2 * m) { p.rangs.push({ x: m + w + ec, y: p.y, h: h }); p.items.push({ bl: bl, x: m, y: p.y }); p.y += h + ec; mis = true; } }
    if (!mis) { var trop = w > zw - 2 * m || h > zh - 2 * m; pages.push({ matiere: matiere, items: [{ bl: bl, x: m, y: m }], rangs: [{ x: m + w + ec, y: m, h: h }], y: m + h + ec, trop: trop }); } });
  pages.forEach(function (p, i) { var W = 0, H = 0; p.items.forEach(function (it) { W = Math.max(W, it.x + it.bl.b.w); H = Math.max(H, it.y + it.bl.b.h); }); p.w = W + m; p.h = H + m;
    p.nom = (cle || matiere.toLowerCase()) + '-' + (i + 1); p.titre = 'Planche ' + matiere.toLowerCase() + ' ' + (i + 1) + (pages.length > 1 ? ' sur ' + pages.length : ''); });
  return pages; }
function svgPlanche(p, apercu) { var h = '';
  p.items.forEach(function (it) { var dx = it.x - it.bl.b.x, dy = it.y - it.bl.b.y;
    h += '<path id="' + it.bl.id + '" d="' + dPath(bouger(it.bl.coupe, dx, dy)) + '" fill="none" stroke="#FF0000" stroke-width="' + (apercu ? 0.35 : 0.1) + '"/>';
    if (it.bl.grav.length) h += '<path id="' + it.bl.id + '-gravure" d="' + dPath(bouger(it.bl.grav, dx, dy)) + '" fill="#000000" stroke="none"/>';
    if (it.bl.lignes && it.bl.lignes.length) h += '<path id="' + it.bl.id + '-fentes" d="' + it.bl.lignes.map(function (l) { return 'M' + (l[0][0] + dx).toFixed(2) + ' ' + (l[0][1] + dy).toFixed(2) + 'L' + (l[1][0] + dx).toFixed(2) + ' ' + (l[1][1] + dy).toFixed(2); }).join('') + '" fill="none" stroke="#FF0000" stroke-width="' + (apercu ? 0.25 : 0.1) + '"/>';
    if (apercu) h += '<g transform="translate(' + (it.x + Math.min(5, it.bl.b.w / 2)).toFixed(1) + ' ' + (it.y + Math.min(5, it.bl.b.h / 2)).toFixed(1) + ')"><circle r="3.2" fill="#1a1206"/><text text-anchor="middle" dominant-baseline="central" font-size="3.6" font-weight="700" fill="#fff" font-family="sans-serif">' + it.bl.n + '</text></g>'; });
  if (apercu) return '<svg viewBox="-2 -2 ' + (p.w + 4).toFixed(1) + ' ' + (p.h + 4).toFixed(1) + '" role="img" aria-label="' + p.titre + '">' + h + '</svg>';
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + p.w.toFixed(2) + 'mm" height="' + p.h.toFixed(2) + 'mm" viewBox="0 0 ' + p.w.toFixed(2) + ' ' + p.h.toFixed(2) + '">\n<!-- Niv Création · lettre à incruster · ' + p.titre + ' · rouge = découpe, noir = gravure · taille réelle en mm -->\n' + h.replace(/<path/g, '\n<path') + '\n</svg>\n'; }

/* ---------- l'aperçu de face ---------- */
function couleur() { return (COULEURS.filter(function (c) { return c[0] === S.coul; })[0] || COULEURS[0])[2]; }
function fonce(hex, k) { var n = parseInt(hex.slice(1), 16), r = Math.round((n >> 16) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
function dessiner() { var g = G, c = couleur(), b = g.bf, pad = 5 * g.u, h = '';
  h += '<path d="' + dPath(g.fond) + '" fill="' + (SEULE ? '#dcbf91' : '#fbfaf6') + '" stroke="' + (SEULE ? '#b99a68' : '#cfc9bb') + '" stroke-width="' + 0.35 * g.u + '"/>';
  if (SEULE && g.bt) h += '<path d="' + dPath(g.bt.I) + '" fill="none" stroke="#8a6c3f" stroke-width="' + 0.4 * g.u + '" stroke-dasharray="' + 2.4 * g.u + ' ' + 1.8 * g.u + '"/>';
  h += '<path d="' + dPath(g.dessus) + '" fill="' + c + '" stroke="' + fonce(c, 0.8) + '" stroke-width="' + 0.25 * g.u + '"/>';
  if (g.gravD.length) h += '<path d="' + dPath(g.gravD) + '" fill="' + fonce(c, 0.62) + '"/>';
  function zone(id, bo, n, al) { var m = 1.5 * g.u, sel = S.sel === id;
    return '<rect class="li-zone' + (sel ? ' sel' : '') + (al ? ' al' : '') + '" x="' + (bo.x - m) + '" y="' + (bo.y - m) + '" width="' + (bo.w + 2 * m) + '" height="' + (bo.h + 2 * m) + '" rx="' + 1.5 * g.u + '" stroke-width="' + 0.6 * g.u + '" stroke-dasharray="' + 2 * g.u + ' ' + 1.5 * g.u + '"/>'
      + (S.num ? '<g transform="translate(' + (bo.x - 0.5 * g.u) + ' ' + (bo.y - 0.5 * g.u) + ') scale(' + g.u + ')"><circle r="3.3" fill="#1a1206" opacity=".94"/><text text-anchor="middle" dominant-baseline="central" font-size="4" font-weight="700" fill="#fff" font-family="sans-serif">' + n + '</text></g>' : ''); }
  if (g.P) { h += '<g data-el="plaque" class="li-el">' + (S.el.plaque.mode === 'inc' ? '<path d="' + dPath(g.P.plaqueA) + '" fill="#ffffff" stroke="#d8d2c4" stroke-width="' + 0.25 * g.u + '"/>' : '')
      + '<path d="' + dPath(g.P.nomA) + '" fill="' + fonce(c, 0.93) + '" stroke="' + fonce(c, 0.7) + '" stroke-width="' + 0.3 * g.u + '"/>' + zone('plaque', g.P.b, 'P', false) + '</g>'; }
  g.els.forEach(function (a) { h += '<g data-el="' + a.d.id + '" class="li-el">';
    if (a.e.mode === 'inc') { h += '<path d="' + dPath(a.B) + '" fill="#ffffff" stroke="#d8d2c4" stroke-width="' + 0.2 * g.u + '"/>'; if (a.Gv.length) h += '<path d="' + dPath(a.Gv) + '" fill="#4a443c"/>'; }
    h += zone(a.d.id, a.bo, a.n, a.al.length) + '</g>'; });
  var sv = $('svg'); sv.setAttribute('viewBox', (b.x - pad) + ' ' + (b.y - pad) + ' ' + (b.w + 2 * pad) + ' ' + (b.h + 2 * pad)); sv.innerHTML = h; }

/* ---------- la vue 3D ---------- */
function charger3(suite) { if (window.THREE) return suite(); var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  sc.onload = suite; sc.onerror = function () { $('aide').textContent = 'La vue 3D n\'a pas pu se charger.'; vue('face'); }; document.head.appendChild(sc); }
function couche(a, z, ep, coul) { var TH = window.THREE, g = G, k = 100 / g.bf.h, cx = g.bf.x + g.bf.w / 2, cy = g.bf.y + g.bf.h / 2, grp = new TH.Group(), mat = new TH.MeshStandardMaterial({ color: coul, roughness: .8, metalness: .02 });
  exPolys(a).forEach(function (ex) { var sh = new TH.Shape(ex.outer.map(function (q) { return new TH.Vector2((q.X / E - cx) * k, -(q.Y / E - cy) * k); }));
    ex.holes.forEach(function (ho) { sh.holes.push(new TH.Path(ho.map(function (q) { return new TH.Vector2((q.X / E - cx) * k, -(q.Y / E - cy) * k); }))); });
    var m = new TH.Mesh(new TH.ExtrudeGeometry(sh, { depth: ep * k, bevelEnabled: false, curveSegments: 1 }), mat); m.position.z = z * k; grp.add(m); }); return grp; }
function trois() { charger3(function () { var TH = window.THREE, cv = $('c3d'), st = $('scene'), w = st.clientWidth, h = st.clientHeight;
  if (!T3) { T3 = { r: new TH.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }), sc: new TH.Scene(), cam: new TH.PerspectiveCamera(32, 1, 1, 2000), g: new TH.Group(), rx: -.35, ry: .5 };
    T3.sc.add(new TH.AmbientLight(0xffffff, .52)); var l = new TH.DirectionalLight(0xffffff, .55); l.position.set(-60, 120, 160); T3.sc.add(l); T3.sc.add(T3.g);
    var bas = null; cv.addEventListener('pointerdown', function (e) { bas = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!bas) return; T3.ry += (e.clientX - bas[0]) * .01; T3.rx = Math.max(-1.4, Math.min(1.4, T3.rx + (e.clientY - bas[1]) * .01)); bas = [e.clientX, e.clientY]; rendre(); });
    cv.addEventListener('pointerup', function () { bas = null; }); cv.addEventListener('pointercancel', function () { bas = null; }); }
  while (T3.g.children.length) T3.g.remove(T3.g.children[0]);
  var c = new TH.Color(couleur()), bl = new TH.Color('#f6f3ec'), ep = +S.ep || 3, blancs = []; G.els.forEach(function (a) { if (a.e.mode === 'inc') blancs = blancs.concat(a.B); });
  T3.g.add(couche(G.fond, 0, ep, SEULE ? new TH.Color('#e2c79b') : bl)); if (G.dessus.length) T3.g.add(couche(G.dessus, ep, ep, c)); if (blancs.length) T3.g.add(couche(unir(blancs), ep, ep, bl));
  if (G.P) { if (S.el.plaque.mode === 'inc') T3.g.add(couche(G.P.plaqueA, ep, ep, bl)); T3.g.add(couche(G.P.nomA, 2 * ep, ep * 0.6, new TH.Color(fonce(couleur(), 0.9)))); }
  /* les détails gravés se voient aussi en 3D : sur les pièces blanches (cadran, animal, signe, règle, pieds) et sur le dessus (pièces en « Gravé ») */
  var gv = []; G.els.forEach(function (a) { if (a.e.mode === 'inc' && a.Gv.length) gv = gv.concat(a.Gv); });
  if (gv.length) T3.g.add(couche(unir(gv), 2 * ep, 0.16, new TH.Color('#4a443c'))); if (G.gravD.length) T3.g.add(couche(G.gravD, 2 * ep, 0.16, new TH.Color(fonce(couleur(), 0.6))));
  if (G.bt) { var bt = G.bt, bois = new TH.Color('#d9bb8c'), bois2 = new TH.Color('#c9a878'), lev = 14, kk = 100 / G.bf.h, dz = (bt.Hm + lev) / 2 * kk;
    T3.g.add(couche(bt.cale, -bt.T, bt.T, bois2)); T3.g.add(couche(moins(bt.O, bt.I), -lev - bt.Hm, bt.Hm, bois)); T3.g.add(couche(bt.cour, -lev - bt.T, bt.T, bois2)); T3.g.add(couche(bt.I, -lev - bt.Hm, bt.T, bois2));
    if (bt.dos) T3.g.add(couche(bt.dos, -lev - bt.Hm - bt.T, bt.T, bois2)); T3.g.children.forEach(function (ch) { ch.position.z = dz; }); }
  T3.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); T3.r.setSize(w, h, false); T3.cam.aspect = w / h;
  var lw = 100 * G.bf.w / G.bf.h; T3.cam.position.set(0, 0, Math.max((lw / 2 + 8) / (.2867 * w / h), 58 / .2867) * (G.bt ? 1.22 : 1)); T3.cam.updateProjectionMatrix(); rendre(); }); }
function rendre() { if (!T3) return; T3.g.rotation.set(T3.rx, T3.ry, 0); T3.r.render(T3.sc, T3.cam); }
function vue(v) { S.vue = v; $('vFace').className = v === 'face' ? 'on' : ''; $('v3d').className = v === '3d' ? 'on' : ''; $('svg').style.display = v === '3d' ? 'none' : ''; $('c3d').hidden = v !== '3d';
  $('aide').textContent = v === '3d' ? (G && G.bt ? 'Faites tourner avec le doigt. Le couvercle est montré soulevé au-dessus de la boîte.' : 'Faites tourner la lettre avec le doigt.') : (SEULE ? 'La boîte vue du dessus. Le trait pointillé montre l\'intérieur.' : 'Touchez une pièce pour la choisir, glissez-la pour la déplacer.'); if (v === '3d') trois(); }

/* ---------- les listes ---------- */
function modeTxt(m) { return m === 'inc' ? 'Incrusté' : 'Gravé'; }
function listePieces() { var g = G, h = '';
  function ligne(id, n, nom, e, a) { var sel = S.sel === id, al = a && a.al.length;
    var r = '<div class="li-piece' + (sel ? ' sel' : '') + '" data-id="' + id + '"><button type="button" class="li-pl" data-sel="' + id + '"><span class="li-n">' + n + '</span><span class="li-pn">' + nom + (al ? ' <em>à revoir</em>' : '') + '</span></button>'
      + '<select data-mode="' + id + '" aria-label="Façon de faire ' + nom + '"><option value="inc"' + (e.on && e.mode === 'inc' ? ' selected' : '') + '>Incrusté</option><option value="grav"' + (e.on && e.mode === 'grav' ? ' selected' : '') + '>' + (id === 'plaque' ? 'Sans plaque' : 'Gravé') + '</option><option value="non"' + (!e.on ? ' selected' : '') + '>Retiré</option></select>';
    if (sel && e.on) r += '<div class="li-fiche"><div class="li-rg"><span>Taille</span><button type="button" data-k="-1" aria-label="Plus petit">−</button><b>' + Math.round(e.k * 100) + ' %</b><button type="button" data-k="1" aria-label="Plus grand">+</button></div>'
      + '<div class="li-rg"><span>Déplacer (1 mm)</span><button type="button" data-d="-1,0" aria-label="À gauche">←</button><button type="button" data-d="0,-1" aria-label="Vers le haut">↑</button><button type="button" data-d="0,1" aria-label="Vers le bas">↓</button><button type="button" data-d="1,0" aria-label="À droite">→</button></div>'
      + '<button type="button" class="li-lien" data-auto="' + id + '">Placer automatiquement</button>'
      + (a ? '<p class="li-info">' + fr(a.bo.w) + ' × ' + fr(a.bo.h) + ' mm · ' + (e.mode === 'inc' ? a.morceaux + ' morceau' + (a.morceaux > 1 ? 'x' : '') + ' blanc' + (a.morceaux > 1 ? 's' : '') + (a.centres ? ' · ' + a.centres + ' centre' + (a.centres > 1 ? 's' : '') + ' de couleur à recoller' : '') : 'gravé sur le dessus') + '</p>' : '')
      + (al ? '<p class="li-al">' + a.al.map(function (t) { return t.charAt(0).toUpperCase() + t.slice(1) + '.'; }).join(' ') + '</p>' : '') + '</div>';
    return r + '</div>'; }
  var parId = {}, perdu = {}; g.els.forEach(function (a) { parId[a.d.id] = a; }); g.perdus.forEach(function (a) { perdu[a.d.id] = 1; });
  ELS.forEach(function (d) { if (d.id.indexOf('et') === 0 && +d.id.slice(2) > S.nbEt) return; var a = parId[d.id], e = S.el[d.id]; if ((d.id === 'animal' && S.animal === 'aucun') || (d.id === 'libre' && !String(S.libre).trim())) return;
    if (!a && e.on && !forme(d.id)) { h += '<div class="li-piece vide"><span class="li-pl"><span class="li-n">·</span><span class="li-pn">' + d.nom + ' <em class="g">information à remplir</em></span></span></div>'; return; }
    if (perdu[d.id]) { h += '<div class="li-piece"><span class="li-pl"><span class="li-n">·</span><span class="li-pn">' + d.nom + ' <em>pas de place</em></span></span>'
      + '<select data-mode="' + d.id + '" aria-label="Façon de faire ' + d.nom + '"><option value="inc" selected>Incrusté</option><option value="grav">Gravé</option><option value="non">Retiré</option></select>'
      + '<div class="li-fiche"><button type="button" class="li-lien" data-force="' + d.id + '">Le poser au milieu, pour le glisser ensuite</button></div></div>'; return; }
    h += ligne(d.id, a ? a.n : '·', d.nom, e, a); });
  h += ligne('plaque', 'P', 'Prénom et sa plaque', S.el.plaque, null);
  $('pieces').innerHTML = h; }
function fichiers() { var g = G, h = '';
  h += g.alertes.length ? '<div class="li-alertes"><b>À revoir avant de découper</b><ul>' + g.alertes.map(function (t) { return '<li>' + ech(t) + '</li>'; }).join('') + '</ul></div>' : '<p class="li-ok">' + (SEULE ? 'Rien à signaler.' : 'Rien à signaler : chaque pièce tient dans la lettre.') + '</p>';
  if (SEULE) h += '<p class="li-res">Boîte en forme de ' + (formeSimple() ? nomForme() : 'la lettre ou du chiffre ' + nomForme()) + ' : ' + fr(g.bf.w) + ' × ' + fr(g.bf.h) + ' mm à l\'extérieur' + (g.bt ? ', ' + fr(boite(g.bt.I).w) + ' × ' + fr(boite(g.bt.I).h) + ' mm à l\'intérieur' : '') + '.</p>';
  else h += '<p class="li-res">Lettre « ' + lettreChoisie() + ' » : ' + fr(g.W) + ' × ' + fr(g.H) + ' mm · avec le fond : ' + fr(g.bf.w) + ' × ' + fr(g.bf.h) + ' mm · ' + g.centres.length + ' petit' + (g.centres.length > 1 ? 's' : '') + ' centre' + (g.centres.length > 1 ? 's' : '') + ' de couleur à garder quand le dessus est découpé.' + (g.parts > 1 ? ' Le dessus sort en ' + g.parts + ' morceaux (la plaque le traverse) : le fond les tient ensemble.' : '') + '</p>';
  if (g.bt) { var bt = g.bt; h += '<p class="li-res"><b>La boîte.</b> Bande de côté : ' + fr(bt.L, 0) + ' mm de tour, en ' + bt.n + ' morceau' + (bt.n > 1 ? 'x' : '') + ' (' + bt.mor.map(function (m) { return m.nom + ' ' + fr(m.long, 0) + ' mm'; }).join(' · ') + '), ' + fr(bt.Hm, 0) + ' mm de haut, ' + bt.N + ' tenons en haut et en bas, ' + bt.fentes + ' fentes pour plier'
      + (bt.tout ? ' sur toute la longueur' : ' dans les courbes') + (bt.coupesSouples ? ' ; ' + bt.coupesSouples + ' jonction' + (bt.coupesSouples > 1 ? 's tombent' : ' tombe') + ' dans une courbe, à bien coller' : '') + '. Boîte fermée : ' + fr(bt.haut, 0) + ' mm de haut, ' + fr(bt.utile, 0) + ' mm utiles à l\'intérieur. ' + (SEULE ? 'Le couvercle est une pièce pleine, sans trou' : 'Les trous de la lettre sont fermés par le fond blanc du couvercle' + (S.bt.plaque || !g.P ? '' : ' ; la plaque du prénom dépasse de la boîte, elle sert de prise')) + '.</p>'; }
  if (i3().retire && i3Choix().n) h += '<p class="li-res"><b>Imprimé en 3D, donc retiré des planches à découper :</b> ' + i3Dispo().filter(function (q) { return i3Choix()[q[0]] && q[0] !== 'grav'; }).map(function (q) { return i3Nom(q).toLowerCase(); }).join(', ') + '. Le fichier 3D se crée à l\'étape « Impression 3D ».</p>';
  g.pages.forEach(function (p, i) { h += '<div class="li-feuille"><div class="li-ft"><h4>' + p.titre + '</h4><span>' + fr(p.w) + ' × ' + fr(p.h) + ' mm</span></div>' + svgPlanche(p, true)
    + '<p class="li-fn">' + p.items.map(function (it) { return it.bl.n + ' ' + it.bl.nom; }).join(' · ') + '</p>'
    + (p.trop || p.w > S.zw || p.h > S.zh ? '<p class="li-al">Plus grand que la zone de la machine (' + S.zw + ' × ' + S.zh + ' mm) : réduisez la lettre, ou changez la zone à l\'étape 5.</p>' : '')
    + '<button type="button" class="li-btn" data-svg="' + i + '">Télécharger ' + p.nom + '.svg</button></div>'; });
  if (SEULE) h += '<div class="li-feuille"><div class="li-ft"><h4>Liste des pièces et montage</h4></div><p class="li-fn">Chaque pièce de la boîte et l\'ordre de montage, par écrit.</p><button type="button" class="li-btn" data-liste="1">Télécharger liste-des-pieces.txt</button></div>';
  else h += '<div class="li-feuille"><div class="li-ft"><h4>Plan de pose et liste des pièces</h4></div><p class="li-fn">La lettre vue de face avec le numéro de chaque pièce, et la liste écrite.</p>'
    + '<button type="button" class="li-btn" data-plan="1">Télécharger plan-de-pose.svg</button> <button type="button" class="li-btn" data-liste="1">Télécharger liste-des-pieces.txt</button></div>';
  if (g.bt) h += '<div class="li-feuille"><div class="li-ft"><h4>Essai de pliage</h4></div><p class="li-fn">Un petit bout de bande (72 mm) avec les mêmes fentes : à découper d\'abord, pour vérifier que votre bois plie sans casser. S\'il résiste, rapprochez les fentes (étape 4, « Écart entre les fentes »).</p>'
    + '<button type="button" class="li-btn" data-essai="1">Télécharger essai-de-pliage.svg</button></div>';
  if (SEULE) h = h.replace(/étape 5/g, 'étape 3').replace(/étape 4/g, 'étape 2').replace(/réduisez la lettre/g, 'réduisez la boîte');
  $('fichiers').innerHTML = h; }
function listeBoite() { var g = G, T = [], bt = g.bt; T.push('BOÎTE SEULE — ' + (formeSimple() ? nomForme() : 'lettre ou chiffre ' + nomForme()), '');
  T.push('Dimensions extérieures : ' + fr(g.bf.w) + ' x ' + fr(g.bf.h) + ' mm.' + (bt ? ' Boîte fermée : ' + fr(bt.haut + bt.T, 0) + ' mm de haut avec le couvercle, ' + fr(bt.utile, 0) + ' mm utiles à l\'intérieur.' : ''), 'Bois de ' + fr(+S.ep || 3) + ' mm. Trait de coupe : ' + fr(S.trait, 2) + ' mm. Rouge = découpe, noir = gravure.', '');
  if (bt) { T.push('CV  Couvercle : pièce pleine au contour de la boîte.', 'BK  Cale du couvercle : à coller sous le couvercle, elle entre dans la couronne (jeu ' + fr(S.bt.jeuC, 2) + ' mm).', 'BF  Fond de la boîte : le contour (angles arrondis à ' + fr(S.bt.rayon) + ' mm) avec ' + bt.N + ' encoches.',
      'BC  Couronne du haut : même contour, mêmes encoches, ' + fr(S.bt.cour) + ' mm de rebord.' + (bt.dos ? '\nBD  Dos : plaque pleine collée sous le fond, elle cache les tenons.' : ''));
    bt.mor.forEach(function (m) { T.push(m.nom + '  Bande ' + m.nom + ' : ' + fr(m.long, 0) + ' x ' + fr(bt.Hm, 0) + ' mm, ' + m.fentes + ' fentes.'); });
    T.push('', 'Montage : 1. plier doucement chaque morceau de bande (fil du bois dans le sens des fentes), la lettre gravée sur la bande va en face de la même lettre gravée sur le fond. 2. emboîter et coller les tenons du bas dans le fond, morceau après morceau, en fermant les jonctions. 3. poser et coller la couronne sur les tenons du haut.'
      + (bt.dos ? ' 4. coller le dos sous le fond.' : '') + ' Couvercle : poser la cale dans la couronne, mettre de la colle dessus, poser le couvercle bien aligné sur le contour, laisser sécher : la cale est à sa place.' + (g.poig ? ' La petite languette du couvercle (' + g.poig.cote + ') dépasse de la boîte : elle sert à l\'ouvrir.' : '')); }
  if (g.alertes.length) { T.push('', 'À revoir :'); g.alertes.forEach(function (t) { T.push('- ' + t); }); }
  return T.join('\n') + '\n'; }
function listeTexte() { if (SEULE) return listeBoite(); var g = G, T = [], c = (COULEURS.filter(function (q) { return q[0] === S.coul; })[0] || COULEURS[0])[1];
  T.push('LETTRE À INCRUSTER — ' + lettreChoisie() + ((S.nom || '').trim() ? ' — ' + S.nom.trim() : ''), '');
  T.push('Lettre : ' + fr(g.W) + ' x ' + fr(g.H) + ' mm. Avec le fond : ' + fr(g.bf.w) + ' x ' + fr(g.bf.h) + ' mm.', 'Couleur du dessus (aperçu) : ' + c + '. Épaisseur prévue : ' + S.ep + ' mm par couche.',
    'Trait de coupe : ' + fr(S.trait, 2) + ' mm. Jeu autour des pièces : ' + fr(S.jeu, 2) + ' mm. Rouge = découpe, noir = gravure.', '');
  T.push('F  Fond (blanc) : la lettre + ' + fr(S.bord) + ' mm de bord tout autour' + (g.P ? ', et la forme de la plaque' : '') + '.', 'D  Dessus (couleur) : la lettre avec les emplacements découpés' + (g.parts > 1 ? ', en ' + g.parts + ' morceaux' : '') + '. ' + g.centres.length + ' petits centres de couleur tombent à la découpe : à garder et à recoller.');
  if (g.P) T.push('P  Plaque du prénom (blanc)' + (S.el.plaque.mode === 'inc' ? ' : dans son emplacement' : ' : non découpée') + '.', 'N  Prénom (couleur) : collé sur la plaque.'); T.push('');
  g.els.forEach(function (a) { T.push(a.n + '  ' + a.d.nom + ' : ' + (a.e.mode === 'inc' ? 'blanc, ' + a.morceaux + ' morceau(x), dans son emplacement' + (a.centres ? ', ' + a.centres + ' centre(s) de couleur à recoller' : '') + (a.Gv.length ? ', détails gravés dessus' : '') : 'gravé sur le dessus')
    + ' · ' + fr(a.bo.w) + ' x ' + fr(a.bo.h) + ' mm · centre à ' + fr(a.x) + ' mm du bord gauche et ' + fr(a.y) + ' mm du haut de la lettre.'); });
  if (g.bt) { var bt = g.bt; T.push('', 'LA BOÎTE (bois de ' + fr(bt.T) + ' mm) — boîte fermée : ' + fr(bt.haut, 0) + ' mm de haut, ' + fr(bt.utile, 0) + ' mm utiles à l\'intérieur.',
      'BF  Fond de la boîte : le contour de la lettre (angles arrondis à ' + fr(S.bt.rayon) + ' mm) avec ' + bt.N + ' encoches.', 'BC  Couronne du haut : même contour, mêmes encoches, ' + fr(S.bt.cour) + ' mm de rebord.',
      'BK  Cale du couvercle : à coller sous le couvercle, elle entre dans la couronne (jeu ' + fr(S.bt.jeuC, 2) + ' mm).' + (bt.dos ? '\nBD  Dos : plaque pleine collée sous le fond, elle cache les tenons.' : ''));
    bt.mor.forEach(function (m) { T.push(m.nom + '  Bande ' + m.nom + ' : ' + fr(m.long, 0) + ' x ' + fr(bt.Hm, 0) + ' mm, ' + m.fentes + ' fentes.'); });
    T.push('Montage de la boîte : 1. plier doucement chaque morceau de bande (fil du bois dans le sens des fentes), la lettre gravée sur la bande va en face de la même lettre gravée sur le fond. 2. emboîter et coller les tenons du bas dans le fond, morceau après morceau, en fermant les jonctions. 3. poser et coller la couronne sur les tenons du haut.'
      + (bt.dos ? ' 4. coller le dos sous le fond.' : '') + ' Couvercle : poser la cale dans la couronne, mettre de la colle dessus, poser le couvercle bien aligné sur le contour, laisser sécher : la cale est à sa place.' + (g.poig ? ' La petite languette du couvercle (' + g.poig.cote + ') dépasse de la boîte : elle sert à l\'ouvrir.' : '')); }
  var Tx = textes(); if (Tx.heure && g.els.some(function (a) { return a.d.id === 'horloge'; })) T.push('', 'Horloge : aiguilles à ' + Tx.heure + '. ' + (S.horloge === 'ajour' ? 'Le rond de couleur du milieu ne rentre que dans un sens : le grand trait blanc est en haut (12), le trait moyen à droite (3). Les aiguilles blanches se posent dans leur emplacement.' : 'Cadran d\'une seule pièce : le tour, les traits, les chiffres et les aiguilles sont gravés, rien à orienter.'));
  T.push('', 'Ordre de montage : 1. coller le dessus de couleur sur le fond blanc. 2. poser chaque pièce blanche dans son emplacement (numéros du plan de pose). 3. recoller les petits centres de couleur. 4. coller le prénom sur sa plaque.');
  if (g.alertes.length) { T.push('', 'À revoir :'); g.alertes.forEach(function (t) { T.push('- ' + t); }); }
  return T.join('\n') + '\n'; }
function planSvg() { var num = S.num, sel = S.sel; S.num = true; S.sel = null; dessiner(); var sv = $('svg'), vb = sv.getAttribute('viewBox').split(' ');
  var t = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + (+vb[2]).toFixed(1) + 'mm" height="' + (+vb[3]).toFixed(1) + 'mm" viewBox="' + vb.join(' ') + '"><style>.li-zone{fill:none;stroke:none}</style>' + sv.innerHTML + '</svg>\n';
  S.num = num; S.sel = sel; dessiner(); return t; }
function sauver(nom, texte, type) { function lien() { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texte], { type: type })); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  if (window.claude && window.claude.use) window.claude.use('downloads').then(function (d) { if (!d) return lien(); return d.save({ filename: nom, data: typeof texte === 'string' ? texte : new Blob([texte], { type: type }) }); }).catch(function (e) { if (!e || e.code !== 'declined') $('aide').textContent = 'Le fichier n\'a pas pu être enregistré ici.'; });
  else { // dans « L'atelier » publié en artifact, c'est la page du dessus qui enregistre ; dans Gestion (même site), l'outil enregistre lui-même
    var art = false; if (window.parent !== window) { try { art = !!(window.parent.claude && window.parent.claude.use); } catch (e) { art = true; } }
    if (art) { window.parent.postMessage({ type: 'niv-enregistrer', nom: nom, texte: texte, mime: type }, '*'); return; }
    var f = null; try { f = new File([texte], nom, { type: type }); } catch (e) { }
    if (f && navigator.canShare && navigator.canShare({ files: [f] }) && window.matchMedia && matchMedia('(pointer:coarse)').matches)
      navigator.share({ files: [f], title: nom }).catch(function (e) { if (!e || e.name !== 'AbortError') lien(); });
    else lien(); } }

/* ---------- impression 3D (à l'essai) — 13/11/2026 ----------
   Le gérant : « j'aimerais choisir quelle pièce imprimer en 3D ou découper… je sélectionne les composants que je veux faire en une
   seule pièce, j'appuie sur le bouton et ça me fait le fichier… le couvercle en une couleur ou en plusieurs couleurs, le bas de la
   boîte et le contour en une fois ». Les pièces cochées sont réunies en un objet par ensemble (le couvercle, la boîte, la cale).
   Le fichier est fabriqué par NivImpr3D (impression3d.js). L'imprimante n'est pas encore connue : rien n'est réglé pour une marque. */
var I3C = [['fond', 'Fond blanc du couvercle', 'cv'], ['dessus', 'Dessus de couleur (la lettre)', 'cv'], ['pieces', 'Pièces blanches incrustées', 'cv'], ['prenom', 'Prénom et sa plaque', 'cv'],
  ['grav', 'Détails gravés (cadran, animal, règle…)', 'cv'], ['cale', 'Cale sous le couvercle', 'cale'], ['bfond', 'Fond de la boîte', 'bt'], ['parois', 'Contour de la boîte (les côtés)', 'bt'], ['cour', 'Couronne du haut', 'bt']];
function i3() { if (!S.i3 || typeof S.i3 !== 'object') S.i3 = {}; var o = S.i3; if (!o.on || typeof o.on !== 'object') o.on = {}; if (['multi', 'pause', 'relief'].indexOf(o.coul) < 0) o.coul = 'multi'; if (o.fmt !== 'stl') o.fmt = '3mf'; o.retire = !!o.retire; return o; }
function i3Gv() { var gv = []; G.els.forEach(function (a) { if (a.e.mode === 'inc' && a.Gv.length) gv = gv.concat(a.Gv); }); return gv; }
function i3Dispo() { var g = G; if (!g) return []; return I3C.filter(function (c) { var id = c[0];
  if (id === 'dessus') return !SEULE && g.dessus.length > 0; if (id === 'pieces') return !SEULE && g.els.some(function (a) { return a.e.mode === 'inc'; });
  if (id === 'prenom') return !SEULE && !!g.P; if (id === 'grav') return !SEULE && (i3Gv().length > 0 || g.gravD.length > 0);
  if (id === 'cale') return !!(g.bt && g.bt.cale.length); if (id === 'bfond' || id === 'parois') return !!g.bt; if (id === 'cour') return !!(g.bt && g.bt.cour.length); return true; }); }
function i3Choix() { var o = i3().on, d = {}, n = 0; i3Dispo().forEach(function (c) { if (o[c[0]]) { d[c[0]] = true; n++; } }); d.n = n; return d; }
function i3Nom(c) { return SEULE && c[0] === 'fond' ? 'Couvercle (pièce pleine)' : c[1]; }
/* une pièce découpée (son nom dans les planches) est-elle imprimée en 3D ? */
function i3Hors(id) { var o = i3(); if (!o.retire) return false; var c = i3Choix();
  return (c.fond && (id === 'fond' || id === 'boite-couvercle')) || (c.dessus && id === 'dessus') || (c.pieces && id.indexOf('piece-') === 0) || (c.prenom && (id === 'plaque' || id === 'prenom'))
    || (c.cale && id === 'boite-cale') || (c.bfond && id === 'boite-fond') || (c.parois && id.indexOf('boite-bande-') === 0) || (c.cour && id === 'boite-couronne'); }
function i3Hex(c) { var m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(c); if (!m) return c; return '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join(''); }
/* les objets à imprimer : [{ nom, fichier, morceaux: [{ nom, couleur, T }], t: taille }], et les remarques */
function i3Objets() { var I = window.NivImpr3D, g = G, c = i3Choix(), m = i3().coul, ep = +S.ep || 3, objets = [], notes = [];
  function mmq(q) { return [q.X / E, q.Y / E]; }
  function pose(liste, a, z0, z1) { if (!a || !a.length || z1 - z0 < 0.05) return; exPolys(a).forEach(function (e) { var T = I.solide({ outer: e.outer.map(mmq), holes: e.holes.map(function (h) { return h.map(mmq); }) }, z0, z1); for (var i = 0; i < T.length; i++) liste.push(T[i]); }); }
  function fin(a) { if (!a.length) return false; var s0 = aire(a), s1 = aire(decaler(decaler(a, -0.4), 0.4)); return s0 > 0 && s1 < s0 * 0.85; }   // des traits de moins de 0,8 mm ?
  function objet(nom, fichier, morceaux) { morceaux = morceaux.filter(function (q) { return q.T.length; }); if (!morceaux.length) return; var tout = []; morceaux.forEach(function (q) { tout = tout.concat(q.T); });
    var t = I.taille(tout); morceaux.forEach(function (q) { q.T = I.bouger(q.T, -t.x, -t.y, -t.z); }); objets.push({ nom: nom, fichier: fichier, morceaux: morceaux, t: t }); }
  var blanc = [], coul = [], det = [], zb = c.fond ? ep : 0, creux = Math.min(1, ep / 3), hg = 0.4, inc = [], plaqueInc = g.P && S.el.plaque.mode === 'inc';
  if (!SEULE) g.els.forEach(function (a) { if (a.e.mode === 'inc') inc = inc.concat(a.B); });
  if (c.fond) pose(blanc, g.fond, 0, ep);
  if (c.dessus) pose(coul, g.dessus, zb, zb + ep);
  if (c.pieces && inc.length) { if (m === 'multi') pose(blanc, unir(inc), zb, zb + ep); else if (m === 'relief') pose(blanc, unir(inc), zb, zb + ep - creux);
    else notes.push('Avec le changement de bobine, les pièces blanches ne sont pas imprimées : leurs emplacements restent ouverts et laissent voir le fond blanc.'); }
  if (c.prenom && g.P) { if (!plaqueInc) pose(coul, g.P.nomA, zb + ep, zb + ep * 1.6);
    else if (m === 'multi') { pose(blanc, g.P.plaqueA, zb, zb + ep); pose(coul, g.P.nomA, zb + ep, zb + ep * 1.6); }
    else if (m === 'relief') { pose(blanc, g.P.plaqueA, zb, zb + ep - creux); pose(coul, g.P.nomA, zb + ep - creux, zb + ep * 1.6); }
    else pose(coul, g.P.nomA, zb, zb + ep); }
  if (c.grav && !SEULE) { var gv = i3Gv(); if (gv.length && c.pieces) { if (m === 'multi') pose(det, unir(gv), zb + ep, zb + ep + hg); else if (m === 'relief') pose(det, unir(gv), zb + ep - creux, zb + ep - creux + 0.6); }
    if (g.gravD.length && c.dessus) pose(det, g.gravD, zb + ep, zb + ep + hg);
    if (fin(gv.concat(g.gravD))) notes.push('Des détails gravés font moins de 0,8 mm de large : avec une buse de 0,4 mm, ils risquent de ne pas sortir. Une buse de 0,2 mm, ou les détails décochés, règle le problème.'); }
  if (c.dessus && fin(g.dessus)) notes.push('Le dessus de couleur a des parties de moins de 0,8 mm de large : elles risquent de ne pas sortir avec une buse de 0,4 mm.');
  var bl = '#F6F3EC', cl = i3Hex(couleur()), fo = i3Hex(fonce(couleur(), 0.55)), bo = '#D9BB8C', nomCv = SEULE ? 'Couvercle' : 'Couvercle décoré';
  if (m === 'multi') objet(nomCv, 'couvercle', [{ nom: SEULE ? 'Couvercle' : 'Blanc', couleur: SEULE ? bo : bl, T: blanc }, { nom: 'Couleur', couleur: cl, T: coul }, { nom: 'Détails', couleur: fo, T: det }]);
  else objet(nomCv, 'couvercle', [{ nom: m === 'pause' ? 'Blanc puis couleur' : 'Une couleur', couleur: m === 'pause' ? bl : cl, T: blanc.concat(coul, det) }]);
  if (m === 'pause' && (c.dessus || c.prenom)) notes.push(c.fond ? 'Changement de bobine : imprimez en blanc, puis demandez à l\'imprimante une pause à ' + fr(ep) + ' mm de haut et mettez la couleur.' : 'Le changement de bobine demande le fond blanc : cochez-le.');
  if (g.bt) { var bt = g.bt, T = bt.T, Hm = bt.Hm, bx = [], ca = [];
    if (c.parois) pose(bx, moins(bt.O, bt.I), 0, Hm);
    if (c.bfond) pose(bx, c.parois ? bt.O : bt.base, 0, T);
    if (c.cour) { pose(bx, bt.cour, c.parois ? Hm - T : (c.bfond ? T : 0), c.parois ? Hm : (c.bfond ? 2 * T : T)); if (c.parois) notes.push('La couronne du haut dépasse vers l\'intérieur : l\'imprimante devra mettre des supports dessous. Elle n\'est pas nécessaire quand le contour est imprimé.'); }
    objet('Boîte', 'boite', [{ nom: 'Boîte', couleur: bo, T: bx }]);
    if (c.cale) { pose(ca, c.parois && !c.cour ? decaler(bt.I, -0.3) : bt.cale, 0, T); objet('Cale du couvercle', 'cale', [{ nom: 'Cale', couleur: SEULE ? bo : bl, T: ca }]);
      notes.push('La cale s\'imprime à part et se colle sous le couvercle : c\'est elle qui tient le couvercle en place.' + (c.parois && !c.cour ? ' Elle est ajustée à l\'intérieur du contour imprimé (0,3 mm de jeu).' : '')); } }
  var x = 0; objets.forEach(function (o) { o.x = x; x += o.t.w + 8; });
  return { objets: objets, notes: notes }; }
/* la petite image de chaque pièce, à côté de sa case : la pièce en clair, le reste de l'objet en ombre (13/11/2026, « une petite photo
   pour pas que je me trompe »). Dessinée avec les mêmes tracés que les fichiers : elle suit la lettre, la couleur et la boîte. */
function i3Img(id) { var g = G, bt = g.bt, c = couleur(), tout = bt ? g.fond.concat(bt.O) : g.fond, b = boite(tout), m = Math.max(b.w, b.h) * 0.06, k = Math.max(b.w, b.h) / 70,
    bois = '#dcbf91', boisT = '#9c7c4c', blanc = '#fbfaf6', gris = '#8f887a', h = '';
  function p(a, fill, stroke, sw, op) { return a && a.length ? '<path d="' + dPath(a) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1) * k + '"' : '') + (op ? ' opacity="' + op + '"' : '') + '/>' : ''; }
  function ombre(a) { return p(a, 'currentColor', '', 0, 0.13); }
  if (id === 'fond') h = (bt ? ombre(bt.O) : '') + p(g.fond, SEULE ? bois : blanc, SEULE ? boisT : gris, 1);
  else if (id === 'dessus') h = ombre(g.fond) + p(g.dessus, c, fonce(c, 0.7), 0.6);
  else if (id === 'pieces') { var inc = []; g.els.forEach(function (a) { if (a.e.mode === 'inc') inc = inc.concat(a.B); }); h = ombre(g.fond) + p(g.dessus, c, '', 0, 0.22) + p(unir(inc), blanc, '#4a443c', 0.8); }
  else if (id === 'prenom') h = ombre(g.fond) + p(g.dessus, c, '', 0, 0.22) + (g.P && S.el.plaque.mode === 'inc' ? p(g.P.plaqueA, blanc, gris, 0.9) : '') + (g.P ? p(g.P.nomA, c, fonce(c, 0.6), 0.7) : '');
  else if (id === 'grav') { var inc2 = []; g.els.forEach(function (a) { if (a.e.mode === 'inc') inc2 = inc2.concat(a.B); }); h = ombre(g.fond) + p(g.dessus, c, '', 0, 0.22) + p(inc2, blanc, '', 0, 0.9) + p(i3Gv(), '#2f2a24', '#2f2a24', 0.35) + p(g.gravD, fonce(c, 0.5), fonce(c, 0.5), 0.35); }
  else if (id === 'cale' && bt) h = ombre(bt.O) + p(bt.cale, SEULE ? bois : blanc, SEULE ? boisT : gris, 1);
  else if (id === 'bfond' && bt) h = p(bt.base, bois, boisT, 1);
  else if (id === 'parois' && bt) h = ombre(bt.O) + p(moins(bt.O, bt.I), bois, boisT, 0.9);
  else if (id === 'cour' && bt) h = ombre(bt.O) + p(bt.cour, bois, boisT, 0.9);
  return '<span class="li-i3v" aria-hidden="true"><svg viewBox="' + (b.x - m).toFixed(1) + ' ' + (b.y - m).toFixed(1) + ' ' + (b.w + 2 * m).toFixed(1) + ' ' + (b.h + 2 * m).toFixed(1) + '">' + h + '</svg></span>'; }
function i3Maj() { var el = $('i3-liste'); if (!el) return; var volet = $('i3'), ouvert = !volet || volet.open; var o = i3(), c = i3Choix(), d = i3Dispo(), I = window.NivImpr3D, h = '', grp = { cv: SEULE ? 'Le couvercle' : 'Le couvercle (la lettre décorée)', cale: '', bt: 'La boîte' }, vu = {};
  d.forEach(function (q) { if (grp[q[2]] && !vu[q[2]]) { vu[q[2]] = 1; h += '<p class="li-i3t">' + grp[q[2]] + '</p>'; }
    h += '<label class="li-case"><input type="checkbox" data-i3="' + q[0] + '"' + (c[q[0]] ? ' checked' : '') + '>' + (ouvert ? i3Img(q[0]) : '') + '<span>' + i3Nom(q) + '</span></label>'; });
  el.innerHTML = h; $('i3-coul').value = o.coul; $('i3-fmt').value = o.fmt; $('i3-retire').checked = o.retire; $('i3-bt').hidden = !G.bt; $('l-i3coul').hidden = SEULE;
  var info = $('i3-info'), go = $('i3-go'); go.disabled = !c.n || !I;
  if (!I) { info.textContent = 'La fabrication des fichiers 3D n\'est pas chargée dans cette page.'; return; }
  if (!c.n) { info.textContent = 'Cochez les pièces à imprimer : celles d\'un même ensemble sont réunies en une seule pièce.'; go.textContent = 'Créer le fichier 3D'; return; }
  var r; try { r = i3Objets(); } catch (e) { info.textContent = 'Le fichier 3D ne peut pas être préparé : ' + e.message; go.disabled = true; return; }
  var nf = o.fmt === 'stl' ? r.objets.reduce(function (s, q) { return s + q.morceaux.length; }, 0) : 1;
  go.textContent = o.fmt === 'stl' ? (nf > 1 ? 'Créer les ' + nf + ' fichiers STL' : 'Créer le fichier STL') : 'Créer le fichier 3D (.3mf)';
  info.innerHTML = '<b>Ce qui sera dans le fichier.</b> ' + r.objets.map(function (q) { return ech(q.nom) + ' : ' + fr(q.t.w) + ' × ' + fr(q.t.h) + ' mm, ' + fr(q.t.e) + ' mm de haut' + (q.morceaux.length > 1 ? ', en ' + q.morceaux.length + ' couleurs (' + q.morceaux.map(function (z) { return z.nom.toLowerCase(); }).join(', ') + ')' : ''); }).join(' · ') + '.'
    + ' Le plateau de l\'imprimante doit faire au moins ' + fr(Math.max.apply(null, r.objets.map(function (q) { return q.t.w; })), 0) + ' × ' + fr(Math.max.apply(null, r.objets.map(function (q) { return q.t.h; })), 0) + ' mm.'
    + (r.notes.length ? '<br>' + r.notes.map(ech).join('<br>') : ''); }
function i3Creer() { var I = window.NivImpr3D, o = i3(); if (!I) return; var r = i3Objets(); if (!r.objets.length) return;
  if (o.fmt === 'stl') { var rang = 0; r.objets.forEach(function (q) { q.morceaux.forEach(function (z, j) { setTimeout(function () { sauver(prefixe() + '-3d-' + q.fichier + (q.morceaux.length > 1 ? '-' + (j + 1) + '-' + z.nom.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '') : '') + '.stl', I.stl(z.T, q.nom), 'model/stl'); }, rang++ * 700); }); }); }
  else sauver(prefixe() + '-impression-3d.3mf', I.mf3(r.objets, (SEULE ? 'Boîte ' : 'Lettre ') + nomForme()), 'model/3mf'); }
window.NivLettre3D = { objets: function () { return i3Objets(); }, choix: i3Choix, hors: i3Hors };

/* ---------- tout rafraîchir ---------- */
function maj(sansChamps) { try { calculer(); } catch (e) { $('aide').textContent = 'Erreur de calcul : ' + e.message; throw e; }
  dessiner(); listePieces(); fichiers(); i3Maj(); if (S.vue === '3d') trois(); if (!sansChamps) champs(); garder(); }
function champs() { ['bw', 'nom', 'lettre', 'H', 'gras', 'bord', 'date', 'heure', 'taille', 'poids', 'libre', 'zw', 'zh', 'trait', 'jeu', 'ep', 'nbEt'].forEach(function (k) { var el = $('f-' + k); if (el && document.activeElement !== el) el.value = S[k]; });
  ['pol', 'polNom', 'signe', 'animal', 'signeStyle', 'horloge', 'decor'].forEach(function (k) { $('f-' + k).value = S[k]; });
  $('f-lettre').placeholder = lettreChoisie(); var sg = signeChoisi(); $('signeAuto').textContent = S.signe === 'auto' ? (sg >= 0 ? 'Calculé avec la date : ' + SIGNES[sg] + '.' : 'Se calcule avec la date.') : '';
  $('coul').innerHTML = COULEURS.map(function (c) { return '<button type="button" data-c="' + c[0] + '" class="' + (S.coul === c[0] ? 'on' : '') + '" aria-pressed="' + (S.coul === c[0]) + '"><i style="background:' + c[2] + '"></i>' + c[1] + '</button>'; }).join('');
  ['prof', 'rayon', 'cour', 'jeuC', 'pas', 'pad'].forEach(function (k) { var el = $('b-' + k); if (el && document.activeElement !== el) el.value = S.bt[k]; }); $('b-on').checked = !!S.bt.on; $('b-dos').checked = !!S.bt.dos; $('b-rep').checked = !!S.bt.rep; if ($('b-poig')) $('b-poig').checked = S.bt.poig !== false; $('b-plaque').checked = !!S.bt.plaque; $('b-nb').value = String(S.bt.nb); $('b-regl').hidden = !S.bt.on;
  $('b-info').textContent = G && G.bt ? 'Automatique : ' + G.bt.nAuto + ' morceau' + (G.bt.nAuto > 1 ? 'x' : '') + ' pour une zone de ' + S.zw + ' mm de large.' : '';
  $('f-bforme').value = S.bforme; var fs = formeSimple(); $('l-bw').hidden = !SEULE || S.bforme === 'rond' || S.bforme === 'coeur' || !fs;
  ['l-lettre', 'l-pol', 'l-gras', 'l-bord'].forEach(function (i) { $(i).hidden = SEULE && fs; });
  $('t-H').textContent = !SEULE ? 'Hauteur de la lettre (mm)' : (S.bforme === 'rond' ? 'Diamètre (mm)' : (fs ? 'Hauteur (mm)' : 'Hauteur de la lettre ou du chiffre (mm)')); $('t-bord').textContent = SEULE ? 'Marge autour de la lettre (mm)' : 'Bord blanc autour (mm)';
  $('bNum').classList.toggle('on', !!S.num); $('exemple').hidden = !S.exemple || SEULE; }
/* passer de la lettre décorée à la boîte seule (chacune garde ses réglages) */
function mode(b) { SEULE = b; var r = document.querySelector('.li'); r.classList.toggle('seule', b); CACHE = {}; BTC = { cle: '', bt: null, al: [] };
  document.title = b ? 'Boîte seule' : 'Lettre à incruster'; $('titre').textContent = b ? 'Boîte seule' : 'Lettre à incruster';
  $('sous').textContent = b ? 'Outil de l\'atelier : une boîte en forme de lettre, de chiffre ou de forme simple, avec son couvercle. Fond à encoches, bande de côté qui plie, couronne, cale : prêts pour la machine. Démonstration : rien n\'est en ligne.' : SOUS;
  $('mLettre').className = b ? '' : 'on'; $('mBoite').className = b ? 'on' : ''; $('b-note').textContent = 'La bande de côté a des fentes là où le contour tourne : c\'est ce qui la laisse plier. Elle s\'emboîte par des tenons dans le fond et dans la couronne du haut. L\'épaisseur du bois se règle à l\'étape ' + (b ? 3 : 5) + '.';
  var n = 0; [].forEach.call(document.querySelectorAll('.li-regl > details'), function (d) { if (b && d.classList.contains('pasb')) return; n++; d.querySelector('summary i').textContent = n; });
  $('s-1').lastChild.textContent = b ? 'La forme' : 'La lettre'; }
function changerMode(b) { if (b === SEULE) return; garder(); SEULE = b; S = neuf(); if (!relire() && !b) { Object.keys(EXEMPLE).forEach(function (k) { S[k] = EXEMPLE[k]; }); S.exemple = true; } S.vue = 'face'; mode(b); vue('face'); maj(); }
var SOUS = '';
function init() { SOUS = $('sous').textContent; $('f-bforme').innerHTML = FORMES.map(function (f) { return '<option value="' + f[0] + '">' + f[1] + '</option>'; }).join('');
  if (window.parent !== window) $('modes').hidden = true;
  $('f-pol').innerHTML = D.pol.filter(function (p) { return p.role === 'lettre'; }).map(function (p) { return '<option value="' + p.id + '">' + p.nom + '</option>'; }).join('');
  $('f-polNom').innerHTML = D.pol.filter(function (p) { return p.role === 'nom'; }).map(function (p) { return '<option value="' + p.id + '">' + p.nom + '</option>'; }).join('');
  $('f-animal').innerHTML = ANIMAUX.map(function (a) { return '<option value="' + a[0] + '">' + a[1] + '</option>'; }).join('') + '<option value="aucun">Aucun animal</option>';
  $('f-signe').innerHTML = '<option value="auto">Automatique (d\'après la date)</option>' + SIGNES.map(function (n, i) { return '<option value="' + i + '">' + n + '</option>'; }).join('') + '<option value="aucun">Aucun signe</option>';
  if (!relire() && !SEULE) { Object.keys(EXEMPLE).forEach(function (k) { S[k] = EXEMPLE[k]; }); S.exemple = true; }
  mode(SEULE);
  /* les champs */
  document.addEventListener('input', function (ev) { var t = ev.target, k = t.id && t.id.indexOf('f-') === 0 ? t.id.slice(2) : null;
    if (t.id && t.id.indexOf('b-') === 0 && t.type !== 'checkbox' && t.tagName !== 'SELECT') { var kb = t.id.slice(2), vb = parseFloat(String(t.value).replace(',', '.')), lb = { prof: [15, 400], rayon: [3, 40], cour: [3, 20], jeuC: [0, 1], pas: [1, 6], pad: [0, 40] }[kb]; if (!lb || isNaN(vb) || vb < lb[0] || vb > lb[1]) return; S.bt[kb] = vb; maj(true); champs(); return; }
    if (!k) return;
    var num = ['bw', 'H', 'gras', 'bord', 'zw', 'zh', 'trait', 'jeu', 'ep', 'nbEt'].indexOf(k) >= 0, v = num ? parseFloat(String(t.value).replace(',', '.')) : t.value;
    if (num) { if (isNaN(v)) return; var lim = { bw: [30, 1200], H: [40, 1200], gras: [0, 12], bord: [0, 15], zw: [50, 3000], zh: [50, 3000], trait: [0, 0.6], jeu: [0, 0.6], ep: [1, 20], nbEt: [0, 6] }[k]; if (v < lim[0] || v > lim[1]) return; }
    S[k] = v; if (k === 'lettre') S.lettre = String(v).slice(0, 1);
    maj(true); champs(); });
  document.addEventListener('change', function (ev) { var t = ev.target, id = t.getAttribute && t.getAttribute('data-mode');
    if (t.id === 'f-bforme') { S.bforme = t.value; maj(); return; }
    if (t.getAttribute && t.getAttribute('data-i3')) { i3().on[t.getAttribute('data-i3')] = t.checked; maj(); return; }
    if (t.id === 'i3-coul') { i3().coul = t.value; maj(); return; } if (t.id === 'i3-fmt') { i3().fmt = t.value; maj(); return; } if (t.id === 'i3-retire') { i3().retire = t.checked; maj(); return; }
    if (t.id === 'b-on' || t.id === 'b-dos' || t.id === 'b-rep' || t.id === 'b-plaque' || t.id === 'b-poig') { S.bt[t.id.slice(2)] = t.checked; maj(); return; } if (t.id === 'b-nb') { S.bt.nb = +t.value || 0; maj(); return; }
    if (!id) return; var e = S.el[id];
    if (t.value === 'non') e.on = false; else { e.on = true; e.mode = t.value; } maj(); });
  document.addEventListener('click', function (ev) { var t = ev.target.closest ? ev.target.closest('button') : null; if (!t) return; var e = S.sel ? S.el[S.sel] : null, a;
    if ((a = t.getAttribute('data-sel'))) { S.sel = S.sel === a ? null : a; dessiner(); listePieces(); }
    else if (t.getAttribute('data-k') && e) { e.k = Math.max(0.4, Math.min(2.5, e.k * (t.getAttribute('data-k') === '1' ? 1.06 : 1 / 1.06))); e.auto = false; maj(); }
    else if (t.getAttribute('data-d') && e) { var d = t.getAttribute('data-d').split(','); e.fx += +d[0] / S.H; e.fy += +d[1] / S.H; e.auto = false; maj(); }
    else if ((a = t.getAttribute('data-auto'))) { S.el[a].auto = true; S.el[a].k = 1; maj(); }
    else if ((a = t.getAttribute('data-force'))) { S.el[a].auto = false; S.el[a].k = 0.6; S.el[a].fx = G.W / 2 / G.H; S.el[a].fy = 0.3; S.sel = a; maj(); }
    else if ((a = t.getAttribute('data-c'))) { S.coul = a; maj(); }
    else if (t.getAttribute('data-svg')) { var p = G.pages[+t.getAttribute('data-svg')]; sauver(prefixe() + '-' + p.nom.replace(/^boite-/, SEULE ? 'planche-' : 'boite-') + '.svg', svgPlanche(p, false), 'image/svg+xml'); }
    else if (t.getAttribute('data-plan')) sauver(prefixe() + '-plan-de-pose.svg', planSvg(), 'image/svg+xml');
    else if (t.getAttribute('data-essai')) sauver('essai-de-pliage.svg', essaiCharniere(), 'image/svg+xml');
    else if (t.getAttribute('data-liste')) sauver(prefixe() + '-liste-des-pieces.txt', listeTexte(), 'text/plain');
    else if (t.id === 'vFace') vue('face'); else if (t.id === 'v3d') vue('3d'); else if (t.id === 'mLettre') changerMode(false); else if (t.id === 'mBoite') changerMode(true);
    else if (t.id === 'i3-cv') { ['fond', 'dessus', 'pieces', 'prenom', 'grav'].forEach(function (k) { i3().on[k] = true; }); maj(); }
    else if (t.id === 'i3-bt') { ['bfond', 'parois', 'cale'].forEach(function (k) { i3().on[k] = true; }); i3().on.cour = false; maj(); }
    else if (t.id === 'i3-0') { i3().on = {}; maj(); }
    else if (t.id === 'i3-go') i3Creer();
    else if (t.id === 'bNum') { S.num = !S.num; dessiner(); champs(); }
    else if (t.id === 'bAuto') { Object.keys(S.el).forEach(function (id) { S.el[id].auto = true; S.el[id].k = 1; }); maj(); }
    else if (t.id === 'bVider') { var z = neuf(); z.zw = S.zw; z.zh = S.zh; z.trait = S.trait; z.jeu = S.jeu; z.ep = S.ep; z.bt = S.bt; S = z; maj(); } });
  if ($('i3')) $('i3').addEventListener('toggle', function () { i3Maj(); });   // les petites images ne se dessinent que volet ouvert
  /* glisser une pièce sur l'aperçu */
  var sv = $('svg'), prise = null;
  function mm(ev) { var p = sv.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(sv.getScreenCTM().inverse()); }
  sv.addEventListener('pointerdown', function (ev) { var gel = ev.target.closest('.li-el'); if (!gel) { if (S.sel) { S.sel = null; dessiner(); listePieces(); } return; }
    var id = gel.getAttribute('data-el'), q = mm(ev); prise = { id: id, x: q.x, y: q.y, g: gel, bouge: false }; sv.setPointerCapture(ev.pointerId); ev.preventDefault(); });
  sv.addEventListener('pointermove', function (ev) { if (!prise) return; var q = mm(ev), dx = q.x - prise.x, dy = q.y - prise.y; if (!prise.bouge && Math.abs(dx) + Math.abs(dy) < 1.2 * G.u) return; prise.bouge = true;
    prise.g.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')'); prise.dx = dx; prise.dy = dy; });
  function lacher() { if (!prise) return; var p = prise; prise = null; if (p.bouge) { var e = S.el[p.id]; e.fx += p.dx / S.H; e.fy += p.dy / S.H; e.auto = false; S.sel = p.id; maj(); } else { S.sel = p.id; dessiner(); listePieces(); } }
  sv.addEventListener('pointerup', lacher); sv.addEventListener('pointercancel', lacher);
  window.addEventListener('resize', function () { if (S.vue === '3d') trois(); });
  /* ouvert dans « L'atelier » (un seul logiciel) : la machine se règle une fois, là-bas */
  window.addEventListener('message', function (ev) { var d = ev.data || {}; if (d.type !== 'niv-machine' || !d.machine) return; var ch = false;
    ['zw', 'zh', 'trait', 'jeu', 'ep'].forEach(function (k) { var v = +d.machine[k]; if (!isNaN(v) && v >= 0 && S[k] !== v) { S[k] = v; ch = true; } }); if (ch) maj(); });
  if (window.parent !== window) window.parent.postMessage({ type: 'niv-pret' }, '*');
  champs(); maj(); vue('face'); }
window.NivLettre = { seule: function () { return SEULE; }, mode: changerMode, etat: function () { return S; }, calcul: function () { return G; }, maj: maj, svg: function (i) { return svgPlanche(G.pages[i], false); }, liste: listeTexte };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
