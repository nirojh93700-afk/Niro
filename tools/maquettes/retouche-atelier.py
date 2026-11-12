#!/usr/bin/env python3
"""Maquette Gestion « Retoucher avant de graver » (12/11/2026) — RIEN en ligne.

Gérant : « si c'est pas bon il faut que je modifie, je valide et ça me crée un fichier pour la machine… la personne place
mal, moi il faut que je place correctement derrière ». La fiche d'une commande (support de téléphone, arbre de vie,
décoration) rouvre la création de la cliente dans le MÊME outil ; il corrige, valide, le site fabrique les fichiers
(un par matière) et garde la version de la cliente à côté.

Trois pages « atelier » = les trois maquettes telles quelles + un petit script (habillage du site masqué, création de la
cliente chargée, réglages fins des prénoms de l'arbre) ; la page principale = la coquille de Gestion, qui les ouvre.

  python3 tools/maquettes/retouche-atelier.py <css du site> <support.html> <arbre.html> <decoration.html> <dossier arbres> <sortie> [vignettes.json]
"""
import json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gestion_coquille import shell, css_site, I

cssdir, f_sup, f_arb, f_deco, d_arbres, out = sys.argv[1:7]
VIG = json.load(open(sys.argv[7], encoding="utf-8")) if len(sys.argv) > 7 else {}
os.makedirs(os.path.join(out, "arbres"), exist_ok=True)
for n in os.listdir(d_arbres):          # seulement l'arbre de vie (cœurs et cercles, 1 à 6 prénoms) : le reste pèse 38 Mo
    if n.startswith("life-"):
        shutil.copy(os.path.join(d_arbres, n), os.path.join(out, "arbres", n))

