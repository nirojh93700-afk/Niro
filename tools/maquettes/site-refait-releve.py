#!/usr/bin/env python3
"""Relevé du catalogue EN LIGNE pour la maquette « Le site refait » (lecture seule, rien n'est modifié sur le site).

  python3 -I tools/maquettes/site-refait-releve.py <dossier de sortie>

Lit les pages https://nivcreation.fr/boutique/<univers> (prix du jour, réglages de Gestion compris) et écrit :
  <sortie>/catalogue.json   univers → titre, phrase, rayons → cartes (slug, nom, prix, prix barré, étiquette, photo)
  <sortie>/img/<slug>.webp  une photo carrée de 360 px par création
  <sortie>/grand/*.webp     les grandes photos de la maquette (ouverture, fiche du collier, carafe, Noël)
Puis : python3 tools/maquettes/site-refait.py <sortie>/catalogue.json <sortie>/img <sortie>/grand <sortie>/maq
"""
import html, io, json, os, re, subprocess, sys
from PIL import Image

out = sys.argv[1]
racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(racine, "public")
for d in ["img", "grand"]:
    os.makedirs(os.path.join(out, d), exist_ok=True)


def lire(adresse):
    return subprocess.run(["curl", "-s", "https://nivcreation.fr" + adresse], capture_output=True).stdout


def cartes(bloc):
    res = []
    for m in re.finditer(r'<div class="uc"[^>]*data-prix="([^"]*)"[^>]*>(.*?)</button></div>', bloc, flags=re.S):
        c = m.group(2)
        g = lambda p: (re.search(p, c, flags=re.S) or [None, ""])[1]
        prix = re.sub(r"<!-- -->", "", re.sub(r'<s class="uc-old">.*?</s>', "", g(r'class="uc-price">(.*?)</span></span>')))
        res.append({"slug": g(r'href="/produit/([^"]+)"') or g(r'href="([^"]+)"'), "nom": html.unescape(re.sub(r"<[^>]+>", "", g(r'class="uc-name">(.*?)</span>'))),
                    "prix": float(m.group(1)) if m.group(1) else None, "ptxt": html.unescape(prix).strip(), "vieux": html.unescape(g(r'class="uc-old">(.*?)</s>')),
                    "tag": html.unescape(g(r'class="uc-tag">(.*?)</span>')), "img": g(r'<img[^>]*src="([^"]+)"')})
    return res


cat = {}
for u in ["bijoux", "cristal", "verres", "enfants", "mariage", "maison", "papeterie", "cadeaux"]:
    s = lire("/boutique/" + u).decode("utf-8")
    titre = html.unescape(re.sub(r"<[^>]+>", "", re.search(r"<h1[^>]*>(.*?)</h1>", s, flags=re.S).group(1)))
    intro = re.search(r"</h1><p>(.*?)</p>", s, flags=re.S)
    rayons = []
    for m in re.finditer(r'<section class="ur[^"]*" id="(r-[^"]+)"><h3>(.*?)</h3>(.*?)</section>', s, flags=re.S):
        rayons.append({"nom": html.unescape(re.sub(r"<small>.*?</small>|<!-- -->|<[^>]+>", "", m.group(2))).strip(), "cartes": cartes(m.group(3))})
    cat[u] = {"titre": titre, "intro": html.unescape(re.sub(r"<[^>]+>", "", intro.group(1))) if intro else "", "rayons": rayons}
    print(u, [(r["nom"], len(r["cartes"])) for r in rayons])
json.dump(cat, open(os.path.join(out, "catalogue.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

faits = set()
for u in cat.values():
    for r in u["rayons"]:
        for c in r["cartes"]:
            nom = re.sub(r"[^a-z0-9]+", "-", c["slug"].lower()) + ".webp"
            if nom in faits:
                continue
            faits.add(nom)
            im = Image.open(io.BytesIO(lire(c["img"]))) if c["img"].startswith("/api/img/") else Image.open(PUB + c["img"])
            im = im.convert("RGB")
            w, h = im.size
            m = min(w, h)
            im.crop(((w - m) // 2, (h - m) // 2, (w - m) // 2 + m, (h - m) // 2 + m)).resize((360, 360), Image.LANCZOS).save(os.path.join(out, "img", nom), "WEBP", quality=68)
print(len(faits), "petites photos")


def grand(src, nom, largeur, q=70, carre=False):
    im = Image.open(os.path.join(PUB, "produits", src)).convert("RGB")
    if carre:
        a, b = im.size
        m = min(a, b)
        im = im.crop(((a - m) // 2, (b - m) // 2, (a - m) // 2 + m, (b - m) // 2 + m))
    im.thumbnail((largeur, largeur * 2), Image.LANCZOS)
    im.save(os.path.join(out, "grand", nom + ".webp"), "WEBP", quality=q)


grand("cristal-v-femme.jpg", "hero", 760, 72)
for k in range(1, 6):
    grand("collier-coeur-grave-%d.jpg" % k, "fiche-%d" % k, 640, 68, True)
grand("carafe_gravee.jpg", "carafe_gravee", 640, 66)
grand("deco-noel-cristal-exemple.jpg", "deco-noel-cristal-exemple", 640, 66)
print("grandes photos faites")
