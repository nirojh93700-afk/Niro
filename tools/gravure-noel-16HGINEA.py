# -*- coding: utf-8 -*-
"""Fichiers de gravure — commande 16HGINEA (Ludovic NOEL), devis DEV-1506.
Style n°2 « etiquette grand cru » : filets fins, capitales espacees, losange central.
Texte CONVERTI EN TRACES (aucune police a installer). Tout en NOIR PLEIN = zone gravee."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

CINZEL = ".next/static/media/a273567b21a7c318-s.p.woff2"
OUT = "docs/gravures/noel-16HGINEA"

f = TTFont(CINZEL)
upm = f["head"].unitsPerEm
cmap = f.getBestCmap()
gs = f.getGlyphSet()
hmtx = f["hmtx"]

def glyphe(ch):
    n = cmap.get(ord(ch))
    if n is None: raise SystemExit(f"GLYPHE MANQUANT: {ch!r}")
    return n

def largeur_txt(txt, taille, track):
    """largeur en mm"""
    w = 0.0
    for i, ch in enumerate(txt):
        if ch == " ":
            w += taille * 0.30
        else:
            w += hmtx[glyphe(ch)][0] / upm * taille
        if i < len(txt) - 1: w += track
    return w

def paths_txt(txt, taille, track, cx, base):
    """renvoie une liste de <path> centres sur cx, ligne de base base (mm)"""
    total = largeur_txt(txt, taille, track)
    x = cx - total / 2
    out = []
    for i, ch in enumerate(txt):
        if ch == " ":
            x += taille * 0.30 + (track if i < len(txt)-1 else 0); continue
        n = glyphe(ch)
        pen = SVGPathPen(gs)
        gs[n].draw(pen)
        d = pen.getCommands()
        k = taille / upm
        if d:
            # y inverse (SVG descend), mise a l'echelle et translation
            out.append(f'<path d="{d}" transform="translate({x:.4f},{base:.4f}) scale({k:.6f},{-k:.6f})"/>')
        x += hmtx[n][0] / upm * taille
        if i < len(txt)-1: x += track
    return out, total

def etiquette(ligne1, ligne2, fichier, titre, t1, tr1, t2, tr2):
    W, H = 55.0, 45.0          # zone de gravure sur le calice (mm)
    M = 3.0                     # marge exterieure
    E = 0.35                    # epaisseur des filets
    G = 1.6                     # ecart entre les deux filets
    inner = W - 2*(M+G) - 2*E   # largeur utile entre filets interieurs
    dispo = inner - 4.0         # marge de securite laterale

    el = []
    # --- double filet (rectangles pleins, pas de stroke : plus sur au laser) ---
    def cadre(x, y, w, h, e):
        return (f'<path d="M{x},{y} h{w} v{h} h{-w} Z M{x+e},{y+e} h{w-2*e} v{h-2*e} h{-(w-2*e)} Z" '
                f'fill-rule="evenodd"/>')
    el.append(cadre(M, M, W-2*M, H-2*M, E))                      # filet exterieur
    el.append(cadre(M+G, M+G, W-2*(M+G), H-2*(M+G), E*0.7))      # filet interieur, plus fin

    cx = W/2
    # --- ligne 1 : le nom, capitales espacees, ajustee a la largeur ---
    p1, w1 = paths_txt(ligne1, t1, tr1, cx, 18.0)
    el += p1

    # --- losange central entre deux filets ---
    yc = 23.5
    d = 1.5                       # demi-diagonale du losange
    el.append(f'<path d="M{cx},{yc-d} L{cx+d},{yc} L{cx},{yc+d} L{cx-d},{yc} Z"/>')
    bras = (dispo/2) - d - 2.0
    if bras > 3:
        el.append(f'<path d="M{cx-d-1.6-bras},{yc-E/2} h{bras} v{E} h{-bras} Z"/>')
        el.append(f'<path d="M{cx+d+1.6},{yc-E/2} h{bras} v{E} h{-bras} Z"/>')

    # --- ligne 2 : millesime ---
    p2, w2 = paths_txt(ligne2, t2, tr2, cx, 32.5)
    el += p2

    svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n'
           f'<!-- {titre} — commande 16HGINEA / devis DEV-1506 — Niv Creation\n'
           f'     Style n°2 « etiquette grand cru ». Texte converti en traces (Cinzel).\n'
           f'     Zone : {W:.0f} x {H:.0f} mm. Noir plein = a graver. -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" '
           f'viewBox="0 0 {W} {H}">\n'
           f'<g fill="#000000" stroke="none">\n' + "\n".join(el) + '\n</g>\n</svg>\n')
    open(f"{OUT}/{fichier}", "w", encoding="utf-8").write(svg)
    print(f"{fichier}  ({W:.0f}x{H:.0f} mm)  ligne1 {t1:.1f}mm / {w1:.1f}mm  ligne2 {t2:.1f}mm / {w2:.1f}mm")

# Les deux verres forment une PAIRE : memes tailles, meme rendu.
# On cale chaque ligne sur le texte le plus long des deux, et on garde la
# hierarchie (le nom toujours plus grand que le millesime).
DISPO = 55.0 - 2*(3.0+1.6) - 2*0.35 - 4.0
NOMS = ["CLAUDE", "AMI DE CLAUDE"]
MILS = ["MILLÉSIME 1976", "MILLÉSIMÉ"]

def justifie(txt, taille, cible, tr_min=0.35, tr_max=6.0):
    """Capitales JUSTIFIEES : on garde la taille, on ecarte les lettres pour
    remplir exactement la largeur (c'est le propre d'une etiquette grand cru).
    Si meme colle le texte deborde, on reduit la taille."""
    n = max(1, len(txt) - 1)
    while True:
        base = largeur_txt(txt, taille, 0.0)
        tr = (cible - base) / n
        if tr >= tr_min:
            return round(taille, 2), round(min(tr, tr_max), 3)
        taille -= 0.05
        if taille <= 2.0:
            return round(taille, 2), tr_min

# Tailles FIXES et communes aux deux verres (la paire doit etre identique),
# l'espacement s'ajuste pour que chaque ligne remplisse toute la largeur.
T1 = 5.6   # le nom
T2 = 3.2   # le millesime
for nom in NOMS:
    T1 = min(T1, justifie(nom, T1, DISPO)[0])
for mil in MILS:
    T2 = min(T2, justifie(mil, T2, DISPO)[0])
print(f"nom {T1} mm  |  millesime {T2} mm  (espacement calcule par ligne)")

for txt1, txt2, f_, ti in [
    ("CLAUDE", "MILLÉSIME 1976", "verre-1-claude-millesime-1976.svg", "Verre 1"),
    ("AMI DE CLAUDE", "MILLÉSIMÉ", "verre-2-ami-de-claude-millesime.svg", "Verre 2")]:
    _, tr1 = justifie(txt1, T1, DISPO)
    _, tr2 = justifie(txt2, T2, DISPO)
    etiquette(txt1, txt2, f_, ti, T1, tr1, T2, tr2)
