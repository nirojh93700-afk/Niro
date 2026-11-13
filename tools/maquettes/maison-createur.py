#!/usr/bin/env python3
"""Maquette « Créez votre maisonnette en bois » (13/11/2026) — RIEN en ligne.

Le gérant : le même outil que https://www.atomm.com/creativetools/generator/house-ornament-generator/ (« analyse bien pour le faire »).
Une petite maison en bois de 3 mm, en 8 pièces qui s'emboîtent : deux pignons (le dessin de la façade et de l'arrière), deux murs
à fenêtres, une base, deux pans de toit à tuiles gravées, une poutre d'accroche avec son anneau. Elle se suspend, ou se pose sur
une ampoule de guirlande lumineuse. Le calcul des pièces (maison-geo.js) suit les règles de l'outil d'Atomm et donne les mêmes
pièces que lui (maison-test.cjs).

  python3 tools/maquettes/maison-createur.py <page de base> <motifs.json> <clipper.js> <sortie>

<page de base> = la sortie d'un autre créateur (arbre-createur.py par exemple) : on en garde l'habillage du site.
<motifs.json>  = docs/maquettes/assets/maison/motifs.json (les 16 dessins de Noël relevés dans l'outil d'Atomm).
<clipper.js>   = npm pack clipper-lib@6.4.2 → package/clipper.js (écrit DANS la page) ; three.js r128 est chargé de cdnjs pour la 3D.
"""
import json, os, re, sys

base, fmotifs, fclip, out = sys.argv[1:5]
ici = os.path.dirname(os.path.abspath(__file__))
os.makedirs(out, exist_ok=True)

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Maisonnette en bois</title>", tete, count=1, flags=re.S)
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · maisonnette en bois, d'après le générateur « House Ornament » d'Atomm. Rien n'est en ligne, rien n'est vendu.\2", tete, count=1, flags=re.S)
fil = re.search(r"<nav class=\"container\".*?</nav>", s[i_main:j_main], flags=re.S)
fil = fil.group(0) if fil else ""

motifs = json.load(open(fmotifs, encoding="utf-8"))
motifs = {k: [[[round(p[0], 4), round(p[1], 4)] for p in r] for r in v] for k, v in motifs.items()}

# Les dessins de la façade : [identifiant chez Atomm, nom]
DESSINS = [["christmas_deer", "Renne"], ["christmas_tree", "Sapin"], ["christmas_snowflake", "Flocon"], ["star", "Étoile"], ["heart", "Cœur"],
           ["christmas_cottage", "Chalet"], ["christmas_angel", "Ange"], ["christmas_bell", "Cloche"], ["christmas_snowman", "Bonhomme de neige"],
           ["christmas_gingerbread", "Pain d'épices"], ["christmas_stocking", "Chaussette"], ["christmas_holly", "Houx"], ["christmas_candle", "Bougie"],
           ["christmas_bauble", "Boule"], ["christmas_santa_hat", "Bonnet"], ["christmas_candy_cane", "Sucre d'orge"], ["christmas_sleigh", "Traîneau"],
           ["christmas_bow", "Nœud"], ["moon", "Lune"], ["circle", "Rond"], ["none", "Sans dessin"]]
# Les tailles (proposées) : [id, nom, largeur, profondeur, hauteur des murs, hauteur du toit, prix]. La petite = la maison de départ d'Atomm.
TAILLES = [["p", "Petite", 64, 52, 60, 30, 19.9], ["m", "Moyenne", 80, 65, 75, 37.5, 24.9], ["g", "Grande", 96, 78, 90, 45, 29.9]]

DONNEES = json.dumps({"motifs": motifs, "dessins": DESSINS, "tailles": TAILLES, "planche": 190}, ensure_ascii=False, separators=(",", ":"))

CSS = r"""
.ms-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
@media (min-width:900px){.ms-grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ms-grille.deux{grid-template-columns:repeat(2,minmax(0,1fr))}
.ms-grille.quatre{grid-template-columns:repeat(4,minmax(0,1fr))}
.ms-carte{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 4px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);
cursor:pointer;font:inherit;color:var(--ink);text-align:center;min-width:0}
.ms-carte svg{display:block;width:100%;height:64px}
.ms-carte b{font-size:.74rem;line-height:1.15;font-weight:600;overflow-wrap:anywhere}
.ms-carte small{font-size:.68rem;color:var(--ink-soft);line-height:1.2}
.ms-carte.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.ms-plus{display:block;width:100%;margin-top:8px;min-height:44px;border:1.5px dashed var(--line);border-radius:12px;background:transparent;font:inherit;font-weight:600;font-size:.86rem;color:var(--ink);cursor:pointer}
.ms-regl{display:grid;gap:14px}
.ms-regl label{display:block}
.ms-regl .tete{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-weight:600;font-size:.9rem}
.ms-regl .tete output{font-weight:600;color:#7c6120;font-size:.84rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.ms-regl input[type=range]{display:block;width:100%;margin:6px 0 0;min-height:34px;accent-color:#a98935}
.ms-fins{margin-top:12px;border:1px solid var(--line);border-radius:12px;background:#fff}
.ms-fins>summary{cursor:pointer;padding:12px 14px;font-weight:600;font-size:.88rem;list-style:none;display:flex;justify-content:space-between;gap:10px;min-height:20px}
.ms-fins>summary::-webkit-details-marker{display:none}
.ms-fins>summary::after{content:"▾";color:var(--ink-soft)}
.ms-fins[open]>summary::after{content:"▴"}
.ms-fins>div{padding:2px 14px 14px}
.ms-case{display:flex;align-items:center;gap:10px;margin-top:12px;min-height:44px;font-weight:600;font-size:.9rem;cursor:pointer}
.ms-case input{width:22px;height:22px;accent-color:#a98935;flex:none}
.ms-seg{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
.ms-seg>span{font-weight:600;font-size:.9rem;min-width:84px}
.ms-seg>div{display:flex;gap:6px}
.ms-seg button{min-width:46px;min-height:44px;border:1.5px solid var(--line);border-radius:10px;background:var(--paper);font:inherit;font-weight:700;cursor:pointer;color:var(--ink)}
.ms-seg button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ms-sous{margin:16px 0 8px;font:600 .95rem Inter,system-ui,sans-serif}
.ms-dim{position:absolute;left:10px;bottom:10px;z-index:3;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink)}
.ms-stage svg#scene{min-height:230px}
.ms-feuilles{display:grid;gap:14px}
.ms-feuilles .al{color:#b4452f;font-size:.82rem;font-weight:600;margin:6px 0 0}
.ms-mont{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:14px;margin-top:14px}
.ms-mont h4{margin:0 0 8px;font:600 1rem Inter,system-ui,sans-serif}
.ms-mont canvas{display:block;width:100%;aspect-ratio:4/3;background:linear-gradient(#fbf7ee,#f3e8d3);border-radius:10px;touch-action:none;cursor:grab}
.ms-mont .barre{display:flex;align-items:center;gap:8px;margin-top:10px}
.ms-mont .barre button{min-width:44px;min-height:44px;border:1.5px solid var(--line);border-radius:10px;background:var(--paper);font:inherit;font-weight:700;cursor:pointer;color:var(--ink)}
.ms-mont .barre button:disabled{opacity:.4;cursor:default}
.ms-mont .barre p{margin:0;flex:1;min-width:0;font-size:.88rem;line-height:1.4}
.ms-mont .barre p b{display:block}
.ms-mont ol{margin:12px 0 0;padding-left:20px;font-size:.86rem;line-height:1.5}
.ms-mont ol li.ici{font-weight:700}
"""

