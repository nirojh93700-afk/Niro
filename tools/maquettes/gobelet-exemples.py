# Images d'exemple du gobelet gravé (maquette parcours guidé, 05/11/2026) — dessins numérotés réels + prénoms d'exemple.
# Jamais le nom du gérant. La gravure prend la couleur de la BANDE du haut (gérant, 05/11/2026) : dorée sur le crème et
# le rose (bande dorée), irisée sur le bleu marine et le blanc (bande multicolore). Léger galbe du cylindre.
# Usage : python3 -I tools/maquettes/gobelet-exemples.py  → docs/maquettes/assets/gobelet/exemples/ex*.jpg
import math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

D = "/home/user/Niro/docs/maquettes/assets/marque-pages/dessins/"
A = "/home/user/Niro/docs/maquettes/assets/gobelet"
H = A
CX, HALF = 380, 112          # axe et demi-largeur visibles du corps (photo 720 px)
METAL = {"creme": (150, 138, 118), "blanc": (150, 146, 140), "rose": (150, 132, 124), "marine": (214, 216, 222)}
FONTS = {"gv": f"{A}/fonts/GreatVibes-Regular.ttf", "al": f"{A}/fonts/Allura-Regular.ttf", "ci": f"{A}/fonts/Cinzel.ttf"}


def dessin(n, hauteur):
    im = Image.open(f"{D}{n:03d}.png").convert("RGBA")
    a = np.asarray(im).astype(float)
    # encre = noir opaque
    ink = (a[..., 3] / 255) * np.clip((200 - a[..., :3].mean(2)) / 140, 0, 1)
    m = Image.fromarray((ink * 255).astype("uint8"))
    w = round(m.width * hauteur / m.height)
    return m.resize((w, hauteur), Image.LANCZOS)


def texte(t, font, taille):
    f = ImageFont.truetype(FONTS[font], taille)
    if font == "ci":
        try: f.set_variation_by_axes([600])
        except Exception: pass
    b = f.getbbox(t)
    m = Image.new("L", (b[2] - b[0] + 20, b[3] - b[1] + 20), 0)
    ImageDraw.Draw(m).text((10 - b[0], 10 - b[1]), t, font=f, fill=255)
    return m


def photo(p, hauteur, clair):
    """Photo gravée : points (tramage) ; sur un gobelet clair le laser grave les zones sombres, sur un foncé les claires."""
    im = Image.open(p).convert("L")
    w = round(im.width * hauteur / im.height)
    im = im.resize((w, hauteur), Image.LANCZOS)
    from PIL import ImageOps
    im = ImageOps.autocontrast(im, cutoff=2)
    if clair: im = ImageOps.invert(im)
    # fondu des bords (ovale doux) pour ne pas graver un rectangle
    yy, xx = np.mgrid[0:hauteur, 0:w]
    r = ((xx - w / 2) / (w / 2)) ** 2 + ((yy - hauteur / 2) / (hauteur / 2)) ** 2
    fondu = np.clip((1.0 - r) / 0.25, 0, 1)
    a = np.asarray(im).astype(float) * fondu
    d = Image.fromarray(a.astype("uint8")).convert("1")       # tramage Floyd-Steinberg
    return d.convert("L").filter(ImageFilter.GaussianBlur(0.35))


def galbe(m):
    """Le motif suit le cylindre : resserré vers les bords."""
    w, h = m.size
    src = np.asarray(m).astype(float); out = np.zeros_like(src)
    for x in range(w):
        dx = (x - w / 2) / HALF                      # position sur la face vue
        if abs(dx) >= 0.98: continue
        u = math.asin(dx) * HALF                     # abscisse « déroulée »
        xs = int(round(w / 2 + u))
        if 0 <= xs < w: out[:, x] = src[:, xs]
    return Image.fromarray(out.astype("uint8"))


