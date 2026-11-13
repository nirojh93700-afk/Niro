#!/usr/bin/env python3
"""« L'atelier » : UN seul logiciel d'essai qui réunit tous les outils de création (13/11/2026) — démonstration, RIEN en ligne.

Le gérant : « est-ce que tu peux rassembler toutes les maquettes pour que ça fasse un seul logiciel, pour pas qu'il y ait une
dizaine d'outils de travail : je choisis Noël, le support de téléphone… je paramètre, mais dans le même logiciel » et « plus tard,
avec un grand format, il faut pouvoir changer les tailles de gravure et de découpe ».

  python3 tools/maquettes/atelier-unique.py <demo> <lettre.html> <prenom> <suspension.html> <fleur.html> <maison.html> <sortie>

<demo>          = sortie de editeur-demo.py (les trois outils de Gestion avec leur pont de messages, editeur.js, fabrique.js, polices.js, arbres/)
<lettre.html>   = sortie « complet » de lettre-incrustee.py
<prenom>        = dossier de sortie de prenom-createur.py (index.html + formes/)
<suspension.html>, <fleur.html>, <maison.html> = pages de sortie d'empile-createur.py, fleur-createur.py, maison-createur.py
<sortie>        = dossier : index.html (la page de l'artifact) + les pages des outils, à publier ensemble.

Les maquettes enregistrées ne sont PAS modifiées : elles sont ouvertes telles quelles dans un cadre. Le réglage « Ma machine »
(zone, trait de coupe, jeu, épaisseur) est envoyé à l'outil « Lettre » ; les autres outils ont encore leurs tailles fixes.
"""
import os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
VAL = import_module('ajouter-valider')
import atelier_patchs as PATCHS   # le bouton « OK ✓ » des champs, dans chaque outil

demo, lettre, prenom, suspension, fleur, maison, out = sys.argv[1:8]
# « gestion » en 8e mot : la sortie est public/atelier-outils (les trois outils y sont déjà) ; la page s'appelle logiciel.html,
# elle enregistre les fichiers par un lien ou par le partage du téléphone, et porte un bouton « ‹ Gestion ».
GESTION = len(sys.argv) > 8 and sys.argv[8] == "gestion"
os.makedirs(out, exist_ok=True)

def copier_dossier(src, dst):
    os.makedirs(dst, exist_ok=True)
    for n in sorted(os.listdir(src)):
        p = os.path.join(src, n)
        if os.path.isdir(p): copier_dossier(p, os.path.join(dst, n))
        else: shutil.copy(p, os.path.join(dst, n))

# les trois outils de Gestion (avec leur pont) et ce qu'ils chargent
for n in ([] if GESTION else sorted(os.listdir(demo))):
    p = os.path.join(demo, n)
    if n == "index.html": continue
    if os.path.isdir(p): copier_dossier(p, os.path.join(out, n))
    else: shutil.copy(p, os.path.join(out, n))

TETE = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="robots" content="noindex"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
def page(src, dst):
    t = open(src, encoding="utf-8").read()
    if not t.lstrip().lower().startswith("<!doctype"): t = TETE + t + "</body></html>"
    t = VAL.ajouter(t)[0]
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    open(dst, "w", encoding="utf-8").write(t)

for n in ("atelier-support.html", "atelier-arbre.html", "atelier-decoration.html"):
    page(os.path.join(out, n), os.path.join(out, n))

# support rangé pour 180 mm, 2 mm de marge dans les fichiers fabriqués, pont de messages : mêmes réglages que les outils de Gestion
# (atelier_patchs.py ; sans effet s'ils y sont déjà)
for n in PATCHS.OUTILS:
    p = os.path.join(out, n); t = open(p, encoding="utf-8").read(); u = PATCHS.outil(t, n)
    if u != t: open(p, "w", encoding="utf-8").write(u)
p = os.path.join(out, "fabrique.js"); t = open(p, encoding="utf-8").read(); u = PATCHS.marges(t)
if u != t: open(p, "w", encoding="utf-8").write(u)
page(lettre, os.path.join(out, "lettre.html"))
copier_dossier(prenom, os.path.join(out, "prenom"))
page(os.path.join(prenom, "index.html"), os.path.join(out, "prenom", "index.html"))
page(suspension, os.path.join(out, "suspension.html"))
page(fleur, os.path.join(out, "fleur.html"))
page(maison, os.path.join(out, "maison.html"))