MAIN = r"""<main>
__FIL__
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage ms-stage" id="stage" data-vue="creation"><span class="sc-tag">Votre maisonnette, en direct</span>
   <div class="sc-vue" role="group" aria-label="Vue"><button type="button" class="on" id="vFace">De face</button><button type="button" id="v3d">3D</button><button type="button" id="vPieces" hidden>Pièces</button></div>
   <svg id="scene" viewBox="0 0 120 120" role="img" aria-label="Aperçu de votre maisonnette"></svg>
   <canvas class="sc-3d" id="c3d"></canvas>
   <span class="ms-dim" id="dim"></span></div>
  <p class="sc-aide" id="aide"></p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Maison &amp; Déco</a></div>
  <div class="pd-titrerow"><h1>Maisonnette en bois ajourée, à suspendre ou à illuminer</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">Choisissez le dessin de la façade, les fenêtres et le toit. La maisonnette est découpée dans du bois de 3 mm, puis montée et collée dans notre atelier.</p>
  <div class="price-lead" id="prixtete"></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre maisonnette</p><p class="prc-sub">Six petites étapes. La maison se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">1</span><h3>La taille</h3></div>
  <div class="ms-grille" id="tailles" style="grid-template-columns:repeat(3,minmax(0,1fr))"></div>
  <details class="ms-fins"><summary>Changer la forme de la maison</summary><div class="ms-regl" data-curs="roofHeight,baseInset,eave"></div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">2</span><h3>Le dessin de la façade</h3></div>
  <p class="prc-legend">Il est découpé à jour dans le bois : la lumière passe au travers.</p>
  <div class="ms-grille" id="motifs"></div>
  <button type="button" class="ms-plus" id="plusMotifs" hidden></button>
  <label class="ms-case"><input type="checkbox" id="dos"><span>Un autre dessin à l'arrière</span></label>
  <div id="blocDos" hidden><p class="ms-sous">Le dessin de l'arrière</p><div class="ms-grille" id="motifsDos"></div><button type="button" class="ms-plus" id="plusDos" hidden></button></div>
  <details class="ms-fins" id="finsMotif"><summary>Taille et hauteur du dessin</summary><div class="ms-regl" data-curs="motifSize,motifY"></div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>Les petites découpes autour</h3></div>
  <div class="ms-grille quatre" id="decors"></div>
  <div class="ms-regl" id="blocDecor" style="margin-top:12px" data-curs="decorCount"></div>
  <p class="prc-hint" id="infoDecor"></p>
  <details class="ms-fins" id="finsDecor"><summary>Taille et place des découpes</summary><div class="ms-regl" data-curs="decorSize,decorInset"></div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>Les fenêtres des côtés</h3></div>
  <div class="ms-grille quatre" id="fenetres"></div>
  <div id="blocFen">
   <div class="ms-seg"><span>Rangées</span><div data-seg="windowRows"></div></div>
   <div class="ms-seg"><span>Par rangée</span><div data-seg="windowCols"></div></div>
   <details class="ms-fins"><summary>Taille des fenêtres</summary><div class="ms-regl" data-curs="windowWidth,windowHeight,windowGap,windowFrame"></div></details>
  </div>
  <label class="ms-case"><input type="checkbox" id="droite"><span>Des fenêtres différentes sur le côté droit</span></label>
  <div id="blocDroite" hidden><p class="ms-sous">Le côté droit</p>
   <div class="ms-grille quatre" id="fenetresD"></div>
   <div id="blocFenD">
    <div class="ms-seg"><span>Rangées</span><div data-seg="R.windowRows"></div></div>
    <div class="ms-seg"><span>Par rangée</span><div data-seg="R.windowCols"></div></div>
    <details class="ms-fins"><summary>Taille des fenêtres du côté droit</summary><div class="ms-regl" data-curs="R.windowWidth,R.windowHeight,R.windowGap,R.windowFrame"></div></details>
   </div>
  </div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>Le toit</h3></div>
  <div class="ms-grille deux" id="toits"></div>
  <div class="ms-regl" id="blocTuiles" style="margin-top:12px" data-curs="tileSize"></div>
 </section>
 <section class="prc-step" id="etape6">
  <div class="prc-sh"><span class="prc-num done">6</span><h3>Suspendue, ou sur une guirlande</h3></div>
  <div class="ms-grille deux" id="usages"></div>
  <p class="prc-hint" id="infoUsage"></p>
  <details class="ms-fins" id="finsAnneau"><summary>Régler l'anneau</summary><div class="ms-regl" data-curs="loopInner,loopOuter,topPosition"></div></details>
  <details class="ms-fins" id="finsFil"><summary>Régler le passage du fil et l'ampoule</summary><div class="ms-regl" data-curs="wireDiameter,topPosition,bulbDiameter,bulbLength"></div></details>
  <div class="prc-sum" id="resume" style="margin-top:14px"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
 </div>
</div></div>

<section class="sc-atelier"><div class="container">
 <h2>De votre côté : les pièces à découper, puis le montage</h2>
 <p>À la commande, le site range dans le dossier de la commande les planches à la taille réelle. Elles changent en direct quand vous modifiez la maisonnette au-dessus.</p>
 <div class="sc-agrid">
  <div>
   <div class="ms-feuilles" id="planches"></div>
   <div class="ms-mont"><h4>Le montage, pièce après pièce</h4>
    <canvas id="cMont" hidden></canvas>
    <div class="barre"><button type="button" id="mPrec" aria-label="Étape précédente">‹</button><p id="mTexte"></p><button type="button" id="mSuiv" aria-label="Étape suivante">›</button></div>
    <ol id="mListe"></ol>
   </div>
  </div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#1a1206"></i>Trait noir : à graver (les tuiles)</li></ul>
   <div class="ms-mont" style="margin:0 0 14px"><h4>Vos réglages de machine</h4>
    <div class="ms-regl" data-curs="thickness,fit,kerf,baseMargin"></div>
    <p class="prc-hint" style="margin:10px 0 0">La cliente ne voit pas ces réglages. Le trait de coupe est déjà compté dans le tracé rouge : ne le compensez pas une deuxième fois dans le logiciel de la machine. Mettez 0 pour un tracé sans compensation.</p>
   </div>
   <ul class="sc-points">
    <li><b>Le générateur d'Atomm, pièce pour pièce</b>Les mêmes pièces, les mêmes tenons, ses 16 dessins de Noël et ses formes simples. Mon calcul a été comparé au sien sur six maisons différentes : mêmes pièces au centième de millimètre.</li>
    <li><b>Huit pièces</b>Deux pignons, deux murs, la base, deux pans de toit et la poutre d'accroche. Sur une guirlande, il n'y a pas de poutre : sept pièces.</li>
    <li><b>Ce qui se colle</b>Les murs, les pignons et la base se collent. Le toit s'enfile sur les deux tenons de chaque pignon : il peut rester amovible.</li>
    <li><b>Jamais de pièce fragile</b>Une petite découpe qui toucherait le dessin, un assemblage ou une autre découpe n'est pas faite. Si une pièce risquait d'être coupée en deux, la commande est bloquée et l'outil dit quoi changer.</li>
    <li><b>Avant la première vente</b>Découper une maison d'essai pour régler le jeu des assemblages sur votre bois (la pièce d'essai d'emboîtement de Gestion sert à ça).</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Trois tailles proposées par moi : petite (celle de départ d'Atomm), moyenne, grande. Chez Atomm la largeur, la profondeur et la hauteur sont libres, de 4,5 à 14 cm ; j'ai mis des tailles fixes, comme vous l'aviez demandé pour la décoration à suspendre.</li>
  <li>Prix proposés par moi : 19,90 €, 24,90 € et 29,90 €, maisonnette montée et collée par l'atelier. Sur le marché, une lanterne de Noël en bois découpé se vend autour de 20 €, un photophore chalet personnalisé de 13 à 21 €.</li>
  <li>Vendue montée. Elle peut aussi se vendre en kit à plat, à monter par la cliente : à vous de dire.</li>
  <li>Sur une guirlande : la guirlande n'est pas fournie, et seulement des ampoules LED, qui ne chauffent pas. Jamais de bougie.</li>
  <li>L'outil d'Atomm n'écrit aucun prénom. Je peux ajouter un prénom gravé (sur le toit ou sur la base) si vous le voulez.</li>
  <li>Les dessins sont presque tous de Noël : la fiche pourrait suivre l'interrupteur Noël, ou rester toute l'année avec l'étoile, le cœur et la lune.</li>
  <li>Les réglages d'Atomm sont tous là. Ceux de la machine (épaisseur du bois, jeu, trait de coupe) sont de votre côté, pas du côté de la cliente.</li>
  <li>Non repris : le dessin inventé par l'intelligence artificielle d'Atomm (il faut un compte chez eux) et le choix de la matière, qui n'est qu'un aperçu chez eux.</li>
 </ul></div>
</div></section>
</main>"""

