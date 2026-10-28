# -*- coding: utf-8 -*-
"""MAQUETTE « Fêtes » (28/10/2026) — gérant : « un nouveau truc pour Noël… une catégorie dans admin, dès que je
décoche, tout ce qui a rapport avec Noël disparaît… une alerte deux mois avant… après ça sera la Saint-Valentin ».
Deux vues dans une seule page :
  ① Gestion → Fêtes : une ligne par fête, interrupteur, alerte 2 mois avant ; le détail de Noël = produits concernés,
     les 25 images de gravure NUMÉROTÉES (comme les modèles des verres), les emballages de Noël, ce qui reste toute l'année.
  ② Sur le site : la fiche RÉELLE du verre à vin (capture en ligne), Noël allumé = carte À PART « 🎄 Un modèle de Noël »
     avec sa propre grille de 25 modèles numérotés (v4 du 28/10 soir : plus jamais mélangés aux modèles habituels) + bloc « Votre emballage de Noël » ; éteint = la fiche d'aujourd'hui, à l'identique.
Usage : python3 tools/maquettes/fetes-noel.py <dossier css du site> <capture /produit/verre-a-vin-grave> <sortie.html> <capture /produit/collier-coeur-grave>
v2 (28/10 soir) : les emballages de Noël Temu (pour les BIJOUX, prix validés par le gérant) dans Gestion → Fêtes, et un 3ᵉ onglet
= la fiche RÉELLE du collier cœur gravé : Noël allumé = les emballages de Noël s'ajoutent sous « Votre emballage » ; éteint = la fiche d'aujourd'hui.
Les photos des emballages = `docs/maquettes/assets/noel/emballages/` (celles du gérant, sans cotes) ; les photos /api/img/<id> de la capture
collier sont lues dans le dossier de cette capture (<id>.jpg, téléchargées avec curl).
Le dossier css = les 3 feuilles en ligne (curl nivcreation.fr/_next/static/css/*.css) : vraies classes .ash-* / .prc-*.
RIEN n'est en ligne. Les prix des images (offert / payant) et des emballages sont des EXEMPLES à régler par le gérant.
"""
import base64, datetime as dt, glob, html, io, json, os, re, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(ROOT, "docs", "maquettes", "assets", "noel")
css_dir, capture, out, capture_bijou = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
EMB_DIR = os.path.join(ASSETS, "emballages")

CSS = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))
VIN = json.loads(subprocess.check_output(["node", "--import", os.path.join(ROOT, "tools", "alias-register.mjs"),
                                          os.path.join(HERE, "fetes-noel-export.mjs")], cwd=ROOT, stderr=subprocess.DEVNULL))


def uri(path, w=640, q=72):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "svg": "image/svg+xml"}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


# ------------------------------------------------------------------ dates (vérifiées par le calcul, jamais de tête)
JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]
MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
AUJ = dt.date.today()


def fr(d):
    return f"{JOURS[d.weekday()]} {d.day} {MOIS[d.month - 1]} {d.year}"


def paques(an):
    a, b, c = an % 19, an // 100, an % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25; g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) / 451
    mois = (h + l - 7 * int(m) + 114) // 31
    jour = ((h + l - 7 * int(m) + 114) % 31) + 1
    return dt.date(an, mois, jour)


def dernier_dimanche(an, mois):
    d = dt.date(an + (mois == 12), (mois % 12) + 1, 1) - dt.timedelta(days=1)
    return d - dt.timedelta(days=(d.weekday() + 1) % 7)


def nieme_dimanche(an, mois, n):
    d = dt.date(an, mois, 1)
    d += dt.timedelta(days=(6 - d.weekday()) % 7)
    return d + dt.timedelta(days=7 * (n - 1))


def moins_deux_mois(d):
    m = d.month - 2; an = d.year
    if m < 1: m += 12; an -= 1
    return d.replace(year=an, month=m)


pq = paques(2027)
fm = dernier_dimanche(2027, 5)
if fm == pq + dt.timedelta(days=49):  # Pentecôte → fête des mères le 1er dimanche de juin
    fm = nieme_dimanche(2027, 6, 1)
FETES = [
    dict(k="noel", nom="Noël", ico="🎄", date=dt.date(2026, 12, 25), on=True, images=25, emb=6),
    dict(k="valentin", nom="Saint-Valentin", ico="♥", date=dt.date(2027, 2, 14), on=False, images=0, emb=0),
    dict(k="paques", nom="Pâques", ico="🐣", date=pq, on=False, images=0, emb=0),
    dict(k="meres", nom="Fête des mères", ico="✿", date=fm, on=False, images=0, emb=0),
    dict(k="peres", nom="Fête des pères", ico="♛", date=nieme_dimanche(2027, 6, 3), on=False, images=0, emb=0),
]
for f in FETES:
    f["alerte"] = moins_deux_mois(f["date"])
    f["jours"] = (f["date"] - AUJ).days
NOEL = FETES[0]

# ------------------------------------------------------------------ les 25 images de Noël (numéros = ceux de Gestion ET du site)
# texte = un texte fait partie de l'image (règle « tout texte est payant » → +3 € proposé, à confirmer) ;
# droits = personnage protégé ; gris = image en niveaux de gris, pas un trait noir et blanc.
IMAGES = [
    (1, "Cloches de Noël au ruban", ""), (2, "Gnomes « Merry Christmas »", "texte"), (3, "Père Noël, sapin et cadeaux", ""),
    (4, "Forêt, cerfs et flocon", ""), (5, "Père Noël, bras croisés", "gris"), (6, "Crèche de la Nativité", ""),
    (7, "Couronne « Merry Christmas · Noël »", "texte"), (8, "Tom et Jerry", "droits"), (9, "Cerfs et traîneau « Merry Christmas »", "texte"),
    (10, "Cœur, traîneau et sapins", ""), (11, "Renne au bonnet", ""), (12, "Père Noël sous la lune", ""),
    (13, "Mickey et Minnie, boule à neige", "droits texte"), (14, "Village et traîneau devant la lune", ""), (15, "Le Grinch à la cheminée", "droits"),
    (16, "Médaillon aux cerfs « Merry Christmas »", "texte"), (17, "« Douce magie d'hiver »", "mots"), (18, "« Noël tout en douceur »", "mots"),
    (19, "« Sous les étoiles de Noël »", "mots"), (20, "« Mon beau sapin »", "mots"), (21, "« Un soupçon de magie »", "mots"),
    (22, "« Esprit d'hiver »", "mots"), (23, "« Joyeux Noël »", "mots"), (24, "« Petits bonheurs de Noël »", "mots"), (25, "« La saison des merveilles »", "mots"),
]
FICHIERS = {int(os.path.basename(p)[:2]): p for p in glob.glob(os.path.join(ASSETS, "*.*"))}
NOEL_JS = []
for n, nom, flags in IMAGES:
    f = flags.split()
    NOEL_JS.append(dict(n=n, nom=nom, src=uri(FICHIERS[n], 300, 80), texte=("texte" in f or "mots" in f), mots=("mots" in f),
                        droits=("droits" in f), gris=("gris" in f), prix=(3 if ("texte" in f or "mots" in f) else 0)))

VIN_JS = [dict(n=int(n), legende=m["legende"], champs=m.get("champs", []), exemple=m.get("exemple", ""),
               src=uri(os.path.join(PUB, VIN["styleImages"][n].lstrip("/")), 300, 80)) for n, m in sorted(VIN["modeles"].items(), key=lambda x: int(x[0]))]

CRISTAUX = [("chat-sapin.jpg", "Chaton au pied du sapin"), ("sapin.jpg", "Sapin étoilé")]
CRISTAUX_JS = [dict(nom=nm, src=uri(os.path.join(PUB, "produits", "cristaux-graves", f), 420)) for f, nm in CRISTAUX]

# ------------------------------------------------------------------ emballages de Noël pour les BIJOUX (commande Temu reçue le 28/10)
# prix = ceux validés par le gérant le 28/10 soir (« C'est bon, mets ces prix avec le pack Noël ») ; coût = coût rendu (facture Temu + part du port) ;
# stock = quantités reçues. Photos = les siennes, sans cotes (règle du 28/10). La boîte à ruban existe en vert et bleu nuit (la blanche n'a pas été commandée).
EMB_NOEL = [
    dict(id="sachet", nom="Sachet rouge de Noël", d="12 × 17 cm · plat, fermeture adhésive · reste en lettre suivie", px=0.9, cout=0.13, stock=52, photo="7-sachet-rouge-O-remise.jpg", colis=False),
    dict(id="pochette", nom="Pochette à languette dorée", d="Bordeaux et or · pour un collier ou un bracelet · lettre suivie", px=2.9, cout=0.80, stock=40, photo="1-pochette-F.jpg", colis=False),
    dict(id="sac", nom="Sac de Noël à anses", d="Bordeaux, liseré or, nœud satin · 19 × 15 × 7 cm · plié à plat", px=2.9, cout=1.38, stock=20, photo="2-sac-M.jpg", colis=False),
    dict(id="ruban", nom="Boîte à ruban « Merry Christmas »", d="11,5 × 7 × 4,5 cm · aimantée · vert sapin ou bleu nuit · part en colis", px=3.9, cout=0.72, stock=48, photo="3-5-boite-ruban-C-vert-recadree.jpg", colis=True, couleurs=True),
    dict(id="rouge", nom="Boîte rouge au sapin doré", d="12 × 6 × 4 cm · ruban rouge et or · part en colis", px=3.9, cout=0.62, stock=20, photo="4-boite-rouge-G.jpg", colis=True),
    dict(id="pack", nom="Pack de Noël", d="Boîte à ruban (vert ou bleu nuit) + sac de Noël + étiquette · part en colis", px=5.9, barre=6.8, cout=2.15, stock=20, photo="2-sac-M.jpg", colis=True, couleurs=True, meil=True),
]
# « Convient si le bijou est… » (gérant, 28/10 soir : « la grosse boîte… si ça rentre pas il faut pas le mettre ») : règle par défaut d'après les
# dimensions (il coche / décoche dans Gestion). seul = bijou nu ou en microfibre · sac = dans le sac cadeau beige · carree = boîte carrée 9 × 9 (colliers) ·
# allongee = boîte allongée (bracelets, taille à mesurer) · pack = Pack boîte cadeau (sac + boîte + microfibre).
FIT = dict(sachet=dict(seul=True), pochette=dict(seul=True), sac=dict(seul=True, sac=True, carree=True), ruban=dict(seul=True), rouge=dict(seul=True), pack=dict(seul=True))
POIDS = dict(sachet=5, pochette=20, sac=25, ruban=60, rouge=45, pack=90)  # grammes ESTIMÉS (rien n'est pesé) : le port du site se calcule au poids
for e in EMB_NOEL:
    e["poids"] = POIDS[e["id"]]
