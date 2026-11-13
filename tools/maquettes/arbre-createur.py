#!/usr/bin/env python3
"""Maquette « Créez votre arbre de vie » (12/11/2026) — RIEN en ligne.

Le gérant : le même outil que https://www.atomm.com/creativetools/community/generator/family-tree-life-tree-generator/
(« analyse bien le logiciel de création »), arbre de 18 cm (zone 200 × 200 de la F2 Ultra UV, pas au maximum), 6 prénoms au
plus, PAS de photo (« on peut pas graver de photo »), PAS de collage ni d'acrylique (« c'est découpe ») : une seule pièce en
contreplaqué 3 mm. Les 9 arbres et, pour chaque nombre de prénoms, l'arbre déjà dessiné avec ses cœurs ou ses cercles viennent
de l'outil d'Atomm (arbre-atomm-donnees.py) ; ils sont publiés à côté de la page (dossier arbres/) et chargés à la demande.

  python3 tools/maquettes/arbre-createur.py <capture.html> <dossier css> <sortie.html> <arbres.json> <dossier vignettes> <pied-100x90.json>

Le pied = les 2 pièces du « Card Stand Generator » d'Atomm (arbre-pied-atomm.cjs), 100 × 90 mm, choisi pour l'arbre de 18 cm.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, sortie, arbres_json, vigdir, pied_json = sys.argv[1:7]


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
titre = "Arbre de vie en bois découpé — vos prénoms dans les cœurs"
accroche = "Choisissez l'arbre, écrivez jusqu'à six prénoms : chaque prénom a son cœur, et votre arbre se dessine en direct."
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

# le logo du site, fichier d'origine tel quel (aucune retouche) : accroché au mur, au fond de la vue 3D
LOGO = raw_uri(os.path.join(PUB, "logo-niv-creation.jpg"))
with Image.open(os.path.join(PUB, "logo-niv-creation.jpg")) as _l: LOGO_R = round(_l.width / _l.height, 4)

POLICES = [  # les 10 écritures de l'outil d'Atomm (Google Fonts, licence SIL OFL), épaisses : faites pour être découpées
    ["pacifico", "Pacifico", "'Pacifico',cursive"], ["lobster", "Lobster", "'Lobster',cursive"], ["courgette", "Courgette", "'Courgette',cursive"],
    ["lobstertwo", "Lobster Two", "'Lobster Two',cursive"], ["oleoscript", "Oleo Script", "'Oleo Script',cursive"], ["pattaya", "Pattaya", "'Pattaya',sans-serif"],
    ["leckerli", "Leckerli One", "'Leckerli One',cursive"], ["berkshire", "Berkshire Swash", "'Berkshire Swash',cursive"], ["sriracha", "Sriracha", "'Sriracha',cursive"],
    ["lily", "Lily Script", "'Lily Script One',cursive"],
]
FONTS_URL = "https://fonts.googleapis.com/css2?family=Pacifico&family=Lobster&family=Courgette&family=Lobster+Two:wght@700&family=Oleo+Script:wght@700&family=Pattaya&family=Leckerli+One&family=Berkshire+Swash&family=Sriracha&family=Lily+Script+One&display=swap"
ARBRES = json.load(open(arbres_json, encoding="utf-8"))
NOMS_FR = {"life": "Arbre de vie", "oak": "Chêne", "willow": "Saule", "apple": "Pommier", "olive": "Olivier", "cedar": "Cèdre",
           "cherry": "Cerisier", "jacaranda": "Jacaranda", "fig": "Figuier"}
for a in ARBRES["arbres"]:
    a["nom"] = NOMS_FR.get(a["id"], a["nom"])
    a["vignette"], _ = png_uri(os.path.join(vigdir, a["id"] + ".png"), w=120)
def _decale(d, dx, dy):
    """Déplace un tracé SVG absolu (M L Q C Z, nombres par paires x y)."""
    out, i = [], 0
    for t in re.findall(r"[MLQCZ]|-?[0-9.]+", d):
        if t in "MLQCZ":
            out.append(t); continue
        v = float(t) + (dx if i % 2 == 0 else dy); i += 1
        out.append(f"{v:.3f}".rstrip("0").rstrip("."))
    return " ".join(out)
_P = json.load(open(pied_json, encoding="utf-8"))
_L, _N = _P["L"], _P["n"]
_pa, _pb = _L["placements"]["a"], _L["placements"]["b"]
PIED = {"a": _decale(_L["pathA"], -_pa["x"], -_pa["y"]), "b": _decale(_L["pathB"], -_pb["x"], -_pb["y"]),
        "outA": [[round(x, 2), round(y, 2)] for x, y in _L["outline"]["a"]],
        "outB": [[round(x, 2), round(y, 2)] for x, y in _L["outline"]["b"]],
        "slotA": _L["slot"]["centre"] - _pa["x"], "haut": _L["params"]["height"], "larg": 90,
        "nest": {"w": _N["width"], "h": _N["height"], "a": [_N["placements"]["a"]["x"], _N["placements"]["a"]["y"]],
                 "b": [_N["placements"]["b"]["x"], _N["placements"]["b"]["y"], _N["placements"]["b"]["pivotX"], _N["placements"]["b"]["pivotY"]]},
        "txt": {"x": 14.5, "base": _L["params"]["height"] - 6, "size": 8, "maxw": 40}}
PIED["slotB"] = PIED["larg"] - PIED["slotA"]
MATIERES = [{"id": "contreplaque", "nom": "Contreplaqué", "c": ["#f0dcb4", "#e3c796", "#d6b47f"], "bord": "#9c7744"}]
DONNEES = json.dumps({"arbres": ARBRES["arbres"], "slots": ARBRES["slots"], "base": "arbres/", "max": 6, "taille": 180,
                      "matieres": MATIERES, "polices": POLICES, "logo": LOGO, "logoR": LOGO_R, "prix": {"base": 24.9, "inclus": 2, "nom": 3, "gravePied": 5}, "pied": PIED},
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
@media (max-width:420px){.sc-ajout{font-size:.76rem;padding:10px 4px}.sc-forme{font-size:.72rem}.sc-taille small{display:none}.sc-motif{font-size:.68rem}}
"""

