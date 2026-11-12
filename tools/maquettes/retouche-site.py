#!/usr/bin/env python3
"""Les trois outils de création en « mode atelier », pour Gestion › Tests › Retoucher et fabriquer (12/11/2026).

Gérant : « c'est à moi de corriger… changer le nom, la position où je vais graver, je veux avoir accès pour tout corriger ».
Chaque page = la maquette telle quelle (support de téléphone, arbre de vie, décoration) + un petit script : habillage du
site masqué, exemple de départ (?ex=…), réglages fins des prénoms de l'arbre, et window.nivAtelier.fabriquer() qui
fabrique les VRAIS fichiers pour la machine dans le navigateur (public/atelier-outils/fabrique.js).

  python3 tools/maquettes/retouche-site.py <support.html> <arbre.html> <decoration.html> <dossier arbres> public/atelier-outils

Les trois .html d'entrée sont les sorties de support-createur.py, arbre-createur.py et decoration-createur.py.
Seul l'arbre « life » est copié (cœurs et cercles, 1 à 6 prénoms) : les huit autres pèsent 37 Mo.
"""
import os, shutil, sys

f_sup, f_arb, f_deco, d_arbres, out = sys.argv[1:6]
os.makedirs(os.path.join(out, "arbres"), exist_ok=True)
for n in sorted(os.listdir(d_arbres)):
    if n.startswith("life-"):
        shutil.copy(os.path.join(d_arbres, n), os.path.join(out, "arbres", n))

