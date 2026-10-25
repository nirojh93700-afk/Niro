#!/usr/bin/env python3
"""Maquette « Texte gravé sur le pied » du verre à vin (25/10/2026, gérant : « fais la maquette du texte sur le pied »).

La fiche EN LIGNE est capturée telle quelle (curl https://nivcreation.fr/produit/verre-a-vin-grave), ses 4 feuilles de style
intégrées, scripts retirés ; une étape « Un texte sur le pied » est ajoutée avant le résumé. Les PRIX sont LUS dans la capture
(prix de la fiche en ligne + supplément texte du site) : aucun prix écrit ici (règle du 25/10, « tu vérifies toujours les prix »).

Usage : python3 tools/maquettes/verre-vin-pied.py <src.html> <dossier des css> <sortie.html>
Rien n'est modifié sur le site : seule une page de maquette est produite.
"""
import base64, html as H, io, json, os, re, sys
from urllib.parse import unquote
from PIL import Image

SRC, CSSDIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public")
h = open(SRC, encoding="utf-8").read()
brut = h.replace('\\"', '"')

# ---------- prix lus dans la page en ligne ----------
def prix(taille):
    m = re.search(r'"taille":"%s","title":"À l\'unité","price":([0-9.]+)' % taille, brut)
    if not m: sys.exit("prix %s cl introuvable dans la capture" % taille)
    return float(m.group(1))
P36, P47 = prix("36"), prix("47")
m = re.search(r'"engravingPricing":\{"textKeys":\[[^\]]*\],"textExtra":([0-9.]+)', brut)
if not m: sys.exit("supplément texte introuvable dans la capture")
TXT = float(m.group(1))
print("Prix lus en ligne : 36 cl %.2f · 47 cl %.2f · texte en plus %.2f" % (P36, P47, TXT))

def eur(x): return ("%.2f" % x).replace(".", ",") + " €"

# ---------- page : scripts retirés, css intégrées, images en data URI ----------
h = re.sub(r"<script\b.*?</script>", "", h, flags=re.S)
h = re.sub(r"<link[^>]+(preload|modulepreload|prefetch)[^>]*>", "", h)
def css_inline(m):
    nom = os.path.basename(m.group(1))
    css = open(os.path.join(CSSDIR, nom), encoding="utf-8").read()
    css = re.sub(r"url\(/_next/static/media/[^)]+\)", "none", css)
    return "<style>%s</style>" % css
h = re.sub(r'<link rel="stylesheet" href="(/_next/static/css/[^"]+)"[^>]*>', css_inline, h)

cache = {}
def uri(path, w):
    k = (path, w)
    if k not in cache:
        im = Image.open(path).convert("RGB"); im.thumbnail((w, w))
        b = io.BytesIO(); im.save(b, "JPEG", quality=72)
        cache[k] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    return cache[k]
def img_src(m):
    s = H.unescape(m.group(1))
    if s.startswith("/_next/image?url="):
        s = unquote(s.split("url=", 1)[1].split("&", 1)[0])
    if s.startswith("/"):
        p = os.path.join(PUB, s.lstrip("/"))
        if os.path.exists(p) and not p.endswith(".svg"):
            try: return 'src="%s"' % uri(p, 900 if "gallery-bg" in m.string[max(0, m.start()-120):m.start()] else 520)
            except Exception: pass
    return 'src=""'
h = re.sub(r'src="([^"]+)"', img_src, h)
h = re.sub(r'\s(srcSet|srcset)="[^"]*"', "", h)

# ---------- l'étape ajoutée ----------
FONTS = [("playfair", "Playfair Display", "'Playfair Display',serif"), ("cinzel", "Cinzel", "Cinzel,serif"),
         ("cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"), ("montserrat", "Montserrat", "Montserrat,sans-serif"),
         ("inter", "Inter", "Inter,sans-serif"), ("great-vibes", "Great Vibes", "'Great Vibes',cursive"),
         ("allura", "Allura", "Allura,cursive"), ("pacifico", "Pacifico", "Pacifico,cursive")]
