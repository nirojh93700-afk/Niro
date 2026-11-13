#!/usr/bin/env python3
"""Les douze symboles du zodiaque dessinés « au pinceau » pour l'outil lettre — 13/11/2026 nuit.

Le gérant a donné une image de douze symboles calligraphiés : « utilise les signes que je t'ai donné, c'est plus simple, c'est pour
les enfants… juste pour les quatre… sinon traite tous ces symboles pour remplacer les autres ». Son image n'est PAS recopiée (elle
appartient à son auteur) : les symboles, qui sont universels, sont redessinés ici dans le même esprit, par des traits dont
l'épaisseur varie (fins aux bouts, épais au milieu), avec quelques petites étoiles. Rien n'est pris dans un fichier.

  python3 tools/maquettes/lettre-signes-pinceau.py docs/maquettes/assets/lettre/signes-dessins [planche.png]
  python3 tools/maquettes/lettre-signes.py docs/maquettes/assets/lettre/signes-dessins docs/maquettes/assets/lettre/animaux.ttf

Chaque symbole est dessiné dans un carré de 1000 unités (y vers le bas), rendu en image puis tracé par potrace : un fichier
cal-<signe>.svg par symbole, au même format que les autres dessins de signes.
"""
import math, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw

K = 3  # rendu 3 fois plus grand, puis réduit : bords nets
G = 1.18  # tous les traits un peu plus gras : à 13 mm de haut, le trait le plus fin reste lisible une fois gravé


def spline(pts, n=40):
    """Courbe lisse (Catmull-Rom) qui passe par tous les points."""
    p = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for s in range(n):
            t = s / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3) for k in (0, 1)))
    out.append(pts[-1]); return out


