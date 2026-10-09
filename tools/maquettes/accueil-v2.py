#!/usr/bin/env python3
"""Maquette « accueil + univers » (08/10/2026) — reprend la maquette ENREGISTRÉE accueil-moderne (sans la
modifier : son générateur est lu puis exécuté ici sans écrire ses fichiers) et la retravaille :
  · menu rangé en 8 univers + « Offrir », avec panneau déroulant (ordinateur) et tiroir (téléphone) ;
  · « Trouver un cadeau en 3 clics » (pour qui / occasion / budget) juste sous le héros ;
  · nouveau bloc « Bébé & Enfant » + coffret assorti ;
  · « Nos univers » à la place de « Explorez nos collections » ;
  · une 2e vue « Univers » : une page par univers avec TOUS les produits du catalogue, rangés par rayon,
    plus une page « Toute la boutique ».
Entrée : catalogue exporté par tools/maquettes/catalogue-export.mjs (JSON, avec first/max/perso).
Usage : python3 tools/maquettes/accueil-v2.py <catalogue.json> [--puzzles]
  sans drapeau  → docs/maquettes/accueil-univers.html (seulement les produits en ligne)
  --puzzles     → docs/maquettes/accueil-univers-avec-puzzles.html (+ rayon « Jeux en bois » et
                  « Cristaux déjà gravés » marqués « Bientôt », coffret Savane)
Rien n'est touché dans le site : c'est une maquette, en attente du « applique »."""
import base64, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PROD = os.path.join(ROOT, "public", "produits")
OUT = os.path.join(ROOT, "docs", "maquettes")
PUZ = "--puzzles" in sys.argv                      # version « avec puzzles » (produits pas encore en ligne)
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]

# 1) La maquette enregistrée, exécutée sans écrire ses fichiers.
src = open(os.path.join(HERE, "accueil-moderne.py"), encoding="utf-8").read()
src = src[: src.index("\nfull = ")]
base = {"__file__": os.path.join(HERE, "accueil-moderne.py"), "__name__": "accueil_moderne"}
exec(compile(src, "accueil-moderne.py", "exec"), base)
BODY, CSS, JS, IMG_CSS, HEAD_LINKS = base["BODY"], base["CSS"], base["JS"], base["IMG_CSS"], base["HEAD_LINKS"]
ic, ph = base["ic"], base["ph"]
ICON2 = {"image": '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'}
def ic2(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICON2[n]}</svg>'

# 2) Catalogue
CAT = json.load(open(ARGS[0], encoding="utf-8"))
P = {p["slug"]: p for p in CAT["products"]}

def r90(n):
    return round(n - 0.9) + 0.9

def fmt(v):
    return f"{v:.2f}".replace(".", ",") + " €"

def prix(p):
    """Prix affiché comme sur la vignette du site : prix de la 1re variante, « dès » seulement si c'est la moins
    chère. Renvoie (libellé, mini, maxi) — les bijoux portent la remise −10 % de catalog.js."""
    def rem(v):
        return round(r90(v * 0.9) * 0.9, 2) if p["category"] == "bijoux" else v
    first, lo, hi = rem(p["first"]), rem(p["min"]), rem(p["max"])
    lab = ("dès " if (p["multi"] and p["first"] == p["min"]) else "") + fmt(first)
    return lab, lo, hi

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
REMOTE = [s for s in P if not photo(s) and P[s]["img0"]]   # photos sur le CDN, injoignable d'ici

# 3) Les univers (rangement proposé). Une pièce peut apparaître dans 2 univers (ex. veilleuse, flûte) ;
#    son « univers d'origine » = le premier de la liste (c'est là que vit sa carte #p-<slug>).
def bij(prefix):
    return [s for s, p in P.items() if p["category"] == "bijoux" and p["name"].startswith(prefix)]
PUZZLES = [("foret", "Forêt"), ("savane", "Savane"), ("dinosaures", "Dinosaures"), ("animaux-amerique", "Grand Nord"),
           ("australie", "Australie"), ("vehicules-secours", "Véhicules de secours"), ("camping", "Camping"),
           ("jardin-enchante", "Jardin enchanté"), ("fruits-legumes", "Fruits & légumes")]
UNIVERS = [
 {"id": "bijoux", "nom": "Bijoux", "accroche": "Colliers et bracelets en acier, la plupart gravés avec un prénom, une date ou un mot qui vous est cher.",
  "img": "/produits/collier-3coeurs-3.jpg", "pourqui": True,
  "rayons": [("Colliers", bij("Collier")), ("Bracelets", bij("Bracelet"))]},
 {"id": "cristal", "nom": "Cristal photo 3D", "accroche": "Votre photo gravée au laser à l’intérieur d’un bloc de cristal.",
  "img": "/produits/cristal-v-femme.jpg",
  "rayons": [("Blocs photo 3D", ["cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"])]
            + ([("Cristaux déjà gravés", "bientot-cristaux")] if PUZ else [])
            + [("Porte-clés & USB", ["porte-cles-cristal-led-coeur", "porte-cles-cristal-led-rectangle", "cle-usb-cristal-3d"])]},
 {"id": "verres", "nom": "Verres & Carafes", "accroche": "Verres à whisky, à cocktail, à vin, flûtes et carafe, gravés à la commande.",
  "img": "/produits/verre_a_whisky_exemple_face.jpg", "pourqui": True,
  "rayons": [("Verres à whisky", ["verre-a-whisky-grave", "verre-a-whisky-fete-des-peres"]),
             ("Vin, champagne, cocktail & carafe", ["verre-a-vin-grave", "flute-a-champagne-gravee", "verre-a-cocktail-grave", "carafe-a-whisky-gravee"])]},
 {"id": "enfants", "nom": "Bébé & Enfant", "neuf": True, "accroche": "De la naissance aux premiers repas, des cadeaux personnalisés avec le prénom de votre enfant.",
  "img": "/produits/couverts_enfants_ex_enfant.jpg",
  "rayons": [("Naissance & baptême", ["plaque-de-naissance", "plaque-de-naissance-coeur", "cartes-etapes-bebe-animaux", "cartes-etapes-bebe-girafe", "bracelet-empreinte-pied-bebe"]),
             ("Repas & chambre", ["couverts-enfants-personnalises", "veilleuse-arbre-de-vie-prenom", "plaque-de-porte-enfant"])]
            + ([("Jeux en bois", "bientot-puzzles")] if PUZ else [])},
 {"id": "mariage", "nom": "Mariage & Réception", "accroche": "Numéros de table, menus, décorations de table et verres de réception, gravés pour votre jour.",
  "img": "/produits/numero_table_arche_geometrique_relief_bois.jpeg",
  "rayons": [("Numéros de table", [s for s, p in P.items() if p["subcategory"] == "tables"]),
             ("Décor de table & menus", ["etiquette-serviette-initiales", "ronds-de-serviette-bois", "porte-serviettes-bois-fleur", "porte-serviettes-colombes", "menu-de-mariage-bois-grave"]),
             ("Verres de réception", ["flute-a-champagne-gravee", "carafe-a-whisky-gravee", "verre-a-vin-grave"])]},
 {"id": "maison", "nom": "Maison & Déco", "accroche": "Lampes, veilleuses et bougeoirs gravés, pour une lumière qui vous ressemble.",
  "img": "/produits/arbre-vie-rond-1.jpg",
  "rayons": [("Lampes & veilleuses", ["arbre-de-vie-lumineux", "veilleuse-arbre-de-vie-ronde", "veilleuse-arbre-de-vie-prenom", "lampe-led-paris-saint-germain"]),
             ("Bougeoirs", ["bougeoir-mandala-bois", "photophore-fee-bois", "bougeoir-fleur-de-lotus"])]},
 {"id": "cadeaux", "nom": "Petits cadeaux", "accroche": "Clés USB, porte-clés, pièce à graver et accessoires de bureau, personnalisés ou prêts à offrir.",
  "img": "/produits/cle_usb_en_bois_4gb_avec_boite_en_bois.jpg", "pourqui": True,
  "rayons": [("Clés USB", ["cle-usb-personnalisee", "cle-usb-bois-coffret", "cle-usb-cristal-3d"]),
             ("Porte-clés & pièce à graver", ["porte-cles-cuir-a-graver", "piece-ronde-laiton", "porte-cles-cristal-led-coeur", "porte-cles-cristal-led-rectangle"]),
             ("Bureau", ["support-telephone-bois-grave", "support-telephone-bois-ajoure", "porte-stylo-coq-coupe-du-monde",
                         "porte-stylo-portugal-coupe-du-monde", "porte-stylo-argentine-coupe-du-monde", "porte-stylo-espagne-coupe-du-monde"])]},
]
rang = {s for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list) for s in l}
oublis = [s for s in P if s not in rang]
assert not oublis, f"produits non rangés : {oublis}"
manque = [s for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list) for s in l if s not in P]
assert not manque, f"produits inconnus : {manque}"
assert all(len(set(l)) >= 2 for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list)), "un rayon n'a qu'une création"
def compte(u):
    return len({s for _, l in u["rayons"] if isinstance(l, list) for s in l})
