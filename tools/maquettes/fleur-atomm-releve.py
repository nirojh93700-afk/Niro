#!/usr/bin/env python3
"""Relevé du générateur « Flower » d'Atomm (13/11/2026) : listes des fleurs, des feuilles et des écritures + leurs images.

  python3 -I tools/maquettes/fleur-atomm-releve.py <dossier de sortie>

Écrit fleurs.json, feuilles.json, ecritures.json (réponses de leur service) et brut/*.png (26 fleurs, 8 paires de feuilles).
Rien n'est lancé de leur programme : ce sont des listes et des images.
"""
import json, os, re, subprocess, sys

out = sys.argv[1]
os.makedirs(os.path.join(out, "brut"), exist_ok=True)
API = "https://api.xtool.com/efficacy/v1/data/type/aimake_cms_generator_flower_%s/items"


def lire(nom, cle):
    f = os.path.join(out, nom + ".json")
    if not os.path.exists(f):
        subprocess.run(["curl", "-sS", "-A", "Mozilla/5.0", "-H", "Origin: https://www.atomm.com", "-o", f, API % cle], check=True)
    return json.load(open(f, encoding="utf-8"))["data"]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def image(url, f):
    f = os.path.join(out, "brut", f)
    if url and not os.path.exists(f):
        subprocess.run(["curl", "-sS", "-A", "Mozilla/5.0", "-o", f, url], check=True)


fleurs, feuilles, ecr = lire("fleurs", "flower"), lire("feuilles", "leaf"), lire("ecritures", "fonts")
for x in fleurs:
    image(x["extra"]["url"], "f-%02d-%s.png" % (x["sno"], slug(x["name"])))
for x in feuilles:
    image(x["extra"].get("leafUp"), "l-%s-haut.png" % x["sno"])
    image(x["extra"].get("leafDown"), "l-%s-bas.png" % x["sno"])
print(len(fleurs), "fleurs,", len(feuilles), "feuilles,", len(ecr), "écritures")
