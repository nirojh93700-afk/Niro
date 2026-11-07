#!/usr/bin/env python3
"""Maquette « Papeterie » (07/11/2026, gérant : « tu peux mettre aussi les marque-pages alors ? » → « Oui fais la maquette »).
L'onglet « Marque-pages » devient « Papeterie » : marque-pages en bois, en métal, et un rayon « Carnets » (carnet A5 gravé).
Base = la VRAIE page /boutique/marque-pages du site (next start local), feuilles de style et polices intégrées, scripts retirés.
Usage : python3 tools/maquettes/papeterie.py <capture /boutique/marque-pages> <sortie.html>   (lancer depuis la racine du dépôt)
"""
import base64, io, os, re, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
h = open(SRC, encoding="utf-8").read()

def img_uri(path, w=700):
    im = Image.open(path).convert("RGB"); im.thumbnail((w, w * 2))
    b = io.BytesIO(); im.save(b, "JPEG", quality=80)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

def pub(url):
    p = os.path.join("public", url.lstrip("/").split("?")[0])
    return img_uri(p) if os.path.exists(p) else url

# styles + polices du site
def css_inline(m):
    css = open(os.path.join(".next", m.group(1).split("/_next/", 1)[1]), encoding="utf-8").read()
    def font(mm):
        f = os.path.join(".next", mm.group(1).split("/_next/", 1)[1])
        return "url(data:font/woff2;base64," + base64.b64encode(open(f, "rb").read()).decode() + ")" if os.path.exists(f) else mm.group(0)
    return "<style>" + re.sub(r"url\((/_next/static/media/[^)]+)\)", font, css) + "</style>"
h = re.sub(r'<link rel="stylesheet" href="(/_next/static/css/[^"]+)"[^>]*/>', css_inline, h)
h = re.sub(r"<script\b.*?</script>", "", h, flags=re.S)
h = re.sub(r'<link rel="(?:preload|modulepreload)"[^>]*>', "", h)

# ── ce qui change ──
h = h.replace('<a href="/boutique/marque-pages">Marque-pages</a>', '<a href="/boutique/papeterie" class="pap-new">Papeterie</a>')
h = h.replace('href="/boutique/marque-pages">Marque-pages<!-- --> <small>3</small>', 'href="/boutique/papeterie">Papeterie<!-- --> <small>4</small>')
h = h.replace('Tout <small>92</small>', 'Tout <small>93</small>')
h = h.replace('<span aria-current="page">Marque-pages</span>', '<span aria-current="page">Papeterie</span>')
h = h.replace('>Marque-pages</h1>', '>Papeterie</h1>')
h = h.replace("<title>Marque-pages | Niv Création</title>", "<title>Papeterie | Niv Création</title>")
h = re.sub(r"<p>Des marque-pages en bois à graver.*?</p>",
           "<p>Des marque-pages et des carnets à graver d&#x27;un prénom, d&#x27;un dessin ou d&#x27;une photo, et des marque-pages en métal doré d&#x27;après Van Gogh et Monet.</p>", h, count=1, flags=re.S)
h = h.replace('<p class="mxup-count">3<!-- --> créations</p>', '<p class="mxup-count">4<!-- --> créations</p>')
h = h.replace('id="u-marque-pages"', 'id="u-papeterie"')
h = h.replace('aria-current="false">Marque-pages en métal</a></nav>',
              'aria-current="false">Marque-pages en métal</a><a class="puce" href="#r-papeterie-2" aria-current="false">Carnets</a></nav>')
CARNET = ('<section class="ur rv in" id="r-papeterie-2"><h3>Carnets<!-- --> <small>1 création</small></h3><div class="ug">'
  '<div class="uc" data-prix="12.9" data-prixmax="26.9"><a class="uc-link" href="#carnet"><span class="uc-img">'
  '<img class="uc-ph" src="%s" alt="Carnet A5 gravé, couverture aspect cuir"/><span class="uc-cta">Personnaliser</span></span>'
  '<span class="uc-meta"><span class="uc-tag">Nouveau</span><span class="uc-name">Carnet A5 gravé, couverture aspect cuir</span>'
  '<span class="uc-price">dès <!-- -->12,90 €</span></span></a>'
  '<button type="button" aria-label="Ajouter aux favoris" class="fav-pastille fav-pastille-vignette">♡</button></div></div></section>'
  ) % img_uri("docs/maquettes/assets/carnet/exemples/ex1.jpg")
k = h.find('<section class="ur rv in" id="r-marque-pages-1">'); k = h.find("</section>", k) + len("</section>")
h = h[:k] + CARNET + h[k:]
# photo d'en-tête : un marque-page ET un carnet
h = re.sub(r'<figure class="mxup-fig">.*?</figure>',
           '<figure class="mxup-fig pap-duo"><img src="%s" alt="Marque-pages en bois"/><img src="%s" alt="Carnet A5 gravé"/></figure>'
           % (pub("/marque-pages/m1/groupe.jpg"), img_uri("docs/maquettes/assets/carnet/exemples/ex2.jpg")), h, count=1, flags=re.S)
# images restantes du site
h = re.sub(r'src="(/(?:marque-pages|vignettes|produits|logo-niv-creation\.jpg|instagram-qr\.png)[^"]*)"', lambda m: 'src="%s"' % pub(m.group(1)), h)

BAND = ('<div class="pap-band"><b>Maquette</b> · l’onglet « Marque-pages » devient « Papeterie » : marque-pages en bois, en métal, '
        'et un rayon « Carnets ». Rien n’est en ligne. <span>Les changements sont entourés en or.</span></div>')
h = re.sub(r"(<body[^>]*>)", r"\1" + BAND, h, count=1)
CSS = """<style>
.pap-band{background:#1a1206;color:#f3e8d3;font:500 13px/1.45 Inter,system-ui,sans-serif;padding:9px 16px;text-align:center}
.pap-band b{color:#e2c67e}.pap-band span{opacity:.8}
.pap-new{outline:2px solid #c9a24b;outline-offset:3px;border-radius:6px}
.uv-tabs a[href="/boutique/papeterie"],#r-papeterie-2,.mxup-rayons a[href="#r-papeterie-2"],.pap-duo{outline:2px dashed #c9a24b;outline-offset:4px;border-radius:12px}
.pap-duo{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}
.pap-duo img{width:100%;height:100%;object-fit:cover;border-radius:inherit;min-height:0}
</style>"""
h = h.replace("</head>", CSS + "</head>", 1)
open(OUT, "w", encoding="utf-8").write(h)
print(OUT, round(len(h) / 1e6, 2), "Mo")
