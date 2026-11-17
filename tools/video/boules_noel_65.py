# Vidéo 65 (17/11/2026) — idées cadeaux de Noël, style NEUF « boules de Noël » : chaque création descend au bout d'un ruban
# dans une boule dorée qui se balance, sous la neige ; à la fin, toutes les boules forment une guirlande. Sans son, aucun prix.
# Usage (racine) : python3 tools/video/boules_noel_65.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
P = lambda n: os.path.join("public", n)
# (photo, badge EXEMPLE à effacer, univers, phrase, couleur de fond)
ROUGE, SAPIN, NUIT = (112, 22, 30), (22, 62, 44), (24, 30, 58)
CADEAUX = [
  (P("produits/deco-noel-cristal-ex-1.jpg"), True, "Décoration de Noël en cristal", "Joyeux Noël, Camille", ROUGE),
  (P("produits/cristal-h-amis.jpg"), False, "Cristal photo 3D", "Vos amis, gravés en 3D", SAPIN),
  (P("produits/gobelet/ex3-rose-rose-lea.jpg"), False, "Gobelet isotherme", "Une rose et son prénom", NUIT),
  (P("produits/collier-coeur-plaques-2.jpg"), False, "Bijoux", "Les prénoms de ceux qu'elle aime", ROUGE),
  (P("carnet/exemple-ex2.jpg"), False, "Carnet gravé", "Ses recettes, à son nom", SAPIN),
  (P("produits/cristaux-graves/chat-sapin.jpg"), False, "Cristal déjà gravé", "Un sapin dans le cristal", NUIT),
  (P("produits/couverts_enfants_ex_animaux.jpg"), False, "Couverts enfant", "Ses premiers couverts", ROUGE),
  (P("produits/gobelet/ex8-blanc-photo-maman.jpg"), False, "Gobelet isotherme", "Pour maman", SAPIN),
  (P("produits/plaque-naissance-coeur-1.jpg"), False, "Plaque de naissance", "Un souvenir de naissance", NUIT),
  (P("produits/deco-noel-cristal-ex-3.jpg"), True, "Décoration de Noël en cristal", "Le Noël de toute la famille", ROUGE),
  (P("produits/bracelet-femme-acier-porte.jpg"), False, "Bracelet gravé", "Un mot doux au poignet", SAPIN),
  (P("marque-pages/m2/exemple-ex1.jpg"), False, "Marque-page", "Pour les amoureux de lecture", NUIT),
]
DS = 2.8; T_INTRO = 2.4; T_FIN = 3.8
TOTAL = T_INTRO + len(CADEAUX) * DS + T_FIN
D = 700  # diamètre de la boule

