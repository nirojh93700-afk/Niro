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
GNOTE = '<p class="mq-gnote" id="mq-gnote" hidden>Les marque-pages du coffret sont de couleurs différentes : vous pouvez en changer et faire graver chacun — un texte sur la face (+3 €), et au verso un texte (+3 €), un dessin, un cadre ou une photo (+4 €), en haut et au milieu — dans « Voir et personnaliser mon coffret ».</p>'
cle = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
assert cle in MAIN
cle_id = cle.replace('<div style="margin-bottom:6px">', '<div style="margin-bottom:6px" id="mq-grav">')
MAIN = MAIN.replace(cle, FMT + RECAP + GNOTE + cle_id, 1)
# 23/10 : « la face se grave aussi… pas de dessin, il y a déjà un dessin : que du texte » ; 24/10 soir : dessin / cadre / photo au VERSO
# (+4 €, « il y a de la place au dos ») ; puis (capture du coffret) « s'il veut ajouter à l'avant et au dos, au-dessus et en bas, il faut
# qu'ils aient le choix » → l'éditeur partagé à QUATRE emplacements (mp_apercu.mqEditeur) remplace tous les champs : Face · au-dessus de la
# fenêtre et Face · à côté de la fenêtre = TEXTE seulement (+3 €) ; Dos · en haut et Dos · au milieu = texte +3 € / dessin ou cadre +4 € /
# photo +4 €. L'écriture et la note restent. Les planches du gobelet (UNE grille partagée) se montent dans l'emplacement en cours.
NUMS_OK = mp_apercu.NUMS_OK
a0 = MAIN.index('<div class="field"><label for="pf-texte">'); a1 = MAIN.index('<div class="field"><label for="pf-police">')
MAIN = MAIN[:a0] + '<div id="mq-ed"></div>' + MAIN[a1:]
MAIN = MAIN.replace("Laissez vide pour un marque-page sans gravure.", "Laissez « Rien » partout pour un marque-page sans gravure.", 1)
OLD_H = "<h3>Le coffret des quatre couleurs</h3>"
assert OLD_H in MAIN
i0 = MAIN.index(OLD_H); i1 = MAIN.index("</p>", i0) + 4
OLD_V = "<h3>Un texte au verso</h3>"
assert OLD_V in MAIN
v0 = MAIN.index(OLD_V); v1 = MAIN.index("</p>", v0) + 4
MAIN = MAIN[:v0] + "<h3>Gravé sur la face et au verso</h3><p>Sur la face, deux emplacements dans le bois : au-dessus de la fenêtre ajourée et à gauche de la branche. Faites-y graver un prénom ou un mot (+3 €), en haut sur une ligne ou en bas, écrit à la verticale. Le dessin de l'oiseau est déjà là : aucun autre dessin ne s'y ajoute. Au verso, le bois est nu, avec deux emplacements aussi (en haut, au milieu) : chacun reçoit un texte (+3 €) dans l'écriture de votre choix parmi les huit du site, un dessin numéroté, un cadre autour de votre texte ou votre photo gravée en noir et blanc (+4 €). Gravez un seul emplacement ou plusieurs, c'est vous qui choisissez.</p>" + MAIN[v1:]
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
  var st={t:'Blond clair',q:1,n:1,box:0,slots:[],same:false,cur:0,v:window.mqEdVide()};
  var gm=document.querySelector('.gallery-main'),galap=document.getElementById('mq-galap'),thap=document.querySelector('.mq-thap'),stepper=null;
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button'),polSel=document.getElementById('pf-police');
  var WOODS=sw.map(function(b){return b.querySelector('.vs-title').textContent.trim()});
  var IMGS=sw.map(function(b){return b.querySelector('img').src});
  var fm=[].slice.call(document.querySelectorAll('.mq-fmt'));
  var recap=document.getElementById('mq-recap'),gnote=document.getElementById('mq-gnote'),grav=document.getElementById('mq-grav');
  var sheet=document.getElementById('mq-sheet'),shb=document.getElementById('mq-shb'),shn=document.getElementById('mq-shn'),sht=document.getElementById('mq-sht');
  function polCls(){var v=polSel&&polSel.value;return v?'fnt-'+v:'fnt-playfair'}
  // UNE grille de planches pour toute la page : elle se déplace dans l'emplacement en cours (fiche ou carte du coffret).
  var cgEl=document.getElementById('cg-dessins'),cgWrap=document.getElementById('mq-cgwrap');
  var cg=window.mqPlanches('cg',__NUMS__,function(n){if(window.mqGridOwner)window.mqGridOwner.onNum(n)});
  var ALLOW=__ALLOW__;
  var pageEd=window.mqEditeur(document.getElementById('mq-ed'),{v:st.v,allow:ALLOW,cg:cg,cgEl:cgEl,cgWrap:cgWrap,onChange:function(){maj()}});
  function unit(o){return P[WOODS[o.c]]+window.mqEdPrix(o.v)}
  function base(){if(st.n>1)return st.slots.reduce(function(a,o){return a+unit(o)},0);return P[st.t]+window.mqEdPrix(st.v)}
  function apercu(){if(!galap)return;var it=window.mqEdItems(st.v,polCls());if(st.n>1||!it.length){galap.hidden=true;if(thap)thap.classList.remove('active');return}
    window.mqApercu(galap.querySelector('.mq-apw'),it,Math.round((gm.clientHeight||600)*0.9),st.t);galap.hidden=false;th.forEach(function(x){x.classList.remove('active')});if(thap)thap.classList.add('active')}
  function copyAll(){var a=st.slots[0];st.slots.slice(1).forEach(function(o){o.v=window.mqEdCopie(a.v);if(o.sync)o.sync()})}
  function maj(){if(st.same&&st.n>1)copyAll();if(stepper)stepper.refresh(function(o){return window.mqEdPrix(o.v)>0});tot.textContent=eur((base()+st.box)*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;if(shn)shn.textContent=eur(base()+st.box);apercu()}
  function reset(){st.slots=[];for(var i=0;i<st.n;i++)st.slots.push({c:__DEFC__,v:window.mqEdVide(),touched:false})}
  function draw(){var on=st.n>1;recap.hidden=gnote.hidden=!on;grav.hidden=on;if(!on){pageEd.remonte();return}
    var st2=recap.querySelector('.mq-strip');st2.innerHTML='';var cust=st.slots.some(function(o){return o.touched||window.mqEdPrix(o.v)>0});
    st.slots.forEach(function(o){var d=document.createElement('span');d.className='mq-ch';d.innerHTML='<img src="'+IMGS[o.c]+'" alt=""/><small>'+WOODS[o.c]+'</small>'+window.mqEdResume(o.v).map(function(x){return '<b>'+x.replace(/</g,'&lt;')+'</b>'}).join('');st2.appendChild(d)});
    recap.querySelector('.mq-rtxt').textContent=cust?'Votre coffret de '+st.n+' marque-pages :':__RTXT__}
  // Aperçu du coffret : aussi grand que l'écran le permet (24/10 soir, gérant : « c'est trop petit là, il faut que ce soit plus grand en longueur »).
  function shH(){return Math.round(Math.min(560,window.innerHeight*0.62))}
  function cards(){shb.innerHTML='';sht.textContent='Mon coffret de '+st.n;var els=[];
    st.slots.forEach(function(o,i){var d=document.createElement('div');d.className='mq-sc';
      d.innerHTML='<p>Marque-page '+(i+1)+' <small class="mq-scc"></small></p><div class="mq-row"></div><p class="mq-lock-note" hidden>Gravé comme le marque-page 1 — décochez « la même gravure » pour le changer.</p>'
        +'<div class="mq-grav"><div class="mq-ed"></div></div><div class="mq-ap"><p class="mq-aph">Votre aperçu <small>— touchez pour agrandir</small></p><div class="mq-apw"></div></div>';
      var aph=d.querySelector('.mq-apw'),scc=d.querySelector('.mq-scc');
      function ap(){scc.textContent='· '+WOODS[o.c];window.mqApercu(aph,window.mqEdItems(o.v,polCls()),shH(),WOODS[o.c])}
      o.ap=ap;
      o.ed=window.mqEditeur(d.querySelector('.mq-ed'),{v:o.v,allow:ALLOW,cg:cg,cgEl:cgEl,cgWrap:cgWrap,onChange:function(){o.touched=true;maj();ap()}});
      o.sync=function(){o.ed.set(o.v);ap()};o.monte=function(){o.ed.remonte()};
      var row=d.querySelector('.mq-row');
      WOODS.forEach(function(w,k){var c=document.createElement('button');c.type='button';c.className='mq-c'+(k===o.c?' on':'');c.setAttribute('aria-label',w);c.innerHTML='<img src="'+IMGS[k]+'" alt=""/><span>'+w+'</span>';
        c.addEventListener('click',function(){o.c=k;o.touched=true;[].forEach.call(row.children,function(x,j){x.classList.toggle('on',j===k)});maj();ap()});row.appendChild(c)});
      ap();els.push(d);shb.appendChild(d)});
    var pol=document.getElementById('pf-police');if(pol){var w=document.createElement('div');w.className='mq-sc mq-pol';w.innerHTML='<p>Écriture du texte (la même pour tout le coffret)</p>';var c=pol.cloneNode(true);c.removeAttribute('id');c.addEventListener('change',function(){pol.value=c.value;st.slots.forEach(function(o){if(o.ap)o.ap()});maj()});w.appendChild(c);shb.appendChild(w)}
    function lock(){els.forEach(function(d,i){var l=st.same&&i>0;d.classList.toggle('mq-locked',l);d.querySelector('.mq-lock-note').hidden=!l})}
    stepper=window.mqStepper(shb,els,st.slots,IMGS,st,function(){if(st.same)copyAll();lock();maj()},function(i){var o=st.slots[i];if(o&&o.monte)o.monte()});lock()}
  function ouvre(){cards();maj();sheet.hidden=false}
  function ferme(){sheet.hidden=true;draw();maj()}
  document.querySelector('.mq-open').addEventListener('click',ouvre);
  document.getElementById('mq-close').addEventListener('click',ferme);document.getElementById('mq-ok').addEventListener('click',ferme);
  fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;reset();draw();
    if(st.box){montre(th[__BOXTH__[st.n]])}else{montre(th[WOODS.indexOf(st.t)])}maj()})});
  if(polSel)polSel.addEventListener('change',maj);
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();var k=sw.indexOf(b);if(th[k])montre(th[k]);var im=fm[0].querySelector('.mq-fimg');if(im)im.src=IMGS[k];
    __SWSLOTS__draw();maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');if(b.classList.contains('mq-thap')){apercu();return}if(galap)galap.hidden=true;main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  window.addEventListener('resize',function(){if(galap&&!galap.hidden)apercu();if(sheet&&!sheet.hidden)st.slots.forEach(function(o){if(o.ap)o.ap()})});
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  if(th[0])th[0].classList.add('active');
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  reset();draw();maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX, ensure_ascii=False)).replace("__NUMS__", json.dumps(NUMS_OK)) \
    .replace("__ALLOW__", "function(s){return s==='face'?['texte']:['texte','dessin','photo']}").replace("__DEFC__", "st.n>1?i%WOODS.length:WOODS.indexOf(st.t)") \
    .replace("__RTXT__", "'Votre coffret de '+st.n+' marque-pages, de couleurs différentes. Vous pouvez changer une couleur ou faire graver chacun (face et verso) :'") \
    .replace("__BOXTH__", "{1:5,2:6,4:7}").replace("__SWSLOTS__", "")

