# Vidéo 71 (20/11/2026) — idées cadeaux de Noël, style NEUF « liste au Père Noël » : sur une feuille de papier crème
# bordée de rouge et d'or, chaque idée s'écrit à la plume puis se coche d'un trait doré ; la photo du produit GRAVÉ
# arrive en polaroïd et se pose en haut de la feuille, sur les précédentes. Neige légère. Sans son, aucun prix.
# Usage (racine) : python3 tools/video/liste_noel_71.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, coller, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)
ROUGE = (150, 28, 34); ENCRE = (52, 34, 22)

# (photo, badge EXEMPLE, ligne de la liste, nom du produit)
ITEMS = [
  ("produits/verre_tumbler_37_ex_maries.jpg", True, "Un verre gravé à nos prénoms", "Verre tumbler"),
  ("produits/collier-coeur-plaques-2.jpg", False, "Un collier avec leurs prénoms", "Collier cœur & plaques"),
  ("produits/cristal-h-famille.jpg", False, "Notre photo de famille en cristal", "Cristal photo 3D"),
  ("produits/gobelet/ex8-blanc-photo-maman.jpg", False, "Un gobelet pour maman", "Gobelet isotherme"),
  ("produits/couverts_enfants_ex_animaux.jpg", False, "Ses premiers couverts", "Couverts enfant"),
  ("produits/deco-noel-cristal-ex-3.jpg", True, "Une boule pour le sapin", "Décoration de Noël en cristal"),
  ("catalogue/il_fullxfull.8007460526_h2kk.jpg", False, "Un médaillon qui s'ouvre", "Médaillon cœur ouvrable"),
  ("marque-pages/m2/exemple-ex1.jpg", False, "Un marque-page pour Mamie", "Marque-page en bois"),
]
ITEMS = [((("produits/" + s) if s.startswith("catalogue/") else s), b, l, n) for s, b, l, n in ITEMS]
N = len(ITEMS); DS = 3.3; T_INTRO = 2.8; T_FIN = 4.2
TOTAL = T_INTRO + N * DS + T_FIN
PW, PH, PI = 470, 550, 425
LIGNE0, PAS = 1000, 90            # première ligne de la liste, écart entre les lignes


