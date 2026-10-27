#!/usr/bin/env python3
"""Maquette « bloc Marque-pages sur l'accueil » (27/10/2026, gérant : « est-ce que t'as mis sur l'accueil une fenêtre ou un truc pour
donner envie aux clients ? Fais-moi une maquette »). Part du VRAI accueil (capture `curl localhost:3140/` après build + `next start`) :
mêmes feuilles de style, photos en data URI, scripts retirés ; seul le bloc est AJOUTÉ (encadré pointillé), entre le haut de page
(cristal + ruban) et les bijoux. Rien n'est touché dans le site.
Usage : python3 tools/maquettes/accueil-marque-pages.py <accueil-src.html>  → docs/maquettes/accueil-marque-pages.html (+ .fragment.html)"""
import base64, html, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "docs", "maquettes")
src = open(sys.argv[1], encoding="utf-8").read()

def uri(path, w=640, q=72):
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
def raw(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

# 1. scripts retirés, feuilles de style intégrées (polices next/font intégrées aussi)
src = re.sub(r"<script\b[^>]*>.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", src)
css = ""
for f in sorted(set(re.findall(r'/_next/static/css/([a-f0-9]+\.css)', src))):
    c = open(os.path.join(ROOT, ".next", "static", "css", f), encoding="utf-8").read()
    c = re.sub(r'url\((/_next/static/media/[^)]+\.woff2)\)', lambda m: "url(" + raw(os.path.join(ROOT, ".next", m.group(1)[len("/_next/"):]), "font/woff2") + ")", c)
    css += c + "\n"
src = re.sub(r'<link[^>]+/_next/static/css/[^>]+>', "", src)
src = src.replace("</head>", f"<style>{css}</style></head>", 1)

# 2. photos locales en data URI, logo = copie du logo du site (adresse Shopify injoignable d'ici)
LOGO = uri(os.path.join(OUT, "assets", "logo-source.jpg"), 900, 80)
src = re.sub(r'src="https://cdn\.shopify\.com/[^"]*IMG_6758[^"]*"', f'src="{LOGO}"', src)
cache = {}
def local(m):
    p = html.unescape(m.group(1)).split("?")[0]
    fp = os.path.join(ROOT, "public", p.lstrip("/"))
    if not os.path.exists(fp): return m.group(0)
    if p not in cache: cache[p] = uri(fp, 640 if "cristal-v-femme" not in p else 900)
    return f'src="{cache[p]}"'
src = re.sub(r'src="(/produits/[^"]+)"', local, src)
src = re.sub(r'src="(/instagram-qr\.png)"', lambda m: f'src="{raw(os.path.join(ROOT, "public", "instagram-qr.png"), "image/png")}"', src)


src = re.sub(r'src="(/marque-pages/[^"]+)"', local, src)
src = re.sub(r'src="/logo-niv-creation\.jpg"', f'src="{LOGO}"', src)
def img(p, w=520):
    return uri(os.path.join(ROOT, "public", p.lstrip("/")), w, 78)

BLOC = f'''<section class="mpb" aria-labelledby="t-mpb"><span class="mq-tag">Nouveau bloc</span>
<div class="mpb-in">
  <div class="mpb-pics">
    <a class="mpb-pic p1" href="/boutique/marque-pages"><img src="{img('/marque-pages/m1/exemple-ex1.jpg')}" alt="Marque-page en bois gravé « Camille » et papillons"/></a>
    <a class="mpb-pic p2" href="/boutique/marque-pages"><img src="{img('/marque-pages/m2/exemple-ex2.jpg')}" alt="Marque-page ajouré, oiseau et magnolia, gravé « Léa »"/></a>
    <a class="mpb-pic p3" href="/boutique/marque-pages"><img src="{img('/marque-pages/m1/exemple-ex7.jpg')}" alt="Marque-page en bois gravé d'une photo et « Pour Mamie »"/></a>
  </div>
  <div class="mpb-copy">
    <span class="mpb-pill"><i></i>Nouveau à l'atelier</span>
    <h2 id="t-mpb">Nos marque-pages <em>gravés</em> sont arrivés</h2>
    <p>En bois, gravés d'un prénom, d'un dessin ou même d'une photo, sur la face comme au dos. Et des marque-pages en métal doré, d'après Van Gogh et Monet.</p>
    <ul class="mpb-pts"><li>Gravés dans notre atelier en France</li><li>Seuls, en boîte cadeau ou en coffret de 2 ou 4</li><li>Un cadeau pour tous ceux qui aiment lire</li></ul>
    <p class="mpb-price"><span>à partir de</span><b>9,90 €</b></p>
    <a class="mxbtn mxbtn-gold" href="/boutique/marque-pages"><span>Découvrir les marque-pages</span><svg class="mxic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
  </div>
</div></section>'''

NOTES = '''<div class="mq-bar" role="region" aria-label="Maquette"><div class="mq-in"><b>Maquette, rien n’est en ligne</b>
<span>Bloc ajouté sur l’accueil, entre le cristal et les bijoux (encadré en pointillé). Le reste est l’accueil actuel.</span></div></div>'''

CSS = '''
.mq-bar{background:#1a1206;color:#d9ccb0;font:400 .82rem/1.45 Inter,system-ui,sans-serif}
.mq-in{display:flex;gap:6px 16px;flex-wrap:wrap;align-items:center;padding:9px clamp(16px,4.5vw,72px);max-width:1300px;margin:0 auto}.mq-in b{color:#e2c67e}
.rv{opacity:1!important;transform:none!important}
.mpb{position:relative;margin:28px clamp(16px,4.5vw,72px);outline:2px dashed #c9a24b;outline-offset:6px;border-radius:24px;background:radial-gradient(120% 120% at 15% 0%,#2b2214 0%,#1a1206 60%);color:#f3e8d3;overflow:hidden}
.mq-tag{position:absolute;top:10px;right:12px;z-index:3;background:#c9a24b;color:#1a1206;font:700 .68rem/1 Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px;border-radius:999px}
.mpb-in{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(20px,4vw,56px);align-items:center;padding:clamp(28px,5vw,64px);max-width:1180px;margin:0 auto}
.mpb-pics{position:relative;height:clamp(300px,34vw,440px)}
.mpb-pic{position:absolute;display:block;border-radius:16px;overflow:hidden;background:#f6efe1;box-shadow:0 18px 40px rgba(0,0,0,.45);border:1px solid rgba(226,198,126,.55)}
.mpb-pic img{display:block;width:100%;height:100%;object-fit:cover}
.mpb-pic.p1{left:0;top:6%;width:44%;height:84%;transform:rotate(-4deg);z-index:2}
.mpb-pic.p2{left:30%;top:0;width:44%;height:88%;transform:rotate(2deg);z-index:3}
.mpb-pic.p3{right:0;top:10%;width:40%;height:80%;transform:rotate(5deg);z-index:1}
.mpb-pill{display:inline-flex;align-items:center;gap:8px;font:600 .74rem/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#e2c67e;border:1px solid rgba(226,198,126,.5);border-radius:999px;padding:7px 12px}
.mpb-pill i{width:7px;height:7px;border-radius:50%;background:#e2c67e;box-shadow:0 0 0 4px rgba(226,198,126,.18)}
.mpb h2{font-family:var(--font-display),"Playfair Display",serif;font-weight:600;font-size:clamp(1.7rem,3.4vw,2.6rem);line-height:1.12;margin:16px 0 12px;color:#fbf7ee;text-wrap:balance}
.mpb h2 em{color:#e2c67e}
.mpb-copy>p{margin:0 0 14px;color:#d9ccb0;line-height:1.6;max-width:52ch}
.mpb-pts{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:8px}
.mpb-pts li{position:relative;padding-left:22px;color:#efe4cc;font-size:.94rem}
.mpb-pts li::before{content:"✦";position:absolute;left:0;color:#c9a24b}
.mpb-price{display:flex;align-items:baseline;gap:8px;margin:0 0 18px!important}.mpb-price span{font-size:.85rem;color:#bfae86}.mpb-price b{font-size:1.5rem;color:#e2c67e}
@media (max-width:820px){.mpb-in{grid-template-columns:1fr}.mpb-pics{height:300px;max-width:420px;width:100%;margin:0 auto}}
@media (max-width:480px){.mpb{margin:22px 16px;border-radius:20px}.mpb-in{padding:26px 18px 28px}.mpb-pics{height:250px}}
'''

marker = '<section class="mxband bij bij2 rv"'
assert marker in src
page = src.replace(marker, BLOC + marker, 1)
page = page.replace("</head>", f"<style>{CSS}</style></head>", 1)
page = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + NOTES, page, count=1)
page = page.replace("</body>", "<script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(a)e.preventDefault()})</script></body>", 1)
page = re.sub(r"<title>.*?</title>", "<title>Accueil · Marque-pages</title>", page, count=1)
open(os.path.join(OUT, "accueil-marque-pages.html"), "w", encoding="utf-8").write(page)
head = re.search(r"<head>(.*?)</head>", page, flags=re.S).group(1)
head = re.sub(r"<meta[^>]+>", "", head); head = re.sub(r"<link[^>]+>", "", head)
body = re.search(r"<body[^>]*>(.*)</body>", page, flags=re.S).group(1)
open(os.path.join(OUT, "accueil-marque-pages.fragment.html"), "w", encoding="utf-8").write(head + body)
print("ok", len(page) // 1024, "Ko")
