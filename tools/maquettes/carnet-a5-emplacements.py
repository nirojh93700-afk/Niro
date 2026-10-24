#!/usr/bin/env python3
"""Maquette « Carnet A5 gravé » v4 — QUATRE EMPLACEMENTS par face (couverture et dos) — 24/10/2026 soir.

Gérant : « même pour le carnet, s'il veut choisir plusieurs trucs… écrire tout en bas à gauche et mettre un titre : regarde sur
Internet comment ils font pour le carnet ». Relevé : Amikado (carnet liège) fait choisir gauche / centré / droite ; Levenger
oppose le coin inférieur discret au centre ; notonthehighstreet propose un titre OU une inscription dans le coin bas droit ;
Sense2 facture la 2ᵉ position (couverture arrière) en plus. → Même système que les marque-pages (v12) : sur la COUVERTURE et
au DOS, quatre emplacements — En haut (titre, une ligne) · Au milieu (grand) · En bas à gauche · En bas à droite (petits,
discrets) — chacun = Rien / Un texte (2 lignes possibles) / Un de nos dessins ou cadres (n°) / Mon logo ou mon propre dessin.
PRIX (mon choix, à valider, dans la règle « c'est sept euros pour les gravures ») : couverture gravée = +7 € quel que soit le
nombre d'emplacements remplis, dos gravé = +7 € pareil → 12,90 / 19,90 / 26,90 €.
Part de la maquette ENREGISTRÉE du 23/10 (artifact QSD8HCrAzEqrSEYA7viFMh v2 = la base) : son script et ses champs de gravure
sont REMPLACÉS ; galerie, couleurs, prix, description, volets : inchangés. Aperçu = la couverture dessinée (couleur choisie) avec
les éléments posés dans leurs zones ; le dos = la même couverture retournée (vignette « Dos » ajoutée). RIEN n'est en ligne.
Usage : python3.13 tools/maquettes/carnet-a5-emplacements.py <carnet-a5 v2 (base)> → docs/maquettes/carnet-a5.html (jamais commité).
"""
import base64, io, json, os, re, sys
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mp_apercu

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes", "carnet-a5.html")
h = open(sys.argv[1], encoding="utf-8").read()
assert "MQDES" not in h and "cn-face" not in h, "donner la maquette de BASE (v2)"


def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:80])
    return s.replace(a, b)


# 1) l'ancien script de la base (mode texte / logo) est retiré ; on garde ses photos de couverture (COUV)
m = re.search(r"<script>\s*\(function\(\)\{\s*var COUV=(\{.*?\}), ENCRE=.*?\}\)\(\);\s*</script>", h, flags=re.S)
assert m, "script de la base introuvable"
COUV = json.loads(m.group(1))
h = h[:m.start()] + h[m.end():]
# le dos = la couverture retournée (élastique à gauche)
DOS = {}
for c, uri in COUV.items():
    im = Image.open(io.BytesIO(base64.b64decode(uri.split(",", 1)[1]))).convert("RGB")
    b = io.BytesIO(); ImageOps.mirror(im).save(b, "JPEG", quality=80, optimize=True)
    DOS[c] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
# 2) l'ancien éditeur de texte posé sur la photo (te-block + réglette) est retiré
i = h.index('<div class="engrave-editor engrave-editor-text">'); j = h.index("<button", i)
h = h[:i] + h[j:]
# 2 bis) la mini-fenêtre « Votre aperçu » (figée dans la capture) et l'encadré « touchez et glissez » de l'ancien éditeur : retirés
g0 = h.index('<div class="mini-glass"'); g1 = h.index('</div></div></div>', g0) + len('</div></div></div>')
assert h.count('<div class="mini-glass"') == 1 and g1 - g0 < 400000, (g1 - g0)
h = h[:g0] + h[g1:]
h = re.sub(r'<div class="drag-hint">.*?</div>', '', h, count=1, flags=re.S)
assert 'class="drag-hint"' not in h and 'class="mini-glass"' not in h
# 3) les champs de gravure : du menu « Que voulez-vous faire graver » au texte du dos → l'éditeur à emplacements
a0 = h.index('<div class="field"><label for="pf-gravure">')
FIN = '<span class="char-count">0<!-- -->/<!-- -->40</span></div>'
a1 = h.index(FIN, a0) + len(FIN)
bloc = h[a0:a1]
pm = re.search(r'<div class="field"><label for="pf-police">.*?</select></div>', bloc, flags=re.S)
POLICE = pm.group(0)
GRID = mp_apercu.grille_planches("cn", "Choisissez votre dessin ou votre cadre",
        "Touchez une planche pour l'agrandir et lire les numéros, puis tapez le numéro et validez. Un <b>dessin</b> (n° 1 à 74) "
        "ou un <b>cadre</b> (n° 88 à 94, 96, 98, 100 à 102) dans lequel s'écrit votre texte.")
