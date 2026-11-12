#!/usr/bin/env python3
"""Maquette « Créez votre décoration à suspendre » (12/11/2026) — RIEN en ligne.

Le gérant (« tout comme sur le site ») : le même outil que le générateur « Ornament » d'Atomm (xTool). Les 46 formes de
découpe viennent de ce générateur (images « maskImg », passées en tracés par decoration-contours.py). Le gérant (12/11) :
« ce sont des découpes en plusieurs morceaux, même les lettres et les noms, pour superposer et coller ; on peut graver
des photos » ; « pas ces images, tu mets que les photos » ; pas d'impression couleur (sa machine n'imprime pas). Habillage = celui de la maquette du support de
téléphone (même capture de la fiche du site, même coquille, logo au mur).

  python3 tools/maquettes/decoration-createur.py <capture.html> <dossier css> <sortie.html> <contours.json>
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, sortie, contours = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
# 5e argument : les 257 « Éléments » d'Atomm préparés par decoration-elements.py (dessins à découper ou à graver)
ELEMENTS = json.load(open(sys.argv[5], encoding='utf-8')) if len(sys.argv) > 5 else {'familles': [], 'elements': []}


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def png_uri(path, w=260):
    im = Image.open(path).convert("RGBA")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode(), im.width / im.height


def jpg_uri(path, w=520, q=78):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


# ---------- la page du site ----------
src = open(cap, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
b0 = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>")
header, main, footer = src[b0:i_main], src[i_main:j_main], src[j_main + 7:src.rfind("</body>")]


def local_src(m):
    p = os.path.join(PUB, m.group(1).lstrip("/"))
    return f'src="{raw_uri(p)}"' if os.path.exists(p) else m.group(0)


def coquille(part):
    part = re.sub(r'src="(/[^"]+)"', local_src, part)
    for pat in (r"<button[^>]*>💬 Une question \?</button>", r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
        part = re.sub(pat, "", part)
    return re.sub(r'href="/[^"]*"', 'href="#"', part)


header, footer = coquille(header), coquille(footer)

css = "".join(open(os.path.join(cssdir, f), encoding="utf-8").read() + "\n" for f in sorted(os.listdir(cssdir)))
css = re.sub(r"@font-face\{[^}]*\}", "", css)          # polices : Google Fonts (seul hébergeur permis dans l'aperçu)
css = css.replace("</style", "<\\/style")


def bloc(debut, fin):
    a = main.find(debut)
    z = main.find(fin, a)
    return main[a:z] if a >= 0 and z > a else ""


fil = bloc("<nav", "</nav>") + "</nav>"
fil = re.sub(r'href="/[^"]*"', 'href="#"', fil)
titre = "Décoration à suspendre — prénom découpé ou photo gravée"
accroche = "Choisissez la forme, la taille, la matière, puis vos textes et votre photo : votre décoration se dessine en direct."
prix = dict(re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', main))
P = {k: float(v.replace(" €", "").replace(" €", "").replace(",", ".")) for k, v in prix.items()}
P_TEXTE, P_DESSIN, P_PHOTO, P_LETTRE = P["Texte seul"], P["Dessin au choix"], P["Photo gravée"], P["Lettre fleurie"]
bas = bloc('<div class="trust-cards">', '<section class="confiance"')
bas = bas[:bas.rfind("</div>")] if bas else ""
bas = re.sub(r'href="/[^"]*"', 'href="#"', bas)
# le bas de la colonne se referme dans la capture par les </div> de product-info / product-layout : on garde
# seulement les blocs entiers (cartes de confiance, pièce personnalisée, description, volets).
blocs_bas = ""
for d, f in (('<div class="trust-cards">', '<div class="pd-perso">'), ('<div class="pd-perso">', '<div class="product-desc">'),
             ('<div class="product-desc">', '<div class="info-accordion">')):
    blocs_bas += bloc(d, f)
acc = main[main.find('<div class="info-accordion">'):]
acc = acc[:acc.find("</details></div>") + len("</details></div>")] if "</details></div>" in acc else ""
blocs_bas = ""   # les volets du support de téléphone ne concernent pas cette fiche

# ---------- les dessins du site (modèles numérotés de la fiche) ----------
NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 27, 28, 30]
FICHIERS = {27: "motif-couple-fleurs", 28: "motif-couple-coeur", 30: "motif-fee-lune"}
DESSINS = []
for n in NUMS:
    f = os.path.join(PUB, "produits", (FICHIERS.get(n) or f"vin-motif-{n:02d}") + ".png")
    u, r = png_uri(f)
    DESSINS.append({"n": n, "src": u, "r": round(r, 3)})
PHOTOS = []
for u in re.findall(r'<div class="gallery-thumbs">(.*?)</div>', main, re.S)[0].split("<button")[1:]:
    m = re.search(r'src="(/[^"]+)"', u)
    if m and os.path.exists(os.path.join(PUB, m.group(1).lstrip("/"))):
        PHOTOS.append(jpg_uri(os.path.join(PUB, m.group(1).lstrip("/")), w=900, q=80))
PHOTOS = []   # pas encore de photo de décoration en bois sur le site
# ---------- la lettre fleurie : les 26 lettres découpées dans la planche du site ----------
def lettres_fleuries():
    import numpy as np
    src = Image.open(os.path.join(PUB, "produits", "alphabet-fleuri.jpg")).convert("L")
    a = np.array(src).astype(int)
    cells = {"A": (20, 20, 315, 305)}
    def rang(lettres, y0, y1, xs):
        for L, (x0, x1) in zip(lettres, xs):
            cells[L] = (x0, y0, x1, y1)
    q = [(318, 420), (422, 525), (527, 630), (632, 735)]
    rang("BCDE", 15, 110, q); rang("FGHI", 125, 220, q); rang("JKLM", 245, 352, q)
    rang("NOPQRST", 358, 462, [(25, 125), (128, 228), (230, 328), (330, 430), (432, 532), (534, 632), (634, 735)])  # N = le Ñ sans son tilde
    rang("UVWXYZ", 465, 565, [(25, 135), (140, 250), (255, 385), (388, 495), (505, 615), (625, 735)])
    out = {}
    for L, (x0, y0, x1, y1) in cells.items():
        ys, xs = np.where(a[y0:y1, x0:x1] < 110)
        bx0, by0, bx1, by1 = x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1
        h = by1 - by0
        fr = (a[by0:by1, bx0:bx1] < 110).mean(1)
        traits = []
        for i, f in enumerate(fr):
            if f > 0.75:
                if traits and i - traits[-1][1] <= 2: traits[-1][1] = i
                else: traits.append([i, i])
        bande = (0.38, 0.56)  # par défaut (W : traits trop courts pour être vus)
        for k in range(len(traits) - 1):
            g = traits[k + 1][0] - traits[k][1]
            if 0.08 * h < g < 0.3 * h:
                bande = ((traits[k][1] + 1) / h, traits[k + 1][0] / h); break
        crop = src.crop((int(bx0), int(by0), int(bx1), int(by1)))
        alpha = crop.point(lambda v: max(0, min(255, int((235 - v) * 1.6))))
        im = Image.new("RGBA", crop.size, (0, 0, 0, 0)); im.putalpha(alpha)
        if im.width > 300:
            im = im.resize((300, round(im.height * 300 / im.width)), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "PNG", optimize=True)
        out[L] = {"src": "data:image/png;base64," + base64.b64encode(b.getvalue()).decode(),
                  "r": round(im.width / im.height, 3), "b": [round(bande[0], 3), round(bande[1], 3)]}
    return out


LETTRES = lettres_fleuries()
PLANCHE = jpg_uri(os.path.join(PUB, "produits", "alphabet-fleuri.jpg"), w=760, q=80)
EXEMPLE = jpg_uri(os.path.join(ROOT, "docs/maquettes/assets/marque-pages/exemples/portraits/couple.jpg"))
# le logo du site, fichier d'origine tel quel (aucune retouche) : accroché au mur, au fond de la vue 3D
LOGO = raw_uri(os.path.join(PUB, "logo-niv-creation.jpg"))
with Image.open(os.path.join(PUB, "logo-niv-creation.jpg")) as _l: LOGO_R = round(_l.width / _l.height, 4)

POLICES = [
    ["playfair", "Playfair", "'Playfair Display',serif"], ["cinzel", "Cinzel", "'Cinzel',serif"],
    ["cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"], ["montserrat", "Montserrat", "'Montserrat',sans-serif"],
    ["inter", "Inter", "'Inter',sans-serif"], ["great-vibes", "Great Vibes", "'Great Vibes',cursive"],
    ["allura", "Allura", "'Allura',cursive"], ["pacifico", "Pacifico", "'Pacifico',cursive"],
]

CONTOURS = json.load(open(contours, encoding="utf-8"))
MATIERES = [  # celles du générateur Atomm ; couleur de gravure propre à chaque matière
    {"id": "contreplaque", "nom": "Contreplaqué", "c": ["#f0dcb4", "#e3c796", "#d6b47f"], "bord": "#9c7744", "grav": "#4e2e16", "bois": True},
    {"id": "acr-blanc", "nom": "Acrylique blanc", "c": ["#ffffff", "#f3f3f1", "#e4e4e1"], "bord": "#b9b9b5", "grav": "#9a9a96", "acrylique": True},
    {"id": "acr-noir", "nom": "Acrylique noir", "c": ["#3a3a3c", "#1d1d1f", "#0c0c0d"], "bord": "#000000", "grav": "#e9e6df", "acrylique": True},
    {"id": "acr-rouge", "nom": "Acrylique rouge", "c": ["#e2504a", "#c62f2f", "#a32323"], "bord": "#7c1717", "grav": "#f6e2df", "acrylique": True},
    {"id": "acr-bleu", "nom": "Acrylique bleu", "c": ["#4b7be0", "#2f5fc6", "#2449a0"], "bord": "#183473", "grav": "#e3ebfb", "acrylique": True},
]
# Nos modèles prêts à personnaliser (gérant, 12/11 : « prépare quelques exemples… ils commanderont en changeant le nom »).
# Les prénoms sont des exemples. Le 6e argument (modeles-maquette.json, fait par decoration-modeles.cjs) donne pour chacun
# les pièces déjà posées (els), le prix et l'image : le modèle s'ouvre alors EXACTEMENT comme sur sa vignette.
MODELES = [
    {"id": "flocons", "titre": "Flocons de neige", "sous": "Boule · prénom en acrylique bleu", "forme": "xmas_bauble", "taille": "moyenne", "style": "classique",
     "textes": [{"texte": "Camille", "police": "great-vibes", "mat": "acr-bleu"}], "decos": ["30b2ae60dd", "77a6742cdf", "f33cd5031f"]},
    {"id": "foret", "titre": "La forêt de Noël", "sous": "Sapin · prénom en acrylique rouge", "forme": "xmas_tree", "taille": "moyenne", "style": "classique",
     "textes": [{"texte": "Léo", "police": "pacifico", "mat": "acr-rouge"}], "decos": ["d96206e7c5", "8e251e8cc0", "74a2e4c5de"]},
    {"id": "etoile", "titre": "Étoile d'hiver", "sous": "Étoile · prénom en acrylique blanc", "forme": "xmas_star", "taille": "moyenne", "style": "classique",
     "textes": [{"texte": "Inès", "police": "allura", "mat": "acr-blanc"}], "decos": ["30bffad1b1", "88eeea4a1b"]},
    {"id": "couple", "titre": "Notre premier Noël", "sous": "Cœur · deux prénoms et l'année", "forme": "Heart", "taille": "moyenne", "style": "classique",
     "textes": [{"texte": "Léa & Tom", "police": "great-vibes", "mat": "acr-rouge"}, {"texte": "2026", "police": "cinzel", "mat": "contreplaque"}], "decos": ["97cf54d2c7", "62a26c0328"]},
    {"id": "mamie", "titre": "Pour Mamie", "sous": "Cadeau · plaque pleine gravée", "forme": "xmas_gift_box", "taille": "moyenne", "style": "pleine",
     "textes": [{"texte": "Mamie", "police": "great-vibes", "mat": "contreplaque"}], "decos": ["f3e058ed97", "7d907193e8", "cb69615933"]},
]
FAITS = json.load(open(sys.argv[6], encoding="utf-8")) if len(sys.argv) > 6 else {}
for m in MODELES:
    f = FAITS.get(m["id"])
    if f:
        m["els"], m["total"] = f["els"], f["total"]
        im = Image.open(f["img"]).convert("RGB"); im.thumbnail((360, 420), Image.LANCZOS)
        bb = io.BytesIO(); im.save(bb, "WEBP", quality=80); m["img"] = "data:image/webp;base64," + base64.b64encode(bb.getvalue()).decode()

DONNEES = json.dumps({"modeles": MODELES, "contours": CONTOURS, "matieres": MATIERES, "mini": 30, "maxi": 150, "photos": PHOTOS, "dessins": [], "elements": ELEMENTS, "lettres": {}, "planche": "", "exemple": EXEMPLE, "logo": LOGO, "logoR": LOGO_R, "polices": POLICES,
                      "prix": {"base": 9.9, "acrylique": 2, "element": 3, "dessin": 1}, "tailles": [["petite", "Petite", 70, 0], ["moyenne", "Moyenne", 90, 2], ["grande", "Grande", 110, 4]]},
                     ensure_ascii=False, separators=(",", ":"))

CSS_MAQ = r"""
:root{color-scheme:light;--font-display:'Playfair Display';--font-body:'Inter';--font-cinzel:'Cinzel';--font-cinzel-deco:'Cinzel Decorative';
--font-montserrat:'Montserrat';--font-great-vibes:'Great Vibes';--font-allura:'Allura';--font-pacifico:'Pacifico'}
body{background:var(--cream);color:var(--ink);font-family:'Inter',system-ui,sans-serif}
.sc-bandeau{background:#2b2620;color:#f3ece0;font-size:.8rem;line-height:1.45;padding:9px 16px;text-align:center}
.sc-bandeau b{color:#e2c67e}
.sc-layout{align-items:start}
main>nav.container{padding-left:clamp(16px,4vw,40px)!important;padding-right:clamp(16px,4vw,40px)!important}
.sc-left{position:sticky;top:calc(var(--sc-top,0px) + 16px)}
.sc-stage{position:relative;border-radius:var(--radius);border:1px solid var(--line);overflow:hidden;
background:linear-gradient(180deg,#f4efe6 0%,#efe8dc 58%,#e3d6c0 58.2%,#eadfcb 100%)}
.sc-stage svg{display:block;width:100%;height:auto;max-height:max(300px,min(620px,calc(100vh - var(--sc-top,0px) - 120px)));touch-action:pan-y}
.sc-stage .sc-el{cursor:grab;touch-action:none}
.sc-stage .sc-photo-g{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.sc-stage[data-vue=photo] svg,.sc-stage[data-vue=photo] .sc-tag{display:none}
.sc-stage[data-vue=creation] .sc-photo-g{display:none}
.sc-stage .gallery-arrow-prev{left:10px}.sc-stage .gallery-arrow-next{right:10px}
.gallery-thumbs .sc-thc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#fbf3df;border:1.5px dashed #c9b88a;
color:#7c6120;font:inherit;font-size:.58rem;font-weight:700;line-height:1.1;text-align:center}
.gallery-thumbs .sc-thc svg{width:24px;height:30px}
.gallery-thumbs .sc-thc svg path{fill:#e9d6b4;stroke:#9c6b3f;stroke-width:2}
.gallery-thumbs .sc-thc.active{border-style:solid}
.gallery-thumbs button img{width:100%;height:100%;object-fit:cover;display:block}
.sc-stage .sc-el:active{cursor:grabbing}
.sc-tag{position:absolute;left:10px;top:10px;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
background:rgba(43,38,32,.82);color:#fff;border-radius:999px;padding:5px 10px}
.sc-aide{font-size:.8rem;color:var(--ink-soft);font-style:italic;margin:10px 2px 0;line-height:1.4}
.sc-formes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.sc-forme{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px 8px;border:1.5px solid var(--line);border-radius:12px;
background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);font-size:.78rem;font-weight:600}
.sc-forme svg{width:44px;height:56px}
.sc-forme svg path{fill:#e9d6b4;stroke:#9c6b3f;stroke-width:1.6}
.sc-forme.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.sc-ajouts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (max-width:520px){.sc-ajouts{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sc-planche{display:block;width:100%;border-radius:10px;border:1px solid var(--line);background:#fff;margin:0 0 10px}
.prc-letters{display:flex;flex-wrap:wrap;gap:6px}
.prc-let{min-width:38px;min-height:38px;border:1.5px solid var(--line);border-radius:9px;background:var(--paper);font:inherit;font-weight:700;cursor:pointer;color:var(--ink)}
.prc-let.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sc-ajout{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1.5px dashed #cdb98f;border-radius:12px;
background:#fffaf0;cursor:pointer;font:inherit;color:var(--ink);font-size:.82rem;font-weight:700;text-align:center}
.sc-ajout small{font-weight:400;font-size:.72rem;color:var(--ink-soft)}
.sc-ajout svg{width:26px;height:26px;stroke:var(--gold-dark);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.sc-ajout.on{border-style:solid;border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.sc-panneau{margin-top:10px}
.sc-ligne{display:flex;gap:8px;align-items:stretch}
.sc-ligne input[type=text]{flex:1;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#fff}
.sc-btn{flex:none;border:0;border-radius:10px;padding:0 16px;min-height:44px;font:inherit;font-weight:700;cursor:pointer;
background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff}
.sc-btn.clair{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
.sc-btn[disabled]{opacity:.45;cursor:not-allowed}
.prc-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.prc-model{position:relative;display:flex;flex-direction:column;gap:5px;padding:6px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit}
.prc-mimg img{max-width:86%;max-height:86%}
.sc-liste{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.sc-vide{font-size:.84rem;color:var(--ink-soft);border:1px dashed var(--line);border-radius:12px;padding:12px;text-align:center;margin-top:12px}
.sc-item{border:1.5px solid var(--line);border-radius:12px;background:var(--paper);padding:10px}
.sc-item.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.sc-itete{display:flex;align-items:center;gap:10px;min-width:0}
.sc-vig{flex:none;width:44px;height:44px;border-radius:9px;background:#efe6d6;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:'Playfair Display',serif;font-weight:700;color:#6b4423}
.sc-vig img{max-width:100%;max-height:100%;object-fit:cover}
.sc-inom{flex:1;min-width:0}
.sc-inom b{display:block;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-inom small{font-size:.74rem;color:var(--ink-soft)}
.sc-x{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:1rem;color:var(--ink-soft)}
.sc-outils{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:9px}
.sc-outils span{font-size:.76rem;color:var(--ink-soft);margin-right:2px}
.sc-o{min-width:40px;min-height:36px;border:1px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font:inherit;font-size:.8rem;font-weight:600;padding:0 10px;color:var(--ink)}
.sc-item input[type=text]{width:100%;box-sizing:border-box;min-width:0;margin-top:9px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;font:inherit;background:#fff}
.sc-item .prc-pols{margin-top:8px}
.sc-item .prc-pol{font-size:.9rem;padding:7px 9px}
.sc-photo{display:flex;flex-wrap:wrap;gap:8px}
.sc-photo label.sc-btn{display:inline-flex;align-items:center;justify-content:center}
.sc-photo input{position:absolute;width:1px;height:1px;opacity:0}
.sc-atelier{border-top:1px solid var(--line);margin-top:8px;padding:34px 0 60px}
.sc-atelier h2{font-family:'Playfair Display',serif;font-size:1.55rem;margin:0 0 6px;text-wrap:balance}
.sc-atelier>.container>p{color:var(--ink-soft);max-width:65ch;margin:0 0 18px;line-height:1.55}
.sc-agrid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:28px;align-items:start}
.sc-feuille{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:14px;box-shadow:var(--shadow)}
.sc-feuille svg{display:block;width:100%;height:auto}
.sc-fnom{font-family:ui-monospace,Menlo,monospace;font-size:.76rem;color:var(--ink-soft);margin:10px 0 0;overflow-wrap:anywhere}
.sc-legende{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 14px;padding:0;list-style:none;font-size:.86rem}
.sc-legende i{display:inline-block;width:22px;height:0;border-top:3px solid;vertical-align:middle;margin-right:7px}
.sc-points{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.sc-points li{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:.9rem;line-height:1.5}
.sc-points b{display:block;margin-bottom:2px}
.sc-avalider{margin-top:22px;background:#fffaf0;border:1px solid #e7d3a1;border-radius:12px;padding:14px 16px;font-size:.88rem;line-height:1.55}
.sc-avalider b{display:block;margin-bottom:4px}
.sc-avalider ul{margin:0;padding-left:18px}
@media (max-width:900px){
 .sc-layout{display:block;padding-top:14px}
 .sc-left{display:contents}
 .sc-stage[data-vue=photo]{position:relative!important;top:auto!important;z-index:auto!important;border-radius:var(--radius);margin:0;border:1px solid var(--line);box-shadow:none}
 .sc-stage{position:sticky;top:var(--sc-top,0px);z-index:20;border-radius:0 0 var(--radius) var(--radius);margin:0 -16px;border-left:0;border-right:0;box-shadow:0 8px 18px rgba(43,38,32,.12)}
 .sc-stage svg{max-height:36vh}
 .sc-aide{margin-bottom:14px}
 .gallery-thumbs{margin-bottom:4px}
 .sc-agrid{grid-template-columns:1fr}
 .sc-formes{grid-template-columns:repeat(4,minmax(0,1fr))}
}
.sc-sous{font-size:.84rem;font-weight:700;margin:16px 0 8px}
.sc-tailles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sc-taille{display:flex;flex-direction:column;gap:3px;padding:10px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);text-align:left}
.sc-taille b{font-size:.88rem}.sc-taille em{font-style:normal;font-size:.74rem;font-weight:700;color:var(--gold-dark)}
.sc-taille small{font-size:.72rem;color:var(--ink-soft);line-height:1.3}.sc-taille span{font-size:.72rem;font-weight:600;color:#7c6120;font-variant-numeric:tabular-nums}
.sc-taille.on,.sc-mode.on,.sc-motif.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.sc-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
.sc-mode{display:flex;flex-direction:column;gap:3px;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);text-align:left}
.sc-mode b{font-size:.95rem}.sc-mode b::before{content:'';display:inline-block;width:16px;height:16px;border:1.5px solid var(--line);border-radius:5px;margin-right:7px;vertical-align:-3px;background:#fff}
.sc-mode.on b::before{content:'✓';color:#fff;background:var(--gold-dark);border-color:var(--gold-dark);font-size:11px;line-height:16px;text-align:center}.sc-mode small{font-size:.76rem;color:var(--ink-soft);line-height:1.35}
.sc-motifs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.sc-motif{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);font-size:.74rem;font-weight:600;text-align:center}
.sc-motif svg{width:42px;height:62px}
.sc-motif small{font-weight:400;font-size:.66rem;color:var(--ink-soft)}
.sc-motif svg path{fill:#e9d6b4;stroke:#9c6b3f;stroke-width:1.1;fill-rule:evenodd}
.sc-case{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:.88rem;cursor:pointer;min-height:44px}
.sc-case input{width:22px;height:22px;accent-color:var(--gold-dark);flex:none}
.sc-vue{position:absolute;right:10px;top:10px;z-index:3;display:flex;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:3px}
.sc-vue button{border:0;background:none;font:inherit;font-size:.78rem;font-weight:700;padding:7px 14px;border-radius:999px;cursor:pointer;color:var(--ink-soft);min-height:34px}
.sc-vue button.on{background:var(--ink);color:#fff}
.sc-3d{position:absolute;inset:0;width:100%;height:100%;display:none;touch-action:none;cursor:grab}
.sc-stage[data-3d="1"] .sc-3d{display:block}.sc-stage[data-3d="1"] svg#scene{visibility:hidden}
.sc-stage[data-vue=photo] .sc-vue,.sc-stage[data-vue=photo] .sc-3d{display:none}
.sc-3dmsg{position:absolute;left:0;right:0;bottom:8px;margin:0;text-align:center;font-size:.76rem;color:var(--ink-soft);pointer-events:none}
.sc-stage:not([data-3d="1"]) .sc-3dmsg{display:none}
.sc-stage[data-vue=creation] .sc-tag{display:none}
.sc-stage [hidden]{display:none!important}
.sc-mur{position:absolute;left:clamp(10px,3%,22px);top:clamp(12px,3%,22px);width:clamp(62px,16%,104px);z-index:0;border:4px solid #9a7442;border-radius:2px;background:#fff;box-shadow:3px 4px 8px rgba(60,40,20,.22)}
.sc-mur img{display:block;width:100%;height:auto}
.sc-stage svg#scene{position:relative;z-index:1}
.sc-stage[data-vue=photo] .sc-mur,.sc-stage[data-3d="1"] .sc-mur{display:none}
.sc-pied{position:absolute;left:10px;bottom:10px;z-index:2;width:clamp(62px,15%,104px);background:rgba(255,255,255,.88);border:1px solid var(--line);border-radius:10px;padding:6px 6px 4px;text-align:center;font-size:.66rem;font-weight:700;color:var(--ink-soft);line-height:1.2}
.sc-pied svg{display:block;width:100%;height:auto;margin-bottom:3px}
.sc-pied path{fill:#e6cfa5;stroke:#9c6b3f;stroke-width:.6;fill-rule:evenodd}
.sc-stage[data-vue=photo] .sc-pied,.sc-stage[data-3d="1"] .sc-pied{display:none!important}
.sc-styles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sc-style{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border:1.5px solid var(--line);border-radius:14px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);text-align:center}
.sc-style svg{width:54px;height:54px;fill:#c79a62;stroke:#a77b45}
.sc-style b{font-size:.95rem}.sc-style small{font-size:.76rem;color:var(--ink-soft);line-height:1.35}
.sc-style.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.sc-ajouts2{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.sc-ajouts3{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.sc-fams{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:thin}.sc-fams button{flex:none;padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:#fff;font:inherit;font-size:.8rem;cursor:pointer;color:var(--ink)}
.sc-fams button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sc-dessins{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;max-height:300px;overflow-y:auto;padding:2px}
.sc-dessins button{aspect-ratio:1;padding:8px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
.sc-dessins button:hover{border-color:var(--gold-dark)}.sc-dessins img{max-width:100%;max-height:100%}
.sc-hasard{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:2px 0 10px;padding:10px;border:1px dashed #cdb98f;border-radius:12px;background:#fffaf0}
.sc-hasard .sc-nb{display:inline-flex;align-items:center;gap:6px}.sc-hasard output{min-width:20px;text-align:center;font-weight:700}
.sc-hasard .prc-hint{flex-basis:100%;margin:0}
.sc-vig img.sc-vd{object-fit:contain;padding:4px;background:#fff}
.sc-seg{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:3px;background:#fff;gap:2px;margin:6px 0}
.sc-seg button{border:0;background:none;padding:7px 14px;border-radius:999px;font:inherit;font-size:.84rem;cursor:pointer;color:var(--ink)}
.sc-seg button.on{background:var(--ink);color:#fff}
.sc-warn{margin:8px 0 0;padding:8px 10px;border-radius:10px;background:#fdecea;color:#a12622;font-size:.82rem;line-height:1.4}
.sc-courbe{display:flex;align-items:center;gap:10px;font-size:.84rem;margin-top:8px}.sc-courbe input{flex:1;min-width:0}
.prc-miss{color:#a12622}
#ajouter:disabled{opacity:.5;cursor:not-allowed}
.sc-poser{margin:6px 0}
.sc-astuce{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:3;display:flex;align-items:center;gap:8px;margin:0;padding:8px 14px;border-radius:999px;
 background:rgba(43,38,32,.86);color:#fff;font-size:.8rem;line-height:1.3;width:max-content;max-width:calc(100% - 24px);pointer-events:none;animation:scAst 2.4s ease-in-out infinite}
.sc-astuce svg{flex:none;width:20px;height:20px;fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
@keyframes scAst{0%,100%{transform:translateX(-50%)}50%{transform:translateX(-50%) translateY(-3px)}}
@media (prefers-reduced-motion:reduce){.sc-astuce{animation:none}}
.sc-fleches .sc-o{min-width:40px}
.sc-ast-c{display:none}
.sc-stage[data-vue=photo] .sc-astuce,.sc-stage[data-3d="1"] .sc-astuce{display:none!important}
@media (max-width:900px){.sc-astuce{bottom:8px;padding:5px 11px;font-size:.72rem;gap:6px}.sc-astuce svg{width:16px;height:16px}.sc-ast-l{display:none}.sc-ast-c{display:inline}}
.sc-tailles-deco{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sc-tailles-deco .sc-taille{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink)}
.sc-tailles-deco .sc-taille span{font-size:1.05rem;font-weight:700}.sc-tailles-deco .sc-taille small{font-size:.72rem;color:var(--ink-soft);display:block!important}
.sc-tailles-deco .sc-tprix{font-style:normal;font-size:.78rem;font-weight:700;color:var(--gold-dark);margin-top:2px}
.sc-tailles-deco .sc-taille.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.sc-mats.sc-mats5{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:6px 0}.sc-mats5 .sc-mat{font-size:.68rem;padding:8px 2px}.sc-mats5 .sc-mat i{width:30px;height:30px}
.sc-formes-deco{grid-template-columns:repeat(auto-fill,minmax(78px,1fr));margin-top:10px;max-height:340px;overflow:auto;padding:2px}
.sc-formes-deco .sc-forme svg{width:52px;height:52px}
.sc-formes-deco .sc-forme svg path{fill-rule:evenodd;stroke-width:1.4}
.sc-dims{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sc-dims label{display:flex;flex-direction:column;gap:5px;font-size:.84rem;font-weight:700}
.sc-dims span{display:flex;align-items:center;gap:6px;font-weight:400;color:var(--ink-soft)}
.sc-dims input{width:100%;min-width:0;box-sizing:border-box;padding:10px 11px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#fff;color:var(--ink)}
.sc-lien{border:0;background:none;padding:0;font:inherit;color:var(--gold-dark);text-decoration:underline;cursor:pointer}
.sc-mats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.sc-mat{display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 4px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;font-size:.72rem;font-weight:600;color:var(--ink);text-align:center;line-height:1.2}
.sc-mat i{width:38px;height:38px;border-radius:9px;border:1px solid rgba(0,0,0,.12)}
.sc-mat.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
@media (min-width:901px){.sc-stage.sc-deco svg#scene{max-height:max(300px,min(560px,calc(100vh - var(--sc-top,0px) - 120px)))}}
@media (max-width:900px){.sc-stage.sc-deco svg#scene{max-height:34vh}.sc-formes-deco{max-height:none;overflow:visible}}
.sc-modeles{margin:0 0 16px}.sc-mt{font-family:var(--font-display),serif;font-size:1.12rem;font-weight:600;margin:0 0 2px;color:var(--ink)}
.sc-mrail{display:flex;gap:10px;overflow-x:auto;padding:8px 2px 10px;scroll-snap-type:x mandatory}
.sc-mod{flex:0 0 150px;scroll-snap-align:start;display:flex;flex-direction:column;gap:4px;padding:8px;border:1.5px solid var(--line);border-radius:14px;background:var(--paper,#fff);cursor:pointer;font:inherit;text-align:left;color:var(--ink)}
.sc-mod img{width:100%;aspect-ratio:6/7;object-fit:contain;border-radius:9px;background:#f4ece0}
.sc-mod b{font-size:.84rem;line-height:1.2}.sc-mod small{font-size:.72rem;color:var(--muted,#6b5d4a);line-height:1.25}
.sc-mod em{font-style:normal;font-size:.78rem;font-weight:700;color:var(--gold-dark,#a98935)}
.sc-mod.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.sc-mod-ok{margin:-4px 0 12px;padding:9px 12px;border-radius:10px;background:#fffaf0;border:1px solid var(--gold);font-size:.84rem}
.sc-item input[data-edit].sc-pulse{box-shadow:0 0 0 3px var(--gold);transition:box-shadow .3s}
@media (min-width:901px){.sc-mod{flex-basis:160px}}
@media (max-width:420px){.sc-ajout{font-size:.76rem;padding:10px 4px}.sc-forme{font-size:.72rem}.sc-taille small{display:none}.sc-motif{font-size:.68rem}}
"""

HTML_OUTIL = r"""
<div class="sc-modeles" id="modeles" hidden><p class="sc-mt">Nos modèles prêts à personnaliser</p>
 <p class="prc-hint">Choisissez un modèle, puis changez le prénom ou le texte à l'étape 4. Tout reste modifiable.</p>
 <div class="sc-mrail" id="mrail"></div></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre décoration</p><p class="prc-sub">Cinq petites étapes. Votre décoration se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n1">1</span><h3>La forme</h3></div>
  <div class="prc-chips" id="groupes"></div>
  <div class="sc-formes sc-formes-deco" id="formes"></div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n2">2</span><h3>La taille</h3></div>
  <div class="sc-tailles sc-tailles-deco" id="tailles"></div>
  <p class="prc-hint">Mesure du plus grand côté de la décoration, trou du ruban compris.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n3">3</span><h3>Le style</h3></div>
  <div class="sc-styles" id="styles">
   <button type="button" class="sc-style" data-v="classique"><svg viewBox="0 0 60 60"><path d="M30 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8M14 14h32a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4zM17 21v28h26V21z" fill-rule="evenodd"/><path d="M12 36q9-7 18 0t18 0" fill="none" stroke-width="5" stroke-linecap="round"/></svg><b>Classique</b><small>Un cadre découpé, et vos textes et photos découpés à part, collés sur le cadre</small></button>
   <button type="button" class="sc-style" data-v="pleine"><svg viewBox="0 0 60 60"><path d="M30 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8M14 14h32a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" fill-rule="evenodd"/><path d="M18 36q6-5 12 0t12 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg><b>Plaque pleine</b><small>Une seule pièce : vos textes et photos sont gravés dessus</small></button>
  </div>
  <p class="prc-hint">Cadre et plaque en contreplaqué 3 mm. Vos noms peuvent être en contreplaqué ou en acrylique de couleur.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n5">4</span><h3>Vos textes, vos dessins et vos photos</h3></div>
  <p class="prc-legend" id="legTextes"></p>
  <div class="sc-ajouts sc-ajouts3">
   <button type="button" class="sc-ajout" data-a="texte"><svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>Un texte<small>prénom, nom, Joyeux Noël</small></button>
   <button type="button" class="sc-ajout" data-a="photo"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>Ma photo<small>gravée</small></button>
   <button type="button" class="sc-ajout" data-a="dessin"><svg viewBox="0 0 24 24"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4l-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z"/></svg>Un dessin<small>flocon, renne, sapin… 1 €</small></button>
  </div>
  <div class="sc-panneau" id="panneau"></div>
  <div id="liste"></div>
 </section>
 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num done" id="n6">5</span><h3>Votre création</h3></div>
  <div class="prc-sum" id="resume"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
"""

HTML_ATELIER = r"""
<section class="sc-atelier"><div class="container">
 <h2>De votre côté : le fichier pour le laser se fabrique tout seul</h2>
 <p>À la commande, le site range dans le dossier de la commande le fichier de la décoration, à la taille réelle. Il change en direct ci-dessous quand vous modifiez la décoration au-dessus.</p>
 <div class="sc-agrid">
  <div class="sc-feuille"><svg id="fichier" viewBox="0 0 110 110" role="img" aria-label="Fichier de découpe et de gravure"></svg><p class="sc-fnom" id="fnom"></p></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : à graver</li></ul>
   <ul class="sc-points">
    <li><b>Les 46 formes du générateur Atomm</b>Noël, Pâques, paniers, croix et formes simples, trou du ruban compris. En « Classique », le cadre (l'intérieur est vide) ; en « Plaque pleine », la forme entière.</li>
    <li><b>Chaque pièce rangée à plat, numérotée</b>En « Classique », chaque texte et chaque photo est une pièce à part, rangée à côté du cadre avec son numéro : un nom découpé (lettres soudées), un texte gravé sur une pièce découpée 1,6 mm autour, une photo gravée sur sa pièce. On découpe tout, puis on colle les pièces sur le cadre comme sur l'aperçu de la cliente.</li>
    <li><b>Trois tailles</b>Petite 7 cm (compris), moyenne 9 cm (+ 2 €), grande 11 cm (+ 4 €), plus grand côté. Le fichier tient dans la zone de 200 × 200 mm de la F2 Ultra UV.</li>
    <li><b>Contreplaqué, et acrylique de couleur pour les noms</b>Le cadre (ou la plaque) et les photos en contreplaqué 3 mm ; chaque nom ou texte découpé en contreplaqué ou en acrylique blanc, noir, rouge ou bleu. Le fichier dit dans quelle matière découper chaque pièce.</li>
    <li><b>Dans Gestion, comme les autres commandes</b>L'aperçu de la cliente et le fichier apparaissent dans la fiche atelier et dans le dossier du jour, avec l'aperçu qui montre où coller chaque pièce.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Prix proposés par moi : décoration 9,90 € (le cadre ou la plaque, en contreplaqué), + 3 € par texte ou photo, + 2 € pour un nom en acrylique. À vous de les fixer.</li>
  <li>Le ruban est-il fourni ? Quelle colle pour les pièces ? Une vraie photo par forme sera à prendre avant la mise en vente.</li>
  <li>Pas d'impression en couleur (votre machine grave et découpe, elle n'imprime pas) : l'option « Couleur » d'Atomm n'est donc pas reprise.</li>
 </ul></div>
</div></section>
"""

JS = r"""
(function(){
var D=__DONNEES__, NS='http://www.w3.org/2000/svg';
function $(i){return document.getElementById(i)}
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function eur(n){return n.toFixed(2).replace('.',',')+' €'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---- les 46 formes de découpe du générateur « Ornament » d'Atomm (mm, plus grand côté = 100 mm, trou du ruban compris) ---- */
var C=D.contours, GROUPES=[{id:'noel',nom:'Noël'},{id:'paques',nom:'Pâques'},{id:'panier',nom:'Paniers'},{id:'croix',nom:'Croix'},{id:'simple',nom:'Formes simples'},{id:'tout',nom:'Toutes'}];
var MATIERES=D.matieres;
var S={forme:'xmas_gift_box',groupe:'noel',W:78.5,H:100,lier:true,matiere:'contreplaque',taille:'moyenne',matTexte:'contreplaque',style:'classique',els:[],sel:null,panneau:null,police:'great-vibes',modeTexte:'decoupe',formePhoto:'rect',seq:0};
function F(){for(var i=0;i<C.length;i++)if(C[i].id===S.forme)return C[i];return C[0]}
function M(){for(var i=0;i<MATIERES.length;i++)if(MATIERES[i].id===S.matiere)return MATIERES[i];return MATIERES[0]}
function poly(d){return d.split(/(?=M)/).filter(Boolean).map(function(sp){var n=sp.match(/-?[\d.]+/g).map(Number),o=[];for(var i=0;i+1<n.length;i+=2)o.push([n[i],n[i+1]]);return o})}
function nomDe(l,id){for(var i=0;i<l.length;i++)if(String(l[i].id)===String(id))return l[i].nom;return id}
function police(k){for(var i=0;i<D.polices.length;i++)if(D.polices[i][0]===k)return D.polices[i];return D.polices[0]}
/* la scène : la décoration tient dans 280 × 450 unités, centrée sur x = 200 */
function sx(){return S.W/F().W} function sy(){return S.H/F().H}
function k(){return Math.min(280/S.W,450/S.H)}
function ox(){return 200-S.W*k()/2} function oy(){return 70+(450-S.H*k())/2}
function tf(){return 'translate('+ox()+','+oy()+') scale('+(k()*sx())+','+(k()*sy())+')'}

var svg=$('scene');
svg.innerHTML='<defs>'
 +'<linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop id="b0" offset="0"/><stop id="b1" offset=".55"/><stop id="b2" offset="1"/></linearGradient>'
 +'<filter id="veine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="3" seed="7" result="n"/>'
 +'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 -0.12"/><feComposite operator="in" in2="SourceGraphic"/></filter>'
 +'<filter id="brun" color-interpolation-filters="sRGB"><feColorMatrix id="brunM" type="matrix" values="0 0 0 0 0.33  0 0 0 0 0.19  0 0 0 0 0.08  0 0 0 0.92 0"/></filter>'
 +'<filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0 0 0 1 0"/>'
 +'<feComponentTransfer><feFuncR id="sR" type="table" tableValues="0.26 0.62 0.93"/><feFuncG id="sG" type="table" tableValues="0.14 0.44 0.82"/><feFuncB id="sB" type="table" tableValues="0.06 0.26 0.64"/></feComponentTransfer></filter>'
 +'<filter id="flou"><feGaussianBlur stdDeviation="9"/></filter>'
 +'<filter id="pieceF" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.3" dy="1.8" stdDeviation="1.1" flood-color="#2b1d0e" flood-opacity=".45"/></filter>'
 +'<clipPath id="decoupe"><path id="decoupeP" clip-rule="evenodd"/></clipPath></defs>'
 +'<path id="ruban" fill="none" stroke="#b3262d" stroke-width="3" stroke-linecap="round"/>'
 +'<ellipse id="ombreSol" cx="200" cy="540" rx="120" ry="10" fill="#3a2a16" opacity=".16" filter="url(#flou)"/>'
 +'<path id="ombreP" fill="#6b4a25" opacity=".3" fill-rule="evenodd"/>'
 +'<path id="dos" fill="url(#bois)" fill-rule="evenodd"/><path id="dosV" fill="#fff" fill-rule="evenodd" filter="url(#veine)" opacity=".5"/>'
 +'<path id="dosB" fill="none" stroke-width=".5" opacity=".8"/>'
 +'<g id="grav" clip-path="url(#decoupe)"></g>'
 +'<g id="poignee"></g>';
var grav=$('grav'), poignee=$('poignee');
function hexRgb(h){return [parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255]}
function plaque(){ /* classique = le cadre découpé (intérieur vide) ; pleine = la forme entière, tout est gravé dessus */
 var f=F(),m=M(),t=tf(),cl=S.style==='classique',dd=cl?f.cadre:f.d;
 ['dos','dosV','dosB'].forEach(function(i){$(i).setAttribute('d',dd);$(i).setAttribute('transform',t)});
 $('decoupeP').setAttribute('d',f.d);$('decoupeP').setAttribute('transform',t);
 /* Classique : les noms et les photos sont des pièces collées par-dessus le cadre, on les voit entières même quand elles dépassent ;
    Plaque pleine : tout est gravé sur la plaque, donc rien ne sort de la forme */
 if(cl)grav.removeAttribute('clip-path');else grav.setAttribute('clip-path','url(#decoupe)');
 $('ombreP').setAttribute('d',dd);$('ombreP').setAttribute('transform','translate(5,4) '+t);
 $('b0').setAttribute('stop-color',m.c[0]);$('b1').setAttribute('stop-color',m.c[1]);$('b2').setAttribute('stop-color',m.c[2]);
 $('dos').setAttribute('fill','url(#bois)');
 $('dosV').setAttribute('opacity',m.bois?.5:0);$('dosB').setAttribute('stroke',m.bord);
 $('dosB').setAttribute('stroke-width',1.2/(k()*sx()));
 var g=hexRgb(m.grav);$('brunM').setAttribute('values','0 0 0 0 '+g[0]+'  0 0 0 0 '+g[1]+'  0 0 0 0 '+g[2]+'  0 0 0 0.92 0');
 var b=hexRgb(m.c[1]);['sR','sG','sB'].forEach(function(id,i){$(id).setAttribute('tableValues',g[i]+' '+((g[i]+b[i])/2).toFixed(3)+' '+b[i])});
 var top=[0,1e9];poly(f.d)[0].forEach(function(p){if(p[1]<top[1])top=p});
 var rx=ox()+top[0]*k()*sx(),ry=oy()+top[1]*k()*sy()+8;
 $('ruban').setAttribute('d','M'+rx+' 14L'+rx+' '+ry);
 $('ombreSol').setAttribute('cy',oy()+S.H*k()+12)}

function limites(){var w=S.W*k(),h=S.H*k();return{x0:ox()+w*.02,x1:ox()+w*.98,y0:oy()+h*.1,y1:oy()+h*.98}}
function off(){return 1.6*k()}   /* contour découpé autour d'une gravure : 1,6 mm */
function taille(e){var P=S.W*k();
 if(e.type==='texte'){return{w:0,h:.13*P*e.s}}
 if(e.type==='dessin'){var d=elem(e.did),w0=.3*P*e.s;return{w:w0,h:w0*(d?d.r:1)}}
 var w=.46*P*e.s;return{w:w,h:w*1.2}}
function largTexte(){return S.W*k()*.98}
function borner(e){var L=limites(),t=taille(e),hw=e.type==='texte'?Math.min(36,largTexte()/2):t.w/2+off(),hh=t.h/2,lo=L.x0+hw,hi=L.x1-hw;
 e.x=lo>hi?200:Math.max(lo,Math.min(hi,e.x));
 var a=L.y0+hh,b=L.y1-hh;e.y=a>b?(L.y0+L.y1)/2:Math.max(a,Math.min(b,e.y))}

/* un texte, droit ou courbé (sur un arc de cercle) ; uid rend les identifiants uniques */
function arcDef(e,cx,cy,fs,uid){if(!e.courbe)return '';var c=e.courbe,R=fs*(2+300/Math.abs(c));
 return '<defs><path id="arc'+uid+'" fill="none" stroke="none" d="'+(c>0?'M'+(cx-R)+' '+(cy+R)+' A'+R+' '+R+' 0 0 1 '+(cx+R)+' '+(cy+R):'M'+(cx-R)+' '+(cy-R)+' A'+R+' '+R+' 0 0 0 '+(cx+R)+' '+(cy-R))+'"/></defs>'}
function txt(e,cx,cy,fs,extra,uid){var ff=police(e.police)[2].replace(/"/g,"'"),mot=esc(e.texte||'Votre texte'),
 base=' text-anchor="middle" dominant-baseline="central" font-family="'+ff+'" font-size="'+fs+'" letter-spacing="'+((e.esp||0)*fs*.06)+'" stroke-linejoin="round" '+extra;
 if(!e.courbe)return '<text x="'+cx+'" y="'+cy+'"'+base+'>'+mot+'</text>';
 return '<text'+base+'><textPath href="#arc'+uid+'" startOffset="50%">'+mot+'</textPath></text>'}
/* une pièce de texte : découpée (lettres soudées) ou gravée sur une pièce découpée autour */
function pieceTexte(e,cx,cy,fs,P,uid){
 /* P = {plein, trait, grav, cl, couleur, o, coupe} : couleurs et épaisseurs dans l'unité du dessin */
 var h=arcDef(e,cx,cy,fs,uid),soude=fs*.07,cr=fs*.05;
 if(!P.cl)return h+(e.creux?txt(e,cx,cy,fs,'fill="none" stroke="'+P.grav+'" stroke-width="'+cr+'"',uid):txt(e,cx,cy,fs,'fill="'+P.grav+'" opacity=".92"',uid));
 if(e.mode==='grave'){
  h+='<g'+(P.ombre?' filter="url(#pieceF)"':'')+'>'+txt(e,cx,cy,fs,'fill="'+P.plein+'" stroke="'+P.plein+'" stroke-width="'+(2*P.o)+'"',uid)+'</g>';
  if(P.trait)h=h.replace('<g>','<g>'+txt(e,cx,cy,fs,'fill="'+P.trait+'" stroke="'+P.trait+'" stroke-width="'+(2*P.o+P.coupe)+'"',uid));
  return h+(e.creux?txt(e,cx,cy,fs,'fill="none" stroke="'+P.grav+'" stroke-width="'+cr+'"',uid):txt(e,cx,cy,fs,'fill="'+P.grav+'" opacity=".92"',uid))}
 if(e.creux){var a='',w=cr+P.coupe;
  if(P.trait)a+=txt(e,cx,cy,fs,'fill="none" stroke="'+P.trait+'" stroke-width="'+(cr+2*P.coupe)+'"',uid);
  a+=txt(e,cx,cy,fs,'fill="none" stroke="'+P.plein+'" stroke-width="'+cr+'"',uid);
  return h+'<g'+(P.ombre?' filter="url(#pieceF)"':'')+'>'+a+'</g>'}
 var b='';
 if(P.trait)b+=txt(e,cx,cy,fs,'fill="'+P.trait+'" stroke="'+P.trait+'" stroke-width="'+(soude+2*P.coupe)+'"',uid);
 b+=txt(e,cx,cy,fs,'fill="'+P.plein+'" stroke="'+P.plein+'" stroke-width="'+soude+'"',uid);
 return h+'<g'+(P.ombre?' filter="url(#pieceF)"':'')+'>'+b+'</g>'}
/* une pièce « dessin » (les Éléments d'Atomm) : découpée (la pièce a la forme du dessin) ou gravée (le dessin gravé sur une
   pièce découpée 1,6 mm autour de sa silhouette) ; en plaque pleine, le dessin est gravé sur la plaque */
function elem(id){for(var i=0;i<D.elements.elements.length;i++)if(D.elements.elements[i].id===id)return D.elements.elements[i];return null}
function masque(id,src,x,y,w,h,r){return '<mask id="'+id+'" maskUnits="userSpaceOnUse" x="'+(x-r-2)+'" y="'+(y-r-2)+'" width="'+(w+2*r+4)+'" height="'+(h+2*r+4)+'">'
  +'<filter id="'+id+'f" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">'+(r>0?'<feMorphology in="SourceAlpha" operator="dilate" radius="'+r.toFixed(3)+'" result="a"/>':'')
  +'<feFlood flood-color="#fff"/><feComposite in2="'+(r>0?'a':'SourceAlpha')+'" operator="in"/></filter>'
  +'<image href="'+src+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="none" filter="url(#'+id+'f)"/></mask>'}
function teinte(id,src,x,y,w,h,col,op){return '<filter id="'+id+'" color-interpolation-filters="sRGB"><feFlood flood-color="'+col+'"/><feComposite in2="SourceAlpha" operator="in"/></filter>'
  +'<image href="'+src+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="none" filter="url(#'+id+')" opacity="'+(op||.92)+'"/>'}
function pieceDessin(e,cx,cy,w,h,P,uid){var d=elem(e.did);if(!d)return '';var x=cx-w/2,y=cy-h/2,s='',col=/^url/.test(P.grav)?'#5a3a1e':P.grav,
  tr=(e.rot?' rotate('+e.rot+' '+cx+' '+cy+')':'')+(e.flip?' translate('+(2*cx)+' 0) scale(-1 1)':'');
 if(!P.cl)s+=teinte('t'+uid,d.img,x,y,w,h,col);
 else if(e.mode==='grave'){var o=P.o;
  if(P.trait)s+=masque('mt'+uid,d.sil,x,y,w,h,o+P.coupe)+'<rect x="'+(x-o-3)+'" y="'+(y-o-3)+'" width="'+(w+2*o+6)+'" height="'+(h+2*o+6)+'" fill="'+P.trait+'" mask="url(#mt'+uid+')"/>';
  s+=masque('mp'+uid,d.sil,x,y,w,h,o)+'<g'+(P.ombre?' filter="url(#pieceF)"':'')+'><rect x="'+(x-o-2)+'" y="'+(y-o-2)+'" width="'+(w+2*o+4)+'" height="'+(h+2*o+4)+'" fill="'+P.plein+'" mask="url(#mp'+uid+')"/></g>'
   +teinte('t'+uid,d.img,x,y,w,h,col)}
 else{
  if(P.trait)s+=masque('mt'+uid,d.img,x,y,w,h,P.coupe)+'<rect x="'+(x-2)+'" y="'+(y-2)+'" width="'+(w+4)+'" height="'+(h+4)+'" fill="'+P.trait+'" mask="url(#mt'+uid+')"/>';
  s+=masque('mp'+uid,d.img,x,y,w,h,0)+'<g'+(P.ombre?' filter="url(#pieceF)"':'')+'><rect x="'+(x-1)+'" y="'+(y-1)+'" width="'+(w+2)+'" height="'+(h+2)+'" fill="'+P.plein+'" mask="url(#mp'+uid+')"/></g>'}
 return tr?'<g transform="'+tr.trim()+'">'+s+'</g>':s}
/* ---- le placement automatique d'un dessin (gérant, 12/11, capture à l'appui) ----
   CLASSIQUE : le décor se met DANS l'ouverture du cadre, jamais à cheval sur la barre ni en dehors de la forme. Il est collé
   soit contre le bord intérieur du cadre (il ne le recouvre qu'un tout petit peu : c'est là qu'on met la colle), soit posé sur le
   nom (il s'appuie sur le haut des lettres). PLAQUE PLEINE : un endroit libre entièrement sur la plaque (gravé dessus). ---- */
function surBois(x,y){var q=k();try{return $('dos').isPointInFill(new DOMPoint((x-ox())/(q*sx()),(y-oy())/(q*sy())))}catch(_){return false}}
function dansForme(x,y){var q=k();try{return $('decoupeP').isPointInFill(new DOMPoint((x-ox())/(q*sx()),(y-oy())/(q*sy())))}catch(_){return false}}
/* la forme en petite grille (0 dehors, 1 ouverture, 2 bois), calculée une fois par forme et par taille : le placement va vite */
var CARTE=null;
function carte(){var q=k(),cle=S.forme+'|'+S.W+'|'+S.H+'|'+q;if(CARTE&&CARTE.cle===cle)return CARTE;
 var st=2,x0=ox()-2,y0=oy()-2,nx=Math.ceil(S.W*q/st)+3,ny=Math.ceil(S.H*q/st)+3,a=new Uint8Array(nx*ny);
 for(var j=0;j<ny;j++)for(var i=0;i<nx;i++){var x=x0+i*st,y=y0+j*st;a[j*nx+i]=surBois(x,y)?2:(dansForme(x,y)?1:0)}
 CARTE={cle:cle,st:st,x0:x0,y0:y0,nx:nx,ny:ny,a:a};return CARTE}
function lieu(c,x,y){var i=Math.round((x-c.x0)/c.st),j=Math.round((y-c.y0)/c.st);if(i<0||j<0||i>=c.nx||j>=c.ny)return 0;return c.a[j*c.nx+i]}
function ecartAngle(a,b){var d=Math.abs(a-b)%360;return d>180?360-d:d}
/* une pièce déjà posée, vue comme une boîte (le nom : son encre) */
function boiteDe(o){if(o.type==='texte'&&o.inkL!=null)return{x0:o.inkL,x1:o.inkR,y0:o.bh?o.by:o.y-o.fs*.45,y1:o.bh?o.by+o.bh:o.y+o.fs*.3,nom:true};
 return o.bw?{x0:o.bx,x1:o.bx+o.bw,y0:o.by,y1:o.by+o.bh,nom:o.type==='texte'}:null}
/* ce que donne un endroit en classique : null s'il ne va pas, sinon {bord, nom} (collé contre le cadre / posé sur le nom) */
function endroitClassique(e,x,y,hw,hh){var N=6,trou=0,bois=0,dehors=0,tot=0,c=carte();if(lieu(c,x,y)!==1)return null;
 for(var i=0;i<=N;i++)for(var j=0;j<=N;j++){var px=x-hw+2*hw*i/N,py=y-hh+2*hh*j/N;tot++;
  var v=lieu(c,px,py);if(v===0){dehors++;break}if(v===2)bois++;else trou++}
 if(dehors>0)return null;                 /* rien ne sort de la forme, le milieu du décor est dans l'ouverture */
 if(bois/tot>.3)return null;                            /* pas à cheval sur la barre : il la touche seulement */
 var surNom=false,ok=true;
 S.els.forEach(function(o){if(o===e||!ok)return;var b=boiteDe(o);if(!b)return;
  var ix=Math.min(x+hw,b.x1)-Math.max(x-hw,b.x0),iy=Math.min(y+hh,b.y1)-Math.max(y-hh,b.y0);
  if(ix<=-2||iy<=-2)return;                             /* loin de cette pièce */
  /* posé sur le nom : le bas du décor descend un peu dans le haut des lettres, pas plus */
  if(b.nom&&y<b.y0&&iy>4&&iy<=Math.max(6,hh*.3)&&ix>hw*.8){surNom=true;return}
  ok=false});
 if(!ok)return null;
 if(bois<3&&!surNom)return null;                        /* il doit toucher le cadre ou le nom, sinon il tomberait */
 return{bord:bois>=3,nom:surNom,bois:bois/tot}}
/* cible : un angle (degrés, 0 = à droite, 90 = en bas) autour du centre de la forme ; sans cible, l'endroit le plus loin des autres pièces */
function placerAuto(e,cible){var cl=S.style==='classique',L=limites(),q=k(),W=S.W*q,H=S.H*q,essai=0,C=centre();
 while(essai++<5){var t=taille(e),pas=Math.max(2.5,Math.min(W,H)/48),pts=[];
  if(cl){var hw=t.w/2,hh=t.h/2;
   for(var y=L.y0;y<=oy()+H;y+=pas)for(var x=ox();x<=ox()+W;x+=pas){var r=endroitClassique(e,x,y,hw,hh);if(!r)continue;
    var dmin=1e9;S.els.forEach(function(o){if(o===e||!o.bw)return;dmin=Math.min(dmin,Math.hypot(x-(o.bx+o.bw/2),y-(o.by+o.bh/2)))});
    var sc=(r.nom?20:0)-r.bois*40+Math.random()*6;
    if(cible==null)sc+=Math.min(dmin,W)*.6;
    else sc+=-ecartAngle(Math.atan2(y-C.y,x-C.x)*180/Math.PI,cible)*3+Math.min(dmin,W*.5)*.2;
    pts.push([x,y,sc])}}
  else{var hw2=t.w/2+off(),hh2=t.h/2+off();
   for(var y2=L.y0+hh2;y2<=L.y1-hh2;y2+=pas)for(var x2=L.x0+hw2;x2<=L.x1-hw2;x2+=pas){
    if(!(surBois(x2-hw2,y2-hh2)&&surBois(x2+hw2,y2-hh2)&&surBois(x2-hw2,y2+hh2)&&surBois(x2+hw2,y2+hh2)&&surBois(x2,y2)))continue;
    var libre=true,dm=1e9;
    S.els.forEach(function(o){if(o===e)return;var b=boiteDe(o);if(!b)return;
     if(x2+hw2>b.x0-2&&x2-hw2<b.x1+2&&y2+hh2>b.y0-2&&y2-hh2<b.y1+2)libre=false;
     dm=Math.min(dm,Math.hypot(x2-(b.x0+b.x1)/2,y2-(b.y0+b.y1)/2))});
    if(!libre)continue;
    pts.push([x2,y2,cible==null?dm+Math.random()*pas*2:-ecartAngle(Math.atan2(y2-C.y,x2-C.x)*180/Math.PI,cible)*4+Math.hypot(x2-C.x,y2-C.y)*.15])}}
  if(pts.length){pts.sort(function(a,b){return b[2]-a[2]});
   for(var i=0;i<Math.min(10,pts.length);i++){e.x=pts[i][0];e.y=pts[i][1];dessiner();if(!e.flottant)return true}}
  e.s=Math.max(.28,e.s*.82)}
 return false}
/* des décors au hasard : la cliente dit combien, on les tire dans la famille choisie et on les colle sur le cadre */
function auHasard(){var fam=S.famille||D.elements.familles[0],pool=D.elements.elements.filter(function(d){return d.cats.indexOf(fam)>=0}),n=S.nHasard||3,pris=[];
 S.els=S.els.filter(function(e){return !e.hasard});dessiner();
 pool=pool.slice();for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=pool[i];pool[i]=pool[j];pool[j]=x}
 var debut=n===1?-90:-90+180/n;
 pool.slice(0,n).forEach(function(d,i){var o={type:'dessin',did:d.id,fam:fam,mode:'decoupe',mat:'contreplaque',rot:Math.random()<.5?0:(Math.random()<.5?-15:15),flip:Math.random()<.3,hasard:true,s:.55};
  o.id=++S.seq;var p=place(o);o.x=p.x;o.y=p.y;S.els.push(o);dessiner();if(placerAuto(o,debut+360*i/n))pris.push(o);else{S.els=S.els.filter(function(x){return x!==o})}});
 S.sel=null;S.aBouge=true;dessiner();
 var m=$('msgHasard');if(m)m.textContent=pris.length<n?pris.length+' décor'+(pris.length>1?'s':'')+' posé'+(pris.length>1?'s':'')+' : il n\'y a plus de place sur le cadre pour les autres.':n+' décor'+(n>1?'s':'')+' posé'+(n>1?'s':'')+' et collé'+(n>1?'s':'')+'. Touchez encore pour un autre tirage.'}
/* une pièce photo : la photo gravée, la pièce découpée 1,6 mm autour (rectangle arrondi ou ovale) */
function forme(e,x,y,w,h,attr){return e.forme==='ovale'?'<ellipse cx="'+(x+w/2)+'" cy="'+(y+h/2)+'" rx="'+w/2+'" ry="'+h/2+'" '+attr+'/>':'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(w*.09)+'" '+attr+'/>'}
function piecePhoto(e,cx,cy,w,h,P,uid){var o=P.o,x=cx-w/2,y=cy-h/2,s='';
 if(P.cl){s+='<g'+(P.ombre?' filter="url(#pieceF)"':'')+'>'+(P.trait?forme(e,x-o-P.coupe/2,y-o-P.coupe/2,w+2*o+P.coupe,h+2*o+P.coupe,'fill="'+P.trait+'"'):'')
  +forme(e,x-o,y-o,w+2*o,h+2*o,'fill="'+P.plein+'"')+'</g>'}
 s+='<clipPath id="cp'+uid+'">'+forme(e,x,y,w,h,'')+'</clipPath>'
  +'<image href="'+e.src+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp'+uid+')"'+(P.filtre?' '+P.filtre:'')+'/>';
 return s}

function dessiner(){
 plaque();grav.innerHTML='';poignee.innerHTML='';
 var cl=S.style==='classique',m=M();
 var P={cl:cl,plein:'url(#bois)',grav:m.grav,o:off(),coupe:0,ombre:true,filtre:'filter="url(#sepia)"'};
 S.els.forEach(function(e){
  borner(e);var g=el('g',{'class':'sc-el','data-id':e.id},grav),t=taille(e),me=matEl(e);
  var Pe={cl:cl,plein:me.id==='contreplaque'?'url(#bois)':'url(#g-'+me.id+')',grav:cl?me.grav:m.grav,o:P.o,coupe:0,ombre:true,filtre:P.filtre};
  if(e.type==='texte'){var fs=t.h;g.innerHTML=pieceTexte(e,e.x,e.y,fs,Pe,'s'+e.id);
   var tt=g.querySelector('text:last-of-type'),bw=tt.getBBox().width;
   if(!e.courbe&&bw>largTexte()){fs=fs*largTexte()/bw;g.innerHTML=pieceTexte(e,e.x,e.y,fs,Pe,'s'+e.id)}
   e.fs=fs;encre(e,Pe)}
  else if(e.type==='dessin')g.innerHTML=pieceDessin(e,e.x,e.y,t.w,t.h,Pe,'s'+e.id);
  else g.innerHTML=piecePhoto(e,e.x,e.y,t.w,t.h,Pe,'s'+e.id);
  var b=g.getBBox();e.bw=b.width;e.bh=b.height;e.bx=b.x;e.by=b.y;
  e.flottant=cl&&!toucheCadre(b,e);
 });
 /* une pièce qui ne touche pas le cadre tient si elle est collée sur une autre pièce qui, elle, tient */
 if(cl){var change=true;while(change){change=false;S.els.forEach(function(e){if(!e.flottant)return;
  if(S.els.some(function(o){return o!==e&&!o.flottant&&recouvre(boite(e),boite(o))})){e.flottant=false;change=true}})}}
 S.els.forEach(function(e){if(S.sel===e.id||e.flottant)el('rect',{x:e.bx-5,y:e.by-5,width:e.bw+10,height:e.bh+10,rx:6,fill:'none',stroke:e.flottant?'#c62828':'#a98935','stroke-width':1.6,'stroke-dasharray':'6 5','pointer-events':'none'},poignee)});
 fichier();liste();resume();if(V3.pret)V3.maj();
 $('astuce').hidden=!S.els.length||S.aBouge||V3.actif||G.vue!=='creation';vignettes();
 if(G.commence){var v=document.querySelector('.sc-thc path');if(v)v.setAttribute('d',cl?F().cadre:F().d)}
}
function matEl(e){return (e.type==='texte'||(e.type==='dessin'&&e.mode!=='grave'))&&S.style==='classique'?Mde(e.mat||'contreplaque'):M()}
function boite(e){return e.type==='texte'&&e.inkL!=null?{x0:e.inkL,x1:e.inkR,y0:e.y-e.fs*.3,y1:e.y+e.fs*.3}:{x0:e.bx,x1:e.bx+e.bw,y0:e.by,y1:e.by+e.bh}}
function recouvre(a,b){return Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)>4&&Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>4}
/* l'encre réelle d'un texte (l'écriture anglaise laisse de la marge sur les côtés) */
var CV=document.createElement('canvas').getContext('2d');
function encre(e,P){if(e.courbe){e.inkL=null;return}
 CV.font='100px '+police(e.police)[2];var m=CV.measureText(e.texte||'Votre texte'),f=e.fs/100,n=(e.texte||'').length,
  esp=(e.esp||0)*e.fs*.06*Math.max(0,n-1),adv=m.width*f+esp,x0=e.x-adv/2,marge=e.mode==='grave'&&P.cl?P.o:e.fs*.035;
 e.inkL=x0-m.actualBoundingBoxLeft*f-marge;e.inkR=x0+m.actualBoundingBoxRight*f+esp+marge}
/* une pièce collée doit poser sur le cadre : on cherche au moins un point de la pièce sur le bois du cadre */
function toucheCadre(b,e){var d=$('dos'),q=k(),a=sx(),c=sy(),n=0,x0=b.x,w=b.width,y0=b.y,h=b.height;
 if(e&&e.type==='texte'&&e.inkL!=null){x0=e.inkL;w=e.inkR-e.inkL;y0=e.y-e.fs*.3;h=e.fs*.6}
 for(var i=0;i<=20;i++)for(var j=0;j<=4;j++){var x=x0+w*(.02+.96*i/20),y=y0+h*j/4;
  try{if(d.isPointInFill(new DOMPoint((x-ox())/(q*a),(y-oy())/(q*c))))n++}catch(_){return true}}
 return n>=3}

/* ---- glisser ---- */
var prise=null;
function pt(ev){var p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function trouver(id){for(var i=0;i<S.els.length;i++)if(S.els[i].id===id)return S.els[i]}
svg.addEventListener('pointerdown',function(ev){
 var g=ev.target.closest&&ev.target.closest('.sc-el'); if(!g){if(S.sel){S.sel=null;dessiner()}return}
 var e=trouver(+g.getAttribute('data-id')),p=pt(ev); S.sel=e.id; prise={e:e,dx:e.x-p.x,dy:e.y-p.y};
 try{svg.setPointerCapture(ev.pointerId)}catch(_){ } ev.preventDefault(); dessiner()});
svg.addEventListener('pointermove',function(ev){if(!prise)return;var p=pt(ev);prise.e.auto=false;S.aBouge=true;prise.e.x=p.x+prise.dx;prise.e.y=p.y+prise.dy;ev.preventDefault();dessiner()});
function lacher(){prise=null}
svg.addEventListener('pointerup',lacher);svg.addEventListener('pointercancel',lacher);

/* ---- étapes 1 à 3 : la forme, la taille, la matière ---- */
function majFormes(){
 $('groupes').innerHTML=GROUPES.map(function(g){return '<button type="button" class="prc-chip'+(S.groupe===g.id?' on':'')+'" data-g="'+g.id+'">'+g.nom+'</button>'}).join('');
 $('formes').innerHTML=C.filter(function(c){return S.groupe==='tout'||c.groupe===S.groupe}).map(function(c){
  return '<button type="button" class="sc-forme'+(c.id===S.forme?' on':'')+'" data-v="'+c.id+'"><svg viewBox="-2 -2 104 104"><path d="'+c.d+'"/></svg>'+c.nom+'</button>'}).join('')}
/* quelques tailles seulement (gérant : sinon les clientes sont perdues) : le plus grand côté fait 7, 9 ou 11 cm */
function dims(L){var r=F().W/F().H;return r>=1?[L,Math.round(L/r*10)/10]:[Math.round(L*r*10)/10,L]}
function appliquerTaille(){for(var i=0;i<D.tailles.length;i++)if(D.tailles[i][0]===S.taille){var d=dims(D.tailles[i][2]);S.W=d[0];S.H=d[1]}}
function majTaille(){appliquerTaille();$('tailles').innerHTML=D.tailles.map(function(t){var d=dims(t[2]);
 return '<button type="button" class="sc-taille'+(t[0]===S.taille?' on':'')+'" data-t="'+t[0]+'"><b>'+t[1]+'</b><span>'+String(t[2]/10).replace('.',',')+' cm</span><small>'+String(d[0]).replace('.',',')+' × '+String(d[1]).replace('.',',')+' mm</small><em class="sc-tprix">'+(t[3]?'+ '+eur(t[3]):'compris')+'</em></button>'}).join('')}
function majMatiere(){}
function Mde(id){for(var i=0;i<MATIERES.length;i++)if(MATIERES[i].id===id)return MATIERES[i];return MATIERES[0]}
(function(){var dg=svg.querySelector('defs');MATIERES.forEach(function(m){dg.insertAdjacentHTML('beforeend','<linearGradient id="g-'+m.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+m.c[0]+'"/><stop offset=".55" stop-color="'+m.c[1]+'"/><stop offset="1" stop-color="'+m.c[2]+'"/></linearGradient>')})})();
$('tailles').addEventListener('click',function(ev){var b=ev.target.closest('.sc-taille');if(!b)return;S.taille=b.getAttribute('data-t');majTaille();voirCreation();S.els.forEach(borner);dessiner();reposer()});
$('groupes').addEventListener('click',function(ev){var b=ev.target.closest('[data-g]');if(!b)return;S.groupe=b.getAttribute('data-g');majFormes()});
$('formes').addEventListener('click',function(ev){var b=ev.target.closest('.sc-forme');if(!b)return;S.forme=b.getAttribute('data-v');
 majFormes();majTaille();voirCreation();S.els.forEach(borner);if(chevauche())ranger();dessiner();reposer()});
/* un changement de forme : si deux éléments se retrouvent l'un sur l'autre, on les range du haut vers le bas */
function larg(e){return e.type==='texte'?largTexte():taille(e).w}
function chevauche(){for(var i=0;i<S.els.length;i++)for(var j=i+1;j<S.els.length;j++){var a=S.els[i],b=S.els[j];
 if(Math.abs(a.y-b.y)<(taille(a).h+taille(b).h)/2+4&&Math.abs(a.x-b.x)<(larg(a)+larg(b))/2)return true}return false}
function ranger(){var L=limites(),els=S.els.slice().sort(function(a,b){return a.y-b.y}),n=els.length,dispo=L.y1-L.y0-8*(n-1),tot=0;
 els.forEach(function(e){tot+=taille(e).h});
 if(tot>dispo){var q=dispo/tot;els.forEach(function(e){e.s=Math.max(.4,e.s*q)});tot=0;els.forEach(function(e){tot+=taille(e).h})}
 var y=L.y0+Math.max(0,(dispo-tot)/2);els.forEach(function(e){var h=taille(e).h;e.y=y+h/2;y+=h+8})}

/* ---- étape 3 : le style ---- */
function majStyle(){[].forEach.call($('styles').querySelectorAll('.sc-style'),function(b){b.classList.toggle('on',b.getAttribute('data-v')===S.style)});
 var cl=S.style==='classique';
 $('legTextes').innerHTML=cl?'Chaque texte, chaque dessin et chaque photo est une <b>pièce découpée à part</b>, que l\'on colle sur le cadre. <b>Vous la placez où vous voulez</b> : touchez-la dans l\'aperçu et faites-la glisser, ou utilisez les flèches. Elle doit toucher le cadre (ou une autre pièce) : c\'est là qu\'elle est collée. Chaque texte ou photo : + 3 € ; chaque petit dessin : + 1 €.'
  :'Les textes, les dessins et les photos sont <b>gravés directement</b> sur la plaque. <b>Vous les placez où vous voulez</b> : touchez-les dans l\'aperçu et faites-les glisser, ou utilisez les flèches. Chaque texte ou photo gravé : + 3 € ; chaque petit dessin : + 1 €.';
 [].forEach.call(document.querySelectorAll('.sc-sicl'),function(x){x.hidden=!cl})}
$('styles').addEventListener('click',function(ev){var b=ev.target.closest('.sc-style');if(!b)return;S.style=b.getAttribute('data-v');majStyle();voirCreation();panneau();dessiner();reposer()});

/* ---- étape 5 : ajouter un texte ou une photo ---- */
function centre(){var L=limites();return{x:200,y:(L.y0+L.y1)/2}}
function place(o){var L=limites(),c=centre().y,h=taille(o).h/2,haut=L.y0+h+6,bas=L.y1-h-6,
  essais=o.type==='texte'?[c+(L.y1-L.y0)*.22,c+(L.y1-L.y0)*.38,c,c-(L.y1-L.y0)*.2,haut,bas]:[c-(L.y1-L.y0)*.04,haut,bas],meilleur=essais[0],marge=-1e9;
 for(var q=0;q<essais.length;q++){var m=1e9;
  S.els.forEach(function(e){var hc=e.bh?e.bh/2:taille(e).h/2,yc=e.bh?e.by+e.bh/2:e.y;m=Math.min(m,Math.abs(yc-essais[q])-hc-h)});
  if(m>=8)return{x:200,y:essais[q]}; if(m>marge){marge=m;meilleur=essais[q]}}
 return{x:200,y:meilleur}}
function ajouter(o){o.id=++S.seq;o.s=o.s||1;
 if(o.type==='photo'&&S.els.length)o.s=.75;
 if(o.type==='dessin')o.s=S.els.length?.8:1;
 var p=place(o);o.x=p.x;o.y=p.y;S.els.push(o);S.sel=o.id;S.panneau=null;panneau();voirCreation();dessiner();
 if(o.type==='texte'){o.auto=true;if(S.style==='classique')poserTexte(o)}
 if(o.type==='dessin'){placerAuto(o);panneau()}}
/* un nouveau nom : on cherche une hauteur où il va d'un bord du cadre à l'autre sans recouvrir une autre pièce */
function chevaucheAutre(o){return S.els.some(function(e){return e!==o&&e.bh&&!(o.bx+o.bw<e.bx||e.bx+e.bw<o.bx||o.by+o.bh*.85<e.by||e.by+e.bh*.85<o.by)})}
function poserTexte(o){var L=limites(),hs=[.66,.82,.5,.92,.36,.24],y0=o.y;
 for(var i=0;i<hs.length;i++){o.y=L.y0+(L.y1-L.y0)*hs[i];o.s=1;dessiner();ajusterAuCadre(o);if(!o.flottant&&!chevaucheAutre(o))return}
 o.y=y0;o.s=1;dessiner();ajusterAuCadre(o)}
/* en classique, un nom va d'un bord à l'autre du cadre, à sa hauteur : il pose sur le cadre des deux côtés */
function bordsCadre(y){var d=$('dos'),q=k(),a=sx(),c=sy(),cx=ox()+S.W*q/2;
 function sur(x){try{return d.isPointInFill(new DOMPoint((x-ox())/(q*a),(y-oy())/(q*c)))}catch(_){return false}}
 if(sur(cx))return null;
 function bord(sens){var dedans=null;for(var x=cx;sens<0?x>ox()-2:x<ox()+S.W*q+2;x+=sens*.5){var on=sur(x);
   if(dedans===null&&on)dedans=x;else if(dedans!==null&&!on)return (dedans+x)/2}return dedans}
 var g=bord(-1),dr=bord(1);return g===null||dr===null?null:{g:g,d:dr}}
function ajusterAuCadre(e){if(e.courbe)return;
 for(var n=0;n<3;n++){var b=bordsCadre(e.y);if(!b||e.inkL==null)return;
  e.s=Math.max(.35,Math.min(3,e.s*(b.d-b.g)/(e.inkR-e.inkL)));dessiner();
  e.x+= (b.g+b.d)/2-(e.inkL+e.inkR)/2;dessiner()}}
function polsHtml(courante){var h='<div class="prc-pols">';D.polices.forEach(function(p){
 h+='<button type="button" class="prc-pol'+(p[0]===courante?' on':'')+'" data-pol="'+p[0]+'" style="font-family:'+p[2].replace(/"/g,"'")+'">'+p[1]+'</button>'});return h+'</div>'}
function seg(nom,valeurs,courante,data){var h='<div class="sc-seg" role="group" aria-label="'+nom+'">';
 valeurs.forEach(function(v){h+='<button type="button" class="'+(v[0]===courante?'on':'')+'" data-'+data+'="'+v[0]+'">'+v[1]+'</button>'});return h+'</div>'}
var MODES=[['decoupe','Découpé'],['grave','Gravé']],FORMES=[['rect','Rectangle'],['ovale','Ovale']];
function panneau(){
 var P=$('panneau'),h='',cl=S.style==='classique';
 [].forEach.call(document.querySelectorAll('.sc-ajout'),function(b){b.classList.toggle('on',b.getAttribute('data-a')===S.panneau)});
 if(S.panneau==='texte'){
  h='<div class="prc-fields"><div class="field"><label for="ntexte">Votre texte <span class="prc-opt">(un prénom, un nom, « Joyeux Noël »… 24 caractères)</span></label>'
   +'<div class="sc-ligne"><input id="ntexte" type="text" maxlength="24" placeholder="Ex. Camille"><button type="button" class="sc-btn" id="okTexte">Ajouter</button></div></div>'
   +'<div class="field"><label>Écriture</label>'+polsHtml(S.police)+'</div>'
   +(cl?'<div class="field"><label>Matière du nom</label>'+matsHtml(S.matTexte,'tm')+'</div>':'')
   +(cl?'<div class="field"><label>Comment ?</label>'+seg('Découpé ou gravé',MODES,S.modeTexte,'mt')
   +'<p class="prc-hint" id="aideMode">'+aideMode(S.modeTexte)+'</p></div>':'')+'</div>';
 }else if(S.panneau==='photo'){
  h='<div class="prc-fields"><p class="prc-legend">Un portrait, un couple, un animal : la photo est gravée'+(cl?' sur une pièce découpée tout autour, collée sur le cadre':' sur la plaque')+'. Choisissez une image nette et bien éclairée.</p>'
   +'<div class="field"><label>Forme de la photo</label>'+seg('Forme',FORMES,S.formePhoto,'fp')+'</div>'
   +'<div class="sc-photo"><label class="sc-btn">Choisir ma photo<input type="file" accept="image/*" id="fphoto"></label>'
   +'<button type="button" class="sc-btn clair" id="exPhoto">Essayer avec une photo d\'exemple</button></div></div>';
 }
 else if(S.panneau==='dessin'){var fam=S.famille||D.elements.familles[0];
  h='<div class="prc-fields"><p class="prc-legend">Touchez un dessin : il se pose sur la décoration, vous le placez ensuite où vous voulez. '+(cl?'Il est <b>découpé</b> (une pièce à sa forme, collée sur le cadre) ou <b>gravé</b> sur une pièce découpée autour : vous choisissez dans sa fiche.':'Il est gravé sur la plaque.')+'</p>'
   +'<div class="sc-fams">'+D.elements.familles.map(function(f){return '<button type="button" class="'+(f===fam?'on':'')+'" data-fam="'+esc(f)+'">'+esc(f)+'</button>'}).join('')+'</div>'
   +'<div class="sc-hasard"><b>Au hasard</b><span class="sc-nb"><button type="button" class="sc-o" data-h="-" aria-label="Moins de décors">−</button><output>'+(S.nHasard||3)+'</output><button type="button" class="sc-o" data-h="+" aria-label="Plus de décors">+</button></span>'
   +'<button type="button" class="sc-btn" data-h="go">Tirer '+(S.nHasard||3)+' décor'+((S.nHasard||3)>1?'s':'')+' au hasard</button>'
   +'<p class="prc-hint" id="msgHasard">Pris dans la famille « '+esc(fam)+' », posés'+(cl?' dans l\'ouverture, collés contre le cadre ou sur le nom':' sur la plaque')+' tout seuls. 1 € chacun.</p></div>'
   +'<div class="sc-dessins">'+D.elements.elements.filter(function(d){return d.cats.indexOf(fam)>=0}).map(function(d){return '<button type="button" data-dessin="'+d.id+'" aria-label="Ajouter ce dessin"><img src="'+d.img+'" alt="" loading="lazy"></button>'}).join('')+'</div></div>'}
 P.innerHTML=h;var n=$('ntexte');if(n)n.focus()}
function matsHtml(cour,data){return '<div class="sc-mats sc-mats5">'+MATIERES.map(function(m){return '<button type="button" class="sc-mat'+(m.id===cour?' on':'')+'" data-'+data+'="'+m.id+'"><i style="background:linear-gradient(135deg,'+m.c[0]+','+m.c[2]+')"></i>'+m.nom.replace('Acrylique ','Acrylique<br>')+'</button>'}).join('')+'</div>'}
function aideMode(m){return m==='grave'?'Le texte est gravé sur une pièce découpée 1,6 mm tout autour.':'Les lettres sont découpées et soudées entre elles : le nom est une seule pièce.'}
document.querySelector('.sc-ajouts').addEventListener('click',function(ev){var b=ev.target.closest('.sc-ajout');if(!b)return;
 var a=b.getAttribute('data-a');S.panneau=S.panneau===a?null:a;panneau()});
$('panneau').addEventListener('click',function(ev){
 var p=ev.target.closest('[data-pol]');if(p){S.police=p.getAttribute('data-pol');[].forEach.call($('panneau').querySelectorAll('.prc-pol'),function(x){x.classList.toggle('on',x===p)});return}
 var mt=ev.target.closest('[data-mt]');if(mt){S.modeTexte=mt.getAttribute('data-mt');[].forEach.call($('panneau').querySelectorAll('[data-mt]'),function(x){x.classList.toggle('on',x===mt)});$('aideMode').textContent=aideMode(S.modeTexte);return}
 var tm=ev.target.closest('[data-tm]');if(tm){S.matTexte=tm.getAttribute('data-tm');[].forEach.call($('panneau').querySelectorAll('[data-tm]'),function(x){x.classList.toggle('on',x===tm)});return}
 var fp=ev.target.closest('[data-fp]');if(fp){S.formePhoto=fp.getAttribute('data-fp');[].forEach.call($('panneau').querySelectorAll('[data-fp]'),function(x){x.classList.toggle('on',x===fp)});return}
 if(ev.target.id==='okTexte'){var v=$('ntexte').value.trim();if(!v){$('ntexte').focus();return}ajouter({type:'texte',texte:v,police:S.police,mode:S.modeTexte,mat:S.matTexte,esp:0,courbe:0,creux:false});return}
 var hz=ev.target.closest('[data-h]');if(hz){var v=hz.getAttribute('data-h');
  if(v==='go'){auHasard();return}
  S.nHasard=Math.max(1,Math.min(10,(S.nHasard||3)+(v==='+'?1:-1)));panneau();return}
 var fa=ev.target.closest('[data-fam]');if(fa){S.famille=fa.getAttribute('data-fam');panneau();return}
 var de=ev.target.closest('[data-dessin]');if(de){ajouter({type:'dessin',did:de.getAttribute('data-dessin'),fam:S.famille||D.elements.familles[0],mode:'decoupe',mat:'contreplaque',rot:0,flip:false});return}
 if(ev.target.id==='exPhoto'){ajouter({type:'photo',src:D.exemple,nom:"photo d'exemple",forme:S.formePhoto})}});
$('panneau').addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.id==='ntexte'){ev.preventDefault();$('okTexte').click()}});
$('panneau').addEventListener('change',function(ev){if(ev.target.id!=='fphoto')return;var f=ev.target.files&&ev.target.files[0];if(!f)return;
 var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
   var c=document.createElement('canvas'),q=Math.min(1,700/Math.max(im.width,im.height));c.width=Math.round(im.width*q);c.height=Math.round(im.height*q);
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);ajouter({type:'photo',src:c.toDataURL('image/jpeg',.82),nom:f.name,forme:S.formePhoto})};im.src=r.result};r.readAsDataURL(f)});

/* ---- la liste des pièces ---- */
function nomEl(e){return e.type==='texte'?'« '+(e.texte||'')+' »':e.type==='dessin'?'Dessin · '+(e.fam||'décor'):'Ma photo'}
function commentEl(e){if(e.type==='dessin')return S.style!=='classique'?'gravé':(e.mode==='grave'?'gravé sur une pièce découpée':'découpé')+(e.mode==='grave'?'':' · '+matEl(e).nom.toLowerCase())+(e.rot?' · tourné de '+e.rot+'°':'')+(e.flip?' · retourné':'');
 if(e.type==='photo')return 'photo gravée'+(S.style==='classique'?' sur une pièce découpée':'')+' · '+(e.forme==='ovale'?'ovale':'rectangle');
 if(S.style!=='classique')return 'gravé · '+police(e.police)[1];
 return (e.mode==='grave'?'gravé sur une pièce découpée':'lettres découpées')+(e.creux?' · creuses':'')+' · '+matEl(e).nom.toLowerCase()+' · '+police(e.police)[1]}
function prixEl(e){return (e.type==='dessin'?D.prix.dessin:D.prix.element)+((e.type==='texte'||e.type==='dessin')&&S.style==='classique'&&matEl(e).acrylique?D.prix.acrylique:0)}
function liste(){
 var L=$('liste'),act=document.activeElement,garde=act&&act.getAttribute&&act.getAttribute('data-edit');
 if(garde){[].forEach.call(L.querySelectorAll('.sc-item'),function(d){d.classList.toggle('on',+d.getAttribute('data-id')===S.sel)});
  var t=L.querySelector('.sc-item[data-id="'+garde+'"] .sc-inom b'),e=trouver(+garde);if(t&&e)t.textContent=nomEl(e);return}
 if(!S.els.length){L.innerHTML='<p class="sc-vide">Aucun texte, dessin ni photo pour l\'instant'+(S.style==='classique'?' : la décoration est le cadre seul.':'.')+'</p>';return}
 var h='<div class="sc-liste">',cl=S.style==='classique';
 S.els.forEach(function(e,i){
  var vig=e.type==='texte'?'Aa':e.type==='dessin'?'<img class="sc-vd" src="'+(elem(e.did)||{}).img+'" alt="">':'<img src="'+e.src+'" alt="">';
  h+='<div class="sc-item'+(S.sel===e.id?' on':'')+'" data-id="'+e.id+'"><div class="sc-itete"><span class="sc-vig">'+vig+'</span>'
   +'<span class="sc-inom"><b>'+esc(nomEl(e))+'</b><small>'+(cl?'Pièce '+(i+2)+' · ':'')+commentEl(e)+' · + '+eur(prixEl(e))+'</small></span>'
   +'<button type="button" class="sc-x" data-act="x" aria-label="Retirer">✕</button></div>';
  if(e.flottant)h+='<p class="sc-warn">Cette pièce ne touche ni le cadre ni une autre pièce : elle tomberait. Faites-la glisser jusqu\'au cadre pour qu\'on puisse la coller.</p>';
  if(S.sel===e.id){
   if(e.type==='texte'){h+='<input type="text" maxlength="24" value="'+esc(e.texte)+'" data-edit="'+e.id+'" aria-label="Modifier le texte">'+polsHtml(e.police);
    if(cl)h+=matsHtml(e.mat||'contreplaque','emat')+seg('Découpé ou gravé',MODES,e.mode,'em');
    h+='<label class="sc-case"><input type="checkbox" data-act="creux"'+(e.creux?' checked':'')+'> Lettres creuses (seulement le contour)</label>'
     +'<div class="sc-outils"><span>Espacement</span><button type="button" class="sc-o" data-act="esp-" aria-label="Lettres plus serrées">−</button><button type="button" class="sc-o" data-act="esp+" aria-label="Lettres plus espacées">+</button></div>'
     +'<button type="button" class="sc-o sc-poser" data-act="poser">Poser d\'un bord du cadre à l\'autre</button>'
     +'<label class="sc-courbe">Courbe <input type="range" min="-100" max="100" step="5" value="'+(e.courbe||0)+'" data-act="courbe" aria-label="Courbe du texte"><output>'+(e.courbe||0)+'</output></label>'}
   else if(e.type==='dessin'){if(cl){h+=seg('Découpé ou gravé',MODES,e.mode,'em');if(e.mode!=='grave')h+=matsHtml(e.mat||'contreplaque','emat')}
    h+='<div class="sc-outils"><span>Tourner</span><button type="button" class="sc-o" data-act="rot-" aria-label="Tourner à gauche">↺</button><button type="button" class="sc-o" data-act="rot+" aria-label="Tourner à droite">↻</button><button type="button" class="sc-o" data-act="flip">Retourner</button></div>'
    +'<button type="button" class="sc-o sc-poser" data-act="auto">Placer automatiquement'+(cl?' (collé contre le cadre ou sur le nom)':'')+'</button>'}
   else h+=seg('Forme',FORMES,e.forme,'ef');
   h+='<div class="sc-outils sc-fleches"><span>Placer</span><button type="button" class="sc-o" data-act="g" aria-label="Vers la gauche">←</button><button type="button" class="sc-o" data-act="h" aria-label="Vers le haut">↑</button><button type="button" class="sc-o" data-act="b" aria-label="Vers le bas">↓</button><button type="button" class="sc-o" data-act="d" aria-label="Vers la droite">→</button></div>'
    +'<div class="sc-outils"><span>Taille</span><button type="button" class="sc-o" data-act="moins" aria-label="Plus petit">−</button><button type="button" class="sc-o" data-act="plus" aria-label="Plus grand">+</button>'
    +'<button type="button" class="sc-o" data-act="centre">Centrer</button></div>'}
  h+='</div>'});
 L.innerHTML=h+'</div>'}
$('liste').addEventListener('click',function(ev){
 var it=ev.target.closest('.sc-item');if(!it)return;var e=trouver(+it.getAttribute('data-id'));if(!e)return;
 var a=ev.target.getAttribute('data-act'),p=ev.target.closest('[data-pol]'),em=ev.target.closest('[data-em]'),ef=ev.target.closest('[data-ef]'),emt=ev.target.closest('[data-emat]');
 if(a==='x'){S.els=S.els.filter(function(x){return x!==e});if(S.sel===e.id)S.sel=null;dessiner();return}
 if(a==='moins'){e.s=Math.max(.4,e.s-.1);e.auto=false}else if(a==='plus'){e.s=Math.min(3,e.s+.1);e.auto=false}else if(a==='centre'){e.x=200}
 else if(a==='poser'){S.sel=e.id;e.auto=true;ajusterAuCadre(e);return}
 else if(a==='auto'){S.sel=e.id;placerAuto(e);S.aBouge=true;dessiner();return}
 else if(a==='g'||a==='d'||a==='h'||a==='b'){var pas=S.W*k()*.03;if(a==='g')e.x-=pas;if(a==='d')e.x+=pas;if(a==='h')e.y-=pas;if(a==='b')e.y+=pas;e.auto=false;S.aBouge=true}
 else if(a==='rot-'){e.rot=((e.rot||0)-15+360)%360}else if(a==='rot+'){e.rot=((e.rot||0)+15)%360}else if(a==='flip'){e.flip=!e.flip}
 else if(a==='esp-'){e.esp=Math.max(-2,(e.esp||0)-1)}else if(a==='esp+'){e.esp=Math.min(8,(e.esp||0)+1)}
 else if(emt){e.mat=emt.getAttribute('data-emat')}
 else if(p){e.police=p.getAttribute('data-pol')}else if(em){e.mode=em.getAttribute('data-em')}else if(ef){e.forme=ef.getAttribute('data-ef')}
 else if(ev.target.tagName==='INPUT'||ev.target.closest('label')){return}
 S.sel=e.id;if(e.type==='texte'&&e.auto&&S.style==='classique'&&(p||em||a==='esp-'||a==='esp+')){ajusterAuCadre(e);return}dessiner()});
$('liste').addEventListener('input',function(ev){var id=ev.target.getAttribute('data-edit');
 if(id){var e=trouver(+id);e.texte=ev.target.value;if(e.auto&&S.style==='classique')ajusterAuCadre(e);else dessiner();return}
 if(ev.target.getAttribute('data-act')==='creux'){var e3=trouver(+ev.target.closest('.sc-item').getAttribute('data-id'));e3.creux=ev.target.checked;dessiner();return}
 if(ev.target.getAttribute('data-act')==='courbe'){var it=ev.target.closest('.sc-item'),e2=trouver(+it.getAttribute('data-id'));e2.courbe=+ev.target.value;
  ev.target.nextElementSibling.textContent=e2.courbe;dessinerSansListe()}});
function dessinerSansListe(){var l=liste;liste=function(){};dessiner();liste=l}

/* ---- étape 6 : résumé et prix ---- */
function pret(){return true}
function prixTaille(){for(var i=0;i<D.tailles.length;i++)if(D.tailles[i][0]===S.taille)return D.tailles[i][3]||0;return 0}
function total(){var t=D.prix.base+prixTaille();S.els.forEach(function(e){t+=prixEl(e)});return t}
function resume(){var cl=S.style==='classique';
 var R=$('resume'),h='<div class="prc-sumrow"><span>Forme</span><b>'+F().nom+' — '+eur(D.prix.base)+'</b></div>'
  +'<div class="prc-sumrow"><span>Taille</span><b>'+String(S.W).replace('.',',')+' × '+String(S.H).replace('.',',')+' mm'+(prixTaille()?' — + '+eur(prixTaille()):'')+'</b></div>'
  +'<div class="prc-sumrow"><span>Style</span><b>'+(cl?'Cadre découpé, pièces collées':'Plaque pleine, gravée')+'</b></div>'
  +'<div class="prc-sumrow"><span>Matière</span><b>Contreplaqué 3 mm</b></div>';
 S.els.forEach(function(e,i){h+='<div class="prc-sumrow"><span>'+(cl?'Pièce '+(i+2):e.type==='texte'?'Texte':e.type==='dessin'?'Dessin':'Photo')+'</span><b>'+esc(nomEl(e))+' · '+commentEl(e)+' — + '+eur(prixEl(e))+'</b></div>'});
 h+='<div class="prc-sumrow prc-sumtot" style="border-bottom:0"><span>Total</span><b>'+eur(total())+'</b></div>';
 R.innerHTML=h;$('total').textContent=eur(total());$('prixtete').textContent=eur(total());
 $('n5').classList.toggle('done',S.els.length>0);
 var fl=S.els.filter(function(e){return e.flottant}).length;
 $('manque').textContent=fl?(fl>1?fl+' pièces ne touchent rien et tomberaient : faites-les glisser jusqu\'au cadre.':'Une pièce ne touche rien et tomberait : faites-la glisser jusqu\'au cadre.'):'';
 $('ajouter').disabled=!!fl}
$('ajouter').addEventListener('click',function(){if(!this.disabled)this.textContent='Ajouté au panier ✓ (maquette)'});

/* ---- le fichier de l'atelier, à la taille réelle : rouge = découpe, noir = gravure ----
   classique : le cadre, puis chaque pièce rangée à côté (numérotée), pour la découper à plat ;
   plaque pleine : la forme, et la gravure à sa place */
function fichier(){
 var Fh=$('fichier'),f=F(),cl=S.style==='classique',q=k(),W=S.W,H=S.H,R='#FF0000';
 function mm(v){return v/q}
 var fo='translate(5 5) scale('+sx().toFixed(5)+' '+sy().toFixed(5)+')';
 var h='<g transform="'+fo+'"><path fill="none" stroke="'+R+'" stroke-width="'+(.25/sx()).toFixed(3)+'" fill-rule="evenodd" d="'+(cl?f.cadre:f.d)+'"/></g>';
 var lw=Math.ceil(W+10),lh=Math.ceil(H+10);
 var Pf={cl:cl,plein:'#fff',trait:R,grav:'#111',o:1.6,coupe:.25,ombre:false,filtre:'style="filter:grayscale(1) contrast(1.15)"'};
 if(cl){
  h+='<text x="5" y="'+(H+9)+'" font-size="3" fill="#888" font-family="sans-serif">1 · cadre · contreplaqué</text>';
  var x=5,y=H+14,rang=0;
  S.els.forEach(function(e,i){
   var pw=mm(e.bw)+1,ph=mm(e.bh)+1;
   if(x>5&&x+pw>195){x=5;y+=rang+8;rang=0}
   var cx=x+pw/2,cy=y+ph/2;
   if(e.type==='texte')h+=pieceTexte(e,cx,cy,mm(e.fs),Pf,'f'+e.id);
   else if(e.type==='dessin'){var t=taille(e);h+=pieceDessin(e,cx,cy,mm(t.w),mm(t.h),Pf,'f'+e.id)}
   else{var t=taille(e);h+=piecePhoto(e,cx,cy,mm(t.w),mm(t.h),Pf,'f'+e.id)}
   h+='<text x="'+x+'" y="'+(y+ph+3.5)+'" font-size="3" fill="#888" font-family="sans-serif">'+(i+2)+' · '+matEl(e).nom.toLowerCase()+'</text>';
   x+=pw+6;rang=Math.max(rang,ph+4);lw=Math.max(lw,Math.ceil(x));lh=Math.max(lh,Math.ceil(y+rang+3))});
 }else{
  var gr='';
  function X(v){return (v-ox())/q+5} function Y(v){return (v-oy())/q+5}
  S.els.forEach(function(e){
   if(e.type==='texte')gr+=pieceTexte(e,X(e.x),Y(e.y),mm(e.fs),Pf,'f'+e.id);
   else if(e.type==='dessin'){var t=taille(e);gr+=pieceDessin(e,X(e.x),Y(e.y),mm(t.w),mm(t.h),Pf,'f'+e.id)}
   else{var t=taille(e);gr+=piecePhoto(e,X(e.x),Y(e.y),mm(t.w),mm(t.h),Pf,'f'+e.id)}});
  h='<clipPath id="fclip"><path transform="'+fo+'" clip-rule="evenodd" d="'+f.d+'"/></clipPath><g clip-path="url(#fclip)">'+gr+'</g>'+h;
 }
 Fh.setAttribute('viewBox','0 0 '+lw+' '+lh);Fh.innerHTML=h;
 var n=S.els.length;
 var trop=lw>200||lh>200;
 $('fnom').textContent=(trop?'⚠ plus grand que 200 × 200 mm : deux passages sur la F2 Ultra UV · ':'')+'decoration-'+f.id+'-'+S.taille+'-<n° de commande>.svg · '+lw+' × '+lh+' mm · '+'contreplaqué 3 mm · '
  +(cl?(n+1)+' pièce'+(n?'s':'')+' à découper'+(n?', puis à coller sur le cadre':''):'une seule pièce, gravée');
 var acr={};S.els.forEach(function(e){var m=matEl(e);if(m.acrylique)acr[m.nom.toLowerCase()]=(acr[m.nom.toLowerCase()]||0)+1});
 var ks=Object.keys(acr);if(cl&&ks.length)$('fnom').textContent+=' · à découper aussi dans : '+ks.map(function(x){return x+' ('+acr[x]+')'}).join(', ');
}

/* ---- la vue 3D : la décoration suspendue à son ruban, le logo au mur (three.js, chargé seulement quand on touche « 3D ») ---- */
var V3={pret:false,actif:false,n:0};
function chargerThree(fn){if(window.THREE)return fn();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 s.onload=fn;s.onerror=function(){$('msg3d').textContent='La vue 3D n\'a pas pu se charger.'};document.head.appendChild(s)}
function texture3D(cb){
 var X=ox(),Y=oy(),W=S.W*k(),H=S.H*k();
 if(!S.els.length)return cb(null);
 var src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+X+' '+Y+' '+W+' '+H+'" width="'+(W*3)+'" height="'+(H*3)+'">'+svg.querySelector('defs').outerHTML+'<g clip-path="url(#decoupe)">'+grav.innerHTML+'</g></svg>';
 var im=new Image();im.onload=function(){var c=document.createElement('canvas');c.width=W*3;c.height=H*3;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c)};
 im.onerror=function(){cb(null)};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src)}
/* le dos d'une pièce : sa couleur sans le détail gravé (moyenne de la couleur sur de petites zones, découpée à la forme de la pièce) */
function dosDe(cv){var w=cv.width,h=cv.height,n=Math.max(4,Math.round(Math.max(w,h)/48)),p=document.createElement('canvas');
 p.width=Math.max(1,Math.round(w/n));p.height=Math.max(1,Math.round(h/n));var px=p.getContext('2d');px.imageSmoothingEnabled=true;px.drawImage(cv,0,0,p.width,p.height);
 var d=document.createElement('canvas');d.width=w;d.height=h;var dx=d.getContext('2d');dx.imageSmoothingEnabled=true;dx.drawImage(p,0,0,w,h);
 dx.globalCompositeOperation='destination-in';dx.drawImage(cv,0,0);return d}
function aire(p){var a=0;for(var i=0,j=p.length-1;i<p.length;j=i++)a+=(p[j][0]+p[i][0])*(p[j][1]-p[i][1]);return Math.abs(a/2)}
V3.ouvrir=function(){
 $('stage').setAttribute('data-3d','1');majVue();$('msg3d').textContent='Chargement de la vue 3D…';
 chargerThree(function(){
  if(!V3.pret){
   var c=$('vue3d'),r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,1,3000);
   sc.add(new THREE.HemisphereLight(0xfff4e0,0x6b4f30,.6));var dl=new THREE.DirectionalLight(0xffffff,.55);dl.position.set(-120,220,260);sc.add(dl);var dl2=new THREE.DirectionalLight(0xffffff,.4);dl2.position.set(140,160,-260);sc.add(dl2);
   var mur=new THREE.Mesh(new THREE.PlaneGeometry(1200,900),new THREE.MeshBasicMaterial({color:0xf3ede3}));mur.position.set(0,0,-220);sc.add(mur);
   var lw=60,lh=lw/D.logoR,cadre=new THREE.Mesh(new THREE.BoxGeometry(lw+7,lh+7,2.5),new THREE.MeshStandardMaterial({color:0x9a7442,roughness:.6}));
   cadre.position.set(-120,55,-218.6);sc.add(cadre);
   var ombre=new THREE.Mesh(new THREE.PlaneGeometry(lw+12,lh+12),new THREE.MeshBasicMaterial({color:0x5a4430,transparent:true,opacity:.13}));ombre.position.set(-117,52,-219.8);sc.add(ombre);
   new THREE.TextureLoader().load(D.logo,function(tx){var lg=new THREE.Mesh(new THREE.PlaneGeometry(lw,lh),new THREE.MeshBasicMaterial({map:tx}));lg.position.set(-120,55,-217.2);sc.add(lg);V3.rendre()});
   V3.r=r;V3.sc=sc;V3.cam=cam;V3.rot=-.35;V3.pret=true;
   var tir=null;c.addEventListener('pointerdown',function(e){tir={x:e.clientX,r:V3.rot};try{c.setPointerCapture(e.pointerId)}catch(_){ }});
   c.addEventListener('pointermove',function(e){if(!tir)return;V3.rot=tir.r+(e.clientX-tir.x)/120;V3.rendre()});
   c.addEventListener('pointerup',function(){tir=null});c.addEventListener('pointercancel',function(){tir=null});
   window.addEventListener('resize',function(){if(V3.actif)V3.rendre()});
  }
  V3.actif=true;majVue();vignettes();V3.maj();
 })};
V3.fermer=function(){V3.actif=false;$('stage').removeAttribute('data-3d');majVue();vignettes()};
V3.rendre=function(){if(!V3.pret||!V3.actif)return;var c=$('vue3d'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
 V3.r.setSize(w,h,false);V3.cam.aspect=w/h;V3.cam.updateProjectionMatrix();if(V3.g)V3.g.rotation.y=V3.rot;V3.r.render(V3.sc,V3.cam)};
V3.maj=function(){if(!V3.actif)return;
 var f=F(),m=M(),a=sx(),b=sy(),H=S.H,W=S.W,cl=S.style==='classique';
 var anneaux=poly(cl?f.cadre:f.d).map(function(p){return p.map(function(q){return [q[0]*a,H-q[1]*b]})}).sort(function(x,y){return aire(y)-aire(x)});
 /* chaque contour extérieur porte les trous qu'il contient (le cadre a un grand trou au milieu) */
 function dedans(pt,poly){var c=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
  if(((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi))c=!c}return c}
 var formes=[];anneaux.forEach(function(r){var parent=null;for(var i=formes.length-1;i>=0;i--){if(dedans(r[0],formes[i].r)){parent=formes[i];break}}
  var prof=parent?parent.prof+1:0;var o={r:r,prof:prof,trous:[]};if(prof%2===1)parent.trous.push(r);else formes.push(o)});
 var mat=new THREE.MeshStandardMaterial({color:new THREE.Color(m.c[1]),roughness:m.acrylique?.25:.8,metalness:0});
 var porte=new THREE.Group();
 formes.forEach(function(o){var sh=new THREE.Shape(o.r.map(function(p){return new THREE.Vector2(p[0],p[1])}));
  o.trous.forEach(function(t){sh.holes.push(new THREE.Path(t.map(function(p){return new THREE.Vector2(p[0],p[1])})))});
  porte.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:false,curveSegments:1}),mat))});
 porte.position.set(-W/2,-H/2,-1.5);
 var g=new THREE.Group();g.add(porte);
 var tout=poly(f.d).map(function(p){return p.map(function(q){return [q[0]*a,H-q[1]*b]})});
 var top=[0,-1e9];tout[0].forEach(function(p){if(p[1]>top[1])top=p});
 var rub=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,200,8),new THREE.MeshStandardMaterial({color:0xb3262d}));rub.position.set(top[0]-W/2,top[1]-H/2+96,0);g.add(rub);
 if(V3.g){V3.sc.remove(V3.g);V3.g.traverse(function(o){if(o.geometry)o.geometry.dispose()})}
 V3.g=g;V3.sc.add(g);
 var t=Math.max(W,H);V3.cam.position.set(0,t*.08,t*2.75);V3.cam.lookAt(0,0,0);
 var id=++V3.n;
 texture3D(function(cv){if(id!==V3.n)return;
  if(cv){var tx=new THREE.CanvasTexture(cv);
   /* les pièces collées sont posées sur le cadre (3 mm plus haut) ; en plaque pleine, la gravure est sur la face */
   var pl=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:.9}));
   pl.position.set(W/2,H/2,cl?6.05:3.05);porte.add(pl);
   if(cl){var dos=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:tx,transparent:true,color:0x5a4228,opacity:.85,side:THREE.DoubleSide,alphaTest:.3}));
    for(var z=3.4;z<6;z+=.6){var c=dos.clone();c.position.set(W/2,H/2,z);porte.add(c)}
    /* vue de dos : le dos des pièces collées (même couleur que la pièce, sans la gravure), vu en miroir dans l'ouverture du cadre */
    var arriere=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(dosDe(cv)),transparent:true,alphaTest:.3,side:THREE.BackSide,roughness:.85}));
    arriere.position.set(W/2,H/2,3.05);porte.add(arriere)}}
  $('msg3d').textContent='Faites glisser pour tourner la décoration.';V3.rendre()});
 V3.rendre()};
function majVue(){[].forEach.call(document.querySelectorAll('.sc-vue button'),function(x){x.classList.toggle('on',(x.getAttribute('data-vue')==='3d')===V3.actif)})}
$('vueBtns').addEventListener('click',function(ev){var x=ev.target.closest('button');if(!x)return;voirCreation();if(x.getAttribute('data-vue')==='3d')V3.ouvrir();else{V3.fermer();dessiner()}});

/* l'en-tête du site reste collé en haut : l'aperçu se colle juste dessous */
function sousEntete(){var h=document.querySelector('header'),t=0;
 if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;
 document.documentElement.style.setProperty('--sc-top',t+'px')}
sousEntete();window.addEventListener('resize',sousEntete);window.addEventListener('load',sousEntete);
/* sur téléphone : l'aperçu reste collé en haut pendant les étapes, puis se décolle dès que la cliente arrive au résumé et aux prix */
var attente=false;
function decoller(){attente=false;
 var st=$('stage'),e3=$('etape3'),d=0;
 if(window.matchMedia('(max-width:900px)').matches&&G.vue==='creation'){
  var top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sc-top'))||0;
  d=Math.min(0,e3.getBoundingClientRect().top-(top+st.offsetHeight+8));
  d=Math.max(d,-(top+st.offsetHeight+30));}
 st.style.transform=d?'translateY('+Math.round(d)+'px)':'';
 st.style.visibility=d<=-(st.offsetHeight)?'hidden':''}
window.addEventListener('scroll',function(){if(!attente){attente=true;requestAnimationFrame(decoller)}},{passive:true});
window.addEventListener('resize',decoller);
/* ---- la galerie : vos photos, puis « Votre création » dès qu'elle commence ---- */
var G={vue:'creation',i:0,commence:true};
function vignettes(){
 var h='';
 if(G.commence)h+='<button type="button" class="sc-thc'+(G.vue==='creation'?' active':'')+'" data-v="c" aria-label="Voir votre création"><svg viewBox="-2 -2 104 104"><path d="'+F().d+'"/></svg>Votre<br>création</button>';
 D.photos.forEach(function(u,i){h+='<button type="button" class="'+(G.vue==='photo'&&G.i===i?'active':'')+'" data-v="'+i+'" aria-label="Voir la photo '+(i+1)+'"><img src="'+u+'" alt=""></button>'});
 $('vignettes').innerHTML=h;
 $('stage').setAttribute('data-vue',G.vue);
 if(D.photos.length)$('grande').src=D.photos[G.i];
 $('prec').hidden=$('suiv').hidden=G.vue!=='photo';
 $('aide').textContent=G.vue==='creation'?(V3.actif?'Vue 3D indicative : la décoration suspendue à son ruban.':S.els.length?'Faites glisser vos noms, vos dessins et vos photos avec le doigt pour les placer'+(S.style==='classique'?' : chaque pièce doit toucher le cadre.':'.'):'Aperçu indicatif de la forme et de la matière choisies.')
  :"Aperçu indicatif : sur le bois, la gravure ressort en brun, comme sur la photo d'exemple."+(G.commence?' Touchez « Votre création » pour revenir à votre support.':'');
}
function voirCreation(){G.commence=true;G.vue='creation';vignettes()}
$('vignettes').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var v=b.getAttribute('data-v');
 if(v==='c'){G.vue='creation'}else{G.vue='photo';G.i=+v;if(V3.actif)V3.fermer()}vignettes();if(G.vue==='creation')dessiner()});
$('prec').addEventListener('click',function(){G.i=(G.i+D.photos.length-1)%D.photos.length;vignettes()});
$('suiv').addEventListener('click',function(){G.i=(G.i+1)%D.photos.length;vignettes()});
/* ---- départ ---- */
majFormes();majTaille();majMatiere();majStyle();panneau();vignettes();dessiner();
ajouter({type:'texte',texte:'Camille',police:'great-vibes',mode:'decoupe',mat:'acr-rouge',esp:0,courbe:0,creux:false});S.sel=null;dessiner();
function reposer(){S.els.forEach(function(e){if(e.type==='texte'&&e.auto&&S.style==='classique')ajusterAuCadre(e)});dessiner()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(reposer);
[].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
/* ---- nos modèles prêts à personnaliser ---- */
function famDe(did){for(var i=0;i<D.elements.elements.length;i++)if(D.elements.elements[i].id===did)return D.elements.elements[i].cats[0];return ''}
function grpDe(f){for(var i=0;i<C.length;i++)if(C[i].id===f)return C[i].groupe;return 'tout'}
function baseModele(m){S.forme=m.forme;S.groupe=grpDe(m.forme);S.taille=m.taille;S.style=m.style;S.els=[];S.seq=0;S.sel=null;S.panneau=null;
 majFormes();majTaille();majMatiere();majStyle();panneau();dessiner()}
function composerModele(m){baseModele(m);
 m.textes.forEach(function(t){ajouter({type:'texte',texte:t.texte,police:t.police,mode:'decoupe',mat:t.mat,esp:0,courbe:0,creux:false})});
 var n=m.decos.length,debut=n===1?-90:-90+180/n;
 m.decos.forEach(function(did,i){var o={type:'dessin',did:did,fam:famDe(did),mode:'decoupe',mat:'contreplaque',rot:0,flip:false,s:.55};
  o.id=++S.seq;var p=place(o);o.x=p.x;o.y=p.y;S.els.push(o);dessiner();if(!placerAuto(o,debut+360*i/n))S.els=S.els.filter(function(x){return x!==o})});
 S.sel=null;S.panneau=null;panneau();dessiner()}
function appliquerModele(m){if(!m.els)return composerModele(m);baseModele(m);
 S.els=JSON.parse(JSON.stringify(m.els));S.seq=S.els.reduce(function(a,e){return Math.max(a,e.id)},0);
 var t=S.els.filter(function(e){return e.type==='texte'})[0];S.sel=t?t.id:null;dessiner()}
(function(){var R=$('mrail');if(!D.modeles||!D.modeles.length||!D.modeles[0].img)return;$('modeles').hidden=false;
 R.innerHTML=D.modeles.map(function(m,i){return '<button type="button" class="sc-mod" data-m="'+i+'"><img src="'+m.img+'" alt="Modèle '+esc(m.titre)+'"><b>'+esc(m.titre)+'</b><small>'+esc(m.sous)+'</small><em>'+eur(m.total)+'</em></button>'}).join('');
 R.addEventListener('click',function(ev){var b=ev.target.closest('.sc-mod');if(!b)return;var m=D.modeles[+b.getAttribute('data-m')];
  [].forEach.call(R.querySelectorAll('.sc-mod'),function(x){x.classList.toggle('on',x===b)});
  if(V3.actif)V3.fermer();voirCreation();appliquerModele(m);
  var ok=$('modOk');if(!ok){ok=document.createElement('p');ok.id='modOk';ok.className='sc-mod-ok';$('liste').parentNode.insertBefore(ok,$('liste'))}
  ok.innerHTML='Modèle « '+esc(m.titre)+' » choisi. <b>Écrivez votre prénom</b> à la place de « '+esc(m.textes[0].texte)+' » ci-dessous.';
  var inp=document.querySelector('#liste input[data-edit]');ok.scrollIntoView({behavior:'smooth',block:'center'});
  if(inp){inp.classList.add('sc-pulse');setTimeout(function(){inp.classList.remove('sc-pulse')},2400)}})})();
window.scComposer=function(i){composerModele(D.modeles[i]);return {els:JSON.parse(JSON.stringify(S.els)),total:total()}};
window.scDemo=function(o){o=o||{};S.forme=o.forme||'xmas_gift_box';S.taille=o.taille||'moyenne';S.style=o.style||'classique';S.els=[];S.seq=0;
 majFormes();majTaille();majMatiere();majStyle();dessiner();
 if(o.photo)ajouter({type:'photo',src:D.exemple,nom:'exemple',forme:o.forme2||'ovale'});
 ajouter({type:'texte',texte:o.texte||'Camille',police:o.police||'great-vibes',mode:o.mode||'decoupe',mat:o.mat||'contreplaque',esp:0,courbe:0,creux:false});S.sel=null;dessiner()};
window.scEtat=function(){return {S:S,total:total(),forme:F().nom,W:S.W,H:S.H}};
})();
"""

page = f"""<title>Créateur de décoration</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@400;600&family=Great+Vibes&family=Allura&family=Pacifico&display=swap">
<style>{css}</style>
<style>{CSS_MAQ}</style>
<div class="sc-bandeau"><b>Maquette</b> · rien n'est en ligne. Une décoration à suspendre que la cliente crée elle-même : le cadre et les pièces collées, comme le générateur Atomm.</div>
{header}
<main>
{fil}
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage sc-deco" id="stage" data-vue="creation"><span class="sc-tag">Votre décoration, en direct</span>
   <img class="sc-photo-g" id="grande" alt="Décoration en bois gravée">
   <button type="button" class="gallery-arrow gallery-arrow-prev" id="prec" aria-label="Photo précédente">‹</button>
   <button type="button" class="gallery-arrow gallery-arrow-next" id="suiv" aria-label="Photo suivante">›</button>
   <div class="sc-mur" aria-hidden="true"><img src="__LOGO__" alt=""></div>
   <svg id="scene" viewBox="40 14 320 536" role="img" aria-label="Aperçu de votre décoration"></svg>
   <p class="sc-astuce" id="astuce" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-6.5 6.5h-.6a6 6 0 0 1-4.6-2.2L4.2 14a1.5 1.5 0 0 1 2.3-1.9L9 14.5"/></svg><span class="sc-ast-l">Touchez un nom, un dessin ou une photo et faites-le glisser pour le placer</span><span class="sc-ast-c">Glissez une pièce pour la placer</span></p>
   <div class="sc-vue" id="vueBtns"><button type="button" data-vue="2d" class="on">Face</button><button type="button" data-vue="3d">3D</button></div>
   <canvas class="sc-3d" id="vue3d" aria-label="Vue 3D de la décoration"></canvas><p class="sc-3dmsg" id="msg3d"></p></div>
  <div class="gallery-thumbs" id="vignettes"></div>
  <p class="sc-aide" id="aide"></p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Fêtes</a></div>
  <div class="pd-titrerow"><h1>{titre}</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">{accroche}</p>
  <div class="price-lead" id="prixtete"></div>
  {HTML_OUTIL}
  {blocs_bas}
 </div>
</div></div>
{HTML_ATELIER}
</main>
{footer}
<script>{JS.replace("__DONNEES__", DONNEES)}</script>
"""
page = page.replace("__LOGO__", LOGO, 1)
open(sortie, "w", encoding="utf-8").write(page)
print(f"{sortie} : {len(page) // 1024} Ko")
