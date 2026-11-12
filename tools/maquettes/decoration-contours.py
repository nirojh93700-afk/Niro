#!/usr/bin/env python3
"""Contours des décorations à suspendre (12/11/2026) — formes du générateur « Ornament » d'Atomm.

Sur décision du gérant (« tout comme sur le site »), les 46 formes de découpe viennent de la liste du générateur
(api.xtool.com …/aimake_cms_generator_layouts/items, image « maskImg » : forme blanche sur fond noir, trou du ruban
compris). Chaque image est passée en tracé au pixel près (OpenCV), puis mise à l'échelle : plus grand côté = 100 mm.

  python3 tools/maquettes/decoration-contours.py <layouts.json> <dossier des images> <sortie.json> [dossier des cadres mainImg]

Sortie : [{id, nom, W, H, d}] — d = chemin en mm (M/L/Z, sous-chemins = contour + trous), coin haut gauche = 0,0.
"""
import json, os, subprocess, sys, tempfile
from PIL import Image

NOMS = {"xmas_gift_box": "Boîte cadeau", "xmas_tree": "Sapin", "Reindeer": "Renne", "xmas_bell": "Cloche", "xmas_angel": "Ange",
        "xmas_bauble": "Boule", "xmas_finial": "Boule pointue", "xmas_gingerbread_house": "Maison en pain d'épices",
        "xmas_gingerbread_man": "Bonhomme en pain d'épices", "xmas_holly_leaf": "Feuille de houx", "xmas_mitten": "Moufle",
        "xmas_santa_hat": "Bonnet", "xmas_snowflake": "Flocon", "xmas_snowman": "Bonhomme de neige", "xmas_star": "Étoile",
        "xmas_stocking": "Chaussette", "xmas_wreath": "Couronne", "Round": "Rond", "Heart": "Cœur", "Paw": "Patte",
        "Bell": "Cloche simple", "Cat": "Chat", "Star": "Étoile simple", "HexagonStar": "Étoile à 6 branches", "Hexagon": "Hexagone"}
GROUPES = {"noel": range(1, 18), "paques": range(18, 31), "panier": range(31, 35), "croix": range(35, 39), "simple": range(39, 47)}


def nom(i, n):
    if n in NOMS: return NOMS[n]
    if 18 <= i <= 30: return ["Œuf", "Œuf", "Lapin", "Lapin", "Œuf", "Œuf", "Lapin", "Lapin", "Tête de lapin", "Tête de lapin",
                               "Tête de lapin", "Tête de lapin", "Œuf"][i - 18] + f" {i - 17}"
    if 31 <= i <= 34: return f"Panier {i - 30}"
    if 35 <= i <= 38: return f"Croix {i - 34}"
    return n


def fmt(v): return ("%.1f" % v).rstrip("0").rstrip(".")


def binaire(png):
    """forme pleine = blanc sur noir (maskImg) ; cadre = noir sur transparent (mainImg) → on lit la transparence"""
    import numpy as np
    im = Image.open(png).convert("RGBA"); al = np.array(im)[:, :, 3]
    if al.min() < 128:
        return (al > 127).astype("uint8") * 255
    bg = Image.new("RGBA", im.size, (0, 0, 0, 255)); bg.alpha_composite(im)
    return (np.array(bg.convert("L")) > 127).astype("uint8") * 255


def trace(png, boite=None):
    """contours au pixel près (OpenCV, image 2000 px → 1 px = 0,05 mm), contour extérieur + trous ;
    boite = (x0, y0, x1, y1) de la forme pleine, pour que le cadre tombe exactement dessus"""
    import cv2, numpy as np
    a = binaire(png)
    ys, xs = np.nonzero(a)
    x0, y0, x1, y1 = boite or (xs.min(), ys.min(), xs.max(), ys.max())
    a = a[y0:y1 + 1, x0:x1 + 1]
    a = cv2.GaussianBlur(a, (5, 5), 0); a = (a > 127).astype("uint8") * 255   # adoucit l'escalier des pixels
    cs, _ = cv2.findContours(a, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    rings = [[(float(p[0][0]) + .5, float(p[0][1]) + .5) for p in cv2.approxPolyDP(c, 0.7, True)] for c in cs if len(c) > 8]   # 0,7 px ≈ 0,035 mm
    h, w = a.shape
    return rings, w, h, (x0, y0, x1, y1)


lay = json.load(open(sys.argv[1]))["data"]
out = []
for i, x in enumerate(lay, 1):
    png = os.path.join(sys.argv[2], f"{i:02d}-{x['name']}.png")
    rings, w, h, boite = trace(png)
    k = 100.0 / max(w, h)                    # plus grand côté = 100 mm
    def chemin(rs):
        d = ""
        for r in rs:
            pts = [(px * k, py * k) for px, py in r]
            if len(pts) < 3: continue
            d += "M" + "L".join(fmt(a) + " " + fmt(b) for a, b in pts) + "Z"
        return d
    d = chemin(rings)
    cadre = ""
    if len(sys.argv) > 4:   # le cadre « Classique » (mainImg), calé sur la même boîte que la forme pleine
        cadre = chemin(trace(os.path.join(sys.argv[4], f"{i:02d}-{x['name']}.png"), boite)[0])
    groupe = next(g for g, rg in GROUPES.items() if i in rg)
    out.append({"id": x["name"], "n": i, "nom": nom(i, x["name"]), "groupe": groupe, "W": round(w * k, 1), "H": round(h * k, 1), "d": d, "cadre": cadre})
s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
open(sys.argv[3], "w").write(s)
print(f"{len(out)} contours · {len(s) // 1024} Ko")
