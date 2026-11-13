/* Impression 3D : des contours à plat aux fichiers 3D — 13/11/2026.
   Le gérant : « je sélectionne les composants que je veux faire en une seule pièce, j'appuie sur le bouton création et ça me
   transforme le fichier pour l'impression 3D… en une couleur ou en plusieurs couleurs ».
   Entrée : des formes à plat en millimètres ({ outer: [[x, y]…], holes: [[[x, y]…]…] }, y vers le bas comme dans les fichiers de
   découpe), chacune avec sa hauteur de départ et d'arrivée. Sortie : un fichier STL par morceau, ou UN fichier 3MF où chaque objet
   (le couvercle, la boîte…) est une seule pièce faite d'un morceau par couleur (les logiciels d'impression demandent alors quelle
   bobine prend quel morceau). A besoin de earcut (window.earcut), bibliothèque libre (licence ISC) écrite dans la page.
   window.NivImpr3D = { solide, stl, mf3, controle, taille } */
(function (racine) {
  var decoupe = racine.earcut || (typeof require === 'function' ? require(process.env.EARCUT || 'earcut') : null);
  function aire(p) { var s = 0; for (var i = 0, n = p.length; i < n; i++) { var a = p[i], b = p[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function propre(p) { var o = []; p.forEach(function (q) { var d = o[o.length - 1]; if (!d || Math.abs(d[0] - q[0]) > 1e-4 || Math.abs(d[1] - q[1]) > 1e-4) o.push([q[0], q[1]]); });
    while (o.length > 1 && Math.abs(o[0][0] - o[o.length - 1][0]) < 1e-4 && Math.abs(o[0][1] - o[o.length - 1][1]) < 1e-4) o.pop(); return o; }
  /* un volume droit : la forme `ex` montée de z0 à z1. Renvoie une liste de triangles [x1,y1,z1, x2,y2,z2, x3,y3,z3, …], fermée
     (chaque arête sert à deux triangles) : le dessus regarde vers le haut, le dessous vers le bas, les côtés vers l'extérieur. */
  function solide(ex, z0, z1) { var T = [], h0 = Math.min(z0, z1), h1 = Math.max(z0, z1); if (h1 - h0 < 1e-6) return T;
    var ext = propre(ex.outer.map(function (q) { return [q[0], -q[1]]; })); if (ext.length < 3 || Math.abs(aire(ext)) < 1e-6) return T;   // y retourné : l'objet se lit à l'endroit
    if (aire(ext) < 0) ext.reverse();
    var trous = (ex.holes || []).map(function (t) { var p = propre(t.map(function (q) { return [q[0], -q[1]]; })); if (aire(p) > 0) p.reverse(); return p; }).filter(function (p) { return p.length >= 3 && Math.abs(aire(p)) > 1e-6; });
    var plat = [], debuts = [], pts = [];
    [ext].concat(trous).forEach(function (r, i) { if (i) debuts.push(pts.length); r.forEach(function (q) { plat.push(q[0], q[1]); pts.push(q); }); });
    var idx = decoupe(plat, debuts, 2), somme = 0, i, a, b, c, bord = {};
    for (i = 0; i < idx.length; i += 3) { a = pts[idx[i]]; b = pts[idx[i + 1]]; c = pts[idx[i + 2]]; somme += (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]); }
    /* tous les triangles dans le même sens (ceux qui sont plats sont gardés : ils ferment les raccords), puis les côtés sont montés sur le
       bord réel du dessus, arête par arête : le volume est fermé par construction, même si la découpe a sauté un point aligné */
    for (i = 0; i < idx.length; i += 3) { var ia = idx[i], ib = idx[somme < 0 ? i + 2 : i + 1], ic = idx[somme < 0 ? i + 1 : i + 2]; a = pts[ia]; b = pts[ib]; c = pts[ic];
      T.push(a[0], a[1], h1, b[0], b[1], h1, c[0], c[1], h1); T.push(a[0], a[1], h0, c[0], c[1], h0, b[0], b[1], h0);
      [[ia, ib], [ib, ic], [ic, ia]].forEach(function (e) { var inv = e[1] + '>' + e[0]; if (bord[inv]) { if (--bord[inv].n === 0) delete bord[inv]; } else { var k = e[0] + '>' + e[1]; if (bord[k]) bord[k].n++; else bord[k] = { a: e[0], b: e[1], n: 1 }; } }); }
    for (var k in bord) for (var r = 0; r < bord[k].n; r++) { a = pts[bord[k].a]; b = pts[bord[k].b];
      T.push(a[0], a[1], h0, b[0], b[1], h0, b[0], b[1], h1); T.push(a[0], a[1], h0, b[0], b[1], h1, a[0], a[1], h1); }
    return T; }
  function taille(T) { var b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (var i = 0; i < T.length; i += 3) for (var k = 0; k < 3; k++) { if (T[i + k] < b[k]) b[k] = T[i + k]; if (T[i + k] > b[k + 3]) b[k + 3] = T[i + k]; }
    return T.length ? { x: b[0], y: b[1], z: b[2], w: b[3] - b[0], h: b[4] - b[1], e: b[5] - b[2] } : { x: 0, y: 0, z: 0, w: 0, h: 0, e: 0 }; }
  function bouger(T, dx, dy, dz) { var o = new Array(T.length); for (var i = 0; i < T.length; i += 3) { o[i] = T[i] + dx; o[i + 1] = T[i + 1] + dy; o[i + 2] = T[i + 2] + dz; } return o; }
  /* contrôle : le volume est-il bien fermé (aucune arête seule) ? */
  function controle(T) { var m = {}, seules = 0, vol = 0; function cle(i) { return Math.round(T[i] * 1000) + ',' + Math.round(T[i + 1] * 1000) + ',' + Math.round(T[i + 2] * 1000); }
    for (var i = 0; i < T.length; i += 9) { var k = [cle(i), cle(i + 3), cle(i + 6)];
      for (var j = 0; j < 3; j++) { var a = k[j], b = k[(j + 1) % 3]; if (m[b + '|' + a]) { if (--m[b + '|' + a] === 0) delete m[b + '|' + a]; } else m[a + '|' + b] = (m[a + '|' + b] || 0) + 1; }
      vol += (T[i] * (T[i + 4] * T[i + 8] - T[i + 5] * T[i + 7]) - T[i + 1] * (T[i + 3] * T[i + 8] - T[i + 5] * T[i + 6]) + T[i + 2] * (T[i + 3] * T[i + 7] - T[i + 4] * T[i + 6])) / 6; }
    for (var e in m) seules += m[e]; return { triangles: T.length / 9, aretesSeules: seules, volume: vol }; }
  /* STL binaire (un seul morceau, sans couleur) */
  function stl(T, nom) { var n = T.length / 9, buf = new ArrayBuffer(84 + n * 50), v = new DataView(buf), o = 84, t = 'Niv Creation - ' + (nom || 'piece');
    for (var i = 0; i < 80; i++) v.setUint8(i, i < t.length ? t.charCodeAt(i) & 127 : 32); v.setUint32(80, n, true);
    for (i = 0; i < T.length; i += 9) { var ux = T[i + 3] - T[i], uy = T[i + 4] - T[i + 1], uz = T[i + 5] - T[i + 2], wx = T[i + 6] - T[i], wy = T[i + 7] - T[i + 1], wz = T[i + 8] - T[i + 2];
      var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      v.setFloat32(o, nx / l, true); v.setFloat32(o + 4, ny / l, true); v.setFloat32(o + 8, nz / l, true); o += 12;
      for (var k = 0; k < 9; k++) { v.setFloat32(o, T[i + k], true); o += 4; } v.setUint16(o, 0, true); o += 2; }
    return new Uint8Array(buf); }
  /* ---- 3MF : une archive (sans compression) de trois petits fichiers ---- */
  var TABLE = null;
  function crc(u) { if (!TABLE) { TABLE = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; TABLE[n] = c >>> 0; } }
    var r = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) r = TABLE[(r ^ u[i]) & 255] ^ (r >>> 8); return (r ^ 0xFFFFFFFF) >>> 0; }
  function octets(t) { if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(t); var b = unescape(encodeURIComponent(t)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function archive(fichiers) { var parts = [], centre = [], pos = 0;
    function entete(sig, f, n, c, extra) { var b = new Uint8Array((sig === 0x04034b50 ? 30 : 46) + n.length), v = new DataView(b.buffer), o = 0;
      v.setUint32(o, sig, true); o += 4; if (sig !== 0x04034b50) { v.setUint16(o, 20, true); o += 2; } v.setUint16(o, 20, true); o += 2; v.setUint16(o, 0x0800, true); o += 2; v.setUint16(o, 0, true); o += 2;
      v.setUint16(o, 0, true); o += 2; v.setUint16(o, 0x21, true); o += 2; v.setUint32(o, c, true); o += 4; v.setUint32(o, f.length, true); o += 4; v.setUint32(o, f.length, true); o += 4;
      v.setUint16(o, n.length, true); o += 2; v.setUint16(o, 0, true); o += 2;
      if (sig !== 0x04034b50) { v.setUint16(o, 0, true); o += 2; v.setUint16(o, 0, true); o += 2; v.setUint16(o, 0, true); o += 2; v.setUint32(o, 0, true); o += 4; v.setUint32(o, extra, true); o += 4; }
      b.set(n, o); return b; }
    fichiers.forEach(function (f) { var n = octets(f[0]), d = typeof f[1] === 'string' ? octets(f[1]) : f[1], c = crc(d), l = entete(0x04034b50, d, n, c);
      centre.push(entete(0x02014b50, d, n, c, pos)); parts.push(l, d); pos += l.length + d.length; });
    var tc = 0; centre.forEach(function (c) { tc += c.length; }); var fin = new Uint8Array(22), v = new DataView(fin.buffer);
    v.setUint32(0, 0x06054b50, true); v.setUint16(8, centre.length, true); v.setUint16(10, centre.length, true); v.setUint32(12, tc, true); v.setUint32(16, pos, true);
    var tout = new Uint8Array(pos + tc + 22), o = 0; parts.concat(centre, [fin]).forEach(function (p) { tout.set(p, o); o += p.length; }); return tout; }
  function x(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nb(v) { var s = (Math.round(v * 1000) / 1000).toString(); return s === '-0' ? '0' : s; }
  /* objets = [{ nom, morceaux: [{ nom, couleur: '#RRGGBB', T }], x, y }] : chaque objet est UNE pièce faite de ses morceaux */
  function mf3(objets, titre) { var id = 1, mats = [], res = '', build = '', iMat = {};
    objets.forEach(function (o) { o.morceaux.forEach(function (m) { var c = (m.couleur || '#CCCCCC').toUpperCase(); if (iMat[c + m.nom] == null) { iMat[c + m.nom] = mats.length; mats.push('<base name="' + x(m.nom) + '" displaycolor="' + c + 'FF"/>'); } }); });
    var idMat = id++;
    objets.forEach(function (o) { var comps = [];
      o.morceaux.forEach(function (m) { if (!m.T.length) return; var T = m.T, sommets = {}, vs = [], ts = [];
        function s(i) { var k = Math.round(T[i] * 1000) + ',' + Math.round(T[i + 1] * 1000) + ',' + Math.round(T[i + 2] * 1000), r = sommets[k]; if (r == null) { r = sommets[k] = vs.length; vs.push('<vertex x="' + nb(T[i]) + '" y="' + nb(T[i + 1]) + '" z="' + nb(T[i + 2]) + '"/>'); } return r; }
        for (var i = 0; i < T.length; i += 9) { var a = s(i), b = s(i + 3), c = s(i + 6); if (a !== b && b !== c && a !== c) ts.push('<triangle v1="' + a + '" v2="' + b + '" v3="' + c + '"/>'); }
        var oid = id++; comps.push(oid);
        res += '<object id="' + oid + '" type="model" name="' + x(o.nom + ' - ' + m.nom) + '" pid="' + idMat + '" pindex="' + iMat[(m.couleur || '#CCCCCC').toUpperCase() + m.nom] + '"><mesh><vertices>' + vs.join('') + '</vertices><triangles>' + ts.join('') + '</triangles></mesh></object>\n'; });
      if (!comps.length) return; var oid = id++;
      res += '<object id="' + oid + '" type="model" name="' + x(o.nom) + '"><components>' + comps.map(function (c) { return '<component objectid="' + c + '"/>'; }).join('') + '</components></object>\n';
      build += '<item objectid="' + oid + '" transform="1 0 0 0 1 0 0 0 1 ' + nb(o.x || 0) + ' ' + nb(o.y || 0) + ' 0"/>'; });
    var modele = '<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="fr-FR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n'
      + '<metadata name="Title">' + x(titre || 'Niv Création') + '</metadata><metadata name="Application">Niv Création, L\'atelier</metadata>\n<resources>\n<basematerials id="' + idMat + '">' + mats.join('') + '</basematerials>\n'
      + res + '</resources>\n<build>' + build + '</build>\n</model>\n';
    return archive([
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'],
      ['3D/3dmodel.model', modele]]); }
  var api = { solide: solide, stl: stl, mf3: mf3, controle: controle, taille: taille, bouger: bouger };
  racine.NivImpr3D = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
