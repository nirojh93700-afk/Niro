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
VAL = import_module('ajouter-valider')   # le bouton « OK ✓ » des champs, dans chaque outil

demo, lettre, prenom, suspension, fleur, maison, out = sys.argv[1:8]
os.makedirs(out, exist_ok=True)

def copier_dossier(src, dst):
    os.makedirs(dst, exist_ok=True)
    for n in sorted(os.listdir(src)):
        p = os.path.join(src, n)
        if os.path.isdir(p): copier_dossier(p, os.path.join(dst, n))
        else: shutil.copy(p, os.path.join(dst, n))

# les trois outils de Gestion (avec leur pont) et ce qu'ils chargent
for n in sorted(os.listdir(demo)):
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
<div class="haut"><button type="button" class="bt" id="menu" aria-label="Tous les produits">☰ Produits</button><b>L'atelier</b><span class="nom" id="nom"></span><button type="button" class="bt or" id="fab" hidden>Fabriquer les fichiers</button></div>
<div class="etat" id="etat" role="status"></div>
<div class="corps" id="corps">
 <div class="ecran" id="accueil">
  <h1>Que voulez-vous fabriquer ?</h1>
  <p>Un seul logiciel pour toutes les créations : choisissez le produit, réglez-le, puis sortez les fichiers pour la machine. « ☰ Produits » ramène ici ; un produit déjà ouvert garde ses réglages.</p>
  <div class="grille" id="produits"></div>
  <h2>Ma machine</h2>
  <p>À régler une fois. Le jour où la machine change (grand format), changez la zone ici : les planches se rangent à cette taille.</p>
  <div class="mach">
   <label>Zone, largeur (mm)<input id="m-zw" inputmode="decimal"></label><label>Zone, hauteur (mm)<input id="m-zh" inputmode="decimal"></label>
   <label>Trait de coupe (mm)<input id="m-trait" inputmode="decimal"></label><label>Jeu des emboîtements (mm)<input id="m-jeu" inputmode="decimal"></label><label>Épaisseur du bois (mm)<input id="m-ep" inputmode="decimal"></label>
  </div>
  <p style="margin-top:8px" id="machNote"></p>
 </div>
 <div class="ecran" id="fich" hidden></div>
