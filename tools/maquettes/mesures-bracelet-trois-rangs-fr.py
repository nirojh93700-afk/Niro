#!/usr/bin/env python3
"""Photo des mesures du bracelet homme trois rangs (Nihao NH10938159) : textes anglais remplacés par du français.

15/11/2026 (gérant : « là aussi tu remplaces l'anglais par français »). Fond blanc : chaque texte anglais est recouvert de
blanc, puis réécrit en Lato (police libre OFL, proche de l'original). Les flèches et « 21 cm » ne bougent pas.

Usage : python3 tools/maquettes/mesures-bracelet-trois-rangs-fr.py <image> <Lato-Regular.ttf> <sortie.jpg>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

src, police, sortie = sys.argv[1:4]
img = Image.open(src).convert("RGB")
d = ImageDraw.Draw(img)
NOIR = (0, 0, 0)
# (zone à effacer, texte français, position, ancrage)
TEXTES = [
    ((402, 208, 668, 268), "Fermoir en métal", (535, 240), "mm"),
    ((44, 912, 214, 964), "Simili cuir", (48, 937), "lm"),
    ((458, 1032, 944, 1092), "Finitions en acier inoxydable", (700, 1062), "mm"),
    ((815, 1118, 1200, 1200), "Poids : 32 g", (1096, 1160), "rm"),
]
f = ImageFont.truetype(police, 44)
for zone, texte, pos, ancre in TEXTES:
    d.rectangle(zone, fill=(255, 255, 255))
    d.text(pos, texte, font=f, fill=NOIR, anchor=ancre)
img.save(sortie, quality=92)
print("ok", sortie)