HOME = {}                                          # slug → univers d'origine
for u in UNIVERS:
    for _, l in u["rayons"]:
        if isinstance(l, list):
            for s in l: HOME.setdefault(s, u["id"])
def card_id(s, uid):
    return f"p-{s}" if uid == HOME[s] else f"p-{uid}-{s}"
# Page synthétique « Toute la boutique » (= /boutique en ligne) : chaque création une seule fois, par univers.
_vus = set()
BOUTIQUE = {"id": "boutique", "nom": "Toute la boutique", "accroche": "Toutes nos créations, en un seul rayon par univers.",
            "img": "/produits/cristal-v-femme.jpg", "pourqui": True, "rayons": []}
for u in UNIVERS:
    l = [s for _, r in u["rayons"] if isinstance(r, list) for s in r if s not in _vus and not _vus.add(s)]
    BOUTIQUE["rayons"].append((u["nom"], l))
assert compte(BOUTIQUE) == len(P)

# « Pour qui » : lu dans occasions.js (occ) + tableau de complément pour les pièces sans occasion.
POURQUI = {"elle": "Pour elle", "lui": "Pour lui", "couple": "Pour un couple", "enfant": "Pour bébé & enfant", "parents": "Pour des parents"}
def court(v):                                      # « Pour elle » → « Elle » (boutons du bloc « Pour qui ? »)
    v = v.replace("Pour ", ""); return v[:1].upper() + v[1:]
COUPLE = {"collier-couple-coeur-lot2", "collier-couple-puzzle", "flute-a-champagne-gravee", "verre-a-vin-grave",
          "porte-cles-cristal-led-coeur", "cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"}
QUI_EXTRA = {
 "verre-a-cocktail-grave": ["elle", "lui", "couple"], "lampe-led-paris-saint-germain": ["lui", "enfant"],
 "porte-stylo-coq-coupe-du-monde": ["lui", "enfant"], "porte-stylo-portugal-coupe-du-monde": ["lui", "enfant"],
 "porte-stylo-argentine-coupe-du-monde": ["lui", "enfant"], "porte-stylo-espagne-coupe-du-monde": ["lui", "enfant"],
 "support-telephone-bois-grave": ["lui", "elle"], "support-telephone-bois-ajoure": ["lui", "elle"],
 "bougeoir-mandala-bois": ["elle", "parents"], "bougeoir-fleur-de-lotus": ["elle", "parents"], "photophore-fee-bois": ["elle", "parents"],
 "verre-a-vin-grave": ["couple", "elle"], "flute-a-champagne-gravee": ["couple", "elle"],
 "cle-usb-personnalisee": ["lui"], "cle-usb-bois-coffret": ["lui"], "cle-usb-cristal-3d": ["lui"],
 "porte-cles-cuir-a-graver": ["lui"], "piece-ronde-laiton": ["lui"],
}
QUI_UNIVERS = {"verres": ["lui"], "maison": ["elle", "parents"], "cristal": ["parents", "couple"], "mariage": ["maries"]}
ENF = {x for u in UNIVERS if u["id"] == "enfants" for _, l in u["rayons"] if isinstance(l, list) for x in l}
def pourqui(s):
    p, t = P[s], set(QUI_EXTRA.get(s, []))
    if "pour-elle" in p["occ"]: t.add("elle")
    if "pour-lui" in p["occ"]: t.add("lui")
    if p["subcategory"] == "couple" or s in COUPLE: t.add("couple")
    if s in ENF or p["subcategory"] == "bebe": t.add("enfant")
    if "famille" in p["occ"] or "naissance" in p["occ"]: t.add("parents")
    if not t: t.update(QUI_UNIVERS.get(HOME[s], []))   # repli par univers (« maries » = hors boutons, trouvable par l'occasion)
    return sorted(t)
def occasions(s):
    o = list(P[s]["occ"])
    if not o: o = ["anniversaire", "noel"]
    elif not set(o) <= {"mariage", "naissance"}: o.append("anniversaire")
    return " ".join(o)

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")

def carte(s, uid=None):
    """Carte produit. uid = page univers (la carte porte alors son id d'ancre) ; sans uid = réserve / bloc d'accueil."""
    p = P[s]; lab, lo, hi = prix(p); im = photo(s)
    if im:
        pic = f'<span class="uc-ph {im}" role="img" aria-label="{esc(p["name"])}"></span>'
    else:   # photo sur le CDN : chargée par le navigateur du gérant, repli discret sinon
        pic = f'<span class="uc-none">{ic2("image")}<small>photo sur le site</small></span>'
        if p["img0"]: pic += f'<img class="uc-ph uc-remote" src="{esc(p["img0"])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">'
    badge = f'<span class="badge">{esc(p["badge"])}</span>' if p["badge"] else ""
    cta = f'<span class="pt-cta">Personnaliser {ic("arrow")}</span>' if p["perso"] else ""
    tag = "" if p["perso"] else '<span class="uc-tag">Prêt à offrir</span>'
    idattr = f' id="{card_id(s, uid)}"' if uid else ""
    return (f'<div class="uc"{idattr} data-u="{HOME[s]}" data-prix="{lo}" data-prixmax="{hi}" data-qui="{" ".join(pourqui(s))}" data-occ="{occasions(s)}" data-perso="{1 if p["perso"] else 0}">'
            f'<a class="uc-link" href="#p-{s}"><span class="uc-img">{pic}{badge}{cta}</span>'
            f'<span class="uc-name">{esc(p["name"])}</span><span class="uc-price">{lab}</span>{tag}</a>'
            f'<button class="fav" type="button" aria-label="Garder pour plus tard">{ic("heart")}</button></div>')

def bientot(kind):
    """Produits pas encore en ligne (version --puzzles) : marqués « Bientôt », jamais dans la réserve du finder."""
    if kind == "bientot-puzzles":
        return "".join(f'<div class="uc uc-soon" data-prix="29.9" data-prixmax="29.9" data-qui="enfant" data-occ="naissance noel anniversaire" data-perso="1">'
                       f'<a class="uc-link" href="#"><span class="uc-img"><span class="uc-ph {tcls(os.path.join(OUT, "assets", "jeux-enfants", f + ".jpg"))}" role="img" aria-label="Puzzle {n}"></span>'
                       f'<span class="badge uc-b-soon">Bientôt</span></span><span class="uc-name">Puzzle en bois — {n}</span><span class="uc-price">29,90 € · prénom compris</span></a></div>' for f, n in PUZZLES)
    return ('<a class="uc-soonbox" href="#"><b>Cristaux déjà gravés</b><span>Sirène, colibri, cœur, Noël… des modèles prêts à offrir, '
            'à choisir dans le format et la taille que vous voulez.</span><span class="badge uc-b-soon">Bientôt</span></a>')

def puce(tag, attrs, label, cls=""):
    return f'<{tag} class="puce{(" " + cls) if cls else ""}" {attrs}>{label}</{tag}>'

def page_univers(u):
    uid = u["id"]
    chips = "".join(puce("a", f'href="#r-{uid}-{i}"', esc(n)) for i, (n, _) in enumerate(u["rayons"]))
    if uid == "enfants": chips += puce("a", 'href="#coffret-enfants"', "Coffret assorti")
    filt = ""
    if u.get("pourqui"):
        filt += '<div class="uf-grp" role="group" aria-label="Pour qui"><span>Pour qui</span>' + "".join(
            puce("button", f'type="button" data-f="qui" data-v="{v}" aria-pressed="false"', esc(l)) for v, l in POURQUI.items()) + "</div>"
    filt += '<div class="uf-grp" role="group" aria-label="Budget"><span>Budget</span>' + "".join(
        puce("button", f'type="button" data-f="budget" data-v="{v}" aria-pressed="false"', l) for v, l in (("0-20", "Moins de 20 €"), ("20-40", "20 à 40 €"), ("40-999", "Plus de 40 €"))) + "</div>"
    filt += '<label class="uf-sort">Trier <select><option value="">Notre sélection</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label>'
    blocs = ""
    for i, (n, l) in enumerate(u["rayons"]):
        cards = "".join(carte(s, uid) for s in l) if isinstance(l, list) else bientot(l)
        nb = f'{len(set(l))} créations' if isinstance(l, list) else "bientôt"
        blocs += f'<section class="ur" id="r-{uid}-{i}"><h3>{esc(n)} <small>{nb}</small></h3><div class="ug">{cards}</div><p class="ur-empty" hidden>Aucune création de ce rayon ne correspond à votre choix.</p></section>'
    extra = coffret("enfants") if uid == "enfants" else ""
    crumb = (f'<nav class="up-crumb" aria-label="Fil d’Ariane"><a href="#" data-view="accueil">Accueil</a> › '
             + (f'<a href="#" data-go="boutique">Boutique</a> › ' if uid != "boutique" else "")
             + f'<span aria-current="page">{esc(u["nom"])}</span></nav>')
    return (f'<article class="up" id="u-{uid}" data-u="{uid}" hidden>'
            f'<header class="up-head"><div class="up-txt">{crumb}<h2>{esc(u["nom"])}</h2><p>{esc(u["accroche"])}</p>'
            f'<p class="up-count">{compte(u)} créations</p></div><img class="up-img" src="{thumb(u["img"], 700)}" alt=""></header>'
            f'<nav class="up-rayons" aria-label="Rayons">{chips}</nav><div class="uf">{filt}</div>{blocs}{extra}</article>')

