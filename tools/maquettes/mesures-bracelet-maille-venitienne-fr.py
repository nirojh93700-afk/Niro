#!/usr/bin/env python3
"""Photo des mesures du bracelet homme maille vénitienne (Nihao NH10721732) : textes anglais remplacés par du français.

15/11/2026 (gérant : « change l'anglais en français »). Fond blanc : chaque texte anglais est recouvert de blanc puis réécrit
en Lato (police libre OFL). « IP gold plated » n'est PAS traduit en « plaqué or » (règle du site) : « finition dorée ».

Usage : python3 tools/maquettes/mesures-bracelet-maille-venitienne-fr.py <image> <Lato-Regular.ttf> <sortie.jpg>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

src, police, sortie = sys.argv[1:4]
img = Image.open(src).convert("RGB")
d = ImageDraw.Draw(img)
NOIR = (0, 0, 0)
# 2 mm (on retire la ligne en pouces)
d.rectangle((1225, 870, 1440, 1000), fill="white")
d.text((1327, 905), "2 mm", font=ImageFont.truetype(police, 54), fill=NOIR, anchor="mm")
f = ImageFont.truetype(police, 46)
d.rectangle((170, 1355, 1470, 1525), fill="white")
d.text((190, 1397), "Matière : acier inoxydable, finition dorée", font=f, fill=NOIR, anchor="lm")
d.text((190, 1487), "Longueur : 19 à 22 cm", font=f, fill=NOIR, anchor="lm")
d.text((1425, 1487), "Poids : 5 g", font=f, fill=NOIR, anchor="rm")
img.save(sortie, quality=92)
print("ok", sortie)
