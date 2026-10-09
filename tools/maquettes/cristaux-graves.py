#!/usr/bin/env python3
"""Maquette « Cristaux déjà gravés » (07/10/2026).

Le client choisit un modèle DÉJÀ GRAVÉ (16 photos fournies par le gérant), puis le format,
la taille et le socle ; en dessous, la section sur-mesure (« votre propre image ») reprise
de docs/maquettes/cristal-surmesure-section.html et améliorée.

Ressemble au site : on part du VRAI rendu de /cristaux (`next start`, capture HTML),
on garde son en-tête et son pied de page tels quels (logo à son adresse source, jamais
copié), on intègre ses 2 feuilles de style et ses polices, et on remplace seulement <main>.
Les blocs de la fiche (tailles cristal, total, quantité, bouton) reprennent les classes du site.

Usage : python3 tools/maquettes/cristaux-graves.py <capture /cristaux.html>
Habillage « Mélange » depuis le 09/10/2026 soir (gérant : « adapte par rapport au nouveau site ») : écrin encre et or en
ouverture et pour le sur mesure, pavés sable pour les filtres, cartes claires arrondies à 20 px avec l'étiquette et le
nom SOUS la photo, panneau arrondi à 28 px, plus de ligne en capitales au-dessus des titres. Contenu inchangé.
Sortie : docs/maquettes/cristaux-graves.html (+ .fragment.html pour l'artifact).
Rien n'est touché dans le site.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
ASSETS = os.path.join(OUT, "assets", "cristaux-graves")
PUB = os.path.join(ROOT, "public")
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "cristaux-src.html")


def uri(path, w=700, q=74):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "svg": "image/svg+xml",
            "woff2": "font/woff2"}.get(ext, "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


# ---------------------------------------------------------------- les 16 modèles
# (fichier, nom, famille, format photographié, petite phrase)
MODELES = [
    ("ourson", "Ourson à la rose", "amour", "v", "Un ourson qui offre sa rose, avec « I Love You » gravé dessous."),
    ("rose", "Rose éternelle", "amour", "v", "Une rose qui ne fanera jamais."),
    ("coeur", "Cœur dans le cœur", "amour", "c", "Deux cœurs l'un dans l'autre, en relief."),
    ("fillette-ballon", "Fillette au ballon cœur", "amour", "v", "Une petite fille qui tend la main vers son ballon."),
    ("colibri", "Colibri et sa fleur", "animaux", "h", "Le colibri en plein vol, butinant sa fleur."),
    ("perroquets", "Envol de perroquets", "animaux", "h", "Trois perroquets en vol, plume par plume."),
    ("cheval", "Cheval de feu", "animaux", "v", "Un cheval cabré, la crinière en flammes."),
    ("ours-mandala", "Ours mandala", "animaux", "c", "Une tête d'ours ciselée de motifs mandala."),
    ("panda", "Panda et bambou", "animaux", "c", "Un panda assis, son bambou dans les pattes."),
    ("chat-sapin", "Chaton au pied du sapin", "noel", "c", "Un chaton qui joue avec une boule de Noël."),
    ("sapin", "Sapin étoilé", "noel", "h", "Un sapin de Noël coiffé de son étoile."),
    ("bouddha", "Bouddha au lotus", "zen", "v", "Un visage apaisé posé sur une fleur de lotus."),
    ("ange", "Ange aux ailes déployées", "zen", "c", "Un ange gardien, ailes grandes ouvertes."),
    ("genie", "Génie de la lampe", "legendes", "v", "Le génie qui sort de sa lampe."),
    ("lys-dragon", "Dragon et lys", "legendes", "c", "Un petit dragon lové au pied d'un lys."),
    ("tour-eiffel", "Tour Eiffel", "voyage", "v", "La Dame de fer, dans tous ses détails."),
]
# Dessins à graver (15 images fournies par le gérant le 07/10) : le CLIENT choisit s'il en veut un,
# rien n'est sélectionné d'avance. Préparés par le script (fond clair retiré, trait passé en blanc,
# bandeau Pinterest et filigranes effacés, WebP blanc sur fond transparent) → docs/maquettes/assets/cristaux-graves/dessins/.
DESSINS = [
    ("maries-couronne", "Mariés en couronne fleurie", "amour"),
    ("maries-coeur", "Mariés dans un cœur", "amour"),
    ("maries-bouquet", "Mariés au bouquet", "amour"),
    ("couple-roses", "Couple et roses", "amour"),
    ("ange-ciel", "Ange vers la lumière", "zen"),
    ("bouddha-lotus", "Bouddha sur le lotus", "zen"),
    ("bouddha-mandala", "Bouddha au mandala", "zen"),
    ("fee-rose", "Fée sur la rose", "legendes"),
    ("fee-lune", "Fée de lune", "legendes"),
    ("fee-silhouette", "Fée aux ailes ciselées", "legendes"),
    ("archere", "L'archère", "legendes"),
    ("colibri-rose", "Colibri à la rose", "animaux"),
    ("colibri-couleur", "Colibri à la rose (version pleine)", "animaux"),
    ("cheval-tete", "Cheval à la crinière", "animaux"),
    ("cle-de-sol", "Clé de sol et papillon", "musique"),
]
FAMILLES = [("tous", "Tous les modèles"), ("amour", "Amour"), ("animaux", "Animaux"), ("noel", "Noël"),
            ("zen", "Zen & spirituel"), ("legendes", "Légendes"), ("voyage", "Voyage")]
FMT_LABEL = {"v": "Vertical", "h": "Horizontal", "c": "Cube"}
FAM_LABEL = dict(FAMILLES)
# Les 12 signes (demande du gérant, 09/10 soir). Constellations tracées d'après les étoiles principales
# (schématiques, un dessin d'étoiles n'est pas protégé) ; figures = les 3 images du gérant (Lion, Sagittaire,
# Gémeaux, découpées en blanc sur transparent) ; les 9 autres n'ont pas encore de figure.
ZODIAQUE = [
    ("belier", "Bélier", "21 mars – 19 avril", [(14,58),(40,44),(64,40),(80,50)], [(0,1),(1,2),(2,3)]),
    ("taureau", "Taureau", "20 avril – 20 mai", [(64,64),(53,57),(45,51),(30,40),(14,30),(47,64),(40,74),(26,86)], [(0,1),(1,2),(2,3),(3,4),(1,5),(5,6),(6,7)]),
    ("gemeaux", "Gémeaux", "21 mai – 20 juin", [(30,16),(34,38),(28,60),(36,86),(62,20),(66,42),(60,64),(68,88),(50,30)], [(0,1),(1,2),(2,3),(4,5),(5,6),(6,7),(0,8),(8,4),(1,5)]),
    ("cancer", "Cancer", "21 juin – 22 juillet", [(50,46),(34,20),(68,24),(52,68),(42,88),(64,86)], [(0,1),(0,2),(0,3),(3,4),(3,5)]),
    ("lion", "Lion", "23 juillet – 22 août", [(30,72),(27,55),(34,40),(46,30),(58,34),(54,46),(72,52),(85,62),(62,70)], [(0,1),(1,2),(2,3),(3,4),(4,5),(5,0),(5,6),(6,7),(7,8),(8,0)]),
    ("vierge", "Vierge", "23 août – 22 septembre", [(60,88),(52,66),(40,52),(28,40),(16,30),(48,38),(56,26),(68,18),(72,60),(86,54)], [(0,1),(1,2),(2,3),(3,4),(2,5),(5,6),(6,7),(1,8),(8,9)]),
    ("balance", "Balance", "23 septembre – 22 octobre", [(50,20),(30,46),(64,48),(34,80),(66,82)], [(0,1),(0,2),(1,2),(1,3),(2,4)]),
    ("scorpion", "Scorpion", "23 octobre – 21 novembre", [(72,14),(62,20),(56,30),(50,40),(42,52),(36,64),(34,78),(42,88),(54,92),(66,88),(74,80)], [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(9,10)]),
    ("sagittaire", "Sagittaire", "22 novembre – 21 décembre", [(22,36),(32,30),(44,30),(54,38),(60,52),(50,62),(36,62),(28,52),(38,20),(30,10)], [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,0),(1,8),(8,9),(2,4)]),
    ("capricorne", "Capricorne", "22 décembre – 19 janvier", [(20,30),(38,38),(58,46),(80,34),(72,60),(56,76),(38,70)], [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,0)]),
    ("verseau", "Verseau", "20 janvier – 18 février", [(20,30),(32,38),(44,30),(56,38),(50,18),(50,56),(60,70),(48,84),(16,50)], [(0,1),(1,2),(2,3),(2,4),(3,5),(5,6),(6,7),(0,8)]),
    ("poissons", "Poissons", "19 février – 20 mars", [(70,80),(56,66),(44,52),(34,40),(24,28),(18,16),(78,62),(82,46),(84,30),(90,24),(86,16),(78,18),(76,26)], [(0,1),(1,2),(2,3),(3,4),(4,5),(0,6),(6,7),(7,8),(8,9),(9,10),(10,11),(11,12),(12,8)]),
]
ZFIG = {k: raw_uri(os.path.join(ASSETS, "zodiaque", f"fig-{k}.webp")) for k in ("lion", "sagittaire", "gemeaux")}

def constellation(pts, segs):
    import random
    rnd = random.Random(len(pts) * 7 + len(segs))
    dots = "".join(f'<circle cx="{rnd.uniform(6,94):.1f}" cy="{rnd.uniform(6,94):.1f}" r="{rnd.uniform(.5,1.1):.1f}" opacity=".55"/>' for _ in range(22))
    lines = "".join(f'<line x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[b][0]}" y2="{pts[b][1]}"/>' for a, b in segs)
    stars = "".join(f'<circle cx="{x}" cy="{y}" r="2.6"/>' for x, y in pts)
    return (f'<svg class="cg-const" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff">{dots}</g>'
            f'<g stroke="#fff" stroke-width="1.6" stroke-linecap="round">{lines}</g><g fill="#fff">{stars}</g></svg>')


# Tailles = celles des blocs du site (products.js : cristal-photo-3d-vertical / -horizontal).
TAILLES = [
    ("petit", "Petit", "5×5×8 cm", "8×5×5 cm", 39.90, 14.90),
    ("moyen", "Moyen", "5×6×10 cm", "10×6×5 cm", 59.90, 19.90),
    ("grand", "Grand", "6×8×12 cm", "12×8×6 cm", 99.90, 19.90),
    ("xl", "XL", "6×10×15 cm", "15×10×6 cm", 149.90, 19.90),
]


def euro(n):
    return f"{n:.2f}".replace(".", ",") + " €"


# ---------------------------------------------------------------- capture du site
src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
head_end = src.find("</head>")
body_start = src.find("<body")
body_start = src.find(">", body_start) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER = src[body_start:i_main]
FOOTER = src[j_main:src.rfind("</body>")]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

# Feuilles de style du site, intégrées ; seules les polices latines (unicode-range u+00??) sont intégrées.
css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        if garder:
            return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})"
        return "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)

root_vars = ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css))
css += ":root{" + root_vars + "}\n"

# Images locales de l'en-tête / du pied de page (QR Instagram…) ; le logo garde son adresse source.
def local_src(m):
    p = os.path.join(PUB, m.group(2).lstrip("/"))
    return f'{m.group(1)}="{raw_uri(p)}"' if os.path.exists(p) else m.group(0)
HEADER = re.sub(r'(src)="(/[^"]+)"', local_src, HEADER)
FOOTER = re.sub(r'(src)="(/[^"]+)"', local_src, FOOTER)
for pat in (r'<button[^>]*>💬 Une question \?</button>', r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
    HEADER = re.sub(pat, "", HEADER); FOOTER = re.sub(pat, "", FOOTER)
# Liens morts dans une maquette.
HEADER = re.sub(r'href="/[^"]*"', 'href="#"', HEADER)
FOOTER = re.sub(r'href="/[^"]*"', 'href="#"', FOOTER)

# ---------------------------------------------------------------- images
DIMG = {k: raw_uri(os.path.join(ASSETS, "dessins", f"{k}.webp")) for k, *_ in DESSINS}  # blanc + transparence
IMG = {k: uri(os.path.join(ASSETS, f"{k}.jpg"), 640, 76) for k, *_ in MODELES}
SM = {k: uri(os.path.join(ASSETS, f"sm-{k}.jpg"), 520, 74) for k in ("sirene", "animal", "portrait", "objet")}
SOCLE = uri(os.path.join(PUB, "produits", "socle-led-rectangle.jpg"), 300, 74)
FMT_V = uri(os.path.join(PUB, "produits", "cristal-bloc-v-creme.jpg"), 260, 74)
FMT_H = uri(os.path.join(PUB, "produits", "cristal-bloc-h-creme.jpg"), 260, 74)

ICON = {
    "down": '<path d="m6 9 6 6 6-6"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "photo": '<rect x="3" y="6" width="18" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.6"/><path d="M8.5 6 10 3.8h4L15.5 6"/>',
    "paw": '<circle cx="7" cy="10" r="1.7"/><circle cx="17" cy="10" r="1.7"/><circle cx="9.6" cy="6" r="1.6"/><circle cx="14.4" cy="6" r="1.6"/><path d="M12 12.2c-2.8 0-5 3-5 5.1 0 1.6 1.4 2.2 2.6 2 1-.2 1.6-.6 2.4-.6s1.4.4 2.4.6c1.2.2 2.6-.4 2.6-2 0-2.1-2.2-5.1-5-5.1z"/>',
    "pen": '<path d="M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20z"/><path d="m14.5 6.5 3 3"/>',
    "logo": '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 20 7.5M12 12v9M12 12 4 7.5"/>',
    "gem": '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6 3-6M12 9v12"/>',
    "pin": '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "truck": '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    "light": '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "send": '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
}


def ic(n, cls="cg-ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>')


# ---------------------------------------------------------------- contenu
def tuile(idx, m):
    k, nom, fam, fmt, phrase = m
    return f'''<button type="button" class="cg-tile" data-i="{idx}" data-grp="modeles" data-fam="{fam}" aria-pressed="false">
      <span class="cg-img"><img src="{IMG[k]}" alt="Cristal gravé : {nom}" loading="lazy"><span class="cg-ok" aria-hidden="true">{ic("check")}</span></span>
      <span class="cg-meta"><span class="cg-tag">{FAM_LABEL.get(fam, "Modèle gravé")}</span><b class="cg-nom">{nom}</b><span class="cg-price">dès 39,90 €</span><span class="cg-ph">{phrase}</span></span>
    </button>'''


TILES = "\n".join(tuile(i, m) for i, m in enumerate(MODELES)) + f'''
<a class="cg-own" href="#sur-mesure" data-grp="modeles" data-fam="tous">
  <span class="cg-own-ic">{ic("photo")}</span>
  <span><b>Votre propre image ?</b>Une photo, votre animal, un dessin, un logo : on la grave en 3D, rien que pour vous.</span>
  <em>Voir le sur-mesure {ic("arrow")}</em>
</a>'''
def tuile_dessin(idx, d):
    k, nom, fam = d
    return f'''<button type="button" class="cg-tile cg-dtile" data-i="{idx}" data-grp="dessins" data-fam="{fam}" aria-pressed="false">
      <span class="cg-img cg-xtal"><span class="cg-bloc"><img src="{DIMG[k]}" alt="Dessin à graver : {nom}" loading="lazy"></span><span class="cg-ok" aria-hidden="true">{ic("check")}</span></span>
      <span class="cg-meta"><span class="cg-tag">Dessin gravé en 3D</span><b class="cg-nom">{nom}</b><span class="cg-price">dès 39,90 €</span></span>
    </button>'''


DTILES = "\n".join(tuile_dessin(len(MODELES) + i, d) for i, d in enumerate(DESSINS))
def tuile_zodiaque(idx, z):
    k, nom, dates, pts, segs = z
    fig = f'<img class="cg-zfig" src="{ZFIG[k]}" alt="">' if k in ZFIG else ""
    return f'''<button type="button" class="cg-tile cg-dtile cg-ztile" data-i="{idx}" data-grp="zodiaque" aria-pressed="false">
      <span class="cg-img cg-xtal"><span class="cg-bloc cg-zbloc">{fig}{constellation(pts, segs)}<span class="cg-zname">{nom}</span><span class="cg-zperso cg-zex" aria-hidden="true"><b class="fnt-great-vibes">Luna Vance</b><small>24 nov. 2022 · 19:27</small><small>Paris</small></span></span><span class="cg-ok" aria-hidden="true">{ic("check")}</span></span>
      <span class="cg-meta"><span class="cg-tag">Signe du zodiaque</span><b class="cg-nom">{nom}</b><span class="cg-price">dès 39,90 €</span><span class="cg-ph">{dates}</span></span>
    </button>'''


ZTILES = "\n".join(tuile_zodiaque(len(MODELES) + len(DESSINS) + i, z) for i, z in enumerate(ZODIAQUE))
GROUPES = "".join(
    f'<button type="button" class="cg-grp{" on" if g == "modeles" else ""}" data-grp="{g}" aria-pressed="{"true" if g == "modeles" else "false"}">{lab}<span class="cg-n">{n}</span></button>'
    for g, lab, n in (("modeles", "Modèles gravés", len(MODELES)), ("dessins", "Dessins", len(DESSINS)), ("zodiaque", "Zodiaque", len(ZODIAQUE))))

CHIPS = "".join(
    f'<button type="button" class="cg-chip{" on" if k == "tous" else ""}" data-fam="{k}" aria-pressed="{"true" if k == "tous" else "false"}">{lab}'
    f'<span class="cg-n">{len(MODELES) if k == "tous" else sum(1 for m in MODELES if m[2] == k)}</span></button>'
    for k, lab in FAMILLES)

SIZES = "".join(
    f'''<button type="button" class="variant-swatch{" active" if t[0] == "moyen" else ""}" data-taille="{t[0]}" aria-pressed="{"true" if t[0] == "moyen" else "false"}">
        <span class="vs-title">{t[1]}</span><span class="vs-sub" data-v="{t[2]}" data-h="{t[3]}">{t[2]}</span>
        <span class="vs-price"><span class="vs-now">{euro(t[4])}</span></span></button>'''
    for t in TAILLES)

FONTS = [("playfair", "Playfair"), ("cinzel", "Cinzel"), ("cinzel-deco", "Cinzel Deco"), ("montserrat", "Montserrat"),
         ("inter", "Inter"), ("great-vibes", "Great Vibes"), ("allura", "Allura"), ("pacifico", "Pacifico")]
TEXTE_PRIX = 5.00  # comme les cristaux photo : { key: "texte", amount: 5 }
POLICES = "".join(f'<button type="button" class="cg-font fnt-{k}{" on" if k == "playfair" else ""}" data-font="{k}" aria-pressed="{"true" if k == "playfair" else "false"}">{lab}</button>' for k, lab in FONTS)
PLACES = "".join(f'<button type="button" class="cg-chip{" on" if k == "bas" else ""}" data-pos="{k}" aria-pressed="{"true" if k == "bas" else "false"}">{lab}</button>' for k, lab in (("bas", "En bas"), ("haut", "En haut"), ("gauche", "À gauche"), ("droite", "À droite")))

MAIN = f'''<main class="cg">
<section class="cg-intro cg-ecrin">
  <div class="container">
    <h1>Des cristaux déjà gravés, <em>prêts à offrir</em></h1>
    <p class="cg-lede">Choisissez un modèle parmi nos créations : il est gravé en 3D au cœur d'un cristal optique K9,
      dans notre atelier en France. Vous choisissez simplement la taille, et le socle lumineux si vous le souhaitez.</p>
    <ul class="cg-trust">
      <li>{ic("gem")}<span><b>Cristal optique K9</b>pureté et éclat</span></li>
      <li>{ic("pin")}<span><b>Gravé en France</b>dans notre atelier</span></li>
      <li>{ic("truck")}<span><b>Livraison suivie</b>colis &amp; point relais</span></li>
    </ul>
  </div>
</section>

<section class="cg-shop" id="modeles" aria-labelledby="t-mod">
  <div class="container cg-layout">
    <div class="cg-col">
      <div class="cg-head">
        <h2 id="t-mod">Choisissez votre gravure</h2>
        <p>Un modèle déjà gravé, un dessin, ou votre signe du zodiaque. Touchez-le pour le voir en grand et choisir sa taille.</p>
      </div>
      <div class="cg-grps" role="tablist" aria-label="Type de gravure">{GROUPES}</div>
      <div class="cg-chips" role="group" aria-label="Filtrer les modèles" id="familles">{CHIPS}</div>
      <p class="cg-gintro" id="gintro" hidden></p>
      <div class="cg-grid" id="grille">{TILES}
{DTILES}
{ZTILES}</div>
      <button type="button" class="cg-more" id="plusbtn" hidden>Afficher les <span id="plusn"></span> autres {ic("down")}</button>

    </div>

    <aside class="cg-panel" id="panneau" aria-labelledby="t-pan" aria-live="polite">
      <div class="cg-stage" id="stage">
        <div class="cg-empty" id="vide">{ic("gem","cg-ic cg-ic-xl")}<p><b>Votre cristal apparaîtra ici</b>Choisissez un modèle dans la galerie.</p></div>
        <img id="grand" alt="" hidden><span class="cg-bloc cg-bloc-xl" id="bloc" hidden><span class="cg-bloc-in" id="blocin"><img id="dimg" alt=""></span><span class="cg-zperso" id="zperso" hidden><b id="zpn" class="fnt-great-vibes"></b><small id="zpd"></small><small id="zpv"></small></span></span><span class="cg-txtpv fnt-playfair pos-bas" id="txtpv" hidden></span>
      </div>
      <h3 id="t-pan" class="cg-pname">Votre cristal</h3>
      <p class="cg-pdesc" id="pdesc">Aucun modèle choisi pour l'instant.</p>

      <div class="field">
        <label>Format du cristal</label>
        <div class="variant-swatches cg-fmts">
          <button type="button" class="variant-swatch has-img" data-fmt="v" aria-pressed="false"><img src="{FMT_V}" alt=""><span class="vs-title">Vertical</span></button>
          <button type="button" class="variant-swatch has-img" data-fmt="h" aria-pressed="false"><img src="{FMT_H}" alt=""><span class="vs-title">Horizontal</span></button>
        </div>
        <p class="cg-hint" id="fmthint">Vertical ou horizontal : c'est vous qui choisissez, chaque modèle se grave dans les deux formats.</p>
      </div>

      <div class="field">
        <label>Choisissez la taille</label>
        <div class="variant-swatches crystal-sizes" id="tailles">{SIZES}</div>
      </div>

      <div class="field">
        <label>Texte gravé en plus (en option)</label>
        <button type="button" class="cg-socle" id="txton" aria-pressed="false" aria-controls="txtzone">
          <span class="cg-txt-ic">{ic("pen")}</span>
          <span><b id="txtlab">Ajouter un texte</b><small id="txtsub">Un prénom, une date, un petit mot, gravé avec le modèle</small></span>
          <span class="cg-socle-p">+5,00 €</span>
          <span class="cg-box" aria-hidden="true">{ic("check")}</span>
        </button>
        <div class="cg-txt" id="txtzone" hidden>
          <div id="txtlibre">
          <label class="cg-sub" for="txt">Votre texte</label>
          <div class="cg-inp"><input id="txt" type="text" maxlength="40" placeholder="Prénom, date, petit mot…" autocomplete="off"><span id="txtn">0/40</span></div>
          </div>
          <div id="txtzod" hidden>
          <label class="cg-sub" for="zp">Prénom ou nom</label>
          <div class="cg-inp"><input id="zp" type="text" maxlength="24" placeholder="Luna Vance" autocomplete="off"></div>
          <div class="cg-2col">
            <div><label class="cg-sub" for="zd">Date de naissance</label><div class="cg-inp"><input id="zd" type="text" maxlength="16" placeholder="24 nov. 2022" autocomplete="off"></div></div>
            <div><label class="cg-sub" for="zh">Heure</label><div class="cg-inp"><input id="zh" type="text" maxlength="5" placeholder="19:27" autocomplete="off"></div></div>
          </div>
          <label class="cg-sub" for="zv">Ville</label>
          <div class="cg-inp"><input id="zv" type="text" maxlength="24" placeholder="Paris" autocomplete="off"></div>
          </div>
          <span class="cg-sub">Écriture</span>
          <div class="cg-fonts" role="group" aria-label="Écriture du texte">{POLICES}</div>
          <span class="cg-sub">Où placer le texte ?</span>
          <div class="cg-pos" role="group" aria-label="Place du texte">{PLACES}</div>
        </div>
      </div>

      <div class="field">
        <label>Socle lumineux LED (en option)</label>
        <button type="button" class="cg-socle" id="socle" aria-pressed="false">
          <img src="{SOCLE}" alt="">
          <span><b>Ajouter le socle lumineux</b><small>LED multicolores, couleurs au toucher, sur prise secteur</small></span>
          <span class="cg-socle-p" id="soclep">+19,90 €</span>
          <span class="cg-box" aria-hidden="true">{ic("check")}</span>
        </button>
      </div>

      <div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total">—</span></div>
      <div class="qty-row">
        <div class="qty-stepper"><button type="button" id="moins" aria-label="Moins">−</button><span id="qte">1</span><button type="button" id="plus" aria-label="Plus">+</button></div>
        <button type="button" class="btn btn-gold prc-off" id="ajout" style="flex:1" disabled>Ajouter au panier</button>
      </div>
      <p class="prc-addhint" id="manque">Choisissez d'abord un modèle dans la galerie.</p>
      <div class="pd-perso"><b>✦ Gravé à la commande</b><p>Chaque cristal est gravé pour vous dans notre atelier, puis emballé avec soin.</p></div>
    </aside>
  </div>
</section>

<div class="cg-bar" id="barre" hidden>
  <img id="barimg" alt="">
  <span class="cg-bar-t"><b id="barnom"></b><small id="barprix"></small></span>
  <a class="btn btn-gold" href="#panneau">Choisir la taille</a>
</div>

<section class="cg-sur" id="sur-mesure" aria-labelledby="t-sur">
  <div class="container">
    <div class="cg-sur-top">
      <div>
        <h2 id="t-sur">Gravez <em>ce que vous voulez</em> dans le cristal</h2>
        <p class="cg-lede">Une photo, votre animal, un dessin, un logo, un objet qui compte… Envoyez l'image de votre choix :
          on la sculpte en 3D au cœur du cristal, pour une pièce unique.</p>
        <ul class="cg-tags">
          <li>{ic("photo")}Photo</li><li>{ic("paw")}Animal</li><li>{ic("pen")}Dessin</li><li>{ic("logo")}Logo</li><li>{ic("spark")}Objet</li>
        </ul>
      </div>
      <div class="cg-mosaic" aria-hidden="true">
        <img src="{SM["sirene"]}" alt=""><img src="{SM["animal"]}" alt=""><img src="{SM["portrait"]}" alt=""><img src="{SM["objet"]}" alt="">
      </div>
    </div>

    <ol class="cg-steps">
      <li><span class="cg-sn">1</span><div><h3>Choisissez votre cristal</h3><p>Format vertical ou horizontal, et la taille selon le nombre de personnes ou de détails.</p></div></li>
      <li><span class="cg-sn">2</span><div><h3>Envoyez votre image</h3><p>Une photo nette et bien éclairée. On s'occupe de la transformer en 3D.</p></div></li>
      <li><span class="cg-sn">3</span><div><h3>On la grave en 3D</h3><p>Gravure laser au cœur du cristal, dans notre atelier en France. Un cadeau unique.</p></div></li>
    </ol>

    <div class="cg-fcards">
      <a class="cg-fcard" href="#"><img src="{FMT_V}" alt=""><span><b>Cristal vertical</b><small>Format portrait — idéal pour un visage, un couple.</small><em>Choisir ma taille &amp; envoyer mon image {ic("arrow")}</em></span></a>
      <a class="cg-fcard" href="#"><img src="{FMT_H}" alt=""><span><b>Cristal horizontal</b><small>Format paysage — idéal pour un groupe, un animal, une photo large.</small><em>Choisir ma taille &amp; envoyer mon image {ic("arrow")}</em></span></a>
    </div>
    <p class="cg-note">{ic("light")}<span><b>Une image spéciale ?</b> (objet, logo, dessin…) Envoyez-la nous quand même : si besoin, on vous conseille avant la gravure. Chaque cristal est gravé dans notre atelier en France.</span></p>
  </div>
</section>
</main>'''

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.cg{--cg-gold-t:#836619;--cg-shadow:0 10px 26px rgba(43,38,32,.12);--cg-ring:0 0 0 1px rgba(194,161,78,.28);background:var(--cream)}
.cg .container{max-width:1180px}
.cg-ic{width:20px;height:20px;flex:none}
.cg-ic-xl{width:40px;height:40px}
.cg-k{font-size:.72rem;letter-spacing:3px;text-transform:uppercase;color:var(--cg-gold-t);font-weight:700;margin:0 0 10px}
.cg h1,.cg h2,.cg h3{font-family:var(--font-display),Georgia,serif;color:var(--ink);font-weight:600;letter-spacing:-.01em;text-wrap:balance;margin:0}
.cg h1 em,.cg h2 em{font-style:normal;color:var(--cg-gold-t)}
.cg-lede{color:var(--ink-soft);font-size:clamp(1rem,2.4vw,1.1rem);line-height:1.6;max-width:62ch;margin:12px 0 0}
/* intro */
.cg-intro{padding:clamp(34px,6vw,64px) 0 clamp(22px,4vw,34px);text-align:center;background:radial-gradient(70% 90% at 50% 0%,rgba(194,161,78,.14),transparent 70%)}
.cg-intro h1{font-size:clamp(1.9rem,5.2vw,3rem);line-height:1.1}
.cg-intro .cg-lede{margin:14px auto 0}
.cg-trust{list-style:none;padding:0;margin:26px auto 0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px}
.cg-trust li{display:flex;align-items:center;gap:10px;text-align:left;color:var(--gold-dark)}
.cg-trust b{display:block;color:var(--ink);font-size:.92rem}
.cg-trust span{color:var(--ink-soft);font-size:.82rem;line-height:1.3}
/* boutique */
.cg-shop{padding:8px 0 clamp(48px,7vw,80px)}
.cg-layout{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:clamp(22px,3vw,40px);align-items:start}
.cg-col{min-width:0}
.cg-head h2{font-size:clamp(1.45rem,3.4vw,1.9rem)}
.cg-head p{color:var(--ink-soft);margin:6px 0 0}
.cg-chips{display:flex;gap:8px;overflow-x:auto;padding:16px 2px 6px;margin:0 -2px;scrollbar-width:none}
.cg-chips::-webkit-scrollbar{display:none}
.cg-chip{flex:none;display:inline-flex;align-items:center;gap:7px;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s,color .15s}
.cg-chip:hover{border-color:var(--gold)}
.cg-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}
.cg-n{font-size:.72rem;font-weight:700;min-width:20px;text-align:center;padding:1px 6px;border-radius:999px;background:var(--cream-2);color:var(--ink-soft)}
.cg-chip.on .cg-n{background:rgba(255,255,255,.16);color:#e2c67e}
.cg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px}
.cg-tile{position:relative;display:block;padding:0;border:0;border-radius:16px;overflow:hidden;background:#17120b;box-shadow:var(--cg-shadow),var(--cg-ring);cursor:pointer;text-align:center;font:inherit;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .25s}
.cg-tile:hover{transform:translateY(-3px);box-shadow:0 18px 36px rgba(43,38,32,.18),var(--cg-ring)}
.cg-tile:focus-visible{outline:3px solid var(--gold-dark);outline-offset:3px}
.cg-tile[hidden]{display:none}
.cg-img{display:block;position:relative;aspect-ratio:1/1}
.cg-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.22,1,.36,1)}
.cg-tile:hover .cg-img img{transform:scale(1.05)}
.cg-lab{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:30px 10px 10px;color:rgba(255,255,255,.86);background:linear-gradient(transparent,rgba(23,15,6,.86) 55%);font-size:.76rem;line-height:1.35}
.cg-lab b{display:block;font-size:.92rem;color:#e2c67e;margin-bottom:2px}
.cg-price{position:absolute;top:8px;right:8px;z-index:2;background:rgba(255,253,249,.95);color:var(--ink);font-weight:700;font-size:.72rem;padding:4px 9px;border-radius:20px;border:1px solid #e7ddcd}
.cg-ok{position:absolute;top:50%;left:50%;z-index:3;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.35);opacity:0;transform:scale(.6);transition:opacity .2s,transform .35s cubic-bezier(.22,1,.36,1)}
.cg-ok .cg-ic{width:24px;height:24px;stroke-width:2.4}
.cg-tile.on{box-shadow:0 0 0 3px var(--gold),0 14px 30px rgba(169,137,53,.35)}
.cg-tile.on .cg-ok{opacity:1;transform:scale(1)}
.cg-tile.on .cg-img img{filter:brightness(.82)}
.cg-dhead{margin-top:clamp(34px,5vw,52px)}
.cg-empty[hidden]{display:none}
.cg-xtal,.cg-stage.is-d{background:radial-gradient(120% 90% at 50% 30%,#2a2f38,#0d0f13 70%)}
.cg-bloc{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58%;aspect-ratio:3/4;border-radius:4px;
  background:linear-gradient(125deg,rgba(255,255,255,.16),rgba(190,215,235,.05) 40%,rgba(255,255,255,.1));
  box-shadow:inset 0 0 0 1.5px rgba(225,240,255,.55),inset 0 0 22px rgba(170,205,240,.18),0 18px 30px rgba(0,0,0,.45);overflow:hidden;transition:width .45s cubic-bezier(.22,1,.36,1),aspect-ratio .45s}
.cg-bloc::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.18) 45%,transparent 60%);pointer-events:none}
.cg-bloc img{position:absolute!important;inset:9%!important;width:82%!important;height:82%!important;object-fit:contain!important;filter:drop-shadow(0 0 4px rgba(200,225,255,.5));opacity:.95;animation:none}
.cg-tile:hover .cg-bloc img{transform:none}
.cg-bloc-xl{width:46%}
.cg-bloc-xl.fmt-h{width:72%;aspect-ratio:4/3}
.cg-bloc-xl[hidden]{display:none}
.cg-stage.is-d #grand{display:none}
.cg-own{grid-column:span 2;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:22px;border-radius:16px;background:linear-gradient(135deg,#fbf4e6,#fffdf9);box-shadow:inset 0 0 0 1.5px #e7d3a1;color:var(--ink-soft);font-size:.92rem;line-height:1.5;text-decoration:none;transition:box-shadow .2s}
.cg-own:hover{box-shadow:inset 0 0 0 1.5px var(--gold)}
.cg-own b{display:block;color:var(--ink);font-family:var(--font-display),Georgia,serif;font-size:1.2rem;margin-bottom:2px}
.cg-own-ic{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--paper);color:var(--gold-dark);box-shadow:0 0 0 1px #e7d3a1}
.cg-own em{font-style:normal;display:inline-flex;align-items:center;gap:6px;color:var(--cg-gold-t);font-weight:700}
.cg-own em .cg-ic{width:16px;height:16px}
.cg-own[hidden]{display:none}
/* panneau */
.cg-panel{position:sticky;top:16px;background:var(--paper);border-radius:18px;padding:16px 18px 18px;box-shadow:0 18px 40px rgba(43,38,32,.10),var(--cg-ring)}
.cg-stage{position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.cg-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:cgIn .5s cubic-bezier(.22,1,.36,1)}
@keyframes cgIn{from{opacity:0;transform:scale(1.04);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.cg-empty{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:var(--gold-dark);padding:18px}
.cg-empty p{margin:0;color:var(--ink-soft);font-size:.88rem}
.cg-empty b{display:block;color:var(--ink);font-family:var(--font-display),Georgia,serif;font-size:1.05rem;margin-bottom:2px}
.cg-pname{font-size:1.3rem;margin-top:14px!important}
.cg-pdesc{color:var(--ink-soft);font-size:.9rem;margin:4px 0 6px}
.cg-panel .field{margin-top:14px}
.cg-panel .field>label{display:block;font-weight:600;font-size:.92rem;margin-bottom:8px;color:var(--ink)}
.cg-fmts{display:grid!important;grid-template-columns:1fr 1fr}
.cg-fmts .variant-swatch img{width:100%;height:64px;object-fit:cover;object-position:center}
.cg-hint{font-size:.78rem;color:var(--ink-soft);margin:6px 0 0}
.cg-panel .crystal-sizes{grid-template-columns:1fr 1fr}
.cg-panel .crystal-sizes .variant-swatch{padding:11px 12px}
.cg-panel .crystal-sizes .vs-price{position:static;display:block;margin-top:4px}
.cg-socle{width:100%;display:flex;align-items:center;gap:12px;text-align:left;font:inherit;color:var(--ink);background:var(--paper);border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.cg-socle:hover{border-color:var(--gold)}
.cg-socle img{width:54px;height:54px;object-fit:cover;border-radius:8px;flex:none}
.cg-socle b{display:block;font-size:.9rem}
.cg-socle small{display:block;color:var(--ink-soft);font-size:.76rem;line-height:1.35}
.cg-socle-p{margin-left:auto;font-weight:700;color:var(--cg-gold-t);font-size:.86rem;white-space:nowrap}
.cg-box{flex:none;width:22px;height:22px;border-radius:6px;border:1.5px solid var(--line);display:grid;place-items:center;color:transparent;transition:background .15s,border-color .15s}
.cg-box .cg-ic{width:15px;height:15px;stroke-width:2.6}
.cg-socle.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.cg-socle.on .cg-box{background:var(--gold-dark);border-color:var(--gold-dark);color:#fff}
.cg-txt-ic{width:54px;height:54px;border-radius:8px;flex:none;display:grid;place-items:center;background:var(--cream-2);color:var(--gold-dark)}
.cg-txt{margin-top:10px;padding:12px;border-radius:12px;background:#fbf4e6;border:1px solid #e7d3a1;display:grid;gap:8px}
.cg-txt[hidden]{display:none}
.cg-sub{font-size:.8rem;font-weight:600;color:var(--ink-soft)}
.cg-inp{display:flex;align-items:center;gap:8px;background:var(--paper);border:1.5px solid var(--line);border-radius:10px;padding:0 12px}
.cg-inp:focus-within{border-color:var(--gold-dark)}
.cg-inp input{flex:1;min-width:0;box-sizing:border-box;border:0;background:none;font:inherit;font-size:16px;color:var(--ink);padding:11px 0;outline:none}
.cg-inp span{font-size:.75rem;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.cg-fonts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.cg-font{border:1.5px solid var(--line);background:var(--paper);color:var(--ink);border-radius:10px;padding:8px 6px;font-size:1.02rem;cursor:pointer;line-height:1.2;transition:border-color .15s,box-shadow .15s}
.cg-font:hover{border-color:var(--gold)}
.cg-font.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.cg-font.fnt-great-vibes,.cg-font.fnt-allura{font-size:1.35rem;padding-block:4px}
.cg-pos{display:flex;flex-wrap:wrap;gap:6px}
.cg-pos .cg-chip{padding:7px 12px;font-size:.84rem}
.cg-txtpv{position:absolute;z-index:2;max-width:78%;color:#fff;font-size:clamp(1rem,2.4vw,1.4rem);line-height:1.15;text-align:center;text-shadow:0 0 10px rgba(255,255,255,.55),0 1px 2px rgba(0,0,0,.6);overflow-wrap:anywhere;pointer-events:none}
.cg-txtpv[hidden]{display:none}
.cg-txtpv.pos-bas{left:50%;bottom:9%;transform:translateX(-50%)}
.cg-txtpv.pos-haut{left:50%;top:9%;transform:translateX(-50%)}
.cg-txtpv.pos-gauche{left:7%;top:50%;transform:translateY(-50%);max-width:34%;text-align:left}
.cg-txtpv.pos-droite{right:7%;top:50%;transform:translateY(-50%);max-width:34%;text-align:right}
.cg-panel .pd-totbox .val{font-variant-numeric:tabular-nums}
.cg-panel .qty-row{margin-bottom:8px}
.cg-panel .btn-gold[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}
.cg-panel .prc-addhint{font-size:.82rem;color:#b4452f;margin:0 0 6px}
.cg-panel .prc-addhint[hidden]{display:none}
/* barre téléphone */
.cg-bar{position:fixed;left:10px;right:10px;bottom:10px;z-index:60;display:none;align-items:center;gap:10px;padding:8px 8px 8px 10px;border-radius:16px;background:rgba(43,38,32,.96);color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.3)}
.cg-bar.cg-bar-off{opacity:0;pointer-events:none;transform:translateY(16px)}
.cg-bar{transition:opacity .25s,transform .3s cubic-bezier(.22,1,.36,1)}
.cg-bar img{width:42px;height:42px;border-radius:10px;object-fit:cover}
.cg-bar-t{min-width:0;flex:1;line-height:1.25}
.cg-bar-t b{display:block;font-size:.86rem;color:#e2c67e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cg-bar-t small{font-size:.76rem;color:rgba(255,255,255,.75)}
.cg-bar .btn{padding:10px 14px;font-size:.84rem;white-space:nowrap}
/* sur-mesure */
.cg-sur{position:relative;padding:clamp(48px,7vw,84px) 0;background:radial-gradient(80% 120% at 85% 0%,rgba(194,161,78,.18),transparent 55%),linear-gradient(170deg,#fbf6ec,#f2e7d0);border-top:1px solid var(--line)}
.cg-sur-top{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:center}
.cg-sur h2{font-size:clamp(1.8rem,4.4vw,2.7rem);line-height:1.1}
.cg-tags{list-style:none;padding:0;margin:20px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.cg-tags li{display:inline-flex;align-items:center;gap:7px;background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:7px 14px 7px 11px;font-size:.88rem;font-weight:600;color:var(--ink)}
.cg-tags .cg-ic{width:17px;height:17px;color:var(--gold-dark)}
.cg-mosaic{display:grid;grid-template-columns:1fr 1fr;gap:10px;transform:rotate(-1.5deg)}
.cg-mosaic img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;box-shadow:var(--cg-shadow),var(--cg-ring)}
.cg-mosaic img:nth-child(2),.cg-mosaic img:nth-child(4){transform:translateY(18px)}
.cg-steps{list-style:none;padding:0;margin:clamp(34px,5vw,52px) 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;position:relative}
.cg-steps::before{content:"";position:absolute;top:17px;left:17px;right:17px;height:1px;background:linear-gradient(90deg,var(--gold),rgba(194,161,78,.15))}
.cg-steps li{position:relative;display:flex;flex-direction:column;gap:12px}
.cg-sn{position:relative;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#e2c67e,var(--gold-dark));color:#2b2620;font-family:var(--font-display),Georgia,serif;font-weight:700;box-shadow:0 0 0 5px #f6eddb}
.cg-steps h3{font-size:1.06rem;margin-bottom:4px}
.cg-steps p{color:var(--ink-soft);font-size:.92rem;margin:0;max-width:34ch}
.cg-fcards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:clamp(30px,4vw,44px)}
.cg-fcard{display:flex;align-items:center;gap:16px;background:var(--paper);border-radius:16px;padding:14px;text-decoration:none;color:var(--ink);box-shadow:var(--cg-shadow),var(--cg-ring);transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s}
.cg-fcard:hover{transform:translateY(-3px);box-shadow:0 18px 36px rgba(160,124,44,.18),var(--cg-ring)}
.cg-fcard img{width:92px;height:92px;object-fit:cover;border-radius:10px;flex:none}
.cg-fcard b{display:block;font-family:var(--font-display),Georgia,serif;font-size:1.12rem}
.cg-fcard small{display:block;color:var(--ink-soft);font-size:.86rem;margin:3px 0 7px}
.cg-fcard em{font-style:normal;display:inline-flex;align-items:center;gap:6px;color:var(--cg-gold-t);font-weight:700;font-size:.88rem}
.cg-fcard em .cg-ic{width:16px;height:16px}
.cg-note{display:flex;gap:12px;align-items:flex-start;background:rgba(194,161,78,.1);border:1px solid #e7d3a1;border-radius:14px;padding:14px 16px;margin:22px 0 0;font-size:.92rem;color:var(--ink-soft)}
.cg-note .cg-ic{color:var(--gold-dark);margin-top:1px}
.cg-note b{color:var(--ink)}
@media (min-width:861px){.cg-chips{flex-wrap:wrap;overflow:visible}}
@media (max-width:1060px){.cg-layout{grid-template-columns:minmax(0,1fr) 340px}.cg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:860px){
  .cg-layout{grid-template-columns:minmax(0,1fr)}
  .cg-panel{position:static}
  .cg-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .cg-bar:not([hidden]){display:flex}
  .cg-dgrid .cg-tile:last-child:nth-child(odd){grid-column:span 2}
  .cg-dgrid .cg-tile:last-child:nth-child(odd) .cg-img{aspect-ratio:2/1}
  .cg-dgrid .cg-tile:last-child:nth-child(odd) .cg-bloc{width:30%}
  .cg-sur-top{grid-template-columns:1fr}
  .cg-mosaic{max-width:420px;transform:none}
  .cg-steps{grid-template-columns:1fr;gap:18px}
  .cg-steps::before{top:17px;bottom:17px;left:17px;right:auto;width:1px;height:auto;background:linear-gradient(180deg,var(--gold),rgba(194,161,78,.15))}
  .cg-steps li{flex-direction:row;align-items:flex-start;gap:14px}
  .cg-fcards{grid-template-columns:1fr}
}
@media (max-width:480px){.cg-lab{padding:26px 8px 9px}.cg-lab b{font-size:.86rem;margin:0}.cg-ph{display:none}.cg-trust{justify-content:flex-start;max-width:280px}}
@media (prefers-reduced-motion:reduce){.cg *,.cg *::before{animation:none!important;transition:none!important}}
'''

CSS += r'''
/* zodiaque : place pour le nom en haut et les textes d'exemple en bas (comme les photos du gérant) */
.cg-zbloc .cg-const{inset:12% 3% 27% 3%;width:94%;height:61%}
.cg-zbloc .cg-zfig{inset:13% 8% 28% 8%!important;width:84%!important;height:59%!important}
.cg-zbloc .cg-zname{top:4%}
.cg-zex{bottom:4%}
.cg-zex[hidden]{display:none}
.cg-tile .cg-zex b{font-size:.78rem;line-height:1.1}
.cg-tile .cg-zex small{font-size:.42rem;letter-spacing:.02em}
.cg-bloc-xl .cg-zex b,.cg-bloc-xl #zpn{font-size:clamp(1.1rem,3vw,1.7rem)}
.cg-bloc-xl .cg-zex small{font-size:.68rem}

/* ---- 09/10 soir : trois pavés, une grille, « Afficher plus », zodiaque */
.cg-grps{display:flex;gap:8px;margin-top:16px}
.cg-grp{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;background:var(--sand);color:var(--ink);border-radius:var(--r2);padding:12px 10px;min-height:48px;font:inherit;font-size:.92rem;font-weight:600;cursor:pointer}
.cg-grp:hover{background:var(--sand2)}
.cg-grp.on{background:var(--ink);color:var(--cream)}
.cg-grp .cg-n{background:rgba(26,18,6,.08);color:var(--muted)}
.cg-grp.on .cg-n{background:rgba(255,255,255,.14);color:var(--gold-l)}
.cg-chips[hidden]{display:none}
.cg-chips{padding-top:10px}
.cg-gintro{color:var(--muted);margin:14px 0 0;font-size:.92rem}
.cg-gintro[hidden]{display:none}
.cg-more{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:18px;padding:14px;border:1.5px solid var(--sand2);border-radius:999px;background:#fff;color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.cg-more:hover{border-color:var(--gold)}
.cg-more[hidden]{display:none}
.cg-const{position:absolute;inset:0;width:100%;height:100%}
.cg-zfig{position:absolute!important;inset:12% 8%!important;width:84%!important;height:76%!important;object-fit:contain!important;opacity:.9}
.cg-zname{position:absolute;left:0;right:0;top:5%;text-align:center;color:#fff;font-family:var(--font-display),Georgia,serif;font-size:.78rem;letter-spacing:.02em;text-shadow:0 0 8px rgba(255,255,255,.5)}
.cg-bloc-xl .cg-zname{font-size:1.1rem;top:6%}
.cg-bloc-in{position:absolute;inset:0}
.cg-zperso{position:absolute;left:6%;right:6%;bottom:5%;text-align:center;color:#fff;line-height:1.25;text-shadow:0 0 8px rgba(255,255,255,.5)}
.cg-zperso[hidden]{display:none}
.cg-zperso b{display:block;font-family:"Great Vibes","Allura",cursive;font-weight:400;font-size:clamp(1.1rem,3vw,1.7rem)}
.cg-zperso small{display:block;font-size:.68rem;letter-spacing:.04em;opacity:.9}
.cg-2col{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#txtzod[hidden],#txtlibre[hidden]{display:none}
@media (max-width:480px){.cg-grp{font-size:.8rem;padding:10px 6px;gap:5px}.cg-grp .cg-n{min-width:16px;padding:0 4px}}

/* ---- habillage « Mélange » (nouveau site, 09/10/2026) : jetons de DESIGN.md */
.cg{--cream:#fbf7ee;--paper:#fdfaf3;--sand:#f3e8d3;--sand2:#eadbbf;--ink:#1a1206;--ink2:#241a0c;--muted:#6b5f4b;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;--r:20px;--r2:14px;--r3:28px;--sh:0 14px 36px rgba(26,18,6,.10);--cg-gold-t:var(--gold-t);--cg-ring:0 0 0 0 transparent;--cg-shadow:var(--sh);--ink-soft:var(--muted);--line:var(--sand2)}
.cg-k{display:none}
.cg h1 em,.cg h2 em{font-style:italic;font-weight:500;color:var(--gold-t)}
.cg-intro.cg-ecrin{text-align:left;background:radial-gradient(60% 90% at 85% 0%,rgba(201,162,75,.30),transparent 60%),var(--ink2);color:#fff;padding:clamp(40px,7vw,80px) 0 clamp(34px,5vw,56px)}
.cg-ecrin h1{color:#fff;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06}
.cg-ecrin h1 em{color:var(--gold-l)}
.cg-ecrin .cg-lede{color:#d9ccb0;margin:16px 0 0}
.cg-ecrin .cg-trust{justify-content:flex-start;margin-top:26px;gap:10px 26px}
.cg-ecrin .cg-trust li{color:var(--gold-l)}.cg-ecrin .cg-trust b{color:#fff}.cg-ecrin .cg-trust span{color:#b8a98a}
.cg-shop{padding-top:clamp(26px,4vw,40px)}
.cg-head p{color:var(--muted)}
.cg-chips{gap:8px;padding-top:14px}
.cg-chip{border:0;background:var(--sand);color:var(--ink);border-radius:var(--r2);padding:11px 14px;min-height:44px;font-weight:600}
.cg-chip:hover{background:var(--sand2)}
.cg-chip.on{background:var(--ink);color:var(--cream)}
.cg-n{background:rgba(26,18,6,.08);color:var(--muted)}
.cg-chip.on .cg-n{background:rgba(255,255,255,.14);color:var(--gold-l)}
.cg-grid{gap:20px 14px;margin-top:16px}
.cg-tile{display:flex;flex-direction:column;gap:10px;background:none;box-shadow:none;border-radius:0;overflow:visible;text-align:left}
.cg-tile:hover{transform:none;box-shadow:none}
.cg-tile .cg-img{border-radius:var(--r);overflow:hidden;background:var(--sand);transition:box-shadow .2s}
.cg-tile .cg-img.cg-xtal{background:radial-gradient(120% 90% at 50% 30%,#2a2f38,#0d0f13 70%)}
.cg-tile:hover .cg-img img{transform:scale(1.04)}
.cg-meta{display:flex;flex-direction:column;gap:2px;padding:0 2px}
.cg-tag{font-size:.76rem;font-weight:600;color:var(--gold-t)}
.cg-nom{font-weight:600;font-size:.92rem;line-height:1.3;color:var(--ink)}
.cg-price{position:static;background:none;border:0;padding:0;font-family:var(--font-display),Georgia,serif;font-weight:400;font-size:1rem;color:var(--gold-t)}
.cg-ph{font-size:.78rem;color:var(--muted);line-height:1.35}
.cg-tile.on{box-shadow:none}
.cg-tile.on .cg-img{box-shadow:0 0 0 3px var(--gold)}
.cg-tile.on .cg-img img{filter:none}
.cg-ok{top:10px;right:10px;left:auto;bottom:auto;margin:0;width:36px;height:36px;transform:scale(.6);box-shadow:0 6px 16px rgba(0,0,0,.25)}
.cg-tile.on .cg-ok{transform:scale(1)}
.cg-own{border-radius:var(--r);background:#fff;box-shadow:var(--sh)}
.cg-own:hover{box-shadow:var(--sh),0 0 0 2px var(--gold)}
.cg-own-ic{background:var(--sand);box-shadow:none;color:var(--gold-d)}
.cg-panel{border-radius:var(--r3);background:#fff;box-shadow:var(--sh);padding:18px 20px 20px}
.cg-stage{border-radius:var(--r)}
.cg-socle,.cg-inp,.cg-font{border-color:var(--sand2);border-radius:var(--r2)}
.cg-socle img,.cg-txt-ic{border-radius:10px}
.cg-txt{background:var(--sand);border-color:var(--sand2);border-radius:var(--r2)}
.cg-bar{border-radius:var(--r);background:rgba(36,26,12,.96)}
.cg-sur{background:radial-gradient(70% 90% at 12% 8%,rgba(201,162,75,.26),transparent 60%),var(--ink2);border-top:0;color:#fff}
.cg-sur h2,.cg-sur h3{color:#fff}.cg-sur h2 em{color:var(--gold-l)}
.cg-sur .cg-lede,.cg-steps p{color:#d9ccb0}
.cg-tags li{background:rgba(255,255,255,.06);border:1px solid rgba(226,198,126,.45);color:#fff}
.cg-tags .cg-ic{color:var(--gold-l)}
.cg-mosaic{transform:none}
.cg-mosaic img{border-radius:var(--r);box-shadow:0 0 0 1px rgba(226,198,126,.55),0 18px 40px rgba(0,0,0,.4)}
.cg-sn{box-shadow:0 0 0 5px var(--ink2)}
.cg-steps::before{background:linear-gradient(90deg,var(--gold-l),rgba(226,198,126,.12))}
.cg-fcard{border-radius:var(--r);background:#fff;box-shadow:none}
.cg-fcard:hover{box-shadow:0 0 0 2px var(--gold)}
.cg-fcard b,.cg-fcard small{color:var(--ink)}.cg-fcard small{color:var(--muted)}
.cg-note{background:rgba(255,255,255,.06);border-color:rgba(226,198,126,.4);color:#d9ccb0}
.cg-note b{color:#fff}.cg-note .cg-ic{color:var(--gold-l)}
@media (max-width:860px){.cg-steps::before{background:linear-gradient(180deg,var(--gold-l),rgba(226,198,126,.12))}}
@media (max-width:480px){.cg-ecrin .cg-trust{max-width:none}}
'''

DATA = json.dumps([{"k": k, "nom": n, "fmt": f, "phrase": p} for k, n, _, f, p in MODELES]
                  + [{"k": k, "nom": n, "d": True, "phrase": "Dessin gravé en 3D au cœur du cristal, au format de votre choix."} for k, n, _ in DESSINS]
                  + [{"k": k, "nom": n, "d": True, "z": True, "phrase": f"Signe du {n} ({dates}) : la constellation et sa figure, gravées en 3D. Ajoutez un prénom, la date de naissance et la ville."} for k, n, dates, _, _ in ZODIAQUE], ensure_ascii=False)
TAILLES_JS = json.dumps({t[0]: {"nom": t[1], "prix": t[4], "socle": t[5]} for t in TAILLES})

JS = r'''
(function(){
  var M=__DATA__, T=__TAILLES__, PAGE=8;
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={txt:false,texte:'',font:'playfair',pos:'bas',i:-1,fmt:null,taille:'moyen',socle:false,q:1,grp:'modeles',fam:'tous',plus:false,zp:'',zd:'',zh:'',zv:''};
  var $=function(id){return document.getElementById(id)};
  var tiles=[].slice.call(document.querySelectorAll('.cg-tile'));
  var chips=[].slice.call(document.querySelectorAll('#familles .cg-chip'));
  var grps=[].slice.call(document.querySelectorAll('.cg-grp'));
  var own=document.querySelector('.cg-own');
  var INTRO={dessins:"Un dessin gravé en 3D au cœur du cristal, au format et à la taille de votre choix. Rien n'est choisi d'avance.",zodiaque:"Votre signe, sa constellation et sa figure gravés dans le cristal. En option : un prénom, la date et l'heure de naissance, la ville."};
  function visibles(){var n=0,shown=0;
    tiles.forEach(function(t){var ok=t.dataset.grp===st.grp&&(st.grp!=='modeles'||st.fam==='tous'||t.dataset.fam===st.fam);
      if(ok){n++;var show=st.plus||n<=PAGE;t.hidden=!show;if(show)shown++}else t.hidden=true});
    if(own)own.hidden=st.grp!=='modeles';
    var reste=n-shown;$('plusbtn').hidden=reste<=0;$('plusn').textContent=reste;
    $('familles').hidden=st.grp!=='modeles';$('gintro').hidden=st.grp==='modeles';$('gintro').textContent=INTRO[st.grp]||'';}
  grps.forEach(function(g){g.addEventListener('click',function(){st.grp=g.dataset.grp;st.plus=false;grps.forEach(function(x){x.classList.toggle('on',x===g);x.setAttribute('aria-pressed',x===g)});visibles()})});
  chips.forEach(function(c){c.addEventListener('click',function(){st.fam=c.dataset.fam;st.plus=false;chips.forEach(function(x){x.classList.toggle('on',x===c);x.setAttribute('aria-pressed',x===c)});visibles()})});
  $('plusbtn').addEventListener('click',function(){st.plus=true;visibles()});
  tiles.forEach(function(t){t.addEventListener('click',function(){
    st.i=+t.dataset.i;var m=M[st.i];
    tiles.forEach(function(x){var on=x===t;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    var img=t.querySelector('img'),src=img?img.src:'',g=$('grand'),b=$('bloc');
    $('stage').classList.toggle('is-d',!!m.d);
    if(m.d){g.hidden=true;b.hidden=false;var bl=t.querySelector('.cg-bloc');$('blocin').innerHTML=bl?bl.innerHTML:'';b.classList.toggle('cg-zbloc',!!m.z);b.classList.toggle('fmt-h',st.fmt==='h');}
    else{b.hidden=true;g.hidden=false;g.src=src;g.alt='Cristal gravé : '+m.nom;g.style.animation='none';void g.offsetWidth;g.style.animation='';}
    $('vide').hidden=true;
    $('t-pan').textContent=m.z?'Signe du '+m.nom:m.nom;$('pdesc').textContent=m.phrase;
    $('barimg').src=src;$('barimg').hidden=!src;$('barnom').textContent=m.nom;
    $('txtlab').textContent=m.z?'Ajouter prénom, date de naissance et ville':'Ajouter un texte';
    $('txtsub').textContent=m.z?'Comme sur une carte du ciel : gravés sous la constellation':'Un prénom, une date, un petit mot, gravé avec le modèle';
    $('txtzod').hidden=!m.z;$('txtlibre').hidden=!!m.z;
    if(window.innerWidth<=860){$('panneau').scrollIntoView({behavior:'smooth',block:'start'})}
    maj();
  })});
  function setFmt(f){st.fmt=f;if(!f)return;$('bloc').classList.toggle('fmt-h',f==='h');[].forEach.call(document.querySelectorAll('[data-fmt]'),function(b){var on=b.dataset.fmt===f;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
    [].forEach.call(document.querySelectorAll('#tailles .vs-sub'),function(s){s.textContent=s.dataset[f]})}
  [].forEach.call(document.querySelectorAll('[data-fmt]'),function(b){b.addEventListener('click',function(){setFmt(b.dataset.fmt);maj()})});
  [].forEach.call(document.querySelectorAll('[data-taille]'),function(b){b.addEventListener('click',function(){
    st.taille=b.dataset.taille;[].forEach.call(document.querySelectorAll('[data-taille]'),function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('socle').addEventListener('click',function(){st.socle=!st.socle;this.classList.toggle('on',st.socle);this.setAttribute('aria-pressed',st.socle);maj()});
  $('txton').addEventListener('click',function(){st.txt=!st.txt;this.classList.toggle('on',st.txt);this.setAttribute('aria-pressed',st.txt);$('txtzone').hidden=!st.txt;if(st.txt){var m=M[st.i];(m&&m.z?$('zp'):$('txt')).focus()}maj()});
  $('txt').addEventListener('input',function(){st.texte=this.value.trim();$('txtn').textContent=this.value.length+'/40';maj()});
  ['zp','zd','zh','zv'].forEach(function(k){$(k).addEventListener('input',function(){st[k]=this.value.trim();maj()})});
  [].forEach.call(document.querySelectorAll('[data-font]'),function(b){b.addEventListener('click',function(){st.font=b.dataset.font;[].forEach.call(document.querySelectorAll('[data-font]'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});maj()})});
  [].forEach.call(document.querySelectorAll('[data-pos]'),function(b){b.addEventListener('click',function(){st.pos=b.dataset.pos;[].forEach.call(document.querySelectorAll('[data-pos]'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('moins').addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});
  $('plus').addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  $('ajout').addEventListener('click',function(){if(st.i<0)return;var b=this;b.textContent='Ajouté au panier ✓';setTimeout(function(){b.textContent='Ajouter au panier'},2200)});
  function maj(){
    var t=T[st.taille];$('soclep').textContent='+'+eur(t.socle);$('qte').textContent=st.q;
    var m=st.i>=0?M[st.i]:null,zod=!!(m&&m.z);
    var avecTxt=st.txt&&(zod?!!(st.zp||st.zd||st.zv):!!st.texte);
    var unit=t.prix+(st.socle?t.socle:0)+(avecTxt?__TXT__:0);
    var ok=st.i>=0&&!!st.fmt&&(!st.txt||avecTxt);
    var pv=$('txtpv');pv.hidden=!(avecTxt&&st.i>=0&&!zod);pv.textContent=st.texte;pv.className='cg-txtpv fnt-'+st.font+' pos-'+st.pos;
    var zp=$('zperso');zp.hidden=!(zod&&st.txt);var ex=document.querySelector('#blocin .cg-zex');if(ex)ex.hidden=!!(zod&&st.txt);$('zpn').textContent=st.zp;$('zpd').textContent=[st.zd,st.zh].filter(Boolean).join(' · ');$('zpv').textContent=st.zv;
    $('total').textContent=ok?eur(unit*st.q):'—';
    var a=$('ajout');a.disabled=!ok;a.classList.toggle('prc-off',!ok);$('manque').hidden=ok;$('manque').textContent=st.i<0?'Choisissez d\'abord un modèle, un dessin ou votre signe.':!st.fmt?'Il manque le format : vertical ou horizontal.':zod?'Écrivez au moins le prénom, la date ou la ville, ou retirez l\'option.':'Écrivez le texte à graver, ou retirez l\'option texte.';
    var bar=$('barre');bar.hidden=st.i<0;if(st.i>=0){$('barprix').textContent=t.nom+' · '+eur(unit)}
  }
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  var vu=false;if('IntersectionObserver' in window){new IntersectionObserver(function(e){vu=e[0].isIntersecting;$('barre').classList.toggle('cg-bar-off',vu)},{threshold:.15}).observe($('panneau'))}
  visibles();maj();
})();
'''.replace("__DATA__", DATA).replace("__TXT__", str(TEXTE_PRIX)).replace("__TAILLES__", TAILLES_JS)

BANNER = '<div class="mq-banner">MAQUETTE — page « Cristaux déjà gravés » · <b>rien n\'est encore sur le site</b></div>'
TITLE = "<title>Cristaux déjà gravés — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "cristaux-graves.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "cristaux-graves.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
