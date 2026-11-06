#!/usr/bin/env python3
"""Vectorise tous les dessins listés par inventaire-dessins.mjs → public/vectoriel/<même chemin>.svg (60 mm de large).
Usage : python3 tools/gravure/vectoriser-tout.py <inventaire.json>"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from vectoriser import vectoriser
L = json.load(open(sys.argv[1]))
ok = 0
for x in L:
    src = "public" + x["src"]; dst = "public/vectoriel" + os.path.splitext(x["src"])[0] + ".svg"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try: vectoriser("public" + x.get("vec", x["src"]), dst, 60.0); ok += 1
    except Exception as e: print("ÉCHEC", x["src"], e)
print(ok, "/", len(L))
# Liste lue par src/lib/imagesOrigine.js (bouton « SVG vectoriel » de Gestion) : chemins sans extension.
cles = sorted({os.path.splitext(x["src"])[0] for x in L if os.path.exists("public/vectoriel" + os.path.splitext(x["src"])[0] + ".svg")})
open("src/lib/vectoriel.js", "w").write("// GÉNÉRÉ par tools/gravure/vectoriser-tout.py : dessins du site qui ont leur SVG dans public/vectoriel/ (chemin sans extension).\nexport default " + json.dumps(cles, ensure_ascii=False, indent=0) + ";\n")
print(len(cles), "fichiers listés dans src/lib/vectoriel.js")
