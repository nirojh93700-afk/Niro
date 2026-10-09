#!/usr/bin/env python3
"""Maquette de la FICHE « Cristal photo 3D — Vertical » dans l'habillage du nouveau site — 09/10/2026 soir.

Gérant : « fais-moi une maquette pour le vertical quand je vais l'ouvrir ». Règle : MÊME CONTENU et MÊMES RÉGLAGES que la
fiche en ligne (galerie, tailles, photo, texte +5 €, police, place du texte, socle, total, quantité, panier, favoris,
réassurance, description, guide des tailles, accordéons, bloc confiance) — on part du VRAI rendu de la fiche
(`next start` + capture) et on ne change QUE l'habillage : écrin « Mélange » (encre & or) pour l'en-tête de fiche,
galerie arrondie 20 px, panneau blanc arrondi 28 px, pavés sable pour les tailles, champs arrondis, cartes claires.

Usage : python3 tools/maquettes/fiche-cristal-vertical.py <capture /produit/cristal-photo-3d-vertical.html>
Sortie : docs/maquettes/fiche-cristal-vertical.html (+ .fragment.html). Rien n'est touché dans le site.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
SRC = sys.argv[1]


def uri(path, w=900, q=76):
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
HEADER = src[body_start:i_main]
FOOTER = src[j_main:src.rfind("</body>")]
MAIN = src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        if garder:
            return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})"
        return "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

def local_src(m):
    p = os.path.join(PUB, m.group(2).lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith((".jpg", ".jpeg", ".png")) and os.path.getsize(p) > 120_000:
        return f'{m.group(1)}="{uri(p)}"'
    return f'{m.group(1)}="{raw_uri(p)}"'
for pat in (r'<button[^>]*>💬 Une question \?</button>', r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
    HEADER = re.sub(pat, "", HEADER); FOOTER = re.sub(pat, "", FOOTER)

# ---- la fiche : on garde TOUT, on remplace seulement la vidéo par son image d'attente (pas de vidéo dans une maquette)
POSTER = re.search(r'poster="([^"]+)"', MAIN).group(1)
MAIN = re.sub(r'<video class="gallery-bg gallery-video"[^>]*></video>', f'<img src="{POSTER}" alt="Cristal photo 3D vertical" id="galmain">', MAIN, 1)
MAIN = re.sub(r'<button class=" thumb-video" aria-label="Voir la vidéo"><video[^>]*></video></button>',
              f'<button class="active" aria-label="Voir la vidéo"><img src="{POSTER}" alt=""></button>', MAIN, 1)
MAIN = MAIN.replace('<a class="cf-shot">', '<a class="cf-shot">')
MAIN = re.sub(r'<div class="cf-shot"><img src="https://cdn\.shopify\.com[^"]*"[^>]*/></div>', "", MAIN)  # réalisation hébergée ailleurs : injoignable d'ici
MAIN = MAIN.replace('<main>', '<main class="mxf">', 1)
import urllib.parse
def next_image(m):  # <img src="/_next/image?url=%2Fproduits%2Fx.jpg&w=…"> → le fichier local
    q = urllib.parse.parse_qs(urllib.parse.urlparse(m.group(1).replace("&amp;", "&")).query)
    return f'src="{q.get("url", [""])[0]}"'
MAIN = re.sub(r'src="(/_next/image\?[^"]+)"', next_image, MAIN)
MAIN = re.sub(r'\s(?:srcset|srcSet)="[^"]*"', "", MAIN)
for part in ("HEADER", "FOOTER", "MAIN"):
    globals()[part] = re.sub(r'(src)="(/[^"]+)"', local_src, globals()[part])
    globals()[part] = re.sub(r'href="/[^"]*"', 'href="#"', globals()[part])

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mxf{--cream:#fbf7ee;--paper:#fdfaf3;--sand:#f3e8d3;--sand2:#eadbbf;--ink:#1a1206;--ink2:#241a0c;--muted:#6b5f4b;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;--r:20px;--r2:14px;--r3:28px;--sh:0 14px 36px rgba(26,18,6,.10);--ink-soft:var(--muted);--line:var(--sand2);background:var(--cream)}
.mxf>nav.container{padding-top:16px!important;color:var(--muted)!important}
.mxf .product-layout{gap:clamp(22px,3vw,40px);padding:22px 0 64px;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}
/* galerie */
.mxf .gallery-main{border-radius:var(--r);box-shadow:var(--sh);background:var(--sand)}
.mxf .gallery-main.gallery-contain{background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.mxf .gallery-arrow{background:rgba(255,255,255,.9);border:0;box-shadow:0 6px 16px rgba(26,18,6,.14)}
.mxf .gallery-thumbs{gap:8px;margin-top:12px}
.mxf .gallery-thumbs button{width:62px;height:62px;border-radius:12px;border:2px solid transparent;background:var(--sand)}
.mxf .gallery-thumbs button.active{border-color:var(--gold)}
.mxf .gallery-thumbs button.thumb-video::after{display:none}
/* panneau = la fiche */
.mxf .product-info{background:#fff;border-radius:var(--r3);box-shadow:var(--sh);padding:22px 22px 24px}
.mxf .product-info .breadcrumb{display:none}
.mxf .product-info h1{font-family:var(--font-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;font-size:clamp(1.45rem,2.6vw,1.9rem);line-height:1.15;margin:0 0 8px;text-wrap:balance}
.mxf .pd-titrerow{align-items:flex-start}
.mxf .fav-pastille{border-color:var(--sand2)}
.mxf .product-info>p[style]{color:var(--muted)!important;margin:0 0 12px!important}
.mxf .product-info .price-lead{font-family:var(--font-display),Georgia,serif;font-weight:400;font-size:1.7rem;color:var(--gold-t);margin-bottom:18px}
.mxf .field{margin-bottom:16px}
.mxf .field label{font-size:.92rem;color:var(--ink)}
.mxf .field label span[style]{color:var(--muted)!important}
.mxf .crystal-sizes{grid-template-columns:1fr 1fr}
.mxf .crystal-sizes .variant-swatch{padding:11px 12px}
.mxf .crystal-sizes .vs-price{position:static;display:block;margin-top:4px}
.mxf .field select,.mxf .field input{border:1.5px solid var(--sand2);border-radius:var(--r2);background:#fff;padding:12px 14px}
.mxf .field select:focus,.mxf .field input:focus{outline:0;border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,162,75,.18)}
.mxf .photo-dropzone{border:1.5px dashed var(--sand2);background:#fff;border-radius:var(--r2);color:var(--ink);font-weight:600;padding:16px;text-align:center;display:block;cursor:pointer}
.mxf .photo-dropzone:hover{border-color:var(--gold)}
.mxf .perso-hint,.mxf .photo-check-note{background:none;border:0;padding:0;margin:8px 0 14px;color:var(--muted);font-size:.78rem;line-height:1.5}
.mxf .perso-hint-img{border-radius:var(--r2)}
.mxf .engrave-preview .ep-label{color:var(--muted);font-size:.8rem}
.mxf .engrave-preview .ep-plate{border-radius:var(--r2)}
.mxf .pd-nfois{color:var(--muted);font-size:.84rem}
.mxf .fav-ligne{color:var(--muted)}
.mxf .trust-cards{gap:8px}
.mxf .tcard{border:0;background:var(--sand);border-radius:var(--r2)}
.mxf .tcard b{color:var(--ink)}.mxf .tcard small{color:var(--muted)}
.mxf .product-desc{color:var(--ink)}
.mxf .product-desc h3{font-family:var(--font-display),Georgia,serif;font-weight:600}
.mxf .crystal-guide-section{background:var(--sand);border-radius:var(--r);padding:18px 16px 22px;margin:22px 0 10px}
.mxf .crystal-guide-section h3{font-family:var(--font-display),Georgia,serif;text-align:center}
.mxf .crystal-guide-section .cg-hint{text-align:center}
.mxf .crystal-guide .cg-item b{color:var(--gold-t)}
.mxf .info-accordion details{border:1.5px solid var(--sand2);border-radius:var(--r2);background:#fff;margin-bottom:8px;padding:0 14px}
.mxf .info-accordion summary{padding:13px 0;font-weight:600}
.mxf .info-accordion .info-body{color:var(--muted);padding-bottom:14px}
/* bloc confiance = écrin encre & or, comme les ouvertures des autres maquettes */
.mxf .confiance{background:radial-gradient(60% 90% at 85% 0%,rgba(201,162,75,.30),transparent 60%),var(--ink2);color:#fff;padding:clamp(40px,6vw,64px) 0;border:0}
.mxf .confiance .cf-eyebrow{display:none}
.mxf .confiance .cf-title{color:#fff;font-family:var(--font-display),Georgia,serif;font-weight:600}
.mxf .confiance .cf-sub{color:#d9ccb0}
.mxf .cf-card{background:rgba(255,255,255,.06);border:1px solid rgba(226,198,126,.35);border-radius:var(--r);box-shadow:none}
.mxf .cf-card .cf-t{color:#fff}.mxf .cf-card .cf-d{color:#b8a98a}
.mxf .cf-real-h{color:var(--gold-l)}
.mxf .cf-shot{border-radius:var(--r2);overflow:hidden;box-shadow:0 0 0 1px rgba(226,198,126,.5)}
@media (max-width:860px){
  .mxf .product-layout{grid-template-columns:1fr;gap:18px;padding-top:14px}
  .mxf .product-info{padding:18px 16px 20px;border-radius:22px}
  .mxf .gallery-thumbs button{width:56px;height:56px}
}
'''

JS = r'''
(function(){
  var P={Petit:39.9,Moyen:59.9,Grand:99.9,XL:149.9},S={Petit:14.9,Moyen:19.9,Grand:19.9,XL:19.9};
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Petit',q:1};
  var sw=[].slice.call(document.querySelectorAll('.crystal-sizes .variant-swatch'));
  var socle=document.getElementById('pf-socle'),txt=document.getElementById('pf-texte'),cnt=document.querySelector('.char-count');
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  function maj(){var u=P[st.t]+(socle.value==='oui'?S[st.t]:0)+(txt.value.trim()?5:0);tot.textContent=eur(u*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;
    var o=socle.options[socle.options.length-1];o.textContent='Avec socle LED — +'+eur(S[st.t])}
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();maj()})});
  socle.addEventListener('change',maj);txt.addEventListener('input',function(){cnt.textContent=txt.value.length+'/40';maj()});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  th.forEach(function(b){b.addEventListener('click',function(){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.src=b.querySelector('img').src})});
  var i=0;document.querySelector('.gallery-arrow-next').addEventListener('click',function(){i=(th.indexOf(document.querySelector('.gallery-thumbs button.active'))+1)%th.length;th[i].click()});
  document.querySelector('.gallery-arrow-prev').addEventListener('click',function(){i=(th.indexOf(document.querySelector('.gallery-thumbs button.active'))-1+th.length)%th.length;th[i].click()});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Cristal photo 3D — Vertical » (même contenu, mêmes réglages, nouvel habillage) · <b>rien n\'est encore sur le site</b></div>'
TITLE = "<title>Fiche Cristal photo 3D vertical — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "fiche-cristal-vertical.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "fiche-cristal-vertical.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