NEW = ('<p class="mq-edi">Quatre emplacements sur la couverture, quatre au dos, chacun avec son menu : gravez-en un seul ou '
       'plusieurs. Par exemple un titre en haut, un dessin au milieu et votre prénom en bas à gauche. La gravure de la couverture '
       'coûte 7 €, celle du dos 7 €, quel que soit le nombre d\'emplacements remplis.</p>'
       '<p class="mq-sub">Sur la couverture <small>(+7 €)</small></p><div id="cn-face" class="mq-ed"></div>'
       '<p class="mq-sub">Au dos <small>(+7 €)</small></p><div id="cn-dos" class="mq-ed"></div>'
       + POLICE + '<p class="perso-hint">Laissez « Rien » partout pour un carnet sans gravure.</p>'
       '<div id="cn-cgwrap" hidden>' + GRID + '</div>')
h = h[:a0] + NEW + h[a1:]
# 4) galerie : une vignette « Dos » après les 3 couvertures
k0 = h.index('<div class="gallery-thumbs">'); k1 = h.index("</div>", k0)
btns = re.findall(r"<button.*?</button>", h[k0:k1], flags=re.S); assert len(btns) == 5, len(btns)
THDOS = f'<button type="button" class="cn-thdos" aria-label="Le dos du carnet"><img src="{DOS["marron"]}" alt=""/><span>Dos</span></button>'
# Exemples de gravure (24/10 soir, gérant : « tu fais des exemples d'images pour montrer aux clients, tu mettras avec les images » —
# ⛔ jamais son nom dans un exemple) : rendus par tools/maquettes/carnet-a5-exemples.mjs avec le MÊME moteur d'aperçu, rangés dans
# docs/maquettes/assets/carnet/exemples/ ; s'ils manquent, la galerie reste sans exemple (lancer le générateur, puis le script, puis le générateur).
EXD = os.path.join(ROOT, "docs", "maquettes", "assets", "carnet", "exemples")
EX = sorted(f for f in os.listdir(EXD) if f.endswith(".jpg")) if os.path.isdir(EXD) else []
def exuri(f):
    im = Image.open(os.path.join(EXD, f)).convert("RGB"); b = io.BytesIO(); im.save(b, "JPEG", quality=82, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
THEX = "".join(f'<button type="button" class="cn-thex" aria-label="Exemple de gravure {i + 1}"><img src="{exuri(f)}" alt=""/><span>Exemple</span></button>' for i, f in enumerate(EX))
h = h[:k0] + '<div class="gallery-thumbs">' + "".join(btns[:3]) + THEX + THDOS + "".join(btns[3:]) + h[k1:]
h = rep(h, "couvertures dessinées en attendant vos photos gravées)", "couvertures dessinées en attendant vos photos gravées · quatre emplacements par face, 24/10)")

CSS = mp_apercu.CSS + mp_apercu.CSS_PLANCHES + r'''
.mq-sub{font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:#7c6120;font-weight:700;margin:14px 0 8px}.mq-sub small{text-transform:none;letter-spacing:0;font-weight:400;color:#7a6c48}
.mq-ed{margin:0 0 6px}.mq-edi{margin:0 0 6px;font-size:.84rem;color:#5a4d2c;line-height:1.4}
.mq-ed input.mq-empt2{width:100%;box-sizing:border-box;min-width:0;padding:10px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;font-size:.86rem;color:#2b2620;margin:0}
.mq-empl small{display:block}
.cn-ov{position:absolute;inset:0;pointer-events:none}.cn-el{position:absolute;display:flex;flex-direction:column;justify-content:center}
.cn-el.g{align-items:flex-start;text-align:left}.cn-el.c{align-items:center;text-align:center}.cn-el.d{align-items:flex-end;text-align:right}
.cn-el .l1,.cn-el .l2{white-space:nowrap;line-height:1.05;text-shadow:0 1px 0 hsla(0,0%,100%,.35),0 -1px 1px rgba(0,0,0,.3)}.cn-el .l2{margin-top:.25em;letter-spacing:.03em}
.cn-el img.d{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;filter:grayscale(1) contrast(1.5);opacity:.9}
.cn-ov.clair img.d{mix-blend-mode:screen;filter:grayscale(1) invert(1) contrast(1.3);opacity:.82}
.cn-el.cadre{position:absolute}.cn-el.cadre .t{position:absolute;left:50%;top:50%;width:max-content;white-space:nowrap;line-height:1;--dx:0px;--dy:0px;transform:translate(calc(-50% - var(--dx)),calc(-50% - var(--dy)));text-shadow:0 1px 0 hsla(0,0%,100%,.35),0 -1px 1px rgba(0,0,0,.3)}
.cn-el img.g{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.cn-el img.g.pos{object-position:left center}.cn-el img.g.posd{object-position:right center}
.gallery-thumbs .cn-thdos,.gallery-thumbs .cn-thex{position:relative}.gallery-thumbs .cn-thdos span,.gallery-thumbs .cn-thex span{position:absolute;left:0;right:0;bottom:0;background:rgba(43,38,32,.75);color:#fff;font-size:.6rem;font-weight:700;text-align:center;padding:2px 0}
'''
k = h.rfind("</style>"); h = h[:k] + CSS + h[k:]

JS = r'''
<script>
(function(){
  var D=window.MQDES, OK=__NUMS__, COUV=__COUV__, DOS=__DOS__, ENCRE={marron:'#2c160a',noir:'#c9c2b6',gris:'#2f2f31'};
  var BASE=12.9, GRAV=7, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  // Zones (fractions du visuel carré) : couverture = élastique à droite ; dos = la même retournée, zones décalées de 5 % vers la droite. Relevé sur le dessin : carnet
  // x 0,22–0,78, y 0,09–0,91, élastique ≈ 0,72–0,75.
  var ZF={haut:[.26,.14,.42,.10,'c'],milieu:[.25,.30,.44,.32,'c'],basg:[.26,.76,.20,.09,'g'],basd:[.48,.76,.20,.09,'d']};
  var ZD={};for(var kz in ZF){var z=ZF[kz];ZD[kz]=[z[0]+0.05,z[1],z[2],z[3],z[4]]} // au dos l'élastique est à gauche : la surface libre est décalée vers la droite
  var EMP=[['haut','En haut','titre, sur une ligne'],['milieu','Au milieu','grand : dessin, logo, texte'],['basg','En bas à gauche','petit, discret'],['basd','En bas à droite','petit, discret']];
  function vide(){var v={};EMP.forEach(function(e){v[e[0]]={k:'',t:'',t2:'',n:0,src:null,nom:''}});return v}
  var st={c:'marron',q:1,side:'face',v:{face:vide(),dos:vide()}};
  var main=document.getElementById('galmain'), gm=main.parentNode, fs=document.getElementById('pf-police');
  var tot=document.querySelector('.pd-totbox .val'), lead=document.querySelector('.price-lead'), qs=document.querySelector('.qty-stepper span'), qb=document.querySelectorAll('.qty-stepper button');
  var ov=document.createElement('div'); ov.className='cn-ov'; gm.appendChild(ov);
  var cgEl=document.getElementById('cn-dessins'), cgWrap=document.getElementById('cn-cgwrap');
  var cg=window.mqPlanches('cn',OK,function(n){if(window.mqGridOwner)window.mqGridOwner.onNum(n)});
  function plein(e){return (e.k==='texte'&&(e.t||'').trim())||(e.k==='dessin'&&e.n)||(e.k==='logo'&&e.src)}
  function faceOn(side){var v=st.v[side];for(var k in v)if(plein(v[k]))return true;return false}
  // ---- l'éditeur d'une face
  function editeur(host,side){var v=st.v[side],ed={side:side,active:null,blocks:{}};
    EMP.forEach(function(e){var key=e[0],b=document.createElement('div');b.className='mq-emp';b.dataset.key=key;
      b.innerHTML='<div class="mq-emph"><span class="mq-empl"><b>'+e[1]+'</b><small>'+e[2]+'</small></span><select class="mq-empk"><option value="">Rien</option><option value="texte">Un texte</option><option value="dessin">Un de nos dessins ou cadres (n°)</option><option value="logo">Mon logo ou mon propre dessin</option></select></div>'
        +'<div class="mq-empb" hidden><input type="text" class="mq-empt" maxlength="30" placeholder="Ex : Camille, Carnet de voyage…" hidden/><input type="text" class="mq-empt2" maxlength="40" placeholder="Deuxième ligne (facultatif) : une date, une citation courte" hidden/>'
        +'<div class="mq-empd" hidden><p class="mq-empok" hidden></p><button type="button" class="prc-change mq-empgo" hidden>Choisir dans les planches</button><div class="mq-egrid"></div><label class="mq-empcl" hidden>Votre texte au milieu du cadre, facultatif<input type="text" class="mq-empct" maxlength="24" placeholder="Ex : Camille"/></label></div>'
        +'<div class="mq-empp" hidden><label class="mq-pbtn">📷 Choisir mon logo ou mon dessin<input type="file" accept="image/*" hidden/></label><span class="mq-photo-ok" hidden></span><p class="mq-sinfo">Un logo net, en noir et blanc, donne le meilleur résultat ; il est gravé dans la teinte du cuir.</p></div></div>';
      var sel=b.querySelector('.mq-empk'),tt=b.querySelector('.mq-empt'),tt2=b.querySelector('.mq-empt2'),ct=b.querySelector('.mq-empct'),go=b.querySelector('.mq-empgo'),pf=b.querySelector('input[type=file]');
      sel.addEventListener('change',function(){var x=v[key];x.k=sel.value;if(x.k!=='dessin'){x.n=0;if(ed.active===key)ed.demonte()}if(x.k!=='logo')x.src=null;if(x.k==='dessin')ed.monte(key);else ed.refresh();maj()});
      tt.addEventListener('input',function(){v[key].t=tt.value;maj()});tt2.addEventListener('input',function(){v[key].t2=tt2.value;maj()});ct.addEventListener('input',function(){v[key].t=ct.value;maj()});
      go.addEventListener('click',function(){ed.monte(key);b.scrollIntoView({behavior:'smooth',block:'start'})});
      pf.addEventListener('change',function(ev){var f=ev.target.files&&ev.target.files[0];if(!f){v[key].src=null;ed.refresh();maj();return}var r=new FileReader();r.onload=function(){v[key].src=r.result;v[key].nom=f.name;ed.refresh();maj()};r.readAsDataURL(f)});
      ed.blocks[key]=b;host.appendChild(b)});
    ed.refresh=function(){for(var key in ed.blocks){var b=ed.blocks[key],e=v[key],has=cgEl.parentNode===b.querySelector('.mq-egrid');
      b.querySelector('.mq-empk').value=e.k;b.classList.toggle('on',!!e.k);b.querySelector('.mq-empb').hidden=!e.k;
      b.querySelector('.mq-empt').hidden=e.k!=='texte';b.querySelector('.mq-empt2').hidden=e.k!=='texte';
      var dd=b.querySelector('.mq-empd');dd.hidden=e.k!=='dessin';if(e.k==='dessin'){var okp=b.querySelector('.mq-empok'),go=b.querySelector('.mq-empgo');okp.hidden=has||!e.n;okp.textContent=e.n?(e.n>=75?'Cadre n° '+e.n+' choisi ✓':'Dessin n° '+e.n+' choisi ✓'):'';go.hidden=has;go.textContent=e.n?'Changer de dessin':'Choisir dans les planches';b.querySelector('.mq-empcl').hidden=!(e.n>=75)}
      var pp=b.querySelector('.mq-empp');pp.hidden=e.k!=='logo';if(e.k==='logo'){var ok2=b.querySelector('.mq-photo-ok');ok2.hidden=!e.src;ok2.textContent=e.src?'Logo choisi ✓ : '+e.nom:''}}};
    ed.monte=function(key){ed.active=key;ed.blocks[key].querySelector('.mq-egrid').appendChild(cgEl);cgEl.hidden=false;window.mqGridOwner=ed;cg.set(v[key].n);ed.refresh()};
    ed.demonte=function(){if(window.mqGridOwner===ed){cgWrap.appendChild(cgEl);window.mqGridOwner=null}ed.active=null;ed.refresh()};
    ed.onNum=function(n){if(!ed.active)return;v[ed.active].n=n;ed.refresh();maj()};
    ed.refresh();return ed}
  var edF=editeur(document.getElementById('cn-face'),'face'), edD=editeur(document.getElementById('cn-dos'),'dos');
  // ---- l'aperçu : les éléments posés sur la couverture (ou le dos) de la couleur choisie
  function dessine(){ov.innerHTML='';var side=st.side;if(!side)return;ov.classList.toggle('clair',st.c==='noir');
    var W=gm.clientWidth||600,H=gm.clientHeight||W,Z=side==='face'?ZF:ZD,v=st.v[side],fnt='fnt-'+(fs?fs.value:'playfair'),col=ENCRE[st.c],fits=[];
    for(var key in v){var e=v[key];if(!plein(e))continue;var z=Z[key],x=z[0]*W,y=z[1]*H,w=z[2]*W,hh=z[3]*H,al=z[4];
      var el=document.createElement('div');el.className='cn-el '+al;el.style.cssText='left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+hh+'px';
      if(e.k==='texte'){var l1=document.createElement('span');l1.className='l1 '+fnt;l1.textContent=e.t.trim();l1.style.color=col;el.appendChild(l1);var l2=null;
        if((e.t2||'').trim()){l2=document.createElement('span');l2.className='l2 '+fnt;l2.textContent=e.t2.trim();l2.style.color=col;el.appendChild(l2)}
        fits.push([l1,w*0.96,hh*(l2?0.58:0.85),l2]);}
      else if(e.k==='dessin'){var asp=D.aspect[e.n]||1,cadre=e.n>=75;if(cadre)el.classList.add('cadre');var im=document.createElement('img');im.className='d';im.src=D.dessins[e.n]||'';im.alt='';
        if(al!=='c'){var dw=Math.min(w,hh*asp);im.style.cssText='position:absolute;top:0;height:'+hh+'px;width:'+dw+'px;'+(al==='g'?'left:0':'right:0')}
        el.appendChild(im);
        if(cadre&&(e.t||'').trim()){var t=document.createElement('span');t.className='t '+fnt;t.textContent=e.t.trim();t.style.color=col;el.appendChild(t);var f=window.mqPoseCadre(el,im,t,(D.centre||{})[e.n],w,hh,asp);fits.push([f[0],f[1],f[2],null,true])}}
      else if(e.k==='logo'){var g=document.createElement('img');g.className='g d'+(al==='g'?' pos':al==='d'?' posd':'');g.src=e.src;g.alt='';el.appendChild(g)}
      ov.appendChild(el)}
    fits.forEach(function(f){window.mqFit(f[0],f[1],f[2]);if(f[3]){f[3].style.fontSize=(parseFloat(f[0].style.fontSize)*0.55)+'px'}if(f[4])window.mqCentreEncre(f[0])});}
  // ---- prix, galerie, couleurs
  function prix(){var n=BASE+(faceOn('face')?GRAV:0)+(faceOn('dos')?GRAV:0);tot.textContent=eur(n*st.q);if(lead)lead.textContent=eur(BASE);qs.textContent=st.q}
  function maj(){prix();dessine()}
  var th=[].slice.call(document.querySelectorAll('.gallery-thumbs button')),thdos=document.querySelector('.cn-thdos');
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.removeAttribute('srcset');
    if(b===thdos){st.side='dos';main.src=DOS[st.c]}else{var s=b.querySelector('img').src,couv=Object.keys(COUV).filter(function(k){return COUV[k]===s})[0];
      if(couv){st.c=couv;st.side='face';sw.forEach(function(x){x.classList.toggle('active',x.querySelector('.vs-title').textContent.trim().toLowerCase()===couv)});thdos.querySelector('img').src=DOS[couv]}else st.side=null;main.src=s}
    ov.hidden=!st.side;dessine()}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');
    st.c=b.querySelector('.vs-title').textContent.trim().toLowerCase();thdos.querySelector('img').src=DOS[st.c];if(st.side==='dos')montre(thdos);else montre(th[['marron','noir','gris'].indexOf(st.c)])})});
  if(fs)fs.addEventListener('change',maj);
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(20,st.q+1);maj()});
  window.addEventListener('resize',dessine);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(dessine);
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function hh(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)hh();else l.addEventListener('error',hh)});
  window.cnDemo=function(c,side,v){st.c=c;st.side=side;st.v[side]=Object.assign(vide(),v);sw.forEach(function(x){x.classList.toggle('active',x.querySelector('.vs-title').textContent.trim().toLowerCase()===c)});main.removeAttribute('srcset');main.src=side==='face'?COUV[c]:DOS[c];ov.hidden=false;dessine()}; // sert à carnet-a5-exemples.mjs
  if(th[0])th[0].classList.add('active');maj();
})();
</script>'''.replace("__NUMS__", str(mp_apercu.NUMS_OK)).replace("__COUV__", json.dumps(COUV)).replace("__DOS__", json.dumps(DOS))
h = h.replace("</body></html>\n</body></html>", "</body></html>")
h = rep(h, "</body></html>", "<script>" + mp_apercu.script_data_dessins() + mp_apercu.JS + mp_apercu.JS_PLANCHES + "</script>" + JS + "</body></html>")
open(OUT, "w", encoding="utf-8").write(h)
print("ok", len(h) // 1024, "Ko →", OUT)
