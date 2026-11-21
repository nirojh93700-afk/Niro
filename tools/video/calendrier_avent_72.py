# Vidéo 72 (21/11/2026) — idées cadeaux gravées, style NEUF « calendrier de l'Avent » : 24 petites portes numérotées sur
# fond vert sapin ; une porte avance au centre, s'ouvre comme un volet et dévoile une pièce GRAVÉE (nom + phrase dessous),
# puis retourne à sa place en gardant la photo. Sans gobelet ni déco de maison (demande du gérant). Sans son, aucun prix.
# Usage (racine) : python3 tools/video/calendrier_avent_72.py <polices> <sortie> [--apercu]
import os, sys, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, arrondi, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)
ROUGE = (160, 30, 36)

# (jour, photo, badge EXEMPLE, nom, phrase)
ITEMS = [
  (1, "produits/cristal-h-couple.jpg", False, "Cristal photo 3D", "Votre photo, en 3D dans le cristal"),
  (3, "produits/verre_vin_exemple_dale.jpg", False, "Verre à vin", "Votre monogramme, gravé"),
  (6, "produits/collier-coeur-grave-1.jpg", False, "Collier cœur gravé", "Vos initiales et votre date"),
  (8, "carnet/exemple-ex1.jpg", False, "Carnet gravé", "Un titre, un dessin, un prénom"),
  (11, "produits/couverts_enfants_ex_prenom.jpg", False, "Couverts enfant", "Ses premiers couverts, à son prénom"),
  (13, "produits/cristaux-graves/colibri.jpg", False, "Cristal déjà gravé", "Un colibri, prêt à offrir"),
  (16, "marque-pages/m1/exemple-ex3.jpg", False, "Marque-page en bois", "Un prénom pour les amoureux de lecture"),
  (19, "produits/puzzle-photo-famille.jpg", False, "Puzzle photo gravé", "Toute la famille, en pièces à assembler"),
  (22, "produits/deco-noel-cristal-ex-4.jpg", True, "Décoration de Noël en cristal", "Son premier Noël, sous le sapin"),
  (24, "produits/verre_whisky_papa_monde_moustache.jpg", False, "Verre à whisky", "Pour le meilleur papa du monde"),
]
N = len(ITEMS); DS = 3.2; T_INTRO = 2.8; T_FIN = 4.4
TOTAL = T_INTRO + N * DS + T_FIN

# grille 4 × 6
COLS, ROWS = 4, 6
GX0, GY0, CW, CH, GAP = 60, 420, 225, 200, 20
def case(j):
    k = j - 1; c, r = k % COLS, k // COLS
    x = GX0 + c * (CW + GAP); y = GY0 + r * (CH + 16)
    return x, y
random.seed(72)
ORDRE = list(range(1, 25)); random.shuffle(ORDRE)       # place de chaque jour dans la grille (mélangée)
PLACE = {j: case(i + 1) for i, j in enumerate(ORDRE)}