opts = "".join('<option value="%s">%s</option>' % (k, n) for k, n, _ in FONTS)

ETAPE = f'''<section class="prc-step mqp" id="mqp">
<div class="prc-sh"><span class="prc-num">3</span><h3>Un texte sur le pied <span class="prc-opt">(facultatif)</span></h3></div>
<p class="mqp-lead">Un prénom, une date, un petit mot gravé sur le pied du verre, en arc autour de la tige : discret, on le découvre en prenant le verre.</p>
<label class="mqp-check"><input type="checkbox" id="mqp-on"> <span><b>Graver un texte sur le pied</b><small id="mqp-prixlab"></small></span></label>
<div class="mqp-body" id="mqp-body" hidden>
  <div class="mqp-grid">
    <div class="mqp-fields">
      <div class="field"><label for="mqp-txt">Texte sur le pied <span class="prc-opt">· 30 caractères</span></label>
        <input id="mqp-txt" type="text" maxlength="30" placeholder="Ex. Camille · 12.06.2026" value="Camille · 12.06.2026"></div>
      <div class="field"><label for="mqp-font">Écriture</label><select id="mqp-font">{opts}</select></div>
      <p class="mqp-note">Le texte suit le bord du pied. Plus il est court, plus il est gravé grand.</p>
    </div>
    <figure class="mqp-ap"><svg id="mqp-svg" viewBox="0 0 300 300" role="img" aria-label="Aperçu du pied du verre vu de dessus">
      <defs><radialGradient id="mqpg" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fbfdff"/><stop offset=".75" stop-color="#e3eaf0"/><stop offset="1" stop-color="#c9d4dd"/></radialGradient>
      <path id="mqp-arc" d="M 48 150 A 102 102 0 0 0 252 150"/></defs>
      <circle cx="150" cy="150" r="138" fill="url(#mqpg)" stroke="#aab7c2" stroke-width="2"/>
      <circle cx="150" cy="150" r="126" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>
      <circle cx="150" cy="150" r="34" fill="#dbe4eb" stroke="#aab7c2" stroke-width="2"/>
      <circle cx="150" cy="150" r="20" fill="#eef3f7" stroke="#c3ced7" stroke-width="1.5"/>
      <text id="mqp-t" fill="#4f5d69" text-anchor="middle" font-size="26"><textPath href="#mqp-arc" startOffset="50%">Camille · 12.06.2026</textPath></text>
    </svg><figcaption>Le pied vu de dessus · rendu givré sur le verre</figcaption></figure>
  </div>
</div>
</section>'''

i = h.find('<section class="prc-step"><div class="prc-sh"><span class="prc-num">3</span><h3>Résumé')
if i < 0: sys.exit("résumé introuvable")
h = h[:i] + ETAPE + h[i:].replace('<span class="prc-num">3</span><h3>Résumé', '<span class="prc-num">4</span><h3>Résumé', 1)
h = h.replace('<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss">à choisir (étape 1)</b></div>',
              '<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss" id="mqp-sg">à choisir (étape 1)</b></div>'
              '<div class="prc-sumrow" id="mqp-srow" hidden><span>Sur le pied</span><b id="mqp-sp"></b></div>', 1)
h = h.replace('<div class="prc-sumrow prc-sumtot"><span>Total</span><b>', '<div class="prc-sumrow prc-sumtot"><span>Total</span><b id="mqp-tot">', 1)
h = h.replace('<span class="val">', '<span class="val" id="mqp-tot2">', 1)
h = h.replace('<p class="prc-addhint">', '<p class="prc-addhint" id="mqp-hint">', 1)
h = h.replace('<button class="btn btn-gold prc-off" style="flex:1" disabled="">', '<button class="btn btn-gold prc-off" id="mqp-add" style="flex:1" disabled="">', 1)

