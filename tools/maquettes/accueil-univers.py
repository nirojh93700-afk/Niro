#!/usr/bin/env python3
"""Maquette « accueil + univers », version luxe (09/10/2026) — refonte complète de toutes les pages de la maquette
(accueil, une page par univers, « Toute la boutique », « Offrir ») dans un même monde visuel : papier crème, encre,
or en filet ; Playfair Display pour les titres, Jost pour le reste ; grandes photos de pièces GRAVÉES ; mouvements
sobres (apparition au défilement, zoom lent des photos, mur qui s'arrête sous le doigt).
Feu vert du gérant (09/10) : « tu peux tout changer, sauf le logo ». Le logo est donc la copie octet pour octet du
logo du site (docs/maquettes/assets/logo-source.jpg), à la taille et à l'arrondi du site.
Garde TOUT ce qui a été corrigé le 09/10 (rangement, navigation, « Trouver un cadeau », fêtes, textes).

Entrée : node --import ./tools/alias-register.mjs tools/maquettes/catalogue-export.mjs > <cat.json>
Usage : python3 tools/maquettes/accueil-univers.py <cat.json> [--puzzles]
  sans drapeau  → docs/maquettes/accueil-univers.html (seulement les produits en ligne)
  --puzzles     → docs/maquettes/accueil-univers-avec-puzzles.html (+ « Jeux en bois » et « Cristaux déjà gravés »
                  marqués « Bientôt », coffret Savane)
Rien n'est touché dans le site : c'est une maquette, en attente du « applique »."""
import base64, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUZ = "--puzzles" in sys.argv
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]

# ---------------------------------------------------------------- images
_CACHE = {}
def img(fn, w=800, q=72):
    """Data URI JPEG d'une photo (chemin /produits/… du site ou chemin absolu), réduite à w px de large."""
    key = (fn, w)
    if key in _CACHE: return _CACHE[key]
    path = fn if os.path.isabs(fn) and os.path.exists(fn) else os.path.join(ROOT, "public", fn.lstrip("/"))
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    _CACHE[key] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    return _CACHE[key]

LOGO_FILE = os.path.join(OUT, "assets", "logo-source.jpg")   # copie du logo du site (IMG_6758.jpg), jamais retouchée
assert os.path.exists(LOGO_FILE), "logo-source.jpg manquant"
LOGO = "data:image/jpeg;base64," + base64.b64encode(open(LOGO_FILE, "rb").read()).decode()
QR = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "public", "instagram-qr.png"), "rb").read()).decode()

# ---------------------------------------------------------------- catalogue
CAT = json.load(open(ARGS[0], encoding="utf-8"))
P = {p["slug"]: p for p in CAT["products"]}

def r90(n): return round(n - 0.9) + 0.9
def fmt(v): return f"{v:.2f}".replace(".", ",") + " €"
def prix(p):
    """(libellé de vignette, mini, maxi) — les bijoux portent la remise −10 % de catalog.js."""
    rem = (lambda v: round(r90(v * 0.9) * 0.9, 2)) if p["category"] == "bijoux" else (lambda v: v)
    first, lo, hi = rem(p["first"]), rem(p["min"]), rem(p["max"])
    return ("dès " if (p["multi"] and p["first"] == p["min"]) else "") + fmt(first), lo, hi

# photo de vignette : une pièce GRAVÉE quand le site en a une (règle : montrer la gravure)
PHOTO = {
 "couverts-enfants-personnalises": "/produits/couverts_enfants_ex_prenom.jpg",
 "verre-a-whisky-grave": "/produits/verre_a_whisky_exemple_face.jpg",
 "verre-a-vin-grave": "/produits/verre_vin_exemple_dale.jpg",
 "carafe-a-whisky-gravee": "/produits/carafe_gravee.jpg",
 "collier-3coeurs": "/produits/collier-3coeurs-3.jpg",
 "collier-coeur-grave": "/produits/collier-coeur-grave-2.jpg",
 "collier-double-coeur": "/produits/collier-double-coeur-6.jpg",
 "bracelet-cordon-plaque": "/produits/bracelet-cordon-plaque-4.jpg",
 "bracelet-femme-acier": "/produits/bracelet-femme-acier-grave.jpg",
 "verre-a-whisky-fete-des-peres": "/produits/verre_whisky_papa_monde_moustache.jpg",
 "verre-a-cocktail-grave": "/produits/verre_a_cocktail_exemple_logo.jpg",
}
TCLS = {}
def tcls(f):
    """Une classe CSS par photo : chaque image n'est intégrée qu'UNE fois, même répétée (mur, menu, réserve)."""
    if f not in TCLS: TCLS[f] = f"t{len(TCLS)}"
    return TCLS[f]
def fichier(slug):
    p = P[slug]; f = PHOTO.get(slug) or (p["local"][0] if p["local"] else "")
    return f if f and os.path.exists(os.path.join(ROOT, "public", f.lstrip("/"))) else ""
def photo(slug):
    f = fichier(slug); return tcls(f) if f else ""
REMOTE = [s for s in P if not photo(s) and P[s]["img0"]]

# ---------------------------------------------------------------- rangement (identique à la refonte du 09/10)
def bij(prefix): return [s for s, p in P.items() if p["category"] == "bijoux" and p["name"].startswith(prefix)]
PUZZLES = [("foret", "Forêt"), ("savane", "Savane"), ("dinosaures", "Dinosaures"), ("animaux-amerique", "Grand Nord"),
           ("australie", "Australie"), ("vehicules-secours", "Véhicules de secours"), ("camping", "Camping"),
           ("jardin-enchante", "Jardin enchanté"), ("fruits-legumes", "Fruits & légumes")]
