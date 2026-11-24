# Vidéo 75 (24/11/2026) — créations gravées, style NEUF « boule à neige » : sur une table en bois, devant un feu de cheminée
# flou, une boule à neige se secoue ; la neige tourbillonne puis retombe et dévoile à l'intérieur une pièce GRAVÉE.
# Le nom s'affiche sur le socle doré. Fin : nivcreation.fr dans la boule. Sans son, aucun prix, aucun nombre.
# Usage (racine) : python3 tools/video/boule_neige_75.py <polices> <sortie> [--apercu]
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)

ITEMS = [
  ("produits/cristal-h-famille.jpg", False, "Cristal photo 3D", "Votre photo de famille, en 3D"),
  ("produits/verre_whisky_papa_monde_moustache.jpg", False, "Verre à whisky", "Pour le meilleur papa du monde"),
  ("produits/collier-3coeurs-3.jpg", False, "Collier 3 Cœurs", "Un prénom sur chaque cœur"),
  ("produits/couverts_enfants_ex_prenom.jpg", False, "Couverts enfant", "Son prénom, pour ses repas"),
  ("produits/plaque-naissance-garcon-1.jpg", False, "Plaque de naissance", "Prénom, date, taille et poids"),
  ("produits/deco-noel-cristal-ex-1.jpg", True, "Décoration de Noël en cristal", "À suspendre au sapin"),
  ("produits/puzzle-photo-enfants.jpg", False, "Puzzle photo gravé", "Votre photo, en pièces de bois"),
  ("produits/verre_vin_exemple_dale.jpg", False, "Verre à vin", "Une initiale et une date"),
  ("produits/cristal-v-couple.jpg", False, "Cristal photo 3D", "Votre couple, dans le cristal"),
  ("carnet/exemple-ex2.jpg", True, "Carnet gravé", "Mes recettes, à son prénom"),
]
N = len(ITEMS); DS = 3.3; T_INTRO = 2.8; T_FIN = 4.8
TOTAL = T_INTRO + N * DS + T_FIN
CX, CY, R = W // 2, 860, 400            # boule
random.seed(75); np.random.seed(75)

# --- décor : table en bois + cheminée floue
def decor():
    im = Image.new("RGB", (W, H), (34, 22, 16)); d = ImageDraw.Draw(im)
    for _ in range(38):                                          # lueurs du feu et guirlande
        x, y, r = random.uniform(0, W), random.uniform(80, 1250), random.uniform(25, 90)
        c = random.choice([(255, 170, 70), (255, 200, 110), (230, 120, 50), (255, 225, 160)])
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)
    im = Image.blend(im.filter(ImageFilter.GaussianBlur(40)), Image.new("RGB", (W, H), (34, 22, 16)), .55)
    bois = Image.new("RGB", (W, H - 1300), (92, 58, 34)); db = ImageDraw.Draw(bois)
    for y in range(0, bois.height, 3):
        t = random.uniform(-18, 18); db.line((0, y, W, y + random.uniform(-4, 4)), fill=(int(92 + t), int(58 + t * .7), int(34 + t * .4)), width=3)
    bois = bois.filter(ImageFilter.GaussianBlur(1.2))
    grad = Image.linear_gradient("L").resize((W, bois.height)).point(lambda v: int(150 - v * .45))
    bois = Image.composite(Image.new("RGB", bois.size, (20, 12, 8)), bois, grad.point(lambda v: 255 - v))
    im.paste(bois, (0, 1300))
    d = ImageDraw.Draw(im); d.line((0, 1300, W, 1300), fill=(140, 96, 56), width=3)
    return im.convert("RGBA")
DECOR = decor()

