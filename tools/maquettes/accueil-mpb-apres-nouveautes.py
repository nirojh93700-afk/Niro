#!/usr/bin/env python3
"""Maquette (06/11/2026) : le bloc « Nos marque-pages gravés sont arrivés » descend APRÈS
« Les dernières sorties de l'atelier », et le gobelet passe juste après le verre à whisky.

Usage : python3 tools/maquettes/accueil-mpb-apres-nouveautes.py <src.html capturé> <sortie.html>
(src = curl https://nivcreation.fr/). Rien n'est touché sur le site : seule la page capturée
est réarrangée (CSS du site intégré, photos intégrées, scripts retirés).
"""
import base64, io, os, re, sys, urllib.request

from PIL import Image

src, sortie = sys.argv[1], sys.argv[2]
h = open(src, encoding="utf-8").read()
SITE = "https://nivcreation.fr"


def bloc(h, debut):
    """Renvoie (a, b) de la <section …> qui commence à `debut` (sections non imbriquées)."""
    a = h.find(debut)
    assert a >= 0, debut
    b = h.find("</section>", a) + len("</section>")
    return a, b


# 1. Le bloc marque-pages sort de sa place et se pose juste après le rail des nouveautés.
a, b = bloc(h, '<section class="mpb rv"')
mpb = h[a:b]
h = h[:a] + h[b:]
a2, b2 = bloc(h, '<section class="sec rail-sec rv" id="nouveautes"')
rail = h[a2:b2]

# 2. Dans le rail : le gobelet passe en 2ᵉ, juste après le verre à whisky.
cartes = re.findall(r'<div class="uc"[^>]*>.*?</button></div>', rail, re.S)
slug = lambda c: (re.search(r'href="/([^"]+)"', c) or re.search(r'()', c)).group(1).split('/')[-1]
ordre = [slug(c) for c in cartes]
assert "gobelet-isotherme-40oz" in ordre and ordre[0] == "verre-a-whisky-grave", ordre
gob = next(c for c in cartes if slug(c) == "gobelet-isotherme-40oz")
reste = [c for c in cartes if slug(c) not in ("gobelet-isotherme-40oz", "verre-a-whisky-grave")]
nouvel = [cartes[0], gob] + reste
# Deux lignes de 5 : on remplace chaque rangée par sa nouvelle moitié.
tetes = re.findall(r'<div class="rail"[^>]*>', rail)
assert len(tetes) == 2, tetes
m = (len(nouvel) + 1) // 2
debut = rail.find(tetes[0]); fin = rail.rfind("</section>")
rail_neuf = rail[:debut] + tetes[0] + "".join(nouvel[:m]) + "</div>" + tetes[1] + "".join(nouvel[m:]) + "</div>" + rail[fin:]
h = h[:a2] + rail_neuf + '<div class="mq-fleche">▼ bloc « marque-pages » déplacé ici ▼</div>' + mpb + h[b2:]

# 3. Page figée : feuilles du site intégrées, scripts retirés, photos en data URI (réduites).
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
        im.thumbnail((520, 520)); o = io.BytesIO(); im.save(o, "JPEG", quality=76)
        cache[url] = "data:image/jpeg;base64," + base64.b64encode(o.getvalue()).decode()
    except Exception:
        cache[url] = url
    return cache[url]


h = re.sub(r'\s(srcset|sizes)="[^"]*"', "", h)
h = re.sub(r'(<img[^>]+?src=")(/[^"]+)"', lambda m: m.group(1) + uri(SITE + m.group(2)) + '"', h)
h = re.sub(r'url\((/_next/image[^)]*)\)', "none", h)
style = "<style>" + css + """
.rv{opacity:1!important;transform:none!important}
.mq-fleche{max-width:1140px;margin:18px auto 0;padding:10px 16px;border:2px dashed #b3261e;border-radius:12px;color:#b3261e;font:600 .9rem/1.3 system-ui,sans-serif;text-align:center;background:#fff5f4}
.mq-bandeau{position:sticky;top:0;z-index:50;background:#1a1206;color:#f3e8d3;padding:8px 16px;font:600 .85rem/1.3 system-ui,sans-serif;text-align:center}
</style>"""
h = h.replace("</head>", style + "</head>", 1)
h = h.replace("<body", '<body data-maquette="1"', 1)
h = re.sub(r"(<body[^>]*>)", r'\1<div class="mq-bandeau">MAQUETTE · bloc marque-pages après « Les dernières sorties » · gobelet juste après le verre à whisky</div>', h, count=1)
h = re.sub(r"<title>.*?</title>", "<title>Accueil : marque-pages après les nouveautés</title>", h, count=1, flags=re.S)
open(sortie, "w", encoding="utf-8").write(h)
print(sortie, len(h) // 1024, "Ko ; ordre des nouveautés :", [slug(c) for c in nouvel])