# ---- ce qui est ajouté à chaque outil quand il est ouvert par l'atelier ----
CSS_AT = """
.sc-bandeau,body>header,header.site-header,footer,.breadcrumb,nav[aria-label="Fil d'Ariane"],.trust-cards,.product-desc,.info-accordion,.pd-perso,.pd-nfois,
.pd-totbox,.qty-row,.price,.pd-rating,.sc-avalider,#modeles,.related,.confiance,.sc-vig-photos,#vignettes,.pd-titrerow .fav-btn,.announcement,.topbar{display:none!important}
body{background:#fbf7ee}
.at-reg{margin:14px 0;padding:12px 14px;border:1.5px solid #c9a24b;border-radius:14px;background:#fffaf0}
.at-reg h3{margin:0 0 4px;font:600 1rem 'Playfair Display',serif}.at-reg p{margin:0 0 8px;font-size:.82rem;color:#6b5d4a;line-height:1.45}
.at-l{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 0;border-top:1px solid #eadfc8}.at-l b{flex:1 1 90px;font-size:.88rem;min-width:0;overflow-wrap:anywhere}
.at-l button{min-width:38px;min-height:38px;border:1px solid #d9cbb0;border-radius:9px;background:#fff;font:600 1rem system-ui;cursor:pointer}
.at-l button:active{background:#f3e8d3}
"""
JS_COMMUN = r"""
(function(){
 var QUOI='__QUOI__';
 function $(i){return document.getElementById(i)}
 function etat(){var f=$('fichier'),s=$('scene');return {quoi:QUOI,fnom:($('fnom')||{}).textContent||'',fichier:f?f.outerHTML:'',scene:s?s.outerHTML:'',fichiers:fichiers(),alerte:alerte()}}
 function dire(type){try{parent.postMessage(Object.assign({type:type},etat()),'*')}catch(_){}}
 window.addEventListener('message',function(ev){var d=ev.data||{};if(d.type==='valider')dire('valide');if(d.type==='etat')dire('etat')});
 __INIT__
 var essais=0;(function pret(){essais++;if(charge()||essais>40){setTimeout(function(){dire('pret')},500)}else setTimeout(pret,250)})();
})();
"""
INIT = {
"deco": r"""
 function A(){return window.scAtelier}
 function charge(){if(!A()||!document.querySelector('.sc-mod[data-m="0"]'))return false;
  document.querySelector('.sc-mod[data-m="0"]').click();
  /* la cliente a mal posé son prénom : trop petit, il ne touche le cadre que d'un côté */
  var S=A().S,t=S.els.filter(function(e){return e.type==='texte'})[0];if(t){t.auto=false;t.s*=.62;t.x-=12;t.y+=16;S.sel=null;A().dessiner()}
  var ok=document.getElementById('modOk');if(ok)ok.remove();window.scrollTo(0,0);return true}
 function fichiers(){var S=A().S,cl=S.style==='classique',m={},L=[];
  if(!cl)return [{nom:'decoration-'+S.forme+'-'+S.taille+'-EX-DECO1-contreplaque.svg',detail:'Contreplaqué 3 mm · la plaque découpée + la gravure'}];
  S.els.forEach(function(e){var k=(e.type==='texte'||(e.type==='dessin'&&e.mode!=='grave'))?(e.mat||'contreplaque'):'contreplaque';m[k]=(m[k]||0)+1});
  L.push({nom:'decoration-'+S.forme+'-'+S.taille+'-EX-DECO1-contreplaque.svg',detail:'Contreplaqué 3 mm · le cadre'+(m.contreplaque?' + '+m.contreplaque+' pièce'+(m.contreplaque>1?'s':''):'')});
  var N={'acr-bleu':'Acrylique bleu','acr-rouge':'Acrylique rouge','acr-blanc':'Acrylique blanc','acr-noir':'Acrylique noir'};
  Object.keys(m).forEach(function(k){if(k!=='contreplaque')L.push({nom:'decoration-'+S.forme+'-'+S.taille+'-EX-DECO1-'+k+'.svg',detail:N[k]+' 3 mm · '+m[k]+' pièce'+(m[k]>1?'s':'')+' à coller sur le cadre'})});return L}
 function alerte(){var n=A().S.els.filter(function(e){return e.flottant}).length;return n?n+' pièce'+(n>1?'s ne touchent':' ne touche')+' pas le cadre':''}
""",
"support": r"""
 function A(){return window.scAtelier}
 function charge(){if(!A()||!window.scDemo)return false;scDemo({forme:'rectangle',taille:'standard'});
  /* la cliente a posé son prénom trop bas, sur les fentes du pied */
  var S=A().S;S.els=S.els.filter(function(e){return e.type==='texte'});if(S.els[0]){S.els[0].texte='Camille';S.els[0].y+=118;S.els[0].x-=30}S.sel=null;A().dessiner();window.scrollTo(0,0);return true}
 function fichiers(){var S=A().S;return [{nom:'support-telephone-'+S.taille+'-'+S.forme+'-'+S.angle+'deg-EX-SUP1.svg',detail:'Contreplaqué 3 mm · le dossier et le pied'+(S.grave&&S.els.length?' + la gravure':'')+(S.ajoure?' + le motif ajouré':'')}]}
 function alerte(){return ''}
""",
"arbre": r"""
 function A(){return window.abAtelier}
 function ligne(nom,cle){return '<div class="at-l" data-k="'+cle+'"><b>'+nom+'</b><button type="button" data-a="g" aria-label="Vers la gauche">←</button><button type="button" data-a="d" aria-label="Vers la droite">→</button>'
   +'<button type="button" data-a="h" aria-label="Vers le haut">↑</button><button type="button" data-a="b" aria-label="Vers le bas">↓</button><button type="button" data-a="m" aria-label="Plus petit">−</button><button type="button" data-a="p" aria-label="Plus grand">+</button><button type="button" data-a="0" aria-label="Remettre à sa place">↺</button></div>'}
 function reglages(){var S=A().S,h='<h3>Réglages de l\'atelier</h3><p>Déplacez ou agrandissez chaque prénom dans son cœur, et le texte gravé sur le pied. La cliente n\'a pas ces réglages.</p>';
  S.noms.forEach(function(n,i){h+=ligne('« '+(n||'…')+' »','n'+i)});if(S.pied.grave)h+=ligne('Pied : « '+(S.pied.texte||'…')+' »','pied');
  var b=document.getElementById('atReg');if(!b){b=document.createElement('div');b.id='atReg';b.className='at-reg';var r=document.getElementById('resume');(r.closest('section')||r).parentNode.insertBefore(b,r.closest('section')||r);
   b.addEventListener('click',function(ev){var x=ev.target.closest('button');if(!x)return;var k=x.parentNode.getAttribute('data-k'),a=x.getAttribute('data-a'),S=A().S,o;
    if(k==='pied'){o=S.pied.aj=S.pied.aj||{dx:0,dy:0,s:1}}else{S.aj=S.aj||[];o=S.aj[+k.slice(1)]=S.aj[+k.slice(1)]||{dx:0,dy:0,s:1}}
    var pas=k==='pied'?1.5:2;if(a==='g')o.dx-=pas;if(a==='d')o.dx+=pas;if(a==='h')o.dy-=pas;if(a==='b')o.dy+=pas;if(a==='m')o.s=Math.max(.5,o.s-.06);if(a==='p')o.s=Math.min(1.6,o.s+.06);if(a==='0'){o.dx=0;o.dy=0;o.s=1}
    A().dessiner()})}
  b.innerHTML=h}
 function charge(){if(!A())return false;var S=A().S;S.arbre='life';S.forme='heart';S.noms=['Léa','Tom','Capucine'];S.police='pacifico';S.pied.grave=true;S.pied.texte='Famille Martin';S.pied.police='pacifico';S.pied.ou='deux';
  A().maj();reglages();document.getElementById('listeNoms').addEventListener('input',function(){setTimeout(reglages,50)});document.getElementById('listeNoms').addEventListener('click',function(){setTimeout(reglages,50)});
  document.getElementById('ajoutNom').addEventListener('click',function(){setTimeout(reglages,50)});window.scrollTo(0,0);return true}
 function fichiers(){var S=A().S,n=S.noms.length;return [{nom:'arbre-'+S.arbre+'-'+(S.forme==='heart'?'coeurs':'cercles')+'-'+n+'-prenoms-EX-ARB1.svg',detail:'Contreplaqué 3 mm · 180 × 180 mm · l\'arbre et les '+n+' prénoms, prêt à découper'},
   {nom:'arbre-'+S.arbre+'-'+n+'-prenoms-EX-ARB1-modifiable.svg',detail:'Le même, avec chaque prénom séparé (à déplacer dans le logiciel du laser, puis Unir)'},
   {nom:'pied-arbre-EX-ARB1.svg',detail:'Contreplaqué 3 mm · 129,5 × 136,25 mm · les 2 pièces'+(S.pied.grave?' + « '+S.pied.texte+' » gravé':'')}]}
 function alerte(){return ''}
""",
}

