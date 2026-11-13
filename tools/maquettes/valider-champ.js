/* Bouton « OK ✓ » DANS le champ où l'on écrit (téléphone) — 13/11/2026.
   Le gérant : « dès que le clavier apparaît, l'aperçu est coupé… il faut un bouton à côté du nom pour valider, pour que le
   clavier disparaisse tout de suite ; les clients ne vont pas chercher le bouton ». Le bouton apparaît au bout du champ dès qu'on
   y écrit ; le toucher (ou la touche Entrée) valide et range le clavier. Rien n'est changé dans la page : un seul bouton flottant,
   posé sur le champ en cours. À écrire en fin de page de CHAQUE créateur (tools/maquettes/ajouter-valider.py). */
(function () {
  if (window.__nivOk) return; window.__nivOk = 1;
  var tactile = function () { return (window.matchMedia && matchMedia('(pointer:coarse)').matches) || window.innerWidth < 760; };
  var st = document.createElement('style'), b = document.createElement('button'), cur = null, pad = null, boucle = 0;
  st.textContent = '.niv-ok{position:fixed;z-index:2147483000;display:none;align-items:center;justify-content:center;min-width:62px;padding:0 12px;border:0;border-radius:9px;'
    + 'background:linear-gradient(135deg,#e2c67e,#c9a24b);color:#1a1206;font:700 15px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 1px 5px rgba(0,0,0,.28);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}'
    + '.niv-ok.on{display:inline-flex}';
  b.type = 'button'; b.className = 'niv-ok'; b.textContent = 'OK ✓'; b.setAttribute('aria-label', 'Valider et fermer le clavier');
  function champ(el) { if (!el || el.disabled || el.readOnly) return false; if (el.tagName === 'TEXTAREA') return true; if (el.tagName !== 'INPUT') return false;
    return ['text', 'search', 'tel', 'number', 'email', 'url'].indexOf((el.getAttribute('type') || 'text').toLowerCase()) >= 0; }
  /* Le champ est-il vraiment visible ? Non s'il est sorti de l'écran ou passé SOUS un bloc collé (l'aperçu qui reste en haut) :
     le bouton se cache alors, au lieu de rester posé par-dessus l'aperçu (capture du gérant, 13/11/2026). */
  function visible(r) {
    var H = window.innerHeight || document.documentElement.clientHeight, W = window.innerWidth || document.documentElement.clientWidth;
    if (r.width < 2 || r.height < 2 || r.bottom < 6 || r.top > H - 6 || r.right < 6 || r.left > W - 6) return false;
    var y = Math.max(1, Math.min(H - 1, r.top + r.height / 2)), xs = [r.left + 10, r.left + r.width * .35], i, e;
    for (i = 0; i < xs.length; i++) { e = document.elementFromPoint(Math.max(1, Math.min(W - 1, xs[i])), y);
      if (e && (e === cur || cur.contains(e) || e.contains(cur) && e.getBoundingClientRect().height <= r.height + 30)) return true; }
    return false; }
  function placer() { if (!cur) return; if (!document.contains(cur)) { fermer(); return; } var r = cur.getBoundingClientRect(), h = Math.max(30, Math.min(r.height - 8, 42)), w = b.offsetWidth || 62;
    if (!visible(r)) { b.style.visibility = 'hidden'; boucle = requestAnimationFrame(placer); return; }
    b.style.visibility = '';
    b.style.height = h + 'px'; b.style.left = Math.round(r.right - w - 4) + 'px'; b.style.top = Math.round(cur.tagName === 'TEXTAREA' ? r.bottom - h - 4 : r.top + (r.height - h) / 2) + 'px';
    boucle = requestAnimationFrame(placer); }
  function ouvrir(el) { if (cur === el) return; fermer(); if (!tactile() || el.getBoundingClientRect().width < 120) return; cur = el; pad = el.style.paddingRight; el.style.paddingRight = '74px'; b.classList.add('on'); placer(); }
  function fermer() { if (!cur) return; cancelAnimationFrame(boucle); try { cur.style.paddingRight = pad || ''; } catch (e) {} cur = null; b.classList.remove('on'); b.style.visibility = ''; }
  function valider() { var el = cur; if (!el) return; fermer(); el.blur(); }
  b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); });
  b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
  b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); valider(); });
  document.addEventListener('focusin', function (ev) { if (champ(ev.target)) ouvrir(ev.target); else fermer(); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (cur && document.activeElement !== cur) fermer(); }, 0); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && cur && cur.tagName === 'INPUT') setTimeout(valider, 0); });
  function poser() { document.head.appendChild(st); document.body.appendChild(b); if (champ(document.activeElement)) ouvrir(document.activeElement); }
  if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);
})();
