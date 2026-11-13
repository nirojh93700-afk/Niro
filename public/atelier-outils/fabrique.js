/* Fabrication des fichiers laser DANS LE NAVIGATEUR (Gestion › Tests › Retoucher et fabriquer) — 12/11/2026.
   Gérant : « c'est à moi de corriger… changer le nom, la position où je vais graver, je veux avoir accès pour tout corriger ».
   Même chaîne que tools/maquettes/fichiers-laser-test.cjs, sans Playwright ni potrace :
     · chaque outil (support, arbre, décoration) dessine son « fichier de l'atelier » (#fichier) ; on en tire une liste d'OBJETS ;
     · {type:'vect'}  contour exact de l'outil, gardé tel quel (découpe, rouge) ;
     · {type:'cut'}   silhouette noire → rendue en image puis suivie au contour → UN tracé rouge (découpe) ;
     · {type:'grav'}  dessin ou texte noir → UN tracé noir plein (gravure) ;
     · {type:'image'} photo → image en niveaux de gris posée en mm ;
     · taille réelle en mm, rouge #FF0000 = découpe, noir = gravure, un objet = un bloc déplaçable dans xTool Creative Space.
   Les textes deviennent des tracés (xTool ne lit pas les textes d'un SVG) : les polices sont embarquées dans le rendu. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  var MAXPX = 3800;   // côté maximal d'un rendu : un canvas d'iPhone ne dépasse pas 16,7 millions de points
  var RES = 25;       // points par mm (0,04 mm), réduit seulement si la pièce est plus grande que MAXPX / RES
  var RES_PHOTO = 12; // points par mm d'une photo gravée (≈ 300 dpi)

  function slug(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'x'; }
  function attendre(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* ---------- les polices : celles de la page (Google Fonts), embarquées dans chaque rendu ---------- */
  var blocs = null, donnees = {};
  function b64(buf) { var b = new Uint8Array(buf), s = '', i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  async function lireBlocs() {
    if (blocs) return blocs; var L = [];
    /* hors du site (page de démonstration, où la lecture de Google Fonts est interdite) : les écritures sont fournies avec la page */
    if (Array.isArray(window.NivPolices)) {
      window.NivPolices.forEach(function (f) { L.push({ fam: String(f.nom).toLowerCase(), nom: f.nom, css: f.css, url: f.url }); donnees[f.url] = f.data; });
      blocs = L; return L;
    }
    var liens = [].slice.call(document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]'));
    for (var i = 0; i < liens.length; i++) {
      try {
        var css = await (await fetch(liens[i].href)).text(), re = /@font-face\s*\{[^}]*\}/g, m;
        while ((m = re.exec(css))) {
          var b = m[0], fam = (b.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1], url = (b.match(/url\((https:[^)]+)\)/) || [])[1], ur = (b.match(/unicode-range:\s*([^;]+)/) || [])[1];
          if (!fam || !url) continue;
          if (ur && ur.indexOf('U+0000-00FF') < 0 && ur.indexOf('U+0100') < 0) continue;   // seulement latin et latin étendu
          L.push({ fam: fam.trim().toLowerCase(), nom: fam.trim(), css: b, url: url });
        }
      } catch (e) { /* sans la feuille, le texte sort dans la police de secours : signalé par « polices » dans le résultat */ }
    }
    blocs = L; return L;
  }
  async function cssPolices(markup) {
    var bl = await lireBlocs(), bas = markup.toLowerCase(), out = '';
    for (var i = 0; i < bl.length; i++) {
      var b = bl[i]; if (bas.indexOf(b.fam) < 0) continue;
      if (donnees[b.url] === undefined) { try { donnees[b.url] = 'data:font/woff2;base64,' + b64(await (await fetch(b.url)).arrayBuffer()); } catch (e) { donnees[b.url] = ''; } }
      if (donnees[b.url]) out += b.css.replace(b.url, donnees[b.url]);
    }
    return out;
  }

  /* ---------- rendu d'un morceau du fichier : SVG → image → canvas ---------- */
  function propre(m) { return String(m).replace(/&nbsp;/g, '&#160;'); }
  function charger(src) { return new Promise(function (ok, ko) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ko(new Error('Le rendu du fichier a échoué.')); }; im.src = src; }); }
  async function rendre(markup, vb, R) {
    var W = Math.max(2, Math.ceil(vb.w * R)), H = Math.max(2, Math.ceil(vb.h * R)), css = await cssPolices(markup);
    var src = '<svg xmlns="' + NS + '" xmlns:xlink="' + XL + '" width="' + W + '" height="' + H + '" viewBox="' + vb.x + ' ' + vb.y + ' ' + (W / R) + ' ' + (H / R) + '">'
      + (css ? '<style><![CDATA[' + css + ']]></style>' : '')
      + '<rect x="' + vb.x + '" y="' + vb.y + '" width="' + (W / R) + '" height="' + (H / R) + '" fill="#fff"/>' + propre(markup) + '</svg>';
    var im = await charger('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src));
    if (im.decode) { try { await im.decode(); } catch (e) { /* déjà chargée */ } }
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d', { willReadFrequently: true });
    function peindre() { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H); }
    peindre();
    /* Safari : les polices et les images d'un SVG ne sont parfois prêtes qu'au deuxième dessin */
    if (css || /<image/i.test(markup)) { await attendre(150); peindre(); await attendre(60); peindre(); }
    return { c: c, x: x, W: W, H: H };
  }
  /* niveaux de gris, avec un point blanc tout autour (lu par bandes : la mémoire d'un téléphone est comptée) */
  function gris(r) {
    var W = r.W, H = r.H, Wn = W + 2, G = new Uint8Array(Wn * (H + 2)).fill(255), pas = 256;
    for (var y = 0; y < H; y += pas) {
      var h = Math.min(pas, H - y), d = r.x.getImageData(0, y, W, h).data;
      for (var j = 0; j < h; j++) { var o = (y + j + 1) * Wn + 1, k = j * W * 4; for (var i = 0; i < W; i++, k += 4) G[o + i] = (d[k] * 77 + d[k + 1] * 150 + d[k + 2] * 29) >> 8; }
    }
    return G;
  }

  /* ---------- contrôle des écritures : le rendu « image » doit donner la même largeur d'encre que la page ----------
     (sur iPhone, une police embarquée n'est parfois prête qu'au 2e ou 3e essai ; si elle ne vient pas, on le DIT au lieu de
     livrer un nom gravé dans une autre écriture) */
  function encre(x, W, H) {   // largeur, hauteur et surface de ce qui est dessiné en noir
    var d = x.getImageData(0, 0, W, H).data, x0 = W, x1 = -1, y0 = H, y1 = -1, n = 0, i, j, k;
    for (j = 0, k = 0; j < H; j++) for (i = 0; i < W; i++, k += 4) if (d[k] < 128) { n++; if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    return n ? { w: x1 - x0 + 1, h: y1 - y0 + 1, n: n } : { w: 0, h: 0, n: 0 };
  }
  function pareil(a, b) { return a.n > 0 && Math.abs(a.w - b.w) / a.w < 0.02 && Math.abs(a.h - b.h) / a.h < 0.06 && Math.abs(a.n - b.n) / a.n < 0.06; }
  var sondes = {};
  async function sonder(nom) {
    if (sondes[nom] !== undefined) return sondes[nom];
    var txt = 'Hamburgefonstiv \u00c9\u00e8\u00e7 Camille', W = 1000, H = 160;
    try { if (document.fonts && document.fonts.load) await document.fonts.load('60px "' + nom + '"', txt); } catch (e) { /* on mesure quand même */ }
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#000'; x.font = '60px "' + nom + '"'; x.textBaseline = 'middle'; x.fillText(txt, 12, 80);
    var a = encre(x, W, H), m = '<text x="12" y="80" dominant-baseline="central" font-family="\'' + nom + '\'" font-size="60" fill="#000">' + txt + '</text>', ok = false;
    for (var essai = 0; essai < 4 && !ok; essai++) {
      var r = await rendre(m, { x: 0, y: 0, w: W, h: H }, 1);
      ok = pareil(a, encre(r.x, W, H)); if (!ok) await attendre(400);
    }
    sondes[nom] = ok; return ok;
  }
  /* l'écriture est-elle vraiment demandée par un texte ? (« inter » ne doit pas être trouvé dans « interpolation ») */
  function utilise(bas, fam) { var i = -1; while ((i = bas.indexOf(fam, i + 1)) >= 0) { var av = bas.lastIndexOf('font-family', i); if (av >= 0 && i - av < 90 && bas.slice(av, i).indexOf('>') < 0) return true; } return false; }
  async function policesKo(specs) {
    var bl = await lireBlocs(), tout = specs.map(function (f) { return f.objets.map(function (o) { return o.type === 'vect' ? '' : o.markup; }).join(' '); }).join(' ').toLowerCase(), vus = {}, ko = [];
    if (tout.indexOf('<text') < 0) return ko;
    for (var i = 0; i < bl.length; i++) { var b = bl[i]; if (vus[b.nom] || !utilise(tout, b.fam)) continue; vus[b.nom] = 1; if (!(await sonder(b.nom))) ko.push(b.nom); }
    /* une écriture demandée par la page mais dont la feuille n'a pas pu être lue (réseau coupé) : à signaler aussi */
    [].forEach.call(document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]'), function (l) {
      (l.href.match(/family=[^&]+/g) || []).forEach(function (f) { var nom = decodeURIComponent(f.slice(7).split(':')[0].replace(/\+/g, ' ')); if (!vus[nom] && utilise(tout, nom.toLowerCase())) { vus[nom] = 1; ko.push(nom); } });
    });
    return ko;
  }

  /* ---------- suivi de contour (carrés mobiles, bord placé au demi-ton entre deux points : précision sous le point) ---------- */
  function contours(G, W, H) {
    var Wn = W + 2, Hn = H + 2, suiv = new Map(), x, y, i, cas, T, B, L, D, moy;
    for (y = 0; y < Hn - 1; y++) {
      for (x = 0, i = y * Wn; x < Wn - 1; x++, i++) {
        cas = (G[i] < 128 ? 8 : 0) | (G[i + 1] < 128 ? 4 : 0) | (G[i + Wn + 1] < 128 ? 2 : 0) | (G[i + Wn] < 128 ? 1 : 0);
        if (cas === 0 || cas === 15) continue;
        T = 2 * i; B = 2 * (i + Wn); L = 2 * i + 1; D = 2 * (i + 1) + 1;
        switch (cas) {            // segment orienté : la matière (le noir) toujours à droite
          case 1: suiv.set(L, B); break; case 2: suiv.set(B, D); break; case 3: suiv.set(L, D); break; case 4: suiv.set(D, T); break;
          case 6: suiv.set(B, T); break; case 7: suiv.set(L, T); break; case 8: suiv.set(T, L); break; case 9: suiv.set(T, B); break;
          case 11: suiv.set(T, D); break; case 12: suiv.set(D, L); break; case 13: suiv.set(D, B); break; case 14: suiv.set(B, L); break;
          case 5: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(L, T); suiv.set(D, B); } else { suiv.set(D, T); suiv.set(L, B); } break;
          case 10: moy = (G[i] + G[i + 1] + G[i + Wn] + G[i + Wn + 1]) / 4; if (moy < 128) { suiv.set(T, D); suiv.set(B, L); } else { suiv.set(T, L); suiv.set(B, D); } break;
        }
      }
    }
    function pt(k) {
      var n = k >> 1, v0 = G[n], nx = n % Wn, ny = (n - nx) / Wn, v1, t;
      if (k & 1) { v1 = G[n + Wn]; t = (v0 - 127.5) / (v0 - v1); return [nx - 0.5, ny - 0.5 + t]; }
      v1 = G[n + 1]; t = (v0 - 127.5) / (v0 - v1); return [nx - 0.5 + t, ny - 0.5];
    }
    var boucles = [];
    suiv.forEach(function (_, k0) {
      if (!suiv.has(k0)) return;
      var pts = [], k = k0, garde = 0;
      do { pts.push(pt(k)); var nx = suiv.get(k); suiv.delete(k); k = nx; } while (k !== undefined && k !== k0 && ++garde < 8e6);
      if (pts.length >= 4) boucles.push(pts);
    });
    return boucles;
  }
  function aire(p) { var a = 0; for (var i = 0, n = p.length; i < n; i++) { var q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return Math.abs(a) / 2; }
  /* allège le tracé sans le déplacer de plus de « tol » point (0,3 point = 0,012 mm) */
  function alleger(pts, tol) {
    var n = pts.length; if (n < 8) return pts;
    var loin = 0, dm = -1, i, d;
    for (i = 1; i < n; i++) { d = (pts[i][0] - pts[0][0]) * (pts[i][0] - pts[0][0]) + (pts[i][1] - pts[0][1]) * (pts[i][1] - pts[0][1]); if (d > dm) { dm = d; loin = i; } }
    var garde = new Uint8Array(n); garde[0] = garde[loin] = 1;
    var pile = [0, loin, loin, n];
    while (pile.length) {
      var b = pile.pop(), a = pile.pop(), A = pts[a], Bp = pts[b % n], dx = Bp[0] - A[0], dy = Bp[1] - A[1], Lg = Math.sqrt(dx * dx + dy * dy), mx = -1, mi = -1;
      for (i = a + 1; i < b; i++) {
        d = Lg < 1e-6 ? Math.sqrt((pts[i][0] - A[0]) * (pts[i][0] - A[0]) + (pts[i][1] - A[1]) * (pts[i][1] - A[1])) : Math.abs((pts[i][0] - A[0]) * dy - (pts[i][1] - A[1]) * dx) / Lg;
        if (d > mx) { mx = d; mi = i; }
      }
      if (mx > tol) { garde[mi] = 1; pile.push(a, mi, mi, b); }
    }
    var o = []; for (i = 0; i < n; i++) if (garde[i]) o.push(pts[i]); return o;
  }
  function chemin(b, vb, R) { var s = ''; for (var i = 0; i < b.length; i++) s += (i ? 'L' : 'M') + r3(vb.x + b[i][0] / R) + ' ' + r3(vb.y + b[i][1] / R); return s + 'Z'; }
  async function tracer(markup, vb) {
    var R = Math.max(4, Math.min(RES, Math.floor(MAXPX / Math.max(vb.w, vb.h))));
    var r = await rendre(markup, vb, R), G = gris(r), W = r.W, H = r.H; r.c.width = r.c.height = 1;
    return contours(G, W, H).filter(function (b) { return aire(b) > 6; }).map(function (b) { return chemin(alleger(b, 0.3), vb, R); });
  }
  /* une photo à graver : niveaux de gris, recadrée sur ce qui est dessiné */
  async function photo(markup, vb) {
    var r = await rendre(markup, vb, RES_PHOTO), d = r.x.getImageData(0, 0, r.W, r.H), p = d.data, x0 = r.W, y0 = r.H, x1 = -1, y1 = -1, x, y, k, g;
    for (y = 0, k = 0; y < r.H; y++) for (x = 0; x < r.W; x++, k += 4) { g = (p[k] * 77 + p[k + 1] * 150 + p[k + 2] * 29) >> 8; p[k] = p[k + 1] = p[k + 2] = g; p[k + 3] = 255; if (g < 250) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 < 0) return null;
    r.x.putImageData(d, 0, 0);
    var c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1; c.getContext('2d').drawImage(r.c, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    return { x: r3(vb.x + x0 / RES_PHOTO), y: r3(vb.y + y0 / RES_PHOTO), w: r3(c.width / RES_PHOTO), h: r3(c.height / RES_PHOTO), uri: c.toDataURL('image/png') };
  }

  /* ---------- mesures dans la page (les polices y sont chargées) ---------- */
  function zone() { var z = document.getElementById('nivLzr'); if (!z) { z = document.createElement('div'); z.id = 'nivLzr'; z.setAttribute('aria-hidden', 'true'); z.style.cssText = 'position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden'; document.body.appendChild(z); } return z; }
  function boite(markup, w, h) {
    var z = zone(); z.innerHTML = '<svg xmlns="' + NS + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><g id="nivB">' + markup + '</g></svg>';
    var bb = z.querySelector('#nivB').getBBox(); z.innerHTML = ''; return bb;
  }

  /* ---------- un fichier : objets → SVG en mm, calé à 5 mm du bord ---------- */
  /* une pièce « soudée au cadre » le touche-t-elle vraiment ? (sinon elle resterait un morceau à part) */
  async function touchent(base, piece, f) {
    var vb = { x: -2, y: -2, w: f.w + 4, h: f.h + 4 }, a = await rendre(base, vb, 4), A = gris(a), c = await rendre(piece, vb, 4), C = gris(c), n = 0;
    for (var i = 0; i < A.length; i++) if (A[i] < 128 && C[i] < 128) n++;
    return n / 16;   // surface commune, en mm² (4 points par mm)
  }
  async function ecrire(f, dire) {
    var objs = [], avert = [];
    for (var n = 0; n < f.objets.length; n++) {
      var o = f.objets[n]; if (dire) dire(f, n);
      if (o.type === 'vect') { objs.push(o); continue; }
      var bb = boite(o.markup, f.w, f.h); if (!(bb.width > 0) || !(bb.height > 0)) continue;
      var m = 6, x0 = Math.max(-2, bb.x - m), y0 = Math.max(-2, bb.y - m), x1 = Math.min(f.w + 2, bb.x + bb.width + m), y1 = Math.min(f.h + 2, bb.y + bb.height + m);
      if (x1 <= x0 || y1 <= y0) continue;
      var vb = { x: r3(x0), y: r3(y0), w: x1 - x0, h: y1 - y0 };
      if (o.type === 'image') { var ph = await photo(o.markup, vb); if (ph) { ph.id = o.id; ph.type = 'image'; objs.push(ph); } continue; }
      if (o.soudes) for (var q = 0; q < o.soudes.length; q++) { var mm2 = await touchent(o.base, o.soudes[q].markup, f); if (mm2 < 0.4) avert.push(o.soudes[q].nom + ' est « soudé au cadre » mais ne le touche pas : il restera un morceau à part');
        else if (mm2 < 4) avert.push(o.soudes[q].nom + ' ne tient au cadre que par une attache très fine : faites-le mordre davantage sur le bois'); }
      var ds = await tracer(o.markup, vb); if (ds.length) objs.push({ id: o.id, type: o.type, d: ds.join(' ') });
      await attendre(0);
    }
    var z = zone();
    z.innerHTML = '<svg xmlns="' + NS + '" width="1000" height="1000"><g id="nivTout">' + objs.map(function (o) {
      return o.type === 'vect' ? '<g id="' + esc(o.id) + '" data-v="1">' + o.markup + '</g>'
        : o.type === 'image' ? '<image id="' + esc(o.id) + '" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" preserveAspectRatio="none" href="' + o.uri + '" xlink:href="' + o.uri + '"/>'
          : o.type === 'cut' ? '<path id="' + esc(o.id) + '" fill="none" stroke="#FF0000" stroke-width="0.1" d="' + o.d + '"/>'
            : '<path id="' + esc(o.id) + '" fill="#000000" fill-rule="evenodd" stroke="none" d="' + o.d + '"/>';
    }).join('') + '</g></svg>';
    [].forEach.call(z.querySelectorAll('g[data-v] path'), function (e) { e.setAttribute('fill', 'none'); e.setAttribute('stroke', '#FF0000'); e.setAttribute('stroke-width', '0.1'); e.setAttribute('vector-effect', 'non-scaling-stroke'); e.removeAttribute('fill-rule'); });
    [].forEach.call(z.querySelectorAll('g[data-v]'), function (e) { e.removeAttribute('data-v'); [].forEach.call(e.querySelectorAll('[data-mat],[data-piece],[data-nom]'), function (x) { x.removeAttribute('data-mat'); x.removeAttribute('data-piece'); x.removeAttribute('data-nom'); }); });
    var g = z.querySelector('#nivTout'), tb = g.getBBox(), W = r2(tb.width + 4), H = r2(tb.height + 4);
    g.setAttribute('transform', 'translate(' + r2(2 - tb.x) + ' ' + r2(2 - tb.y) + ')'); g.removeAttribute('id');
    var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="' + NS + '" xmlns:xlink="' + XL + '" width="' + W + 'mm" height="' + H + 'mm" viewBox="0 0 ' + W + ' ' + H + '">\n' + propre(g.outerHTML).replace(/></g, '>\n<') + '\n</svg>\n';
    z.innerHTML = '';
    return { nom: f.nom + '.svg', svg: svg, w: W, h: H, titre: f.titre, matiere: f.matiere,
      note: (f.note || '') + (avert.length ? ' ⚠ ' + avert.join('. ') + '.' : ''), gravure: objs.some(function (o) { return o.type === 'grav' || o.type === 'image'; }),
      objets: objs.map(function (o) { return { id: o.id, quoi: o.type === 'grav' ? 'gravure' : o.type === 'image' ? 'photo' : 'découpe' }; }) };
  }
  async function fabriquer(specs, progres) {
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* tant pis */ } }
    var total = specs.reduce(function (a, f) { return a + f.objets.length; }, 0), fait = 0, out = [];
    out.policesKo = await policesKo(specs);   // écritures que cet appareil n'a pas su rendre (liste vide = tout va bien)
    for (var i = 0; i < specs.length; i++) out.push(await ecrire(specs[i], function () { fait++; if (progres) progres(fait, total); }));
    return out;
  }

  /* ---------- ce que chaque outil met dans ses fichiers ---------- */
  function uniques(objets) { var vus = {}; objets.forEach(function (o) { var id = slug(o.id), n = vus[id] = (vus[id] || 0) + 1; o.id = n > 1 ? id + '-' + n : id; }); return objets; }
  function nbObjets(n) { return n + ' objet' + (n > 1 ? 's séparés, que vous pouvez déplacer un par un' : ''); }

  var specs = {
    /* support de téléphone : le dossier, le pied, et chaque élément gravé */
    support: function () {
      var F = document.getElementById('fichier'), vb = F.getAttribute('viewBox').split(' ').map(Number), S = window.scAtelier.S;
      var gs = [].filter.call(F.children, function (g) { return g.tagName === 'g' && g.querySelector('path[stroke="#FF0000"]'); });
      var objets = gs.map(function (g, i) { return { id: i ? 'pied' : 'dossier', type: 'vect', markup: g.outerHTML }; });
      var cp = F.querySelector('clipPath'), gg = F.querySelector('g[clip-path]'), premier = '';
      if (cp && gg && S.grave) {
        var clip = cp.outerHTML, ch = [].slice.call(gg.children), j = 0;
        S.els.forEach(function (e) {
          var nb = e.type === 'texte' || e.type === 'dessin' ? 1 : e.type === 'lettre' ? (e.nom ? 2 : 1) : 2, part = ch.slice(j, j + nb); j += nb; if (!part.length) return;
          var h = part.map(function (c) { var k = c.cloneNode(true); if (k.getAttribute('fill') === '#111') k.setAttribute('fill', '#000'); if (k.getAttribute('stroke') === '#111') k.setAttribute('stroke', '#000'); return k.outerHTML; }).join('');
          var photo = e.type !== 'texte' && e.type !== 'dessin' && e.type !== 'lettre';
          var nom = e.type === 'texte' ? (e.texte || 'texte') : e.type === 'dessin' ? 'dessin' : e.type === 'lettre' ? 'lettre-' + (e.lettre || '') + (e.nom ? '-' + e.nom : '') : 'photo';
          if (e.type === 'texte' && e.texte && !premier) premier = e.texte;
          objets.push({ id: (photo ? 'photo-' : 'gravure-') + nom, type: photo ? 'image' : 'grav', markup: clip + '<g clip-path="url(#fclip)">' + h + '</g>' });
        });
      }
      uniques(objets);
      var nG = objets.length - gs.length;
      return [{ nom: 'support-' + S.taille + '-' + S.forme + (S.ajoure ? '-' + S.motif : '') + '-' + S.angle + 'deg' + (premier ? '-' + slug(premier) : ''), w: vb[2], h: vb[3], objets: objets,
        titre: 'Support de téléphone · ' + S.taille + ' · ' + S.forme + ' · ' + S.angle + '°' + (S.ajoure ? ' · ajouré ' + S.motif : '') + (premier ? ' · « ' + premier + ' » gravé' : ''), matiere: 'Contreplaqué 3 mm',
        note: objets.length + ' objets : le dossier, le pied' + (nG ? ' et ' + nG + ' élément' + (nG > 1 ? 's gravés' : ' gravé') + ' que vous pouvez déplacer' : '') + '.' }];
    },
    /* arbre de vie : prêt à découper (une pièce), modifiable (arbre + chaque prénom), et le pied */
    arbre: function () {
      var F = document.getElementById('fichier'), vb = F.getAttribute('viewBox').split(' ').map(Number), k = [].slice.call(F.children), S = window.abAtelier.S;
      var noir = function (c) { [].forEach.call(c.querySelectorAll('[fill]'), function (e) { if (e.getAttribute('fill') !== 'none') e.setAttribute('fill', '#000'); }); [].forEach.call(c.querySelectorAll('[stroke]'), function (e) { if (e.getAttribute('stroke') !== 'none') e.setAttribute('stroke', '#000'); }); return c; };
      var a = k.filter(function (g) { return g.tagName === 'g' && g.querySelector('g[filter]'); })[0]; if (!a) throw new Error('L\'arbre n\'est pas encore chargé.');
      var tr = a.getAttribute('transform'), K = +((tr.match(/scale\(([\d.]+)/) || [0, 1])[1]);
      /* fichier modifiable : le prénom dépasse de 0,8 mm sur le bois tout autour du cœur → « Unir » le ressoude à l'arbre */
      var libre = function (c, i) {
        var cp = c.querySelector('clipPath'), d = cp ? cp.querySelector('path').getAttribute('d') : ''; if (!d) return c;
        var m = document.createElementNS(NS, 'mask'); m.setAttribute('id', 'mh' + i); m.setAttribute('maskUnits', 'userSpaceOnUse'); m.setAttribute('x', '-50'); m.setAttribute('y', '-50'); m.setAttribute('width', '500'); m.setAttribute('height', '500');
        m.innerHTML = '<path d="' + d + '" fill="#fff" stroke="#fff" stroke-width="' + (1.6 / K).toFixed(2) + '" stroke-linejoin="round"/>';
        c.removeAttribute('clip-path'); c.setAttribute('mask', 'url(#mh' + i + ')'); c.insertBefore(m, c.firstChild); return c;
      };
      var ac = a.cloneNode(true), fg = ac.querySelector('g[filter]'), fl = ac.querySelector('filter'); if (fl) fl.remove(); fg.removeAttribute('filter'); noir(ac);
      var enf = [].slice.call(a.querySelector('g[filter]').children);
      var arbreSeul = '<g transform="' + tr + '">' + enf[0].outerHTML + '</g>';
      var prenoms = enf.slice(1).map(function (c, i) { return { id: 'prenom-' + (S.noms[i] || i + 1), type: 'cut', markup: '<g transform="' + tr + '">' + libre(noir(c.cloneNode(true)), i).outerHTML + '</g>' }; });
      var pied = k.filter(function (g) { return g.tagName === 'g' && (g.getAttribute('transform') || '').indexOf('translate(200') === 0; })[0], pt = pied.getAttribute('transform');
      var pieces = [].filter.call(pied.children, function (g) { return g.tagName === 'g'; }), po = [], grave = false;
      pieces.forEach(function (g, i) {
        var v = g.cloneNode(true); [].slice.call(v.children).forEach(function (c) { if (!(c.tagName === 'path' && c.getAttribute('stroke') === '#FF0000')) c.remove(); });
        po.push({ id: 'pied-piece-' + (i ? 'b' : 'a'), type: 'vect', markup: '<g transform="' + pt + '">' + v.outerHTML + '</g>' });
      });
      pieces.forEach(function (g, i) {
        var v = g.cloneNode(true); [].forEach.call(v.querySelectorAll('path[stroke="#FF0000"]'), function (e) { e.remove(); }); var t = v.querySelector('text'); if (!t || !t.textContent.trim()) return; noir(v); grave = true;
        po.push({ id: 'gravure-piece-' + (i ? 'b' : 'a') + '-' + t.textContent, type: 'grav', markup: '<g transform="' + pt + '">' + v.outerHTML + '</g>' });
      });
      var noms = S.noms.filter(Boolean), base = 'arbre-' + S.arbre + '-' + (S.forme === 'heart' ? 'coeurs' : 'cercles') + '-' + slug(noms.join('-')), cit = noms.map(function (n) { return '« ' + n + ' »'; }).join(', ');
      var modif = uniques([{ id: 'arbre', type: 'vect', markup: arbreSeul }].concat(prenoms));
      return [
        { nom: base + '-pret-a-decouper', w: 190, h: 190, objets: [{ id: 'arbre-et-prenoms', type: 'cut', markup: ac.outerHTML }], titre: 'Arbre de vie · prêt à découper · ' + cit + ' soudés à l\'arbre', matiere: 'Contreplaqué 3 mm',
          note: '1 seul objet : l\'arbre et les prénoms forment une seule pièce. À découper tel quel.' },
        { nom: base + '-modifiable', w: 190, h: 190, objets: modif, titre: 'Arbre de vie · modifiable · l\'arbre et chaque prénom séparés', matiere: 'Contreplaqué 3 mm',
          note: modif.length + ' objets : l\'arbre et chaque prénom. Déplacez un prénom dans son cœur, puis sélectionnez tout et faites Combiner → Unir avant de découper.' },
        { nom: 'pied-arbre' + (grave ? '-grave-' + slug(S.pied.texte || '') : ''), w: vb[2], h: vb[3], objets: uniques(po), titre: 'Pied de l\'arbre · 2 pièces à emboîter' + (grave ? ' · « ' + (S.pied.texte || '') + ' » gravé' : ''), matiere: 'Contreplaqué 3 mm',
          note: po.length + ' objets : les 2 pièces du pied' + (grave ? ' et le texte gravé, que vous pouvez déplacer' : '') + '.' }
      ];
    },
    /* décoration à suspendre : un fichier par matière (classique), ou la plaque et ses gravures (plaque pleine) */
    deco: function () {
      var F = document.getElementById('fichier'), vb = F.getAttribute('viewBox').split(' ').map(Number), S = window.scAtelier.S, cl = S.style === 'classique';
      var nomDe = function (g) { return 'piece-' + g.getAttribute('data-piece') + '-' + (g.getAttribute('data-nom') || ''); };
      var cadre = { id: cl ? 'cadre' : 'plaque', type: 'vect', markup: F.querySelector('g[data-piece="1"]').outerHTML };
      var gravDe = function (g) {
        var c = g.cloneNode(true); [].forEach.call(c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]'), function (e) { e.remove(); });
        [].forEach.call(c.querySelectorAll('[fill="#111"]'), function (e) { e.setAttribute('fill', '#000'); }); [].forEach.call(c.querySelectorAll('feFlood[flood-color="#111"]'), function (e) { e.setAttribute('flood-color', '#000'); }); return c.outerHTML;
      };
      var NOMS = { contreplaque: 'Contreplaqué 3 mm', 'acr-bleu': 'Acrylique bleu 3 mm', 'acr-rouge': 'Acrylique rouge 3 mm', 'acr-blanc': 'Acrylique blanc 3 mm', 'acr-noir': 'Acrylique noir 3 mm' };
      var t1 = S.els.filter(function (e) { return e.type === 'texte' && e.texte; })[0], base = 'decoration-' + slug(S.forme) + '-' + S.taille + (t1 ? '-' + slug(t1.texte) : ''), titre = 'Décoration · ' + (window.scEtat ? window.scEtat().forme : S.forme) + (t1 ? ' · « ' + t1.texte + ' »' : '');
      if (!cl) {
        var cpp = F.querySelector('clipPath'), clip = cpp ? cpp.outerHTML : '';
        var objs = [cadre].concat([].map.call(F.querySelectorAll('g[clip-path] > g[data-piece]'), function (g) {
          var ph = !!g.querySelector('image[clip-path],image[style*="grayscale"]');
          return { id: (ph ? 'photo-' : 'gravure-') + nomDe(g), type: ph ? 'image' : 'grav', markup: clip + '<g clip-path="url(#fclip)">' + gravDe(g) + '</g>' };
        }));
        uniques(objs);
        return [{ nom: base + '-contreplaque', w: vb[2], h: vb[3], objets: objs, titre: titre + ' (plaque pleine)', matiere: NOMS.contreplaque, note: nbObjets(objs.length) + '. La plaque se découpe, le reste se grave dessus.' }];
      }
      var mats = []; [].forEach.call(F.querySelectorAll('g[data-mat]'), function (g) { var m = g.getAttribute('data-mat'); if (mats.indexOf(m) < 0) mats.push(m); });
      /* les pièces « soudées au cadre » (éditeur de l'atelier) : remises à leur place sur le cadre et découpées avec lui */
      var ed = window.NivEditeur, cb = boite(cadre.markup, vb[2], vb[3]), soudes = [], gravSoudes = [];
      var noirCadre = function () { var c = F.querySelector('g[data-piece="1"]').cloneNode(true); [].forEach.call(c.querySelectorAll('path'), function (e) { e.setAttribute('fill', '#000'); e.setAttribute('stroke', 'none'); }); return c.outerHTML; };
      return mats.map(function (m) {
        var objets = m === 'contreplaque' ? [cadre] : [];
        [].filter.call(F.querySelectorAll('g[data-mat="' + m + '"]'), function (g) { return g.getAttribute('data-piece') !== '1'; }).forEach(function (g) {
          var c = g.cloneNode(true);
          [].forEach.call(c.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]'), function (e) { e.remove(); });
          [].forEach.call(c.querySelectorAll('[fill="#111"],image[filter^="url(#t"],image[clip-path]'), function (e) { e.remove(); });
          [].forEach.call(c.querySelectorAll('[fill="#fff"],[stroke="#fff"]'), function (e) { if (e.closest('mask')) return; if (e.getAttribute('fill') === '#fff') e.setAttribute('fill', '#000'); if (e.getAttribute('stroke') === '#fff') e.setAttribute('stroke', '#000'); });
          var el = S.els[+g.getAttribute('data-piece') - 2], mes = el && el.soude && m === 'contreplaque' && !g.querySelector('image[clip-path]') && ed && ed._mesure ? ed._mesure(el.id) : null;
          if (mes) {
            var pb = boite(c.outerHTML, vb[2], vb[3]), tr = '<g transform="translate(' + r3(cb.x + mes.x + mes.w / 2 - (pb.x + pb.width / 2)) + ' ' + r3(cb.y + mes.y + mes.h / 2 - (pb.y + pb.height / 2)) + ')">';
            soudes.push({ nom: g.getAttribute('data-nom') || 'une pièce', markup: tr + c.outerHTML + '</g>' });
            if (g.querySelector('[fill="#111"],feFlood[flood-color="#111"]')) gravSoudes.push({ id: 'gravure-' + nomDe(g), type: 'grav', markup: tr + gravDe(g) + '</g>' });
            return;
          }
          objets.push({ id: nomDe(g), type: 'cut', markup: c.outerHTML });
          if (g.querySelector('[fill="#111"],feFlood[flood-color="#111"]')) objets.push({ id: 'gravure-' + nomDe(g), type: 'grav', markup: gravDe(g) });
          if (g.querySelector('image[clip-path]')) { var ph = g.cloneNode(true); [].forEach.call(ph.querySelectorAll('[fill="#FF0000"],[stroke="#FF0000"]'), function (e) { e.remove(); }); objets.push({ id: 'photo-' + nomDe(g), type: 'image', markup: ph.outerHTML }); }
        });
        if (m === 'contreplaque' && soudes.length) {
          var bn = noirCadre();
          objets[0] = { id: 'cadre', type: 'cut', markup: bn + soudes.map(function (x) { return x.markup; }).join(''), base: bn, soudes: soudes };
          objets = objets.concat(gravSoudes);
        }
        uniques(objets);
        return { nom: base + '-' + m, w: vb[2], h: vb[3], objets: objets, titre: titre + ' · ' + (NOMS[m] || m).toLowerCase().replace(' 3 mm', ''), matiere: NOMS[m] || m,
          note: nbObjets(objets.length) + '. ' + (m === 'contreplaque' && soudes.length ? soudes.length + ' pièce' + (soudes.length > 1 ? 's soudées' : ' soudée') + ' au cadre (découpée' + (soudes.length > 1 ? 's' : '') + ' avec lui). ' : '') + (m === 'contreplaque' ? (mats.length > 1 ? 'Les pièces en acrylique sont dans leur propre fichier.' : '') : 'À découper dans l\'acrylique, puis à coller sur le cadre comme sur l\'aperçu.') };
      });
    }
  };

  window.NivFabrique = { fabriquer: fabriquer, specs: specs, slug: slug, _tracer: tracer, _contours: contours, _rendre: rendre, _encre: encre, _sonder: sonder, _blocs: lireBlocs };
})();
