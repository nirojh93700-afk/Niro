import sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
DPI = 600
mm = lambda v: round(v / 25.4 * DPI)
GV = "fonts/GreatVibes.ttf"
MOTIF = sys.argv[1]
OUT = sys.argv[2]

def texte(t, largeur_mm):
    # rend le texte en noir sur transparent, ajusté à la largeur d'encre voulue
    taille = 200
    f = ImageFont.truetype(GV, taille)
    x0, y0, x1, y1 = f.getbbox(t)
    taille = int(taille * mm(largeur_mm) / (x1 - x0))
    f = ImageFont.truetype(GV, taille)
    x0, y0, x1, y1 = f.getbbox(t)
    im = Image.new("L", (x1 - x0 + 4, y1 - y0 + 4), 0)
    ImageDraw.Draw(im).text((2 - x0, 2 - y0), t, font=f, fill=255)
    return im

def motif(largeur_mm):
    a = Image.open(MOTIF).getchannel("A")
    a = a.crop(a.getbbox())
    w = mm(largeur_mm)
    return a.resize((w, round(a.height * w / a.width)), Image.LANCZOS)

# mêmes proportions que l'aperçu envoyé (verre Ø 79 mm)
blocs = [(texte("Joyeux Noël", 46), -0.5),
         (motif(30), -1.5),
         (texte("Je t'aime", 25), 1.0),
         (texte("Ta fille", 18), 0)]
W = max(b.width for b, _ in blocs) + mm(2)
H = sum(b.height for b, _ in blocs) + sum(mm(g) for _, g in blocs) + mm(2)
alpha = Image.new("L", (W, H), 0)
y = mm(1)
for b, g in blocs:
    alpha.paste(b, ((W - b.width) // 2, y), b)
    y += b.height + mm(g)
alpha = alpha.crop(alpha.getbbox())
noir = Image.new("RGBA", alpha.size, (0, 0, 0, 0)); noir.putalpha(alpha)
noir.save(OUT + "-transparent.png", dpi=(DPI, DPI))
blanc = Image.new("RGB", alpha.size, "white"); blanc.paste((0, 0, 0), (0, 0), alpha)
blanc.save(OUT + "-fond-blanc.png", dpi=(DPI, DPI))
print("taille réelle : %.1f × %.1f mm" % (alpha.width / DPI * 25.4, alpha.height / DPI * 25.4), alpha.size)