def trait(d, pts, w=58, a0=0.3, a1=0.3, droit=False):
    """Un trait de pinceau : épais (w) au milieu, plus fin au début (a0 × w) et à la fin (a1 × w)."""
    c = pts if droit else spline(pts)
    if droit:
        c = []
        for i in range(len(pts) - 1):
            for s in range(40): c.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * s / 40, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * s / 40))
        c.append(pts[-1])
    L = [0]
    for i in range(1, len(c)): L.append(L[-1] + math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]))
    tot = L[-1] or 1
    for i in range(len(c) - 1):
        for s in range(4):
            u = (L[i] + (L[i + 1] - L[i]) * s / 4) / tot; a = a0 if u < 0.5 else a1
            r = G * w * (max(a, 0.24) + (1 - max(a, 0.24)) * math.sin(math.pi * u) ** 0.55) / 2
            x = c[i][0] + (c[i + 1][0] - c[i][0]) * s / 4; y = c[i][1] + (c[i + 1][1] - c[i][1]) * s / 4
            d.ellipse([(x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K], fill=0)


def anneau(d, cx, cy, r, w=46):
    """Un rond tracé au pinceau : un peu plus épais d'un côté."""
    n = 220
    for i in range(n):
        t = 2 * math.pi * i / n; rr = G * w * (0.72 + 0.28 * math.sin(t + 0.8)) / 2
        x = cx + r * math.cos(t); y = cy + r * math.sin(t)
        d.ellipse([(x - rr) * K, (y - rr) * K, (x + rr) * K, (y + rr) * K], fill=0)


def etoile(d, cx, cy, r):
    """Une petite étoile à quatre branches."""
    p = []
    for i in range(8):
        t = math.pi / 4 * i - math.pi / 2; q = r if i % 2 == 0 else r * 0.26
        p.append(((cx + q * math.cos(t)) * K, (cy + q * math.sin(t)) * K))
    d.polygon(p, fill=0)


def belier(d):
    trait(d, [(215, 455), (150, 360), (175, 225), (300, 160), (420, 230), (480, 430), (500, 880)], 64, 0.3, 0.45)
    trait(d, [(785, 455), (850, 360), (825, 225), (700, 160), (580, 230), (520, 430), (500, 880)], 64, 0.3, 0.45)
    etoile(d, 770, 690, 56); etoile(d, 240, 720, 48)


def taureau(d):
    anneau(d, 500, 640, 205, 58)
    trait(d, [(170, 120), (250, 290), (380, 400), (500, 428), (620, 400), (750, 290), (830, 120)], 66, 0.22, 0.22)
    etoile(d, 500, 200, 56); etoile(d, 850, 520, 46); etoile(d, 150, 560, 42)


def gemeaux(d):
    trait(d, [(120, 130), (300, 225), (500, 250), (700, 225), (880, 130)], 70, 0.2, 0.2)
    trait(d, [(120, 870), (300, 775), (500, 750), (700, 775), (880, 870)], 70, 0.2, 0.2)
    trait(d, [(385, 235), (375, 500), (385, 765)], 50, 0.75, 0.75)
    trait(d, [(615, 235), (625, 500), (615, 765)], 50, 0.75, 0.75)
    etoile(d, 500, 500, 58); etoile(d, 190, 500, 48); etoile(d, 810, 500, 48)


def cancer(d):
    anneau(d, 285, 420, 92, 46); anneau(d, 715, 600, 92, 46)
    trait(d, [(250, 330), (380, 240), (560, 215), (730, 260), (880, 380)], 62, 0.6, 0.15)
    trait(d, [(750, 690), (620, 780), (440, 805), (270, 760), (120, 640)], 62, 0.6, 0.15)
    etoile(d, 520, 510, 54); etoile(d, 850, 190, 44); etoile(d, 150, 830, 44)


def lion(d):
    anneau(d, 290, 640, 112, 50)
    trait(d, [(385, 590), (345, 430), (390, 250), (540, 150), (690, 230), (715, 420), (675, 610), (700, 760), (800, 830), (900, 770)], 66, 0.55, 0.16)
    etoile(d, 540, 420, 56); etoile(d, 180, 300, 46); etoile(d, 870, 560, 44)


def vierge(d):
    trait(d, [(105, 300), (175, 225), (235, 290), (245, 500), (245, 740)], 52, 0.3, 0.5)
    trait(d, [(245, 340), (300, 245), (380, 235), (425, 320), (430, 520), (430, 740)], 52, 0.4, 0.5)
    trait(d, [(430, 340), (485, 245), (565, 235), (610, 320), (615, 520), (615, 640), (660, 780), (770, 850), (880, 830)], 52, 0.4, 0.2)
    trait(d, [(615, 345), (700, 255), (800, 300), (810, 450), (740, 610), (610, 760), (470, 880)], 48, 0.4, 0.18)
    etoile(d, 880, 620, 46); etoile(d, 330, 880, 44); etoile(d, 900, 200, 40)


def balance(d):
    trait(d, [(110, 830), (500, 815), (890, 830)], 60, 0.2, 0.2)
    trait(d, [(350, 645), (322, 470), (385, 330), (500, 275), (615, 330), (678, 470), (650, 645)], 60, 0.7, 0.7)
    trait(d, [(110, 655), (370, 645)], 56, 0.2, 0.9, True); trait(d, [(630, 645), (890, 655)], 56, 0.9, 0.2, True)
    etoile(d, 500, 480, 58); etoile(d, 180, 380, 46); etoile(d, 820, 380, 46)


def scorpion(d):
    trait(d, [(105, 300), (175, 225), (235, 290), (245, 500), (245, 740)], 52, 0.3, 0.5)
    trait(d, [(245, 340), (300, 245), (380, 235), (425, 320), (430, 520), (430, 740)], 52, 0.4, 0.5)
    trait(d, [(430, 340), (485, 245), (565, 235), (610, 320), (615, 520), (630, 700), (700, 800), (800, 800), (880, 720)], 52, 0.4, 0.5)
    trait(d, [(905, 690), (760, 660)], 40, 0.9, 0.3, True); trait(d, [(905, 690), (900, 840)], 40, 0.9, 0.3, True)
    etoile(d, 820, 330, 50); etoile(d, 330, 880, 44); etoile(d, 720, 500, 40)


def sagittaire(d):
    trait(d, [(150, 850), (850, 150)], 62, 0.25, 0.8, True)
    trait(d, [(860, 140), (590, 165)], 52, 0.9, 0.25, True); trait(d, [(860, 140), (835, 410)], 52, 0.9, 0.25, True)
    trait(d, [(270, 470), (530, 730)], 54, 0.3, 0.3, True)
    etoile(d, 250, 230, 54); etoile(d, 760, 720, 50)


def capricorne(d):
    trait(d, [(140, 280), (215, 215), (290, 300), (325, 490), (335, 700)], 54, 0.3, 0.5)
    trait(d, [(330, 420), (395, 270), (485, 230), (555, 320), (575, 520), (572, 690), (520, 840), (410, 900)], 54, 0.45, 0.2)
    anneau(d, 705, 700, 112, 48)
    etoile(d, 780, 330, 52); etoile(d, 200, 830, 46); etoile(d, 880, 900, 38)


def verseau(d):
    for dy in (0, 270):
        trait(d, [(110, 430 + dy), (230, 290 + dy), (365, 430 + dy), (500, 290 + dy), (635, 430 + dy), (770, 290 + dy), (890, 430 + dy)], 62, 0.18, 0.18)
    etoile(d, 500, 130, 52); etoile(d, 500, 880, 52)


def poissons(d):
    trait(d, [(215, 130), (355, 320), (392, 500), (355, 680), (215, 870)], 64, 0.2, 0.2)
    trait(d, [(785, 130), (645, 320), (608, 500), (645, 680), (785, 870)], 64, 0.2, 0.2)
    trait(d, [(150, 500), (500, 492), (850, 500)], 52, 0.25, 0.25)
    etoile(d, 500, 250, 54); etoile(d, 500, 750, 54)


SIGNES = [('capricorne', capricorne), ('verseau', verseau), ('poissons', poissons), ('belier', belier), ('taureau', taureau), ('gemeaux', gemeaux),
          ('cancer', cancer), ('lion', lion), ('vierge', vierge), ('balance', balance), ('scorpion', scorpion), ('sagittaire', sagittaire)]


def image(f):
    im = Image.new('L', (1000 * K, 1000 * K), 255); f(ImageDraw.Draw(im)); return im.resize((1000, 1000), Image.LANCZOS)


def main(dossier, planche=None):
    os.makedirs(dossier, exist_ok=True); vues = []
    for nom, f in SIGNES:
        im = image(f); vues.append((nom, im))
        with tempfile.TemporaryDirectory() as t:
            pbm = os.path.join(t, 'a.pbm'); im.point(lambda v: 255 if v > 128 else 0).convert('1').save(pbm)
            subprocess.run(['potrace', '-s', '-t', '4', '-o', os.path.join(dossier, 'cal-' + nom + '.svg'), pbm], check=True)
    print(len(vues), 'symboles dans', dossier)
    if planche:
        p = Image.new('L', (4 * 260, 3 * 260), 255)
        for i, (nom, im) in enumerate(vues): p.paste(im.resize((240, 240), Image.LANCZOS), (10 + (i % 4) * 260, 10 + (i // 4) * 260))
        p.save(planche)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
