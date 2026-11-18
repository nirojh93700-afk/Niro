# Vidéo 68 (18/11/2026) — nos créations en bois, style NEUF « découpe laser » : sur une planche de contreplaqué, un point
# laser rougeoyant trace le contour de la pièce, la pièce se détache et se soulève (la photo apparaît dedans), puis son nom
# s'inscrit comme gravé dans le bois. Photos de pièces gravées / découpées seulement, sans son, aucun prix.
# Usage (racine) : python3 tools/video/decoupe_bois_68.py <polices> <sortie> [--apercu]
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from videos_commun import (W, H, polices, ease, easeio, lg, arrondi, coller, encoder, OR)

FD, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
APERCU = "--apercu" in sys.argv
PLAY, INTER = polices(FD)
P = lambda n: os.path.join("public", n)
PIECES = [
  ("produits/plaque-naissance-garcon-1.jpg", "Plaque de naissance", "Son prénom, sa date, son poids"),
  ("produits/catalogue/IMG_6324.png", "Plaque de porte enfant", "La chambre d'Ishaan"),
  ("produits/numero_table_arche_geometrique_relief_bois.jpeg", "Numéro de table", "Pour le grand jour"),
  ("produits/puzzle-savane.jpg", "Puzzle en bois", "Les animaux de la savane"),
  ("produits/plaque-naissance-coeur-1.jpg", "Plaque de naissance cœur", "Bienvenue, Juline"),
  ("produits/catalogue/IMG_6547.png", "Menu de mariage", "Gravé à vos prénoms"),
  ("produits/support-telephone-photo.jpg", "Support de téléphone", "Votre photo, gravée dans le bois"),
  ("produits/catalogue/610876bb-4b83-4b09-a722-356af9af8088.webp", "Ronds de serviette", "Le prénom de chaque invité"),
  ("produits/puzzle-photo-enfants.jpg", "Puzzle photo gravé", "Votre photo, en pièces à assembler"),
  ("marque-pages/m1/exemple-ex7.jpg", "Marque-page en bois", "Pour Mamie"),
  ("produits/cartes-etapes-animaux-1.jpg", "Cartes étapes de bébé", "Chaque mois, une photo souvenir"),
  ("produits/photophore-fee-1.jpg", "Photophore fée", "Une lumière douce pour la chambre"),
]
N = len(PIECES); DS = 2.9; T_INTRO = 2.4; T_FIN = 3.8
TOTAL = T_INTRO + N * DS + T_FIN
CW, CH = 760, 860
CX, CY = W / 2, 820
BRULE = (78, 44, 20)

PHOTOS = []
for src, *_ in PIECES:
    im = Image.open(P(src)).convert("RGB")
    c = ImageOps.fit(im, (CW, CH), Image.LANCZOS, centering=(0.5, 0.5))
    PHOTOS.append(arrondi(c, 40))

# Planche de contreplaqué de bouleau : fond clair, veines ondulées, quelques nœuds
random.seed(68)
FOND = Image.new("RGBA", (W, H), (226, 196, 150, 255)); dF = ImageDraw.Draw(FOND)
for y in range(0, H, 3):
    t = math.sin(y * 0.021) * 0.5 + math.sin(y * 0.0073 + 1.3) * 0.5
    c = (int(222 + 12 * t), int(190 + 12 * t), int(142 + 10 * t), 255)
    dF.line((0, y, W, y), fill=c, width=3)
veines = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dV = ImageDraw.Draw(veines)
for _ in range(34):
    y0 = random.randint(0, H); amp = random.randint(6, 30); ph = random.random() * 6
    pts = [(x, y0 + amp * math.sin(x * 0.006 + ph)) for x in range(0, W + 20, 20)]
    dV.line(pts, fill=(176, 132, 84, random.randint(18, 40)), width=random.randint(1, 2))
FOND.alpha_composite(veines.filter(ImageFilter.GaussianBlur(1.2)))
grain = Image.effect_noise((W, H), 14).convert("L").point(lambda v: int(v * 0.12))
FOND.alpha_composite(Image.merge("RGBA", (grain, grain, grain, grain)))
vign = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(vign).rectangle((0, 0, W, H), outline=(80, 50, 20, 70), width=60)
FOND.alpha_composite(vign.filter(ImageFilter.GaussianBlur(80)))


def contour(p):
    """Point sur le contour arrondi de la pièce, p de 0 à 1 (parcours dans le sens des aiguilles d'une montre)."""
    x0, y0, x1, y1 = CX - CW / 2, CY - CH / 2, CX + CW / 2, CY + CH / 2
    L = 2 * (CW + CH); s = (p % 1) * L
    if s < CW: return x0 + s, y0
    s -= CW
    if s < CH: return x1, y0 + s
    s -= CH
    if s < CW: return x1 - s, y1
    s -= CW
    return x0, y1 - s