CSS_AT = """
.sc-bandeau,body>header,header.site-header,footer,.breadcrumb,nav[aria-label="Fil d'Ariane"],.trust-cards,.product-desc,.info-accordion,.pd-perso,.pd-nfois,
.pd-totbox,.qty-row,.price,.pd-rating,.sc-avalider,#modeles,.related,.confiance,.sc-vig-photos,#vignettes,.pd-titrerow .fav-btn,.announcement,.topbar{display:none!important}
#arbres .ab-arbre:not([data-v="life"]){display:none!important}
.pd-titrerow,.pd-titrerow+p,.price-lead{display:none!important}
body{background:#fbf7ee;padding-bottom:40px}
.at-reg{margin:14px 0;padding:12px 14px;border:1.5px solid #c9a24b;border-radius:14px;background:#fffaf0}
.at-reg h3{margin:0 0 4px;font:600 1rem 'Playfair Display',serif}.at-reg p{margin:0 0 8px;font-size:.82rem;color:#6b5d4a;line-height:1.45}
.at-l{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 0;border-top:1px solid #eadfc8}.at-l b{flex:1 1 90px;font-size:.88rem;min-width:0;overflow-wrap:anywhere}
.at-l button{min-width:38px;min-height:38px;border:1px solid #d9cbb0;border-radius:9px;background:#fff;font:600 1rem system-ui;cursor:pointer}
.at-l button:active{background:#f3e8d3}
"""
JS_COMMUN = r"""
(function(){
 var QUOI='__QUOI__',EX=(location.search.match(/[?&]ex=([a-z0-9-]+)/)||[])[1]||'';
 __INIT__
 /* l'état COMPLET de la création (forme, taille, pièces, textes, places) : c'est lui que la commande garde */
 function etat(){var o=JSON.parse(JSON.stringify(A().S));delete o.sel;delete o.panneau;return o}
 function recharger(e){if(!e||typeof e!=='object')return false;var S=A().S,k;
  for(k in S)if(Object.prototype.hasOwnProperty.call(S,k)&&!(k in e)&&k!=='sel'&&k!=='panneau')delete S[k];
  for(k in e)if(Object.prototype.hasOwnProperty.call(e,k))S[k]=JSON.parse(JSON.stringify(e[k]));
  if('sel' in S||QUOI!=='arbre'){S.sel=null;S.panneau=null}
  if(Array.isArray(S.els))S.seq=S.els.reduce(function(a,x){return Math.max(a,+x.id||0)},0);
  A().maj();if(typeof apresCharge==='function')apresCharge();window.scrollTo(0,0);return true}
 window.nivAtelier={quoi:QUOI,pret:false,alerte:alerte,etat:etat,charger:recharger,
  fabriquer:function(progres){return window.NivFabrique.fabriquer(window.NivFabrique.specs[QUOI](),progres)}};
 var essais=0;(function pret(){essais++;var ok=false;try{ok=charge()}catch(e){ok=false}
  if(ok||essais>80){setTimeout(function(){window.nivAtelier.pret=true;try{parent.postMessage({type:'niv-pret',quoi:QUOI},location.origin)}catch(_){}} ,600)}else setTimeout(pret,250)})();
})();
"""
INIT = {
"deco": r"""
 function A(){return window.scAtelier}
 function charge(){if(!A()||!document.querySelector('.sc-mod[data-m="0"]'))return false;
  if(EX==='coeur-photo')scDemo({forme:'Heart',photo:true,texte:'Mamie',mat:'acr-rouge',police:'great-vibes'});
  else document.querySelector('.sc-mod[data-m="'+(EX==='mamie'?4:0)+'"]').click();
  A().S.sel=null;A().dessiner();var ok=document.getElementById('modOk');if(ok)ok.remove();window.scrollTo(0,0);return true}
 function alerte(){var n=A().S.els.filter(function(e){return e.flottant}).length;return n?n+' pièce'+(n>1?'s ne touchent':' ne touche')+' pas le cadre : elle'+(n>1?'s tomberaient':' tomberait')+'.':''}
""",
"support": r"""
 function A(){return window.scAtelier}
 function charge(){if(!A()||!window.scDemo)return false;scDemo({forme:'rectangle',taille:'standard'});
  var S=A().S;S.els=S.els.filter(function(e){return e.type==='texte'});if(S.els[0])S.els[0].texte='Camille';S.sel=null;A().dessiner();window.scrollTo(0,0);return true}
 function alerte(){return ''}
""",
"arbre": r"""
 function A(){return window.abAtelier}
 function ligne(nom,cle){return '<div class="at-l" data-k="'+cle+'"><b>'+nom+'</b><button type="button" data-a="g" aria-label="Vers la gauche">←</button><button type="button" data-a="d" aria-label="Vers la droite">→</button>'
   +'<button type="button" data-a="h" aria-label="Vers le haut">↑</button><button type="button" data-a="b" aria-label="Vers le bas">↓</button><button type="button" data-a="m" aria-label="Plus petit">−</button><button type="button" data-a="p" aria-label="Plus grand">+</button><button type="button" data-a="0" aria-label="Remettre à sa place">↺</button></div>'}
 function echap(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
 function reglages(){var S=A().S,h='<h3>Réglages de l\'atelier</h3><p>Déplacez ou agrandissez chaque prénom dans son cœur, et le texte gravé sur le pied.</p>';
  S.noms.forEach(function(n,i){h+=ligne('« '+echap(n||'…')+' »','n'+i)});if(S.pied.grave)h+=ligne('Pied : « '+echap(S.pied.texte||'…')+' »','pied');
  var b=document.getElementById('atReg');if(!b){b=document.createElement('div');b.id='atReg';b.className='at-reg';var r=document.getElementById('resume');(r.closest('section')||r).parentNode.insertBefore(b,r.closest('section')||r);
   b.addEventListener('click',function(ev){var x=ev.target.closest('button');if(!x)return;var k=x.parentNode.getAttribute('data-k'),a=x.getAttribute('data-a'),S=A().S,o;
    if(k==='pied'){o=S.pied.aj=S.pied.aj||{dx:0,dy:0,s:1}}else{S.aj=S.aj||[];o=S.aj[+k.slice(1)]=S.aj[+k.slice(1)]||{dx:0,dy:0,s:1}}
    var pas=k==='pied'?1.5:2;if(a==='g')o.dx-=pas;if(a==='d')o.dx+=pas;if(a==='h')o.dy-=pas;if(a==='b')o.dy+=pas;if(a==='m')o.s=Math.max(.5,o.s-.06);if(a==='p')o.s=Math.min(1.6,o.s+.06);if(a==='0'){o.dx=0;o.dy=0;o.s=1}
    A().dessiner()})}
  b.innerHTML=h}
 var lance=false;
 function charge(){if(!A()||!window.abEtat)return false;
  if(!lance){lance=true;var S=A().S;S.arbre='life';S.forme='heart';S.noms=['Léa','Tom'];S.police='pacifico';S.pied.grave=true;S.pied.texte='Léa & Tom';S.pied.texte2='';S.pied.police='pacifico';S.pied.ou='deux';
   A().maj();reglages();var maj=function(){setTimeout(reglages,60)};
   ['input','click','change'].forEach(function(t){document.addEventListener(t,function(ev){if(ev.target.closest&&!ev.target.closest('#atReg'))maj()})});window.scrollTo(0,0)}
  return abEtat().pret}
 function alerte(){return abEtat().pret?'':'L\'arbre se charge encore.'}
 function apresCharge(){reglages()}
""",
}

MAJ = {
 "support": "maj:function(){voirCreation();majChoix();panneau();dessiner()}",
 "deco": "maj:function(){voirCreation();majFormes();majTaille();majMatiere();majStyle();panneau();dessiner()}",
}
def atelier(src, quoi, nom):
    s = open(src, encoding="utf-8").read()
    if quoi in MAJ:
        cle = "window.scAtelier={S:S,dessiner:function(){dessiner()}};"
        assert s.count(cle) == 1, quoi
        s = s.replace(cle, "window.scAtelier={S:S,dessiner:function(){dessiner()}," + MAJ[quoi] + "};")
    js = JS_COMMUN.replace("__QUOI__", quoi).replace("__INIT__", INIT[quoi])
    s = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
         '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Outil de l\'atelier</title></head><body>'
         + s + f'<style>{CSS_AT}</style><script src="fabrique.js"></script><script>{js}</script></body></html>')
    open(os.path.join(out, nom), "w", encoding="utf-8").write(s)
    print(nom, round(len(s.encode("utf-8")) / 1024), "Ko")

atelier(f_sup, "support", "atelier-support.html")
atelier(f_arb, "arbre", "atelier-arbre.html")
atelier(f_deco, "deco", "atelier-decoration.html")