BIG = 800
PHOTOS_G, PHOTOS_P = {}, {}
for j, src, badge, *_ in ITEMS:
    im = Image.open(P(src)).convert("RGB")
    if badge: im = sans_badge(im)
    fond = ImageOps.fit(im, (BIG, BIG), Image.LANCZOS).filter(ImageFilter.GaussianBlur(28))
    fond = Image.blend(fond, Image.new("RGB", (BIG, BIG), (20, 30, 24)), .35)
    ent = ImageOps.contain(im, (BIG - 40, BIG - 40), Image.LANCZOS)
    fond.paste(ent, ((BIG - ent.width) // 2, (BIG - ent.height) // 2))
    PHOTOS_G[j] = arrondi(fond, 26)
    PHOTOS_P[j] = arrondi(ImageOps.fit(im, (CW - 16, CH - 16), Image.LANCZOS, centering=(0.5, 0.45)), 12)

# fond vert sapin + reflets dorés flous
FOND = Image.new("RGBA", (W, H))
d = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H; d.line((0, y, W, y), fill=(int(18 + 10 * k), int(58 - 22 * k), int(42 - 16 * k), 255))
BOK = Image.new("RGBA", (W, H), (0, 0, 0, 0)); db = ImageDraw.Draw(BOK)
for _ in range(40):
    x, y, r = random.uniform(0, W), random.uniform(0, H), random.uniform(10, 46)
    db.ellipse((x - r, y - r, x + r, y + r), fill=OR_CLAIR + (random.randint(25, 70),))
FOND.alpha_composite(BOK.filter(ImageFilter.GaussianBlur(14)))

FNUM = PLAY(78, 800); FNUM_G = PLAY(300, 800); FT = SCRIPT(118); FS = INTER(34, 500)
FNOM = PLAY(60, 700); FPH = INTER(36, 500)


def porte(w, h, num, fnum, r):
    """Porte fermée : crème, double filet doré, numéro rouge."""
    p = Image.new("RGBA", (w, h), (0, 0, 0, 0)); dp = ImageDraw.Draw(p)
    dp.rounded_rectangle((0, 0, w - 1, h - 1), r, fill=(248, 238, 218, 255))
    m = max(6, w // 28)
    dp.rounded_rectangle((m, m, w - 1 - m, h - 1 - m), max(4, r - m), outline=OR + (255,), width=max(2, w // 110))
    dp.rounded_rectangle((m * 2, m * 2, w - 1 - m * 2, h - 1 - m * 2), max(3, r - 2 * m), outline=OR_CLAIR + (255,), width=1)
    t = str(num); b = dp.textbbox((0, 0), t, font=fnum)
    dp.text(((w - (b[2] - b[0])) / 2 - b[0], (h - (b[3] - b[1])) / 2 - b[1]), t, font=fnum, fill=ROUGE + (255,))
    return p

PORTES = {j: porte(CW, CH, j, FNUM, 14) for j in range(1, 25)}
PORTE_G = {it[0]: porte(BIG, BIG, it[0], FNUM_G, 26) for it in ITEMS}
NEIGE = [(random.uniform(0, W), random.uniform(0, H), random.uniform(2, 6), random.uniform(30, 90)) for _ in range(70)]


def ouvre(fr, j, cx, cy, s, k_ouv):
    """Photo derrière + volet qui pivote sur le bord gauche (largeur qui se réduit, ombré)."""
    taille = int(BIG * s)
    ph = PHOTOS_G[j].resize((taille, taille), Image.LANCZOS)
    coller(fr, ph, cx, cy)
    if k_ouv < 1:
        pw = max(1, int(taille * (1 - k_ouv)))
        v = PORTE_G[j].resize((pw, taille), Image.LANCZOS)
        if k_ouv > 0:
            sombre = Image.new("RGBA", v.size, (40, 20, 10, int(120 * k_ouv)))
            sombre.putalpha(Image.composite(sombre.getchannel("A"), Image.new("L", v.size, 0), v.getchannel("A")))
            v.alpha_composite(sombre)
        fr.alpha_composite(v, (int(cx - taille / 2), int(cy - taille / 2)))


def texte_c(d, y, t, f, fill):
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=fill)


def image(t):
    fr = FOND.copy(); d = ImageDraw.Draw(fr)
    # titre
    a = int(255 * ease(t / 1.0))
    texte_c(d, 120, "Le calendrier de l'Avent", FT, OR_CLAIR + (a,))
    texte_c(d, 270, "de l'atelier · une idée gravée par jour", FS, CREME + (a,))
    # grille : portes déjà ouvertes = photo
    i_cur = int((t - T_INTRO) // DS) if t >= T_INTRO else -1
    for jour in range(1, 25):
        x, y = PLACE[jour]
        k = ease((t - 0.3 - (ORDRE.index(jour)) * 0.05) / 0.5)
        if k <= 0: continue
        ouvert = any(it[0] == jour and (T_INTRO + n * DS + DS * 0.92) <= t for n, it in enumerate(ITEMS))
        en_cours = 0 <= i_cur < N and ITEMS[i_cur][0] == jour
        if en_cours: continue
        img = PHOTOS_P[jour] if ouvert else PORTES[jour]
        if ouvert:
            cadre = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
            ImageDraw.Draw(cadre).rounded_rectangle((0, 0, CW - 1, CH - 1), 14, fill=OR + (255,))
            cadre.alpha_composite(img, (8, 8)); img = cadre
        if k < 1: img = img.copy(); img.putalpha(img.getchannel("A").point(lambda v: int(v * k)))
        fr.alpha_composite(img, (int(x), int(y + (1 - k) * 40)))
    # porte en cours
    if 0 <= i_cur < N:
        j, _, _, nom, phr = ITEMS[i_cur]; v = t - T_INTRO - i_cur * DS
        x0, y0 = PLACE[j]; sx, sy = x0 + CW / 2, y0 + CH / 2
        cx, cy = W / 2, 900
        # assombrir la grille
        voile = min(1, v / .4) if v < DS - .5 else max(0, (DS - v) / .5)
        fr.alpha_composite(Image.new("RGBA", (W, H), (6, 18, 12, int(170 * voile))))
        if v < .55:                       # la porte avance
            k = easeio(v / .55); s = (CW / BIG) + (1 - CW / BIG) * k
            px, py = sx + (cx - sx) * k, sy + (cy - sy) * k
            ouvre(fr, j, px, py, s, 0)
        elif v < DS - .45:
            kk = ease((v - .55) / .65)
            ouvre(fr, j, cx, cy, 1, kk)
            d = ImageDraw.Draw(fr)
            ta = int(255 * ease((v - 1.0) / .5))
            if ta > 0:
                pan = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(pan).rounded_rectangle((70, 1335, W - 70, 1520), 28, fill=(14, 36, 26, int(235 * ta / 255)), outline=OR + (ta,), width=3)
                fr.alpha_composite(pan); d = ImageDraw.Draw(fr)
                texte_c(d, 1360, nom, FNOM, OR_CLAIR + (ta,))
                texte_c(d, 1445, phr, FPH, CREME + (ta,))
        else:                             # retour à sa place, photo visible
            k = easeio((v - (DS - .45)) / .45); s = 1 - (1 - CW / BIG) * k
            px, py = cx + (sx - cx) * k, cy + (sy - cy) * k
            ouvre(fr, j, px, py, s, 1)
    # fin
    tf = t - (T_INTRO + N * DS)
    if tf > 0:
        k = ease(tf / .8)
        voile = Image.new("RGBA", (W, H), (8, 22, 15, int(150 * k))); fr.alpha_composite(voile)
        d = ImageDraw.Draw(fr)
        bx = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dbx = ImageDraw.Draw(bx)
        dbx.rounded_rectangle((90, 760, W - 90, 1240), 30, fill=(250, 243, 228, int(245 * k)), outline=OR + (int(255 * k),), width=4)
        fr.alpha_composite(bx); d = ImageDraw.Draw(fr)
        a = int(255 * k)
        texte_c(d, 800, "Gravé à leur prénom", PLAY(64, 700), ROUGE + (a,))
        texte_c(d, 890, "dans notre atelier", PLAY(64, 700), ROUGE + (a,))
        texte_c(d, 1000, "Commandez tôt pour Noël", INTER(38, 600), (60, 40, 25, a))
        p = 1 + 0.04 * max(0, __import__("math").sin(tf * 4)) if tf > 1.2 else 1
        fb = INTER(int(46 * p), 700); tb = "nivcreation.fr"; wb = lg(d, tb, fb)
        d.rounded_rectangle(((W - wb) / 2 - 40, 1100, (W + wb) / 2 + 40, 1180), 40, fill=OR + (a,))
        d.text(((W - wb) / 2, 1112), tb, font=fb, fill=(40, 28, 18, a))
    # neige
    d = ImageDraw.Draw(fr)
    for (x, y, r, vit) in NEIGE:
        yy = (y + t * vit) % H; xx = x + 14 * __import__("math").sin(t + y)
        d.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 255, 255, 150))
    return fr.convert("RGB")


if APERCU:
    for i, tt in enumerate([1.5, T_INTRO + .3, T_INTRO + 1.0, T_INTRO + 2.0, T_INTRO + 5 * DS + 2.0, TOTAL - 1.5]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu72-{i}.jpg"), quality=85)
else:
    print(encoder(image, TOTAL, OUT, "72-calendrier-avent"), round(TOTAL, 1))
