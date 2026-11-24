# Vidéo 76 (24/11/2026) — créations gravées, style NEUF « étiquettes cadeaux » : sur un papier kraft, une ficelle tendue ;
# une étiquette en kraft descend, se balance et dit pour qui (« Pour Maman », « Pour Papa »…), puis la photo de la pièce
# GRAVÉE monte en dessous, tenue par une pince en bois. Fin : l'étiquette « Pour vous » + nivcreation.fr.
# Sans son, aucun prix, aucun nombre. Usage (racine) : python3 tools/video/etiquettes_76.py <polices> <sortie> [--apercu]
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, sans_badge, encoder, OR)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
SCRIPT = lambda s: ImageFont.truetype(os.path.join(FD, "GreatVibes.ttf"), s)
P = lambda n: os.path.join("public", n)
ENCRE = (52, 34, 20); ROUGE = (150, 32, 36)

ITEMS = [
  ("Pour Maman", "produits/collier-coeur-plaques-1.jpg", False, "Collier cœur & plaques", "Les prénoms de ses enfants"),
  ("Pour Papa", "produits/verre_a_whisky_exemple_face.jpg", False, "Verre à whisky", "Sa photo, gravée dans le verre"),
  ("Pour bébé", "produits/plaque-naissance-coeur-1.jpg", False, "Plaque de naissance", "Son prénom et sa date de naissance"),
  ("Pour les mariés", "produits/numero_table_arche_geometrique_relief_bois.jpeg", False, "Numéro de table", "En bois, pour le grand jour"),
  ("Pour lui", "produits/bracelet-cordon-plaque-4.jpg", False, "Bracelet cordon à plaque", "Ses initiales, au poignet"),
  ("Pour elle", "produits/gobelet-rose-grave.jpg", False, "Gobelet isotherme", "Un décor gravé tout autour"),
  ("Pour les enfants", "produits/couverts_enfants_ex_animaux.jpg", False, "Couverts enfant", "Un animal sur chaque couvert"),
  ("Pour une lectrice", "marque-pages/m1/exemple-ex2.jpg", False, "Marque-page en bois", "Son prénom, entre deux pages"),
  ("Pour toute la famille", "produits/deco-noel-cristal-ex-3.jpg", True, "Décoration de Noël en cristal", "Le nom de la famille, au sapin"),
  ("Pour les amoureux des animaux", "produits/porte-cles-rect-demo-chien.jpg", False, "Porte-clés en cristal", "Son compagnon, toujours avec soi"),
]
N = len(ITEMS); DS = 3.2; T_INTRO = 2.8; T_FIN = 4.6
TOTAL = T_INTRO + N * DS + T_FIN
random.seed(76); np.random.seed(76)

# --- papier kraft + ficelle
def kraft(w, h, base=(196, 158, 112), grain=14, fibres=900):
    a = np.random.normal(0, grain, (h, w, 1)) + np.array(base)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)); d = ImageDraw.Draw(im)
    for _ in range(fibres):
        x, y = random.uniform(0, w), random.uniform(0, h); L = random.uniform(8, 40); ang = random.uniform(0, math.pi)
        c = tuple(int(v + random.uniform(-30, 25)) for v in base)
        d.line((x, y, x + L * math.cos(ang), y + L * math.sin(ang)), fill=c, width=1)
    return im
FOND = kraft(W, H, (205, 170, 124), 10, 2500)
vig = Image.radial_gradient("L").resize((W, H)).point(lambda v: int(v * .55))
FOND = Image.composite(Image.new("RGB", (W, H), (110, 78, 48)), FOND, vig).convert("RGBA")
dF = ImageDraw.Draw(FOND)
for k in range(5):                                         # ficelle légèrement courbe
    pts = [(x, 250 + 26 * math.sin(math.pi * x / W) + k * .6) for x in range(0, W + 20, 20)]
    dF.line(pts, fill=(238, 222, 190) if k % 2 else (176, 140, 96), width=2)

