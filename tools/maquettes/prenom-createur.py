#!/usr/bin/env python3
"""Maquette « Créez votre décoration à prénom » (12/11/2026) — RIEN en ligne.

Le gérant : le même outil que https://www.atomm.com/creativetools/community/generator/personalized-holiday-name-ornament/
(« analyse bien le nouveau truc, il faut que ça soit fait correctement »). Une grande initiale (4 polices), décorée en renne,
bonnet de Père Noël, oreilles de lapin ou cornes, en deux couches : un fond (lettre + bordure + décor + anneau) et un devant
(la lettre) où le prénom est gravé, placé tout seul dans la lettre. Les formes viennent de l'outil d'Atomm ouvert dans le
navigateur (prenom-atomm-releve.cjs → prenom-atomm-donnees.py) : publiées à côté de la page (formes/), chargées à la demande.

  python3 tools/maquettes/prenom-createur.py <page de base> <dossier formes> <dossier de sortie>

<page de base> = la sortie d'un des trois autres créateurs (arbre-createur.py par exemple) : on en garde l'habillage du site
(en-tête, pied de page, feuilles de style) ; tout le reste est écrit ici.
"""
import json, os, re, shutil, sys

base, formes, out = sys.argv[1:4]
os.makedirs(os.path.join(out, "formes"), exist_ok=True)
for n in sorted(os.listdir(formes)):
    if n.endswith(".json"):
        shutil.copy(os.path.join(formes, n), os.path.join(out, "formes", n))

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Décoration à prénom</title>", tete, count=1, flags=re.S)
liens = re.findall(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', tete)
FONTS = ("https://fonts.googleapis.com/css2?family=Lilita+One&family=Titan+One&family=Paytone+One&family=Alfa+Slab+One&family=Pacifico&family=Lobster"
         "&family=Courgette&family=Satisfy&family=Lora:wght@600&family=Bree+Serif&family=Arvo&family=Lato:wght@700&display=swap")
assert len(liens) >= 2
tete = tete.replace(liens[1], f'<link rel="stylesheet" href="{FONTS}">')
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · décoration à prénom, d'après le générateur d'Atomm. Rien n'est en ligne, rien n'est vendu.\2", tete, count=1, flags=re.S)
fil = re.search(r"<nav class=\"container\".*?</nav>", s[i_main:j_main], flags=re.S)
fil = fil.group(0) if fil else ""
logo = re.search(r'<div class="sc-mur"[^>]*><img src="([^"]+)"', s)
LOGO = logo.group(1) if logo else ""

MODELES = [["renne", "Renne", "Bois et nez rouge"], ["bonnet", "Bonnet de Noël", "Le bonnet du Père Noël"],
           ["lapin", "Oreilles de lapin", "Pour Pâques ou une naissance"], ["cornes", "Petit diable", "Deux cornes rouges"]]
POL_I = [["lilita", "Ronde", "'Lilita One'"], ["titan", "Dodue", "'Titan One'"], ["paytone", "Large", "'Paytone One'"], ["alfa", "À empattements", "'Alfa Slab One'"]]
POL_N = [["pacifico", "Pacifico", "'Pacifico'", 400], ["lobster", "Lobster", "'Lobster'", 400], ["courgette", "Courgette", "'Courgette'", 400],
         ["satisfy", "Satisfy", "'Satisfy'", 400], ["lora", "Lora", "'Lora'", 600], ["bree", "Bree Serif", "'Bree Serif'", 400],
         ["arvo", "Arvo", "'Arvo'", 400], ["lato", "Lato", "'Lato'", 700]]


def vignette(mod):
    g = json.load(open(os.path.join(formes, f"{mod}-titan.json"), encoding="utf-8"))["C"]
    x, y, w, h = g["b"]
    coul = {"nez": "#d62a2a", "rouge": "#d62a2a", "blanc": "#fff", "rose": "#f3b7bd", "reflet": "#fff"}
    bord = ' stroke="#c9b79c" stroke-width=".5"'
    k = "".join(f'<path d="{d}" fill="{coul[r]}"{bord if r == "blanc" else ""}/>' for r, d in g["k"])
    return (f'<svg viewBox="{x - 3:.1f} {y - 3:.1f} {w + 6:.1f} {h + 6:.1f}" aria-hidden="true"><path d="{g["f"]}" fill="#d9b98a" fill-rule="nonzero"/>'
            f'<path d="{g["d"]}" fill="#fbf8f2" fill-rule="nonzero"/>{k}</svg>')


DONNEES = json.dumps({
    "modeles": [{"id": m, "nom": n, "sous": t, "vig": vignette(m)} for m, n, t in MODELES], "polI": POL_I, "polN": POL_N, "base": "formes/", "logo": LOGO,
    "tailles": [{"id": "p", "nom": "Petite", "h": 60, "plus": 0}, {"id": "m", "nom": "Moyenne", "h": 80, "plus": 2}, {"id": "g", "nom": "Grande", "h": 100, "plus": 4}],
    "finitions": [{"id": "couleur", "nom": "Peinte à la main", "sous": "La lettre peinte en blanc, les décors en couleur, comme sur le modèle", "plus": 4},
                  {"id": "bois", "nom": "Bois naturel", "sous": "Sans peinture : la lettre en bois clair, les décors gravés", "plus": 0}],
    "prix": 12.9, "max": 10, "lettres": 14}, ensure_ascii=False, separators=(",", ":"))

CSS = r"""
.pn-mods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (max-width:520px){.pn-mods{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pn-mod{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px 9px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);
cursor:pointer;font:inherit;color:var(--ink);text-align:center;min-width:0}
.pn-mod svg{width:100%;max-width:92px;height:88px}
.pn-mod b{font-size:.84rem;line-height:1.2}.pn-mod small{font-size:.7rem;color:var(--ink-soft);line-height:1.25}
.pn-mod.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.pn-nom{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.pn-nom .ini{flex:none;width:38px;height:38px;border-radius:10px;background:#f3e8d3;display:flex;align-items:center;justify-content:center;font:700 1.15rem 'Titan One',serif;color:#7c6120}
.pn-nom input{flex:1;min-width:0;min-height:44px;padding:9px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:1rem;background:#fff;color:var(--ink)}
.pn-nom input:focus{outline:2px solid var(--gold);outline-offset:1px}
.pn-nom.sel input{border-color:var(--gold-dark)}
.pn-nom button{flex:none;width:40px;height:44px;border:1.5px solid var(--line);border-radius:10px;background:#fff;font:inherit;font-size:1.05rem;cursor:pointer;color:var(--ink)}
.pn-pols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pn-pol{min-height:52px;padding:6px 10px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;color:var(--ink);font-size:1.25rem;line-height:1.1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pn-pol small{display:block;font:500 .68rem Inter,system-ui,sans-serif;color:var(--ink-soft)}
.pn-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.pn-rang{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pn-bande{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 2px;-webkit-overflow-scrolling:touch}
.pn-bande button{flex:none;width:64px;padding:4px 4px 5px;border:1.5px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;font:600 .66rem Inter,system-ui,sans-serif;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pn-bande button svg{display:block;width:100%;height:56px}
.pn-bande button.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.pn-dim{position:absolute;left:10px;bottom:10px;z-index:3;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink)}
.pn-stage svg text{user-select:none}
.pn-feuilles{display:grid;gap:14px}
.pn-feuilles h4{margin:0 0 6px;font:600 .92rem Inter,system-ui,sans-serif}
.pn-feuilles .al{color:#b4452f;font-size:.82rem;font-weight:600;margin:6px 0 0}
"""

MAIN = r"""<main>
__FIL__
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage pn-stage" id="stage" data-vue="creation"><span class="sc-tag">Votre décoration, en direct</span>
   <div class="sc-mur" aria-hidden="true"><img src="__LOGO__" alt=""></div>
   <svg id="scene" viewBox="0 0 120 150" role="img" aria-label="Aperçu de votre décoration à prénom"></svg>
   <p class="ab-charge" id="chargement" hidden>Chargement de la lettre…</p>
   <span class="pn-dim" id="dim"></span></div>
  <div class="pn-bande" id="bande" hidden></div>
  <p class="sc-aide" id="aide">Le prénom se place tout seul dans la lettre, à l'endroit où il est le plus grand.</p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Maison &amp; Déco</a></div>
  <div class="pd-titrerow"><h1>Décoration à prénom : une grande initiale, le prénom gravé dedans</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">Renne, bonnet de Noël, oreilles de lapin ou petit diable : écrivez un prénom, sa première lettre devient la décoration, à suspendre au sapin ou sur un cadeau.</p>
  <div class="price-lead" id="prixtete"></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez votre décoration</p><p class="prc-sub">Six petites étapes. La décoration se dessine au fur et à mesure.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">1</span><h3>Le modèle</h3></div>
  <div class="pn-mods" id="modeles"></div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">2</span><h3>Le prénom</h3></div>
  <p class="prc-legend">Une décoration par prénom. La première lettre du prénom fait la grande lettre ; le prénom est gravé dedans.</p>
  <div id="listeNoms"></div>
  <p class="prc-hint prc-miss" id="alerteNoms" style="margin:6px 0 0"></p>
  <button type="button" class="ab-ajout" id="ajoutNom">+ Ajouter un prénom (une décoration de plus)</button>
  <p class="prc-hint">Le prénom commence par une lettre de A à Z (les accents sont acceptés : Élodie donne un E). 14 lettres au plus.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>La forme de la grande lettre</h3></div>
  <div class="pn-pols" id="polI"></div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>La taille</h3></div>
  <div class="sc-styles pn-rang" id="tailles"></div>
  <p class="prc-hint">La taille est celle de la grande lettre ; le décor et l'anneau s'ajoutent autour.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>Les couleurs</h3></div>
  <div class="sc-styles" id="finitions"></div>
  <p class="prc-hint">Deux pièces en contreplaqué 3 mm, collées : le fond, puis la lettre par-dessus. Le prénom est gravé après la peinture.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">6</span><h3>L'écriture du prénom</h3></div>
  <div class="pn-pols" id="polN"></div>
  <p class="prc-legend" style="margin-top:12px">Où graver le prénom ?</p>
  <div class="sc-styles pn-rang" id="places">
   <button type="button" class="sc-style" data-v="auto"><b>Au mieux</b><small>Le plus grand possible</small></button>
   <button type="button" class="sc-style" data-v="h"><b>À l'horizontale</b><small>Toujours droit</small></button>
   <button type="button" class="sc-style" data-v="v"><b>À la verticale</b><small>De bas en haut</small></button>
  </div>
  <p class="prc-hint prc-miss" id="alertePetit" style="margin:8px 0 0"></p>
 </section>
 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num done">7</span><h3>Votre commande</h3></div>
  <div class="prc-sum" id="resume"></div>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
 </div>
</div></div>

<section class="sc-atelier"><div class="container">
 <h2>De votre côté : deux pièces par prénom, à découper, peindre et coller</h2>
 <p>À la commande, le site range dans le dossier de la commande les planches à la taille réelle. Elles changent en direct quand vous modifiez la décoration au-dessus.</p>
 <div class="sc-agrid">
  <div class="pn-feuilles" id="feuilles"></div>
  <div>
   <ul class="sc-legende"><li><i style="border-color:#d32f2f"></i>Trait rouge : à découper</li><li><i style="border-color:#111"></i>Noir : à graver</li><li><i style="border-color:#1f6feb"></i>Bleu : repère de peinture (trait léger, facultatif)</li></ul>
   <ul class="sc-points">
    <li><b>Les formes du générateur d'Atomm</b>4 modèles, 4 formes de lettre, 26 lettres : le fond (lettre, bordure, décor, anneau) et le devant, tels que leur outil les dessine, lettre de 8 cm (réduite ou agrandie pour les deux autres tailles).</li>
    <li><b>Deux pièces, comme Atomm</b>Le fond et la lettre, en contreplaqué 3 mm. Pas de petits morceaux à coller : les couleurs sont peintes.</li>
    <li><b>L'ordre du travail</b>1. Découper les deux pièces. 2. Peindre la lettre en blanc et les décors (nez, bonnet ou cornes en rouge, bande et pompon en blanc, intérieur des oreilles en rose). 3. Graver le prénom, après la peinture. 4. Coller la lettre sur le fond, passer le ruban.</li>
    <li><b>Le prénom, gravé dans la lettre</b>Placé tout seul à l'endroit où il est le plus grand (à plat, debout ou en biais), jamais sur un décor. Dans le fichier, le prénom sera en tracés.</li>
    <li><b>Les traits bleus</b>Ils montrent où peindre chaque couleur. Vous pouvez les marquer très légèrement au laser avant de peindre, ou les ignorer. En « Bois naturel », les décors sont gravés (noir) et il n'y a rien à peindre.</li>
   </ul>
  </div>
 </div>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Peinture, comme Atomm (votre choix du 12/11) : la lettre en blanc, le nez, le bonnet ou les cornes en rouge, l'intérieur des oreilles en rose. Deux pièces par prénom, tout en contreplaqué.</li>
  <li>Prix proposés par moi : 12,90 € la décoration en bois naturel, taille petite ; « Peinte à la main » + 4 € ; taille moyenne + 2 €, grande + 4 € (comme la décoration à suspendre).</li>
  <li>Tailles proposées : lettre de 6, 8 ou 10 cm. Atomm laisse régler de 5 à 14 cm.</li>
  <li>Réglages d'Atomm laissés à leur valeur d'origine, non proposés à la cliente : largeur de la bordure (2,5 mm), taille du décor, largeur du nez, anneau (12 mm, trou de 5 mm), taille du prénom (95 %).</li>
  <li>La vue 3D n'est pas encore faite sur cette maquette.</li>
 </ul></div>
</div></section>
</main>"""

JS = r"""
(function(){
var D=__DONNEES__,$=function(i){return document.getElementById(i)},NS='http://www.w3.org/2000/svg';
var S={modele:'renne',polI:'titan',taille:'m',finition:'couleur',polN:'pacifico',place:'auto',noms:['Camille'],sel:0};
var F={},attente={},fits={},CV=document.createElement('canvas').getContext('2d');
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
function fr(v){return (Math.round(v*10)/10).toFixed(1).replace('.',',')}
function cle(){return S.modele+'-'+S.polI}
function initiale(n){var c=String(n||'').trim().charAt(0).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();return /^[A-Z]$/.test(c)?c:''}
function taille(){return D.tailles.filter(function(t){return t.id===S.taille})[0]}
function finition(){return D.finitions.filter(function(t){return t.id===S.finition})[0]}
function polN(){return D.polN.filter(function(p){return p[0]===S.polN})[0]}
function k(){return taille().h/80}
function charger(c,discret){if(F[c]||attente[c])return;attente[c]=true;if(!discret)$('chargement').hidden=false;
 fetch(D.base+c+'.json').then(function(r){return r.json()}).then(function(j){F[c]=j;delete attente[c];majModeles();if(c===cle()){$('chargement').hidden=true;dessiner()}})
  .catch(function(){delete attente[c];$('chargement').textContent='La lettre n\'a pas pu se charger.'})}
function forme(n){var f=F[cle()],l=initiale(n);return f&&l?f[l]:null}

/* ---- le prénom dans la lettre : on cherche, pour chaque inclinaison, le plus grand rectangle (aux proportions du prénom)
   qui tient dans la lettre sans toucher un décor ; à taille presque égale, on préfère le prénom à plat ---- */
var R=3,MARGE=1.3;
function encre(txt,p){CV.font=p[3]+' 100px '+p[2];var m=CV.measureText(txt);
 return{l:m.actualBoundingBoxLeft,r:m.actualBoundingBoxRight,a:m.actualBoundingBoxAscent,d:m.actualBoundingBoxDescent}}
function masque(g){var b=g.b,pad=4,W=Math.ceil((b[2]+2*pad)*R),H=Math.ceil((b[3]+2*pad)*R),c=document.createElement('canvas');c.width=W;c.height=H;
 var x=c.getContext('2d');x.setTransform(R,0,0,R,(pad-b[0])*R,(pad-b[1])*R);x.fillStyle='#fff';x.fill(new Path2D(g.d),'nonzero');
 x.strokeStyle='#000';x.lineJoin='round';x.lineWidth=2*MARGE;x.stroke(new Path2D(g.d));x.fillStyle='#000';
 g.k.forEach(function(q){if(q[0]==='reflet')return;var p=new Path2D(q[1]);x.fill(p,'nonzero');x.lineWidth=2*MARGE;x.stroke(p)});
 return{c:c,W:W,H:H,ox:b[0]-pad,oy:b[1]-pad}}
function chercher(M,ang,ar){
 var d=Math.ceil(Math.hypot(M.W,M.H)),c=document.createElement('canvas');c.width=d;c.height=d;var x=c.getContext('2d',{willReadFrequently:true});
 x.translate(d/2,d/2);x.rotate(-ang*Math.PI/180);x.drawImage(M.c,-M.W/2,-M.H/2);
 var px=x.getImageData(0,0,d,d).data,n=d+1,T=new Int32Array(n*n),i,j;
 for(j=0;j<d;j++){var l=0;for(i=0;i<d;i++){l+=px[(j*d+i)*4]>127?0:1;T[(j+1)*n+i+1]=T[j*n+i+1]+l}}
 function plein(x0,y0,w,h){var x1=x0+w,y1=y0+h;return T[y1*n+x1]-T[y0*n+x1]-T[y1*n+x0]+T[y0*n+x0]===0}
 function tient(w){var h=Math.max(2,Math.round(w/ar));for(var y=0;y+h<=d;y+=2)for(var x0=0;x0+w<=d;x0+=2)if(plein(x0,y,w,h))return[x0,y,h];return null}
 var lo=4,hi=d,best=null;while(hi-lo>1){var mid=(lo+hi)>>1,r=tient(mid);if(r){lo=mid;best=[r[0],r[1],mid,r[2]]}else hi=mid}
 if(!best)return null;
 /* on recentre : parmi les places de cette taille, celle du milieu de la bande libre */
 var w=best[2],h=best[3],sx=0,sy=0,nb=0;for(var y=0;y+h<=d;y+=2)for(var x0=0;x0+w<=d;x0+=2)if(plein(x0,y,w,h)){sx+=x0;sy+=y;nb++}
 var mx=Math.round(sx/nb),my=Math.round(sy/nb);if(nb&&plein(mx,my,w,h)){best[0]=mx;best[1]=my}
 var cx=best[0]+w/2-d/2,cy=best[1]+h/2-d/2,a=ang*Math.PI/180;
 return{w:w/R,h:h/R,ang:ang,cx:M.ox+(M.W/2+cx*Math.cos(a)-cy*Math.sin(a))/R,cy:M.oy+(M.H/2+cx*Math.sin(a)+cy*Math.cos(a))/R}}
function placer(n){var g=forme(n),txt=String(n||'').trim();if(!g||!txt)return null;
 var p=polN(),id=[cle(),initiale(n),txt,S.polN,S.place].join('|');if(fits[id]!==undefined)return fits[id];
 if(!pretes[S.polN])return null;   // l'écriture n'est pas encore chargée : mesurer maintenant donnerait une fausse place
 var e=encre(txt,p),ar=(e.l+e.r)/Math.max(1,e.a+e.d),M=masque(g);
 var angles=S.place==='h'?[0]:S.place==='v'?[-90]:[0,-90,-75,-60,-45,-30,-15,15,30,45,60,75],best=null,note=0;
 angles.forEach(function(a){var r=chercher(M,a,ar);if(!r)return;var s=r.w*(a===0?1:a===-90?.8:.72);if(s>note){note=s;best=r}});
 if(best){best.fs=best.w*.95/(e.l+e.r)*100;best.e=e;best.hmm=best.w*.95/ar}
 fits[id]=best;return best}

/* ---- le dessin d'une décoration (mm, origine au milieu de la lettre) ---- */
var COUL={bois:['#f0dcb4','#d9b98a'],clair:['#f7ecd6','#ecdcbc']};
function defs(){return '<defs><linearGradient id="g-bois" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e7cfa2"/><stop offset=".5" stop-color="#d8b783"/><stop offset="1" stop-color="#e7cfa2"/></linearGradient>'
 +'<linearGradient id="g-clair" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#f8efdc"/><stop offset="1" stop-color="#ead9b8"/></linearGradient>'
 +'<linearGradient id="g-blanc" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#ece8e0"/></linearGradient>'
 +'<radialGradient id="g-rouge" cx="35%" cy="25%" r="80%"><stop stop-color="#f25a52"/><stop offset=".65" stop-color="#d42525"/><stop offset="1" stop-color="#a81616"/></radialGradient></defs>'}
function trou(g){ /* le trou de l'anneau : le plus petit contour du fond */
 if(g._t!==undefined)return g._t;var best=null;g.f.split('M').forEach(function(sub){if(!sub)return;var n=sub.match(/-?\d+(\.\d+)?/g).map(Number),x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(var i=0;i<n.length;i+=2){x0=Math.min(x0,n[i]);x1=Math.max(x1,n[i]);y0=Math.min(y0,n[i+1]);y1=Math.max(y1,n[i+1])}
  var w=x1-x0,h=y1-y0;if(w<9&&h<9&&Math.abs(w-h)<1&&(!best||w<best.w))best={x:(x0+x1)/2,y:(y0+y1)/2,w:w}});
 g._t=best;return best}
function ornement(n,opt){var g=forme(n);if(!g)return'';opt=opt||{};var couleur=S.finition==='couleur',h='',t=trou(g);
 if(opt.ruban&&t){var fil='M'+t.x+','+(t.y-1)+'L'+t.x+','+(g.b[1]-60);h+='<path d="'+fil+'" stroke="#b9a788" stroke-width="1.7" fill="none" opacity=".75"/><path d="'+fil+'" stroke="#ffffff" stroke-width="1.1" fill="none"/>'}
 if(!opt.plat)h+='<path d="'+g.f+'" fill="#5b4326" opacity=".28" transform="translate(.9 1.6)"/>';
 h+='<path d="'+g.f+'" fill="url(#g-bois)" stroke="#a9834f" stroke-width=".25"/>';
 if(!opt.plat)h+='<path d="'+g.d+'" fill="#6b5433" opacity=".3" transform="translate(.4 .9)"/>';
 h+='<path d="'+g.d+'" fill="url(#'+(couleur?'g-blanc':'g-clair')+')" stroke="'+(couleur?'#d8d2c6':'#c9a877')+'" stroke-width=".2"/>';
 g.k.forEach(function(q){var r=q[0],d=q[1];
  if(couleur){if(r==='nez'||r==='rouge')h+='<path d="'+d+'" fill="url(#g-rouge)"/>';
   else if(r==='blanc')h+='<path d="'+d+'" fill="url(#g-blanc)" stroke="#cfc8ba" stroke-width=".3"/>';
   else if(r==='rose')h+='<path d="'+d+'" fill="#f3b3bb"/>';
   else if(r==='reflet')h+='<path d="'+d+'" fill="#fff" opacity=".85"/>'}
  else if(r!=='reflet')h+='<path d="'+d+'" fill="#b08a55" opacity="'+(r==='blanc'?'.35':'.8')+'"/>'});
 var f=placer(n);if(f){var p=polN(),e=f.e,fs=f.fs,x=f.cx-((e.r-e.l)/2)*fs/100,y=f.cy+((e.a-e.d)/2)*fs/100;
  h+='<text x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" font-family="'+p[2]+',cursive" font-weight="'+p[3]+'" font-size="'+fs.toFixed(2)+'" fill="'+(opt.noir?'#111':'#3a2a1c')+'"'
   +(f.ang?' transform="rotate('+f.ang+' '+f.cx.toFixed(2)+' '+f.cy.toFixed(2)+')"':'')+'>'+esc(String(n).trim())+'</text>'}
 return h}
function dessiner(){var n=S.noms[S.sel]||'',g=forme(n),sc=$('scene');
 if(!F[cle()])charger(cle());
 if(!g){sc.innerHTML='<text x="60" y="78" text-anchor="middle" font-size="5" fill="#8a7a62" font-family="Inter,sans-serif">'+(F[cle()]?'Écrivez un prénom':'')+'</text>';sc.setAttribute('viewBox','0 0 120 150');$('dim').textContent=''}
 else{var b=g.b,m=10;sc.setAttribute('viewBox',(b[0]-m)+' '+(b[1]-m-8)+' '+(b[2]+2*m)+' '+(b[3]+2*m+8));sc.innerHTML=defs()+ornement(n,{ruban:true});
  $('dim').textContent='≈ '+fr(b[2]*k()/10)+' × '+fr(b[3]*k()/10)+' cm'}
 bande();resume();feuilles()}
function bande(){var B=$('bande');B.hidden=S.noms.length<2;if(B.hidden)return;
 B.innerHTML=S.noms.map(function(n,i){var g=forme(n),b=g?g.b:[0,0,60,80];
  return '<button type="button" data-i="'+i+'"'+(i===S.sel?' class="on"':'')+'><svg viewBox="'+(b[0]-3)+' '+(b[1]-3)+' '+(b[2]+6)+' '+(b[3]+6)+'">'+(g?defs().replace(/id="g-/g,'id="b'+i+'-')+ornement(n,{plat:true}).replace(/url\(#g-/g,'url(#b'+i+'-'):'')+'</svg>'+esc(n||'…')+'</button>'}).join('')}
$('bande').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.sel=+b.getAttribute('data-i');majNoms();suivre();dessiner()});

/* ---- les étapes ---- */
function lettreEnCours(){return initiale(S.noms[S.sel])||'P'} /* rien d'écrit : « Prénom », donc P */
function vigModele(m){var c=m.id+'-'+S.polI,l=lettreEnCours(),f=F[c],g=f&&f[l];
 if(!g){charger(c,true);return (l==='C'&&S.polI==='titan')?m.vig:'<svg viewBox="0 0 10 10" aria-hidden="true"></svg>'}
 var b=g.b,coul=S.finition==='couleur',h='<svg viewBox="'+(b[0]-3)+' '+(b[1]-3)+' '+(b[2]+6)+' '+(b[3]+6)+'" aria-hidden="true"><path d="'+g.f+'" fill="#d9b98a"/><path d="'+g.d+'" fill="'+(coul?'#fbf8f2':'#ecd7b0')+'"/>';
 g.k.forEach(function(q){var r=q[0];
  if(coul)h+='<path d="'+q[1]+'" fill="'+(r==='nez'||r==='rouge'?'#d62a2a':r==='rose'?'#f3b7bd':'#fff')+'"'+(r==='blanc'?' stroke="#c9b79c" stroke-width=".5"':'')+'/>';
  else if(r!=='reflet')h+='<path d="'+q[1]+'" fill="#b08a55" opacity="'+(r==='blanc'?'.35':'.8')+'"/>'});
 return h+'</svg>'}
var cleVig='';
function majModeles(force){var c=lettreEnCours()+'|'+S.polI+'|'+S.finition+'|'+S.modele+'|'+D.modeles.map(function(m){return F[m.id+'-'+S.polI]?1:0}).join('');
 if(force!==true&&c===cleVig)return;cleVig=c;
 $('modeles').innerHTML=D.modeles.map(function(m){return '<button type="button" class="pn-mod'+(m.id===S.modele?' on':'')+'" data-v="'+m.id+'">'+vigModele(m)+'<b>'+esc(m.nom)+'</b><small>'+esc(m.sous)+'</small></button>'}).join('')}
/* tout ce qui montre la lettre ou le prénom suit le prénom en cours */
var cleSuivi='';
function suivre(){var c=lettreEnCours()+'|'+String(S.noms[S.sel]||'').trim();majModeles();if(c===cleSuivi)return;cleSuivi=c;majPolI();majPolN()}
$('modeles').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.modele=b.getAttribute('data-v');majModeles();dessiner()});
function majNoms(){$('listeNoms').innerHTML=S.noms.map(function(n,i){return '<div class="pn-nom'+(i===S.sel?' sel':'')+'"><span class="ini">'+(initiale(n)||'?')+'</span><input type="text" maxlength="'+D.lettres+'" value="'+esc(n)+'" data-i="'+i+'" placeholder="Prénom" aria-label="Prénom '+(i+1)+'" autocapitalize="words" autocomplete="off" spellcheck="false">'
  +(S.noms.length>1?'<button type="button" data-x="'+i+'" aria-label="Retirer ce prénom">✕</button>':'')+'</div>'}).join('');
 $('ajoutNom').disabled=S.noms.length>=D.max;$('ajoutNom').textContent=S.noms.length>=D.max?D.max+' prénoms au maximum':'+ Ajouter un prénom (une décoration de plus)';alertes()}
function alertes(){var ko=S.noms.filter(function(n){return String(n).trim()&&!initiale(n)});
 $('alerteNoms').textContent=ko.length?'« '+ko[0]+' » ne commence pas par une lettre de A à Z : la grande lettre ne peut pas être faite.':''}
$('listeNoms').addEventListener('input',function(ev){var i=ev.target.getAttribute('data-i');if(i==null)return;S.noms[+i]=ev.target.value;S.sel=+i;
 var ini=ev.target.parentNode.querySelector('.ini');if(ini)ini.textContent=initiale(ev.target.value)||'?';alertes();suivre();dessiner()});
$('listeNoms').addEventListener('focusin',function(ev){var i=ev.target.getAttribute('data-i');if(i==null||+i===S.sel)return;S.sel=+i;
 [].forEach.call($('listeNoms').children,function(c,j){c.classList.toggle('sel',j===S.sel)});suivre();dessiner()});
$('listeNoms').addEventListener('click',function(ev){var b=ev.target.closest('button[data-x]');if(!b)return;S.noms.splice(+b.getAttribute('data-x'),1);S.sel=Math.min(S.sel,S.noms.length-1);majNoms();suivre();dessiner()});
$('ajoutNom').addEventListener('click',function(){if(S.noms.length>=D.max)return;S.noms.push('');S.sel=S.noms.length-1;majNoms();suivre();dessiner();var c=$('listeNoms').querySelectorAll('input');c[c.length-1].focus()});
function majPolI(){var l=lettreEnCours();$('polI').innerHTML=D.polI.map(function(p){return '<button type="button" class="pn-pol'+(p[0]===S.polI?' on':'')+'" data-v="'+p[0]+'" style="font-family:'+p[2]+',sans-serif">'+l+'<small>'+esc(p[1])+'</small></button>'}).join('')}
$('polI').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.polI=b.getAttribute('data-v');majPolI();majModeles();dessiner()});
function majTailles(){$('tailles').innerHTML=D.tailles.map(function(t){return '<button type="button" class="sc-style'+(t.id===S.taille?' on':'')+'" data-v="'+t.id+'"><b>'+t.nom+'</b><small>Lettre de '+t.h/10+' cm'+(t.plus?' · + '+t.plus+' €':' · compris')+'</small></button>'}).join('')}
$('tailles').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.taille=b.getAttribute('data-v');majTailles();dessiner()});
function majFinitions(){$('finitions').innerHTML=D.finitions.map(function(t){return '<button type="button" class="sc-style'+(t.id===S.finition?' on':'')+'" data-v="'+t.id+'"><b>'+t.nom+(t.plus?' · + '+t.plus+' €':'')+'</b><small>'+t.sous+'</small></button>'}).join('')}
$('finitions').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.finition=b.getAttribute('data-v');majFinitions();majModeles();dessiner()});
function majPolN(){var n=String(S.noms[S.sel]||'').trim()||'Prénom';$('polN').innerHTML=D.polN.map(function(p){return '<button type="button" class="pn-pol'+(p[0]===S.polN?' on':'')+'" data-v="'+p[0]+'" style="font-family:'+p[2]+',cursive;font-weight:'+p[3]+'">'+esc(n)+'<small>'+esc(p[1])+'</small></button>'}).join('')}
$('polN').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.polN=b.getAttribute('data-v');majPolN();attendrePolice()});
function majPlaces(){[].forEach.call($('places').children,function(b){b.classList.toggle('on',b.getAttribute('data-v')===S.place)})}
$('places').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;S.place=b.getAttribute('data-v');majPlaces();dessiner()});
var pretes={};
function attendrePolice(essai){var p=polN();dessiner();if(pretes[p[0]])return;
 if(!(document.fonts&&document.fonts.load)){pretes[p[0]]=true;dessiner();return}
 document.fonts.load(p[3]+' 100px '+p[2],'Aé').then(function(L){
  if(L&&L.length||(essai||0)>12){pretes[p[0]]=true;if(p[0]===S.polN)dessiner()}
  else setTimeout(function(){attendrePolice((essai||0)+1)},350)},function(){pretes[p[0]]=true;dessiner()})}

/* ---- le prix, le résumé ---- */
function valides(){return S.noms.filter(function(n){return initiale(n)})}
function prixUn(){return D.prix+taille().plus+finition().plus}
function total(){return prixUn()*valides().length}
function resume(){var v=valides(),m=D.modeles.filter(function(x){return x.id===S.modele})[0],pi=D.polI.filter(function(x){return x[0]===S.polI})[0],L=[];
 L.push(['Modèle',m.nom]);L.push(['Prénom'+(v.length>1?'s':''),v.join(', ')||'à écrire']);L.push(['Grande lettre',pi[1]+' · '+taille().nom.toLowerCase()+' ('+taille().h/10+' cm)']);
 L.push(['Couleurs',finition().nom]);L.push(['Écriture du prénom',polN()[1]+' · '+(S.place==='auto'?'placé au mieux':S.place==='h'?'à l\'horizontale':'à la verticale')]);
 L.push([v.length>1?v.length+' décorations':'1 décoration',v.length>1?v.length+' × '+eur(prixUn()):eur(prixUn())]);
 $('resume').innerHTML=L.map(function(l){return '<div class="prc-sum-l"><span>'+esc(l[0])+'</span><b>'+esc(l[1])+'</b></div>'}).join('');
 $('total').textContent=eur(total());$('prixtete').innerHTML='<span class="price-sale">'+eur(D.prix)+'</span> <span style="font-size:.85rem;color:var(--ink-soft)">la décoration, prénom gravé compris</span>';
 var vide=S.noms.some(function(n){return !String(n).trim()}),ko=S.noms.some(function(n){return String(n).trim()&&!initiale(n)});
 $('manque').textContent=vide?'Il manque un prénom.':ko?'Un prénom ne commence pas par une lettre.':'';$('ajouter').disabled=vide||ko||!v.length;
 var petits=v.filter(function(n){var f=placer(n);return f&&f.hmm*k()<3});
 $('alertePetit').textContent=petits.length?'« '+petits[0]+' » est long pour cette lettre : il sera gravé très petit (moins de 3 mm de haut). Une lettre plus grande ou une autre place lui donnera plus de place.':''}

/* ---- les planches de l'atelier : une par matière, pièces numérotées, à la taille réelle ---- */
function boiteDe(d){var n=d.match(/-?\d+(\.\d+)?/g).map(Number),x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(var i=0;i<n.length;i+=2){x0=Math.min(x0,n[i]);x1=Math.max(x1,n[i]);y0=Math.min(y0,n[i+1]);y1=Math.max(y1,n[i+1])}return[x0,y0,x1-x0,y1-y0]}
var ZONE=176;window.addEventListener('message',function(ev){var d=ev.data;if(d&&d.type==='niv-machine'&&d.machine){var z=Math.min(+d.machine.zw||180,+d.machine.zh||180)-4;if(z>=60&&z!==ZONE){ZONE=z;feuilles()}}});
function feuilles(){var v=valides(),q=k(),couleur=S.finition==='couleur',P={},ordre=[],num=0;
 function mettre(mat,piece){if(!P[mat]){P[mat]=[];ordre.push(mat)}P[mat].push(piece)}
 v.forEach(function(n){var g=forme(n);if(!g)return;
  mettre('Contreplaqué 3 mm',{n:++num,nom:'fond « '+n+' »',b:g.b,h:'<path d="'+g.f+'" fill="none" stroke="#d32f2f" stroke-width=".35"/>'});
  var grav='';if(!couleur)g.k.forEach(function(x){if(x[0]!=='reflet')grav+='<path d="'+x[1]+'" fill="#111" opacity="'+(x[0]==='blanc'?'.25':'.6')+'"/>'});
  else g.k.forEach(function(x){grav+='<path d="'+x[1]+'" fill="none" stroke="#1f6feb" stroke-width=".3"/>'});
  var f=placer(n),t='';if(f){var p=polN(),e=f.e,x=f.cx-((e.r-e.l)/2)*f.fs/100,y=f.cy+((e.a-e.d)/2)*f.fs/100;
   t='<text x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" font-family="'+p[2]+',cursive" font-weight="'+p[3]+'" font-size="'+f.fs.toFixed(2)+'" fill="#111"'+(f.ang?' transform="rotate('+f.ang+' '+f.cx.toFixed(2)+' '+f.cy.toFixed(2)+')"':'')+'>'+esc(String(n).trim())+'</text>'}
  mettre('Contreplaqué 3 mm',{n:++num,nom:'lettre « '+n+' »'+(couleur?' (à peindre)':''),b:boiteDe(g.d),h:'<path d="'+g.d+'" fill="none" stroke="#d32f2f" stroke-width=".35"/>'+grav+t})});
 var G=6,LMAX=ZONE,out='';
 ordre.forEach(function(mat){var pages=[],cur=null;
  function ouvrir(){cur={x:0,y:0,hl:0,W:0,h:'',noms:[]};pages.push(cur)}
  ouvrir();
  P[mat].forEach(function(p){var w=p.b[2]*q,ht=p.b[3]*q;if(cur.x>0&&cur.x+w>LMAX){cur.x=0;cur.y+=cur.hl+G;cur.hl=0}
   if(cur.y>0&&cur.y+ht>LMAX)ouvrir();
   cur.h+='<g transform="translate('+(cur.x-p.b[0]*q).toFixed(2)+' '+(cur.y-p.b[1]*q).toFixed(2)+') scale('+q+')">'+p.h+'</g>'
    +'<g transform="translate('+(cur.x+w/2).toFixed(2)+' '+(cur.y+ht/2).toFixed(2)+')"><circle r="3.2" fill="#1a1206"/><text text-anchor="middle" dominant-baseline="central" font-size="3.6" font-weight="700" fill="#fff" font-family="sans-serif">'+p.n+'</text></g>';
   cur.noms.push(p.n+' '+p.nom);cur.x+=w+G;cur.hl=Math.max(cur.hl,ht);cur.W=Math.max(cur.W,cur.x-G)});
  pages.forEach(function(pg,i){var H=pg.y+pg.hl;
   out+='<div class="sc-feuille"><h4>'+esc(mat)+(pages.length>1?' · planche '+(i+1)+' sur '+pages.length:'')+' · '+fr(pg.W)+' × '+fr(H)+' mm</h4><svg viewBox="-4 -4 '+(pg.W+8).toFixed(1)+' '+(H+8).toFixed(1)+'" style="max-height:340px" role="img" aria-label="Planche '+esc(mat)+'">'+pg.h+'</svg>'
    +'<p class="sc-fnom">'+pg.noms.join(' · ')+'</p>'+(pg.W>ZONE+4||H>ZONE+4?'<p class="al">Cette pièce dépasse la zone de la machine.</p>':'')+'</div>'})});
 $('feuilles').innerHTML=out||'<p class="prc-hint">Écrivez un prénom : les planches apparaissent ici.</p>'}

majModeles();majNoms();majPolI();majTailles();majFinitions();majPolN();majPlaces();charger(cle());attendrePolice();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){majPolI();majPolN()});
window.pnAtelier={S:S,dessiner:dessiner,maj:function(){majModeles();majNoms();majPolI();majTailles();majFinitions();majPolN();majPlaces();dessiner()}};
window.pnEtat=function(){var n=S.noms[S.sel];return{S:S,pret:!!F[cle()],total:total(),fit:placer(n),forme:!!forme(n)}};
})();
"""

page = (tete + "<style>" + CSS + "</style>" + MAIN.replace("__FIL__", fil).replace("__LOGO__", LOGO) + pied
        + "<script>" + JS.replace("__DONNEES__", DONNEES) + "</script>\n")
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko ·", len(os.listdir(os.path.join(out, "formes"))), "fichiers de formes")
