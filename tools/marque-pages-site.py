#!/usr/bin/env python3
"""Photos et données des fiches marque-pages (mise en vente du 27/10/2026, gérant : « mets en vente, sur le site, les maquettes »).

Reprend EXACTEMENT les éléments des maquettes enregistrées (modèle 1 v17, modèle 2 v16, métal v4) :
  · photos fournisseur, boîtes, exemples de gravure (docs/maquettes/assets/…) → public/marque-pages/<modèle>/ ;
  · photos redressées face / dos de chaque couleur (aperçu) → public/marque-pages/faces/ ;
  · dessins et cadres découpés des planches du gobelet → public/marque-pages/dessins/ ;
  · planches numérotées (lues dans gobelet-configurateur-final.html) → public/marque-pages/planches/ ;
  · zones de gravure, libellés, centres des cadres (tools/maquettes/mp_apercu.py) → src/lib/marquePagesData.js (GÉNÉRÉ).
Usage : python3 tools/marque-pages-site.py   (à relancer si une photo ou une zone change ; ne pas modifier le .js à la main)
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools", "maquettes"))
import mp_apercu  # noqa: E402  (zones, couleurs, POSE, NUMS_OK, LEG_D — la même source que les maquettes)

A = os.path.join(ROOT, "docs", "maquettes", "assets")
PUB = os.path.join(ROOT, "public", "marque-pages")


def jpg(src, dst, w=900, q=80):
    im = Image.open(src).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "JPEG", quality=q, optimize=True, progressive=True)
    return im.size


def rel(p):
    return "/" + os.path.relpath(p, os.path.join(ROOT, "public")).replace(os.sep, "/")


out = {"modeles": {}, "dessins": {}, "planches": [], "numsOk": mp_apercu.NUMS_OK}

# --- Modèle 1 « bois, pompon doré » ---------------------------------------------------------------
m1 = os.path.join(A, "marque-pages")
for k in ["nanmu", "buis", "santal", "palissandre", "ebene", "suanzhi", "groupe", "ambiance", "eventail", "boite1", "boite2", "boite4"]:
    jpg(os.path.join(m1, k + ".jpg"), os.path.join(PUB, "m1", k + ".jpg"))
for f in sorted(os.listdir(os.path.join(m1, "exemples", "m1"))):
    if f.endswith(".jpg"):
        jpg(os.path.join(m1, "exemples", "m1", f), os.path.join(PUB, "m1", "exemple-" + f))
# --- Modèle 2 « ajouré, oiseau et magnolia » --------------------------------------------------------
m2 = os.path.join(A, "marque-pages-fenetre")
for k in ["blond", "roux", "sable", "noir", "groupe", "boite1", "boite2", "boite4"]:
    jpg(os.path.join(m2, k + ".jpg"), os.path.join(PUB, "m2", k + ".jpg"))
for f in sorted(os.listdir(os.path.join(m1, "exemples", "m2"))):
    if f.endswith(".jpg"):
        jpg(os.path.join(m1, "exemples", "m2", f), os.path.join(PUB, "m2", "exemple-" + f))
# --- Modèle 3 « métal, peintures célèbres » ---------------------------------------------------------
m3 = os.path.join(A, "marque-pages-metal")
for f in sorted(os.listdir(m3)):
    if f.endswith(".jpg") and not f.startswith("00-"):
        jpg(os.path.join(m3, f), os.path.join(PUB, "metal", f))

# --- Aperçus : photos redressées (face / dos) de chaque couleur -------------------------------------
faces = os.path.join(m1, "zones", "faces")
for f in sorted(os.listdir(faces)):
    jpg(os.path.join(faces, f), os.path.join(PUB, "faces", f), w=400, q=84)
for f in ["m1-face.jpg", "m2-face.jpg", "m2-dos-apercu.jpg"]:
    jpg(os.path.join(m1, "zones", f), os.path.join(PUB, "faces", f), w=400, q=84)

for modele in (1, 2):
    cfg = mp_apercu.config(modele)  # zones, libellés, ratio, centrage — la même configuration que les maquettes
    couleurs = {}
    for nom, f in mp_apercu.COULEURS[modele]:
        face = rel(os.path.join(PUB, "faces", f"m{modele}-{f}.jpg"))
        dos = face if modele == 1 else rel(os.path.join(PUB, "faces", f"m{modele}-{f}-dos.jpg"))
        couleurs[nom] = {"face": face, "dos": dos}
    photos = {"face": rel(os.path.join(PUB, "faces", f"m{modele}-face.jpg"))}
    photos["dos"] = photos["face"] if modele == 1 else rel(os.path.join(PUB, "faces", "m2-dos-apercu.jpg"))
    out["modeles"][modele] = {"ratio": cfg["ratio"], "zones": cfg["zones"], "labels": cfg["labels"], "centrer": cfg["centrer"],
                              "couleurs": couleurs, "photos": photos}

# --- Dessins et cadres découpés ----------------------------------------------------------------------
dsrc = os.path.join(m1, "dessins")
os.makedirs(os.path.join(PUB, "dessins"), exist_ok=True)
aspect, centre = {}, {}
for f in sorted(os.listdir(dsrc)):
    if not f.endswith(".png"):
        continue
    n = int(f[:-4])
    im = Image.open(os.path.join(dsrc, f))
    im.save(os.path.join(PUB, "dessins", f), optimize=True)
    aspect[n] = round(im.width / im.height, 3)
    if n >= 75:
        centre[n] = mp_apercu.POSE.get(n) or (mp_apercu._centre_trou(im) + [0.5])
out["dessins"] = {"aspect": aspect, "centre": centre}

# --- Planches numérotées (celles du gobelet, comme dans les maquettes) ------------------------------
gob = open(os.path.join(ROOT, "docs", "maquettes", "gobelet-configurateur-final.html"), encoding="utf-8").read()
PL = json.loads(re.search(r"var PLANCHES=(\[.*?\]);", gob).group(1))
CA = [c["src"] for c in json.loads(re.search(r"var CADRES=(\[.*?\]);", gob).group(1))]


def planche(data_uri, nom):
    b = base64.b64decode(data_uri.split(",", 1)[1])
    im = Image.open(io.BytesIO(b)).convert("RGB")
    dst = os.path.join(PUB, "planches", nom + ".jpg")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if im.width > 1100:
        im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=84, optimize=True)
    return rel(dst)


for i, (src, (a, b)) in enumerate(zip(PL, mp_apercu.LEG_D)):
    out["planches"].append({"src": planche(src, f"dessins-{i + 1:02d}"), "a": a, "b": b, "kind": "d"})
for src, a, b, nom in [(CA[2], "88–91", "Rubans fins (sur la planche 82–91)", "cadres-88-91"),
                       (CA[3], "92–94", "Cartouches (sur la planche 92–95)", "cadres-92-94"),
                       (CA[4], "96, 98, 100, 101", "Filets & ornements", "cadres-96-101"),
                       (CA[5], "102", "Volute", "cadres-102")]:
    out["planches"].append({"src": planche(src, nom), "a": a, "b": b, "kind": "c"})

js = ("// FICHIER GÉNÉRÉ par tools/marque-pages-site.py (27/10/2026) — ne pas modifier à la main.\n"
      "// Données des aperçus des marque-pages : zones de gravure (données par le gérant le 23/10), photos redressées\n"
      "// de chaque couleur, dessins / cadres découpés des planches du gobelet, planches numérotées.\n"
      "export const MP_DATA = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
open(os.path.join(ROOT, "src", "lib", "marquePagesData.js"), "w", encoding="utf-8").write(js)
print("ok", sum(len(fs) for _, _, fs in os.walk(PUB)), "fichiers")
