#!/usr/bin/env python3
"""Maquette « Tout le cristal » — 09/10/2026 soir.

Gérant : « tu me rassembles tout ce qui est bloc cristal, même gravé, vertical, horizontal, tu me montres une maquette ».
Une page à onglets qui montre, SANS LES MODIFIER, les quatre maquettes cristal déjà faites :
  ① la page Cristal photo 3D (/cristaux)          → cristaux-blocs.html
  ② les cristaux déjà gravés (nouvelle page)       → cristaux-graves.html
  ③ la fiche Cristal photo 3D — Vertical          → fiche-cristal-vertical.html
  ④ la fiche Cristal photo 3D — Horizontal        → fiche-cristal-horizontal.html
Chaque maquette est chargée dans un cadre (iframe) ; dans la page Cristal photo 3D, toucher « Vertical » ou « Horizontal »
ouvre l'onglet de la fiche, comme le ferait le vrai site. Sortie : docs/maquettes/cristal-tout.html (page d'onglets) ;
les quatre fichiers sont publiés à côté d'elle dans le même artifact. Rien n'est touché dans le site.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "docs", "maquettes")
ONGLETS = [
    ("cristaux", "Page Cristal photo 3D", "cristaux-blocs.html"),
    ("graves", "Cristaux déjà gravés", "cristaux-graves.html"),
    ("vertical", "Fiche verticale", "fiche-cristal-vertical.html"),
    ("horizontal", "Fiche horizontale", "fiche-cristal-horizontal.html"),
]
for _, _, f in ONGLETS:
    assert os.path.exists(os.path.join(OUT, f)), f

BOUTONS = "".join(
    f'<button type="button" role="tab" class="ct-tab{" on" if i == 0 else ""}" data-k="{k}" aria-selected="{"true" if i == 0 else "false"}">'
    f'<span class="ct-n">{i + 1}</span>{lab}</button>' for i, (k, lab, _) in enumerate(ONGLETS))
CADRES = "".join(
    f'<iframe class="ct-frame{" on" if i == 0 else ""}" data-k="{k}" title="{lab}" {"src" if i == 0 else "data-src"}="{f}"></iframe>'
    for i, (k, lab, f) in enumerate(ONGLETS))

HTML = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tout le cristal — Niv Création (maquette)</title>
<style>
:root{{--ink:#1a1206;--ink2:#241a0c;--gold:#c9a24b;--gold-l:#e2c67e;--cream:#fbf7ee;--sand:#f3e8d3;--muted:#6b5f4b}}
*{{box-sizing:border-box}}
html,body{{margin:0;height:100%;background:var(--cream);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink)}}
body{{display:flex;flex-direction:column}}
.ct-bar{{flex:none;background:var(--ink2);color:#fff;padding:10px 12px 0;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:2}}
.ct-t{{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:0 4px 8px;font-size:.8rem;color:#d9ccb0}}
.ct-t b{{color:var(--gold-l);font-weight:600;font-size:.92rem}}
.ct-tabs{{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:10px}}
.ct-tabs::-webkit-scrollbar{{display:none}}
.ct-tab{{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid rgba(226,198,126,.35);border-radius:14px;background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;white-space:nowrap}}
.ct-tab.on{{background:var(--gold);border-color:var(--gold);color:var(--ink)}}
.ct-n{{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:rgba(226,198,126,.2);color:var(--gold-l);font-size:.75rem}}
.ct-tab.on .ct-n{{background:var(--ink);color:var(--gold-l)}}
.ct-zone{{flex:1;position:relative;min-height:0}}
.ct-frame{{position:absolute;inset:0;width:100%;height:100%;border:0;display:none;background:#fff}}
.ct-frame.on{{display:block}}
@media (max-width:480px){{.ct-t span{{display:none}}}}
</style></head><body>
<header class="ct-bar">
  <div class="ct-t"><b>Maquette — tout le cristal</b><span>Rien n'est en ligne · touchez un onglet</span></div>
  <nav class="ct-tabs" role="tablist" aria-label="Pages cristal">{BOUTONS}</nav>
</header>
<main class="ct-zone">{CADRES}</main>
<script>
(function(){{
  var tabs=[].slice.call(document.querySelectorAll('.ct-tab')),frames=[].slice.call(document.querySelectorAll('.ct-frame'));
  function ouvre(k){{
    tabs.forEach(function(t){{var on=t.dataset.k===k;t.classList.toggle('on',on);t.setAttribute('aria-selected',on)}});
    frames.forEach(function(f){{var on=f.dataset.k===k;if(on&&f.dataset.src&&!f.getAttribute('src'))f.src=f.dataset.src;f.classList.toggle('on',on)}});
    var t=tabs.filter(function(x){{return x.dataset.k===k}})[0];if(t)t.scrollIntoView({{inline:'nearest',block:'nearest'}});
  }}
  tabs.forEach(function(t){{t.addEventListener('click',function(){{ouvre(t.dataset.k)}})}});
  // Dans la page Cristal photo 3D : « Vertical » / « Horizontal » ouvrent la fiche, comme sur le vrai site.
  var p=frames[0];
  function relie(){{try{{var d=p.contentDocument;[].forEach.call(d.querySelectorAll('a.cg-tile'),function(a){{var l=(a.getAttribute('aria-label')||'').toLowerCase();
    var k=l.indexOf('vertical')>=0?'vertical':l.indexOf('horizontal')>=0?'horizontal':null;
    if(k)a.addEventListener('click',function(e){{e.preventDefault();ouvre(k)}})}})}}catch(e){{}}}}
  p.addEventListener('load',relie);if(p.contentDocument&&p.contentDocument.readyState==='complete')relie();
}})();
</script></body></html>'''
open(os.path.join(OUT, "cristal-tout.html"), "w", encoding="utf-8").write(HTML)
print("ok", len(HTML), "octets")