JS = r"""
(function(){
var D=__DONNEES__,$=function(i){return document.getElementById(i)},M=window.NivMaison,E=M.E,LIM=M.LIMITES;
M.motifs(D.motifs);
var S={taille:'p',P:JSON.parse(JSON.stringify(M.DEFAUT)),toutM:false,toutD:false,vue:'face',choisie:false,pas:0};
var G=null;
function fr(v,d){var p=Math.pow(10,d==null?1:d);return (Math.round(v*p)/p).toString().replace('.',',')}
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
function taille(){return D.tailles.filter(function(t){return t[0]===S.taille})[0]}
function nomDessin(id){var d=D.dessins.filter(function(q){return q[0]===id})[0];return d?d[1]:id}
var LIB={roofHeight:'Hauteur du toit',baseInset:'Murs resserrés vers le bas',eave:'Débord du toit',motifSize:'Taille du dessin',motifY:'Hauteur du dessin, depuis le bas du toit',
 decorCount:'Combien de découpes',decorSize:'Taille des découpes',decorInset:'Distance du bord du mur',windowWidth:'Largeur d\'une fenêtre',windowHeight:'Hauteur d\'une fenêtre',
 windowGap:'Écart entre les fenêtres',windowFrame:'Croisillon dans la fenêtre',tileSize:'Taille des tuiles',loopInner:'Trou de l\'anneau',loopOuter:'Diamètre de l\'anneau',
 topPosition:'Place sur le toit, de l\'avant vers l\'arrière',wireDiameter:'Trou pour le fil',bulbDiameter:'Diamètre de l\'ampoule',bulbLength:'Longueur de l\'ampoule',
 thickness:'Épaisseur réelle du bois',fit:'Jeu des assemblages',kerf:'Largeur du trait de coupe',baseMargin:'Débord de la base'};
var PAS={decorCount:1,topPosition:1,fit:.01,kerf:.01,thickness:.1,windowFrame:.1};

/* ---- la taille : la petite est la maison de départ d'Atomm, les autres sont la même en plus grand ---- */
var LONGUEURS=['roofHeight','baseInset','eave','motifSize','motifY','decorSize','decorInset','windowWidth','windowHeight','windowGap','tileSize'];
function borne(c,v){var l=LIM[c];return Math.max(l[0],Math.min(l[1],Math.round(v*10)/10))}
function prendreTaille(id){var t=D.tailles.filter(function(q){return q[0]===id})[0],k=t[2]/S.P.width;S.taille=id;
 LONGUEURS.forEach(function(c){S.P[c]=borne(c,S.P[c]*k)});['windowWidth','windowHeight','windowGap'].forEach(function(c){S.P.rightWindow[c]=borne(c,S.P.rightWindow[c]*k)});
 S.P.width=t[2];S.P.depth=t[3];S.P.wallHeight=t[4]}

/* ---- la vue de face : le pignon, le toit vu par la tranche, la base, l'anneau et son fil blanc ---- */
function face(){var g=G,t=g.params,W=t.width,H=t.wallHeight,R=t.roofHeight,T=t.thickness,co=Math.cos(g.pente),si=Math.sin(g.pente),pan=g.pan,bm=t.baseMargin,gi=t.baseInset;
 var x0=W/2-pan*co-T*si-4,x1=W-x0,y0=(t.topMode==='ornament'?g.anneau.y-g.anneau.rayon-16:-T/co-22),y1=H+R+T+5,c=Math.max(x1-x0,y1-y0),cx=(x0+x1)/2,cy=(y0+y1)/2;
 function toit(s){var ax=W/2,ay=0,dx=s*co,dy=si,nx=s*si,ny=-co;return 'M'+ax+' '+ay+'L'+(ax+dx*pan).toFixed(2)+' '+(ay+dy*pan).toFixed(2)+'L'+(ax+dx*pan+nx*T).toFixed(2)+' '+(ay+dy*pan+ny*T).toFixed(2)+'L'+(ax+nx*T).toFixed(2)+' '+(ay+ny*T).toFixed(2)+'Z'}
 var h='<defs><linearGradient id="msBois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c690"/><stop offset="1" stop-color="#cfa56a"/></linearGradient></defs>';
 if(t.topMode==='ornament'){var ay=g.anneau.y;
  h+='<line x1="'+W/2+'" y1="'+(y0-4)+'" x2="'+W/2+'" y2="'+(ay-1)+'" stroke="#b7ab97" stroke-width="1.5" stroke-linecap="round"/><line x1="'+W/2+'" y1="'+(y0-4)+'" x2="'+W/2+'" y2="'+(ay-1)+'" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>'
   +'<rect x="'+(W/2-T/2)+'" y="'+(ay-g.anneau.rayon).toFixed(2)+'" width="'+T+'" height="'+(g.anneau.rayon-ay+2).toFixed(2)+'" fill="#b98d55" rx=".6"/>'}
 else h+='<line x1="'+W/2+'" y1="'+(y0-4)+'" x2="'+W/2+'" y2="1" stroke="#3d5a3a" stroke-width="'+Math.max(1,t.wireDiameter*.45)+'" stroke-linecap="round"/>';
 h+='<path d="M'+gi+' '+(H+R)+'L0 '+R+'L'+W/2+' 0L'+W+' '+R+'L'+(W-gi)+' '+(H+R)+'Z" fill="'+(t.topMode==='lights'?'#f6c66a':'#4b3522')+'"/>';
 h+='<path d="'+M.chemin(g.parts[0].rings,0,0)+'" fill="url(#msBois)" fill-rule="evenodd" stroke="#8a6a3d" stroke-width=".3" stroke-linejoin="round"/>';
 h+='<rect x="'+(gi-bm)+'" y="'+(H+R)+'" width="'+(g.bas+2*bm)+'" height="'+T+'" fill="#b98d55" stroke="#8a6a3d" stroke-width=".3"/>';
 h+='<path d="'+toit(-1)+toit(1)+'" fill="#b98d55" stroke="#8a6a3d" stroke-width=".3" stroke-linejoin="round"/>';
 var sc=$('scene');sc.setAttribute('viewBox',(cx-c/2).toFixed(1)+' '+(cy-c/2).toFixed(1)+' '+c.toFixed(1)+' '+c.toFixed(1));sc.innerHTML=h}

/* ---- la 3D : chaque pièce est une plaque de bois de l'épaisseur choisie, posée à sa place ---- */
var TROIS={ok:false,rate:false},V3=null,VM=null;
function charger3(suite){if(window.THREE){TROIS.ok=true;return suite()}var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 sc.onload=function(){TROIS.ok=true;suite()};sc.onerror=function(){TROIS.rate=true;$('v3d').hidden=true;$('vPieces').hidden=true;vue('face')};document.head.appendChild(sc)}
function scene3(cv,suivre){var TH=window.THREE,o={cv:cv,r:new TH.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true}),sc:new TH.Scene(),cam:new TH.PerspectiveCamera(30,1,1,6000),pivot:new TH.Group(),rx:.26,ry:-.62,rayon:80};
 o.sc.add(new TH.AmbientLight(0xffffff,.66));var l=new TH.DirectionalLight(0xffffff,.62);l.position.set(-90,170,220);o.sc.add(l);var l2=new TH.DirectionalLight(0xffffff,.3);l2.position.set(140,60,-180);o.sc.add(l2);o.sc.add(o.pivot);
 var bas=null;cv.addEventListener('pointerdown',function(e){bas=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',function(e){if(!bas)return;o.ry+=(e.clientX-bas[0])*.01;o.rx=Math.max(-1.2,Math.min(1.2,o.rx+(e.clientY-bas[1])*.01));bas=[e.clientX,e.clientY];rendre(o)});
 function fin(){bas=null}cv.addEventListener('pointerup',fin);cv.addEventListener('pointercancel',fin);return o}
function vider(grp){while(grp.children.length){var c=grp.children[0];grp.remove(c);if(c.children&&c.children.length)vider(c);if(c.geometry)c.geometry.dispose()}}
function monter(o,opt){var TH=window.THREE,g=G,t=g.params,T=t.thickness,W=t.width,H=t.wallHeight,R=t.roofHeight,De=t.depth,k=opt.eclat||0;
 vider(o.pivot);var maison=new TH.Group();maison.position.y=-(H+R+T)/2;o.pivot.add(maison);
 function mats(neuf){return [new TH.MeshStandardMaterial({color:neuf?0xe9b85c:0xdcb880,roughness:.86,metalness:0,side:TH.DoubleSide}),new TH.MeshStandardMaterial({color:neuf?0x9a6a22:0x7d5633,roughness:.95,metalness:0,side:TH.DoubleSide})]}
 g.parts.forEach(function(p){if(opt.voir&&opt.voir.indexOf(p.id)<0)return;
  var grp=new TH.Group(),m=new TH.Matrix4().makeBasis(new TH.Vector3(p.u[0],p.u[1],p.u[2]),new TH.Vector3(p.v[0],p.v[1],p.v[2]),new TH.Vector3(p.normal[0],p.normal[1],p.normal[2]));
  m.setPosition(p.origin[0]+p.explode[0]*k,p.origin[1]+p.explode[1]*k,p.origin[2]+p.explode[2]*k);grp.matrixAutoUpdate=false;grp.matrix.copy(m);
  var mm=mats(opt.neuf&&opt.neuf.indexOf(p.id)>=0),trous=p.rings.filter(function(r){return M.aire(r)<0});
  p.rings.filter(function(r){return M.aire(r)>0}).forEach(function(r){var sh=new TH.Shape(r.map(function(q){return new TH.Vector2(q.X/E,q.Y/E)}));
   trous.forEach(function(h){sh.holes.push(new TH.Path(h.map(function(q){return new TH.Vector2(q.X/E,q.Y/E)})))});
   grp.add(new TH.Mesh(new TH.ExtrudeGeometry(sh,{depth:T,bevelEnabled:false,curveSegments:1}),mm))});
  if(p.scores.length){var pos=[];p.scores.forEach(function(l){for(var i=1;i<l.length;i++)pos.push(l[i-1].X/E,l[i-1].Y/E,T+.07,l[i].X/E,l[i].Y/E,T+.07)});
   var lg=new TH.BufferGeometry();lg.setAttribute('position',new TH.Float32BufferAttribute(pos,3));grp.add(new TH.LineSegments(lg,new TH.LineBasicMaterial({color:0x5b3d1f})))}
  maison.add(grp)});
 if(opt.fil&&t.topMode==='ornament'){var yA=H+R+T-g.anneau.y,zA=De/2-g.anneau.place,lon=46;
  [[.42,0xffffff,TH.FrontSide],[.66,0xb7ab97,TH.BackSide]].forEach(function(q){var c=new TH.Mesh(new TH.CylinderGeometry(q[0],q[0],lon,10),new TH.MeshBasicMaterial({color:q[1],side:q[2]}));c.position.set(0,yA+lon/2,zA);maison.add(c)})}
 if(opt.lampe&&t.topMode==='lights'){var b=g.bulb,amp=new TH.Mesh(new TH.SphereGeometry(b.diameter/2,20,14),new TH.MeshBasicMaterial({color:0xffe6b0}));amp.position.set(b.position[0],b.position[1],b.position[2]);amp.scale.y=Math.max(1,b.length/b.diameter);maison.add(amp);
  var lu=new TH.PointLight(0xffc577,1.25,Math.max(W,De)*5);lu.position.copy(amp.position);maison.add(lu);
  var hf=H+R+T+50-(b.position[1]+b.length/2),fl=new TH.Mesh(new TH.CylinderGeometry(Math.max(.5,t.wireDiameter*.22),Math.max(.5,t.wireDiameter*.22),hf,10),new TH.MeshStandardMaterial({color:0x3d5a3a,roughness:.8}));fl.position.set(0,b.position[1]+b.length/2+hf/2,b.position[2]);maison.add(fl)}
 o.rayon=.5*Math.hypot(W+2*t.eave+24*k,H+R+T+(t.topMode==='ornament'&&opt.fil?38:14)+30*k,De+2*t.eave+30*k);cadrer(o)}
function cadrer(o){var w=o.cv.clientWidth||300,h=o.cv.clientHeight||225;o.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));o.r.setSize(w,h,false);o.cam.aspect=w/h;
 var d=o.rayon/Math.sin(15*Math.PI/180)*1.04;if(w<h)d*=h/w;o.cam.position.set(0,0,d);o.cam.updateProjectionMatrix();rendre(o)}
function rendre(o){o.pivot.rotation.set(o.rx,o.ry,0);o.r.render(o.sc,o.cam)}
function trois(){if(!TROIS.ok)return;if(!V3)V3=scene3($('c3d'));monter(V3,S.vue==='pieces'?{eclat:1}:{fil:true,lampe:true})}
function vue(v){if(v!=='face'&&!TROIS.ok)v='face';S.vue=v;$('stage').setAttribute('data-3d',v==='face'?'0':'1');$('vFace').className=v==='face'?'on':'';$('v3d').className=v==='3d'?'on':'';$('vPieces').className=v==='pieces'?'on':'';
 $('aide').textContent=v==='face'?'La façade, à plat. Touchez « 3D » pour faire tourner la maisonnette.':v==='3d'?'Faites tourner la maisonnette avec le doigt.':'Les pièces, écartées les unes des autres : elles s\'emboîtent par des tenons.';
 if(v!=='face')trois()}

/* ---- les cartes à choisir ---- */
function vigDessin(id){var d='';M.formes(id).forEach(function(r){for(var i=0;i<r.length;i++)d+=(i?'L':'M')+(r[i][0]*.62).toFixed(3)+' '+(r[i][1]*.62+.2).toFixed(3);d+='Z'});
 return '<svg viewBox="-.7 -.82 1.4 1.6" aria-hidden="true"><path d="M-.5 .7L-.56 -.22L0 -.74L.56 -.22L.5 .7Z" fill="#dcb880" stroke="#8a6a3d" stroke-width=".02"/>'+(d?'<path d="'+d+'" fill="#4b3522"/>':'')+'</svg>'}
function grilleDessins(hote,plus,cle,tout){var VUES=window.matchMedia('(min-width:900px)').matches?8:9,voir=S[tout]?D.dessins:D.dessins.slice(0,VUES),choix=S.P[cle];
 if(!S[tout]&&voir.every(function(q){return q[0]!==choix})){var c=D.dessins.filter(function(q){return q[0]===choix})[0];if(c){voir=voir.slice();voir[VUES-1]=c}}
 $(hote).innerHTML=voir.map(function(q){return '<button type="button" class="ms-carte'+(q[0]===choix?' on':'')+'" data-id="'+q[0]+'" aria-pressed="'+(q[0]===choix)+'">'+vigDessin(q[0])+'<b>'+q[1]+'</b></button>'}).join('');
 var reste=D.dessins.length-voir.length;$(plus).hidden=S[tout]||reste<=0;$(plus).textContent='Voir les '+reste+' autres dessins'}
function vigForme(id,n){var d='';if(id!=='none')for(var k=0;k<n;k++)M.formes(id).forEach(function(r){for(var i=0;i<r.length;i++)d+=(i?'L':'M')+(r[i][0]*.5+(k-(n-1)/2)*.7).toFixed(3)+' '+(r[i][1]*.5).toFixed(3);d+='Z'});
 return '<svg viewBox="-1.2 -.6 2.4 1.2" aria-hidden="true">'+(d?'<path d="'+d+'" fill="#a9793f"/>':'<path d="M-.5 0H.5" stroke="#b9ab94" stroke-width=".08" stroke-linecap="round"/>')+'</svg>'}
function vigFenetre(id){var d={arch:'M-.3 .5V-.15A.3 .3 0 0 1 .3 -.15V.5Z',square:'M-.3 -.45H.3V.5H-.3Z',circle:'M0 -.38A.38 .38 0 1 0 0 .38A.38 .38 0 1 0 0 -.38Z'}[id];
 return '<svg viewBox="-1.2 -.6 2.4 1.2" aria-hidden="true">'+(d?'<path d="'+d+'" fill="#a9793f"/>':'<path d="M-.5 0H.5" stroke="#b9ab94" stroke-width=".08" stroke-linecap="round"/>')+'</svg>'}
function cartes(hote,liste,choix,vig){$(hote).innerHTML=liste.map(function(q){return '<button type="button" class="ms-carte'+(q[0]===choix?' on':'')+'" data-id="'+q[0]+'" aria-pressed="'+(q[0]===choix)+'">'+vig(q[0])+'<b>'+q[1]+'</b>'+(q[2]?'<small>'+q[2]+'</small>':'')+'</button>'}).join('')}
var DECORS=[['star','Étoiles'],['circle','Ronds'],['heart','Cœurs'],['none','Aucune']],FENETRES=[['arch','Arrondies'],['square','Carrées'],['circle','Rondes'],['none','Aucune']];
function majCartes(){var t=S.P;
 $('tailles').innerHTML=D.tailles.map(function(q){var h=(q[4]+q[5]+3)/10;return '<button type="button" class="ms-carte'+(q[0]===S.taille?' on':'')+'" data-id="'+q[0]+'" aria-pressed="'+(q[0]===S.taille)+'"><b style="font-size:.9rem">'+q[1]+'</b><small>'+fr(q[2]/10)+' × '+fr(q[3]/10)+' cm<br>'+fr(h)+' cm de haut</small><small style="color:#7c6120;font-weight:700">'+eur(q[6])+'</small></button>'}).join('');
 grilleDessins('motifs','plusMotifs','front','toutM');$('dos').checked=!t.syncFaces;$('blocDos').hidden=t.syncFaces;if(!t.syncFaces)grilleDessins('motifsDos','plusDos','back','toutD');
 $('finsMotif').hidden=t.front==='none'&&(t.syncFaces||t.back==='none');
 cartes('decors',DECORS,t.decoration,function(id){return vigForme(id,3)});$('blocDecor').hidden=$('finsDecor').hidden=t.decoration==='none';
 cartes('fenetres',FENETRES,t.windowShape,vigFenetre);$('blocFen').hidden=t.windowShape==='none';
 $('droite').checked=!t.syncWindows;$('blocDroite').hidden=t.syncWindows;if(!t.syncWindows){cartes('fenetresD',FENETRES,t.rightWindow.windowShape,vigFenetre);$('blocFenD').hidden=t.rightWindow.windowShape==='none'}
 cartes('toits',[['oui','Tuiles gravées'],['non','Toit lisse']],t.tiles?'oui':'non',function(id){return '<svg viewBox="0 0 48 24" aria-hidden="true"><rect x="4" y="3" width="40" height="18" rx="1.5" fill="#dcb880" stroke="#8a6a3d" stroke-width=".6"/>'+(id==='oui'?'<path d="M4 9h40M4 15h40M12 3v6M22 3v6M32 3v6M17 9v6M27 9v6M37 9v6M12 15v6M22 15v6M32 15v6" stroke="#5b3d1f" stroke-width=".7" fill="none"/>':'')+'</svg>'});
 $('blocTuiles').hidden=!t.tiles;
 cartes('usages',[['ornament','À suspendre','un anneau et un fil blanc'],['lights','Sur une guirlande','un trou pour le fil']],t.topMode,function(id){return id==='ornament'
  ?'<svg viewBox="0 0 48 30" aria-hidden="true"><path d="M24 0v9" stroke="#b7ab97" stroke-width="1.4"/><circle cx="24" cy="12" r="3.2" fill="none" stroke="#a9793f" stroke-width="1.8"/><path d="M10 30L24 16L38 30Z" fill="#dcb880" stroke="#8a6a3d" stroke-width=".6"/></svg>'
  :'<svg viewBox="0 0 48 30" aria-hidden="true"><path d="M0 5Q24 12 48 5" stroke="#3d5a3a" stroke-width="1.4" fill="none"/><path d="M10 30L24 14L38 30Z" fill="#dcb880" stroke="#8a6a3d" stroke-width=".6"/><ellipse cx="24" cy="22" rx="3" ry="4.4" fill="#f6c66a"/></svg>'});
 $('finsAnneau').hidden=t.topMode!=='ornament';$('finsFil').hidden=t.topMode!=='lights';
 $('infoUsage').textContent=t.topMode==='lights'?'La guirlande n\'est pas fournie. Seulement des ampoules LED, qui ne chauffent pas ; jamais de bougie.':'La maisonnette est livrée avec son fil blanc.';
 document.querySelectorAll('[data-seg]').forEach(function(h){var c=h.getAttribute('data-seg'),o=obj(c),k=cle(c);h.innerHTML=[1,2,3].map(function(n){return '<button type="button" data-n="'+n+'" class="'+(o[k]===n?'on':'')+'" aria-pressed="'+(o[k]===n)+'">'+n+'</button>'}).join('')})}

/* ---- les curseurs : une clé « R.xxx » règle les fenêtres du côté droit ---- */
function obj(c){return c.indexOf('R.')===0?S.P.rightWindow:S.P}
function cle(c){return c.replace('R.','')}
function valeur(c){var k=cle(c),v=obj(c)[k];return k==='decorCount'?String(v):k==='topPosition'?v+' %':k==='windowFrame'&&v===0?'sans':(k==='fit'||k==='kerf')?fr(v,2)+' mm':fr(v)+' mm'}
document.querySelectorAll('[data-curs]').forEach(function(h){h.innerHTML=h.getAttribute('data-curs').split(',').map(function(c){var k=cle(c),l=LIM[k];
 return '<label><span class="tete"><span>'+LIB[k]+'</span><output data-o="'+c+'"></output></span><input type="range" data-r="'+c+'" min="'+l[0]+'" max="'+l[1]+'" step="'+(PAS[k]||.5)+'"></label>'}).join('');
 h.addEventListener('input',function(e){var c=e.target.getAttribute('data-r');if(!c)return;obj(c)[cle(c)]=+e.target.value;redessiner()})});
function reglages(){document.querySelectorAll('[data-r]').forEach(function(r){var c=r.getAttribute('data-r');if(document.activeElement!==r)r.value=obj(c)[cle(c)]});
 document.querySelectorAll('[data-o]').forEach(function(o){o.textContent=valeur(o.getAttribute('data-o'))})}

/* ---- le résumé, le prix, ce qui bloque ---- */
var ALERTES={disconnected:'Avec ces découpes, le bois serait trop fragile. Réduisez le dessin, les fenêtres ou les petites découpes.',
 kerfDetailLost:'Une découpe est trop fine pour être faite proprement. Agrandissez le dessin, ou choisissez-en un plus simple.',
 bulbFit:'L\'ampoule ne tient pas dans cette maisonnette. Prenez la taille au-dessus, ou indiquez une ampoule plus petite.'};
function resume(){var g=G,t=g.params,ta=taille(),nd=g.decors[0],fen=function(f){return f.windowShape==='none'?'sans fenêtre':f.windowRows*f.windowCols+' fenêtre'+(f.windowRows*f.windowCols>1?'s ':' ')+{arch:'arrondie',square:'carrée',circle:'ronde'}[f.windowShape]+(f.windowRows*f.windowCols>1?'s':'')};
 var l=[['Taille',ta[1]+' · '+fr(t.width/10)+' × '+fr(t.depth/10)+' cm, '+fr((t.wallHeight+t.roofHeight+t.thickness)/10)+' cm de haut'],['Façade',nomDessin(t.front)]];
 if(!t.syncFaces)l.push(['Arrière',nomDessin(t.back)]);
 l.push(['Autour',t.decoration==='none'||!t.decorCount?'Sans petite découpe':nd+' '+{star:'étoile',circle:'rond',heart:'cœur'}[t.decoration]+(nd>1?'s':'')]);
 l.push(['Côtés',t.syncWindows?fen(t)+' de chaque côté':'à gauche '+fen(t)+', à droite '+fen(t.rightWindow)]);
 l.push(['Toit',t.tiles?'Tuiles gravées':'Lisse']);l.push(['Accroche',t.topMode==='ornament'?'Anneau et fil blanc':'Sur une guirlande lumineuse (non fournie)']);
 l.push(['Matière','Contreplaqué de 3 mm, montée et collée dans notre atelier']);
 $('resume').innerHTML=l.map(function(r){return '<div class="prc-sumrow"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
 $('total').textContent=eur(ta[6]);$('prixtete').innerHTML='<span class="price">'+eur(D.tailles[0][6])+'</span> <span style="color:var(--ink-soft);font-size:.9rem">la petite maisonnette</span>';
 var m=g.warnings.length?ALERTES[g.warnings[0]]:'';$('manque').textContent=m;$('ajouter').disabled=!!m;
 $('infoDecor').textContent=t.decoration==='none'?'':nd<t.decorCount?nd+' sur '+t.decorCount+' : celles qui toucheraient le dessin, le bord ou un assemblage ne sont pas faites.':'';
 $('dim').textContent=fr(t.width/10)+' × '+fr(t.depth/10)+' cm · '+fr(g.hauteur/10)+' cm de haut'+(t.topMode==='ornament'?' avec l\'anneau':'')}

/* ---- les planches de l'atelier, à la taille réelle : les pièces rangées dans des feuilles de 19 cm ---- */
var NOMS={front:'Pignon de façade',back:'Pignon arrière',left:'Mur gauche',right:'Mur droit',base:'Base',roofLeft:'Pan de toit gauche',roofRight:'Pan de toit droit',hanger:'Poutre d\'accroche'};
function planches(){var g=G,Z=D.planche,Ec=4,rouge=' fill="none" stroke="#d32f2f" stroke-width=".3"',noir=' fill="none" stroke="#1a1206" stroke-width=".3"';
 var ps=g.cutParts.map(function(p,i){return {n:i+1,id:p.id,b:M.boite(p.rings),p:p}}),tri=ps.slice().sort(function(a,b){return b.b.h-a.b.h}),feuilles=[],trop=false;
 /* chaque pièce va dans la première rangée où elle tient, sinon dans une nouvelle rangée, sinon sur une nouvelle planche */
 tri.forEach(function(q){if(q.b.w>Z||q.b.h>Z)trop=true;var mis=false;
  feuilles.some(function(f){return f.rangs.some(function(r){if(r.x+q.b.w<=Z&&q.b.h<=r.h){f.l.push({q:q,x:r.x,y:r.y});r.x+=q.b.w+Ec;mis=true}return mis})||(function(){if(f.bas+q.b.h<=Z){f.rangs.push({x:q.b.w+Ec,y:f.bas,h:q.b.h});f.l.push({q:q,x:0,y:f.bas});f.bas+=q.b.h+Ec;mis=true}return mis})()});
  if(!mis){feuilles.push({l:[{q:q,x:0,y:0}],rangs:[{x:q.b.w+Ec,y:0,h:q.b.h}],bas:q.b.h+Ec})}});
 feuilles.forEach(function(f){f.w=0;f.h=0;f.l.forEach(function(o){f.w=Math.max(f.w,o.x+o.q.b.w);f.h=Math.max(f.h,o.y+o.q.b.h)})});
 $('planches').innerHTML=feuilles.map(function(fe,i){var h='';fe.l.forEach(function(o){var b=o.q.b,dx=o.x-b.x,dy=o.y-b.y;
   h+='<path d="'+M.chemin(o.q.p.rings,dx,dy)+'"'+rouge+'/>'+(o.q.p.scores.length?'<path d="'+M.chemin(o.q.p.scores,dx,dy,true)+'"'+noir+'/>':'')
    +'<g transform="translate('+(o.x+b.w/2).toFixed(1)+' '+(o.y+Math.min(b.h-5,b.h*.82)).toFixed(1)+')"><circle r="3.4" fill="#1a1206"/><text text-anchor="middle" dominant-baseline="central" font-size="3.8" font-weight="700" fill="#fff" font-family="sans-serif">'+o.q.n+'</text></g>'});
  return '<div class="sc-feuille"><h4>Contreplaqué '+fr(g.params.thickness)+' mm · planche '+(i+1)+' sur '+feuilles.length+' · '+fr(fe.w)+' × '+fr(fe.h)+' mm</h4><svg viewBox="-3 -3 '+(fe.w+6).toFixed(1)+' '+(fe.h+6).toFixed(1)+'" role="img" aria-label="Planche de découpe '+(i+1)+'">'+h+'</svg>'
   +'<p class="sc-fnom">'+fe.l.map(function(o){return o.q.n+' '+NOMS[o.q.id]}).sort().join(' · ')+'</p></div>'}).join('')+(trop?'<p class="al">Une pièce dépasse 19 cm : elle ne tient pas dans votre machine.</p>':'');
 return {feuilles:feuilles.length,trop:trop}}

/* ---- le montage, pièce après pièce ---- */
function etapes(){var o=G.params.topMode==='ornament';return [
 ['Préparer les pièces','Commencer par le pignon de façade.',['front']],
 ['Les deux murs','Emboîter les deux murs dans les crans du pignon de façade. Coller.',['left','right']],
 o?['La poutre d\'accroche','Glisser la poutre le long du faîte, dans la fente fermée du pignon de façade.',['hanger']]:null,
 ['Le pignon arrière','Fermer avec le pignon arrière, sur les tenons des murs'+(o?' et sur l\'autre bout de la poutre':'')+'. Coller.',['back']],
 ['La base','Poser la base : ses fentes prennent les pattes des murs et des pignons. Coller.',['base']],
 o?null:['La guirlande','Descendre l\'ampoule LED dans la maison, le fil dans l\'ouverture du faîte.',[]],
 ['Le premier pan du toit','L\'enfiler bien droit sur les deux tenons, au milieu des rampants.',['roofLeft']],
 ['Fermer le toit','Le second pan sur ses deux tenons, l\'encoche du faîte autour de la poutre ou du fil. Le toit peut rester amovible.',['roofRight']],
 ['C\'est monté','Laisser sécher la colle avant de suspendre.',[]]].filter(Boolean)}
function montage(){var e=etapes();S.pas=Math.max(0,Math.min(e.length-1,S.pas));var c=e[S.pas],vus=[];for(var i=0;i<=S.pas;i++)vus=vus.concat(e[i][2]);
 $('mTexte').innerHTML='<b>'+(S.pas+1)+' / '+e.length+' · '+c[0]+'</b>'+c[1];$('mPrec').disabled=S.pas===0;$('mSuiv').disabled=S.pas===e.length-1;
 $('mListe').innerHTML=e.map(function(q,i){return '<li class="'+(i===S.pas?'ici':'')+'">'+q[0]+' : '+q[1]+'</li>'}).join('');
 if(TROIS.ok){$('cMont').hidden=false;if(!VM)VM=scene3($('cMont'));var fin=S.pas===e.length-1,lampe=!fin&&G.params.topMode==='lights'&&vus.length>=4&&S.pas>=4;monter(VM,{voir:vus,neuf:fin?[]:c[2],fil:fin,lampe:fin||lampe})}}

/* ---- tout redessiner ---- */
function dessiner(){G=M.calculer(S.P);face();if(S.vue!=='face')trois();reglages();resume();planches();montage()}
var attente=false;function redessiner(){if(attente)return;attente=true;requestAnimationFrame(function(){attente=false;dessiner()})}
function tout(){majCartes();dessiner()}

/* ---- les gestes ---- */
function clic(hote,fn){$(hote).addEventListener('click',function(e){var b=e.target.closest('button');if(b){fn(b.getAttribute('data-id'));tout()}})}
clic('tailles',function(id){prendreTaille(id)});
clic('motifs',function(id){S.P.front=id});clic('motifsDos',function(id){S.P.back=id});
$('plusMotifs').addEventListener('click',function(){S.toutM=true;majCartes()});$('plusDos').addEventListener('click',function(){S.toutD=true;majCartes()});
$('dos').addEventListener('change',function(){S.P.syncFaces=!this.checked;if(this.checked&&S.P.back===S.P.front)S.P.back=S.P.front==='christmas_tree'?'star':'christmas_tree';tout()});
clic('decors',function(id){S.P.decoration=id;if(id!=='none'&&!S.P.decorCount)S.P.decorCount=6});
clic('fenetres',function(id){S.P.windowShape=id});clic('fenetresD',function(id){S.P.rightWindow.windowShape=id});
$('droite').addEventListener('change',function(){if(this.checked){var t=S.P;['windowShape','windowRows','windowCols','windowWidth','windowHeight','windowGap','windowFrame'].forEach(function(c){t.rightWindow[c]=t[c]})}S.P.syncWindows=!this.checked;tout()});
document.querySelectorAll('[data-seg]').forEach(function(h){h.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var c=h.getAttribute('data-seg');obj(c)[cle(c)]=+b.getAttribute('data-n');tout()})});
clic('toits',function(id){S.P.tiles=id==='oui'});clic('usages',function(id){S.P.topMode=id});
$('vFace').addEventListener('click',function(){S.choisie=true;vue('face')});$('v3d').addEventListener('click',function(){S.choisie=true;vue('3d')});$('vPieces').addEventListener('click',function(){S.choisie=true;vue('pieces')});
$('mPrec').addEventListener('click',function(){S.pas--;montage()});$('mSuiv').addEventListener('click',function(){S.pas++;montage()});
window.addEventListener('resize',function(){if(V3&&S.vue!=='face')cadrer(V3);if(VM)cadrer(VM)});
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

tout();S.pas=etapes().length-1;montage();vue('face');
/* la 3D se charge après : dès qu'elle est là, c'est elle qu'on montre (sauf si la cliente a déjà choisi une vue) */
charger3(function(){montage();if(!S.choisie)vue('3d')});
window.msAtelier={S:S,dessiner:dessiner,maj:tout,vue:vue};
window.msEtat=function(){var p=planches();return{S:S,trois:TROIS.ok,vue:S.vue,pieces:G.parts.length,alertes:G.warnings,decors:G.decors,hauteur:G.hauteur,planches:p.feuilles,trop:p.trop,
 total:taille()[6],bloque:$('ajouter').disabled,manque:$('manque').textContent}};
})();
"""

clip = open(fclip, encoding="utf-8").read()
geo = open(os.path.join(ici, "maison-geo.js"), encoding="utf-8").read()
assert "</script" not in clip and "</script" not in geo
page = (tete + "<style>" + CSS + "</style>" + MAIN.replace("__FIL__", fil) + pied
        + "<script>" + clip + "</script><script>" + geo + "</script><script>" + JS.replace("__DONNEES__", DONNEES) + "</script>\n")
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko")
