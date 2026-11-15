#!/usr/bin/env python3
"""Photos portées du Collier Papillon : le papillon DESSINÉ (corps trop long, de face) est remplacé par le VRAI papillon,
découpé dans la photo du produit de la même couleur (15/11/2026, gérant : « pour le trois, tu corriges »).
Pour chaque photo : le pendentif dessiné est effacé (inpaint sur la peau), le vrai est collé avec une ombre douce,
son anneau sous la chaîne. Les réglages (zones, taille, place de l'anneau) ont été posés à l'œil, photo par photo.
Usage : python3 -I tools/maquettes/papillon-portees.py <dossier assets collier-papillon> <dossier de sortie>
"""
import sys, os
import cv2, numpy as np
from PIL import Image, ImageFilter

A, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

def decoupe(nom, rect, anneau):
    im = cv2.imread(os.path.join(A, nom + ".jpg")); h, w = im.shape[:2]
    mask = np.zeros((h, w), np.uint8); bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    cv2.grabCut(im, mask, rect, bg, fg, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    # le satin blanc resté collé aux ailes : clair et sans couleur, hors de la bande du corps (les zircons sont au milieu)
    cx = anneau[0]; satin = (hsv[..., 1] < 70) & (hsv[..., 2] > 150)
    xs = np.arange(w)[None, :].repeat(h, 0)
    ys = np.arange(h)[:, None].repeat(w, 1)
    m[satin & ((np.abs(xs - cx) > 0.16 * rect[2]) | (ys > anneau[1] + 0.75 * rect[3]))] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); i = 1 + np.argmax(st[1:, 4]); m = np.where(lab == i, 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)); m = cv2.GaussianBlur(m, (3, 3), 0)
    x, y, ww, hh = cv2.boundingRect((m > 128).astype(np.uint8))
    rgb = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    cut = Image.fromarray(np.dstack([rgb, m])[y:y + hh, x:x + ww], "RGBA")
    return cut, (anneau[0] - x, anneau[1] - y)

def effacer(im, zone):
    x0, y0, x1, y1 = zone
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(int)
    peau = np.median(np.concatenate([lab[y0:y1, x0 - 25:x0 - 5].reshape(-1, 3), lab[y0:y1, x1 + 5:x1 + 25].reshape(-1, 3)]), axis=0)
    d = np.linalg.norm(lab[y0:y1, x0:x1] - peau, axis=2)
    pm = cv2.dilate((d > 12).astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
    mask = np.zeros(im.shape[:2], np.uint8); mask[y0:y1, x0:x1] = pm
    return cv2.inpaint(im, mask, 11, cv2.INPAINT_TELEA)

# nom : (photo produit, rectangle de découpe, anneau dans la photo produit, zone du pendentif dessiné, anneau cible, largeur)
REGLAGES = {
  "rouge": ("rouge", (325, 408, 232, 175), (415, 424), (440, 650, 580, 745), (508, 640), 150),
}

for nom, (prod, rect, an, zone, cible, larg) in REGLAGES.items():
    cut, (ax, ay) = decoupe(prod, rect, an)
    base = effacer(cv2.imread(os.path.join(A, "porte-" + nom + ".jpg")), zone)
    base = Image.fromarray(cv2.cvtColor(base, cv2.COLOR_BGR2RGB)).convert("RGBA")
    k = larg / cut.width; cut = cut.resize((larg, round(cut.height * k)), Image.LANCZOS)
    px, py = round(cible[0] - ax * k), round(cible[1] - ay * k)
    sh = Image.new("RGBA", cut.size, (50, 25, 15, 0)); sh.putalpha(cut.split()[3].point(lambda v: int(v * 0.35))); sh = sh.filter(ImageFilter.GaussianBlur(6))
    base.alpha_composite(sh, (px + 4, py + 9)); base.alpha_composite(cut, (px, py))
    base.convert("RGB").save(os.path.join(OUT, "porte-" + nom + ".jpg"), quality=92)
    base.convert("RGB").crop((cible[0] - 160, cible[1] - 90, cible[0] + 160, cible[1] + 170)).resize((640, 520)).save(os.path.join(OUT, "zoom-" + nom + ".jpg"))
    print(nom, "ok")
