# Vidéo 66 (18/11/2026) — les créations que les clientes commandent le plus (relevé des commandes), style NEUF « carrousel » :
# les cartes tournent sur un plateau clair comme dans une vitrine, la carte du centre avance en grand, son nom et une phrase
# s'écrivent dessous. On ne dit JAMAIS « les plus vendus » (consigne du gérant). Sans son, aucun prix.
# Usage (racine) : python3 tools/video/carrousel_66.py <polices> <sortie> [--apercu]
import os, sys, math
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, arrondi, coller, encoder, OR)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
P = lambda n: os.path.join("public", n)


def verre_vin():
    """Verre à vin vierge du site + modèle n° 15 posé dans le cadre de gravure de la fiche, en blanc givré."""
    v = Image.open(P("produits/verre_vin_vierge.jpg")).convert("RGBA")
    bw, bh = int(v.width * 0.40), int(v.height * 0.26)
    m = Image.open(P("produits/vin-motif-15.png")).convert("RGBA")
    m = ImageOps.contain(m, (bw, bh), Image.LANCZOS)
    givre = Image.new("RGBA", m.size, (150, 160, 172, 0)); givre.putalpha(m.getchannel("A").point(lambda a: int(a * 0.95)))
    x = int(v.width * (0.36 + 0.14)) - m.width // 2; y = int(v.height * (0.17 + 0.12)) - m.height // 2
    ombre = Image.new("RGBA", m.size, (90, 100, 110, 0)); ombre.putalpha(m.getchannel("A").point(lambda a: int(a * 0.55)))
    v.alpha_composite(ombre, (x + 3, y + 3)); v.alpha_composite(givre, (x, y))
    return ImageOps.crop(v, (0, int(v.height * 0.05), 0, int(v.height * 0.25)))


# (image ou chemin, badge EXEMPLE à effacer, nom, phrase)
ITEMS = [
  ("produits/verre_tumbler_37_ex_maries.jpg", True, "Verre tumbler", "Camille & Paul"),
  ("VIN", False, "Verre à vin", "Vos prénoms et votre date"),
  ("produits/cristal-h-famille.jpg", False, "Cristal photo 3D", "Toute la famille réunie"),
  ("produits/flute-grav-02.webp", False, "Flûte à champagne", "Un dessin tout en finesse"),
  ("produits/verre_a_whisky_exemple_face.jpg", False, "Verre à whisky", "Sa photo, gravée dans le verre"),
  ("produits/cristal-v-couple.jpg", False, "Cristal photo 3D", "Votre plus belle photo"),
  ("carnet/exemple-ex2.jpg", False, "Carnet gravé", "Ses recettes, à son nom"),
  ("produits/verre_whisky_papa_monde_banniere.jpg", False, "Verre à whisky", "Le meilleur papa du monde"),
  ("produits/verre_tumbler_37_ex_photo.jpg", True, "Verre tumbler", "Une photo et un prénom"),
  ("produits/cristal-h-amis.jpg", False, "Cristal photo 3D", "Entre amis, pour toujours"),
  ("carnet/exemple-ex6.jpg", False, "Carnet gravé", "Nos souvenirs"),
  ("produits/flute-grav-01.jpg", False, "Flûtes à champagne", "Pour trinquer le grand jour"),
]
N = len(ITEMS); DS = 2.6; T_INTRO = 2.4; T_FIN = 3.8
TOTAL = T_INTRO + N * DS + T_FIN
CW, CH = 700, 880


