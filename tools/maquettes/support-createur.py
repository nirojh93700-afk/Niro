#!/usr/bin/env python3
"""Maquette « Créez votre support de téléphone » (12/11/2026) — RIEN en ligne.

Le gérant a montré le générateur de support de téléphone d'Atomm (xTool) et demandé le même genre d'outil
sur son site : la cliente crée elle-même son aperçu. La maquette part de la VRAIE fiche du site
(`support-telephone-bois-grave`) : en-tête, pied de page, titre, textes et volets viennent de la capture ;
la galerie devient un aperçu DESSINÉ (forme du dossier au choix, texte, dessin, photo, à glisser) et la
personnalisation devient un parcours en étapes. En bas : le fichier que l'atelier recevrait (rouge = découpe,
noir = gravure).

  python3 tools/maquettes/support-createur.py <capture.html> <dossier css> <sortie.html> <support-atomm.json>

v6 (12/11/2026, gérant : « tu crées pas toi-même, tu prends sur le site ») : les formes, tailles, fentes, pied et motifs
ajourés viennent de la couche DÉCOUPE des fichiers du générateur Atomm (téléchargés par support-atomm-telecharge.cjs,
triés par support-atomm-donnees.py) ; leurs dessins gravés ne sont pas repris (nos dessins, lettres, photos, textes).

capture = curl https://nivcreation.fr/produit/support-telephone-bois-grave ; dossier css = ses feuilles de style.
La sortie (photos intégrées) ne se commite pas.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, sortie, atomm = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]


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
titre = re.search(r"<h1>(.*?)</h1>", main, re.S).group(1)
accroche = re.search(r'</div><p style="color:var\(--ink-soft\);margin-top:0">(.*?)</p>', main, re.S).group(1)
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
blocs_bas += acc

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
assert PHOTOS, "aucune photo trouvée dans la galerie de la capture"
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

ATOMM = json.load(open(atomm, encoding="utf-8"))
DONNEES = json.dumps({"atomm": ATOMM, "photos": PHOTOS, "dessins": DESSINS, "lettres": LETTRES, "planche": PLANCHE, "exemple": EXEMPLE, "logo": LOGO, "logoR": LOGO_R, "polices": POLICES,
                      "prix": {"base": 12.9, "taille": {"petit": 0, "standard": 3, "grand": 6}, "element": 3, "ajoure": 3}},
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
@media (max-width:420px){.sc-ajout{font-size:.76rem;padding:10px 4px}.sc-forme{font-size:.72rem}.sc-taille small{display:none}.sc-motif{font-size:.68rem}}
"""

