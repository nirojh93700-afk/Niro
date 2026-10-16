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
LOGO = uri(sys.argv[5], 300) if len(sys.argv) > 5 else PH

# Photo « envoyée » (état après téléversement), bouton actif, résumé complet
main = main.replace('<div class="photo-upload"><label class="photo-dropzone"><input accept="image/*" hidden="" type="file">Choisir une photo</label></div>',
    '<div class="photo-upload"><div class="mq-up"><img src="%s" alt=""><span><b>Photo envoyée ✓</b><small>dessin-couple.jpg</small></span><span class="mq-chg">Changer</span></div></div>' % PH, 1)
main = main.replace('<b class="prc-miss">Ma photo ou mon logo — à compléter</b>', '<b>Ma photo ou mon logo</b>', 1)
main = main.replace('<button class="btn btn-gold prc-off" style="flex:1" disabled="">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', 1)
main = main.replace('<p class="prc-addhint">Ajoutez votre photo ou votre logo (étape 2).</p>', "", 1)


PRIX = ('<div class="mq mq-4">'
  '<div class="perglass"><div class="pg-choice"><button type="button" class="pg-opt">Les 2 identiques</button>'
  '<button type="button" class="pg-opt on">Chacun différent</button></div>'
  '<div class="pg-tabs"><button type="button" class="pg-tab on" data-g="1">Verre 1</button><button type="button" class="pg-tab" data-g="2">Verre 2 <i class="mq-sup">+5 €</i></button></div>'
  '<p class="pg-hint"><b>Verre 1</b> : l’image ou le logo est offert, le texte est à +3 €. <b>Chaque verre suivant</b> : différent (autre image ou autre texte), <b>+5 € tout compris</b>, image et texte ; '
  'identique au verre 1, frais de gravure en tout : <b>1 ou 2 verres, aucun · 3 ou 4 verres, +2 € · 5 ou 6 verres, +5 €</b>. Le texte du verre 1 reste à +3 € dans tous les cas.</p></div>'
  '<div class="mq-g1"><div class="field"><label>Verre 1 · votre photo ou logo <span class="mq-ok">offerte</span></label>'
  '<div class="photo-upload"><div class="mq-up"><img src="%s" alt=""><span><b>Photo envoyée ✓</b><small>dessin-couple.jpg</small></span><span class="mq-chg">Changer</span></div></div></div>'
  '<div class="field"><label>Verre 1 · texte sous l’image <span class="prc-opt">(facultatif)</span> <span class="mq-sup">+3 €</span></label><input type="text" maxlength="40" placeholder="Ex. Stephan · 1989" value="Fabien · 2026"></div></div>'
  '<div class="mq-g2" hidden><label class="mq-same"><input type="checkbox" id="mq-same"> Identique au verre 1 (même image, même texte) <span class="mq-ok">rien en plus</span></label>'
  '<div class="mq-g2up"><p class="mq-forfait">Verre différent : <b>+5 € tout compris</b>, l’image et le texte.</p>'
  '<div class="field"><label>Verre 2 · votre photo ou logo</label>'
  '<div class="photo-upload"><div class="mq-up"><img src="%s" alt=""><span><b>Logo envoyé ✓</b><small>logo-zoo-bar.png</small></span><span class="mq-chg">Changer</span></div></div></div>'
  '<div class="field"><label>Verre 2 · texte sous l’image <span class="prc-opt">(facultatif, compris dans les 5 €)</span></label><input type="text" maxlength="40" value="Zoo Bar · 2026"></div></div></div>'
  '<div class="prc-sum mq-sum"><div class="mq-sumh">Le détail de votre prix</div>'
  '<div class="prc-sumrow"><span>2 verres à vin 47 cl × 21,90 €</span><b>43,80 €</b></div>'
  '<div class="prc-sumrow"><span>Verre 1 · gravure de votre photo</span><b>offerte</b></div>'
  '<div class="prc-sumrow"><span>Verre 1 · texte « Fabien · 2026 »</span><b>+ 3,00 €</b></div>'
  '<div class="prc-sumrow mq-l2"><span>Verre 2 · différent : gravure du logo + texte « Zoo Bar · 2026 »</span><b>+ 5,00 €</b></div>'
  '<div class="prc-sumrow mq-l2b" hidden><span>Verre 2 · identique au verre 1 (même photo, même texte)</span><b>0,00 €</b></div>'
  '<div class="prc-sumrow prc-sumtot"><span>Total (2 verres)</span><b class="mq-tot">51,80 €</b></div></div>'
  '<div class="mq-ex"><b>Frais de gravure pour des verres identiques (en tout, une seule fois)</b><table>'
  '<tr><td>1 ou 2 verres</td><td>aucun</td></tr><tr><td>3 ou 4 verres</td><td>+ 2 €</td></tr><tr><td>5 ou 6 verres</td><td>+ 5 €</td></tr></table>'
  '<p class="mq-small">Le texte se paie toujours à part : +3 € sur le verre 1, compris dans les 5 € d’un verre différent.</p>'
  '<b>Exemples (verre à vin 47 cl, 21,90 € pièce)</b><table>'
  '<tr><td>2 verres, photo + logo, sans texte</td><td>43,80 + 5 = <b>48,80 €</b></td></tr>'
  '<tr><td>2 verres, photo + logo, texte sur le 2ᵉ</td><td>43,80 + 5 = <b>48,80 €</b></td></tr>'
  '<tr><td>2 verres, même logo, prénom différent sur chacun</td><td>43,80 + 3 + 5 = <b>51,80 €</b></td></tr>'
  '<tr><td>2 verres identiques, même logo, même prénom</td><td>43,80 + 3 = <b>46,80 €</b></td></tr>'
  '<tr><td>2 verres identiques, même logo, sans texte</td><td>43,80 = <b>43,80 €</b></td></tr>'
  '<tr><td>3 verres identiques (À l’unité × 3), même logo, même prénom</td><td>65,70 + 3 + 2 = <b>70,70 €</b></td></tr>'
  '<tr><td>Lot de 4, 2 images, 2 verres chacune</td><td>77,90 + 5 = <b>82,90 €</b></td></tr>'
  '<tr><td>1 verre, logo + prénom</td><td>21,90 + 3 = <b>24,90 €</b></td></tr>'
  '<tr><td>Lot de 4, 4 images différentes</td><td>77,90 + 3 × 5 = <b>92,90 €</b></td></tr>'
  '<tr><td>Lot de 4, même image, même prénom partout</td><td>77,90 + 3 + 2 = <b>82,90 €</b></td></tr>'
  '<tr><td>6 verres, même image, même prénom partout</td><td>131,40 + 3 + 5 = <b>139,40 €</b></td></tr>'
  '<tr><td>6 verres, 6 images et 6 prénoms</td><td>131,40 + 3 + 5 × 5 = <b>159,40 €</b></td></tr></table>'
  '<p class="mq-small">Règle du 16/10/2026 : verre 1 comme aujourd’hui (image offerte, texte +3 €) ; verre différent +5 € tout compris ; verres identiques : frais de gravure en tout, aucun pour 1 ou 2 verres, +2 € pour 3 ou 4, +5 € pour 5 ou 6 (validé par le gérant). Le texte se paie toujours à part. '
  'Le client voit le détail ligne par ligne avant d’ajouter au panier, puis au panier et dans son mail de confirmation.</p></div>'
  '</div>') % (PH, LOGO)

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
main = main[:i] + IDEE2 + PRIX + main[i:]
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
</div>
<p class="mq-small" style="margin:14px 0 6px"><b>La même commande, passée avec « Chacun différent » :</b></p>
<div class="file-card mq-alerte-carte">
  <div class="file-card-top"><div><span class="file-pos">2</span><span class="file-ref">#0E3Y9OBX</span>
    <span class="dash-chip prep" style="margin-left:8px">À préparer</span></div>
    <div style="text-align:right"><div style="font-weight:800">48,80 €</div><div class="file-age">il y a 2 h · 10/10/2026</div></div></div>
  <div class="file-who"><strong>Fabien Guiblet</strong> <span>· Livraison à domicile</span></div>
  <ul class="file-items"><li><span class="q">2×</span><span>Verre à vin gravé<span class="d">47 cl · À l’unité</span>
    <span class="d" style="color:#b32b2b;font-weight:700">⚠️ 2 verres, chacun différent :</span>
    <span class="d">✍️ Verre 1 · image : dessin du couple (comprise) · sans texte</span>
    <span class="d">✍️ Verre 2 · image : logo Zoo Bar · texte « Zoo Bar · 2026 » en Cinzel · forfait verre différent + 5 €</span></span></li></ul>
  <p class="mq-small" style="margin:8px 0 0">Pas d’alerte ici : chaque verre a son image. Le détail par verre est écrit noir sur blanc.</p>
