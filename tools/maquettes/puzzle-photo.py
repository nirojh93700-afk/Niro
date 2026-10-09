#!/usr/bin/env python3
"""Maquette « Puzzle photo gravé » — 09/10/2026 soir. RIEN n'est en ligne.

Gérant : « j'aimerais mettre puzzle gravé avec les photos que les clients donnent… un petit peu plus grand que le puzzle…
de 4 jusqu'à 120 morceaux, gravé n'importe quelle photo » + 3 photos d'exemple (amis, enfants, famille).
Méthode : la fiche a été créée SUR LA MACHINE SEULEMENT (products.js, jamais enregistré ni poussé), le site construit
(`npm run build` + `next start`), la page /produit/puzzle-photo-grave capturée, puis products.js remis à l'identique.
La maquette = cette capture TELLE QUELLE (en-tête, fiche du site, pied de page), avec un petit script pour que les choix
marchent : nombre de pièces → prix et total, vignettes et flèches, et « Choisir une photo » qui pose la photo du client
sur la grande image, en noir et blanc comme une gravure.

Usage : python3 tools/maquettes/puzzle-photo.py <capture /produit/puzzle-photo-grave.html>
Sortie : docs/maquettes/puzzle-photo.html (+ .fragment.html).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "puzzle-photo")
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

PHOTOS = {"zz-maquette-puzzle-photo-enfants.jpg": "enfants", "zz-maquette-puzzle-photo-famille.jpg": "famille",
          "zz-maquette-puzzle-photo-amis.jpg": "amis"}
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
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)
PRIX = {t: float(re.sub(r"[^0-9,]", "", p).replace(",", ".")) for t, p in
        re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', MAIN)}
assert len(PRIX) == 6, PRIX

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
#galmain.mq-grave{filter:grayscale(1) sepia(.35) contrast(1.15) brightness(1.02)}
.mq-photo-ok{display:block;margin-top:8px;font-size:.85rem;color:var(--gold-dark,#a98935);font-weight:600}
'''
JS = r'''
(function(){
  var P=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'4 pièces',q:1};
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  function maj(){tot.textContent=eur(P[st.t]*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q}
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.classList.remove('mq-grave');main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  if(th[0])th[0].classList.add('active');
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  // « Choisir une photo » : la photo du client se pose sur la grande image, en noir et blanc comme une gravure.
  var inp=document.querySelector('.photo-dropzone input[type=file]');
  if(inp)inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){main.removeAttribute('srcset');main.src=r.result;main.classList.add('mq-grave');
    var ok=document.querySelector('.mq-photo-ok');if(!ok){ok=document.createElement('span');ok.className='mq-photo-ok';inp.closest('.photo-upload').appendChild(ok)}ok.textContent='Photo choisie : '+f.name+' (aperçu en noir et blanc, comme la gravure)';
    window.scrollTo({top:0,behavior:'smooth'})};r.readAsDataURL(f)});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX, ensure_ascii=False))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Puzzle photo gravé » (prix proposés, à valider) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Puzzle photo gravé — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "puzzle-photo.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "puzzle-photo.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
