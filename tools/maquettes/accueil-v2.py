#!/usr/bin/env python3
"""Maquette « accueil + univers » (08/10/2026) — reprend la maquette ENREGISTRÉE accueil-moderne (sans la
modifier : son générateur est lu puis exécuté ici sans écrire ses fichiers) et la retravaille :
  · menu rangé en 8 univers + « Offrir », avec panneau déroulant (ordinateur) et tiroir (téléphone) ;
  · « Trouver un cadeau » (pour qui / occasion / budget) juste sous le héros ;
  · nouveau bloc « Bébé & Enfants » + coffret « univers assortis » ;
  · « Nos univers » à la place de « Explorez nos collections » ;
  · une 2e vue « Univers » : une page par univers avec TOUS les produits du catalogue, rangés par rayon.
Entrée : catalogue exporté par tools/maquettes/catalogue-export.mjs (JSON).
Usage : python3 tools/maquettes/accueil-v2.py <catalogue.json>
Rien n'est touché dans le site : c'est une maquette, en attente du « applique »."""
import base64, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PROD = os.path.join(ROOT, "public", "produits")
OUT = os.path.join(ROOT, "docs", "maquettes")

# 1) La maquette enregistrée, exécutée sans écrire ses fichiers.
src = open(os.path.join(HERE, "accueil-moderne.py"), encoding="utf-8").read()
src = src[: src.index("\nfull = ")]
base = {"__file__": os.path.join(HERE, "accueil-moderne.py"), "__name__": "accueil_moderne"}
exec(compile(src, "accueil-moderne.py", "exec"), base)
BODY, CSS, JS, IMG_CSS, HEAD_LINKS = base["BODY"], base["CSS"], base["JS"], base["IMG_CSS"], base["HEAD_LINKS"]
ic, ph = base["ic"], base["ph"]

# 2) Catalogue
CAT = json.load(open(sys.argv[1], encoding="utf-8"))
P = {p["slug"]: p for p in CAT["products"]}

def r90(n):
    return round(n - 0.9) + 0.9

def prix(p):
    v = p["min"]
    if p["category"] == "bijoux":            # remise bijoux −10 % (catalog.js)
        v = round(r90(v * 0.9) * 0.9, 2)
    s = f"{v:.2f}".replace(".", ",") + " €"
    return ("dès " if p["multi"] else "") + s, v

THUMB = {}
def thumb(fn, w=420):
    if fn in THUMB: return THUMB[fn]
    path = fn if os.path.isabs(fn) and os.path.exists(fn) else os.path.join(ROOT, "public", fn.lstrip("/"))
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=68, optimize=True, progressive=True)
    THUMB[fn] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    return THUMB[fn]

# Photo de vignette : on préfère une photo gravée quand le site en a une (règle des vidéos : montrer la gravure).
PHOTO = {
 "couverts-enfants-personnalises": "/produits/couverts_enfants_ex_prenom.jpg",
 "verre-a-whisky-grave": "/produits/verre_a_whisky_exemple_face.jpg",
 "verre-a-vin-grave": "/produits/verre_vin_exemple_dale.jpg",
 "carafe-a-whisky-gravee": "/produits/carafe_gravee.jpg",
 "collier-3coeurs": "/produits/collier-3coeurs-3.jpg",
 "collier-coeur-grave": "/produits/collier-coeur-grave-1.jpg",
 "collier-double-coeur": "/produits/collier-double-coeur-6.jpg",
 "bracelet-cordon-plaque": "/produits/bracelet-cordon-plaque-4.jpg",
}
TCLS = {}
def tcls(f):
    """Une classe CSS par photo : chaque image n'est intégrée qu'UNE fois, même si la carte est répétée."""
    if f not in TCLS: TCLS[f] = f"t{len(TCLS)}"
    return TCLS[f]
def photo(slug):
    p = P[slug]
    f = PHOTO.get(slug) or (p["local"][0] if p["local"] else "")
    return tcls(f) if f and os.path.exists(os.path.join(ROOT, "public", f.lstrip("/"))) else ""

# 3) Les univers (rangement proposé). Une pièce peut apparaître dans 2 univers (ex. bracelet bébé).
def bij(prefix):
    return [s for s, p in P.items() if p["category"] == "bijoux" and p["name"].startswith(prefix)]
PUZZLES = [("foret", "Forêt"), ("savane", "Savane"), ("dinosaures", "Dinosaures"), ("animaux-amerique", "Grand Nord"),
           ("australie", "Australie"), ("vehicules-secours", "Véhicules de secours"), ("camping", "Camping"),
           ("jardin-enchante", "Jardin enchanté"), ("fruits-legumes", "Fruits & légumes")]
