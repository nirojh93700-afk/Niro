#!/usr/bin/env python3
"""Reprend le CSS EXACT des maquettes cristal validées et le limite à leur page (10/10/2026).

Le gérant a dit « les trois » (09/10/2026 soir) : les maquettes cristaux-graves (v14), cristaux-blocs et
l'écrin des fiches cristal passent en ligne. Leur CSS vit dans les générateurs ; ce script le recopie dans
src/app/*.css en préfixant chaque sélecteur par la classe racine de la page, pour que rien ne déborde sur
le reste du site (les deux maquettes emploient les mêmes noms de classes .cg-* avec des règles différentes).

  .cg            → .<racine>
  .cg h1         → .<racine> h1
  .cg-tile:hover → .<racine> .cg-tile:hover
Les règles de la bannière « MAQUETTE » (.mq-banner) sont retirées. Les @keyframes sont gardées telles quelles.

Usage : python3 tools/maquettes/css-cristaux.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEN = os.path.join(ROOT, "tools", "maquettes")


def blocs_css(fichier):
    src = open(os.path.join(GEN, fichier), encoding="utf-8").read()
    return "\n".join(re.findall(r"CSS \+?= r'''(.*?)'''", src, re.S))


def prefixer(sel, racine):
    sel = sel.strip()
    if not sel:
        return sel
    if sel == ".cg" or sel.startswith(".cg ") or sel.startswith(".cg{") or sel.startswith(".cg:"):
        return "." + racine + sel[3:]
    if re.match(r"\.cg\.", sel):
        return "." + racine + sel[3:]
    return f".{racine} {sel}"


def limiter(css, racine):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i, n = [], 0, len(css)
    pile = []  # contexte : "media" ou "keyframes"
    buf = ""
    while i < n:
        c = css[i]
        if c == "{":
            tete = buf.strip(); buf = ""
            if tete.startswith("@media") or tete.startswith("@supports"):
                pile.append("media"); out.append(tete + "{")
            elif tete.startswith("@keyframes"):
                pile.append("keyframes"); out.append(tete + "{")
            elif pile and pile[-1] == "keyframes":
                pile.append("frame"); out.append(tete + "{")
            else:
                # règle ordinaire : on lit jusqu'à l'accolade fermante
                j = css.index("}", i)
                corps = css[i + 1:j]
                sels = [s for s in tete.split(",")]
                if any("mq-banner" in s for s in sels):
                    i = j + 1; continue
                out.append(",".join(prefixer(s, racine) for s in sels) + "{" + corps.strip() + "}")
                i = j + 1; continue
        elif c == "}":
            if buf.strip():
                out.append(buf.strip())
            buf = ""
            if pile:
                pile.pop()
            out.append("}")
        else:
            buf += c
        i += 1
    return "\n".join(out) + "\n"


# Écrin des fiches cristal (maquette fiche-cristal-vertical v5) : le titre de l'écrin est un <p class="cg-h1">
# (la fiche garde son h1). Règles relues dans fiche-cristal-vertical.py, sauf `.cg .product-layout` : la fiche
# en dessous reste EXACTEMENT celle du site (gérant, 09/10 soir : « tu laisses comme c'est actuellement »).
def css_fiche():
    src = open(os.path.join(GEN, "fiche-cristal-vertical.py"), encoding="utf-8").read()
    bloc = re.search(r"\nCSS \+= r'''(.*?)'''", src, re.S).group(1)
    return "\n".join(l for l in bloc.splitlines() if ".product-layout" not in l)


TETE = "/* FICHIER GÉNÉRÉ par tools/maquettes/css-cristaux.py depuis {src} : ne pas modifier à la main. */\n"
for src, racine, sortie in (("cristaux-graves.py", "cgg", "cristaux-graves.css"),
                            ("cristaux-blocs.py", "cgb", "cristaux-blocs.css")):
    css = limiter(blocs_css(src) + ("\n" + css_fiche() if racine == "cgg" else ""), racine)
    # Sur le site, Great Vibes est chargée par next/font sous un nom haché : on passe par sa variable.
    css = css.replace('"Great Vibes","Allura",cursive', "var(--font-great-vibes),cursive")
    open(os.path.join(ROOT, "src", "app", sortie), "w", encoding="utf-8").write(TETE.format(src=src) + css)
    print(sortie, len(css), "car.,", css.count("{"), "règles")
