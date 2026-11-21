# Vidéo 73 (21/11/2026) — créations gravées, style NEUF « vitre givrée » : une fenêtre d'hiver couverte de givre ; un doigt
# l'essuie en larges traits et dévoile derrière la vitre une pièce GRAVÉE, puis le givre revient pour la suivante.
# Fin : « nivcreation.fr » écrit du doigt dans le givre. Sans gobelet ni déco de maison (demande du gérant). Sans son, aucun prix.
# Usage (racine) : python3 tools/video/vitre_givree_73.py <polices> <sortie> [--apercu]
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont, ImageChops
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, encoder, OR, OR_CLAIR, CREME)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)

ITEMS = [
  ("produits/cristal-v-enfant-chat.jpg", False, "Cristal photo 3D", "Votre photo préférée, en 3D"),
  ("produits/verre_tumbler_37_ex_photo.jpg", True, "Verre tumbler", "Sa photo et son prénom"),
  ("produits/catalogue/il_fullxfull.8007460526_h2kk.jpg", False, "Médaillon cœur ouvrable", "Un mot doux caché à l'intérieur"),
  ("produits/flute-grav-02.webp", False, "Flûte à champagne", "Un dessin tout en finesse"),
  ("produits/cristaux-graves/cheval.jpg", False, "Cristal déjà gravé", "Un cheval, prêt à offrir"),
  ("carnet/exemple-ex6.jpg", False, "Carnet gravé", "Vos souvenirs, à deux"),
  ("produits/puzzle-savane.jpg", False, "Puzzle en bois", "Ses animaux, à encastrer"),
  ("marque-pages/m1/exemple-ex5.jpg", False, "Marque-page en bois", "Une photo et un prénom"),
  ("produits/bracelet-femme-acier-porte.jpg", False, "Bracelet gravé", "Une date à porter sur soi"),
  ("produits/cristal-h-amis.jpg", False, "Cristal photo 3D", "Entre amis, pour toujours"),
  ("produits/deco-noel-cristal-ex-2.jpg", True, "Décoration de Noël en cristal", "Notre premier Noël"),
  ("produits/porte-cles-coeur-demo.jpg", False, "Porte-clés cristal lumineux", "Votre photo, qui s'illumine"),
]
N = len(ITEMS); DS = 3.1; T_INTRO = 2.6; T_FIN = 4.6
TOTAL = T_INTRO + N * DS + T_FIN
PX0, PY0, PW, PH = 110, 360, 860, 1060            # vitre

random.seed(73); np.random.seed(73)