UNIVERS = [
 {"id": "bijoux", "nom": "Bijoux", "accroche": "Colliers et bracelets en acier, gravés avec un prénom, une date ou un mot qui vous est cher.",
  "img": "/produits/collier-3coeurs-3.jpg", "pourqui": True,
  "rayons": [("Colliers", bij("Collier")), ("Bracelets", bij("Bracelet"))]},
 {"id": "cristal", "nom": "Cristal photo 3D", "accroche": "Votre photo gravée au laser à l’intérieur d’un bloc de cristal.",
  "img": "/produits/cristal-v-femme.jpg",
  "rayons": [("Blocs photo 3D", ["cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"]),
             ("Cristaux déjà gravés", "bientot-cristaux"),
             ("Porte-clés & clé USB", ["porte-cles-cristal-led-coeur", "porte-cles-cristal-led-rectangle", "cle-usb-cristal-3d"])]},
 {"id": "verres", "nom": "Verres & Carafes", "accroche": "Verres à whisky, à cocktail, à vin, flûtes et carafe, gravés à la commande.",
  "img": "/produits/verre_a_whisky_exemple_face.jpg",
  "rayons": [("Verres à whisky", ["verre-a-whisky-grave", "verre-a-whisky-fete-des-peres"]),
             ("Vin, champagne & cocktail", ["verre-a-vin-grave", "flute-a-champagne-gravee", "verre-a-cocktail-grave"]),
             ("Carafe", ["carafe-a-whisky-gravee"])]},
 {"id": "enfants", "nom": "Bébé & Enfant", "neuf": True, "accroche": "De la naissance aux premiers repas, des cadeaux personnalisés avec son prénom.",
  "img": "/produits/couverts_enfants_ex_enfant.jpg",
  "rayons": [("Naissance & baptême", ["plaque-de-naissance", "plaque-de-naissance-coeur", "cartes-etapes-bebe-animaux", "cartes-etapes-bebe-girafe", "bracelet-empreinte-pied-bebe"]),
             ("Repas", ["couverts-enfants-personnalises"]),
             ("Chambre", ["veilleuse-arbre-de-vie-prenom", "plaque-de-porte-enfant"]),
             ("Jeux en bois", "bientot-puzzles")]},
 {"id": "mariage", "nom": "Mariage & Réception", "accroche": "Numéros de table, menus et décorations de table en bois gravé.",
  "img": "/produits/numero_table_arche_geometrique_relief_bois.jpeg",
  "rayons": [("Numéros de table", [s for s, p in P.items() if p["subcategory"] == "tables"]),
             ("Décor de table", ["etiquette-serviette-initiales", "ronds-de-serviette-bois", "porte-serviettes-bois-fleur", "porte-serviettes-colombes"]),
             ("Menus", ["menu-de-mariage-bois-grave"])]},
 {"id": "maison", "nom": "Maison & Déco", "accroche": "Lampes, veilleuses et bougeoirs en bois gravé pour la maison.",
  "img": "/produits/arbre-vie-rond-1.jpg",
  "rayons": [("Lampes & veilleuses", ["arbre-de-vie-lumineux", "veilleuse-arbre-de-vie-ronde", "lampe-led-paris-saint-germain"]),
             ("Bougeoirs", ["bougeoir-mandala-bois", "photophore-fee-bois", "bougeoir-fleur-de-lotus"])]},
 {"id": "cadeaux", "nom": "Petits cadeaux", "accroche": "Clés USB, porte-clés, médailles et accessoires de bureau personnalisés.",
  "img": "/produits/cle_usb_en_bois_4gb_avec_boite_en_bois.jpg",
  "rayons": [("Clés USB", ["cle-usb-personnalisee", "cle-usb-bois-coffret"]),
             ("Porte-clés & médailles", ["porte-cles-cuir-a-graver", "piece-ronde-laiton"]),
             ("Bureau", ["support-telephone-bois-grave", "support-telephone-bois-ajoure", "porte-stylo-coq-coupe-du-monde",
                         "porte-stylo-portugal-coupe-du-monde", "porte-stylo-argentine-coupe-du-monde", "porte-stylo-espagne-coupe-du-monde"])]},
]
rang = {s for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list) for s in l}
oublis = [s for s in P if s not in rang]
assert not oublis, f"produits non rangés : {oublis}"
manque = [s for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list) for s in l if s not in P]
assert not manque, f"produits inconnus : {manque}"
def compte(u):
    return len({s for _, l in u["rayons"] if isinstance(l, list) for s in l})

POURQUI = {"elle": "Pour elle", "lui": "Pour lui", "couple": "Pour un couple", "enfant": "Pour un enfant", "parents": "Pour des parents"}
def pourqui(s):
    p, t = P[s], set()
    if "pour-elle" in p["occ"]: t.add("elle")
    if "pour-lui" in p["occ"]: t.add("lui")
    if p["subcategory"] == "couple" or "amour" in p["occ"]: t.add("couple")
    if s in {x for u in UNIVERS if u["id"] == "enfants" for _, l in u["rayons"] if isinstance(l, list) for x in l}: t.add("enfant")
    if "famille" in p["occ"] or "naissance" in p["occ"]: t.add("parents")
    return sorted(t)

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")

def carte(s, univ):
    p = P[s]; lab, val = prix(p); im = photo(s)
    pic = f'<span class="uc-ph {im}" role="img" aria-label="{esc(p["name"])}"></span>' if im else f'<span class="uc-none">{esc(p["name"][:1])}<small>photo sur le site</small></span>'
    badge = f'<span class="uc-b">{esc(p["badge"])}</span>' if p["badge"] in ("Nouveau", "Best-seller", "Édition limitée") else ""
    occ = " ".join(p["occ"])
    return (f'<a class="uc" href="#" data-prix="{val}" data-qui="{" ".join(pourqui(s))}" data-occ="{occ}" data-sub="{p["subcategory"]}">'
            f'<span class="uc-img">{pic}{badge}<button class="fav" type="button" aria-label="Garder pour plus tard">{ic("heart")}</button></span>'
            f'<span class="uc-name">{esc(p["name"])}</span><span class="uc-price">{lab}</span></a>')

def bientot(kind):
    if kind == "bientot-puzzles":
        tiles = "".join(f'<a class="uc uc-soon" href="#" data-prix="29.9" data-qui="enfant" data-occ="naissance noel"><span class="uc-img"><span class="uc-ph {tcls(os.path.join(OUT, "assets", "jeux-enfants", f + ".jpg"))}" role="img" aria-label="Puzzle {n}"></span><span class="uc-b uc-b-soon">Bientôt</span></span><span class="uc-name">Puzzle en bois — {n}</span><span class="uc-price">29,90 € · prénom inclus</span></a>' for f, n in PUZZLES)
        return tiles
    return ('<a class="uc-soonbox" href="#"><b>Cristaux déjà gravés : 16 modèles et 15 dessins</b><span>Sirène, colibri, cœur, Noël… vous choisissez le format et la taille '
            '(maquette « Cristaux déjà gravés » enregistrée le 07/10).</span><span class="uc-b uc-b-soon">Bientôt</span></a>')

