# -*- coding: utf-8 -*-
"""Maquette « plusieurs verres, une seule photo » (16/10/2026, cas 0E3Y9OBX).
Usage : python3 tools/maquettes/plusieurs-photos.py <fiche-pc.html capturée> <dossier .next/static/css> <photo exemple> <sortie.html>
La fiche est le VRAI rendu de /produit/verre-a-vin-grave (47 cl, À l'unité, mode photo, quantité 2) servi par next start.
Trois idées affichées au choix + l'alerte côté Gestion (carte de la file de production)."""
import sys, re, os, io, base64, html as H
from PIL import Image

src, cssdir, photo, out = sys.argv[1:5]
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "public")
page = open(src, encoding="utf-8").read()
main = re.search(r"<main.*?</main>", page, re.S).group(0)

def uri(path, w=700):
    im = Image.open(path).convert("RGB"); im.thumbnail((w, w))
    b = io.BytesIO(); im.save(b, "JPEG", quality=72)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

def img_src(m):
    s = m.group(1)
    if s.startswith("/produits/"):
        p = os.path.join(ROOT, s.lstrip("/"))
        if os.path.exists(p): return 'src="%s"' % uri(p)
    return 'src=""'
main = re.sub(r'\ssrcset="[^"]*"', "", main)
main = re.sub(r'src="([^"]+)"', img_src, main)
main = re.sub(r"<script.*?</script>", "", main, flags=re.S)
PH = uri(photo, 300)

# Photo « envoyée » (état après téléversement), bouton actif, résumé complet
main = main.replace('<div class="photo-upload"><label class="photo-dropzone"><input accept="image/*" hidden="" type="file">Choisir une photo</label></div>',
    '<div class="photo-upload"><div class="mq-up"><img src="%s" alt=""><span><b>Photo envoyée ✓</b><small>dessin-couple.jpg</small></span><span class="mq-chg">Changer</span></div></div>' % PH, 1)
main = main.replace('<b class="prc-miss">Ma photo ou mon logo — à compléter</b>', '<b>Ma photo ou mon logo</b>', 1)
main = main.replace('<button class="btn btn-gold prc-off" style="flex:1" disabled="">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', 1)
main = main.replace('<p class="prc-addhint">Ajoutez votre photo ou votre logo (étape 2).</p>', "", 1)

# IDÉE 1 — encadré sous la quantité
IDEE1 = ('<div class="mq mq-1"><b>📷 Vos 2 verres sont différents ?</b>'
         '<p>Une photo par verre (par exemple une photo et un logo) : prenez le <b>Lot de 2</b> puis « Chacun différent ». '
         'C’est aussi moins cher : <b>39,90 €</b> au lieu de <b>43,80 €</b>.</p>'
         '<button type="button" class="btn btn-outline mq-lot">Passer au lot de 2</button></div>')
# IDÉE 2 — « Chacun différent » proposé sur À l'unité quand la quantité dépasse 1
IDEE2 = ('<div class="perglass mq mq-2"><div class="pg-choice"><button type="button" class="pg-opt">Les 2 identiques</button>'
         '<button type="button" class="pg-opt on">Chacun différent</button></div>'
         '<div class="pg-tabs"><button type="button" class="pg-tab on">Verre 1</button><button type="button" class="pg-tab">Verre 2</button></div>'
         '<p class="pg-hint">Vous configurez le <b>Verre 1</b> — passez d’un verre à l’autre avec les onglets. Chaque verre garde sa photo.</p></div>')
IDEE2_BAS = '<p class="mq mq-2 mq-2bas">2 verres : une photo pour chacun avec « Chacun différent », plus haut.</p>'

i = main.find('<section class="prc-step">')
main = main[:i] + IDEE2 + main[i:]
j = main.find('<div class="qty-row">'); k = main.find('<button type="button" class="fav-ligne"', j)
main = main[:k] + IDEE1 + IDEE2_BAS + main[k:]

