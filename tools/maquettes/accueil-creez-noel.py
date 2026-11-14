#!/usr/bin/env python3
"""Maquette (14/11/2026) : l'accueil ACTUEL du site, avec le bloc « Créez votre déco de Noël » ajouté plus bas,
après les verres et le bloc Noël, et l'entrée du menu juste après « Bébé & Enfant ». RIEN en ligne.

  python3 tools/maquettes/accueil-creez-noel.py <src.html> docs/maquettes/assets/creez-le-votre <sortie.html>

src = curl https://nivcreation.fr/ . Seule la page capturée est modifiée (CSS du site intégré, photos intégrées, scripts retirés).
"""
import base64, io, os, re, sys, urllib.request

from PIL import Image

src, dimg, sortie = sys.argv[1:4]
h = open(src, encoding="utf-8").read()
SITE = "https://nivcreation.fr"


def webp(nom):
    return "data:image/webp;base64," + base64.b64encode(open(os.path.join(dimg, nom + ".webp"), "rb").read()).decode()


# 1. Menu : l'entrée juste après « Bébé & Enfant »
BEBE = '<a href="/boutique/enfants">Bébé &amp; Enfant</a>'
assert BEBE in h
h = h.replace(BEBE, BEBE + '<a class="cnx-menu" href="#cnx">🎄 Créez votre déco de Noël</a>', 1)

# 2. Le bloc, juste après « Ce Noël, offrez un cadeau unique » (lui-même après les verres)
a = h.find('<section class="mxnoel')
assert a > h.find('<section class="sec verres'), "ordre de l'accueil changé"
b = h.find("</section>", a) + len("</section>")
TRIO = "".join('<a href="#cnx"><img src="%s" alt="%s"></a>' % (webp(n), t)
               for n, t in [("deco-1", "Décoration à suspendre"), ("deco-4", "Décoration à suspendre"), ("maison", "Maisonnette en bois")])
BLOC = ('<div class="mq-fleche">▼ NOUVEAU BLOC, ajouté ici : après les verres et le bloc « Ce Noël, offrez un cadeau unique » ▼</div>'
        '<section class="cnx" id="cnx" aria-labelledby="t-cnx"><div class="cnx-in">'
        '<div class="cnx-copy"><small>Noël 2026 · à créer vous-même</small><h2 id="t-cnx">Créez votre <em>déco de Noël</em></h2>'
        '<p>Une boule au prénom de chacun, une petite maison ajourée : écrivez le prénom, elle se dessine sous vos yeux. '
        'Nous la découpons, la gravons et l\'assemblons dans notre atelier.</p>'
        '<a class="cnx-btn" href="#cnx">Créer la mienne</a></div>'
        '<div class="cnx-trio">' + TRIO + '</div></div></section>'
        '<div class="mq-fleche">▲ fin du nouveau bloc · la suite de l\'accueil ne change pas ▲</div>')
h = h[:b] + BLOC + h[b:]

# 3. Page figée : feuilles du site intégrées, scripts retirés, photos en data URI (réduites)
css = ""
for m in re.finditer(r'<link[^>]+href="(/_next/static/css/[^"]+)"[^>]*>', h):
    css += urllib.request.urlopen(SITE + m.group(1), timeout=30).read().decode()
h = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', "", h)
h = re.sub(r"<script\b.*?</script>", "", h, flags=re.S)
h = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", h)
cache = {}


def uri(url):
    if url in cache: return cache[url]
    try:
        im = Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=30).read())).convert("RGB")
        im.thumbnail((520, 520)); o = io.BytesIO(); im.save(o, "JPEG", quality=74)
        cache[url] = "data:image/jpeg;base64," + base64.b64encode(o.getvalue()).decode()
    except Exception:
        cache[url] = url
    return cache[url]


h = re.sub(r'\s(srcset|sizes)="[^"]*"', "", h)
h = re.sub(r'(<img[^>]+?src=")(/[^"]+)"', lambda m: m.group(1) + uri(SITE + m.group(2)) + '"', h)
h = re.sub(r'url\((/_next/image[^)]*)\)', "none", h)
style = "<style>" + css + r"""
.rv{opacity:1!important;transform:none!important}
.mq-bandeau{position:sticky;top:0;z-index:60;background:#1a1206;color:#f3e8d3;padding:8px 16px;font:600 .85rem/1.35 system-ui,sans-serif;text-align:center}
.mq-fleche{max-width:1140px;margin:18px auto 0;padding:10px 16px;border:2px dashed #b3261e;border-radius:12px;color:#b3261e;font:600 .9rem/1.3 system-ui,sans-serif;text-align:center;background:#fff5f4}
.cnx-menu{color:#a8322d!important;font-weight:700!important;border:2px dashed #c0392b;border-radius:999px;padding:4px 12px!important}
.cnx{padding:22px 16px}
.cnx-in{max-width:1140px;margin:0 auto;border-radius:28px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:26px;align-items:center;padding:34px;color:#fbf3e3;
 background:radial-gradient(120% 90% at 30% 0%,#c0392b 0%,#8f2219 60%,#6d170f 100%)}
.cnx-copy small{display:inline-block;font:700 .72rem/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#e2c67e;border:1px solid rgba(226,198,126,.6);border-radius:999px;padding:6px 12px}
.cnx h2{font-family:var(--font-display),'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.6rem);line-height:1.1;margin:14px 0 10px;color:#fff;text-wrap:balance}
.cnx h2 em{font-style:italic;color:#e2c67e}
.cnx p{margin:0 0 18px;color:#f6e7d0;line-height:1.55}
.cnx-btn{display:inline-flex;align-items:center;min-height:48px;padding:0 24px;border-radius:999px;background:#e2c67e;color:#1a1206;font-weight:700;text-decoration:none}
.cnx-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cnx-trio a{display:block;position:relative;aspect-ratio:3/4;overflow:hidden;background:#fffaf2;border-radius:18px;border:2px solid #e2c67e}
.cnx-trio img{position:absolute;left:10px;top:10px;width:calc(100% - 20px);height:calc(100% - 20px);max-width:none;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(60,40,20,.2))}
@media (max-width:860px){.cnx-in{grid-template-columns:1fr;padding:22px;gap:18px}}
</style>"""
h = h.replace("</head>", style + "</head>", 1)
BAN = '<div class="mq-bandeau">MAQUETTE · l’accueil actuel du site + le bloc « Créez votre déco de Noël » (plus bas, encadré en rouge) + l’entrée du menu après « Bébé &amp; Enfant ». Rien n’est en ligne.</div>'
h = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + BAN, h, count=1)
h = re.sub(r"<title>.*?</title>", "<title>Accueil avec la déco de Noël</title>", h, count=1, flags=re.S)
JS = r"""<script>
document.addEventListener('click',function(e){var m=e.target.closest('.menu-toggle');if(m){var n=document.querySelector('.nav');if(n)n.classList.toggle('open');return}
 var c=e.target.closest('a[href="#cnx"]');if(c){e.preventDefault();var n2=document.querySelector('.nav');if(n2)n2.classList.remove('open');document.getElementById('cnx').scrollIntoView({behavior:'smooth',block:'center'});return}
 var a=e.target.closest('a');if(a){e.preventDefault()}});
</script>"""
h = h.replace("</body>", JS + "</body>", 1)
open(sortie, "w", encoding="utf-8").write(h)
print(sortie, len(h) // 1024, "Ko")
