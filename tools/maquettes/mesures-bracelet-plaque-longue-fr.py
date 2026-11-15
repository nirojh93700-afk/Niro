#!/usr/bin/env python3
"""Photo des mesures du bracelet homme à plaque longue (Nihao NH11089638) : textes chinois et anglais remplacés par du français.

15/11/2026 (règle du gérant : « change l'anglais en français »). Fond blanc : chaque texte est recouvert de blanc puis réécrit
en Lato (police libre OFL). Les filets gris ne bougent pas. « Alloy titanium steel » → « Acier inoxydable » (jamais « titane »).

Usage : python3 tools/maquettes/mesures-bracelet-plaque-longue-fr.py <image> <Lato-Regular.ttf> <sortie.jpg>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

src, police, sortie = sys.argv[1:4]
img = Image.open(src).convert("RGB")
d = ImageDraw.Draw(img)
GRIS, NOIR = (70, 70, 70), (0, 0, 0)
# (zone à effacer, texte, position, ancrage, taille, couleur)
TEXTES = [
    ((735, 72, 935, 118), "Longueur totale", (805, 96), "mm", 34, GRIS),
    ((680, 136, 960, 186), "21 cm", (805, 161), "mm", 40, NOIR),
    ((770, 222, 990, 270), "Matière", (870, 247), "mm", 34, GRIS),
    ((724, 304, 998, 346), "Simili cuir", (870, 326), "mm", 40, NOIR),
    ((55, 618, 280, 666), "Finitions", (165, 643), "mm", 34, GRIS),
    ((18, 692, 318, 738), "Acier inoxydable", (165, 716), "mm", 40, NOIR),
    ((165, 782, 320, 832), "Poids", (235, 808), "mm", 34, GRIS),
    ((110, 856, 370, 904), "28 g", (235, 880), "mm", 40, NOIR),
]
for zone, texte, pos, ancre, taille, coul in TEXTES:
    d.rectangle(zone, fill=(255, 255, 255))
    d.text(pos, texte, font=ImageFont.truetype(police, taille), fill=coul, anchor=ancre)
img.save(sortie, quality=92)
print("ok", sortie)
