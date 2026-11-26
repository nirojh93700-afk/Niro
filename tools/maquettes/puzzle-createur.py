#!/usr/bin/env python3
"""Maquette « Créez votre puzzle photo » (26/11/2026) — RIEN en ligne.

Gérant : « https://www.atomm.com/creativetools/generator/puzzle-generator/ — tu me fais la même chose que pour le support
de téléphone, il y a déjà le puzzle en ligne, tu dois le retravailler, ne fais rien sur le site, on va refaire une maquette ».

Repris du générateur Atomm (analysé le 26/11 dans le navigateur) : formes Rectangle / Arrondi / Cercle / Ellipse / Cœur,
nombre de pièces, pièces en grille ou irrégulières (Voronoi), attaches classiques / rondes / triangle, taille des attaches,
arrondi, fréquence, « Reshuffle ». Les découpes sont CALCULÉES par la page (rien d'Atomm n'est copié). La maquette part de la
VRAIE fiche `puzzle-photo-grave` (en-tête, titre, prix, description, volets) ; la galerie devient l'aperçu vivant et la
personnalisation un parcours en étapes. En bas : le fichier de découpe que l'atelier recevrait (rouge = découpe).

  python3 tools/maquettes/puzzle-createur.py <capture.html> <dossier css> <d3-delaunay.min.js> <sortie.html>

capture = curl https://nivcreation.fr/produit/puzzle-photo-grave ; dossier css = ses feuilles de style ;
d3-delaunay = npm pack d3-delaunay@6.0.4 (dist/d3-delaunay.min.js, ISC). La sortie (photos intégrées) ne se commite pas.
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, d3path, sortie = sys.argv[1:5]


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def jpg_uri(im, w=900, q=80):
    im = im.convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


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
css = "".join(open(os.path.join(cssdir, f), encoding="utf-8").read() + "\n" for f in sorted(os.listdir(cssdir)) if f.endswith(".css"))
css = re.sub(r"@font-face\{[^}]*\}", "", css).replace("</style", "<\\/style")


def bloc(debut, fin):
    a = main.find(debut)
    z = main.find(fin, a)
    return main[a:z] if a >= 0 and z > a else ""


fil = re.sub(r'href="/[^"]*"', 'href="#"', bloc("<nav", "</nav>") + "</nav>")
titre = re.search(r"<h1>(.*?)</h1>", main, re.S).group(1)
accroche = re.search(r'</div><p style="color:var\(--ink-soft\);margin-top:0">(.*?)</p>', main, re.S).group(1)
prix = re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', main)
VARIANTES = [{"t": t, "n": int(t.split()[0]), "p": float(p.replace(" €", "").replace(" €", "").replace(",", "."))} for t, p in prix]
assert len(VARIANTES) == 4, VARIANTES
blocs_bas = ""
for d, f in (('<div class="trust-cards">', '<div class="pd-perso">'), ('<div class="pd-perso">', '<div class="product-desc">'),
             ('<div class="product-desc">', '<div class="info-accordion">')):
    blocs_bas += bloc(d, f)
acc = main[main.find('<div class="info-accordion">'):]
acc = acc[:acc.find("</details></div>") + len("</details></div>")] if "</details></div>" in acc else ""
blocs_bas += re.sub(r'href="/[^"]*"', 'href="#"', acc)
# gérant, 26/11 : la maquette suit la taille de la machine (zone 180 mm, 2 mm de marge) → plateau carré 17,6 × 17,6 cm
blocs_bas = (blocs_bas.replace("21 × 15 cm, un peu plus grand que nos puzzles à encastrer", "au choix 12 × 12, 15 × 15 ou 17,6 × 17,6 cm, épaisseur 3 mm")
             .replace("21 × 15 cm", "12 × 12, 15 × 15 ou 17,6 × 17,6 cm (au choix), épaisseur 3 mm"))

PHOTOS = []
for u in re.findall(r'<div class="gallery-thumbs">(.*?)</div>', main, re.S)[0].split("<button")[1:]:
    m = re.search(r'src="(/[^"]+)"', u)
    if m and os.path.exists(os.path.join(PUB, m.group(1).lstrip("/"))):
        PHOTOS.append(jpg_uri(Image.open(os.path.join(PUB, m.group(1).lstrip("/")))))
assert PHOTOS
# photo d'exemple (avant que la cliente envoie la sienne) : visages du cristal « famille » du site, recadrés
EXEMPLE = jpg_uri(Image.open(os.path.join(PUB, "produits", "cristal-h-famille.jpg")).crop((300, 165, 1000, 625)), w=1000, q=82)
D3 = open(d3path, encoding="utf-8").read().replace("</script", "<\\/script")

DONNEES = json.dumps({"variantes": VARIANTES, "photos": PHOTOS, "exemple": EXEMPLE}, ensure_ascii=False, separators=(",", ":"))

CSS_MAQ = r"""
:root{color-scheme:light}
body{background:var(--cream);color:var(--ink);font-family:'Inter',system-ui,sans-serif}
.pz-bandeau{background:#2b2620;color:#f3ece0;font-size:.8rem;line-height:1.45;padding:9px 16px;text-align:center}
.pz-bandeau b{color:#e2c67e}
main>nav.container{padding-left:clamp(16px,4vw,40px)!important;padding-right:clamp(16px,4vw,40px)!important}
.pz-left{position:sticky;top:calc(var(--pz-top,0px) + 12px);min-width:0;z-index:1}
.pz-stage{position:relative;border-radius:var(--radius);border:1px solid var(--line);overflow:hidden;
background:radial-gradient(120% 90% at 50% 20%,#f6f1e8 0%,#ece3d4 70%,#e2d6c2 100%)}
.pz-stage svg{display:block;width:100%;height:auto;touch-action:none;user-select:none}
.pz-stage .pz-photo-g{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.pz-stage[data-vue=photo] svg,.pz-stage[data-vue=photo] .pz-tools{display:none}
.pz-stage[data-vue=creation] .pz-photo-g{display:none}
.pz-tag{position:absolute;left:10px;top:10px;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
background:rgba(255,255,255,.86);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:#7c6120}
.pz-tools{position:absolute;right:10px;top:10px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.pz-tools button{font:inherit;font-size:.78rem;font-weight:600;border:1px solid var(--line);background:rgba(255,255,255,.92);
border-radius:999px;padding:6px 12px;cursor:pointer;color:var(--ink)}
.pz-tools button[aria-pressed=true]{background:#2b2620;color:#fff;border-color:#2b2620}
.pz-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(43,38,32,.82);color:#fff;font-size:.74rem;
padding:5px 12px;border-radius:999px;pointer-events:none;white-space:nowrap;transition:opacity .4s}
.pz-stage .pc{transition:transform .7s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.gallery-thumbs .pz-thc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#fbf3df;border:1.5px dashed #c9b88a;
color:#7c6120;font:inherit;font-size:.58rem;font-weight:700;line-height:1.1;text-align:center;cursor:pointer}
.gallery-thumbs .pz-thc.active{border-style:solid}
.gallery-thumbs button img{width:100%;height:100%;object-fit:cover;display:block}
.pz-step{border:1px solid var(--line);border-radius:14px;background:#fff;padding:14px 14px 16px;margin:0 0 12px}
.pz-step h3{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:1rem;font-family:var(--font-display),Georgia,serif}
.pz-n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#c9a24b;color:#fff;display:grid;place-items:center;font:700 .85rem Inter,sans-serif}
.pz-sub{font-size:.84rem;color:var(--ink-soft);margin:0 0 10px;line-height:1.5}
.pz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.pz-opt{font:inherit;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:10px 6px 8px;cursor:pointer;display:flex;
flex-direction:column;align-items:center;gap:6px;font-size:.8rem;font-weight:600;color:var(--ink);text-align:center;min-width:0}
.pz-opt svg{width:44px;height:34px}
.pz-opt small{font-weight:500;color:var(--ink-soft);font-size:.72rem}
.pz-opt[aria-pressed=true]{border-color:#c9a24b;background:#fbf6ea;box-shadow:0 0 0 2px rgba(201,162,75,.25)}
.pz-up{display:flex;gap:12px;align-items:center;border:1.5px dashed #c9b88a;border-radius:12px;padding:12px;background:#fdfaf3;cursor:pointer}
.pz-up img{width:64px;height:48px;object-fit:cover;border-radius:6px;flex:0 0 auto;background:#eee}
.pz-up b{display:block;font-size:.9rem}
.pz-up span{font-size:.78rem;color:var(--ink-soft)}
.pz-row{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:.84rem}
.pz-row label{min-width:110px;color:var(--ink-soft)}
.pz-row input[type=range]{flex:1;min-width:0;accent-color:#c9a24b}
.pz-row output{min-width:38px;text-align:right;font-variant-numeric:tabular-nums}
.pz-link{font:inherit;background:none;border:0;color:#7c6120;text-decoration:underline;cursor:pointer;padding:0;font-size:.84rem}
.pz-btn2{font:inherit;font-size:.84rem;font-weight:600;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer;margin-top:10px}
.pz-seg{display:flex;flex-wrap:wrap;gap:6px}
.pz-seg button{font:inherit;font-size:.82rem;font-weight:600;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;cursor:pointer}
.pz-seg button[aria-pressed=true]{border-color:#c9a24b;background:#fbf6ea}
.pz-lab{font-size:.8rem;font-weight:700;color:var(--ink);margin:12px 0 6px}
details.pz-fin{margin-top:12px;border-top:1px solid var(--line);padding-top:8px}
details.pz-fin summary{cursor:pointer;font-size:.84rem;font-weight:600;color:#7c6120}
.pz-sum{font-size:.86rem;line-height:1.7;margin:0;padding:0;list-style:none}
.pz-sum li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed var(--line)}
.pz-sum li span:last-child{font-weight:600;text-align:right}
.pz-tot{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;font-weight:700}
.pz-tot b{font-size:1.35rem;color:#a98935}
.pz-manque{font-size:.8rem;color:#b3261e;margin:8px 0 0}
.pz-cart{width:100%;margin-top:10px}
.pz-cart[disabled]{opacity:.45;cursor:not-allowed}
.pz-age{font-size:.78rem;color:#8a5a00;background:#fff5e0;border:1px solid #f0d9a8;border-radius:10px;padding:8px 10px;margin-top:10px}
.pz-atelier{margin:34px auto 0;padding:18px clamp(16px,4vw,40px) 26px;border-top:3px solid #2b2620;background:#faf7f0}
.pz-atelier h2{font-size:1.15rem;margin:0 0 4px}
.pz-atelier p{font-size:.86rem;color:var(--ink-soft);margin:0 0 10px;max-width:70ch}
.pz-fichier{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;overflow-x:auto}
.pz-fichier svg{display:block;width:100%;max-width:760px;height:auto;margin:0 auto}
.pz-faits{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.pz-faits span{font-size:.78rem;background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px 10px}
.pz-valider{margin-top:14px;font-size:.84rem;background:#fffbe9;border:1px solid #ecd99a;border-radius:12px;padding:10px 14px}
.pz-valider li{margin:3px 0}
@media (max-width:900px){.pz-left{position:static}.pz-stage svg{max-height:62vh}}
"""

HTML = f"""<title>Puzzle photo créateur</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;700&display=swap">
<style>{css}</style><style>{CSS_MAQ}</style>
<div class="pz-bandeau"><b>Maquette — rien n'est en ligne.</b> La fiche « Puzzle photo gravé » retravaillée comme le générateur de puzzle d'Atomm : forme, nombre de pièces, style des pièces, aperçu vivant.</div>
{header}
<main>
{fil}
<div class="container product-layout">
  <div class="pz-left">
    <div class="pz-stage" id="stage" data-vue="creation">
      <img class="pz-photo-g" id="photoG" alt="">
      <svg id="svg" viewBox="-10 -10 196 196" aria-label="Aperçu de votre puzzle"></svg>
      <span class="pz-tag" id="tag">Votre puzzle</span>
      <div class="pz-tools"><button type="button" id="bEclate" aria-pressed="false">Voir les pièces</button></div>
      <div class="pz-hint" id="hint">Glissez la photo pour la placer</div>
    </div>
    <div class="gallery-thumbs" id="thumbs"></div>
  </div>
  <div class="product-info">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h1>{titre}</h1></div>
    <p style="color:var(--ink-soft);margin-top:0">{accroche}</p>
    <div class="price-lead" id="prixLead"></div>

    <section class="pz-step"><h3><span class="pz-n">1</span>Votre photo</h3>
      <label class="pz-up" for="file"><img id="miniPhoto" alt=""><div><b id="upTitre">Choisir ma photo</b><span id="upTxt">Une photo d'exemple est posée en attendant la vôtre.</span></div></label>
      <input type="file" id="file" accept="image/*" hidden>
      <div class="pz-row"><label for="zoom">Agrandir la photo</label><input type="range" id="zoom" min="100" max="250" value="100"><output id="zoomO">100 %</output></div>
      <button type="button" class="pz-link" id="recentrer" style="margin-top:6px">Recentrer la photo</button>
      <p class="pz-sub" style="margin:10px 0 0">Choisissez une photo nette et bien éclairée, avec les visages bien visibles. Elle est gravée en noir et blanc sur le bois, puis le puzzle est découpé au laser.</p>
    </section>

    <section class="pz-step"><h3><span class="pz-n">2</span>La forme du puzzle</h3>
      <div class="pz-grid" id="formes"></div>
    </section>

    <section class="pz-step"><h3><span class="pz-n">3</span>La taille</h3>
      <div class="pz-grid" id="tailles"></div>
      <p class="pz-sub" style="margin:10px 0 0">Plus le puzzle est grand, plus les pièces sont grandes et faciles à prendre. Toutes les tailles sont en bois de 3 mm d'épaisseur.</p>
    </section>

    <section class="pz-step"><h3><span class="pz-n">4</span>Le nombre de pièces</h3>
      <div class="variant-swatches" id="pieces"></div>
      <p class="pz-sub" id="tailleP" style="margin:10px 0 0"></p>
    </section>

    <section class="pz-step"><h3><span class="pz-n">5</span>Le style des pièces</h3>
      <div class="pz-lab">Les pièces</div>
      <div class="pz-grid" id="types"></div>
      <div class="pz-lab">Les attaches</div>
      <div class="pz-grid" id="attaches"></div>
      <button type="button" class="pz-btn2" id="melanger">↻ Mélanger les pièces</button>
      <details class="pz-fin"><summary>Réglages fins (facultatif)</summary>
        <div class="pz-row"><label for="rTaille">Taille des attaches</label><input type="range" id="rTaille" min="8" max="45" value="26"><output id="oTaille"></output></div>
        <div class="pz-row"><label for="rArrondi">Arrondi</label><input type="range" id="rArrondi" min="0" max="100" value="60"><output id="oArrondi"></output></div>
        <div class="pz-row"><label for="rFreq">Attaches sur les bords</label><input type="range" id="rFreq" min="40" max="100" value="100"><output id="oFreq"></output></div>
      </details>
    </section>

    <section class="pz-step"><h3><span class="pz-n">6</span>Votre puzzle</h3>
      <ul class="pz-sum" id="resume"></ul>
      <div class="pz-tot"><span>Total</span><b id="total"></b></div>
      <div class="qty-row" style="margin-top:10px"><button type="button" class="btn btn-gold pz-cart" id="panier">Ajouter au panier</button></div>
      <p class="pz-manque" id="manque"></p>
      <div class="pz-age">Attention : ne convient pas aux enfants de moins de 36 mois. Petits éléments, risque d'étouffement.</div>
    </section>
    {blocs_bas}
  </div>
</div>
<section class="pz-atelier">
  <h2>De votre côté : le fichier que l'atelier reçoit</h2>
  <p>Fichier à la taille réelle, en millimètres. Rouge = découpe (contour + chaque pièce). La photo se grave en noir et blanc avant la découpe. Il se recalcule avec les choix de la cliente.</p>
  <div class="pz-fichier" id="fichier"></div>
  <div class="pz-faits" id="faits"></div>
  <div class="pz-valider"><b>À valider par vous :</b><ul>
    <li>les prix proposés : taille Moyen +3 €, Grand +6 € ; forme : cœur +2 €, carré, coins arrondis, rond et ovale au prix de base ;</li>
    <li>les tailles : Petit 12 × 12, Moyen 15 × 15, Grand 17,6 × 17,6 cm ;</li>
    <li>les pièces irrégulières et les 3 styles d'attaches, pour vos essais de découpe ;</li>
    <li>le réglage « Réglages fins » laissé à la cliente, ou gardé pour l'atelier seulement.</li>
  </ul></div>
</section>
</main>
{footer}
<script>{D3}</script>
<script>window.PZ={DONNEES};</script>
<script>
(function(){{
const D=window.PZ, W=176, H=176, SVGNS="http://www.w3.org/2000/svg";
const S={{photo:D.exemple, exemple:true, iw:700, ih:460, forme:"rect", vi:1, tl:"moyen", type:"grille", att:"classique", taille:26, arrondi:60, freq:100, seed:7, zoom:1, ox:0, oy:0, eclate:false, vue:"creation"}};
const $=id=>document.getElementById(id);
const eur=v=>v.toFixed(2).replace(".",",")+"\\u00a0€";
function rng(seed){{let a=seed>>>0;return()=>{{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}};}}
function hash(s){{let h=2166136261;for(const c of s){{h^=c.charCodeAt(0);h=Math.imul(h,16777619);}}return h>>>0;}}

// ---------- formes (unités = mm, plateau 176 × 176 = zone machine 180 moins 2 mm de marge) ----------
const FORMES=[
 {{id:"rect",nom:"Carré",sup:0,box:[0,0,176,176],aire:1}},
 {{id:"arrondi",nom:"Coins arrondis",sup:0,box:[0,0,176,176],aire:.99}},
 {{id:"cercle",nom:"Rond",sup:0,box:[0,0,176,176],aire:.785}},
 {{id:"ellipse",nom:"Ovale",sup:0,box:[0,22,176,154],aire:.785}},
 {{id:"coeur",nom:"Cœur",sup:2,box:[0,10.5,176,165.5],aire:.72}},
];
const forme=()=>FORMES.find(f=>f.id===S.forme);
// tailles (gérant, 26/11 : « plus grand, plus cher ») : côté du plateau en mm, 176 = zone machine 180 moins 2 mm de marge
const TAILLES=[{{id:"petit",nom:"Petit",cote:120,sup:0}},{{id:"moyen",nom:"Moyen",cote:150,sup:3}},{{id:"grand",nom:"Grand",cote:176,sup:6}}];
const taille=()=>TAILLES.find(t=>t.id===S.tl);
const kk=(t)=>(t||taille()).cote/176;
const cm=v=>(Math.round(v)/10).toFixed(1).replace(".0","").replace(".",",");
function dimF(f,t){{const k=kk(t), w=(f.box[2]-f.box[0])*k, h=(f.box[3]-f.box[1])*k;return f.id==="cercle"?`Ø ${{cm(w)}} cm`:`${{cm(w)}} × ${{cm(h)}} cm`;}}
const plus=v=>v?`+${{v}}\u00a0€`:"prix de base";
const prixTotal=()=>D.variantes[S.vi].p+taille().sup+forme().sup;
function cheminForme(id){{
  if(id==="rect") return "M0 0H176V176H0Z";
  if(id==="arrondi") return "M14 0H162A14 14 0 0 1 176 14V162A14 14 0 0 1 162 176H14A14 14 0 0 1 0 162V14A14 14 0 0 1 14 0Z";
  if(id==="cercle") return "M88 0A88 88 0 1 1 87.99 0Z";
  if(id==="ellipse") return "M88 22A88 66 0 1 1 87.99 22Z";
  const x0=0,w=176,y0=10.5,h=155, P=(x,y)=>(x0+x*w).toFixed(2)+" "+(y0+y*h).toFixed(2);
  return "M"+P(.5,.24)+"C"+P(.5,.08)+" "+P(.36,0)+" "+P(.23,0)+"C"+P(.07,0)+" "+P(0,.15)+" "+P(0,.31)+"C"+P(0,.56)+" "+P(.24,.76)+" "+P(.5,1)
   +"C"+P(.76,.76)+" "+P(1,.56)+" "+P(1,.31)+"C"+P(1,.15)+" "+P(.93,0)+" "+P(.77,0)+"C"+P(.64,0)+" "+P(.5,.08)+" "+P(.5,.24)+"Z";
}}
const testPath=document.createElementNS(SVGNS,"path");
const tsvg=document.createElementNS(SVGNS,"svg");tsvg.setAttribute("style","position:absolute;width:0;height:0");tsvg.appendChild(testPath);document.body.appendChild(tsvg);
function dedans(x,y){{testPath.setAttribute("d",cheminForme(S.forme));const p=tsvg.createSVGPoint();p.x=x;p.y=y;return testPath.isPointInFill(p);}}

// ---------- bords des pièces ----------
function cubic(a,b,c,d,n){{const o=[];for(let i=1;i<=n;i++){{const t=i/n,u=1-t;o.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}}return o;}}
function profil(r){{
  const t=S.taille/260, k=.55+S.arrondi/100*.8, j=.035, R=()=>(r()*2-1)*j;
  const a=R(),b=R(),c=R(),d=R(),e=R();
  if(S.att==="classique"){{
    const p0=[0,0],p1=[.2,a],p2=[.5+b+d,-t+c],p3=[.5-t+b,t+c],p4=[.5-2*t*k+b-d,3*t+c],p5=[.5+2*t*k+b-d,3*t+c],p6=[.5+t+b,t+c],p7=[.5+b+d,-t+c],p8=[.8,e],p9=[1,0];
    return [p0,...cubic(p0,p1,p2,p3,10),...cubic(p3,p4,p5,p6,14),...cubic(p6,p7,p8,p9,10)];
  }}
  if(S.att==="ronde"){{
    const w=1.15*t*k, hh=2.3*t, m=.5+b;
    return [[0,0],[m-w,c*.3],...cubic([m-w,0],[m-w*1.55,hh*1.05],[m+w*1.55,hh*1.05],[m+w,0],18),[1,0]];
  }}
  const w=1.25*t, hh=2.4*t, m=.5+b, q=S.arrondi/100*.35*t;
  return [[0,0],[m-w,0],[m-q,hh-q*1.4],...cubic([m-q,hh-q*1.4],[m-q*.3,hh],[m+q*.3,hh],[m+q,hh-q*1.4],6),[m+w,0],[1,0]];
}}
function bord(A,B,cle,surBord){{
  const L=Math.hypot(B[0]-A[0],B[1]-A[1]);
  if(surBord||L<7) return [A,B];
  const r=rng(hash(cle+"|"+S.seed));
  if(r()*100>S.freq) return [A,B];
  const sg=r()<.5?1:-1, ux=(B[0]-A[0])/L, uy=(B[1]-A[1])/L, nx=-uy, ny=ux;
  return profil(r).map(([x,y])=>[A[0]+ux*x*L+nx*y*L*sg,A[1]+uy*x*L+ny*y*L*sg]);
}}
const cleP=p=>p[0].toFixed(1)+","+p[1].toFixed(1);

// ---------- pièces ----------
function dimsGrille(n,w,h){{
  let best=null;for(let r=2;r<=20;r++)for(let c=2;c<=24;c++){{const sc=Math.abs(r*c-n)+8*Math.abs(Math.log((w/c)/(h/r)));if(!best||sc<best.sc)best={{r,c,sc}};}}return best;
}}
function pieces(){{
  const f=forme(), n=D.variantes[S.vi].n, [bx0,by0,bx1,by1]=f.box, bw=bx1-bx0, bh=by1-by0;
  const cache=new Map(), out=[];
  const arete=(A,B,surBord)=>{{const k1=cleP(A),k2=cleP(B),cle=k1<k2?k1+"|"+k2:k2+"|"+k1;
    if(!cache.has(cle)){{const a=k1<k2?A:B,b=k1<k2?B:A;cache.set(cle,{{a:cleP(a),pts:bord(a,b,cle,surBord)}});}}
    const e=cache.get(cle);return e.a===k1?e.pts:[...e.pts].reverse();}};
  const fermer=(pts)=>"M"+pts.map(p=>p[0].toFixed(2)+" "+p[1].toFixed(2)).join("L")+"Z";
  if(S.type==="grille"){{
    const g=dimsGrille(n/f.aire,bw,bh), cw=bw/g.c, ch=bh/g.r, N=(i,j)=>[bx0+i*cw,by0+j*ch];
    for(let j=0;j<g.r;j++)for(let i=0;i<g.c;i++){{
      const pts=[...arete(N(i,j),N(i+1,j),j===0),...arete(N(i+1,j),N(i+1,j+1),i===g.c-1).slice(1),...arete(N(i+1,j+1),N(i,j+1),j===g.r-1).slice(1),...arete(N(i,j+1),N(i,j),i===0).slice(1)];
      const cx=bx0+(i+.5)*cw, cy=by0+(j+.5)*ch;
      out.push({{d:fermer(pts),cx,cy}});
    }}
  }} else {{
    const r=rng(9001+S.seed);let P=[];let essais=0;
    while(P.length<n&&essais<20000){{essais++;const x=bx0+r()*bw,y=by0+r()*bh;if(dedans(x,y))P.push([x,y]);}}
    for(let it=0;it<4;it++){{const v=d3.Delaunay.from(P).voronoi([bx0,by0,bx1,by1]);P=P.map((p,i)=>{{const c=v.cellPolygon(i);if(!c)return p;let sx=0,sy=0;for(let k=0;k<c.length-1;k++){{sx+=c[k][0];sy+=c[k][1];}}return[sx/(c.length-1),sy/(c.length-1)];}});}}
    const v=d3.Delaunay.from(P).voronoi([bx0,by0,bx1,by1]);
    const surB=(a,b)=>{{const e=.01;return (Math.abs(a[0]-bx0)<e&&Math.abs(b[0]-bx0)<e)||(Math.abs(a[0]-bx1)<e&&Math.abs(b[0]-bx1)<e)||(Math.abs(a[1]-by0)<e&&Math.abs(b[1]-by0)<e)||(Math.abs(a[1]-by1)<e&&Math.abs(b[1]-by1)<e);}};
    P.forEach((p,i)=>{{const c=v.cellPolygon(i);if(!c)return;let pts=[];
      for(let k=0;k<c.length-1;k++){{const s=arete(c[k],c[k+1],surB(c[k],c[k+1]));pts.push(...(k?s.slice(1):s));}}
      out.push({{d:fermer(pts),cx:p[0],cy:p[1]}});}});
  }}
  return out;
}}

// ---------- aperçu ----------
const el=(t,a,p)=>{{const e=document.createElementNS(SVGNS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}};
let PC=[];
function photoAttrs(){{
  const f=forme(), [bx0,by0,bx1,by1]=f.box, bw=bx1-bx0, bh=by1-by0, s=Math.max(bw/S.iw,bh/S.ih)*S.zoom, w=S.iw*s, h=S.ih*s;
  const mx=(w-bw)/2, my=(h-bh)/2; S.ox=Math.max(-mx,Math.min(mx,S.ox)); S.oy=Math.max(-my,Math.min(my,S.oy));
  return {{href:S.photo,x:bx0+(bw-w)/2+S.ox,y:by0+(bh-h)/2+S.oy,width:w,height:h,preserveAspectRatio:"none"}};
}}
function dessiner(){{
  const svg=$("svg"); svg.innerHTML="";
  const defs=el("defs",{{}},svg), sh=cheminForme(S.forme);
  el("path",{{d:sh}},el("clipPath",{{id:"cf"}},defs));
  const lg=el("linearGradient",{{id:"bois",x1:0,y1:0,x2:1,y2:1}},defs);
  el("stop",{{offset:0,"stop-color":"#ecd3a8"}},lg);el("stop",{{offset:.5,"stop-color":"#e2c393"}},lg);el("stop",{{offset:1,"stop-color":"#d9b682"}},lg);
  const fl=el("filter",{{id:"grave","color-interpolation-filters":"sRGB"}},defs);
  el("feColorMatrix",{{type:"matrix",values:"0.33 0.33 0.33 0 0  0.30 0.30 0.30 0 0  0.27 0.27 0.27 0 0  0 0 0 1 0"}},fl);
  el("feComponentTransfer",{{}},fl).append(el("feFuncR",{{type:"gamma",exponent:1.25,amplitude:1}}),el("feFuncG",{{type:"gamma",exponent:1.25,amplitude:1}}),el("feFuncB",{{type:"gamma",exponent:1.25,amplitude:1}}));
  const ombre=el("filter",{{id:"ombre",x:"-10%",y:"-10%",width:"120%",height:"130%"}},defs);
  el("feDropShadow",{{dx:0,dy:2.2,stdDeviation:2.2,"flood-color":"#4b3214","flood-opacity":.35}},ombre);
  PC=pieces();
  const pa=photoAttrs();
  if(!S.eclate){{
    const g=el("g",{{filter:"url(#ombre)"}},svg);
    el("path",{{d:sh,fill:"url(#bois)"}},g);
    const gi=el("g",{{"clip-path":"url(#cf)"}},svg);
    el("image",{{...pa,filter:"url(#grave)",style:"mix-blend-mode:multiply",opacity:.92,id:"img"}},gi);
    el("path",{{d:PC.map(p=>p.d).join(""),fill:"none",stroke:"#5a3a1c","stroke-width":.35,"stroke-opacity":.75}},gi);
    el("path",{{d:sh,fill:"none",stroke:"#6b4520","stroke-width":.6}},svg);
  }} else {{
    const r=rng(77+S.seed), f=forme(), cx0=(f.box[0]+f.box[2])/2, cy0=(f.box[1]+f.box[3])/2;
    PC.filter(p=>dedans(p.cx,p.cy)).forEach((p,i)=>{{
      const cp=el("clipPath",{{id:"p"+i}},defs); el("path",{{d:p.d}},cp);
      const g=el("g",{{class:"pc"}},svg);
      const gc=el("g",{{"clip-path":"url(#cf)"}},g), gp=el("g",{{"clip-path":"url(#p"+i+")"}},gc);
      el("path",{{d:p.d,fill:"url(#bois)"}},gp);
      el("image",{{...pa,filter:"url(#grave)",style:"mix-blend-mode:multiply",opacity:.92}},gp);
      el("path",{{d:p.d,fill:"none",stroke:"#5a3a1c","stroke-width":.45,"stroke-opacity":.9}},gc);
      const dx=(p.cx-cx0)*.16+(r()*2-1)*4, dy=(p.cy-cy0)*.16+(r()*2-1)*4, a=(r()*2-1)*14;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{{g.style.transform=`translate(${{dx}}px,${{dy}}px) rotate(${{a}}deg)`;}}));
    }});
  }}
  fichier(); resume();
}}
// glisser la photo
(function(){{
  const svg=$("svg");let st=null;
  svg.addEventListener("pointerdown",e=>{{if(S.eclate)return;svg.setPointerCapture(e.pointerId);const m=svg.getScreenCTM();st={{x:e.clientX,y:e.clientY,ox:S.ox,oy:S.oy,k:1/m.a}};$("hint").style.opacity=0;}});
  svg.addEventListener("pointermove",e=>{{if(!st)return;S.ox=st.ox+(e.clientX-st.x)*st.k;S.oy=st.oy+(e.clientY-st.y)*st.k;const i=$("img");if(i){{const a=photoAttrs();i.setAttribute("x",a.x);i.setAttribute("y",a.y);}}}});
  const fin=()=>{{if(st){{st=null;fichier();}}}};svg.addEventListener("pointerup",fin);svg.addEventListener("pointercancel",fin);
}})();

// ---------- fichier de l'atelier ----------
function fichier(){{
  const sh=cheminForme(S.forme);
  $("fichier").innerHTML=`<svg viewBox="-5 -5 186 196" width="${{(186*kk()).toFixed(1)}}mm" height="${{(196*kk()).toFixed(1)}}mm" xmlns="${{SVGNS}}"><rect x="-5" y="-5" width="186" height="196" fill="#fff"/>`+
   `<defs><clipPath id="cf2"><path d="${{sh}}"/></clipPath></defs>`+
   `<g clip-path="url(#cf2)"><path d="${{PC.map(p=>p.d).join("")}}" fill="none" stroke="#ff0000" stroke-width=".3"/></g>`+
   `<path d="${{sh}}" fill="none" stroke="#ff0000" stroke-width=".3"/>`+
   `<text x="0" y="186" font-size="4" fill="#777" font-family="Inter,sans-serif">${{taille().cote}} × ${{taille().cote}} mm (taille ${{taille().nom}}) — rouge = découpe</text></svg>`;
  const f=forme(), dans=PC.filter(p=>dedans(p.cx,p.cy)).length;
  $("faits").innerHTML=[`Taille : ${{taille().nom}} ${{taille().cote}} × ${{taille().cote}} mm`,`Épaisseur : 3 mm`,`Forme : ${{f.nom}} (${{dimF(f)}})`,`Pièces dans le fichier : ${{dans}}`,`Pièces : ${{S.type==="grille"?"en grille":"irrégulières"}}`,`Attaches : ${{({{classique:"classiques",ronde:"rondes",triangle:"pointues"}})[S.att]}}`,`Photo : ${{S.exemple?"exemple":"envoyée par la cliente"}}`].map(t=>`<span>${{t}}</span>`).join("");
}}

// ---------- panneau ----------
function icone(id){{const vb="-5 -5 186 186";return `<svg viewBox="${{vb}}"><path d="${{cheminForme(id)}}" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="6"/></svg>`;}}
function iconeType(t){{return t==="grille"?`<svg viewBox="0 0 44 34"><rect x="2" y="2" width="40" height="30" rx="2" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/><path d="M15.3 2V32M28.6 2V32M2 17H42" stroke="#9c6b3f" stroke-width="1.3"/></svg>`
  :`<svg viewBox="0 0 44 34"><rect x="2" y="2" width="40" height="30" rx="2" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/><path d="M13 2L17 14L8 22L2 20M17 14L29 11L33 2M29 11L35 21L42 22M35 21L26 32M17 14L22 24L26 32M8 22L13 32M22 24L13 32" fill="none" stroke="#9c6b3f" stroke-width="1.3"/></svg>`;}}
function iconeAtt(a){{const d=a==="classique"?"M2 20H15C17 20 18 18 17 16C15 13 17 9 22 9C27 9 29 13 27 16C26 18 27 20 29 20H42":a==="ronde"?"M2 20H15C14 9 30 9 29 20H42":"M2 20H15L22 9L29 20H42";
  return `<svg viewBox="0 0 44 34"><path d="${{d}}" fill="none" stroke="#9c6b3f" stroke-width="2"/></svg>`;}}
function boutons(id,items,cle,fn){{
  $(id).innerHTML=items.map(o=>`<button type="button" class="pz-opt" data-v="${{o.v}}" aria-pressed="${{S[cle]===o.v}}">${{o.icon}}<span>${{o.t}}</span>${{o.s?`<small>${{o.s}}</small>`:""}}</button>`).join("");
  $(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{{S[cle]=b.dataset.v;$(id).querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));if(fn)fn();vueCreation();dessiner();}});
}}
function resume(){{
  const v=D.variantes[S.vi], f=forme();
  $("prixLead").textContent=eur(prixTotal());
  const cw=(f.box[2]-f.box[0]), ch=(f.box[3]-f.box[1]), aire=cw*ch*f.aire/v.n, cote=Math.sqrt(aire)*kk()/10;
  $("tailleP").textContent=`Pièces d'environ ${{cote.toFixed(1).replace(".",",")}} cm de côté. Plus il y a de pièces, plus elles sont petites et le puzzle difficile.`+(cote<1.4?" Pièces très petites : prenez plutôt une taille plus grande.":"");
  $("resume").innerHTML=[["Photo",S.exemple?"à choisir":"votre photo"],["Taille",`${{taille().nom}}${{taille().sup?" (+"+taille().sup+"\u00a0€)":""}}`],["Forme",`${{f.nom}} · ${{dimF(f)}}${{f.sup?" (+"+f.sup+"\u00a0€)":""}}`],["Pièces",`${{v.t}} (${{eur(v.p)}})`],["Style",`${{S.type==="grille"?"en grille":"irrégulières"}}, attaches ${{({{classique:"classiques",ronde:"rondes",triangle:"pointues"}})[S.att]}}`],["Épaisseur","3 mm"],["Gravure","photo en noir et blanc, au laser"]]
    .map(([a,b])=>`<li><span>${{a}}</span><span>${{b}}</span></li>`).join("");
  $("total").textContent=eur(prixTotal());
  $("panier").disabled=S.exemple; $("manque").textContent=S.exemple?"Il manque votre photo : choisissez-la à l'étape 1.":"";
}}
function pieceSw(){{
  $("pieces").innerHTML=D.variantes.map((v,i)=>`<button type="button" class="variant-swatch${{i===S.vi?" active":""}}" aria-pressed="${{i===S.vi}}" data-i="${{i}}"><span class="vs-title">${{v.t}}</span><span class="vs-price"><span class="vs-now">${{eur(v.p+taille().sup+forme().sup)}}</span></span></button>`).join("");
  $("pieces").querySelectorAll("button").forEach(b=>b.onclick=()=>{{S.vi=+b.dataset.i;pieceSw();vueCreation();dessiner();}});
}}
// galerie : la création + les vraies photos de la fiche
function vueCreation(){{S.vue="creation";$("stage").dataset.vue="creation";thumbs();}}
function thumbs(){{
  $("thumbs").innerHTML=`<button type="button" class="pz-thc${{S.vue==="creation"?" active":""}}" data-k="c">${{icone(S.forme)}}Votre<br>puzzle</button>`+
   D.photos.map((p,i)=>`<button type="button" class="${{S.vue===i?"active":""}}" data-k="${{i}}"><img src="${{p}}" alt=""></button>`).join("");
  $("thumbs").querySelectorAll("button").forEach(b=>b.onclick=()=>{{if(b.dataset.k==="c"){{vueCreation();}}else{{S.vue=+b.dataset.k;$("stage").dataset.vue="photo";$("photoG").src=D.photos[S.vue];thumbs();}}}});
  $("thumbs").querySelectorAll(".pz-thc svg").forEach(s=>{{s.style.width="26px";s.style.height="22px";}});
}}
function photoCharge(src,exemple){{
  const im=new Image();im.onload=()=>{{let w=im.naturalWidth,h=im.naturalHeight,url=src;
    if(!exemple&&Math.max(w,h)>1600){{const k=1600/Math.max(w,h),c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);url=c.toDataURL("image/jpeg",.86);w=c.width;h=c.height;}}
    Object.assign(S,{{photo:url,iw:w,ih:h,exemple,ox:0,oy:0}});$("miniPhoto").src=url;
    $("upTitre").textContent=exemple?"Choisir ma photo":"Changer de photo";$("upTxt").textContent=exemple?"Une photo d'exemple est posée en attendant la vôtre.":"Votre photo est posée sur le puzzle. Glissez-la pour la placer.";
    vueCreation();dessiner();}};im.src=src;
}}
$("file").onchange=e=>{{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>photoCharge(fr.result,false);fr.readAsDataURL(f);}};
$("zoom").oninput=e=>{{S.zoom=e.target.value/100;$("zoomO").textContent=e.target.value+" %";dessiner();}};
$("recentrer").onclick=()=>{{S.ox=0;S.oy=0;dessiner();}};
$("melanger").onclick=()=>{{S.seed=1+Math.floor(Math.random()*99999);vueCreation();dessiner();}};
$("bEclate").onclick=()=>{{S.eclate=!S.eclate;$("bEclate").setAttribute("aria-pressed",S.eclate);$("bEclate").textContent=S.eclate?"Voir assemblé":"Voir les pièces";dessiner();}};
for(const [id,o,cle,fmt] of [["rTaille","oTaille","taille",v=>v],["rArrondi","oArrondi","arrondi",v=>v+" %"],["rFreq","oFreq","freq",v=>v+" %"]]){{
  $(o).textContent=fmt(S[cle]);$(id).oninput=e=>{{S[cle]=+e.target.value;$(o).textContent=fmt(S[cle]);dessiner();}};
}}
function rendreChoix(){{
  boutons("tailles",TAILLES.map(t=>({{v:t.id,t:t.nom,s:`${{cm(t.cote)}} × ${{cm(t.cote)}} cm · ${{plus(t.sup)}}`,icon:`<svg viewBox="0 0 44 34"><rect x="${{22-15*t.cote/176}}" y="${{17-15*t.cote/176}}" width="${{30*t.cote/176}}" height="${{30*t.cote/176}}" rx="2" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/></svg>`}})),"tl",()=>{{S.ox=0;S.oy=0;rendreChoix();pieceSw();}});
  boutons("formes",FORMES.map(f=>({{v:f.id,t:f.nom,s:`${{dimF(f)}} · ${{plus(f.sup)}}`,icon:icone(f.id)}})),"forme",()=>{{S.ox=0;S.oy=0;pieceSw();}});
}}
rendreChoix();
boutons("types",[{{v:"grille",t:"Classiques",s:"en grille",icon:iconeType("grille")}},{{v:"libre",t:"Irrégulières",s:"formes libres",icon:iconeType("libre")}}],"type");
boutons("attaches",[{{v:"classique",t:"Classiques",icon:iconeAtt("classique")}},{{v:"ronde",t:"Rondes",icon:iconeAtt("ronde")}},{{v:"triangle",t:"Pointues",icon:iconeAtt("triangle")}}],"att");
function sousEntete(){{const h=document.querySelector('header');let t=0;if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;document.documentElement.style.setProperty('--pz-top',t+'px');}}
sousEntete();window.addEventListener('resize',sousEntete);window.addEventListener('load',sousEntete);
pieceSw();thumbs();photoCharge(D.exemple,true);
}})();
</script>
"""

open(sortie, "w", encoding="utf-8").write(HTML)
print(sortie, round(len(HTML) / 1e6, 2), "Mo")