# --- socle doré sous la boule
def socle():
    s = Image.new("RGBA", (W, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    d.ellipse((CX - 400, 225, CX + 400, 290), fill=(0, 0, 0, 120))
    for k in range(210):
        y = 40 + k; t = abs(k - 60) / 210
        c = (int(208 - 70 * t), int(166 - 60 * t), int(80 - 30 * t))
        w = 340 + 50 * k / 210
        d.line((CX - w, y, CX + w, y), fill=c)
    d.rectangle((CX - 310, 30, CX + 310, 56), fill=(232, 200, 120))
    d.line((CX - 390, 250, CX + 390, 250), fill=(90, 60, 28), width=6)
    return s.filter(ImageFilter.GaussianBlur(.6))
SOCLE = socle()
MASQ = Image.new("L", (2 * R, 2 * R), 0); ImageDraw.Draw(MASQ).ellipse((0, 0, 2 * R - 1, 2 * R - 1), fill=255)

# --- intérieur de la boule pour chaque pièce : photo entière sur fond flou d'elle-même
def interieur(im):
    D = 2 * R
    f = ImageOps.fit(im, (D, D), Image.LANCZOS).filter(ImageFilter.GaussianBlur(28))
    f = Image.blend(f, Image.new("RGB", (D, D), (40, 30, 26)), .25)
    e = ImageOps.contain(im, (int(D * .74), int(D * .74)), Image.LANCZOS)
    f.paste(e, ((D - e.width) // 2, (D - e.height) // 2 - 10)); return f.convert("RGBA")

INT = []
for src, badge, *_ in ITEMS:
    im = Image.open(P(src)).convert("RGB")
    if badge: im = sans_badge(im)
    INT.append(interieur(im))

# intérieur de fin : nuit bleue dorée + nivcreation.fr
def fin_int():
    D = 2 * R; im = Image.new("RGB", (D, D), (22, 28, 52)); d = ImageDraw.Draw(im)
    for _ in range(26):
        x, y, r = random.uniform(0, D), random.uniform(0, D), random.uniform(14, 44)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, random.randint(180, 215), random.randint(90, 140)))
    im = Image.blend(im.filter(ImageFilter.GaussianBlur(20)), Image.new("RGB", (D, D), (22, 28, 52)), .4)
    d = ImageDraw.Draw(im)
    for t, f, y, c in [("Joyeux Noël", SCRIPT(118), 270, OR_CLAIR), ("nivcreation.fr", PLAY(70), 430, CREME),
                       ("Gravé à la commande en France", INTER(30, 500), 530, (225, 215, 200))]:
        d.text(((D - lg(d, t, f)) / 2, y), t, font=f, fill=c)
    return im.convert("RGBA")
FIN = fin_int()

# reflet du verre (fixe)
REFLET = Image.new("RGBA", (2 * R, 2 * R), (0, 0, 0, 0)); dr = ImageDraw.Draw(REFLET)
dr.arc((40, 40, 2 * R - 40, 2 * R - 40), 195, 255, fill=(255, 255, 255, 120), width=26)
dr.ellipse((150, 120, 230, 190), fill=(255, 255, 255, 90))
REFLET = REFLET.filter(ImageFilter.GaussianBlur(9))
ANNEAU = Image.new("RGBA", (2 * R + 20, 2 * R + 20), (0, 0, 0, 0))
ImageDraw.Draw(ANNEAU).ellipse((4, 4, 2 * R + 16, 2 * R + 16), outline=(255, 255, 255, 110), width=6)

# neige : particules dans la boule (coordonnées relatives au centre)
NP = 340
PART = [(random.uniform(-1, 1), random.uniform(0, 1), random.uniform(2.5, 7.5), random.uniform(.6, 1.4), random.uniform(0, 6.28)) for _ in range(NP)]

def neige(tl):
    """tl = temps depuis la secousse. 0–0,7 s tourbillon dense, puis chute lente et la neige se dépose."""
    lay = Image.new("RGBA", (2 * R, 2 * R), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    voile = max(0.0, 1 - tl / 1.1)                     # brouillard blanc au moment de la secousse
    if voile > 0: d.ellipse((0, 0, 2 * R, 2 * R), fill=(250, 252, 255, int(235 * voile ** 1.4)))
    for xr, ph, sz, vit, a0 in PART:
        if tl < .7:   # tourbillon
            ang = a0 + tl * 6 * vit; rr = (.2 + ph * .75) * R
            x, y = R + rr * math.cos(ang), R + rr * math.sin(ang) * .9
        else:         # chute
            y = R * 2 * ((ph + (tl - .7) * .16 * vit) % 1.0)
            x = R + xr * R * .92 + 14 * math.sin(tl * 1.5 + a0)
        if (x - R) ** 2 + (y - R) ** 2 > (R - 8) ** 2: continue
        al = int(230 if tl < 1.6 else 230 * max(.25, 1 - (tl - 1.6) / 2.2))
        d.ellipse((x - sz, y - sz, x + sz, y + sz), fill=(255, 255, 255, al))
    return lay.filter(ImageFilter.GaussianBlur(.8))

def boule(base, interieur, tl, dx=0, ang=0):
    glob = interieur.copy()
    glob.alpha_composite(neige(tl)); glob.alpha_composite(REFLET)
    glob.putalpha(MASQ)
    g = glob.rotate(ang, resample=Image.BICUBIC, center=(R, 2 * R)) if ang else glob
    base.alpha_composite(g, (CX - R + int(dx), CY - R))
    base.alpha_composite(ANNEAU, (CX - R - 10 + int(dx), CY - R - 10))
    base.alpha_composite(SOCLE, (int(dx), CY + R - 70))

def texte_c(im, t, f, y, c):
    if len(c) == 4 and c[3] <= 0: return
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=c); im.alpha_composite(lay)

def image(t):
    im = DECOR.copy(); d = ImageDraw.Draw(im)
    if t < T_INTRO:
        a = ease(t / .8)
        boule(im, INT[0], 0.25); d = ImageDraw.Draw(im)
        texte_c(im, "Secouez la boule…", SCRIPT(110), 200 - 30 * (1 - a), OR_CLAIR + (int(255 * a),))
        texte_c(im, "et découvrez nos créations gravées", INTER(40, 500), 340, CREME + (int(255 * ease((t - .5) / .8)),))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < N * DS:
        i = int(t2 // DS); tl = t2 - i * DS
        sec = max(0.0, .6 - tl) / .6                      # secousse au début
        dx = 34 * sec * math.sin(tl * 38); ang = 5 * sec * math.sin(tl * 30)
        boule(im, INT[i], tl, dx, ang); d = ImageDraw.Draw(im)
        a = ease((tl - 1.0) / .6) * (1 - ease((tl - DS + .35) / .35))
        _, _, nom, phrase = ITEMS[i]
        f = PLAY(56)
        while lg(d, nom, f) > 620: f = PLAY(f.size - 2)
        texte_c(im, nom, f, CY + R + 40, (40, 26, 12, int(255 * a)))
        texte_c(im, phrase, SCRIPT(80), 1470, OR_CLAIR + (int(255 * a),))
        texte_c(im, "Gravé dans notre atelier en France", INTER(32, 500), 1600, (235, 222, 202, int(230 * a)))
        texte_c(im, "Idée cadeau de Noël", INTER(42, 600), 150, OR_CLAIR + (int(255 * min(1, t2 / .6)),))
        return im.convert("RGB")
    tf = t2 - N * DS
    boule(im, FIN, tf + .2); d = ImageDraw.Draw(im)
    a = ease((tf - .8) / .8)
    texte_c(im, "Le cadeau qui porte son prénom", PLAY(52), 1470, CREME + (int(255 * a),))
    texte_c(im, "Commandez tôt pour Noël", INTER(38, 600), 1580, OR_CLAIR + (int(255 * a),))
    return im.convert("RGB")

if APERCU:
    for k, tt in enumerate([1.5, T_INTRO + .3, T_INTRO + 2.2, T_INTRO + DS * 5 + 2.2, TOTAL - 1]):
        image(tt).save(os.path.join(OUT, f"apercu75-{k}.jpg"), quality=85)
else:
    print(encoder(image, TOTAL, OUT, "75-boule-a-neige"), TOTAL)
