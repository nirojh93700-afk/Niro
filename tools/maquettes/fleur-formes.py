#!/usr/bin/env python3
"""Les fleurs et les feuilles du générateur « Flower » d'Atomm, passées en tracés (13/11/2026).

  python3 -I tools/maquettes/fleur-formes.py <dossier du relevé> <sortie formes.json> [planche de contrôle .png]

<dossier du relevé> = la sortie de fleur-atomm-releve.py. Chaque image (trait plein sur fond transparent) est suivie au contour
(OpenCV), allégée à 0,9 point d'image, et rangée à la taille de travail d'Atomm : 1 unité = 1/72 de pouce (0,3528 mm),
centre de l'image en 0,0. Les anneaux sont écrits en dixièmes d'unité ; le premier sens de rotation = plein, l'autre = trou.
"""
import json, os, re, sys
import cv2, numpy as np

src, out = sys.argv[1], sys.argv[2]
planche = sys.argv[3] if len(sys.argv) > 3 else None

FR = {  # nom d'Atomm → [nom français, mois de naissance (0 = aucun)]
    "Carnation-January": ["Œillet", 1], "Violet-February": ["Violette", 2], "Daffodil-March": ["Jonquille", 3], "Daisy-April": ["Marguerite", 4],
    "Lily of the Valley-May": ["Muguet en branche", 5], "Lily of the Valley-May 2": ["Muguet", 5], "Rose-June 1": ["Rose ouverte", 6],
    "Rose-June 2": ["Rose", 6], "Rose-June 3": ["Rose en bouton", 6], "Delphinium-July": ["Delphinium", 7], "Poppy-August": ["Coquelicot", 8],
    "Morning Glory-September 1": ["Volubilis", 9], "Morning Glory-September 2": ["Volubilis ouvert", 9], "Marigold-October": ["Souci", 10],
    "Peony-November 2": ["Pivoine ouverte", 11], "Peony-November 1": ["Pivoine", 11], "Holly-December": ["Houx", 12], "Dahlia": ["Dahlia", 0],
    "Calla Lily": ["Arum", 0], "Lily Flower": ["Lys", 0], "Multi-stemmed rose": ["Bouquet de roses", 0], "Lotus": ["Lotus", 0],
    "Frangipani": ["Frangipanier", 0], "Cherry Blossom": ["Fleur de cerisier", 0], "Iris": ["Iris", 0], "Monstera deliciosa": ["Monstera", 0]}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def anneaux(fichier, largeur):
    """Contours de l'image, centrés, à l'échelle « largeur » (en unités), en dixièmes d'unité."""
    im = cv2.imread(fichier, cv2.IMREAD_UNCHANGED)
    if im is None or im.shape[2] < 4:
        return [], 1.0, 0
    h, w = im.shape[:2]
    a = cv2.GaussianBlur(im[:, :, 3], (0, 0), 0.8)
    m = (a > 128).astype(np.uint8)
    cs, hi = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    k = largeur / w
    # épaisseur des traits : 10e centile de la largeur mesurée sur les crêtes, en unités
    d = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    cr = d[(d >= cv2.dilate(d, np.ones((3, 3), np.uint8)) - 1e-6) & (d > 0.5)] * 2
    anneaux.trait = float(np.percentile(cr, 10)) * k if cr.size else 0
    res, pts = [], 0
    for c, hh in zip(cs, hi[0] if hi is not None else []):
        if abs(cv2.contourArea(c)) < 30:
            continue
        c = cv2.approxPolyDP(c, 0.9, True).reshape(-1, 2).astype(float)
        if len(c) < 3:
            continue
        aire = 0.5 * float(np.sum(c[:, 0] * np.roll(c[:, 1], -1) - np.roll(c[:, 0], -1) * c[:, 1]))
        plein = hh[3] == -1
        if (aire > 0) != plein:  # plein = aire positive, trou = aire négative
            c = c[::-1]
        r = []
        for x, y in c:
            r += [int(round((x - w / 2) * k * 10)), int(round((y - h / 2) * k * 10))]
        res.append((0 if plein else 1, r))
        pts += len(c)
    res = [r for _, r in sorted(res, key=lambda q: q[0])]  # les pleins d'abord : le premier anneau est toujours un plein
    return res, w / h, pts


fleurs = json.load(open(os.path.join(src, "fleurs.json"), encoding="utf-8"))["data"]
feuilles = json.load(open(os.path.join(src, "feuilles.json"), encoding="utf-8"))["data"]
F, L, total = [], [], 0
for x in sorted(fleurs, key=lambda x: x["sno"]):
    r = x["extra"]["rect"]
    an, asp, n = anneaux(os.path.join(src, "brut", "f-%02d-%s.png" % (x["sno"], slug(x["name"]))), r["width"])
    assert an, x["name"]
    pc = r.get("pc")
    nom, mois = FR[x["name"]]
    # centre de départ : celui d'Atomm (pc), sinon sa règle par défaut (400 − largeur / 2 + 8 ; 200)
    F.append({"id": "f%02d" % x["sno"], "nom": nom, "mois": mois, "atomm": x["name"], "w": r["width"], "h": round(r["width"] / asp, 1),
              "x": pc["x"] if pc else 400 - r["width"] / 2 + 8, "y": pc["y"] if pc else 200, "trait": round(anneaux.trait, 2), "a": an})
    total += n
    print("%-26s %4d points, %3d anneaux, %d × %.0f, trait %.2f mm" % (nom, n, len(an), r["width"], r["width"] / asp, anneaux.trait * 25.4 / 72))


def un(v):
    return v[0] if isinstance(v, list) else v


for x in sorted(feuilles, key=lambda x: x["sno"]):
    r = x["extra"]["rect"]
    haut, ah, n1 = anneaux(os.path.join(src, "brut", "l-%s-haut.png" % x["sno"]), 1000)
    bas, ab, n2 = anneaux(os.path.join(src, "brut", "l-%s-bas.png" % x["sno"]), 1000)
    vide = x["sno"] == 999 or not haut
    L.append({"id": "l%s" % x["sno"], "vide": vide, "haut": [] if vide else haut, "bas": [] if vide else bas, "ah": round(ah, 4), "ab": round(ab, 4),
              "th": un(r["up"]["size"]), "xh": un(r["up"]["x"]), "tb": un(r["down"]["size"]), "xb": un(r["down"]["x"])})
    total += n1 + n2
    print("feuilles %-4s %4d + %4d points%s" % (x["sno"], n1, n2, " (sans feuille)" if vide else ""))

json.dump({"fleurs": F, "feuilles": L}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(F), "fleurs,", len(L), "feuilles,", total, "points,", round(os.path.getsize(out) / 1024), "Ko")

if planche:
    C, cols = 260, 7
    img = np.full((C * ((len(F) + cols - 1) // cols), C * cols, 3), 255, np.uint8)
    for i, f in enumerate(F):
        ox, oy = (i % cols) * C + C // 2, (i // cols) * C + C // 2
        k = (C - 30) / max(f["w"], f["h"]) / 10
        pl = [np.array(r, float).reshape(-1, 2) * k + [ox, oy] for r in f["a"]]
        cv2.fillPoly(img, [p.astype(np.int32) for p in pl], (60, 100, 150))
        cv2.putText(img, f["id"], (ox - C // 2 + 6, oy - C // 2 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    cv2.imwrite(planche, img)
