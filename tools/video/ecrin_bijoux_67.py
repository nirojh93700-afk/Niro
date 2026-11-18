# Vidéo 67 (18/11/2026) — les bijoux gravés, style NEUF « écrin » : sur un fond de velours, un écrin s'ouvre (le couvercle
# bascule vers le haut), le bijou gravé apparaît sur le satin avec des éclats de lumière, puis son nom et une phrase.
# Photos GRAVÉES seulement, aucun texte anglais, sans son, aucun prix.
# Usage (racine) : python3 tools/video/ecrin_bijoux_67.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, arrondi, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
P = lambda n: os.path.join("public", "produits", n)
BIJOUX = [
  (P("collier-3coeurs-3.jpg"), "Collier 3 Cœurs", "Un prénom dans chaque cœur"),
  (P("collier-coeur-plaques-1.jpg"), "Collier cœur & plaques", "Les prénoms de ceux qu'elle aime"),
  (P("collier-double-coeur-3.jpg"), "Collier double cœur", "Une date qui compte"),
  (P("bracelet-cordon-plaque-4.jpg"), "Bracelet cordon à plaque", "Vos initiales, pour lui"),
  (P("catalogue/il_fullxfull.8007460526_h2kk.jpg"), "Médaillon cœur ouvrable", "Un cœur qui s'ouvre sur vos mots"),
  (P("collier-coeur-grave-1.jpg"), "Collier cœur gravé", "Vos initiales et votre date"),
  (P("catalogue/il_fullxfull.7864685306_sefx.jpg"), "Collier Enveloppe", "Un mot doux glissé à l'intérieur"),
  (P("collier-coeur-plaques-2.jpg"), "Collier cœur & plaques", "Prénoms et dates, rien qu'à elle"),
  (P("collier-double-coeur-6.jpg"), "Collier double cœur", "Un secret gravé au dos"),
  (P("bracelet-femme-acier-porte.jpg"), "Bracelet gravé", "À porter tous les jours"),
]
DS = 3.0; T_INTRO = 2.4; T_FIN = 3.8
TOTAL = T_INTRO + len(BIJOUX) * DS + T_FIN
BX0, BX1, BY0, BY1 = 150, 930, 540, 1320          # écrin (intérieur)
PH = 640                                           # taille de la photo sur le satin

PHOTOS = []
for src, *_ in BIJOUX:
    im = ImageOps.fit(Image.open(src).convert("RGB"), (PH, PH), Image.LANCZOS, centering=(0.5, 0.45))
    c = arrondi(im, 26); d = ImageDraw.Draw(c)
    d.rounded_rectangle((2, 2, PH - 3, PH - 3), 24, outline=OR_CLAIR + (255,), width=4)
    PHOTOS.append(c)

# Velours : bordeaux profond avec un grain et une lumière douce en haut
random.seed(67)
FOND = Image.new("RGBA", (W, H))
dF = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H
    dF.line((0, y, W, y), fill=(int(70 - 36 * k), int(14 - 6 * k), int(26 - 12 * k), 255))
grain = Image.effect_noise((W, H), 18).convert("L").point(lambda v: int(v * 0.10))
FOND.alpha_composite(Image.merge("RGBA", (grain, grain, grain, grain.point(lambda v: v))))
spot = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(spot).ellipse((W / 2 - 560, 200, W / 2 + 560, 1400), fill=(255, 190, 170, 70))
FOND.alpha_composite(spot.filter(ImageFilter.GaussianBlur(140)))


def ecrin_base(im):
    d = ImageDraw.Draw(im)
    # ombre portée
    o = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(o).rounded_rectangle((BX0 - 30, BY0 + 40, BX1 + 30, BY1 + 90), 40, fill=(0, 0, 0, 140))
    im.alpha_composite(o.filter(ImageFilter.GaussianBlur(40)))
    d.rounded_rectangle((BX0 - 34, BY0 - 34, BX1 + 34, BY1 + 34), 36, fill=(28, 10, 16, 255))
    d.rounded_rectangle((BX0 - 30, BY0 - 30, BX1 + 30, BY1 + 30), 34, outline=(150, 112, 50, 255), width=3)
    # satin crème intérieur
    for y in range(BY0, BY1):
        k = (y - BY0) / (BY1 - BY0)
        d.line((BX0, y, BX1, y), fill=(int(246 - 18 * k), int(236 - 22 * k), int(222 - 26 * k), 255))
    d.rectangle((BX0, BY0, BX1, BY0 + 10), fill=(200, 180, 150, 255))