# Fiche atelier (en bas de la fiche, maquette seulement)
ATELIER = '''<div class="container mqp-atel"><p class="mqp-atel-t">Ce que l’atelier verra sur la fiche de travail</p>
<table class="mqp-tab"><tbody><tr><th>Pied du verre</th><td><b id="mqp-at">« Camille · 12.06.2026 »</b><br><span id="mqp-af">Écriture Playfair</span> · en arc autour de la tige, lisible verre posé</td></tr></tbody></table></div>'''
h = h.replace("<footer", ATELIER + "<footer", 1)

BANDEAU = '<div class="mqp-band"><b>Maquette</b> · option « Texte sur le pied » du verre à vin. Rien n’est en ligne. Les prix viennent de la fiche en ligne.</div>'
h = re.sub(r"(<body[^>]*>)", r"\1" + BANDEAU, h, count=1)

CSS = '''<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Allura&family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Great+Vibes&family=Inter:wght@400;600&family=Montserrat:wght@400;600&family=Pacifico&family=Playfair+Display:wght@400;600&display=swap">
<style>
.mqp-band{background:#1a1206;color:#f3e8d3;font:500 13px/1.4 Inter,system-ui,sans-serif;padding:9px 16px;text-align:center}
.mqp-band b{color:#e2c67e}
.mqp-lead{margin:0 0 10px;color:var(--ink-soft);font-size:.92rem;line-height:1.5}
.mqp-check{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1.5px solid var(--line);border-radius:12px;cursor:pointer;background:#fff}
.mqp-check:has(input:checked){border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.mqp-check input{margin-top:3px;width:18px;height:18px;accent-color:var(--gold-dark)}
.mqp-check span{display:flex;flex-direction:column;gap:2px}
.mqp-check small{color:var(--ink-soft);font-size:.82rem}
.mqp-body{margin-top:12px}
.mqp-grid{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:16px;align-items:start}
.mqp-fields .field{margin-bottom:10px}
.mqp-fields input,.mqp-fields select{width:100%;box-sizing:border-box;min-width:0}
.mqp-note{font-size:.8rem;color:var(--ink-soft);margin:0}
.mqp-ap{margin:0;text-align:center}
.mqp-ap svg{width:100%;max-width:210px;height:auto;display:block;margin:0 auto}
.mqp-ap figcaption{font-size:.75rem;color:var(--ink-soft);margin-top:4px}
.mqp-sim{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:.8rem;color:var(--ink-soft);margin:8px 0 0}
.mqp-atel{margin-top:28px;margin-bottom:28px}
.mqp-atel-t{font-weight:600;margin:0 0 8px}
.mqp-tab{border-collapse:collapse;width:100%;max-width:560px;font-size:.9rem;background:#fff}
.mqp-tab th,.mqp-tab td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
.mqp-tab th{width:130px;background:#fbf7ee}
@media (max-width:640px){.mqp-grid{grid-template-columns:1fr}.mqp-ap svg{max-width:230px}}
</style>'''
h = h.replace("</head>", CSS + "</head>", 1)

