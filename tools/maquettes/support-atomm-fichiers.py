#!/usr/bin/env python3
"""Fichiers de découpe du support de téléphone, à la taille réelle (12/11/2026).

Les contours, fentes, pieds et motifs ajourés viennent de la couche découpe des fichiers du générateur Atomm
(triés par support-atomm-donnees.py). Deux pièces sur une planche : dossier à gauche, pied à droite, trait rouge.

  python3 tools/maquettes/support-atomm-fichiers.py <support-atomm.json> <dossier> [ajoures.zip]

→ <dossier>/support-telephone-<taille>-<forme>-3mm.svg (12 fichiers, passage du câble, 13°)
→ ajoures.zip : un fichier par taille × forme × motif × densité (13°, câble, motif aussi sur le pied)
"""
import io, json, os, sys, zipfile

d = json.load(open(sys.argv[1], encoding="utf-8"))
dossier = sys.argv[2]
os.makedirs(dossier, exist_ok=True)
TAILLES, FORMES = ["petit", "standard", "grand"], ["rectangle", "arche", "chat", "ours"]
MOTIFS, DENS = ["coeurs", "pattes", "soleil", "nid", "losanges", "persienne", "fenetre", "etoiles"], ["moins", "moyen", "plus"]
ROUGE = 'fill="none" stroke="#FF0000" stroke-width="0.1"'


def svg(ta, fo, trous="", trous_pied="", angle=13, cable=1):
    t, b = d["tailles"][ta], d["base"][f"{ta}|{fo}|{cable}|{angle}"]
    lw, lh = t["lw"], max(t["lh"], b["lh"])
    fentes = "".join(f"M{f[0]} {f[1]}H{f[2]}V{f[3]}H{f[0]}Z" for f in b["fentes"])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{lw}mm" height="{lh}mm" viewBox="0 0 {lw} {lh}">'
            f'<g id="decoupe"><g transform="translate(5 5)"><path {ROUGE} d="{b["dos"]}{fentes}{trous}"/></g>'
            f'<g transform="translate({t["piedX"]} 5)"><path {ROUGE} d="{b["pied"]}{trous_pied}"/></g></g></svg>')


for ta in TAILLES:
    for fo in FORMES:
        open(os.path.join(dossier, f"support-telephone-{ta}-{fo}-3mm.svg"), "w").write(svg(ta, fo))
n = 12
if len(sys.argv) > 3:
    with zipfile.ZipFile(sys.argv[3], "w", zipfile.ZIP_DEFLATED) as z:
        for ta in TAILLES:
            for fo in FORMES:
                for mo in MOTIFS:
                    for de in DENS:
                        tr = d["trous"].get(f"{ta}|{fo}|{mo}|{de}", "")
                        tp = d["trousPied"].get(f"{ta}|{mo}|{de}|13", "")
                        z.writestr(f"{ta}/{fo}/support-telephone-{ta}-{fo}-ajoure-{mo}-{de}-3mm.svg", svg(ta, fo, tr, tp))
                        n += 1
print(f"{n} fichiers")