def page_univers(u):
    chips = "".join(f'<a href="#r-{u["id"]}-{i}">{esc(n)}</a>' for i, (n, _) in enumerate(u["rayons"]))
    filt = ""
    if u.get("pourqui"):
        filt += '<div class="uf-grp" role="group" aria-label="Pour qui"><span>Pour qui</span>' + "".join(
            f'<button type="button" data-f="sub" data-v="{v}">{l}</button>' for v, l in (("femme", "Femme"), ("homme", "Homme"), ("couple", "Couple"), ("bebe", "Bébé"))) + "</div>"
    filt += '<div class="uf-grp" role="group" aria-label="Budget"><span>Budget</span>' + "".join(
        f'<button type="button" data-f="budget" data-v="{v}">{l}</button>' for v, l in (("0-20", "Moins de 20 €"), ("20-40", "20 à 40 €"), ("40-999", "Plus de 40 €"))) + "</div>"
    filt += '<label class="uf-sort">Trier <select><option value="">Notre sélection</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label>'
    blocs = ""
    for i, (n, l) in enumerate(u["rayons"]):
        cards = "".join(carte(s, u) for s in l) if isinstance(l, list) else bientot(l)
        nb = f'{len(l)} création{"s" if len(l) > 1 else ""}' if isinstance(l, list) else "bientôt"
        blocs += f'<section class="ur" id="r-{u["id"]}-{i}"><h3>{esc(n)} <small>{nb}</small></h3><div class="ug">{cards}</div><p class="ur-empty" hidden>Aucune création de ce rayon ne correspond à votre choix.</p></section>'
    extra = COFFRET if u["id"] == "enfants" else ""
    return (f'<article class="up" id="u-{u["id"]}" data-u="{u["id"]}" hidden>'
            f'<header class="up-head"><div class="up-txt"><p class="up-crumb">Boutique / {esc(u["nom"])}</p><h2>{esc(u["nom"])}</h2><p>{esc(u["accroche"])}</p>'
            f'<p class="up-count">{compte(u)} créations</p></div><img class="up-img" src="{thumb(u["img"], 700)}" alt=""></header>'
            f'<nav class="up-rayons" aria-label="Rayons">{chips}</nav><div class="uf">{filt}</div>{extra}{blocs}</article>')

# 4) Coffret « univers assortis » (Bébé & Enfants)
pc, pp, pv = 34.90, 29.90, 34.90
COFFRET = f'''<div class="cof" id="coffret">
  <div class="cof-txt"><span class="tag-new">Nouveau — coffret assorti</span>
    <h3>Un prénom, un univers&nbsp;: <em>le coffret Savane</em></h3>
    <p>Les couverts, le puzzle et la veilleuse dans le même thème. Vous écrivez le prénom une seule fois : les trois pièces sont personnalisées ensemble.</p>
    <div class="cof-pick" role="group" aria-label="Pièces du coffret">
      <label><input type="checkbox" checked data-p="{pc}"> Couverts enfant personnalisés <b>34,90 €</b></label>
      <label><input type="checkbox" checked data-p="{pp}"> Puzzle en bois personnalisé <b>29,90 €</b></label>
      <label><input type="checkbox" data-p="{pv}"> Veilleuse personnalisée <b>34,90 €</b></label>
    </div>
    <div class="cof-name"><label for="cofPrenom">Prénom de l’enfant (gravé sur chaque pièce)</label><input id="cofPrenom" maxlength="14" placeholder="Ex. Léa" autocomplete="off"></div>
    <p class="cof-tot"><s id="cofAvant">64,80 €</s> <b id="cofApres">58,32 €</b> <span id="cofRem">−10 % dès 2 pièces</span></p>
    <a class="btn btn-gold" href="#">Composer mon coffret {ic("arrow")}</a>
    <p class="cof-note">D’autres univers sont possibles (Forêt, Dinosaures, Océan) dès que le même thème existe sur les couverts et sur le puzzle.</p>
  </div>
  <div class="cof-pics" aria-hidden="true">
    <img src="{thumb("/produits/couverts_enfants_ex_animaux.jpg", 520)}" alt=""><img src="{thumb(os.path.join(OUT, "assets", "jeux-enfants", "savane.jpg"), 520)}" alt="">
    <img src="{thumb("/produits/veilleuse-prenom-1.jpg", 520)}" alt=""><span class="cof-nom" id="cofNom">Léa</span>
  </div>
</div>'''

# 5) Menu rangé (8 entrées) + panneau déroulant + tiroir téléphone
def mega(u):
    cols = "".join(f'<div><b>{esc(n)}</b>' + ("".join(f'<a href="#" data-go="{u["id"]}">{esc(P[s]["name"])}</a>' for s in l[:6]) + (f'<a href="#" data-go="{u["id"]}"><b style="font:600 .84rem var(--sans);color:var(--gold-t)">Voir les {len(l)} →</b></a>' if len(l) > 6 else "") if isinstance(l, list) else '<a href="#" data-go="' + u["id"] + '">Bientôt</a>') + "</div>" for n, l in u["rayons"])
    return (f'<div class="mg-panel"><div class="mg-cols">{cols}</div><a class="mg-pic" href="#" data-go="{u["id"]}"><img src="{thumb(u["img"], 420)}" alt="">'
            f'<span>Tout l’univers {esc(u["nom"])} · {compte(u)} créations {ic("arrow")}</span></a></div>')
OFFRIR_PANEL = ('<div class="mg-panel"><div class="mg-cols">'
  '<div><b>Pour qui ?</b>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '</div>'
  '<div><b>Pour quelle occasion ?</b><span class="fetes" data-max="3" data-as="a"></span><a href="#" data-find="occ:naissance">Naissance &amp; baptême</a><a href="#" data-find="occ:mariage">Mariage</a><a href="#" data-find="occ:amour">Anniversaire</a></div>'
  '<div><b>Quel budget ?</b><a href="#" data-find="budget:0-20">Moins de 20 €</a><a href="#" data-find="budget:20-40">De 20 à 40 €</a><a href="#" data-find="budget:40-999">Plus de 40 €</a><a href="#">Carte cadeau</a><a href="#" style="color:#b4452f;font-weight:600">Promotions</a></div>'
  '</div></div>')
NAV = ('<nav class="hnav hnav2" aria-label="Principal">'
       + "".join(f'<div class="mg"><a href="#" class="mg-top" data-go="{u["id"]}">{esc(u["nom"])}{" <i>Nouveau</i>" if u.get("neuf") else ""}</a>{mega(u)}</div>' for u in UNIVERS)
       + f'<div class="mg"><a href="#" class="mg-top mg-offrir" data-go="offrir">Offrir</a>{OFFRIR_PANEL}</div>'
       + '</nav>')