# 4) Coffret assorti (Bébé & Enfant) — noms et prix lus dans le catalogue ; le puzzle (pas en ligne) reste en dur.
def piece(slug):
    return (P[slug]["name"], prix(P[slug])[1])
if PUZ:
    PIECES = [piece("couverts-enfants-personnalises") + (True,), ("Puzzle en bois personnalisé", 29.90, True), piece("veilleuse-arbre-de-vie-prenom") + (False,)]
    COF_TITRE, COF_TXT = "le coffret Savane", "Les couverts, le puzzle et la veilleuse dans le même thème. Vous écrivez le prénom une seule fois : les trois pièces sont personnalisées ensemble."
    COF_NOTE, COF_PIC2 = "D’autres thèmes suivront dès que le même motif existe sur les couverts et sur le puzzle.", os.path.join(OUT, "assets", "jeux-enfants", "savane.jpg")
else:
    PIECES = [piece("couverts-enfants-personnalises") + (True,), piece("veilleuse-arbre-de-vie-prenom") + (True,), piece("plaque-de-porte-enfant") + (False,)]
    COF_TITRE, COF_TXT = "le coffret Chambre d’enfant", "Les couverts, la veilleuse et la plaque de porte, personnalisés ensemble. Vous écrivez le prénom une seule fois."
    COF_NOTE, COF_PIC2 = "Trois pièces de notre atelier, gravées avec le même prénom et expédiées ensemble.", "/produits/couverts_enfants_ex_prenom.jpg"
COF_AVANT = sum(v for _, v, c in PIECES if c)
COF_APRES = COF_AVANT * (0.9 if sum(1 for *_, c in PIECES if c) >= 2 else 1)
def coffret(n):
    """Le bloc coffret, rendu 2 fois (accueil + page Bébé & Enfant) : les ids sont suffixés pour rester uniques."""
    picks = "".join(f'<label><input type="checkbox"{" checked" if c else ""} data-p="{v}"> {esc(nm)} <b>{fmt(v)}</b></label>' for nm, v, c in PIECES)
    return f'''<div class="cof" id="coffret-{n}">
  <div class="cof-txt"><span class="tag-new">Nouveau — coffret assorti</span>
    <h3>Un prénom, un univers&nbsp;: <em>{COF_TITRE}</em></h3>
    <p>{COF_TXT}</p>
    <div class="cof-pick" role="group" aria-label="Pièces du coffret">{picks}</div>
    <div class="cof-name"><label for="cofPrenom-{n}">Prénom de l’enfant (gravé sur chaque pièce)</label><input id="cofPrenom-{n}" maxlength="14" placeholder="Ex. Léa" autocomplete="off"></div>
    <p class="cof-tot"><s>{fmt(COF_AVANT)}</s> <b>{fmt(COF_APRES)}</b> <span>−10 % dès 2 pièces</span></p>
    <a class="btn btn-gold" href="#">Composer mon coffret {ic("arrow")}</a>
    <p class="cof-note">{COF_NOTE}</p>
  </div>
  <div class="cof-pics" aria-hidden="true">
    <img src="{thumb("/produits/couverts_enfants_ex_animaux.jpg", 520)}" alt=""><img src="{thumb(COF_PIC2, 520)}" alt="">
    <img src="{thumb("/produits/veilleuse-prenom-1.jpg", 520)}" alt=""><span class="cof-nom">Léa</span>
  </div>
</div>'''

# 5) Menu rangé (8 entrées) + panneau déroulant + tiroir téléphone
def ordre_menu(l):
    """Dans le panneau : d'abord les photos gravées connues, puis celles avec photo locale, puis les autres."""
    return sorted(l, key=lambda s: (0, list(PHOTO).index(s)) if s in PHOTO else (1 if photo(s) else 2, l.index(s)))
def mega(u):
    uid, cols = u["id"], ""
    for i, (n, l) in enumerate(u["rayons"]):
        if isinstance(l, list):
            links = "".join(f'<a href="#{card_id(s, uid)}" data-go="{uid}">{esc(P[s]["name"])}</a>' for s in ordre_menu(l)[:6])
            more = f'<a class="mg-more" href="#r-{uid}-{i}" data-go="{uid}">Voir les {len(set(l))} créations →</a>' if len(set(l)) > 6 else ""
        else:
            links, more = f'<a href="#r-{uid}-{i}" data-go="{uid}">Bientôt</a>', ""
        cols += f'<div><a class="mg-h" href="#r-{uid}-{i}" data-go="{uid}"><b>{esc(n)}</b></a>{links}{more}</div>'
    return (f'<div class="mg-panel"><div class="mg-cols">{cols}</div><a class="mg-pic" href="#" data-go="{uid}"><img src="{thumb(u["img"], 420)}" alt="">'
            f'<span><b>Voir les {compte(u)} créations</b>{ic("arrow")}</span></a></div>')
OFFRIR_PANEL = ('<div class="mg-panel"><div class="mg-cols">'
  '<div><b>Pour qui ?</b>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '</div>'
  '<div><b>Pour quelle occasion ?</b><span class="fetes" data-max="3" data-as="a"></span><a href="#" data-find="occ:naissance">Naissance &amp; baptême</a><a href="#" data-find="occ:mariage">Mariage</a><a href="#" data-find="occ:anniversaire">Anniversaire</a><a href="#" data-find="occ:amour">Amour</a></div>'
  '<div><b>Quel budget ?</b><a href="#" data-find="budget:0-20">Moins de 20 €</a><a href="#" data-find="budget:20-40">20 à 40 €</a><a href="#" data-find="budget:40-999">Plus de 40 €</a><a href="#" title="Page du site, inchangée">Carte cadeau</a><a href="#" class="mg-promo" title="Page du site, inchangée">Promotions</a></div>'
  f'</div><a class="mg-pic" href="#" data-go="offrir"><img src="{thumb("/produits/couverts_enfants_ex_prenom.jpg", 420)}" alt=""><span><b>Offrir une carte cadeau · de 20 à 100 €</b>{ic("arrow")}</span></a></div>')
def pill_new(u):
    return ' <i class="pill-new">Nouveau</i>' if u.get("neuf") else ""
NAV = ('<nav class="hnav hnav2" aria-label="Principal">'
       + "".join(f'<div class="mg"><a href="#" class="mg-top" data-go="{u["id"]}" aria-haspopup="true" aria-expanded="false">{esc(u["nom"])}{pill_new(u)}</a>{mega(u)}</div>' for u in UNIVERS)
       + f'<div class="mg"><a href="#" class="mg-top mg-offrir" data-go="offrir" aria-haspopup="true" aria-expanded="false">Offrir</a>{OFFRIR_PANEL}</div>'
       + '</nav>')
DRAWER = ('<div class="drw" id="drw" hidden><div class="drw-in" role="dialog" aria-modal="true" aria-label="Menu"><button class="drw-x" type="button" aria-label="Fermer">×</button>'
          + '<a class="drw-home" href="#" data-view="accueil"><b>Accueil</b></a>'
          + "".join(f'<details><summary>{esc(u["nom"])} <small>{compte(u)}</small>{pill_new(u)}</summary>' + "".join(f'<a href="#r-{u["id"]}-{i}" data-go="{u["id"]}">{esc(n)}</a>' for i, (n, _) in enumerate(u["rayons"])) + f'<a href="#" data-go="{u["id"]}"><b>Tout voir</b></a></details>' for u in UNIVERS)
          + '<details><summary>Offrir</summary>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '<a href="#" title="Page du site, inchangée">Carte cadeau</a></details>'
          + f'<a class="drw-all" href="#" data-go="boutique"><b>Toute la boutique</b> · {len(P)} créations</a>'
          + '<div class="drw-sec"><a href="#" title="Page du site, inchangée">Promotions</a><a href="#" title="Page du site, inchangée">Idées &amp; conseils</a><a href="#" title="Page du site, inchangée">À propos</a><a href="#" title="Page du site, inchangée">Contact</a><a href="#" title="Page du site, inchangée">Mon compte</a></div></div></div>')