INDEX = r"""<title>Atelier Niv Création</title>
<style>
:root{--bg:#f6f3ee;--carte:#fffdf9;--fg:#1f1a12;--doux:#6b6257;--ligne:#e2dbcf;--or:#a98935;--or2:#c9a24b;--or3:#e2c67e;--encre:#1a1206;--al:#b3261e;--ok:#2f6b3c}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#17140f;--carte:#211d17;--fg:#f1ebdf;--doux:#b0a696;--ligne:#3a342a;--or:#d8b867;--or2:#c9a24b;--or3:#8a6d2a;--encre:#0f0c08;--al:#ff8a80;--ok:#8fd19e;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#17140f;--carte:#211d17;--fg:#f1ebdf;--doux:#b0a696;--ligne:#3a342a;--or:#d8b867;--or2:#c9a24b;--or3:#8a6d2a;--encre:#0f0c08;--al:#ff8a80;--ok:#8fd19e;color-scheme:dark}
html,body{height:100%}
body{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column}
*{box-sizing:border-box}
.haut{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--encre);color:#f6efe0;min-width:0}
a.bt{display:inline-flex;align-items:center;text-decoration:none}a.bt[hidden]{display:none}
.haut b{font:700 1rem/1.2 Georgia,"Times New Roman",serif;white-space:nowrap}
.haut .nom{flex:1;min-width:0;font-size:.85rem;color:#d9cfb8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bt{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid #5b4f37;background:#2a2114;color:#f6efe0;font:600 .85rem/1 inherit;cursor:pointer;white-space:nowrap}
.bt.or{border-color:var(--or2);background:linear-gradient(135deg,#e2c67e,#c9a24b);color:#1a1206}
.bt:disabled{opacity:.45;cursor:default}
.etat{flex:none;padding:5px 12px;font-size:.8rem;color:var(--doux);background:var(--carte);border-bottom:1px solid var(--ligne);min-height:28px}
.corps{flex:1;min-height:0;position:relative}
.corps iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--bg)}
.ecran{position:absolute;inset:0;overflow:auto;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}
.ecran h1{font:700 1.4rem/1.2 Georgia,"Times New Roman",serif;margin:0 0 4px;text-wrap:balance}
.ecran h2{font:700 1.05rem/1.25 Georgia,"Times New Roman",serif;margin:20px 0 8px}
.ecran p{margin:0 0 10px;color:var(--doux);max-width:68ch;font-size:.9rem}
.grille{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))}
.prod{display:grid;gap:4px;align-content:start;text-align:left;padding:13px 14px;border:1px solid var(--ligne);border-radius:14px;background:var(--carte);color:var(--fg);font:inherit;cursor:pointer;min-width:0}
.prod:hover,.prod:focus-visible{border-color:var(--or2);outline:none}
.prod b{font-size:.98rem;overflow-wrap:anywhere}
.prod span{font-size:.82rem;color:var(--doux)}
.prod em{font-style:normal;font-size:.72rem;font-weight:700;letter-spacing:.03em;color:var(--or);text-transform:uppercase}
.prod.m{opacity:.62;border-style:dashed}
.past{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.past i{font-style:normal;font-size:.7rem;font-weight:600;padding:2px 7px;border-radius:999px;border:1px solid var(--ligne);color:var(--doux);background:var(--bg)}
.past i.nv{border-color:var(--or2);color:var(--or)}
.past i.ms{border-color:var(--al);color:var(--al)}
.filtres{display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;margin:0 -16px 10px;padding:0 16px 4px;-webkit-overflow-scrolling:touch}
.filtres button,.puces button{flex:none;min-height:38px;padding:0 13px;border-radius:999px;border:1px solid var(--ligne);background:var(--carte);color:var(--fg);font:600 .82rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.filtres button.on,.puces button.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.sous{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:12px 0 0}
.case{display:flex;align-items:center;gap:9px;min-height:40px;font-size:.88rem;color:var(--fg);cursor:pointer}
.case input{width:22px;height:22px;flex:none;accent-color:#a98935}
.lg{display:grid;gap:8px;padding:11px 13px;border:1px solid var(--ligne);border-radius:14px;background:var(--carte);min-width:0}
.lg.vide{grid-template-columns:1fr auto;align-items:center;padding:6px 8px 6px 13px}
.lg.vide .btn{min-height:36px;font-weight:500;color:var(--doux)}
.lg b{font-size:.95rem;overflow-wrap:anywhere}
.lg small{font-size:.8rem;color:var(--doux)}
.lg .bts,.puces{display:flex;flex-wrap:wrap;gap:6px}
.liste{display:grid;gap:8px;max-width:760px}
.int{border-top:1px dashed var(--ligne);padding-top:6px;min-width:0}
.int summary{cursor:pointer;font-weight:600;font-size:.88rem;min-height:40px;display:flex;align-items:center;gap:6px}
.int summary::before{content:"▸";color:var(--or)}
.int[open] summary::before{content:"▾"}
.int summary::-webkit-details-marker{display:none}
.pl{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr));margin-top:8px}
.pl>div{display:flex;align-items:center;gap:8px;justify-content:space-between;min-width:0;padding:2px 6px 2px 10px;border:1px solid var(--ligne);border-radius:10px}
.pl .case{min-width:0;overflow-wrap:anywhere}
.pl select{flex:none;min-height:36px;max-width:9.6rem;border:1px solid var(--ligne);border-radius:8px;background:var(--carte);color:var(--fg);font:inherit;font-size:16px;padding:0 4px}
.aj{display:flex;gap:8px;max-width:760px;margin-top:8px}
.aj input{flex:1;min-width:0;font:inherit;font-size:16px;color:var(--fg);background:var(--carte);border:1px solid var(--ligne);border-radius:10px;padding:9px 11px}
.mach{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));padding:12px 14px;border:1px solid var(--ligne);border-radius:14px;background:var(--carte);max-width:760px}
.mach label{display:grid;gap:3px;font-size:.8rem;color:var(--doux);min-width:0}
.mach input{font:inherit;font-size:16px;color:var(--fg);background:var(--bg);border:1px solid var(--ligne);border-radius:9px;padding:8px 10px;width:100%;min-width:0;font-variant-numeric:tabular-nums}
.carte{min-width:0;display:grid;gap:8px;align-content:start;padding:11px;border:1px solid var(--ligne);border-radius:14px;background:var(--carte)}
.carte img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff;border:1px solid var(--ligne);border-radius:9px}
.carte b{display:block;font-size:.9rem;overflow-wrap:anywhere}
.carte small{display:block;font-size:.78rem;color:var(--doux);overflow-wrap:anywhere}
.btn{min-height:42px;padding:0 13px;border:1px solid var(--ligne);border-radius:10px;background:var(--carte);color:var(--fg);font:600 .85rem/1 inherit;cursor:pointer}
.btn.or{border-color:var(--or2);background:linear-gradient(135deg,#e2c67e,#c9a24b);color:#1a1206}
.al{margin:0 0 10px;padding:8px 11px;border-radius:10px;border:1px solid var(--al);color:var(--al);font-size:.85rem}
.ok{font-size:.8rem;font-weight:600;color:var(--ok);min-height:17px}
</style>
<div class="haut"><a class="bt" id="gestion" href="/gestion" target="_top" hidden>‹ Gestion</a><button type="button" class="bt" id="menu" aria-label="Tous les produits">☰ Produits</button><b>L'atelier</b><span class="nom" id="nom"></span><button type="button" class="bt or" id="fab" hidden>Fabriquer les fichiers</button></div>
<div class="etat" id="etat" role="status"></div>
<div class="corps" id="corps">
 <div class="ecran" id="accueil">
  <h1>Que voulez-vous fabriquer ?</h1>
  <p>Un seul logiciel pour toutes les créations : choisissez le produit, réglez-le, puis sortez les fichiers pour la machine. « ☰ Produits » ramène ici ; un produit déjà ouvert garde ses réglages.</p>
  <div class="filtres" id="filtres" role="group" aria-label="Trier par évènement"></div>
  <div class="grille" id="produits"></div>
  <div class="sous"><label class="case"><input type="checkbox" id="commeSite"> Voir comme sur le site</label><button type="button" class="btn" id="bGerer">Masquer ou afficher sur le site…</button></div>
  <h2>Ma machine</h2>
  <p>À régler une fois. Le jour où la machine change (grand format), changez la zone ici : les planches se rangent à cette taille.</p>
  <div class="mach">
   <label>Zone, largeur (mm)<input id="m-zw" inputmode="decimal"></label><label>Zone, hauteur (mm)<input id="m-zh" inputmode="decimal"></label>
   <label>Trait de coupe (mm)<input id="m-trait" inputmode="decimal"></label><label>Jeu des emboîtements (mm)<input id="m-jeu" inputmode="decimal"></label><label>Épaisseur du bois (mm)<input id="m-ep" inputmode="decimal"></label>
  </div>
  <p style="margin-top:8px" id="machNote"></p>
 </div>
 <div class="ecran" id="gerer" hidden></div>
 <div class="ecran" id="fich" hidden></div>
</div>
<script>
(function(){
 var OUTILS=[
  {id:'lettre',t:'Lettre ou chiffre à incruster, avec sa boîte',d:'Naissance : date, heure, signe, animal, prénom, et la boîte qui va dessous.',page:'lettre.html',e:'Fichiers dans l’outil · suit « Ma machine »',machine:true,ev:['naissance']},
  {id:'boite',t:'Boîte seule',d:'En forme de lettre, de chiffre, ou simple : rectangle, rond, ovale, cœur. Couvercle plein.',page:'lettre.html#boite',e:'Fichiers dans l’outil · suit « Ma machine »',machine:true},
  {id:'support',t:'Support de téléphone',d:'Formes, tailles, gravure, motif ajouré.',page:'atelier-support.html',e:'Retouche pièce par pièce · fichiers',pont:true},
  {id:'arbre',t:'Arbre de vie à prénoms',d:'9 arbres, 1 à 6 prénoms, le pied.',page:'atelier-arbre.html',e:'Retouche pièce par pièce · fichiers',pont:true},
  {id:'deco',t:'Décoration à suspendre',d:'46 formes, textes, photos, dessins.',page:'atelier-decoration.html',e:'Retouche pièce par pièce · fichiers',pont:true,ev:['noel']},
  {id:'prenom',t:'Décoration à prénom',d:'Grande initiale, renne, bonnet, oreilles, cornes.',page:'prenom/index.html',e:'Créateur · planches en bas de la page',ev:['noel']},
  {id:'suspension',t:'Suspension à prénoms',d:'Une forme par prénom, empilées.',page:'suspension.html',e:'Créateur · planches en bas de la page'},
  {id:'fleur',t:'Fleur à prénom',d:'26 fleurs, la tige porte le prénom.',page:'fleur.html',e:'Créateur · planches en bas de la page'},
  {id:'maison',t:'Maisonnette en bois',d:'8 pièces à tenons, suspendue ou sur guirlande.',page:'maison.html',e:'Créateur · planches en bas de la page',ev:['noel']}];
 /* ce qui se voit sur le site : évènements, créations masquées, étiquette « Nouveau » (gardé sur cet appareil ; dans Gestion le jour où les créations sont en vente) */
 var V={ev:[['noel','Noël'],['valentin','Saint-Valentin'],['paques','Pâques'],['meres','Fête des mères'],['peres','Fête des pères'],['naissance','Naissance']].map(function(e){return {id:e[0],nom:e[1]}}),tags:{},masque:{},nouveau:{}},filtre='tout',commeSite=false,gerer=false;
 OUTILS.forEach(function(o){V.tags[o.id]=(o.ev||[]).slice()});
 /* à l'intérieur d'un outil : familles de dessins, modèles… [identifiant, nom, évènement de départ]. Chacun se masque sur le site et se range dans un évènement. */
 var PARTIES=/*PARTIES*/{};
 V.pt={};V.pm={};for(var po in PARTIES)PARTIES[po].l.forEach(function(p){V.pt[po+'|'+p[0]]=p[2]||''});
 function partsDe(ev){var r=[];for(var o in PARTIES)PARTIES[o].l.forEach(function(p){if(V.pt[o+'|'+p[0]]===ev)r.push(o+'|'+p[0])});return r}
 function masquesDans(id){var P=PARTIES[id];return P?P.l.filter(function(p){return V.pm[id+'|'+p[0]]}).length:0}
 try{var v0=JSON.parse(localStorage.getItem('niv-atelier-site')||'null');if(v0&&v0.ev&&v0.tags){V.ev=v0.ev;OUTILS.forEach(function(o){if(v0.tags[o.id])V.tags[o.id]=v0.tags[o.id]});V.masque=v0.masque||{};V.nouveau=v0.nouveau||{};if(v0.pt)for(var kp in v0.pt)if(kp in V.pt)V.pt[kp]=v0.pt[kp];if(v0.pm)for(var km in v0.pm)if(km in V.pt)V.pm[km]=true}}catch(e){}
 for(var kq in V.pt)if(V.pt[kq]&&!V.ev.some(function(e){return e.id===V.pt[kq]}))V.pt[kq]='';
 function garderV(){try{localStorage.setItem('niv-atelier-site',JSON.stringify(V))}catch(e){}}
 function evDe(id){return V.ev.filter(function(x){return x.id===id})[0]}
 function avec(ev){return OUTILS.filter(function(o){return V.tags[o.id].indexOf(ev)>=0})}
 var SITE=/*SITE*/false;
 var $=function(i){return document.getElementById(i)},cadres={},prets={},cur=null,occupe=false,dl=null,resultat=null;
 var M={zw:180,zh:180,trait:0.1,jeu:0.1,ep:3,zdef:180};try{var t=JSON.parse(localStorage.getItem('niv-atelier-machine')||'null');if(t){for(var k in M)if(typeof t[k]==='number')M[k]=t[k];if(t.zdef!==180&&t.zw===200&&t.zh===200){M.zw=180;M.zh=180}M.zdef=180}}catch(e){}
 function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
 function mm(v){return String(Math.round(v*10)/10).replace('.',',')}
 function outil(id){return OUTILS.filter(function(x){return x.id===id})[0]}
 function etat(t){$('etat').textContent=t}
 function maj(){var o=cur?outil(cur):null;
  for(var k in cadres)cadres[k].hidden=k!==cur||!!resultat;
  $('accueil').hidden=!!cur||gerer;$('gerer').hidden=!!cur||!gerer;$('fich').hidden=!resultat;$('nom').textContent=o?o.t:(gerer?'Ce qui se voit sur le site':'');
  $('fab').hidden=!(o&&o.pont);$('fab').disabled=occupe||!prets[cur]||!!resultat;
  if(!occupe)etat(!o?(gerer?'Une création masquée reste dans ce logiciel.':'Choisissez un produit.'):resultat?'Vos fichiers sont prêts.':o.pont?(prets[cur]?'Touchez une pièce pour la régler, puis « Fabriquer les fichiers ».':'L’outil se charge…'):o.machine?'Les fichiers se téléchargent en bas de l’outil.':'Créateur : les planches pour la machine sont tout en bas de la page.')}
 function envoyerMachine(){OUTILS.forEach(function(o){var f=cadres[o.id];if(f&&f.contentWindow)f.contentWindow.postMessage({type:'niv-machine',machine:M},'*')})}
 function envoyerMasques(){var c={};if(commeSite)for(var o in PARTIES)c[o]=PARTIES[o].l.filter(function(p){return V.pm[o+'|'+p[0]]}).map(function(p){return p[0]});
  OUTILS.forEach(function(o){var f=cadres[o.id];if(f&&f.contentWindow)f.contentWindow.postMessage({type:'niv-masques',caches:c},'*')})}
 function ouvrir(id){if(occupe)return;cur=id;resultat=null;if(id)gerer=false;
  if(id&&!cadres[id]){var o=outil(id),f=document.createElement('iframe');f.title='Outil : '+o.t;f.src=o.page;f.addEventListener('load',function(){setTimeout(function(){envoyerMachine();envoyerMasques()},300)});$('corps').appendChild(f);cadres[id]=f}
  maj()}
 function tuiles(){var sans=OUTILS.filter(function(o){return !V.tags[o.id].length}).length;
  if(filtre!=='tout'&&(filtre==='annee'?!sans:!avec(filtre).length))filtre='tout';
  var h='<button type="button" data-f="tout" class="'+(filtre==='tout'?'on':'')+'" aria-pressed="'+(filtre==='tout')+'">Tout · '+OUTILS.length+'</button>';
  V.ev.forEach(function(e){var n=avec(e.id).length;if(n)h+='<button type="button" data-f="'+e.id+'" class="'+(filtre===e.id?'on':'')+'" aria-pressed="'+(filtre===e.id)+'">'+esc(e.nom)+' · '+n+'</button>'});
  if(sans)h+='<button type="button" data-f="annee" class="'+(filtre==='annee'?'on':'')+'" aria-pressed="'+(filtre==='annee')+'">Toute l’année · '+sans+'</button>';
  $('filtres').innerHTML=h;
  var l=OUTILS.filter(function(o){if(commeSite&&V.masque[o.id])return false;return filtre==='tout'||(filtre==='annee'?!V.tags[o.id].length:V.tags[o.id].indexOf(filtre)>=0)});
  $('produits').innerHTML=l.length?l.map(function(o){var p=V.tags[o.id].map(function(e){var x=evDe(e);return x?'<i>'+esc(x.nom)+'</i>':''}).join('')+(V.nouveau[o.id]?'<i class="nv">Nouveau</i>':'')+(V.masque[o.id]?'<i class="ms">Masqué sur le site</i>':'')+(masquesDans(o.id)?'<i class="ms">'+masquesDans(o.id)+' masqué'+(masquesDans(o.id)>1?'s':'')+' à l’intérieur</i>':'');
   return '<button type="button" class="prod'+(V.masque[o.id]?' m':'')+'" data-id="'+o.id+'"><em>'+esc(o.e)+'</em><b>'+esc(o.t)+'</b><span>'+esc(o.d)+'</span>'+(p?'<span class="past">'+p+'</span>':'')+'</button>'}).join(''):'<p>Aucune création à montrer ici.</p>';
  $('commeSite').checked=commeSite}
 function ecranGerer(){var h='<h1>Ce qui se voit sur le site</h1><p>Masquez une création, ou toutes celles d’un évènement, quand la saison est passée ; réaffichez-les l’année suivante. Dans ce logiciel rien ne disparaît : une création masquée reste ici, marquée « Masqué sur le site ». Certaines créations ont aussi des familles de dessins ou des modèles à l’intérieur : ils se masquent un par un, plus bas, et suivent leur évènement.</p>'
   +'<p>Démonstration : ces créations ne sont pas encore en vente. Le jour où elles le seront, ce réglage sera dans Gestion et le site le suivra.</p><p><button type="button" class="btn" id="gRetour">‹ Retour aux créations</button></p><h2>Par évènement</h2><div class="liste">';
  V.ev.forEach(function(e){var l=avec(e.id),pp=partsDe(e.id),tot=l.length+pp.length,vis=l.filter(function(o){return !V.masque[o.id]}).length+pp.filter(function(k){return !V.pm[k]}).length;
   var quoi=(l.length?l.length+' création'+(l.length>1?'s':''):'')+(pp.length?(l.length?' + ':'')+pp.length+' à l’intérieur d’un outil':'');
   h+='<div class="lg'+(tot?'':' vide')+'"><div><b>'+esc(e.nom)+'</b> <small>'+(tot?quoi+' · '+(vis===tot?(tot>1?'tout est affiché':'affichée'):vis?vis+' affiché'+(vis>1?'s':'')+' sur '+tot:(tot>1?'tout est masqué':'masquée')):'aucune création pour l’instant')+'</small></div><div class="bts">'
    +(tot?'<button type="button" class="btn" data-evm="'+e.id+'"'+(vis?'':' disabled')+'>Tout masquer</button><button type="button" class="btn" data-eva="'+e.id+'"'+(vis<tot?'':' disabled')+'>Tout afficher</button>':'<button type="button" class="btn" data-evx="'+e.id+'" aria-label="Retirer l’évènement '+esc(e.nom)+'">Retirer</button>')+'</div></div>'});
  h+='</div><div class="aj"><input id="evNom" maxlength="24" autocomplete="off" placeholder="Nouvel évènement (ex. Rentrée)" aria-label="Nom du nouvel évènement"><button type="button" class="btn or" id="evAj">Ajouter</button></div><h2>Création par création</h2><div class="liste">';
  OUTILS.forEach(function(o){h+='<div class="lg"><b>'+esc(o.t)+'</b><label class="case"><input type="checkbox" data-vis="'+o.id+'"'+(V.masque[o.id]?'':' checked')+'> Affichée sur le site</label><label class="case"><input type="checkbox" data-nv="'+o.id+'"'+(V.nouveau[o.id]?' checked':'')+'> Étiquette « Nouveau »</label>'
   +'<small>Évènements (aucun = toute l’année)</small><div class="puces">'+V.ev.map(function(e){var on=V.tags[o.id].indexOf(e.id)>=0;return '<button type="button" data-tag="'+o.id+'|'+e.id+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'">'+esc(e.nom)+'</button>'}).join('')+'</div>';
   var P=PARTIES[o.id];if(P){var nm=masquesDans(o.id);
    h+='<details class="int" data-int="'+o.id+'"'+(ouvInt[o.id]?' open':'')+'><summary>À l’intérieur : '+P.l.length+' '+P.nom+(nm?' · '+nm+' masqué'+(nm>1?'s':'')+' sur le site':'')+'</summary><small>Coché = affiché sur le site. Le menu range chaque ligne dans un évènement : « Tout masquer » de cet évènement la prend aussi. '+esc(P.note)+'</small><div class="pl">'
     +P.l.map(function(p){var k=o.id+'|'+p[0];return '<div><label class="case"><input type="checkbox" data-pvis="'+esc(k)+'"'+(V.pm[k]?'':' checked')+'> '+esc(p[1])+'</label><select data-pev="'+esc(k)+'" aria-label="Évènement de : '+esc(p[1])+'"><option value="">Toute l’année</option>'+V.ev.map(function(e){return '<option value="'+e.id+'"'+(V.pt[k]===e.id?' selected':'')+'>'+esc(e.nom)+'</option>'}).join('')+'</select></div>'}).join('')+'</div></details>'}
   h+='</div>'});
  var y=$('gerer').scrollTop;$('gerer').innerHTML=h+'</div>';$('gerer').scrollTop=y}
 var ouvInt={};
 function changeV(){garderV();tuiles();ecranGerer();envoyerMasques()}
 $('gerer').addEventListener('toggle',function(ev){var d=ev.target,i=d&&d.getAttribute&&d.getAttribute('data-int');if(i)ouvInt[i]=d.open},true);
 $('produits').addEventListener('click',function(ev){var b=ev.target.closest('button');if(b)ouvrir(b.getAttribute('data-id'))});
 $('filtres').addEventListener('click',function(ev){var b=ev.target.closest('button');if(b){filtre=b.getAttribute('data-f');tuiles()}});
 $('commeSite').addEventListener('change',function(){commeSite=this.checked;tuiles();envoyerMasques()});
 $('bGerer').addEventListener('click',function(){gerer=true;ecranGerer();$('gerer').scrollTop=0;maj()});
 $('gerer').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var a;
  if(b.id==='gRetour'){gerer=false;maj();return}
  if((a=b.getAttribute('data-evm'))){avec(a).forEach(function(o){V.masque[o.id]=true});partsDe(a).forEach(function(k){V.pm[k]=true});changeV()}
  else if((a=b.getAttribute('data-eva'))){avec(a).forEach(function(o){delete V.masque[o.id]});partsDe(a).forEach(function(k){delete V.pm[k]});changeV()}
  else if((a=b.getAttribute('data-evx'))){V.ev=V.ev.filter(function(e){return e.id!==a});changeV()}
  else if((a=b.getAttribute('data-tag'))){a=a.split('|');var l=V.tags[a[0]],i=l.indexOf(a[1]);if(i>=0)l.splice(i,1);else l.push(a[1]);changeV()}
  else if(b.id==='evAj'){var n=$('evNom').value.trim();if(!n)return;if(V.ev.some(function(e){return e.nom.toLowerCase()===n.toLowerCase()})){etat('Cet évènement existe déjà.');return}V.ev.push({id:'ev'+Date.now(),nom:n});changeV();etat('Évènement « '+n+' » ajouté : rangez-y des créations plus bas.')}});
 $('gerer').addEventListener('change',function(ev){var t=ev.target,a;
  if((a=t.getAttribute('data-vis'))){if(t.checked)delete V.masque[a];else V.masque[a]=true;changeV()}
  else if((a=t.getAttribute('data-nv'))){if(t.checked)V.nouveau[a]=true;else delete V.nouveau[a];changeV()}
  else if((a=t.getAttribute('data-pvis'))){if(t.checked)delete V.pm[a];else V.pm[a]=true;changeV()}
  else if((a=t.getAttribute('data-pev'))){V.pt[a]=t.value;changeV()}});
 $('menu').addEventListener('click',function(){gerer=false;ouvrir(null)});
 $('fab').addEventListener('click',function(){if(!prets[cur]||occupe)return;occupe=true;etat('Fabrication des fichiers…');maj();cadres[cur].contentWindow.postMessage({type:'niv-fabriquer'},'*')});
 /* ma machine */
 function champsM(){['zw','zh','trait','jeu','ep'].forEach(function(k){var el=$('m-'+k);if(document.activeElement!==el)el.value=String(M[k]).replace('.',',')});
  $('machNote').textContent='Zone '+mm(M.zw)+' × '+mm(M.zh)+' mm. La suivent en entier : « Lettre ou chiffre à incruster » et « Boîte seule ». Rangent leurs planches à cette taille : la maisonnette et la décoration à prénom. Support de téléphone : sa planche fait 179 mm au plus. Arbre de vie : 180 × 180 mm, sans marge dans une zone de 180. Les autres créations ont des tailles fixes, plus petites.'}
 document.addEventListener('input',function(ev){var t=ev.target;if(!t.id||t.id.indexOf('m-')!==0)return;var k=t.id.slice(2),v=parseFloat(String(t.value).replace(',','.')),lim={zw:[50,3000],zh:[50,3000],trait:[0,0.6],jeu:[0,0.6],ep:[1,20]}[k];
  if(isNaN(v)||v<lim[0]||v>lim[1])return;M[k]=v;try{localStorage.setItem('niv-atelier-machine',JSON.stringify(M))}catch(e){}champsM();envoyerMachine()});
 function de(ev){for(var k in cadres)if(cadres[k].contentWindow===ev.source)return k;return null}
 function lienDl(nom,texte,mime){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texte],{type:mime||'image/svg+xml'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},800)}
 function enregistrer(nom,texte,suite,mime){
  if(SITE){var f=null;try{f=new File([texte],nom,{type:mime||'image/svg+xml'})}catch(e){}
   if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&window.matchMedia&&matchMedia('(pointer:coarse)').matches){
    navigator.share({files:[f],title:nom}).then(function(){suite('Fichier envoyé.')},function(e){if(e&&e.name==='AbortError')suite('');else{lienDl(nom,texte,mime);suite('Fichier enregistré.')}});return}
   lienDl(nom,texte,mime);suite('Fichier enregistré.');return}
  if(!dl){suite('L’enregistrement n’est pas disponible ici.');return}
  dl.save({filename:nom,data:texte}).then(function(){suite('Fichier enregistré.')},function(e){var c=e&&e.code;suite(c==='declined'?'':c==='rate_limited'?'Un instant, puis réessayez.':'L’enregistrement n’a pas abouti ici.')})}
 window.addEventListener('message',function(ev){var d=ev.data||{},k=de(ev);if(!k||!d.type)return;
  if(d.type==='niv-pret'){prets[k]=true;if(outil(k).machine)envoyerMachine();maj()}
  if(d.type==='niv-enregistrer'){enregistrer(d.nom,d.texte,function(m){if(m)etat(m+' ('+d.nom+')')},d.mime);return}
  if(k!==cur)return;
  if(d.type==='niv-progres')etat('Fabrication des fichiers… '+d.fait+' / '+d.total);
  if(d.type==='niv-erreur'){occupe=false;maj();etat('La fabrication a échoué : '+d.message)}
  if(d.type==='niv-fichiers'){occupe=false;resultat=d;montrer(d);maj()}});
 function montrer(d){var h='<h1>Vos fichiers pour la machine</h1><p>Taille réelle en millimètres. Rouge : découpe. Noir : gravure.</p>';
  if(d.alerte)h+='<p class="al" role="alert">'+esc(d.alerte)+' À corriger avant de découper.</p>';
  if(d.policesKo&&d.policesKo.length)h+='<p class="al" role="alert">Cet appareil n’a pas su charger l’écriture '+d.policesKo.map(function(n){return '« '+esc(n)+' »'}).join(', ')+' : regardez bien l’aperçu avant de graver.</p>';
  h+='<div class="grille">'+d.fichiers.map(function(f,i){return '<div class="carte"><img alt="Aperçu du fichier '+esc(f.titre||f.nom)+'" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(f.svg)+'">'
   +'<div><b>'+esc(f.titre||f.nom)+'</b><small>'+mm(f.w)+' × '+mm(f.h)+' mm'+(f.matiere?' · '+esc(f.matiere):'')+'</small>'+(f.note?'<small>'+esc(f.note)+'</small>':'')+'<small>'+esc(f.nom)+'</small></div>'
   +'<button type="button" class="btn or" data-i="'+i+'">Enregistrer ce fichier</button><div class="ok" role="status"></div></div>'}).join('')+'</div>'
   +'<p style="margin-top:14px"><button type="button" class="btn" id="encore">‹ Retoucher encore</button></p>';
  $('fich').innerHTML=h;$('fich').scrollTop=0}
 $('fich').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  if(b.id==='encore'){resultat=null;maj();return}
  var i=b.getAttribute('data-i');if(i==null||!resultat)return;var f=resultat.fichiers[+i],ok=b.nextElementSibling;ok.textContent='';enregistrer(f.nom,f.svg,function(m){ok.textContent=m})});
 if(SITE){$('gestion').hidden=false;$('gestion').addEventListener('click',function(ev){if(window.parent!==window){ev.preventDefault();try{parent.postMessage({type:'niv-fermer'},location.origin)}catch(e){}}})}
 if(!SITE&&window.claude&&claude.use)claude.use('downloads').then(function(n){dl=n||null},function(){});
 champsM();tuiles();maj();
})();
</script>
"""
import json
NOEL_DECO = ["Noël", "Bougies", "Sapins", "Cadeaux", "Cloches", "Flocons", "Rennes", "Chaussettes", "Bonnets"]
DESSINS_MAISON = [["christmas_deer", "Renne"], ["christmas_tree", "Sapin"], ["christmas_snowflake", "Flocon"], ["christmas_cottage", "Chalet"], ["christmas_angel", "Ange"],
                  ["christmas_bell", "Cloche"], ["christmas_snowman", "Bonhomme de neige"], ["christmas_gingerbread", "Pain d'épices"], ["christmas_stocking", "Chaussette"],
                  ["christmas_holly", "Houx"], ["christmas_candle", "Bougie"], ["christmas_bauble", "Boule"], ["christmas_santa_hat", "Bonnet"], ["christmas_candy_cane", "Sucre d'orge"],
                  ["christmas_sleigh", "Traîneau"], ["christmas_bow", "Nœud"], ["star", "Étoile"], ["heart", "Cœur"], ["moon", "Lune"], ["circle", "Rond"]]
