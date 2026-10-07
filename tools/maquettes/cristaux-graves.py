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
FAMILLES = [("tous", "Tous les modèles"), ("amour", "Amour"), ("animaux", "Animaux"), ("noel", "Noël"),
            ("zen", "Zen & spirituel"), ("legendes", "Légendes"), ("voyage", "Voyage")]
FMT_LABEL = {"v": "Vertical", "h": "Horizontal", "c": "Cube"}

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

# Feuilles de style du site, intégrées ; seules les polices latines (préchargées) sont intégrées.
css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
latin = set(re.findall(r'/_next/static/media/([\w-]+\.p\.woff2)', open(SRC, encoding="utf-8").read()))
def font_url(m):
    f = m.group(1)
    if f in latin:
        return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', f))})"
    return "url(data:font/woff2;base64,)"
css = re.sub(r"url\(/_next/static/media/([\w.-]+)\)", font_url, css)

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
IMG = {k: uri(os.path.join(ASSETS, f"{k}.jpg"), 640, 76) for k, *_ in MODELES}
SM = {k: uri(os.path.join(ASSETS, f"sm-{k}.jpg"), 520, 74) for k in ("sirene", "animal", "portrait", "objet")}
SOCLE = uri(os.path.join(PUB, "produits", "socle-led-rectangle.jpg"), 300, 74)
FMT_V = uri(os.path.join(PUB, "produits", "cristal-bloc-v-creme.jpg"), 260, 74)
FMT_H = uri(os.path.join(PUB, "produits", "cristal-bloc-h-creme.jpg"), 260, 74)

