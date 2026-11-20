# Vidéo 70 (20/11/2026) — toutes nos créations gravées, style NEUF « guirlande » : des polaroïds accrochés par des
# pinces en bois sur un fil lumineux, qui se balancent ; la caméra glisse d'une photo à l'autre, le nom et une phrase
# s'affichent dessous. Photos GRAVÉES seulement (reprises des vidéos déjà vérifiées). Sans son, aucun prix.
# Usage (racine) : python3 tools/video/guirlande_70.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, arrondi, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)

# (photo, badge EXEMPLE à effacer, nom, phrase, légende manuscrite sous la photo)
ITEMS = [
  ("produits/cristal-v-couple.jpg", False, "Cristal photo 3D", "Votre plus belle photo, en 3D", "Nous deux"),
  ("produits/verre_a_whisky_exemple_face.jpg", False, "Verre à whisky", "Sa photo, gravée dans le verre", "Pour papa"),
  ("produits/collier-3coeurs-3.jpg", False, "Collier 3 Cœurs", "Un prénom dans chaque cœur", "Naomi"),
  ("produits/gobelet/ex3-rose-rose-lea.jpg", False, "Gobelet isotherme", "Une rose et son prénom", "Léa"),
  ("carnet/exemple-ex6.jpg", False, "Carnet gravé", "Nos souvenirs, à nos noms", "Nos souvenirs"),
  ("produits/plaque-naissance-garcon-1.jpg", False, "Plaque de naissance", "Son prénom, sa date, son poids", "Bienvenue"),
  ("produits/flute-grav-05.webp", False, "Flûte à champagne", "Vos prénoms et votre date", "Le grand jour"),
  ("marque-pages/m1/exemple-ex7.jpg", False, "Marque-page en bois", "Pour les amoureux de lecture", "Pour Mamie"),
  ("produits/bracelet-cordon-plaque-4.jpg", False, "Bracelet cordon à plaque", "Vos initiales, pour lui", "Pour lui"),
  ("produits/deco-noel-cristal-ex-1.jpg", True, "Décoration de Noël en cristal", "Un prénom sous le sapin", "Noël 2026"),
  ("produits/puzzle-photo-enfants.jpg", False, "Puzzle photo gravé", "Votre photo, en pièces à assembler", "Les enfants"),
  ("produits/cristaux-graves/chat-sapin.jpg", False, "Cristal déjà gravé", "Prêt à offrir", "Douce nuit"),
]
N = len(ITEMS); DS = 2.7; T_INTRO = 2.6; T_FIN = 3.8
TOTAL = T_INTRO + N * DS + T_FIN
SP = 860                          # écart entre deux polaroïds sur le fil
PW, PH, PI = 720, 880, 660        # polaroïd : largeur, hauteur, côté de la photo
ENCRE = (36, 26, 18)


