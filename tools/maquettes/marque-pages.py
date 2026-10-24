#!/usr/bin/env python3
"""Maquette « Marque-page en bois gravé » — précommande, série limitée — 11/10/2026. RIEN n'est en ligne.

Gérant : nouveaux produits en PRÉCOMMANDE (stock pas encore arrivé, à commander), marque-pages en bois à pompon doré,
6 bois, personnalisables (dessins à venir, un modèle à la fois ; celui-ci = 6 bois + pompon doré).
Méthode (comme puzzle-photo.py) : fiche ajoutée SUR LA MACHINE SEULEMENT (products.js / productInfo.js / productDates.js,
photos `public/produits/zz-maquette-mp-*.jpg`), site construit + `next start`, capture de /produit/marque-pages-bois,
puis tout remis à l'identique (git checkout + suppression des zz-*). Photos source : docs/maquettes/assets/marque-pages/.

Usage : python3.13 tools/maquettes/marque-pages.py <capture /produit/marque-pages-bois.html>
Sortie : docs/maquettes/marque-pages.html (+ .fragment.html, jamais commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "marque-pages")
SRC = sys.argv[1]


def uri(path, w=900, q=78):
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


src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER, FOOTER, MAIN = src[body_start:i_main], src[j_main:src.rfind("</body>")], src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})" if garder else "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

PHOTOS = {f"zz-maquette-mp-{k}.jpg": k for k in ["nanmu","buis","santal","palissandre","ebene","suanzhi","groupe","ambiance","eventail"]}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom] + ".jpg"))}"'
    p = os.path.join(PUB, chemin.lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith((".jpg", ".jpeg", ".png")) and os.path.getsize(p) > 120_000:
        return f'{m.group(1)}="{uri(p)}"'
    return f'{m.group(1)}="{raw_uri(p)}"'
def next_image(m):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(m.group(1).replace("&amp;", "&")).query)
    return f'src="{q.get("url", [""])[0]}"'
def nettoie(html):
    html = re.sub(r'<button[^>]*>💬 Une question \?</button>', "", html)
    html = re.sub(r'<a[^>]*href="/boutique">🛍️ La boutique</a>', "", html)
    html = re.sub(r'src="(/_next/image\?[^"]+)"', next_image, html)
    html = re.sub(r'\s(?:srcset|srcSet)="[^"]*"', "", html)
    html = re.sub(r'<div class="cf-shot"><img src="https://cdn\.shopify\.com[^"]*"[^>]*/></div>', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
# La grande image porte un id pour le script ; l'« aperçu témoin » texte du site n'a pas de sens ici (pas de texte à graver).
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
MAIN = MAIN.replace("Choisissez votre modèle", "Choisissez votre couleur", 1)
MAIN = MAIN.replace("Dessin gravé (+2 €)", "Dessin gravé (+4 €)").replace("Avec un dessin (+2 €)", "Avec un dessin (+4 €)").replace("choisissez un dessin (+2 €)", "choisissez un dessin ou une photo (+4 €)").replace("Texte gravé (+2 €)", "Texte gravé (+3 €)").replace("un texte (+2 €)", "un texte (+3 €)")  # 23/10 : texte +3 €.replace("un dessin (+2 €), d&#x27;un texte", "un dessin ou une photo (+4 €), d&#x27;un texte")  # 23/10 : dessin ou photo +4 €
# 24/10 (gérant : « intègre les images qu'on a choisies, comme pour le gobelet, avec les numéros ») : les planches du
# gobelet (maquette validée gobelet-configurateur-final.html : dessins 1–74 + cadres 75–103), même façon de choisir que le
# parcours guidé (grille de planches avec légende, toucher = agrandir, numéro, grille repliée + « Changer de dessin »).
# Cadres retenus pour un marque-page (étroit) = ceux que j'ai conseillés : rubans fins 88–91, cartouches 92–94, ornements 96–103.
GOB = open(os.path.join(OUT, "gobelet-configurateur-final.html"), encoding="utf-8").read()
PL = json.loads(re.search(r"var PLANCHES=(\[.*?\]);", GOB).group(1))
CA = [c["src"] for c in json.loads(re.search(r"var CADRES=(\[.*?\]);", GOB).group(1))]
assert len(PL) == 10 and len(CA) == 6
LEG_D = [("1–10", "Fleurs & papillons"), ("11–27", "Roses"), ("28–36", "Volutes & arabesques"), ("37–45", "Cœurs & tiges fleuries"),
         ("46–51", "Fées & clé de sol"), ("52–55", "Fée & coins fleuris"), ("56–58", "Cœurs de couple (prénoms)"),
         ("59–64", "Cœur prénom, plumes, colibri"), ("65–70", "Animaux & oiseaux"), ("71–74", "Colibri, fée, musique")]
LEG_C = [(CA[2], "88–91", "Rubans fins (sur la planche 82–91)"), (CA[3], "92–94", "Cartouches (sur la planche 92–95)"),
         (CA[4], "96–101", "Filets & ornements"), (CA[5], "102–103", "Volutes")]
NUMS_OK = list(range(1, 75)) + list(range(88, 95)) + list(range(96, 104))
def planche(src, a, b, kind, i):
    return (f'<button type="button" class="prc-model" data-kind="{kind}" data-i="{i}"><span class="prc-mn">{a}</span>'
            f'<span class="prc-mimg prc-mimg-photo"><img src="{src}" alt="Planche {a}" loading="lazy"></span>'
            f'<span class="prc-ml">{b}<br><em>n° {a}</em></span></button>')
GRID = ('<div class="mq-dessins" hidden><p class="mq-dh">Choisissez votre dessin</p>'
        '<p class="prc-legend" id="mq-dleg">Touchez une planche pour l\'agrandir et lire les numéros, puis indiquez le numéro. '
        'Un <b>dessin</b> (n° 1 à 74) ou un <b>cadre</b> dans lequel s\'écrit votre texte (n° 88 à 94, 96 à 103).</p>'
        '<div class="prc-grid mq-grid" id="mq-gd">' + "".join(planche(s, a, b, "d", i) for i, (s, (a, b)) in enumerate(zip(PL, LEG_D)))
        + "".join(planche(s, a, b, "c", i) for i, (s, a, b) in enumerate(LEG_C)) + '</div>'
        '<div class="field mq-numf"><label for="mq-num">Numéro du dessin ou du cadre</label>'
        '<input type="number" id="mq-num" min="1" max="103" inputmode="numeric" placeholder="Ex : 12"/></div>'
        '<p class="prc-choisi" id="mq-dok" hidden></p><button type="button" class="prc-change" id="mq-dchg" hidden>Changer de dessin</button>'
        '</div>')
# Place sur le marque-page = les zones données par le gérant le 23/10 (docs/maquettes/assets/marque-pages/zones/) :
# HAUT (sous le trou) = petit dessin · BAS = grand dessin. Même choix pour la photo.
PLACE = ('<div class="field mq-placef" id="mq-placef" hidden><label>Place sur le marque-page</label><div class="prc-chips" id="mq-place">'
         '<button type="button" class="prc-chip on" data-z="haut">En haut, sous le trou <small>(petit)</small></button>'
         '<button type="button" class="prc-chip" data-z="bas">En bas <small>(grand)</small></button></div>'
         '<p class="mq-dn" id="mq-placen">Le texte gravé, s\'il y en a un, prend l\'autre emplacement.</p></div>')
PHOTO = ('<div class="mq-photo" hidden><label class="mq-pbtn">📷 Choisir une photo<input type="file" accept="image/*" hidden/></label>'
         '<span class="mq-photo-ok" hidden>Photo envoyée ✓ — nous la gravons en noir et blanc sur le bois.</span>'
         '<p class="mq-dn">Une photo nette et bien éclairée donne le meilleur résultat : un visage, un animal, une silhouette.</p></div>')
# 23/10, gérant : « dessin OU photo » au même prix (+4 €) → 3ᵉ choix dans le menu + bloc photo.
MAIN = MAIN.replace("Dessin gravé (+4 €)", "Dessin ou photo gravé (+4 €)", 1)
MAIN = re.sub(r'(<option value="oui">Avec un dessin \(\+4 €\)</option>)(</select></div>)', lambda m: m.group(1) + '<option value="photo">Avec ma photo (+4 €)</option>' + m.group(2) + GRID + PHOTO + PLACE, MAIN, count=1)
assert "mq-dessins" in MAIN and "mq-photo" in MAIN and "mq-placef" in MAIN
OLD_BOX = "Une boîte cadeau bleu nuit pour un ou deux marque-pages, une autre pour quatre : chaque marque-page tient dans son élastique."
assert OLD_BOX in MAIN
MAIN = MAIN.replace(OLD_BOX, "Une boîte cadeau bleu nuit pour un, deux ou quatre marque-pages : chaque marque-page tient dans son élastique. La boîte coûte 4,90 € pour un, 5,90 € pour deux, 7,90 € pour quatre.")
FORMATS = [("Seul", "avec son pompon", 1, 0), ("En boîte cadeau", "1 marque-page, boîte bleu nuit", 1, 4.9),
           ("Coffret de 2", "2 marque-pages, boîte bleu nuit", 2, 5.9), ("Coffret de 4", "4 marque-pages, boîte bleu nuit", 4, 7.9)]
def eur(n): return f"{n:.2f}".replace(".", ",") + " €"
BOX_IMG = {1: "boite1", 2: "boite2", 4: "boite4"}
def fmt_card(i, t, sub, n, box):
    img = BOX_IMG[n] if box else None
    pic = f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, img + ".jpg"), 260, 72)}" alt="Boîte cadeau bleu nuit pour {n} marque-page{"s" if n > 1 else ""}"/>' if img else \
          f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, "nanmu.jpg"), 260, 72)}" alt="Marque-page seul avec son pompon"/>'
    return (f'<button type="button" class="mq-fmt{" on" if i == 0 else ""}" data-n="{n}" data-box="{box:g}">{pic}'
            f'<span class="mq-ft"><b>{t}</b><span>{sub}</span><em>{eur(n * 9.9 + box)}</em></span></button>')
FMT = ('<div class="field"><label>Choisissez votre format</label><div class="mq-fmts">' +
       "".join(fmt_card(i, *f) for i, f in enumerate(FORMATS)) + '</div></div>')
RECAP = ('<div class="mq-recap" id="mq-recap" hidden><p class="mq-rtxt"></p><div class="mq-strip"></div>'
         '<button type="button" class="mq-open">Composer mon coffret</button></div>')
GNOTE = '<p class="mq-gnote" id="mq-gnote" hidden>La gravure (texte, dessin) se choisit pour chaque marque-page dans « Composer mon coffret ».</p>'
cle = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
assert cle in MAIN
cle_id = cle.replace('<div style="margin-bottom:6px">', '<div style="margin-bottom:6px" id="mq-grav">')
MAIN = MAIN.replace(cle, FMT + RECAP + GNOTE + cle_id, 1)
# Galerie : les 3 boîtes (1, 2 et 4 marque-pages) remplacent les 2 vignettes de boîte de la capture
j0 = MAIN.index('<div class="gallery-thumbs">'); j1 = MAIN.index("</div>", j0)
btns = re.findall(r"<button.*?</button>", MAIN[j0:j1], flags=re.S)
assert len(btns) == 11, len(btns)
BOXTH = "".join(f'<button class="" aria-label="Voir le visuel {k}"><img src="{uri(os.path.join(ASSETS, n + ".jpg"), 900, 74)}" alt=""/></button>' for k, n in ((10, "boite1"), (11, "boite2"), (12, "boite4")))
MAIN = MAIN[:j0] + '<div class="gallery-thumbs">' + "".join(btns[:9]) + BOXTH + MAIN[j1:]
MAIN = MAIN.replace('<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Précommander</button>', 1)
PRE = ('<div class="mq-pre"><b>Précommande · série limitée</b><span>Les marque-pages sont en cours d\'approvisionnement. '
       'Votre commande est enregistrée dès maintenant, puis gravée à la réception des marque-pages. Quantités limitées.</span></div>')
MAIN = MAIN.replace('<div class="price-lead">', PRE + '<div class="price-lead">', 1)
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)  # (déjà absent avec noEngravePreview)
PRIX = {t: float(re.sub(r"[^0-9,]", "", p).replace(",", ".")) for t, p in
        re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', MAIN)}
assert len(PRIX) == 6, PRIX

CSS = r'''
.mq-recap{margin-top:12px;border:1px solid #e4d9bd;border-radius:14px;background:#fff;padding:12px;display:flex;flex-direction:column;gap:10px}.mq-rtxt{margin:0;font-size:.86rem;color:#5a4d2c;line-height:1.4}
.mq-strip{display:flex;gap:6px;flex-wrap:wrap}.mq-ch{display:flex;flex-direction:column;align-items:center;gap:2px;width:62px}.mq-ch img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.mq-ch small{font-size:.6rem;color:#5a4d2c;text-align:center;line-height:1.1;overflow-wrap:anywhere}.mq-ch b{font-size:.62rem;color:#7c6120;line-height:1.1;text-align:center;overflow-wrap:anywhere}
.mq-open{border:0;border-radius:999px;padding:12px 18px;background:linear-gradient(#c9a24b,#a98935);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.mq-gnote{font-size:.85rem;color:#7a6c48;background:#fbf3df;border-radius:12px;padding:10px 12px;margin:12px 0}.mq-gnote[hidden]{display:none}
.mq-sheet{position:fixed;inset:0;background:rgba(30,24,12,.55);display:flex;align-items:flex-end;justify-content:center;z-index:200}.mq-sheet[hidden]{display:none}
.mq-sheetin{background:#fcfaf4;width:100%;max-width:560px;border-radius:22px 22px 0 0;max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
.mq-shh{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 10px}.mq-shh b{font-family:'Playfair Display',serif;font-size:1.2rem}.mq-shh button{border:0;background:#efe6d2;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer}
.mq-shb{overflow:auto;padding:0 16px 8px;display:flex;flex-direction:column;gap:12px}.mq-shf{padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #e4d9bd;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fcfaf4}.mq-shf b{font-size:1.1rem;color:#a98935;white-space:nowrap}
.mq-sc{border:1px solid #e4d9bd;border-radius:14px;background:#fff;padding:10px;display:flex;flex-direction:column;gap:8px}.mq-sc input[type=text],.mq-shb select{padding:11px 12px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;font-size:.9rem;color:#2b2620}.mq-sc>p{margin:0;font-weight:700;font-size:.9rem}.mq-sc input[type=text],.mq-shb select{width:100%;box-sizing:border-box;min-width:0}.mq-sc label{display:flex;align-items:center;gap:8px;font-size:.85rem;cursor:pointer}.mq-sc label input{width:18px;height:18px;accent-color:#a98935}
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-fmts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.mq-fmt{display:flex;flex-direction:column;align-items:stretch;gap:8px;text-align:left;padding:8px 8px 10px;border:1.5px solid #e4d9bd;border-radius:14px;background:#fff;color:#2b2620;cursor:pointer;font:inherit}.mq-fimg{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block;background:#efe6d2}.mq-ft{display:flex;flex-direction:column;gap:2px;padding:0 4px}.mq-fmt b{font-size:.92rem}.mq-fmt span{font-size:.74rem;color:#7a6c48;line-height:1.3}.mq-fmt em{font-style:normal;font-weight:700;color:#7c6120;margin-top:2px}.mq-fmt.on{border-color:#a98935;background:#fbf3df;box-shadow:0 0 0 1px #a98935 inset}.mq-mixrow{margin:-4px 0 12px}.mq-mixl{display:flex;align-items:center;gap:8px;font-size:.88rem;font-weight:500;cursor:pointer}.mq-mixl input{width:18px;height:18px;accent-color:#a98935}.mq-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 6px}.mq-slot{position:relative;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:1.5px dashed #c9b88a;border-radius:12px;background:#fff;color:#7c6120;font:inherit;cursor:pointer;padding:3px}.mq-slot span{font-family:Playfair Display,serif;font-size:1.2rem}.mq-slot small{font-size:.6rem;color:#8a7a52;line-height:1.1;text-align:center}.mq-slot.full{border-style:solid;border-color:#a98935;background:#fbf3df}.mq-slot img{width:100%;flex:1;min-height:0;object-fit:cover;border-radius:8px}.mq-slot i{position:absolute;top:2px;right:5px;font-style:normal;font-size:.9rem;color:#fff;text-shadow:0 0 3px #000}.mq-hint{font-size:.8rem;color:#8a7a52;margin:0 0 14px}.mq-hint.ok{color:#4f7a3a;font-weight:600}.mq-bois{display:flex;flex-direction:column;gap:12px;margin-top:12px}.mq-bl{font-size:.82rem;color:#7a6c48;margin:0 0 6px}.mq-bl b{color:#2b2620}.mq-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}.mq-c{width:100%;padding:3px;border:1.5px solid #e4d9bd;border-radius:10px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font:inherit}.mq-c img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:7px;display:block}.mq-c span{font-size:.6rem;line-height:1.1;color:#5a4d2c;text-align:center;min-height:2.2em;display:flex;align-items:center}.mq-c.on{border-color:#a98935;box-shadow:0 0 0 1px #a98935 inset;background:#fbf3df}.mq-dessins{margin:-4px 0 14px}.mq-dh{font-weight:600;font-size:.9rem;margin:0 0 8px}.mq-dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}.mq-dtile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1;border:1.5px dashed #c9b88a;border-radius:14px;background:#fff;color:#7c6120;cursor:pointer;font:inherit}.mq-dtile span{font-family:Playfair Display,serif;font-size:1.3rem}.mq-dtile small{font-size:.66rem;color:#8a7a52}.mq-dtile.on{border-style:solid;border-color:#a98935;background:#fbf3df}.mq-dn{font-size:.75rem;color:#8a7a52;margin:8px 0 0}.mq-pre{display:flex;flex-direction:column;gap:4px;margin:10px 0 6px;padding:12px 14px;border:1px solid #c9a24b;border-left-width:4px;border-radius:12px;background:#fbf3df;color:#4a3a14;font-size:.88rem;line-height:1.45}.mq-pre b{color:#7c6120;font-size:.95rem}
.mq-photo-ok{display:block;margin-top:8px;font-size:.85rem;color:var(--gold-dark,#a98935);font-weight:600}.mq-photo{margin:-4px 0 14px}.mq-pbtn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1.5px dashed #c9b88a;border-radius:12px;background:#fff;color:#7c6120;font-weight:600;cursor:pointer}
/* 24/10 : planches du gobelet (classes .prc-* du site) + agrandissement + place */
.mq-dessins [hidden]{display:none!important}.mq-dessins .prc-legend b{color:#2b2620}.mq-grid .prc-mimg{aspect-ratio:3/4;background:#fff}.mq-grid .prc-mimg img{object-position:top}
.mq-grid .prc-model[data-kind="c"] .prc-mimg{aspect-ratio:4/3}.prc-ml em{font-style:normal;font-weight:700;color:var(--gold-dark,#a98935)}
.mq-numf{margin:12px 0 0}.mq-numf input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #e0d3b0;background:#fffdf8;font:inherit}
.mq-placef{margin:14px 0 14px}.mq-placef .prc-chip small{font-weight:400;opacity:.8;margin-left:4px}.mq-placef[hidden]{display:none}
.mq-zoom{position:fixed;inset:0;background:rgba(20,15,8,.72);z-index:5000;display:flex;align-items:center;justify-content:center;padding:14px}
.mq-zoom-in{position:relative;max-width:680px;width:100%;max-height:92vh;overflow:auto;background:#fff;border-radius:12px;padding:10px}
.mq-zoom-in img{width:100%;height:auto;display:block;border-radius:8px}
.mq-zoom-x{position:absolute;top:6px;right:6px;width:38px;height:38px;border-radius:50%;border:0;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);font-size:22px;cursor:pointer;color:#2b2620}
.mq-sc .mq-snum{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mq-sc .mq-snum input{flex:1;min-width:120px;padding:11px 12px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;box-sizing:border-box}.mq-sc .mq-snum select{flex:1;min-width:120px}.mq-sc .mq-snum .mq-voir{margin:0;flex:none}.mq-sc .mq-snum[hidden]{display:none}
'''
JS = r'''
(function(){
  var P=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Caramel',q:1,n:1,box:0,slots:[]};
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  var vin=document.getElementById('pf-texte'),des=document.getElementById('pf-dessin'),grid=document.querySelector('.mq-dessins');
  var WOODS=sw.map(function(b){return b.querySelector('.vs-title').textContent.trim()});
  var IMGS=sw.map(function(b){return b.querySelector('img').src});
  var fm=[].slice.call(document.querySelectorAll('.mq-fmt'));
  var recap=document.getElementById('mq-recap'),gnote=document.getElementById('mq-gnote'),grav=document.getElementById('mq-grav');
  var sheet=document.getElementById('mq-sheet'),shb=document.getElementById('mq-shb'),shn=document.getElementById('mq-shn'),sht=document.getElementById('mq-sht');
  function unit(o){return P[WOODS[o.c]]+(o.t.trim()?3:0)+(o.d?4:0)}
  function base(){if(st.n>1)return st.slots.reduce(function(a,o){return a+unit(o)},0);return P[st.t]+((vin&&vin.value.trim())?3:0)+((des&&(des.value==='oui'||des.value==='photo'))?4:0)}
  function maj(){tot.textContent=eur((base()+st.box)*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;if(shn)shn.textContent=eur(base()+st.box)}
  function reset(){st.slots=[];for(var i=0;i<st.n;i++)st.slots.push({c:WOODS.indexOf(st.t),t:'',d:false,touched:false})}
  function draw(){var on=st.n>1;recap.hidden=gnote.hidden=!on;grav.hidden=on;if(!on)return;
    var st2=recap.querySelector('.mq-strip');st2.innerHTML='';var cust=st.slots.some(function(o){return o.touched||o.t||o.d});
    st.slots.forEach(function(o){var d=document.createElement('span');d.className='mq-ch';d.innerHTML='<img src="'+IMGS[o.c]+'" alt=""/><small>'+WOODS[o.c]+'</small>'+(o.t?'<b>'+o.t.replace(/</g,'&lt;')+'</b>':'')+(o.d?'<b>'+(o.k==='photo'?'photo':(o.n?(estCadre(o.n)?'cadre n° ':'dessin n° ')+o.n:'dessin ?'))+'</b>':'');st2.appendChild(d)});
    recap.querySelector('.mq-rtxt').textContent=cust?'Votre coffret de '+st.n+' marque-pages :':'Votre coffret de '+st.n+' marque-pages, tous de couleur '+WOODS[st.slots[0].c].toLowerCase()+'. Changez la couleur et la gravure de chacun si vous voulez :'}
  function cards(){shb.innerHTML='';sht.textContent='Mon coffret de '+st.n;
    st.slots.forEach(function(o,i){var d=document.createElement('div');d.className='mq-sc';
      d.innerHTML='<p>Marque-page '+(i+1)+'</p><div class="mq-row"></div><input type="text" maxlength="24" placeholder="Texte gravé (+3 €), facultatif"/><select class="mq-dsel"><option value="">Sans dessin ni photo</option><option value="oui">Avec un dessin (+4 €)</option><option value="photo">Avec ma photo (+4 €)</option></select>'
        +'<div class="mq-snum" hidden><input type="number" class="mq-sn" min="1" max="103" inputmode="numeric" placeholder="N° du dessin ou du cadre"/><select class="mq-sp"><option value="haut">En haut (petit)</option><option value="bas">En bas (grand)</option></select><button type="button" class="prc-change mq-voir">Voir les planches</button></div>';
      d.querySelector('.mq-voir').addEventListener('click',zoomAll);
      var sn=d.querySelector('.mq-snum'),sni=d.querySelector('.mq-sn'),snp=d.querySelector('.mq-sp');sni.value=o.n||'';snp.value=o.p||'haut';
      sni.addEventListener('input',function(){var n=parseInt(sni.value,10);o.n=numOk(n)?n:0;sni.style.borderColor=(sni.value&&!o.n)?'#b4552f':''});snp.addEventListener('change',function(){o.p=snp.value});
      var row=d.querySelector('.mq-row');
      WOODS.forEach(function(w,k){var c=document.createElement('button');c.type='button';c.className='mq-c'+(k===o.c?' on':'');c.setAttribute('aria-label',w);c.innerHTML='<img src="'+IMGS[k]+'" alt=""/><span>'+w+'</span>';
        c.addEventListener('click',function(){o.c=k;o.touched=true;[].forEach.call(row.children,function(x,j){x.classList.toggle('on',j===k)});maj()});row.appendChild(c)});
      var ti=d.querySelector('input[type=text]');ti.value=o.t;ti.addEventListener('input',function(){o.t=ti.value;o.touched=true;maj()});
      var cb=d.querySelector('.mq-dsel');cb.value=o.d?(o.k||'oui'):'';sn.hidden=cb.value!=='oui';if(cb.value==='photo'){sn.hidden=false;sni.hidden=true}
      cb.addEventListener('change',function(){o.d=!!cb.value;o.k=cb.value;o.touched=true;sn.hidden=!cb.value;sni.hidden=cb.value==='photo';maj()});
      shb.appendChild(d)});
    var pol=document.getElementById('pf-police');if(pol){var w=document.createElement('div');w.className='mq-sc';w.innerHTML='<p>Écriture du texte (la même pour tout le coffret)</p>';var c=pol.cloneNode(true);c.removeAttribute('id');w.appendChild(c);shb.appendChild(w)}}
  function ouvre(){cards();maj();sheet.hidden=false}
  function ferme(){sheet.hidden=true;draw();maj()}
  document.querySelector('.mq-open').addEventListener('click',ouvre);
  document.getElementById('mq-close').addEventListener('click',ferme);document.getElementById('mq-ok').addEventListener('click',ferme);
  fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;reset();draw();
    if(st.box){montre(th[{1:9,2:10,4:11}[st.n]])}else{montre(th[WOODS.indexOf(st.t)])}maj()})});
  if(vin)vin.addEventListener('input',maj);
  var pho=document.querySelector('.mq-photo'),placef=document.getElementById('mq-placef');
  if(des)des.addEventListener('change',function(){if(grid)grid.hidden=des.value!=='oui';if(pho)pho.hidden=des.value!=='photo';if(placef)placef.hidden=!(des.value==='oui'||des.value==='photo');maj()});
  if(pho){var pf=pho.querySelector('input[type=file]');pf.addEventListener('change',function(){pho.querySelector('.mq-photo-ok').hidden=!pf.files.length})}
  // Planches (comme le gobelet) : toucher = agrandir ; le numéro se tape ; la grille se replie sur le choix.
  var OK=__NUMS__;function numOk(n){return OK.indexOf(n)>=0}function estCadre(n){return n>=75}
  function zoom(src){var o=document.createElement('div');o.className='mq-zoom';o.innerHTML='<div class="mq-zoom-in"><button type="button" class="mq-zoom-x" aria-label="Fermer">×</button><img alt=""/></div>';o.querySelector('img').src=src;
    o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)}
  function zoomAll(){var o=document.createElement('div');o.className='mq-zoom';var inn=document.createElement('div');inn.className='mq-zoom-in';inn.innerHTML='<button type="button" class="mq-zoom-x" aria-label="Fermer">×</button><p class="mq-dh">Les planches : repérez le numéro, puis tapez-le.</p>';
    [].forEach.call(document.querySelectorAll('#mq-gd .prc-model'),function(b){var im=document.createElement('img');im.src=b.querySelector('img').src;im.alt='';im.style.marginBottom='10px';inn.appendChild(im)});o.appendChild(inn);
    o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)}
  var gd=document.getElementById('mq-gd'),num=document.getElementById('mq-num'),dok=document.getElementById('mq-dok'),dchg=document.getElementById('mq-dchg'),dleg=document.getElementById('mq-dleg');
  st.num=0;
  if(gd){[].forEach.call(gd.querySelectorAll('.prc-model'),function(b){b.addEventListener('click',function(){[].forEach.call(gd.querySelectorAll('.prc-model'),function(x){x.classList.toggle('on',x===b)});zoom(b.querySelector('img').src)})});
    function plier(v){gd.hidden=v;dleg.hidden=v;dchg.hidden=!v}
    num.addEventListener('input',function(){var n=parseInt(num.value,10);st.num=numOk(n)?n:0;dok.hidden=!num.value;
      dok.textContent=st.num?(estCadre(st.num)?'Cadre n° '+st.num+' choisi ✓ — votre texte gravé (+3 €) s\'écrit au milieu du cadre.':'Dessin n° '+st.num+' choisi ✓'):'Numéro : 1 à 74 pour un dessin, 88 à 94 ou 96 à 103 pour un cadre.';
      dok.classList.toggle('prc-miss',!st.num)});
    num.addEventListener('change',function(){if(st.num)plier(true)});num.addEventListener('keydown',function(e){if(e.key==='Enter'&&st.num){e.preventDefault();plier(true)}});
    dchg.addEventListener('click',function(){plier(false);gd.scrollIntoView({behavior:'smooth',block:'start'})})}
  st.place='haut';var placen=document.getElementById('mq-placen');
  [].forEach.call(document.querySelectorAll('#mq-place .prc-chip'),function(b){b.addEventListener('click',function(){st.place=b.dataset.z;[].forEach.call(document.querySelectorAll('#mq-place .prc-chip'),function(x){x.classList.toggle('on',x===b)});
    placen.textContent=st.place==='haut'?'Le texte gravé, s\'il y en a un, s\'écrit en bas, à la verticale.':'Le texte gravé, s\'il y en a un, s\'écrit en haut, sur une ligne.'})});
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();var k=sw.indexOf(b);if(th[k])montre(th[k]);var im=fm[0].querySelector('.mq-fimg');if(im)im.src=IMGS[k];
    st.slots.forEach(function(o){if(!o.touched)o.c=k});draw();maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  if(th[0])th[0].classList.add('active');
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  reset();draw();maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX, ensure_ascii=False)).replace("__NUMS__", json.dumps(NUMS_OK))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Marque-page en bois personnalisé » (précommande · dessins numérotés du gobelet, 24/10) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Marque-page en bois personnalisé — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
SHEET = ('<div class="mq-sheet" id="mq-sheet" hidden><div class="mq-sheetin"><div class="mq-shh"><b id="mq-sht">Mon coffret</b><button type="button" id="mq-close" aria-label="Fermer">×</button></div>'
         '<div class="mq-shb" id="mq-shb"></div><div class="mq-shf"><span>Total du coffret<br><b id="mq-shn">0,00 €</b></span><button type="button" class="mq-open" id="mq-ok">Valider mon coffret</button></div></div></div>')
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + SHEET + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "marque-pages.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
