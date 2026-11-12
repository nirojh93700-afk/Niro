#!/usr/bin/env python3
"""Range dans Gestion → Tests les fichiers laser fabriqués par fichiers-laser-test.cjs (12/11/2026).

  python3 -I tools/maquettes/tests-laser-publier.py <dossier des fichiers> <racine du dépôt>

Copie les SVG et les aperçus dans public/atelier-tests/, ajoute la pièce d'essai d'emboîtement (fentes de 2,8 à 3,2 mm,
dessinée ici en millimètres) et écrit src/lib/testsLaser.json (lu par /gestion/tests).
"""
import json, os, shutil, sys
from PIL import Image, ImageDraw

src, root = sys.argv[1], sys.argv[2]
dst = os.path.join(root, "public/atelier-tests")
os.makedirs(dst, exist_ok=True)
L = json.load(open(os.path.join(src, "fichiers.json"), encoding="utf-8"))

# ---- la pièce d'essai d'emboîtement : une plaquette à 5 fentes ; on y glisse une chute du bois de 3 mm ----
FENTES = [2.8, 2.9, 3.0, 3.1, 3.2]
LW, LH, PROF, PAS, X0 = 120.0, 42.0, 18.0, 20.0, 20.0
d = "M0 0"
for i, w in enumerate(FENTES):
    cx = X0 + i * PAS
    d += f"H{cx - w / 2:.2f}V{PROF}H{cx + w / 2:.2f}V0"
d += f"H{LW}V{LH}H0Z"
points = ""
for i, w in enumerate(FENTES):      # i+1 points gravés sous chaque fente : 1 point = 2,8 mm … 5 points = 3,2 mm
    cx = X0 + i * PAS
    for k in range(i + 1):
        px, py, r = cx - (i * 3.2) / 2 + k * 3.2, PROF + 9, 1.0
        points += f'<path id="repere-{i + 1}-{k + 1}" fill="#000000" stroke="none" d="M{px - r:.2f} {py}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0Z"/>\n'
emb = (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="{LW + 10}mm" height="{LH + 10}mm" viewBox="0 0 {LW + 10} {LH + 10}">\n'
       f'<g transform="translate(5 5)">\n<path id="plaquette" fill="none" stroke="#FF0000" stroke-width="0.1" d="{d}"/>\n{points}</g>\n</svg>\n')
open(os.path.join(dst, "essai-emboitement-fentes.svg"), "w", encoding="utf-8").write(emb)
K = 6
im = Image.new("RGB", (int((LW + 10) * K), int((LH + 26) * K)), "#f4ece0"); dr = ImageDraw.Draw(im)
pts = [(5, 5)]
for i, w in enumerate(FENTES):
    cx = 5 + X0 + i * PAS
    pts += [(cx - w / 2, 5), (cx - w / 2, 5 + PROF), (cx + w / 2, 5 + PROF), (cx + w / 2, 5)]
pts += [(5 + LW, 5), (5 + LW, 5 + LH), (5, 5 + LH)]
dr.polygon([(x * K, (y + 8) * K) for x, y in pts], fill="#e3c796", outline="#9c7744")
for i, w in enumerate(FENTES):
    cx = 5 + X0 + i * PAS
    for k in range(i + 1):
        px = cx - (i * 3.2) / 2 + k * 3.2
        dr.ellipse([(px - 1) * K, (5 + PROF + 9 - 1 + 8) * K, (px + 1) * K, (5 + PROF + 9 + 1 + 8) * K], fill="#4e2e16")
im.save(os.path.join(dst, "essai-emboitement-apercu.webp"), "WEBP", quality=85)

GROUPES = [
    {"id": "emboitement", "titre": "Pièce d'essai : l'emboîtement", "sous": "Cinq fentes de 2,8 à 3,2 mm. Glissez une chute de votre bois dans chaque fente : celle qui tient sans forcer donne le bon réglage pour le support et le pied de l'arbre.",
     "apercu": "/atelier-tests/essai-emboitement-apercu.webp",
     "fichiers": [{"nom": "essai-emboitement-fentes.svg", "url": "/atelier-tests/essai-emboitement-fentes.svg", "titre": "Plaquette à 5 fentes · 1 point = 2,8 mm · 2 = 2,9 · 3 = 3,0 · 4 = 3,1 · 5 = 3,2 mm",
                   "matiere": "Contreplaqué 3 mm", "w": LW + 10, "h": LH + 10, "note": "Les points sont gravés sous chaque fente. Dites-moi le nombre de points de la fente qui tient le mieux.", "gravure": True}]},
    {"id": "support", "titre": "Support de téléphone", "sous": "Standard · rectangle arrondi · 13° · passage du câble · « Camille » gravé", "apercu": "support-standard-rectangle-camille", "prefix": "support-"},
    {"id": "arbre", "titre": "Arbre de vie et son pied", "sous": "Arbre de vie · cœurs · « Léa » et « Tom » · pied gravé « Léa & Tom »", "apercu": "arbre-de-vie-lea-tom", "prefix": "arbre-"},
    {"id": "boule", "titre": "Décoration « Flocons de neige »", "sous": "Boule · cadre et 3 flocons en contreplaqué · « Camille » en acrylique bleu, collé sur le cadre", "apercu": "decoration-boule-flocons-camille", "prefix": "decoration-boule-"},
    {"id": "mamie", "titre": "Décoration « Pour Mamie »", "sous": "Cadeau · plaque pleine · « Mamie » et 3 dessins gravés", "apercu": "decoration-cadeau-mamie", "prefix": "decoration-cadeau-"},
    {"id": "photo", "titre": "Décoration avec une photo gravée", "sous": "Cœur · une photo gravée sur une pièce ovale · « Mamie » en acrylique rouge", "apercu": "decoration-coeur-photo-mamie", "prefix": "decoration-coeur-photo-"},
]
out = []
for g in GROUPES:
    if "fichiers" in g:
        out.append(g); continue
    im = Image.open(os.path.join(src, g["apercu"] + "-apercu.png")).convert("RGB"); im.thumbnail((640, 640))
    im.save(os.path.join(dst, g["apercu"] + "-apercu.webp"), "WEBP", quality=82)
    fs = [f for f in L if f["fichier"].startswith(g["prefix"])]
    for f in fs:
        shutil.copy(os.path.join(src, f["fichier"]), os.path.join(dst, f["fichier"]))
    out.append({"id": g["id"], "titre": g["titre"], "sous": g["sous"], "apercu": "/atelier-tests/" + g["apercu"] + "-apercu.webp",
                "fichiers": [{"nom": f["fichier"], "url": "/atelier-tests/" + f["fichier"], "titre": f["titre"], "matiere": f["matiere"], "w": f["w"], "h": f["h"],
                              "note": f["note"], "gravure": f["gravure"]} for f in fs]})
json.dump({"fait": "2026-11-12", "groupes": out}, open(os.path.join(root, "src/lib/testsLaser.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sum(len(g["fichiers"]) for g in out), "fichiers")