CSS_MAQ += r"""
.ab-arbres{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ab-arbre{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px 9px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;font-size:.78rem;font-weight:600;color:var(--ink)}
.ab-arbre img{width:64px;height:64px;object-fit:contain}
.ab-arbre.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.ab-nom{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.ab-place{margin:14px 0 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff}
.ab-quinom{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.ab-quinom button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 12px;min-height:36px;font:inherit;font-size:.85rem;font-weight:600;color:var(--ink);cursor:pointer}
.ab-quinom button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ab-quinom button i{font-style:normal;font-weight:400;opacity:.7}
.ab-pad{display:flex;flex-wrap:wrap;gap:6px}
.ab-num{flex:none;width:26px;height:26px;border-radius:50%;background:#f3e8d3;color:var(--gold-dark);font-weight:700;font-size:.8rem;display:flex;align-items:center;justify-content:center}
.ab-nom input{flex:1;min-width:0;box-sizing:border-box;padding:10px 11px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#fff;color:var(--ink)}
.ab-nom .sc-o{min-width:36px;padding:0 6px}.ab-nom .sc-o:disabled,.ab-nom .sc-x:disabled{opacity:.35;cursor:default}
.ab-ajout{width:100%;margin-top:2px;padding:11px;border-radius:999px;border:0;background:var(--ink);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.ab-ajout:disabled{background:#d8d0c2;color:#6b6259;cursor:default}
.ab-formes .sc-style svg{width:46px;height:46px;fill:none;stroke:#a77b45;stroke-width:3}
.ab-pols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ab-pol{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 6px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;color:var(--ink);font:inherit}
.ab-pol span{font-size:1.45rem;line-height:1.25;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ab-pol small{font-size:.7rem;color:var(--ink-soft)}
.ab-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.ab-pied{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fffaf0}
.ab-pied svg{flex:none;width:74px;height:74px}.ab-pied p{margin:0;font-size:.86rem;line-height:1.45}
.ab-grave{display:flex;align-items:center;gap:8px;margin:12px 0 6px;font-weight:600;cursor:pointer}.ab-grave input{width:18px;height:18px;accent-color:var(--gold-dark)}
.ab-gchamps{display:grid;gap:8px}.ab-gchamps input,.ab-gchamps select{box-sizing:border-box;width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#fff;color:var(--ink)}
.ab-vig{position:absolute;left:10px;bottom:10px;z-index:3;width:min(140px,34%);padding:6px 6px 4px;border-radius:10px;background:rgba(255,253,248,.92);box-shadow:0 2px 10px rgba(43,29,14,.18);font-size:.68rem;color:var(--ink-soft);text-align:center}
.ab-vig svg{display:block;width:100%;height:auto}@media (max-width:900px){.ab-vig{width:76px;left:6px;bottom:6px;padding:4px 4px 2px;font-size:.6rem}}.sc-stage[data-3d="1"] .ab-vig{display:none}
.ab-charge{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;margin:0;padding:8px 14px;border-radius:999px;background:rgba(43,38,32,.86);color:#fff;font-size:.8rem}
.sc-stage.ab-stage svg#scene{max-height:max(300px,min(560px,calc(100vh - var(--sc-top,0px) - 120px)))}
@media (max-width:900px){.sc-stage.ab-stage svg#scene{max-height:34vh}}
"""

HTML_OUTIL = r"""
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre arbre</p><p class="prc-sub">Cinq petites étapes. Votre arbre se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">1</span><h3>L'arbre</h3></div>
  <div class="ab-arbres" id="arbres"></div>
  <p class="prc-hint">18 cm de diamètre, découpé d'une seule pièce dans du contreplaqué 3 mm.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">2</span><h3>Les prénoms</h3></div>
  <p class="prc-legend">Jusqu'à six prénoms : <b>les 2 premiers sont compris, chaque prénom en plus +3 €</b>. Chaque prénom a son cœur : ajoutez un prénom, un cœur apparaît dans l'arbre. Les flèches changent l'ordre.</p>
  <div id="listeNoms"></div>
  <p class="prc-hint prc-miss" id="alerteNoms" style="margin:6px 0 0"></p>
  <button type="button" class="ab-ajout" id="ajoutNom">+ Ajouter un prénom</button>
  <div class="ab-place" id="placeNoms" hidden>
   <p class="prc-legend" style="margin:0 0 6px">Déplacer ou agrandir un prénom (facultatif)</p>
   <p class="prc-hint" style="margin:0 0 8px">Chaque prénom se place tout seul dans son emplacement. Pour le bouger, choisissez-le puis utilisez les flèches.</p>
   <div class="ab-quinom" id="quiNom"></div>
   <div class="sc-fleches ab-pad" id="padNom">
    <button type="button" class="sc-o" data-a="g" aria-label="Vers la gauche">←</button><button type="button" class="sc-o" data-a="d" aria-label="Vers la droite">→</button><button type="button" class="sc-o" data-a="h" aria-label="Vers le haut">↑</button><button type="button" class="sc-o" data-a="b" aria-label="Vers le bas">↓</button><button type="button" class="sc-o" data-a="m" aria-label="Plus petit">−</button><button type="button" class="sc-o" data-a="p" aria-label="Plus grand">+</button><button type="button" class="sc-o" data-a="0" aria-label="Remettre à sa place">↺</button>
   </div>
  </div>
  <p class="prc-hint">10 lettres au plus par prénom. Le prénom est découpé dans le bois, attaché au bord de son cœur : rien ne tombe.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>Autour des prénoms</h3></div>
  <div class="sc-styles ab-formes" id="formesNoms">
   <button type="button" class="sc-style" data-v="heart"><svg viewBox="0 0 60 60"><path d="M30 50C14 39 6 31 6 21a12 12 0 0 1 24-3a12 12 0 0 1 24 3c0 10-8 18-24 29z"/></svg><b>Des cœurs</b><small>Un cœur par prénom</small></button>
   <button type="button" class="sc-style" data-v="circle"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22"/></svg><b>Des cercles</b><small>Un rond par prénom</small></button>
  </div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>L'écriture</h3></div>
  <div class="ab-pols" id="polices"></div>
  <p class="prc-hint">Des écritures épaisses, faites pour être découpées dans le bois.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>Le pied</h3></div>
  <div class="ab-pied"><svg id="piedIco" viewBox="-4 -4 98 108" aria-hidden="true"></svg>
   <p><b>Le pied est fourni avec l'arbre.</b> Deux pièces en bois qui s'emboîtent en croix, taillées pour votre arbre de 18 cm (10 cm de haut). L'arbre se pose dessus, légèrement incliné.</p></div>
  <label class="ab-grave"><input type="checkbox" id="gravePied"> Graver le pied (+5 €)</label>
  <div class="ab-gchamps" id="gchamps" hidden>
   <input type="text" id="piedTexte" maxlength="20" placeholder="Ex. Famille Martin" aria-label="Texte gravé sur le pied">
   <select id="piedPolice" aria-label="Écriture du pied"></select>
   <div class="sc-styles" id="piedOu" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    <button type="button" class="sc-style" data-v="gauche"><b>Pied gauche</b><small>Le texte à gauche</small></button>
    <button type="button" class="sc-style" data-v="droite"><b>Pied droit</b><small>Le texte à droite</small></button>
    <button type="button" class="sc-style" data-v="deux"><b>Les deux pieds</b><small>Le même texte de chaque côté</small></button>
    <button type="button" class="sc-style" data-v="suite"><b>La suite sur le 2ᵉ pied</b><small>Un texte à gauche, la suite à droite</small></button>
   </div>
   <input type="text" id="piedTexte2" maxlength="20" placeholder="La suite sur le pied droit, ex. depuis 2026" aria-label="Suite du texte, gravée sur le pied droit" hidden>
   <p class="prc-hint" style="margin:0">20 lettres au plus par pied. Gravé sur le bas du pied, sous l'arbre. Un pied ou les deux : même prix.</p>
  </div>
 </section>
 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num done">6</span><h3>Votre arbre</h3></div>
  <div class="prc-sum" id="resume"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
"""

