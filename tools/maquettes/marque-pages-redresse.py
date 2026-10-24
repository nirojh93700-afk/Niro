#!/usr/bin/env python3
"""Photos REDRESSÉES de chaque couleur des marque-pages (modèles 1 et 2) — 24/10/2026 soir.

Gérant : « le visuel doit correspondre à la couleur que le client choisit ». L'aperçu (mp_apercu.py) montrait toujours le bois
de la photo caramel ; il montre maintenant la couleur choisie. Chaque photo fournisseur (1100 × 1100, marque-page posé en
diagonale) est redressée par un QUAD (les 4 coins du marque-page, trou du cordon en haut) → 260 px de large, même hauteur que
les photos des zones du 23/10 (m1 : 1330, m2 : 1380) pour que les zones de gravure restent valables.
Les coins ont été lus sur une photo (grille) puis ajustés photo par photo sur le maximum de gradient des arêtes (le cadrage
diffère d'une photo à l'autre) ; ils sont figés dans QUADS ci-dessous. Dos : modèle 1 = la face (bois nu des deux côtés) ;
modèle 2 = la face retournée avec le bois nu reconstitué sous la fenêtre (même recette que zones/m2-dos-apercu.jpg).
Usage : python3 tools/maquettes/marque-pages-redresse.py  → docs/maquettes/assets/marque-pages/zones/faces/m{1,2}-<couleur>[-dos].jpg
"""
import os
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MP = os.path.join(ROOT, "docs", "maquettes", "assets", "marque-pages")
MF = os.path.join(ROOT, "docs", "maquettes", "assets", "marque-pages-fenetre")
OUT = os.path.join(MP, "zones", "faces")
# coins (haut-gauche, haut-droite, bas-droite, bas-gauche) dans la photo 1100 × 1100
QUADS = {
    "m1-nanmu": [(367, 145), (540, 80), (872, 949), (696, 1016)], "m1-buis": [(326, 152), (506, 83), (889, 941), (716, 1021)],
    "m1-santal": [(268, 165), (441, 85), (833, 922), (661, 1003)], "m1-palissandre": [(304, 178), (473, 95), (888, 927), (716, 1015)],
    "m1-ebene": [(292, 173), (462, 92), (865, 926), (697, 1008)], "m1-suanzhi": [(283, 165), (453, 80), (875, 915), (706, 1002)],
    "m2-blond": [(763, 25), (959, 119), (430, 1080), (237, 968)], "m2-roux": [(771, 9), (969, 119), (385, 1089), (179, 983)],
    "m2-sable": [(752, 44), (937, 161), (432, 1076), (235, 969)], "m2-noir": [(762, 20), (964, 120), (431, 1089), (229, 983)],
}
H = {"m1": 1330, "m2": 1380}


def dos_m2(face):
    """Dos du modèle 2 : face retournée, bois nu reconstitué sous la fenêtre (bande 4,5–12,5 % de la hauteur, au-dessus de la fenêtre, répétée dès 52 %)."""
    W, Hh = face.size
    d = ImageOps.mirror(face)
    src = np.asarray(d.crop((0, int(.045 * Hh), W, int(.125 * Hh)))).astype(float)
    th = src.shape[0]; ov = 40
    y0 = int(.52 * Hh); acc = np.asarray(d).astype(float).copy(); orig = acc.copy()
    y = y0; k = 0
    while y < Hh:
        tile = src if k % 2 == 0 else src[::-1]
        h = min(th, Hh - y); piece = tile[:h]
        if k == 0: acc[y:y + h] = piece
        else:
            n = min(ov, h); w = np.linspace(0, 1, n)[:, None, None]
            acc[y:y + n] = acc[y:y + n] * (1 - w) + piece[:n] * w; acc[y + n:y + h] = piece[n:h]
        if h <= ov: break
        y += h - ov; k += 1
    w = np.linspace(0, 1, 30)[:, None, None]; acc[y0:y0 + 30] = orig[y0:y0 + 30] * (1 - w) + acc[y0:y0 + 30] * w
    return Image.fromarray(acc.clip(0, 255).astype(np.uint8))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for key, (tl, tr, br, bl) in QUADS.items():
        m, c = key.split("-", 1)
        src = os.path.join(MP if m == "m1" else MF, c + ".jpg")
        face = Image.open(src).convert("RGB").transform((260, H[m]), Image.QUAD, (*tl, *bl, *br, *tr), Image.BICUBIC)
        face.save(os.path.join(OUT, key + ".jpg"), quality=86, optimize=True)
        if m == "m2":
            dos_m2(face).save(os.path.join(OUT, key + "-dos.jpg"), quality=86, optimize=True)
        print("ok", key)
