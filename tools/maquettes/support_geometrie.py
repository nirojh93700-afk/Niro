#!/usr/bin/env python3
"""Géométrie du support de téléphone en bois à deux pièces (12/11/2026) — dessinée par nous.

Principe (le même que tous les supports à emboîter) : un DOSSIER qui penche en arrière et un PIED
perpendiculaire au dossier. Les pattes du pied traversent trois fentes du dossier : les deux pattes
des côtés dépassent devant et forment le rebord où le téléphone se pose ; la patte du milieu affleure.
Le pied descend jusqu'au bureau derrière : sa longueur fixe l'inclinaison.

Tout est calculé ici (mm), à partir de l'épaisseur du bois, de l'inclinaison et de la hauteur du
rebord. Les quatre contours du haut du dossier sont des formes simples dessinées par nous.

  python3 tools/maquettes/support_geometrie.py <dossier de sortie> [épaisseur_mm]
  → un fichier SVG à découper par forme (dossier + pied, rouge = découpe), à la taille réelle.
"""
import json, math, os, sys

W, H = 80.0, 150.0            # dossier : largeur, hauteur totale (mm)
ANGLE = 13.0                  # inclinaison du dossier (degrés depuis la verticale)
REBORD_H = 20.0               # hauteur du dessus du rebord au-dessus du bureau (mm)
REBORD_P = 15.0               # profondeur du rebord devant le dossier (mm)
PATTES = [(8.0, 24.0), (32.0, 48.0), (56.0, 72.0)]   # côtés = rebord, milieu = affleurant
JEU = 0.1                     # jeu de chaque côté d'une fente, en largeur (mm)
ENCOCHE = (27.0, 53.0, 12.0)  # passage du câble en bas du dossier : x début, x fin, hauteur

FORMES = [  # id, nom, début de la zone gravable depuis le haut (mm)
    ("rectangle", "Rectangle arrondi", 7),
    ("arche", "Arche", 16),
    ("chat", "Tête de chat", 18),
    ("ours", "Oreilles d'ours", 18),
]


def calcul(t):
    a = math.radians(ANGLE)
    s_haut = REBORD_H / math.cos(a)            # le long du dossier, du bas au-dessus de la fente
    s_bas = s_haut - t                          # dessous de la fente
    d = s_bas * math.cos(a) / math.sin(a)       # du devant du dossier au bout du pied (le long du pied)
    return {"fente_haut": H - s_haut, "fente_bas": H - s_bas, "pied_corps": d - t}


