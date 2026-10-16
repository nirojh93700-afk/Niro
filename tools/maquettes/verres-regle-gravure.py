#!/usr/bin/env python3
"""Maquette « règle de gravure des verres » (16/10/2026) : flûte, verre à whisky, verre à cocktail,
verre Fête des pères. Même règle que le verre à vin (maquette plusieurs-photos) :
verre 1 = image / logo / modèle offert, texte +3 € ; chaque verre différent +5 € tout compris ;
verres identiques : rien pour 1-2, +2 € pour 3-4, +5 € pour 5-6. Les prix des verres ne changent pas.

Usage : python3 tools/maquettes/verres-regle-gravure.py <dossier des captures> <dossier css du site> <sortie.html>
Les captures = `curl localhost:3140/produit/<slug>` après `next build` + `next start`.
Rien n'est modifié sur le site : seule une page de maquette est produite.
"""
import base64, io, os, re, sys
from urllib.parse import unquote
from PIL import Image

CAP, CSSDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PUB = os.path.join(os.path.dirname(__file__), "..", "..", "public")

PRODUITS = [
  # slug, onglet, nom au pluriel, prix unitaire, exemple verre 1, exemple verre 2, ce qui est offert, notes de grille
  ("flute-a-champagne-gravee", "Flûte", "flûtes", 17.90, "Léa & Tom", "Mariage · 12.06.2026", "modèle, lettre, image ou logo", []),
  ("verre-a-whisky-grave", "Whisky", "verres à whisky", 19.90, "Papa", "Le meilleur parrain", "l'image ou le logo", ["Gravure face et fond", "+ 7 € par verre"]),
  ("verre-a-cocktail-grave", "Cocktail", "verres à cocktail", 17.90, "Bar du Port", "Soirée 2026", "l'image ou le logo", ["Gravure face et fond", "+ 7 € par verre"]),
  ("verre-a-whisky-fete-des-peres", "Fête des pères", "verres à whisky", 19.90, "Papa", "Papy", "le modèle", ["Gravure face et fond", "+ 7 € par verre"]),
]

def uri(path, w=520):
    im = Image.open(path).convert("RGB"); im.thumbnail((w, w))
    b = io.BytesIO(); im.save(b, "JPEG", quality=70)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

def img_src(m):
    s = m.group(1)
    if s.startswith("/_next/image?url="):
        s = unquote(s.split("url=", 1)[1].split("&", 1)[0])
    if s.startswith("/produits/"):
        p = os.path.join(PUB, s.lstrip("/"))
        if os.path.exists(p) and not p.endswith(".svg"):
            try: return 'src="%s"' % uri(p)
            except Exception: pass
    return 'src=""'

def eur(x): return ("%.2f" % x).replace(".", ",") + " €"

def grille(notes):
    extra = ""
    if notes:
        extra = '<tr><td>%s</td><td><b>%s</b></td></tr>' % tuple(notes)
    return ('<div class="mqv-grille"><div class="mqv-gt">Prix de la gravure</div><table><tbody>'
      '<tr><td>Image, logo ou modèle du verre 1</td><td><b>offert</b></td></tr>'
      '<tr><td>Texte du verre 1</td><td><b>+ 3 €</b></td></tr>'
      '<tr><td>Chaque verre différent (autre image ou autre texte)</td><td><b>+ 5 € tout compris</b></td></tr>%s'
      '</tbody></table><div class="mqv-gt">Frais de gravure pour des verres identiques <small>(une seule fois par commande)</small></div><table><tbody>'
      '<tr><td>1 ou 2 verres</td><td><b>aucun</b></td></tr><tr><td>3 ou 4 verres</td><td><b>+ 2 €</b></td></tr><tr><td>5 ou 6 verres</td><td><b>+ 5 €</b></td></tr>'
      '</tbody></table><p class="mqv-small">Le détail exact de votre prix s’affiche avant l’ajout au panier, puis dans votre panier et votre e-mail de confirmation.</p></div>') % extra

def fin_div(h, i):
    """Index juste après la balise </div> qui ferme le <div> ouvert à l'index i."""
    n = 0
    for m in re.finditer(r"<div\b|</div>", h[i:]):
        n += 1 if m.group(0).startswith("<div") else -1
        if n == 0: return i + m.end()
    raise ValueError("div non fermé")