def atelier(src, quoi, nom):
    s = open(src, encoding="utf-8").read()
    js = JS_COMMUN.replace("__QUOI__", quoi).replace("__INIT__", INIT[quoi])
    s = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + s + f"<style>{CSS_AT}</style><script>{js}</script>"
    open(os.path.join(out, nom), "w", encoding="utf-8").write(s)

atelier(f_sup, "support", "atelier-support.html")
atelier(f_arb, "arbre", "atelier-arbre.html")
atelier(f_deco, "deco", "atelier-decoration.html")

# ---- la page de Gestion ----
CMD = [
 {"id": "deco", "page": "atelier-decoration.html", "ref": "EX-DECO1", "cliente": "Camille Durand", "quoi": "Décoration à suspendre · boule « Flocons de neige »",
  "detail": "Moyenne 9 cm · classique · « Camille » en acrylique bleu · 3 flocons", "alerte": "Le prénom est petit et décalé : il ne touche le cadre que d'un côté.", "total": "19,90 €"},
 {"id": "arbre", "page": "atelier-arbre.html", "ref": "EX-ARB1", "cliente": "Paul Mercier", "quoi": "Arbre de vie · 3 prénoms · pied gravé",
  "detail": "Cœurs · « Léa », « Tom », « Capucine » · pied « Famille Martin »", "alerte": "« Capucine » est long : à vérifier dans son cœur avant de découper.", "total": "32,90 €"},
 {"id": "support", "page": "atelier-support.html", "ref": "EX-SUP1", "cliente": "Inès Martin", "quoi": "Support de téléphone · standard · rectangle",
  "detail": "13° · passage du câble · « Camille » gravé", "alerte": "Le prénom est posé trop bas, sur les fentes du pied.", "total": "18,90 €"},
]
CSS = """
html,body{margin:0}body,.ash{font-family:Inter,system-ui,-apple-system,sans-serif}.ph-title{font-family:"Playfair Display",Georgia,serif}
.ash-side svg,.ash-top svg,.ash-tabs svg{width:18px;height:18px;flex:none}
.rt{max-width:1180px}.rt-intro{color:var(--ash-muted,#7a6d58);font-size:13.5px;line-height:1.55;max-width:72ch;margin:0 0 14px}
.rt-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))}
.rt-c{background:#fff;border:1px solid var(--ash-line-2,#e7dcc8);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;min-width:0}
.rt-h{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.rt-h b{font-size:14px}.rt-h span{font-size:12.5px;color:var(--ash-muted,#7a6d58)}
.rt-q{font-size:13.5px;font-weight:600;line-height:1.35}.rt-d{font-size:12.5px;color:var(--ash-muted,#7a6d58);line-height:1.45}
.rt-al{font-size:12.5px;line-height:1.4;padding:7px 10px;border-radius:9px;background:#fdf1ee;border:1px solid #e9b9ad;color:#8a2d1c}
.rt-vs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rt-v{border:1px solid var(--ash-line,#eee3d0);border-radius:10px;padding:6px;background:#fbf7ee;min-width:0}
.rt-v small{display:block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ash-muted,#7a6d58);margin-bottom:4px}
.rt-v .im{aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:7px;background:#f4ece0}
.rt-v .im svg,.rt-v .im img{width:100%;height:100%;object-fit:contain;display:block}
.rt-v.at{border-color:#c9a24b;background:#fffaf0}.rt-v.vide .im{color:var(--ash-muted,#7a6d58);font-size:12px;text-align:center;padding:8px;line-height:1.35}
.rt-b{display:flex;gap:8px;flex-wrap:wrap}
.rt-btn{min-height:40px;padding:8px 14px;border-radius:10px;border:1px solid var(--ash-line-2,#d9cbb0);background:#fff;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;color:#2b2216}
.rt-btn.or{background:linear-gradient(135deg,#e2c67e,#c9a24b);border-color:#a98935;color:#1a1206}.rt-btn:disabled{opacity:.5;cursor:default}
.rt-f{border-top:1px solid var(--ash-line,#eee3d0);padding-top:8px;display:grid;gap:6px}.rt-f h4{margin:0;font-size:12.5px}
.rt-fi{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.4}.rt-fi code{font:11.5px ui-monospace,Menlo,monospace;overflow-wrap:anywhere;color:#2b2216}
.rt-fi span{color:var(--ash-muted,#7a6d58);display:block}.rt-fi button{flex:none}
.rt-ok{font-size:12.5px;color:#256b34;font-weight:600}
.rt-ov{position:fixed;inset:0;z-index:9999;background:#fbf7ee;display:none;flex-direction:column}.rt-ov.on{display:flex!important}
.rt-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px;background:#1a1206;color:#fbf7ee}
.rt-bar b{flex:1 1 160px;font-size:13.5px;min-width:0;line-height:1.3}.rt-bar b small{display:block;font-weight:400;font-size:11.5px;color:#d9cbb0}
.rt-bar .rt-btn{min-height:38px}.rt-bar .x{background:transparent;color:#fbf7ee;border-color:#6b5d4a}
.rt-ov iframe{flex:1;width:100%;border:0;background:#fbf7ee}
.rt-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#1a1206;color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;z-index:10000;display:none;max-width:90vw;text-align:center}
.rt-toast.on{display:block!important}
.rt-f[hidden],.rt [hidden]{display:none!important}
.rt-pts{margin:16px 0 0;padding:12px 14px;border:1px solid var(--ash-line-2,#e7dcc8);border-radius:14px;background:#fff;font-size:13px;line-height:1.6}
.rt-pts b{display:block;margin-bottom:4px}.rt-pts ul{margin:0;padding-left:18px}
"""
cartes = ""
for c in CMD:
    v = VIG.get(c["id"], "")
    cartes += f"""<article class="rt-c" data-id="{c['id']}">
 <div class="rt-h"><b>#{c['ref']}</b><span>{c['cliente']} · {c['total']}</span></div>
 <div><div class="rt-q">{c['quoi']}</div><div class="rt-d">{c['detail']}</div></div>
 <div class="rt-al">⚠ {c['alerte']}</div>
 <div class="rt-vs"><div class="rt-v"><small>Version de la cliente</small><div class="im">{'<img src="'+v+'" alt="Création de la cliente">' if v else ''}</div></div>
  <div class="rt-v at vide"><small>Version de l'atelier</small><div class="im">Pas encore retouchée</div></div></div>
 <div class="rt-b"><button type="button" class="rt-btn or" data-a="ouvrir">Retoucher avant de graver</button><button type="button" class="rt-btn" data-a="tel">Fabriquer les fichiers tels quels</button></div>
 <div class="rt-f" hidden></div>
</article>"""
body = f"""<div class="rt">
<div class="ph"><div class="ph-row"><div class="ph-txt"><div class="ph-eyebrow">Commandes · exemples</div><h1 class="ph-title">Retoucher avant de graver</h1>
<p class="ph-sub">Maquette. Trois commandes d'exemple : chacune rouvre la création de la cliente dans le même outil qu'elle. Vous corrigez, vous validez, les fichiers pour la machine sont fabriqués.</p></div></div></div>
<div class="rt-grid">{cartes}</div>
<div class="rt-pts"><b>Ce que fait cet écran</b><ul>
<li>La création s'ouvre exactement comme la cliente l'a laissée. Vous pouvez tout changer : déplacer ou agrandir un nom, corriger le texte, l'écriture, la forme, la taille.</li>
<li>Arbre de vie : des flèches en plus pour déplacer chaque prénom dans son cœur et le texte du pied (la cliente ne les a pas).</li>
<li>« Valider » fabrique les fichiers, un par matière, rangés dans la commande. La version de la cliente reste gardée à côté.</li>
<li>Vous pouvez retoucher encore, ou revenir à la version de la cliente.</li>
<li>Dans cette maquette, rien ne se télécharge : les vrais fichiers d'essai sont dans Gestion → Tests.</li></ul></div>
</div>
<div class="rt-ov" id="ov" role="dialog" aria-modal="true" aria-label="Retouche de la création"><div class="rt-bar"><b id="ovT">Retouche<small id="ovS"></small></b>
<button type="button" class="rt-btn x" id="ovX">Fermer sans valider</button><button type="button" class="rt-btn or" id="ovOk">Valider et fabriquer les fichiers</button></div><iframe id="ovF" title="Outil de création"></iframe></div>
<div class="rt-toast" id="toast" role="status"></div>"""
JS = "var CMD=" + json.dumps(CMD, ensure_ascii=False) + r""";
(function(){
 function $(i){return document.getElementById(i)}
 var ov=$('ov'),fr=$('ovF'),cur=null,tel=null,etats={};
 function carte(id){return document.querySelector('.rt-c[data-id="'+id+'"]')}
 function cmd(id){for(var i=0;i<CMD.length;i++)if(CMD[i].id===id)return CMD[i]}
 function toast(t){var x=$('toast');x.textContent=t;x.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){x.classList.remove('on')},3200)}
 function heure(){var d=new Date();return d.getHours()+' h '+('0'+d.getMinutes()).slice(-2)}
 function ouvrir(id,direct){cur=id;tel=direct?id:null;var c=cmd(id);$('ovT').firstChild.textContent='Retouche · #'+c.ref+' · '+c.cliente;$('ovS').textContent=c.quoi;
  if(!direct)ov.classList.add('on');if(fr.getAttribute('data-id')!==id||direct){fr.setAttribute('data-id',id);fr.src=c.page}}
 function fermer(){ov.classList.remove('on');cur=null}
 function fichiers(id,d,retouche){var c=carte(id),F=c.querySelector('.rt-f'),h='<h4>Fichiers fabriqués à '+heure()+'</h4>';
  (d.fichiers||[]).forEach(function(f){h+='<div class="rt-fi"><div style="flex:1;min-width:0"><code>'+f.nom+'</code><span>'+f.detail+'</span></div><button type="button" class="rt-btn" data-a="dl">Télécharger</button></div>'});
  h+='<div class="rt-ok">✓ Rangés dans la commande'+(retouche?' · version de la cliente gardée':' · création de la cliente, sans retouche')+'</div>';
  if(d.alerte)h+='<div class="rt-al">⚠ '+d.alerte+' : à corriger avant de découper.</div>';
  F.innerHTML=h;F.hidden=false;
  var v=c.querySelector('.rt-v.at');
  if(retouche){v.classList.remove('vide');v.querySelector('.im').innerHTML=d.scene||'';var s=v.querySelector('svg');if(s){s.removeAttribute('id');s.querySelectorAll('[id]').forEach(function(e){e.id=id+'-'+e.id});
    s.innerHTML=s.innerHTML.replace(/url\(#/g,'url(#'+id+'-').replace(/href="#/g,'href="#'+id+'-');s.querySelectorAll('[stroke-dasharray]').forEach(function(e){e.remove()})}
   v.querySelector('small').textContent='Version de l\'atelier · '+heure();
   var b=c.querySelector('[data-a="ouvrir"]');b.textContent='Retoucher encore';
   if(!c.querySelector('[data-a="revenir"]')){var r=document.createElement('button');r.type='button';r.className='rt-btn';r.setAttribute('data-a','revenir');r.textContent='Revenir à la version de la cliente';c.querySelector('.rt-b').appendChild(r)}}}
 window.addEventListener('message',function(ev){var d=ev.data||{};if(!d.type||!fr.getAttribute('data-id'))return;var id=fr.getAttribute('data-id');
  if(d.type==='pret'){etats[id]=true;if(tel===id){tel=null;fr.contentWindow.postMessage({type:'valider'},'*');fr.setAttribute('data-direct','1')}}
  if(d.type==='valide'){var direct=fr.getAttribute('data-direct')==='1';fr.removeAttribute('data-direct');fichiers(id,d,!direct);if(direct){fr.removeAttribute('data-id');fr.src='about:blank'}else fermer();
   toast(direct?'Fichiers fabriqués avec la création de la cliente.':'Retouche validée : les fichiers sont fabriqués.')}});
 document.addEventListener('click',function(ev){var b=ev.target.closest('[data-a]');if(!b)return;var c=b.closest('.rt-c'),id=c&&c.getAttribute('data-id'),a=b.getAttribute('data-a');
  if(a==='ouvrir')ouvrir(id,false);
  else if(a==='tel'){toast('Fabrication des fichiers…');ouvrir(id,true)}
  else if(a==='dl')toast('Maquette : rien ne se télécharge ici. Les vrais fichiers d\'essai sont dans Gestion → Tests.');
  else if(a==='revenir'){var v=c.querySelector('.rt-v.at');v.classList.add('vide');v.querySelector('.im').textContent='Pas encore retouchée';v.querySelector('small').textContent='Version de l\'atelier';
   c.querySelector('.rt-f').hidden=true;c.querySelector('[data-a="ouvrir"]').textContent='Retoucher avant de graver';b.remove();if(fr.getAttribute('data-id')===id){fr.removeAttribute('data-id');fr.src='about:blank'}
   toast('Retour à la version de la cliente.')}});
 $('ovX').addEventListener('click',fermer);
 $('ovOk').addEventListener('click',function(){if(!etats[cur]){toast('L\'outil se charge encore, un instant.');return}fr.contentWindow.postMessage({type:'valider'},'*')});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('on'))fermer()});
})();"""
page = shell(title="Retouche atelier", crumb="Retoucher avant de graver", subtab="", css_site_txt=css_site(cssdir), css=CSS, body=body, js=JS,
             fonts="Playfair+Display:ital,wght@0,500;1,400&family=Inter:wght@400;600;700&family=Cinzel:wght@400;700&family=Cinzel+Decorative&family=Montserrat:wght@400;600&family=Great+Vibes&family=Allura&family=Pacifico")
open(os.path.join(out, "retouche.html"), "w", encoding="utf-8").write(page)
# pour l'artifact : la même page sans <html>/<head>/<body> (l'outil de publication les ajoute)
import re
tete = re.search(r"<head>(.*?)</head>", page, re.S).group(1)
tete = re.sub(r"<meta[^>]*>", "", tete)
corps = re.search(r"<body>(.*)</body>", page, re.S).group(1)
open(os.path.join(out, "retouche.fragment.html"), "w", encoding="utf-8").write(tete + corps)
print(os.path.join(out, "retouche.html"), ":", round(os.path.getsize(os.path.join(out, "retouche.html")) / 1024), "Ko")