HTML_ATELIER = r"""
<section class="sc-atelier"><div class="container">
 <h2>De votre côté : les fichiers pour le laser se fabriquent tout seuls</h2>
 <p>À la commande, le site range dans le dossier de la commande le fichier de l'arbre (18 cm) et celui du pied (ses 2 pièces imbriquées), à la taille réelle. Il change en direct quand vous modifiez l'arbre au-dessus.</p>
 <div class="sc-agrid">
  <div class="sc-feuille"><svg id="fichier" viewBox="0 0 334 196" role="img" aria-label="Fichier de découpe"></svg><p class="sc-fnom" id="fnom"></p></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : la gravure du pied, si la cliente l'a demandée</li></ul>
   <ul class="sc-points">
    <li><b>Les 9 arbres de l'outil d'Atomm</b>Arbre de vie, chêne, saule, pommier, olivier, cèdre, cerisier, jacaranda, figuier. Pour chaque nombre de prénoms (1 à 6), l'arbre est déjà dessiné avec ses cœurs ou ses cercles bien placés dans le feuillage.</li>
    <li><b>Le pied d'Atomm, à la bonne taille</b>Les 2 pièces du « Card Stand » d'Atomm, réglées pour l'arbre de 18 cm : 100 mm de haut, 90 mm de long, fente de 3 mm (l'épaisseur du bois), imbriquées sur une planche de 129,5 × 136,25 mm. Une pièce est découpée retournée, pour que les deux gravures soient du même côté. L'arbre et le pied ne tiennent pas ensemble dans 200 × 200 : deux planches.</li>
    <li><b>L'arbre : une seule pièce</b>Les prénoms sont dans le bois de leur cœur : la première lettre part du bord gauche, la dernière rejoint le bord droit, les accents et les points sont reliés à leur lettre. Pas de collage.</li>
    <li><b>18 cm, contreplaqué 3 mm</b>Le fichier tient dans la zone de 200 × 200 mm de la F2 Ultra UV, avec 1 cm de marge.</li>
    <li><b>Dans Gestion, comme les autres commandes</b>L'aperçu de la cliente et le fichier apparaissent dans la fiche atelier et dans le dossier du jour.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Le pied est compris dans le prix (à confirmer) ; la gravure du pied : +5 € (votre prix).</li>
  <li>Prix : 24,90 € l'arbre avec 2 prénoms (prix de base proposé par moi, à confirmer), chaque prénom en plus +3 € (votre règle) : 6 prénoms = 36,90 €.</li>
  <li>Le contour rouge de la maquette est un aperçu ; à la construction, le fichier aura les vrais tracés (comme l'export d'Atomm), prénoms soudés à leur cœur.</li>
  <li>Les dessins des arbres et des cœurs sont ceux d'Atomm (vous avez décidé de les reprendre, comme pour le support de téléphone).</li>
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

/* ---- l'arbre de vie d'Atomm : 9 arbres, et pour chaque nombre de prénoms (1 à 6) un arbre déjà dessiné avec ses cœurs
   ou ses cercles (canevas 300 × 300 mm, vendu en 18 cm). Les tracés sont des fichiers à part, chargés à la demande. ---- */
var MAX=D.max, TAILLE=D.taille, K=TAILLE/300, MATIERES=D.matieres;
var S={arbre:'life',forme:'heart',noms:['Léo','Nora','Maël','Inès'],police:'pacifico',pied:{grave:false,texte:'',texte2:'',police:'pacifico',ou:'deux'}};
function A(){for(var i=0;i<D.arbres.length;i++)if(D.arbres[i].id===S.arbre)return D.arbres[i];return D.arbres[0]}
function police(id){for(var i=0;i<D.polices.length;i++)if(D.polices[i][0]===id)return D.polices[i];return D.polices[0]}
function Mde(id){for(var i=0;i<MATIERES.length;i++)if(MATIERES[i].id===id)return MATIERES[i];return MATIERES[0]}
function nb(){return S.noms.length}
function cle(){return S.arbre+'-'+S.forme+'-'+nb()}
function slots(){return D.slots[cle()]||[]}
var TR={},enCours={};
function charger(k,cb){if(TR[k])return cb();if(enCours[k])return;enCours[k]=1;$('chargement').hidden=false;
 fetch(D.base+k+'.txt').then(function(r){if(!r.ok)throw new Error(r.status);return r.text()})
  .then(function(t){TR[k]=t;delete enCours[k];$('chargement').hidden=true;cb()})
  .catch(function(){delete enCours[k];$('chargement').textContent='L\'arbre n\'a pas pu se charger.'})}

var svg=$('scene');
svg.innerHTML='<defs>'
 +'<filter id="veine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.6 0.008" numOctaves="3" seed="7" result="n"/>'
 +'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 -0.12"/><feComposite operator="in" in2="SourceGraphic"/></filter>'
 +'<filter id="pieceF" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx=".9" dy="1.3" stdDeviation=".8" flood-color="#2b1d0e" flood-opacity=".45"/></filter>'
 +'<filter id="bordF" x="-5%" y="-20%" width="110%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius=".3" result="d"/><feComposite in="d" in2="SourceAlpha" operator="out" result="r"/>'
 +'<feFlood flood-color="#9c7744"/><feComposite in2="r" operator="in" result="e"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="e"/></feMerge></filter>'
 +'<filter id="flou"><feGaussianBlur stdDeviation="6"/></filter></defs>'
 +'<ellipse cx="150" cy="318" rx="120" ry="7" fill="#3a2a16" opacity=".14" filter="url(#flou)"/>'
 +'<g id="pieds"></g><path id="ombreA" fill="#6b4a25" opacity=".28" transform="translate(2.5,3.5)"/>'
 +'<path id="arbreP" fill-rule="nonzero" stroke-width=".35"/><path id="arbreV" fill="#fff" filter="url(#veine)" opacity=".45"/>'
 +'<g id="noms"></g>';
(function(){var dg=svg.querySelector('defs');MATIERES.forEach(function(m){dg.insertAdjacentHTML('beforeend','<linearGradient id="g-'+m.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+m.c[0]+'"/><stop offset=".55" stop-color="'+m.c[1]+'"/><stop offset="1" stop-color="'+m.c[2]+'"/></linearGradient>')})})();
svg.querySelector('defs').insertAdjacentHTML('beforeend','<linearGradient id="g-nom" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4a24"/><stop offset="1" stop-color="#4f2c12"/></linearGradient>');
var BOIS=Mde('contreplaque');

/* ---- un prénom dans son cœur (ou son cercle), comme Atomm : le prénom est en bois, il part du bord gauche du cœur et rejoint
   le bord droit par un petit trait, les accents et les points sont reliés à leur lettre ; l'intérieur des lettres est évidé ---- */
var CV=document.createElement('canvas').getContext('2d'),PETITS=[];
var ACC=/[éèêëàâäîïíìôöóòûüùúÿÉÈÊËÀÂÄÎÏÔÖÛÜÙij]/;
function encre(txt,pol,fs){CV.font='100px '+pol;var m=CV.measureText(txt),f=fs/100;return{l:m.actualBoundingBoxLeft*f,r:m.actualBoundingBoxRight*f,w:m.width*f}}
function texteNom(g,txt,cx,base,fs,pol,fill,extra){
 var t=el('text',{x:cx,y:base,'text-anchor':'middle','font-family':pol,'font-size':fs,fill:fill},g);t.textContent=txt;
 for(var a in (extra||{}))t.setAttribute(a,extra[a]);
 /* les ponts des accents et des points : un petit trait du signe à sa lettre */
 for(var i=0;i<txt.length;i++)if(ACC.test(txt[i])){try{var x=t.getExtentOfChar(i);
  el('rect',{x:x.x+x.width/2-fs*.035,y:x.y+x.height*.2,width:fs*.07,height:x.height*.3,fill:fill},g)}catch(_){}}
 return t}
function nomDansForme(sl,txt,uid){
 if(!txt)return;
 var t=sl.t,h=t[3],fs=h*2.36,cx=t[0]+t[2]/2,base=t[1]+h*1.76,pol=police(S.police)[2];
 var e=encre(txt,pol,fs);if(e.l+e.r>t[2]){var q=t[2]/(e.l+e.r);if(q<.72)PETITS.push(txt);fs*=q;e=encre(txt,pol,fs)}
 /* décalage et taille de ce prénom : choisis par la cliente (bloc « Déplacer ou agrandir un prénom »), ou retouchés par l'atelier dans Gestion */
 var aj=(S.aj||[])[uid];if(aj){cx+=aj.dx||0;base+=aj.dy||0;if(aj.s&&aj.s!==1){fs*=aj.s;e=encre(txt,pol,fs)}}
 var outer=el('g',{'clip-path':'url(#cp'+uid+')'},$('noms'));
 var cp=el('clipPath',{id:'cp'+uid},outer);el('path',{d:sl.o},cp);
 var g=el('g',{filter:'url(#bordF)'},outer);
 var x0=cx-e.w/2,inkL=x0-e.l,inkR=x0+e.r,yb=base-fs*.12,hb=fs*.1;
 el('rect',{x:sl.c[0]-40,y:yb-hb/2,width:inkL-(sl.c[0]-40)+fs*.25,height:hb,fill:'url(#g-contreplaque)'},g);
 el('rect',{x:inkR-fs*.25,y:yb-hb/2,width:sl.c[0]+40-inkR,height:hb,fill:'url(#g-contreplaque)'},g);
 texteNom(g,txt,cx,base,fs,pol,'url(#g-nom)')}

/* ---- le pied (les 2 pièces du « Card Stand » d'Atomm, 100 × 90 mm) : A a sa fente en haut, B en bas ; elles se croisent à 90°,
   les deux bouts (les « orteils ») vers l'avant ; l'arbre se pose dessus en s'appuyant sur les montants ---- */
var P=D.pied,PIO=10.2,SOL=300+PIO/K; /* le bas de l'arbre est à 10,2 mm du sol, posé sur les deux pieds */
function piedGrave(){return S.pied.grave&&S.pied.texte.trim()?S.pied.texte.trim():''}
/* le pied gravé : à gauche (pièce A), à droite (pièce B) ou les deux — gérant, 12/11 : « le client peut sélectionner le pied droit et / ou gauche » */
function piedOu(){var o=S.pied.ou;return o==='une'?'gauche':o}
/* « la suite sur le 2e pied » (gérant, 12/11 : « commencer sur le premier et continuer sur le deuxième, les deux pour cinq euros ») :
   le pied gauche porte le texte, le pied droit la suite */
function piedSuite(){return piedOu()==='suite'?(S.pied.texte2||'').trim():''}
function piedGrav(f,uid,fill,toujours){var t=piedGrave(),o=piedOu();if(!t||(!toujours&&((f==='a'&&o==='droite')||(f==='b'&&o==='gauche'))))return '';
 if(o==='suite'&&f==='b'){t=piedSuite();if(!t)return ''}
 var pol=police(S.pied.police)[2],fs=P.txt.size,e=encre(t,pol,fs);if(e.l+e.r>P.txt.maxw)fs*=P.txt.maxw/(e.l+e.r);
 var x=f==='a'?P.txt.x:P.larg-P.txt.x,anc=f==='a'?'start':'end',yb=P.txt.base;
 var pj=S.pied.aj;if(pj){x+=(f==='a'?1:-1)*(pj.dx||0);yb+=pj.dy||0;fs*=pj.s||1}
 return '<clipPath id="pc'+uid+'"><path d="'+P[f]+'"/></clipPath><text clip-path="url(#pc'+uid+')" x="'+x+'" y="'+yb+'" text-anchor="'+anc
  +'" font-family="'+esc(pol).replace(/"/g,"'")+'" font-size="'+fs.toFixed(2)+'" fill="'+fill+'">'+esc(t)+'</text>'}
function dessinerPieds(){
 var c=.7071/K,u=1/K,h='';
 [['a',P.slotA],['b',P.slotB]].forEach(function(z){var f=z[0];
  h+='<g transform="matrix('+c+' 0 0 '+u+' '+(150-z[1]*c)+' '+(SOL-P.haut*u)+')"><path d="'+P[f]+'" fill="'+(f==='a'?'#d9bb88':'#cfae78')+'" stroke="'+BOIS.bord+'" stroke-width="'+(.5/u)+'"/>'
   +piedGrav(f,'f'+f,'rgba(70,40,15,.8)')+'</g>'});
 $('pieds').innerHTML='<ellipse cx="150" cy="'+(SOL+1)+'" rx="95" ry="4" fill="#3a2a16" opacity=".16" filter="url(#flou)"/>'+h;
 $('piedIco').innerHTML='<path d="'+P.a+'" fill="#e3c796" stroke="#9c7744" stroke-width="1.2"/>'+piedGrav('a','i','#5a3a18',true);
 var g=!!piedGrave();$('vigPied').hidden=!g;
 if(g)$('vigSvg').innerHTML='<path d="'+P.a+'" fill="#e3c796" stroke="#9c7744" stroke-width=".8"/>'+piedGrav('a','v','#4a2c10',true);
 var lv=$('vigPied').lastChild;if(lv&&lv.nodeType===3)lv.textContent=piedOu()==='deux'?'Le pied, vu de côté':piedOu()==='droite'?'Le pied droit, vu de côté':'Le pied gauche, vu de côté'}

function dessiner(){
 var k=cle();
 if(!TR[k]){charger(k,dessiner);return}
 var d=TR[k];
 ['arbreP','arbreV','ombreA'].forEach(function(i){$(i).setAttribute('d',d)});
 $('arbreP').setAttribute('fill','url(#g-contreplaque)');$('arbreP').setAttribute('stroke',BOIS.bord);
 $('noms').innerHTML='';PETITS=[];
 slots().forEach(function(sl,i){nomDansForme(sl,S.noms[i].trim(),i)});
 $('alerteNoms').textContent=PETITS.length?(PETITS.length>1?PETITS.map(function(x){return '« '+x+' »'}).join(', ')+' sont longs : ils seront gravés plus petit que les autres.':'« '+PETITS[0]+' » est long : il sera gravé plus petit que les autres.'):'';
 dessinerPieds();fichier();majListe();resume();if(V3.pret)V3.maj();
 $('aide').textContent=V3.actif?'Vue 3D indicative : faites glisser pour tourner l\'arbre.':'Aperçu indicatif : arbre de 18 cm découpé d\'une seule pièce dans du contreplaqué 3 mm.'}

/* ---- étape 1 : l'arbre ---- */
$('arbres').innerHTML=D.arbres.map(function(a){return '<button type="button" class="ab-arbre" data-v="'+a.id+'"><img src="'+a.vignette+'" alt="">'+a.nom+'</button>'}).join('');
function majArbres(){[].forEach.call($('arbres').children,function(b){b.classList.toggle('on',b.getAttribute('data-v')===S.arbre)})}
$('arbres').addEventListener('click',function(ev){var b=ev.target.closest('.ab-arbre');if(!b)return;S.arbre=b.getAttribute('data-v');S.aj=[];majArbres();dessiner();majPlace()});

/* ---- étape 2 : les prénoms (6 au plus ; un cœur apparaît pour chaque prénom) ---- */
function majNoms(){var h='';S.noms.forEach(function(t,i){
  h+='<div class="ab-nom" data-i="'+i+'"><span class="ab-num">'+(i+1)+'</span>'
   +'<input type="text" maxlength="10" value="'+esc(t)+'" placeholder="Prénom" aria-label="Prénom '+(i+1)+'" data-i="'+i+'">'
   +'<button type="button" class="sc-o" data-act="haut" aria-label="Monter"'+(i?'':' disabled')+'>↑</button>'
   +'<button type="button" class="sc-o" data-act="bas" aria-label="Descendre"'+(i<nb()-1?'':' disabled')+'>↓</button>'
   +'<button type="button" class="sc-x" data-act="x" aria-label="Retirer"'+(nb()>1?'':' disabled')+'>✕</button></div>'});
 $('listeNoms').innerHTML=h;dernierN=nb();majPlace();
 $('ajoutNom').disabled=nb()>=MAX;$('ajoutNom').innerHTML=nb()>=MAX?'6 prénoms au maximum':(nb()<D.prix.inclus?'+ Ajouter un prénom (compris)':'+ Ajouter un prénom (+3 €)');}
$('listeNoms').addEventListener('click',function(ev){var r=ev.target.closest('.ab-nom');if(!r)return;var i=+r.getAttribute('data-i'),a=ev.target.getAttribute('data-act');S.aj=S.aj||[];while(S.aj.length<nb())S.aj.push(null);
 if(a==='x'&&nb()>1){S.noms.splice(i,1);S.aj.splice(i,1)}
 else if(a==='haut'&&i){S.noms.splice(i-1,0,S.noms.splice(i,1)[0]);S.aj.splice(i-1,0,S.aj.splice(i,1)[0])}
 else if(a==='bas'&&i<nb()-1){S.noms.splice(i+1,0,S.noms.splice(i,1)[0]);S.aj.splice(i+1,0,S.aj.splice(i,1)[0])}
 else return;
 majNoms();dessiner()});
$('listeNoms').addEventListener('input',function(ev){var i=ev.target.getAttribute('data-i');if(i===null)return;S.noms[+i]=ev.target.value;dessiner();majPlace()});
/* la cliente déplace ou agrandit un prénom dans son emplacement (gérant, 13/11/2026 : « il faut qu'ils aient accès » ; les mêmes décalages que la retouche de l'atelier, bornés pour que le prénom reste tenu) */
var quiNom=0;
function majPlace(){var l=[];S.noms.forEach(function(t,i){if(t.trim())l.push(i)});$('placeNoms').hidden=!l.length;if(!l.length)return;if(l.indexOf(quiNom)<0)quiNom=l[0];
 $('quiNom').innerHTML=l.map(function(i){var a=(S.aj||[])[i],b=a&&(a.dx||a.dy||(a.s&&a.s!==1));return '<button type="button" data-i="'+i+'" class="'+(i===quiNom?'on':'')+'" aria-pressed="'+(i===quiNom)+'">'+esc(S.noms[i].trim())+(b?' <i>· déplacé</i>':'')+'</button>'}).join('')}
$('quiNom').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;quiNom=+b.getAttribute('data-i');majPlace()});
$('padNom').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var a=b.getAttribute('data-a'),sl=slots()[quiNom];if(!sl)return;S.aj=S.aj||[];
 var o=S.aj[quiNom]=S.aj[quiNom]||{dx:0,dy:0,s:1},w=sl.t[2],h=sl.t[3],pas=Math.max(1,h*.1),mx=w*.3,my=h*.45;
 if(a==='g')o.dx=Math.max(-mx,o.dx-pas);if(a==='d')o.dx=Math.min(mx,o.dx+pas);if(a==='h')o.dy=Math.max(-my,o.dy-pas);if(a==='b')o.dy=Math.min(my,o.dy+pas);
 if(a==='m')o.s=Math.max(.7,+(o.s-.06).toFixed(2));if(a==='p')o.s=Math.min(1.3,+(o.s+.06).toFixed(2));if(a==='0')S.aj[quiNom]=null;
 dessiner();majPlace()});
$('ajoutNom').addEventListener('click',function(){if(nb()>=MAX)return;S.noms.push('');majNoms();dessiner();
 var ins=$('listeNoms').querySelectorAll('input');ins[ins.length-1].focus()});

/* ---- étape 3 : cœurs ou cercles ---- */
function majForme(){[].forEach.call($('formesNoms').querySelectorAll('.sc-style'),function(b){b.classList.toggle('on',b.getAttribute('data-v')===S.forme)})}
$('formesNoms').addEventListener('click',function(ev){var b=ev.target.closest('.sc-style');if(!b)return;S.forme=b.getAttribute('data-v');S.aj=[];majForme();dessiner();majPlace()});

/* ---- étape 4 : l'écriture ---- */
function majPolices(){var ex=(S.noms[0]||'Éloïse').trim()||'Éloïse';
 $('polices').innerHTML=D.polices.map(function(p){return '<button type="button" class="ab-pol'+(p[0]===S.police?' on':'')+'" data-p="'+p[0]+'"><span style="font-family:'+p[2].replace(/"/g,"'")+'">'+esc(ex)+'</span><small>'+p[1]+'</small></button>'}).join('')}
$('polices').addEventListener('click',function(ev){var b=ev.target.closest('.ab-pol');if(!b)return;S.police=b.getAttribute('data-p');majPolices();dessiner();
 if(document.fonts&&document.fonts.load)document.fonts.load('40px '+police(S.police)[2],S.noms.join('')).then(dessiner,function(){})});

/* ---- étape 5 : résumé et prix ---- */
var dernierN=-1;function majListe(){if(dernierN!==nb()){dernierN=nb();majNoms()}majPolicesSi()}
var dernierEx=null;function majPolicesSi(){var ex=(S.noms[0]||'').trim();if(ex!==dernierEx){dernierEx=ex;majPolices()}}
function enPlus(){return Math.max(0,S.noms.length-D.prix.inclus)}
function total(){return D.prix.base+enPlus()*D.prix.nom+(piedGrave()?D.prix.gravePied:0)}
function resume(){var noms=S.noms.map(function(t){return t.trim()}).filter(Boolean);
 var h='<div class="prc-sumrow"><span>Arbre</span><b>'+A().nom+' · 18 cm · contreplaqué 3 mm — '+eur(D.prix.base)+'</b></div>'
  +'<div class="prc-sumrow"><span>Prénoms</span><b>'+(noms.length?noms.map(esc).join(', '):'aucun')+'</b></div>'
  +'<div class="prc-sumrow"><span>Prénoms en plus</span><b>'+(enPlus()?enPlus()+' × '+eur(D.prix.nom)+' = +'+eur(enPlus()*D.prix.nom):'2 prénoms compris')+'</b></div>'
  +'<div class="prc-sumrow"><span>Pied</span><b>Compris · 2 pièces à emboîter · 10 cm</b></div>'
  +'<div class="prc-sumrow"><span>Gravure du pied</span><b>'+(piedGrave()?'« '+esc(piedGrave())+' » · '+police(S.pied.police)[1]+' · '+(piedOu()==='deux'?'les deux pieds':piedOu()==='droite'?'pied droit':piedOu()==='suite'?'pied gauche, puis « '+esc(piedSuite()||'…')+' » sur le pied droit':'pied gauche')+' · +'+eur(D.prix.gravePied):'Non')+'</b></div>'
  +'<div class="prc-sumrow"><span>Autour des prénoms</span><b>'+(S.forme==='heart'?'Cœurs':'Cercles')+'</b></div>'
  +'<div class="prc-sumrow"><span>Écriture</span><b>'+police(S.police)[1]+'</b></div>'
  +'<div class="prc-sumrow prc-sumtot" style="border-bottom:0"><span>Total</span><b>'+eur(total())+'</b></div>';
 $('resume').innerHTML=h;$('total').textContent=eur(total());$('prixtete').textContent=eur(D.prix.base);
 var vides=S.noms.filter(function(t){return !t.trim()}).length,pv=S.pied.grave&&!S.pied.texte.trim();
 $('manque').textContent=vides?(vides>1?vides+' prénoms sont vides : écrivez-les ou retirez-les.':'Un prénom est vide : écrivez-le ou retirez-le.'):pv?'Écrivez le texte à graver sur le pied, ou décochez « Graver le pied ».':'';
 $('ajouter').disabled=!!vides||pv}
$('ajouter').addEventListener('click',function(){if(!this.disabled)this.textContent='Ajouté au panier ✓ (maquette)'});
$('piedPolice').innerHTML=D.polices.map(function(q){return '<option value="'+q[0]+'">'+q[1]+'</option>'}).join('');
function majPied(){$('gravePied').checked=S.pied.grave;$('gchamps').hidden=!S.pied.grave;$('piedPolice').value=S.pied.police;
 [].forEach.call($('piedOu').children,function(b){b.classList.toggle('on',b.getAttribute('data-v')===piedOu())});
 $('piedTexte2').hidden=piedOu()!=='suite';$('piedTexte2').value=S.pied.texte2||''}
$('gravePied').addEventListener('change',function(){S.pied.grave=this.checked;majPied();dessiner();if(this.checked)$('piedTexte').focus()});
$('piedTexte').addEventListener('input',function(){S.pied.texte=this.value;dessiner()});
$('piedTexte2').addEventListener('input',function(){S.pied.texte2=this.value;dessiner()});
$('piedPolice').addEventListener('change',function(){S.pied.police=this.value;dessiner();
 if(document.fonts&&document.fonts.load)document.fonts.load('40px '+police(S.pied.police)[2],S.pied.texte||'a').then(dessiner,function(){})});
$('piedOu').addEventListener('click',function(ev){var b=ev.target.closest('.sc-style');if(!b)return;S.pied.ou=b.getAttribute('data-v');majPied();dessiner()});

/* ---- le fichier de l'atelier : 18 cm, rouge = découpe (contour de tout le bois, prénoms compris) ---- */
function contourDe(inner,id){return '<filter id="'+id+'" x="-2%" y="-2%" width="104%" height="104%"><feMorphology in="SourceAlpha" operator="dilate" radius=".45" result="d"/><feComposite in="d" in2="SourceAlpha" operator="out" result="r"/><feFlood flood-color="#FF0000"/><feComposite in2="r" operator="in"/></filter><g filter="url(#'+id+')">'+inner+'</g>'}
function fichier(){
 var noir=function(s){return s.replace(/url\(#g-[a-z-]+\)/g,'#000').replace(/filter="url\(#bordF\)"/g,'')};
 var arbre='<path d="'+$('arbreP').getAttribute('d')+'" fill="#000"/>';
 var N=P.nest,ox=200,trait='fill="none" stroke="#FF0000" stroke-width=".3"';
 $('fichier').setAttribute('viewBox','0 0 '+(ox+N.w+4)+' 202');
 $('fichier').innerHTML='<rect x=".2" y=".2" width="189.6" height="189.6" fill="none" stroke="#c9c2b6" stroke-width=".4" stroke-dasharray="2 2"/>'
  +'<g transform="translate(5 5) scale('+K+')">'+contourDe(arbre+noir($('noms').innerHTML),'fc1')+'</g>'
  +'<text x="95" y="198" text-anchor="middle" font-size="5" fill="#7a6e60" font-family="sans-serif">Planche 1 · l\'arbre · 180 × 180 mm</text>'
  +'<g transform="translate('+ox+' 0)"><rect x=".2" y=".2" width="'+(N.w-.4)+'" height="'+(N.h-.4)+'" fill="none" stroke="#c9c2b6" stroke-width=".4" stroke-dasharray="2 2"/>'
  +'<g transform="translate('+N.a[0]+' '+N.a[1]+')"><path d="'+P.a+'" '+trait+'/>'+piedGrav('a','na','#000')+'</g>'
  +'<g transform="translate('+N.b[0]+' '+N.b[1]+') rotate(180 '+N.b[2]+' '+N.b[3]+')"><path d="'+P.b+'" '+trait+'/>'+piedGrav('b','nb','#000')+'</g>'
  +'<text x="'+(N.w/2)+'" y="'+(N.h+8)+'" text-anchor="middle" font-size="5" fill="#7a6e60" font-family="sans-serif">Planche 2 · le pied · 129,5 × 136,25 mm</text></g>';
 var ref='<n° de commande>';
 $('fnom').textContent='arbre-'+S.arbre+'-'+(S.forme==='heart'?'coeurs':'cercles')+'-'+nb()+'-prenoms-'+ref+'.svg · 180 × 180 mm  +  pied-arbre-'+ref+'.svg · 129,5 × 136,25 mm, 2 pièces'+(piedGrave()?' + gravure':'')+' · contreplaqué 3 mm'}

/* ---- la vue 3D : l'arbre en contreplaqué 3 mm, le logo au mur (three.js, chargé seulement quand on touche « 3D ») ---- */
var V3={pret:false,actif:false,n:0};
function chargerThree(fn){if(window.THREE)return fn();var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 s.onload=fn;s.onerror=function(){$('msg3d').textContent='La vue 3D n\'a pas pu se charger.'};document.head.appendChild(s)}
function texture3D(cb){
 var src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="1500" height="1500">'+svg.querySelector('defs').outerHTML
  +'<path fill="url(#g-contreplaque)" d="'+$('arbreP').getAttribute('d')+'"/><path fill="#fff" filter="url(#veine)" opacity=".45" d="'+$('arbreP').getAttribute('d')+'"/>'+$('noms').innerHTML+'</svg>';
 var im=new Image();im.onload=function(){var c=document.createElement('canvas');c.width=c.height=1500;c.getContext('2d').drawImage(im,0,0,1500,1500);cb(c)};
 im.onerror=function(){cb(null)};im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src)}
V3.ouvrir=function(){
 $('stage').setAttribute('data-3d','1');majVue();$('msg3d').textContent='Chargement de la vue 3D…';
 chargerThree(function(){
  if(!V3.pret){
   var c=$('vue3d'),r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
   var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,1,4000);
   sc.add(new THREE.HemisphereLight(0xfff4e0,0x6b4f30,.75));var dl=new THREE.DirectionalLight(0xffffff,.5);dl.position.set(-120,220,260);sc.add(dl);
   var mur=new THREE.Mesh(new THREE.PlaneGeometry(1600,1200),new THREE.MeshBasicMaterial({color:0xf3ede3}));mur.position.set(0,0,-160);sc.add(mur);
   var lw=70,lh=lw/D.logoR,cadre=new THREE.Mesh(new THREE.BoxGeometry(lw+8,lh+8,2.5),new THREE.MeshStandardMaterial({color:0x9a7442,roughness:.6}));
   cadre.position.set(-190,120,-158.6);sc.add(cadre);
   var ombre=new THREE.Mesh(new THREE.PlaneGeometry(lw+14,lh+14),new THREE.MeshBasicMaterial({color:0x5a4430,transparent:true,opacity:.13}));ombre.position.set(-187,117,-159.8);sc.add(ombre);
   new THREE.TextureLoader().load(D.logo,function(tx){var lg=new THREE.Mesh(new THREE.PlaneGeometry(lw,lh),new THREE.MeshBasicMaterial({map:tx}));lg.position.set(-190,120,-157.2);sc.add(lg);V3.rendre()});
   V3.r=r;V3.sc=sc;V3.cam=cam;V3.rot=-.35;V3.pret=true;
   var tir=null;c.addEventListener('pointerdown',function(e){tir={x:e.clientX,r:V3.rot};try{c.setPointerCapture(e.pointerId)}catch(_){ }});
   c.addEventListener('pointermove',function(e){if(!tir)return;V3.rot=tir.r+(e.clientX-tir.x)/120;V3.rendre()});
   c.addEventListener('pointerup',function(){tir=null});c.addEventListener('pointercancel',function(){tir=null});
   window.addEventListener('resize',function(){if(V3.actif)V3.rendre()});
  }
  V3.actif=true;majVue();dessiner();
 })};
V3.fermer=function(){V3.actif=false;$('stage').removeAttribute('data-3d');majVue()};
V3.rendre=function(){if(!V3.pret||!V3.actif)return;var c=$('vue3d'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
 V3.r.setSize(w,h,false);V3.cam.aspect=w/h;V3.cam.updateProjectionMatrix();if(V3.g)V3.g.rotation.y=V3.rot;V3.r.render(V3.sc,V3.cam)};
/* l'épaisseur : des couches de la même découpe, plus sombres sur la tranche, la face dessus */
V3.maj=function(){if(!V3.actif)return;var id=++V3.n;
 texture3D(function(cv){if(id!==V3.n||!cv)return;
  var tx=new THREE.CanvasTexture(cv),T=TAILLE,g=new THREE.Group();
  var tranche=new THREE.MeshBasicMaterial({map:tx,transparent:true,color:0x6b4a2a,alphaTest:.5});
  for(var z=-1.5;z<1.5;z+=.25){var p=new THREE.Mesh(new THREE.PlaneGeometry(T,T),tranche);p.position.z=z;g.add(p)}
  var face=new THREE.Mesh(new THREE.PlaneGeometry(T,T),new THREE.MeshStandardMaterial({map:tx,transparent:true,alphaTest:.5,roughness:.85}));face.position.z=1.5;g.add(face);
  var dos=face.clone();dos.position.z=-1.5;dos.rotation.y=Math.PI;g.add(dos);
  var tout=new THREE.Group(),th=12*Math.PI/180,yc=PIO+90*Math.cos(th),bas=-70;
  g.rotation.x=-th;g.position.set(0,bas+yc,8*.7071+1.5+(P.haut-yc)*Math.tan(th));tout.add(g);
  var bois=new THREE.MeshStandardMaterial({color:0xdcc08f,roughness:.8});
  [['a',P.outA,P.slotA,Math.PI/4],['b',P.outB,P.slotB,-Math.PI/4]].forEach(function(z){
   var sh=new THREE.Shape();z[1].forEach(function(q,i){var x=q[0]-z[2],y=P.haut-q[1];if(i)sh.lineTo(x,y);else sh.moveTo(x,y)});
   var geo=new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:false});geo.translate(0,0,-1.5);
   var pg=new THREE.Group();pg.add(new THREE.Mesh(geo,bois));
   var gr=piedGrav(z[0],'3'+z[0],'#4a2c10');
   if(gr){var src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+P.larg+' '+P.haut+'" width="900" height="1000">'+gr+'</svg>',im=new Image();
    im.onload=function(){var cv2=document.createElement('canvas');cv2.width=900;cv2.height=1000;cv2.getContext('2d').drawImage(im,0,0,900,1000);
     var pl=new THREE.Mesh(new THREE.PlaneGeometry(P.larg,P.haut),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv2),transparent:true,alphaTest:.3,depthWrite:false}));
     pl.position.set(P.larg/2-z[2],P.haut/2,1.6);pg.add(pl);V3.rendre()};
    im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src)}
   pg.rotation.y=z[3];pg.position.y=bas;tout.add(pg)});
  if(V3.g){V3.sc.remove(V3.g);V3.g.traverse(function(o){if(o.geometry)o.geometry.dispose()})}
  V3.g=tout;V3.sc.add(tout);V3.cam.position.set(0,T*.22,T*2.35);V3.cam.lookAt(0,-8,0);
  $('msg3d').textContent='Faites glisser pour tourner l\'arbre.';V3.rendre()})};
function majVue(){[].forEach.call(document.querySelectorAll('.sc-vue button'),function(x){x.classList.toggle('on',(x.getAttribute('data-vue')==='3d')===V3.actif)})}
$('vueBtns').addEventListener('click',function(ev){var x=ev.target.closest('button');if(!x)return;if(x.getAttribute('data-vue')==='3d')V3.ouvrir();else{V3.fermer();dessiner()}});

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

var G={vue:'creation'};
/* ---- départ ---- */
majArbres();majNoms();majForme();majPolices();majPied();dessiner();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){majPolices();dessiner()});
[].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
window.abAtelier={S:S,dessiner:function(){dessiner()},maj:function(){majArbres();majForme();majNoms();majPolices();majPied();dessiner()}};
window.abEtat=function(){return {S:S,total:total(),cle:cle(),pret:!!TR[cle()],slots:slots().length}};
})();
"""