# 6) Blocs ajoutés à l'accueil
FINDER = '''<section class="fd" id="trouver" aria-labelledby="t-fd"><span class="tag-new">Nouveau bloc</span>
  <h2 id="t-fd">Trouver un cadeau <em>en 3 clics</em></h2>
  <div class="fd-grp" role="group" aria-label="Pour qui"><span>Pour qui ?</span>''' + "".join(puce("button", f'type="button" data-k="qui" data-v="{k}" aria-pressed="false"', esc(court(v))) for k, v in POURQUI.items()) + '''</div>
  <div class="fd-grp" role="group" aria-label="Occasion"><span>Pour quelle occasion ?</span><span class="fetes" data-max="3" data-as="button"></span>''' + "".join(
    puce("button", f'type="button" data-k="occ" data-v="{v}" aria-pressed="false"', l) for v, l in (("naissance", "Naissance &amp; baptême"), ("mariage", "Mariage"), ("anniversaire", "Anniversaire"), ("amour", "Amour"))) + '''</div>
  <div class="fd-grp" role="group" aria-label="Budget"><span>Quel budget ?</span>''' + "".join(
    puce("button", f'type="button" data-k="budget" data-v="{v}" aria-pressed="false"', l) for v, l in (("0-20", "Moins de 20 €"), ("20-40", "20 à 40 €"), ("40-999", "Plus de 40 €"))) + '''</div>
  <p class="fd-count" id="fdCount" aria-live="polite">Choisissez un ou plusieurs critères.</p>
  <div class="ug fd-res" id="fdRes"></div>
</section>'''
enf = next(u for u in UNIVERS if u["id"] == "enfants")
couv = P["couverts-enfants-personnalises"]
ENFANTS = f'''<section class="sec enf" aria-labelledby="t-enf"><span class="tag-new">Nouveau bloc</span>
  <div class="enf-grid">
    <a class="enf-big" href="#" data-go="enfants"><img src="{thumb("/produits/couverts_enfants_ex_enfant.jpg", 900)}" alt="Enfant qui mange avec sa cuillère personnalisée">
      <span class="enf-lab"><b>{esc(couv["name"])}</b><span>{prix(couv)[0]}</span></span></a>
    <div class="enf-copy">
      <h2 id="t-enf">Bébé &amp; Enfant&nbsp;: <em>des cadeaux personnalisés avec le prénom de votre enfant</em></h2>
      <p>Naissance, premiers repas, chambre{", jeux" if PUZ else ""} : tous nos cadeaux personnalisés pour les petits, réunis au même endroit.</p>
      <div class="enf-cats">{"".join(puce("a", f'href="#r-enfants-{i}" data-go="enfants"', esc(n)) for i, (n, _) in enumerate(enf["rayons"]))}</div>
      <div class="ug ug-4">{"".join(carte(s) for s in ["plaque-de-naissance-coeur", "veilleuse-arbre-de-vie-prenom", "cartes-etapes-bebe-animaux", "bracelet-empreinte-pied-bebe"])}</div>
      <a class="btn btn-ink" href="#" data-go="enfants">Voir tout l’univers {ic("arrow")}</a>
    </div>
  </div>
  {coffret("home")}
</section>'''
UT_NEW = '<i class="pill-new ut-new">Nouveau</i>'
UNIV_TILES = "".join(
    f'<a class="ut" href="#" data-go="{u["id"]}"><img src="{thumb(u["img"], 620)}" alt=""><span class="ut-lab"><b>{esc(u["nom"])}</b><span>{compte(u)} créations</span></span>{UT_NEW if u.get("neuf") else ""}</a>'
    for u in UNIVERS) + (f'<a class="ut ut-offrir" href="#" data-go="offrir"><b>Offrir</b><span class="ut-chips"><i>Pour qui</i><i>Occasion</i><i>Budget</i></span>'
    f'<span>Trouvez un cadeau en 3 clics.</span>{ic("arrow")}</a>')
UNIVERS_HOME = f'''<section class="sec" id="univers" aria-labelledby="t-univ"><span class="tag-new tag-mod">Bloc retravaillé</span>
  <div class="sec-head"><div><h2 id="t-univ">Nos univers</h2><p class="sub">Toutes nos créations, classées par univers. Les pièces personnalisables sont gravées à la commande dans notre atelier.</p></div></div>
  <div class="ut-grid">{UNIV_TILES}</div>
</section>'''

# 7) Montage : accueil (vue 1) + univers (vue 2). Les textes hérités se corrigent ici, jamais dans accueil-moderne.py.
body = BODY
def remplace(old, new, n=1):
    global body
    assert old in body, f"chaîne héritée introuvable : {old[:60]}"
    body = body.replace(old, new, n)
nav_old = re.search(r'<nav class="hnav".*?</nav>', body, re.S).group(0)
remplace(nav_old, NAV)
remplace('<button class="menu-toggle" type="button" aria-label="Menu">', '<button class="menu-toggle" type="button" aria-label="Menu" id="burger" aria-expanded="false" aria-controls="drw">')
remplace('class="logo" aria-label', 'class="logo" data-view="accueil" aria-label')
remplace('<section class="sec bijoux"', FINDER + '\n<section class="sec bijoux"')
remplace('<section class="limited"', ENFANTS + '\n<section class="limited"')
coll = re.search(r'<section class="sec" aria-labelledby="t-coll">.*?</section>', body, re.S).group(0)
remplace(coll, UNIVERS_HOME)
# règle du gérant (08/10) : jamais « au prénom » / « à votre prénom » dans nos textes ; capitales cohérentes
remplace('Des bijoux gravés <em>au prénom de votre choix</em>', 'Des bijoux gravés <em>avec le prénom de votre choix</em>')
remplace('gravée à votre prénom ou au modèle de votre choix', 'gravée avec votre prénom ou le modèle de votre choix')
remplace('Cristal Photo 3D <b>dès', 'Cristal photo 3D <b>dès')
remplace('Verres &amp; carafes gravés', 'Verres &amp; Carafes gravés')
remplace('Voir tous les verres &amp; carafes', 'Voir tous les verres &amp; Carafes')
remplace('chaque pièce est gravée à la commande dans notre atelier. Une pièce qui n’existe qu’une fois.',
         'chaque création est faite à la commande dans notre atelier, et n’existe qu’une fois.')
# pied de page : colonne Boutique = les univers + Offrir, liens utiles branchés, le reste = pages du site inchangées
remplace('<a href="#">Bijoux femme</a><a href="#">Bijoux homme</a><a href="#">Mariage &amp; Réception</a><a href="#">Cadeaux &amp; Déco</a><a href="#">Tout voir</a>',
         "".join(f'<a href="#" data-go="{u["id"]}">{esc(u["nom"])}</a>' for u in UNIVERS) + '<a href="#" data-go="offrir">Offrir</a><a href="#" data-go="boutique">Tout voir</a>')
remplace('<a href="#">Trouver un cadeau par occasion</a>', '<a href="#" data-go="offrir">Trouver un cadeau par occasion</a>')
foot = re.search(r'<footer class="footer">.*?</footer>', body, re.S).group(0)
remplace(foot, re.sub(r'<a( style="[^"]*")? href="#">', r'<a\1 href="#" title="Page du site, inchangée">', foot))
assert NAV in body and FINDER in body and ENFANTS in body and UNIVERS_HOME in body

UNIV_VIEW = ('<main class="uv" id="vueUnivers" hidden><nav class="uv-tabs" aria-label="Univers">'
             + puce("button", 'type="button" data-view="accueil"', "Accueil")
             + "".join(puce("button", f'type="button" data-go="{u["id"]}" aria-current="false"', f'{esc(u["nom"])} <small>{compte(u)}</small>') for u in UNIVERS)
             + puce("button", 'type="button" data-go="boutique" aria-current="false"', f'Tout <small>{len(P)}</small>')
             + puce("button", 'type="button" data-go="offrir" aria-current="false"', "Offrir") + '</nav>'
             + "".join(page_univers(u) for u in UNIVERS) + page_univers(BOUTIQUE)
             + '<article class="up" id="u-offrir" data-u="offrir" hidden><header class="up-head"><div class="up-txt"><nav class="up-crumb" aria-label="Fil d’Ariane"><a href="#" data-view="accueil">Accueil</a> › <span aria-current="page">Offrir</span></nav><h2>Trouver un cadeau</h2>'
               '<p>Toutes nos créations, selon la personne, l’occasion et le budget.</p></div></header><div id="offrirSlot"></div></article>'
             + '</main>')
