#!/usr/bin/env python3
"""Le créateur « musique à scanner » mis sur le SITE (26/11/2026, gérant : « mets en ligne »).

Part de la maquette enregistrée v11 (tools/maquettes/musique-qr.py + sa sortie) et en tire, sans rien redessiner :
  public/createurs/musique/mousquetons/*.png   les 7 mousquetons (photo du gérant)
  public/createurs/musique/photo-exemple.jpg   la photo d'exemple (tant que la cliente n'a pas choisi la sienne)
  src/lib/musiqueCreateurData.js               les pastilles des plateformes (logos) + les fichiers des écritures
  src/app/createur-musique.css                 le style de la maquette (classes .mzq-*), sans le bandeau ni la partie atelier

  python3 tools/createurs/musique-site.py <sortie de musique-qr.py (maquette.html)>

La géométrie, le QR code et les prix ne sont PAS copiés ici : ils vivent dans src/lib/musiqueCreateur.js (une seule source
pour la fiche, le paiement et le fichier de l'atelier).
"""
import json, os, re, shutil, sys

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
maquette = open(sys.argv[1], encoding="utf-8").read()
gen = open(os.path.join(RACINE, "tools", "maquettes", "musique-qr.py"), encoding="utf-8").read()
PUB = os.path.join(RACINE, "public", "createurs", "musique")
os.makedirs(os.path.join(PUB, "mousquetons"), exist_ok=True)
src_mq = os.path.join(RACINE, "docs", "maquettes", "assets", "musique-qr", "mousquetons")
ratios = {}
for f in sorted(os.listdir(src_mq)):
    if f.endswith(".png"):
        shutil.copy(os.path.join(src_mq, f), os.path.join(PUB, "mousquetons", f))
        w, h = __import__("struct").unpack(">II", open(os.path.join(src_mq, f), "rb").read()[16:24])
        ratios[f[:-4]] = round(w / h, 3)
shutil.copy(os.path.join(RACINE, "docs", "maquettes", "assets", "marque-pages", "exemples", "portraits", "couple.jpg"), os.path.join(PUB, "photo-exemple.jpg"))

m = re.search(r'<div class="mzq-plats"[^>]*>(.*?)</div>', maquette, re.S)
assert m and m.group(1).count("<svg") == 5, "pastilles des plateformes"
plats = m.group(1).strip()

css = re.search(r'CSS_MAQ = r"""(.*?)"""', gen, re.S).group(1)
gardes = []
for regle in re.findall(r"[^{}]+\{[^{}]*\}|@media[^{]+\{(?:[^{}]+\{[^{}]*\})+\}", css):
    sel = regle.split("{", 1)[0].strip()
    if sel in (":root", "body") or sel.startswith((".mzq-bandeau", ".mzq-atelier", ".mzq-fichier", ".mzq-faits", ".mzq-valider")):
        continue
    gardes.append(regle.strip())
css_site = "\n".join(gardes)
css_site = css_site.replace("main>.container.product-layout,.mzq-atelier{padding-left:16px;padding-right:16px;box-sizing:border-box}", "")
assert ".mzq-stage" in css_site and ".mzq-atelier" not in css_site

POLICES = [("Playfair Display", "playfair-display-ef05b3.woff2", "500 700"), ("Inter", "inter-260c81.woff2", "400 700"), ("Cinzel", "cinzel-e7ed1a.woff2", "400 600"),
           ("Cinzel Decorative", "cinzel-decorative-281359.woff2", "400"), ("Cinzel Decorative", "cinzel-decorative-280e13.woff2", "700"),
           ("Montserrat", "montserrat-311d35.woff2", "400 600"), ("Great Vibes", "great-vibes-51c0e8.woff2", "400"), ("Allura", "allura-9ff526.woff2", "400"),
           ("Pacifico", "pacifico-d150e6.woff2", "400")]
faces = ""
for fam, f, poids in POLICES:
    assert os.path.exists(os.path.join(RACINE, "public", "createurs", "polices", f)), f
    faces += "@font-face{font-family:'%s';src:url(/createurs/polices/%s) format('woff2');font-weight:%s;font-style:normal;font-display:swap}\n" % (fam, f, poids)
open(os.path.join(RACINE, "src", "app", "createur-musique.css"), "w", encoding="utf-8").write(
    "/* GÉNÉRÉ par tools/createurs/musique-site.py (style de la maquette « musique à scanner ») : ne pas modifier à la main. */\n" + faces + css_site + "\n")
open(os.path.join(RACINE, "src", "lib", "musiqueCreateurData.js"), "w", encoding="utf-8").write(
    "// GÉNÉRÉ par tools/createurs/musique-site.py à partir de la maquette enregistrée : ne pas modifier à la main.\n"
    "export const MUS_PLATS_HTML = " + json.dumps(plats, ensure_ascii=False) + ";\n"
    "export const MUS_MOUSQUETONS_RATIO = " + json.dumps(ratios) + ";\n"
    "export const MUS_POLICES_FICHIERS = " + json.dumps([{"famille": fam, "fichier": f, "poids": poids} for fam, f, poids in POLICES], ensure_ascii=False) + ";\n")
print("css", len(css_site), "octets ·", len(ratios), "mousquetons · pastilles", len(plats), "octets")