def carte(img):
    img = img.convert("RGB")
    im = ImageOps.contain(img, (CW - 30, CH - 30), Image.LANCZOS)
    c = ImageOps.fit(img, (CW, CH)).filter(ImageFilter.GaussianBlur(28))
    c = Image.blend(c, Image.new("RGB", (CW, CH), (255, 252, 246)), 0.4)
    c.paste(im, ((CW - im.width) // 2, (CH - im.height) // 2))
    o = arrondi(c, 34); d = ImageDraw.Draw(o)
    d.rounded_rectangle((2, 2, CW - 3, CH - 3), 32, outline=(255, 255, 255, 255), width=8)
    return o


CARTES = []
for src, badge, *_ in ITEMS:
    im = verre_vin() if src == "VIN" else Image.open(P(src))
    if badge: im = sans_badge(im)
    CARTES.append(carte(im))

# Plateau clair : dégradé crème → sable, halo de lumière au centre, sol légèrement plus foncé
FOND = Image.new("RGBA", (W, H))
dF = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H
    dF.line((0, y, W, y), fill=(int(250 - 22 * k), int(244 - 30 * k), int(232 - 40 * k), 255))
halo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(halo).ellipse((W / 2 - 620, 300, W / 2 + 620, 1500), fill=(255, 255, 255, 120))
FOND.alpha_composite(halo.filter(ImageFilter.GaussianBlur(120)))
SOL_Y = 1420
sol = Image.new("RGBA", (W, H - SOL_Y), (0, 0, 0, 0)); ds = ImageDraw.Draw(sol)
for y in range(H - SOL_Y): ds.line((0, y, W, y), fill=(150, 118, 78, int(40 + 50 * y / (H - SOL_Y))))
FOND.alpha_composite(sol, (0, SOL_Y))
ImageDraw.Draw(FOND).line((0, SOL_Y, W, SOL_Y), fill=(201, 162, 75, 160), width=3)
ENCRE = (48, 34, 20)


def position(rel):
    """rel = place sur le carrousel (0 = devant). Renvoie x, y, échelle, opacité, ordre d'affichage."""
    ang = rel * 0.82
    x = W / 2 + math.sin(ang) * 520
    prof = (math.cos(ang) + 1) / 2          # 1 devant, 0 derrière
    sc = 0.36 + 0.64 * prof ** 1.6
    y = 830 - (1 - prof) * 120
    a = max(0.0, min(1.0, (prof - 0.18) / 0.4))
    return x, y, sc, a, prof


def scene(cur, im):
    vis = []
    for i in range(N):
        rel = i - cur
        rel = (rel + N / 2) % N - N / 2
        if abs(rel) > 2.6: continue
        vis.append((position(rel), i))
    vis.sort(key=lambda v: v[0][4])
    for (x, y, sc, a, prof), i in vis:
        c = CARTES[i]
        if prof < 0.98:
            sombre = Image.new("RGBA", c.size, (40, 30, 20, int(120 * (1 - prof)))); sombre.putalpha(c.getchannel("A").point(lambda v: int(v * 0.45 * (1 - prof))))
            c = c.copy(); c.alpha_composite(sombre)
        # reflet sur le sol
        r = ImageOps.flip(c).resize((int(c.width * sc), int(c.height * sc * 0.28)))
        r.putalpha(r.getchannel("A").point(lambda v: int(v * 0.14 * a)))
        im.alpha_composite(r, (int(x - r.width / 2), int(SOL_Y + 8)))
        coller(im, c, x, y + (1 - sc) * 160, a=a, sc=sc)


def bouton(d, u, cy):
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, cy - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=OR)
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(255, 255, 255))


def image(t):
    im = FOND.copy(); d = ImageDraw.Draw(im)
    if t < T_INTRO:
        k0 = ease(t / 0.8)
        f1 = PLAY(96, 700); f2 = INTER(36, 600)
        a = int(255 * k0 * (1 - ease((t - 1.8) / 0.5)))
        for j, txt in enumerate(["Gravés à leur nom,", "offerts avec le cœur"]):
            d.text(((W - lg(d, txt, f1)) / 2, 700 + j * 120), txt, font=f1, fill=ENCRE + (a,) if j == 0 else (169, 137, 53, a))
        s = "IDÉES CADEAUX GRAVÉES"
        d.text(((W - lg(d, s, f2)) / 2, 620), s, font=f2, fill=(169, 137, 53, a))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < N * DS:
        i = int(t2 // DS); u = t2 - i * DS
        cur = i + easeio((u - (DS - 0.6)) / 0.6)
        if i == 0 and u < 0.7:
            tmp = FOND.copy(); scene(cur - 1.2 * (1 - ease(u / 0.7)), tmp)
            im = Image.blend(FOND, tmp, ease(u / 0.5))
        else:
            scene(cur, im)
        d = ImageDraw.Draw(im)
        _, _, nom, phr = ITEMS[i]
        a = ease((u - 0.15) / 0.45) * (1 - ease((u - (DS - 0.55)) / 0.3))
        if a > 0:
            f1 = INTER(32, 700); f2 = PLAY(66, 600)
            lab = nom.upper()
            d.text(((W - lg(d, lab, f1)) / 2, 1500 + (1 - a) * 20), lab, font=f1, fill=(169, 137, 53, int(255 * a)))
            d.text(((W - lg(d, phr, f2)) / 2, 1556 + (1 - a) * 20), phr, font=f2, fill=ENCRE + (int(255 * a),))
            lw = 120 * a; d.line((W / 2 - lw / 2, 1478, W / 2 + lw / 2, 1478), fill=OR, width=3)
        f3 = INTER(30, 600); s = "Gravé dans notre atelier en France"
        d.text(((W - lg(d, s, f3)) / 2, 150), s, font=f3, fill=(120, 96, 60, 200))
        return im.convert("RGB")
    u = t2 - N * DS
    for k, c in enumerate(CARTES):
        col, row = k % 4, k // 4; e = ease((u - k * 0.05) / 0.5)
        coller(im, c, 150 + col * 260, 520 + row * 330, a=e, sc=0.33 * (0.85 + 0.15 * e), ombre=True)
    d = ImageDraw.Draw(im); f = PLAY(70, 700)
    for k, (txt, cc) in enumerate([("Un cadeau unique,", ENCRE), ("gravé à son nom", (169, 137, 53))]):
        d.text(((W - lg(d, txt, f)) / 2, 150 + k * 92), txt, font=f, fill=cc)
    bouton(d, u, 1640)
    return im.convert("RGB")


if APERCU:
    for k, tt in enumerate([1.0, 2.0, T_INTRO + 0.8, T_INTRO + 2.3, T_INTRO + 1 * DS + 1.0, T_INTRO + 6 * DS + 1.0, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu66-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "66-carrousel"), round(TOTAL, 1), "s")