NOTES = f'''<div class="mbar" role="region" aria-label="Maquette">
  <div class="mbar-in"><b>Maquette — rien n’est en ligne</b>
  <div class="mbar-tabs" role="tablist"><button type="button" class="on" data-view="accueil">Page d’accueil</button><button type="button" data-view="univers"><span class="l">Pages univers (tous les produits)</span><span class="s">Univers</span></button></div>
  <button type="button" class="mbar-more" id="mbarClean" aria-pressed="false"><span class="l">Masquer les annotations</span><span class="s">Annotations</span></button>
  <button type="button" class="mbar-more" id="mbarMore" aria-expanded="false">Ce qui change</button></div>
  <ul class="mbar-notes" id="mbarNotes" hidden>
    <li><b>Menu rangé en 8 entrées</b> (au lieu de 15) : 7 univers + « Offrir ». Survol = panneau avec les rayons et une photo. Sur téléphone, le ☰ ouvre un menu complet, univers par univers.</li>
    <li><b>Nouvel univers « Bébé &amp; Enfant »</b> : les couverts, la veilleuse et la plaque de porte quittent « Déco », avec les plaques de naissance, les cartes étapes{" et les futurs puzzles" if PUZ else ""}.</li>
    <li><b>« Trouver un cadeau en 3 clics »</b> sous le héros (pour qui, occasion, budget) : les acheteurs de cadeaux pensent « pour qui » avant « quel produit ».</li>
    <li><b>Coffret assorti « {"Savane" if PUZ else "Chambre d’enfant"} »</b> : le même thème sur plusieurs pièces, le prénom écrit une seule fois, −10 % dès 2 pièces (proposition).</li>
    <li><b>Les fêtes se mettent à jour toutes seules</b> : Noël, Saint-Valentin, fête des grands-mères, fête des mères, fête des pères sont calculées sur la date du jour ; seules celles des 3 prochains mois sont proposées. Une fête passée disparaît d’elle-même.</li>
    <li><b>« Nos univers »</b> remplace « Explorez nos collections », avec le nombre de créations. Une page par univers, rangée par rayon, avec filtres et tri, plus « Toute la boutique ».</li>
    {"<li><b>Aperçu des produits à venir</b> : rayon « Jeux en bois » (9 puzzles) et encadré « Cristaux déjà gravés », marqués « Bientôt » — rien de tout cela n’est en ligne (maquettes enregistrées le 07/10).</li>" if PUZ else ""}
    <li><b>Rangement « Pour qui »</b> (elle, lui, couple, bébé &amp; enfant, parents) et occasion « Anniversaire » : proposés ici, à reporter dans occasions.js au « applique ».</li>
    <li><b>Photos à vérifier sur le site</b> (hébergées sur le CDN, non copiées dans la maquette) : {", ".join(REMOTE)}.</li>
    <li>En-tête, logo, héros, bijoux, carafe, Noël, mur, avis et pied de page : <b>inchangés</b>. Prix lus dans le code (Gestion peut les avoir changés).</li>
  </ul>
</div>'''
body = NOTES + DRAWER + body.replace("</main>", "</main>" + UNIV_VIEW, 1)

# Le tableau des produits pour « Trouver un cadeau » (cartes déjà rendues, sans id, filtrées en JS)
ALL_CARDS = "".join(carte(s) for s in P)
assert all(pourqui(s) for s in P), "une pièce sans « Pour qui »"

