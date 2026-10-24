#!/usr/bin/env python3
"""Maquette « Marque-page ajouré, oiseau et magnolia » (modèle 2) — précommande — 11/10/2026. RIEN n'est en ligne.

Gérant : 4 photos d'un 2ᵉ modèle (demi-lune ajourée, oiseau bleu imprimé, cordon à perles de verre) en 4 couleurs + le coffret des 4 couleurs ;
il manquait la photo seule d'une couleur (sable) → recadrée du coffret (docs/maquettes/assets/marque-pages-fenetre/). Même méthode que marque-pages.py.
Usage : python3.13 tools/maquettes/marque-pages-fenetre.py <capture /produit/marque-pages-fenetre-oiseau.html>
Sortie : docs/maquettes/marque-pages-fenetre.html (+ .fragment.html, jamais commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mp_apercu  # 24/10 : aperçu face / dos

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "marque-pages-fenetre")
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

PHOTOS = {f"zz-maquette-mf-{k}.jpg": k for k in ["blond","roux","sable","noir","groupe"]}
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
# 12/10 : modèle plus travaillé (ajouré + imprimé) → un peu plus cher que le modèle 1 (9,90 €) ; fixé à 13,90 € par le gérant le 12/10
PU = 13.9
# 23/10, gérant : « il faut que ce soit logique, le dos aussi : 3 € le texte » (comme le modèle 1).
MAIN = MAIN.replace("au verso (+2 €)", "au verso (+3 €)")
MAIN = re.sub(r"9,90(\s|\u202f|\u00a0)€", lambda m: "13,90" + m.group(1) + "€", MAIN)
# La grande image porte un id pour le script ; l'« aperçu témoin » texte du site n'a pas de sens ici (pas de texte à graver).
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
MAIN = MAIN.replace("Choisissez votre modèle", "Choisissez votre couleur", 1)
FORMATS = [("Seul", "avec son cordon à perles de verre", 1, 0), ("En boîte cadeau", "1 marque-page, boîte bleu nuit", 1, 4.9),
           ("Coffret de 2", "2 marque-pages, boîte bleu nuit", 2, 5.9), ("Coffret de 4", "4 marque-pages, boîte bleu nuit", 4, 7.9)]
def eur(n): return f"{n:.2f}".replace(".", ",") + " €"
BOX_IMG = {1: "boite1", 2: "boite2", 4: "boite4"}
def fmt_card(i, t, sub, n, box):
    img = BOX_IMG[n] if box else None
    pic = f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, img + ".jpg"), 260, 72)}" alt="Boîte cadeau bleu nuit pour {n} marque-page{"s" if n > 1 else ""}"/>' if img else \
          f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, "blond.jpg"), 260, 72)}" alt="Marque-page seul avec son cordon"/>'
    return (f'<button type="button" class="mq-fmt{" on" if i == 0 else ""}" data-n="{n}" data-box="{box:g}">{pic}'
            f'<span class="mq-ft"><b>{t}</b><span>{sub}</span><em>{eur(n * PU + box)}</em></span></button>')
FMT = ('<div class="field"><label>Choisissez votre format</label><div class="mq-fmts">' +
       "".join(fmt_card(i, *f) for i, f in enumerate(FORMATS)) + '</div></div>')
RECAP = ('<div class="mq-recap" id="mq-recap" hidden><p class="mq-rtxt"></p><div class="mq-strip"></div>'
         '<button type="button" class="mq-open">Voir et personnaliser mon coffret</button></div>')
GNOTE = '<p class="mq-gnote" id="mq-gnote" hidden>Les marque-pages du coffret sont de couleurs différentes : vous pouvez en changer et faire graver chacun — un texte sur la face (+3 €), un texte au verso (+3 €), un dessin ou une photo au verso (+4 €) — dans « Voir et personnaliser mon coffret ».</p>'
cle = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
assert cle in MAIN
cle_id = cle.replace('<div style="margin-bottom:6px">', '<div style="margin-bottom:6px" id="mq-grav">')
MAIN = MAIN.replace(cle, FMT + RECAP + GNOTE + cle_id, 1)
# 23/10, gérant : « la face se grave aussi » puis « pas de dessin, il y a déjà un dessin : que du texte » (zones : HAUT au-dessus
# de la fenêtre ajourée, BAS à gauche de la branche ; texte en haut = horizontal, en bas = à la verticale). Texte +3 € comme le modèle 1.
OPT = '<span style="color:var(--ink-soft);font-weight:400"> (facultatif)</span>'
FACE = ('<p class="mq-sub">Sur la face</p>'
        f'<div class="field"><label for="pf-face">Texte gravé sur la face (+3 €){OPT}</label>'
        '<input id="pf-face" type="text" placeholder="Ex : Léa" maxLength="24" value=""/><span class="char-count">0/24</span></div>'
        '<div class="field"><label for="pf-place">Place sur la face</label><select id="pf-place">'
        '<option value="haut" selected="">Au-dessus de la fenêtre, sur une ligne</option>'
        '<option value="bas">À côté de la fenêtre, à la verticale</option></select>'
        '<p class="mq-dn">Le dessin de la face est déjà là : seul un texte s\'y ajoute, dans le bois libre.</p></div>'
        '<p class="mq-sub">Au verso</p>')
VERSO = '<div class="field"><label for="pf-texte">Texte gravé au verso (+3 €)'
assert VERSO in MAIN
MAIN = MAIN.replace(VERSO, FACE + VERSO, 1)
# 24/10 (gérant : « pareil pour les deux maquettes : au-dessus, au milieu ou derrière » + un aperçu) : place du texte au verso
# (en haut sur une ligne / au milieu à la verticale) et l'aperçu face + dos sous les champs.
TXT_END = '<span class="char-count">0<!-- -->/<!-- -->24</span></div>'
assert MAIN.count(TXT_END) == 1
VPLACE = ('<div class="field" id="mq-vplacef"><label for="pf-vplace">Place du texte au verso</label><select id="pf-vplace">'
          '<option value="haut" selected="">En haut, sur une ligne</option><option value="bas">Au milieu, à la verticale</option></select></div>')
# 24/10 soir (gérant : « pour la maquette 2, mettre l'option pour graver des logos etc. au dos, comme t'as fait pour le 1 : il y a de
# la place, on peut graver derrière ») : dessin numéroté / cadre / photo au VERSO SEULEMENT (+4 €, comme le modèle 1), avec les
# planches du gobelet (même parcours que le modèle 1 : planche agrandie au toucher, numéro tapé, grille repliée), place en haut
# (petit) / au milieu (grand). La face reste TEXTE seul (23/10 : « il y a déjà un dessin »). Cadres retenus : 88–94, 96–103.
GOB = open(os.path.join(OUT, "gobelet-configurateur-final.html"), encoding="utf-8").read()
PL = json.loads(re.search(r"var PLANCHES=(\[.*?\]);", GOB).group(1))
CA = [c["src"] for c in json.loads(re.search(r"var CADRES=(\[.*?\]);", GOB).group(1))]
assert len(PL) == 10 and len(CA) == 6
LEG_D = [("1–10", "Fleurs & papillons"), ("11–27", "Roses"), ("28–36", "Volutes & arabesques"), ("37–45", "Cœurs & tiges fleuries"),
         ("46–51", "Fées & clé de sol"), ("52–55", "Fée & coins fleuris"), ("56–58", "Cœurs de couple (prénoms)"),
         ("59–64", "Cœur prénom, plumes, colibri"), ("65–70", "Animaux & oiseaux"), ("71–74", "Colibri, fée, musique")]
LEG_C = [(CA[2], "88–91", "Rubans fins (sur la planche 82–91)"), (CA[3], "92–94", "Cartouches (sur la planche 92–95)"),
         (CA[4], "96, 98, 100, 101", "Filets & ornements"), (CA[5], "102", "Volute")]
NUMS_OK = list(range(1, 75)) + list(range(88, 95)) + [96, 98, 100, 101, 102]  # 24/10 soir : 97, 99, 103 n'existent pas (cadres doubles)
def planche(src, a, b, kind, i):
    return (f'<button type="button" class="prc-model" data-kind="{kind}" data-i="{i}"><span class="prc-mn">{a}</span>'
            f'<span class="prc-mimg prc-mimg-photo"><img src="{src}" alt="Planche {a}" loading="lazy"></span>'
            f'<span class="prc-ml">{b}<br><em>n° {a}</em></span></button>')
GRID = ('<div class="mq-dessins" hidden><p class="mq-dh">Choisissez votre dessin pour le verso</p>'
        '<p class="prc-legend" id="mq-dleg">Touchez une planche pour l\'agrandir et lire les numéros, puis indiquez le numéro. '
        'Un <b>dessin</b> (n° 1 à 74) ou un <b>cadre</b> dans lequel s\'écrit votre texte du verso (n° 88 à 94, 96, 98, 100 à 102).</p>'
        '<div class="prc-grid mq-grid" id="mq-gd">' + "".join(planche(s_, a, b, "d", i) for i, (s_, (a, b)) in enumerate(zip(PL, LEG_D)))
        + "".join(planche(s_, a, b, "c", i) for i, (s_, a, b) in enumerate(LEG_C)) + '</div>'
        '<div class="field mq-numf"><label for="mq-num">Numéro du dessin ou du cadre</label>'
        '<input type="number" id="mq-num" min="1" max="102" inputmode="numeric" placeholder="Ex : 12"/></div>'
        '<p class="prc-choisi" id="mq-dok" hidden></p><button type="button" class="prc-change" id="mq-dchg" hidden>Changer de dessin</button>'
        '</div>')
PHOTO = ('<div class="mq-photo" hidden><label class="mq-pbtn">📷 Choisir une photo<input type="file" accept="image/*" hidden/></label>'
         '<span class="mq-photo-ok" hidden>Photo envoyée ✓ — nous la gravons en noir et blanc sur le bois, au verso.</span>'
         '<p class="mq-dn">Une photo nette et bien éclairée donne le meilleur résultat : un visage, un animal, une silhouette.</p></div>')
VDES = (f'<div class="field"><label for="pf-vdes">Dessin ou photo gravé au verso (+4 €){OPT}</label><select id="pf-vdes">'
        '<option value="" selected="">Sans dessin ni photo</option><option value="oui">Avec un dessin ou un cadre (+4 €)</option>'
        '<option value="photo">Avec ma photo (+4 €)</option></select>'
        '<p class="mq-dn">Le verso est en bois nu : un dessin numéroté, un cadre autour de votre texte, ou votre photo.</p></div>')
DPLACE = ('<div class="field mq-placef" id="mq-dplacef" hidden><label>Où graver le dessin au verso ?</label><div class="prc-chips mq-pl" id="mq-dplace">'
          '<button type="button" class="prc-chip" data-z="haut">En haut <small>(petit)</small></button>'
          '<button type="button" class="prc-chip on" data-z="bas">Au milieu <small>(grand)</small></button></div>'
          '<p class="mq-dn">Le texte du verso prend l\'autre place. Avec un cadre, le texte s\'écrit au milieu du cadre.</p></div>')
MAIN = MAIN.replace(TXT_END, TXT_END + VPLACE + VDES + GRID + PHOTO + DPLACE, 1)
assert "mq-dessins" in MAIN and "mq-photo" in MAIN and "mq-dplacef" in MAIN
OLD_H = "<h3>Le coffret des quatre couleurs</h3>"
assert OLD_H in MAIN
i0 = MAIN.index(OLD_H); i1 = MAIN.index("</p>", i0) + 4
OLD_V = "<h3>Un texte au verso</h3>"
assert OLD_V in MAIN
v0 = MAIN.index(OLD_V); v1 = MAIN.index("</p>", v0) + 4
MAIN = MAIN[:v0] + "<h3>Gravé sur la face et au verso</h3><p>Sur la face, deux emplacements dans le bois : au-dessus de la fenêtre ajourée et à gauche de la branche. Faites-y graver un prénom ou un mot (+3 €), en haut sur une ligne ou en bas, écrit à la verticale. Le dessin de l'oiseau est déjà là : aucun autre dessin ne s'y ajoute. Au verso, le bois est nu : un texte (+3 €) dans l'écriture de votre choix parmi les huit du site, et si vous le souhaitez un dessin numéroté, un cadre autour de votre texte ou votre photo gravée en noir et blanc (+4 €), en haut ou au milieu.</p>" + MAIN[v1:]
MAIN = MAIN[:i0] + "<h3>Offrez-le en boîte cadeau</h3><p>Une boîte cadeau bleu nuit pour un ou deux marque-pages, une autre pour quatre : chaque marque-page tient dans son élastique. La boîte coûte 4,90 € pour un, 5,90 € pour deux, 7,90 € pour quatre.</p>" + MAIN[i1:]
BOXTH = "".join(f'<button class="" aria-label="Voir le visuel {k}"><img src="{uri(os.path.join(ASSETS, n + ".jpg"), 900, 74)}" alt=""/></button>' for k, n in ((6, "boite1"), (7, "boite2"), (8, "boite4")))
MAIN = MAIN.replace('<div class="gallery-thumbs">', '<div class="gallery-thumbs">', 1)
j0 = MAIN.index('<div class="gallery-thumbs">'); j1 = MAIN.index("</div>", j0)
GALAP = '<div class="mq-galap" id="mq-galap" hidden><div class="mq-apw" data-h="520"></div><p class="mq-galap-l">Votre aperçu, dans la couleur choisie — touchez un marque-page pour l\'agrandir</p></div>'
THAP = '<button type="button" class="mq-thap" aria-label="Votre aperçu"><span>Votre<br>aperçu</span></button>'
MAIN = MAIN[:j1] + BOXTH + THAP + MAIN[j1:]
# 24/10 soir (gérant : « comme pour le carnet, l'aperçu sur le côté ») : l'aperçu face + dos dans la grande photo, couleur choisie.
MAIN = re.sub(r'(<img[^>]*id="galmain"[^>]*>)', lambda m: m.group(1) + GALAP, MAIN, count=1)
assert "mq-galap" in MAIN
MAIN = MAIN.replace('<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Précommander</button>', 1)
PRE = ('<div class="mq-pre"><b>Précommande · série limitée</b><span>Les marque-pages sont en cours d\'approvisionnement. '
       'Votre commande est enregistrée dès maintenant, puis gravée à la réception des marque-pages. Quantités limitées.</span></div>')
MAIN = MAIN.replace('<div class="price-lead">', PRE + '<div class="price-lead">', 1)
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)  # (déjà absent avec noEngravePreview)
PRIX = {t: float(re.sub(r"[^0-9,]", "", p).replace(",", ".")) for t, p in
        re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', MAIN)}
assert len(PRIX) == 4, PRIX

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
.mq-dessins [hidden]{display:none!important}.mq-dessins .prc-legend b{color:#2b2620}.mq-grid .prc-mimg{aspect-ratio:3/4;background:#fff}.mq-grid .prc-mimg img{object-position:top}
.mq-grid .prc-model[data-kind="c"] .prc-mimg{aspect-ratio:4/3}.prc-ml em{font-style:normal;font-weight:700;color:var(--gold-dark,#a98935)}
.mq-numf{margin:12px 0 0}.mq-numf input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #e0d3b0;background:#fffdf8;font:inherit}
.mq-placef{margin:14px 0 14px}.mq-placef .prc-chip small{font-weight:400;opacity:.8;margin-left:4px}.mq-placef[hidden]{display:none}
.mq-zoom{position:fixed;inset:0;background:rgba(20,15,8,.72);z-index:5000;display:flex;align-items:center;justify-content:center;padding:14px}
.mq-zoom-in{position:relative;max-width:680px;width:100%;max-height:92vh;overflow:auto;background:#fff;border-radius:12px;padding:10px}
.mq-zoom-in img{width:100%;height:auto;display:block;border-radius:8px}
.mq-zoom-x{position:absolute;top:6px;right:6px;width:38px;height:38px;border-radius:50%;border:0;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);font-size:22px;cursor:pointer;color:#2b2620}
.mq-pl .prc-chip[disabled]{opacity:.38;cursor:not-allowed}.mq-sc select.mq-plsel{width:100%;box-sizing:border-box}
.mq-sc .mq-snum{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mq-sc .mq-snum input{flex:1;min-width:120px;padding:11px 12px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;box-sizing:border-box}.mq-sc .mq-snum select{flex:1;min-width:120px}.mq-sc .mq-snum .mq-voir{margin:0;flex:none}.mq-sc .mq-snum[hidden]{display:none}
.mq-photo-ok{display:block;margin-top:8px;font-size:.85rem;color:var(--gold-dark,#a98935);font-weight:600}.mq-photo{margin:-4px 0 14px}.mq-pbtn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1.5px dashed #c9b88a;border-radius:12px;background:#fff;color:#7c6120;font-weight:600;cursor:pointer}.mq-sub{font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:#7c6120;font-weight:700;margin:14px 0 8px}.mq-sc .mq-dsel{padding:11px 12px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;font-size:.9rem;color:#2b2620;width:100%;box-sizing:border-box}
'''
JS = r'''
(function(){
  var P=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Blond clair',q:1,n:1,box:0,slots:[],dz:'bas',num:0,photoSrc:null,same:false,cur:0};
  var gm=document.querySelector('.gallery-main'),galap=document.getElementById('mq-galap'),thap=document.querySelector('.mq-thap'),stepper=null;
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  var vin=document.getElementById('pf-texte'),fac=document.getElementById('pf-face'),pla=document.getElementById('pf-place'),vpl=document.getElementById('pf-vplace'),vplf=document.getElementById('mq-vplacef'),polSel=document.getElementById('pf-police'),vdes=document.getElementById('pf-vdes');
  function polCls(){var v=polSel&&polSel.value;return v?'fnt-'+v:'fnt-playfair'}
  function itemsPrincipal(){var it=[],k=vdes?vdes.value:'';if(fac&&fac.value.trim())it.push({kind:'texte',text:fac.value,font:polCls(),side:'face',zone:pla?pla.value:'haut'});
    if(k==='oui'&&st.num)it.push({kind:'dessin',num:st.num,text:vin?vin.value:'',font:polCls(),side:'dos',zone:st.dz});
    if(k==='photo')it.push({kind:'photo',src:st.photoSrc,side:'dos',zone:st.dz});
    if(vin&&vin.value.trim()&&!(k==='oui'&&st.num>=75))it.push({kind:'texte',text:vin.value,font:polCls(),side:'dos',zone:vpl?vpl.value:'haut'});return it}
  // Le dessin et le texte du verso ne prennent jamais la même place (sauf un cadre : le texte s'écrit dedans).
  function majChips(){var k=vdes?vdes.value:'',dOn=(k==='oui'||k==='photo'),cadre=(k==='oui'&&st.num>=75),vt=!!(vin&&vin.value.trim());
    if(vplf)vplf.hidden=cadre;
    [].forEach.call(document.querySelectorAll('#mq-dplace .prc-chip'),function(b){b.disabled=vt&&!cadre&&b.dataset.z===(vpl?vpl.value:'haut');b.classList.toggle('on',b.dataset.z===st.dz)});
    if(vpl){[].forEach.call(vpl.options,function(o){o.disabled=dOn&&!cadre&&o.value===st.dz});if(dOn&&!cadre&&vpl.value===st.dz)vpl.value=(st.dz==='haut')?'bas':'haut'}}
  function apercu(){if(!galap)return;var it=itemsPrincipal();if(st.n>1||!it.length){galap.hidden=true;if(thap)thap.classList.remove('active');return}
    window.mqApercu(galap.querySelector('.mq-apw'),it,Math.round((gm.clientHeight||600)*0.9),st.t);galap.hidden=false;th.forEach(function(x){x.classList.remove('active')});if(thap)thap.classList.add('active')}
  function copyAll(){var a=st.slots[0];st.slots.slice(1).forEach(function(o){o.f=a.f;o.fp=a.fp;o.t=a.t;o.vp=a.vp;o.d=a.d;o.k=a.k;o.n=a.n;o.dp=a.dp;if(o.sync)o.sync()})}
  var WOODS=sw.map(function(b){return b.querySelector('.vs-title').textContent.trim()});
  var IMGS=sw.map(function(b){return b.querySelector('img').src});
  var fm=[].slice.call(document.querySelectorAll('.mq-fmt'));
  var recap=document.getElementById('mq-recap'),gnote=document.getElementById('mq-gnote'),grav=document.getElementById('mq-grav');
  var sheet=document.getElementById('mq-sheet'),shb=document.getElementById('mq-shb'),shn=document.getElementById('mq-shn'),sht=document.getElementById('mq-sht');
  function unit(o){return P[WOODS[o.c]]+(o.t.trim()?3:0)+(o.f.trim()?3:0)+(o.d?4:0)}
  function base(){if(st.n>1)return st.slots.reduce(function(a,o){return a+unit(o)},0);return P[st.t]+((vin&&vin.value.trim())?3:0)+((fac&&fac.value.trim())?3:0)+((vdes&&(vdes.value==='oui'||vdes.value==='photo'))?4:0)}
  function maj(){if(st.same&&st.n>1)copyAll();if(stepper)stepper.refresh(function(o){return !!(o.t||o.f||o.d)});tot.textContent=eur((base()+st.box)*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;if(shn)shn.textContent=eur(base()+st.box);majChips();apercu()}
  function reset(){st.slots=[];for(var i=0;i<st.n;i++)st.slots.push({c:st.n>1?i%WOODS.length:WOODS.indexOf(st.t),t:'',f:'',d:false,k:'',n:0,dp:'bas',touched:false})}
  function draw(){var on=st.n>1;recap.hidden=gnote.hidden=!on;grav.hidden=on;if(!on)return;
    var st2=recap.querySelector('.mq-strip');st2.innerHTML='';var cust=st.slots.some(function(o){return o.touched||o.t||o.f||o.d});
    st.slots.forEach(function(o){var d=document.createElement('span');d.className='mq-ch';d.innerHTML='<img src="'+IMGS[o.c]+'" alt=""/><small>'+WOODS[o.c]+'</small>'+(o.f?'<b>'+o.f.replace(/</g,'&lt;')+'</b>':'')+(o.t?'<b>verso : '+o.t.replace(/</g,'&lt;')+'</b>':'')+(o.d?'<b>'+(o.k==='photo'?'photo au verso':(o.n?(estCadre(o.n)?'cadre n° ':'dessin n° ')+o.n+' au verso':'dessin ?'))+'</b>':'');st2.appendChild(d)});
    recap.querySelector('.mq-rtxt').textContent=cust?'Votre coffret de '+st.n+' marque-pages :':'Votre coffret de '+st.n+' marque-pages, de couleurs différentes. Vous pouvez changer une couleur ou faire graver chacun (face et verso) :'}
  function cards(){shb.innerHTML='';sht.textContent='Mon coffret de '+st.n;var els=[];
    st.slots.forEach(function(o,i){var d=document.createElement('div');d.className='mq-sc';
      d.innerHTML='<p>Marque-page '+(i+1)+' <small class="mq-scc"></small></p><div class="mq-row"></div><p class="mq-lock-note" hidden>Gravé comme le marque-page 1 — décochez « la même gravure » pour le changer.</p>'
        +'<div class="mq-grav"><input type="text" class="mq-f" maxlength="24" placeholder="Texte gravé sur la face (+3 €), facultatif"/><select class="mq-dsel mq-fp" hidden><option value="haut">Face : au-dessus de la fenêtre</option><option value="bas">Face : à côté de la fenêtre (vertical)</option></select><input type="text" class="mq-v" maxlength="24" placeholder="Texte gravé au verso (+3 €), facultatif"/><select class="mq-dsel mq-vp" hidden><option value="haut">Verso : en haut</option><option value="bas">Verso : au milieu (vertical)</option></select><select class="mq-dsel mq-ds"><option value="">Sans dessin ni photo au verso</option><option value="oui">Avec un dessin ou un cadre au verso (+4 €)</option><option value="photo">Avec ma photo au verso (+4 €)</option></select><div class="mq-snum" hidden><input type="number" class="mq-sn" min="1" max="102" inputmode="numeric" placeholder="N° du dessin ou du cadre"/><select class="mq-dsel mq-sp mq-plsel"><option value="bas">Dessin : au milieu (grand)</option><option value="haut">Dessin : en haut (petit)</option></select><button type="button" class="prc-change mq-voir">Voir les planches</button></div></div>'
        +'<div class="mq-ap"><div class="mq-apw" data-h="300"></div></div>';
      var row=d.querySelector('.mq-row');
      o.fp=o.fp||'haut';o.vp=o.vp||'haut';o.dp=o.dp||'bas';
      var fp=d.querySelector('.mq-fp'),vp=d.querySelector('.mq-vp'),aph=d.querySelector('.mq-apw'),scc=d.querySelector('.mq-scc');
      var ds=d.querySelector('.mq-ds'),sn=d.querySelector('.mq-snum'),sni=d.querySelector('.mq-sn'),snp=d.querySelector('.mq-sp');
      d.querySelector('.mq-voir').addEventListener('click',zoomAll);
      function slotItems(){var it=[],cadre=o.d&&o.k==='oui'&&o.n>=75;if((o.f||'').trim())it.push({kind:'texte',text:o.f,font:polCls(),side:'face',zone:o.fp});
        if(o.d&&o.k==='oui'&&o.n)it.push({kind:'dessin',num:o.n,text:o.t,font:polCls(),side:'dos',zone:o.dp});if(o.d&&o.k==='photo')it.push({kind:'photo',side:'dos',zone:o.dp});
        if((o.t||'').trim()&&!cadre)it.push({kind:'texte',text:o.t,font:polCls(),side:'dos',zone:o.vp});return it}
      function ap(){fp.hidden=!(o.f||'').trim();var cadre=o.d&&o.k==='oui'&&o.n>=75;vp.hidden=!(o.t||'').trim()||cadre;if(o.d&&!cadre&&(o.t||'').trim()&&o.dp===o.vp){o.vp=(o.dp==='haut')?'bas':'haut';vp.value=o.vp}scc.textContent='· '+WOODS[o.c];window.mqApercu(aph,slotItems(),300,WOODS[o.c])}
      o.ap=ap;
      var ti=d.querySelector('.mq-v'),tf=d.querySelector('.mq-f');
      o.sync=function(){tf.value=o.f||'';ti.value=o.t||'';fp.value=o.fp;vp.value=o.vp;ds.value=o.d?(o.k||'oui'):'';sn.hidden=ds.value!=='oui';sni.hidden=false;if(ds.value==='photo'){sn.hidden=false;sni.hidden=true}sni.value=o.n||'';snp.value=o.dp;ap()};
      WOODS.forEach(function(w,k){var c=document.createElement('button');c.type='button';c.className='mq-c'+(k===o.c?' on':'');c.setAttribute('aria-label',w);c.innerHTML='<img src="'+IMGS[k]+'" alt=""/><span>'+w+'</span>';
        c.addEventListener('click',function(){o.c=k;o.touched=true;[].forEach.call(row.children,function(x,j){x.classList.toggle('on',j===k)});maj();ap()});row.appendChild(c)});
      ds.addEventListener('change',function(){o.d=!!ds.value;o.k=ds.value;o.touched=true;sn.hidden=!ds.value;sni.hidden=ds.value==='photo';maj();ap()});
      sni.addEventListener('input',function(){var n=parseInt(sni.value,10);o.n=numOk(n)?n:0;sni.style.borderColor=(sni.value&&!o.n)?'#b4552f':'';maj();ap()});snp.addEventListener('change',function(){o.dp=snp.value;maj();ap()});
      ti.addEventListener('input',function(){o.t=ti.value;o.touched=true;maj();ap()});
      tf.addEventListener('input',function(){o.f=tf.value;o.touched=true;maj();ap()});
      fp.addEventListener('change',function(){o.fp=fp.value;maj();ap()});vp.addEventListener('change',function(){o.vp=vp.value;maj();ap()});
      o.sync();
      els.push(d);shb.appendChild(d)});
    var pol=document.getElementById('pf-police');if(pol){var w=document.createElement('div');w.className='mq-sc mq-pol';w.innerHTML='<p>Écriture du texte (la même pour tout le coffret)</p>';var c=pol.cloneNode(true);c.removeAttribute('id');c.addEventListener('change',function(){pol.value=c.value;st.slots.forEach(function(o){if(o.ap)o.ap()});maj()});w.appendChild(c);shb.appendChild(w)}
    function lock(){els.forEach(function(d,i){var l=st.same&&i>0;d.classList.toggle('mq-locked',l);d.querySelector('.mq-lock-note').hidden=!l})}
    stepper=window.mqStepper(shb,els,st.slots,IMGS,st,function(){if(st.same)copyAll();lock();maj()});lock()}
  function ouvre(){cards();maj();sheet.hidden=false}
  function ferme(){sheet.hidden=true;draw();maj()}
  document.querySelector('.mq-open').addEventListener('click',ouvre);
  document.getElementById('mq-close').addEventListener('click',ferme);document.getElementById('mq-ok').addEventListener('click',ferme);
  fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;reset();draw();
    if(st.box){montre(th[{1:5,2:6,4:7}[st.n]])}else{montre(th[WOODS.indexOf(st.t)])}maj()})});
  if(vin)vin.addEventListener('input',maj);if(fac)fac.addEventListener('input',maj);if(pla)pla.addEventListener('change',maj);if(vpl)vpl.addEventListener('change',maj);if(polSel)polSel.addEventListener('change',maj);
  var grid=document.querySelector('.mq-dessins'),pho=document.querySelector('.mq-photo'),dplacef=document.getElementById('mq-dplacef');
  if(vdes)vdes.addEventListener('change',function(){if(grid)grid.hidden=vdes.value!=='oui';if(pho)pho.hidden=vdes.value!=='photo';if(dplacef)dplacef.hidden=!(vdes.value==='oui'||vdes.value==='photo');maj()});
  if(pho){var pf=pho.querySelector('input[type=file]');pf.addEventListener('change',function(){pho.querySelector('.mq-photo-ok').hidden=!pf.files.length;st.photoSrc=null;if(pf.files.length){var r=new FileReader();r.onload=function(){st.photoSrc=r.result;maj()};r.readAsDataURL(pf.files[0])}else maj()})}
  // Planches (comme le gobelet et le modèle 1) : toucher = agrandir ; le numéro se tape ; la grille se replie sur le choix.
  var OK=__NUMS__;function numOk(n){return OK.indexOf(n)>=0}function estCadre(n){return n>=75}
  function zoom(src){var o=document.createElement('div');o.className='mq-zoom';o.innerHTML='<div class="mq-zoom-in"><button type="button" class="mq-zoom-x" aria-label="Fermer">×</button><img alt=""/></div>';o.querySelector('img').src=src;
    o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)}
  function zoomAll(){var o=document.createElement('div');o.className='mq-zoom';var inn=document.createElement('div');inn.className='mq-zoom-in';inn.innerHTML='<button type="button" class="mq-zoom-x" aria-label="Fermer">×</button><p class="mq-dh">Les planches : repérez le numéro, puis tapez-le.</p>';
    [].forEach.call(document.querySelectorAll('#mq-gd .prc-model'),function(b){var im=document.createElement('img');im.src=b.querySelector('img').src;im.alt='';im.style.marginBottom='10px';inn.appendChild(im)});o.appendChild(inn);
    o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)}
  var gd=document.getElementById('mq-gd'),num=document.getElementById('mq-num'),dok=document.getElementById('mq-dok'),dchg=document.getElementById('mq-dchg'),dleg=document.getElementById('mq-dleg');
  if(gd){[].forEach.call(gd.querySelectorAll('.prc-model'),function(b){b.addEventListener('click',function(){[].forEach.call(gd.querySelectorAll('.prc-model'),function(x){x.classList.toggle('on',x===b)});zoom(b.querySelector('img').src)})});
    var plier=function(v){gd.hidden=v;dleg.hidden=v;dchg.hidden=!v};
    num.addEventListener('input',function(){var n=parseInt(num.value,10);st.num=numOk(n)?n:0;dok.hidden=!num.value;
      dok.textContent=st.num?(estCadre(st.num)?'Cadre n° '+st.num+' choisi ✓ — votre texte du verso (+3 €) s\'écrit au milieu du cadre.':'Dessin n° '+st.num+' choisi ✓ (au verso)'):'Numéro : 1 à 74 pour un dessin, 88 à 94, 96, 98, 100 à 102 pour un cadre.';
      dok.classList.toggle('prc-miss',!st.num);maj()});
    num.addEventListener('change',function(){if(st.num)plier(true)});num.addEventListener('keydown',function(e){if(e.key==='Enter'&&st.num){e.preventDefault();plier(true)}});
    dchg.addEventListener('click',function(){plier(false);gd.scrollIntoView({behavior:'smooth',block:'start'})})}
  [].forEach.call(document.querySelectorAll('#mq-dplace .prc-chip'),function(b){b.addEventListener('click',function(){if(b.disabled)return;st.dz=b.dataset.z;maj()})});
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();var k=sw.indexOf(b);if(th[k])montre(th[k]);var im=fm[0].querySelector('.mq-fimg');if(im)im.src=IMGS[k];
    draw();maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');if(b.classList.contains('mq-thap')){apercu();return}if(galap)galap.hidden=true;main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  window.addEventListener('resize',function(){if(galap&&!galap.hidden)apercu()});
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

DATA = mp_apercu.script_data(2)
BANNER = '<div class="mq-banner">MAQUETTE — fiche « Marque-page ajouré, oiseau et magnolia » (précommande · texte face + verso, dessin ou photo au verso, aperçu dans la couleur choisie, coffret pas à pas — 24/10) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Marque-page ajouré, oiseau et magnolia — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}\n{mp_apercu.CSS}</style>"
SHEET = ('<div class="mq-sheet" id="mq-sheet" hidden><div class="mq-sheetin"><div class="mq-shh"><b id="mq-sht">Mon coffret</b><button type="button" id="mq-close" aria-label="Fermer">×</button></div>'
         '<div class="mq-shb" id="mq-shb"></div><div class="mq-shf"><span>Total du coffret<br><b id="mq-shn">0,00 €</b></span><button type="button" class="mq-open" id="mq-ok">Valider mon coffret</button></div></div></div>')
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + SHEET + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{DATA}{mp_apercu.JS}</script><script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{DATA}{mp_apercu.JS}</script><script>{JS}</script>'
open(os.path.join(OUT, "marque-pages-fenetre.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages-fenetre.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
