#!/usr/bin/env python3
"""Maquette « Créez votre fleur à prénom » (13/11/2026) — RIEN en ligne.

Le gérant : le même outil que https://www.atomm.com/creativetools/generator/flower/ (« Analyse bien »).
Une fleur au bout d'une tige, deux feuilles, le prénom découpé sur la tige. Deux couches à coller : le fond (silhouette pleine)
et le dessus (la fleur en traits, les lettres évidées dans leur contour). Mêmes fleurs, mêmes feuilles, mêmes réglages et même
calcul que l'outil d'Atomm (réunion des pièces, contour du prénom, prénom retiré, silhouette = fond).

  python3 tools/maquettes/fleur-createur.py <page de base> <formes.json> <dossier des écritures> <clipper.js> <opentype.min.js> <sortie>

<page de base>   = la sortie d'un autre créateur (arbre-createur.py par exemple) : on en garde l'habillage du site.
<formes.json>    = la sortie de fleur-formes.py (26 fleurs, 8 paires de feuilles).
<écritures>      = docs/maquettes/assets/fleur/polices (dix écritures libres, allégées avec fontTools).
<clipper.js>     = npm pack clipper-lib@6.4.2 → package/clipper.js ; <opentype.min.js> = npm pack opentype.js@1.3.4 → package/dist/.
Les deux bibliothèques sont écrites DANS la page (rien à charger) ; seule la vue 3D charge three.js r128 quand on la touche.
"""
import base64, json, os, re, sys

base, formes, dpol, fclip, fopen, out = sys.argv[1:7]
os.makedirs(out, exist_ok=True)

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Fleur à prénom</title>", tete, count=1, flags=re.S)
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · fleur à prénom, d'après le générateur « Flower » d'Atomm. Rien n'est en ligne, rien n'est vendu.\2", tete, count=1, flags=re.S)
fil = re.search(r"<nav class=\"container\".*?</nav>", s[i_main:j_main], flags=re.S)
fil = fil.group(0) if fil else ""
logo = re.search(r'<div class="sc-mur"[^>]*><img src="([^"]+)"', s)
LOGO = logo.group(1) if logo else ""

F = json.load(open(formes, encoding="utf-8"))
# [id, nom, fichier] : Pacifico et Lobster sont aussi dans l'outil d'Atomm ; ses sept autres écritures ne sont pas libres.
POL = [["pacifico", "Pacifico", "Pacifico-Regular.ttf"], ["lobster", "Lobster", "Lobster-Regular.ttf"], ["leckerli", "Leckerli One", "LeckerliOne-Regular.ttf"],
       ["oleo", "Oleo Script", "OleoScript-Bold.ttf"], ["lobster2", "Lobster Two", "LobsterTwo-Bold.ttf"], ["pattaya", "Pattaya", "Pattaya-Regular.ttf"],
       ["berkshire", "Berkshire Swash", "BerkshireSwash-Regular.ttf"], ["courgette", "Courgette", "Courgette-Regular.ttf"],
       ["lily", "Lily Script One", "LilyScriptOne-Regular.ttf"], ["sriracha", "Sriracha", "Sriracha-Regular.ttf"]]
pol, faces = [], ""
for pid, nom, fich in POL:
    b = base64.b64encode(open(os.path.join(dpol, fich), "rb").read()).decode()
    pol.append({"id": pid, "nom": nom, "b": b})
    faces += "@font-face{font-family:'fl-%s';src:url(data:font/ttf;base64,%s) format('truetype');font-display:block}\n" % (pid, b)

# Couleurs du fond (proposées) : [id, nom, teinte, supplément]
FONDS = [["bois", "Bois naturel", "#ecd5ad", 0], ["noir", "Noir", "#2b2622", 4], ["blanc", "Blanc", "#f7f4ee", 4], ["rouge", "Rouge", "#a8322d", 4],
         ["rose", "Rose poudré", "#e3b3b0", 4], ["vert", "Vert sauge", "#93a487", 4]]

DONNEES = json.dumps({
    "fleurs": F["fleurs"], "feuilles": F["feuilles"], "pol": pol, "fonds": FONDS, "logo": LOGO,
    "long": 180, "fin": 0.8, "maxi": 1.3, "lettres": 14, "prix": 16.9,
    "mois": ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]},
    ensure_ascii=False, separators=(",", ":"))

CSS = faces + r"""
.fl-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media (min-width:900px){.fl-grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
.fl-carte{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);
cursor:pointer;font:inherit;color:var(--ink);text-align:center;min-width:0}
.fl-carte svg{display:block;width:100%;height:70px}
.fl-carte b{font-size:.72rem;line-height:1.15;font-weight:600;overflow-wrap:anywhere}
.fl-carte small{font-size:.66rem;color:var(--ink-soft);line-height:1.1}
.fl-carte.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.fl-plus{display:block;width:100%;margin-top:8px;min-height:44px;border:1.5px dashed var(--line);border-radius:12px;background:transparent;font:inherit;font-weight:600;font-size:.86rem;color:var(--ink);cursor:pointer}
.fl-nom{display:block;width:100%;box-sizing:border-box;min-height:48px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:1.05rem;background:#fff;color:var(--ink)}
.fl-nom:focus{outline:2px solid var(--gold);outline-offset:1px}
.fl-pols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.fl-pol{min-height:56px;padding:6px 10px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;color:var(--ink);font-size:1.3rem;line-height:1.2;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fl-pol small{display:block;font:500 .68rem Inter,system-ui,sans-serif;color:var(--ink-soft)}
.fl-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.fl-regl{display:grid;gap:14px}
.fl-regl label{display:block}
.fl-regl .tete{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-weight:600;font-size:.9rem}
.fl-regl .tete output{font-weight:600;color:#7c6120;font-size:.84rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.fl-regl input[type=range]{display:block;width:100%;margin:6px 0 0;min-height:34px;accent-color:#a98935}
.fl-fins{margin-top:12px;border:1px solid var(--line);border-radius:12px;background:#fff}
.fl-fins>summary{cursor:pointer;padding:12px 14px;font-weight:600;font-size:.88rem;list-style:none;display:flex;justify-content:space-between;gap:10px;min-height:20px}
.fl-fins>summary::-webkit-details-marker{display:none}
.fl-fins>summary::after{content:"▾";color:var(--ink-soft)}
.fl-fins[open]>summary::after{content:"▴"}
.fl-fins>div{padding:2px 14px 14px}
.fl-outils{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.fl-outils button{min-width:44px;min-height:44px;padding:0 12px;border:1.5px solid var(--line);border-radius:10px;background:#fff;font:inherit;font-weight:600;font-size:.9rem;cursor:pointer;color:var(--ink)}
.fl-fonds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.fl-fond{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);min-width:0}
.fl-fond i{display:block;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.25)}
.fl-fond b{font-size:.74rem;font-weight:600;line-height:1.15;text-align:center}
.fl-fond small{font-size:.68rem;color:var(--ink-soft)}
.fl-fond.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.fl-dim{position:absolute;left:10px;bottom:10px;z-index:3;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink)}
.fl-dim.trop{color:#b4452f;border-color:#b4452f}
.fl-stage svg{min-height:200px}
.fl-stage .saisie{cursor:grab;touch-action:none}
.fl-feuilles{display:grid;gap:14px}
.fl-feuilles h4{margin:0 0 6px;font:600 .92rem Inter,system-ui,sans-serif}
.fl-feuilles .al{color:#b4452f;font-size:.82rem;font-weight:600;margin:6px 0 0}
.fl-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.fl-chips button{font:inherit;font-weight:600;font-size:.8rem;min-height:38px;padding:0 13px;border-radius:999px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}
.fl-chips button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
"""