CSS2 = r'''
:root{--r-s:20px;--r-m:24px;--r-l:32px}
[hidden]{display:none!important}
.tag-new{display:inline-block;margin:0 0 14px;padding:5px 11px;border:1.5px dashed var(--gold-d);border-radius:999px;color:var(--gold-t);font:700 .7rem/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;background:rgba(201,162,75,.08)}
.tag-mod{border-color:#8a6d9e;color:#5d4470;background:rgba(138,109,158,.08)}
.clean .tag-new,.clean .mbar-notes{display:none!important}
.pill-new{font-style:normal;font:700 .62rem/1 var(--sans);letter-spacing:.06em;text-transform:uppercase;background:var(--gold);color:var(--ink);padding:3px 6px;border-radius:999px;white-space:nowrap}
/* puces (filtres, rayons, onglets) : un seul dessin, cible tactile 44 px */
.puce{padding:9px 16px;min-height:44px;display:inline-flex;align-items:center;gap:6px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.88rem;background:transparent;color:var(--ink);transition:background .25s,color .25s,box-shadow .25s,opacity .25s}
.puce:hover,.puce.on,.puce[aria-pressed="true"],.puce[aria-current="page"],.puce[aria-current="true"]{background:var(--ink);color:var(--cream);box-shadow:none}
.fd .puce,.up-head .puce,.uf .puce,.up-rayons .puce{background:var(--cream)}.fd .puce:hover,.uf .puce:hover,.up-rayons .puce:hover,.fd .puce.on,.uf .puce.on{background:var(--ink)}
.puce.off{opacity:.38;cursor:not-allowed;background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
/* barre de maquette */
.mbar{position:relative;z-index:80;background:var(--ink);color:var(--cream);font-size:.86rem}
.mbar-in{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:9px 16px;max-width:1300px;margin:0 auto}
.mbar-tabs{display:flex;gap:6px;flex-wrap:wrap}
.mbar-tabs button,.mbar-more{padding:7px 13px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.45);color:var(--gold-l);font-weight:600}
.mbar-tabs button.on,.mbar-more[aria-pressed="true"]{background:var(--gold);color:var(--ink);box-shadow:none}
.mbar-tabs .s,#mbarClean .s{display:none}
@media (max-width:1100px){.mbar-tabs .l,#mbarClean .l{display:none}.mbar-tabs .s,#mbarClean .s{display:inline}}
#mbarClean{margin-left:auto}
.mbar-notes{margin:0;padding:6px 16px 14px 36px;max-width:1300px;margin-inline:auto;color:var(--on-ink);line-height:1.5}
.mbar-notes li{margin:5px 0}.mbar-notes b{color:var(--gold-l)}
/* menu rangé */
.hnav2{gap:0 4px;padding:6px 12px;position:relative}
.mg{position:static}
.mg-top{display:inline-flex;align-items:center;gap:6px;padding:9px 11px!important;border-radius:999px;font-weight:600!important}
.mg-offrir{color:var(--gold-t)!important}.mg-promo{color:var(--red2)!important;font-weight:600}
.mg:hover .mg-top,.mg.open .mg-top{background:var(--sand)}
.mg-panel{position:absolute;left:50%;top:100%;width:min(1100px,96vw);display:grid;grid-template-columns:1fr 300px;gap:28px;padding:26px 28px;background:var(--cream);border:1px solid var(--line);border-radius:0 0 var(--r-m) var(--r-m);box-shadow:0 30px 60px -30px rgba(26,18,6,.45);text-align:left;z-index:60;
  opacity:0;visibility:hidden;transform:translate(-50%,-6px);transition:opacity .18s var(--ease) .12s,transform .18s var(--ease) .12s,visibility 0s linear .3s}
.mg:hover .mg-panel,.mg.open .mg-panel{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .22s var(--ease),transform .22s var(--ease),visibility 0s}
.mg.closed:hover .mg-panel{opacity:0;visibility:hidden;transform:translate(-50%,-6px);transition:none}.mg.closed:hover .mg-top{background:none}
.mg-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:18px 24px}
.mg-cols b{display:block;font-family:var(--serif);font-size:1.02rem;margin-bottom:8px}
.mg-cols a{display:block;font-size:.86rem;padding:3px 0;color:var(--muted)}.mg-cols a:hover{color:var(--gold-t)}
.mg-cols .mg-h{color:var(--ink);padding:0}.mg-cols .mg-h:hover b{color:var(--gold-t)}
.mg-cols .mg-more{font-weight:600;color:var(--gold-t);margin-top:4px}
.mg-pic{position:relative;border-radius:var(--r-s);overflow:hidden;min-height:200px;display:block}
.mg-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mg-pic span{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;justify-content:space-between;padding:28px 14px 12px;background:linear-gradient(transparent,rgba(26,18,6,.82));color:var(--cream);font-size:.86rem}
.mg-pic b{flex:1;font-weight:600}.mg-pic .ic{width:16px;height:16px;flex:none}
@media (max-width:1180px){.hnav2{gap:0 2px}.mg-top{padding:9px 7px!important;font-size:.8rem!important;gap:4px}.mg-top .pill-new{font-size:.56rem;padding:2px 5px}}
@media (max-width:980px){.mg-top .pill-new{display:none}.hnav2{padding:6px 4px}.mg-top{padding:9px 5px!important;font-size:.74rem!important}}
/* tiroir téléphone */
.drw{position:fixed;inset:0;z-index:90;background:rgba(26,18,6,.5)}
.drw-in{position:absolute;inset:0 auto 0 0;width:min(360px,88vw);background:var(--cream);overflow:auto;padding:18px 18px 40px;transform:translateX(-100%);transition:transform .3s var(--ease)}
.drw:not([hidden]) .drw-in{transform:none}
.drw-x{font-size:2rem;line-height:1;width:44px;height:44px;margin-left:auto;display:block}
.drw-home,.drw-all{display:block;padding:14px 2px;font-family:var(--serif);font-size:1.12rem;border-bottom:1px solid var(--line)}
.drw-all{margin-top:4px;font-family:var(--sans);font-size:.95rem;color:var(--muted)}.drw-all b{font-family:var(--serif);font-size:1.12rem;color:var(--ink)}
.drw details{border-bottom:1px solid var(--line)}
.drw summary{padding:14px 2px;font-family:var(--serif);font-size:1.12rem;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;min-height:44px}
.drw summary::-webkit-details-marker{display:none}
.drw summary small{font:500 .8rem var(--sans);color:var(--muted)}
.drw summary::after{content:"+";color:var(--gold-t);font-family:var(--sans);margin-left:auto}.drw details[open] summary::after{content:"−"}
.drw details a{display:block;padding:9px 12px;color:var(--muted)}
.drw-sec{padding-top:12px}.drw-sec a{display:block;padding:9px 2px}
/* trouver un cadeau */
.fd{padding:clamp(40px,6vw,72px) clamp(20px,6vw,96px);background:var(--sand);text-align:center}
.fd h2{font-size:clamp(1.9rem,3.8vw,3rem);margin-bottom:22px}
.fd-page{background:none;padding-top:0}
.fd-grp{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:10px 0}
.fd-grp>span,.uf-grp>span{font-weight:700;font-size:.84rem;color:var(--muted);margin-right:4px}
.fd-count{margin:18px 0 14px;color:var(--muted)}
.fd-res{max-width:1200px;margin:0 auto;text-align:left}
.fd-res .uc{animation:fdIn .35s var(--ease) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes fdIn{from{opacity:0;translate:0 8px}to{opacity:1;translate:0 0}}
.fd-more{display:inline-flex;margin-top:18px}
/* cartes produit : mêmes jetons que les vignettes .pt héritées */
.ug{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:22px 18px}
.ug-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.uc{position:relative;display:flex;flex-direction:column;min-width:0;scroll-margin-top:150px}
.uc-link{display:flex;flex-direction:column;gap:6px}
.uc-img{position:relative;aspect-ratio:1;border-radius:var(--r-s);overflow:hidden;background:var(--sand);display:block;box-shadow:inset 0 0 0 1px var(--line)}
.uc-ph{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .9s var(--ease)}
.uc:hover .uc-ph{transform:scale(1.07)}
.uc-remote{width:100%;height:100%;object-fit:cover;z-index:1}
.uc .fav{position:absolute;top:10px;right:10px;z-index:3}.ug .fav{width:44px;height:44px}
.uc .badge{top:10px;left:10px;z-index:2}
.uc .pt-cta{z-index:2}.uc:hover .pt-cta,.uc:focus-within .pt-cta{translate:0 0}
.uc-none{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:var(--gold-d);background:linear-gradient(160deg,var(--sand),#efe3cc)}
.uc-none .ic{width:30px;height:30px;color:var(--gold-d)}
.uc-none small{display:block;font:600 .74rem/1.3 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.uc-b-soon{background:var(--gold);color:var(--ink)}
.uc-name{font-weight:600;font-size:.95rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color .25s}
.uc:hover .uc-name{color:var(--gold-t)}
.uc-price{font:600 .92rem/1 var(--serif);color:var(--gold-t);font-variant-numeric:tabular-nums}
.uc-tag{font-size:.74rem;color:var(--muted)}
.uc-soon .uc-ph{filter:saturate(.85)}
.uc-soonbox{grid-column:1/-1;position:relative;display:flex;flex-direction:column;gap:6px;padding:22px;border-radius:var(--r-s);border:1.5px dashed var(--gold-d);background:rgba(201,162,75,.07)}
.uc-soonbox .badge{position:static;align-self:flex-start;order:-1}
.uc-soonbox span:not(.badge){color:var(--muted)}
/* bloc Bébé & Enfant */
.enf-grid{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:clamp(22px,4vw,48px);align-items:stretch}
.enf-big{position:relative;border-radius:var(--r-m);overflow:hidden;display:block;min-height:420px}
.enf-big img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%}
.enf-lab{position:absolute;left:0;right:0;bottom:0;padding:50px 20px 18px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);display:flex;flex-direction:column;gap:2px}
.enf-lab b{font-family:var(--serif);font-size:1.25rem}
.enf-copy h2{font-size:clamp(2rem,4vw,3.3rem);line-height:1.06}
.enf-copy>p{color:var(--muted);margin:12px 0 16px;max-width:54ch}
.enf-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}
.enf .ug-4{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.enf-copy .btn{margin-top:24px}
/* coffret */
.cof{margin-top:clamp(36px,5vw,60px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(20px,4vw,44px);align-items:center;padding:clamp(22px,4vw,40px);border-radius:var(--r-l);background:var(--ink);color:var(--cream)}
.cof h3{font-size:clamp(1.5rem,2.8vw,2.2rem);line-height:1.15}.cof h3 em{color:var(--gold-l)}
.cof .tag-new{color:var(--gold-l);border-color:var(--gold-l);background:none}
.cof-txt>p{color:var(--on-ink);margin:10px 0 16px}
.cof-pick{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.cof-pick label{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(251,247,238,.06);cursor:pointer;min-height:44px}
.cof-pick b{margin-left:auto;color:var(--gold-l);white-space:nowrap}
.cof-pick input{accent-color:var(--gold);width:18px;height:18px}
.cof-name label{display:block;font-size:.84rem;font-weight:600;color:var(--cream);margin-bottom:6px}
.cof-name input{width:100%;max-width:280px;padding:11px 14px;border-radius:10px;border:1px solid rgba(226,198,126,.6);background:rgba(251,247,238,.12);color:var(--cream);font:inherit;transition:border-color .25s,box-shadow .25s}
.cof-name input:focus{border-color:var(--gold-l);box-shadow:0 0 0 3px rgba(201,162,75,.25);outline:none}
.cof-tot{margin:16px 0;font-size:1.05rem;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}
.cof-tot s{color:var(--on-ink)}.cof-tot b{font-size:1.5rem;color:var(--gold-l)}.cof-tot span{font-size:.82rem;color:var(--on-ink)}
.cof-note{font-size:.8rem;color:var(--on-ink);margin-top:14px}
.cof-pics{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cof-pics img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r-s)}
.cof-pics img:first-child{grid-column:1/-1;aspect-ratio:16/9}
.cof-nom{position:absolute;left:50%;top:28%;transform:translate(-50%,-50%);font:italic 600 clamp(1.4rem,3vw,2.2rem)/1 var(--serif);color:var(--cream);text-shadow:0 2px 14px rgba(0,0,0,.6);pointer-events:none;transition:text-shadow .3s}
.cof-nom.live{text-shadow:0 0 18px rgba(226,198,126,.8),0 2px 14px rgba(0,0,0,.6)}
.cof :focus-visible,.ut-offrir:focus-visible,.drw :focus-visible{outline-color:var(--gold-l)}
/* nos univers */
.ut-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.ut{position:relative;border-radius:var(--r-s);overflow:hidden;aspect-ratio:4/5;display:block}
.ut img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .9s var(--ease)}
.ut:hover img{transform:scale(1.05)}
.ut-lab{position:absolute;left:0;right:0;bottom:0;padding:50px 16px 14px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);display:flex;flex-direction:column}
.ut-lab b{font-family:var(--serif);font-size:1.18rem}.ut-lab span{font-size:.82rem;color:var(--on-ink)}
.ut-offrir{background:var(--ink);color:var(--cream);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:14px;padding:28px;transition:background .3s}
.ut-offrir:hover{background:var(--ink3)}
.ut-offrir>b{font:600 1.5rem/1.1 var(--serif);color:var(--gold-l)}.ut-offrir>span:not(.ut-chips){color:var(--on-ink);font-size:.9rem}
.ut-chips{display:flex;flex-wrap:wrap;gap:6px}.ut-chips i{font-style:normal;padding:5px 10px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.45);color:var(--gold-l);font:600 .72rem/1 var(--sans)}
.ut-offrir .ic{width:30px;height:30px;color:var(--gold);transition:transform .4s var(--ease)}.ut-offrir:hover .ic{transform:translateX(8px)}
.ut-new{position:absolute;top:12px;left:12px}
/* vue univers */
.uv{padding:0 clamp(16px,5vw,72px) 80px;max-width:1300px;margin:0 auto}
.uv-tabs{position:sticky;top:var(--hdr,0px);z-index:30;display:flex;gap:6px;overflow-x:auto;padding:12px 0;background:var(--cream);border-bottom:1px solid var(--line);margin-bottom:24px;scrollbar-width:none;-webkit-mask:linear-gradient(90deg,#000 calc(100% - 48px),transparent);mask:linear-gradient(90deg,#000 calc(100% - 48px),transparent)}
.uv-tabs::-webkit-scrollbar{display:none}
.uv-tabs.end{-webkit-mask:none;mask:none}
.uv-tabs .puce{flex:none}.uv-tabs small{opacity:.6;font-weight:500;font-size:.8em}
@media (min-width:1024px){.uv-tabs{flex-wrap:wrap;overflow:visible;-webkit-mask:none;mask:none}}
.up-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,360px);gap:24px;align-items:center;padding:clamp(18px,3vw,30px);border-radius:var(--r-m);background:var(--sand);margin-bottom:18px}
.up-crumb{font-size:.82rem;color:var(--muted);margin:0 0 6px}.up-crumb a:hover{color:var(--gold-t);text-decoration:underline}
.up-head h2{font-size:clamp(1.9rem,4vw,3rem)}
.up-txt>p:not(.up-crumb){color:var(--muted);margin:8px 0 0;max-width:56ch}
.up-count{font-weight:700;color:var(--gold-t)!important}
.up-img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:var(--r-s)}
.up-rayons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
.uf{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;padding:14px 0 18px;border-bottom:1px solid var(--line);margin-bottom:8px}
.uf-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.uf-sort{margin-left:auto;font-size:.86rem;color:var(--muted);display:flex;gap:8px;align-items:center}
.uf-sort select{min-height:44px;padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--cream);font:inherit;color:var(--ink)}
.ur{padding:28px 0 6px;scroll-margin-top:120px}
.ur h3{font-size:1.5rem;margin-bottom:16px}.ur h3 small{font:500 .85rem var(--sans);color:var(--muted);margin-left:8px}
.ur-empty{color:var(--muted)}
.up .cof{margin:clamp(28px,4vw,48px) 0 8px;scroll-margin-top:120px}
@media (max-width:1279px){.ug-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1020px){.ut-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mg-panel{grid-template-columns:1fr}.mg-pic{display:none}}
@media (max-width:900px){.enf-grid,.cof,.up-head{grid-template-columns:1fr}.enf-big{aspect-ratio:16/11}.ug-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.ut-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ug{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px}#mbarClean{margin-left:0}.uf-sort{margin-left:0}.up-img{display:none}.fd-grp{justify-content:flex-start}.fd{text-align:left}
  .uc .badge{font-size:.6rem;padding:4px 7px;letter-spacing:.05em;max-width:calc(100% - 72px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ask{left:auto;right:16px;width:48px;height:48px;padding:0;justify-content:center;border-radius:50%;font-size:0}.ask .ic{width:20px;height:20px}
  .mbar-in{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:6px;padding:6px 10px}.mbar-in::-webkit-scrollbar{display:none}.mbar-tabs{flex-wrap:nowrap;gap:5px}.mbar-tabs button,.mbar-more{padding:5px 9px;font-size:.73rem;white-space:nowrap;flex:none}.mbar-in>b{flex:none;font-size:.76rem;white-space:nowrap}}
@media (max-width:480px){.fd-grp>span{flex-basis:100%;margin:0 0 2px}}
@media (prefers-reduced-motion:reduce){.fd-res .uc{animation:none}}
'''

