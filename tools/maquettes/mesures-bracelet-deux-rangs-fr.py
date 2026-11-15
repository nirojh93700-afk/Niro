#!/usr/bin/env python3
"""Photo des mesures du bracelet homme deux rangs (Nihao NH11100873) : textes anglais remplacés par du français.

15/11/2026. Fond blanc : chaque texte anglais est recouvert de blanc puis réécrit en Lato (police libre OFL).

Usage : python3 tools/maquettes/mesures-bracelet-deux-rangs-fr.py <image> <Lato-Regular.ttf> <sortie.jpg>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

src, police, sortie = sys.argv[1:4]
img = Image.open(src).convert("RGB")
d = ImageDraw.Draw(img)
N = (0, 0, 0)
f = ImageFont.truetype(police, 50)
d.rectangle((1205, 915, 1470, 1035), fill="white"); d.text((1335, 965), "0,68 cm", font=f, fill=N, anchor="mm")
d.rectangle((560, 1060, 1000, 1135), fill="white"); d.text((780, 1095), "4,1 cm", font=f, fill=N, anchor="mm")
d.rectangle((880, 1320, 1540, 1560), fill="white")
d.text((1480, 1370), "Longueur : 21 cm", font=f, fill=N, anchor="rm")
d.text((1480, 1450), "Poids : 12 g", font=f, fill=N, anchor="rm")
img.save(sortie, quality=92)
print("ok", sortie)