DRAWER = ('<div class="drw" id="drw" hidden><div class="drw-in" role="dialog" aria-label="Menu"><button class="drw-x" type="button" aria-label="Fermer">×</button>'
          + "".join(f'<details><summary>{esc(u["nom"])}{" <i>Nouveau</i>" if u.get("neuf") else ""}</summary>' + "".join(f'<a href="#r-{u["id"]}-{i}" data-go="{u["id"]}">{esc(n)}</a>' for i, (n, _) in enumerate(u["rayons"])) + f'<a href="#" data-go="{u["id"]}"><b>Tout voir</b></a></details>' for u in UNIVERS)
          + '<details open><summary>Offrir</summary>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '<a href="#">Carte cadeau</a></details>'
          + '<div class="drw-sec"><a href="#">Promotions</a><a href="#">Idées &amp; conseils</a><a href="#">À propos</a><a href="#">Contact</a><a href="#">Mon compte</a></div></div></div>')

# 6) Blocs ajoutés à l'accueil
FINDER = '''<section class="fd" id="trouver" aria-labelledby="t-fd"><span class="tag-new">Nouveau bloc</span>
  <h2 id="t-fd">Trouver le cadeau <em>en 3 clics</em></h2>
  <div class="fd-grp" role="group" aria-label="Pour qui"><span>Pour qui ?</span>''' + "".join(f'<button type="button" data-k="qui" data-v="{k}">{v.replace("Pour ", "")[:1].upper() + v.replace("Pour ", "")[1:]}</button>' for k, v in POURQUI.items()) + '''</div>
  <div class="fd-grp" role="group" aria-label="Occasion"><span>L’occasion ?</span><span class="fetes" data-max="3" data-as="button"></span><button type="button" data-k="occ" data-v="naissance">Naissance</button><button type="button" data-k="occ" data-v="mariage">Mariage</button><button type="button" data-k="occ" data-v="amour">Anniversaire</button></div>
  <div class="fd-grp" role="group" aria-label="Budget"><span>Budget ?</span><button type="button" data-k="budget" data-v="0-20">Moins de 20 €</button><button type="button" data-k="budget" data-v="20-40">20 à 40 €</button><button type="button" data-k="budget" data-v="40-999">Plus de 40 €</button></div>
  <p class="fd-count" id="fdCount" aria-live="polite">Choisissez un ou plusieurs critères.</p>
  <div class="ug fd-res" id="fdRes"></div>
</section>'''
enf = next(u for u in UNIVERS if u["id"] == "enfants")
ENFANTS = f'''<section class="sec enf" aria-labelledby="t-enf"><span class="tag-new">Nouveau bloc</span>
  <div class="enf-grid">
    <a class="enf-big" href="#" data-go="enfants"><img src="{thumb("/produits/couverts_enfants_ex_enfant.jpg", 900)}" alt="Enfant qui mange avec sa cuillère personnalisée">
      <span class="enf-lab"><b>Couverts enfant personnalisés</b><span>34,90 €</span></span></a>
    <div class="enf-copy">
      <h2 id="t-enf">Bébé &amp; Enfant&nbsp;: <em>des cadeaux personnalisés avec son prénom</em></h2>
      <p>Naissance, premiers repas, chambre, jeux : tous nos cadeaux personnalisés pour les petits, réunis au même endroit.</p>
      <div class="enf-cats">{"".join(f'<a href="#r-enfants-{i}" data-go="enfants">{esc(n)}</a>' for i, (n, _) in enumerate(enf["rayons"]))}</div>
      <div class="ug ug-4">{"".join(carte(s, enf) for s in ["plaque-de-naissance-coeur", "veilleuse-arbre-de-vie-prenom", "cartes-etapes-bebe-animaux", "bracelet-empreinte-pied-bebe"])}</div>
      <a class="btn btn-ink" href="#" data-go="enfants">Voir tout l’univers {ic("arrow")}</a>
    </div>
  </div>
  {COFFRET}
</section>'''
UNIV_TILES = "".join(
    f'<a class="ut" href="#" data-go="{u["id"]}"><img src="{thumb(u["img"], 620)}" alt=""><span class="ut-lab"><b>{esc(u["nom"])}</b><span>{compte(u)} créations</span></span>{"<i class=ut-new>Nouveau</i>" if u.get("neuf") else ""}</a>'
    for u in UNIVERS) + (f'<a class="ut ut-offrir" href="#" data-go="offrir"><span class="ut-o"><b>Offrir</b><span>Pour qui, quelle occasion, quel budget : '
    f'trouvez le cadeau en 3 clics.</span><span class="link">Trouver un cadeau {ic("arrow")}</span></span></a>')
UNIVERS_HOME = f'''<section class="sec" id="univers" aria-labelledby="t-univ"><span class="tag-new tag-mod">Bloc retravaillé</span>
  <div class="sec-head"><div><h2 id="t-univ">Nos univers</h2><p class="sub">Toutes nos créations, classées par univers. Chaque pièce est gravée à la commande dans notre atelier.</p></div></div>
  <div class="ut-grid">{UNIV_TILES}</div>
</section>'''

# 7) Montage : accueil (vue 1) + univers (vue 2)
body = BODY
nav_old = re.search(r'<nav class="hnav".*?</nav>', body, re.S).group(0)
body = body.replace(nav_old, NAV)
body = body.replace('<button class="menu-toggle" type="button" aria-label="Menu">', '<button class="menu-toggle" type="button" aria-label="Menu" id="burger">')
body = body.replace('<section class="sec bijoux"', FINDER + '\n<section class="sec bijoux"', 1)
body = body.replace('<section class="limited"', ENFANTS + '\n<section class="limited"', 1)
coll = re.search(r'<section class="sec" aria-labelledby="t-coll">.*?</section>', body, re.S).group(0)
body = body.replace(coll, UNIVERS_HOME)
body = body.replace("<a href=\"#\">Bijoux femme</a><a href=\"#\">Bijoux homme</a><a href=\"#\">Mariage &amp; Réception</a><a href=\"#\">Cadeaux &amp; Déco</a>",
                    "".join(f'<a href="#" data-go="{u["id"]}">{esc(u["nom"])}</a>' for u in UNIVERS))
