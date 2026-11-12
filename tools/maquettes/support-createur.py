#!/usr/bin/env python3
"""Maquette « Créez votre support de téléphone » (12/11/2026) — RIEN en ligne.

Le gérant a montré le générateur de support de téléphone d'Atomm (xTool) et demandé le même genre d'outil
sur son site : la cliente crée elle-même son aperçu. La maquette part de la VRAIE fiche du site
(`support-telephone-bois-grave`) : en-tête, pied de page, titre, textes et volets viennent de la capture ;
la galerie devient un aperçu DESSINÉ (forme du dossier au choix, texte, dessin, photo, à glisser) et la
personnalisation devient un parcours en étapes. En bas : le fichier que l'atelier recevrait (rouge = découpe,
noir = gravure).

  python3 tools/maquettes/support-createur.py <capture.html> <dossier css> <sortie.html>

capture = curl https://nivcreation.fr/produit/support-telephone-bois-grave ; dossier css = ses feuilles de style.
La sortie (photos intégrées) ne se commite pas.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, sortie = sys.argv[1], sys.argv[2], sys.argv[3]


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
P_TEXTE, P_DESSIN, P_PHOTO = P["Texte seul"], P["Dessin au choix"], P["Photo gravée"]
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
EXEMPLE = jpg_uri(os.path.join(ROOT, "docs/maquettes/assets/marque-pages/exemples/portraits/couple.jpg"))

POLICES = [
    ["playfair", "Playfair", "'Playfair Display',serif"], ["cinzel", "Cinzel", "'Cinzel',serif"],
    ["cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"], ["montserrat", "Montserrat", "'Montserrat',sans-serif"],
    ["inter", "Inter", "'Inter',sans-serif"], ["great-vibes", "Great Vibes", "'Great Vibes',cursive"],
    ["allura", "Allura", "'Allura',cursive"], ["pacifico", "Pacifico", "'Pacifico',cursive"],
]

DONNEES = json.dumps({"dessins": DESSINS, "exemple": EXEMPLE, "polices": POLICES,
                      "prix": {"texte": P_TEXTE, "dessin": P_DESSIN, "photo": P_PHOTO, "plus": 3}}, ensure_ascii=False)

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
.sc-stage .sc-el:active{cursor:grabbing}
.sc-tag{position:absolute;left:10px;top:10px;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
background:rgba(43,38,32,.82);color:#fff;border-radius:999px;padding:5px 10px}
.sc-aide{font-size:.8rem;color:var(--ink-soft);font-style:italic;margin:10px 2px 0;line-height:1.4}
.sc-formes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sc-forme{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px 8px;border:1.5px solid var(--line);border-radius:12px;
background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);font-size:.78rem;font-weight:600}
.sc-forme svg{width:44px;height:56px}
.sc-forme svg path{fill:#e9d6b4;stroke:#9c6b3f;stroke-width:5}
.sc-forme.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.sc-ajouts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
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
 .sc-stage{position:sticky;top:var(--sc-top,0px);z-index:20;border-radius:0 0 var(--radius) var(--radius);margin:0 -16px;border-left:0;border-right:0;box-shadow:0 8px 18px rgba(43,38,32,.12)}
 .sc-stage svg{max-height:36vh}
 .sc-aide{margin-bottom:14px}
 .sc-agrid{grid-template-columns:1fr}
 .sc-formes{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:420px){.sc-ajout{font-size:.76rem;padding:10px 4px}.sc-forme{font-size:.72rem}}
"""