MAIN = r"""<main>
__FIL__
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage fl-stage" id="stage" data-vue="creation"><span class="sc-tag">Votre fleur, en direct</span>
   <div class="sc-vue" role="group" aria-label="Vue"><button type="button" class="on" id="vFace">De face</button><button type="button" id="v3d">3D</button></div>
   <svg id="scene" viewBox="0 0 200 90" role="img" aria-label="Aperçu de votre fleur à prénom"></svg>
   <canvas class="sc-3d" id="c3d"></canvas>
   <p class="ab-charge" id="chargement" hidden>L'aperçu n'a pas pu se charger.</p>
   <span class="fl-dim" id="dim"></span></div>
  <p class="sc-aide" id="aide"></p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Maison &amp; Déco</a></div>
  <div class="pd-titrerow"><h1>Fleur à prénom en bois, une fleur qui ne fane pas</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">Choisissez la fleur, écrivez un prénom : il est découpé sur la tige. La fleur est en relief sur son fond, collée dans notre atelier.</p>
  <div class="price-lead" id="prixtete"></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre fleur</p><p class="prc-sub">Six petites étapes. La fleur se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">1</span><h3>Le prénom</h3></div>
  <p class="prc-legend">Il est découpé sur la tige, dans l'écriture que vous choisirez.</p>
  <input class="fl-nom" id="nom" maxlength="14" autocomplete="off" placeholder="Prénom" aria-label="Le prénom">
  <p class="prc-hint" id="infoNom"></p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">2</span><h3>La fleur</h3></div>
  <div class="fl-chips" id="filtres"></div>
  <div class="fl-grille" id="fleurs"></div>
  <button type="button" class="fl-plus" id="plusFleurs" hidden></button>
  <details class="fl-fins"><summary>Placer la fleur moi-même</summary><div>
   <p class="prc-hint" style="margin:0 0 10px">La fleur est déjà posée au bout de la tige. Vous pouvez la glisser sur l'aperçu, la tourner ou changer sa taille ; elle doit toucher la tige.</p>
   <div class="fl-outils">
    <button type="button" data-fl="rot,-15" aria-label="Tourner à gauche">↺</button><button type="button" data-fl="rot,15" aria-label="Tourner à droite">↻</button>
    <button type="button" data-fl="ech,-5" aria-label="Plus petite">−</button><button type="button" data-fl="ech,5" aria-label="Plus grande">+</button>
    <button type="button" data-fl="x,-6" aria-label="Vers la gauche">←</button><button type="button" data-fl="x,6" aria-label="Vers la droite">→</button>
    <button type="button" data-fl="y,-6" aria-label="Vers le haut">↑</button><button type="button" data-fl="y,6" aria-label="Vers le bas">↓</button>
    <button type="button" data-fl="zero,0">Place d'origine</button>
   </div>
   <p class="prc-hint" id="infoFleur" style="margin:0"></p>
  </div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>Les feuilles</h3></div>
  <div class="fl-grille" id="feuillages"></div>
  <details class="fl-fins" id="finsFeuilles"><summary>Taille et place des feuilles</summary><div class="fl-regl">
   <label><span class="tete"><span>Taille de la feuille du haut</span><output id="o-th"></output></span><input type="range" id="r-th" min="20" max="400" step="2"></label>
   <label><span class="tete"><span>Place de la feuille du haut</span><output id="o-xh"></output></span><input type="range" id="r-xh" min="-200" max="200" step="2"></label>
   <label><span class="tete"><span>Taille de la feuille du bas</span><output id="o-tb"></output></span><input type="range" id="r-tb" min="20" max="400" step="2"></label>
   <label><span class="tete"><span>Place de la feuille du bas</span><output id="o-xb"></output></span><input type="range" id="r-xb" min="-200" max="200" step="2"></label>
  </div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>L'écriture</h3></div>
  <div class="fl-pols" id="pols"></div>
  <button type="button" class="fl-plus" id="plusPols" hidden></button>
  <p class="prc-hint prc-miss" id="manqueLettre" style="margin:8px 0 0"></p>
  <details class="fl-fins"><summary>Régler le prénom</summary><div class="fl-regl">
   <label><span class="tete"><span>Taille du prénom</span><output id="o-tt"></output></span><input type="range" id="r-tt" min="24" max="200" step="1"></label>
   <label><span class="tete"><span>Contour autour des lettres</span><output id="o-tc"></output></span><input type="range" id="r-tc" min="0" max="40" step="1"></label>
   <label><span class="tete"><span>Espace entre les lettres</span><output id="o-te"></output></span><input type="range" id="r-te" min="-10" max="30" step="1"></label>
   <label><span class="tete"><span>Écart à gauche (côté fleur)</span><output id="o-tg"></output></span><input type="range" id="r-tg" min="-50" max="50" step="1"></label>
   <label><span class="tete"><span>Écart à droite</span><output id="o-td"></output></span><input type="range" id="r-td" min="-50" max="50" step="1"></label>
   <label><span class="tete"><span>Plus haut ou plus bas</span><output id="o-ty"></output></span><input type="range" id="r-ty" min="-50" max="50" step="1"></label>
  </div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>La tige</h3></div>
  <div class="fl-regl">
   <label><span class="tete"><span>Entre la fleur et le prénom</span><output id="o-t1"></output></span><input type="range" id="r-t1" min="100" max="400" step="2"></label>
   <label><span class="tete"><span>Après le prénom</span><output id="o-t2"></output></span><input type="range" id="r-t2" min="0" max="400" step="5"></label>
   <label><span class="tete"><span>Épaisseur de la tige</span><output id="o-tw"></output></span><input type="range" id="r-tw" min="8" max="40" step="1"></label>
  </div>
  <p class="prc-hint" id="infoTige"></p>
 </section>
 <section class="prc-step" id="etape6">
  <div class="prc-sh"><span class="prc-num done">6</span><h3>La couleur du fond</h3></div>
  <p class="prc-legend">Le dessus (la fleur, la tige, le prénom) reste en bois naturel. Le fond, dessous, peut être peint à la main.</p>
  <div class="fl-fonds" id="fonds"></div>
  <div class="prc-sum" id="resume" style="margin-top:14px"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
 </div>
</div></div>

<section class="sc-atelier"><div class="container">
 <h2>De votre côté : deux couches à découper, puis à coller</h2>
 <p>À la commande, le site range dans le dossier de la commande la planche à la taille réelle. Elle change en direct quand vous modifiez la fleur au-dessus.</p>
 <div class="sc-agrid">
  <div class="fl-feuilles" id="planches"></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li></ul>
   <ul class="sc-points">
    <li><b>Les fleurs du générateur d'Atomm</b>Ses 26 fleurs (dont les 12 fleurs de naissance, une par mois) et ses 8 feuillages, à la même place et avec la même règle de calcul.</li>
    <li><b>Deux couches</b>1. Le fond : la silhouette pleine de toute la pièce. 2. Le dessus : la fleur en traits, la tige, les feuilles et le contour du prénom, les lettres évidées.</li>
    <li><b>L'ordre du travail</b>Découper les deux couches, peindre le fond si la cliente l'a demandé, coller le dessus sur le fond. Les petits morceaux (l'intérieur de certaines lettres) se collent à leur place sur le fond.</li>
    <li><b>Toujours 18 cm</b>Votre machine grave 20 × 20 cm : la pièce est ramenée à 18 cm de long. Le reste suit le prénom et la tige choisie.</li>
    <li><b>Jamais trop fin</b>Si un prénom long rapetisse trop la fleur, le prénom et le bout de tige se réduisent tout seuls. Si les traits de la fleur restent sous 0,8 mm, la commande est bloquée et l'outil dit quoi changer.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Longueur : 18 cm, comme l'arbre de vie. Chez Atomm la pièce fait 38 cm au départ, trop grand pour votre machine en un seul morceau.</li>
  <li>Prix proposés par moi : 16,90 € en bois naturel, + 4 € si le fond est peint à la main (même supplément que la décoration à prénom).</li>
  <li>Les couleurs du fond sont une proposition. Atomm ne fait que montrer des matières (contreplaqué, MDF, acrylique) et conseille de peindre.</li>
  <li>Écritures : Pacifico et Lobster sont celles d'Atomm ; ses sept autres ne sont pas libres de droits, je les ai remplacées par huit écritures libres du même genre.</li>
  <li>Tous les réglages d'Atomm sont là, rangés dans des volets fermés pour ne pas charger la page. Vous pouvez en retirer.</li>
  <li>Non repris : la fleur inventée par l'intelligence artificielle d'Atomm (il faut un compte chez eux).</li>
 </ul></div>
</div></section>
</main>"""