css = "".join(open(os.path.join(cssdir, f), encoding="utf-8").read() for f in sorted(os.listdir(cssdir)) if f.endswith(".css"))

# IDÉE 3 — l'alerte dans Gestion → File de production (vraies classes .file-*)
CARTE = '''<div class="file-card mq-alerte-carte">
  <div class="file-card-top"><div><span class="file-pos">1</span><span class="file-ref">#0E3Y9OBX</span>
    <span class="dash-chip prep" style="margin-left:8px">À préparer</span></div>
    <div style="text-align:right"><div style="font-weight:800">47,72 €</div><div class="file-age">il y a 2 h · 10/10/2026</div></div></div>
  <div class="mq-alerte">⚠️ <b>2 verres, 1 seule photo</b> — la cliente a pris « À l’unité » × 2. Vérifier avec elle si les deux verres
    portent la même photo avant de graver.</div>
  <div class="file-who"><strong>Fabien Guiblet</strong> <span>· Livraison à domicile</span></div>
  <ul class="file-items"><li><span class="q">2×</span><span>Verre à vin gravé<span class="d">47 cl · À l’unité</span>
    <span class="d">✍️ Gravure : Ma photo ou mon logo · 1 photo pour 2 verres</span></span></li></ul>
</div>'''
FICHE = '''<div class="mq-fiche"><div class="mq-fiche-h">Fiche atelier — #0E3Y9OBX</div>
  <div class="mq-alerte">⚠️ <b>2 verres, 1 seule photo</b> : ne pas graver avant d’avoir vérifié avec la cliente.</div>
  <p class="mq-small">Même encadré en tête de la fiche imprimée, pour ne pas graver deux fois la même image par erreur.</p></div>'''
GESTION = '''<div class="mq-g"><h2>Dans Gestion → File de production</h2>
<p class="mq-small">L’alerte apparaît toute seule quand une commande a <b>plusieurs pièces avec photo</b> (verres, cristaux, carafes, puzzles photo…)
mais <b>une seule photo enregistrée</b>. Elle ne prévient pas la cliente : c’est un rappel pour toi.</p>
<div class="mq-gcols"><div>%s</div><div>%s</div></div>
<p class="mq-small">Dans les commandes déjà reçues, ce cas n’est arrivé qu’une fois (0E3Y9OBX). Les lots « Chacun différent » (ex. Olivier Chesta, 4 photos) ne déclenchent rien.</p></div>''' % (CARTE, FICHE)