# --- photos derrière la vitre (entières, sur fond flou d'elles-mêmes)
def derriere(im):
    f = ImageOps.fit(im, (PW, PH), Image.LANCZOS).filter(ImageFilter.GaussianBlur(30))
    f = Image.blend(f, Image.new("RGB", (PW, PH), (30, 26, 22)), .3)
    e = ImageOps.contain(im, (PW - 60, PH - 60), Image.LANCZOS)
    f.paste(e, ((PW - e.width) // 2, (PH - e.height) // 2)); return f

# texture de givre : taches blanches floues + fines aiguilles
G = Image.new("L", (PW, PH), 0); dg = ImageDraw.Draw(G)
for _ in range(2600):
    x, y, r = random.uniform(0, PW), random.uniform(0, PH), random.uniform(1, 5)
    dg.ellipse((x - r, y - r, x + r, y + r), fill=random.randint(120, 255))
for _ in range(260):
    x, y = random.uniform(0, PW), random.uniform(0, PH); a = random.uniform(0, math.pi)
    for k in range(3):
        aa = a + k * math.pi / 3; L = random.uniform(10, 28)
        dg.line((x - L * math.cos(aa), y - L * math.sin(aa), x + L * math.cos(aa), y + L * math.sin(aa)), fill=230, width=2)
G = G.filter(ImageFilter.GaussianBlur(1.6))
BORD = Image.new("L", (PW, PH), 0)                 # givre plus épais sur les bords
ImageDraw.Draw(BORD).rectangle((0, 0, PW, PH), fill=255)
ImageDraw.Draw(BORD).rounded_rectangle((90, 90, PW - 90, PH - 90), 120, fill=120)
BORD = BORD.filter(ImageFilter.GaussianBlur(60))

def givre(img):
    b = img.filter(ImageFilter.GaussianBlur(26))
    blanc = Image.new("RGB", (PW, PH), (232, 240, 246))
    b = Image.blend(b, blanc, .62)
    b = Image.composite(Image.new("RGB", (PW, PH), (250, 252, 255)), b, G.point(lambda v: int(v * .75)))
    return Image.composite(Image.new("RGB", (PW, PH), (245, 249, 252)), b, BORD.point(lambda v: int(v * .55)))

ARR, GIV = [], []
for src, badge, *_ in ITEMS:
    im = Image.open(P(src)).convert("RGB")
    if badge: im = sans_badge(im)
    a = derriere(im); ARR.append(a); GIV.append(givre(a))

# nuit d'hiver derrière la vitre pour la fin (bleu nuit + lumières dorées floues)
NUIT = Image.new("RGB", (PW, PH), (24, 30, 52)); dn = ImageDraw.Draw(NUIT)
for _ in range(30):
    x, y, r = random.uniform(0, PW), random.uniform(0, PH), random.uniform(18, 60)
    dn.ellipse((x - r, y - r, x + r, y + r), fill=(random.randint(200, 255), random.randint(170, 210), random.randint(90, 140)))
NUIT = Image.blend(NUIT.filter(ImageFilter.GaussianBlur(24)), Image.new("RGB", (PW, PH), (24, 30, 52)), .45)
GIV_FIN = givre(NUIT)

# trajets du doigt : grands traits en zigzag qui descendent
def trajet():
    pts = []; y = 120 + random.uniform(-30, 30); gauche = True
    while y < PH - 100:
        x0, x1 = (60, PW - 60) if gauche else (PW - 60, 60)
        for k in range(12):
            u = k / 11; pts.append((x0 + (x1 - x0) * u, y + 30 * math.sin(u * math.pi) + random.uniform(-6, 6)))
        y += 175; gauche = not gauche
    return pts
TRAJETS = [trajet() for _ in ITEMS]

def masque(pts, prog, larg=170):
    m = Image.new("L", (PW, PH), 0); d = ImageDraw.Draw(m)
    n = max(2, int(len(pts) * prog))
    sub = pts[:n]
    d.line(sub, fill=255, width=larg, joint="curve")
    for x, y in (sub[0], sub[-1]): d.ellipse((x - larg / 2, y - larg / 2, x + larg / 2, y + larg / 2), fill=255)
    return m.filter(ImageFilter.GaussianBlur(14))

# --- décor : mur chaud, cadre de fenêtre en bois, rebord, guirlande lumineuse
FOND = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(FOND)
for y in range(H):
    k = y / H; d.line((0, y, W, y), fill=(int(58 - 26 * k), int(36 - 16 * k), int(26 - 12 * k), 255))
BOK = Image.new("RGBA", (W, H), (0, 0, 0, 0)); db = ImageDraw.Draw(BOK)
for _ in range(34):
    x, y, r = random.uniform(0, W), random.uniform(0, H), random.uniform(12, 48)
    db.ellipse((x - r, y - r, x + r, y + r), fill=OR_CLAIR + (random.randint(20, 60),))
FOND.alpha_composite(BOK.filter(ImageFilter.GaussianBlur(16)))
CADRE = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dc = ImageDraw.Draw(CADRE)
BOIS = (92, 58, 34, 255); BOIS2 = (120, 78, 46, 255)
dc.rounded_rectangle((PX0 - 46, PY0 - 46, PX0 + PW + 46, PY0 + PH + 46), 20, fill=BOIS)
dc.rectangle((PX0 - 46, PY0 - 46, PX0 + PW + 46, PY0 - 30), fill=BOIS2)
dc.rectangle((PX0 - 80, PY0 + PH + 30, PX0 + PW + 80, PY0 + PH + 72), fill=BOIS2)          # rebord
dc.rectangle((PX0, PY0, PX0 + PW, PY0 + PH), fill=(0, 0, 0, 0))
# trou de la vitre (transparent)
trou = Image.new("L", (W, H), 255); ImageDraw.Draw(trou).rectangle((PX0, PY0, PX0 + PW, PY0 + PH), fill=0)
CADRE.putalpha(ImageChops.multiply(CADRE.getchannel("A"), trou))
OMBRE = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(OMBRE).rounded_rectangle((PX0 - 40, PY0 - 20, PX0 + PW + 60, PY0 + PH + 90), 20, fill=(0, 0, 0, 150))
FOND.alpha_composite(OMBRE.filter(ImageFilter.GaussianBlur(26)))
AMP = [(PX0 - 46 + i * (PW + 92) / 13, PY0 - 46 + 18 * math.sin(i * 0.9)) for i in range(14)]
NEIGE = [(random.uniform(0, W), random.uniform(0, H), random.uniform(2, 6), random.uniform(25, 70)) for _ in range(70)]

FT = SCRIPT(112); FS = INTER(34, 500); FNOM = PLAY(60, 700); FPH = INTER(36, 500)

def texte_c(d, y, t, f, fill):
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=fill)

def vitre(t):
    """Contenu de la vitre au temps t (image RGB PW×PH) + index courant et phase."""
    if t < T_INTRO:
        return GIV[0], -1, 0
    tf = t - T_INTRO - N * DS
    if tf >= 0:
        return Image.blend(GIV[-1], GIV_FIN, ease(tf / .4)), N, tf
    i = int((t - T_INTRO) // DS); v = t - T_INTRO - i * DS
    if v < 0.25:                       # le givre se reforme sur la photo précédente → nouvelle photo derrière
        if i == 0: return GIV[0], i, v
        k = ease(v / 0.25); return Image.blend(GIV[i - 1], GIV[i], k), i, v
    if v < 1.75:                       # le doigt essuie
        prog = ease((v - 0.25) / 1.5)
        return Image.composite(ARR[i], GIV[i], masque(TRAJETS[i], prog)), i, v
    if v < 2.15:                       # le reste du givre s'efface
        k = ease((v - 1.75) / 0.4)
        m = masque(TRAJETS[i], 1).point(lambda a: int(a + (255 - a) * k))
        return Image.composite(ARR[i], GIV[i], m), i, v
    if v < DS - 0.35: return ARR[i], i, v
    k = ease((v - (DS - 0.35)) / 0.35)            # le givre revient
    return Image.blend(ARR[i], GIV[i], k), i, v

def image(t):
    fr = FOND.copy()
    pane, i, v = vitre(t)
    fr.paste(pane, (PX0, PY0))
    # reflet léger sur la vitre
    fr.alpha_composite(CADRE)
    d = ImageDraw.Draw(fr)
    # guirlande d'ampoules sur le haut du cadre
    for k, (x, y) in enumerate(AMP):
        lum = 0.6 + 0.4 * math.sin(t * 3 + k)
        halo = int(70 * lum)
        d.ellipse((x - 22, y - 22, x + 22, y + 22), fill=OR_CLAIR + (halo,))
        d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(255, 226, 150, 255))
    if k: d.line(AMP, fill=(40, 30, 20, 255), width=3)
    # titre
    a = int(255 * ease(t / 1.0))
    texte_c(d, 90, "Derrière la vitre", FT, OR_CLAIR + (a,))
    texte_c(d, 225, "nos créations gravées", FS, CREME + (a,))
    # nom + phrase sous le rebord
    if 0 <= i < N and v > 1.6:
        _, _, nom, phr = ITEMS[i]
        ta = int(255 * (ease((v - 1.6) / .45) if v < DS - .35 else 1 - ease((v - (DS - .35)) / .3)))
        texte_c(d, 1555, nom, FNOM, OR_CLAIR + (ta,))
        texte_c(d, 1645, phr, FPH, CREME + (ta,))
    # fin : le doigt écrit dans le givre
    if i == N:
        tf = v
        cal = Image.new("L", (PW, PH), 0); dcal = ImageDraw.Draw(cal)
        fw = SCRIPT(130); tx = "nivcreation.fr"; wtx = lg(dcal, tx, fw)
        dcal.text(((PW - wtx) / 2, 330), tx, font=fw, fill=255)
        fw2 = SCRIPT(96); t2 = "Joyeux Noël"; w2 = lg(dcal, t2, fw2)
        dcal.text(((PW - w2) / 2, 560), t2, font=fw2, fill=255)
        rev = Image.new("L", (PW, PH), 0); ImageDraw.Draw(rev).rectangle((0, 0, PW * ease(tf / 2.0), PH), fill=255)
        cal = ImageChops.multiply(cal, rev).filter(ImageFilter.GaussianBlur(2))
        fr.paste(Image.composite(NUIT, pane, cal), (PX0, PY0))
        fr.alpha_composite(CADRE)
        d = ImageDraw.Draw(fr)
        ta = int(255 * ease((tf - 1.2) / .6))
        texte_c(d, 1555, "Gravé à leur prénom", FNOM, OR_CLAIR + (ta,))
        texte_c(d, 1645, "dans notre atelier · Commandez tôt pour Noël", FPH, CREME + (ta,))
    # neige devant
    for (x, y, r, vit) in NEIGE:
        yy = (y + t * vit) % H; xx = x + 12 * math.sin(t * .8 + y)
        d.ellipse((xx - r, yy - r, xx + r, yy + r), fill=(255, 255, 255, 140))
    return fr.convert("RGB")

if APERCU:
    for n, tt in enumerate([1.5, T_INTRO + 1.0, T_INTRO + 2.4, T_INTRO + 2 * DS + 2.4, T_INTRO + 5 * DS + 1.2, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu73-{n}.jpg"), quality=85)
else:
    print(encoder(image, TOTAL, OUT, "73-vitre-givree"), round(TOTAL, 1))