UNIVERS = [
 {"id": "bijoux", "nom": "Bijoux", "accroche": "Colliers et bracelets en acier, la plupart gravés avec un prénom, une date ou un mot qui vous est cher.",
  "img": "/produits/collier-3coeurs-3.jpg", "pourqui": True,
  "rayons": [("Colliers", bij("Collier")), ("Bracelets", bij("Bracelet"))]},
 {"id": "cristal", "nom": "Cristal photo 3D", "accroche": "Votre photo gravée au laser à l'intérieur d'un bloc de cristal.",
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
oublis = [s for s in P if s not in rang]; assert not oublis, f"produits non rangés : {oublis}"
manque = [s for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list) for s in l if s not in P]; assert not manque, f"inconnus : {manque}"
assert all(len(set(l)) >= 2 for u in UNIVERS for _, l in u["rayons"] if isinstance(l, list)), "un rayon n'a qu'une création"
def compte(u): return len({s for _, l in u["rayons"] if isinstance(l, list) for s in l})
HOME = {}
for u in UNIVERS:
    for _, l in u["rayons"]:
        if isinstance(l, list):
            for s in l: HOME.setdefault(s, u["id"])
def card_id(s, uid): return f"p-{s}" if uid == HOME[s] else f"p-{uid}-{s}"
_vus = set()
BOUTIQUE = {"id": "boutique", "nom": "Toute la boutique", "accroche": "Toutes nos créations, un rayon par univers.",
            "img": "/produits/cristal-v-femme.jpg", "pourqui": True, "rayons": []}
for u in UNIVERS:
    BOUTIQUE["rayons"].append((u["nom"], [s for _, r in u["rayons"] if isinstance(r, list) for s in r if s not in _vus and not _vus.add(s)]))
assert compte(BOUTIQUE) == len(P)

POURQUI = {"elle": "Pour elle", "lui": "Pour lui", "couple": "Pour un couple", "enfant": "Pour bébé & enfant", "parents": "Pour des parents"}
def court(v): v = v.replace("Pour ", ""); return v[:1].upper() + v[1:]
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
    if not t: t.update(QUI_UNIVERS.get(HOME[s], []))
    return sorted(t)
def occasions(s):
    o = list(P[s]["occ"])
    if not o: o = ["anniversaire", "noel"]
    elif not set(o) <= {"mariage", "naissance"}: o.append("anniversaire")
    return " ".join(o)
def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")

# ---------------------------------------------------------------- icônes (trait fin 1.4, une seule famille)
ICON = {
 "heart": '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.7 1.1 4.8 2.9 1.1-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
 "bag": '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 "left": '<path d="m15 6-6 6 6 6"/>', "right": '<path d="m9 6 6 6-6 6"/>',
 "image": '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>',
 "star": '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17l-5.5 3 1.2-6.1L3.2 9.6l6.1-.8z"/>',
 "pen": '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m13.5 6.5 3 3"/>',
 "laser": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3.5"/>',
 "gift": '<path d="M4 11h16v9H4zM2 7h20v4H2zM12 7v13"/><path d="M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z"/>',
 "close": '<path d="M6 6l12 12M18 6 6 18"/>',
}
def ic(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
STAR = f'<svg viewBox="0 0 24 24" class="star" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17l-5.5 3 1.2-6.1L3.2 9.6l6.1-.8z" fill="currentColor"/></svg>'

def btn(label, cls="btn-gold", attrs='href="#"', tag="a"):
    """Bouton pilule : le libellé, puis la flèche dans sa propre pastille (jamais nue à côté du texte)."""
    return f'<{tag} class="btn {cls}" {attrs}><span>{label}</span><i class="btn-i">{ic("arrow")}</i></{tag}>'

# ---------------------------------------------------------------- composants
def carte(s, uid=None):
    p = P[s]; lab, lo, hi = prix(p); im = photo(s)
    pic = (f'<span class="uc-ph {im}" role="img" aria-label="{esc(p["name"])}"></span>' if im else
           f'<span class="uc-none">{ic("image")}<small>photo sur le site</small></span>'
           + (f'<img class="uc-ph uc-remote" src="{esc(p["img0"])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' if p["img0"] else ""))
    tag = f'<span class="uc-tag">{esc(p["badge"])}</span>' if p["badge"] else ""
    note = "" if p["perso"] else '<span class="uc-note">Prêt à offrir</span>'
    cta = '<span class="uc-cta">Personnaliser</span>' if p["perso"] else ""
    idattr = f' id="{card_id(s, uid)}"' if uid else ""
    return (f'<div class="uc"{idattr} data-u="{HOME[s]}" data-prix="{lo}" data-prixmax="{hi}" data-qui="{" ".join(pourqui(s))}" data-occ="{occasions(s)}" data-perso="{1 if p["perso"] else 0}">'
            f'<a class="uc-link" href="#p-{s}"><span class="uc-img">{pic}{cta}</span>'
            f'<span class="uc-meta">{tag}<span class="uc-name">{esc(p["name"])}</span><span class="uc-price">{lab}</span>{note}</span></a>'
            f'<button class="fav" type="button" aria-label="Garder pour plus tard">{ic("heart")}</button></div>')

def bientot(kind):
    if kind == "bientot-puzzles":
        return "".join(f'<div class="uc uc-soon" data-prix="29.9" data-prixmax="29.9" data-qui="enfant" data-occ="naissance noel anniversaire" data-perso="1">'
                       f'<a class="uc-link" href="#"><span class="uc-img"><span class="uc-ph {tcls(os.path.join(OUT, "assets", "jeux-enfants", f + ".jpg"))}" role="img" aria-label="Puzzle {n}"></span></span>'
                       f'<span class="uc-meta"><span class="uc-tag uc-tag-soon">Bientôt</span><span class="uc-name">Puzzle en bois, {n}</span><span class="uc-price">29,90 €</span><span class="uc-note">prénom compris</span></span></a></div>' for f, n in PUZZLES)
    return ('<a class="uc-soonbox" href="#"><span class="uc-tag uc-tag-soon">Bientôt</span><b>Cristaux déjà gravés</b><span>Sirène, colibri, cœur, Noël : des modèles prêts à offrir, '
            'à choisir dans le format et la taille que vous voulez.</span></a>')

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
        blocs += f'<section class="ur rv" id="r-{uid}-{i}"><h3>{esc(n)} <small>{nb}</small></h3><div class="ug">{cards}</div><p class="ur-empty" hidden>Aucune création de ce rayon ne correspond à votre choix.</p></section>'
    extra = coffret("enfants") if uid == "enfants" else ""
    crumb = (f'<nav class="crumb" aria-label="Fil d’Ariane"><a href="#" data-view="accueil">Accueil</a><span>/</span>'
             + (f'<a href="#" data-go="boutique">Boutique</a><span>/</span>' if uid != "boutique" else "")
             + f'<span aria-current="page">{esc(u["nom"])}</span></nav>')
    return (f'<article class="up" id="u-{uid}" data-u="{uid}" hidden>'
            f'<header class="up-head"><div class="up-txt">{crumb}<h2>{esc(u["nom"])}</h2><p>{esc(u["accroche"])}</p>'
            f'<p class="up-count">{compte(u)} créations</p></div><figure class="up-fig"><img src="{img(u["img"], 900)}" alt=""></figure></header>'
            f'<div class="up-bar"><nav class="up-rayons" aria-label="Rayons">{chips}</nav><div class="uf">{filt}</div></div>{blocs}{extra}</article>')

# coffret assorti (Bébé & Enfant)
def piece(slug): return (P[slug]["name"], prix(P[slug])[1])
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
    picks = "".join(f'<label><input type="checkbox"{" checked" if c else ""} data-p="{v}"> <span>{esc(nm)}</span> <b>{fmt(v)}</b></label>' for nm, v, c in PIECES)
    return f'''<div class="cof rv" id="coffret-{n}">
  <div class="cof-txt">
    <h3>Un prénom, un univers : <em>{COF_TITRE}</em></h3>
    <p>{COF_TXT}</p>
    <div class="cof-pick" role="group" aria-label="Pièces du coffret">{picks}</div>
    <div class="cof-name"><label for="cofPrenom-{n}">Prénom de l’enfant, gravé sur chaque pièce</label><input id="cofPrenom-{n}" maxlength="14" placeholder="Ex. Léa" autocomplete="off"></div>
    <p class="cof-tot"><s>{fmt(COF_AVANT)}</s> <b>{fmt(COF_APRES)}</b> <span>moins 10 % dès 2 pièces</span></p>
    {btn("Composer mon coffret")}
    <p class="cof-note">{COF_NOTE}</p>
  </div>
  <div class="cof-pics" aria-hidden="true">
    <img src="{img("/produits/couverts_enfants_ex_animaux.jpg", 760)}" alt=""><img src="{img(COF_PIC2, 520)}" alt="">
    <img src="{img("/produits/veilleuse-prenom-1.jpg", 520)}" alt=""><span class="cof-nom">Léa</span>
  </div>
</div>'''

# menu rangé (8 entrées) + panneaux + tiroir
def ordre_menu(l):
    return sorted(l, key=lambda s: (0, list(PHOTO).index(s)) if s in PHOTO else (1 if photo(s) else 2, l.index(s)))
def mega(u):
    uid, cols = u["id"], ""
    for i, (n, l) in enumerate(u["rayons"]):
        if isinstance(l, list):
            links = "".join(f'<a href="#{card_id(s, uid)}" data-go="{uid}">{esc(P[s]["name"])}</a>' for s in ordre_menu(l)[:6])
            more = f'<a class="mg-more" href="#r-{uid}-{i}" data-go="{uid}">Voir les {len(set(l))} créations</a>' if len(set(l)) > 6 else ""
        else:
            links, more = f'<a href="#r-{uid}-{i}" data-go="{uid}">Bientôt</a>', ""
        cols += f'<div><a class="mg-h" href="#r-{uid}-{i}" data-go="{uid}">{esc(n)}</a>{links}{more}</div>'
    return (f'<div class="mg-panel"><div class="mg-cols">{cols}</div><a class="mg-pic" href="#" data-go="{uid}"><img src="{img(u["img"], 520)}" alt="">'
            f'<span><b>Voir les {compte(u)} créations</b>{ic("arrow")}</span></a></div>')
OFFRIR_PANEL = ('<div class="mg-panel"><div class="mg-cols">'
  '<div><span class="mg-h">Pour qui ?</span>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '</div>'
  '<div><span class="mg-h">Pour quelle occasion ?</span><span class="fetes" data-max="3" data-as="a"></span><a href="#" data-find="occ:naissance">Naissance &amp; baptême</a><a href="#" data-find="occ:mariage">Mariage</a><a href="#" data-find="occ:anniversaire">Anniversaire</a><a href="#" data-find="occ:amour">Amour</a></div>'
  '<div><span class="mg-h">Quel budget ?</span><a href="#" data-find="budget:0-20">Moins de 20 €</a><a href="#" data-find="budget:20-40">20 à 40 €</a><a href="#" data-find="budget:40-999">Plus de 40 €</a><a href="#" title="Page du site, inchangée">Carte cadeau</a><a href="#" title="Page du site, inchangée">Promotions</a></div>'
  f'</div><a class="mg-pic" href="#" data-go="offrir"><img src="{img("/produits/couverts_enfants_ex_prenom.jpg", 520)}" alt=""><span><b>Offrir une carte cadeau, de 20 à 100 €</b>{ic("arrow")}</span></a></div>')
def pill_new(u): return ' <i class="pill-new">Nouveau</i>' if u.get("neuf") else ""
NAV = ('<nav class="hnav" aria-label="Principal">'
       + "".join(f'<div class="mg"><a href="#" class="mg-top" data-go="{u["id"]}" aria-haspopup="true" aria-expanded="false">{esc(u["nom"])}{pill_new(u)}</a>{mega(u)}</div>' for u in UNIVERS)
       + f'<div class="mg"><a href="#" class="mg-top mg-offrir" data-go="offrir" aria-haspopup="true" aria-expanded="false">Offrir</a>{OFFRIR_PANEL}</div>'
       + '</nav>')
DRAWER = ('<div class="drw" id="drw" hidden><div class="drw-in" role="dialog" aria-modal="true" aria-label="Menu"><button class="drw-x" type="button" aria-label="Fermer">' + ic("close") + '</button>'
          + '<a class="drw-home" href="#" data-view="accueil">Accueil</a>'
          + "".join(f'<details><summary>{esc(u["nom"])} <small>{compte(u)}</small>{pill_new(u)}</summary>' + "".join(f'<a href="#r-{u["id"]}-{i}" data-go="{u["id"]}">{esc(n)}</a>' for i, (n, _) in enumerate(u["rayons"])) + f'<a href="#" data-go="{u["id"]}"><b>Tout voir</b></a></details>' for u in UNIVERS)
          + '<details><summary>Offrir</summary>' + "".join(f'<a href="#" data-find="qui:{k}">{v}</a>' for k, v in POURQUI.items()) + '<a href="#" title="Page du site, inchangée">Carte cadeau</a></details>'
          + f'<a class="drw-all" href="#" data-go="boutique"><b>Toute la boutique</b><small>{len(P)} créations</small></a>'
          + '<div class="drw-sec"><a href="#" title="Page du site, inchangée">Promotions</a><a href="#" title="Page du site, inchangée">Idées &amp; conseils</a><a href="#" title="Page du site, inchangée">À propos</a><a href="#" title="Page du site, inchangée">Contact</a><a href="#" title="Page du site, inchangée">Mon compte</a></div></div></div>')

HEADER = f'''<a class="skip" href="#contenu">Aller au contenu</a>
<p class="ribbon"><span>Livraison offerte dès 45 € sur les bijoux</span><span>Gravé en France</span><span>Paiement sécurisé</span></p>
<header class="header header-centered" id="top">
  <div class="htop">
    <a href="#" class="logo" data-view="accueil" aria-label="Niv Création, accueil"><img class="logo-img" src="{LOGO}" alt="Niv Création, atelier de personnalisation"></a>
    <div class="hacts">
      <a href="#" class="hbtn" aria-label="Mon espace" title="Page du site, inchangée">{ic("user")}</a>
      <button class="hbtn" type="button" aria-label="Ouvrir le panier">{ic("bag")}<span class="cart-badge">2</span></button>
      <button class="hbtn burger" type="button" aria-label="Menu" id="burger" aria-expanded="false" aria-controls="drw"><span></span><span></span></button>
    </div>
  </div>
  {NAV}
</header>'''

# ---------------------------------------------------------------- accueil
BIJOUX6 = ["collier-3coeurs", "collier-coeur-plaques", "collier-coeur-grave", "collier-double-coeur", "bracelet-femme-acier", "bracelet-cordon-plaque"]
def carte_home(s, badge=""):
    """Vignette des blocs de l'accueil : même carte, avec une étiquette éditoriale facultative (« Best-seller » voulue par le gérant)."""
    c = carte(s)
    return c.replace('<span class="uc-meta">', f'<span class="uc-meta"><span class="uc-tag">{badge}</span>', 1) if badge and not P[s]["badge"] else c
NOUVEAUX = sorted(P, key=lambda s: P[s]["date"], reverse=True)[:6]
VERRES = ["verre-a-whisky-grave", "verre-a-cocktail-grave", "verre-a-vin-grave", "flute-a-champagne-gravee", "carafe-a-whisky-gravee"]   # 5 tuiles = 8 cellules, aucune orpheline
carafe = P["carafe-a-whisky-gravee"]
enf = next(u for u in UNIVERS if u["id"] == "enfants")
couv = P["couverts-enfants-personnalises"]

HERO = f'''<section class="hero" id="hero">
  <div class="hero-copy">
    <h1>Votre photo, <em>sculptée</em> dans le cristal.</h1>
    <p class="lead">Gravure photo 3D au cœur d’un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière, et l’émotion.</p>
    <div class="cta-row">{btn("Créer mon cristal")}<a class="btn btn-ghost" href="#"><span>Voir les tailles et prix</span></a></div>
  </div>
  <figure class="hero-fig">
    <div class="hero-arch" id="arch"><img src="{img("/produits/cristal-v-femme.jpg", 1100, 76)}" alt="Portrait de femme gravé en trois dimensions dans un bloc de cristal" fetchpriority="high"><span class="laser" aria-hidden="true"></span></div>
    <figcaption><b>{esc(P["cristal-photo-3d-vertical"]["name"])}</b><span>{prix(P["cristal-photo-3d-vertical"])[0]}</span></figcaption>
  </figure>
</section>
<ul class="trust" aria-label="Nos engagements"><li>Gravé en France</li><li>Cristal K9 premium</li><li>Livraison suivie</li><li>{STAR} 4,8/5 sur 286 avis</li></ul>'''

FINDER = '''<section class="fd rv" id="trouver" aria-labelledby="t-fd">
  <h2 id="t-fd">Trouver un cadeau <em>en trois clics</em></h2>
  <div class="fd-grp" role="group" aria-label="Pour qui"><span>Pour qui ?</span>''' + "".join(puce("button", f'type="button" data-k="qui" data-v="{k}" aria-pressed="false"', esc(court(v))) for k, v in POURQUI.items()) + '''</div>
  <div class="fd-grp" role="group" aria-label="Occasion"><span>Pour quelle occasion ?</span><span class="fetes" data-max="3" data-as="button"></span>''' + "".join(
    puce("button", f'type="button" data-k="occ" data-v="{v}" aria-pressed="false"', l) for v, l in (("naissance", "Naissance &amp; baptême"), ("mariage", "Mariage"), ("anniversaire", "Anniversaire"), ("amour", "Amour"))) + '''</div>
  <div class="fd-grp" role="group" aria-label="Budget"><span>Quel budget ?</span>''' + "".join(
    puce("button", f'type="button" data-k="budget" data-v="{v}" aria-pressed="false"', l) for v, l in (("0-20", "Moins de 20 €"), ("20-40", "20 à 40 €"), ("40-999", "Plus de 40 €"))) + '''</div>
  <p class="fd-count" id="fdCount" aria-live="polite">Choisissez un ou plusieurs critères.</p>
  <div class="ug fd-res" id="fdRes"></div>
</section>'''

BIJOUX = f'''<section class="sec bij rv" aria-labelledby="t-bij">
  <div class="bij-copy">
    <h2 id="t-bij">Des bijoux gravés <em>avec le prénom</em> de votre choix</h2>
    <p>Colliers et bracelets en acier, gravés à la commande dans notre atelier : un prénom, une date, un mot qui compte.</p>
    <div class="bij-cats">{"".join(puce("a", f'href="#" data-find="qui:{k}"', l) for k, l in (("elle", "Femme"), ("lui", "Homme"), ("couple", "Couple"), ("enfant", "Bébé")))}</div>
    {btn("Voir tous les bijoux", "btn-ink", 'href="#" data-go="bijoux"')}
    <p class="bij-note">Livraison offerte dès 45 € sur les bijoux.</p>
  </div>
  <div class="ug ug-3 bij-grid">{carte_home("collier-3coeurs", "Best-seller")}{"".join(carte_home(s) for s in BIJOUX6[1:])}</div>
</section>'''

NOUVEAUTES = f'''<section class="sec rail-sec rv" id="nouveautes" aria-labelledby="t-new">
  <div class="sec-head"><div><h2 id="t-new">Les dernières sorties <em>de l’atelier</em></h2><p class="sub">Nos créations ajoutées ces derniers jours.</p></div>
    <div class="rail-ctrl"><button type="button" class="rbtn" data-rail="rail1" data-dir="-1" aria-label="Précédent">{ic("left")}</button><button type="button" class="rbtn" data-rail="rail1" data-dir="1" aria-label="Suivant">{ic("right")}</button></div></div>
  <div class="rail" id="rail1" tabindex="0" aria-label="Nouveautés">{"".join(carte_home(s) for s in NOUVEAUX)}</div>
</section>'''

ENFANTS = f'''<section class="sec enf rv" aria-labelledby="t-enf">
  <div class="enf-grid">
    <a class="enf-big" href="#" data-go="enfants"><img src="{img("/produits/couverts_enfants_ex_enfant.jpg", 1000)}" alt="Enfant qui mange avec sa cuillère personnalisée"><span class="enf-lab"><b>{esc(couv["name"])}</b><span>{prix(couv)[0]}</span></span></a>
    <div class="enf-copy">
      <h2 id="t-enf">Bébé &amp; Enfant : <em>des cadeaux personnalisés</em> avec le prénom de votre enfant</h2>
      <p>Naissance, premiers repas, chambre{", jeux" if PUZ else ""} : tous nos cadeaux personnalisés pour les petits, réunis au même endroit.</p>
      <div class="enf-cats">{"".join(puce("a", f'href="#r-enfants-{i}" data-go="enfants"', esc(n)) for i, (n, _) in enumerate(enf["rayons"]))}</div>
      <div class="ug ug-2">{"".join(carte(s) for s in ["plaque-de-naissance-coeur", "veilleuse-arbre-de-vie-prenom", "cartes-etapes-bebe-animaux", "bracelet-empreinte-pied-bebe"])}</div>
      {btn("Voir tout l’univers", "btn-ink", 'href="#" data-go="enfants"')}
    </div>
  </div>
  {coffret("home")}
</section>'''

CARAFE = f'''<section class="limited rv" aria-labelledby="t-lim">
  <figure class="lim-fig"><img src="{img("/produits/carafe_gravee.jpg", 1000)}" alt="Carafe à whisky gravée, bouchon à facettes"></figure>
  <div class="lim-copy">
    <span class="lim-pill"><i></i>Édition limitée</span>
    <h2 id="t-lim">La carafe à whisky <em>gravée</em>, un cadeau d’exception</h2>
    <p>Verre taillé, bouchon à facettes, gravée avec votre prénom ou le modèle de votre choix. Livraison offerte dès 60 € d’achat.</p>
    <p class="lim-price"><b>{prix(carafe)[0]}</b><span>livraison offerte</span></p>
    {btn("Découvrir la carafe")}
  </div>
</section>'''

def tuile_verre(s, big=False):
    p = P[s]; return (f'<a class="bt{" bt-big" if big else ""}" href="#p-{s}" data-go="verres"><span class="bt-img {photo(s)}" role="img" aria-label="{esc(p["name"])}"></span>'
                      f'<span class="bt-lab"><span class="bt-name">{esc(p["name"])}</span><span class="bt-price">{prix(p)[0]}</span></span></a>')
VERRES_SEC = f'''<section class="sec verres rv" aria-labelledby="t-verres">
  <div class="sec-head"><div><h2 id="t-verres">Verres &amp; Carafes <em>gravés</em></h2><p class="sub">Whisky, vin, champagne, cocktail et carafe, gravés à la commande dans notre atelier.</p></div><a class="link" href="#" data-go="verres">Voir tous les verres et carafes {ic("arrow")}</a></div>
  <div class="bento-v">{tuile_verre(VERRES[0], True)}{"".join(tuile_verre(s) for s in VERRES[1:])}</div>
</section>'''

NOEL = f'''<section class="noel rv" aria-labelledby="t-noel">
  <div class="noel-copy">
    <h2 id="t-noel">Ce Noël, offrez un <em>cadeau unique</em></h2>
    <p>Cristal photo, verres, bijoux gravés : chaque création est faite à la commande dans notre atelier, et n’existe qu’une fois.</p>
    {btn("Voir les idées de Noël", "btn-gold", 'href="#" data-find="occ:noel"')}
    <p class="noel-note">Chaque pièce est gravée une par une : pensez-y tôt.</p>
  </div>
  <div class="fan" aria-hidden="true"><img class="fan-1" src="{img("/produits/cristal-h-famille.jpg", 640)}" alt=""><img class="fan-2" src="{img("/produits/collier-coeur-plaques-1.jpg", 640)}" alt=""><img class="fan-3" src="{img("/produits/verre_a_whisky_exemple_face.jpg", 640)}" alt=""></div>
</section>'''

UT_NEW = '<i class="pill-new ut-new">Nouveau</i>'
UNIV_TILES = "".join(
    f'<a class="ut ut-{u["id"]}" href="#" data-go="{u["id"]}"><img src="{img(u["img"], 760)}" alt=""><span class="ut-lab"><b>{esc(u["nom"])}</b><span>{compte(u)} créations</span></span>{UT_NEW if u.get("neuf") else ""}</a>'
    for u in UNIVERS)
UNIVERS_HOME = f'''<section class="sec univ rv" id="univers" aria-labelledby="t-univ">
  <div class="sec-head"><div><h2 id="t-univ">Nos univers</h2><p class="sub">Toutes nos créations, classées par univers. Les pièces personnalisables sont gravées à la commande dans notre atelier.</p></div></div>
  <div class="ut-grid">{UNIV_TILES}</div>
  <a class="ut-offrir" href="#" data-go="offrir"><b>Offrir</b><span class="ut-chips"><i>Pour qui</i><i>Occasion</i><i>Budget</i></span><span>Trouvez un cadeau en trois clics.</span>{ic("arrow")}</a>
</section>'''

ATELIER = f'''<section class="atelier rv" id="atelier" aria-labelledby="t-at">
  <h2 id="t-at" class="statement">Chaque pièce est dessinée puis gravée au laser dans notre atelier. Prénoms, dates, messages, photos : vos idées deviennent des objets chargés de sens.</h2>
  <ol class="steps">
    <li>{ic("pen")}<b>Vous choisissez</b><span>Une création, et ce que vous voulez y graver : un prénom, une date, un mot, une photo.</span></li>
    <li>{ic("laser")}<b>Nous gravons</b><span>À la commande, pièce par pièce, dans notre atelier.</span></li>
    <li>{ic("gift")}<b>Vous offrez</b><span>Livraison suivie, emballage soigné, une pièce qui n’existe qu’une fois.</span></li>
  </ol>
  <div class="at-row">
    <div class="at-pics" aria-hidden="true"><img class="at-1" src="{img("/produits/cristal-v-couple.jpg", 760)}" alt=""><img class="at-2" src="{img("/produits/verre_vin_exemple_dale.jpg", 640)}" alt=""></div>
    <div class="at-copy"><p>Bois noble, acier inoxydable, cristal : nous choisissons des matériaux durables pour des créations qui traversent le temps.</p>{btn("Commander une création", "btn-ink", 'href="#" data-go="boutique"')}</div>
  </div>
</section>'''

MUR_SLUGS = [s for s in P if photo(s)]
def mur_rows(n=3):
    rows = [MUR_SLUGS[i::n] for i in range(n)]
    out = []
    for r, row in enumerate(rows):
        tiles = "".join(f'<a class="wt" href="#p-{s}" data-go="{HOME[s]}"><span class="wt-img {photo(s)}" role="img" aria-label="{esc(P[s]["name"])}"></span><span class="wt-l"><span>{esc(P[s]["name"])}</span><b>{prix(P[s])[0]}</b></span></a>' for s in row)
        out.append(f'<div class="mq mq-{r}"><div class="mq-track">{tiles}<span class="mq-copy" aria-hidden="true">{tiles}</span></div></div>')
    return "".join(out)
MUR = f'''<section class="wall rv" id="wall" aria-labelledby="t-wall">
  <div class="wall-head"><h2 id="t-wall">Toutes nos créations, <em>d’un seul regard</em></h2><p>Le mur défile tout seul. Touchez une pièce pour l’arrêter et lire son nom et son prix.</p></div>
  {mur_rows()}
  <div class="wall-foot">{btn("Parcourir toute la boutique", "btn-gold", 'href="#" data-go="boutique"')}</div>
</section>'''

AVIS = f'''<section class="proof rv" aria-label="Avis clients">
  <div class="stars" aria-hidden="true">{STAR*5}</div>
  <p class="proof-note"><b>4,8/5</b> sur 286 avis clients</p>
  <a class="link" href="#" title="Page du site, inchangée">Lire les avis {ic("arrow")}</a>
</section>'''

CUSTOM = f'''<section class="custom rv" aria-labelledby="t-cus">
  <div class="custom-in">
    <h2 id="t-cus">Une idée précise ? Créons-la <em>ensemble</em></h2>
    <p>Gravure et découpe laser de précision, sur mesure.</p>
    {btn("Demander un projet sur mesure")}
  </div>
</section>'''

FOOTER = f'''<footer class="footer">
  <div class="foot-news">
    <div><h4>Restez informé</h4><p>Nouveautés, offres et inspirations, directement par e-mail.</p></div>
    <form onsubmit="return false"><label class="vh" for="nl">Votre e-mail</label><input id="nl" type="email" placeholder="Votre e-mail" autocomplete="off"><button class="btn btn-gold" type="submit"><span>S’inscrire</span></button></form>
  </div>
  <div class="foot-grid">
    <div class="foot-brand"><img class="footer-logo" src="{LOGO}" alt="Niv Création, atelier de personnalisation"><p>Atelier français de gravure et découpe laser. Bijoux, décorations de mariage et cadeaux personnalisés, gravés avec soin dans notre atelier.</p>
      <a href="mailto:contact.nivcreation@gmail.com">contact.nivcreation@gmail.com</a><a href="tel:+33766153102">07 66 15 31 02</a><span>6 rue d’Armaillé, 75017 Paris</span>
      <div class="foot-insta"><img src="{QR}" alt="QR code Instagram Niv Création"><div><b>Suivez-nous sur Instagram</b><a href="https://www.instagram.com/nivcreation.fr" target="_blank" rel="noopener noreferrer">@nivcreation.fr</a><span>Scannez le code ou touchez le lien</span></div></div></div>
    <div><h4>Boutique</h4>{"".join(f'<a href="#" data-go="{u["id"]}">{esc(u["nom"])}</a>' for u in UNIVERS)}<a href="#" data-go="offrir">Offrir</a><a href="#" data-go="boutique">Tout voir</a></div>
    <div><h4>Aide</h4><a href="#" title="Page du site, inchangée">Questions fréquentes</a><a href="#" title="Page du site, inchangée">Avis clients</a><a href="#" title="Page du site, inchangée">À propos</a><a href="#" title="Page du site, inchangée">Nous contacter</a><a href="#" title="Page du site, inchangée">Retours et remboursements</a><a href="#" title="Page du site, inchangée">La personnalisation</a></div>
    <div><h4>Idées &amp; conseils</h4><a href="#" title="Page du site, inchangée">Cadeau femme</a><a href="#" title="Page du site, inchangée">Bijoux homme</a><a href="#" title="Page du site, inchangée">Que faire graver ?</a><a href="#" title="Page du site, inchangée">Déco de mariage</a><a href="#" title="Page du site, inchangée">Cristal photo 3D</a><a href="#" title="Page du site, inchangée">Tous nos guides</a><a href="#" data-go="offrir">Trouver un cadeau par occasion</a><a href="#" title="Page du site, inchangée">Carte cadeau</a></div>
    <div><h4>Informations</h4><a href="#" title="Page du site, inchangée">Mes favoris</a><a href="#" title="Page du site, inchangée">Politique de retour</a><a href="#" title="Page du site, inchangée">CGV</a><a href="#" title="Page du site, inchangée">Mentions légales</a><a href="#" title="Page du site, inchangée">Confidentialité</a></div>
  </div>
  <div class="foot-bottom"><span>© 2026 Niv Création. Tous droits réservés.</span><span>Paiement sécurisé par Stripe</span></div>
</footer>
<button type="button" class="ask">{ic("chat")}<span>Une question ?</span></button>'''

ACCUEIL = f'<main id="contenu">{HERO}{FINDER}{BIJOUX}{NOUVEAUTES}{ENFANTS}{CARAFE}{VERRES_SEC}{NOEL}{UNIVERS_HOME}{ATELIER}{MUR}{AVIS}{CUSTOM}</main>'

UNIV_VIEW = ('<main class="uv" id="vueUnivers" hidden><nav class="uv-tabs" aria-label="Univers">'
             + puce("button", 'type="button" data-view="accueil"', "Accueil")
             + "".join(puce("button", f'type="button" data-go="{u["id"]}" aria-current="false"', f'{esc(u["nom"])} <small>{compte(u)}</small>') for u in UNIVERS)
             + puce("button", 'type="button" data-go="boutique" aria-current="false"', f'Tout <small>{len(P)}</small>')
             + puce("button", 'type="button" data-go="offrir" aria-current="false"', "Offrir") + '</nav>'
             + "".join(page_univers(u) for u in UNIVERS) + page_univers(BOUTIQUE)
             + '<article class="up" id="u-offrir" data-u="offrir" hidden><header class="up-head up-head-solo"><div class="up-txt"><nav class="crumb" aria-label="Fil d’Ariane"><a href="#" data-view="accueil">Accueil</a><span>/</span><span aria-current="page">Offrir</span></nav><h2>Trouver un cadeau</h2>'
               '<p>Toutes nos créations, selon la personne, l’occasion et le budget.</p></div></header><div id="offrirSlot"></div></article>'
             + '</main>')

NOTES = f'''<div class="mbar" role="region" aria-label="Maquette">
  <div class="mbar-in"><b>Maquette, rien n’est en ligne</b>
  <div class="mbar-tabs" role="tablist"><button type="button" class="on" data-view="accueil">Accueil</button><button type="button" data-view="univers">Pages univers</button></div>
  <button type="button" class="mbar-more" id="mbarMore" aria-expanded="false">Ce qui change</button></div>
  <ul class="mbar-notes" id="mbarNotes" hidden>
    <li><b>Un seul monde visuel, du haut en bas</b> : papier crème, encre, or en filet ; Playfair Display pour les titres (la police du site), Jost pour les textes à la place d’Inter ; photos de pièces gravées, grandes et sans cadre ; une seule famille de boutons (pilule, flèche dans sa pastille) et de puces. Le logo est celui du site, intouché.</li>
    <li><b>Accueil</b> : héros en deux colonnes avec le laser qui révèle la photo, « Trouver un cadeau en trois clics », bijoux en vitrine, nouveautés, Bébé &amp; Enfant + coffret, carafe édition limitée, verres en mosaïque, Noël, « Nos univers », l’atelier en trois gestes, le mur, les avis, le sur mesure, pied de page.</li>
    <li><b>Pages univers</b> : un en-tête par univers (titre, accroche, nombre, photo), les rayons et les filtres dans une barre qui reste visible, les mêmes cartes partout, « Toute la boutique » et « Offrir ».</li>
    <li><b>Tout ce qui a été corrigé le 09/10 est gardé</b> : rangement des 75 créations, retour à l’accueil, menus et tiroir, budget sur l’intervalle de prix, boutons grisés, fêtes calculées (nom seul, 3 mois), textes sans « au prénom ».{" Version avec puzzles : « Jeux en bois » et « Cristaux déjà gravés » marqués « Bientôt », coffret Savane." if PUZ else ""}</li>
    <li><b>Mouvement</b> : apparition douce au défilement, zoom lent des photos au survol, mur qui s’arrête sous le doigt, respect du réglage « réduire les animations ».</li>
    <li><b>Photos à vérifier sur le site</b> (hébergées sur le CDN, non copiées ici) : {", ".join(REMOTE)}.</li>
    <li>Prix lus dans le code (Gestion peut les avoir changés). Les pages du site non maquettées gardent un lien « Page du site, inchangée ».</li>
  </ul>
</div>'''

ALL_CARDS = "".join(carte(s) for s in P)
assert all(pourqui(s) for s in P), "une pièce sans « Pour qui »"

# ---------------------------------------------------------------- CSS
CSS = r'''
:root{--cream:#fbf7ee;--paper:#fdfaf3;--sand:#f3e8d3;--sand2:#eadbbf;--line:rgba(26,18,6,.13);--line2:rgba(26,18,6,.26);
 --ink:#1a1206;--ink2:#241a0c;--ink3:#3a2e1c;--muted:#6b5f4b;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;
 --on-ink:#d9ccb0;--on-ink2:#b8a98a;--red:#7a1512;--red2:#5a0e0c;
 --serif:"Playfair Display",Georgia,"Times New Roman",serif;--sans:"Jost","Helvetica Neue",Arial,sans-serif;
 --r:6px;--ease:cubic-bezier(.16,1,.3,1);--ease2:cubic-bezier(.32,.72,0,1);--gut:clamp(20px,5vw,80px);--wrap:1380px;--hdr:0px}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--ink);font:400 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
h1,h2,h3,h4{font-family:var(--serif);font-weight:500;line-height:1.08;margin:0;letter-spacing:-.01em;text-wrap:balance}
h1 em,h2 em,h3 em{font-style:italic;color:var(--gold-t);font-weight:500}
p{margin:0}
::selection{background:var(--gold-l);color:var(--ink)}
:focus-visible{outline:2px solid var(--gold-d);outline-offset:3px;border-radius:3px}
html{scrollbar-color:var(--gold-d) var(--sand)}
input{caret-color:var(--gold-d)}
.vh,.skip{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip:focus{position:fixed;left:16px;top:16px;width:auto;height:auto;clip:auto;z-index:200;background:var(--ink);color:var(--cream);padding:10px 16px;border-radius:999px}
[hidden]{display:none!important}
.ic{width:20px;height:20px;flex:none}
/* ---- apparition au défilement : une seule famille de mouvement, exponentielle, depuis un état déjà lisible */
.rv{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1.1s var(--ease)}
.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
/* ---- boutons : une pilule, la flèche dans sa pastille */
.btn{display:inline-flex;align-items:center;gap:12px;padding:6px 6px 6px 24px;border-radius:999px;font-weight:500;font-size:.95rem;letter-spacing:.01em;line-height:1;min-height:52px;transition:transform .5s var(--ease2),background .4s,color .4s,box-shadow .4s;white-space:nowrap}
.btn:active{transform:scale(.98)}
.btn-i{width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none;transition:transform .5s var(--ease2)}
.btn-i .ic{width:18px;height:18px}
.btn:hover .btn-i{transform:translateX(3px)}
.btn-gold{background:var(--gold);color:var(--ink)}.btn-gold .btn-i{background:rgba(26,18,6,.12)}.btn-gold:hover{background:var(--gold-l)}
.btn-ink{background:var(--ink);color:var(--cream)}.btn-ink .btn-i{background:rgba(251,247,238,.14)}.btn-ink:hover{background:var(--ink3)}
.btn-ghost{box-shadow:inset 0 0 0 1px var(--line2);padding:6px 24px}.btn-ghost:hover{background:var(--sand)}
.btn>span{display:inline-block}
.link{display:inline-flex;align-items:center;gap:8px;font-weight:500;color:var(--gold-t);position:relative}
.link .ic{width:16px;height:16px;transition:transform .4s var(--ease)}.link:hover .ic{transform:translateX(4px)}
.link::after{content:"";position:absolute;left:0;right:26px;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .5s var(--ease)}.link:hover::after{transform:scaleX(1)}
/* ---- puces (filtres, rayons, onglets) : un seul dessin, cible tactile 44 px */
.puce{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:9px 18px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line2);font-weight:500;font-size:.9rem;background:transparent;color:var(--ink);transition:background .3s,color .3s,box-shadow .3s,opacity .3s}
.puce:hover,.puce.on,.puce[aria-pressed="true"],.puce[aria-current="page"],.puce[aria-current="true"]{background:var(--ink);color:var(--cream);box-shadow:none}
.puce.off{opacity:.35;cursor:not-allowed;background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.pill-new{font-style:normal;font-family:var(--sans);font-weight:500;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;background:var(--gold);color:var(--ink);padding:4px 8px;border-radius:999px;white-space:nowrap;vertical-align:middle}
/* ---- barre de maquette */
.mbar{position:relative;z-index:80;background:var(--ink);color:var(--on-ink);font-size:.82rem}
.mbar-in{display:flex;align-items:center;gap:10px 18px;flex-wrap:wrap;padding:8px var(--gut);max-width:var(--wrap);margin:0 auto}
.mbar-in>b{color:var(--gold-l);font-weight:500;letter-spacing:.02em}
.mbar-tabs{display:flex;gap:6px}
.mbar-tabs button,.mbar-more{padding:6px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.4);color:var(--gold-l);font-weight:500}
.mbar-tabs button.on{background:var(--gold);color:var(--ink);box-shadow:none}
.mbar-more{margin-left:auto}
.mbar-notes{margin:0 auto;padding:4px var(--gut) 16px calc(var(--gut) + 18px);max-width:var(--wrap);line-height:1.55}
.mbar-notes li{margin:6px 0}.mbar-notes b{color:var(--gold-l);font-weight:500}
/* ---- ruban + en-tête (le logo est celui du site : 92 px / 64 px, arrondi 10 px) */
.ribbon{display:flex;justify-content:center;gap:0;background:var(--ink);color:var(--on-ink);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;padding:9px var(--gut)}
.ribbon span{padding:0 18px;position:relative}.ribbon span+span::before{content:"";position:absolute;left:0;top:50%;width:3px;height:3px;border-radius:50%;background:var(--gold);transform:translateY(-50%)}
.header{position:sticky;top:0;z-index:50;background:rgba(251,247,238,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.htop{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:14px var(--gut) 10px;max-width:var(--wrap);margin:0 auto}
.logo{grid-column:2;display:inline-block;line-height:0}
.header-centered .logo-img{height:92px;width:auto;display:block;border-radius:10px}
.hacts{grid-column:3;justify-self:end;display:flex;gap:4px;align-items:center}
.hbtn{position:relative;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;transition:background .3s}.hbtn:hover{background:var(--sand)}
.hbtn .ic{width:22px;height:22px}
.cart-badge{position:absolute;top:5px;right:4px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:var(--gold);color:var(--ink);font-size:.62rem;font-weight:600;display:flex;align-items:center;justify-content:center}
.burger{display:none;flex-direction:column;gap:5px}.burger span{width:20px;height:1.5px;background:var(--ink);display:block;transition:transform .4s var(--ease)}
.hnav{display:flex;justify-content:center;gap:2px;padding:0 var(--gut) 2px;max-width:var(--wrap);margin:0 auto;position:relative}
.mg{position:static}
.mg-top{display:inline-flex;align-items:center;gap:7px;padding:12px 13px 14px;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;position:relative;white-space:nowrap}
.mg-top::after{content:"";position:absolute;left:13px;right:13px;bottom:8px;height:1px;background:var(--gold-d);transform:scaleX(0);transform-origin:left;transition:transform .5s var(--ease)}
.mg:hover .mg-top::after,.mg.open .mg-top::after,.mg-top.cur::after{transform:scaleX(1)}
.mg-offrir{color:var(--gold-t)}
.mg-panel{position:absolute;left:50%;top:100%;width:min(1140px,96vw);display:grid;grid-template-columns:1fr 320px;gap:36px;padding:34px 40px 36px;background:var(--paper);border:1px solid var(--line);border-top:0;box-shadow:0 40px 70px -40px rgba(26,18,6,.45);z-index:60;text-align:left;
  opacity:0;visibility:hidden;transform:translate(-50%,-8px);transition:opacity .25s var(--ease) .12s,transform .25s var(--ease) .12s,visibility 0s linear .4s}
.mg:hover .mg-panel,.mg.open .mg-panel{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .3s var(--ease),transform .3s var(--ease),visibility 0s}
.mg.closed:hover .mg-panel{opacity:0;visibility:hidden;transform:translate(-50%,-8px);transition:none}.mg.closed:hover .mg-top::after{transform:scaleX(0)}
.mg-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:22px 30px}
.mg-cols .mg-h{display:block;font-family:var(--serif);font-size:1.15rem;margin-bottom:10px;color:var(--ink)}.mg-cols a.mg-h:hover{color:var(--gold-t)}
.mg-cols a:not(.mg-h){display:block;font-size:.9rem;padding:4px 0;color:var(--muted);transition:color .3s,transform .4s var(--ease)}.mg-cols a:not(.mg-h):hover{color:var(--ink);transform:translateX(3px)}
.mg-cols .mg-more{color:var(--gold-t)!important;font-weight:500;margin-top:6px}
.mg-pic{position:relative;border-radius:var(--r);overflow:hidden;min-height:220px;display:block}
.mg-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.4s var(--ease)}.mg-pic:hover img{transform:scale(1.05)}
.mg-pic span{position:absolute;left:0;right:0;bottom:0;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:40px 16px 14px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);font-size:.9rem}
.mg-pic b{font-weight:500}.mg-pic .ic{width:18px;height:18px}
/* ---- tiroir (téléphone) */
.drw{position:fixed;inset:0;z-index:90;background:rgba(26,18,6,.55)}
.drw-in{position:absolute;inset:0 auto 0 0;width:min(380px,90vw);background:var(--cream);overflow:auto;padding:18px 22px 44px;transform:translateX(-100%);transition:transform .45s var(--ease2)}
.drw:not([hidden]) .drw-in{transform:none}
.drw-x{width:44px;height:44px;margin-left:auto;display:flex;align-items:center;justify-content:center;border-radius:50%}.drw-x .ic{width:22px;height:22px}
.drw-home,.drw-all{display:block;padding:16px 2px;font-family:var(--serif);font-size:1.3rem;border-bottom:1px solid var(--line)}
.drw-all{display:flex;align-items:baseline;gap:10px;margin-top:6px}.drw-all small{font-family:var(--sans);font-size:.82rem;color:var(--muted)}
.drw details{border-bottom:1px solid var(--line)}
.drw summary{padding:16px 2px;font-family:var(--serif);font-size:1.3rem;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;min-height:44px}
.drw summary::-webkit-details-marker{display:none}
.drw summary small{font:400 .82rem var(--sans);color:var(--muted)}
.drw summary::after{content:"+";color:var(--gold-d);font-family:var(--sans);font-size:1.4rem;margin-left:auto;transition:transform .4s var(--ease)}.drw details[open] summary::after{transform:rotate(45deg)}
.drw details a{display:block;padding:10px 14px;color:var(--muted)}.drw details a b{color:var(--ink);font-weight:500}
.drw-sec{padding-top:14px}.drw-sec a{display:block;padding:10px 2px;color:var(--muted)}
/* ---- héros : deux colonnes, la photo dans une arche, le laser la révèle une fois */
.hero{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);gap:clamp(28px,5vw,80px);align-items:center;max-width:var(--wrap);margin:0 auto;padding:clamp(28px,5vw,72px) var(--gut) clamp(28px,4vw,56px)}
.hero-copy{max-width:600px}
.hero h1{font-size:clamp(2.6rem,5.4vw,5.1rem);line-height:1.02;letter-spacing:-.02em;opacity:0;transform:translateY(18px);animation:up 1.2s var(--ease) .15s forwards}
.hero .lead{margin:24px 0 32px;max-width:48ch;font-size:1.08rem;color:var(--muted);line-height:1.65;opacity:0;animation:up 1.2s var(--ease) .35s forwards}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;opacity:0;animation:up 1.2s var(--ease) .5s forwards}
@keyframes up{to{opacity:1;transform:none}}
.hero-fig{margin:0;position:relative;justify-self:center;width:min(100%,520px)}
.hero-arch{position:relative;aspect-ratio:5/6;border-radius:260px 260px var(--r) var(--r);overflow:hidden;background:var(--sand);isolation:isolate}
.hero-arch img{width:100%;height:100%;object-fit:cover;object-position:center 30%;transform:scale(1.08);filter:saturate(.85);animation:settle 2.4s var(--ease) .2s forwards}
@keyframes settle{to{transform:scale(1);filter:saturate(1)}}
.laser{position:absolute;left:0;right:0;top:-6px;height:3px;background:linear-gradient(90deg,transparent,var(--gold-l) 30%,#fff 50%,var(--gold-l) 70%,transparent);box-shadow:0 0 18px 4px rgba(226,198,126,.55);opacity:0;animation:laser 2.2s var(--ease2) .4s forwards}
@keyframes laser{0%{opacity:0;transform:translateY(0)}8%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translateY(calc(100% * 14))}}
.hero-fig figcaption{position:absolute;left:18px;bottom:18px;display:flex;flex-direction:column;gap:2px;padding:12px 18px;background:rgba(251,247,238,.92);backdrop-filter:blur(8px);border-radius:var(--r);font-size:.85rem;opacity:0;animation:up 1s var(--ease) 1.2s forwards}
.hero-fig figcaption b{font-weight:500}.hero-fig figcaption span{font-family:var(--serif);color:var(--gold-t);font-size:.95rem}
.trust{list-style:none;margin:0 auto;padding:18px var(--gut);max-width:var(--wrap);display:flex;justify-content:center;flex-wrap:wrap;gap:8px 40px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.trust li{display:inline-flex;align-items:center;gap:8px}.trust .star{width:14px;height:14px;color:var(--gold-d)}
/* ---- sections */
.sec{max-width:var(--wrap);margin:0 auto;padding:clamp(56px,8vw,112px) var(--gut)}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:clamp(26px,3vw,44px)}
.sec-head h2{font-size:clamp(2rem,3.6vw,3.1rem)}
.sub{color:var(--muted);margin-top:12px;max-width:60ch}
/* ---- trouver un cadeau */
.fd{max-width:var(--wrap);margin:clamp(40px,6vw,80px) auto 0;padding:0 var(--gut);text-align:center}
.fd h2{font-size:clamp(2rem,3.8vw,3.2rem);margin-bottom:26px}
.fd-grp{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin:10px 0}
.fd-grp>span,.uf-grp>span{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-right:8px}
.fd-count{margin:22px 0 16px;color:var(--muted)}
.fd-res{text-align:left}
.fd-res .uc{animation:fdIn .5s var(--ease) both;animation-delay:calc(var(--i,0)*45ms)}
@keyframes fdIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.fd-more{margin-top:22px}
.fd-page{text-align:left;margin-top:0}.fd-page .fd-grp{justify-content:flex-start}
/* ---- cartes produit */
.ug{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:34px 22px}
.ug-2{grid-template-columns:repeat(2,minmax(0,1fr))}.ug-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.uc{position:relative;display:flex;flex-direction:column;min-width:0;scroll-margin-top:170px}
.uc-link{display:flex;flex-direction:column;gap:12px}
.uc-img{position:relative;aspect-ratio:1;border-radius:var(--r);overflow:hidden;background:var(--sand);display:block;box-shadow:inset 0 0 0 1px var(--line)}
.uc-ph{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform 1.4s var(--ease)}
.uc:hover .uc-ph{transform:scale(1.05)}
.uc-remote{width:100%;height:100%;object-fit:cover;z-index:1}
.uc-cta{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;padding:10px 0;border-radius:999px;background:rgba(251,247,238,.94);color:var(--ink);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;text-align:center;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .5s var(--ease)}
.uc:hover .uc-cta,.uc:focus-within .uc-cta{opacity:1;transform:none}
.uc .fav{position:absolute;top:10px;right:10px;z-index:3;width:40px;height:40px;border-radius:50%;background:rgba(251,247,238,.9);display:flex;align-items:center;justify-content:center;color:var(--ink);opacity:0;transition:opacity .3s,transform .3s}
.uc .fav .ic{width:18px;height:18px}.uc:hover .fav,.uc .fav:focus-visible,.uc .fav.on{opacity:1}.uc .fav.on{color:var(--gold-d)}.uc .fav.on .ic{fill:currentColor}
.uc-meta{display:flex;flex-direction:column;gap:3px;padding:0 2px}
.uc-tag{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-t);font-weight:500}
.uc-tag-soon{color:var(--muted)}
.uc-name{font-weight:500;font-size:.95rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;background:linear-gradient(var(--gold-d),var(--gold-d)) no-repeat 0 100%/0 1px;transition:background-size .6s var(--ease)}
.uc:hover .uc-name{background-size:100% 1px}
.uc-price{font-family:var(--serif);font-size:1rem;color:var(--gold-t);font-variant-numeric:tabular-nums}
.uc-note{font-size:.78rem;color:var(--muted)}
.uc-none{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:var(--gold-d);background:linear-gradient(160deg,var(--sand),var(--sand2))}
.uc-none .ic{width:30px;height:30px}.uc-none small{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.uc-soon .uc-ph{filter:saturate(.8)}
.uc-soonbox{grid-column:1/-1;display:flex;flex-direction:column;gap:8px;padding:28px;border-radius:var(--r);border:1px dashed var(--gold-d);background:rgba(201,162,75,.06)}
.uc-soonbox b{font-family:var(--serif);font-weight:500;font-size:1.3rem}.uc-soonbox span:not(.uc-tag){color:var(--muted)}
/* ---- bijoux en vitrine */
.bij{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:clamp(28px,5vw,80px);align-items:start}
.bij-copy{position:sticky;top:calc(var(--hdr) + 24px)}
.bij-copy h2{font-size:clamp(2.1rem,3.8vw,3.4rem)}
.bij-copy>p{color:var(--muted);margin:18px 0 22px;max-width:40ch}
.bij-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}
.bij-note{margin-top:18px;font-size:.85rem;color:var(--gold-t)}
/* ---- rail des nouveautés */
.rail-sec{background:var(--sand);max-width:none}
.rail-sec .sec-head,.rail{max-width:var(--wrap);margin-left:auto;margin-right:auto}
.rail-ctrl{display:flex;gap:8px}
.rbtn{width:46px;height:46px;border-radius:50%;box-shadow:inset 0 0 0 1px var(--line2);display:flex;align-items:center;justify-content:center;transition:background .3s,color .3s}.rbtn:hover{background:var(--ink);color:var(--cream)}
.rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(240px,1fr);gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:6px}
.rail::-webkit-scrollbar{display:none}.rail .uc{scroll-snap-align:start}
/* ---- bébé & enfant + coffret */
.enf-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,4vw,64px);align-items:stretch}
.enf-big{position:relative;border-radius:var(--r);overflow:hidden;display:block;min-height:480px}
.enf-big img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%;transition:transform 1.6s var(--ease)}.enf-big:hover img{transform:scale(1.04)}
.enf-lab{position:absolute;left:0;right:0;bottom:0;padding:60px 22px 20px;background:linear-gradient(transparent,rgba(26,18,6,.85));color:var(--cream);display:flex;flex-direction:column;gap:2px}
.enf-lab b{font-family:var(--serif);font-weight:500;font-size:1.3rem}.enf-lab span{font-size:.9rem;color:var(--on-ink)}
.enf-copy h2{font-size:clamp(2.1rem,3.8vw,3.3rem)}
.enf-copy>p{color:var(--muted);margin:16px 0 18px;max-width:54ch}
.enf-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}
.enf .ug-2{gap:26px 22px}.enf-copy .btn{margin-top:28px}
.cof{margin-top:clamp(40px,6vw,72px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:center;padding:clamp(26px,4vw,52px);border-radius:12px;background:var(--ink);color:var(--cream)}
.cof h3{font-size:clamp(1.6rem,2.8vw,2.3rem)}.cof h3 em{color:var(--gold-l)}
.cof-txt>p{color:var(--on-ink);margin:14px 0 20px}
.cof-pick{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.cof-pick label{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:var(--r);background:rgba(251,247,238,.06);box-shadow:inset 0 0 0 1px rgba(226,198,126,.18);cursor:pointer;min-height:44px}
.cof-pick b{margin-left:auto;color:var(--gold-l);font-family:var(--serif);font-weight:500;white-space:nowrap}
.cof-pick input{accent-color:var(--gold);width:18px;height:18px}
.cof-name label{display:block;font-size:.88rem;color:var(--on-ink);margin-bottom:8px}
.cof-name input{width:100%;max-width:300px;padding:13px 16px;border-radius:var(--r);border:1px solid rgba(226,198,126,.5);background:rgba(251,247,238,.1);color:var(--cream);font:inherit;transition:border-color .3s,box-shadow .3s}
.cof-name input::placeholder{color:var(--on-ink2)}
.cof-name input:focus{border-color:var(--gold-l);box-shadow:0 0 0 3px rgba(201,162,75,.25);outline:none}
.cof-tot{margin:20px 0;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline}
.cof-tot s{color:var(--on-ink2)}.cof-tot b{font-family:var(--serif);font-weight:500;font-size:1.8rem;color:var(--gold-l)}.cof-tot span{font-size:.82rem;color:var(--on-ink)}
.cof-note{font-size:.82rem;color:var(--on-ink2);margin-top:16px}
.cof-pics{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cof-pics img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r)}
.cof-pics img:first-child{grid-column:1/-1;aspect-ratio:16/9}
.cof-nom{position:absolute;left:50%;top:28%;transform:translate(-50%,-50%);font:italic 500 clamp(1.5rem,3vw,2.4rem)/1 var(--serif);color:var(--cream);text-shadow:0 2px 16px rgba(0,0,0,.65);pointer-events:none;transition:text-shadow .3s}
.cof-nom.live{text-shadow:0 0 20px rgba(226,198,126,.85),0 2px 16px rgba(0,0,0,.65)}
.cof :focus-visible,.ut-offrir:focus-visible,.drw :focus-visible,.footer :focus-visible,.limited :focus-visible,.custom :focus-visible{outline-color:var(--gold-l)}
/* ---- carafe édition limitée : pleine largeur, encre */
.limited{background:var(--ink);color:var(--cream);display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:center;gap:clamp(24px,5vw,80px);padding:clamp(40px,6vw,96px) var(--gut)}
.lim-fig{margin:0;justify-self:center;width:min(100%,520px);aspect-ratio:4/5;border-radius:var(--r);overflow:hidden;background:var(--ink2)}
.lim-fig img{width:100%;height:100%;object-fit:cover;transition:transform 2s var(--ease)}.limited:hover .lim-fig img{transform:scale(1.04)}
.lim-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.5);color:var(--gold-l);font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;margin-bottom:22px}
.lim-pill i{width:6px;height:6px;border-radius:50%;background:var(--gold-l);animation:blink 2.4s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.lim-copy{max-width:640px}
.lim-copy h2{font-size:clamp(2.2rem,4.2vw,3.8rem)}.lim-copy h2 em{color:var(--gold-l)}
.lim-copy>p{color:var(--on-ink);margin:20px 0 22px;max-width:52ch}
.lim-price{display:flex;align-items:baseline;gap:12px;margin:0 0 26px}.lim-price b{font-family:var(--serif);font-weight:500;font-size:2rem;color:var(--gold-l)}.lim-price span{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--on-ink2)}
/* ---- verres : mosaïque */
.bento-v{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(230px,1fr));gap:14px}
.bt{position:relative;border-radius:var(--r);overflow:hidden;background:var(--sand);display:block;min-height:230px}
.bt-big{grid-column:span 2;grid-row:span 2}
.bt-img{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform 1.6s var(--ease)}.bt:hover .bt-img{transform:scale(1.05)}
.bt-lab{position:absolute;left:0;right:0;bottom:0;padding:50px 18px 16px;background:linear-gradient(transparent,rgba(26,18,6,.82));color:var(--cream);display:flex;flex-direction:column;gap:2px}
.bt-name{font-weight:500}.bt-price{font-family:var(--serif);color:var(--gold-l);font-size:.95rem}
.bt-big .bt-name{font-family:var(--serif);font-size:1.5rem}
/* ---- Noël : la bande rouge et or du site */
.noel{background:linear-gradient(135deg,var(--red),var(--red2));color:var(--cream);display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);align-items:center;gap:clamp(24px,4vw,64px);padding:clamp(44px,6vw,96px) var(--gut);overflow:hidden}
.noel h2{font-size:clamp(2.2rem,4vw,3.6rem)}.noel h2 em{color:var(--gold-l)}
.noel-copy>p{color:rgba(251,247,238,.82);margin:18px 0 24px;max-width:50ch}
.noel-note{margin-top:16px!important;font-size:.85rem;color:var(--gold-l)!important}
.fan{position:relative;height:420px}
.fan img{position:absolute;width:52%;aspect-ratio:1;object-fit:cover;border-radius:var(--r);box-shadow:0 30px 60px -30px rgba(0,0,0,.7);transition:transform 1.2s var(--ease)}
.fan-1{left:0;top:40px;transform:rotate(-7deg)}.fan-2{left:24%;top:0;transform:rotate(2deg);z-index:2}.fan-3{right:0;top:60px;transform:rotate(8deg)}
.noel:hover .fan-1{transform:rotate(-10deg) translateX(-10px)}.noel:hover .fan-3{transform:rotate(11deg) translateX(10px)}
/* ---- nos univers : mosaïque, Bijoux en grand */
.ut-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.ut{position:relative;border-radius:var(--r);overflow:hidden;aspect-ratio:4/5;display:block;background:var(--sand)}
.ut-bijoux{grid-column:span 2;aspect-ratio:auto}
.ut img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.6s var(--ease)}.ut:hover img{transform:scale(1.05)}
.ut-lab{position:absolute;left:0;right:0;bottom:0;padding:60px 18px 16px;background:linear-gradient(transparent,rgba(26,18,6,.86));color:var(--cream);display:flex;flex-direction:column}
.ut-lab b{font-family:var(--serif);font-weight:500;font-size:1.45rem}.ut-lab span{font-size:.82rem;color:var(--on-ink)}
.ut-new{position:absolute;top:14px;left:14px}
.ut-offrir{margin-top:14px;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:22px;padding:26px 32px;border-radius:var(--r);background:var(--ink);color:var(--cream);transition:background .4s}
.ut-offrir:hover{background:var(--ink3)}
.ut-offrir>b{font:500 1.7rem/1 var(--serif);color:var(--gold-l)}
.ut-chips{display:flex;flex-wrap:wrap;gap:6px}.ut-chips i{font-style:normal;padding:6px 12px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.45);color:var(--gold-l);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}
.ut-offrir>span:not(.ut-chips){color:var(--on-ink);font-size:.95rem}
.ut-offrir .ic{width:28px;height:28px;color:var(--gold);transition:transform .5s var(--ease)}.ut-offrir:hover .ic{transform:translateX(8px)}
/* ---- l'atelier */
.atelier{max-width:var(--wrap);margin:0 auto;padding:clamp(56px,8vw,112px) var(--gut);border-top:1px solid var(--line)}
.statement{font-size:clamp(1.7rem,3.2vw,2.9rem);line-height:1.22;max-width:30ch;font-weight:400}
.steps{list-style:none;margin:clamp(36px,5vw,64px) 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.steps li{padding:30px 28px 32px 0;display:flex;flex-direction:column;gap:12px;border-left:1px solid var(--line);padding-left:28px}
.steps li:first-child{border-left:0;padding-left:0}
.steps .ic{width:28px;height:28px;color:var(--gold-d)}
.steps b{font-family:var(--serif);font-weight:500;font-size:1.35rem}.steps span{color:var(--muted);font-size:.95rem;max-width:34ch}
.at-row{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:clamp(24px,4vw,64px);align-items:center}
.at-pics{position:relative;height:460px}
.at-pics img{position:absolute;object-fit:cover;border-radius:var(--r)}
.at-1{left:0;top:0;width:64%;height:100%}.at-2{right:0;bottom:-24px;width:46%;aspect-ratio:1;box-shadow:0 30px 50px -30px rgba(26,18,6,.5);border:6px solid var(--cream)}
.at-copy p{color:var(--muted);font-size:1.08rem;margin-bottom:26px;max-width:40ch}
/* ---- le mur (une seule animation défilante sur la page) */
.wall{padding:clamp(56px,8vw,112px) 0;overflow:hidden;background:var(--sand)}
.wall-head{text-align:center;padding:0 var(--gut);margin-bottom:36px}
.wall-head h2{font-size:clamp(2rem,3.6vw,3.1rem)}.wall-head p{color:var(--muted);margin-top:12px}
.mq{overflow:hidden;margin:12px 0;-webkit-mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.mq-track{display:flex;width:max-content;animation:mq 95s linear infinite}
.mq-1 .mq-track{animation-duration:110s;animation-direction:reverse}.mq-2 .mq-track{animation-duration:125s}
.mq:hover .mq-track,.mq.hold .mq-track{animation-play-state:paused}
.mq-copy{display:contents}
@keyframes mq{to{transform:translateX(-50%)}}
.wt{position:relative;flex:none;width:200px;margin-right:12px;border-radius:var(--r);overflow:hidden;background:var(--cream)}
.wt-img{display:block;aspect-ratio:1;background-size:cover;background-position:center}
.wt-l{position:absolute;left:0;right:0;bottom:0;padding:34px 12px 10px;background:linear-gradient(transparent,rgba(26,18,6,.82));color:var(--cream);font-size:.78rem;display:flex;flex-direction:column;opacity:0;transition:opacity .4s}
.wt-l b{color:var(--gold-l);font-family:var(--serif);font-weight:500;font-size:.9rem}
.wt:hover .wt-l,.mq.hold .wt.cur .wt-l{opacity:1}
.wall-foot{text-align:center;margin-top:36px}
/* ---- avis */
.proof{text-align:center;padding:clamp(48px,6vw,80px) var(--gut);display:flex;flex-direction:column;align-items:center;gap:14px}
.stars{display:flex;gap:4px;color:var(--gold-d)}.star{width:22px;height:22px}
.proof-note{font-size:1.1rem;color:var(--muted)}.proof-note b{font-family:var(--serif);font-weight:500;font-size:2.4rem;color:var(--ink);margin-right:8px}
/* ---- sur mesure */
.custom{background:var(--ink);color:var(--cream);padding:clamp(56px,8vw,120px) var(--gut);text-align:center}
.custom h2{font-size:clamp(2.2rem,4.4vw,4rem)}.custom h2 em{color:var(--gold-l)}
.custom p{color:var(--on-ink);margin:18px 0 30px}
/* ---- pied de page */
.footer{background:var(--ink2);color:var(--on-ink);padding:0 var(--gut) 30px}
.foot-news{max-width:var(--wrap);margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:center;padding:44px 0 36px;border-bottom:1px solid rgba(226,198,126,.18)}
.foot-news h4{font-size:1.5rem;color:var(--cream)}.foot-news p{margin-top:8px}
.foot-news form{display:flex;gap:10px;justify-self:end;width:min(100%,520px)}
.foot-news input{flex:1;min-width:0;padding:12px 18px;border-radius:999px;border:1px solid rgba(226,198,126,.4);background:rgba(251,247,238,.06);color:var(--cream);font:inherit}
.foot-news input::placeholder{color:var(--on-ink2)}
.foot-news input:focus{border-color:var(--gold-l);box-shadow:0 0 0 3px rgba(201,162,75,.22);outline:none}
.foot-news .btn{min-height:48px;padding:6px 26px}
.foot-grid{max-width:var(--wrap);margin:0 auto;display:grid;grid-template-columns:minmax(0,1.6fr) repeat(4,minmax(0,1fr));gap:36px;padding:40px 0 30px}
.foot-grid h4{font-family:var(--sans);font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-l);margin-bottom:14px}
.foot-grid a,.foot-grid span{display:block;padding:4px 0;font-size:.92rem}.foot-grid a:hover{color:var(--cream)}
.footer .footer-logo{width:190px;max-width:70%;height:auto;display:block;border-radius:10px}
.foot-brand p{margin:16px 0 14px;max-width:34ch}
.foot-insta{display:flex;gap:14px;align-items:center;margin-top:18px}
.foot-insta img{width:72px;height:72px;border-radius:var(--r);background:#fff;padding:4px}
.foot-insta b{display:block;color:var(--cream);font-weight:500}.foot-insta a{display:block;color:var(--gold-l)}.foot-insta span{font-size:.8rem;color:var(--on-ink2)}
.foot-bottom{max-width:var(--wrap);margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 24px;padding-top:22px;border-top:1px solid rgba(226,198,126,.18);font-size:.82rem;color:var(--on-ink2)}
.ask{position:fixed;right:18px;bottom:18px;z-index:40;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;background:var(--cream);color:var(--ink);box-shadow:0 14px 34px -14px rgba(26,18,6,.5),inset 0 0 0 1px var(--line);font-weight:500;font-size:.9rem}
/* ---- vue univers */
.uv{padding:0 var(--gut) 90px;max-width:var(--wrap);margin:0 auto}
.uv-tabs{position:sticky;top:var(--hdr);z-index:30;display:flex;gap:6px;overflow-x:auto;padding:12px 0;background:var(--cream);border-bottom:1px solid var(--line);margin-bottom:28px;scrollbar-width:none;-webkit-mask:linear-gradient(90deg,#000 calc(100% - 48px),transparent);mask:linear-gradient(90deg,#000 calc(100% - 48px),transparent)}
.uv-tabs::-webkit-scrollbar{display:none}.uv-tabs.end{-webkit-mask:none;mask:none}
.uv-tabs .puce{flex:none;padding:8px 13px;font-size:.86rem}.uv-tabs small{opacity:.55;font-weight:400;font-size:.8em}
@media (min-width:1024px){.uv-tabs{flex-wrap:wrap;overflow:visible;-webkit-mask:none;mask:none}}
.up-head{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:clamp(24px,4vw,64px);align-items:center;margin-bottom:26px}
.up-head-solo{grid-template-columns:1fr}
.crumb{display:flex;gap:10px;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:22px}.crumb a:hover{color:var(--gold-t)}
.up-head h2{font-size:clamp(2.4rem,5vw,4.4rem)}
.up-txt>p:not(.crumb){color:var(--muted);margin:16px 0 0;max-width:56ch;font-size:1.05rem}
.up-count{font-family:var(--serif);color:var(--gold-t)!important;font-size:1rem!important;margin-top:10px!important}
.up-fig{margin:0;aspect-ratio:3/2;border-radius:var(--r);overflow:hidden;background:var(--sand)}.up-fig img{width:100%;height:100%;object-fit:cover}
.up-bar{position:sticky;top:calc(var(--hdr) + 70px);z-index:20;background:var(--cream);padding:10px 0 12px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:10px}
.up-rayons{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.uf{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}
.uf-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.uf-sort{margin-left:auto;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);display:flex;gap:10px;align-items:center}
.uf-sort select{min-height:44px;padding:9px 14px;border-radius:999px;border:1px solid var(--line2);background:var(--cream);font:inherit;text-transform:none;letter-spacing:0;color:var(--ink)}
.ur{padding:30px 0 8px;scroll-margin-top:200px}
.ur h3{font-size:1.9rem;margin-bottom:22px}.ur h3 small{font:400 .82rem var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-left:12px}
.ur-empty{color:var(--muted)}
.up .cof{margin:clamp(36px,5vw,64px) 0 8px;scroll-margin-top:200px}
/* ---- paliers */
@media (max-width:1180px){.mg-top{padding:12px 8px 14px;font-size:.7rem;letter-spacing:.06em}.mg-top .pill-new{display:none}}
@media (max-width:1020px){.hnav{display:none}.burger{display:inline-flex}.ut-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bento-v{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}.bt-big{grid-column:span 2;grid-row:auto;min-height:360px}.foot-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.foot-brand{grid-column:1/-1}}
@media (max-width:900px){
  .hero,.bij,.enf-grid,.cof,.limited,.noel,.at-row,.up-head,.foot-news{grid-template-columns:1fr}
  .hero{padding-top:28px}.hero-fig{width:100%;max-width:520px}.hero-arch{aspect-ratio:1}.hero h1{font-size:clamp(2.4rem,9vw,3.6rem)}
  .bij-copy{position:static}.ug-3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .enf-big{min-height:0;aspect-ratio:16/11}
  .lim-fig{width:100%;max-width:520px;aspect-ratio:1}
  .steps{grid-template-columns:1fr;border:0}.steps li{border-left:0;padding-left:0;border-top:1px solid var(--line)}
  .at-pics{height:360px}.fan{height:300px}
  .up-fig{display:none}.ut-offrir{grid-template-columns:1fr;gap:12px}.ut-offrir .ic{display:none}
  .foot-news form{justify-self:start}
}
@media (max-width:640px){
  .ribbon{font-size:.64rem;padding:8px 10px}.ribbon span{padding:0 10px}.ribbon span:nth-child(2),.ribbon span:nth-child(3){display:none}
  .header-centered .logo-img{height:64px}.htop{padding:12px 14px 8px;grid-template-columns:auto 1fr auto}.logo{grid-column:2;justify-self:center}
  .ug,.ug-3,.enf .ug-2{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 12px}
  .uc-cta{display:none}.uc .fav{opacity:1;width:44px;height:44px;top:6px;right:6px}
  .fd{text-align:left}.fd-grp{justify-content:flex-start}.fd-grp>span{flex-basis:100%;margin:4px 0 0}
  .mbar-in{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:8px;padding:7px 12px}.mbar-in::-webkit-scrollbar{display:none}.mbar-in>b,.mbar-tabs button,.mbar-more{white-space:nowrap;flex:none;font-size:.74rem}.mbar-more{margin-left:0}
  .rail{grid-auto-columns:70%}
  .cof-pics{display:none}.uf-sort{margin-left:0}
  .ask{right:14px;bottom:14px;width:50px;height:50px;padding:0;justify-content:center}.ask span{display:none}
  .bento-v{grid-template-columns:1fr}.bt-big{grid-column:auto;min-height:300px}
  .up-bar{top:calc(var(--hdr) + 66px)}.foot-grid{grid-template-columns:1fr}.foot-news form{flex-direction:column}.foot-news .btn{justify-content:center}
  .trust{gap:8px 18px;font-size:.66rem}
}
'''

# ---------------------------------------------------------------- JS
JS = r'''
(function(){var d=document,root=d.documentElement,ARROW='__ARROW__';
var cards=d.getElementById('allCards'),header=d.querySelector('.header'),drw=d.getElementById('drw'),burger=d.getElementById('burger');
function hdr(){root.style.setProperty('--hdr',(header?header.offsetHeight:0)+'px')}hdr();addEventListener('resize',hdr);
function setOn(b,on){b.classList.toggle('on',!!on);if(b.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',on?'true':'false')}
function setOff(b,off){b.classList.toggle('off',!!off);b.disabled=!!off}
/* apparition au défilement (IntersectionObserver, jamais d'écouteur scroll) */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08}):null;
function watch(scope){(scope||d).querySelectorAll('.rv:not(.in)').forEach(function(el){if(io)io.observe(el);else el.classList.add('in')})}
watch();
function show(view){d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.view===view)});
  d.getElementById('contenu').hidden=view!=='accueil';d.getElementById('vueUnivers').hidden=view!=='univers';tend();setTimeout(function(){watch()},50)}
var tabs=d.querySelector('.uv-tabs');
function tend(){tabs.classList.toggle('end',tabs.scrollLeft+tabs.clientWidth>=tabs.scrollWidth-2)}
tabs.addEventListener('scroll',tend,{passive:true});addEventListener('resize',tend);tend();
function openU(id,anchor){show('univers');d.querySelectorAll('.up').forEach(function(a){a.hidden=a.dataset.u!==id});
  var on=null;d.querySelectorAll('.uv-tabs button').forEach(function(b){var o=b.dataset.go===id;b.classList.toggle('on',o);b.setAttribute('aria-current',o?'page':'false');if(o)on=b});
  d.querySelectorAll('.mg-top').forEach(function(t){t.classList.toggle('cur',t.dataset.go===id)});
  if(id==='offrir'){var s=d.getElementById('offrirSlot');
    if(!s.firstChild){var c=d.getElementById('trouver').cloneNode(true);var h=c.querySelector('h2');if(h)h.remove();
      c.querySelectorAll('[id]').forEach(function(x){x.removeAttribute('id')});c.classList.add('fd-page','in');s.appendChild(c);wireFinder(c)}
    var st={};d.querySelectorAll('#trouver button.on').forEach(function(b){st[b.dataset.k]=b.dataset.v});
    var fd=s.querySelector('.fd');fd.querySelectorAll('button[data-k]').forEach(function(b){setOn(b,st[b.dataset.k]===b.dataset.v)});fd._run()}
  d.querySelectorAll('#vueUnivers .up:not([hidden]) .rv').forEach(function(el){el.classList.add('in')});
  var t2=anchor?d.querySelector(anchor):null;if(t2)t2.scrollIntoView({block:'start'});else scrollTo(0,0);
  if(on)on.scrollIntoView({inline:'center',block:'nearest'});tend()}
/* tiroir : vrai dialogue */
function openDrw(){drw.hidden=false;burger.setAttribute('aria-expanded','true');d.body.style.overflow='hidden';drw.querySelector('.drw-x').focus()}
function closeDrw(){if(drw.hidden)return;drw.hidden=true;burger.setAttribute('aria-expanded','false');d.body.style.overflow='';drw.querySelectorAll('details[open]').forEach(function(x){x.open=false});burger.focus()}
burger.addEventListener('click',openDrw);
drw.addEventListener('click',function(e){if(e.target===drw||e.target.closest('.drw-x'))closeDrw()});
drw.querySelectorAll('details').forEach(function(x){x.addEventListener('toggle',function(){if(x.open)drw.querySelectorAll('details[open]').forEach(function(y){if(y!==x)y.open=false})})});
/* panneaux du menu : clavier, Échap, fermeture après un clic */
function closeMg(mg){(mg?[mg]:[].slice.call(d.querySelectorAll('.mg.open'))).forEach(function(m){m.classList.remove('open');m.querySelector('.mg-top').setAttribute('aria-expanded','false')})}
function openMg(mg){closeMg();mg.classList.add('open');mg.querySelector('.mg-top').setAttribute('aria-expanded','true')}
d.querySelectorAll('.mg').forEach(function(mg){var top=mg.querySelector('.mg-top');
  top.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||(e.key==='Enter'&&!mg.classList.contains('open'))){e.preventDefault();openMg(mg)}});
  mg.addEventListener('focusout',function(e){if(!mg.contains(e.relatedTarget))closeMg(mg)});
  mg.addEventListener('click',function(e){if(e.target.closest('.mg-panel a'))mg.classList.add('closed')});mg.addEventListener('mouseleave',function(){mg.classList.remove('closed')})});
d.addEventListener('keydown',function(e){if(e.key!=='Escape')return;closeDrw();closeMg();if(d.activeElement&&d.activeElement.blur)d.activeElement.blur()});
/* délégation des clics */
d.addEventListener('click',function(e){
  var f=e.target.closest('.fav');if(f){e.preventDefault();f.classList.toggle('on');return}
  var l=e.target.closest('.uc-link');if(l){e.preventDefault();return}
  var v=e.target.closest('[data-view]');if(v&&!v.closest('.mbar')){e.preventDefault();show(v.dataset.view);closeDrw();d.querySelectorAll('.mg-top').forEach(function(t){t.classList.remove('cur')});scrollTo(0,0);return}
  var a=e.target.closest('[data-go]');if(a&&!a.closest('.mbar')){e.preventDefault();var h=a.getAttribute('href');closeDrw();closeMg();openU(a.dataset.go,h&&h.length>1?h:null);return}
  var g=e.target.closest('[data-find]');if(g){e.preventDefault();closeDrw();closeMg();openU('offrir');var fd=d.querySelector('#offrirSlot .fd'),pairs={};
    g.dataset.find.split(';').forEach(function(kv){var p=kv.split(':');if(p[0])pairs[p[0]]=p[1]});
    fd.querySelectorAll('button[data-k]').forEach(function(b){setOn(b,pairs[b.dataset.k]===b.dataset.v)});fd._run();return}
  var x=e.target.closest('a[href="#"]');if(x)e.preventDefault()});
d.querySelectorAll('.mbar-tabs button').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.view==='univers'&&!d.querySelector('.up:not([hidden])'))openU('boutique');else show(b.dataset.view);scrollTo(0,0)})});
d.getElementById('mbarMore').addEventListener('click',function(){var n=d.getElementById('mbarNotes');n.hidden=!n.hidden;this.setAttribute('aria-expanded',!n.hidden)});
/* rail des nouveautés */
d.querySelectorAll('.rbtn').forEach(function(b){b.addEventListener('click',function(){var r=d.getElementById(b.dataset.rail);r.scrollBy({left:(r.clientWidth*.8)*(+b.dataset.dir),behavior:'smooth'})})});
/* le mur : s'arrête sous le doigt, repart seul après 4 s sans geste */
d.querySelectorAll('.mq').forEach(function(mq){var t;function hold(el){mq.classList.add('hold');mq.querySelectorAll('.wt.cur').forEach(function(w){w.classList.remove('cur')});if(el)el.classList.add('cur');clearTimeout(t);t=setTimeout(function(){mq.classList.remove('hold')},4000)}
  mq.addEventListener('touchstart',function(e){var w=e.target.closest('.wt');hold(w)},{passive:true});
  mq.addEventListener('click',function(e){var w=e.target.closest('.wt');if(w&&!w.classList.contains('cur')&&matchMedia('(hover:none)').matches){e.preventDefault();e.stopPropagation();hold(w)}},true)});
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
/* fêtes à venir, calculées sur la date du jour : seulement leur nom */
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
  var chips=up.querySelectorAll('.up-rayons a');if(chips.length&&'IntersectionObserver' in window){var io2=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;
    chips.forEach(function(c){c.setAttribute('aria-current',c.getAttribute('href')==='#'+en.target.id?'true':'false')})})},{rootMargin:'-35% 0px -55% 0px'});up.querySelectorAll('.ur,.cof').forEach(function(r){io2.observe(r)})}
  if(pool.length)grey(up,'data-f',pool)});
/* coffret : total, remise, prénom en direct */
d.querySelectorAll('.cof').forEach(function(cf){var tot=cf.querySelector('.cof-tot'),inp=cf.querySelector('.cof-name input'),nom=cf.querySelector('.cof-nom');
  function calc(){var t=0,n=0;cf.querySelectorAll('.cof-pick input').forEach(function(i){if(i.checked){t+=parseFloat(i.dataset.p);n++}});
    var r=n>=2?.9:1,f=function(v){return v.toFixed(2).replace('.',',')+' €'};
    tot.querySelector('s').textContent=n>=2?f(t):'';tot.querySelector('b').textContent=f(t*r);tot.querySelector('span').textContent=n>=2?'moins 10 % dès 2 pièces':'Ajoutez une 2ᵉ pièce : moins 10 %'}
  cf.querySelectorAll('.cof-pick input').forEach(function(i){i.addEventListener('change',calc)});
  inp.addEventListener('input',function(){nom.textContent=this.value.trim()||'Léa';nom.classList.add('live')});
  inp.addEventListener('focus',function(){nom.classList.add('live')});inp.addEventListener('blur',function(){nom.classList.remove('live')});calc()});
})();
'''.replace("__ARROW__", ic("arrow"))

# ---------------------------------------------------------------- sortie
TITLE = "Accueil et univers (avec puzzles)" if PUZ else "Accueil et univers"
NOM = "accueil-univers-avec-puzzles" if PUZ else "accueil-univers"
HEAD_LINKS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
              '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap">')
T_CSS = "\n".join(f".{c}{{background-image:url({img(f, 440, 68)})}}" for f, c in TCLS.items())
STYLE = f"<style>{CSS}\n{T_CSS}</style>"
BODY = NOTES + DRAWER + HEADER + ACCUEIL + UNIV_VIEW + FOOTER + f'<div id="allCards" hidden>{ALL_CARDS}</div>'
full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>{HEAD_LINKS}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>'
frag = f'<title>{TITLE}</title>{HEAD_LINKS}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, NOM + ".html"), "w").write(full)
open(os.path.join(OUT, NOM + ".fragment.html"), "w").write(frag)
print("ok", NOM, len(full) // 1024, "Ko ·", len(P), "produits ·", " · ".join(f'{u["nom"]} {compte(u)}' for u in UNIVERS))