HTML_OUTIL = r"""
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre support</p><p class="prc-sub">Quatre petites étapes. Votre support se dessine au fur et à mesure. Choisissez la gravure, le motif ajouré, les deux, ou rien.</p></div>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n1">1</span><h3>La forme et la taille</h3></div>
  <div class="sc-formes" id="formes"></div>
  <p class="sc-sous">Pour quel téléphone ?</p>
  <div class="sc-tailles" id="tailles"></div>
 </section>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n2">2</span><h3>La décoration</h3></div>
  <div class="sc-modes" id="modes">
   <button type="button" class="sc-mode" data-m="grave"><b>Gravure · + 3 € par élément</b><small>texte, dessin, photo ou lettre fleurie</small></button>
   <button type="button" class="sc-mode" data-m="ajoure"><b>Motif ajouré · + 3 €</b><small>un motif découpé à travers le bois</small></button>
  </div>
  <div id="blocGrave">
   <p class="prc-legend">Ajoutez un texte, un dessin, votre photo ou une lettre fleurie : chaque élément gravé coûte + 3 €.</p>
   <div class="sc-ajouts">
    <button type="button" class="sc-ajout" data-a="texte"><svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>Un texte<small>prénom, date, petit mot</small></button>
    <button type="button" class="sc-ajout" data-a="dessin"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z"/></svg>Un dessin<small>nos modèles</small></button>
    <button type="button" class="sc-ajout" data-a="photo"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>Ma photo<small>gravée en brun</small></button>
    <button type="button" class="sc-ajout" data-a="lettre"><svg viewBox="0 0 24 24"><path d="M6 20L12 4l6 16M8.5 14h7"/><path d="M3 12h18" stroke-dasharray="2 2"/></svg>Une lettre fleurie<small>votre initiale + un nom</small></button>
   </div>
   <div class="sc-panneau" id="panneau"></div>
   <div id="liste"></div>
  </div>
  <div id="blocAjoure" hidden>
   <p class="prc-legend">Le motif est découpé à travers le bois : on voit au travers. Il peut s'ajouter à la gravure.</p>
   <div class="sc-motifs" id="motifs"></div>
   <p class="sc-sous">Combien de motifs ?</p>
   <div class="prc-chips" id="densites"></div>
   <label class="sc-case"><input type="checkbox" id="piedMotif" checked> Le motif aussi sur le pied</label>
   <p class="prc-hint" id="notePied" hidden>Avec ce motif, la découpe se fait sur le pied : le dossier reste plein.</p>
  </div>
 </section>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n3">3</span><h3>Les réglages</h3></div>
  <p class="sc-sous" style="margin-top:0">Inclinaison du téléphone</p>
  <div class="prc-chips" id="angles"></div>
  <label class="sc-case"><input type="checkbox" id="cable" checked> Passage pour le câble de charge</label>
  <p class="prc-hint">Contreplaqué de 3 mm. Les deux pièces s'emboîtent sans colle.</p>
 </section>

 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num" id="n4">4</span><h3>Votre création</h3></div>
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
 <p>À la commande, le site range dans le dossier de la commande le fichier de la création, à la taille réelle. Il change en direct ci-dessous quand vous modifiez le support au-dessus.</p>
 <div class="sc-agrid">
  <div class="sc-feuille"><svg id="fichier" viewBox="0 0 180 160" role="img" aria-label="Fichier de découpe et de gravure"></svg><p class="sc-fnom" id="fnom"></p></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : à graver</li></ul>
   <ul class="sc-points">
    <li><b>Les formes de découpe du générateur Atomm</b>Les quatre contours, les trois tailles, les fentes, le pied, le passage du câble et les huit motifs ajourés sont repris tels quels de leurs fichiers (couche découpe). Leurs dessins à graver ne sont pas repris : la gravure, ce sont nos dessins, nos lettres fleuries, la photo ou le texte de la cliente.</li>
    <li><b>Deux pièces, pour du bois de 3 mm</b>À gauche le dossier, à droite le pied, dont les pattes traversent les trois fentes. Petit 76 × 142 mm, standard 80 × 151 mm, grand 86 × 165 mm : la planche la plus grande fait 186 × 175 mm et tient dans la zone de 200 × 200 mm de la F2 Ultra UV.</li>
    <li><b>L'inclinaison change la longueur du pied</b>10°, 13°, 16° ou 20° : le fichier suit le choix de la cliente.</li>
    <li><b>La gravure, là où elle l'a posée</b>Texte, dessin et photo sont à la place et à la taille de son aperçu.</li>
    <li><b>Dans Gestion, comme les autres commandes</b>L'aperçu de la cliente et le fichier apparaissent dans la fiche atelier et dans le dossier de gravure du jour.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Découpez un support de chaque taille pour l'essayer : si les pattes sont trop serrées ou trop lâches dans les fentes, je règle le jeu.</li>
  <li>Prix (les vôtres, 12/11) : support petit 12,90 € · standard + 3 € · grand + 6 € · chaque élément gravé + 3 € · motif ajouré + 3 € (gravure et motif possibles ensemble).</li>
  <li>Une vraie photo par forme et par motif ajouré sera à prendre avant la mise en vente.</li>
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

/* ---- formes, tailles, fentes, pied et motifs ajourés : couche découpe des fichiers du générateur Atomm (mm, coin haut gauche = 0,0) ---- */
var A=D.atomm;
var FORMES=[{id:'rectangle',nom:'Rectangle arrondi'},{id:'arche',nom:'Arche'},{id:'chat',nom:'Tête de chat'},{id:'ours',nom:"Oreilles d'ours"}];
var TAILLES=[{id:'petit',nom:'Petit',ex:'iPhone SE, petits téléphones'},{id:'standard',nom:'Standard',ex:'iPhone 16 / 17, Galaxy S'},{id:'grand',nom:'Grand',ex:'Pro Max, Ultra, grands téléphones'}];
var MOTIFS=[{id:'coeurs',nom:'Cœurs'},{id:'pattes',nom:'Pattes'},{id:'soleil',nom:'Soleil'},{id:'nid',nom:"Nid d'abeille"},{id:'losanges',nom:'Losanges'},{id:'persienne',nom:'Persienne'},{id:'fenetre',nom:'Fenêtre'},{id:'etoiles',nom:'Étoiles'}];
var DENSITES=[{id:'moins',nom:'Moins'},{id:'moyen',nom:'Moyen'},{id:'plus',nom:'Plus'}], ANGLES=[10,13,16,20];
var S={forme:'rectangle',taille:'standard',grave:true,ajoure:false,motif:'coeurs',densite:'moyen',piedMotif:true,angle:13,cable:true,
 els:[],sel:null,panneau:null,police:'playfair',seq:0};
function T(){return A.tailles[S.taille]}
function base(){return A.base[S.taille+'|'+S.forme+'|'+(S.cable?1:0)+'|'+S.angle]}
function trous(){return S.ajoure?(A.trous[S.taille+'|'+S.forme+'|'+S.motif+'|'+S.densite]||''):''}
function piedSeul(){return S.ajoure&&!(A.trous[S.taille+'|'+S.forme+'|'+S.motif+'|'+S.densite])}
function trousPied(){return S.ajoure&&(S.piedMotif||piedSeul())?(A.trousPied[S.taille+'|'+S.motif+'|'+S.densite+'|'+S.angle]||''):''}
function fentesD(b){return b.fentes.map(function(f){return 'M'+f[0]+' '+f[1]+'H'+f[2]+'V'+f[3]+'H'+f[0]+'Z'}).join('')}
function vignetteD(f){return A.base['standard|'+f+'|1|13'].dos}
function poly(d){return d.split(/(?=M)/).filter(Boolean).map(function(sp){var n=sp.match(/-?[\d.]+/g).map(Number),o=[];for(var i=0;i+1<n.length;i+=2)o.push([n[i],n[i+1]]);return o})}
function nomDe(l,id){for(var i=0;i<l.length;i++)if(String(l[i].id)===String(id))return l[i].nom;return id}
function police(k){for(var i=0;i<D.polices.length;i++)if(D.polices[i][0]===k)return D.polices[i];return D.polices[0]}
/* la scène : le dossier à l'échelle 3 (1 mm = 3 unités), bas du dossier à y = 532, centré sur x = 200 */
function ox(){return 200-1.5*T().W} function oy(){return 532-3*T().H}
function zoneHaut(){ /* première hauteur (mm) où le dossier a toute sa largeur : la gravure commence dessous */
 var c=poly(base().dos)[0],W=T().W;
 for(var y=1;y<70;y+=.5){var xs=[];
  for(var i=0,j=c.length-1;i<c.length;j=i++){var a=c[i],b=c[j];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))}
  if(xs.length>=2&&Math.max.apply(0,xs)-Math.min.apply(0,xs)>=W*.88)return y+4}
 return 10}

var svg=$('scene');
svg.innerHTML='<defs>'
 +'<linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1dfbd"/><stop offset=".55" stop-color="#e8d2ab"/><stop offset="1" stop-color="#dfc59a"/></linearGradient>'
 +'<filter id="veine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.3 0.004" numOctaves="3" seed="7" result="n"/>'
 +'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 -0.12"/><feComposite operator="in" in2="SourceGraphic"/></filter>'
 +'<filter id="brun" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.33  0 0 0 0 0.19  0 0 0 0 0.08  0 0 0 0.92 0"/></filter>'
 +'<filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0 0 0 1 0"/>'
 +'<feComponentTransfer><feFuncR type="table" tableValues="0.26 0.62 0.93"/><feFuncG type="table" tableValues="0.14 0.44 0.82"/><feFuncB type="table" tableValues="0.06 0.26 0.64"/></feComponentTransfer></filter>'
 +'<filter id="flou"><feGaussianBlur stdDeviation="9"/></filter>'
 +'<clipPath id="decoupe"><path id="decoupeP"/></clipPath></defs>'
 +'<ellipse cx="200" cy="538" rx="150" ry="13" fill="#3a2a16" opacity=".22" filter="url(#flou)"/>'
 +'<g id="ombreG"><path id="ombreP" fill="#6b4a25" opacity=".35" fill-rule="evenodd"/></g>'
 +'<g id="plaqueG"><path id="dos" fill="url(#bois)" fill-rule="evenodd"/><path id="dosV" fill="#fff" fill-rule="evenodd" filter="url(#veine)" opacity=".5"/>'
 +'<path id="dosB" fill="none" stroke="#a9834f" stroke-width=".4" opacity=".75"/><path id="trousB" fill="none" stroke="#7a5631" stroke-width=".35" opacity=".7"/></g>'
 +'<g id="grav" clip-path="url(#decoupe)"></g>'
 +'<g id="rebord"></g><g id="poignee"></g>';
var grav=$('grav'), poignee=$('poignee');

function plaque(){ /* contour, fentes, trous ajourés et rebord, tels que dans le fichier de découpe */
 var b=base(),tr=trous(),d=b.dos+fentesD(b)+tr,X=ox(),Y=oy();
 $('plaqueG').setAttribute('transform','translate('+X+','+Y+') scale(3)');
 $('ombreG').setAttribute('transform','translate('+(X+5)+','+(Y+3)+') scale(3)');
 $('decoupeP').setAttribute('transform','translate('+X+','+Y+') scale(3)');
 $('decoupeP').setAttribute('d',b.dos+tr);$('decoupeP').setAttribute('clip-rule','evenodd');
 ['dos','dosV','ombreP'].forEach(function(i){$(i).setAttribute('d',d)});
 $('dosB').setAttribute('d',b.dos);$('trousB').setAttribute('d',tr);
 var h='';
 b.fentes.forEach(function(f,i){var x0=X+3*f[0],x1=X+3*f[2],y=Y+3*f[1],ep=3*(f[3]-f[1]);
  if(i===1){h+='<rect x="'+x0+'" y="'+y+'" width="'+(x1-x0)+'" height="'+ep+'" fill="#b48c58" opacity=".6"/>';return}
  h+='<path d="M'+(x0-4)+','+(y-10)+'L'+(x1+4)+','+(y-10)+'L'+x1+','+y+'L'+x0+','+y+'Z" fill="#ead6ae" stroke="#a9834f" stroke-width="1"/>'
   +'<rect x="'+x0+'" y="'+y+'" width="'+(x1-x0)+'" height="'+ep+'" fill="#c9a874" stroke="#a9834f" stroke-width="1"/>'});
 $('rebord').innerHTML=h;
 var tp=trousPied();$('piedVue').hidden=!tp;
 if(tp){$('piedSvg').setAttribute('viewBox','-2 -2 '+(T().W+4)+' '+(b.piedH+4));$('piedP').setAttribute('d',b.pied+tp)}}

var hautTrous={};
function haut(d){if(!d)return 1e9;if(hautTrous[d]==null){var m=1e9;poly(d).forEach(function(c){c.forEach(function(p){if(p[1]<m)m=p[1]})});hautTrous[d]=m}return hautTrous[d]}
function limites(){var t=T(),f=base().fentes[0],bas=Math.min(f[1]-5,haut(trous())-4);return{x0:ox()+15,x1:ox()+3*(t.W-5),y0:oy()+3*zoneHaut(),y1:oy()+3*bas}}
function taille(e){ /* largeur et hauteur de l'élément dans la scène */
 var k=T().W/80;
 if(e.type==='texte'){return{w:0,h:30*e.s*k}}
 if(e.type==='dessin'){var w=118*e.s*k;return{w:w,h:w/e.r}}
 if(e.type==='lettre'){var w2=(e.r>1.05?165:150)*e.s*k;return{w:w2,h:w2/e.r}}
 var c=128*e.s*k;return{w:c,h:c}}
function largTexte(){return 3*T().W-32}
function borner(e){var L=limites(),t=taille(e),hw=e.type==='texte'?36:t.w/2,hh=t.h/2,lo=L.x0+hw,hi=L.x1-hw;
 e.x=lo>hi?200:Math.max(lo,Math.min(hi,e.x));
 e.y=Math.max(L.y0+hh,Math.min(L.y1-hh,e.y))}

function dessiner(){
 plaque();
 grav.innerHTML='';poignee.innerHTML='';
 if(S.grave)S.els.forEach(function(e){
  borner(e);
  var g=el('g',{'class':'sc-el','data-id':e.id},grav),t=taille(e);
  if(e.type==='texte'){
   var tx=el('text',{x:e.x,y:e.y,'text-anchor':'middle','dominant-baseline':'central','font-family':police(e.police)[2],'font-size':t.h,fill:'#55331a',opacity:.9},g);
   tx.textContent=e.texte||'Votre texte';
   var bb=tx.getBBox(),max=largTexte(); if(bb.width>max){tx.setAttribute('font-size',t.h*max/bb.width)}
  }else if(e.type==='dessin'){
   el('image',{href:e.src,x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,filter:'url(#brun)',opacity:.92},g);
  }else if(e.type==='lettre'){
   el('image',{href:e.src,x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,filter:'url(#brun)',opacity:.92},g);
   if(e.nom){var by=e.y-t.h/2+t.h*(e.b[0]+e.b[1])/2,bh=t.h*(e.b[1]-e.b[0]);
    var tl=el('text',{x:e.x,y:by,'text-anchor':'middle','dominant-baseline':'central','font-family':police(e.police)[2],'font-size':bh*.82,fill:'#55331a',opacity:.92},g);
    tl.textContent=e.nom;var lb=tl.getBBox();if(lb.width>t.w*.92)tl.setAttribute('font-size',bh*.82*t.w*.92/lb.width)}
  }else{
   el('image',{href:e.src,x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,preserveAspectRatio:'xMidYMid slice',filter:'url(#sepia)'},g);
   el('rect',{x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,fill:'none',stroke:'#4b3018','stroke-width':1.6},g);
  }
  if(S.sel===e.id){var b=g.getBBox();
   el('rect',{x:b.x-5,y:b.y-5,width:b.width+10,height:b.height+10,rx:6,fill:'none',stroke:'#a98935','stroke-width':1.6,'stroke-dasharray':'6 5','pointer-events':'none'},poignee)}
 });
 fichier();liste();resume();if(V3.pret)V3.maj();
 if(G.commence){var v=document.querySelector('.sc-thc path');if(v)v.setAttribute('d',vignetteD(S.forme))}
}

/* ---- glisser ---- */
var prise=null;
function pt(ev){var p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function trouver(id){for(var i=0;i<S.els.length;i++)if(S.els[i].id===id)return S.els[i]}
svg.addEventListener('pointerdown',function(ev){
 var g=ev.target.closest&&ev.target.closest('.sc-el'); if(!g){if(S.sel){S.sel=null;dessiner()}return}
 var e=trouver(+g.getAttribute('data-id')),p=pt(ev); S.sel=e.id; prise={e:e,dx:e.x-p.x,dy:e.y-p.y};
 try{svg.setPointerCapture(ev.pointerId)}catch(_){ } ev.preventDefault(); dessiner()});
svg.addEventListener('pointermove',function(ev){if(!prise)return;var p=pt(ev);prise.e.x=p.x+prise.dx;prise.e.y=p.y+prise.dy;ev.preventDefault();dessiner()});
function lacher(){prise=null}
svg.addEventListener('pointerup',lacher);svg.addEventListener('pointercancel',lacher);

/* ---- étapes 1 et 3 : forme, taille, motif, densité, inclinaison ---- */
function boutons(id,liste,cls,html){$(id).innerHTML=liste.map(function(o){return '<button type="button" class="'+cls+'" data-v="'+o.id+'">'+html(o)+'</button>'}).join('')}
boutons('formes',FORMES,'sc-forme',function(f){return '<svg viewBox="-3 -3 86 157"><path d="'+vignetteD(f.id)+'"/></svg>'+f.nom});
boutons('tailles',TAILLES,'sc-taille',function(t){var a=A.tailles[t.id];return '<b>'+t.nom+'</b><small>'+t.ex+'</small><span>'+a.W+' × '+a.H+' mm</span><em>'+(D.prix.taille[t.id]?'+ '+eur(D.prix.taille[t.id]):eur(D.prix.base))+'</em>'});
boutons('motifs',MOTIFS,'sc-motif',function(m){var b=A.base['standard|rectangle|1|13'],t=A.trous['standard|rectangle|'+m.id+'|moyen'];
 if(t)return '<svg viewBox="-3 -3 86 157"><path d="'+b.dos+t+'"/></svg>'+m.nom;
 return '<svg viewBox="-3 -3 86 '+(b.piedH+6)+'"><path d="'+b.pied+(A.trousPied['standard|'+m.id+'|moyen|13']||'')+'"/></svg>'+m.nom+'<small>sur le pied</small>'});
boutons('densites',DENSITES,'prc-chip',function(d){return d.nom});
boutons('angles',ANGLES.map(function(a){return{id:a}}),'prc-chip',function(a){return a.id+'°'+(a.id===13?' · conseillé':'')});
function majChoix(){
 function on(id,v){[].forEach.call($(id).querySelectorAll('button'),function(b){b.classList.toggle('on',b.getAttribute('data-v')===String(v))})}
 on('formes',S.forme);on('tailles',S.taille);on('motifs',S.motif);on('densites',S.densite);on('angles',S.angle);
 [].forEach.call(document.querySelectorAll('.sc-mode'),function(b){ b.classList.toggle('on',!!S[b.getAttribute('data-m')])});
 $('blocGrave').hidden=!S.grave;$('blocAjoure').hidden=!S.ajoure;
 $('piedMotif').checked=S.piedMotif||piedSeul();$('piedMotif').disabled=piedSeul();
 $('notePied').hidden=!piedSeul();$('cable').checked=S.cable}
function choisir(cle,val,num){S[cle]=num?+val:val;majChoix();voirCreation();S.els.forEach(borner);if(chevauche())ranger();dessiner()}
[['formes','forme'],['tailles','taille'],['motifs','motif'],['densites','densite'],['angles','angle',1]].forEach(function(c){
 $(c[0]).addEventListener('click',function(ev){var b=ev.target.closest('button');if(b)choisir(c[1],b.getAttribute('data-v'),c[2])})});
$('modes').addEventListener('click',function(ev){var b=ev.target.closest('.sc-mode');if(!b)return;var m=b.getAttribute('data-m');S.sel=null;S.panneau=null;panneau();choisir(m,!S[m])});
$('piedMotif').addEventListener('change',function(){S.piedMotif=this.checked;voirCreation();dessiner()});
$('cable').addEventListener('change',function(){S.cable=this.checked;voirCreation();dessiner()});
/* un changement de forme ou de taille : si deux éléments se retrouvent l'un sur l'autre, on les range du haut vers le bas */
function larg(e){return e.type==='texte'?largTexte():taille(e).w}
function chevauche(){for(var i=0;i<S.els.length;i++)for(var j=i+1;j<S.els.length;j++){var a=S.els[i],b=S.els[j];
 if(Math.abs(a.y-b.y)<(taille(a).h+taille(b).h)/2+4&&Math.abs(a.x-b.x)<(larg(a)+larg(b))/2)return true}return false}
function ranger(){var L=limites(),els=S.els.slice().sort(function(a,b){return a.y-b.y}),n=els.length,dispo=L.y1-L.y0-8*(n-1),tot=0;
 els.forEach(function(e){tot+=taille(e).h});
 if(tot>dispo){var k=dispo/tot;els.forEach(function(e){e.s=Math.max(.4,e.s*k)});tot=0;els.forEach(function(e){tot+=taille(e).h})}
 var y=L.y0+Math.max(0,(dispo-tot)/2);els.forEach(function(e){var h=taille(e).h;e.y=y+h/2;y+=h+8})}

/* ---- étape 2 (gravé) : ajouter ---- */
function centre(){var L=limites();return{x:200,y:(L.y0+L.y1)/2}}
function place(o){ /* la place la plus libre : un texte va d'abord en bas, une image d'abord au milieu */
 var L=limites(),c=centre().y,h=taille(o).h/2,haut=L.y0+h+6,bas=L.y1-h-6,
  essais=o.type==='texte'?[bas,haut,c,bas-40,haut+40]:[c,haut,bas],meilleur=essais[0],marge=-1e9;
 for(var k=0;k<essais.length;k++){var m=1e9;
  S.els.forEach(function(e){m=Math.min(m,Math.abs(e.y-essais[k])-taille(e).h/2-h)});
  if(m>=8)return{x:200,y:essais[k]}; if(m>marge){marge=m;meilleur=essais[k]}}
 return{x:200,y:meilleur}}
function ajouter(o){o.id=++S.seq;o.s=o.s||1;
 if(o.type!=='texte'&&S.els.length){o.s=.7}
 var p=place(o);o.x=p.x;o.y=p.y;
 S.els.push(o);S.sel=o.id;S.panneau=null;panneau();voirCreation();dessiner()}
function polsHtml(courante){var h='<div class="prc-pols">';D.polices.forEach(function(p){
 h+='<button type="button" class="prc-pol'+(p[0]===courante?' on':'')+'" data-pol="'+p[0]+'" style="font-family:'+p[2].replace(/"/g,"'")+'">'+p[1]+'</button>'});return h+'</div>'}
function panneau(){
 var P=$('panneau'),h='';
 [].forEach.call(document.querySelectorAll('.sc-ajout'),function(b){b.classList.toggle('on',b.getAttribute('data-a')===S.panneau)});
 if(S.panneau==='texte'){
  h='<div class="prc-fields"><div class="field"><label for="ntexte">Votre texte <span class="prc-opt">(30 caractères)</span></label>'
   +'<div class="sc-ligne"><input id="ntexte" type="text" maxlength="30" placeholder="Ex. Camille · 14.07.2019"><button type="button" class="sc-btn" id="okTexte">Ajouter</button></div></div>'
   +'<div class="field"><label>Écriture</label>'+polsHtml(S.police)+'</div></div>';
 }else if(S.panneau==='dessin'){
  h='<div class="prc-fields"><p class="prc-legend">Touchez un dessin : il se pose sur le support.</p><div class="prc-grid picked" style="grid-template-columns:repeat(auto-fill,minmax(84px,1fr))">';
  D.dessins.forEach(function(d){h+='<button type="button" class="prc-model on" data-n="'+d.n+'"><span class="prc-mn">'+d.n+'</span><span class="prc-mimg"><img src="'+d.src+'" alt="Dessin n° '+d.n+'"></span></button>'});
  h+='</div></div>';
 }else if(S.panneau==='lettre'){
  h='<div class="prc-fields"><p class="prc-legend">Choisissez votre initiale : elle est gravée dans ce style fleuri. Le nom s\'écrit dans la bande, au milieu de la lettre.</p>'
   +'<img class="sc-planche" src="'+D.planche+'" alt="Alphabet fleuri de A à Z"><div class="prc-letters">';
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(L){h+='<button type="button" class="prc-let'+(S.lettre===L?' on':'')+'" data-l="'+L+'">'+L+'</button>'});
  h+='</div><div class="field" style="margin-top:12px"><label for="nlettre">Le nom dans la bande <span class="prc-opt">(facultatif, compris, 20 caractères)</span></label>'
   +'<div class="sc-ligne"><input id="nlettre" type="text" maxlength="20" placeholder="Ex. Martin"><button type="button" class="sc-btn" id="okLettre"'+(S.lettre?'':' disabled')+'>Ajouter</button></div></div>'
   +'<div class="field"><label>Écriture du nom</label>'+polsHtml(S.police)+'</div></div>';
 }else if(S.panneau==='photo'){
  h='<div class="prc-fields"><p class="prc-legend">Un portrait, un couple, un animal : la photo est gravée en brun dans le bois. Choisissez une image nette et bien éclairée.</p>'
   +'<div class="sc-photo"><label class="sc-btn">Choisir ma photo<input type="file" accept="image/*" id="fphoto"></label>'
   +'<button type="button" class="sc-btn clair" id="exPhoto">Essayer avec une photo d\'exemple</button></div></div>';
 }
 P.innerHTML=h;
 var n=$('ntexte'); if(n){n.focus()}
}
document.querySelector('.sc-ajouts').addEventListener('click',function(ev){var b=ev.target.closest('.sc-ajout');if(!b)return;
 var a=b.getAttribute('data-a');S.panneau=S.panneau===a?null:a;panneau()});
$('panneau').addEventListener('click',function(ev){
 var p=ev.target.closest('[data-pol]'); if(p){S.police=p.getAttribute('data-pol');
  [].forEach.call($('panneau').querySelectorAll('.prc-pol'),function(x){x.classList.toggle('on',x===p)});return}
 if(ev.target.id==='okTexte'){var v=$('ntexte').value.trim();if(!v){$('ntexte').focus();return}ajouter({type:'texte',texte:v,police:S.police});return}
 var m=ev.target.closest('.prc-model'); if(m){var n=+m.getAttribute('data-n');for(var i=0;i<D.dessins.length;i++)if(D.dessins[i].n===n)ajouter({type:'dessin',n:n,src:D.dessins[i].src,r:D.dessins[i].r});return}
 var lb=ev.target.closest('.prc-let'); if(lb){S.lettre=lb.getAttribute('data-l');
  [].forEach.call($('panneau').querySelectorAll('.prc-let'),function(x){x.classList.toggle('on',x===lb)});$('okLettre').disabled=false;return}
 if(ev.target.id==='okLettre'){if(!S.lettre)return;var Lt=D.lettres[S.lettre];
  ajouter({type:'lettre',L:S.lettre,src:Lt.src,r:Lt.r,b:Lt.b,nom:$('nlettre').value.trim(),police:S.police});return}
 if(ev.target.id==='exPhoto'){ajouter({type:'photo',src:D.exemple,nom:"photo d'exemple"})}});
$('panneau').addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.id==='ntexte'){ev.preventDefault();$('okTexte').click()}
 if(ev.key==='Enter'&&ev.target.id==='nlettre'){ev.preventDefault();$('okLettre').click()}});
$('panneau').addEventListener('change',function(ev){if(ev.target.id!=='fphoto')return;var f=ev.target.files&&ev.target.files[0];if(!f)return;
 var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
   var c=document.createElement('canvas'),k=Math.min(1,700/Math.max(im.width,im.height));c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);ajouter({type:'photo',src:c.toDataURL('image/jpeg',.82),nom:f.name})};im.src=r.result};r.readAsDataURL(f)});

/* ---- la liste des éléments posés ---- */
function nomEl(e){return e.type==='texte'?'« '+(e.texte||'')+' »':e.type==='dessin'?'Dessin n° '+e.n:e.type==='lettre'?'Lettre '+e.L+(e.nom?' · « '+e.nom+' »':''):'Ma photo'}
function prixEl(i){return '+ '+eur(D.prix.element)}
function principal(){ /* l'élément qui fixe le prix de départ : la photo, sinon le dessin, sinon le texte */
 var o=['photo','dessin','lettre','texte'];for(var k=0;k<o.length;k++)for(var i=0;i<S.els.length;i++)if(S.els[i].type===o[k])return i;return -1}
function liste(){
 var L=$('liste'),act=document.activeElement,garde=act&&act.getAttribute&&act.getAttribute('data-edit');
 if(garde){
  [].forEach.call(L.querySelectorAll('.sc-item'),function(d){d.classList.toggle('on',+d.getAttribute('data-id')===S.sel)});
  var t=L.querySelector('.sc-item[data-id="'+garde+'"] .sc-inom b'),e=trouver(+garde); if(t&&e)t.textContent=nomEl(e); return}
 if(!S.els.length){L.innerHTML='<p class="sc-vide">Rien n\'est encore gravé. Ajoutez un texte, un dessin ou votre photo.</p>';return}
 var h='<div class="sc-liste">';
 S.els.forEach(function(e,i){
  var vig=e.type==='texte'?'Aa':'<img src="'+e.src+'" alt="">';
  h+='<div class="sc-item'+(S.sel===e.id?' on':'')+'" data-id="'+e.id+'"><div class="sc-itete"><span class="sc-vig">'+vig+'</span>'
   +'<span class="sc-inom"><b>'+esc(nomEl(e))+'</b><small>'+prixEl(i)+'</small></span>'
   +'<button type="button" class="sc-x" data-act="x" aria-label="Retirer">✕</button></div>';
  if(S.sel===e.id){
   if(e.type==='texte'){h+='<input type="text" maxlength="30" value="'+esc(e.texte)+'" data-edit="'+e.id+'" aria-label="Modifier le texte">'+polsHtml(e.police)}
   if(e.type==='lettre'){h+='<input type="text" maxlength="20" value="'+esc(e.nom||'')+'" placeholder="Le nom dans la bande (facultatif)" data-edit="'+e.id+'" aria-label="Modifier le nom">'+polsHtml(e.police)}
   h+='<div class="sc-outils"><span>Taille</span><button type="button" class="sc-o" data-act="moins" aria-label="Plus petit">−</button><button type="button" class="sc-o" data-act="plus" aria-label="Plus grand">+</button>'
    +'<button type="button" class="sc-o" data-act="centre">Centrer</button></div>';
  }
  h+='</div>'});
 L.innerHTML=h+'</div>';
}
$('liste').addEventListener('click',function(ev){
 var it=ev.target.closest('.sc-item'); if(!it)return; var e=trouver(+it.getAttribute('data-id')); if(!e)return;
 var a=ev.target.getAttribute('data-act'),p=ev.target.closest('[data-pol]');
 if(a==='x'){S.els=S.els.filter(function(x){return x!==e});if(S.sel===e.id)S.sel=null;dessiner();return}
 if(a==='moins'){e.s=Math.max(.5,e.s-.12)}else if(a==='plus'){e.s=Math.min(1.9,e.s+.12)}else if(a==='centre'){e.x=200}
 else if(p){e.police=p.getAttribute('data-pol')}
 else if(ev.target.tagName==='INPUT'){return}
 S.sel=e.id;dessiner()});
$('liste').addEventListener('input',function(ev){var id=ev.target.getAttribute('data-edit');if(!id)return;var e=trouver(+id);if(e.type==='lettre')e.nom=ev.target.value;else e.texte=ev.target.value;dessiner()});

/* ---- étape 4 : résumé et prix ---- */
function pret(){return !(S.grave&&!S.els.length)}
function total(){return D.prix.base+D.prix.taille[S.taille]+(S.grave?S.els.length*D.prix.element:0)+(S.ajoure?D.prix.ajoure:0)}
function resume(){
 var R=$('resume'),p=principal(),h='<div class="prc-sumrow"><span>Forme</span><b>'+nomDe(FORMES,S.forme)+' — '+eur(D.prix.base)+'</b></div>'
  +'<div class="prc-sumrow"><span>Taille</span><b>'+nomDe(TAILLES,S.taille)+' · '+T().W+' × '+T().H+' mm'+(D.prix.taille[S.taille]?' — + '+eur(D.prix.taille[S.taille]):'')+'</b></div>';
 if(S.ajoure){h+='<div class="prc-sumrow"><span>Ajouré</span><b>'+nomDe(MOTIFS,S.motif)+' · '+nomDe(DENSITES,S.densite).toLowerCase()+(piedSeul()?' · découpé sur le pied':S.piedMotif?' · aussi sur le pied':'')+' — + '+eur(D.prix.ajoure)+'</b></div>'}
 if(S.grave){
  if(!S.els.length)h+='<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss">à choisir</b></div>';
  S.els.forEach(function(e,i){h+='<div class="prc-sumrow"><span>'+(e.type==='texte'?'Texte':e.type==='dessin'?'Dessin':e.type==='lettre'?'Lettre fleurie':'Photo')+'</span><b>'+esc(nomEl(e))
   +(e.type==='texte'||(e.type==='lettre'&&e.nom)?' · '+police(e.police)[1]:'')+' — + '+eur(D.prix.element)+'</b></div>'})}
 if(!S.grave&&!S.ajoure)h+='<div class="prc-sumrow"><span>Décoration</span><b>aucune (bois nu)</b></div>';
 h+='<div class="prc-sumrow"><span>Réglages</span><b>'+S.angle+'° · '+(S.cable?'passage du câble':'sans passage du câble')+' · bois 3 mm</b></div>';
 h+='<div class="prc-sumrow prc-sumtot" style="border-bottom:0"><span>Total</span><b>'+(pret()?eur(total()):'dès '+eur(D.prix.base))+'</b></div>';
 R.innerHTML=h;
 var txt=pret()?eur(total()):'dès '+eur(D.prix.base);
 $('total').textContent=txt;$('prixtete').textContent=txt;
 $('n2').classList.toggle('done',pret());$('n4').classList.toggle('done',pret());
 $('ajouter').disabled=!pret();$('ajouter').style.opacity=pret()?1:.5;
 $('manque').textContent=pret()?'':'Ajoutez un élément à graver, ou décochez la gravure pour un support sans gravure.';
}
$('ajouter').addEventListener('click',function(){if(!pret())return;this.textContent='Ajouté au panier ✓ (maquette)'});

/* ---- le fichier de l'atelier : les deux pièces à la taille réelle, rouge = découpe, noir = gravure ---- */
function fichier(){
 var F=$('fichier'),b=base(),t0=T(),R='fill="none" stroke="#FF0000" stroke-width="0.25"',lh=Math.max(t0.lh,b.lh);
 function X(v){return ((v-ox())/3+5).toFixed(2)} function Y(v){return ((v-oy())/3+5).toFixed(2)} function L(v){return (v/3).toFixed(2)}
 F.setAttribute('viewBox','0 0 '+t0.lw+' '+lh);
 var h='';
 if(S.grave)S.els.forEach(function(e){var t=taille(e);
  if(e.type==='texte'){h+='<text x="'+X(e.x)+'" y="'+Y(e.y)+'" text-anchor="middle" dominant-baseline="central" font-family="'+police(e.police)[2].replace(/"/g,"'")+'" font-size="'+L(t.h)+'" fill="#111" data-t="'+L(largTexte())+'">'+esc(e.texte||'')+'</text>'}
  else if(e.type==='dessin'){h+='<image href="'+e.src+'" x="'+X(e.x-t.w/2)+'" y="'+Y(e.y-t.h/2)+'" width="'+L(t.w)+'" height="'+L(t.h)+'"/>'}
  else if(e.type==='lettre'){h+='<image href="'+e.src+'" x="'+X(e.x-t.w/2)+'" y="'+Y(e.y-t.h/2)+'" width="'+L(t.w)+'" height="'+L(t.h)+'"/>';
   if(e.nom){var bh=t.h*(e.b[1]-e.b[0]);h+='<text x="'+X(e.x)+'" y="'+Y(e.y-t.h/2+t.h*(e.b[0]+e.b[1])/2)+'" text-anchor="middle" dominant-baseline="central" font-family="'+police(e.police)[2].replace(/"/g,"'")+'" font-size="'+L(bh*.82)+'" fill="#111" data-t="'+L(t.w*.92)+'">'+esc(e.nom)+'</text>'}}
  else{h+='<image href="'+e.src+'" x="'+X(e.x-t.w/2)+'" y="'+Y(e.y-t.h/2)+'" width="'+L(t.w)+'" height="'+L(t.h)+'" preserveAspectRatio="xMidYMid slice" style="filter:grayscale(1) contrast(1.15)"/>'
   +'<rect x="'+X(e.x-t.w/2)+'" y="'+Y(e.y-t.h/2)+'" width="'+L(t.w)+'" height="'+L(t.h)+'" fill="none" stroke="#111" stroke-width="0.3"/>'}});
 h='<g clip-path="url(#fclip)">'+h+'</g><clipPath id="fclip"><path transform="translate(5 5)" clip-rule="evenodd" d="'+b.dos+trous()+'"/></clipPath>'
  +'<g transform="translate(5 5)"><path '+R+' d="'+b.dos+fentesD(b)+trous()+'"/></g>'
  +'<g transform="translate('+t0.piedX+' 5)"><path '+R+' d="'+b.pied+trousPied()+'"/></g>';
 F.innerHTML=h;
 [].forEach.call(F.querySelectorAll('text[data-t]'),function(t){var bb=t.getBBox(),m=+t.getAttribute('data-t');if(bb.width>m)t.setAttribute('font-size',parseFloat(t.getAttribute('font-size'))*m/bb.width)});
 $('fnom').textContent='support-telephone-'+S.taille+'-'+S.forme+(S.ajoure?'-'+S.motif:'')+'-'+S.angle+'deg-<n° de commande>.svg · '+t0.lw+' × '+lh+' mm · bois 3 mm';
}

/* ---- la vue 3D : les deux pièces emboîtées (three.js, chargé seulement quand on touche « 3D ») ---- */
var V3={pret:false,actif:false};
function chargerThree(fn){if(window.THREE)return fn();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 s.onload=fn;s.onerror=function(){$('msg3d').textContent='La vue 3D n\'a pas pu se charger.'};document.head.appendChild(s)}
function texture3D(cb){ /* la gravure telle que dessinée sur l'aperçu, découpée au contour, en image */
 var X=ox(),Y=oy(),W=3*T().W,H=3*T().H;
 if(!S.grave||!S.els.length)return cb(null);
 var src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+X+' '+Y+' '+W+' '+H+'" width="'+(W*3)+'" height="'+(H*3)+'">'+svg.querySelector('defs').outerHTML+'<g clip-path="url(#decoupe)">'+grav.innerHTML+'</g></svg>';
 var im=new Image();im.onload=function(){var c=document.createElement('canvas');c.width=W*3;c.height=H*3;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c)};
 im.onerror=function(){cb(null)};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src)}
function forme3D(contour,trousL){
 var sh=new THREE.Shape(contour.map(function(p){return new THREE.Vector2(p[0],p[1])}));
 trousL.forEach(function(t){sh.holes.push(new THREE.Path(t.map(function(p){return new THREE.Vector2(p[0],p[1])})))});return sh}
V3.ouvrir=function(){
 $('stage').setAttribute('data-3d','1');majVue();$('msg3d').textContent='Chargement de la vue 3D…';
 chargerThree(function(){
  if(!V3.pret){
   var c=$('vue3d'),r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,1,2000);
   sc.add(new THREE.HemisphereLight(0xfff4e0,0x6b4f30,.55));var dl=new THREE.DirectionalLight(0xffffff,.55);dl.position.set(-120,220,260);sc.add(dl);
   var sol=new THREE.Mesh(new THREE.CircleGeometry(170,48),new THREE.MeshBasicMaterial({color:0x3a2a16,transparent:true,opacity:.12}));sol.rotation.x=-Math.PI/2;sol.position.y=.05;sc.add(sol);
   /* le décor fixe : le bureau, le mur du fond et le logo encadré, accroché en haut à gauche (il ne tourne pas avec le support) */
   var bureau=new THREE.Mesh(new THREE.PlaneGeometry(900,520),new THREE.MeshBasicMaterial({color:0xe6dbc7}));bureau.rotation.x=-Math.PI/2;bureau.position.set(0,0,100);sc.add(bureau);
   var mur=new THREE.Mesh(new THREE.PlaneGeometry(900,520),new THREE.MeshBasicMaterial({color:0xf3ede3}));mur.position.set(0,260,-160);sc.add(mur);
   var lw=56,lh=lw/D.logoR,cadre=new THREE.Mesh(new THREE.BoxGeometry(lw+7,lh+7,2.5),new THREE.MeshStandardMaterial({color:0x9a7442,roughness:.6}));
   cadre.position.set(-96,128,-158.6);sc.add(cadre);
   var ombre=new THREE.Mesh(new THREE.PlaneGeometry(lw+12,lh+12),new THREE.MeshBasicMaterial({color:0x5a4430,transparent:true,opacity:.13}));ombre.position.set(-93,125,-159.8);sc.add(ombre);
   new THREE.TextureLoader().load(D.logo,function(tx){var lg=new THREE.Mesh(new THREE.PlaneGeometry(lw,lh),new THREE.MeshBasicMaterial({map:tx}));
    lg.position.set(-96,128,-157.2);sc.add(lg);V3.rendre()});
   V3.r=r;V3.sc=sc;V3.cam=cam;V3.rot=-.45;V3.pret=true;
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
 var b=base(),t=T(),H=t.H,fl=function(pp){return pp.map(function(p){return [p[0],H-p[1]]})};
 var bois=new THREE.MeshStandardMaterial({color:0xc49a62,roughness:.8,metalness:0});
 var cont=fl(poly(b.dos)[0]),trs=b.fentes.map(function(f){return fl([[f[0],f[1]],[f[2],f[1]],[f[2],f[3]],[f[0],f[3]]])}).concat(poly(trous()).map(fl));
 var gd=new THREE.ExtrudeGeometry(forme3D(cont,trs),{depth:3,bevelEnabled:false,curveSegments:1});
 var dos=new THREE.Mesh(gd,bois);
 var pc=poly(b.pied),pied=new THREE.Mesh(new THREE.ExtrudeGeometry(forme3D(pc[0],poly(trousPied())),{depth:3,bevelEnabled:false}),bois);
 var f=b.fentes[0];pied.rotation.x=-Math.PI/2;pied.position.set(0,H-f[3],18);
 var g=new THREE.Group(),porte=new THREE.Group();porte.add(dos);porte.add(pied);
 var a=S.angle*Math.PI/180;porte.rotation.x=-a;porte.position.x=-t.W/2;g.add(porte);
 g.updateMatrixWorld(true);var bx=new THREE.Box3().setFromObject(g);porte.position.y-=bx.min.y;porte.position.z-=(bx.min.z+bx.max.z)/2;
 if(V3.g){V3.sc.remove(V3.g);V3.g.traverse(function(o){if(o.geometry)o.geometry.dispose()})}
 V3.g=g;V3.sc.add(g);
 var vp=!!trousPied(),ps=piedSeul();if(V3.vu!==ps){V3.rot=ps?2.55:-.45;V3.vu=ps}
 var hh=bx.max.y-bx.min.y;V3.cam.position.set(0,hh*(vp?1.05:.72),hh*2.55);V3.cam.lookAt(0,hh*.38,0);
 var id=++V3.n;V3.n=id;
 texture3D(function(cv){if(id!==V3.n)return;
  if(cv){var tx=new THREE.CanvasTexture(cv);var pl=new THREE.Mesh(new THREE.PlaneGeometry(t.W,H),new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:.9}));
   pl.position.set(t.W/2,H/2,3.05);porte.add(pl)}
  $('msg3d').textContent=trousPied()?'Faites glisser pour tourner : le motif du pied se voit de dos.':'Faites glisser pour tourner le support.';V3.rendre()});
 V3.rendre()};
V3.n=0;
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
var G={vue:'photo',i:0,commence:false};
function vignettes(){
 var h='';
 if(G.commence)h+='<button type="button" class="sc-thc'+(G.vue==='creation'?' active':'')+'" data-v="c" aria-label="Voir votre création"><svg viewBox="-3 -3 86 157"><path d="'+vignetteD(S.forme)+'"/></svg>Votre<br>création</button>';
 D.photos.forEach(function(u,i){h+='<button type="button" class="'+(G.vue==='photo'&&G.i===i?'active':'')+'" data-v="'+i+'" aria-label="Voir la photo '+(i+1)+'"><img src="'+u+'" alt=""></button>'});
 $('vignettes').innerHTML=h;
 $('stage').setAttribute('data-vue',G.vue);
 $('grande').src=D.photos[G.i];
 $('prec').hidden=$('suiv').hidden=G.vue!=='photo';
 $('aide').textContent=G.vue==='creation'?(V3.actif?'Vue 3D indicative : les deux pièces emboîtées, à l\'inclinaison choisie.':S.ajoure&&!S.els.length?'Le motif est découpé à travers le bois : on voit au travers.':'Faites glisser un élément pour le déplacer. Aperçu indicatif : sur le bois, la gravure ressort en brun.')
  :"Aperçu indicatif : sur le bois, la gravure ressort en brun, comme sur la photo d'exemple."+(G.commence?' Touchez « Votre création » pour revenir à votre support.':'');
}
function voirCreation(){G.commence=true;G.vue='creation';vignettes()}
$('vignettes').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var v=b.getAttribute('data-v');
 if(v==='c'){G.vue='creation'}else{G.vue='photo';G.i=+v;if(V3.actif)V3.fermer()}vignettes();if(G.vue==='creation')dessiner()});
$('prec').addEventListener('click',function(){G.i=(G.i+D.photos.length-1)%D.photos.length;vignettes()});
$('suiv').addEventListener('click',function(){G.i=(G.i+1)%D.photos.length;vignettes()});
/* ---- départ ---- */

majChoix();panneau();vignettes();dessiner();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(dessiner);
[].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
window.scDemo=function(o){o=o||{};voirCreation();S.forme=o.forme||'arche';S.taille=o.taille||'standard';S.grave=o.grave!==false;S.ajoure=!!o.ajoure;S.motif=o.motif||'coeurs';
 S.angle=o.angle||13;S.els=[];S.seq=0;if(S.grave){ajouter({type:'photo',src:D.exemple,nom:'exemple'});ajouter({type:'texte',texte:'Camille & Paul',police:'great-vibes'})}
 S.sel=null;majChoix();dessiner()};
window.scEtat=function(){return {S:S,total:total(),pret:pret(),base:base(),trous:trous().length}};
})();
"""