# --- étiquette kraft (forme à pans coupés, œillet, ficelle rouge)
TW, TH = 520, 300
def etiquette(texte, sous=None):
    t = kraft(TW, TH, (184, 140, 92), 9, 500).convert("RGBA")
    m = Image.new("L", (TW, TH), 0); dm = ImageDraw.Draw(m)
    dm.polygon([(70, 0), (TW, 0), (TW, TH), (70, TH), (0, TH - 80), (0, 80)], fill=255)
    t.putalpha(m); d = ImageDraw.Draw(t)
    d.line([(70, 6), (TW - 6, 6), (TW - 6, TH - 6), (70, TH - 6), (6, TH - 80), (6, 80), (70, 6)], fill=(150, 112, 70, 255), width=3)
    d.ellipse((34, TH / 2 - 22, 78, TH / 2 + 22), fill=(232, 200, 120)); d.ellipse((44, TH / 2 - 12, 68, TH / 2 + 12), fill=(110, 78, 48))
    f = SCRIPT(96); lignes = [texte]
    if lg(d, texte, f) > TW - 140 and " " in texte[5:]:
        mots = texte.split(); k = len(mots) // 2 + 1; lignes = [" ".join(mots[:k]), " ".join(mots[k:])]; f = SCRIPT(74)
    while max(lg(d, l, f) for l in lignes) > TW - 140: f = SCRIPT(f.size - 4)
    hl = f.size * .95; y0 = (TH - hl * len(lignes)) / 2 - (20 if sous else 0) - f.size * .12
    for j, l in enumerate(lignes):
        d.text((100 + (TW - 120 - lg(d, l, f)) / 2, y0 + j * hl), l, font=f, fill=ENCRE)
    if sous:
        fs = INTER(26, 600); d.text((100 + (TW - 120 - lg(d, sous, fs)) / 2, TH - 78), sous, font=fs, fill=ROUGE)
    return t