JS = r"""
(function(){
var D=__DONNEES__,$=function(i){return document.getElementById(i)},CL=window.ClipperLib,E=100,K=25.4/72,AXE=200,X0=400;
var S={nom:'Camille',fleur:'f08',fx:0,fy:0,frot:0,fech:100,feu:'l1',th:97,xh:-23,tb:104,xb:1,pol:'pacifico',tt:100,tc:8,te:0,tg:-9,td:-13,ty:0,t1:120,t2:60,tw:17,fond:'bois',
 filtre:'tout',toutF:false,toutP:false,vue:'face'};
var OK=!!(CL&&window.opentype),POLICES={},G=null;
function fr(v,d){return (Math.round(v*Math.pow(10,d==null?1:d))/Math.pow(10,d==null?1:d)).toString().replace('.',',')}
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
function ech(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function fleur(){return D.fleurs.filter(function(f){return f.id===S.fleur})[0]}
function feuillage(){return D.feuilles.filter(function(f){return f.id===S.feu})[0]}
function fond(){return D.fonds.filter(function(f){return f[0]===S.fond})[0]}

/* ---- géométrie : tout est en centièmes d'unité (1 unité = 1/72 de pouce, comme Atomm) ---- */
function pts(a,kx,ky,cx,cy,rot){var o=[],c=Math.cos(rot||0),s=Math.sin(rot||0);
 for(var i=0;i<a.length;i+=2){var x=a[i]*kx,y=a[i+1]*ky;o.push({X:Math.round((cx+x*c-y*s)*E),Y:Math.round((cy+x*s+y*c)*E)})}return o}
function rect(x,y,w,h){return [{X:Math.round(x*E),Y:Math.round(y*E)},{X:Math.round((x+w)*E),Y:Math.round(y*E)},{X:Math.round((x+w)*E),Y:Math.round((y+h)*E)},{X:Math.round(x*E),Y:Math.round((y+h)*E)}]}
function tigeArrondie(x,y,w,h){var r=h/2,o=[{X:Math.round(x*E),Y:Math.round(y*E)}],n=10;
 for(var i=0;i<=n;i++){var a=-Math.PI/2+Math.PI*i/n;o.push({X:Math.round((x+Math.max(0,w-r)+r*Math.cos(a))*E),Y:Math.round((y+r+r*Math.sin(a))*E)})}
 o.push({X:Math.round(x*E),Y:Math.round((y+h)*E)});return o}
function droit(p){if(!CL.Clipper.Orientation(p))p.reverse();return p}
function sens(liste){ /* remet « plein = sens positif » : le premier anneau d'une forme est toujours un plein */
 if(liste.length&&!CL.Clipper.Orientation(liste[0]))liste.forEach(function(p){p.reverse()});return liste}
function unir(a,b,type){var c=new CL.Clipper(),r=[];c.AddPaths(a,CL.PolyType.ptSubject,true);if(b)c.AddPaths(b,CL.PolyType.ptClip,true);
 c.Execute(type||CL.ClipType.ctUnion,r,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);return r}
function grossir(a,d){var co=new CL.ClipperOffset(4,25),r=[];co.AddPaths(a,CL.JoinType.jtMiter,CL.EndType.etClosedPolygon);co.Execute(r,d*E);return r}
function boite(a){var x0=1e12,y0=1e12,x1=-1e12,y1=-1e12;a.forEach(function(p){p.forEach(function(q){if(q.X<x0)x0=q.X;if(q.X>x1)x1=q.X;if(q.Y<y0)y0=q.Y;if(q.Y>y1)y1=q.Y})});
 return a.length?[x0/E,y0/E,(x1-x0)/E,(y1-y0)/E]:[0,0,0,0]}
function pleins(a){return a.filter(function(p){return CL.Clipper.Orientation(p)})}

function police(id){if(POLICES[id])return POLICES[id];var p=D.pol.filter(function(q){return q.id===id})[0],bin=atob(p.b),buf=new Uint8Array(bin.length);
 for(var i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);return POLICES[id]=window.opentype.parse(buf.buffer)}
function courbe(o,x0,y0,c){var n,i,t,u;
 if(c.type==='Q'){n=7;for(i=1;i<=n;i++){t=i/n;u=1-t;o.push([u*u*x0+2*u*t*c.x1+t*t*c.x,u*u*y0+2*u*t*c.y1+t*t*c.y])}}
 else{n=10;for(i=1;i<=n;i++){t=i/n;u=1-t;o.push([u*u*u*x0+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,u*u*u*y0+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y])}}}
/* le prénom en anneaux, ligne de base en y = 0, encre calée à gauche sur x = 0 */
function prenom(q){var txt=S.nom.trim();if(!txt)return null;var tt=S.tt*q,f=police(S.pol),gl=f.stringToGlyphs(txt),x=0,k=tt/f.unitsPerEm,brut=[],manque=[];
 gl.forEach(function(g,i){if(g.index===0&&txt[i]!==' ')manque.push(txt[i]);
  var cur=null,px=0,py=0;g.getPath(x,0,tt).commands.forEach(function(c){
   if(c.type==='M'){if(cur&&cur.length>2)brut.push(cur);cur=[[c.x,c.y]];px=c.x;py=c.y}
   else if(c.type==='L'){cur.push([c.x,c.y]);px=c.x;py=c.y}
   else if(c.type==='Q'||c.type==='C'){courbe(cur,px,py,c);px=c.x;py=c.y}
   else if(c.type==='Z'){if(cur&&cur.length>2)brut.push(cur);cur=null}});
  if(cur&&cur.length>2)brut.push(cur);
  x+=g.advanceWidth*k+(gl[i+1]?f.getKerningValue(g,gl[i+1])*k:0)+S.te/100*tt});
 if(!brut.length)return {vide:true,manque:manque};
 var x0=1e9;brut.forEach(function(r){r.forEach(function(q){if(q[0]<x0)x0=q[0]})});
 var xh=(f.tables.os2&&f.tables.os2.sxHeight)||0;if(!xh){var bx=f.charToGlyph('x').getBoundingBox();xh=bx.y2}
 return {brut:brut,x0:x0,xh:xh*k,manque:manque}}

/* q réduit le prénom et le bout de tige (1 = comme choisi) ; contour = largeur du contour des lettres */
function batir(q,contour){
 var a=S.tw,f=X0+S.t1,p=X0+S.t1/2,fl=fleur(),fe=feuillage(),P=prenom(q),parts=[],zones={};
 var st1=droit(rect(X0,AXE-a/2,S.t1,a));parts.push(st1);
 /* le prénom : sa mi-hauteur des minuscules sur l'axe de la tige */
 var T=null,finTexte=f-2;
 if(P&&!P.vide){var dx=f+S.tg-P.x0,dy=AXE+P.xh/2+S.ty;
  T=unir(P.brut.map(function(r){return r.map(function(q){return {X:Math.round((q[0]+dx)*E),Y:Math.round((q[1]+dy)*E)}})}));
  var bt=boite(T);finTexte=bt[0]+bt[2]+S.td;zones.texte=bt}
 if(T)parts.push(droit(rect(f-2,AXE-a/2,finTexte-f+4,a))); /* la tige passe sous le prénom : un prénom en deux mots tient en un morceau */
 if(S.t2>0){var st2=droit(tigeArrondie(finTexte,AXE-a/2,S.t2*q,a));parts.push(st2);zones.queue=boite([st2])}
 if(!fe.vide){var gh=S.th/fe.ah,gb=S.tb/fe.ab;
  var fh=sens(fe.haut.map(function(r){return pts(r,S.th/10000,S.th/10000,p+S.xh,AXE-gh/2)}));
  var fb=sens(fe.bas.map(function(r){return pts(r,S.tb/10000,S.tb/10000,p+S.xb,AXE+gb/2)}));
  parts=parts.concat(fh,fb);zones.feuilleH=boite(fh);zones.feuilleB=boite(fb)}
 var haut;
 if(T){var bande=contour>0?grossir(T,contour):T;haut=unir(unir(parts.concat(bande)),T,CL.ClipType.ctDifference)}else haut=unir(parts);
 var e=S.fech/100,FL=sens(fl.a.map(function(r){return pts(r,e/10,e/10,fl.x+S.fx,fl.y+S.fy,S.frot*Math.PI/180)}));
 zones.fleur=boite(FL);
 var avant=unir(pleins(haut)).length;
 haut=unir(haut.concat(FL));
 var plaque=unir(pleins(haut)),b=boite(plaque);
 /* un seul morceau ? sinon, on dit quelle partie ne touche plus */
 var detache=plaque.length>avant?'fleur':'';
 if(!detache&&plaque.length>1){var gros=0,am=0;plaque.forEach(function(q,i){var ar=Math.abs(CL.Clipper.Area(q));if(ar>am){am=ar;gros=i}});
  plaque.forEach(function(q,i){if(i===gros||detache)return;var bb=boite([q]),cx=bb[0]+bb[2]/2,cy=bb[1]+bb[3]/2;
   ['fleur','feuilleH','feuilleB','texte','queue'].forEach(function(z){var r=zones[z];if(!detache&&r&&cx>=r[0]-1&&cx<=r[0]+r[2]+1&&cy>=r[1]-1&&cy<=r[1]+r[3]+1)detache=z})
   if(!detache)detache='autre'})}
 var L=b[2],s=L>0?D.long/(L*K):1;if(s>D.maxi)s=D.maxi;var fin=fl.trait*e*s*K;
 return {haut:haut,plaque:plaque,b:b,s:s,k:s*K,fin:fin,trop:fin<D.fin,detache:detache,morceaux:pleins(haut).length-plaque.length,zones:zones,
  manque:P?P.manque:[],lmm:L*s*K,hmm:b[3]*s*K,q:q,contour:contour}}
function construire(){if(!OK)return null;var g=batir(1,S.tc),c=S.tc;
 /* un signe à part (apostrophe, point) : le contour s'élargit tout seul jusqu'à ce que tout tienne */
 while(g.detache==='texte'&&c<40){c=Math.min(40,c+4);g=batir(1,c)}
 /* traits trop fins : le prénom et le bout de tige se réduisent tout seuls, jusqu'à 40 % */
 if(g.trop&&!g.detache){var bas=batir(.4,c);if(bas.trop)g=bas;else{var lo=.4,hi=1,ok=bas;for(var i=0;i<4;i++){var m=(lo+hi)/2,t=batir(m,c);if(t.trop)hi=m;else{lo=m;ok=t}}g=ok}}
 return G=g}

function chemin(a,k,ox,oy){var d='';a.forEach(function(p){for(var i=0;i<p.length;i++)d+=(i?'L':'M')+((p[i].X/E-ox)*k).toFixed(2)+' '+((p[i].Y/E-oy)*k).toFixed(2);d+='Z'});return d}

/* ---- l'aperçu ---- */
function dessiner(){var g=construire();if(!g){$('chargement').hidden=false;return}
 var k=g.k,b=g.b,M=7,W=b[2]*k+2*M,H=Math.max(b[3]*k+2*M,58),oy=b[1]-(H-2*M-b[3]*k)/2/k,fd=fond();
 var dp=chemin(g.plaque,k,b[0],oy),dh=chemin(g.haut,k,b[0],oy),sombre=S.fond==='noir';
 $('scene').setAttribute('viewBox',(-M)+' '+(-M)+' '+W.toFixed(1)+' '+H.toFixed(1));
 $('scene').innerHTML='<defs><filter id="omb" x="-5%" y="-20%" width="110%" height="140%"><feDropShadow dx=".5" dy="1.1" stdDeviation=".8" flood-color="#3c2814" flood-opacity=".38"/></filter>'
  +'<linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cda06a"/><stop offset="1" stop-color="#b98a54"/></linearGradient></defs>'
  +'<g filter="url(#omb)"><path d="'+dp+'" fill="'+fd[2]+'" stroke="'+(sombre?'#000':'rgba(90,60,25,.55)')+'" stroke-width=".25"/></g>'
  +'<path d="'+dh+'" fill="url(#bois)" fill-rule="evenodd" stroke="#8a6234" stroke-width=".22" style="filter:drop-shadow(.35px .6px .35px rgba(40,25,10,.45))"/>'
  +'<rect class="saisie" id="saisie" x="'+((g.zones.fleur[0]-b[0])*k).toFixed(1)+'" y="'+((g.zones.fleur[1]-oy)*k).toFixed(1)+'" width="'+(g.zones.fleur[2]*k).toFixed(1)+'" height="'+(g.zones.fleur[3]*k).toFixed(1)+'" fill="transparent"/>';
 G.vue={k:k,ox:b[0],oy:oy};
 $('dim').textContent='≈ '+fr(g.lmm/10)+' × '+fr(g.hmm/10)+' cm';$('dim').className='fl-dim'+(g.trop?' trop':'');
 $('aide').textContent=g.detache?message(g.detache):g.q<1&&!g.trop?'Le prénom a été réduit tout seul pour que les traits de la fleur restent assez épais.':g.contour>S.tc?'Le contour des lettres a été élargi tout seul pour que le prénom reste bien solide.':'La fleur, la tige et le prénom sont en relief sur leur fond, collés dans notre atelier.';
 reglages();resume();planches();if(S.vue==='3d')trois()}
function message(z){return {fleur:'La fleur ne touche plus la tige : rapprochez-la, ou touchez « Place d\'origine ».',feuilleH:'La feuille du haut ne touche plus la tige : ramenez-la vers le milieu.',
 feuilleB:'La feuille du bas ne touche plus la tige : ramenez-la vers le milieu.',texte:'Le prénom ne touche plus la tige : réduisez l\'écart à gauche, ou agrandissez le contour.',
 queue:'Le bout de la tige ne touche plus le prénom : réduisez l\'écart à droite.',autre:'Une partie de la fleur est détachée du reste : choisissez une autre place ou une autre taille.'}[z]}

/* ---- étape 2 : les fleurs ---- */
function vignetteFleur(f){var k=60/Math.max(f.w,f.h)/10,d='';f.a.forEach(function(r){for(var i=0;i<r.length;i+=2)d+=(i?'L':'M')+(r[i]*k).toFixed(1)+' '+(r[i+1]*k).toFixed(1);d+='Z'});
 return '<svg viewBox="-34 -34 68 68" aria-hidden="true"><path d="'+d+'" fill="#a9793f" fill-rule="evenodd"/></svg>'}
function majFleurs(){var liste=D.fleurs.filter(function(f){return S.filtre==='tout'||(S.filtre==='mois'?f.mois>0:f.mois===0)}),VUES=window.innerWidth>=900?8:9,voir=S.toutF?liste:liste.slice(0,VUES);
 if(!S.toutF&&voir.every(function(f){return f.id!==S.fleur})){var c=liste.filter(function(f){return f.id===S.fleur})[0];if(c)voir[VUES-1]=c}
 $('filtres').innerHTML=[['tout','Toutes'],['mois','Fleurs de naissance'],['autres','Autres fleurs']].map(function(c){return '<button type="button" data-f="'+c[0]+'" class="'+(S.filtre===c[0]?'on':'')+'">'+c[1]+'</button>'}).join('');
 $('fleurs').innerHTML=voir.map(function(f){return '<button type="button" class="fl-carte'+(f.id===S.fleur?' on':'')+'" data-id="'+f.id+'" aria-pressed="'+(f.id===S.fleur)+'">'+vignetteFleur(f)+'<b>'+f.nom+'</b>'+(f.mois?'<small>'+D.mois[f.mois]+'</small>':'')+'</button>'}).join('');
 var reste=liste.length-voir.length;$('plusFleurs').hidden=S.toutF||reste<=0;$('plusFleurs').textContent='Voir les '+reste+' autres fleurs'}
/* ---- étape 3 : les feuilles ---- */
function vignetteFeuille(fe){var d='M-30 -1.5H30V1.5H-30Z';if(!fe.vide){[['haut',fe.th,fe.xh,fe.ah,-1],['bas',fe.tb,fe.xb,fe.ab,1]].forEach(function(q){var k=q[1]/10000*.3,cx=q[2]*.3,cy=q[4]*q[1]/q[3]/2*.3;
  fe[q[0]].forEach(function(r){for(var i=0;i<r.length;i+=2)d+=(i?'L':'M')+(cx+r[i]*k).toFixed(1)+' '+(cy+r[i+1]*k).toFixed(1);d+='Z'})})}
 return '<svg viewBox="-34 -34 68 68" aria-hidden="true"><path d="'+d+'" fill="#a9793f" fill-rule="evenodd"/></svg>'}
function majFeuilles(){$('feuillages').innerHTML=D.feuilles.map(function(fe,i){return '<button type="button" class="fl-carte'+(fe.id===S.feu?' on':'')+'" data-id="'+fe.id+'" aria-pressed="'+(fe.id===S.feu)+'">'+vignetteFeuille(fe)+'<b>'+(fe.vide?'Sans feuille':'Feuilles '+(i+1))+'</b></button>'}).join('');
 $('finsFeuilles').hidden=feuillage().vide}
/* ---- étape 4 : les écritures (chacune écrit le prénom tapé) ---- */
function majPols(){var VUES=6,voir=S.toutP?D.pol:D.pol.slice(0,VUES),mot=S.nom.trim()||'Prénom';
 if(!S.toutP&&voir.every(function(p){return p.id!==S.pol}))voir[VUES-1]=D.pol.filter(function(p){return p.id===S.pol})[0];
 $('pols').innerHTML=voir.map(function(p){return '<button type="button" class="fl-pol'+(p.id===S.pol?' on':'')+'" data-id="'+p.id+'" aria-pressed="'+(p.id===S.pol)+'" style="font-family:\'fl-'+p.id+'\',cursive">'+ech(mot)+'<small>'+p.nom+'</small></button>'}).join('');
 var reste=D.pol.length-voir.length;$('plusPols').hidden=S.toutP||reste<=0;$('plusPols').textContent='Voir les '+reste+' autres écritures'}
/* ---- les curseurs ---- */
var CURS=['th','xh','tb','xb','tt','tc','te','tg','td','ty','t1','t2','tw'];
function reglages(){var k=G?G.k:K;CURS.forEach(function(c){var r=$('r-'+c),o=$('o-'+c);if(document.activeElement!==r)r.value=S[c];
  o.textContent=c==='tt'?fr(S.tt*G.q*k)+' mm':c==='t2'?fr(S.t2*G.q*k)+' mm':c==='tc'?fr(G.contour*k)+' mm':c==='te'?(S.te>0?'+':'')+S.te+' %':(c==='xh'||c==='xb'||c==='tg'||c==='td'||c==='ty')?(S[c]>0?'+':'')+fr(S[c]*k)+' mm':fr(S[c]*k)+' mm'});
 $('infoTige').textContent=G?'La fleur mesure '+fr(G.zones.fleur[2]*k/10)+' cm de large, la tige '+fr(S.tw*k)+' mm d\'épaisseur, les traits les plus fins '+fr(G.fin)+' mm.':'';
 $('infoFleur').textContent=(S.frot?'Tournée de '+S.frot+'°. ':'')+(S.fech!==100?'Taille de la fleur : '+S.fech+' %.':'')}
/* ---- étape 6 : fond, résumé, total ---- */
function majFonds(){$('fonds').innerHTML=D.fonds.map(function(f){return '<button type="button" class="fl-fond'+(f[0]===S.fond?' on':'')+'" data-id="'+f[0]+'" aria-pressed="'+(f[0]===S.fond)+'"><i style="background:'+f[2]+'"></i><b>'+f[1]+'</b><small>'+(f[3]?'peint · + '+f[3]+' €':'compris')+'</small></button>'}).join('')}
function total(){return D.prix+fond()[3]}
function resume(){var g=G,fl=fleur(),fe=feuillage(),p=D.pol.filter(function(q){return q.id===S.pol})[0],fd=fond(),nom=S.nom.trim();
 var l=[['Prénom',nom?ech(nom):'Sans prénom'],['Fleur',fl.nom+(fl.mois?' ('+D.mois[fl.mois]+')':'')],['Feuilles',fe.vide?'Sans feuille':'Feuilles '+(D.feuilles.indexOf(fe)+1)]];
 if(nom)l.push(['Écriture',p.nom]);l.push(['Fond',fd[1]+(fd[3]?' (peint à la main, + '+fd[3]+' €)':'')]);
 l.push(['Taille','≈ '+fr(g.lmm/10)+' × '+fr(g.hmm/10)+' cm, 6 mm d\'épaisseur']);
 $('resume').innerHTML=l.map(function(r){return '<div class="prc-sumrow"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
 $('total').textContent=eur(total());$('prixtete').innerHTML='<span class="price">'+eur(D.prix)+'</span> <span style="color:var(--ink-soft);font-size:.9rem">en bois naturel</span>';
 var m=g.manque.length?'Cette écriture n\'a pas '+(g.manque.length>1?'les caractères':'le caractère')+' « '+ech(g.manque.join(' '))+' » : choisissez-en une autre ou changez le prénom.':'';
 $('manqueLettre').textContent=m;
 var pourquoi=g.detache?message(g.detache):g.trop?'À cette taille, les traits de cette fleur seraient trop fins (moins de 0,8 mm). Agrandissez la fleur, raccourcissez la tige, ou choisissez une autre fleur.':m;
 $('manque').textContent=pourquoi;$('ajouter').disabled=!!pourquoi;
 $('infoNom').textContent=nom?(S.nom.length+' / '+D.lettres+' lettres'):'Laissez vide pour une fleur sans prénom.'}
/* ---- la planche de l'atelier, à la taille réelle : le fond au-dessus, le dessus dessous ---- */
function planches(){var g=G,k=g.k,b=g.b,L=b[2]*k,H=b[3]*k,Ec=6,rouge=' fill="none" stroke="#d32f2f" stroke-width=".3"',une=2*H+Ec<=200;
 var P=[{n:1,nom:'le fond (silhouette pleine)'+(S.fond!=='bois'?', à peindre en '+fond()[1].toLowerCase():''),d:chemin(g.plaque,k,b[0],b[1])},
        {n:2,nom:'le dessus, à coller sur le fond'+(g.morceaux>0?' + '+g.morceaux+' petit'+(g.morceaux>1?'s':'')+' morceau'+(g.morceaux>1?'x':'')+' à recoller':''),d:chemin(g.haut,k,b[0],b[1])}];
 var pages=une?[P]:[[P[0]],[P[1]]],out='';
 pages.forEach(function(pg,i){var y=0,h='',noms=[];pg.forEach(function(p){h+='<g transform="translate(0 '+y.toFixed(1)+')"><path d="'+p.d+'"'+rouge+'/></g>'
   +'<g transform="translate('+(L+7).toFixed(1)+' '+(y+H/2).toFixed(1)+')"><circle r="3.4" fill="#1a1206"/><text text-anchor="middle" dominant-baseline="central" font-size="3.8" font-weight="700" fill="#fff" font-family="sans-serif">'+p.n+'</text></g>';
   noms.push(p.n+' '+p.nom);y+=H+Ec});
  var HH=y-Ec;out+='<div class="sc-feuille"><h4>Contreplaqué 3 mm'+(pages.length>1?' · planche '+(i+1)+' sur 2':'')+' · '+fr(L)+' × '+fr(HH)+' mm</h4>'
   +'<svg viewBox="-4 -4 '+(L+18).toFixed(1)+' '+(HH+8).toFixed(1)+'" role="img" aria-label="Planche de découpe">'+h+'</svg><p class="sc-fnom">'+noms.join(' · ')+'</p>'
   +(L>200||HH>200?'<p class="al">Cette planche dépasse 200 × 200 mm.</p>':'')+'<p class="sc-fnom">Traits les plus fins de la fleur : environ '+fr(g.fin)+' mm.</p>'+(g.trop?'<p class="al">Trop fin : la commande est bloquée.</p>':'')+'</div>'});
 $('planches').innerHTML=out}

/* ---- la vue 3D (three.js, chargé seulement quand on la touche) ---- */
var T3=null;
function charger3(suite){if(window.THREE)return suite();var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 sc.onload=suite;sc.onerror=function(){$('aide').textContent='La vue 3D n\'a pas pu se charger.';vue('face')};document.head.appendChild(sc)}
function exPolys(a){var c=new CL.Clipper(),t=new CL.PolyTree();c.AddPaths(a,CL.PolyType.ptSubject,true);c.Execute(CL.ClipType.ctUnion,t,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);return CL.JS.PolyTreeToExPolygons(t)}
function couche(a,z,ep,coul){var TH=window.THREE,g=G,k=g.k,cx=g.b[0]+g.b[2]/2,cy=g.b[1]+g.b[3]/2,grp=new TH.Group(),mat=new TH.MeshStandardMaterial({color:coul,roughness:.78,metalness:.02});
 exPolys(a).forEach(function(ex){var sh=new TH.Shape(ex.outer.map(function(q){return new TH.Vector2((q.X/E-cx)*k,-(q.Y/E-cy)*k)}));
  ex.holes.forEach(function(h){sh.holes.push(new TH.Path(h.map(function(q){return new TH.Vector2((q.X/E-cx)*k,-(q.Y/E-cy)*k)})))});
  var m=new TH.Mesh(new TH.ExtrudeGeometry(sh,{depth:ep,bevelEnabled:false,curveSegments:1}),mat);m.position.z=z;grp.add(m)});return grp}
function trois(){charger3(function(){var TH=window.THREE,cv=$('c3d'),st=$('stage'),w=st.clientWidth,h=st.clientHeight;
 if(!T3){T3={r:new TH.WebGLRenderer({canvas:cv,antialias:true,alpha:true}),sc:new TH.Scene(),cam:new TH.PerspectiveCamera(32,1,1,2000),g:new TH.Group(),rx:-.5,ry:.45};
  T3.sc.add(new TH.AmbientLight(0xffffff,.72));var l=new TH.DirectionalLight(0xffffff,.75);l.position.set(-60,120,160);T3.sc.add(l);T3.sc.add(T3.g);
  var bas=null;cv.addEventListener('pointerdown',function(e){bas=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',function(e){if(!bas)return;T3.ry+=(e.clientX-bas[0])*.01;T3.rx=Math.max(-1.4,Math.min(1.4,T3.rx+(e.clientY-bas[1])*.01));bas=[e.clientX,e.clientY];rendre()});
  cv.addEventListener('pointerup',function(){bas=null});cv.addEventListener('pointercancel',function(){bas=null})}
 while(T3.g.children.length)T3.g.remove(T3.g.children[0]);
 T3.g.add(couche(G.plaque,0,3,new TH.Color(fond()[2])));T3.g.add(couche(G.haut,3,3,new TH.Color('#c79a62')));
 T3.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));T3.r.setSize(w,h,false);T3.cam.aspect=w/h;T3.cam.position.set(0,0,Math.max(100/(.2867*w/h),(G.hmm/2+14)/.2867));T3.cam.updateProjectionMatrix();rendre()})}
function rendre(){if(!T3)return;T3.g.rotation.set(T3.rx,T3.ry,0);T3.r.render(T3.sc,T3.cam)}
function vue(v){S.vue=v;$('stage').setAttribute('data-3d',v==='3d'?'1':'0');$('vFace').className=v==='face'?'on':'';$('v3d').className=v==='3d'?'on':'';$('scene').style.visibility=v==='3d'?'hidden':'';
 if(v==='3d'){$('aide').textContent='Faites tourner la fleur avec le doigt.';trois()}else dessiner()}

/* ---- les gestes ---- */
var attente=false;function redessiner(){if(attente)return;attente=true;requestAnimationFrame(function(){attente=false;dessiner()})}
$('nom').value=S.nom;$('nom').addEventListener('input',function(){S.nom=this.value.slice(0,D.lettres);majPols();redessiner()});
$('filtres').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.filtre=b.getAttribute('data-f');S.toutF=false;majFleurs()});
$('fleurs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.fleur=b.getAttribute('data-id');S.fx=S.fy=S.frot=0;S.fech=100;
 /* une fleur aux traits très fins est agrandie toute seule, jusqu'à ce qu'elle puisse être découpée */
 while(construire().trop&&S.fech<160)S.fech+=10;majFleurs();dessiner()});
$('plusFleurs').addEventListener('click',function(){S.toutF=true;majFleurs()});
$('feuillages').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.feu=b.getAttribute('data-id');var fe=feuillage();S.th=fe.th;S.xh=fe.xh;S.tb=fe.tb;S.xb=fe.xb;majFeuilles();dessiner()});
$('pols').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.pol=b.getAttribute('data-id');majPols();dessiner()});
$('plusPols').addEventListener('click',function(){S.toutP=true;majPols()});
$('fonds').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.fond=b.getAttribute('data-id');majFonds();dessiner()});
CURS.forEach(function(c){$('r-'+c).addEventListener('input',function(){S[c]=+this.value;redessiner()})});
document.querySelectorAll('[data-fl]').forEach(function(b){b.addEventListener('click',function(){var q=b.getAttribute('data-fl').split(','),v=+q[1];
 if(q[0]==='rot')S.frot=((S.frot+v+180)%360+360)%360-180;else if(q[0]==='ech')S.fech=Math.max(50,Math.min(160,S.fech+v));else if(q[0]==='x')S.fx+=v;else if(q[0]==='y')S.fy+=v;else{S.fx=S.fy=S.frot=0;S.fech=100}dessiner()})});
$('vFace').addEventListener('click',function(){vue('face')});$('v3d').addEventListener('click',function(){vue('3d')});
/* glisser la fleur sur l'aperçu */
(function(){var svg=$('scene'),bas=null;
 svg.addEventListener('pointerdown',function(e){if(!e.target.classList||!e.target.classList.contains('saisie'))return;bas={x:e.clientX,y:e.clientY,fx:S.fx,fy:S.fy,m:svg.getScreenCTM().a};try{svg.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
 svg.addEventListener('pointermove',function(e){if(!bas)return;S.fx=Math.round(bas.fx+(e.clientX-bas.x)/bas.m/G.vue.k);S.fy=Math.round(bas.fy+(e.clientY-bas.y)/bas.m/G.vue.k);redessiner()});
 function fin(){bas=null}svg.addEventListener('pointerup',fin);svg.addEventListener('pointercancel',fin)})();
window.addEventListener('resize',function(){if(S.vue==='3d')trois()});
/* l'en-tête du site reste collé en haut : l'aperçu se colle juste dessous, jamais derrière */
function sousEntete(){var h=document.querySelector('header'),t=0;if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;document.documentElement.style.setProperty('--sc-top',t+'px')}
sousEntete();window.addEventListener('resize',sousEntete);window.addEventListener('load',sousEntete);
/* sur téléphone : l'aperçu suit les étapes, puis se retire quand la cliente arrive au résumé et au prix */
var glisse=false;
function decoller(){glisse=false;var st=$('stage'),fin=$('resume'),d=0;
 if(window.matchMedia('(max-width:900px)').matches){var top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sc-top'))||0;
  d=Math.min(0,fin.getBoundingClientRect().top-(top+st.offsetHeight+8));d=Math.max(d,-(top+st.offsetHeight+30))}
 st.style.transform=d?'translateY('+Math.round(d)+'px)':'';st.style.visibility=d<=-(st.offsetHeight)?'hidden':''}
window.addEventListener('scroll',function(){if(!glisse){glisse=true;requestAnimationFrame(decoller)}},{passive:true});window.addEventListener('resize',decoller);

majFleurs();majFeuilles();majPols();majFonds();dessiner();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){majPols()});
window.flAtelier={S:S,dessiner:dessiner,maj:function(){$('nom').value=S.nom;majFleurs();majFeuilles();majPols();majFonds();dessiner()}};
window.flEtat=function(){var g=G||construire();return{S:S,ok:OK,fin:g&&g.fin,q:g&&g.q,contour:g&&g.contour,s:g&&g.s,lmm:g&&g.lmm,hmm:g&&g.hmm,trop:g&&g.trop,detache:g&&g.detache,morceaux:g&&g.morceaux,plaques:g&&g.plaque.length,
 points:g&&g.haut.reduce(function(n,p){return n+p.length},0),manque:g&&g.manque,total:total(),bloque:$('ajouter').disabled}};
})();
"""

clip = open(fclip, encoding="utf-8").read()
otf = open(fopen, encoding="utf-8").read()
assert "</script" not in clip and "</script" not in otf
page = (tete + "<style>" + CSS + "</style>" + MAIN.replace("__FIL__", fil) + pied
        + "<script>" + clip + "</script><script>" + otf + "</script><script>" + JS.replace("__DONNEES__", DONNEES) + "</script>\n")
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko")