</div>
<script>
(function(){
 var OUTILS=[
  {id:'lettre',t:'Lettre ou chiffre à incruster, avec sa boîte',d:'Naissance : date, heure, signe, animal, prénom, et la boîte qui va dessous.',page:'lettre.html',e:'Fichiers dans l’outil · suit « Ma machine »',machine:true},
  {id:'support',t:'Support de téléphone',d:'Formes, tailles, gravure, motif ajouré.',page:'atelier-support.html',e:'Retouche pièce par pièce · fichiers',pont:true},
  {id:'arbre',t:'Arbre de vie à prénoms',d:'9 arbres, 1 à 6 prénoms, le pied.',page:'atelier-arbre.html',e:'Retouche pièce par pièce · fichiers',pont:true},
  {id:'deco',t:'Décoration à suspendre (Noël)',d:'46 formes, textes, photos, dessins.',page:'atelier-decoration.html',e:'Retouche pièce par pièce · fichiers',pont:true},
  {id:'prenom',t:'Décoration à prénom (Noël)',d:'Grande initiale, renne, bonnet, oreilles, cornes.',page:'prenom/index.html',e:'Créateur · planches en bas de la page'},
  {id:'suspension',t:'Suspension à prénoms',d:'Une forme par prénom, empilées.',page:'suspension.html',e:'Créateur · planches en bas de la page'},
  {id:'fleur',t:'Fleur à prénom',d:'26 fleurs, la tige porte le prénom.',page:'fleur.html',e:'Créateur · planches en bas de la page'},
  {id:'maison',t:'Maisonnette en bois',d:'8 pièces à tenons, suspendue ou sur guirlande.',page:'maison.html',e:'Créateur · planches en bas de la page'}];
 var $=function(i){return document.getElementById(i)},cadres={},prets={},cur=null,occupe=false,dl=null,resultat=null;
 var M={zw:200,zh:200,trait:0.1,jeu:0.1,ep:3};try{var t=JSON.parse(localStorage.getItem('niv-atelier-machine')||'null');if(t)for(var k in M)if(typeof t[k]==='number')M[k]=t[k]}catch(e){}
 function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
 function mm(v){return String(Math.round(v*10)/10).replace('.',',')}
 function outil(id){return OUTILS.filter(function(x){return x.id===id})[0]}
 function etat(t){$('etat').textContent=t}
 function maj(){var o=cur?outil(cur):null;
  for(var k in cadres)cadres[k].hidden=k!==cur||!!resultat;
  $('accueil').hidden=!!cur;$('fich').hidden=!resultat;$('nom').textContent=o?o.t:'';
  $('fab').hidden=!(o&&o.pont);$('fab').disabled=occupe||!prets[cur]||!!resultat;
  if(!occupe)etat(!o?'Choisissez un produit.':resultat?'Vos fichiers sont prêts.':o.pont?(prets[cur]?'Touchez une pièce pour la régler, puis « Fabriquer les fichiers ».':'L’outil se charge…'):o.machine?'Les fichiers se téléchargent en bas de l’outil (étape 6).':'Créateur : les planches pour la machine sont tout en bas de la page.')}
 function envoyerMachine(){var f=cadres.lettre;if(f&&f.contentWindow)f.contentWindow.postMessage({type:'niv-machine',machine:M},'*')}
 function ouvrir(id){if(occupe)return;cur=id;resultat=null;
  if(id&&!cadres[id]){var o=outil(id),f=document.createElement('iframe');f.title='Outil : '+o.t;f.src=o.page;if(o.machine)f.addEventListener('load',function(){setTimeout(envoyerMachine,300)});$('corps').appendChild(f);cadres[id]=f}
  maj()}
 $('produits').innerHTML=OUTILS.map(function(o){return '<button type="button" class="prod" data-id="'+o.id+'"><em>'+esc(o.e)+'</em><b>'+esc(o.t)+'</b><span>'+esc(o.d)+'</span></button>'}).join('');
 $('produits').addEventListener('click',function(ev){var b=ev.target.closest('button');if(b)ouvrir(b.getAttribute('data-id'))});
 $('menu').addEventListener('click',function(){ouvrir(null)});
 $('fab').addEventListener('click',function(){if(!prets[cur]||occupe)return;occupe=true;etat('Fabrication des fichiers…');maj();cadres[cur].contentWindow.postMessage({type:'niv-fabriquer'},'*')});
 /* ma machine */
 function champsM(){['zw','zh','trait','jeu','ep'].forEach(function(k){var el=$('m-'+k);if(document.activeElement!==el)el.value=String(M[k]).replace('.',',')});
  $('machNote').textContent='Aujourd’hui ce réglage est suivi par « Lettre ou chiffre à incruster » (zone '+mm(M.zw)+' × '+mm(M.zh)+' mm). Les sept autres outils ont encore leurs tailles fixes, prévues pour 200 × 200 mm : à ouvrir un par un, sur votre accord.'}
 document.addEventListener('input',function(ev){var t=ev.target;if(!t.id||t.id.indexOf('m-')!==0)return;var k=t.id.slice(2),v=parseFloat(String(t.value).replace(',','.')),lim={zw:[50,3000],zh:[50,3000],trait:[0,0.6],jeu:[0,0.6],ep:[1,20]}[k];
  if(isNaN(v)||v<lim[0]||v>lim[1])return;M[k]=v;try{localStorage.setItem('niv-atelier-machine',JSON.stringify(M))}catch(e){}champsM();envoyerMachine()});
 function de(ev){for(var k in cadres)if(cadres[k].contentWindow===ev.source)return k;return null}
 function enregistrer(nom,texte,suite){if(!dl){suite('L’enregistrement n’est pas disponible ici.');return}
  dl.save({filename:nom,data:texte}).then(function(){suite('Fichier enregistré.')},function(e){var c=e&&e.code;suite(c==='declined'?'':c==='rate_limited'?'Un instant, puis réessayez.':'L’enregistrement n’a pas abouti ici.')})}
 window.addEventListener('message',function(ev){var d=ev.data||{},k=de(ev);if(!k||!d.type)return;
  if(d.type==='niv-pret'){prets[k]=true;if(k==='lettre')envoyerMachine();maj()}
  if(d.type==='niv-enregistrer'){enregistrer(d.nom,d.texte,function(m){if(m)etat(m+' ('+d.nom+')')});return}
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
 if(window.claude&&claude.use)claude.use('downloads').then(function(n){dl=n||null},function(){});
 champsM();maj();
})();
</script>
"""
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(VAL.ajouter(INDEX)[0])
tot = 0; nb = 0
for d, _, fs in os.walk(out):
    for n in fs: tot += os.path.getsize(os.path.join(d, n)); nb += 1
print(out, nb, "fichiers", round(tot / 1048576, 1), "Mo")