def boule(img):
    """Photo ENTIÈRE posée dans le carré inscrit du disque, sur un fond flou de la même photo ; anneau doré et attache."""
    img = img.convert("RGB")
    disque = ImageOps.fit(img, (D, D)).filter(ImageFilter.GaussianBlur(26))
    disque = Image.blend(disque, Image.new("RGB", (D, D), (250, 244, 232)), 0.30)
    cote = int(D * 0.76)
    ph = ImageOps.contain(img, (cote, cote), Image.LANCZOS)
    disque.paste(ph, ((D - ph.width) // 2, (D - ph.height) // 2))
    out = Image.new("RGBA", (D + 40, D + 120), (0, 0, 0, 0))
    m = Image.new("L", (D, D), 0); ImageDraw.Draw(m).ellipse((0, 0, D - 1, D - 1), fill=255)
    out.paste(disque, (20, 100), m)
    d = ImageDraw.Draw(out)
    d.ellipse((20, 100, 20 + D - 1, 100 + D - 1), outline=OR + (255,), width=14)
    d.ellipse((34, 114, 6 + D - 1, 86 + D - 1), outline=OR_CLAIR + (200,), width=3)
    # reflet
    refl = Image.new("RGBA", out.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(refl)
    dr.ellipse((120, 170, 300, 300), fill=(255, 255, 255, 70))
    out.alpha_composite(refl.filter(ImageFilter.GaussianBlur(18)))
    # attache dorée
    cx = 20 + D // 2
    d.rounded_rectangle((cx - 50, 60, cx + 50, 112), 10, fill=OR, outline=(150, 112, 44), width=3)
    for k in range(-36, 40, 18): d.line((cx + k, 64, cx + k, 108), fill=(170, 130, 54), width=3)
    d.ellipse((cx - 22, 18, cx + 22, 66), outline=OR, width=8)
    return out
BOULES = []
for src, badge, *_ in CADEAUX:
    im = Image.open(src)
    if badge: im = sans_badge(im)
    BOULES.append(boule(im))

random.seed(65)
FLOCONS = [(random.random() * W, random.random() * H, random.uniform(2, 7), random.uniform(40, 120), random.random() * 6) for _ in range(140)]

def neige(d, t):
    for x, y, r, v, ph in FLOCONS:
        yy = (y + v * t) % (H + 40) - 20; xx = x + 18 * math.sin(t * 0.8 + ph)
        d.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 255, 255, int(110 + 25 * r)))

def fond(c):
    im = Image.new("RGBA", (W, H), c + (255,))
    lum = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(lum).ellipse((W / 2 - 700, 300, W / 2 + 700, 1500), fill=(255, 220, 160, 50))
    im.alpha_composite(lum.filter(ImageFilter.GaussianBlur(160)))
    return im

def image(t):
    if t < T_INTRO:
        im = fond(ROUGE); d = ImageDraw.Draw(im); neige(d, t)
        f1 = PLAY(104, 700); f2 = INTER(40, 500)
        for i, (txt, c) in enumerate([("Idées cadeaux", CREME), ("de Noël", OR_CLAIR)]):
            k = ease((t - i * 0.25) / 0.7)
            d.text(((W - lg(d, txt, f1)) / 2, 700 + i * 130 + (1 - k) * 50), txt, font=f1, fill=c + (int(255 * k),))
        s = "Gravées à leur nom, dans notre atelier"; k = ease((t - 0.8) / 0.6)
        d.text(((W - lg(d, s, f2)) / 2, 1020), s, font=f2, fill=(240, 220, 200, int(255 * k)))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(CADEAUX) * DS:
        i = int(t2 // DS); u = t2 - i * DS
        src, badge, univ, phr, c = CADEAUX[i]
        prev = CADEAUX[i - 1][4] if i else ROUGE
        mix = easeio(u / 0.4); fc = tuple(int(prev[k] * (1 - mix) + c[k] * mix) for k in range(3))
        im = fond(fc); d = ImageDraw.Draw(im)
        desc = ease(u / 0.7); monte = easeio((u - DS + 0.4) / 0.4)
        ang = 9 * math.exp(-1.6 * u) * math.sin(u * 4.2)  # balancement amorti
        cy = -500 + desc * 1340 - monte * 1500
        pivot = (W / 2, 0)
        L = cy - pivot[1]
        bx = pivot[0] + L * math.sin(math.radians(ang)); by = pivot[1] + L * math.cos(math.radians(ang))
        d.line((pivot[0], pivot[1], bx, by - 400), fill=OR_CLAIR + (255,), width=5)
        coller(im, BOULES[i], bx, by, ang)
        neige(d, t)
        a = ease((u - 0.8) / 0.4) * (1 - monte)
        if a > 0:
            f1 = INTER(34, 700); lab = univ.upper(); wl = lg(d, lab, f1) + 64; x0 = (W - wl) / 2
            d.rounded_rectangle((x0, 1490, x0 + wl, 1560), 35, fill=OR + (int(255 * a),))
            d.text((x0 + 32, 1503), lab, font=f1, fill=(255, 255, 255, int(255 * a)))
            f2 = PLAY(64, 600)
            d.text(((W - lg(d, phr, f2)) / 2, 1600), phr, font=f2, fill=CREME + (int(255 * a),))
        return im.convert("RGB")
    u = t2 - len(CADEAUX) * DS
    im = fond(SAPIN); d = ImageDraw.Draw(im)
    # guirlande : 3 rangées de 4 boules suspendues
    for r in range(3):
        y0 = 520 + r * 340
        d.arc((-200, y0 - 260, W + 200, y0 + 40), 20, 160, fill=OR_CLAIR, width=4)
        for k in range(4):
            n = r * 4 + k; e = ease((u - n * 0.06) / 0.5)
            x = 165 + k * 250; y = y0 + 40 * math.sin(math.pi * (k + 0.5) / 4) - 40
            sw = 4 * math.sin(u * 3 + n)
            coller(im, BOULES[n], x, y + 120, sw, a=e, sc=0.30 * (0.8 + 0.2 * e), ombre=False)
    neige(d, T_INTRO + len(CADEAUX) * DS + u)
    f = PLAY(76, 700)
    for k, (txt, cc) in enumerate([("Joyeux Noël", CREME), ("à ceux que vous aimez", OR_CLAIR)]):
        d.text(((W - lg(d, txt, f)) / 2, 150 + k * 96), txt, font=f, fill=cc)
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, 1700 - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))
    return im.convert("RGB")

if APERCU:
    for k, tt in enumerate([1.6, T_INTRO + 0.4, T_INTRO + 1.4, T_INTRO + DS + 1.6, T_INTRO + 3 * DS + 1.6, T_INTRO + 8 * DS + 1.6, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu65-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "65-boules-noel"), round(TOTAL, 1), "s")