assert NAV in body and FINDER in body and ENFANTS in body and UNIVERS_HOME in body

UNIV_VIEW = ('<main class="uv" id="vueUnivers" hidden><nav class="uv-tabs" aria-label="Univers">'
             + "".join(f'<button type="button" data-go="{u["id"]}">{esc(u["nom"])}</button>' for u in UNIVERS)
             + '<button type="button" data-go="offrir">Offrir</button></nav>'
             + "".join(page_univers(u) for u in UNIVERS)
             + '<article class="up" id="u-offrir" data-u="offrir" hidden><header class="up-head"><div class="up-txt"><p class="up-crumb">Offrir</p><h2>Trouver un cadeau</h2>'
               '<p>Toutes nos créations, selon la personne, l’occasion et le budget.</p></div></header><div id="offrirSlot"></div></article>'
             + '</main>')
NOTES = '''<div class="mbar" role="region" aria-label="Maquette">
  <div class="mbar-in"><b>Maquette — rien n’est en ligne</b>
  <div class="mbar-tabs" role="tablist"><button type="button" class="on" data-view="accueil">Page d’accueil</button><button type="button" data-view="univers">Pages univers (tous les produits)</button></div>
  <button type="button" class="mbar-more" id="mbarMore" aria-expanded="false">Ce qui change</button></div>
  <ul class="mbar-notes" id="mbarNotes" hidden>
    <li><b>Menu rangé en 8 entrées</b> (au lieu de 15) : 7 univers + « Offrir ». Survol = panneau avec les rayons et une photo. Sur téléphone, le ☰ ouvre enfin un vrai menu.</li>
    <li><b>Nouvel univers « Bébé &amp; Enfant »</b> : les couverts, la veilleuse et la plaque de porte quittent « Déco », avec les plaques de naissance, les cartes étapes et les futurs puzzles.</li>
    <li><b>« Trouver le cadeau en 3 clics »</b> sous le héros (pour qui, occasion, budget) : les acheteurs de cadeaux pensent « pour qui » avant « quel produit ».</li>
    <li><b>Coffret « univers assortis »</b> : le même thème sur plusieurs pièces, le prénom écrit une seule fois, −10 % dès 2 pièces (proposition).</li>
    <li><b>Les fêtes se mettent à jour toutes seules</b> : Noël, Saint-Valentin, fête des grands-mères, fête des mères, fête des pères sont calculées sur la date du jour ; seules celles des 3 prochains mois sont proposées. Une fête passée disparaît d’elle-même.</li>
    <li><b>« Nos univers »</b> remplace « Explorez nos collections », avec le nombre de créations. Une page par univers, rangée par rayon, avec filtres et tri.</li>
    <li>En-tête, logo, héros, bijoux, carafe, Noël, mur, avis et pied de page : <b>inchangés</b>. Prix lus dans le code (Gestion peut les avoir changés).</li>
  </ul>
</div>'''
body = NOTES + DRAWER + body.replace("</main>", "</main>" + UNIV_VIEW, 1)

# Le tableau des produits pour « Trouver un cadeau » (cartes déjà rendues, filtrées en JS)
ALL_CARDS = "".join(carte(s, None) for s in P)

