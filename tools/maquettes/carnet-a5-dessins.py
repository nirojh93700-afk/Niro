#!/usr/bin/env python3
"""Maquette « Carnet A5 gravé » — AJOUT des dessins numérotés + texte dans un cadre + aperçu centré — 24/10/2026 soir.

Gérant : « ses dessins tu ajoutes aussi sur le carnet en option sur la maquette des carnets et pour les textes… il faut que tu
fasses aussi pour les carnets » (après le centrage du nom dans les cadres des marque-pages). RIEN n'est en ligne.
Part de la maquette ENREGISTRÉE du 23/10 (artifact QSD8HCrAzEqrSEYA7viFMh v2 ; la page complète se récupère avec
l'outil Artifact : read + path "index.html") et y AJOUTE :
  · dans « Que voulez-vous faire graver sur la couverture ? » : « Un de nos dessins ou cadres (n°) » entre le texte et le logo ;
  · les 14 planches du gobelet (même parcours que les marque-pages : planche agrandie au toucher, numéro tapé, grille repliée) ;
  · l'aperçu : le VRAI dessin gravé sur la couverture ; avec un cadre, la 1ʳᵉ ligne de texte s'écrit AU MILIEU du cadre (même
    centrage sur l'encre que les marque-pages : mp_apercu.mqPoseCadre / mqCentreEncre), la 2ᵉ ligne dessous ; avec un dessin
    (1–74), le texte s'écrit sous le dessin ; le texte seul est lui aussi centré sur l'encre des lettres.
Prix inchangé : la gravure de la couverture = +7 € (texte, dessin, dessin + texte, logo), le dos = +7 €.
Usage : python3.13 tools/maquettes/carnet-a5-dessins.py <carnet-a5 v2 (base)> → docs/maquettes/carnet-a5.html (jamais commité).
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mp_apercu

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes", "carnet-a5.html")
h = open(sys.argv[1], encoding="utf-8").read()
assert "MQDES" not in h, "donner la maquette de BASE (v2), pas une sortie de ce générateur"


def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:80])
    return s.replace(a, b)


# 1) le menu : un 3ᵉ choix, et le logo renommé pour ne pas se confondre avec nos dessins
h = rep(h, '<option value="photo">Un logo ou un dessin</option>',
        '<option value="dessin">Un de nos dessins ou cadres (n°)</option><option value="photo">Mon logo ou mon propre dessin</option>')
h = rep(h, "<label>Logo ou dessin à graver (+7 €)</label>", "<label>Votre logo ou votre dessin à graver (+7 €)</label>")
# 2) le bloc des planches, juste après le champ logo (caché tant que « nos dessins » n'est pas choisi)
GRID = mp_apercu.grille_planches("cn", "Choisissez votre dessin ou votre cadre",
        "Touchez une planche pour l'agrandir et lire les numéros, puis indiquez le numéro. Un <b>dessin</b> (n° 1 à 74) gravé au "
        "centre de la couverture, votre texte dessous — ou un <b>cadre</b> (n° 88 à 94, 96, 98, 100 à 102) : la première ligne de "
        "votre texte s'écrit au milieu du cadre, la deuxième dessous.")
GRID = GRID.replace('<div class="mq-dessins" id="cn-dessins" hidden>', '<div class="field mq-dessins" id="cn-dessins" hidden>', 1)
i = h.index('<div class="field" id="mq-photo-field"'); j = h.index('<div class="field"><label for="pf-texte">', i)
h = h[:j] + GRID + h[j:]
# 3) textes de la fiche : la description parle de la gravure
h = h.replace("Un logo ou un dessin</option>", "")  # (sécurité : plus aucune ancienne option)
# 4) CSS : grille + aperçu du dessin sur la couverture
CSS = mp_apercu.CSS_PLANCHES + r'''
.mq-dz{position:absolute;left:48%;top:40%;transform:translate(-50%,-50%);pointer-events:none}
.mq-dz .mq-el{position:absolute;left:0;top:0}
.mq-dz img.d{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;filter:grayscale(1) contrast(1.5);opacity:.9}
.mq-dz.clair img.d{mix-blend-mode:screen;filter:grayscale(1) invert(1) contrast(1.3);opacity:.82}
.mq-dz .t{position:absolute;left:50%;top:50%;width:max-content;white-space:nowrap;line-height:1;text-align:center;--dx:0px;--dy:0px;transform:translate(calc(-50% - var(--dx)),calc(-50% - var(--dy)));text-shadow:0 1px 0 hsla(0,0%,100%,.35),0 -1px 1px rgba(0,0,0,.3)}
.mq-dz .mq-sous{position:absolute;left:50%;transform:translate(-50%,0);text-align:center;white-space:nowrap;line-height:1.15;text-shadow:0 1px 0 hsla(0,0%,100%,.35),0 -1px 1px rgba(0,0,0,.3)}
.mq-dz .mq-sous .l2{display:block;font-size:.55em;margin-top:.2em;letter-spacing:.04em}
.te-block .te-line{--dx:0px;--dy:0px}.te-block.mq-une .te-line{transform:translate(calc(0px - var(--dx)),calc(0px - var(--dy)))}
'''
k = h.rfind("</style>"); h = h[:k] + CSS + h[k:]  # (deux <style> dans la base : le dernier)
# 5) JS : le mode « dessin »
JS = r'''
<script>
(function(){
  var D=window.MQDES, OK=__NUMS__;
  var gsel=document.getElementById('pf-gravure'), dfield=document.getElementById('cn-dessins');
  var t1=document.getElementById('pf-texte'), t2=document.getElementById('pf-texte2'), fs=document.getElementById('pf-police');
  var main=document.getElementById('galmain'), gm=main.parentNode, blk=document.querySelector('.te-block');
  var tot=document.querySelector('.pd-totbox .val'), qs=document.querySelector('.qty-stepper span');
  var ENCRE={marron:'#2c160a',noir:'#c9c2b6',gris:'#2f2f31'}, BASE=12.9, GRAV=7, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var dz=document.createElement('div'); dz.className='mq-dz'; gm.appendChild(dz);
  var pl=window.mqPlanches('cn',OK,function(){dessine()});
  function couleur(){var a=document.querySelector('.variant-swatches .variant-swatch.active .vs-title');return a?a.textContent.trim().toLowerCase():'marron'}
  function couvAffichee(){var th=document.querySelector('.gallery-thumbs button.active');return !th||th===document.querySelector('.gallery-thumbs button')||/couverture|visuel [123]\b/.test(main.alt||'')||true}
  function dessine(){
    var mode=gsel.value||'texte', c=couleur(); dz.innerHTML=''; dz.classList.toggle('clair',c==='noir');
    if(mode!=='dessin'||!pl.num){dz.style.display='none';return} dz.style.display='';
    var W=gm.clientWidth||600, bw=W*0.42, bh=W*0.28, asp=D.aspect[pl.num]||1, n=pl.num, cadre=n>=75;
    var el=document.createElement('div'); el.className='mq-el'+(cadre?' cadre':''); el.style.width=bw+'px'; el.style.height=bh+'px';
    var im=document.createElement('img'); im.className='d'; im.src=D.dessins[n]||''; im.alt=''; el.appendChild(im);
    dz.style.width=bw+'px'; dz.style.height=bh+'px'; dz.appendChild(el);
    var fnt='fnt-'+(fs?fs.value:'playfair'), l1=(t1.value||'').trim(), l2=(t2.value||'').trim(), col=ENCRE[c], sous='';
    if(cadre&&l1){var t=document.createElement('span'); t.className='t '+fnt; t.textContent=l1; t.style.color=col; el.appendChild(t);
      var f=window.mqPoseCadre(el,im,t,(D.centre||{})[n],bw,bh,asp); window.mqFit(f[0],f[1],f[2]); window.mqCentreEncre(t); sous=l2;}
    else sous=l1+(l2?'\n'+l2:'');
    if(sous){var s=document.createElement('div'); s.className='mq-sous '+fnt; s.style.color=col; s.style.fontSize=(W*0.055)+'px';
      var parts=sous.split('\n'); s.textContent=parts[0]; if(parts[1]){var b=document.createElement('span');b.className='l2';b.textContent=parts[1];s.appendChild(b)}
      var dh=cadre?Math.min(bh,bw/asp):Math.min(bh,bw/asp); s.style.top=((bh+dh)/2+W*0.012)+'px'; el.appendChild(s);}
  }
  // le texte seul (mode « texte ») : centré sur l'encre des lettres quand il n'y a qu'une ligne
  function centreTexte(){if(!blk)return;var l1=blk.querySelector('.te-line'),l2=blk.querySelector('.te-line2');var une=l1&&!(l2&&l2.textContent.trim());blk.classList.toggle('mq-une',!!une);if(une)window.mqCentreEncre(l1)}
  function prix(){var mode=gsel.value||'texte';if(mode!=='dessin')return;var dos=document.getElementById('pf-texteDos');var q=parseInt(qs.textContent,10)||1;
    tot.textContent=eur((BASE+(pl.num?GRAV:0)+((dos&&dos.value.trim())?GRAV:0))*q)}
  function maj(){var mode=gsel.value||'texte';dfield.hidden=mode!=='dessin';
    if(mode==='dessin'){[t1,t2,fs].forEach(function(e){if(e)e.closest('.field').style.display=''});if(blk)blk.style.display='none';}
    [].forEach.call(document.querySelectorAll('.ee-toolbar'),function(tb){tb.style.display=(mode==='dessin'||mode==='photo'||mode==='sans')?'none':''}); // la réglette du texte n'a de sens qu'avec le texte seul
    dessine(); prix(); setTimeout(centreTexte,0);}
  gsel.addEventListener('change',maj); [t1,t2].forEach(function(e){if(e)e.addEventListener('input',maj)}); if(fs)fs.addEventListener('change',maj);
  document.getElementById('cn-num').addEventListener('input',maj);
  [].forEach.call(document.querySelectorAll('.variant-swatches .variant-swatch,.gallery-thumbs button,.qty-stepper button,#pf-texteDos'),function(b){b.addEventListener(b.tagName==='INPUT'?'input':'click',function(){setTimeout(maj,0)})});
  window.addEventListener('resize',function(){dessine()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(maj);
  maj();
})();
</script>'''.replace("__NUMS__", str(mp_apercu.NUMS_OK))
h = h.replace("</body></html>\n</body></html>", "</body></html>")  # la base finit par deux fermetures
h = rep(h, "</body></html>", "<script>" + mp_apercu.script_data_dessins() + mp_apercu.JS + mp_apercu.JS_PLANCHES + "</script>" + JS + "</body></html>")
h = rep(h, "couvertures dessinées en attendant vos photos gravées)", "couvertures dessinées en attendant vos photos gravées · nos dessins numérotés + cadres, 24/10)")
open(OUT, "w", encoding="utf-8").write(h)
print("ok", len(h) // 1024, "Ko →", OUT)
