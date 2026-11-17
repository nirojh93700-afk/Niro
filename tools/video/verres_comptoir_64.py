# Vidéo 64 (17/11/2026) — nos verres gravés, style NEUF « comptoir » : chaque verre glisse sur un comptoir en bois, sous les
# lumières d'un bar ; un trait laser doré le balaie de haut en bas, puis une plaque en laiton gravée donne son nom.
# Sans son, aucun prix. Usage (racine) : python3 tools/video/verres_comptoir_64.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, arrondi, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
P = lambda n: os.path.join("public", "produits", n)
# (photo, badge EXEMPLE à effacer, nom du verre, phrase)
VERRES = [
  (P("flute-grav-05.webp"), False, "Flûte à champagne", "Vos prénoms et votre date"),
  (P("verre_a_whisky_exemple_face.jpg"), False, "Verre à whisky", "Sa photo, gravée dans le verre"),
  (P("verre_tumbler_39_ex_photo.jpg"), True, "Verre tumbler", "Votre photo de couple"),
  (P("verre_a_cocktail_ex_colombes.jpg"), True, "Verre à cocktail", "Léa & Paul, pour l'apéritif"),
  (P("verre_a_whisky_card.jpg"), False, "Verre à whisky", "L'authentique papa poule"),
  (P("verre_tumbler_37_ex_fee.jpg"), True, "Verre tumbler", "Un dessin et un prénom"),
  (P("flute-grav-01.jpg"), False, "Flûtes à champagne", "Pour trinquer le grand jour"),
  (P("verre_whisky_papa_monde_moustache.jpg"), False, "Verre à whisky", "Le meilleur papa du monde"),
  (P("verre_tumbler_39_ex_texte.jpg"), True, "Verre tumbler", "Joyeux anniversaire, Paul"),
  (P("verre_a_cocktail_ex_texte.jpg"), True, "Verre à cocktail", "Un simple « Santé ! »"),
  (P("verre_whisky_papa_monde_banniere.jpg"), False, "Verre à whisky", "« Je t'aime fort »"),
]
DS = 2.9; T_INTRO = 2.3; T_FIN = 3.6
TOTAL = T_INTRO + len(VERRES) * DS + T_FIN
COMPTOIR_Y = 1380

def carte(img, w=720, h=900):
    im = ImageOps.contain(img.convert("RGB"), (w - 28, h - 28), Image.LANCZOS)
    c = ImageOps.fit(img.convert("RGB"), (w, h)).filter(ImageFilter.GaussianBlur(30))
    c = Image.blend(c, Image.new("RGB", (w, h), (255, 255, 255)), 0.35)
    c.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    out = arrondi(c, 30); d = ImageDraw.Draw(out)
    d.rounded_rectangle((3, 3, w - 4, h - 4), 28, outline=OR + (255,), width=5)
    return out
CARTES = []
for src, badge, *_ in VERRES:
    im = Image.open(src)
    if badge: im = sans_badge(im)
    CARTES.append(carte(im))

# Décor du bar : fond sombre chaud, lumières floues, comptoir en bois
random.seed(64)
FOND = Image.new("RGBA", (W, H), (28, 20, 16, 255))
lum = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lum)
for _ in range(38):
    x, y, r = random.randint(-40, W + 40), random.randint(60, COMPTOIR_Y - 200), random.randint(18, 70)
    c = random.choice([(232, 180, 90), (255, 214, 140), (200, 120, 60), (250, 230, 190)])
    dl.ellipse((x - r, y - r, x + r, y + r), fill=c + (random.randint(40, 110),))
FOND.alpha_composite(lum.filter(ImageFilter.GaussianBlur(14)))
bois = Image.new("RGBA", (W, H - COMPTOIR_Y), (92, 56, 32, 255)); db = ImageDraw.Draw(bois)
for k in range(0, H - COMPTOIR_Y, 6):
    t = (math.sin(k * 0.09) + 1) / 2
    db.line((0, k, W, k), fill=(int(84 + 22 * t), int(50 + 14 * t), int(28 + 8 * t), 255), width=6)
db.rectangle((0, 0, W, 18), fill=(150, 104, 60, 255))
FOND.alpha_composite(bois, (0, COMPTOIR_Y))