for e in EMB_NOEL:
    e["fit"] = {k: bool(FIT[e["id"]].get(k)) for k in ("seul", "sac", "carree", "allongee", "pack")}
ETIQUETTE = dict(nom="Étiquette rouge « Merry Christmas » + ficelle", d="5,4 × 9 cm · offerte avec chaque emballage de Noël", cout=0.05, stock=50, photo="6-etiquettes-I.jpg")
COULEURS_RUBAN = [("vert", "Vert sapin", "3-5-boite-ruban-C-vert-recadree.jpg"), ("bleu", "Bleu nuit", "3-5-boite-ruban-J-bleu.jpg")]
for e in EMB_NOEL:
    e["src"] = uri(os.path.join(EMB_DIR, e["photo"]), 420, 78)
ETIQUETTE["src"] = uri(os.path.join(EMB_DIR, ETIQUETTE["photo"]), 420, 78)
COULEURS_JS = [dict(id=i, nom=n, src=uri(os.path.join(EMB_DIR, f), 300, 78)) for i, n, f in COULEURS_RUBAN]

PRODUITS = [  # (nom, coché, note) — seulement des produits GRAVÉS ; jamais bijoux ni mariage (règle du gérant)
    ("Verre à vin gravé (36 et 47 cl)", True, ""), ("Flûte à champagne gravée", True, ""), ("Verre à whisky portrait", True, ""),
    ("Verre tumbler en cristal", True, ""), ("Verre à cocktail", True, ""), ("Carafe à whisky", True, ""),
    ("Cristal photo 3D vertical", True, "images de Noël proposées parmi les dessins"), ("Cristal photo 3D horizontal", True, ""),
    ("Cristaux déjà gravés", True, "les modèles Noël existants restent toute l'année"),
    ("Support téléphone en bois gravé", True, ""), ("Support téléphone en bois ajouré", True, ""),
    ("Verre à whisky « fête des pères »", False, "modèles de papa, pas de Noël"), ("Porte-clés cuir à graver", False, "à vous de dire"),
    ("Pièce ronde laiton", False, "à vous de dire"), ("Puzzle photo gravé", False, "à vous de dire"), ("Marque-pages gravés", False, "à vous de dire"),
]