def fiche(slug, onglet, pluriel, pu, t1, t2, offert, notes, idx):
    page = open(os.path.join(CAP, slug + ".html"), encoding="utf-8").read()
    main = re.search(r"<main.*?</main>", page, re.S).group(0)
    main = re.sub(r"<script.*?</script>", "", main, flags=re.S)
    main = re.sub(r'\ssrcset="[^"]*"', "", main)
    main = re.sub(r'src="([^"]+)"', img_src, main)
    tot1 = 2 * pu + 3 + 5
    tot2 = 2 * pu + 3
    bloc = ('<div class="perglass mqv-pg"><div class="pg-choice"><button type="button" class="pg-opt">Les 2 identiques</button>'
      '<button type="button" class="pg-opt on">Chacun différent</button></div>'
      '<div class="pg-tabs"><button type="button" class="pg-tab on" data-v="1">Verre 1</button>'
      '<button type="button" class="pg-tab" data-v="2">Verre 2 <i class="mqv-sup">+5 €</i></button></div>'
      '<p class="pg-hint">Verre 2 différent : <strong>+5 €</strong>, image et texte compris. <button type="button" class="mqv-lien mqv-voirprix">Voir les prix</button></p>'
      '<div class="mqv-v1"><p class="mqv-small">Le verre 1 se personnalise juste en dessous, comme d’habitude. Exemple ici : texte <b>« %s »</b> <i class="mqv-sup">+3 €</i></p></div>'
      '<div class="mqv-v2" hidden><label class="mqv-same"><input type="checkbox" class="mqv-idem"> Identique au verre 1 (même gravure) <span class="mqv-ok">rien en plus</span></label>'
      '<div class="mqv-v2f"><div class="field"><label>Verre 2 · votre photo ou logo <span class="mqv-small">(facultatif)</span></label>'
      '<div class="photo-upload"><label class="photo-dropzone">Choisir une photo</label></div></div>'
      '<div class="field"><label>Verre 2 · texte <span class="mqv-small">(compris dans les 5 €)</span></label><input type="text" value="%s" readonly></div></div></div>'
      '</div>') % (t1, t2)
    detail = ('<div class="prc-sum mqv-sum"><button type="button" class="mqv-sumbtn"><span>Le détail de votre prix</span><em>Voir</em></button>'
      '<div class="prc-sumrow"><span>2 %s × %s</span><b>%s</b></div>'
      '<div class="prc-sumrow"><span>Verre 1 · %s</span><b>offert</b></div>'
      '<div class="prc-sumrow"><span>Verre 1 · texte « %s »</span><b>+ 3,00 €</b></div>'
      '<div class="prc-sumrow mqv-l2"><span>Verre 2 · différent : « %s »</span><b>+ 5,00 €</b></div>'
      '<div class="prc-sumrow mqv-l2b" hidden><span>Verre 2 · identique au verre 1</span><b>0,00 €</b></div>'
      '<div class="prc-sumrow prc-sumtot"><span>Total (2 verres)</span><b class="mqv-tot">%s</b></div></div>') % (
        pluriel, eur(pu), eur(2 * pu), offert, t1, t2, eur(tot1))
    # Bloc « chacun différent » juste avant la personnalisation.
    i = main.find('<section class="prc-step">')
    if i < 0:
        j = main.find("Personnalisation — gravure")
        i = main.rfind("<", 0, j)
    main = main[:i] + bloc + main[i:]
    # Détail du prix (replié) juste avant « Total tout compris », dont la valeur suit le détail.
    r = main.find('<div class="prc-sum">')
    if r >= 0:
        # Parcours en étapes : le détail remplace le résumé d'origine, dans l'étape 3.
        main = main[:r] + detail + '<div class="prc-sum mqv-orig">' + main[r + len('<div class="prc-sum">'):]
        main = re.sub(r'<button class="btn btn-gold prc-off"([^>]*) disabled="">', r'<button class="btn btn-gold"\1>', main, count=1)
        main = re.sub(r'<p class="prc-addhint">.*?</p>', "", main, count=1, flags=re.S)
    else:
        k = main.find('<div class="pd-totbox">')
        main = main[:k] + detail + main[k:]
    main = re.sub(r'(<div class="pd-totbox"><span class="lab">[^<]*</span><span class="val">)[^<]*(</span>)', r"\g<1>%s\g<2>" % eur(tot1), main, count=1)
    # Quantité 2.
    main = re.sub(r'(<div class="qty-stepper"><button[^>]*>−</button><span>)1(</span>)', r"\g<1>2\g<2>", main, count=1)
    # Grille dans le volet « Personnalisation & Entretien ».
    vol = 'Personnalisation &amp; Entretien</summary><div class="info-body">'
    v = main.find(vol)
    if v >= 0:
        main = main[:v + len(vol)] + grille(notes) + main[v + len(vol):]
    return '<div class="mqv-fiche" data-i="%d" data-t1="%s" data-t2="%s"%s>%s</div>' % (
        idx, eur(tot1), eur(tot2), "" if idx == 0 else " hidden", main)

