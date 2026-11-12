#!/usr/bin/env python3
"""Formes du générateur « Personalized Holiday Name Ornament » d'Atomm, prêtes pour la maquette (12/11/2026).

  python3 -I tools/maquettes/prenom-atomm-donnees.py <dossier brut> <dossier de sortie>

Le dossier brut vient de prenom-atomm-releve.cjs (LEUR outil ouvert dans le navigateur, jamais leur code lancé ici) :
un fichier par modèle (renne, bonnet, lapin, cornes) et par police d'initiale (lilita, titan, paytone, alfa), 26 lettres,
lettre de 80 mm, origine au milieu de la lettre, en millimètres. Pour chaque lettre on garde :
  f = le fond (lettre + bordure + décor + anneau), d = le devant (la lettre), k = les décors de couleur [rôle, tracé],
  b = la boîte du fond [x, y, largeur, hauteur].
Les tracés (polylignes M L Z) sont allégés à 0,04 mm près et écrits au centième de mm.
"""
import json, math, os, re, sys

brut, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
TOL = 0.04


def polys(d):
    res = []
    for sub in re.findall(r"M[^M]*", d):
        n = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?(?:e-?\d+)?", sub)]
        pts = list(zip(n[0::2], n[1::2]))
        if len(pts) >= 3:
            res.append(pts)
    return res


def dp(pts, tol):
    """Douglas-Peucker sur une ligne fermée : on coupe au point le plus loin du premier, puis on allège les deux moitiés."""
    if len(pts) < 8:
        return pts
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)

    def ligne(p):
        garde = [False] * len(p); garde[0] = garde[-1] = True; pile = [(0, len(p) - 1)]
        while pile:
            a, b = pile.pop()
            if b <= a + 1: continue
            ax, ay = p[a]; bx, by = p[b]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1e-9
            im, dm = -1, tol
            for i in range(a + 1, b):
                dist = abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L
                if dist > dm: im, dm = i, dist
            if im >= 0:
                garde[im] = True; pile.append((a, im)); pile.append((im, b))
        return [q for q, g in zip(p, garde) if g]

    a = ligne(pts[:far + 1]); b = ligne(pts[far:] + [pts[0]])
    return a[:-1] + b[:-1]


def nb(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def allege(d):
    out_ = []
    for p in polys(d):
        q = dp(p, TOL)
        out_.append("M" + "L".join(f"{nb(x)},{nb(y)}" for x, y in q) + "Z")
    return "".join(out_)


def boite(d):
    xs, ys = [], []
    for p in polys(d):
        xs += [x for x, _ in p]; ys += [y for _, y in p]
    return [round(min(xs), 2), round(min(ys), 2), round(max(xs) - min(xs), 2), round(max(ys) - min(ys), 2)]


total = 0
for f in sorted(os.listdir(brut)):
    if not f.endswith(".json"): continue
    R = json.load(open(os.path.join(brut, f), encoding="utf-8"))
    assert len(R) == 26, f
    S = {}
    for o in R:
        P = o["p"]; lettre = o["nom"][0]
        fond, devant = P[1]["d"], P[3]["d"]
        assert "wood" in P[1]["f"] and "white" in P[3]["f"] and "engraving" in P[4]["f"], (f, lettre)
        k = []
        for i, p in enumerate(P[5:], 5):
            if not p["d"] or "nose-dark" in p["f"]: continue
            role = ("nez" if i == 6 else "reflet" if "paint-white" in p["f"] else "rose" if "pink" in p["f"]
                    else "blanc" if "white" in p["f"] else "rouge")
            k.append([role, allege(p["d"])])
        S[lettre] = {"f": allege(fond), "d": allege(devant), "k": k, "b": boite(fond)}
    txt = json.dumps(S, separators=(",", ":"))
    open(os.path.join(out, f), "w", encoding="utf-8").write(txt)
    total += len(txt)
    print(f, round(len(txt) / 1024), "Ko", "décors", sorted({r for v in S.values() for r, _ in v["k"]}))
print("total", round(total / 1024), "Ko")