# --- carte photo (photo entière, fond blanc cassé, pince en bois)
CW, CH = 820, 900
def carte(src, badge):
    im = Image.open(P(src)).convert("RGB")
    if badge: im = sans_badge(im)
    c = Image.new("RGBA", (CW, CH), (250, 246, 238, 255))
    e = ImageOps.contain(im, (CW - 60, CH - 60), Image.LANCZOS)
    c.paste(e, ((CW - e.width) // 2, (CH - e.height) // 2))
    return c
CARTES = [carte(s, b) for _, s, b, *_ in ITEMS]
TAGS = [etiquette(t) for t, *_ in ITEMS]
TAG_INTRO = etiquette("Pour qui ?")
TAG_FIN = etiquette("Pour vous", "NIVCREATION.FR")

def pince(base, x, y):
    d = ImageDraw.Draw(base)
    d.rounded_rectangle((x - 22, y - 70, x + 22, y + 40), 8, fill=(214, 178, 128), outline=(160, 120, 76), width=2)
    d.line((x, y - 64, x, y + 34), fill=(160, 120, 76), width=2)
    d.rectangle((x - 24, y - 20, x + 24, y - 8), fill=(170, 172, 176))

def poser(base, img, cx, top, ang, a=1.0, pivot_top=True):
    if a <= 0: return
    r = img.rotate(ang, resample=Image.BICUBIC, expand=True, center=(img.width / 2, 0) if pivot_top else None)
    if a < 1: r = r.copy(); r.putalpha(r.getchannel("A").point(lambda v: int(v * a)))
    s = Image.new("RGBA", r.size, (0, 0, 0, 0)); s.putalpha(r.getchannel("A").point(lambda v: int(v * .30 * a)))
    base.alpha_composite(s.filter(ImageFilter.GaussianBlur(16)), (int(cx - r.width / 2 + 10), int(top + 18)))
    base.alpha_composite(r, (int(cx - r.width / 2), int(top)))

def balance(tl, amp=9):               # balancement amorti
    return amp * math.exp(-tl * 1.6) * math.sin(tl * 5.2)

def texte_c(im, t, f, y, c):
    if len(c) == 4 and c[3] <= 0: return
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.text(((W - lg(d, t, f)) / 2, y), t, font=f, fill=c); im.alpha_composite(lay)

def tag_pendu(im, tag, tl, x=W / 2):
    y = -TH + (300 + TH) * ease(tl / .7)            # descend jusqu'à la ficelle
    d = ImageDraw.Draw(im); d.line((x, 250, x, y + 20), fill=ROUGE, width=4)
    poser(im, tag, x, y, balance(tl), pivot_top=True)

def image(t):
    im = FOND.copy()
    if t < T_INTRO:
        tag_pendu(im, TAG_INTRO, t)
        d = ImageDraw.Draw(im); a = ease((t - .9) / .7)
        texte_c(im, "Un cadeau gravé à son nom", PLAY(60), 760, ENCRE + (int(255 * a),))
        texte_c(im, "pour chaque personne qui compte", INTER(38, 500), 860, ENCRE + (int(230 * a),))
        texte_c(im, "Idées cadeaux de Noël", INTER(40, 700), 130, ROUGE + (int(255 * ease(t / .6)),))
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < N * DS:
        i = int(t2 // DS); tl = t2 - i * DS
        sortie = ease((tl - DS + .45) / .45)        # tout part vers la gauche
        dx = -W * sortie
        tag_pendu(im, TAGS[i], tl, W / 2 + dx)
        mont = ease((tl - .5) / .7)                 # la carte monte
        cy = 640 + (H - 640) * (1 - mont)
        poser(im, CARTES[i], W / 2 + dx, cy, 2.2 * math.sin(i * 1.7) + balance(max(0, tl - .5), 3), pivot_top=True)
        if mont > 0: pince(im, int(W / 2 + dx), int(cy + 10))
        d = ImageDraw.Draw(im); a = ease((tl - 1.1) / .5) * (1 - sortie)
        _, _, _, nom, phrase = ITEMS[i]
        f = PLAY(58)
        while lg(d, nom, f) > W - 120: f = PLAY(f.size - 2)
        texte_c(im, nom, f, 1590, ENCRE + (int(255 * a),))
        texte_c(im, phrase, INTER(38, 500), 1680, (90, 62, 38, int(255 * a)))
        texte_c(im, "Gravé à la commande en France", INTER(30, 600), 1770, ROUGE + (int(230 * a),))
        texte_c(im, "Idées cadeaux de Noël", INTER(40, 700), 130, ROUGE + (255,))
        return im.convert("RGB")
    tf = t2 - N * DS
    tag_pendu(im, TAG_FIN, tf)
    d = ImageDraw.Draw(im); a = ease((tf - .8) / .7)
    texte_c(im, "Bijoux, cristal, verres, bois", PLAY(56), 760, ENCRE + (int(255 * a),))
    texte_c(im, "gravés à son prénom", SCRIPT(96), 850, (120, 84, 40, int(255 * a)))
    texte_c(im, "nivcreation.fr", PLAY(84), 1180, ENCRE + (int(255 * ease((tf - 1.4) / .7)),))
    texte_c(im, "Commandez tôt pour Noël", INTER(40, 600), 1310, ROUGE + (int(255 * ease((tf - 1.8) / .7)),))
    return im.convert("RGB")

if APERCU:
    for k, tt in enumerate([1.8, T_INTRO + .4, T_INTRO + 1.8, T_INTRO + DS * 9 + 1.8, TOTAL - 1]):
        image(tt).save(os.path.join(OUT, f"apercu76-{k}.jpg"), quality=85)
else:
    print(encoder(image, TOTAL, OUT, "76-etiquettes-cadeaux"), TOTAL)
