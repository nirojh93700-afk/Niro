#!/usr/bin/env python3
"""Images « Exemple » de la décoration de Noël en cristal (09/11/2026, gérant : « des exemples comme si c'était gravé, des photos aussi »).
Base = la photo du gérant (cristal sur son socle, décor chaleureux) dont la gravure anglaise est effacée (inpaint OpenCV),
puis une gravure en FRANÇAIS posée en blanc givré : dessins de Noël du site (noel-NN-blanc.png) ou photo d'exemple + textes.
Usage : python3 tools/maquettes/deco-noel-cristal-exemples.py <dossier de sortie>  (puis renommer en public/produits/deco-noel-cristal-ex-1..4.jpg :
dessin-camille, photo-couple, mots-famille, photo-enfant)"""
import os, sys
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
F = os.path.expanduser("~/.fonts")
PF, GV = "PlayfairDisplay%5Bwght%5D.ttf", "GreatVibes-Regular.ttf"
CX, CY, R = 523, 640, 268

def base():
    im = cv2.imread(os.path.join(ROOT, "public/produits/deco-noel-cristal-exemple.jpg"))
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.int16)
    bg = cv2.medianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), 31).astype(np.int16)
    yy, xx = np.mgrid[:im.shape[0], :im.shape[1]]
    disc = ((xx - 523) ** 2 + (yy - 630) ** 2 < 272 * 272) & (yy > 395)
    m = (((g - bg) > 14) & disc).astype(np.uint8) * 255
    cv2.ellipse(m, (517, 828), (48, 26), 0, 0, 360, 255, -1)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=2)
    out = cv2.inpaint(im, m, 9, cv2.INPAINT_TELEA)
    return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))

def police(nom, taille, poids=None):
    f = ImageFont.truetype(os.path.join(F, nom), taille)
    if poids: f.set_variation_by_axes([poids])
    return f

def texte(cal, txt, nom, taille, y, poids=None, espace=0):
    d = ImageDraw.Draw(cal)
    while True:
        f = police(nom, taille, poids)
        w = d.textlength(txt, font=f) + espace * (len(txt) - 1)
        if w <= 2 * R * .80 or taille < 14: break
        taille -= 2
    x = CX - w / 2
    if espace:
        for c in txt:
            d.text((x, y), c, font=f, fill=(255, 255, 255, 255)); x += d.textlength(c, font=f) + espace
    else:
        d.text((x, y), txt, font=f, fill=(255, 255, 255, 255))
    return int(taille * 1.22)

def dessin(cal, num, h, y):
    d = Image.open(os.path.join(ROOT, f"public/produits/noel/noel-{num:02d}-blanc.png")).convert("LA")
    w = round(d.width * h / d.height)
    if w > 2 * R * .62: w = int(2 * R * .62); h = round(d.height * w / d.width)
    d = d.resize((w, h), Image.LANCZOS)
    cal.alpha_composite(Image.merge("RGBA", (*[d.split()[0]] * 3, d.split()[1])), (CX - w // 2, y))
    return h

def photo(cal, chemin, h, y):
    p = ImageOps.grayscale(Image.open(chemin))
    w = round(p.width * h / p.height)
    p = ImageOps.autocontrast(p.resize((w, h), Image.LANCZOS), cutoff=2)
    ov = Image.new("L", (w, h), 0); ImageDraw.Draw(ov).ellipse([w * .04, h * .02, w * .96, h * .98], fill=255)
    a = Image.composite(p.point(lambda v: int(v * .95)), Image.new("L", (w, h), 0), ov.filter(ImageFilter.GaussianBlur(min(w, h) * .07)))
    cal.alpha_composite(Image.merge("RGBA", (Image.new("L", (w, h), 255),) * 3 + (a,)), (CX - w // 2, y))
    return h

def grave(img, cal):
    a = cal.split()[-1]
    blanc = Image.new("RGB", img.size, (252, 250, 246))
    img = Image.composite(blanc, img, a.filter(ImageFilter.GaussianBlur(2.4)).point(lambda p: int(p * .45)))
    return Image.composite(blanc, img, a.point(lambda p: int(p * .93)))

def exemple(nom, pieces):
    img = base(); cal = Image.new("RGBA", img.size, (0, 0, 0, 0)); y = 432
    for kind, *args in pieces:
        if kind == "dessin": y += dessin(cal, args[0], args[1], y) + 14
        elif kind == "photo": y += photo(cal, os.path.join(ROOT, args[0]), args[1], y) + 10
        elif kind == "espace": y += args[0]
        else: y += texte(cal, *args[:2], y=y, poids=args[2] if len(args) > 2 else None, espace=args[3] if len(args) > 3 else 0, taille=None) if False else texte(cal, args[0], args[1], args[2], y, args[3] if len(args) > 3 else None, args[4] if len(args) > 4 else 0)
    img = grave(img, cal)
    # étiquette « EXEMPLE » comme sur les autres fiches (pastille encre, lettres or) ; --sans-etiquette = pour une vidéo
    if "--sans-etiquette" in sys.argv:
        img.save(os.path.join(OUT, nom), "JPEG", quality=90, optimize=True, progressive=True); print(nom); return
    d = ImageDraw.Draw(img); fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    w = d.textlength("EXEMPLE", font=fb)
    d.rounded_rectangle([26, 26, 26 + w + 40, 76], radius=25, fill=(26, 18, 6))
    d.text((46, 35), "EXEMPLE", font=fb, fill=(226, 198, 126))
    img.save(os.path.join(OUT, nom), "JPEG", quality=88, optimize=True, progressive=True); print(nom)

PORT = "docs/maquettes/assets/marque-pages/exemples/portraits/"
exemple("exemple-dessin-camille.jpg", [("dessin", 3, 190), ("t", "JOYEUX NOËL", PF, 30, 500, 4), ("t", "Camille", GV, 92), ("t", "2026", PF, 30, 500, 4)])
exemple("exemple-photo-couple.jpg", [("photo", PORT + "couple.jpg", 250), ("t", "Notre premier Noël", GV, 64), ("t", "LÉA & PAUL · 2026", PF, 26, 500, 3)])
exemple("exemple-mots-famille.jpg", [("dessin", 20, 230), ("espace", 6), ("t", "Famille Martin", GV, 74), ("t", "NOËL 2026", PF, 26, 500, 4)])
exemple("exemple-photo-enfant.jpg", [("photo", PORT + "enfant-chien.jpg", 250), ("t", "Mon premier Noël", GV, 64), ("t", "LUCAS · 2026", PF, 26, 500, 3)])