def polaroid(img, legende):
    im = img.convert("RGB")
    ph = ImageOps.fit(im, (PI, PI), Image.LANCZOS, centering=(0.5, 0.45))
    c = Image.new("RGBA", (PW, PH), (253, 250, 243, 255))
    c.paste(ph, ((PW - PI) // 2, 30))
    d = ImageDraw.Draw(c); f = SCRIPT(80)
    d.text(((PW - lg(d, legende, f)) / 2, PI + 66), legende, font=f, fill=(60, 44, 30))
    d.rectangle((0, 0, PW - 1, PH - 1), outline=(225, 215, 196), width=2)
    # pince en bois en haut
    pz = Image.new("RGBA", (PW, PH + 60), (0, 0, 0, 0)); pz.alpha_composite(c, (0, 60))
    dz = ImageDraw.Draw(pz)
    dz.rounded_rectangle((PW / 2 - 22, 0, PW / 2 + 22, 120), 8, fill=(196, 152, 98, 255), outline=(150, 108, 62, 255), width=3)
    dz.line((PW / 2, 6, PW / 2, 114), fill=(150, 108, 62, 255), width=3)
    dz.rectangle((PW / 2 - 24, 52, PW / 2 + 24, 66), fill=(170, 170, 176, 255))
    return pz


PHOTOS = []
for src, badge, nom, phrase, leg in ITEMS:
    im = Image.open(P(src))
    if badge: im = sans_badge(im)
    PHOTOS.append(polaroid(im, leg))

# Fond : nuit chaude, lumières floues (bokeh) sur une bande deux fois plus large que l'écran (parallaxe)
FOND = Image.new("RGBA", (W, H))
dF = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H
    dF.line((0, y, W, y), fill=(int(30 + 22 * k), int(22 + 12 * k), int(30 + 2 * k), 255))
random.seed(70)
BOKEH = Image.new("RGBA", (2 * W, H), (0, 0, 0, 0)); dB = ImageDraw.Draw(BOKEH)
for _ in range(70):
    x, y, r = random.uniform(0, 2 * W), random.uniform(0, H), random.uniform(18, 70)
    col = random.choice([(255, 200, 120), (255, 170, 90), (240, 220, 170), (255, 140, 110)])
    dB.ellipse((x - r, y - r, x + r, y + r), fill=col + (random.randint(30, 80),))
BOKEH = BOKEH.filter(ImageFilter.GaussianBlur(14))

FIL_Y = 380


def fil_y(xw):            # hauteur du fil à l'abscisse du monde xw : il pend entre deux attaches
    u = (xw % SP) / SP
    return FIL_Y + 70 * math.sin(math.pi * u)


def texte_centre(d, y, t, f, fill):
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=fill)


def camera(t):
    """Position du centre de la caméra dans le monde, en s'arrêtant sur chaque polaroïd."""
    if t < T_INTRO: return SP * 0.5 - 900 * (1 - ease(t / T_INTRO))
    k = (t - T_INTRO) / DS
    i = min(int(k), N - 1); f = k - i
    a = SP * (i + 0.5)
    if i >= N - 1 or f < 0.62: return a
    return a + SP * easeio((f - 0.62) / 0.38)


def image(t):
    fr = FOND.copy()
    cx = camera(t)
    off = int(cx * 0.25) % W
    fr.alpha_composite(BOKEH.crop((off, 0, off + W, H)))
    d = ImageDraw.Draw(fr)
    x0 = cx - W / 2
    # fil + ampoules
    pts = [(x, fil_y(x0 + x)) for x in range(-10, W + 12, 8)]
    d.line(pts, fill=(70, 58, 44), width=5)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(glow)
    b0 = int(x0 // 130) * 130
    for xb in range(b0, int(x0 + W + 130), 130):
        sx = xb - x0; sy = fil_y(xb) + 18
        a = 0.65 + 0.35 * math.sin(t * 3.1 + xb * 0.05)
        dg.ellipse((sx - 34, sy - 34, sx + 34, sy + 34), fill=(255, 196, 110, int(110 * a)))
        d.ellipse((sx - 9, sy - 6, sx + 9, sy + 14), fill=(255, int(214 * a + 30), 140))
    fr.alpha_composite(glow.filter(ImageFilter.GaussianBlur(16)))
    # polaroïds
    for i, ph in enumerate(PHOTOS):
        xw = SP * (i + 0.5); sx = xw - x0
        if sx < -PW or sx > W + PW: continue
        ang = 3.2 * math.sin(t * 1.4 + i * 1.7)
        sc = 0.86 + 0.14 * max(0.0, 1 - abs(sx - W / 2) / 600)
        coller(fr, ph, sx, fil_y(xw) - 20 + ph.height * sc / 2, ang=ang, sc=sc)
    d = ImageDraw.Draw(fr)
    # titre d'ouverture
    if t < T_INTRO + 0.6:
        a = ease(t / 0.9) * (1 - ease((t - T_INTRO) / 0.6))
        c = lambda col: col + (int(255 * a),)
        texte_centre(d, 1500, "Nos créations", PLAY(100), c(CREME))
        texte_centre(d, 1625, "gravées à vos noms", SCRIPT(104), c(OR_CLAIR))
    # nom + phrase du polaroïd au centre
    if T_INTRO <= t < T_INTRO + N * DS:
        k = (t - T_INTRO) / DS; i = int(k); f = k - i
        a = ease(f / 0.18) * (1 - ease((f - 0.6) / 0.12))
        if a > 0.01:
            _, _, nom, phrase, _ = ITEMS[i]
            fn = PLAY(76 if lg(d, nom, PLAY(76)) < W - 120 else 62)
            texte_centre(d, 1530, nom, fn, CREME + (int(255 * a),))
            texte_centre(d, 1645, phrase, INTER(44, 500), OR_CLAIR + (int(255 * a),))
            d.line((W / 2 - 60, 1735, W / 2 + 60, 1735), fill=OR + (int(255 * a),), width=3)
    # fin
    tf = t - (T_INTRO + N * DS)
    if tf > 0:
        a = ease(tf / 0.8)
        voile = Image.new("RGBA", (W, H), (24, 17, 12, int(240 * a))); fr.alpha_composite(voile)
        d = ImageDraw.Draw(fr)
        texte_centre(d, 760, "Gravé à la commande", SCRIPT(110), OR_CLAIR + (int(255 * a),))
        texte_centre(d, 900, "dans notre atelier", PLAY(70), CREME + (int(255 * a),))
        pul = 1 + 0.04 * math.sin(tf * 4)
        bw, bh = int(560 * pul), int(118 * pul)
        d.rounded_rectangle((W / 2 - bw / 2, 1080, W / 2 + bw / 2, 1080 + bh), bh // 2, fill=OR + (int(255 * a),))
        f = PLAY(58); texte_centre(d, 1080 + bh / 2 - 38, "nivcreation.fr", f, (30, 22, 14, int(255 * a)))
    return fr.convert("RGB")


if APERCU:
    for k, tt in enumerate([1.5, T_INTRO + 1.2, T_INTRO + 2.4, T_INTRO + 4 * DS + 1.2, T_INTRO + 9 * DS + 1.2, TOTAL - 1]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu70-{k}.jpg"), quality=85)
    print("aperçus OK", TOTAL)
else:
    print(encoder(image, TOTAL, OUT, "70-guirlande"), round(TOTAL, 1))
