#!/usr/bin/env python3
"""Extrait la feuille de style de la maquette « accueil + univers » (tools/maquettes/accueil-univers.py)
et l'écrit, ISOLÉE du reste du site, dans src/app/univers.css :
  · tout est préfixé par `.mx` (le conteneur des pages refaites) : rien ne s'applique ailleurs sur le site ;
  · les classes qui existent déjà dans globals.css (btn, hero, frame, band, noel, ic, up, bt, statement) sont
    renommées `mx…` pour que les règles du site ne se mélangent pas aux leurs ;
  · l'en-tête, le tiroir, les panneaux du menu, le pied de page et la barre de maquette ne sont pas repris
    (Header.jsx et Footer.jsx du site restent tels quels).
Usage : python3 tools/maquettes/css-univers.py   (à relancer si la maquette change)."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
src = open(os.path.join(HERE, "accueil-univers.py"), encoding="utf-8").read()
css = src.split("CSS = r'''", 1)[1].split("'''", 1)[0]

# 1. renommage des classes en collision avec globals.css
RENAME = ("btn", "hero", "frame", "band", "noel", "ic", "up", "bt", "statement")
css = re.sub(r"\.(%s)(?=[\s{:,.>\[\-]|$)" % "|".join(RENAME), lambda m: ".mx" + m.group(1), css, flags=re.M)

# 2. découpage en règles (profondeur des accolades)
def parse(s):
    out, i, n = [], 0, len(s)
    while i < n:
        j = s.find("{", i)
        if j < 0: break
        sel = s[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if s[k] == "{": depth += 1
            elif s[k] == "}": depth -= 1
            k += 1
        body = s[j + 1:k - 1]
        out.append((sel, body)); i = k
    return out

DROP = ("mbar", "header", "htop", "logo", "hacts", "hbtn", "cart-badge", "burger", "hnav", "mg", "drw", "footer", "foot", "ask", "skip")
def keep(sel):
    sel = re.sub(r"/\*.*?\*/", "", sel, flags=re.S).strip()
    if not sel: return False
    if sel in ("html", "*,*::before,*::after"): return False
    return not any(re.search(r"\.%s(?![\w])" % re.escape(d), sel) for d in DROP)

def split_sel(sel):
    parts, depth, cur = [], 0, ""
    for ch in sel:
        if ch == "(": depth += 1
        elif ch == ")": depth -= 1
        if ch == "," and depth == 0: parts.append(cur); cur = ""
        else: cur += ch
    parts.append(cur)
    return [p.strip() for p in parts if p.strip()]

def scope_one(s):
    if s == ":root": return ".mx"
    if s == "body": return ".mx"
    if s.startswith(".mx") and not s.startswith(".mx-") and (len(s) == 3 or s[3] in " .:,[>"): return s
    return ".mx " + s

def scope(sel):
    # les sélecteurs de l'en-tête/tiroir/pied de page sont retirés UN PAR UN (pas la règle entière :
    # « .mxhero,.enf-grid,…,.foot-news{grid-template-columns:1fr} » doit garder ses autres membres)
    gardes = [s for s in split_sel(sel) if keep(s)]
    return ",".join(scope_one(s) for s in gardes)

def render(rules, indent=""):
    out = []
    for sel, body in rules:
        s = re.sub(r"/\*.*?\*/", "", sel, flags=re.S).strip()
        if s.startswith("@media"):
            inner = render(parse(body), indent)
            if inner.strip(): out.append(f"{s}{{\n{inner}}}")
        elif s.startswith("@keyframes") or s.startswith("@font-face"):
            out.append(f"{s}{{{body}}}")
        else:
            sc = scope(s)
            if sc: out.append(f"{sc}{{{body.strip()}}}")
    return "\n".join(out) + "\n"

rules = parse(css)
texte = render(rules)
# polices : celles du site (next/font) à la place de la feuille Google Fonts de la maquette
texte = texte.replace('--serif:"Playfair Display",Georgia,"Times New Roman",serif;', '--serif:var(--font-display),"Playfair Display",Georgia,"Times New Roman",serif;')
texte = texte.replace('--sans:"Inter",system-ui,"Helvetica Neue",Arial,sans-serif;', '--sans:var(--font-body),"Inter",system-ui,"Helvetica Neue",Arial,sans-serif;')
texte = texte.replace(";-webkit-font-smoothing:antialiased;overflow-x:hidden}", ";-webkit-font-smoothing:antialiased}", 1)  # pas d'overflow caché sur le conteneur : il casserait les barres collantes
head = ("/* FICHIER GÉNÉRÉ par tools/maquettes/css-univers.py à partir de la maquette « accueil + univers » (09/10/2026).\n"
        "   Ne pas éditer à la main : modifier la maquette, puis relancer le script. Tout est isolé sous `.mx`. */\n")
open(os.path.join(ROOT, "src", "app", "univers.css"), "w", encoding="utf-8").write(head + texte)
print("ok", len(texte) // 1024, "Ko,", texte.count("{"), "blocs")