def couvercle(im, p):
    """p = 0 fermé, 1 ouvert. Le couvercle bascule autour de la charnière du haut."""
    d = ImageDraw.Draw(im)
    if p < 0.5:
        h = (BY1 - BY0 + 68) * (1 - 2 * p)
        y0 = BY0 - 34
        d.rounded_rectangle((BX0 - 34, y0, BX1 + 34, y0 + max(8, h)), 36, fill=(52, 16, 28, 255))
        if h > 60:
            cy = y0 + h / 2
            d.rounded_rectangle((BX0 + 10, y0 + 30, BX1 - 10, y0 + max(40, h - 30)), 26, outline=(150, 112, 50, 255), width=2)
            d.polygon([(W / 2, cy - 22), (W / 2 + 22, cy), (W / 2, cy + 22), (W / 2 - 22, cy)], fill=(200, 160, 80, 255))
    else:
        h = 300 * (2 * p - 1)
        y1 = BY0 - 34
        d.rounded_rectangle((BX0 - 34, y1 - h, BX1 + 34, y1 + 4), 30, fill=(40, 12, 22, 255))
        if h > 30:
            d.rounded_rectangle((BX0 - 4, y1 - h + 26, BX1 + 4, y1 - 14), 24, fill=(236, 222, 200, 255))


def eclats(im, u, i):
    d = ImageDraw.Draw(im); rr = random.Random(i * 31)
    for k in range(14):
        x = BX0 + 60 + rr.random() * (BX1 - BX0 - 120); y = BY0 + 60 + rr.random() * (BY1 - BY0 - 120)
        ph = (u * 2.2 + rr.random() * 6) % 2.0
        a = max(0.0, 1 - abs(ph - 0.5) * 2)
        if a <= 0: continue
        r = 8 + 16 * a
        c = (255, 240, 200, int(230 * a))
        d.line((x - r, y, x + r, y), fill=c, width=3); d.line((x, y - r, x, y + r), fill=c, width=3)
        d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 255, 255, int(255 * a)))


def bouton(d, u, cy):
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, cy - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))


def image(t):
    im = FOND.copy(); d = ImageDraw.Draw(im)
    if t < T_INTRO:
        f1 = PLAY(104, 700); f2 = INTER(36, 600)
        for j, (txt, c) in enumerate([("Nos bijoux", CREME), ("gravés", OR_CLAIR)]):
            k = ease((t - j * 0.25) / 0.7)
            d.text(((W - lg(d, txt, f1)) / 2, 700 + j * 130 + (1 - k) * 50), txt, font=f1, fill=c + (int(255 * k),))
        s = "UN PRÉNOM, UNE DATE, UN SECRET"; k = ease((t - 0.8) / 0.6)
        d.text(((W - lg(d, s, f2)) / 2, 620), s, font=f2, fill=OR_CLAIR + (int(255 * k),))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(BIJOUX) * DS:
        i = int(t2 // DS); u = t2 - i * DS
        _, nom, phr = BIJOUX[i]
        arrivee = ease(u / 0.4); depart = easeio((u - DS + 0.35) / 0.35)
        dec = (1 - arrivee) * 140 + depart * -140
        calque = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ecrin_base(calque)
        ouv = easeio((u - 0.35) / 0.7) * (1 - easeio((u - DS + 0.55) / 0.3))
        zoom = 0.9 + 0.1 * ease((u - 0.6) / 0.8)
        coller(calque, PHOTOS[i], W / 2, (BY0 + BY1) / 2, a=1.0, sc=zoom, ombre=True)
        couvercle(calque, ouv)
        if ouv > 0.6: eclats(calque, u, i)
        a_cal = arrivee * (1 - depart)
        if a_cal < 1: calque.putalpha(calque.getchannel("A").point(lambda v: int(v * a_cal)))
        im.alpha_composite(calque, (0, int(dec)))
        d = ImageDraw.Draw(im)
        a = ease((u - 1.0) / 0.4) * (1 - ease((u - DS + 0.45) / 0.3))
        if a > 0:
            f1 = INTER(32, 700); f2 = PLAY(64, 600); lab = nom.upper()
            d.text(((W - lg(d, lab, f1)) / 2, 1460), lab, font=f1, fill=OR_CLAIR + (int(255 * a),))
            d.text(((W - lg(d, phr, f2)) / 2, 1516), phr, font=f2, fill=CREME + (int(255 * a),))
        return im.convert("RGB")
    u = t2 - len(BIJOUX) * DS
    for k, c in enumerate(PHOTOS[:9]):
        col, row = k % 3, k // 3; e = ease((u - k * 0.06) / 0.5)
        x = 230 + col * 310; y = 560 + row * 330
        coller(im, c, x, y, a=e, sc=0.42 * (0.85 + 0.15 * e), ombre=True)
    d = ImageDraw.Draw(im); f = PLAY(70, 700)
    for k, (txt, cc) in enumerate([("Gravés dans notre atelier,", CREME), ("rien que pour elle, pour lui", OR_CLAIR)]):
        d.text(((W - lg(d, txt, f)) / 2, 150 + k * 92), txt, font=f, fill=cc)
    bouton(d, u, 1680)
    return im.convert("RGB")


if APERCU:
    for k, tt in enumerate([1.6, T_INTRO + 0.3, T_INTRO + 0.6, T_INTRO + 1.4, T_INTRO + 2.2, T_INTRO + 4 * DS + 1.6, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu67-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "67-ecrin-bijoux"), round(TOTAL, 1), "s")