css = "".join(open(os.path.join(CSSDIR, f), encoding="utf-8").read() for f in sorted(os.listdir(CSSDIR)) if f.endswith(".css"))
MQ = r'''
.mqv-bar{position:sticky;top:0;z-index:50;display:flex;gap:6px;overflow-x:auto;padding:10px 16px;background:#1a1206;scrollbar-width:none}
.mqv-bar button{flex:none;border:1px solid #c9a24b;background:transparent;color:#f3e8d3;border-radius:999px;padding:7px 14px;font:600 .88rem system-ui,sans-serif;cursor:pointer}
.mqv-bar button.on{background:#c9a24b;color:#1a1206}
.mqv-pg{margin:0 0 16px}
.mqv-sup{font-style:normal;font-size:.75rem;font-weight:700;color:#9b2c2c;background:#fdecec;border-radius:999px;padding:1px 7px;margin-left:4px;white-space:nowrap}
.mqv-ok{font-size:.75rem;font-weight:700;color:#2f6b3a;background:#e8f3ea;border-radius:999px;padding:2px 8px;white-space:nowrap}
.mqv-small{font-size:.85rem;color:var(--ink-soft);margin:6px 0}
.mqv-same{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.9rem;margin:6px 0 10px}
.mqv-lien{background:none;border:0;padding:0;font:inherit;color:var(--gold-dark);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
[hidden]{display:none!important}
.mqv-sum .prc-sumrow{gap:10px}.mqv-sum .prc-sumrow span{min-width:0}.mqv-sum .prc-sumrow b{flex:none;white-space:nowrap}
.mqv-sum{margin:0 0 12px}.mqv-orig{display:none!important}
.mqv-sum:not(.open) .prc-sumrow{display:none}
.mqv-sumbtn{display:flex;width:100%;justify-content:space-between;align-items:center;background:none;border:0;padding:0;font:inherit;font-weight:600;color:var(--ink);cursor:pointer;text-align:left}
.mqv-sumbtn em{font-style:normal;font-weight:500;font-size:.9rem;color:var(--gold-dark);text-decoration:underline}
.mqv-grille{border:1px solid var(--line);border-radius:var(--radius);background:var(--paper);padding:12px 14px;margin:0 0 12px;white-space:normal}
.mqv-gt{font-weight:700;margin:4px 0 6px}.mqv-gt small{font-weight:400;color:var(--ink-soft)}
.mqv-grille table{width:100%;border-collapse:collapse;margin:0 0 8px}
.mqv-grille td{padding:6px 0;border-bottom:1px solid var(--line);vertical-align:top}
.mqv-grille td:last-child{text-align:right;white-space:nowrap;padding-left:10px}
.mqv-v2 input[type=text]{width:100%;box-sizing:border-box}
'''
fiches = "".join(fiche(*p, i) for i, p in enumerate(PRODUITS))
bar = '<nav class="mqv-bar">' + "".join('<button type="button" data-i="%d"%s>%s</button>' % (i, ' class="on"' if i == 0 else "", p[1]) for i, p in enumerate(PRODUITS)) + "</nav>"
JS = r'''<script>(function(){
var F=document.querySelectorAll(".mqv-fiche");
document.querySelectorAll(".mqv-bar button").forEach(function(b){b.onclick=function(){document.querySelectorAll(".mqv-bar button").forEach(function(x){x.classList.toggle("on",x===b)});F.forEach(function(f){f.hidden=f.dataset.i!==b.dataset.i});window.scrollTo(0,0)}});
F.forEach(function(f){
  f.querySelectorAll(".mqv-pg .pg-tab").forEach(function(t){t.onclick=function(){f.querySelectorAll(".mqv-pg .pg-tab").forEach(function(x){x.classList.toggle("on",x===t)});f.querySelector(".mqv-v1").hidden=t.dataset.v!=="1";f.querySelector(".mqv-v2").hidden=t.dataset.v!=="2"}});
  f.querySelectorAll(".mqv-pg .pg-opt").forEach(function(o){o.onclick=function(){f.querySelectorAll(".mqv-pg .pg-opt").forEach(function(x){x.classList.toggle("on",x===o)})}});
  var idem=f.querySelector(".mqv-idem");idem.onchange=function(){var on=idem.checked,t=on?f.dataset.t2:f.dataset.t1;f.querySelector(".mqv-v2f").hidden=on;f.querySelector(".mqv-l2").hidden=on;f.querySelector(".mqv-l2b").hidden=!on;f.querySelector(".mqv-tot").textContent=t;var v=f.querySelector(".pd-totbox .val");if(v)v.textContent=t;f.querySelector('.pg-tab[data-v="2"] .mqv-sup').style.display=on?"none":""};
  var sb=f.querySelector(".mqv-sumbtn");sb.onclick=function(){var o=sb.parentNode.classList.toggle("open");sb.querySelector("em").textContent=o?"Masquer":"Voir"};
  f.querySelector(".mqv-voirprix").onclick=function(){var g=f.querySelector(".mqv-grille");if(!g)return;var d=g.closest("details");if(d)d.open=true;g.scrollIntoView({behavior:"smooth",block:"start"})};
});
})();</script>'''
doc = "<title>Verres, règle de gravure</title><style>%s%s</style>%s%s%s" % (css, MQ, bar, fiches, JS)
open(OUT, "w", encoding="utf-8").write(doc)
print("ok", OUT, round(len(doc) / 1024), "Ko")