JS = '''<script>
(function(){
var P={"36":%(p36)s,"47":%(p47)s}, TXT=%(txt)s, taille="36", carte=null;
var F=%(fonts)s;
function eur(x){return x.toFixed(2).replace(".",",")+"\\u00a0€"}
function eurC(x){return (x%%1? x.toFixed(2).replace(".",","):String(x))+"\\u00a0€"}
var $=function(id){return document.getElementById(id)};
var on=$("mqp-on"), txt=$("mqp-txt"), font=$("mqp-font"), tp=document.querySelector("#mqp-t textPath"), t=$("mqp-t");
// taille (36 / 47 cl) : les deux boutons de la fiche
var tailles=[].slice.call(document.querySelectorAll(".field"))[0];
var sw=[].slice.call(document.querySelectorAll(".variant-swatches"));
if(sw[0]) [].slice.call(sw[0].children).forEach(function(b,i){b.addEventListener("click",function(){taille=i?"47":"36";[].forEach.call(sw[0].children,function(x){x.classList.toggle("active",x===b)});var pl=document.querySelector(".price-lead"); if(pl) pl.textContent=eur(P[taille]); maj();});});
if(sw[1]) [].slice.call(sw[1].children).forEach(function(b,i){ if(i>0){b.disabled=true;b.style.opacity=".45";b.title="Dans la maquette, le calcul est montré pour un verre";}});
// étape 1 : choisir une carte (simulation)
[].forEach.call(document.querySelectorAll(".prc-card"),function(c){c.addEventListener("click",function(){
  carte = carte===c ? null : c;
  [].forEach.call(document.querySelectorAll(".prc-card"),function(x){x.classList.toggle("on",x===carte)}); maj();});});
function apercu(){
  var v=txt.value.trim()||"Votre texte"; tp.textContent=v;
  var f=F[font.value]; t.setAttribute("font-family",f);
  var n=Math.max(v.length,6); t.setAttribute("font-size", Math.max(16, Math.min(46, 560/n)));
  $("mqp-at").textContent="« "+v+" »"; $("mqp-af").textContent="Écriture "+font.options[font.selectedIndex].text;
}
function maj(){
  var pied = on.checked && txt.value.trim()!=="";
  $("mqp-body").hidden=!on.checked;
  var autre = !!carte;
  $("mqp-prixlab").textContent = autre ? "+"+eurC(TXT)+" : vous avez déjà une gravure à l’étape 1" : "Compris dans le prix si c’est votre seule gravure, sinon +"+eurC(TXT);
  var extra = pied && autre ? TXT : 0, tot = P[taille] + extra;
  $("mqp-tot").textContent=eur(tot); $("mqp-tot2").textContent=eur(tot);
  var sg=$("mqp-sg");
  if(autre){ sg.textContent=carte.querySelector("b").textContent; sg.classList.remove("prc-miss"); }
  else { sg.textContent = pied ? "le texte sur le pied" : "à choisir (étape 1)"; sg.classList.toggle("prc-miss", !pied); }
  $("mqp-srow").hidden=!pied;
  $("mqp-sp").textContent = pied ? "« "+txt.value.trim()+" » · "+(extra? "+"+eurC(TXT) : "compris") : "";
  var ok = autre || pied, add=$("mqp-add"), hint=$("mqp-hint");
  add.disabled=!ok; add.classList.toggle("prc-off",!ok);
  if(hint) hint.textContent = ok ? "Maquette : le bouton n’ajoute rien au panier." : "Choisissez votre gravure (étape 1) ou un texte sur le pied.";
  apercu();
}
on.addEventListener("change",maj); txt.addEventListener("input",maj); font.addEventListener("change",maj);
maj();
})();
</script>''' % {"p36": json.dumps(P36), "p47": json.dumps(P47), "txt": json.dumps(TXT),
               "fonts": json.dumps({k: css for k, _, css in FONTS})}
h = h.replace("</body>", JS + "</body>", 1)

# fragment (sans doctype / html / head / body) pour l'Artifact
open(OUT, "w", encoding="utf-8").write(h)
head = re.search(r"<head[^>]*>(.*?)</head>", h, flags=re.S).group(1)
head = re.sub(r"<meta[^>]*>", "", head)
body = re.search(r"<body[^>]*>(.*)</body>", h, flags=re.S).group(1)
frag = "<title>Texte sur le pied</title>" + re.sub(r"<title>.*?</title>", "", head, flags=re.S) + body
open(OUT.replace(".html", ".fragment.html"), "w", encoding="utf-8").write(frag)
print("OK", OUT, "%.0f Ko" % (len(h) / 1024))