def rendu(couleur, elements, sortie):
    g = Image.open(f"{A}/vierges/{couleur}.jpg").convert("RGB")
    W, Hh = g.size
    alpha = Image.new("L", (W, Hh), 0)
    for e in elements:
        m = dessin(e["n"], e["h"]) if "n" in e else photo(e["p"], e["h"], couleur != "marine") if "p" in e else texte(e["t"], e["f"], e["s"])
        # largeur max : la face visible
        if m.width > 2 * HALF * 0.86:
            r = 2 * HALF * 0.86 / m.width; m = m.resize((round(m.width * r), round(m.height * r)), Image.LANCZOS)
        m = galbe(m)
        x = CX - m.width // 2; y = e["cy"] - m.height // 2
        alpha.paste(Image.fromarray(np.maximum(np.asarray(alpha.crop((x, y, x + m.width, y + m.height))), np.asarray(m))), (x, y))
    base = np.asarray(g).astype(float)
    al = np.asarray(alpha.filter(ImageFilter.GaussianBlur(0.4))).astype(float) / 255 * 0.95
    xs = np.arange(W)[None, :, None].astype(float); ys = np.arange(Hh)[:, None, None].astype(float)
    if couleur in ("marine", "blanc"):
        # bande multicolore → gravure irisée (photos du fournisseur : turquoise → bleu → violet → bronze rosé)
        stops = np.array([[70, 220, 190], [40, 170, 200], [60, 90, 205], [120, 60, 185], [190, 95, 150], [205, 140, 110]], float)
        t = np.clip(((xs - (CX - HALF)) / (2 * HALF)) * 0.85 + ((ys - 160) / 300) * 0.25, 0, 1)
        k = t * (len(stops) - 1); i0 = np.floor(k).astype(int).clip(0, len(stops) - 2); f = k - i0
        met = stops[i0[..., 0]] * (1 - f) + stops[i0[..., 0] + 1] * f
        if couleur == "marine":
            st2 = np.array([[95, 240, 205], [110, 225, 150], [80, 200, 235], [155, 120, 240], [225, 130, 210], [235, 175, 140]], float)
            met = st2[i0[..., 0]] * (1 - f) + st2[i0[..., 0] + 1] * f
    else:
        # bande dorée → gravure dorée
        eclat = 1 + 0.10 * np.cos((xs - CX - 30) / HALF * 1.2)
        met = np.array([188, 150, 78], float) * eclat
    res = base * (1 - al[..., None]) + np.clip(met, 0, 255) * al[..., None]
    Image.fromarray(res.clip(0, 255).astype("uint8")).save(sortie, quality=92)


EXEMPLES = [
    ("creme",  [{"n": 48, "h": 170, "cy": 270}, {"t": "Camille", "f": "gv", "s": 64, "cy": 395}], "ex1-creme-papillon-camille.jpg"),
    ("marine", [{"n": 67, "h": 185, "cy": 268}, {"t": "PAUL", "f": "ci", "s": 46, "cy": 400}], "ex2-marine-cheval-paul.jpg"),
    ("rose",   [{"n": 22, "h": 165, "cy": 268}, {"t": "Léa", "f": "gv", "s": 70, "cy": 395}], "ex3-rose-rose-lea.jpg"),
    ("creme",  [{"p": "/home/user/Niro/docs/maquettes/assets/marque-pages/exemples/portraits/enfant-chien.jpg", "h": 205, "cy": 275}, {"t": "Mon meilleur ami", "f": "gv", "s": 44, "cy": 405}], "ex5-creme-photo-meilleur-ami.jpg"),
    ("marine", [{"t": "Super Papy", "f": "gv", "s": 66, "cy": 262}, {"t": "DEPUIS 2026", "f": "ci", "s": 26, "cy": 322}], "ex6-marine-texte-super-papy.jpg"),
    ("rose",   [{"p": "/home/user/Niro/docs/maquettes/assets/marque-pages/exemples/portraits/couple.jpg", "h": 205, "cy": 272}, {"t": "Léa & Paul", "f": "gv", "s": 50, "cy": 400}, {"t": "12.06.2026", "f": "ci", "s": 22, "cy": 436}], "ex7-rose-photo-couple.jpg"),
    ("blanc",  [{"p": "/home/user/Niro/docs/maquettes/assets/marque-pages/exemples/portraits/femme.jpg", "h": 210, "cy": 272}, {"t": "Maman", "f": "gv", "s": 60, "cy": 405}], "ex8-blanc-photo-maman.jpg"),
    ("marine", [{"n": 13, "h": 26, "cy": 175}, {"n": 64, "h": 150, "cy": 262}, {"n": 89, "h": 88, "cy": 388}, {"t": "Camille", "f": "gv", "s": 30, "cy": 381}, {"n": 3, "h": 38, "cy": 445}], "ex9-marine-plusieurs-images.jpg"),
    ("blanc",  [{"n": 71, "h": 175, "cy": 268}, {"t": "Inès", "f": "al", "s": 72, "cy": 395}], "ex4-blanc-colibri-ines.jpg"),
]
for c, els, out in EXEMPLES:
    rendu(c, els, f"{A}/exemples/{out}")
    print(out)
