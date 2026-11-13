#!/usr/bin/env python3
"""Ajoute le bouton « OK ✓ » des champs (valider-champ.js) à la fin d'une ou plusieurs pages de créateur — 13/11/2026.

  python3 tools/maquettes/ajouter-valider.py <page.html> [<page.html> …]

À lancer sur la SORTIE de chaque générateur de créateur (support, décoration, arbre, prénom, suspension, fleur, maisonnette…)
avant de publier : sur téléphone, le bouton range le clavier pour que l'aperçu se revoie. Sans effet si la page l'a déjà.
"""
import os, sys

ici = os.path.dirname(os.path.abspath(__file__))
JS = open(os.path.join(ici, "valider-champ.js"), encoding="utf-8").read()
MARQUE = "<!-- niv-ok -->"
BLOC = MARQUE + "<script>" + JS + "</script>"

def ajouter(t):
    if MARQUE in t: return t, False
    i = t.lower().rfind("</body>")
    return (t[:i] + BLOC + t[i:], True) if i >= 0 else (t + "\n" + BLOC + "\n", True)

if __name__ == "__main__":
    for f in sys.argv[1:]:
        t, fait = ajouter(open(f, encoding="utf-8").read())
        if fait: open(f, "w", encoding="utf-8").write(t)
        print(f, "bouton ajouté" if fait else "déjà là")
