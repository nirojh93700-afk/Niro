#!/usr/bin/env python3
"""Images « Exemple » de la décoration de Noël en verre : la gravure en blanc givré, comme en vrai.
Le disque vierge (photo fournisseur) est posé sur un fond de Noël sombre (fond de l'image inversé + écran :
le verre laisse voir le fond, le biseau brille), le ruban bleu est gardé, le dessin de Noël (noel-NN-blanc.png
du site) et les textes sont gravés en blanc givré.
Usage : python3 tools/maquettes/deco-noel-verre-exemples.py <dossier de sortie>"""
import os, sys, random
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, "docs/maquettes/assets/deco-noel-verre")
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
F = os.path.expanduser("~/.fonts")
CX, CY, R = 517, 590, 333

def fond(seed, c1, c2):
    W = 1024; im = Image.new("RGB", (W, W)); d = ImageDraw.Draw(im)
    for y in range(W):
        t = y / W; d.line([(0, y), (W, y)], fill=tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3)))
    lum = Image.new("RGB", (W, W)); dl = ImageDraw.Draw(lum); rnd = random.Random(seed)
    for _ in range(26):
        x, y, r = rnd.randint(0, W), rnd.randint(0, W), rnd.randint(14, 46)
        k = rnd.uniform(.35, .9); dl.ellipse([x-r, y-r, x+r, y+r], fill=(int(255*k), int(190*k), int(90*k)))
    return ImageChops.screen(im, lum.filter(ImageFilter.GaussianBlur(9)))

def disque(bg):
    v = Image.open(os.path.join(A, "vierge.jpg")).convert("RGB").resize((1024, 1024))
    inv = ImageOps.invert(v)
    inv = ImageOps.autocontrast(inv, cutoff=1).point(lambda p: max(0, p - 18) * 1.15)
    mask = Image.new("L", (1024, 1024), 0); ImageDraw.Draw(mask).ellipse([CX-R-12, CY-R-12, CX+R+12, CY+R+12], fill=255)
    out = Image.composite(ImageChops.screen(bg, inv), bg, mask.filter(ImageFilter.GaussianBlur(3)))
    # léger voile du verre
    voile = Image.new("L", (1024, 1024), 0); ImageDraw.Draw(voile).ellipse([CX-R, CY-R, CX+R, CY+R], fill=26)
    out = Image.composite(Image.new("RGB", (1024, 1024), (235, 240, 245)), out, voile)
    # ruban bleu d'origine
    px = v.load(); m = Image.new("L", (1024, 1024), 0); pm = m.load()
    for y in range(0, CY - R + 60):
        for x in range(CX - 80, CX + 80):
            r, g, b = px[x, y]
            if b > r + 35 and b > g + 20: pm[x, y] = 255
    return Image.composite(v, out, m.filter(ImageFilter.GaussianBlur(1)))

def grave(img, calque):
    a = calque.split()[-1]
    givre = Image.new("RGB", img.size, (246, 248, 250))
    glow = a.filter(ImageFilter.GaussianBlur(2.2)).point(lambda p: int(p * .55))
    img = Image.composite(givre, img, glow)
    return Image.composite(givre, img, a.point(lambda p: int(p * .92)))

def texte(cal, txt, font, size, y):
    f = ImageFont.truetype(os.path.join(F, font), size)
    if "wght" in font: f.set_variation_by_axes([500])
    d = ImageDraw.Draw(cal); w = d.textlength(txt, font=f)
    while w > 2 * R * .78: size -= 4; f = ImageFont.truetype(os.path.join(F, font), size); w = d.textlength(txt, font=f)
    d.text((CX - w / 2, y), txt, font=f, fill=(255, 255, 255, 255))

def exemple(nom, num, h_dessin, lignes, seed, c1, c2):
    img = disque(fond(seed, c1, c2))
    cal = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    y = CY - R + 70
    if num:
        d = Image.open(os.path.join(ROOT, f"public/produits/noel/noel-{num:02d}-blanc.png")).convert("LA")
        h = h_dessin; w = round(d.width * h / d.height)
        if w > 2 * R * .7: w = int(2 * R * .7); h = round(d.height * w / d.width)
        d = d.resize((w, h), Image.LANCZOS)
        rgba = Image.merge("RGBA", (*[d.split()[0]] * 3, d.split()[1]))
        cal.alpha_composite(rgba, (CX - w // 2, y)); y += h + 18
    for txt, font, size in lignes:
        texte(cal, txt, font, size, y); y += int(size * 1.15)
    img = grave(img, cal)
    img.save(os.path.join(OUT, nom), "JPEG", quality=88, optimize=True, progressive=True); print(nom)

PF, GV, CZ = "PlayfairDisplay%5Bwght%5D.ttf", "GreatVibes-Regular.ttf", "Cinzel%5Bwght%5D.ttf"
exemple("exemple-1.jpg", 3, 300, [("Camille", GV, 86), ("Noël 2026", PF, 40)], 3, (16, 38, 30), (6, 16, 12))
exemple("exemple-2.jpg", 20, 330, [("Famille Martin", PF, 44)], 7, (40, 14, 18), (14, 5, 7))
exemple("exemple-3.jpg", 11, 270, [("Notre premier Noël", GV, 70), ("Léa & Paul · 2026", CZ, 32)], 11, (14, 22, 44), (5, 8, 18))
