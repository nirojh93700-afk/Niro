#!/usr/bin/env python3
"""Photo des mesures d'un bijou : efface les textes anglais du fournisseur et les réécrit en français.

15/11/2026 (gérant, photo de l'Ensemble Homme Plaque Noire : « est-ce que tu peux le mettre en français, pour pas qu'on
voit l'anglais »). Les textes blancs sont repérés dans des zones données à la main, effacés par OpenCV (inpaint), puis
réécrits en Anton (police libre OFL, condensée comme l'original).

Usage : python3 tools/maquettes/mesures-en-francais.py <image> <police Anton.ttf> <sortie.jpg>
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src, police, sortie = sys.argv[1:4]
im = np.array(Image.open(src).convert("RGB"))
gris = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY)

# Zones des textes anglais (x0, y0, x1, y1) sur l'image 800 × 800 du fournisseur.
ZONES = [(215, 120, 450, 220),    # necklace length / 60cm/23.62in
         (120, 475, 360, 580),    # bracelet length / 21cm/8.27in
         (628, 185, 745, 370)]    # 1.9cm/0.75in (en biais, le long de la bague) + son trait
masque = np.zeros(gris.shape, np.uint8)
for x0, y0, x1, y1 in ZONES:
    zone = gris[y0:y1, x0:x1]
    masque[y0:y1, x0:x1] = (zone > 150).astype(np.uint8) * 255
masque = cv2.dilate(masque, np.ones((5, 5), np.uint8), iterations=2)
propre = cv2.inpaint(im, masque, 9, cv2.INPAINT_TELEA)

img = Image.fromarray(propre)
d = ImageDraw.Draw(img)
f_titre = ImageFont.truetype(police, 30)
f_val = ImageFont.truetype(police, 38)
BLANC = (255, 255, 255)
d.text((228, 128), "Longueur du collier", font=f_titre, fill=BLANC)
d.text((228, 172), "60 cm", font=f_val, fill=BLANC)
d.text((132, 484), "Longueur du bracelet", font=f_titre, fill=BLANC)
d.text((132, 528), "21 cm", font=f_val, fill=BLANC)

# Largeur de la bague : trait de mesure + « 1,9 cm », en biais comme l'original.
calque = Image.new("RGBA", (190, 70), (0, 0, 0, 0))
c = ImageDraw.Draw(calque)
c.line((6, 8, 184, 8), fill=BLANC + (255,), width=3)
c.text((42, 18), "1,9 cm", font=ImageFont.truetype(police, 34), fill=BLANC + (255,))
calque = calque.rotate(73, expand=True, resample=Image.BICUBIC)
img = img.convert("RGBA")
img.alpha_composite(calque, (650, 182))
img.convert("RGB").save(sortie, quality=92)
print("ok", sortie)