ICON = {
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
    return f'''<button type="button" class="cg-tile" data-i="{idx}" data-fam="{fam}" aria-pressed="false">
      <span class="cg-img"><img src="{IMG[k]}" alt="Cristal gravé : {nom}" loading="lazy"></span>
      <span class="cg-fmt">{FMT_LABEL[fmt]}</span>
      <span class="cg-price">dès 39,90 €</span>
      <span class="cg-ok" aria-hidden="true">{ic("check")}</span>
      <span class="cg-lab"><b>{nom}</b><span class="cg-ph">{phrase}</span></span>
    </button>'''


TILES = "\n".join(tuile(i, m) for i, m in enumerate(MODELES)) + f'''
<a class="cg-own" href="#sur-mesure" data-fam="tous">
  <span class="cg-own-ic">{ic("photo")}</span>
  <span><b>Votre propre image ?</b>Une photo, votre animal, un dessin, un logo : on la grave en 3D, rien que pour vous.</span>
  <em>Voir le sur-mesure {ic("arrow")}</em>
</a>'''
CHIPS = "".join(
    f'<button type="button" class="cg-chip{" on" if k == "tous" else ""}" data-fam="{k}" aria-pressed="{"true" if k == "tous" else "false"}">{lab}'
    f'<span class="cg-n">{len(MODELES) if k == "tous" else sum(1 for m in MODELES if m[2] == k)}</span></button>'
    for k, lab in FAMILLES)

SIZES = "".join(
    f'''<button type="button" class="variant-swatch{" active" if t[0] == "moyen" else ""}" data-taille="{t[0]}" aria-pressed="{"true" if t[0] == "moyen" else "false"}">
        <span class="vs-title">{t[1]}</span><span class="vs-sub" data-v="{t[2]}" data-h="{t[3]}">{t[2]}</span>
        <span class="vs-price"><span class="vs-now">{euro(t[4])}</span></span></button>'''
    for t in TAILLES)

MAIN = f'''<main class="cg">
<section class="cg-intro">
  <div class="container">
    <p class="cg-k">Niv Création · Cristal gravé au laser</p>
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
        <h2 id="t-mod">Choisissez votre modèle</h2>
        <p>Touchez un cristal pour le voir en grand et choisir sa taille.</p>
      </div>
      <div class="cg-chips" role="group" aria-label="Filtrer les modèles">{CHIPS}</div>
      <div class="cg-grid" id="grille">{TILES}</div>

    </div>

    <aside class="cg-panel" id="panneau" aria-labelledby="t-pan" aria-live="polite">
      <div class="cg-stage" id="stage">
        <div class="cg-empty" id="vide">{ic("gem","cg-ic cg-ic-xl")}<p><b>Votre cristal apparaîtra ici</b>Choisissez un modèle dans la galerie.</p></div>
        <img id="grand" alt="" hidden>
      </div>
      <h3 id="t-pan" class="cg-pname">Votre cristal</h3>
      <p class="cg-pdesc" id="pdesc">Aucun modèle choisi pour l'instant.</p>

      <div class="field">
        <label>Format du cristal</label>
        <div class="variant-swatches cg-fmts">
          <button type="button" class="variant-swatch has-img active" data-fmt="v" aria-pressed="true"><img src="{FMT_V}" alt=""><span class="vs-title">Vertical</span></button>
          <button type="button" class="variant-swatch has-img" data-fmt="h" aria-pressed="false"><img src="{FMT_H}" alt=""><span class="vs-title">Horizontal</span></button>
        </div>
        <p class="cg-hint" id="fmthint">Le format conseillé pour ce modèle est présélectionné.</p>
      </div>

      <div class="field">
        <label>Choisissez la taille</label>
        <div class="variant-swatches crystal-sizes" id="tailles">{SIZES}</div>
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
        <p class="cg-k">Cristal 3D sur mesure</p>
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
.cg-fmt{position:absolute;top:8px;left:8px;z-index:2;background:rgba(43,38,32,.82);color:#e2c67e;font-weight:700;font-size:.72rem;padding:4px 8px;border-radius:20px;letter-spacing:.02em}
.cg-ok{position:absolute;top:50%;left:50%;z-index:3;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.35);opacity:0;transform:scale(.6);transition:opacity .2s,transform .35s cubic-bezier(.22,1,.36,1)}
.cg-ok .cg-ic{width:24px;height:24px;stroke-width:2.4}
.cg-tile.on{box-shadow:0 0 0 3px var(--gold),0 14px 30px rgba(169,137,53,.35)}
.cg-tile.on .cg-ok{opacity:1;transform:scale(1)}
.cg-tile.on .cg-img img{filter:brightness(.82)}
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

DATA = json.dumps([{"k": k, "nom": n, "fmt": f, "phrase": p} for k, n, _, f, p in MODELES], ensure_ascii=False)
TAILLES_JS = json.dumps({t[0]: {"nom": t[1], "prix": t[4], "socle": t[5]} for t in TAILLES})

JS = r'''
(function(){
  var M=__DATA__, T=__TAILLES__;
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={i:-1,fmt:'v',taille:'moyen',socle:false,q:1};
  var $=function(id){return document.getElementById(id)};
  var tiles=[].slice.call(document.querySelectorAll('.cg-tile'));
  var chips=[].slice.call(document.querySelectorAll('.cg-chip'));
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.toggle('on',x===c);x.setAttribute('aria-pressed',x===c)});
    var f=c.dataset.fam;tiles.forEach(function(t){t.hidden=!(f==='tous'||t.dataset.fam===f)});var o=document.querySelector('.cg-own');if(o)o.hidden=false;
  })});
  tiles.forEach(function(t){t.addEventListener('click',function(){
    st.i=+t.dataset.i;var m=M[st.i];
    tiles.forEach(function(x){var on=x===t;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    var g=$('grand');g.hidden=false;g.src=t.querySelector('img').src;g.alt='Cristal gravé : '+m.nom;
    g.style.animation='none';void g.offsetWidth;g.style.animation='';
    $('vide').hidden=true;
    $('t-pan').textContent=m.nom;$('pdesc').textContent=m.phrase;
    setFmt(m.fmt==='h'?'h':'v');
    $('fmthint').textContent=m.fmt==='c'?'Ce modèle se grave aussi bien en vertical qu\'en horizontal.':'Format conseillé pour ce modèle : '+(m.fmt==='h'?'horizontal':'vertical')+'.';
    $('barimg').src=g.src;$('barnom').textContent=m.nom;
    if(window.innerWidth<=860){$('panneau').scrollIntoView({behavior:'smooth',block:'start'})}
    maj();
  })});
  function setFmt(f){st.fmt=f;[].forEach.call(document.querySelectorAll('[data-fmt]'),function(b){var on=b.dataset.fmt===f;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
    [].forEach.call(document.querySelectorAll('#tailles .vs-sub'),function(s){s.textContent=s.dataset[f]})}
  [].forEach.call(document.querySelectorAll('[data-fmt]'),function(b){b.addEventListener('click',function(){setFmt(b.dataset.fmt);maj()})});
  [].forEach.call(document.querySelectorAll('[data-taille]'),function(b){b.addEventListener('click',function(){
    st.taille=b.dataset.taille;[].forEach.call(document.querySelectorAll('[data-taille]'),function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('socle').addEventListener('click',function(){st.socle=!st.socle;this.classList.toggle('on',st.socle);this.setAttribute('aria-pressed',st.socle);maj()});
  $('moins').addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});
  $('plus').addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  $('ajout').addEventListener('click',function(){if(st.i<0)return;var b=this;b.textContent='Ajouté au panier ✓';setTimeout(function(){b.textContent='Ajouter au panier'},2200)});
  function maj(){
    var t=T[st.taille];$('soclep').textContent='+'+eur(t.socle);$('qte').textContent=st.q;
    var unit=t.prix+(st.socle?t.socle:0);
    var ok=st.i>=0;
    $('total').textContent=ok?eur(unit*st.q):'—';
    var a=$('ajout');a.disabled=!ok;a.classList.toggle('prc-off',!ok);$('manque').hidden=ok;
    var bar=$('barre');bar.hidden=!ok;if(ok){$('barprix').textContent=t.nom+' · '+eur(unit)}
  }
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  var vu=false;if('IntersectionObserver' in window){new IntersectionObserver(function(e){vu=e[0].isIntersecting;$('barre').classList.toggle('cg-bar-off',vu)},{threshold:.15}).observe($('panneau'))}
  setFmt('v');maj();
})();
'''.replace("__DATA__", DATA).replace("__TAILLES__", TAILLES_JS)

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