def trace(im, p, u):
    d = ImageDraw.Draw(im)
    pts = [contour(k / 200 * p) for k in range(int(200 * p) + 1)]
    if len(pts) > 1:
        d.line(pts, fill=(62, 34, 14, 255), width=5, joint="curve")
    x, y = contour(p)
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dh = ImageDraw.Draw(halo)
    dh.ellipse((x - 46, y - 46, x + 46, y + 46), fill=(255, 120, 40, 170))
    im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(im)
    d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(255, 236, 200, 255))
    rr = random.Random(int(u * 40))
    for _ in range(7):
        a = rr.random() * 6.28; r = rr.random() * 34 + 8
        d.line((x, y, x + math.cos(a) * r, y + math.sin(a) * r), fill=(255, 190, 90, 200), width=2)
    # fumée légère
    f = Image.new("RGBA", (W, H), (0, 0, 0, 0)); df = ImageDraw.Draw(f)
    for k in range(5):
        df.ellipse((x - 30 + k * 6, y - 60 - k * 28, x + 30 + k * 6, y - k * 28), fill=(255, 255, 255, 26))
    im.alpha_composite(f.filter(ImageFilter.GaussianBlur(14)))


def grave(im, texte, f, y, a):
    """Texte « gravé » : brûlé brun foncé avec un léger liseré clair en dessous."""
    d = ImageDraw.Draw(im); x = (W - lg(d, texte, f)) / 2
    d.text((x, y + 2), texte, font=f, fill=(250, 226, 186, int(160 * a)))
    d.text((x, y), texte, font=f, fill=BRULE + (int(255 * a),))


def bouton(d, u, cy):
    pul = 1 + 0.04 * math.sin(u * 5); fb = INTER(52, 700); s = "nivcreation.fr"
    bw, bh = (lg(d, s, fb) + 120) * pul, 110 * pul; x0, y0 = (W - bw) / 2, cy - bh / 2
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), int(bh / 2), fill=(70, 40, 18))
    d.text(((W - lg(d, s, fb)) / 2, y0 + (bh - 60) / 2), s, font=fb, fill=(250, 226, 186))


def image(t):
    im = FOND.copy()
    if t < T_INTRO:
        k = ease(t / 1.4)
        f1 = PLAY(104, 700); f2 = INTER(36, 700)
        # le titre se « grave » de gauche à droite
        for j, txt in enumerate(["Nos créations", "en bois"]):
            calque = FOND.copy(); grave(calque, txt, f1, 720 + j * 130, 1.0)
            lim = int(W * ease((t - j * 0.35) / 0.9))
            if lim > 0: im.paste(calque.crop((0, 700 + j * 130, lim, 860 + j * 130)), (0, 700 + j * 130))
        grave(im, "DÉCOUPÉES ET GRAVÉES DANS NOTRE ATELIER", f2, 640, k)
        return im.convert("RGB")
    t2 = t - T_INTRO
    if t2 < N * DS:
        i = int(t2 // DS); u = t2 - i * DS
        _, nom, phr = PIECES[i]
        p = ease(u / 1.0)
        sortie = easeio((u - DS + 0.35) / 0.35)
        if p < 1:
            trace(im, p, u)
            a_ph = ease((u - 0.65) / 0.35)
            if a_ph > 0: coller(im, PHOTOS[i], CX, CY, a=a_ph * 0.6, ombre=False)
        else:
            lev = ease((u - 1.0) / 0.5)
            # creux laissé dans la planche
            d = ImageDraw.Draw(im)
            d.rounded_rectangle((CX - CW / 2, CY - CH / 2, CX + CW / 2, CY + CH / 2), 40, fill=(120, 82, 46, 255), outline=(62, 34, 14, 255), width=5)
            sc = 1 + 0.04 * lev - 0.25 * sortie
            coller(im, PHOTOS[i], CX - sortie * 600, CY - 30 * lev - sortie * 200, ang=-2 * lev + 8 * sortie, a=1 - sortie, sc=sc, ombre=True)
            a = ease((u - 1.15) / 0.45) * (1 - sortie)
            if a > 0:
                grave(im, nom.upper(), INTER(34, 800), 1340, a)
                grave(im, phr, PLAY(62, 600), 1396, a)
        return im.convert("RGB")
    u = t2 - N * DS
    for k, c in enumerate(PHOTOS):
        col, row = k % 3, k // 3; e = ease((u - k * 0.05) / 0.5)
        coller(im, c, 230 + col * 310, 470 + row * 300, a=e, sc=0.34 * (0.85 + 0.15 * e), ombre=True)
    for k, txt in enumerate(["Découpées et gravées", "à votre nom"]):
        grave(im, txt, PLAY(70, 700), 110 + k * 90, 1.0)
    bouton(ImageDraw.Draw(im), u, 1760)
    return im.convert("RGB")


if APERCU:
    for k, tt in enumerate([1.8, T_INTRO + 0.5, T_INTRO + 0.85, T_INTRO + 1.9, T_INTRO + 5 * DS + 2.0, T_INTRO + 9 * DS + 2.0, TOTAL - 1.0]):
        image(tt).resize((540, 960)).save(os.path.join(OUT, f"apercu68-{k}.jpg"), quality=85)
    sys.exit(0)
print(encoder(image, TOTAL, OUT, "68-decoupe-bois"), round(TOTAL, 1), "s")
