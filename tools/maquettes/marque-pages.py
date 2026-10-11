#!/usr/bin/env python3
"""Maquette « Marque-page en bois gravé » — précommande, série limitée — 11/10/2026. RIEN n'est en ligne.

Gérant : nouveaux produits en PRÉCOMMANDE (stock pas encore arrivé, à commander), marque-pages en bois à pompon doré,
6 bois, personnalisables (dessins à venir, un modèle à la fois ; celui-ci = 6 bois + pompon doré).
Méthode (comme puzzle-photo.py) : fiche ajoutée SUR LA MACHINE SEULEMENT (products.js / productInfo.js / productDates.js,
photos `public/produits/zz-maquette-mp-*.jpg`), site construit + `next start`, capture de /produit/marque-pages-bois,
puis tout remis à l'identique (git checkout + suppression des zz-*). Photos source : docs/maquettes/assets/marque-pages/.

Usage : python3.13 tools/maquettes/marque-pages.py <capture /produit/marque-pages-bois.html>
Sortie : docs/maquettes/marque-pages.html (+ .fragment.html, jamais commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "marque-pages")
SRC = sys.argv[1]


def uri(path, w=900, q=78):
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

PHOTOS = {f"zz-maquette-mp-{k}.jpg": k for k in ["nanmu","buis","santal","palissandre","ebene","suanzhi","groupe","ambiance","eventail","boite4","boite2"]}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom] + ".jpg"))}"'
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
    html = re.sub(r'<div class="cf-shot"><img src="https://cdn\.shopify\.com[^"]*"[^>]*/></div>', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
# La grande image porte un id pour le script ; l'« aperçu témoin » texte du site n'a pas de sens ici (pas de texte à graver).
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
MAIN = MAIN.replace("Choisissez votre modèle", "Choisissez votre couleur", 1)
GRID = ('<div class="mq-dessins" hidden><p class="mq-dh">Choisissez votre dessin</p><div class="mq-dg">' +
        "".join(f'<button type="button" class="mq-dtile"><span>{i}</span><small>dessin à venir</small></button>' for i in range(1, 13)) +
        '</div><p class="mq-dn">Maquette : vos dessins numérotés prendront la place de ces cases.</p></div>')
MAIN = re.sub(r'(<option value="oui">Avec un dessin \(\+2 €\)</option></select></div>)', lambda m: m.group(1) + GRID, MAIN, count=1)
assert "mq-dessins" in MAIN
OLD_BOX = "Une boîte cadeau bleu nuit pour un ou deux marque-pages, une autre pour quatre : chaque marque-page tient dans son élastique."
assert OLD_BOX in MAIN
MAIN = MAIN.replace(OLD_BOX, "Une boîte cadeau bleu nuit pour un, deux ou quatre marque-pages : chaque marque-page tient dans son élastique. La boîte coûte 4,90 € pour un, 5,90 € pour deux, 7,90 € pour quatre.")
FORMATS = [("Seul", "avec son pompon", 1, 0), ("En boîte cadeau", "1 marque-page, boîte bleu nuit", 1, 4.9),
           ("Coffret de 2", "2 marque-pages, boîte bleu nuit", 2, 5.9), ("Coffret de 4", "4 marque-pages, boîte bleu nuit", 4, 7.9)]
def eur(n): return f"{n:.2f}".replace(".", ",") + " €"
FMT = ('<div class="field"><label>Choisissez votre format</label><div class="mq-fmts">' +
       "".join(f'<button type="button" class="mq-fmt{" on" if i == 0 else ""}" data-n="{n}" data-box="{box:g}"><b>{t}</b><span>{sub}</span><em>{eur(n * 9.9 + box)}</em></button>'
               for i, (t, sub, n, box) in enumerate(FORMATS)) +
       '</div><div class="mq-bois" hidden></div></div>')
cle = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
assert cle in MAIN
MAIN = MAIN.replace(cle, FMT + cle, 1)
MAIN = MAIN.replace('<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Précommander</button>', 1)
PRE = ('<div class="mq-pre"><b>Précommande · série limitée</b><span>Les marque-pages sont en cours d\'approvisionnement. '
       'Votre commande est enregistrée dès maintenant, puis gravée à la réception des marque-pages. Quantités limitées.</span></div>')
MAIN = MAIN.replace('<div class="price-lead">', PRE + '<div class="price-lead">', 1)
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)  # (déjà absent avec noEngravePreview)
PRIX = {t: float(re.sub(r"[^0-9,]", "", p).replace(",", ".")) for t, p in
        re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', MAIN)}
assert len(PRIX) == 6, PRIX

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-fmts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.mq-fmt{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:10px 12px;border:1.5px solid #e4d9bd;border-radius:14px;background:#fff;color:#2b2620;cursor:pointer;font:inherit}.mq-fmt b{font-size:.92rem}.mq-fmt span{font-size:.74rem;color:#7a6c48;line-height:1.3}.mq-fmt em{font-style:normal;font-weight:700;color:#7c6120;margin-top:2px}.mq-fmt.on{border-color:#a98935;background:#fbf3df;box-shadow:0 0 0 1px #a98935 inset}.mq-bois{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px}.mq-bois select{width:100%}.mq-bois label{font-size:.78rem;color:#7a6c48;display:block;margin-bottom:2px}.mq-dessins{margin:-4px 0 14px}.mq-dh{font-weight:600;font-size:.9rem;margin:0 0 8px}.mq-dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}.mq-dtile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1;border:1.5px dashed #c9b88a;border-radius:14px;background:#fff;color:#7c6120;cursor:pointer;font:inherit}.mq-dtile span{font-family:Playfair Display,serif;font-size:1.3rem}.mq-dtile small{font-size:.66rem;color:#8a7a52}.mq-dtile.on{border-style:solid;border-color:#a98935;background:#fbf3df}.mq-dn{font-size:.75rem;color:#8a7a52;margin:8px 0 0}.mq-pre{display:flex;flex-direction:column;gap:4px;margin:10px 0 6px;padding:12px 14px;border:1px solid #c9a24b;border-left-width:4px;border-radius:12px;background:#fbf3df;color:#4a3a14;font-size:.88rem;line-height:1.45}.mq-pre b{color:#7c6120;font-size:.95rem}
.mq-photo-ok{display:block;margin-top:8px;font-size:.85rem;color:var(--gold-dark,#a98935);font-weight:600}
'''
JS = r'''
(function(){
  var P=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Caramel',q:1,n:1,box:0};
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  var vin=document.getElementById('pf-texte'),des=document.getElementById('pf-dessin'),grid=document.querySelector('.mq-dessins'),dn=null;
  function maj(){var ex=((vin&&vin.value.trim())?2:0)+((des&&des.value==='oui')?2:0);tot.textContent=eur(((P[st.t]+ex)*st.n+st.box)*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q}
  var fm=[].slice.call(document.querySelectorAll('.mq-fmt')),bw=document.querySelector('.mq-bois');
  var WOODS=sw.map(function(b){return b.querySelector('.vs-title').textContent.trim()});
  function bois(){bw.innerHTML='';if(st.n<2){bw.hidden=true;return}bw.hidden=false;for(var i=0;i<st.n;i++){var d=document.createElement('div');d.innerHTML='<label>Marque-page '+(i+1)+' : couleur</label><select>'+WOODS.map(function(w){return '<option'+(w===st.t?' selected':'')+'>'+w+'</option>'}).join('')+'</select>';bw.appendChild(d)}}
  fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;bois();
    if(st.box){montre(th[st.n===4?9:10])}else{montre(th[WOODS.indexOf(st.t)])}maj()})});
  if(vin)vin.addEventListener('input',maj);
  if(des)des.addEventListener('change',function(){if(grid)grid.hidden=des.value!=='oui';maj()});
  [].forEach.call(document.querySelectorAll('.mq-dtile'),function(t){t.addEventListener('click',function(){[].forEach.call(document.querySelectorAll('.mq-dtile'),function(x){x.classList.remove('on')});t.classList.add('on')})});
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();var k=sw.indexOf(b);if(th[k])montre(th[k]);maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  if(th[0])th[0].classList.add('active');
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX, ensure_ascii=False))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Marque-page en bois personnalisé » (précommande, prix proposés à valider) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Marque-page en bois personnalisé — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "marque-pages.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