</div>'''
FICHE = '''<div class="mq-fiche"><div class="mq-fiche-h">Fiche atelier — #0E3Y9OBX · Verre à vin gravé 47 cl × 2 · chacun différent</div>
  <div class="ov"><div class="ov-titre">🧾 Vendu en plus — à ne pas oublier <span class="ov-sous">2 options au total</span></div>
    <div class="ov-art"><div class="ov-nom"><b>Verre à vin gravé · 47 cl</b> <span class="ov-qte">⚠️ 2 exemplaires, chacun différent</span><span class="ov-prix">48,80 €</span></div>
    <ul class="ov-liste"><li><span class="ov-puce">✒️</span><span><b>Verre 1</b> · image comprise · pas de texte</span><span class="ov-montant">0,00 €</span></li>
    <li><span class="ov-puce">✒️</span><span><b>Verre 2 · différent</b> · logo + texte, forfait</span><span class="ov-montant">+ 5,00 €</span></li></ul></div></div>
  <table class="mq-grav"><thead><tr><th></th><th>Image</th><th>Texte</th><th>Écriture</th><th>Face</th></tr></thead><tbody>
  <tr><td class="mq-v">Verre 1</td><td><img src="%s" alt=""><span>dessin du couple<br><small>comprise</small></span></td><td><i>aucun</i></td><td>—</td><td>avant · ≈ 4,6 × 8,1 cm</td></tr>
  <tr><td class="mq-v">Verre 2</td><td><img src="%s" alt=""><span>logo Zoo Bar<br><small>différent · forfait 5 €</small></span></td><td>« Zoo Bar · 2026 »</td><td>Cinzel</td><td>avant · ≈ 4,6 × 8,1 cm</td></tr>
  </tbody></table>
  <p class="mq-small">Une ligne par verre, image en vignette, texte entre guillemets, écriture, face. Le même tableau sur l’écran et sur la fiche imprimée. Des verres identiques au verre 1 s’écrivent « Verres 2 à 4 · identiques au verre 1 · frais de gravure + 2 € en tout » (« aucun frais » pour 2 verres, « + 5 € en tout » pour 5 ou 6).</p></div>''' % (PH, LOGO)
GESTION = '''<div class="mq-g"><h2>Dans Gestion → File de production</h2>
<p class="mq-small">À gauche : l’alerte quand il manque une image, et la même commande passée avec « Chacun différent ». À droite : la fiche atelier, détaillée verre par verre. L’alerte apparaît toute seule quand une commande a <b>plusieurs pièces avec photo</b> (verres, cristaux, carafes, puzzles photo…)
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
body[data-v="1"] .mq-1,body[data-v="2"] .mq-2,body[data-v="4"] .mq-4{display:block}
body[data-v="4"] section.prc-step:nth-of-type(2){display:none}
.mq-sup{font-style:normal;font-size:.72rem;font-weight:700;color:#7a1f1f;background:#fdecec;border-radius:999px;padding:2px 7px;margin-left:4px}
.mq-ok{font-size:.72rem;font-weight:700;color:#1f6b3a;background:#e6f4ea;border-radius:999px;padding:2px 7px;margin-left:4px}
.mq-same{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:.88rem}
.mq-forfait{margin:0 0 10px;padding:8px 12px;border-radius:10px;background:#fff6dd;border:1px solid #e2c67e;font-size:.86rem}
.mq-sum{margin-top:12px}
.mq-sum .prc-sumrow{display:flex;gap:10px;align-items:baseline}
.mq-sum .prc-sumrow span{flex:1;min-width:0}
.mq-sum .prc-sumrow b{white-space:nowrap;flex:none}
.mq-sumh{font-weight:800;font-size:.9rem;margin-bottom:6px;color:#1a1206}
.mq-ex{margin:14px 0 4px;padding:12px 14px;border-radius:12px;background:#fff;border:1px solid #e9dcc0;font-size:.86rem}
.mq-ex table{border-collapse:collapse;margin:8px 0;width:100%}
.mq-ex td{padding:5px 0;border-bottom:1px solid #f0e6d2}
.mq-ex td:last-child{text-align:right;font-weight:700;white-space:nowrap}
@media (max-width:480px){.mq-ex td:last-child{white-space:normal}}
@media (max-width:480px){.mq-ex td:last-child{white-space:normal}}
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
.mq-fiche-h{font:normal 1.1rem Georgia,serif;color:#1a1206;border-bottom:2px solid #1a1206;padding-bottom:6px;margin-bottom:8px}
.mq-grav{width:100%;border-collapse:collapse;font-size:.84rem;margin-top:8px}
.mq-grav th{text-align:left;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#7a6a52;padding:4px 6px;border-bottom:2px solid #1a1206}
.mq-grav td{padding:8px 6px;border-bottom:1px solid #e9dcc0;vertical-align:middle}
.mq-grav td img{width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #e9dcc0;vertical-align:middle;margin-right:8px}
.mq-grav td span{display:inline-block;vertical-align:middle;line-height:1.3}
.mq-grav td small{color:#8a6d1f;font-weight:700}
.mq-v{font-weight:800;white-space:nowrap}
@media (max-width:640px){.mq-grav th:nth-child(5),.mq-grav td:nth-child(5){display:none}}
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
document.querySelectorAll(".mq-4 .pg-tab").forEach(function(o){o.onclick=function(){var g=o.dataset.g;document.querySelectorAll(".mq-4 .pg-tab").forEach(function(x){x.classList.toggle("on",x===o)});document.querySelector(".mq-g1").hidden=g!="1";document.querySelector(".mq-g2").hidden=g!="2"}});
var same=document.getElementById("mq-same");if(same)same.onchange=function(){var on=same.checked;document.querySelector(".mq-g2up").hidden=on;document.querySelector(".mq-l2").style.display=on?"none":"";document.querySelector(".mq-l2b").hidden=!on;document.querySelector(".mq-tot").textContent=on?"46,80 €":"51,80 €";document.querySelector(".mq-4 .pg-tab[data-g='2'] .mq-sup").style.display=on?"none":""};
var lot=document.querySelector(".mq-lot");if(lot)lot.onclick=function(){lot.outerHTML='<p class="mq-small"><b>Sur le site :</b> la fiche passe sur « Lot de 2 », quantité 1, et le choix « Chacun différent » s’ouvre, une photo par verre.</p>'};
set("1");})();
</script>'''

doc = ('<title>Plusieurs verres, une photo</title><style>%s%s</style>'
       '<div class="mq-bar"><span>Maquette · 1 seule photo pour 2 verres</span>'
       '<button data-v="1">Idée 1 · encadré</button><button data-v="2">Idée 2 · chacun différent</button><button data-v="3">Idée 3 · alerte Gestion</button><button data-v="4">Prix · verre différent +5 €</button></div>'
       '<p class="mq-intro">Vrai rendu de la fiche verre à vin : 47 cl, « À l’unité », mode photo, quantité 2 (le cas de la commande 0E3Y9OBX). '
       'Change la quantité avec − / + : les idées 1 et 2 n’apparaissent qu’à partir de 2 verres. L’onglet « Prix » montre la règle : verre 1 comme aujourd’hui, puis +5 € tout compris par verre différent.</p>'
       '%s%s%s') % (css, MQCSS, main, GESTION, JS)
open(out, "w", encoding="utf-8").write(doc)
print("ok", out, round(len(doc) / 1024), "Ko")