def polaroid(img):
    ph = ImageOps.fit(img.convert("RGB"), (PI, PI), Image.LANCZOS, centering=(0.5, 0.45))
    c = Image.new("RGBA", (PW, PH), (255, 253, 248, 255)); c.paste(ph, ((PW - PI) // 2, 25))
    ImageDraw.Draw(c).rectangle((0, 0, PW - 1, PH - 1), outline=(220, 210, 190), width=2)
    return c


PHOTOS = []
for src, badge, *_ in ITEMS:
    im = Image.open(P(src))
    if badge: im = sans_badge(im)
    PHOTOS.append(polaroid(im))
random.seed(71)
POSES = [(W / 2 + random.uniform(-140, 140), 640 + random.uniform(-25, 25), random.uniform(-10, 10)) for _ in ITEMS]

# Fond rouge profond + la feuille (papier crème lignée, bordure rouge et or, petits houx dessinés)
FOND = Image.new("RGBA", (W, H))
dF = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H; dF.line((0, y, W, y), fill=(int(120 - 40 * k), int(18 - 6 * k), int(26 - 8 * k), 255))
FEUILLE = Image.new("RGBA", (W - 90, H - 150), (0, 0, 0, 0))
dP = ImageDraw.Draw(FEUILLE)
fw, fh = FEUILLE.size
dP.rounded_rectangle((0, 0, fw - 1, fh - 1), 26, fill=(250, 243, 228, 255))
dP.rounded_rectangle((18, 18, fw - 19, fh - 19), 18, outline=ROUGE + (255,), width=5)
dP.rounded_rectangle((32, 32, fw - 33, fh - 33), 14, outline=OR + (255,), width=2)
for k in range(8):
    y = LIGNE0 - 75 + k * PAS + 88
    dP.line((90, y, fw - 90, y), fill=(200, 180, 150, 140), width=2)
for (hx, hy) in [(70, 70), (fw - 70, 70), (70, fh - 70), (fw - 70, fh - 70)]:
    for dx in (-22, 22):
        dP.ellipse((hx + dx - 20, hy - 12, hx + dx + 20, hy + 12), fill=(40, 110, 60, 255))
    dP.ellipse((hx - 9, hy - 9, hx + 9, hy + 9), fill=(196, 30, 40, 255))
FOND.alpha_composite(FEUILLE, (45, 75))
OMB = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(OMB).rounded_rectangle((55, 95, W - 35, H - 55), 26, fill=(0, 0, 0, 120))
F2 = FOND.copy(); F2.alpha_composite(OMB.filter(ImageFilter.GaussianBlur(20))); F2.alpha_composite(FEUILLE, (45, 75)); FOND = F2

FLOCONS = [(random.uniform(0, W), random.uniform(0, H), random.uniform(3, 8), random.uniform(40, 110)) for _ in range(90)]
FT = SCRIPT(124); FL = SCRIPT(66); FN = INTER(30, 600)


def texte_centre(d, y, t, f, fill):
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=fill)


def ecrit(fr, x, y, t, f, prog, fill):
    """Écrit le texte de gauche à droite (révélé jusqu'à prog)."""
    calque = Image.new("RGBA", (W, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(calque)
    d.text((x, 10), t, font=f, fill=fill)
    larg = lg(d, t, f) + 20
    m = Image.new("L", (W, 170), 0); ImageDraw.Draw(m).rectangle((0, 0, x + larg * prog, 170), fill=255)
    calque.putalpha(Image.composite(calque.getchannel("A"), Image.new("L", (W, 170), 0), m))
    fr.alpha_composite(calque, (0, int(y - 10)))


def image(t):
    fr = FOND.copy(); d = ImageDraw.Draw(fr)
    # titre
    a = ease(t / 1.2)
    ecrit(fr, (W - lg(d, "Ma liste", FT)) / 2, 115, "Ma liste", FT, ease(t / 1.0), ROUGE + (int(255 * a),))
    ecrit(fr, (W - lg(d, "au Père Noël", FT)) / 2, 230, "au Père Noël", FT, ease((t - 0.8) / 1.2), ROUGE + (int(255 * a),))
    # polaroïds posés
    for i in range(N):
        t0 = T_INTRO + i * DS + 1.4
        if t < t0: break
        k = ease((t - t0) / 0.7)
        x, y, ang = POSES[i]
        coller(fr, PHOTOS[i], x + (1 - k) * 700, y - (1 - k) * 160, ang=ang + (1 - k) * 25, sc=1.0)
    d = ImageDraw.Draw(fr)
    # lignes de la liste
    for i in range(N):
        t0 = T_INTRO + i * DS
        if t < t0: break
        y = LIGNE0 + i * PAS
        prog = ease((t - t0) / 1.2)
        x = 175
        ecrit(fr, x, y, ITEMS[i][2], FL, prog, ENCRE + (255,))
        # case + coche dorée
        d = ImageDraw.Draw(fr)
        d.rounded_rectangle((100, y + 34, 140, y + 74), 6, outline=ROUGE, width=4)
        c = (t - t0 - 1.25) / 0.35
        if c > 0:
            c = min(1.0, c)
            pts = [(106, y + 54), (118, y + 68), (146, y + 26)]
            if c < 0.4:
                u = c / 0.4; d.line([pts[0], (pts[0][0] + (pts[1][0] - pts[0][0]) * u, pts[0][1] + (pts[1][1] - pts[0][1]) * u)], fill=OR, width=8)
            else:
                u = (c - 0.4) / 0.6
                d.line([pts[0], pts[1], (pts[1][0] + (pts[2][0] - pts[1][0]) * u, pts[1][1] + (pts[2][1] - pts[1][1]) * u)], fill=OR, width=8, joint="curve")
    # nom du produit sous les polaroïds (celui qu'on vient de poser)
    if T_INTRO <= t < T_INTRO + N * DS:
        k = (t - T_INTRO) / DS; i = int(k); f = k - i
        aa = ease((f - 0.5) / 0.15) * (1 - ease((f - 0.92) / 0.08))
        if aa > 0.01:
            nom = ITEMS[i][3].upper()
            larg = lg(d, nom, FN) + 60
            d.rounded_rectangle((W / 2 - larg / 2, 918, W / 2 + larg / 2, 973), 28, fill=ROUGE + (int(235 * aa),))
            texte_centre(d, 929, nom, FN, (255, 244, 225, int(255 * aa)))
    # neige
    nei = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dn = ImageDraw.Draw(nei)
    for (x, y, r, v) in FLOCONS:
        yy = (y + v * t) % H; xx = x + 18 * math.sin(t * 0.8 + y)
        dn.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 255, 255, 170))
    fr.alpha_composite(nei.filter(ImageFilter.GaussianBlur(1.2)))
    # fin
    tf = t - (T_INTRO + N * DS)
    if tf > 0:
        a = ease(tf / 0.8)
        fr.alpha_composite(Image.new("RGBA", (W, H), (110, 16, 24, int(250 * a))))
        d = ImageDraw.Draw(fr)
        texte_centre(d, 700, "Des cadeaux de Noël", PLAY(80), CREME + (int(255 * a),))
        texte_centre(d, 810, "gravés à leurs noms", SCRIPT(116), OR_CLAIR + (int(255 * a),))
        texte_centre(d, 990, "Commandez tôt pour Noël", INTER(46, 500), CREME + (int(255 * a),))
        pul = 1 + 0.04 * math.sin(tf * 4)
        bw, bh = int(560 * pul), int(118 * pul)
        d.rounded_rectangle((W / 2 - bw / 2, 1120, W / 2 + bw / 2, 1120 + bh), bh // 2, fill=OR + (int(255 * a),))
        texte_centre(d, 1120 + bh / 2 - 38, "nivcreation.fr", PLAY(58), (60, 14, 18, int(255 * a)))
    return fr.convert("RGB")


if APERCU:
    for k, tt in enumerate([2.0, T_INTRO + 1.0, T_INTRO + 2.6, T_INTRO + 4 * DS + 2.6, T_INTRO + N * DS - 0.3, TOTAL - 1]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu71-{k}.jpg"), quality=85)
    print("aperçus OK", TOTAL)
else:
    print(encoder(image, TOTAL, OUT, "71-liste-noel"), round(TOTAL, 1))