def chemins(t=3.0, k=1.0, ox=0.0, oy=0.0):
    """Contours en coordonnées (mm × k) + décalage : dossier (4 formes), fentes, pied."""
    def p(x, y): return f"{ox + x * k:.2f},{oy + y * k:.2f}"
    def r(v): return f"{v * k:.2f}"
    c = calcul(t)
    x0, x1, eh = ENCOCHE
    bas = (f"L{p(W, H - 3)}A{r(3)},{r(3)} 0 0 1 {p(W - 3, H)}L{p(x1, H)}L{p(x1, H - eh + 3)}"
           f"A{r(3)},{r(3)} 0 0 0 {p(x1 - 3, H - eh)}L{p(x0 + 3, H - eh)}A{r(3)},{r(3)} 0 0 0 {p(x0, H - eh + 3)}"
           f"L{p(x0, H)}L{p(3, H)}A{r(3)},{r(3)} 0 0 1 {p(0, H - 3)}Z")
    hauts = {
        "rectangle": f"M{p(0, H - 3)}L{p(0, 10)}A{r(10)},{r(10)} 0 0 1 {p(10, 0)}L{p(70, 0)}A{r(10)},{r(10)} 0 0 1 {p(80, 10)}",
        "arche": f"M{p(0, H - 3)}L{p(0, 40)}A{r(40)},{r(40)} 0 0 1 {p(80, 40)}",
        "chat": (f"M{p(0, H - 3)}L{p(0, 24)}L{p(3.6, 4.6)}Q{p(4.6, 0.8)} {p(8.2, 2.6)}L{p(25, 13)}"
                 f"Q{p(40, 10)} {p(55, 13)}L{p(71.8, 2.6)}Q{p(75.4, 0.8)} {p(76.4, 4.6)}L{p(80, 24)}"),
        "ours": (f"M{p(0, H - 3)}L{p(0, 27)}Q{p(0, 16.5)} {p(5.66, 15.76)}A{r(11)},{r(11)} 0 1 1 {p(26.34, 15.76)}"
                 f"Q{p(40, 13)} {p(53.66, 15.76)}A{r(11)},{r(11)} 0 1 1 {p(74.34, 15.76)}Q{p(80, 16.5)} {p(80, 27)}"),
    }
    formes = [{"id": i, "nom": n, "haut": h, "d": hauts[i] + bas} for i, n, h in FORMES]
    fh, fb = c["fente_haut"], c["fente_bas"]
    fentes = "".join(
        f"M{p(a - JEU, fh)}L{p(b + JEU, fh)}L{p(b + JEU, fb)}L{p(a - JEU, fb)}Z" for a, b in PATTES)
    # pied : épaulement à y = sortie (le rebord), corps derrière
    sortie, L = t + REBORD_P, c["pied_corps"]
    (a1, b1), (a2, b2), (a3, b3) = PATTES
    pied = (f"M{p(0, sortie)}L{p(a1, sortie)}L{p(a1, 1)}A{r(1)},{r(1)} 0 0 1 {p(a1 + 1, 0)}L{p(b1 - 1, 0)}"
            f"A{r(1)},{r(1)} 0 0 1 {p(b1, 1)}L{p(b1, sortie)}L{p(a2, sortie)}L{p(a2, sortie - t)}L{p(b2, sortie - t)}"
            f"L{p(b2, sortie)}L{p(a3, sortie)}L{p(a3, 1)}A{r(1)},{r(1)} 0 0 1 {p(a3 + 1, 0)}L{p(b3 - 1, 0)}"
            f"A{r(1)},{r(1)} 0 0 1 {p(b3, 1)}L{p(b3, sortie)}L{p(W, sortie)}L{p(W, sortie + L - 3)}"
            f"A{r(3)},{r(3)} 0 0 1 {p(W - 3, sortie + L)}L{p(3, sortie + L)}A{r(3)},{r(3)} 0 0 1 {p(0, sortie + L - 3)}Z")
    return {"formes": formes, "fentes": fentes, "pied": pied, "pied_h": sortie + L, "fente_haut": fh, "fente_bas": fb,
            "t": t, "W": W, "H": H, "angle": ANGLE, "rebord_h": REBORD_H, "rebord_p": REBORD_P, "pattes": PATTES}


def svg_decoupe(forme_id, t=3.0, gravure=""):
    """Fichier à la taille réelle : dossier à gauche, pied à droite, marge 5 mm. Rouge = découpe."""
    g = chemins(t, 1, 5, 5)
    gp = chemins(t, 1, 5 + W + 10, 5)
    d = next(f["d"] for f in g["formes"] if f["id"] == forme_id)
    lw, lh = 5 + W + 10 + W + 5, max(H, gp["pied_h"]) + 10
    rouge = 'fill="none" stroke="#FF0000" stroke-width="0.1"'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{lw:.1f}mm" height="{lh:.1f}mm" viewBox="0 0 {lw:.1f} {lh:.1f}">'
            f'<g id="gravure">{gravure}</g>'
            f'<g id="decoupe"><path {rouge} d="{d}"/><path {rouge} d="{g["fentes"]}"/><path {rouge} d="{gp["pied"]}"/></g></svg>')


if __name__ == "__main__":
    sortie = sys.argv[1]
    t = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
    os.makedirs(sortie, exist_ok=True)
    for i, n, _ in FORMES:
        f = os.path.join(sortie, f"support-telephone-{i}-{t:g}mm.svg")
        open(f, "w").write(svg_decoupe(i, t))
        print(f)
    c = calcul(t)
    print(json.dumps({"épaisseur": t, "pied (mm)": round(c["pied_corps"] + t + REBORD_P, 1),
                      "fentes (mm depuis le haut)": [round(c["fente_haut"], 2), round(c["fente_bas"], 2)]}, ensure_ascii=False))