JS2 = r'''
(function(){var d=document,root=d.documentElement,ARROW='__ARROW__';
var cards=d.getElementById('allCards'),header=d.querySelector('.header'),drw=d.getElementById('drw'),burger=d.getElementById('burger');
function hdr(){root.style.setProperty('--hdr',(header?header.offsetHeight:0)+'px')}hdr();addEventListener('resize',hdr);
function setOn(b,on){b.classList.toggle('on',!!on);if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',on?'true':'false')}
function setOff(b,off){b.classList.toggle('off',!!off);b.disabled=!!off}
/* les .fav présents au chargement sont déjà câblés par le script hérité ; les clones (finder) passent par la délégation */
d.querySelectorAll('.fav').forEach(function(f){f._w=1});
function show(view){d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.view===view)});
  d.getElementById('contenu').hidden=view!=='accueil';d.getElementById('vueUnivers').hidden=view!=='univers';tend()}
var tabs=d.querySelector('.uv-tabs');
function tend(){tabs.classList.toggle('end',tabs.scrollLeft+tabs.clientWidth>=tabs.scrollWidth-2)}
tabs.addEventListener('scroll',tend,{passive:true});addEventListener('resize',tend);tend();
function openU(id,anchor){show('univers');d.querySelectorAll('.up').forEach(function(a){a.hidden=a.dataset.u!==id});
  var on=null;d.querySelectorAll('.uv-tabs button').forEach(function(b){var o=b.dataset.go===id;b.classList.toggle('on',o);b.setAttribute('aria-current',o?'page':'false');if(o)on=b});
  if(id==='offrir'){var s=d.getElementById('offrirSlot');
    if(!s.firstChild){var c=d.getElementById('trouver').cloneNode(true);var t=c.querySelector('.tag-new');if(t)t.remove();var h=c.querySelector('h2');if(h)h.remove();
      c.querySelectorAll('[id]').forEach(function(x){x.removeAttribute('id')});c.classList.add('fd-page');s.appendChild(c);wireFinder(c)}
    var st={};d.querySelectorAll('#trouver button.on').forEach(function(b){st[b.dataset.k]=b.dataset.v});
    var fd=s.querySelector('.fd');fd.querySelectorAll('button[data-k]').forEach(function(b){setOn(b,st[b.dataset.k]===b.dataset.v)});fd._run()}
  var t2=anchor?d.querySelector(anchor):null;if(t2)t2.scrollIntoView({block:'start'});else scrollTo(0,0);
  if(on)on.scrollIntoView({inline:'center',block:'nearest'});tend()}
/* tiroir (téléphone) : vrai dialogue */
function openDrw(){drw.hidden=false;burger.setAttribute('aria-expanded','true');d.body.style.overflow='hidden';drw.querySelector('.drw-x').focus()}
function closeDrw(){if(drw.hidden)return;drw.hidden=true;burger.setAttribute('aria-expanded','false');d.body.style.overflow='';drw.querySelectorAll('details[open]').forEach(function(x){x.open=false});burger.focus()}
burger.addEventListener('click',openDrw);
drw.addEventListener('click',function(e){if(e.target===drw||e.target.closest('.drw-x'))closeDrw()});
drw.querySelectorAll('details').forEach(function(x){x.addEventListener('toggle',function(){if(x.open)drw.querySelectorAll('details[open]').forEach(function(y){if(y!==x)y.open=false})})});
/* panneau du menu : ouverture au clavier (flèche bas / Entrée), fermeture par Échap ou en sortant */
function closeMg(mg){(mg?[mg]:[].slice.call(d.querySelectorAll('.mg.open'))).forEach(function(m){m.classList.remove('open');m.querySelector('.mg-top').setAttribute('aria-expanded','false')})}
/* un clic dans le panneau le referme, même si la souris reste dessus : il rouvre à la prochaine entrée */
d.querySelectorAll('.mg').forEach(function(mg){mg.addEventListener('click',function(e){if(e.target.closest('.mg-panel a'))mg.classList.add('closed')});mg.addEventListener('mouseleave',function(){mg.classList.remove('closed')})});
function openMg(mg){closeMg();mg.classList.add('open');mg.querySelector('.mg-top').setAttribute('aria-expanded','true')}
d.querySelectorAll('.mg').forEach(function(mg){var top=mg.querySelector('.mg-top');
  top.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||(e.key==='Enter'&&!mg.classList.contains('open'))){e.preventDefault();openMg(mg)}});
  mg.addEventListener('focusout',function(e){if(!mg.contains(e.relatedTarget))closeMg(mg)})});
d.addEventListener('keydown',function(e){if(e.key!=='Escape')return;closeDrw();closeMg();if(d.activeElement&&d.activeElement.blur)d.activeElement.blur()});
/* délégation : cartes clonées, liens de maquette, navigation entre les vues */
d.addEventListener('click',function(e){
  var f=e.target.closest('.fav');if(f){if(!f._w){e.preventDefault();f.classList.toggle('on')}return}
  var l=e.target.closest('.uc-link');if(l){e.preventDefault();return}
  var v=e.target.closest('[data-view]');if(v&&!v.closest('.mbar')){e.preventDefault();show(v.dataset.view);closeDrw();scrollTo(0,0);return}
  var a=e.target.closest('[data-go]');if(a&&!a.closest('.mbar')){e.preventDefault();var h=a.getAttribute('href');closeDrw();closeMg();openU(a.dataset.go,h&&h.length>1?h:null);return}
  var g=e.target.closest('[data-find]');if(g){e.preventDefault();closeDrw();closeMg();openU('offrir');var fd=d.querySelector('#offrirSlot .fd'),pairs={};
    g.dataset.find.split(';').forEach(function(kv){var p=kv.split(':');if(p[0])pairs[p[0]]=p[1]});
    fd.querySelectorAll('button[data-k]').forEach(function(b){setOn(b,pairs[b.dataset.k]===b.dataset.v)});fd._run();return}
  var x=e.target.closest('a[href="#"]');if(x)e.preventDefault()});
d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.view==='univers'&&!d.querySelector('.up:not([hidden])'))openU('boutique');else show(b.dataset.view);scrollTo(0,0)})});
d.getElementById('mbarMore').addEventListener('click',function(){var n=d.getElementById('mbarNotes');n.hidden=!n.hidden;this.setAttribute('aria-expanded',!n.hidden)});
d.getElementById('mbarClean').addEventListener('click',function(){d.body.classList.toggle('clean');this.setAttribute('aria-pressed',d.body.classList.contains('clean'))});
/* filtres : « pour qui » / occasion (plusieurs valeurs = OU) / budget sur l'intervalle [mini, maxi] */
function has(list,val){var l=' '+(list||'')+' ';return (val||'').split(' ').some(function(v){return v&&l.indexOf(' '+v+' ')>=0})}
function match(c,sel){var lo=parseFloat(c.dataset.prix),hi=parseFloat(c.dataset.prixmax||c.dataset.prix);
  if(sel.qui&&!has(c.dataset.qui,sel.qui))return false;if(sel.occ&&!has(c.dataset.occ,sel.occ))return false;
  if(sel.budget){var r=sel.budget.split('-');if(hi<+r[0]||lo>=+r[1])return false}return true}
function readSel(box,attr){var sel={};box.querySelectorAll('button.on['+attr+']').forEach(function(b){sel[b.getAttribute(attr)]=b.dataset.v});return sel}
function grey(box,attr,pool){var sel=readSel(box,attr);box.querySelectorAll('button['+attr+']').forEach(function(b){if(b.classList.contains('on')){setOff(b,false);return}
  var s2={};for(var k in sel)s2[k]=sel[k];s2[b.getAttribute(attr)]=b.dataset.v;setOff(b,!pool.some(function(c){return match(c,s2)}))})}
function wireFinder(fd){var res=fd.querySelector('.fd-res'),cnt=fd.querySelector('.fd-count'),pool=[].slice.call(cards.children);
  fd._run=function(){var sel=readSel(fd,'data-k');res.innerHTML='';var m=fd.querySelector('.fd-more');if(m)m.remove();
    if(!Object.keys(sel).length){cnt.textContent='Choisissez un ou plusieurs critères.';grey(fd,'data-k',pool);return}
    var ok=pool.filter(function(c){return match(c,sel)}),lim=fd.closest('#offrirSlot')?999:8;
    ok.slice(0,lim).forEach(function(c,i){var n=c.cloneNode(true);n.style.setProperty('--i',i);res.appendChild(n)});
    cnt.textContent=!ok.length?'Aucune création ne correspond : retirez un critère.':ok.length>lim?lim+' idées parmi '+ok.length:ok.length+' idée'+(ok.length>1?'s':'')+' de cadeau';
    if(ok.length>lim){var a=d.createElement('a');a.className='link fd-more';a.href='#';a.dataset.find=Object.keys(sel).map(function(k){return k+':'+sel[k]}).join(';');
      a.innerHTML='Voir les '+ok.length+' idées '+ARROW;res.parentNode.insertBefore(a,res.nextSibling)}
    grey(fd,'data-k',pool)};
  fd.querySelectorAll('button[data-k]').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('on');
    fd.querySelectorAll('button[data-k="'+b.dataset.k+'"]').forEach(function(x){setOn(x,false)});setOn(b,!on);fd._run()})});
  grey(fd,'data-k',pool)}
/* fêtes à venir, calculées sur la date du jour : seulement leur nom, jamais une date ni un compte à rebours */
function nthSunday(y,m,n){var d=new Date(y,m,1);var off=(7-d.getDay())%7;return new Date(y,m,1+off+7*(n-1))}
function lastSunday(y,m){var d=new Date(y,m+1,0);return new Date(y,m,d.getDate()-d.getDay())}
function paques(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31)-1,da=((h+l-7*m+114)%31)+1;return new Date(y,mo,da)}
function fetesDe(y){var fm=lastSunday(y,4);var pent=new Date(paques(y));pent.setDate(pent.getDate()+49);if(fm.getTime()===pent.getTime())fm=nthSunday(y,5,1);
  return [{n:'Noël',o:'noel',d:new Date(y,11,25)},{n:'Saint-Valentin',o:'amour',d:new Date(y,1,14)},{n:'Fête des grands-mères',o:'pour-elle famille',d:nthSunday(y,2,1)},
          {n:'Fête des mères',o:'pour-elle famille',d:fm},{n:'Fête des pères',o:'pour-lui famille',d:nthSunday(y,5,3)}]}
function prochainesFetes(){var now=new Date();now.setHours(0,0,0,0);var y=now.getFullYear(),all=fetesDe(y).concat(fetesDe(y+1));
  var out=all.filter(function(f){return f.d>=now}).sort(function(a,b){return a.d-b.d});var seen={},res=[];
  out.forEach(function(f){if(!seen[f.n]&&(f.d-now)/864e5<=92){seen[f.n]=1;res.push({n:f.n,o:f.o,d:f.d})}});return res}
d.querySelectorAll('.fetes').forEach(function(sl){var par=sl.parentNode;prochainesFetes().forEach(function(f){var el;
  if(sl.dataset.as==='a'){el=d.createElement('a');el.href='#';el.dataset.find='occ:'+f.o;el.textContent=f.n}
  else{el=d.createElement('button');el.type='button';el.className='puce';el.dataset.k='occ';el.dataset.v=f.o;el.setAttribute('aria-pressed','false');el.textContent=f.n}
  par.insertBefore(el,sl);
  /* une fête qui porte la même occasion qu'un bouton fixe le remplace (jamais deux fois « amour ») */
  par.querySelectorAll(sl.dataset.as==='a'?'a[data-find="occ:'+f.o+'"]':'button[data-v="'+f.o+'"]').forEach(function(x){if(x!==el)x.remove()})});sl.remove()});
wireFinder(d.getElementById('trouver'));
/* filtres et tri des pages univers */
d.querySelectorAll('.up').forEach(function(up){var pool=[].slice.call(up.querySelectorAll('.ug>.uc'));
  function run(){var sel=readSel(up,'data-f');up.querySelectorAll('.ur').forEach(function(r){var n=0;r.querySelectorAll('.ug>.uc').forEach(function(c){var ok=match(c,sel);c.hidden=!ok;if(ok)n++});
    var e=r.querySelector('.ur-empty');if(e)e.hidden=n>0||!r.querySelector('.ug>.uc')});grey(up,'data-f',pool)}
  up.querySelectorAll('button[data-f]').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('on');
    up.querySelectorAll('button[data-f="'+b.dataset.f+'"]').forEach(function(x){setOn(x,false)});setOn(b,!on);run()})});
  var so=up.querySelector('.uf-sort select');if(so)so.addEventListener('change',function(){up.querySelectorAll('.ug').forEach(function(g){
    var cs=[].slice.call(g.children);if(!g._o)g._o=cs.slice();var l=so.value?cs.sort(function(a,b){return (so.value==='asc'?1:-1)*(parseFloat(a.dataset.prix)-parseFloat(b.dataset.prix))}):g._o;
    l.forEach(function(c){g.appendChild(c)})})});
  /* la puce du rayon visible est marquée aria-current */
  var chips=up.querySelectorAll('.up-rayons a');if(chips.length&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;
    chips.forEach(function(c){c.setAttribute('aria-current',c.getAttribute('href')==='#'+en.target.id?'true':'false')})})},{rootMargin:'-35% 0px -55% 0px'});up.querySelectorAll('.ur,.cof').forEach(function(r){io.observe(r)})}
  if(pool.length)grey(up,'data-f',pool)});
/* coffret : total, remise, prénom en direct */
d.querySelectorAll('.cof').forEach(function(cf){var tot=cf.querySelector('.cof-tot'),inp=cf.querySelector('.cof-name input'),nom=cf.querySelector('.cof-nom');
  function calc(){var t=0,n=0;cf.querySelectorAll('.cof-pick input').forEach(function(i){if(i.checked){t+=parseFloat(i.dataset.p);n++}});
    var r=n>=2?.9:1,f=function(v){return v.toFixed(2).replace('.',',')+' €'};
    tot.querySelector('s').textContent=n>=2?f(t):'';tot.querySelector('b').textContent=f(t*r);tot.querySelector('span').textContent=n>=2?'−10 % dès 2 pièces':'Ajoutez une 2ᵉ pièce : −10 %'}
  cf.querySelectorAll('.cof-pick input').forEach(function(i){i.addEventListener('change',calc)});
  inp.addEventListener('input',function(){nom.textContent=this.value.trim()||'Léa';nom.classList.add('live')});
  inp.addEventListener('focus',function(){nom.classList.add('live')});inp.addEventListener('blur',function(){nom.classList.remove('live')});calc()});
})();
'''.replace("__ARROW__", ic("arrow"))

TITLE = "Accueil et univers (avec puzzles)" if PUZ else "Accueil et univers"
NOM = "accueil-univers-avec-puzzles" if PUZ else "accueil-univers"
T_CSS = "\n".join(f".{c}{{background-image:url({thumb(f)})}}" for f, c in TCLS.items())
STYLE = f"<style>{CSS}\n{IMG_CSS}\n{CSS2}\n{T_CSS}</style>"
HIDDEN = f'<div id="allCards" hidden>{ALL_CARDS}</div>'
full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>{HEAD_LINKS}{STYLE}</head><body>{body}{HIDDEN}<script>{JS}</script><script>{JS2}</script></body></html>'
frag = f'<title>{TITLE}</title>{HEAD_LINKS}{STYLE}{body}{HIDDEN}<script>{JS}</script><script>{JS2}</script>'
open(os.path.join(OUT, NOM + ".html"), "w").write(full)
open(os.path.join(OUT, NOM + ".fragment.html"), "w").write(frag)
print("ok", NOM, len(full) // 1024, "Ko ·", len(P), "produits ·", " · ".join(f'{u["nom"]} {compte(u)}' for u in UNIVERS))