HTML_OUTIL = r"""
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre support</p><p class="prc-sub">Trois petites étapes. Votre support se dessine au fur et à mesure, et vous placez chaque élément du bout du doigt.</p></div>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" id="n1">1</span><h3>La forme du dossier</h3></div>
  <div class="sc-formes" id="formes"></div>
 </section>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n2">2</span><h3>Ce que vous gravez</h3></div>
  <p class="prc-legend">Ajoutez un texte, un dessin ou votre photo. Vous pouvez en mettre plusieurs : le premier est compris, chaque élément en plus coûte <b id="lplus"></b>.</p>
  <div class="sc-ajouts">
   <button type="button" class="sc-ajout" data-a="texte"><svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>Un texte<small>prénom, date, petit mot</small></button>
   <button type="button" class="sc-ajout" data-a="dessin"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z"/></svg>Un dessin<small>nos modèles</small></button>
   <button type="button" class="sc-ajout" data-a="photo"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>Ma photo<small>gravée en brun</small></button>
  </div>
  <div class="sc-panneau" id="panneau"></div>
  <div id="liste"></div>
 </section>

 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n3">3</span><h3>Votre création</h3></div>
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
  <div class="sc-feuille"><svg id="fichier" viewBox="0 0 600 500" role="img" aria-label="Fichier de découpe et de gravure"></svg><p class="sc-fnom" id="fnom"></p></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : à graver</li></ul>
   <ul class="sc-points">
    <li><b>Le dossier, à la forme choisie</b>Le contour suit la forme que la cliente a choisie ; le pied reste le même.</li>
    <li><b>La gravure, là où elle l'a posée</b>Texte, dessin et photo sont à la place et à la taille de son aperçu : plus de doute sur « plus haut ou plus bas ».</li>
    <li><b>Dans Gestion, comme les autres commandes</b>L'aperçu de la cliente et le fichier apparaissent dans la fiche atelier et dans le dossier de gravure du jour.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Les six formes du dossier sont des propositions : lesquelles voulez-vous vendre, et au même prix ?</li>
  <li>Les prix viennent de la fiche actuelle (texte, dessin, photo, élément en plus). La lettre fleurie de la fiche n'est pas dans la maquette : elle peut s'ajouter.</li>
  <li>Le même outil peut ensuite servir à d'autres créations en bois (porte-stylo, plaque de porte, marque-pages).</li>
 </ul></div>
</div></section>
"""