PARTIES = {
    "deco": {"nom": "familles de dessins", "note": "Dans cet outil de l'atelier, toutes les familles restent proposées : c'est du site qu'elles disparaîtront.",
             "l": [[n, n, "noel"] for n in NOEL_DECO] + [[n, n, "paques"] for n in ["Œufs de Pâques", "Lapins"]] + [[n, n, ""] for n in ["Papillons", "Feuillages", "Fleurs", "Croix", "Formes", "Autres"]]},
    "prenom": {"nom": "modèles", "note": "Avec « Voir comme sur le site » coché à l'accueil, l'outil s'ouvre sans les modèles masqués.",
               "l": [["renne", "Renne", "noel"], ["bonnet", "Bonnet de Noël", "noel"], ["lapin", "Oreilles de lapin", "paques"], ["cornes", "Petit diable", ""]]},
    "maison": {"nom": "dessins de la façade", "note": "Avec « Voir comme sur le site » coché à l'accueil, l'outil s'ouvre sans les dessins masqués.",
               "l": [[i, n, "noel" if i.startswith("christmas_") else ""] for i, n in DESSINS_MAISON]},
}
assert INDEX.count("/*PARTIES*/{}") == 1
INDEX = INDEX.replace("/*PARTIES*/{}", json.dumps(PARTIES, ensure_ascii=False, separators=(",", ":")))
INDEX = INDEX.replace("/*SITE*/false", "true" if GESTION else "false")
if GESTION:
    open(os.path.join(out, "logiciel.html"), "w", encoding="utf-8").write(TETE + VAL.ajouter(INDEX)[0] + "</body></html>")
else:
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(VAL.ajouter(INDEX)[0])
tot = 0; nb = 0
for d, _, fs in os.walk(out):
    for n in fs: tot += os.path.getsize(os.path.join(d, n)); nb += 1
print(out, nb, "fichiers", round(tot / 1048576, 1), "Mo")