MQCSS = '''
:root{--mq-gold:#a98935;--mq-cream:#fbf7ee;--mq-ink:#1a1206}
body{background:var(--mq-cream);margin:0}
.mq-bar{position:sticky;top:0;z-index:50;background:#1a1206;color:#f3e8d3;padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:600 .85rem/1.3 system-ui,sans-serif}
.mq-bar span{margin-right:6px;color:#e2c67e}
.mq-bar button{border:1px solid rgba(226,198,126,.5);background:none;color:#f3e8d3;border-radius:999px;padding:8px 14px;font:inherit;cursor:pointer;min-height:40px}
.mq-bar button.on{background:#c9a24b;border-color:#c9a24b;color:#1a1206}
.mq-intro{max-width:1100px;margin:14px auto 0;padding:0 16px;font:.9rem/1.5 system-ui,sans-serif;color:#5a4a33}
.mq{display:none}
body[data-v="1"] .mq-1,body[data-v="2"] .mq-2{display:block}
body[data-v="3"] main{display:none}
.mq-g{display:none;max-width:1100px;margin:20px auto 40px;padding:0 16px;font-family:system-ui,sans-serif}
body[data-v="3"] .mq-g{display:block}
.mq-g h2{font:normal 1.5rem Georgia,serif;color:#a98935;margin:0 0 6px}
.mq-gcols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;margin:14px 0}
@media (max-width:760px){.mq-gcols{grid-template-columns:1fr}}
.mq-small{font-size:.85rem;color:#5a4a33;line-height:1.5}
.mq-1{margin:12px 0;padding:14px 16px;border-radius:14px;background:#fff6dd;border:1px solid #e2c67e}
.mq-1 > b{display:block;margin-bottom:4px}
.mq-1 p{margin:0 0 10px;font-size:.88rem;line-height:1.5}
.mq-2bas{margin:8px 0 0;font-size:.82rem;color:#a98935;font-weight:600}
.mq-up{display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #e9dcc0;border-radius:12px;background:#fff}
.mq-up img{width:54px;height:54px;object-fit:cover;border-radius:8px}
.mq-up small{display:block;color:#7a6a52;font-size:.78rem}
.mq-chg{margin-left:auto;font-size:.8rem;text-decoration:underline;color:#a98935}
.mq-alerte{margin:10px 0;padding:10px 12px;border-radius:10px;background:#fdecec;border:1px solid #e3a3a3;color:#7a1f1f;font-size:.86rem;line-height:1.45}
.mq-alerte-carte{max-width:520px}
.mq-fiche{background:#fff;border:1px solid #e9dcc0;border-radius:14px;padding:14px}
.mq-fiche-h{font:normal 1.1rem Georgia,serif;color:#1a1206;border-bottom:2px solid #1a1206;padding-bottom:6px}
'''
JS = '''<script>
(function(){var b=document.body,q=document.querySelector(".qty-stepper span"),t=document.querySelectorAll(".pd-totbox .val, .prc-sumtot b");
function set(v){b.dataset.v=v;document.querySelectorAll(".mq-bar button").forEach(function(x){x.classList.toggle("on",x.dataset.v==v)})}
document.querySelectorAll(".mq-bar button").forEach(function(x){x.onclick=function(){set(x.dataset.v);window.scrollTo(0,0)}});
function maj(n){q.textContent=n;t.forEach(function(e){e.textContent=(21.9*n).toFixed(2).replace(".",",")+"\\u00a0€"});
document.querySelectorAll(".mq-1,.mq-2").forEach(function(e){e.style.visibility=n>1?"":"hidden"})}
var bt=document.querySelectorAll(".qty-stepper button");bt[0].onclick=function(){maj(Math.max(1,+q.textContent-1))};bt[1].onclick=function(){maj(+q.textContent+1)};
document.querySelectorAll(".pg-opt").forEach(function(o){o.onclick=function(){document.querySelectorAll(".pg-opt").forEach(function(x){x.classList.remove("on")});o.classList.add("on")}});
document.querySelectorAll(".pg-tab").forEach(function(o,i){o.onclick=function(){document.querySelectorAll(".pg-tab").forEach(function(x){x.classList.remove("on")});o.classList.add("on");document.querySelector(".pg-hint b").textContent="Verre "+(i+1)}});
var lot=document.querySelector(".mq-lot");if(lot)lot.onclick=function(){lot.outerHTML='<p class="mq-small"><b>Sur le site :</b> la fiche passe sur « Lot de 2 », quantité 1, et le choix « Chacun différent » s’ouvre, une photo par verre.</p>'};
set("1");})();
</script>'''

doc = ('<title>Plusieurs verres, une photo</title><style>%s%s</style>'
       '<div class="mq-bar"><span>Maquette · 1 seule photo pour 2 verres</span>'
       '<button data-v="1">Idée 1 · encadré</button><button data-v="2">Idée 2 · chacun différent</button><button data-v="3">Idée 3 · alerte Gestion</button></div>'
       '<p class="mq-intro">Vrai rendu de la fiche verre à vin : 47 cl, « À l’unité », mode photo, quantité 2 (le cas de la commande 0E3Y9OBX). '
       'Change la quantité avec − / + : les idées 1 et 2 n’apparaissent qu’à partir de 2 verres.</p>'
       '%s%s%s') % (css, MQCSS, main, GESTION, JS)
open(out, "w", encoding="utf-8").write(doc)
print("ok", out, round(len(doc) / 1024), "Ko")