# ------------------------------------------------------------------ la fiche RÉELLE du verre à vin (capture en ligne)
src = open(capture, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
b0 = src.find(">", src.find("<body")) + 1
im_, jm_ = src.find("<main"), src.find("</main>") + len("</main>")
header, main, footer = src[b0:im_], src[im_:jm_], src[jm_:src.rfind("</body>")]


def local_src(m):
    p = os.path.join(PUB, m.group(1).lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith(".png") and "motif" not in p and "alphabet" not in p:
        return f'src="{raw_uri(p)}"'
    return f'src="{uri(p, 640 if "catalogue" not in p else 420)}"'


def neutralise(part):
    part = re.sub(r'src="(/[^"]+)"', local_src, part)
    part = re.sub(r'<button[^>]*>💬 Une question \?</button>', "", part)
    return re.sub(r'href="/[^"]*"', 'href="#"', part)


header, footer = neutralise(header), neutralise(footer)
# le parcours est redessiné par le script (grille des modèles, Noël) ; la case emballage de Noël se glisse avant le total
main = re.sub(r'<div class="prc" id="prc">.*?</div><div class="pd-totbox">', '<div class="prc" id="prc"></div><div id="ft-emb"></div><div class="pd-totbox">', main, count=1, flags=re.S)
assert 'id="ft-emb"' in main, "parcours introuvable dans la capture"
main = main.replace('<main>', '<main class="ft-fiche">', 1)
main = neutralise(main)
main = re.sub(r'<button class="btn btn-gold prc-off" style="flex:1" disabled="">Ajouter au panier</button>',
              '<button class="btn btn-gold prc-off" id="ft-add" style="flex:1" disabled="">Ajouter au panier</button>', main)
assert 'id="ft-add"' in main, "bouton panier introuvable"

# ------------------------------------------------------------------ la fiche RÉELLE du collier cœur gravé (capture en ligne) : le bloc « Votre emballage » est redessiné
srcb = open(capture_bijou, encoding="utf-8").read()
srcb = re.sub(r"<script\b.*?</script>", "", srcb, flags=re.S)
b0 = srcb.find(">", srcb.find("<body")) + 1
im_, jm_ = srcb.find("<main"), srcb.find("</main>") + len("</main>")
main_b = srcb[im_:jm_]
mb = re.search(r'<div style="margin:6px 0 18px"><div style="font-weight:700;font-size:0\.95rem;margin-bottom:3px">Votre emballage</div>.*?</div></div>(?=<div class="pd-totbox">)', main_b, flags=re.S)
assert mb, "bloc « Votre emballage » introuvable dans la capture du collier"
PK_JS = []  # les emballages ACTUELS de la fiche, lus dans la capture (prix tels qu'affichés en ligne)
for btn in re.findall(r'<button type="button" style="[^"]*">(.*?)</button>', mb.group(0), flags=re.S):
    img = re.search(r'src="/api/img/([A-Za-z0-9_-]+)"', btn)
    nom = re.search(r'<strong[^>]*>(.*?)</strong>', btn, flags=re.S).group(1)
    meil = "MEILLEUR CHOIX" in nom
    nom = html.unescape(re.sub(r"<[^>]+>|<!--.*?-->|✓ |MEILLEUR CHOIX", "", nom)).strip()
    d = html.unescape(re.sub(r"<[^>]+>", "", re.search(r'font-size:0\.78rem">(.*?)</span>', btn, flags=re.S).group(1))).strip()
    prix = re.findall(r"([0-9]+,[0-9]{2})[\s\u00a0]€", btn[btn.find('<span style="margin-left:auto'):])  # le site écrit « 1,70 € » avec une espace insécable
    px = float(prix[-1].replace(",", ".")) if prix else 0.0
    barre = float(prix[0].replace(",", ".")) if len(prix) > 1 else None
    src_img = uri(os.path.join(os.path.dirname(os.path.abspath(capture_bijou)), img.group(1) + ".jpg"), 300, 78) if img and os.path.exists(os.path.join(os.path.dirname(os.path.abspath(capture_bijou)), img.group(1) + ".jpg")) else None
    bas = nom.lower()  # le nom seul : la description de « Sans emballage » parle de boîte
    cat = ("seul" if (bas.startswith("sans") or "microfibre" in bas) else "pack" if "pack" in bas else "allongee" if ("allong" in bas or "bracelet" in bas)
           else "carree" if "boîte" in bas else "sac" if "sac" in bas else "seul")
    PK_JS.append(dict(id="pk%d" % len(PK_JS), nom=nom, d=d, px=px, barre=barre, meil=meil, src=src_img, ico=None if src_img else "✖️", cat=cat))
assert len(PK_JS) >= 4 and PK_JS[0]["px"] == 0 and all(p["px"] > 0 for p in PK_JS[1:]), [(p["nom"], p["px"]) for p in PK_JS]
PRIX_BIJOU = float(re.search(r'<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val">([0-9]+,[0-9]{2})', main_b).group(1).replace(",", "."))
main_b = main_b[:mb.start()] + '<div id="ft-pk"></div>' + main_b[mb.end():]
main_b = main_b.replace('<main>', '<main class="ft-fiche">', 1)
main_b = neutralise(main_b)
# photos /api/img/<id> de la galerie du collier : lues dans le dossier de la capture si elles y sont
def api_img(m):
    p = os.path.join(os.path.dirname(os.path.abspath(capture_bijou)), m.group(1) + ".jpg")
    return f'src="{uri(p, 640)}"' if os.path.exists(p) else m.group(0)
main_b = re.sub(r'src="/api/img/([A-Za-z0-9_-]+)"', api_img, main_b)

# ------------------------------------------------------------------ vue Gestion
def sw(idn, on, label):
    return (f'<button type="button" class="ft-sw{" on" if on else ""}" role="switch" aria-checked="{"true" if on else "false"}" '
            f'data-sw="{idn}" aria-label="{html.escape(label)}"><span></span></button>')


def chip_etat(f):
    if f["on"]:
        return f'<span class="ft-chip on">Allumée · dans {f["jours"]} j</span>'
    if f["alerte"] <= AUJ:
        return '<span class="ft-chip warn">À préparer</span>'
    return f'<span class="ft-chip">Éteinte · alerte le {fr(f["alerte"])}</span>'


rows = ""
for f in FETES:
    rows += (f'<div class="ft-row{" cur" if f["k"] == "noel" else ""}" data-fete="{f["k"]}">'
             f'<div class="ft-row-ico">{f["ico"]}</div>'
             f'<div class="ft-row-main"><b>{f["nom"]}</b><small>{fr(f["date"])} · alerte 2 mois avant : {fr(f["alerte"])}</small>'
             f'<small>{f["images"]} image{"s" if f["images"] > 1 else ""} de gravure · {f["emb"]} emballage{"s" if f["emb"] > 1 else ""}</small></div>'
             f'<div class="ft-row-etat" id="etat-{f["k"]}">{chip_etat(f)}</div>'
             f'<div class="ft-row-sw">{sw(f["k"], f["on"], "Allumer " + f["nom"])}</div>'
             f'<div class="ft-row-go">{"<span class=ft-open>Ouvert ▾</span>" if f["k"] == "noel" else "<a href=# class=ft-link>Ouvrir ›</a>"}</div></div>')

prods = "".join(f'<label class="ft-prod{" on" if on else ""}"><input type="checkbox"{" checked" if on else ""}> <span>{html.escape(nm)}</span>'
                f'{"<small>" + html.escape(note) + "</small>" if note else ""}</label>' for nm, on, note in PRODUITS)

ADMIN = f"""
<div class="ash">
 <aside class="ash-side">
  <div class="ash-brand"><div class="ash-logo">NiV</div><div class="ash-brand-txt"><div class="ash-brand-t">Niv Création</div><div class="ash-brand-s">Espace gestion</div></div></div>
  <nav class="ash-nav">
   <div class="ash-group"><div class="ash-glabel">Pilotage</div><a class="ash-item" href="#"><span class="ash-ico">◫</span><span class="ash-txt">Tableau de bord</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Commandes</div><a class="ash-item" href="#"><span class="ash-ico">▤</span><span class="ash-txt">File de production</span><span class="ash-badge">3</span></a><a class="ash-item" href="#"><span class="ash-ico">◈</span><span class="ash-txt">Atelier · fichiers</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Catalogue</div><a class="ash-item" href="#"><span class="ash-ico">◧</span><span class="ash-txt">Produits &amp; stock</span></a><a class="ash-item" href="#"><span class="ash-ico">▢</span><span class="ash-txt">Emballages</span></a><a class="ash-item" href="#"><span class="ash-ico">✎</span><span class="ash-txt">Gravure</span></a></div>
   <div class="ash-group ft-navnew"><div class="ash-glabel">Fêtes <span class="ft-new">nouveau</span></div><a class="ash-item on" href="#"><span class="ash-ico">✦</span><span class="ash-txt">Fêtes de l'année</span><span class="ash-badge ft-badge-gold">1</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Marketing</div><a class="ash-item" href="#"><span class="ash-ico">▷</span><span class="ash-txt">Newsletter</span></a><a class="ash-item" href="#"><span class="ash-ico">%</span><span class="ash-txt">Promotions</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Finances</div><a class="ash-item" href="#"><span class="ash-ico">€</span><span class="ash-txt">Bénéfices</span></a></div>
  </nav>
 </aside>
 <div class="ash-main">
  <header class="ash-top">
   <div class="ash-crumb"><span class="ash-crumb-g">Fêtes</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t">Fêtes de l'année</span></div>
   <div class="ash-top-actions"><a class="ash-assist" href="#">✦ Assistant</a></div>
  </header>
  <main class="ash-content">
   <div class="ft-alert" id="ft-alert"><span class="ft-alert-ico">🎄</span><div><b>Noël dans {NOEL["jours"]} jours.</b> L'alerte est partie 2 mois avant la fête ({fr(NOEL["alerte"])}) : préparez les images de gravure, les emballages, la newsletter et les vidéos. Même alerte pour chaque fête, dans le tableau de bord et par e-mail.</div><a href="#noel" class="ft-link">Ouvrir Noël ↓</a></div>
   <h1 class="mp-h1">Fêtes de l'année</h1>
   <p class="mp-sub">Une ligne par fête. <b>Allumée</b> : ses images de gravure et ses emballages s'ajoutent aux produits gravés cochés. <b>Éteinte</b> : tout ce qui vient de la fête disparaît du site, qui redevient comme avant. Ce qui existe toute l'année ne bouge jamais.</p>
   <div class="mp-kpis">
     <div class="mp-kpi"><small>Fête allumée</small><b id="kpi-on">Noël</b></div>
     <div class="mp-kpi"><small>Prochaine alerte</small><b>{fr(FETES[1]["alerte"])}</b><span class="ft-kpi-s">Saint-Valentin</span></div>
     <div class="mp-kpi"><small>Images de Noël</small><b>25</b><span class="ft-kpi-s">numérotées 1 à 25</span></div>
     <div class="mp-kpi"><small>Emballages de Noël</small><b>2</b><span class="ft-kpi-s">prix à régler</span></div>
   </div>

   <section class="ft-card">
    <div class="ft-card-h"><h2>Les fêtes</h2><button type="button" class="btn btn-outline ft-btn">+ Ajouter une fête</button></div>
    <div class="ft-rows">{rows}</div>
   </section>

   <section class="ft-card" id="noel">
    <div class="ft-card-h"><h2>🎄 Noël <span class="ft-h2s">{fr(NOEL["date"])}</span></h2><div class="ft-swline">{sw("noel2", True, "Allumer Noël")}<span id="ft-swtxt">Allumée</span></div></div>
    <p class="ft-p" id="ft-etat-txt"></p>
    <div class="ft-dates">
      <div><small>La fête</small><b>{fr(NOEL["date"])}</b></div>
      <div><small>Alerte 2 mois avant</small><b>{fr(NOEL["alerte"])}</b><span class="ft-ok">✓ envoyée</span></div>
      <div><small>Extinction</small><b>Par vous, d'un clic</b><label class="ft-mini"><input type="checkbox"> s'éteindre toute seule le lendemain <i>(proposition)</i></label></div>
    </div>

    <h3 class="ft-h3">Produits concernés <span class="ft-h3s">seulement des produits gravés · jamais les bijoux ni le mariage</span></h3>
    <div class="ft-prods">{prods}</div>

    <h3 class="ft-h3">Images de gravure de Noël <span class="ft-h3s">25 · le client les choisit par leur numéro, comme les autres modèles</span></h3>
    <div class="ft-bar"><span id="ft-cnt"></span><button type="button" class="btn btn-outline ft-btn">+ Ajouter des images</button></div>
    <p class="ft-p ft-note">Prix proposé d'après votre règle « tout texte gravé est payant » : une image qui contient un texte (« Merry Christmas », les mots de Noël 17 à 25) est à <b>+3 €</b>, un dessin seul est <b>offert</b> comme un modèle. Vous changez chaque ligne ; <b>rien n'est décidé</b>.</p>
    <div class="ft-imgs" id="ft-imgs"></div>

    <h3 class="ft-h3">Emballages de Noël <span class="ft-h3s">pour les BIJOUX · s'ajoutent sous « Votre emballage » de chaque fiche bijou, en plus des emballages habituels</span></h3>
    <p class="ft-p ft-note">Vos emballages Temu reçus le 28/10, aux <b>prix que vous avez validés</b>. Le coût rendu comprend la part du port ; le stock = les quantités reçues, il baisse à chaque commande comme dans Matériel &amp; emballages. L'étiquette rouge est <b>offerte</b> avec chaque emballage de Noël. Le bijou — ou sa boîte habituelle — va <b>dans</b> l'emballage de Noël : cochez dans quoi chaque emballage accepte le bijou ; <b>ce qui ne rentre pas n'est pas proposé</b> à la cliente (une boîte allongée ne tient dans aucun sachet). Sur la fiche, le bloc de Noël est <b>replié</b> : une ligne « Ajouter un emballage de Noël », qui s'ouvre d'un clic. Une boîte rigide part en colis (règle du site) ; sachet et pochette restent en lettre suivie. Regardez l'onglet ③ : la fiche du collier suit ces réglages en direct.</p>
    <div class="ft-port"><b>📦 Livraison, prise en compte comme pour vos emballages actuels</b> (règle du site, rien ne change) :
     <ul><li><b>sachet, pochette, sac de Noël</b> (plat, moins de 3 cm) → le bijou reste en <b>lettre suivie</b> : la cliente paie 4,90 € jusqu'à 100 g (6,50 € de 100 à 250 g), vous payez La Poste ≈ 4,45 € (5,77 €) ;</li>
     <li><b>boîte à ruban, boîte rouge, pack</b> (boîte rigide) → <b>petit colis</b>, comme votre boîte cadeau d'aujourd'hui : la cliente paie 6,90 € à domicile ou 4,90 € en point relais, vous payez Boxtal ≈ 6,12 € (relais ≈ 3,77 €) ;</li>
     <li>dès <b>45 €</b> de bijoux, la livraison reste <b>offerte</b> (en lettre comme en boîte, promesse du site) : c'est vous qui payez le port, le prix de l'emballage de Noël doit donc couvrir sa marge seul — c'est le cas pour tous (marge ≥ 0,77 €) ;</li>
     <li>le port se calcule au <b>poids</b> : le site compte 72 g par bijou + l'emballage. Les grammes ci-dessous sont <b>estimés, à peser</b> ; un bijou en microfibre (15 g) + pochette (≈ 20 g) frôle les 100 g → si la balance confirme, soit on baisse le poids déclaré de la pochette, soit la cliente paie 6,50 € au lieu de 4,90 €.</li></ul>
     Sur la fiche, chaque emballage de Noël dit s'il part en lettre ou en colis, et le bloc de Noël rappelle le prix de livraison correspondant.</div>
    <div class="ft-embs" id="ft-embs"></div>

    <h3 class="ft-h3">Déjà sur le site toute l'année <span class="ft-h3s">liés à Noël, mais jamais retirés quand Noël s'éteint</span></h3>
    <div class="ft-perm" id="ft-perm"></div>
    <p class="ft-p ft-note">Aussi en permanence, avec leur propre interrupteur dans Apparence : le bandeau Noël de l'accueil et la page « Idées de Noël ». Question : faut-il les relier à cet interrupteur-ci, ou les laisser à part comme aujourd'hui ?</p>
   </section>
  </main>
 </div>
</div>
"""

PAGE_CSS = r"""
:root{--font-display:'Playfair Display',Georgia,serif;--font-body:'Inter',system-ui,sans-serif;--font-cinzel:'Cinzel',serif;--font-cinzel-deco:'Cinzel Decorative',serif;--font-montserrat:'Montserrat',sans-serif;--font-great-vibes:'Great Vibes',cursive;--font-allura:'Allura',cursive;--font-pacifico:'Pacifico',cursive;color-scheme:light}
html,body{background:#f4f1ea;margin:0}
body{font-family:var(--font-body);color:var(--ink)}
#ft-app{display:block}
.ft-banner{background:#1d1811;color:#f1e3b8;font-size:.78rem;padding:8px 14px;text-align:center;line-height:1.45}
.ft-banner b{color:#d6b25a}
.ft-tabs{position:sticky;top:0;z-index:50;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;background:#2b2620;border-bottom:1px solid #4a4036}
.ft-tabs button{border:0;border-radius:9px;padding:9px 13px;min-height:44px;font:600 .86rem var(--font-body);background:transparent;color:#d9cfbd;cursor:pointer}
.ft-tabs button.on{background:#f1e3b8;color:#1d1811}
.ft-tabs .ft-sync{margin-left:auto;display:flex;align-items:center;gap:8px;color:#f1e3b8;font-size:.82rem;white-space:nowrap}
@media (max-width:640px){.ft-tabs{flex-wrap:nowrap;overflow-x:auto;gap:4px;padding:6px 8px;scrollbar-width:none}.ft-tabs::-webkit-scrollbar{display:none}.ft-tabs button{white-space:nowrap;padding:8px 10px;font-size:.8rem;flex:0 0 auto}.ft-tabs .ft-sync{flex:0 0 auto;padding-left:6px}}
.ft-view{display:none}.ft-view.on{display:block}
.mp-h1{font-family:var(--font-display);font-size:1.5rem;margin:0 0 4px}
.mp-sub{color:var(--ink-soft);font-size:.9rem;margin:0 0 16px;line-height:1.5}
.mp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 18px}
.mp-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.mp-kpi small{display:block;color:var(--ink-soft);font-size:.74rem;text-transform:uppercase;letter-spacing:.05em}
.mp-kpi b{font-size:1.15rem;font-variant-numeric:tabular-nums;display:block}
.ft-kpi-s{font-size:.76rem;color:var(--ink-soft)}
.ft-navnew .ash-glabel{color:#e2c67e}
.ft-new{font-size:.6rem;background:#c2a14e;color:#1d1811;border-radius:99px;padding:1px 6px;margin-left:6px;vertical-align:middle;letter-spacing:0}
.ft-badge-gold{background:#c2a14e!important;color:#1d1811!important}
.ft-alert{display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:linear-gradient(90deg,#7a1512,#a8302a);color:#fff;border-radius:14px;padding:12px 16px;margin:0 0 16px;font-size:.88rem;line-height:1.45}
.ft-alert-ico{font-size:1.5rem}.ft-alert>div{flex:1 1 320px;min-width:0}
.ft-alert .ft-link{color:#f1e3b8;font-weight:700;white-space:nowrap}
.ft-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;margin:0 0 16px}
.ft-card-h{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.ft-card h2{font-family:var(--font-display);font-size:1.25rem;margin:0}
.ft-h2s{font:500 .82rem var(--font-body);color:var(--ink-soft);margin-left:8px}
.ft-btn{min-height:40px;padding:8px 14px;font-size:.84rem}
.ft-rows{display:grid;gap:8px}
.ft-row{display:grid;grid-template-columns:40px minmax(0,1fr) auto auto auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fffdf9}
.ft-row.cur{border-color:#c2a14e;box-shadow:0 0 0 2px rgba(194,161,78,.18)}
.ft-row-ico{font-size:1.4rem;text-align:center}
.ft-row-main{min-width:0}.ft-row-main b{display:block;font-size:.95rem}.ft-row-main small{display:block;color:var(--ink-soft);font-size:.76rem;line-height:1.35}
.ft-chip{display:inline-block;font-size:.72rem;font-weight:700;padding:4px 9px;border-radius:99px;background:#efe6d6;color:#5a5247;white-space:nowrap}
.ft-chip.on{background:#dff1e0;color:#1f6b2c}.ft-chip.warn{background:#fdebd0;color:#8a4b00}
.ft-link{color:var(--gold-dark);font-weight:700;text-decoration:none;font-size:.86rem}.ft-open{font-size:.82rem;color:var(--ink-soft)}
.ft-sw{position:relative;width:48px;height:28px;border-radius:99px;border:0;background:#cfc5b4;cursor:pointer;padding:0;flex:0 0 auto}
.ft-sw span{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s}
.ft-sw.on{background:#2f7d3a}.ft-sw.on span{left:23px}
.ft-swline{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.9rem}
.ft-p{font-size:.88rem;line-height:1.5;color:var(--ink);margin:0 0 10px}
.ft-note{color:var(--ink-soft);font-size:.82rem}
.ft-dates{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:0 0 14px}
.ft-dates>div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fffdf9}
.ft-dates small{display:block;color:var(--ink-soft);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}
.ft-dates b{display:block;font-size:.92rem;margin:2px 0}
.ft-ok{font-size:.76rem;color:#1f6b2c;font-weight:700}
.ft-mini{display:block;font-size:.76rem;color:var(--ink-soft);margin-top:4px}.ft-mini i{color:#8a4b00;font-style:normal;font-weight:700}
.ft-h3{font-family:var(--font-display);font-size:1.05rem;margin:18px 0 8px;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}
.ft-h3s{font:500 .78rem var(--font-body);color:var(--ink-soft)}
.ft-prods{display:flex;flex-wrap:wrap;gap:8px}
.ft-prod{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:99px;padding:7px 12px 7px 9px;font-size:.82rem;background:#fff;cursor:pointer;min-height:40px}
.ft-prod.on{border-color:#c2a14e;background:#fffaf0}
.ft-prod input{width:18px;height:18px;accent-color:#a98935;margin:0}
.ft-prod small{color:var(--ink-soft);font-size:.72rem}
.ft-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 8px;font-size:.84rem;color:var(--ink-soft)}
.ft-imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ft-img{position:relative;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden;display:flex;flex-direction:column}
.ft-img .ph{position:relative;height:0;padding-bottom:100%;background:#efe6d6}
.ft-img .ph img{position:absolute;top:9%;left:9%;width:82%;height:82%;object-fit:contain;mix-blend-mode:multiply}
.prc-model .prc-mimg{position:relative;height:0;padding-bottom:100%}
.prc-model .prc-mimg img{position:absolute;top:10%;left:10%;width:80%;height:80%;object-fit:contain}
.ft-num{position:absolute;top:7px;left:7px;background:#a8302a;color:#fff;font-size:.7rem;font-weight:800;border-radius:999px;padding:2px 8px}
.ft-img .tx{padding:8px 9px 9px;display:grid;gap:5px}
.ft-img .tx b{font-size:.78rem;line-height:1.25}
.ft-img select{width:100%;font:600 .76rem var(--font-body);border:1px solid var(--line);border-radius:8px;padding:6px 7px;background:#fff;min-height:36px;box-sizing:border-box;min-width:0}
.ft-flag{font-size:.66rem;font-weight:700;border-radius:99px;padding:2px 7px;display:inline-block;margin-right:3px}
.ft-flag.t{background:#f3e6c2;color:#7a5a12}.ft-flag.d{background:#fde0de;color:#a8302a}.ft-flag.g{background:#e6e3f7;color:#4b3f9c}
.ft-embs{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px}
.ft-emb{display:flex;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fffdf9;min-width:0}
.ft-emb-ph{flex:0 0 76px;height:76px;border-radius:10px;border:1px dashed #cdb26a;background:#fffaf0;display:grid;place-items:center;align-content:center;color:#9c6b3f;font-size:1.2rem;text-align:center}
.ft-emb-ph small{display:block;font-size:.62rem;color:var(--ink-soft)}
.ft-emb-b{min-width:0;flex:1}.ft-emb-b b{display:block;font-size:.92rem;margin-bottom:6px}.ft-emb-b small{display:block;color:var(--ink-soft);font-size:.72rem;margin-top:5px}
.ft-emb-l{display:flex;gap:8px;flex-wrap:wrap}
.ft-emb-l label{font-size:.74rem;color:var(--ink-soft);display:grid;gap:2px}
.ft-emb-l select,.ft-emb-l input{font:600 .8rem var(--font-body);border:1px solid var(--line);border-radius:8px;padding:6px 8px;min-height:36px;box-sizing:border-box;background:#fff;width:100px;min-width:0}
.ft-emb-add{justify-content:center;align-items:center;border-style:dashed;color:var(--gold-dark);font:700 .86rem var(--font-body);cursor:pointer;min-height:96px}
.ft-perm{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.ft-perm>div{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:8px;background:#fffdf9}
.ft-perm img{width:64px;height:64px;object-fit:cover;border-radius:8px;flex:0 0 auto}
.ft-perm b{display:block;font-size:.84rem}.ft-perm small{color:var(--ink-soft);font-size:.72rem;line-height:1.3}
/* ---- côté site */
.ft-site .site-header{position:static}
.ft-sitebar{position:sticky;top:60px;z-index:40;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#fffaf0;border-bottom:1px solid #e6d7aa;padding:8px 14px;font-size:.84rem}
.ft-sitebar b{color:#7a1512}
.ft-tag{position:absolute;top:6px;right:6px;background:#a8302a;color:#fff;font-size:.62rem;font-weight:800;border-radius:99px;padding:2px 7px}
.prc-card{position:relative}
.prc-model .prc-mn{z-index:2}
.prc-model.noel .prc-mn{background:#a8302a}
.prc-model.noel.on .prc-mn{background:#7a1512}
.prc-chip.noel{border-color:#a8302a;color:#a8302a}.prc-chip.noel.on{background:#a8302a;color:#fff}
.prc-card.noel{border-color:#e4b9b5;background:#fff8f6}.prc-card.noel.on{border-color:#a8302a;box-shadow:0 0 0 2px rgba(168,48,42,.18)}
.prc-step.prc-noel .prc-mode{border:1.5px solid #e4b9b5;background:#fff8f6;border-radius:14px;padding:12px}
.ft-embn{display:flex;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fffdf9;min-width:0;position:relative}
.ft-embn.pk{grid-column:1/-1;background:linear-gradient(180deg,#fffaf0,#fff);border-color:#cdb26a}
.ft-embn img{flex:0 0 76px;width:76px;height:76px;object-fit:cover;border-radius:10px;border:1px solid var(--line);background:#fff}
.ft-embn .b{min-width:0;flex:1}.ft-embn .b b{display:block;font-size:.92rem;margin-bottom:2px}.ft-embn .b small{display:block;color:var(--ink-soft);font-size:.72rem;margin-top:4px}
.ft-embn .d{color:var(--ink-soft);font-size:.74rem;margin-bottom:6px}
.ft-embn .marge{font-size:.72rem;color:#1c6b3a;font-weight:600}
.ft-embn .etq{position:absolute;top:8px;right:8px;background:#b3261e;color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.3px;border-radius:20px;padding:2px 8px}
.ft-embn .etq.off{background:#1c6b3a}
.ft-embn .etq~.b b{padding-right:64px}
.ft-embn .coul{display:flex;gap:6px;margin-top:6px}.ft-embn .coul img{width:34px;height:34px;flex:0 0 34px;border-radius:8px}
.ft-embc{margin:6px 0 18px}
.ft-embc .sep{display:flex;align-items:center;gap:10px;color:#b3261e;font-weight:800;font-size:.8rem;letter-spacing:.3px;margin:4px 0 0}
.ft-embc .sep:before,.ft-embc .sep:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#d9b7b4)}.ft-embc .sep:after{background:linear-gradient(90deg,#d9b7b4,transparent)}
.ft-embc .th{flex:0 0 40px;width:40px;height:40px;border-radius:8px;object-fit:cover;display:block}
.ft-embc .meil{display:inline-block;white-space:nowrap;background:var(--gold);color:#1a1206;font-size:.6rem;font-weight:800;letter-spacing:.2px;border-radius:20px;padding:2px 8px;margin-left:6px;vertical-align:middle}
.ft-embc .meil.noel{background:#b3261e;color:#fff}
.ft-embc .barre{color:var(--ink-soft);text-decoration:line-through;font-weight:400;font-size:.78rem;margin-right:5px}
.ft-embc .etqoff{margin:2px 0 0;font-size:.78rem;color:#1c6b3a;display:flex;align-items:center;gap:8px}.ft-embc .etqoff img{width:30px;height:30px;border-radius:6px;object-fit:cover}
.ft-embc .couleur{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:.8rem;color:var(--ink-soft);margin-top:2px}
.ft-embc .couleur button{width:auto;display:inline-flex;gap:6px;align-items:center;padding:5px 9px;border-radius:10px;font-size:.78rem}.ft-embc .couleur button img{width:26px;height:26px;border-radius:6px;object-fit:cover}
.ft-embc .colis{font-size:.72rem;color:var(--ink-soft);font-weight:400;display:block}
.xn-tog{display:flex;align-items:center;gap:11px;text-align:left;cursor:pointer;font:inherit;width:100%;box-sizing:border-box;margin:-8px 0 18px;padding:11px 13px;border-radius:12px;border:1.5px dashed #c98c86;background:#fff8f6;color:var(--ink)}
.xn-tog.on{border-style:solid;border-color:#b3261e;background:#fff3f0}
.xn-tog .ico{font-size:1.3rem}.xn-tog strong{display:block;font-size:.9rem}.xn-tog .d{color:var(--ink-soft);font-size:.78rem;display:block}
.xn-tog .px{margin-left:auto;font-weight:700;font-size:.85rem;white-space:nowrap;text-align:right}.xn-tog .px i{display:block;font-style:normal;font-weight:600;font-size:.74rem;color:#b3261e}
.xn-tog .th{flex:0 0 40px;width:40px;height:40px;border-radius:8px;object-fit:cover}
.ft-embc.xn{border:1.5px solid #e4c4c0;background:#fff8f6;border-radius:14px;padding:12px;margin-top:-8px}
.ft-embc.xn .t{display:flex;align-items:center;gap:8px}.ft-embc .xn-close{margin-left:auto;flex:0 0 auto;width:auto;padding:5px 9px;font-size:.74rem;font-weight:600;border-radius:9px;min-height:0;color:var(--ink-soft)}
.xn-no{margin:-8px 0 18px;font-size:.8rem;color:var(--ink-soft)}
.xn-port{margin:8px 0 0;font-size:.8rem;color:var(--ink);background:#fff;border:1px solid #e9d9d6;border-radius:10px;padding:8px 10px}
.ft-embn .port{font-size:.72rem;color:var(--ink);margin-top:6px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:5px 8px}.ft-embn .port i{color:var(--ink-soft)}
.ft-embn .port b{display:inline;font-size:inherit;margin:0}
.ft-port{font-size:.82rem;color:var(--ink);background:#fff;border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:12px;padding:10px 14px;margin:0 0 12px}.ft-port ul{margin:6px 0 0;padding-left:18px}.ft-port li{margin:3px 0}
.ft-embn .fit{margin-top:7px;display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center}.ft-embn .fit small{width:100%;margin:0 0 1px;color:var(--ink);font-weight:600}
.ft-embn .fit label{font-size:.7rem;color:var(--ink-soft);border:1px solid var(--line);border-radius:20px;padding:3px 8px;display:inline-flex;gap:4px;align-items:center;cursor:pointer;background:#fff}
.ft-embn .fit label.on{border-color:#1c6b3a;color:#1c6b3a;background:#eef7f0}.ft-embn .fit input{margin:0;width:13px;height:13px}
.ft-embc .t{font-weight:700;font-size:.95rem;margin-bottom:3px}
.ft-embc .s{margin:0 0 10px;color:var(--ink-soft);font-size:.83rem}
.ft-embc .opts{display:grid;gap:9px}
.ft-embc button{display:flex;align-items:center;gap:11px;text-align:left;cursor:pointer;font:inherit;border:1.5px solid var(--line);background:var(--paper);border-radius:12px;padding:11px 13px;color:var(--ink);width:100%;box-sizing:border-box}
.ft-embc button.on{border-color:var(--gold);background:#fffaf0;box-shadow:0 0 0 2px rgba(194,161,78,.22)}
.ft-embc .ico{font-size:1.3rem;flex:0 0 auto}
.ft-embc strong{display:block;font-size:.9rem}.ft-embc .d{color:var(--ink-soft);font-size:.78rem}
.ft-embc .px{margin-left:auto;font-weight:700;font-size:.85rem;white-space:nowrap}
.ft-ex{font-style:normal;font-size:.62rem;font-weight:800;color:#a8302a;border:1px solid #a8302a;border-radius:99px;padding:1px 6px;margin-left:5px;vertical-align:middle}
.prc-field{margin:10px 0 0}.prc-field label{display:block;font-size:.82rem;font-weight:600;margin-bottom:4px}
.prc-field input{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;background:#fff;min-height:44px}
@media (max-width:720px){
 .ft-row{grid-template-columns:34px minmax(0,1fr) auto;grid-template-areas:"ico main sw" "ico etat go"}
 .ft-row-ico{grid-area:ico}.ft-row-main{grid-area:main}.ft-row-etat{grid-area:etat}.ft-row-sw{grid-area:sw}.ft-row-go{grid-area:go;text-align:right}
 .ft-sitebar{top:0}
}
"""

JS = r"""
(function(){
var NOEL=__NOEL__, VIN=__VIN__, GROUPES=__GROUPES__, CRISTAUX=__CRISTAUX__, PRIX=__PRIX__, EXTRA=__EXTRA__;
var EMB=__EMB__, ETQ=__ETQ__, PK=__PK__, PRIX_BIJOU=__PRIX_BIJOU__, COUL=__COUL__;
var FITS=[['seul','bijou seul / microfibre'],['sac','sac cadeau'],['carree','boîte carrée (colliers)'],['allongee','boîte allongée (bracelets)'],['pack','Pack boîte cadeau']];
var S={noel:true,mode:null,model:null,prenom:'',filtre:'all',ouverte:true,view:'admin',pk:'pk0',xn:'none',xnOpen:false,couleur:'vert'};
function eur(n){return n.toFixed(2).replace('.',',')+' €'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
/* ---------- état partagé Noël allumé / éteint */
function setNoel(on){
  S.noel=on;
  if(!on && S.model && S.model.src==='noel'){S.model=null;S.prenom='';}
  if(!on && S.mode==='noel'){S.mode=null;S.filtre='all';}
  if(!on){S.xn='none';S.xnOpen=false;}
  if(S.filtre==='noel'&&!on)S.filtre='all';
  $$('[data-sw="noel"],[data-sw="noel2"],[data-sw="sync"]').forEach(function(b){b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false')});
  $('#ft-swtxt').textContent=on?'Allumée':'Éteinte';
  $('#etat-noel').innerHTML=on?'<span class="ft-chip on">Allumée · dans '+__JOURS__+' j</span>':'<span class="ft-chip">Éteinte · se rallume d’un clic</span>';
  $('#kpi-on').textContent=on?'Noël':'Aucune';
  $('#ft-etat-txt').innerHTML=on
    ?'<b>Allumée.</b> Sur les produits cochés, l’étape « Que voulez-vous graver ? » a une carte À PART <b>« 🎄 Un modèle de Noël »</b> (les 25 images numérotées, jamais mélangées aux modèles habituels), et sur chaque bijou les <b>emballages de Noël</b> s’ajoutent sous « Votre emballage ». Regardez les onglets ② et ③ : ils suivent cet interrupteur en direct.'
    :'<b>Éteinte.</b> Plus de carte « Un modèle de Noël », plus aucune image de Noël, plus d’emballage de Noël sur les bijoux : les fiches sont redevenues comme avant, à l’identique. Les images et les réglages sont gardés ici pour l’an prochain.';
  $$('.ft-synctxt').forEach(function(e){e.textContent=on?'allumé':'éteint'});
  renderSite();renderBijou();
}
/* ---------- Gestion : images numérotées, cristaux permanents */
function renderAdmin(){
  $('#ft-imgs').innerHTML=NOEL.map(function(m){
    var flags='';
    if(m.mots)flags+='<span class="ft-flag t">mots de Noël</span>';else if(m.texte)flags+='<span class="ft-flag t">texte dans l’image</span>';
    if(m.droits)flags+='<span class="ft-flag d">⚠ personnage protégé</span>';
    if(m.gris)flags+='<span class="ft-flag g">niveaux de gris</span>';
    return '<div class="ft-img"><span class="ft-num">Noël n° '+m.n+'</span><div class="ph"><img src="'+m.src+'" alt=""></div><div class="tx"><b>'+esc(m.nom)+'</b>'+(flags?'<span>'+flags+'</span>':'')+
      '<select data-prix="'+m.n+'"><option value="0"'+(m.prix===0?' selected':'')+'>Offerte (comme un modèle)</option><option value="3"'+(m.prix===3?' selected':'')+'>+3 € (comme un texte)</option><option value="-1">Masquée</option></select></div></div>';
  }).join('');
  $('#ft-perm').innerHTML=CRISTAUX.map(function(c){return '<div><img src="'+c.src+'" alt=""><div><b>🔒 '+esc(c.nom)+'</b><small>Cristal déjà gravé, famille Noël. Reste en ligne toute l’année ; mis en avant pendant Noël.</small></div></div>'}).join('');
  compteur();
}
function compteur(){
  var o=0,p=0,m=0; NOEL.forEach(function(x){if(x.prix===0)o++;else if(x.prix===3)p++;else m++});
  $('#ft-cnt').innerHTML='<b>'+o+'</b> offertes · <b>'+p+'</b> à +3 € · <b>'+m+'</b> masquée'+(m>1?'s':'')+' · 3 images avec un personnage protégé à trancher';
}
/* ---------- Site : le parcours du verre à vin, redessiné comme ParcoursGuide.jsx */
function legNoel(m){return m.mots?'Mots de Noël (+ prénom si vous voulez)':'Dessin de Noël (+ prénom si vous voulez)'}
function tile(m,noel){
  var on=S.model&&S.model.src===(noel?'noel':'vin')&&S.model.n===m.n;
  var g=noel?(m.mots?'mots':'dessins'):(GROUPES.find(function(x){return x.nums.indexOf(m.n)>=0})||{}).key;
  var hide=S.filtre!=='all'&&g!==S.filtre;
  return '<button type="button" class="prc-model'+(noel?' noel':'')+(on?' on':'')+(hide?' hide':'')+'" data-src="'+(noel?'noel':'vin')+'" data-n="'+m.n+'" aria-label="Modèle '+(noel?'Noël ':'')+'n° '+m.n+'">'+
    '<span class="prc-mn">'+(noel?'Noël ':'')+'n° '+m.n+'</span><span class="prc-mimg"><img src="'+m.src+'" alt="" loading="lazy"></span><span class="prc-ml">'+esc(noel?legNoel(m):m.legende)+'</span></button>';
}
function modele(){
  if(!S.model)return null;
  return S.model.src==='noel'?NOEL.find(function(m){return m.n===S.model.n}):VIN.find(function(m){return m.n===S.model.n});
}
function total(){var t=PRIX;if(S.prenom.trim())t+=EXTRA;return t}
function renderSite(){
  var noelVisibles=S.noel?NOEL.filter(function(m){return m.prix>=0}):[];
  var nb=VIN.length, nbTot=nb+noelVisibles.length;
  var h='<div class="prc-head"><p class="prc-title">Personnalisez votre verre</p><p class="prc-sub">3 petites étapes : dites-nous quoi graver, nous faisons le reste.</p></div>';
  h+='<section class="prc-step"><div class="prc-sh"><span class="prc-num'+(S.mode?' done':'')+'">1</span><h3>Que voulez-vous graver ?</h3></div><div class="prc-cards">';
  h+='<button type="button" class="prc-card'+(S.mode==='modele'?' on':'')+'" data-mode="modele"><span class="prc-cimg"><img src="'+VIN[4].src+'" alt=""></span><span class="prc-ctxt"><b>Un modèle décoré</b><small>'+nb+' modèles numérotés, avec vos prénoms si vous voulez.</small></span></button>';
  if(S.noel)h+='<button type="button" class="prc-card noel'+(S.mode==='noel'?' on':'')+'" data-mode="noel"><span class="ft-tag">🎄 Noël</span><span class="prc-cimg"><img src="'+NOEL[2].src+'" alt=""></span><span class="prc-ctxt"><b>Un modèle de Noël</b><small>'+noelVisibles.length+' dessins et mots de Noël numérotés, avec vos prénoms si vous voulez.</small></span></button>';
  h+='<button type="button" class="prc-card" data-mode="autre"><span class="prc-cimg prc-cimg-alpha"><img src="'+__ALPHA__+'" alt=""></span><span class="prc-ctxt"><b>Une lettre fleurie</b><small>Votre initiale dans un style fleuri, avec un prénom au milieu si vous le souhaitez.</small></span></button>';
  h+='<button type="button" class="prc-card" data-mode="autre"><span class="prc-cimg prc-cimg-aa"><span class="fnt-great-vibes">Aa</span></span><span class="prc-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un petit message — dans l’écriture de votre choix. Sans dessin, juste le texte.</small></span></button>';
  h+='<button type="button" class="prc-card" data-mode="autre"><span class="prc-cimg"><span class="prc-cimg-ph" aria-hidden="true">📷</span></span><span class="prc-ctxt"><b>Ma photo ou mon logo</b><small>Envoyez votre photo, un dessin ou le logo de votre entreprise : nous le gravons sur le verre.</small></span></button>';
  h+='</div><p class="prc-hint">Un seul choix par verre. Vous pouvez changer d’avis à tout moment.</p></section>';
  var M=modele();
  if(S.mode==='modele'||S.mode==='noel'){
    var replie=!!M&&!S.ouverte, isN=S.mode==='noel';
    h+='<section class="prc-step'+(isN?' prc-noel':'')+'" id="prc-s2"><div class="prc-sh"><span class="prc-num'+(M?' done':'')+'">2</span><h3>'+(isN?'🎄 Votre modèle de Noël':'Votre modèle')+'</h3></div><div class="prc-mode">';
    if(isN){
      var nbD=noelVisibles.filter(function(m){return !m.mots}).length, nbM=noelVisibles.length-nbD;
      h+='<div class="prc-chips"><button type="button" class="prc-chip'+(S.filtre==='all'?' on':'')+'" data-f="all">Tous (Noël 1–'+noelVisibles.length+')</button><button type="button" class="prc-chip'+(S.filtre==='dessins'?' on':'')+'" data-f="dessins">Dessins ('+nbD+')</button><button type="button" class="prc-chip'+(S.filtre==='mots'?' on':'')+'" data-f="mots">Mots de Noël ('+nbM+')</button></div>';
      h+='<p class="prc-legend">Les modèles de Noël ont leurs propres numéros (« Noël n° 1 » à « Noël n° '+noelVisibles.length+' »). Sous chacun : un dessin seul est offert, un dessin avec un texte est à +3 €. Ajoutez un prénom si vous voulez.</p>';
      h+='<div class="prc-one"><div><div class="prc-grid'+(replie?' picked':'')+'">'+noelVisibles.map(function(m){return tile(m,true)}).join('')+'</div>';
      if(replie)h+='<button type="button" class="prc-change" id="prc-change">← Changer de modèle de Noël (voir les '+noelVisibles.length+')</button>';
    }else{
      h+='<div class="prc-chips"><button type="button" class="prc-chip'+(S.filtre==='all'?' on':'')+'" data-f="all">Tous (1–'+nb+')</button>';
      GROUPES.forEach(function(g){h+='<button type="button" class="prc-chip'+(S.filtre===g.key?' on':'')+'" data-f="'+g.key+'">'+esc(g.label)+'</button>'});
      h+='</div><p class="prc-legend">Sous chaque modèle : ce que vous pouvez nous indiquer (rien n’est obligatoire). Les prénoms et dates que vous voyez sont des exemples : vous mettez les vôtres, dans la même écriture.</p>';
      h+='<div class="prc-one"><div><div class="prc-grid'+(replie?' picked':'')+'">'+VIN.map(function(m){return tile(m,false)}).join('')+'</div>';
      if(replie)h+='<button type="button" class="prc-change" id="prc-change">← Changer de modèle (voir les '+nb+')</button>';
    }
    h+='</div></div>';
    if(M){
      var lab=S.model.src==='noel'?'Modèle de Noël n° '+M.n:'Modèle n° '+M.n;
      h+='<p class="prc-choisi">'+lab+' choisi ✓ — indiquez ce que vous voulez y faire graver (facultatif), dans la même écriture. Regardez la grande photo en haut : il s’y pose.</p>';
      h+='<div class="prc-fields"><p class="prc-ftitle">'+lab+' — <em>'+esc(S.model.src==='noel'?legNoel(M):M.legende)+'</em>. Indiquez :</p><div class="prc-field"><label>Prénoms / nom / texte <span style="color:var(--ink-soft);font-weight:400">(facultatif · +3 €)</span></label><input id="prc-prenom" maxlength="40" placeholder="Ex. Camille · Elli &amp; Ben · « Santé »" value="'+esc(S.prenom)+'"></div></div>';
    }
    h+='</div></section>';
  }
  h+='<section class="prc-step"><div class="prc-sh"><span class="prc-num'+(M?' done':'')+'">3</span><h3>Résumé de votre gravure</h3></div><div class="prc-sum">';
  h+='<div class="prc-sumrow"><span>Gravure</span>'+(M?'<b>'+(S.model.src==='noel'?'Modèle de Noël n° ':'Modèle n° ')+M.n+' · offert</b>':'<b class="prc-miss">à choisir (étape 1)</b>')+'</div>';
  if(S.prenom.trim())h+='<div class="prc-sumrow"><span>Texte « '+esc(S.prenom.trim())+' »</span><b>+'+eur(EXTRA)+'</b></div>';
  h+='<div class="prc-sumrow prc-sumtot"><span>Total</span><b>'+eur(total())+'</b></div></div></section>';
  $('#prc').innerHTML=h;
  $('#ft-emb').innerHTML='';
  $('#view-site .pd-totbox .val').textContent=eur(total());
  var add=$('#ft-add'), hint=$('.prc-addhint');
  if(M){add.disabled=false;add.classList.remove('prc-off');hint.textContent='Votre gravure est complète.';}
  else{add.disabled=true;add.classList.add('prc-off');hint.textContent='Choisissez votre gravure (étape 1).';}
}
/* ---------- événements */
document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-sw]');
  if(t){var k=t.getAttribute('data-sw');if(k==='noel'||k==='noel2'||k==='sync'){setNoel(!S.noel)}else{t.classList.toggle('on');t.setAttribute('aria-checked',t.classList.contains('on')?'true':'false')}return}
  t=ev.target.closest('.ft-tabs [data-view]');
  if(t){S.view=t.getAttribute('data-view');$$('.ft-tabs [data-view]').forEach(function(b){b.classList.toggle('on',b===t)});$$('.ft-view').forEach(function(v){v.classList.toggle('on',v.id==='view-'+S.view)});window.scrollTo(0,0);return}
  t=ev.target.closest('.prc-card[data-mode]');
  if(t){var m=t.getAttribute('data-mode');if(m==='modele'||m==='noel'){if(S.mode!==m){S.model=null;S.prenom='';S.filtre='all';}S.mode=m;S.ouverte=true;renderSite();var s2=$('#prc-s2');if(s2)s2.scrollIntoView({block:'start',behavior:'smooth'})}else{alert_('Dans cette maquette, seuls « Un modèle décoré » et « Un modèle de Noël » sont joués : les autres choix sont ceux du site, inchangés.')}return}
  t=ev.target.closest('.prc-chip[data-f]');
  if(t){S.filtre=t.getAttribute('data-f');S.ouverte=true;renderSite();return}
  t=ev.target.closest('.prc-model[data-n]');
  if(t){S.model={src:t.getAttribute('data-src'),n:+t.getAttribute('data-n')};S.ouverte=false;renderSite();return}
  if(ev.target.closest('#prc-change')){S.ouverte=true;renderSite();return}
  t=ev.target.closest('[data-pk]');
  if(t){S.pk=t.getAttribute('data-pk');renderBijou();return}
  t=ev.target.closest('[data-xn]');
  if(t){S.xn=t.getAttribute('data-xn');renderBijou();return}
  if(ev.target.closest('[data-xntog]')){S.xnOpen=!S.xnOpen;renderBijou();return}
  t=ev.target.closest('[data-pc]');
  if(t){S.couleur=t.getAttribute('data-pc');renderBijou();renderEmbAdmin();return}
});
document.addEventListener('input',function(ev){
  if(ev.target.id==='prc-prenom'){S.prenom=ev.target.value;var pos=ev.target.selectionStart;renderSite();var i=$('#prc-prenom');if(i){i.focus();i.setSelectionRange(pos,pos)}}
});
document.addEventListener('change',function(ev){
  var s=ev.target.closest('select[data-prix]');
  if(s){var m=NOEL.find(function(x){return x.n===+s.getAttribute('data-prix')});m.prix=+s.value;compteur();renderSite();return}
  var p=ev.target.closest('.ft-prod input');if(p){p.closest('.ft-prod').classList.toggle('on',p.checked)}
  var q=ev.target.closest('select[data-pkprix]');if(q){var e=EMB.find(function(x){return x.id===q.getAttribute('data-pkprix')});e.px=+q.value;renderEmbAdmin();renderBijou();return}
  var ft=ev.target.closest('input[data-fit]');if(ft){var e3=EMB.find(function(x){return x.id===ft.getAttribute('data-fit')});e3.fit[ft.getAttribute('data-cat')]=ft.checked;ft.closest('label').classList.toggle('on',ft.checked);renderBijou();return}
  var pw=ev.target.closest('input[data-pkpoids]');if(pw){var e4=EMB.find(function(x){return x.id===pw.getAttribute('data-pkpoids')});e4.poids=Math.max(0,+pw.value||0);renderBijou();return}
  var st=ev.target.closest('input[data-pkstock]');if(st){var e2=EMB.find(function(x){return x.id===st.getAttribute('data-pkstock')});e2.stock=Math.max(0,+st.value||0);renderBijou();return}
});
function alert_(msg){var b=$('#ft-toast');b.textContent=msg;b.style.display='block';clearTimeout(b._t);b._t=setTimeout(function(){b.style.display='none'},3500)}
/* ---------- Gestion : emballages de Noël (bijoux) */
function renderEmbAdmin(){
  var CH=[0,0.9,1.9,2.9,3.9,4.9,5.9,6.9];
  var h=EMB.map(function(e){
    var marge=e.px-e.cout;
    var opts=CH.map(function(v){return '<option value="'+v+'"'+(Math.abs(v-e.px)<.001?' selected':'')+'>'+(v?'+'+eur(v):'Offert')+'</option>'}).join('');
    var coul=e.couleurs?'<div class="coul">'+COUL.map(function(c){return '<img src="'+c.src+'" alt="" title="'+esc(c.nom)+'">'}).join('')+'<small style="margin:0;align-self:center">vert sapin · bleu nuit</small></div>':'';
    return '<div class="ft-embn'+(e.id==='pack'?' pk':'')+'">'+(e.id==='pack'?'<span class="etq">PACK</span>':'')+'<img src="'+e.src+'" alt=""><div class="b"><b>'+esc(e.nom)+'</b><div class="d">'+esc(e.d)+'</div>'
      +'<div class="ft-emb-l"><label>Prix <select data-pkprix="'+e.id+'">'+opts+'</select></label><label>Stock <input type="number" data-pkstock="'+e.id+'" value="'+e.stock+'" min="0"></label><label>Poids <input type="number" data-pkpoids="'+e.id+'" value="'+e.poids+'" min="0" title="grammes, à peser"></label></div>'
      +'<div class="port">'+(e.colis?'📦 <b>Part en colis</b> (boîte rigide) : cliente 6,90 € à domicile · 4,90 € en relais · offerte dès 45 € · vous ≈ 6,12 €':'✉️ <b>Reste en lettre suivie</b> : cliente 4,90 € jusqu’à 100 g · offerte dès 45 € · vous ≈ 4,45 €')+' · ≈ '+e.poids+' g <i>(à peser)</i></div>'
      +'<small>Coût rendu '+eur(e.cout)+' · <span class="marge">marge '+(marge>=0?'+':'−')+eur(Math.abs(marge))+'</span>'+(e.barre?' · prix barré '+eur(e.barre)+' (= boîte + sac)':'')+'</small>'+coul
      +'<div class="fit"><small>Convient si le bijou est :</small>'+FITS.map(function(f){return '<label'+(e.fit[f[0]]?' class="on"':'')+'><input type="checkbox" data-fit="'+e.id+'" data-cat="'+f[0]+'"'+(e.fit[f[0]]?' checked':'')+'> '+f[1]+'</label>'}).join('')+'</div></div></div>'}).join('');
  h+='<div class="ft-embn"><span class="etq off">OFFERTE</span><img src="'+ETQ.src+'" alt=""><div class="b"><b>'+esc(ETQ.nom)+'</b><div class="d">'+esc(ETQ.d)+'</div><div class="ft-emb-l"><label>Prix <select disabled><option>Offerte</option></select></label><label>Stock <input type="number" value="'+ETQ.stock+'" min="0"></label></div><small>Coût '+eur(ETQ.cout)+' · la cliente ne la choisit pas : elle est mise d’office.</small></div></div>';
  $('#ft-embs').innerHTML=h;
}
/* ---------- Site : fiche du collier, bloc « Votre emballage » = options actuelles + options de Noël */
function pkChoisi(){return PK.find(function(x){return x.id===S.pk})||PK[0]}
function xnChoisi(){return EMB.find(function(x){return x.id===S.xn})||null}
function xnDispo(){var cat=pkChoisi().cat;return EMB.filter(function(e){return e.fit[cat]})}
function enColis(x){var p=pkChoisi();return (x&&x.colis)||p.cat==='carree'||p.cat==='allongee'||p.cat==='pack'}
function portTxt(x){
  if(!x)return '📦 Livraison : '+(enColis(null)?'votre bijou en boîte part en colis — 6,90 € à domicile ou 4,90 € en point relais':'votre bijou part en lettre suivie — 4,90 €')+', offerte dès 45 € de bijoux.';
  if(enColis(x))return '📦 Livraison avec '+esc(x.nom.toLowerCase())+' : votre bijou part en petit colis — <b>6,90 €</b> à domicile ou <b>4,90 €</b> en point relais, offerte dès 45 € de bijoux.';
  return '✉️ Livraison avec '+esc(x.nom.toLowerCase())+' : votre bijou reste en lettre suivie — <b>4,90 €</b>, offerte dès 45 € de bijoux.';
}
function totalBijou(){var x=xnChoisi();return PRIX_BIJOU+(pkChoisi().px||0)+(x?x.px:0)}
function btnPk(o,noel){
  var on=noel?S.xn===o.id:S.pk===o.id, img=o.src?'<img class="th" src="'+o.src+'" alt="">':'<span class="ico">'+(o.ico||'🎁')+'</span>';
  var px=o.px?(o.barre?'<span class="barre">'+eur(o.barre)+'</span>':'')+'+'+eur(o.px):'0 €';
  var rup=noel&&o.id!=='none'&&o.stock<=0;
  return '<button type="button" data-'+(noel?'xn':'pk')+'="'+o.id+'" class="'+(on?'on':'')+'"'+(rup?' disabled style="opacity:.45"':'')+'>'+img+'<span style="min-width:0"><strong>'+(on?'✓ ':'')+esc(o.nom)+(o.meil?'<span class="meil'+(noel?' noel':'')+'">'+(noel?'🎄 NOËL':'MEILLEUR CHOIX')+'</span>':'')+'</strong><span class="d">'+esc(o.d)+(rup?' · épuisé':'')+'</span></span><span class="px">'+px+'</span></button>';
}
function renderBijou(){
  var host=$('#ft-pk');if(!host)return;
  var h='<div class="ft-embc"><div class="t">Votre emballage</div><p class="s">Choisissez votre présentation cadeau.</p><div class="opts">';
  h+=PK.map(function(o){return btnPk(o,false)}).join('')+'</div></div>';
  if(S.noel){
    var dispo=xnDispo(), x=xnChoisi();
    if(x&&!dispo.some(function(e){return e.id===x.id})){S.xn='none';x=null;}
    if(dispo.length){
      var mini=Math.min.apply(null,dispo.map(function(e){return e.px}));
      if(!S.xnOpen){
        if(x){h+='<button type="button" class="xn-tog on" data-xntog><img class="th" src="'+x.src+'" alt=""><span style="min-width:0"><strong>🎄 Emballage de Noël : '+esc(x.nom)+(x.couleurs?' · '+esc(COUL.find(function(c){return c.id===S.couleur}).nom.toLowerCase()):'')+'</strong><span class="d">étiquette « Merry Christmas » offerte · '+(enColis(x)?'part en colis (6,90 € à domicile, 4,90 € en relais)':'lettre suivie (4,90 €)')+' · offerte dès 45 €</span></span><span class="px">+'+eur(x.px)+'<i>Modifier</i></span></button>';}
        else{h+='<button type="button" class="xn-tog" data-xntog><span class="ico">🎄</span><span style="min-width:0"><strong>Ajouter un emballage de Noël</strong><span class="d">facultatif · dès '+eur(mini)+' · '+dispo.length+' choix</span></span><span class="px"><i>Voir ▾</i></span></button>';}
      }else{
        h+='<div class="ft-embc xn"><div class="t">🎄 Votre emballage de Noël <button type="button" class="xn-close" data-xntog>Fermer ▴</button></div><p class="s">'+(pkChoisi().cat==='seul'?'Le bijou est glissé dedans, prêt à offrir.':'Votre '+esc(pkChoisi().nom.toLowerCase())+' est glissé dedans, prêt à offrir.')+'</p><div class="opts">';
        h+=btnPk({id:'none',nom:'Sans emballage de Noël',d:'Seulement l’emballage choisi ci-dessus',px:0,ico:'✖️'},true);
        h+=dispo.map(function(o){return btnPk(o,true)}).join('');
        if(x&&x.couleurs){h+='<div class="couleur">Couleur de la boîte : '+COUL.map(function(c){return '<button type="button" data-pc="'+c.id+'" class="'+(S.couleur===c.id?'on':'')+'"><img src="'+c.src+'" alt="">'+(S.couleur===c.id?'✓ ':'')+esc(c.nom)+'</button>'}).join('')+'</div>';}
        h+='<p class="etqoff"><img src="'+ETQ.src+'" alt="">Avec chaque emballage de Noël, l’étiquette « Merry Christmas » et sa ficelle sont offertes.</p>';
        h+='<p class="xn-port">'+portTxt(x)+'</p></div></div>';
      }
    }else if(pkChoisi().cat!=='seul'){
      h+='<p class="xn-no">🎄 Pas d’emballage de Noël avec cette présentation : elle n’y rentre pas.</p>';
    }
  }
  host.innerHTML=h;
  var v=$('#view-bijou .pd-totbox .val');if(v)v.textContent=eur(totalBijou());
}
renderAdmin();renderEmbAdmin();setNoel(true);
})();
"""

GOOGLE = ("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500"
          "&family=Cinzel&family=Cinzel+Decorative&family=Montserrat&family=Great+Vibes&family=Allura&family=Pacifico&display=swap")

alpha = uri(os.path.join(PUB, "produits", "alphabet-fleuri.jpg"), 300)
js = (JS.replace("__NOEL__", json.dumps(NOEL_JS, ensure_ascii=False)).replace("__VIN__", json.dumps(VIN_JS, ensure_ascii=False))
      .replace("__GROUPES__", json.dumps(VIN["groupes"], ensure_ascii=False)).replace("__CRISTAUX__", json.dumps(CRISTAUX_JS, ensure_ascii=False))
      .replace("__PRIX__", str(VIN["prix"])).replace("__EXTRA__", str(VIN["textExtra"])).replace("__JOURS__", str(NOEL["jours"]))
      .replace("__ALPHA__", json.dumps(alpha)).replace("__EMB__", json.dumps(EMB_NOEL, ensure_ascii=False)).replace("__ETQ__", json.dumps(ETIQUETTE, ensure_ascii=False))
      .replace("__PK__", json.dumps(PK_JS, ensure_ascii=False)).replace("__PRIX_BIJOU__", str(PRIX_BIJOU)).replace("__COUL__", json.dumps(COULEURS_JS, ensure_ascii=False)))

page = f"""<title>Fêtes de l'année</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="{GOOGLE}" rel="stylesheet">
<style>{CSS}</style>
<style>{PAGE_CSS}
#ft-toast{{display:none;position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#f1e3b8;padding:10px 16px;border-radius:12px;font-size:.84rem;z-index:99;max-width:92vw;box-sizing:border-box}}
</style>
<main id="ft-app">
<div class="ft-banner"><b>MAQUETTE « FÊTES »</b> · rien n'est en ligne · prix des images = exemples à régler par vous · emballages de Noël des bijoux = vos prix du 28/10, vos photos</div>
<div class="ft-tabs" role="tablist"><button type="button" class="on" data-view="admin">① Gestion → Fêtes</button><button type="button" data-view="site">② Site : verre à vin (images)</button><button type="button" data-view="bijou">③ Site : collier (emballages)</button>
 <div class="ft-sync">Noël <span class="ft-synctxt">allumé</span> {sw("sync", True, "Allumer ou éteindre Noël")}</div></div>
<div class="ft-view on" id="view-admin">{ADMIN}</div>
<div class="ft-view ft-site" id="view-site">
 <div class="ft-sitebar">Fiche réelle du verre à vin · <b>Noël <span class="ft-synctxt">allumé</span></b> · l'interrupteur en haut à droite éteint Noël : la fiche redevient celle d'aujourd'hui</div>
 {header}{main}{footer}
</div>
<div class="ft-view ft-site" id="view-bijou">
 <div class="ft-sitebar">Fiche réelle du Collier Cœur gravé · <b>Noël <span class="ft-synctxt">allumé</span></b> · une ligne « Ajouter un emballage de Noël » sous « Votre emballage » (repliée, s'ouvre d'un clic, seulement ce qui rentre) ; l'interrupteur en haut à droite la retire</div>
 {header}{main_b}{footer}
</div>
<div id="ft-toast"></div>
</main>
<script>{js}</script>
"""
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(page)
print(f"écrit {out} ({os.path.getsize(out) // 1024} Ko) · Noël {fr(NOEL['date'])}, alerte {fr(NOEL['alerte'])}, J-{NOEL['jours']} · "
      + " · ".join(f"{f['nom']} {fr(f['date'])} (alerte {fr(f['alerte'])})" for f in FETES[1:]))