CSS2 = r'''
[hidden]{display:none!important}
.tag-new{display:inline-block;margin:0 0 14px;padding:5px 11px;border:1.5px dashed var(--gold-d);border-radius:999px;color:var(--gold-t);font:700 .7rem/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;background:rgba(201,162,75,.08)}
.tag-mod{border-color:#8a6d9e;color:#5d4470;background:rgba(138,109,158,.08)}
/* barre de maquette */
.mbar{position:relative;z-index:80;background:var(--ink);color:var(--cream);font-size:.86rem}
.mbar-in{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:9px 16px;max-width:1300px;margin:0 auto}
.mbar-tabs{display:flex;gap:6px;flex-wrap:wrap}
.mbar-tabs button,.mbar-more{padding:7px 13px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.45);color:var(--gold-l);font-weight:600}
.mbar-tabs button.on{background:var(--gold);color:var(--ink);box-shadow:none}
.mbar-more{margin-left:auto}
.mbar-notes{margin:0;padding:6px 16px 14px 36px;max-width:1300px;margin-inline:auto;color:var(--on-ink);line-height:1.5}
.mbar-notes li{margin:5px 0}.mbar-notes b{color:var(--gold-l)}
/* menu rangé */
.hnav2{gap:0 4px;padding:6px 12px;position:relative}
.mg{position:static}
.mg-top{display:inline-flex;align-items:center;gap:6px;padding:9px 11px!important;border-radius:999px;font-weight:600!important}
.mg-top i{font-style:normal;font-size:.62rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:var(--gold);color:var(--ink);padding:3px 6px;border-radius:999px}
.mg-offrir{color:var(--gold-t)!important}.mg-promo{color:#b4452f!important}
.mg:hover .mg-top,.mg:focus-within .mg-top{background:var(--sand)}
.mg-panel{position:absolute;left:50%;top:100%;transform:translateX(-50%);width:min(1100px,96vw);display:none;grid-template-columns:1fr 300px;gap:28px;padding:26px 28px;background:var(--cream);border:1px solid var(--line);border-radius:0 0 22px 22px;box-shadow:0 30px 60px -30px rgba(26,18,6,.45);text-align:left;z-index:60}
.mg:hover .mg-panel,.mg:focus-within .mg-panel{display:grid}
.mg-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:18px 24px}
.mg-cols b{display:block;font-family:var(--serif);font-size:1.02rem;margin-bottom:8px}
.mg-cols a{display:block;font-size:.86rem;padding:3px 0;color:var(--muted)}.mg-cols a:hover{color:var(--gold-t)}
.mg-pic{position:relative;border-radius:16px;overflow:hidden;min-height:200px;display:block}
.mg-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mg-pic span{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;padding:28px 14px 12px;background:linear-gradient(transparent,rgba(26,18,6,.82));color:var(--cream);font-weight:600;font-size:.86rem}
.mg-pic .ic{width:16px;height:16px;flex:none}
/* tiroir téléphone */
.drw{position:fixed;inset:0;z-index:90;background:rgba(26,18,6,.5)}
.drw-in{position:absolute;inset:0 auto 0 0;width:min(360px,88vw);background:var(--cream);overflow:auto;padding:18px 18px 40px}
.drw-x{font-size:2rem;line-height:1;width:44px;height:44px;margin-left:auto;display:block}
.drw details{border-bottom:1px solid var(--line)}
.drw summary{padding:14px 2px;font-family:var(--serif);font-size:1.12rem;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center}
.drw summary::after{content:"+";color:var(--gold-t);font-family:var(--sans)}.drw details[open] summary::after{content:"−"}
.drw summary i{font-style:normal;font-size:.62rem;font-weight:700;text-transform:uppercase;background:var(--gold);padding:3px 6px;border-radius:999px;margin-left:8px;font-family:var(--sans)}
.drw details a{display:block;padding:9px 12px;color:var(--muted)}
.drw-sec{padding-top:12px}.drw-sec a{display:block;padding:9px 2px}
/* trouver un cadeau */
.fd{padding:clamp(40px,6vw,72px) clamp(20px,6vw,96px);background:var(--sand);text-align:center}
.fd h2{font-size:clamp(1.7rem,3.4vw,2.6rem);margin-bottom:22px}
.fd-grp{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:10px 0}
.fd-grp>span,.uf-grp>span{font-weight:700;font-size:.84rem;color:var(--muted);margin-right:4px}
.fd-grp button,.uf-grp button{padding:10px 16px;border-radius:999px;background:var(--cream);box-shadow:inset 0 0 0 1px var(--line);font-size:.9rem;font-weight:500;min-height:44px}
.fd-grp button small,.mg-cols a small{display:block;font-size:.68rem;color:var(--muted);font-weight:500;margin-top:1px}
.fd-grp button.on small{color:var(--gold-l)}
.fd-grp button.on,.uf-grp button.on{background:var(--ink);color:var(--cream);box-shadow:none}
.fd-count{margin:18px 0 14px;color:var(--muted)}
.fd-res{max-width:1200px;margin:0 auto;text-align:left}
/* cartes produit */
.ug{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:22px 18px}
.ug-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.uc{display:flex;flex-direction:column;gap:6px;min-width:0}
.uc-img{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--sand);display:block}
.uc-ph{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .8s var(--ease)}
.uc:hover .uc-ph{transform:scale(1.05)}
.uc-img .fav{position:absolute;top:10px;right:10px}
.uc-none{position:absolute;inset:0;display:grid;place-content:center;text-align:center;font:600 2.4rem/1 var(--serif);color:var(--gold-d)}
.uc-none small{display:block;font:500 .72rem/1.3 var(--sans);color:var(--muted);margin-top:8px}
.uc-b{position:absolute;top:10px;left:10px;padding:5px 9px;border-radius:999px;background:var(--ink);color:var(--gold-l);font:700 .66rem/1 var(--sans);letter-spacing:.08em;text-transform:uppercase}
.uc-b-soon{background:var(--gold);color:var(--ink)}
.uc-name{font-weight:500;font-size:.93rem;line-height:1.35}
.uc-price{font-weight:700;color:var(--gold-t);font-size:.92rem}
.uc-soon .uc-ph{filter:saturate(.85)}
.uc-soonbox{grid-column:1/-1;position:relative;display:flex;flex-direction:column;gap:6px;padding:22px 22px 22px;border-radius:16px;border:1.5px dashed var(--gold-d);background:rgba(201,162,75,.07)}
.uc-soonbox .uc-b{position:static;align-self:flex-start;order:-1}
.uc-soonbox span:not(.uc-b){color:var(--muted)}
/* bloc Bébé & Enfants */
.enf-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(22px,4vw,48px);align-items:start}
.enf-big{position:relative;border-radius:24px;overflow:hidden;display:block;aspect-ratio:4/5}
.enf-big img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.enf-lab{position:absolute;left:0;right:0;bottom:0;padding:50px 20px 18px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);display:flex;flex-direction:column;gap:2px}
.enf-lab b{font-family:var(--serif);font-size:1.25rem}
.enf-copy h2{font-size:clamp(1.8rem,3.4vw,2.7rem);line-height:1.1}
.enf-copy>p{color:var(--muted);margin:12px 0 16px;max-width:54ch}
.enf-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
.enf-cats a,.up-rayons a{padding:9px 15px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);font-size:.88rem;font-weight:500;background:var(--cream)}
.enf-cats a:hover,.up-rayons a:hover{box-shadow:inset 0 0 0 1px var(--gold-d)}
.enf-copy .btn{margin-top:24px}
/* coffret */
.cof{margin-top:clamp(36px,5vw,60px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(20px,4vw,44px);align-items:center;padding:clamp(22px,4vw,40px);border-radius:26px;background:var(--ink);color:var(--cream)}
.cof h3{font-size:clamp(1.5rem,2.8vw,2.2rem);line-height:1.15}.cof h3 em{color:var(--gold-l)}
.cof .tag-new{color:var(--gold-l);border-color:var(--gold-l);background:none}
.cof-txt>p{color:var(--on-ink);margin:10px 0 16px}
.cof-pick{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.cof-pick label{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(251,247,238,.06);cursor:pointer;min-height:44px}
.cof-pick b{margin-left:auto;color:var(--gold-l);white-space:nowrap}
.cof-pick input{accent-color:var(--gold);width:18px;height:18px}
.cof-name label{display:block;font-size:.82rem;color:var(--on-ink);margin-bottom:6px}
.cof-name input{width:100%;max-width:280px;padding:11px 14px;border-radius:10px;border:1px solid rgba(226,198,126,.45);background:rgba(251,247,238,.08);color:var(--cream);font:inherit}
.cof-tot{margin:16px 0;font-size:1.05rem;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}
.cof-tot s{color:var(--on-ink)}.cof-tot b{font-size:1.5rem;color:var(--gold-l)}#cofRem{font-size:.82rem;color:var(--on-ink)}
.cof-note{font-size:.8rem;color:var(--on-ink);margin-top:14px}
.cof-pics{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cof-pics img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px}
.cof-pics img:first-child{grid-column:1/-1;aspect-ratio:16/9}
.cof-nom{position:absolute;left:50%;top:28%;transform:translate(-50%,-50%);font:italic 600 clamp(1.4rem,3vw,2.2rem)/1 var(--serif);color:var(--cream);text-shadow:0 2px 14px rgba(0,0,0,.6);pointer-events:none}
/* nos univers */
.ut-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.ut{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/5;display:block}
.ut img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .9s var(--ease)}
.ut:hover img{transform:scale(1.05)}
.ut-lab{position:absolute;left:0;right:0;bottom:0;padding:50px 16px 14px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);display:flex;flex-direction:column}
.ut-lab b{font-family:var(--serif);font-size:1.18rem}.ut-lab span{font-size:.82rem;color:var(--on-ink)}
.ut-offrir{background:var(--ink);display:flex;align-items:flex-end}.ut-o{display:flex;flex-direction:column;gap:10px;padding:20px;color:var(--cream)}.ut-o b{font:600 1.5rem/1.1 var(--serif);color:var(--gold-l)}.ut-o>span:not(.link){color:var(--on-ink);font-size:.9rem}.ut-o .link{color:var(--gold-l);align-self:flex-start}
.ut-new{position:absolute;top:12px;left:12px;font-style:normal;padding:5px 9px;border-radius:999px;background:var(--gold);color:var(--ink);font:700 .66rem/1 var(--sans);letter-spacing:.08em;text-transform:uppercase}
/* vue univers */
.uv{padding:0 clamp(16px,5vw,72px) 80px;max-width:1300px;margin:0 auto}
.uv-tabs{position:relative;display:flex;gap:6px;overflow-x:auto;padding:12px 0;background:var(--cream);border-bottom:1px solid var(--line);margin-bottom:24px}
.uv-tabs button{flex:none;padding:10px 16px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.9rem;min-height:44px}
.uv-tabs button.on{background:var(--ink);color:var(--cream);box-shadow:none}
.up-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,360px);gap:24px;align-items:center;padding:clamp(18px,3vw,30px);border-radius:24px;background:var(--sand);margin-bottom:18px}
.up-crumb{font-size:.82rem;color:var(--muted);margin:0 0 6px}
.up-head h2{font-size:clamp(1.9rem,4vw,3rem)}
.up-txt>p:not(.up-crumb){color:var(--muted);margin:8px 0 0;max-width:56ch}
.up-count{font-weight:700;color:var(--gold-t)!important}
.up-img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:16px}
.up-rayons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
.uf{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;padding:14px 0 18px;border-bottom:1px solid var(--line);margin-bottom:8px}
.uf-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.uf-sort{margin-left:auto;font-size:.86rem;color:var(--muted);display:flex;gap:8px;align-items:center}
.uf-sort select{padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--cream);font:inherit;color:var(--ink)}
.ur{padding:28px 0 6px;scroll-margin-top:110px}
.ur h3{font-size:1.5rem;margin-bottom:16px}.ur h3 small{font:500 .85rem var(--sans);color:var(--muted);margin-left:8px}
.ur-empty{color:var(--muted)}
.up .cof{margin:18px 0 6px}
@media (max-width:1020px){.ut-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mg-panel{grid-template-columns:1fr}.mg-pic{display:none}}
@media (max-width:900px){.enf-grid,.cof,.up-head{grid-template-columns:1fr}.enf-big{aspect-ratio:16/11}.ug-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.ut-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ug{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px}.mbar-more{margin-left:0}.uf-sort{margin-left:0}.up-img{display:none}.fd-grp{justify-content:flex-start}.fd{text-align:left}}
'''