DATA = mp_apercu.script_data(2)
BANNER = '<div class="mq-banner">MAQUETTE — fiche « Marque-page ajouré, oiseau et magnolia » (précommande · texte face + verso, dessin ou photo au verso, aperçu dans la couleur choisie, coffret pas à pas, quatre emplacements (face = texte, verso = texte / dessin / photo) — 24/10) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Marque-page ajouré, oiseau et magnolia — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}\n{mp_apercu.CSS}\n{mp_apercu.CSS_PLANCHES}</style>"
SHEET = ('<div id="mq-cgwrap" hidden>' + mp_apercu.grille_planches("cg", "Choisissez votre dessin pour le verso", """Touchez une planche pour l'agrandir et lire les numéros, puis tapez le numéro ci-dessous. Un <b>dessin</b> (n° 1 à 74) ou un <b>cadre</b> dans lequel s'écrit votre texte (n° 88 à 94, 96, 98, 100 à 102).""") + '</div><div class="mq-sheet" id="mq-sheet" hidden><div class="mq-sheetin"><div class="mq-shh"><b id="mq-sht">Mon coffret</b><button type="button" id="mq-close" aria-label="Fermer">×</button></div>'
         '<div class="mq-shb" id="mq-shb"></div><div class="mq-shf"><span>Total du coffret<br><b id="mq-shn">0,00 €</b></span><button type="button" class="mq-open" id="mq-ok">Valider mon coffret</button></div></div></div>')
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + SHEET + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{DATA}{mp_apercu.JS}{mp_apercu.JS_PLANCHES}</script><script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{DATA}{mp_apercu.JS}{mp_apercu.JS_PLANCHES}</script><script>{JS}</script>'
open(os.path.join(OUT, "marque-pages-fenetre.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages-fenetre.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
