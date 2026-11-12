/* Éditeur d'atelier (Gestion › Retoucher et fabriquer) — 12/11/2026 soir.
   Gérant : « je veux un vrai outil comme les sites pro, logiciel pro ». La première version rouvrait seulement l'outil de la
   cliente dans un cadre. Ici, par-dessus le même moteur (l'outil dessine toujours la pièce et son fichier) :
     · grand aperçu avec zoom, à gauche (collé en haut sur téléphone) ;
     · liste des pièces (noms, dessins, photos), à droite ;
     · pour la pièce choisie : texte, écriture, bord gauche / haut / largeur / hauteur EN MILLIMÈTRES, flèches au pas choisi ;
     · centrer dans le produit, aligner sur une autre pièce ;
     · annuler / refaire (chaque geste, y compris ceux faits au doigt sur l'aperçu) ;
     · l'onglet « Produit et ajouts » garde tous les réglages de l'outil (forme, taille, ajouter un texte, un dessin, une photo).
   Modèle : la barre « Numeric Edits » de LightBurn (X, Y, largeur, hauteur, proportions gardées) et le panneau de droite de
   xTool Creative Space. Un adaptateur par outil traduit « déplacer / agrandir / retaper » dans l'état de l'outil. */
(function () {
  'use strict';
  function $(i) { return document.getElementById(i); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function fr(v) { return (Math.round(v * 10) / 10).toFixed(1).replace('.', ','); }
  function lire(v) { var n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : null; }
  function borne(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- un adaptateur par outil ---------- */
  function adaptateur(quoi) {
    if (quoi === 'arbre') {
      var a = window.abAtelier, S = a.S, choix = null;
      var aj = function (id) { if (id === 'pied') { S.pied.aj = S.pied.aj || { dx: 0, dy: 0, s: 1 }; return S.pied.aj; } S.aj = S.aj || []; var i = +id.slice(1); S.aj[i] = S.aj[i] || { dx: 0, dy: 0, s: 1 }; return S.aj[i]; };
      return {
        produit: 'L\'arbre', centrable: false, retirable: false, cadre: true, policeDe: function (id) { return id === 'pied' ? 'Écriture du pied' : 'Écriture (tous les prénoms)'; },
        geo: function () { return a.geo(); },
        pieces: function () {
          var L = S.noms.map(function (n, i) { return { id: 'n' + i, type: 'texte', nom: '« ' + (n || '…') + ' »', sous: 'prénom ' + (i + 1) + ' · découpé', texte: n, police: S.police, max: 10 }; });
          if (S.pied.grave) L.push({ id: 'pied', type: 'texte', nom: 'Pied : « ' + (S.pied.texte || '…') + ' »', sous: 'gravé sur le pied', texte: S.pied.texte, police: S.pied.police, max: 20 });
          return L;
        },
        noeud: function (id) { if (id === 'pied') return null; var c = document.getElementById('cp' + id.slice(1)); return c && c.parentNode ? c.parentNode.querySelector('text') : null; },
        /* le pied n'a pas de mesure absolue : on donne son décalage (mm) et sa taille (%) par rapport à la place d'origine */
        decalage: function (id) { var o = aj(id), u = id === 'pied' ? 1 : a.geo().u; return { dx: o.dx / u, dy: o.dy / u, s: o.s }; },
        bouger: function (id, dx, dy) { var o = aj(id), u = id === 'pied' ? 1 / a.geo().u : 1; o.dx += dx * u; o.dy += dy * u; },
        grossir: function (id, f) { var o = aj(id); o.s = borne(o.s * f, 0.4, 2); },
        remettre: function (id) { var o = aj(id); o.dx = 0; o.dy = 0; o.s = 1; },
        texte: function (id, t) { if (id === 'pied') S.pied.texte = t; else S.noms[+id.slice(1)] = t; },
        police: function (id, k) { if (id === 'pied') S.pied.police = k; else S.police = k; },
        polices: function () { return a.polices; },
        choisir: function (id) { choix = id; }, choisi: function () { return choix; },
        redessiner: function () { a.maj(); },
        /* le prénom est découpé DANS son cœur (ou son cercle) : ce qui en sort se fond dans le bois de l'arbre */
        alerte: function (id) {
          if (id === 'pied') return ''; var c = document.getElementById('cp' + id.slice(1)), t = this.noeud(id); if (!c || !t) return '';
          var e = encreTexte(t), o; try { o = c.querySelector('path').getBBox(); } catch (x) { return ''; } if (!e || !(o.width > 0)) return '';
          var tol = 0.8 * a.geo().u;
          return e.x < o.x - tol || e.x + e.width > o.x + o.width + tol || e.y < o.y - tol || e.y + e.height > o.y + o.height + tol
            ? 'Ce prénom dépasse de son emplacement : ce qui dépasse se fond dans le bois de l\'arbre et ne se lira pas. Réduisez-le ou rapprochez-le du milieu.' : '';
        },
        clicScene: function (ev) { var g = ev.target.closest && ev.target.closest('#noms > g'); if (!g) return undefined; var c = g.querySelector('clipPath'); return c ? 'n' + c.id.slice(2) : undefined; }
      };
    }
    var b = window.scAtelier, T = b.S;
    var el = function (id) { for (var i = 0; i < T.els.length; i++) if (String(T.els[i].id) === String(id)) return T.els[i]; return null; };
    return {
      produit: quoi === 'support' ? 'Le dossier' : 'La décoration', centrable: true, retirable: true, policeDe: function () { return 'Écriture'; },
      geo: function () { return b.geo(); },
      pieces: function () {
        return T.els.map(function (e) {
          var texte = e.type === 'texte' ? e.texte : e.type === 'lettre' ? (e.nom || '') : undefined;
          var nom = b.nomEl ? b.nomEl(e) : e.type === 'texte' ? '« ' + (e.texte || '…') + ' »' : e.type === 'dessin' ? 'Dessin' : e.type === 'lettre' ? 'Lettre fleurie ' + (e.lettre || '') : 'Photo';
          var sous = quoi === 'support' ? 'gravé' : (T.style !== 'classique' ? 'gravé sur la plaque' : (e.type === 'photo' ? 'photo sur une pièce' : e.mode === 'grave' ? 'gravé sur une pièce' : 'découpé') + (b.matDe ? ' · ' + b.matDe(e) : ''));
          return { id: e.id, type: e.type, nom: nom, sous: sous, texte: texte, police: texte !== undefined ? e.police : undefined, max: 30, flottant: !!e.flottant };
        });
      },
      noeud: function (id) { return document.querySelector('#scene .sc-el[data-id="' + id + '"]'); },
      bouger: function (id, dx, dy) { var e = el(id); if (!e) return; e.x += dx; e.y += dy; e.auto = false; },
      grossir: function (id, f) { var e = el(id); if (!e) return; e.s = borne(e.s * f, 0.15, 5); e.auto = false; },
      texte: function (id, t) { var e = el(id); if (!e) return; if (e.type === 'lettre') e.nom = t; else e.texte = t; },
      police: function (id, k) { var e = el(id); if (e) e.police = k; },
      polices: function () { return b.polices; },
      retirer: function (id) { T.els = T.els.filter(function (e) { return String(e.id) !== String(id); }); if (String(T.sel) === String(id)) T.sel = null; },
      choisir: function (id) { T.sel = id; }, choisi: function () { return T.sel; },
      redessiner: function () { b.dessiner(); if (b.fiche) b.fiche(); },
      alerte: function (id) { var e = el(id); return e && e.flottant ? 'Cette pièce ne touche ni le cadre ni une autre pièce : elle tomberait. Déplacez-la jusqu\'à ce qu\'elle touche.' : ''; },
      clicScene: function () { return undefined; }
    };
  }

  var CSS = ''
    + 'body.niv-pro{background:#efeae1;padding-bottom:0}'
    + 'body.niv-pro main{padding:0}body.niv-pro main>.container{max-width:none;width:auto;padding:0 10px}'
    + 'body.niv-pro .sc-layout{display:grid;grid-template-columns:minmax(0,1fr) 392px;gap:12px;padding:8px 0 28px;align-items:start}'
    + 'body.niv-pro .sc-left{position:sticky;top:8px;min-width:0}'
    + 'body.niv-pro #stage{height:calc(100vh - 74px);min-height:240px;overflow:auto;display:flex;border-radius:12px;border:1px solid #d9cfbd;background:#e4ded2;-webkit-overflow-scrolling:touch}'
    + 'body.niv-pro #stage>svg#scene{margin:auto;flex:none;max-height:none;touch-action:pan-x pan-y;background:linear-gradient(180deg,#f6f1e8,#eee6d8);border-radius:6px;box-shadow:0 2px 14px rgba(40,28,10,.14)}'
    + 'body.niv-pro .sc-mur,body.niv-pro .sc-tag,body.niv-pro #astuce,body.niv-pro #aide,body.niv-pro .sc-aide,body.niv-pro #atReg{display:none!important}'
    + 'body.niv-pro .product-info{min-width:0;padding:0}'
    + 'body.niv-pro:not(.niv-reglages) .product-info>*:not(#nivPro){display:none!important}'
    + 'body.niv-pro.niv-reglages #nivPieces{display:none}'
    + 'body.niv-pro .prc{margin-top:10px}'
    + '#nivBar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 8px;padding:6px 8px;background:#fff;border:1px solid #d9cfbd;border-radius:12px;font:500 13px Inter,system-ui,sans-serif;color:#2b2216}'
    + '#nivBar button,#nivPro button.nb{min-width:38px;min-height:38px;padding:0 10px;border:1px solid #d9cbb0;border-radius:9px;background:#fff;font:600 13px Inter,system-ui,sans-serif;color:#2b2216;cursor:pointer}'
    + '#nivBar button:disabled,#nivPro button:disabled{opacity:.4;cursor:default}'
    + '#nivBar button:active:not(:disabled),#nivPro button.nb:active:not(:disabled){background:#f3e8d3}'
    + '#nivBar .sep{width:1px;align-self:stretch;background:#e7dcc8;margin:2px 2px}'
    + '#nivBar .z{min-width:52px;text-align:center;font-variant-numeric:tabular-nums}'
    + '#nivBar .dim{margin-left:auto;font-size:12px;color:#7a6d58;white-space:nowrap}'
    + '#nivPro{background:#fff;border:1px solid #d9cfbd;border-radius:12px;font:400 13.5px/1.45 Inter,system-ui,sans-serif;color:#2b2216;overflow:hidden}'
    + '#nivPro .tabs{display:flex;border-bottom:1px solid #e7dcc8;background:#faf6ee}'
    + '#nivPro .tabs button{flex:1;min-height:44px;border:0;border-bottom:2.5px solid transparent;background:transparent;font:600 13.5px Inter,system-ui,sans-serif;color:#7a6d58;cursor:pointer}'
    + '#nivPro .tabs button.on{color:#1a1206;border-bottom-color:#c9a24b;background:#fff}'
    + '#nivPieces{padding:10px 12px 12px}'
    + '#nivPro h4{margin:0 0 6px;font:700 11px Inter,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#7a6d58}'
    + '#nivListe{display:grid;gap:4px;margin:0 0 12px;max-height:210px;overflow:auto}'
    + '#nivListe button{display:flex;gap:9px;align-items:center;width:100%;min-height:44px;padding:6px 9px;border:1px solid #e7dcc8;border-radius:10px;background:#fff;text-align:left;font:inherit;color:inherit;cursor:pointer}'
    + '#nivListe button.on{border-color:#c9a24b;background:#fffaf0;box-shadow:inset 3px 0 0 #c9a24b}'
    + '#nivListe .ic{flex:none;width:26px;height:26px;border-radius:7px;background:#f3e8d3;display:flex;align-items:center;justify-content:center;font:700 12px Inter,system-ui,sans-serif;color:#7c6120}'
    + '#nivListe .tx{min-width:0;flex:1}#nivListe b{display:block;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#nivListe small{display:block;font-size:11.5px;color:#7a6d58;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '#nivListe .al{flex:none;font-size:11px;font-weight:700;color:#b4452f}'
    + '#nivVide{font-size:13px;color:#7a6d58;padding:8px 2px}'
    + '#nivProps{display:grid;gap:10px;border-top:1px solid #e7dcc8;padding-top:10px}'
    + '#nivProps label{display:block;font-size:12px;color:#7a6d58;min-width:0}'
    + '#nivProps input,#nivProps select{display:block;width:100%;box-sizing:border-box;min-width:0;min-height:40px;margin-top:3px;padding:7px 9px;border:1px solid #d9cbb0;border-radius:9px;background:#fff;font:500 14px Inter,system-ui,sans-serif;color:#1a1206}'
    + '#nivProps input:focus,#nivProps select:focus{outline:2px solid #c9a24b;outline-offset:1px}'
    + '#nivProps .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    + '#nivProps .mm{position:relative}#nivProps .mm input{padding-right:34px;font-variant-numeric:tabular-nums}#nivProps .mm i{position:absolute;right:10px;bottom:11px;font:normal 12px Inter,system-ui,sans-serif;color:#9a8c75;pointer-events:none}'
    + '#nivProps .rg{display:flex;gap:6px;flex-wrap:wrap;align-items:center}'
    + '#nivProps .rg span{font-size:12px;color:#7a6d58}'
    + '#nivProps .pas button.on{background:#1a1206;color:#fff;border-color:#1a1206}'
    + '#nivProps .note{font-size:12px;color:#7a6d58;margin:0}'
    + '#nivProps .dg{color:#b4452f;border-color:#e9b9ad}'
    + '#nivProps .alerte{font-size:12.5px;padding:7px 10px;border-radius:9px;background:#fdf1ee;border:1px solid #e9b9ad;color:#8a2d1c}'
    /* l'outil d'origine décolle l'aperçu quand la cliente arrive au résumé (transform + visibility posés à la main) : jamais dans l'éditeur */
    + 'body.niv-pro #stage{transform:none!important;visibility:visible!important}'
    + '@media (max-width:900px){body.niv-pro .sc-layout{display:block!important;padding-top:0}body.niv-pro .product-info{margin-top:8px}'
    + 'body.niv-pro .sc-left{display:block!important;position:sticky;top:0;z-index:30;background:#efeae1;padding:6px 0 4px}'
    + 'body.niv-pro .sc-stage{position:relative!important;top:auto!important;margin:0!important;border-radius:12px!important}'
    + 'body.niv-pro #stage{height:38vh}body.niv-pro #stage>svg#scene{max-height:none!important}'
    + '#nivBar{margin-bottom:6px;padding:5px 6px;gap:5px;flex-wrap:nowrap}#nivBar .dim,#nivBar .l{display:none}#nivBar button{font-size:16px}#nivListe{max-height:160px}}';

  var ad, at, sel = null, pas = 1, zoom = 1, pile = [], rang = -1, muet = false, tNote = null, tVue = null, quoi = '';

  /* L'encre d'un texte : une écriture anglaise laisse jusqu'à 1 mm de vide de chaque côté de sa « case » ; pour dire
     « à 12 mm du bord », il faut mesurer le trait lui-même (même méthode que les outils : mesure sur un canvas). */
  var CV = null;
  function encreTexte(t) {
    if (t.querySelector('textPath') || t.hasAttribute('transform') || t.hasAttribute('letter-spacing') || t.hasAttribute('textLength')) return null;
    var fs = parseFloat(t.getAttribute('font-size')), fam = t.getAttribute('font-family'), x = parseFloat(t.getAttribute('x')), y = parseFloat(t.getAttribute('y')), txt = t.textContent;
    if (!(fs > 0) || !fam || !isFinite(x) || !isFinite(y) || !txt || !txt.trim()) return null;
    for (var p = t.parentNode; p && p.id !== 'scene'; p = p.parentNode) if (p.hasAttribute && p.hasAttribute('transform')) return null;
    /* Tout est mesuré sur un canvas, en très grand (× 20) : la case que donne le navigateur pour un petit texte (getBBox) est
       faussée de plusieurs % par l'arrondi des lettres à l'écran, surtout sur téléphone ; le fichier, lui, est rendu en grand. */
    CV = CV || document.createElement('canvas').getContext('2d'); var K = 20, anc = t.getAttribute('text-anchor') || 'start', bl = t.getAttribute('dominant-baseline') || '';
    if (bl && bl !== 'central' && bl !== 'alphabetic' && bl !== 'auto') return null;
    CV.font = (t.getAttribute('font-weight') || '400') + ' ' + (fs * K) + 'px ' + fam; CV.textAlign = anc === 'middle' ? 'center' : anc === 'end' ? 'right' : 'left'; CV.textBaseline = 'alphabetic';
    try { if (document.fonts && document.fonts.check && !document.fonts.check(CV.font, txt)) return null; } catch (e) { /* on mesure quand même */ }
    var m = CV.measureText(txt); if (m.actualBoundingBoxLeft === undefined || m.fontBoundingBoxAscent === undefined) return null;
    var base = bl === 'central' ? y + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 / K : y;   // « central » = milieu entre le haut et le bas de l'écriture
    var sw = t.getAttribute('stroke') && t.getAttribute('stroke') !== 'none' ? (parseFloat(t.getAttribute('stroke-width')) || 0) / 2 : 0;
    return { x: x - m.actualBoundingBoxLeft / K - sw, y: base - m.actualBoundingBoxAscent / K - sw, width: (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / K + 2 * sw, height: (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / K + 2 * sw };
  }
  function boiteScene(id) {
    var n = ad.noeud(id); if (!n) return null;
    var ts = n.tagName === 'text' ? [n] : [].slice.call(n.querySelectorAll('text')), bb = null;
    if (ts.length && !(n.querySelector && n.querySelector('image'))) {   // plusieurs couches du même texte (fond, trait) : la plus large fait la pièce
      ts.forEach(function (t) { var e = encreTexte(t); if (e && (!bb || e.width > bb.width)) bb = e; });
    }
    if (!bb) { try { bb = n.getBBox(); } catch (e) { return null; } }
    return bb && (bb.width > 0 || bb.height > 0) ? bb : null;
  }
  function mesure(id) {
    var bb = boiteScene(id); if (!bb) return null;
    var g = ad.geo(); return { x: (bb.x - g.x) / g.u, y: (bb.y - g.y) / g.u, w: bb.width / g.u, h: bb.height / g.u };
  }
  function piece(id) { var L = ad.pieces(); for (var i = 0; i < L.length; i++) if (String(L[i].id) === String(id)) return L[i]; return null; }

  /* ---------- annuler / refaire ---------- */
  function noter() {
    if (muet) return; var s; try { s = JSON.stringify(at.etat()); } catch (e) { return; }
    if (s === pile[rang]) return;
    pile = pile.slice(0, rang + 1); pile.push(s); rang = pile.length - 1;
    var poids = pile.reduce(function (a, x) { return a + x.length; }, 0);
    while (pile.length > 2 && (pile.length > 80 || poids > 24e6)) { poids -= pile[0].length; pile.shift(); rang--; }
    boutons();
  }
  function revenir(d) {
    var r = rang + d; if (r < 0 || r >= pile.length) return;
    rang = r; muet = true; (at._charger || at.charger)(JSON.parse(pile[rang]));
    setTimeout(function () { muet = false; vue(true); }, 350); boutons();
  }
  function boutons() { var u = $('nivUndo'), r = $('nivRedo'); if (u) u.disabled = rang <= 0; if (r) r.disabled = rang >= pile.length - 1; }

  /* ---------- zoom ---------- */
  function cadrer() {
    var st = $('stage'), sv = $('scene'); if (!st || !sv || !st.clientWidth) return;
    var vb = sv.viewBox.baseVal, f = Math.min((st.clientWidth - 12) / vb.width, (st.clientHeight - 12) / vb.height);
    sv.style.width = Math.round(vb.width * f * zoom) + 'px'; sv.style.height = Math.round(vb.height * f * zoom) + 'px';
    var z = $('nivZ'); if (z) z.textContent = Math.round(zoom * 100) + ' %';
    var m = $('nivZm'), p = $('nivZp'); if (m) m.disabled = zoom <= 1; if (p) p.disabled = zoom >= 5;
  }
  function zoomer(z) {
    var st = $('stage'), cx = (st.scrollLeft + st.clientWidth / 2) / Math.max(1, st.scrollWidth), cy = (st.scrollTop + st.clientHeight / 2) / Math.max(1, st.scrollHeight);
    zoom = borne(z, 1, 5); cadrer();
    st.scrollLeft = cx * st.scrollWidth - st.clientWidth / 2; st.scrollTop = cy * st.scrollHeight - st.clientHeight / 2;
  }

  /* ---------- le panneau ---------- */
  var IC = { texte: 'T', dessin: '✦', photo: '▣', lettre: 'A' };
  function liste() {
    var L = ad.pieces(), h = '';
    L.forEach(function (p) {
      h += '<button type="button" data-id="' + esc(p.id) + '"' + (String(p.id) === String(sel) ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '><span class="ic">' + (IC[p.type] || '•') + '</span>'
        + '<span class="tx"><b>' + esc(p.nom) + '</b><small>' + esc(p.sous || '') + '</small></span>' + (p.flottant ? '<span class="al">ne tient pas</span>' : ad.alerte && ad.alerte(p.id) ? '<span class="al">dépasse</span>' : '') + '</button>';
    });
    $('nivListe').innerHTML = h || '<p id="nivVide">Aucune pièce pour l\'instant. Ajoutez un texte, un dessin ou une photo dans l\'onglet « Produit et ajouts ».</p>';
  }
  function champMm(id, lab) { return '<label class="mm">' + lab + '<input id="' + id + '" type="text" inputmode="decimal" autocomplete="off"><i>mm</i></label>'; }
  function proprietes(refaire) {
    var P = $('nivProps'), p = sel == null ? null : piece(sel);
    if (!p) { P.innerHTML = '<p class="note">Touchez une pièce dans la liste ou sur l\'aperçu pour la régler.</p>'; P.setAttribute('data-id', ''); return; }
    var m = mesure(p.id), rel = !m && ad.decalage, cle = p.id + '|' + (m ? 'm' : rel ? 'r' : 'x') + '|' + (p.texte !== undefined) + '|' + ad.pieces().length;
    if (refaire || P.getAttribute('data-id') !== cle) {
      var h = '';
      if (p.texte !== undefined) h += '<label>Texte<input id="nivTexte" type="text" maxlength="' + (p.max || 30) + '" autocomplete="off" autocapitalize="words" spellcheck="false"></label>';
      if (p.police !== undefined) h += '<label>' + ad.policeDe(p.id) + '<select id="nivPolice">' + ad.polices().map(function (q) { return '<option value="' + esc(q[0]) + '" style="font-family:' + esc(q[2]) + '">' + esc(q[1]) + '</option>'; }).join('') + '</select></label>';
      if (m) h += '<div><h4>Position, depuis le coin en haut à gauche</h4><div class="g2">' + champMm('nivX', 'Bord gauche') + champMm('nivY', 'Haut') + '</div></div>'
        + '<div><h4>Taille (proportions gardées)</h4><div class="g2">' + champMm('nivW', 'Largeur') + champMm('nivH', 'Hauteur') + '</div></div>';
      else if (rel) h += '<div><h4>Décalage par rapport à sa place d\'origine</h4><div class="g2">' + champMm('nivDX', 'Vers la droite') + champMm('nivDY', 'Vers le bas') + '</div></div>';
      else h += '<p class="note">Cette pièce n\'est pas dessinée pour l\'instant (gravure décochée ?).</p>';
      if (m || rel) {
        h += '<div><h4>Déplacer</h4><div class="rg"><button type="button" class="nb" data-n="g" aria-label="Vers la gauche">←</button><button type="button" class="nb" data-n="h" aria-label="Vers le haut">↑</button>'
          + '<button type="button" class="nb" data-n="b" aria-label="Vers le bas">↓</button><button type="button" class="nb" data-n="d" aria-label="Vers la droite">→</button>'
          + '<span>pas</span><span class="rg pas">' + [0.1, 0.5, 1, 5].map(function (v) { return '<button type="button" class="nb' + (v === pas ? ' on' : '') + '" data-pas="' + v + '">' + String(v).replace('.', ',') + '</button>'; }).join('') + '</span><span>mm</span></div></div>';
        h += '<div><h4>Agrandir ou réduire</h4><div class="rg"><button type="button" class="nb" data-s="0.95" aria-label="Plus petit">−</button><button type="button" class="nb" data-s="1.05" aria-label="Plus grand">+</button>'
          + (rel || ad.remettre ? '<label style="flex:0 0 92px" class="mm">Taille<input id="nivS" type="text" inputmode="decimal" autocomplete="off"><i>%</i></label>' : '')
          + (ad.remettre ? '<button type="button" class="nb" data-r="1">↺ Place d\'origine</button>' : '') + '</div></div>';
      }
      if (m && ad.centrable) h += '<div><h4>Centrer dans ' + esc(ad.produit.toLowerCase()) + '</h4><div class="rg"><button type="button" class="nb" data-c="x">↔ En largeur</button><button type="button" class="nb" data-c="y">↕ En hauteur</button></div></div>';
      var autres = ad.pieces().filter(function (q) { return String(q.id) !== String(p.id) && mesure(q.id); });
      if (m && autres.length) h += '<div><h4>Aligner sur une autre pièce</h4><label>Pièce de référence<select id="nivRef">' + autres.map(function (q) { return '<option value="' + esc(q.id) + '">' + esc(q.nom) + '</option>'; }).join('') + '</select></label>'
        + '<div class="rg" style="margin-top:6px"><button type="button" class="nb" data-a="g">Bords gauches</button><button type="button" class="nb" data-a="cx">Centres ↔</button><button type="button" class="nb" data-a="d">Bords droits</button>'
        + '<button type="button" class="nb" data-a="h">Hauts</button><button type="button" class="nb" data-a="cy">Milieux ↕</button><button type="button" class="nb" data-a="b">Bas</button></div></div>';
      h += '<div class="alerte" id="nivAl" role="status" hidden></div>';
      if (ad.retirable) h += '<div class="rg"><button type="button" class="nb dg" data-x="1">Retirer cette pièce</button></div>';
      var av = document.activeElement, avId = av && P.contains(av) ? av.id : '', avV = avId ? av.value : '', avC = avId && av.selectionStart != null ? av.selectionStart : null;
      P.innerHTML = h; P.setAttribute('data-id', cle);
      if (avId && $(avId)) { var nv = $(avId); nv.value = avV; nv.focus(); if (avC != null) { try { nv.setSelectionRange(avC, avC); } catch (e) { /* champ sans curseur */ } } }
    }
    var act = document.activeElement, poser = function (id, v) { var e = $(id); if (e && e !== act) e.value = v; };
    var al = $('nivAl'), msg = ad.alerte ? ad.alerte(p.id) : ''; if (al) { al.textContent = msg; al.hidden = !msg; }
    if (p.texte !== undefined) poser('nivTexte', p.texte || '');
    if (p.police !== undefined) poser('nivPolice', p.police || '');
    if (m) { poser('nivX', fr(m.x)); poser('nivY', fr(m.y)); poser('nivW', fr(m.w)); poser('nivH', fr(m.h)); }
    if (ad.decalage && ($('nivDX') || $('nivS'))) { var d = ad.decalage(p.id); poser('nivDX', fr(d.dx)); poser('nivDY', fr(d.dy)); poser('nivS', String(Math.round(d.s * 100))); }
  }
  function cadreSel() {
    var sv = $('scene'), g = $('nivSel');
    if (!ad.cadre) { if (g) g.remove(); return; }
    var bb = sel == null ? null : boiteScene(sel);
    if (!bb || !(bb.width > 0)) { if (g) g.innerHTML = ''; return; }
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'nivSel'; g.setAttribute('pointer-events', 'none'); sv.appendChild(g); }
    var m = 2.2, c = bb.x - m + ' ' + (bb.y - m) + ' ' + (bb.width + 2 * m) + ' ' + (bb.height + 2 * m);
    if (g.getAttribute('data-c') === c) return; g.setAttribute('data-c', c);
    g.innerHTML = '<rect x="' + (bb.x - m) + '" y="' + (bb.y - m) + '" width="' + (bb.width + 2 * m) + '" height="' + (bb.height + 2 * m) + '" rx="2" fill="none" stroke="#fff" stroke-width="1.6"/>'
      + '<rect x="' + (bb.x - m) + '" y="' + (bb.y - m) + '" width="' + (bb.width + 2 * m) + '" height="' + (bb.height + 2 * m) + '" rx="2" fill="none" stroke="#b07d1a" stroke-width=".9" stroke-dasharray="4 3"/>';
  }
  function vue(refaire) {
    var c = ad.choisi(); if (c != null && String(c) !== String(sel) && piece(c)) { sel = c; refaire = true; }
    if (sel != null && !piece(sel)) { sel = null; refaire = true; }
    liste(); proprietes(refaire); cadreSel();
    var g = ad.geo(), d = $('nivDim'); if (d) d.textContent = ad.produit + ' : ' + fr(g.w) + ' × ' + fr(g.h) + ' mm';
  }
  var enFrappe = false;
  function appliquer(fn, frappe) {
    if (!frappe && enFrappe) { clearTimeout(tNote); noter(); enFrappe = false; }   // le texte tapé juste avant garde sa propre ligne d'historique
    fn(); ad.redessiner(); vue(false); clearTimeout(tNote);
    if (frappe) { enFrappe = true; tNote = setTimeout(function () { enFrappe = false; noter(); }, 700); } else noter();
  }
  function choisir(id) { sel = id; ad.choisir(id); ad.redessiner(); vue(true); }

  /* poser une mesure en mm : on relit la pièce après le dessin (l'outil peut la retenir contre un bord ou une fente) */
  function poserMm(champ, v) {
    var m = mesure(sel), u = ad.geo().u; if (!m || v == null) { vue(false); return; }
    if ((champ === 'w' || champ === 'h') && !(v > 0.5)) { vue(false); return; }
    appliquer(function () {
      for (var n = 0; n < 4; n++) {
        var c = mesure(sel); if (!c) break;
        var ecart = champ === 'x' ? v - c.x : champ === 'y' ? v - c.y : champ === 'w' ? v - c.w : v - c.h; if (Math.abs(ecart) < 0.03) break;
        if (champ === 'x') ad.bouger(sel, ecart * u, 0); else if (champ === 'y') ad.bouger(sel, 0, ecart * u);
        else if (champ === 'w' && c.w > 0) ad.grossir(sel, v / c.w); else if (champ === 'h' && c.h > 0) ad.grossir(sel, v / c.h);
        ad.redessiner();
      }
    });
  }

  function brancher() {
    $('nivListe').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-id]'); if (b) choisir(b.getAttribute('data-id')); });
    var P = $('nivProps');
    P.addEventListener('input', function (ev) {
      var t = ev.target; if (sel == null) return;
      if (t.id === 'nivTexte') appliquer(function () { ad.texte(sel, t.value); }, true);
    });
    P.addEventListener('change', function (ev) {
      var t = ev.target, v = lire(t.value); if (sel == null) return;
      if (t.id === 'nivPolice') appliquer(function () { ad.police(sel, t.value); });
      else if (t.id === 'nivX') poserMm('x', v); else if (t.id === 'nivY') poserMm('y', v);
      else if (t.id === 'nivW') poserMm('w', v); else if (t.id === 'nivH') poserMm('h', v);
      else if (t.id === 'nivDX' || t.id === 'nivDY') { var d = ad.decalage(sel), u = ad.geo().u; if (v == null) return vue(false); appliquer(function () { ad.bouger(sel, t.id === 'nivDX' ? (v - d.dx) * u : 0, t.id === 'nivDY' ? (v - d.dy) * u : 0); }); }
      else if (t.id === 'nivS') { var d2 = ad.decalage ? ad.decalage(sel) : null; if (v == null || !d2 || v < 10) return vue(false); appliquer(function () { ad.grossir(sel, v / 100 / d2.s); }); }
    });
    P.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') ev.target.blur(); });
    P.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b || sel == null) return; var u = ad.geo().u, m = mesure(sel), g = ad.geo();
      if (b.hasAttribute('data-n')) { var n = b.getAttribute('data-n'); appliquer(function () { ad.bouger(sel, (n === 'g' ? -pas : n === 'd' ? pas : 0) * u, (n === 'h' ? -pas : n === 'b' ? pas : 0) * u); }); }
      else if (b.hasAttribute('data-pas')) { pas = +b.getAttribute('data-pas'); proprietes(true); }
      else if (b.hasAttribute('data-s')) { var f = +b.getAttribute('data-s'); appliquer(function () { ad.grossir(sel, f); }); }
      else if (b.hasAttribute('data-r')) appliquer(function () { ad.remettre(sel); });
      else if (b.hasAttribute('data-c') && m) { var ax = b.getAttribute('data-c'); appliquer(function () { if (ax === 'x') ad.bouger(sel, ((g.w - m.w) / 2 - m.x) * u, 0); else ad.bouger(sel, 0, ((g.h - m.h) / 2 - m.y) * u); }); }
      else if (b.hasAttribute('data-a') && m) {
        var r = mesure(($('nivRef') || {}).value), k = b.getAttribute('data-a'); if (!r) return;
        var dx = k === 'g' ? r.x - m.x : k === 'd' ? r.x + r.w - m.x - m.w : k === 'cx' ? r.x + r.w / 2 - m.x - m.w / 2 : 0, dy = k === 'h' ? r.y - m.y : k === 'b' ? r.y + r.h - m.y - m.h : k === 'cy' ? r.y + r.h / 2 - m.y - m.h / 2 : 0;
        appliquer(function () { ad.bouger(sel, dx * u, dy * u); });
      } else if (b.hasAttribute('data-x')) {
        if (b.getAttribute('data-x') === '1') { b.setAttribute('data-x', '2'); b.textContent = 'Toucher encore pour retirer'; setTimeout(function () { if (b.isConnected) { b.setAttribute('data-x', '1'); b.textContent = 'Retirer cette pièce'; } }, 3500); }
        else { var id = sel; sel = null; appliquer(function () { ad.retirer(id); }); }
      }
    });
    $('nivBar').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.id === 'nivUndo') revenir(-1); else if (b.id === 'nivRedo') revenir(1);
      else if (b.id === 'nivZm') zoomer(zoom <= 1.5 ? 1 : zoom <= 2 ? 1.5 : zoom - 1); else if (b.id === 'nivZp') zoomer(zoom < 1.5 ? 1.5 : zoom < 2 ? 2 : zoom + 1);
      else if (b.id === 'nivZ0') zoomer(1);
    });
    $('nivPro').querySelector('.tabs').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return; var r = b.getAttribute('data-t') === 'r';
      document.body.classList.toggle('niv-reglages', r);
      [].forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      if (r) { var o = window.scAtelier || window.abAtelier; if (o && o.maj) o.maj(); } else vue(true);
    });
    /* tout ce que l'outil redessine (geste au doigt, réglage de l'onglet « Produit et ajouts ») met le panneau et l'historique à jour */
    new MutationObserver(function (recs) {
      if (muet) return;
      var g = $('nivSel'); if (g && recs.every(function (r) { return r.target === g || g.contains(r.target) || (r.target === $('scene') && [].every.call(r.addedNodes, function (x) { return x === g; }) && !r.removedNodes.length); })) return;
      clearTimeout(tVue); tVue = setTimeout(function () { vue(false); }, 120);
      if (!document.activeElement || document.activeElement.id !== 'nivTexte') { clearTimeout(tNote); tNote = setTimeout(noter, 500); }
    }).observe($('scene'), { childList: true, subtree: true, attributes: true, attributeFilter: ['x', 'y', 'd', 'transform', 'font-size', 'href'] });
    $('scene').addEventListener('click', function (ev) { var id = ad.clicScene(ev); if (id !== undefined && piece(id)) choisir(id); });
    window.addEventListener('resize', cadrer);
    document.addEventListener('keydown', function (ev) {
      var dans = /^(INPUT|TEXTAREA|SELECT)$/.test((ev.target || {}).tagName || '');
      if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'z' || ev.key === 'Z')) { if (dans) return; ev.preventDefault(); revenir(ev.shiftKey ? 1 : -1); return; }
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || ev.key === 'Y')) { if (dans) return; ev.preventDefault(); revenir(1); return; }
      if (dans || sel == null || document.body.classList.contains('niv-reglages')) return;
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key]; if (!d) return;
      if (!mesure(sel) && !ad.decalage) return;
      ev.preventDefault(); var u = ad.geo().u, q = ev.shiftKey ? pas * 5 : pas; appliquer(function () { ad.bouger(sel, d[0] * q * u, d[1] * q * u); });
    });
  }

  function demarrer(q) {
    if (ad) return; quoi = q; at = window.nivAtelier; ad = adaptateur(q);
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var gauche = document.querySelector('.sc-left'), droite = document.querySelector('.product-info'); if (!gauche || !droite || !$('stage') || !$('scene')) return;
    var bar = document.createElement('div'); bar.id = 'nivBar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Outils de l\'éditeur');
    bar.innerHTML = '<button type="button" id="nivUndo" aria-label="Annuler le dernier geste" title="Annuler (Ctrl + Z)">↶<span class="l"> Annuler</span></button><button type="button" id="nivRedo" aria-label="Refaire" title="Refaire (Ctrl + Y)">↷<span class="l"> Refaire</span></button><span class="sep"></span>'
      + '<button type="button" id="nivZm" aria-label="Dézoomer">−</button><span class="z" id="nivZ" aria-live="polite">100 %</span><button type="button" id="nivZp" aria-label="Zoomer">+</button><button type="button" id="nivZ0" aria-label="Tout voir">⤢<span class="l"> Tout voir</span></button><span class="dim" id="nivDim"></span>';
    gauche.insertBefore(bar, gauche.firstChild);
    var pro = document.createElement('div'); pro.id = 'nivPro';
    pro.innerHTML = '<div class="tabs" role="tablist"><button type="button" class="on" role="tab" aria-selected="true" data-t="p">Pièces</button><button type="button" role="tab" aria-selected="false" data-t="r">Produit et ajouts</button></div>'
      + '<div id="nivPieces"><h4>Les pièces</h4><div id="nivListe"></div><div id="nivProps"></div></div>';
    droite.insertBefore(pro, droite.firstChild);
    document.body.classList.add('niv-pro');
    brancher(); cadrer(); vue(true); noter();
    setTimeout(function () { cadrer(); vue(true); }, 400);
  }
  /* après un rechargement de création par Gestion (commande) : l'historique repart de là */
  function repartir() { pile = []; rang = -1; sel = null; setTimeout(function () { noter(); vue(true); cadrer(); }, 300); }

  window.NivEditeur = { demarrer: demarrer, repartir: repartir, _mesure: function (id) { return mesure(id); }, _etat: function () { return { sel: sel, rang: rang, pile: pile.length, zoom: zoom }; } };
})();
