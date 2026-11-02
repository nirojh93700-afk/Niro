#!/usr/bin/env python3
"""Maquette « Collier barre verticale à graver » — 02/11/2026. RIEN n'est en ligne.

Gérant : pendentif barre Nihaojewelry NH11122064 (acier 304, 31 × 4 mm, 4 faces, petite pierre, chaîne 50 + 5 cm, 11 g),
argenté seulement, 5 en stock, prix barré 21,90 € → la cliente paie 19,71 €, gravure sur les 4 faces : la 1re face remplie
OFFERTE, chaque face en plus +3 €. « Fais la maquette ».
Méthode (celle du puzzle photo) : fiche ajoutée SUR LA MACHINE SEULEMENT (products.js + productInfo.js + option
`textesOfferts` dans engravingPrice.js), `npm run build` + `next start -p 3140`, capture de /produit/collier-barre-verticale,
puis les fichiers remis à l'identique. La maquette = la capture TELLE QUELLE + un petit script : faces → aperçu témoin et
total, emballage, quantité, vignettes.

Usage : python3 tools/maquettes/collier-barre-verticale.py <capture /produit/collier-barre-verticale.html>
Sortie : docs/maquettes/collier-barre-verticale.html (+ .fragment.html, non commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "barre-verticale")
SRC = sys.argv[1]
PRIX = 19.71       # prix payé (barré 21,90 − 10 %)
FACE = 3.00        # chaque face en plus


def uri(path, w=900, q=80):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "svg": "image/svg+xml",
            "woff2": "font/woff2"}.get(ext, "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER, FOOTER, MAIN = src[body_start:i_main], src[j_main:src.rfind("</body>")], src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})" if garder else "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

PHOTOS = {"zz-maquette-barre-gravee-i-love-you.jpg": "gravee-i-love-you.jpg", "zz-maquette-barre-portee-femme.jpg": "portee-femme.jpg",
          "zz-maquette-barre-buste.jpg": "buste.jpg", "zz-maquette-barre-dimensions.jpg": "dimensions.jpg"}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom]))}"'
    p = os.path.join(PUB, chemin.lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith((".jpg", ".jpeg", ".png")) and os.path.getsize(p) > 120_000:
        return f'{m.group(1)}="{uri(p)}"'
    return f'{m.group(1)}="{raw_uri(p)}"'
def next_image(m):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(m.group(1).replace("&amp;", "&")).query)
    return f'src="{q.get("url", [""])[0]}"'
def nettoie(html):
    html = re.sub(r'<button[^>]*>💬 Une question \?</button>', "", html)
    html = re.sub(r'<a[^>]*href="/boutique">🛍️ La boutique</a>', "", html)
    html = re.sub(r'src="(/_next/image\?[^"]+)"', next_image, html)
    html = re.sub(r'\s(?:srcset|srcSet)="[^"]*"', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
assert MAIN.count('id="pf-face') == 4, "les 4 faces doivent être dans la capture"
assert "pd-totbox" in MAIN and "engrave-preview" in MAIN

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-detail{display:block;margin-top:4px;font-size:.8rem;color:var(--ink-soft)}
.ep-plate .ep-line small{display:block;font-family:var(--font-body,system-ui);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#7a6a4a;margin-bottom:2px}
'''
JS = r'''
(function(){
  var PRIX=__PRIX__, FACE=__FACE__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={q:1,emb:0};
  var faces=[1,2,3,4].map(function(i){return document.getElementById('pf-face'+i)});
  var pol=document.querySelector('.field select');
  var tot=document.querySelector('.pd-totbox .val'),qs=document.querySelector('.qty-stepper span'),qb=document.querySelectorAll('.qty-stepper button');
  var plate=document.querySelector('.engrave-preview .ep-plate');
  var det=document.createElement('span');det.className='mq-detail';document.querySelector('.pd-totbox').appendChild(det);
  function remplies(){return faces.filter(function(f){return f&&f.value.trim()})}
  function maj(){
    var n=remplies().length, grav=Math.max(0,n-1)*FACE, u=PRIX+grav+st.emb;
    tot.textContent=eur(u*st.q); qs.textContent=st.q;
    det.textContent='Collier '+eur(PRIX)+(n?' · '+n+' face'+(n>1?'s':'')+' gravée'+(n>1?'s':'')+' : 1re offerte'+(n>1?', '+(n-1)+' × 3 € = '+eur(grav):''):'')+(st.emb?' · emballage '+eur(st.emb):'')+(st.q>1?' · × '+st.q:'');
    var cls='ep-line'+(pol&&pol.value?' fnt-'+pol.value:'');
    var h='';faces.forEach(function(f,i){var v=f.value.trim();if(v)h+='<div class="'+cls+'"><small>Face '+(i+1)+(i===0?' (avec la pierre)':'')+'</small>'+v.replace(/[<>&]/g,'')+'</div>'});
    plate.innerHTML=h||'<span class="ep-empty">Votre texte gravé apparaîtra ici…</span>';
  }
  faces.forEach(function(f){f.addEventListener('input',function(){
    var c=[].slice.call(f.parentNode.querySelectorAll('*')).filter(function(e){return /^\d+\/15$/.test(e.textContent.trim())})[0];
    if(c)c.textContent=f.value.length+'/15'; maj()})});
  if(pol)pol.addEventListener('change',maj);
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  // Emballage : un choix à la fois, prix lu sur le bouton.
  var titre=[].slice.call(document.querySelectorAll('div')).filter(function(d){return d.textContent.trim()==='Votre emballage'})[0];
  var embs=titre?[].slice.call(titre.parentNode.querySelectorAll('button[type=button]')):[];
  function prixDe(b){var t=b.lastElementChild.textContent.match(/\+\s*([\d,]+)/);return t?parseFloat(t[1].replace(',','.')):0}
  embs.forEach(function(b){b.addEventListener('click',function(){embs.forEach(function(x){x.style.borderColor='var(--line)';x.style.background='#fff';var s=x.querySelector('strong');s.textContent=s.textContent.replace(/^✓\s*/,'')});
    b.style.borderColor='var(--gold)';b.style.background='#fbf6ea';var s=b.querySelector('strong');if(s.firstChild&&s.firstChild.nodeType===3)s.firstChild.textContent='✓ '+s.firstChild.textContent.replace(/^✓\s*/,'');st.emb=prixDe(b);maj()})});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX)).replace("__FACE__", json.dumps(FACE))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Collier barre verticale à graver » · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Collier barre verticale</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "collier-barre-verticale.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "collier-barre-verticale.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