page = f"""<title>Créateur support téléphone</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@400;600&family=Great+Vibes&family=Allura&family=Pacifico&display=swap">
<style>{css}</style>
<style>{CSS_MAQ}</style>
<div class="sc-bandeau"><b>Maquette</b> · rien n'est en ligne. La fiche du support téléphone, avec un outil où la cliente crée elle-même son aperçu.</div>
{header}
<main>
{fil}
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage" id="stage" data-vue="photo"><span class="sc-tag">Votre support, en direct</span>
   <img class="sc-photo-g" id="grande" alt="Support téléphone en bois gravé">
   <button type="button" class="gallery-arrow gallery-arrow-prev" id="prec" aria-label="Photo précédente">‹</button>
   <button type="button" class="gallery-arrow gallery-arrow-next" id="suiv" aria-label="Photo suivante">›</button>
   <div class="sc-mur" aria-hidden="true"><img src="__LOGO__" alt=""></div>
   <svg id="scene" viewBox="40 14 320 536" role="img" aria-label="Aperçu de votre support de téléphone"></svg>
   <div class="sc-vue" id="vueBtns"><button type="button" data-vue="2d" class="on">Face</button><button type="button" data-vue="3d">3D</button></div>
   <div class="sc-pied" id="piedVue" hidden><svg id="piedSvg"><path id="piedP"/></svg>Le pied, vu de dessus</div>
   <canvas class="sc-3d" id="vue3d" aria-label="Vue 3D du support"></canvas><p class="sc-3dmsg" id="msg3d"></p></div>
  <div class="gallery-thumbs" id="vignettes"></div>
  <p class="sc-aide" id="aide">Aperçu indicatif : sur le bois, la gravure ressort en brun, comme sur la photo d'exemple.</p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Déco &amp; Maison</a></div>
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
