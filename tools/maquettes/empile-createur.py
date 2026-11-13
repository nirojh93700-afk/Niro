#!/usr/bin/env python3
"""Maquette « Créez votre suspension à prénoms » (12/11/2026) — RIEN en ligne.

Le gérant : le même outil que https://www.atomm.com/creativetools/community/generator/create-your-stack/ (« Analyse bien »),
puis « 170mm » = la suspension ne dépasse jamais 170 mm de haut. Une forme par prénom, empilées de haut en bas et soudées,
en deux pièces : le fond (formes pleines + anneau, prénoms gravés) et le devant (le même contour évidé), collé dessus.
Mêmes formes, mêmes écritures et mêmes trois réglages que l'outil d'Atomm ; même calcul (paper.js, version figée).

  python3 tools/maquettes/empile-createur.py <page de base> <formes.json> <dossier de sortie>

<page de base> = la sortie d'un autre créateur (arbre-createur.py par exemple) : on en garde l'habillage du site.
<formes.json> = la sortie de empile-formes.cjs (les 21 formes à leur taille de travail).
"""
import json, os, re, sys

base, formes, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Suspension à prénoms</title>", tete, count=1, flags=re.S)
liens = re.findall(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', tete)
FONTS = ("https://fonts.googleapis.com/css2?family=Twinkle+Star&family=Grand+Hotel&family=Courgette&family=Dancing+Script:wght@600&family=Fredoka:wght@500"
         "&family=Lobster+Two:wght@700&family=Luckiest+Guy&family=Montserrat:wght@600&family=Pacifico&family=Patua+One&family=Sniglet:wght@800"
         "&family=Special+Elite&family=Viga&display=swap")
assert len(liens) >= 2
tete = tete.replace(liens[1], f'<link rel="stylesheet" href="{FONTS}">')
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · suspension à prénoms, d'après le générateur « Create Your Stack » d'Atomm. Rien n'est en ligne, rien n'est vendu.\2", tete, count=1, flags=re.S)
fil = re.search(r"<nav class=\"container\".*?</nav>", s[i_main:j_main], flags=re.S)
fil = fil.group(0) if fil else ""
logo = re.search(r'<div class="sc-mur"[^>]*><img src="([^"]+)"', s)
LOGO = logo.group(1) if logo else ""
PAPER = "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"

F = json.load(open(formes, encoding="utf-8"))
NOMS = [["heart", "Cœur"], ["flower", "Fleur"], ["ornamental", "Ornement"], ["shield", "Écusson"], ["hex", "Hexagone"], ["diamond", "Diamant"],
        ["droplet", "Goutte"], ["cloud", "Nuage"], ["shell", "Coquillage"], ["bell", "Cloche"], ["tree", "Sapin"], ["ball", "Boule de Noël"],
        ["star", "Étoile"], ["house", "Maison"], ["canal", "Maison à pignon"], ["scallop", "Feston"], ["skull", "Crâne"], ["ghost", "Fantôme"],
        ["circle", "Cercle"], ["ellipse", "Ovale"], ["egg", "Œuf"]]
assert sorted(k for k, _ in NOMS) == sorted(F)
# [id, nom, famille CSS (celle d'Atomm), graisse chargée, 1 = écriture « cursive » (Atomm lui laisse 25 % de largeur en plus)]
POL = [["arial", "Arial", "Arial, sans-serif", 400, 0], ["fredoka", "Fredoka", "'Fredoka', sans-serif", 500, 0], ["twinkle", "Twinkle Star", "'Twinkle Star', cursive", 400, 1],
       ["sniglet", "Sniglet", "'Sniglet', cursive", 800, 1], ["grand", "Grand Hotel", "'Grand Hotel', cursive", 400, 1], ["luckiest", "Luckiest Guy", "'Luckiest Guy', cursive", 400, 1],
       ["pacifico", "Pacifico", "'Pacifico', cursive", 400, 1], ["courgette", "Courgette", "'Courgette', cursive", 400, 1], ["dancing", "Dancing Script", "'Dancing Script', cursive", 600, 1],
       ["montserrat", "Montserrat", "'Montserrat', sans-serif", 600, 0], ["patua", "Patua One", "'Patua One', serif", 400, 0], ["lobster2", "Lobster Two", "'Lobster Two', cursive", 700, 1],
       ["elite", "Special Elite", "'Special Elite', cursive", 400, 1], ["viga", "Viga", "'Viga', sans-serif", 400, 0]]

DONNEES = json.dumps({
    "formes": F, "ordre": NOMS, "pol": POL, "logo": LOGO,
    "haut": 170, "max": 8, "lettres": 14, "prix": 12.9, "compris": 2, "plus": 3}, ensure_ascii=False, separators=(",", ":"))

CSS = r"""
.ep-formes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (min-width:900px){.ep-formes{grid-template-columns:repeat(5,minmax(0,1fr))}}
.ep-forme{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 3px 6px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);
cursor:pointer;font:inherit;color:var(--ink);text-align:center;min-width:0}
.ep-forme svg{display:block;width:100%;height:62px}
.ep-forme b{font-size:.7rem;line-height:1.15;font-weight:600;overflow-wrap:anywhere}
.ep-forme.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.ep-plus{display:block;width:100%;margin-top:8px;min-height:44px;border:1.5px dashed var(--line);border-radius:12px;background:transparent;font:inherit;font-weight:600;font-size:.86rem;color:var(--ink);cursor:pointer}
.ep-nom{display:flex;align-items:center;gap:5px;margin-bottom:8px}
.ep-nom .num{flex:none;width:26px;height:26px;border-radius:50%;background:#f3e8d3;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;color:#7c6120}
.ep-nom input{flex:1;min-width:0;min-height:44px;padding:9px 11px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:1rem;background:#fff;color:var(--ink)}
.ep-nom input:focus{outline:2px solid var(--gold);outline-offset:1px}
.ep-nom.sel input{border-color:var(--gold-dark)}
.ep-nom button{flex:none;width:36px;height:44px;border:1.5px solid var(--line);border-radius:10px;background:#fff;font:inherit;font-size:1rem;cursor:pointer;color:var(--ink);padding:0}
.ep-nom button:disabled{opacity:.35;cursor:default}
.ep-pols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ep-pol{min-height:54px;padding:6px 10px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;color:var(--ink);font-size:1.2rem;line-height:1.15;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ep-pol small{display:block;font:500 .68rem Inter,system-ui,sans-serif;color:var(--ink-soft)}
.ep-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.ep-regl{display:grid;gap:16px}
.ep-regl label{display:block}
.ep-regl .tete{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-weight:600;font-size:.92rem}
.ep-regl .tete output{font-weight:600;color:#7c6120;font-size:.86rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.ep-regl input[type=range]{display:block;width:100%;margin:6px 0 0;min-height:34px;accent-color:#a98935}
.ep-regl small{display:block;color:var(--ink-soft);font-size:.78rem;line-height:1.35;margin-top:2px}
.ep-dim{position:absolute;left:10px;bottom:10px;z-index:3;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink)}
.ep-dim.trop{color:#b4452f;border-color:#b4452f}
.ep-stage svg text{user-select:none}
.ep-feuilles{display:grid;gap:14px}
.ep-feuilles h4{margin:0 0 6px;font:600 .92rem Inter,system-ui,sans-serif}
.ep-feuilles .al{color:#b4452f;font-size:.82rem;font-weight:600;margin:6px 0 0}
"""

MAIN = r"""<main>
__FIL__
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage ep-stage" id="stage" data-vue="creation"><span class="sc-tag">Votre suspension, en direct</span>
   <div class="sc-mur" aria-hidden="true"><img src="__LOGO__" alt=""></div>
   <svg id="scene" viewBox="-40 -50 80 200" role="img" aria-label="Aperçu de votre suspension à prénoms"></svg>
   <p class="ab-charge" id="chargement" hidden>L'aperçu n'a pas pu se charger.</p>
   <span class="ep-dim" id="dim"></span></div>
  <p class="sc-aide" id="aide"></p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Maison &amp; Déco</a></div>
  <div class="pd-titrerow"><h1>Suspension à prénoms : une forme par prénom, à accrocher</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">Écrivez les prénoms de la famille : chacun a sa forme, gravée à son nom, et toutes les formes sont reliées en une seule suspension en bois.</p>
  <div class="price-lead" id="prixtete"></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre suspension</p><p class="prc-sub">Cinq petites étapes. La suspension se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">1</span><h3>Les prénoms</h3></div>
  <p class="prc-legend">Un prénom par forme, de haut en bas. Chaque prénom ajouté fait apparaître sa forme.</p>
  <div id="listeNoms"></div>
  <button type="button" class="ab-ajout" id="ajoutNom"></button>
  <p class="prc-hint" id="infoNoms"></p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">2</span><h3>La forme</h3></div>
  <p class="prc-legend">La même forme pour tous les prénoms.</p>
  <div class="ep-formes" id="formes"></div>
  <button type="button" class="ep-plus" id="plusFormes" hidden></button>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>L'écriture</h3></div>
  <div class="ep-pols" id="pols"></div>
  <button type="button" class="ep-plus" id="plusPols" hidden></button>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>Les réglages</h3></div>
  <div class="ep-regl">
   <label><span class="tete"><span>Taille des prénoms</span><output id="vTexte"></output></span>
    <input type="range" id="rTexte" min="20" max="100" step="2" aria-label="Taille des prénoms">
    <small id="iTexte"></small></label>
   <label><span class="tete"><span>Rapprocher les formes</span><output id="vRappr"></output></span>
    <input type="range" id="rRappr" min="0" max="20" step="0.5" aria-label="Rapprocher les formes">
    <small id="iRappr"></small></label>
   <label><span class="tete"><span>Bordure du fond</span><output id="vFond"></output></span>
    <input type="range" id="rFond" min="100" max="140" step="5" aria-label="Bordure du fond">
    <small>Le fond peut dépasser autour des cadres et faire une bordure.</small></label>
  </div>
  <p class="prc-hint prc-miss" id="alertePetit" style="margin:10px 0 0"></p>
 </section>
 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>Votre commande</h3></div>
  <div class="prc-sum" id="resume"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
 </div>
</div></div>

<section class="sc-atelier"><div class="container">
 <h2>De votre côté : deux pièces à découper, puis à coller</h2>
 <p>À la commande, le site range dans le dossier de la commande la planche à la taille réelle. Elle change en direct quand vous modifiez la suspension au-dessus.</p>
 <div class="sc-agrid">
  <div class="ep-feuilles" id="feuilles"></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : à graver</li></ul>
   <ul class="sc-points">
    <li><b>Les formes du générateur d'Atomm</b>Les 21 formes de leur outil, à la même taille, soudées de la même façon (une forme par prénom, anneau en haut).</li>
    <li><b>Deux pièces</b>1. Le fond : toutes les formes pleines, soudées, avec l'anneau ; les prénoms sont gravés dessus. 2. Le devant : le même contour, évidé au milieu de chaque forme.</li>
    <li><b>L'ordre du travail</b>Graver les prénoms sur le fond, découper les deux pièces, coller le devant sur le fond (les prénoms apparaissent dans les fenêtres), passer le fil dans l'anneau.</li>
    <li><b>Jamais plus de 17 cm</b>La suspension ne dépasse pas 170 mm de haut : au-delà, les formes se rapprochent toutes seules, puis le nombre de prénoms est limité.</li>
    <li><b>Les prénoms</b>Tous à la même taille : c'est le prénom le plus long qui la fixe. Dans le fichier, les prénoms seront en tracés.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>« 170 mm » compris comme la hauteur maximale de la suspension, anneau compris.</li>
  <li>Prix proposés par moi : 12,90 € avec deux prénoms, puis + 3 € par prénom en plus (comme l'arbre de vie).</li>
  <li>Les deux pièces en contreplaqué 3 mm. Atomm ne propose aucune matière.</li>
  <li>Les trois réglages d'Atomm sont laissés à la cliente (taille des prénoms, formes rapprochées, bordure du fond). Vous pouvez en retirer.</li>
  <li>Les 14 écritures sont celles d'Atomm, pas les 8 du site.</li>
  <li>Comme Atomm : une seule forme pour toute la suspension, pas de dessin, pas de photo. La vue 3D n'est pas faite.</li>
 </ul></div>
</div></section>
</main>"""

JS = r"""
(function(){
var D=__DONNEES__,$=function(i){return document.getElementById(i)};
var S={forme:'heart',pol:'pacifico',noms:['Camille','Léa','Paul'],sel:0,texte:85,rappr:0,fond:100,toutF:false,toutP:false};
var CV=document.createElement('canvas').getContext('2d'),pretes={arial:true},OK=typeof paper!=='undefined',cache={};
if(OK){paper.setup(new paper.Size(10,10));if(paper.view)paper.view.autoUpdate=false}else $('chargement').hidden=false;
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
function fr(v){return (Math.round(v*10)/10).toFixed(1).replace('.',',')}
function forme(id){return D.formes[id||S.forme]}
function nomForme(id){return D.ordre.filter(function(o){return o[0]===(id||S.forme)})[0][1]}
function pol(){return D.pol.filter(function(p){return p[0]===S.pol})[0]}
function ecrit(n){return String(n==null?'':n).trim()}
function enCours(){return ecrit(S.noms[S.sel])||'Prénom'} /* rien d'écrit : « Prénom » */

/* ---- les mesures : mêmes règles que l'outil d'Atomm ---- */
function em(t,p){CV.font=p[3]+' 100px '+p[2];return CV.measureText(t).width/100}
function xh(p){CV.font=p[3]+' 100px '+p[2];var m=CV.measureText('x');return (m.actualBoundingBoxAscent||50)/100}
function limite(f,t,p){var w=em(t,p);return Math.min(w>0?f.ib[2]*.82*(p[4]?1.25:1)/w:40,f.ib[3]*.8)}
function h1(f,back){return back*(f.ob[1]+f.ob[3]-Math.min(f.ob[1],f.ob[1]+f.ey-4.5))}
function pas(){var f=forme(),n=S.noms.length,back=S.fond/100,voulu=f.pas-S.rappr,mini=f.pas-20,H1=h1(f,back),st=voulu,serre=false,trop=false;
 if(n>1){var mx=Math.floor((D.haut-H1)/(n-1)*10)/10;if(mx<st){st=mx;serre=true}if(st<mini){st=mini;trop=true}}
 return{st:st,voulu:voulu,serre:serre,trop:trop,H:H1+(n-1)*st,nmax:Math.max(1,Math.min(D.max,Math.floor((D.haut-H1)/mini)+1))}}
function police(st){var f=forme(),p=pol(),lim=1e9;S.noms.forEach(function(n){lim=Math.min(lim,limite(f,ecrit(n)||'Prénom',p))});
 var fs=Math.round(Math.max(2,lim)*S.texte/100*2)/2;
 if(S.noms.length>1)fs=Math.min(fs,Math.floor(st*.85*2)/2); /* garde-fou : deux prénoms ne se touchent jamais */
 return fs}

/* ---- les deux pièces (paper.js, comme Atomm) : le fond et le devant, en mm, origine au milieu de la première forme ---- */
function construire(){var f=forme(),n=S.noms.length,P=pas(),st=P.st,back=S.fond/100,cle=[S.forme,n,st,back].join('|');
 if(cache[cle])return cache[cle];if(!OK)return null;
 paper.project.clear();var fond=null,ext=null,int=null,i,p,t,ey=f.ob[1]+f.ey;
 for(i=0;i<n;i++){p=paper.PathItem.create(f.o);p.translate(new paper.Point(0,i*st));
  if(i===0){var a=new paper.Path.Circle({center:[0,ey],radius:4.5}),b=new paper.Path.Circle({center:[0,ey],radius:1.9});p=p.unite(a);p=p.subtract(b)}
  p.scale(back,new paper.Point(0,i*st));fond=fond?fond.unite(p):p}
 for(i=0;i<n;i++){p=paper.PathItem.create(f.o);p.translate(new paper.Point(0,i*st));ext=ext?ext.unite(p):p;
  t=paper.PathItem.create(f.i);t.translate(new paper.Point(0,i*st));int=int?int.unite(t):t}
 var dev=ext.subtract(int),fb=fond.bounds,db=dev.bounds;
 var G={fond:fond.pathData,fb:[fb.x,fb.y,fb.width,fb.height],dev:dev.pathData,db:[db.x,db.y,db.width,db.height],trou:ey*back,st:st};
 paper.project.clear();cache={};cache[cle]=G;return G}
function textes(G,fs,opt){var f=forme(),p=pol(),dy=xh(p)*fs/2,h='';
 S.noms.forEach(function(n,i){var t=ecrit(n),y=f.ib[1]+f.ib[3]/2+f.ty+i*G.st+dy;if(!t&&opt.noir)return;
  h+='<text x="0" y="'+y.toFixed(2)+'" text-anchor="middle" font-family="'+p[2]+'" font-weight="'+p[3]+'" font-size="'+fs+'" fill="'+(opt.noir?'#111':'#3a2a1c')+'"'+(t?'':' opacity=".3"')+'>'+esc(t||'Prénom')+'</text>'});
 return h}

/* ---- l'aperçu ---- */
function defs(){return '<defs><linearGradient id="g-fond" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f3e4c4"/><stop offset=".5" stop-color="#ead7b0"/><stop offset="1" stop-color="#f3e4c4"/></linearGradient>'
 +'<linearGradient id="g-dev" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dcbb8a"/><stop offset="1" stop-color="#c79f6c"/></linearGradient></defs>'}
function dessiner(){var sc=$('scene'),G=construire(),P=pas();
 if(!G){sc.innerHTML='';resume(P,0);return}
 var fs=police(G.st),b=G.fb,m=9,fil='M0,'+(G.trou-1.2)+'L0,'+(b[1]-70);
 sc.setAttribute('viewBox',(b[0]-m).toFixed(1)+' '+(b[1]-m-10).toFixed(1)+' '+(b[2]+2*m).toFixed(1)+' '+(b[3]+2*m+10).toFixed(1));
 sc.innerHTML=defs()+'<path d="'+fil+'" stroke="#b9a788" stroke-width="1.5" fill="none" opacity=".75"/><path d="'+fil+'" stroke="#ffffff" stroke-width="1" fill="none"/>'
  +'<path d="'+G.fond+'" fill="#5b4326" opacity=".26" transform="translate(.9 1.6)"/><path d="'+G.fond+'" fill="url(#g-fond)" stroke="#b89773" stroke-width=".3"/>'
  +textes(G,fs,{})
  +'<path d="'+G.dev+'" fill="#5b4326" opacity=".3" transform="translate(.5 1)"/><path d="'+G.dev+'" fill="url(#g-dev)" stroke="#8a6234" stroke-width=".3"/>';
 var d=$('dim');d.textContent='≈ '+fr(b[2]/10)+' × '+fr(b[3]/10)+' cm'+(P.trop?' · trop haut':'');d.classList.toggle('trop',P.trop);
 $('aide').textContent=P.trop?'':P.serre?'Les formes ont été rapprochées toutes seules pour que la suspension tienne dans 17 cm de haut.':'Les prénoms sont gravés sur le fond ; le cadre de chaque forme est collé par-dessus.';
 reglages(P,fs);resume(P,fs);feuilles(G,fs,P)}

/* ---- étape 1 : les prénoms ---- */
function majNoms(){var n=S.noms.length;
 $('listeNoms').innerHTML=S.noms.map(function(v,i){return '<div class="ep-nom'+(i===S.sel?' sel':'')+'"><span class="num">'+(i+1)+'</span>'
  +'<input type="text" maxlength="'+D.lettres+'" value="'+esc(v)+'" data-i="'+i+'" placeholder="Prénom" aria-label="Prénom '+(i+1)+'" autocapitalize="words" autocomplete="off" spellcheck="false">'
  +(n>1?'<button type="button" data-h="'+i+'" aria-label="Monter ce prénom"'+(i===0?' disabled':'')+'>↑</button><button type="button" data-b="'+i+'" aria-label="Descendre ce prénom"'+(i===n-1?' disabled':'')+'>↓</button>'
   +'<button type="button" data-x="'+i+'" aria-label="Retirer ce prénom">✕</button>':'')+'</div>'}).join('');
 majAjout()}
function majAjout(){var P=pas(),n=S.noms.length,plein=n>=P.nmax,b=$('ajoutNom');b.disabled=plein;
 b.textContent=plein?(P.nmax>=D.max?D.max+' prénoms au maximum':P.nmax+' prénom'+(P.nmax>1?'s':'')+' au maximum avec cette forme'):'+ Ajouter un prénom';
 $('infoNoms').textContent=plein&&P.nmax<D.max?'Au-delà, la suspension dépasserait 17 cm de haut.':D.lettres+' lettres au plus par prénom.'}
$('listeNoms').addEventListener('input',function(ev){var i=ev.target.getAttribute('data-i');if(i==null)return;S.noms[+i]=ev.target.value;S.sel=+i;suivre();dessiner()});
$('listeNoms').addEventListener('focusin',function(ev){var i=ev.target.getAttribute('data-i');if(i==null||+i===S.sel)return;S.sel=+i;
 [].forEach.call($('listeNoms').children,function(c,j){c.classList.toggle('sel',j===S.sel)});suivre()});
$('listeNoms').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var i,j;
 if(b.hasAttribute('data-x')){S.noms.splice(+b.getAttribute('data-x'),1);S.sel=Math.min(S.sel,S.noms.length-1)}
 else{i=+(b.getAttribute('data-h')||b.getAttribute('data-b'));j=b.hasAttribute('data-h')?i-1:i+1;if(j<0||j>=S.noms.length)return;var t=S.noms[i];S.noms[i]=S.noms[j];S.noms[j]=t;S.sel=j}
 majNoms();suivre();dessiner()});
$('ajoutNom').addEventListener('click',function(){if(S.noms.length>=pas().nmax)return;S.noms.push('');S.sel=S.noms.length-1;majNoms();suivre();dessiner();var c=$('listeNoms').querySelectorAll('input');c[c.length-1].focus()});

/* ---- étape 2 : les formes ; chaque vignette porte le prénom en cours, dans l'écriture choisie ---- */
var VUES=8,cleF='',cleP='';
function vignette(id){var f=D.formes[id],p=pol(),t=enCours(),fs=Math.max(2,limite(f,t,p))*.85,y=f.ib[1]+f.ib[3]/2+f.ty+xh(p)*fs/2,b=f.ob,m=3;
 return '<svg viewBox="'+(b[0]-m)+' '+(b[1]-m)+' '+(b[2]+2*m)+' '+(b[3]+2*m)+'" aria-hidden="true"><path d="'+f.o+'" fill="#d2ab78"/><path d="'+f.i+'" fill="#f3e4c4"/>'
  +'<text x="0" y="'+y.toFixed(2)+'" text-anchor="middle" font-family="'+p[2]+'" font-weight="'+p[3]+'" font-size="'+fs.toFixed(2)+'" fill="#3a2a1c">'+esc(t)+'</text></svg>'}
function majFormes(force){var c=[enCours(),S.pol,S.forme,S.toutF,pretes[S.pol]?1:0].join('|');if(!force&&c===cleF)return;cleF=c;
 var rang=D.ordre.map(function(o){return o[0]}).indexOf(S.forme),tout=S.toutF||rang>=VUES,L=tout?D.ordre:D.ordre.slice(0,VUES);
 $('formes').innerHTML=L.map(function(o){return '<button type="button" class="ep-forme'+(o[0]===S.forme?' on':'')+'" data-v="'+o[0]+'" aria-pressed="'+(o[0]===S.forme)+'">'+vignette(o[0])+'<b>'+esc(o[1])+'</b></button>'}).join('');
 var b=$('plusFormes');b.hidden=tout;b.textContent='Voir les '+(D.ordre.length-VUES)+' autres formes'}
$('formes').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.forme=b.getAttribute('data-v');majFormes();majNoms();dessiner()});
$('plusFormes').addEventListener('click',function(){S.toutF=true;majFormes()});

/* ---- étape 3 : les écritures, avec le prénom en cours ---- */
var VUESP=8;
function majPols(force){var c=[enCours(),S.pol,S.toutP].join('|');if(!force&&c===cleP)return;cleP=c;
 var rang=D.pol.map(function(p){return p[0]}).indexOf(S.pol),tout=S.toutP||rang>=VUESP,L=tout?D.pol:D.pol.slice(0,VUESP),t=enCours();
 $('pols').innerHTML=L.map(function(p){return '<button type="button" class="ep-pol'+(p[0]===S.pol?' on':'')+'" data-v="'+p[0]+'" aria-pressed="'+(p[0]===S.pol)+'" style="font-family:'+p[2].replace(/"/g,'')+';font-weight:'+p[3]+'">'+esc(t)+'<small>'+esc(p[1])+'</small></button>'}).join('');
 var b=$('plusPols');b.hidden=tout;b.textContent='Voir les '+(D.pol.length-VUESP)+' autres écritures'}
$('pols').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.pol=b.getAttribute('data-v');majPols();attendrePolice()});
$('plusPols').addEventListener('click',function(){S.toutP=true;majPols()});
function suivre(){majFormes();majPols()}
function attendrePolice(essai){var p=pol();majFormes();dessiner();if(pretes[p[0]])return;
 function pret(){pretes[p[0]]=true;if(p[0]===S.pol){majFormes(true);dessiner()}}
 if(!(document.fonts&&document.fonts.load)){pret();return}
 document.fonts.load(p[3]+' 100px '+p[2],'Aé').then(function(L){if(L&&L.length||(essai||0)>12)pret();else setTimeout(function(){attendrePolice((essai||0)+1)},350)},pret)}

/* ---- étape 4 : les trois réglages d'Atomm ---- */
function reglages(P,fs){var f=forme();
 $('rTexte').value=S.texte;$('rRappr').value=S.rappr;$('rFond').value=S.fond;
 $('vTexte').textContent=S.texte+' %';$('iTexte').textContent='Tous les prénoms ont la même taille : le plus long la fixe. Lettres d\'environ '+fr(fs*xh(pol()))+' mm de haut.';
 var reel=f.pas-P.st;$('vRappr').textContent=fr(reel)+' mm';
 $('iRappr').textContent=S.noms.length<2?'Sert dès le deuxième prénom.':P.serre?'Déjà rapprochées de '+fr(reel)+' mm pour tenir dans 17 cm.':'Les formes se chevauchent pour une suspension plus courte.';
 $('vFond').textContent=S.fond>100?'≈ '+fr((S.fond/100-1)*f.ob[2]/2)+' mm':'aucune';
 var e=S.noms.map(ecrit).filter(Boolean),long=e.slice().sort(function(a,b){return b.length-a.length})[0];
 $('alertePetit').textContent=e.length&&fs<5?'« '+long+' » est long pour cette forme : tous les prénoms seront gravés petit. Une forme plus large (ovale, nuage, cœur) leur donne plus de place.':''}
$('rTexte').addEventListener('input',function(){S.texte=+this.value;dessiner()});
$('rRappr').addEventListener('input',function(){S.rappr=+this.value;majAjout();dessiner()});
$('rFond').addEventListener('input',function(){S.fond=+this.value;majAjout();dessiner()});

/* ---- le prix, le résumé ---- */
function total(){return D.prix+Math.max(0,S.noms.length-D.compris)*D.plus}
function resume(P,fs){var n=S.noms.length,e=S.noms.map(ecrit),vide=e.some(function(t){return !t}),L=[];
 L.push(['Forme',nomForme()]);L.push(['Prénom'+(n>1?'s':''),e.filter(Boolean).join(', ')||'à écrire']);L.push(['Écriture',pol()[1]]);
 L.push(['Taille','environ '+fr(P.H/10)+' cm de haut']);L.push(['Matière','Contreplaqué de 3 mm']);
 L.push(['Prix',n<=D.compris?eur(D.prix)+' ('+D.compris+' prénoms compris)':eur(D.prix)+' + '+(n-D.compris)+' prénom'+(n-D.compris>1?'s':'')+' à '+D.plus+' €']);
 $('resume').innerHTML=L.map(function(l){return '<div class="prc-sumrow"><span>'+esc(l[0])+'</span><b>'+esc(l[1])+'</b></div>'}).join('');
 $('total').textContent=eur(total());
 $('prixtete').innerHTML='<span class="price-sale">'+eur(D.prix)+'</span> <span style="font-size:.85rem;color:var(--ink-soft)">avec '+D.compris+' prénoms · + '+D.plus+' € par prénom en plus</span>';
 $('manque').textContent=P.trop?'Trop haut : '+P.nmax+' prénom'+(P.nmax>1?'s':'')+' au plus tiennent dans 17 cm avec cette forme et cette bordure. Retirez un prénom ou réduisez la bordure.':vide?'Il manque un prénom.':!OK?'L\'aperçu n\'a pas pu se charger.':'';
 $('ajouter').disabled=P.trop||vide||!OK}

/* ---- la planche de l'atelier, à la taille réelle : le fond à gauche, le devant à droite ---- */
function feuilles(G,fs,P){var E=6,rouge=' fill="none" stroke="#d32f2f" stroke-width=".35"';
 var pieces=[{n:1,nom:'le fond (prénoms gravés, anneau)',b:G.fb,h:'<path d="'+G.fond+'"'+rouge+'/>'+textes(G,fs,{noir:true})},{n:2,nom:'le devant (cadres), à coller sur le fond',b:G.db,h:'<path d="'+G.dev+'"'+rouge+'/>'}];
 var W=G.fb[2]+E+G.db[2],pages=W<=200?[pieces]:[[pieces[0]],[pieces[1]]],out='';
 pages.forEach(function(pg,k){var x=0,H=0,h='',noms=[];
  pg.forEach(function(p){h+='<g transform="translate('+(x-p.b[0]).toFixed(2)+' '+(-p.b[1]).toFixed(2)+')">'+p.h+'</g>'
    +'<g transform="translate('+(x+p.b[2]/2).toFixed(2)+' '+(p.b[3]+7).toFixed(2)+')"><circle r="3.4" fill="#1a1206"/><text text-anchor="middle" dominant-baseline="central" font-size="3.8" font-weight="700" fill="#fff" font-family="sans-serif">'+p.n+'</text></g>';
   noms.push(p.n+' '+p.nom);x+=p.b[2]+E;H=Math.max(H,p.b[3])});
  var L=x-E;
  out+='<div class="sc-feuille"><h4>Contreplaqué 3 mm'+(pages.length>1?' · planche '+(k+1)+' sur '+pages.length:'')+' · '+fr(L)+' × '+fr(H)+' mm</h4>'
   +'<svg viewBox="-4 -4 '+(L+8).toFixed(1)+' '+(H+18).toFixed(1)+'" style="max-height:420px" role="img" aria-label="Planche de découpe">'+h+'</svg>'
   +'<p class="sc-fnom">'+noms.join(' · ')+'</p>'+(L>200||H>200?'<p class="al">Cette planche dépasse 200 × 200 mm.</p>':'')+(P.trop?'<p class="al">La suspension dépasse 170 mm de haut.</p>':'')+'</div>'});
 $('feuilles').innerHTML=out}

majNoms();majFormes();majPols();attendrePolice();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){majFormes(true);majPols(true);dessiner()});
window.epAtelier={S:S,dessiner:dessiner,maj:function(){majNoms();majFormes(true);majPols(true);dessiner()}};
window.epEtat=function(){var P=pas(),G=construire();return{S:S,ok:OK,pas:P,fs:G?police(G.st):0,fb:G&&G.fb,db:G&&G.db,total:total(),bloque:$('ajouter').disabled}};
})();
"""

page = (tete + "<style>" + CSS + "</style>" + MAIN.replace("__FIL__", fil).replace("__LOGO__", LOGO) + pied
        + f'<script src="{PAPER}"></script>' + "<script>" + JS.replace("__DONNEES__", DONNEES) + "</script>\n")
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko")