page = f"""<title>Créateur d'arbre de vie</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="{FONTS_URL}">
<style>{css}</style>
<style>{CSS_MAQ}</style>
<div class="sc-bandeau"><b>Maquette</b> · rien n'est en ligne. Un arbre de vie que la cliente crée elle-même, découpé d'une seule pièce, comme l'outil d'Atomm.</div>
{header}
<main>
{fil}
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage ab-stage" id="stage" data-vue="creation"><span class="sc-tag">Votre arbre, en direct</span>
   <div class="sc-mur" aria-hidden="true"><img src="__LOGO__" alt=""></div>
   <svg id="scene" viewBox="-28 -28 356 372" role="img" aria-label="Aperçu de votre arbre de vie"></svg>
   <div class="ab-vig" id="vigPied" hidden><svg id="vigSvg" viewBox="-3 -3 96 106"></svg>Le pied, vu de côté</div>
   <p class="ab-charge" id="chargement" hidden>Chargement de l'arbre…</p>
   <div class="sc-vue" id="vueBtns"><button type="button" data-vue="2d" class="on">Face</button><button type="button" data-vue="3d">3D</button></div>
   <canvas class="sc-3d" id="vue3d" aria-label="Vue 3D de l'arbre"></canvas><p class="sc-3dmsg" id="msg3d"></p></div>
  <p class="sc-aide" id="aide"></p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Maison &amp; Déco</a></div>
  <div class="pd-titrerow"><h1>{titre}</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">{accroche}</p>
  <div class="price-lead" id="prixtete"></div>
  {HTML_OUTIL}
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