def plaque(d, texte, nom, a):
    f1 = INTER(30, 700); f2 = PLAY(58, 600)
    lab = nom.upper(); wl = max(lg(d, lab, f1), lg(d, texte, f2)) + 90
    x0, y0 = (W - wl) / 2, 1500; x1, y1 = x0 + wl, y0 + 200
    d.rounded_rectangle((x0, y0, x1, y1), 24, fill=(214, 176, 98, int(255 * a)), outline=(150, 112, 44, int(255 * a)), width=4)
    for vx in (x0 + 22, x1 - 22):
        for vy in (y0 + 22, y1 - 22): d.ellipse((vx - 6, vy - 6, vx + 6, vy + 6), fill=(130, 96, 38, int(255 * a)))
    d.text(((W - lg(d, lab, f1)) / 2, y0 + 34), lab, font=f1, fill=(90, 62, 22, int(255 * a)))
    d.text(((W - lg(d, texte, f2)) / 2, y0 + 86), texte, font=f2, fill=(52, 34, 12, int(255 * a)))

def image(t):
    im = FOND.copy(); d = ImageDraw.Draw(im)
    if t < T_INTRO:
        f1 = PLAY(104, 700); f2 = INTER(40, 500)
        for i, (txt, c) in enumerate([("Nos verres", CREME), ("gravés", OR_CLAIR)]):
            k = ease((t - i * 0.25) / 0.7)
            d.text(((W - lg(d, txt, f1)) / 2, 640 + i * 130 + (1 - k) * 50), txt, font=f1, fill=c + (int(255 * k),))
        s = "Un prénom, une photo, une date"; k = ease((t - 0.8) / 0.6)
        d.text(((W - lg(d, s, f2)) / 2, 960), s, font=f2, fill=(220, 200, 170, int(255 * k)))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < len(VERRES) * DS:
        i = int(t2 // DS); u = t2 - i * DS
        src, badge, nom, phr = VERRES[i]
        entree = ease(u / 0.55); sortie = easeio((u - DS + 0.4) / 0.4)
        cx = W / 2 + (1 - entree) * (W + 400) - sortie * (W + 400)
        cy = COMPTOIR_Y - 470
        bascule = (1 - entree) * -4 + sortie * 4
        # reflet sur le comptoir
        refl = ImageOps.flip(CARTES[i]).resize((CARTES[i].width, 160))
        refl.putalpha(refl.getchannel("A").point(lambda v: int(v * 0.18)))
        im.alpha_composite(refl, (int(cx - refl.width / 2), COMPTOIR_Y + 20))
        coller(im, CARTES[i], cx, cy, bascule)
        # trait laser qui balaie la carte
        b = (u - 0.65) / 0.9
        if 0 < b < 1 and sortie == 0:
            ly = cy - 450 + b * 900
            halo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dh = ImageDraw.Draw(halo)
            dh.rectangle((cx - 380, ly - 10, cx + 380, ly + 10), fill=(255, 220, 140, 150))
            im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(12)))
            d.line((cx - 370, ly, cx + 370, ly), fill=(255, 240, 200, 255), width=3)
            rr = random.Random(int(u * 30) + i * 100)
            for _ in range(10):
                x = cx - 360 + rr.random() * 720; r = rr.random() * 5 + 2
                d.ellipse((x - r, ly - r - rr.random() * 18, x + r, ly + r), fill=(255, 230, 160, 220))
        a = ease((u - 1.2) / 0.4) * (1 - sortie)
        if a > 0: plaque(d, phr, nom, a)
        return im.convert("RGB")
    u = t2 - len(VERRES) * DS
    im = Image.new("RGBA", (W, H), (28, 20, 16, 255)); d = ImageDraw.Draw(im)
    for k, c in enumerate(CARTES):
        col, row = k % 4, k // 4; e = ease((u - k * 0.05) / 0.5)
        coller(im, c, 150 + col * 260, 560 + row * 330, a=e, sc=0.33 * (0.85 + 0.15 * e), ombre=False)
    f = PLAY(68, 700)
    for k, (txt, cc) in enumerate([("Gravés à votre nom,", CREME), ("dans notre atelier", OR_CLAIR)]):
        d.text(((W - lg(d, txt, f)) / 2, 150 + k * 88), txt, font=f, fill=cc)
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, 1650 - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))
    return im.convert("RGB")

if APERCU:
    for k, tt in enumerate([1.5, T_INTRO + 0.3, T_INTRO + 1.1, T_INTRO + 2.0, T_INTRO + 2 * DS + 2.0, T_INTRO + 9 * DS + 2.0, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu64-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "64-verres-comptoir"), round(TOTAL, 1), "s")