JS = r"""
(function(){
var D=__DONNEES__, NS='http://www.w3.org/2000/svg';
function $(i){return document.getElementById(i)}
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function eur(n){return n.toFixed(2).replace('.',',')+' €'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

/* ---- les formes du dossier (panneau : x 80→320, bas y 440) ---- */
var FORMES=[
 {id:'classique',nom:'Classique',haut:60,d:'M80,440V62a22,22 0 0 1 22,-22H298a22,22 0 0 1 22,22V440Z'},
 {id:'arche',nom:'Arche',haut:95,d:'M80,440V160A120,120 0 0 1 320,160V440Z'},
 {id:'coeur',nom:'Cœur',haut:125,d:'M80,440V138C80,34 188,26 200,112C212,26 320,34 320,138V440Z'},
 {id:'chat',nom:'Chat',haut:125,d:'M80,440V58Q80,44 92,52L138,104Q200,88 262,104L308,52Q320,44 320,58V440Z'},
 {id:'nuage',nom:'Nuage',haut:115,d:'M80,440V150A45,45 0 0 1 140,112A62,62 0 0 1 258,108A45,45 0 0 1 320,150V440Z'},
 {id:'maison',nom:'Maison',haut:140,d:'M80,440V150L200,48L320,150V440Z'}
];
var PIED='M80,446H320V518a12,12 0 0 1 -12,12H238V500a10,10 0 0 0 -10,-10H172a10,10 0 0 0 -10,10V530H92a12,12 0 0 1 -12,-12Z';
var S={forme:'classique',els:[],sel:null,panneau:null,police:'playfair',seq:0};
function forme(){for(var i=0;i<FORMES.length;i++)if(FORMES[i].id===S.forme)return FORMES[i]}
function police(k){for(var i=0;i<D.polices.length;i++)if(D.polices[i][0]===k)return D.polices[i];return D.polices[0]}

/* ---- la scène ---- */
var svg=$('scene');
svg.innerHTML='<defs>'
 +'<linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1dfbd"/><stop offset=".55" stop-color="#e8d2ab"/><stop offset="1" stop-color="#dfc59a"/></linearGradient>'
 +'<linearGradient id="bois2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcc296"/><stop offset="1" stop-color="#e9d5b0"/></linearGradient>'
 +'<filter id="veine" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="3" seed="7" result="n"/>'
 +'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 -0.12"/><feComposite operator="in" in2="SourceGraphic"/></filter>'
 +'<filter id="brun" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.33  0 0 0 0 0.19  0 0 0 0 0.08  0 0 0 0.92 0"/></filter>'
 +'<filter id="sepia" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0.33 0.5 0.17 0 0  0 0 0 1 0"/>'
 +'<feComponentTransfer><feFuncR type="table" tableValues="0.26 0.62 0.93"/><feFuncG type="table" tableValues="0.14 0.44 0.82"/><feFuncB type="table" tableValues="0.06 0.26 0.64"/></feComponentTransfer></filter>'
 +'<filter id="flou"><feGaussianBlur stdDeviation="9"/></filter>'
 +'<clipPath id="decoupe"><path id="decoupeP"/></clipPath></defs>'
 +'<ellipse cx="214" cy="536" rx="150" ry="13" fill="#3a2a16" opacity=".22" filter="url(#flou)"/>'
 +'<path id="ombreP" fill="#6b4a25" opacity=".35" transform="translate(5,3)"/>'
 +'<path id="dos" fill="url(#bois)"/><path id="dosV" fill="#fff" filter="url(#veine)" opacity=".5"/>'
 +'<path id="dosB" fill="none" stroke="#a9834f" stroke-width="1.2" opacity=".7"/>'
 +'<g id="grav" clip-path="url(#decoupe)"></g>'
 +'<rect x="74" y="438" width="252" height="9" rx="3" fill="#4b3018"/>'
 +'<path d="'+PIED+'" fill="url(#bois2)"/><path d="'+PIED+'" fill="#fff" filter="url(#veine)" opacity=".45"/>'
 +'<path d="M80,446H320L250,490H80Z" fill="#6b4a25" opacity=".13"/>'
 +'<path d="'+PIED+'" fill="none" stroke="#a9834f" stroke-width="1.2" opacity=".7"/>'
 +'<g id="poignee"></g>';
var grav=$('grav'), poignee=$('poignee');

function limites(){var f=forme();return{x0:92,x1:308,y0:f.haut,y1:428}}
function taille(e){ /* largeur et hauteur de l'élément dans la scène */
 if(e.type==='texte'){return{w:0,h:30*e.s}}
 if(e.type==='dessin'){var w=118*e.s;return{w:w,h:w/e.r}}
 var c=128*e.s;return{w:c,h:c}}
function borner(e){var L=limites(),t=taille(e),hw=e.type==='texte'?36:t.w/2,hh=t.h/2,lo=L.x0+hw,hi=L.x1-hw;
 e.x=lo>hi?200:Math.max(lo,Math.min(hi,e.x));
 e.y=Math.max(L.y0+hh,Math.min(L.y1-hh,e.y))}

function dessiner(){
 var f=forme();
 ['decoupeP','ombreP','dos','dosV','dosB'].forEach(function(i){$(i).setAttribute('d',f.d)});
 grav.innerHTML='';poignee.innerHTML='';
 S.els.forEach(function(e){
  borner(e);
  var g=el('g',{'class':'sc-el','data-id':e.id},grav),t=taille(e);
  if(e.type==='texte'){
   var tx=el('text',{x:e.x,y:e.y,'text-anchor':'middle','dominant-baseline':'central','font-family':police(e.police)[2],'font-size':t.h,fill:'#55331a',opacity:.9},g);
   tx.textContent=e.texte||'Votre texte';
   var bb=tx.getBBox(),max=208; if(bb.width>max){tx.setAttribute('font-size',t.h*max/bb.width)}
  }else if(e.type==='dessin'){
   el('image',{href:e.src,x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,filter:'url(#brun)',opacity:.92},g);
  }else{
   el('image',{href:e.src,x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,preserveAspectRatio:'xMidYMid slice',filter:'url(#sepia)'},g);
   el('rect',{x:e.x-t.w/2,y:e.y-t.h/2,width:t.w,height:t.h,fill:'none',stroke:'#4b3018','stroke-width':1.6},g);
  }
  if(S.sel===e.id){var b=g.getBBox();
   el('rect',{x:b.x-5,y:b.y-5,width:b.width+10,height:b.height+10,rx:6,fill:'none',stroke:'#a98935','stroke-width':1.6,'stroke-dasharray':'6 5','pointer-events':'none'},poignee)}
 });
 fichier();liste();resume();
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

/* ---- étape 1 : formes ---- */
(function(){var h='';FORMES.forEach(function(f){
 h+='<button type="button" class="sc-forme" data-f="'+f.id+'"><svg viewBox="60 20 280 440"><path d="'+f.d+'"/></svg>'+f.nom+'</button>'});
 $('formes').innerHTML=h;
 $('formes').addEventListener('click',function(ev){var b=ev.target.closest('.sc-forme');if(!b)return;S.forme=b.getAttribute('data-f');majFormes();S.els.forEach(borner);if(chevauche())ranger();dessiner()})})();
/* la forme change : si deux éléments se retrouvent l'un sur l'autre, on les range du haut vers le bas */
function larg(e){return e.type==='texte'?200:taille(e).w}
function chevauche(){for(var i=0;i<S.els.length;i++)for(var j=i+1;j<S.els.length;j++){var a=S.els[i],b=S.els[j];
 if(Math.abs(a.y-b.y)<(taille(a).h+taille(b).h)/2+4&&Math.abs(a.x-b.x)<(larg(a)+larg(b))/2)return true}return false}
function ranger(){var L=limites(),els=S.els.slice().sort(function(a,b){return a.y-b.y}),n=els.length,dispo=L.y1-L.y0-8*(n-1),tot=0;
 els.forEach(function(e){tot+=taille(e).h});
 if(tot>dispo){var k=dispo/tot;els.forEach(function(e){e.s=Math.max(.4,e.s*k)});tot=0;els.forEach(function(e){tot+=taille(e).h})}
 var y=L.y0+Math.max(0,(dispo-tot)/2);els.forEach(function(e){var h=taille(e).h;e.y=y+h/2;y+=h+8})}
function majFormes(){[].forEach.call(document.querySelectorAll('.sc-forme'),function(b){b.classList.toggle('on',b.getAttribute('data-f')===S.forme)})}

/* ---- étape 2 : ajouter ---- */
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
 S.els.push(o);S.sel=o.id;S.panneau=null;panneau();dessiner()}
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
 }else if(S.panneau==='photo'){
  h='<div class="prc-fields"><p class="prc-legend">Un portrait, un couple, un animal : la photo est gravée en brun dans le bois. Choisissez une image nette et bien éclairée.</p>'
   +'<div class="sc-photo"><label class="sc-btn">Choisir ma photo<input type="file" accept="image/*" id="fphoto"></label>'
   +'<button type="button" class="sc-btn clair" id="exPhoto">Essayer avec une photo d\'exemple</button></div><p class="prc-hint">&nbsp;</p></div>';
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
 if(ev.target.id==='exPhoto'){ajouter({type:'photo',src:D.exemple,nom:"photo d'exemple"})}});
$('panneau').addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.id==='ntexte'){ev.preventDefault();$('okTexte').click()}});
$('panneau').addEventListener('change',function(ev){if(ev.target.id!=='fphoto')return;var f=ev.target.files&&ev.target.files[0];if(!f)return;
 var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){
   var c=document.createElement('canvas'),k=Math.min(1,700/Math.max(im.width,im.height));c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);ajouter({type:'photo',src:c.toDataURL('image/jpeg',.82),nom:f.name})};im.src=r.result};r.readAsDataURL(f)});

/* ---- la liste des éléments posés ---- */
function nomEl(e){return e.type==='texte'?'« '+(e.texte||'')+' »':e.type==='dessin'?'Dessin n° '+e.n:'Ma photo'}
function prixEl(i){return i===principal()?'compris':'+ '+eur(D.prix.plus)}
function principal(){ /* l'élément qui fixe le prix de départ : la photo, sinon le dessin, sinon le texte */
 var o=['photo','dessin','texte'];for(var k=0;k<o.length;k++)for(var i=0;i<S.els.length;i++)if(S.els[i].type===o[k])return i;return -1}
function liste(){
 var L=$('liste'),act=document.activeElement,garde=act&&act.getAttribute&&act.getAttribute('data-edit');
 if(garde){ /* on tape dans un champ : ne pas le reconstruire */
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
$('liste').addEventListener('input',function(ev){var id=ev.target.getAttribute('data-edit');if(!id)return;var e=trouver(+id);e.texte=ev.target.value;dessiner()});

/* ---- étape 3 : résumé et prix ---- */
function total(){var i=principal();if(i<0)return 0;return D.prix[S.els[i].type]+(S.els.length-1)*D.prix.plus}
function resume(){
 var R=$('resume'),h='<div class="prc-sumrow"><span>Forme du dossier</span><b>'+forme().nom+'</b></div>',p=principal();
 if(!S.els.length)h+='<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss">à choisir</b></div>';
 S.els.forEach(function(e,i){h+='<div class="prc-sumrow"><span>'+(e.type==='texte'?'Texte':e.type==='dessin'?'Dessin':'Photo')+'</span><b>'+esc(nomEl(e))
  +(e.type==='texte'?' · '+police(e.police)[1]:'')+' — '+(i===p?eur(D.prix[e.type]):'+ '+eur(D.prix.plus))+'</b></div>'});
 h+='<div class="prc-sumrow prc-sumtot" style="border-bottom:0"><span>Total</span><b>'+(S.els.length?eur(total()):'dès '+eur(D.prix.texte))+'</b></div>';
 R.innerHTML=h;
 $('total').textContent=S.els.length?eur(total()):'dès '+eur(D.prix.texte);
 $('n2').classList.toggle('done',S.els.length>0);$('n3').classList.toggle('done',S.els.length>0);
 $('ajouter').disabled=!S.els.length;$('ajouter').style.opacity=S.els.length?1:.5;
 $('manque').textContent=S.els.length?'':'Il manque la gravure : ajoutez un texte, un dessin ou votre photo.';
 $('prixtete').textContent=S.els.length?eur(total()):'dès '+eur(D.prix.texte);
}
$('ajouter').addEventListener('click',function(){if(!S.els.length)return;this.textContent='Ajouté au panier ✓ (maquette)'});

/* ---- le fichier de l'atelier ---- */
function fichier(){
 var F=$('fichier'),f=forme(),h='<g transform="translate(-40,10)"><path d="'+f.d+'" fill="none" stroke="#d32f2f" stroke-width="1.6"/>';
 S.els.forEach(function(e){var t=taille(e);
  if(e.type==='texte'){h+='<text x="'+e.x+'" y="'+e.y+'" text-anchor="middle" dominant-baseline="central" font-family="'+police(e.police)[2].replace(/"/g,"'")+'" font-size="'+t.h+'" fill="#111" data-t="'+e.id+'">'+esc(e.texte||'')+'</text>'}
  else if(e.type==='dessin'){h+='<image href="'+e.src+'" x="'+(e.x-t.w/2)+'" y="'+(e.y-t.h/2)+'" width="'+t.w+'" height="'+t.h+'"/>'}
  else{h+='<image href="'+e.src+'" x="'+(e.x-t.w/2)+'" y="'+(e.y-t.h/2)+'" width="'+t.w+'" height="'+t.h+'" preserveAspectRatio="xMidYMid slice" style="filter:grayscale(1) contrast(1.15)"/>'
   +'<rect x="'+(e.x-t.w/2)+'" y="'+(e.y-t.h/2)+'" width="'+t.w+'" height="'+t.h+'" fill="none" stroke="#111" stroke-width="1"/>'}});
 h+='<text x="200" y="476" text-anchor="middle" font-size="13" fill="#5a5247" font-family="Inter,sans-serif">Dossier</text></g>'
  +'<g transform="translate(270,-150)"><path d="'+PIED+'" fill="none" stroke="#d32f2f" stroke-width="1.6"/><rect x="96" y="462" width="208" height="7" fill="none" stroke="#d32f2f" stroke-width="1.6"/>'
  +'<text x="200" y="560" text-anchor="middle" font-size="13" fill="#5a5247" font-family="Inter,sans-serif">Pied</text></g>';
 F.innerHTML=h;
 [].forEach.call(F.querySelectorAll('text[data-t]'),function(t){var b=t.getBBox();if(b.width>208)t.setAttribute('font-size',parseFloat(t.getAttribute('font-size'))*208/b.width)});
 $('fnom').textContent='support-telephone-'+f.id+'-<n° de commande>.svg';
}

/* l'en-tête du site reste collé en haut : l'aperçu se colle juste dessous */
function sousEntete(){var h=document.querySelector('header'),t=0;
 if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;
 document.documentElement.style.setProperty('--sc-top',t+'px')}
sousEntete();window.addEventListener('resize',sousEntete);window.addEventListener('load',sousEntete);
/* ---- départ ---- */
$('lplus').textContent=eur(D.prix.plus);
majFormes();panneau();dessiner();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(dessiner);
/* logo : s'il ne charge pas dans l'aperçu, la case est masquée (sur le site il s'affiche) */
[].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
window.scDemo=function(){S.forme='arche';S.els=[];S.seq=0;ajouter({type:'photo',src:D.exemple,nom:'exemple'});ajouter({type:'texte',texte:'Camille & Paul',police:'great-vibes'});S.sel=null;majFormes();dessiner()};
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
  <div class="sc-stage"><span class="sc-tag">Votre support, en direct</span><svg id="scene" viewBox="40 14 320 536" role="img" aria-label="Aperçu de votre support de téléphone"></svg></div>
  <p class="sc-aide">Faites glisser un élément pour le déplacer. Aperçu indicatif : sur le bois, la gravure ressort en brun.</p>
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
open(sortie, "w", encoding="utf-8").write(page)
print(f"{sortie} : {len(page) // 1024} Ko · prix lus : texte {P_TEXTE} · dessin {P_DESSIN} · photo {P_PHOTO}")
