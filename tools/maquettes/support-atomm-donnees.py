#!/usr/bin/env python3
"""Trie les fichiers de découpe téléchargés sur le générateur de support de téléphone d'Atomm (xTool) — 12/11/2026.

Sur décision du gérant (« tu prends sur le site »), les découpes viennent du bouton « Download SVG » de
phone-stand-generator.generator.atommapps.com (téléchargement fait par tools/maquettes/support-atomm-telecharge.cjs).
Seule la couche de DÉCOUPE est gardée (contour, fentes, pied, trous ajourés) ; leurs dessins gravés sont jetés.

  python3 tools/maquettes/support-atomm-donnees.py <donnees.json brut> <sortie.json>

Sortie : { tailles: {petit: {W, H, lw, lh, piedX}}, base: {"taille|forme|câble|angle": {dos, fentes, pied}},
           trous: {"taille|forme|motif|densité": d}, trousPied: {"taille|motif|densité|angle": d} }
Chemins en mm, repère de la pièce (coin haut gauche = 0,0), arrondis au 1/10 de mm, points alignés retirés.
"""
import json, re, sys


def sous_chemins(d):
    return [s for s in re.split(r"(?=M)", d) if s.strip()]


def pts(s):
    return [(float(a), float(b)) for a, b in re.findall(r"(-?[\d.]+)[ ,](-?[\d.]+)", s)]


def simplifie(p, tol=0.04):
    """retire les points presque alignés (distance au segment < tol)"""
    if len(p) < 4: return p
    o = [p[0]]
    for i in range(1, len(p) - 1):
        a, b, c = o[-1], p[i], p[i + 1]
        dx, dy = c[0] - a[0], c[1] - a[1]
        L = (dx * dx + dy * dy) ** 0.5 or 1e-9
        if abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / L > tol: o.append(b)
    o.append(p[-1])
    return o


def ecrit(p):
    p = simplifie(p)
    f = lambda v: ("%.1f" % v).rstrip("0").rstrip(".")
    return "M" + "L".join(f(x) + " " + f(y) for x, y in p) + "Z"


def bbox(p):
    xs, ys = [q[0] for q in p], [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)


def cle(p):  # pour reconnaître un même sous-chemin dans deux fichiers
    x0, y0, x1, y1 = bbox(p)
    return (round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1), len(p))


brut = json.load(open(sys.argv[1]))
out = {"tailles": {}, "base": {}, "trous": {}, "trousPied": {}}
for k, v in brut.items():
    if not k.startswith("A|"): continue
    _, ta, fo, c, a = k.split("|")
    dos = [pts(s) for s in sous_chemins(v["dos"]["d"])]
    dos.sort(key=lambda p: -(bbox(p)[2] - bbox(p)[0]) * (bbox(p)[3] - bbox(p)[1]))
    contour, fentes = dos[0], sorted(dos[1:], key=lambda p: bbox(p)[0])
    pied = [pts(s) for s in sous_chemins(v["pied"]["d"])]
    x0, y0, x1, y1 = bbox(contour)
    out["tailles"].setdefault(ta, {"W": round(x1 - x0, 1), "H": round(y1 - y0, 1), "lw": v["lw"], "lh": v["lh"], "piedX": v["pied"]["x"]})
    out["base"][f"{ta}|{fo}|{c}|{a}"] = {
        "dos": ecrit(contour), "fentes": [[round(v_, 2) for v_ in bbox(p)] for p in fentes],
        "pied": "".join(ecrit(p) for p in pied), "piedH": round(bbox(pied[0])[3], 1), "lh": v["lh"]}
for k, v in brut.items():
    if not k.startswith("B|"): continue
    _, ta, fo, mo, de, a = k.split("|")
    ref = brut.get(f"A|{ta}|{fo}|1|{a}")
    if not ref: continue
    connus = {cle(pts(s)) for s in sous_chemins(ref["dos"]["d"])}
    trous = [pts(s) for s in sous_chemins(v["dos"]["d"]) if cle(pts(s)) not in connus]
    if a == "13": out["trous"][f"{ta}|{fo}|{mo}|{de}"] = "".join(ecrit(p) for p in trous)
    if fo == "rectangle":
        connusP = {cle(pts(s)) for s in sous_chemins(ref["pied"]["d"])}
        tp = [pts(s) for s in sous_chemins(v["pied"]["d"]) if cle(pts(s)) not in connusP]
        out["trousPied"][f"{ta}|{mo}|{de}|{a}"] = "".join(ecrit(p) for p in tp)
s = json.dumps(out, separators=(",", ":"), ensure_ascii=False)
open(sys.argv[2], "w").write(s)
print(f"{sys.argv[2]} : {len(s) // 1024} Ko · base {len(out['base'])} · trous {len(out['trous'])} · trousPied {len(out['trousPied'])}")
print(json.dumps(out["tailles"], ensure_ascii=False))