JS2 = r'''
(function(){var d=document;
var cards=d.getElementById('allCards');
function show(view){d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.view===view)});
  d.getElementById('contenu').hidden=view!=='accueil';d.getElementById('vueUnivers').hidden=view!=='univers';}
function openU(id,anchor){show('univers');d.querySelectorAll('.up').forEach(function(a){a.hidden=a.dataset.u!==id});
  d.querySelectorAll('.uv-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.go===id)});
  if(id==='offrir'){var s=d.getElementById('offrirSlot');if(!s.firstChild){s.appendChild(d.getElementById('trouver').cloneNode(true));wireFinder(s.querySelector('.fd'))}}
  var t=anchor?d.querySelector(anchor):null;(t||d.getElementById('vueUnivers')).scrollIntoView({block:'start'});if(!t)scrollTo(0,0)}
d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.addEventListener('click',function(){show(b.dataset.view);scrollTo(0,0)})});
d.getElementById('mbarMore').addEventListener('click',function(){var n=d.getElementById('mbarNotes');n.hidden=!n.hidden;this.setAttribute('aria-expanded',!n.hidden)});
d.addEventListener('click',function(e){var a=e.target.closest('[data-go]');if(a&&!a.closest('.mbar')){e.preventDefault();var h=a.getAttribute('href');d.getElementById('drw').hidden=true;openU(a.dataset.go,h&&h.length>1?h:null);return}
  var f=e.target.closest('[data-find]');if(f){e.preventDefault();d.getElementById('drw').hidden=true;var kv=f.dataset.find.split(':');openU('offrir');
    var fd=d.querySelector('#offrirSlot .fd');fd.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.k===kv[0]&&b.dataset.v===kv[1])});fd._run()}});
var drw=d.getElementById('drw');d.getElementById('burger').addEventListener('click',function(){drw.hidden=false});
drw.addEventListener('click',function(e){if(e.target===drw||e.target.closest('.drw-x'))drw.hidden=true});
function match(c,sel){var p=parseFloat(c.dataset.prix);
  if(sel.qui&&(' '+c.dataset.qui+' ').indexOf(' '+sel.qui+' ')<0)return false;
  if(sel.occ&&(' '+c.dataset.occ+' ').indexOf(' '+sel.occ+' ')<0)return false;
  if(sel.sub&&c.dataset.sub!==sel.sub)return false;
  if(sel.budget){var r=sel.budget.split('-');if(p<+r[0]||p>=+r[1])return false}return true}
function wireFinder(fd){var res=fd.querySelector('.fd-res'),cnt=fd.querySelector('.fd-count');
  fd._run=function(){var sel={};fd.querySelectorAll('button.on').forEach(function(b){sel[b.dataset.k]=b.dataset.v});res.innerHTML='';
    if(!Object.keys(sel).length){cnt.textContent='Choisissez un ou plusieurs critères.';return}
    var ok=[].filter.call(cards.children,function(c){return match(c,sel)});
    cnt.textContent=ok.length?ok.length+' idée'+(ok.length>1?'s':'')+' de cadeau':'Aucune création ne correspond : retirez un critère.';
    ok.slice(0,fd.closest('#offrirSlot')?99:8).forEach(function(c){res.appendChild(c.cloneNode(true))})};
  fd.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('on');
    fd.querySelectorAll('button[data-k="'+b.dataset.k+'"]').forEach(function(x){x.classList.remove('on')});if(!on)b.classList.add('on');fd._run()})})}
/* fêtes à venir, calculées sur la date du jour (jamais une fête passée) */
function nthSunday(y,m,n){var d=new Date(y,m,1);var off=(7-d.getDay())%7;return new Date(y,m,1+off+7*(n-1))}
function lastSunday(y,m){var d=new Date(y,m+1,0);return new Date(y,m,d.getDate()-d.getDay())}
function paques(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31)-1,da=((h+l-7*m+114)%31)+1;return new Date(y,mo,da)}
function fetesDe(y){var fm=lastSunday(y,4);var pent=new Date(paques(y));pent.setDate(pent.getDate()+49);if(fm.getTime()===pent.getTime())fm=nthSunday(y,5,1);
  return [{n:'Noël',o:'noel',d:new Date(y,11,25)},{n:'Saint-Valentin',o:'amour',d:new Date(y,1,14)},{n:'Fête des grands-mères',o:'pour-elle',d:nthSunday(y,2,1)},
          {n:'Fête des mères',o:'pour-elle',d:fm},{n:'Fête des pères',o:'pour-lui',d:nthSunday(y,5,3)}]}
function prochainesFetes(){var now=new Date();now.setHours(0,0,0,0);var y=now.getFullYear(),all=fetesDe(y).concat(fetesDe(y+1));
  var out=all.filter(function(f){return f.d>=now}).sort(function(a,b){return a.d-b.d});var seen={},res=[];
  out.forEach(function(f){if(!seen[f.n]&&(f.d-now)/864e5<=92){seen[f.n]=1;var j=Math.round((f.d-now)/864e5);f.j=j;f.q=j===0?'aujourd’hui':j===1?'demain':'dans '+j+' jours';
    f.date=f.d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});res.push(f)}});return res}
d.querySelectorAll('.fetes').forEach(function(sl){prochainesFetes().forEach(function(f){var el;
  if(sl.dataset.as==='a'){el=d.createElement('a');el.href='#';el.dataset.find='occ:'+f.o;el.textContent=f.n}
  else{el=d.createElement('button');el.type='button';el.dataset.k='occ';el.dataset.v=f.o;el.textContent=f.n}
  sl.parentNode.insertBefore(el,sl)});sl.remove()});
wireFinder(d.getElementById('trouver'));
/* filtres des pages univers */
d.querySelectorAll('.up').forEach(function(up){var sel={};
  function run(){up.querySelectorAll('.ur').forEach(function(r){var n=0;r.querySelectorAll('.ug>.uc').forEach(function(c){var ok=match(c,sel);c.hidden=!ok;if(ok)n++});
    var e=r.querySelector('.ur-empty');if(e)e.hidden=n>0||!r.querySelector('.ug>.uc')})}
  up.querySelectorAll('.uf-grp button').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('on');
    up.querySelectorAll('.uf-grp button[data-f="'+b.dataset.f+'"]').forEach(function(x){x.classList.remove('on')});if(!on)b.classList.add('on');
    sel[b.dataset.f]=on?'':b.dataset.v;run()})});
  var so=up.querySelector('.uf-sort select');if(so)so.addEventListener('change',function(){up.querySelectorAll('.ug').forEach(function(g){
    var cs=[].slice.call(g.children);if(!g._o)g._o=cs.slice();var l=so.value?cs.sort(function(a,b){return (so.value==='asc'?1:-1)*(parseFloat(a.dataset.prix)-parseFloat(b.dataset.prix))}):g._o;
    l.forEach(function(c){g.appendChild(c)})})})});
/* coffret */
d.querySelectorAll('.cof').forEach(function(cf){function calc(){var t=0,n=0;cf.querySelectorAll('.cof-pick input').forEach(function(i){if(i.checked){t+=parseFloat(i.dataset.p);n++}});
  var r=n>=2?.9:1,f=function(v){return v.toFixed(2).replace('.',',')+' €'};
  cf.querySelector('#cofAvant').textContent=n>=2?f(t):'';cf.querySelector('#cofApres').textContent=f(t*r);cf.querySelector('#cofRem').textContent=n>=2?'−10 % dès 2 pièces':'Ajoutez une 2e pièce : −10 %'}
  cf.querySelectorAll('.cof-pick input').forEach(function(i){i.addEventListener('change',calc)});
  cf.querySelector('#cofPrenom').addEventListener('input',function(){cf.querySelector('#cofNom').textContent=this.value.trim()||'Léa'});calc()});
})();
'''

TITLE = "Accueil et univers"
T_CSS = "\n".join(f".{c}{{background-image:url({thumb(f)})}}" for f, c in TCLS.items())
STYLE = f"<style>{CSS}\n{IMG_CSS}\n{CSS2}\n{T_CSS}</style>"
HIDDEN = f'<div id="allCards" hidden>{ALL_CARDS}</div>'
full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>{HEAD_LINKS}{STYLE}</head><body>{body}{HIDDEN}<script>{JS}</script><script>{JS2}</script></body></html>'
frag = f'<title>{TITLE}</title>{HEAD_LINKS}{STYLE}{body}{HIDDEN}<script>{JS}</script><script>{JS2}</script>'
open(os.path.join(OUT, "accueil-univers.html"), "w").write(full)
open(os.path.join(OUT, "accueil-univers.fragment.html"), "w").write(frag)
print("ok", len(full) // 1024, "Ko ·", len(P), "produits ·", ", ".join(f'{u["nom"]} {compte(u)}' for u in UNIVERS))
