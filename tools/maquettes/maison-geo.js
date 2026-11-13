/* Maisonnette en bois : calcul des pièces à découper (maquette du 13/11/2026).
   Mêmes règles que le générateur « House Ornament » d'Atomm, relevées dans leur outil : deux pignons, deux murs, une base,
   deux pans de toit et, pour la suspension, une poutre d'accroche avec son anneau. Tout est en millimètres ; les anneaux
   sont des tracés ClipperLib (entiers, 1 unité = 1 micron).
   Ce fichier est écrit tel quel dans la page par maison-createur.py et vérifié par maison-test.cjs. */
(function (racine) {
  var CL = racine.ClipperLib, E = 1000;
  var DEFAUT = { width: 64, depth: 52, wallHeight: 60, baseInset: 4, roofHeight: 30, thickness: 3, fit: 0.15, kerf: 0.13, eave: 5, baseMargin: 3,
    motifSize: 30, motifY: 32, front: 'christmas_deer', back: 'christmas_deer', syncFaces: true, decoration: 'star', decorCount: 6, decorSize: 5, decorInset: 9,
    windowShape: 'arch', windowRows: 2, windowCols: 2, windowWidth: 8, windowHeight: 14, windowGap: 7, windowFrame: 0, syncWindows: true,
    rightWindow: { windowShape: 'arch', windowRows: 2, windowCols: 2, windowWidth: 8, windowHeight: 14, windowGap: 7, windowFrame: 0 },
    topMode: 'ornament', loopInner: 4, loopOuter: 10, topPosition: 50, wireDiameter: 5, bulbDiameter: 8, bulbLength: 20, tiles: true, tileSize: 8 };
  /* [mini, maxi, pas] : les limites de leur outil */
  var LIMITES = { width: [45, 140, 0.1], depth: [40, 140, 0.1], wallHeight: [42, 150, 0.1], baseInset: [0, 8, 0.1], roofHeight: [18, 65, 0.1], thickness: [1.5, 5, 0.1],
    fit: [0, 0.5, 0.01], kerf: [0, 0.5, 0.01], eave: [2, 12, 0.1], baseMargin: [1, 10, 0.1], motifSize: [10, 65, 0.1], motifY: [15, 100, 0.1], decorCount: [0, 12, 1],
    decorSize: [3, 9, 0.1], decorInset: [7, 18, 0.1], windowRows: [1, 3, 1], windowCols: [1, 3, 1], windowWidth: [4, 20, 0.1], windowHeight: [6, 28, 0.1],
    windowGap: [3, 14, 0.1], windowFrame: [0, 3, 0.1], loopInner: [2, 8, 0.1], loopOuter: [7, 18, 0.1], topPosition: [20, 80, 1], wireDiameter: [2, 12, 0.1],
    bulbDiameter: [3, 20, 0.1], bulbLength: [5, 40, 0.1], tileSize: [5, 16, 0.1] };

  function P(x, y) { return { X: Math.round(x * E), Y: Math.round(y * E) }; }
  function rect(x, y, w, h) { return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)]; }
  function rond(cx, cy, r, n) { n = n || 48; var o = []; for (var i = 0; i < n; i++) o.push(P(cx + Math.cos(i / n * 2 * Math.PI) * r, cy + Math.sin(i / n * 2 * Math.PI) * r)); return o; }
  function aire(r) { return CL.Clipper.Area(r); }
  function plein(r) { return aire(r) < 0 ? r.slice().reverse() : r; }
  function op(type, a, b) { var c = new CL.Clipper(), o = []; c.AddPaths(a, CL.PolyType.ptSubject, true); if (b && b.length) c.AddPaths(b, CL.PolyType.ptClip, true);
    c.Execute(type, o, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return o; }
  function unir(a) { return op(CL.ClipType.ctUnion, a.map(plein)); }
  function oter(a, b) { return b.length ? op(CL.ClipType.ctDifference, a, b.map(plein)) : a; }
  function commun(a, b) { return a.length && b.length ? op(CL.ClipType.ctIntersection, a, b) : []; }
  function grossir(a, d, droit) { if (!a.length) return []; var co = new CL.ClipperOffset(2, 0.004 * E), o = [];
    co.AddPaths(a, droit ? CL.JoinType.jtMiter : CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(o, d * E); return o; }
  /* Ne garde des traits que ce qui tombe dans la zone (anneaux pleins et trous) : chaque segment est coupé là où il croise un bord. */
  function dedans(x, y, zone) { var in_ = false; for (var z = 0; z < zone.length; z++) { var r = zone[z]; for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
    var a = r[i], b = r[j]; if ((a.Y > y) !== (b.Y > y) && x < (b.X - a.X) * (y - a.Y) / (b.Y - a.Y) + a.X) in_ = !in_; } } return in_; }
  function couperTraits(traits, zone) {
    var sortie = [];
    if (!zone.length) return sortie;
    traits.forEach(function (trait) {
      var cours = null;
      for (var i = 1; i < trait.length; i++) {
        var p = trait[i - 1], q = trait[i], dx = q.X - p.X, dy = q.Y - p.Y, coupes = [0, 1];
        zone.forEach(function (r) { for (var k = 0; k < r.length; k++) { var a = r[k], b = r[(k + 1) % r.length], ex = b.X - a.X, ey = b.Y - a.Y, det = dx * ey - dy * ex;
          if (Math.abs(det) < 1e-9) continue; var s = ((a.X - p.X) * ey - (a.Y - p.Y) * ex) / det, u = ((a.X - p.X) * dy - (a.Y - p.Y) * dx) / det;
          if (s > 0 && s < 1 && u >= 0 && u <= 1) coupes.push(s); } });
        coupes.sort(function (m, n) { return m - n; });
        for (var c = 1; c < coupes.length; c++) {
          var s0 = coupes[c - 1], s1 = coupes[c], mi = (s0 + s1) / 2;
          if (s1 - s0 <= 1e-7) continue;
          if (dedans(p.X + dx * mi, p.Y + dy * mi, zone)) {
            var d0 = { X: Math.round(p.X + dx * s0), Y: Math.round(p.Y + dy * s0) }, d1 = { X: Math.round(p.X + dx * s1), Y: Math.round(p.Y + dy * s1) }, fin = cours && cours[cours.length - 1];
            if (fin && Math.abs(fin.X - d0.X) <= 1 && Math.abs(fin.Y - d0.Y) <= 1) cours.push(d1); else { cours = [d0, d1]; sortie.push(cours); }
          } else cours = null;
        }
      }
    });
    return sortie;
  }
  function poser(pts, taille, cx, cy) { var o = []; for (var i = 0; i < pts.length; i++) o.push(P(pts[i][0] * taille + cx, pts[i][1] * taille + cy)); return o; }

  /* Les formes simples (dans un carré de côté 1, centré) ; les dessins de Noël viennent de la liste donnée à motifs(). */
  var DESSINS = {};
  function formes(nom) {
    if (DESSINS[nom]) return DESSINS[nom];
    var i, o = [];
    if (nom === 'star') { for (i = 0; i < 10; i++) { var r = i % 2 ? 0.21 : 0.5, a = -Math.PI / 2 + i * Math.PI / 5; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return [o]; }
    if (nom === 'circle') { for (i = 0; i < 48; i++) o.push([Math.cos(i / 48 * 2 * Math.PI) * 0.5, Math.sin(i / 48 * 2 * Math.PI) * 0.5]); return [o]; }
    if (nom === 'heart') { for (i = 0; i < 80; i++) { var t = i / 80 * Math.PI * 2; o.push([16 * Math.pow(Math.sin(t), 3) / 34, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 34]); } return [o]; }
    if (nom === 'moon') { /* un disque auquel on retire un disque décalé (calculé cent fois plus grand, pour la finesse) */
      var lune = oter([plein(rond(0, 0, 50))], [rond(24, -12, 43)]).filter(function (q) { return aire(q) > 0; });
      return (DESSINS.moon = lune.map(function (q) { return q.map(function (c) { return [c.X / E / 100, c.Y / E / 100]; }); })); }
    return [];
  }

  function borner(brut) {
    var t = JSON.parse(JSON.stringify(DEFAUT)), k;
    brut = brut || {};
    for (k in LIMITES) if (typeof brut[k] === 'number' && isFinite(brut[k])) { var l = LIMITES[k]; t[k] = Math.max(l[0], Math.min(l[1], l[2] === 1 ? Math.round(brut[k]) : brut[k])); }
    ['syncFaces', 'syncWindows', 'tiles'].forEach(function (c) { if (typeof brut[c] === 'boolean') t[c] = brut[c]; });
    ['front', 'back', 'decoration', 'windowShape', 'topMode'].forEach(function (c) { if (typeof brut[c] === 'string') t[c] = brut[c]; });
    if (brut.rightWindow) for (k in t.rightWindow) {
      var v = brut.rightWindow[k];
      if (k === 'windowShape') { if (typeof v === 'string') t.rightWindow[k] = v; } else if (typeof v === 'number' && isFinite(v)) { var m = LIMITES[k]; t.rightWindow[k] = Math.max(m[0], Math.min(m[1], m[2] === 1 ? Math.round(v) : v)); }
    }
    t.loopOuter = Math.max(t.loopOuter, t.loopInner + 4);
    return t;
  }

  /* Les tuiles gravées d'un pan de toit : des rangées d'écailles, une rangée sur deux décalée d'une demi-tuile. */
  function tuiles(long, large, tuile) {
    var rangs = Math.max(1, Math.round((long - 3) / (tuile * 0.72))), pas = (long - 3) / rangs, creux = Math.min(tuile * 0.3, pas * 0.5), traits = [];
    for (var l = 0; l < rangs; l++) {
      var debut = 1.5 + l * pas, fin = debut + pas - creux, decal = (l % 2) * tuile / 2;
      for (var d = -1; d <= Math.ceil(large / tuile); d++) {
        var y = 1.5 + d * tuile + decal, arc = [];
        traits.push([P(debut, y), P(fin, y)]);
        for (var g = 0; g <= 24; g++) { var a = g / 24 * Math.PI; arc.push(P(fin + Math.sin(a) * creux, y + tuile / 2 * (1 - Math.cos(a)))); }
        traits.push(arc);
      }
    }
    return couperTraits(traits, [rect(1.5, 1.5, long - 3, large - 3)]);
  }

  function calculer(brut) {
    var t = borner(brut), W = t.width, D = t.depth, H = t.wallHeight, R = t.roofHeight, T = t.thickness, marge = Math.max(2, T);
    var pieces = [], alertes = [], pente = Math.atan2(R, W / 2), co = Math.cos(pente), si = Math.sin(pente), rampant = Math.hypot(W / 2, R), pan = rampant + t.eave / co;
    var g = t.baseInset, mur = Math.hypot(H, g), mc = H / mur, ms = g / mur, bas = W - 2 * g;
    var tenonY = rampant * 0.52, tenonL = Math.min(10, rampant * 0.22), fente = T + t.fit;
    var poutreY = Math.max(6, 2 * T, fente / 2 * Math.tan(pente) + marge / co + t.fit / 2), poutreH = Math.max(6, 2 * T), poutreH2 = poutreH + marge;
    var trouPoutre = rect(W / 2 - fente / 2, poutreY - t.fit / 2, fente, poutreH + t.fit);
    var anneau = Math.max(t.loopOuter, t.loopInner + 4), rayon = anneau / 2, place = D * t.topPosition / 100;
    var col = Math.min(anneau, Math.max(4, 1.5 * T), 2 * (Math.min(place, D - place) - T - t.fit / 2)), anneauY = -(T / co + rayon + marge);
    var crans = [H * 0.28, H * 0.7], cranL = Math.max(7, H * 0.14), pattes = [g + bas * 0.3, g + bas * 0.7];

    function piece(id, dehors, trous, traits, origine, u, v, eclat) {
      var forme = oter(unir(dehors), trous), zone = traits.length ? grossir(forme, -0.6) : forme;
      var p = { id: id, rings: forme, scores: couperTraits(traits, zone), origin: origine, u: u, v: v,
        normal: [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], explode: eclat };
      pieces.push(p);
      if (forme.filter(function (q) { return aire(q) > 0; }).length !== 1) alertes.push('disconnected');
      return p;
    }

    var faites = [0, 0]; /* combien de petites découpes ont trouvé leur place, devant et derrière */
    /* 1 et 2 : les pignons (façade et arrière), avec le dessin et les petites découpes autour */
    for (var f = 0; f < 2; f++) {
      var dehors = [[P(g, H + R), P(0, R), P(W / 2, 0), P(W, R), P(W - g, H + R)]], trous = t.topMode === 'ornament' ? [trouPoutre] : [];
      [-1, 1].forEach(function (cote) { /* les tenons qui tiennent le toit, au milieu de chaque rampant */
        dehors.push([[tenonY - tenonL / 2, -0.1], [tenonY + tenonL / 2, -0.1], [tenonY + tenonL / 2, T], [tenonY - tenonL / 2, T]].map(function (q) {
          return P(W / 2 + cote * (co * q[0] + si * q[1]), si * q[0] - co * q[1]); }));
      });
      crans.forEach(function (h) { [0, 1].forEach(function (droite) { /* les crans où entrent les murs */
        var y0 = h / mc - cranL / 2 - t.fit / 2;
        trous.push([[-0.001, y0], [T + 0.001, y0], [T + 0.001, y0 + cranL + t.fit], [-0.001, y0 + cranL + t.fit]].map(function (q) {
          var x = ms * q[1] + mc * q[0]; return P(droite ? W - x : x, R + mc * q[1] - ms * q[0]); }));
      }); });
      pattes.forEach(function (x) { dehors.push(rect(x - 4, H + R - 0.1, 8, T + 0.1)); });
      var hautL = g * marge / H + (T + marge) / mc, basL = g * (1 - marge / H) + (T + marge) / mc;
      var libre = oter([plein([P(hautL, R + marge), P(W - hautL, R + marge), P(W - basL, R + H - marge), P(basL, R + H - marge)])], t.topMode === 'ornament' ? grossir([trouPoutre], marge) : []);
      var nom = f === 0 || t.syncFaces ? t.front : t.back, taille = Math.min(t.motifSize, W - 2 * (T + marge + 8), H - 2 * marge - 10);
      var cy = R + Math.min(H - marge - taille / 2, Math.max(marge + taille / 2, t.motifY));
      var dessin = unir(formes(nom).map(function (q) { return poser(q, taille, W / 2, cy); }));
      commun(dessin, libre).forEach(function (q) { trous.push(q); });
      var autour = dessin.length ? grossir(dessin, marge) : [];
      for (var n = 0; n < t.decorCount && t.decoration !== 'none'; n++) {
        var a = -Math.PI / 2 + 2 * Math.PI * n / t.decorCount, px = W / 2 + Math.cos(a) * (W / 2 - t.decorInset), py = R + H / 2 + Math.sin(a) * (H / 2 - t.decorInset);
        var deco = formes(t.decoration).map(function (q) { return poser(q, t.decorSize, px, py); });
        /* une découpe qui sort du mur, ou qui touche un assemblage ou une autre découpe, n'est pas faite */
        if (oter(deco, libre).length || commun(grossir(deco, marge), trous).length || commun(deco, autour).length) continue;
        deco.forEach(function (q) { trous.push(q); });
        faites[f]++;
      }
      piece(f ? 'back' : 'front', dehors, trous, [], [-W / 2, H + R + T, f ? -D / 2 + T : D / 2], [1, 0, 0], [0, -1, 0], [0, 0, f ? -22 : 22]);
    }

    /* 3 et 4 : les murs des côtés, avec leurs fenêtres */
    for (var c = 0; c < 2; c++) {
      var lon = D - 2 * T, mDehors = [rect(0, 0, lon, mur)], mTrous = [];
      crans.forEach(function (h) { [-T, lon].forEach(function (x) { mDehors.push(rect(x, h / mc - cranL / 2, T, cranL)); }); });
      [lon * 0.3, lon * 0.7].forEach(function (x) { mDehors.push(rect(x - 4, mur - 0.1, 8, T / mc + 0.1)); });
      var fe = c === 1 && !t.syncWindows ? t.rightWindow : t, croix = fe.windowFrame > 0 ? Math.max(marge, fe.windowFrame) : 0;
      if (fe.windowShape !== 'none') {
        var nc = fe.windowCols, nr = fe.windowRows;
        var ecart = Math.min(fe.windowGap, (lon - 2 * marge - nc * 3) / Math.max(1, nc - 1), (mur - 2 * marge - nr * 4) / Math.max(1, nr - 1));
        var fw = Math.min(fe.windowWidth, (lon - 2 * marge - (nc - 1) * ecart) / nc), fh = Math.min(fe.windowHeight, (mur - 2 * marge - (nr - 1) * ecart) / nr);
        var totL = nc * fw + (nc - 1) * ecart, totH = nr * fh + (nr - 1) * ecart;
        for (var r = 0; r < nr; r++) for (var k = 0; k < nc; k++) {
          var x0 = (lon - totL) / 2 + k * (fw + ecart), y0 = (mur - totH) / 2 + r * (fh + ecart), fen = rect(x0, y0, fw, fh);
          if (fe.windowShape === 'circle') fen = rond(x0 + fw / 2, y0 + fh / 2, Math.min(fw, fh) / 2);
          if (fe.windowShape === 'arch') { var ar = Math.min(fw / 2, fh / 2); fen = [P(x0, y0 + fh), P(x0, y0 + ar)];
            for (var s = 0; s <= 24; s++) fen.push(P(x0 + fw / 2 + Math.cos(Math.PI + s * Math.PI / 24) * fw / 2, y0 + ar + Math.sin(Math.PI + s * Math.PI / 24) * ar));
            fen.push(P(x0 + fw, y0 + fh)); }
          (croix > 0 ? oter([plein(fen)], [rect(x0 + fw / 2 - croix / 2, y0, croix, fh), rect(x0, y0 + fh * 0.6, fw, croix)]) : [fen]).forEach(function (q) { mTrous.push(q); });
        }
      }
      piece(c ? 'right' : 'left', mDehors, mTrous, [], [c ? W / 2 : -W / 2, H + T, D / 2 - T], [0, 0, -1], [c ? -ms : ms, -mc, 0], [c ? 22 : -22, 0, 0]);
      pieces[pieces.length - 1].normal = [c ? -mc : mc, ms, 0];
    }

    /* 5 : la base, percée des fentes où entrent les pattes des pignons et des murs */
    var bm = t.baseMargin, fentes = [], pm = T / mc + T * g / H;
    [0, D - T].forEach(function (y) { pattes.forEach(function (x) { fentes.push(rect(x - g - 4 - t.fit / 2, y - t.fit / 2, 8 + t.fit, T + t.fit)); }); });
    [0, bas - pm].forEach(function (x) { [(D - 2 * T) * 0.3, (D - 2 * T) * 0.7].forEach(function (y) { fentes.push(rect(x - t.fit / 2, T + y - 4 - t.fit / 2, pm + t.fit, 8 + t.fit)); }); });
    piece('base', [rect(-bm, -bm, bas + 2 * bm, D + 2 * bm)], fentes, [], [-W / 2 + g, 0, D / 2], [1, 0, 0], [0, 0, -1], [0, -18, 0]);

    /* 6 et 7 : les deux pans du toit */
    var large = D + 2 * t.eave, faite = (large - 2 * t.eave) * t.topPosition / 100 + t.eave;
    for (var p = 0; p < 2; p++) {
      var tTrous = [];
      if (t.topMode === 'lights') tTrous.push(rond(0, faite, t.wireDiameter / 2).map(function (q) { return { X: Math.round(q.X / co), Y: q.Y }; }));
      else tTrous.push(rect(-0.01, faite - (col + t.fit) / 2, fente / (2 * co) + 0.01, col + t.fit));
      [t.eave, t.eave + D - T].forEach(function (y) { tTrous.push(rect(tenonY - tenonL / 2 - t.fit / 2, y - t.fit / 2, tenonL + t.fit, T + t.fit)); });
      var toit = piece(p ? 'roofRight' : 'roofLeft', [rect(0, 0, pan, large)], tTrous, t.tiles ? tuiles(pan, large, t.tileSize) : [],
        [0, H + R + T, D / 2 + t.eave], [p ? co : -co, -si, 0], [0, 0, p ? -1 : 1], [p ? 16 : -16, 24, 0]);
      toit.v = [0, 0, -1]; toit.normal = [p ? si : -si, co, 0];
    }

    /* 8 : la poutre d'accroche et son anneau (suspension seulement) */
    if (t.topMode === 'ornament') {
      var a1 = T + t.fit / 2, a2 = D - T - t.fit / 2;
      var poutre = piece('hanger', [rect(0, poutreY, D, poutreH), rect(a1, poutreY, a2 - a1, poutreH2), rect(place - col / 2, anneauY, col, poutreY + poutreH2 - anneauY), rond(place, anneauY, rayon)],
        [rond(place, anneauY, t.loopInner / 2)], [], [-T / 2, H + R + T, D / 2], [0, 0, -1], [0, -1, 0], [0, 28, 0]);
      poutre.normal = [1, 0, 0];
    }

    /* l'ampoule d'une guirlande : on vérifie seulement qu'elle a la place */
    var aLong = Math.max(t.bulbLength, t.bulbDiameter), aBas = t.bulbDiameter / 2 * Math.tan(pente) + marge, aZ = D / 2 - D * t.topPosition / 100;
    var ampoule = { diameter: t.bulbDiameter, length: aLong, drop: aBas, position: [0, H + R + T - aBas - aLong / 2, aZ] };
    var tient = t.bulbDiameter <= W - 2 * T - 2 * marge && Math.abs(aZ) + t.bulbDiameter / 2 + marge <= D / 2 - T && aLong + aBas <= H + R - marge;
    if (!tient && t.topMode === 'lights') alertes.push('bulbFit');

    /* le trait de coupe : le laser enlève de la matière, chaque pièce est élargie d'un demi-trait */
    var coupe = pieces.map(function (q) {
      if (t.kerf <= 0) return { id: q.id, rings: q.rings, scores: q.scores };
      var gros = grossir(q.rings, t.kerf / 2, true), avant = q.rings.filter(function (z) { return aire(z) < 0; }), apres = gros.filter(function (z) { return aire(z) < 0; }).map(plein);
      if (gros.filter(function (z) { return aire(z) > 0; }).length !== 1 || apres.length !== avant.length || avant.some(function (z) { return !commun([plein(z)], apres).length; })) alertes.push('kerfDetailLost');
      return { id: q.id, rings: gros, scores: q.scores };
    });
    var vues = {}; alertes = alertes.filter(function (z) { return vues[z] ? false : (vues[z] = true); });
    return { params: t, parts: pieces, cutParts: coupe, warnings: alertes, bulbFits: tient, bulb: ampoule,
      hauteur: H + R + T + (t.topMode === 'ornament' ? -anneauY + rayon : 0), pan: pan, largeToit: large, decors: faites,
      anneau: { y: anneauY, rayon: rayon, place: place, col: col }, pente: pente, bas: bas };
  }

  function boite(anneaux) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; anneaux.forEach(function (r) { r.forEach(function (q) { if (q.X < x0) x0 = q.X; if (q.X > x1) x1 = q.X; if (q.Y < y0) y0 = q.Y; if (q.Y > y1) y1 = q.Y; }); });
    return { x: x0 / E, y: y0 / E, w: (x1 - x0) / E, h: (y1 - y0) / E }; }
  function chemin(anneaux, dx, dy, ouvert) { var d = ''; anneaux.forEach(function (r) { for (var i = 0; i < r.length; i++) d += (i ? 'L' : 'M') + (r[i].X / E + dx).toFixed(2) + ' ' + (r[i].Y / E + dy).toFixed(2); if (!ouvert) d += 'Z'; }); return d; }

  racine.NivMaison = { E: E, DEFAUT: DEFAUT, LIMITES: LIMITES, calculer: calculer, borner: borner, formes: formes, boite: boite, chemin: chemin, aire: aire,
    motifs: function (liste) { for (var k in liste) DESSINS[k] = liste[k]; } };
})(typeof window !== 'undefined' ? window : globalThis);
