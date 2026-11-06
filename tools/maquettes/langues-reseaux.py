#!/usr/bin/env python3
"""Images pour les RÉSEAUX (06/11/2026) : verres et bijoux gravés en ARABE, HÉBREU et CHINOIS (quelques-unes par langue).
Gérant : « ça peut fonctionner avec les autres langues… l'amour, bonne fête, bonne année… tu fais pas beaucoup ». RIEN sur le site.
Usage : python3 tools/maquettes/langues-reseaux.py <scratch> <sortie>
  <scratch>/site/*.png = aperçus du SITE (next start local, texte tapé dans la fiche, capture de .gallery-main ou du canvas 3D)
  <scratch>/fonts/     = NotoNaskhArabic, NotoSansHebrew, NotoSansSC, PlayfairDisplay, Inter (google/fonts, OFL)
Même habillage que tools/maquettes/tamoul-reseaux.py (bandeau encre & or, phrase, sens en français, produit, logo).
⚠️ La plaque acier en 3D n'affiche pas l'arabe (texte absent) : non utilisée.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
SC, OUT = sys.argv[1], sys.argv[2]
ROOT = "/home/user/Niro"; F = SC + "/fonts"
os.makedirs(OUT, exist_ok=True)

def font(name, size, wght=None, axes=None):
    f = ImageFont.truetype(f"{F}/{name}.ttf", size, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f

ECR = {"ar": ("NotoNaskhArabic", [700], "ARABE"), "he": ("NotoSansHebrew", [600, 100], "HÉBREU"), "zh": ("NotoSansSC", [600], "CHINOIS")}
IMGS = [  # (capture, langue, phrase, sens, produit)
  ("ar-whisky", "ar", "عيد مبارك", "Bonne fête de l'Aïd", "Verre à whisky gravé"),
  ("ar-vin", "ar", "أحبك", "Je t'aime", "Verre à vin gravé"),
  ("ar-chaine", "ar", "أبي", "Mon papa", "Bracelet chaîne acier"),
  ("he-flute", "he", "מזל טוב", "Félicitations", "Flûte à champagne gravée"),
  ("he-tumbler", "he", "שנה טובה", "Bonne année", "Verre tumbler en cristal"),
  ("he-papillon", "he", "אהבה", "Amour", "Bracelet papillon"),
  ("zh-cocktail", "zh", "新年快乐", "Bonne année", "Verre à cocktail gravé"),
  ("zh-vin", "zh", "生日快乐", "Joyeux anniversaire", "Verre à vin gravé"),
  ("zh-silicone", "zh", "爸爸", "Papa", "Bracelet acier & silicone"),
]

from PIL import ImageChops
LOGO = Image.open(ROOT + "/public/logo-niv-creation.jpg").convert("RGB")
OR = (201, 162, 75); CREME = (243, 232, 211); ENCRE = (26, 18, 6); GRIS = (190, 172, 135)
ZH = 790                     # hauteur de la zone photo ; le bandeau prend le reste (290 px), rien ne passe dessous
M = 56                       # marge gauche / droite du bandeau
LOGO_W = 200

def bord(im):  # couleur du fond = médiane des pixels du bord
    W, H = im.size; px = [im.getpixel((x, y)) for x in range(0, W, max(1, W // 40)) for y in (0, H - 1)]
    px += [im.getpixel((x, y)) for y in range(0, H, max(1, H // 40)) for x in (0, W - 1)]
    return tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))

def coins(im):  # couleur médiane des quatre coins
    W, H = im.size; px = [im.getpixel((x, y)) for x in (2, W - 3) for y in (2, H - 3)]
    return tuple(sorted(c[i] for c in px)[1] for i in range(3))

def serre(im):  # retire le fond uni de la page (couleur du coin) ; fond de la zone = couleur des coins de ce qui reste
    bg = im.getpixel((3, 3))
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg)).convert("L").point(lambda v: 255 if v > 18 else 0)
    bb = diff.getbbox()
    if not bb or (bb[2] - bb[0]) * (bb[3] - bb[1]) > .92 * im.width * im.height: return im, False, bg
    im = im.crop(bb); return im, True, coins(im)

def zone_photo(src):
    im = Image.open(src).convert("RGB")
    pr, uni, fond = serre(im)
    if not uni:  # photo d'ambiance : elle remplit la zone (recadrage au centre)
        r = 1080 / ZH; W, H = im.size
        if W / H > r: w = int(H * r); im = im.crop(((W - w) // 2, 0, (W - w) // 2 + w, H))
        else: h = int(W / r); top = (H - h) // 2; im = im.crop((0, top, W, top + h))
        return im.resize((1080, ZH), Image.LANCZOS)
    if pr.width > pr.height * 1.6:  # bracelet très large : on garde le centre (la plaque et un peu de chaîne)
        # recadrage centré sur la plaque (la plus grosse masse claire), pas sur le milieu de l'image
        g = ImageChops.difference(pr, Image.new("RGB", pr.size, fond)).convert("L").point(lambda v: 255 if v > 18 else 0)
        cols = [sum(1 for y in range(0, pr.height, 3) if g.getpixel((x, y))) for x in range(pr.width)]
        tot = sum(cols) or 1; cx = sum(x * v for x, v in enumerate(cols)) / tot
        c = int(max(pr.height * 1.6, pr.width * .62)); l = int(min(max(0, cx - c / 2), pr.width - c)); pr = pr.crop((l, 0, l + c, pr.height))
    z = Image.new("RGB", (1080, ZH), fond)
    k = min(960 / pr.width, (ZH - 90) / pr.height); pr = pr.resize((int(pr.width * k), int(pr.height * k)), Image.LANCZOS)
    z.paste(pr, ((1080 - pr.width) // 2, (ZH - pr.height) // 2))
    return z

def largeur(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

def ajuste(d, t, fam, size, maxw, axes, mini):
    f = font(fam, size, axes=axes)
    while largeur(d, t, f) > maxw and size > mini: size -= 2; f = font(fam, size, axes=axes)
    return f

def coupe(t):  # deux lignes équilibrées, coupées à un espace
    mots = t.split(); best = None
    for i in range(1, len(mots)):
        a, b = " ".join(mots[:i]), " ".join(mots[i:]); s = max(len(a), len(b))
        if best is None or s < best[0]: best = (s, [a, b])
    return best[1] if best else [t]

def compose(src, lang, ta, sens, prod, out):
    canvas = Image.new("RGB", (1080, 1080), ENCRE); canvas.paste(zone_photo(src), (0, 0))
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, ZH, 1080, ZH + 3], fill=OR)
    fam, TA, nom = ECR[lang]
    colw = 1080 - 2 * M - LOGO_W - 36
    f = ajuste(d, ta, fam, 70 if lang == "ar" else 60, colw, TA, 40)
    fs = ajuste(d, sens, "PlayfairDisplay", 38, colw, [500], 26)
    fp = font("Inter", 17, axes=[14, 500]); pl = nom + "   ·   " + prod.upper() + "   ·   GRAVÉ EN FRANCE"
    if M + largeur(d, pl, fp) > 1080 - M - LOGO_W - 36: pl = nom + "   ·   " + prod.upper()
    lh = int(f.size * 1.5)
    hb = lh + 8 + 48 + 16 + 22
    y = ZH + 4 + (1080 - ZH - 4 - hb) // 2
    b = d.textbbox((0, 0), ta, font=f); d.text((M - b[0], y + (lh - (b[3] - b[1])) // 2 - b[1]), ta, font=f, fill=OR); y += lh
    y += 8; b = d.textbbox((0, 0), sens, font=fs); d.text((M - b[0], y + (48 - (b[3] - b[1])) // 2 - b[1]), sens, font=fs, fill=CREME)
    y += 48 + 16; d.text((M, y), pl, font=fp, fill=GRIS)
    lg = LOGO.copy(); lg.thumbnail((LOGO_W, 200)); ly = ZH + 4 + (1080 - ZH - 4 - (lg.height + 46)) // 2
    canvas.paste(lg, (1080 - M - lg.width, ly))
    fu = font("Inter", 22, axes=[14, 600]); u = "nivcreation.fr"
    d.text((1080 - M - largeur(d, u, fu), ly + lg.height + 16), u, font=fu, fill=OR)
    assert largeur(d, ta, f) <= colw, (out, ta)
    assert largeur(d, sens, fs) <= colw, (out, sens)
    assert M + largeur(d, pl, fp) <= 1080 - M - LOGO_W - 36, (out, pl)
    canvas.save(out, quality=92)

for i, (cap, lang, ta, sens, prod) in enumerate(IMGS, 1):
    name = f"{i:02d}-{cap}.jpg"
    compose(f"{SC}/site/{cap}.png", lang, ta, sens, prod, f"{OUT}/{name}"); print(name)
