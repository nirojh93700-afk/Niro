"""Aperçu des marque-pages gravés (maquettes des modèles 1 et 2) — 24/10/2026.

Gérant : « il faut que le client choisisse : au-dessus, au milieu, ou derrière — pareil pour les deux maquettes —
et un aperçu pour qu'il comprenne, pas juste le numéro ». Ce module fournit, aux deux générateurs :
  · les photos redressées face / dos (zones données le 23/10, docs/maquettes/assets/marque-pages/zones/),
  · les 74 dessins + cadres DÉCOUPÉS des planches du gobelet (assets/marque-pages/dessins/<n°>.png, fond transparent,
    découpe faite par scratchpad/mpdec/cut.py puis contrôlée à l'œil),
  · le bloc HTML « Votre aperçu » (face et dos côte à côte), son CSS et le JS `mqApercu(host, items, hauteur)`.
Un élément = {kind:'dessin'|'photo'|'texte', num, src, text, font, side:'face'|'dos', zone:'haut'|'bas'}.
Texte en haut = sur une ligne ; texte en bas (« au milieu ») = à la verticale. Dessin en haut = petit, en bas = grand.
"""
import base64, io, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MP = os.path.join(ROOT, "docs", "maquettes", "assets", "marque-pages")
ZONES = json.load(open(os.path.join(MP, "zones", "zones-gravure.json"), encoding="utf-8"))


def _jpg(path, w=260, q=80):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode(), im.size


def _png(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()


def _centre_trou(im):
    """Centre du vide intérieur d'un cadre (fractions de l'image), pour y poser le texte bien au milieu (24/10 soir, gérant :
    « centre bien le nom pour qu'il soit au milieu dans le dessin »). Cartouches 92–94 : le vide fait > 50 % de la largeur →
    son centre ; rubans et ornements (pas de vide net) : centre géométrique."""
    a = im.convert("RGBA").split()[3]; W, H = im.size; px = a.load()
    rows = range(int(H * .42), int(H * .58) + 1)
    best, s0 = (0, 0, 0), None
    for x in range(W + 1):
        e = x < W and all(px[x, y] < 20 for y in rows)
        if e and s0 is None: s0 = x
        if not e and s0 is not None:
            if x - s0 > best[0]: best = (x - s0, s0, x)
            s0 = None
    if best[0] < W * 0.5:
        return [0.5, 0.5]
    cx = (best[1] + best[2]) / 2; col = int(cx)
    bv, s0 = (0, 0, 0), None
    for y in range(H + 1):
        e = y < H and px[col, y] < 20
        if e and s0 is None: s0 = y
        if not e and s0 is not None:
            if y - s0 > bv[0]: bv = (y - s0, s0, y)
            s0 = None
    cy = (bv[1] + bv[2]) / 2 if bv[0] else H / 2
    return [round(cx / W, 3), round(cy / H, 3)]


# Où s'écrit le texte dans chaque cadre (lu sur les dessins, 24/10 soir) : [x, y, hauteur du texte] en fractions de l'image
# (ou ["below" | "above", hauteur] = sous / au-dessus du dessin, plus utilisé). Rubans 88–91 : sur la bande. Cartouches 92–94 :
# centre du vide (calculé). ⚠️ 24/10 soir, gérant : « 102 et 103, c'est UNE image, pas deux ; pareil 96 et 97, 98 et 99 » →
# les cadres à deux filets sont 96 (= ex 96 + 97), 98 (= ex 98 + 99), 100, 101 et 102 (= ex 102 + 103) : le texte s'écrit ENTRE
# les deux filets (bande vide mesurée sur la découpe). Les n° 97, 99 et 103 n'existent plus.
POSE = {88: [0.5, 0.28, 0.4], 89: [0.5, 0.48, 0.4], 90: [0.5, 0.46, 0.4], 91: [0.5, 0.37, 0.36],
        96: [0.5, 0.601, 0.26], 98: [0.5, 0.614, 0.33], 100: [0.5, 0.613, 0.24], 101: [0.5, 0.65, 0.27], 102: [0.5, 0.5, 0.32]}


def dessins():
    d, asp, centre = {}, {}, {}
    for f in sorted(os.listdir(os.path.join(MP, "dessins"))):
        if f.endswith(".png"):
            n = int(f[:-4]); im = Image.open(os.path.join(MP, "dessins", f))
            d[n] = _png(os.path.join(MP, "dessins", f))
            asp[n] = round(im.width / im.height, 3)
            if n >= 75: centre[n] = POSE.get(n) or (_centre_trou(im) + [0.5])
    return d, asp, centre


# Zones par modèle. m1 : face = m1f, dos = m1d (23/10). m2 : face = m2f (haut = au-dessus de la fenêtre, bas = à gauche
# de la branche, TEXTE seulement) ; dos = bois nu sous la fenêtre ajourée (photo reconstituée m2-dos-apercu.jpg) :
# haut = même bande qu'au-dessus de la fenêtre, « milieu » = sous la fenêtre.
# Couleurs de la fiche ↔ photos redressées (tools/maquettes/marque-pages-redresse.py, 24/10 soir : « le visuel doit correspondre
# à la couleur que le client choisit »). Les clés = les titres des couleurs dans les maquettes.
COULEURS = {1: [("Caramel", "nanmu"), ("Blond clair", "buis"), ("Rouge", "santal"), ("Cuivré", "palissandre"),
               ("Gris anthracite", "ebene"), ("Gris sable", "suanzhi")],
            2: [("Blond clair", "blond"), ("Brun roux", "roux"), ("Sable", "sable"), ("Brun foncé", "noir")]}


def config(modele):
    faces = os.path.join(MP, "zones", "faces")
    couleurs = {}
    for nom, f in COULEURS[modele]:
        face_c, _ = _jpg(os.path.join(faces, f"m{modele}-{f}.jpg"))
        dos_c = face_c if modele == 1 else _jpg(os.path.join(faces, f"m{modele}-{f}-dos.jpg"))[0]
        couleurs[nom] = {"face": face_c, "dos": dos_c}
    if modele == 1:
        face, size = _jpg(os.path.join(MP, "zones", "m1-face.jpg"))
        dos, _ = face, None  # le dos du modèle 1 est le même bois nu (la photo du dos reçue est floue)
        zones = {"face": ZONES["m1f"], "dos": ZONES["m1d"]}
        labels = {"face": {"haut": "En haut, sous le trou", "bas": "Au milieu"}, "dos": {"haut": "En haut", "bas": "Au milieu"}}
    else:
        face, size = _jpg(os.path.join(MP, "zones", "m2-face.jpg"))
        dos, _ = _jpg(os.path.join(MP, "zones", "m2-dos-apercu.jpg"))
        zones = {"face": ZONES["m2f"],
                 "dos": {"haut": ZONES["m2f"]["haut"],
                         "bas": {"nom": {"x": 0.2, "y": 0.6, "w": 0.3, "h": 0.33}, "dessin": {"x": 0.12, "y": 0.58, "w": 0.76, "h": 0.37}}}}
        labels = {"face": {"haut": "Au-dessus de la fenêtre", "bas": "À côté de la fenêtre"}, "dos": {"haut": "En haut", "bas": "Au milieu"}}
    d, asp, centre = dessins()  # modèle 2 : dessins au DOS seulement (24/10, gérant : « il y a de la place au dos »)
    # 24/10 soir (gérant : « pour la photo, il faut que ce soit centré ») : sur un bois nu, tout est centré en largeur (les rectangles
    # du 23/10 gardent leur hauteur) ; la face du modèle 2 garde ses places (au-dessus de la fenêtre, à gauche de la branche).
    centrer = {"face": modele == 1, "dos": True}
    return {"photos": {"face": face, "dos": dos}, "couleurs": couleurs, "ratio": size[0] / size[1], "zones": zones, "labels": labels,
            "dessins": d, "aspect": asp, "centre": centre, "centrer": centrer}


def html(hauteur=460, id_="mq-ap"):
    return (f'<div class="mq-ap" id="{id_}"><p class="mq-aph">Votre aperçu <small>— tel que nous graverons (touchez pour agrandir)</small></p>'
            f'<div class="mq-apw" data-h="{hauteur}"></div></div>')


CSS = r'''
.mq-ap{margin:4px 0 16px;padding:12px;border:1px solid #e4d9bd;border-radius:14px;background:#fff}.mq-aph{margin:0 0 10px;font-weight:700;font-size:.9rem}.mq-aph small{font-weight:400;color:#7a6c48}
.mq-apw{display:flex;gap:18px;justify-content:center;align-items:flex-end;flex-wrap:wrap}.mq-aps{display:flex;flex-direction:column;align-items:center;gap:6px}
.mq-aps small{font-size:.74rem;color:#5a4d2c;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.mq-bm{position:relative;overflow:hidden;border-radius:6px;box-shadow:0 6px 16px rgba(43,38,32,.18);cursor:zoom-in;background:#e9dcc1}.mq-bm>img.bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.mq-el{position:absolute;display:flex;align-items:center;justify-content:center;transform-origin:center center}
.mq-el img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;opacity:.86;filter:sepia(.35) brightness(.42)}
.mq-el .t{white-space:nowrap;line-height:1;color:#3a2a12;mix-blend-mode:multiply;opacity:.9}
.mq-el.cadre .t{position:absolute;left:50%;top:50%;width:max-content;text-align:center}.mq-el .t{--dx:0px;--dy:0px}.mq-el.cadre .t{transform:translate(calc(-50% - var(--dx)),calc(-50% - var(--dy)))}.mq-el:not(.cadre) .t{transform:translate(calc(0px - var(--dx)),calc(0px - var(--dy)))}
.mq-el .ph{width:100%;height:100%;border:1.5px dashed #8a7a52;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#7a6c48;text-align:center;line-height:1.15;background:rgba(255,255,255,.25)}
.mq-el .ph img{filter:grayscale(1) sepia(.3) brightness(.6) contrast(1.15);opacity:.9}
.mq-sc .mq-ap{padding:8px;margin:0}
.mq-steps{display:flex;gap:10px;justify-content:center;padding:4px 0 10px}.mq-step{position:relative;width:52px;border:2px solid #e4d9bd;border-radius:12px;background:#fff;padding:3px;cursor:pointer;font:inherit}.mq-step img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}.mq-step span{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);background:#2b2620;color:#fff;border-radius:999px;font-size:.68rem;padding:1px 7px}.mq-step.on{border-color:#a98935;box-shadow:0 0 0 1px #a98935}.mq-step.done::after{content:'✓';position:absolute;top:-7px;right:-7px;background:#4f7a3a;color:#fff;border-radius:50%;width:18px;height:18px;font-size:.7rem;display:flex;align-items:center;justify-content:center}
.mq-same{display:flex;gap:8px;align-items:center;font-size:.85rem;margin:0 0 4px;cursor:pointer}.mq-same input{width:18px;height:18px;accent-color:#a98935;flex:none}.mq-same small{color:#7a6c48}.mq-stepnav{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0 10px}.mq-stepnav button{border:1.5px solid #c9b88a;background:#fff;border-radius:999px;padding:9px 14px;font:inherit;font-weight:600;color:#7c6120;cursor:pointer}.mq-stepnav button:disabled{opacity:.35}.mq-stepn{font-size:.82rem;color:#5a4d2c}.mq-sc[hidden]{display:none}.mq-sc.mq-locked .mq-grav{opacity:.5;pointer-events:none}.mq-lock-note{font-size:.78rem;color:#7a6c48;margin:0}.mq-sc .mq-grav{display:flex;flex-direction:column;gap:8px}.mq-sc .mq-sgrav{display:flex;flex-direction:column;gap:8px}.mq-sc .mq-sgrav[hidden]{display:none}.mq-sinfo{margin:0;font-size:.8rem;color:#5a4d2c;line-height:1.35}.mq-sc .mq-dessins{margin:0}.mq-sc .prc-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mq-sc .prc-ml{font-size:.62rem}.mq-sc .mq-pbtn{align-self:flex-start}.mq-sc .mq-scc{font-weight:400;color:#7a6c48;font-size:.8rem}
.mq-galap{position:absolute;inset:0;background:#f6efe1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;z-index:2}.mq-galap[hidden]{display:none}.mq-galap .mq-apw{align-items:center}.mq-galap-l{margin:0;font-size:.72rem;color:#7a6c48}.gallery-thumbs .mq-thap{display:flex;align-items:center;justify-content:center;background:#fbf3df;color:#7c6120;font-size:.64rem;font-weight:700;line-height:1.15;text-align:center;border:1.5px dashed #c9b88a;cursor:pointer}.mq-zoom-x{z-index:5}.mq-zoom-in .mq-bm{margin:34px auto 0}

/* 24/10 soir — éditeur à QUATRE emplacements (gérant : « s'il veut ajouter à l'avant et au dos, au-dessus et en bas, il faut qu'ils aient le choix ») */
.mq-ed{display:flex;flex-direction:column;gap:8px;margin:0 0 14px}.mq-edi{margin:0 0 2px;font-size:.8rem;color:#5a4d2c;line-height:1.35}
.mq-emp{border:1px solid #e4d9bd;border-radius:12px;background:#fff;padding:8px 10px;display:flex;flex-direction:column;gap:8px}.mq-emp.on{border-color:#a98935;background:#fffdf6;box-shadow:0 0 0 1px #a98935 inset}
.mq-emph{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.5fr);gap:8px;align-items:center}.mq-empl{display:flex;flex-direction:column;min-width:0}.mq-empl b{font-size:.84rem;line-height:1.2}.mq-empl small{font-size:.68rem;color:#8a7a52;line-height:1.2}
.mq-ed select.mq-empk,.mq-ed input.mq-empt,.mq-ed input.mq-empct{width:100%;box-sizing:border-box;min-width:0;padding:10px 10px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;font-size:.86rem;color:#2b2620;margin:0}
.mq-empb{display:flex;flex-direction:column;gap:8px}.mq-emp [hidden]{display:none!important}.mq-empd,.mq-empp{display:flex;flex-direction:column;gap:8px}.mq-empgo{align-self:flex-start}.mq-empcl{display:flex;flex-direction:column;gap:5px;font-size:.8rem;color:#5a4d2c}.mq-empd .mq-dessins{margin:0}.mq-empok{font-size:.84rem;color:#4f7a3a;font-weight:600;margin:0}
'''

JS = r'''
// Ajuste la taille d'un texte pour qu'il tienne dans maxW × maxH.
window.mqFit=function(t,maxW,maxH){var fs=maxH;t.style.fontSize=fs+'px';var n=0;while(n++<40&&fs>4&&t.offsetWidth>maxW){fs*=0.9;t.style.fontSize=fs+'px'}};
// Centrage sur l'ENCRE des lettres (24/10 soir) : la boîte d'une ligne garde de la place sous les lettres pour les jambages →
// un prénom sans jambage paraît trop haut (ou, à la verticale, décalé) ; on mesure les lettres réelles et on compense (--dx / --dy).
window.mqCentreEncre=function(t){try{var cs=getComputedStyle(t),fs=parseFloat(cs.fontSize);if(!fs)return;var c=window.mqCentreEncre.c||(window.mqCentreEncre.c=document.createElement('canvas').getContext('2d'));c.font=cs.fontStyle+' '+cs.fontWeight+' '+fs+'px '+cs.fontFamily;var m=c.measureText(t.textContent);
  var fbA=m.fontBoundingBoxAscent,fbD=m.fontBoundingBoxDescent;if(fbA==null){fbA=fs*0.8;fbD=fs*0.2}var lh=t.offsetHeight||fs,base=(lh-fbA-fbD)/2+fbA;var dy=base-(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2-lh/2;
  var dx=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2-m.width/2;t.style.setProperty('--dx',dx.toFixed(2)+'px');t.style.setProperty('--dy',dy.toFixed(2)+'px')}catch(err){}};
// Pose le dessin d'un cadre (im) et son texte (t) dans une boîte bw × bh ; cc = POSE du cadre ; renvoie [t, maxW, maxH] pour mqFit.
window.mqPoseCadre=function(el,im,t,cc,bw,bh,asp){cc=cc||[0.5,0.5,0.5];
  if(cc[0]==='below'||cc[0]==='above'){var dh2=Math.min(bw/asp,bh*0.62),dw2=dh2*asp,th=Math.min(bh-dh2,dh2*cc[1]),top0=(bh-dh2-th)/2,bas=cc[0]==='below';
    im.style.cssText='position:absolute;left:'+((bw-dw2)/2)+'px;width:'+dw2+'px;height:'+dh2+'px;top:'+(bas?top0:top0+th)+'px';
    t.style.left=(bw/2)+'px';t.style.top=(bas?top0+dh2+th/2:top0+th/2)+'px';return [t,dw2*0.9,th*0.85];}
  var dw=Math.min(bw,bh*asp),dh=Math.min(bh,bw/asp);t.style.left=((bw-dw)/2+cc[0]*dw)+'px';t.style.top=((bh-dh)/2+cc[1]*dh)+'px';return [t,dw*0.6,dh*(cc[2]||0.5)];};
// Coffret : UN marque-page à la fois (recherche du 24/10 soir : sur téléphone, 4 fiches empilées descendent trop bas ; un pas-à-pas avec
// les pastilles de chaque pièce et un récapitulatif visible vaut mieux que des onglets ou des accordéons qui cachent ce qui est saisi).
window.mqStepper=function(shb,cards,slots,imgs,st,onSame,onShow){
  var head=document.createElement('div');head.className='mq-steps';
  var pills=cards.map(function(c,i){var b=document.createElement('button');b.type='button';b.className='mq-step';b.innerHTML='<img src="'+imgs[slots[i].c]+'" alt=""/><span>'+(i+1)+'</span>';b.addEventListener('click',function(){show(i)});head.appendChild(b);return b});
  var same=document.createElement('label');same.className='mq-same';same.innerHTML='<input type="checkbox"'+(st.same?' checked':'')+'/><span>La même gravure sur les '+cards.length+' marque-pages <small>(chacun garde sa couleur)</small></span>';
  same.querySelector('input').addEventListener('change',function(e){st.same=e.target.checked;onSame()});
  var nav=document.createElement('div');nav.className='mq-stepnav';nav.innerHTML='<button type="button" class="mq-prev">‹ Précédent</button><span class="mq-stepn"></span><button type="button" class="mq-next">Suivant ›</button>';
  function show(i){st.cur=i;cards.forEach(function(c,j){c.hidden=j!==i});pills.forEach(function(p,j){p.classList.toggle('on',j===i)});nav.querySelector('.mq-stepn').textContent='Marque-page '+(i+1)+' sur '+cards.length;nav.querySelector('.mq-prev').disabled=i===0;nav.querySelector('.mq-next').textContent=i===cards.length-1?'Terminer ✓':'Suivant ›';shb.scrollTop=0;if(onShow)onShow(i)}
  nav.querySelector('.mq-prev').addEventListener('click',function(){show(Math.max(0,st.cur-1))});
  nav.querySelector('.mq-next').addEventListener('click',function(){if(st.cur===cards.length-1){var ok=document.getElementById('mq-ok');if(ok)ok.click()}else show(st.cur+1)});
  shb.insertBefore(same,shb.firstChild);shb.insertBefore(nav,shb.firstChild);shb.insertBefore(head,shb.firstChild);show(Math.min(st.cur||0,cards.length-1));
  return {show:show,refresh:function(done){pills.forEach(function(p,j){p.querySelector('img').src=imgs[slots[j].c];p.classList.toggle('done',!!done(slots[j]))})}}};
window.mqApercu=function(host,items,hauteur,couleur){ // couleur = titre de la couleur choisie → ses photos redressées (24/10 soir)
  var A=window.MQAP; if(!A||!host)return; var H=hauteur||+host.dataset.h||460, W=Math.round(H*A.ratio); var PH=(A.couleurs&&A.couleurs[couleur])||A.photos;
  host.innerHTML='';var fits=[];
  ['face','dos'].forEach(function(side){
    var s=document.createElement('div');s.className='mq-aps';
    var bm=document.createElement('div');bm.className='mq-bm';bm.style.width=W+'px';bm.style.height=H+'px';
    var bg=document.createElement('img');bg.className='bg';bg.src=PH[side];bg.alt='';bm.appendChild(bg);
    (items||[]).filter(function(e){return e&&e.side===side&&e.kind&&(e.kind!=='texte'||(e.text||'').trim())}).forEach(function(e){
      var z=A.zones[side][e.zone||'haut']; if(!z)return;
      var zz=(e.kind==='texte')?z.nom:z.dessin; var asp=(e.kind==='dessin')?(A.aspect[e.num]||1):(e.kind==='photo'?0.8:9);
      var vertical=(e.zone==='bas')&&(e.kind==='texte'||(e.kind==='dessin'&&(e.num>=75||asp>1.15))); // au milieu : texte, cadre et dessin large = à la verticale ; dessin haut et photo (portrait) = droits
      var x=zz.x*W,y=zz.y*H,w=zz.w*W,h=zz.h*H; if(A.centrer&&A.centrer[side])x=(W-w)/2;
      var el=document.createElement('div');el.className='mq-el'+(e.kind==='dessin'&&e.num>=75?' cadre':'');
      if(vertical){ // la boîte est posée tournée de 90° : largeur affichée = h, hauteur = w
        el.style.width=h+'px';el.style.height=w+'px';el.style.left=(x+w/2-h/2)+'px';el.style.top=(y+h/2-w/2)+'px';el.style.transform='rotate(-90deg)';
        var bw=h,bh=w;
      } else {el.style.left=x+'px';el.style.top=y+'px';el.style.width=w+'px';el.style.height=h+'px';var bw=w,bh=h;}
      if(e.kind==='dessin'){var im=document.createElement('img');im.src=A.dessins[e.num]||'';im.alt='';el.appendChild(im);
        if(e.num>=75&&(e.text||'').trim()){var t=document.createElement('span');t.className='t '+(e.font||'fnt-playfair');t.textContent=e.text.trim();el.appendChild(t);fits.push(window.mqPoseCadre(el,im,t,(A.centre||{})[e.num],bw,bh,asp));}
      } else if(e.kind==='photo'){var p=document.createElement('div');p.className='ph';if(e.src){var pi=document.createElement('img');pi.src=e.src;pi.alt='';p.style.border='0';p.appendChild(pi)}else p.textContent='votre photo';el.appendChild(p)}
      else {var t2=document.createElement('span');t2.className='t '+(e.font||'fnt-playfair');t2.textContent=e.text.trim();el.appendChild(t2);fits.push([t2,bw*0.96,bh*0.9]);}
      bm.appendChild(el);
    });
    bm.addEventListener('click',function(){var o=document.createElement('div');o.className='mq-zoom';var inn=document.createElement('div');inn.className='mq-zoom-in';inn.style.maxWidth='none';inn.style.width='auto';inn.innerHTML='<button type="button" class="mq-zoom-x" aria-label="Fermer">×</button>';var c=bm.cloneNode(true);var k=Math.min(0.8*window.innerHeight/H,(window.innerWidth-60)/W);c.style.zoom=k;c.style.cursor='default';inn.appendChild(c);o.appendChild(inn);o.addEventListener('click',function(ev){if(ev.target===o||ev.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)});
    var lab=document.createElement('small');lab.textContent=side==='face'?'Face':'Dos';s.appendChild(bm);s.appendChild(lab);host.appendChild(s);
  });
  fits.forEach(function(f){window.mqFit(f[0],f[1],f[2]);window.mqCentreEncre(f[0])});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fits.forEach(function(f){window.mqCentreEncre(f[0])})});
};
// 24/10 soir — QUATRE emplacements par marque-page (gérant : « s'il veut ajouter à l'avant et au dos, au-dessus et en bas, devant ou dos,
// il faut qu'ils aient le choix ») : chaque emplacement = rien / un texte (+3 €) / un dessin ou un cadre (+4 €, + 3 € si un texte s'écrit
// dans le cadre) / ma photo (+4 €). Valeurs v = {'face|haut':{k,t,n,src},…} ; le même éditeur sert à la fiche et à chaque carte du coffret.
window.MQ_EMP=[['face','haut'],['face','bas'],['dos','haut'],['dos','bas']];
window.mqEdVide=function(){var v={};window.MQ_EMP.forEach(function(e){v[e[0]+'|'+e[1]]={k:'',t:'',n:0,src:null}});return v};
window.mqEdCopie=function(v){var o={};for(var k in v)o[k]={k:v[k].k,t:v[k].t,n:v[k].n,src:v[k].src};return o};
window.mqEdPrix=function(v){var p=0;for(var k in v){var e=v[k];if(e.k==='texte'&&(e.t||'').trim())p+=3;else if(e.k==='dessin'&&e.n){p+=4;if(e.n>=75&&(e.t||'').trim())p+=3}else if(e.k==='photo')p+=4}return p};
window.mqEdItems=function(v,font){var it=[];for(var k in v){var e=v[k],s=k.split('|');if(e.k==='texte'&&(e.t||'').trim())it.push({kind:'texte',text:e.t,font:font,side:s[0],zone:s[1]});else if(e.k==='dessin'&&e.n)it.push({kind:'dessin',num:e.n,text:e.n>=75?e.t:'',font:font,side:s[0],zone:s[1]});else if(e.k==='photo')it.push({kind:'photo',src:e.src,side:s[0],zone:s[1]})}return it};
window.mqEdResume=function(v){var r=[],L={'face|haut':'face, en haut','face|bas':'face, au milieu','dos|haut':'dos, en haut','dos|bas':'dos, au milieu'};
  for(var k in v){var e=v[k],s='';if(e.k==='texte'&&(e.t||'').trim())s='« '+e.t.trim()+' »';else if(e.k==='dessin')s=e.n?(e.n>=75?'cadre n° '+e.n+((e.t||'').trim()?' « '+e.t.trim()+' »':''):'dessin n° '+e.n):'dessin à choisir';else if(e.k==='photo')s=e.src?'votre photo':'photo à envoyer';if(s)r.push(L[k]+' : '+s)}return r};
window.mqEditeur=function(host,o){ // o = {v, allow(side,zone)→['texte','dessin','photo'], onChange(), cg, cgEl, cgWrap}
  var A=window.MQAP,ed={v:o.v,active:null,blocks:{}};host.innerHTML='';host.classList.add('mq-ed');
  var intro=document.createElement('p');intro.className='mq-edi';intro.textContent='Quatre emplacements, chacun avec son menu : gravez-en un seul ou plusieurs. Par exemple un texte en haut et un dessin au milieu, ou l\'inverse, sur la face comme au dos. Un texte +3 €, un dessin, un cadre ou votre photo +4 €. Rien de coché = marque-page nu.';host.appendChild(intro);
  window.MQ_EMP.forEach(function(e){var side=e[0],zone=e[1],key=side+'|'+zone,ok=o.allow?o.allow(side,zone):['texte','dessin','photo'];if(!ok.length)return;
    var b=document.createElement('div');b.className='mq-emp';b.dataset.key=key;var lab=((A.labels||{})[side]||{})[zone]||zone;lab=lab.charAt(0).toLowerCase()+lab.slice(1);
    var sub=ok.length===1?(zone==='haut'?'texte sur une ligne':'texte à la verticale'):(zone==='haut'?'texte sur une ligne · dessin petit':'texte à la verticale · dessin grand');
    b.innerHTML='<div class="mq-emph"><span class="mq-empl"><b>'+(side==='face'?'Face':'Dos')+' · '+lab+'</b><small>'+sub+'</small></span><select class="mq-empk"><option value="">Rien</option>'+(ok.indexOf('texte')>=0?'<option value="texte">Texte (+3 €)</option>':'')+(ok.indexOf('dessin')>=0?'<option value="dessin">Dessin ou cadre (+4 €)</option>':'')+(ok.indexOf('photo')>=0?'<option value="photo">Ma photo (+4 €)</option>':'')+'</select></div>'
      +'<div class="mq-empb" hidden><input type="text" class="mq-empt" maxlength="24" placeholder="Ex : Léa"/><div class="mq-empd" hidden><p class="mq-empok" hidden></p><button type="button" class="prc-change mq-empgo" hidden>Choisir dans les planches</button><div class="mq-egrid"></div><label class="mq-empcl" hidden>Votre texte au milieu du cadre (+3 €), facultatif<input type="text" class="mq-empct" maxlength="24" placeholder="Ex : Léa"/></label></div>'
      +'<div class="mq-empp" hidden><label class="mq-pbtn">📷 Choisir ma photo<input type="file" accept="image/*" hidden/></label><span class="mq-photo-ok" hidden></span><p class="mq-sinfo">Nous la gravons en noir et blanc, bien au centre.</p></div></div>';
    var sel=b.querySelector('.mq-empk'),tt=b.querySelector('.mq-empt'),ct=b.querySelector('.mq-empct'),go=b.querySelector('.mq-empgo'),pf=b.querySelector('input[type=file]');
    sel.addEventListener('change',function(){var e2=ed.v[key];e2.k=sel.value;if(e2.k!=='dessin'){e2.n=0;if(ed.active===key)ed.demonte()}if(e2.k!=='photo')e2.src=null;if(e2.k==='dessin')ed.monte(key);else ed.refresh();o.onChange()});
    tt.addEventListener('input',function(){ed.v[key].t=tt.value;o.onChange()});ct.addEventListener('input',function(){ed.v[key].t=ct.value;o.onChange()});
    go.addEventListener('click',function(){ed.monte(key);b.scrollIntoView({behavior:'smooth',block:'start'})});
    pf.addEventListener('change',function(ev){var f=ev.target.files&&ev.target.files[0];if(!f){ed.v[key].src=null;ed.refresh();o.onChange();return}var r=new FileReader();r.onload=function(){ed.v[key].src=r.result;ed.v[key].nom=f.name;ed.refresh();o.onChange()};r.readAsDataURL(f)});
    ed.blocks[key]=b;host.appendChild(b)});
  ed.refresh=function(){for(var key in ed.blocks){var b=ed.blocks[key],e=ed.v[key]||{k:''},has=o.cgEl&&o.cgEl.parentNode===b.querySelector('.mq-egrid');
    b.querySelector('.mq-empk').value=e.k||'';b.classList.toggle('on',!!e.k);b.querySelector('.mq-empb').hidden=!e.k;
    var tt=b.querySelector('.mq-empt');tt.hidden=e.k!=='texte';if(e.k==='texte'&&tt.value!==(e.t||''))tt.value=e.t||'';
    var dd=b.querySelector('.mq-empd');dd.hidden=e.k!=='dessin';if(e.k==='dessin'){var okp=b.querySelector('.mq-empok'),go=b.querySelector('.mq-empgo');okp.hidden=has||!e.n;okp.textContent=e.n?(e.n>=75?'Cadre n° '+e.n+' choisi ✓':'Dessin n° '+e.n+' choisi ✓'):'';go.hidden=has;go.textContent=e.n?'Changer de dessin':'Choisir dans les planches';
      var ct=b.querySelector('.mq-empct');b.querySelector('.mq-empcl').hidden=!(e.n>=75);if(ct.value!==(e.t||''))ct.value=e.t||''}
    var pp=b.querySelector('.mq-empp');pp.hidden=e.k!=='photo';if(e.k==='photo'){var ok2=b.querySelector('.mq-photo-ok');ok2.hidden=!e.src;ok2.textContent=e.src?'Photo envoyée ✓'+(e.nom?' : '+e.nom:''):''}}};
  ed.monte=function(key){if(!o.cgEl||!ed.blocks[key])return;ed.active=key;ed.blocks[key].querySelector('.mq-egrid').appendChild(o.cgEl);o.cgEl.hidden=false;window.mqGridOwner=ed;if(o.cg&&o.cg.set)o.cg.set(ed.v[key].n);ed.refresh()};
  ed.demonte=function(){if(o.cgEl&&window.mqGridOwner===ed){o.cgWrap.appendChild(o.cgEl);window.mqGridOwner=null}ed.active=null;ed.refresh()};
  ed.remonte=function(){var k=ed.active;if(!k)for(var key in ed.v)if(ed.v[key].k==='dessin'){k=key;break}if(k)ed.monte(k);else ed.refresh()};
  ed.onNum=function(n){if(!ed.active)return;ed.v[ed.active].n=n;ed.refresh();o.onChange()};
  ed.set=function(v){ed.v=v;ed.active=null;if(window.mqGridOwner===ed)ed.remonte();else ed.refresh()};
  ed.refresh();return ed};

'''


def script_data(modele):
    return "window.MQAP=" + json.dumps(config(modele), ensure_ascii=False) + ";"


def script_data_dessins():
    """Seulement les découpes (pour le carnet : pas de photo de marque-page)."""
    d, asp, centre = dessins()
    return "window.MQDES=" + json.dumps({"dessins": d, "aspect": asp, "centre": centre}, ensure_ascii=False) + ";"


# Les planches du gobelet (maquette validée gobelet-configurateur-final.html) et les numéros acceptés sur un objet étroit
# (24/10 soir : 97, 99, 103 n'existent pas — 96, 98, 102 sont des cadres complets à deux filets).
NUMS_OK = list(range(1, 75)) + list(range(88, 95)) + [96, 98, 100, 101, 102]
LEG_D = [("1–10", "Fleurs & papillons"), ("11–27", "Roses"), ("28–36", "Volutes & arabesques"), ("37–45", "Cœurs & tiges fleuries"),
         ("46–51", "Fées & clé de sol"), ("52–55", "Fée & coins fleuris"), ("56–58", "Cœurs de couple (prénoms)"),
         ("59–64", "Cœur prénom, plumes, colibri"), ("65–70", "Animaux & oiseaux"), ("71–74", "Colibri, fée, musique")]


def grille_planches(id_prefix="mq", titre="Choisissez votre dessin", legende=None, tous_cadres=False):
    """Grille des planches (classes .prc-* du site) + champ numéro + « Changer de dessin ». tous_cadres : aussi 75–87 et 95."""
    import re
    gob = open(os.path.join(ROOT, "docs", "maquettes", "gobelet-configurateur-final.html"), encoding="utf-8").read()
    PL = json.loads(re.search(r"var PLANCHES=(\[.*?\]);", gob).group(1))
    CA = [c["src"] for c in json.loads(re.search(r"var CADRES=(\[.*?\]);", gob).group(1))]
    leg_c = [(CA[2], "88–91", "Rubans fins (sur la planche 82–91)"), (CA[3], "92–94", "Cartouches (sur la planche 92–95)"),
             (CA[4], "96, 98, 100, 101", "Filets & ornements"), (CA[5], "102", "Volute")]
    if tous_cadres:
        leg_c = [(CA[0], "75–79", "Cadres fleuris"), (CA[1], "80–81", "Banderoles fleuries"), (CA[2], "82–91", "Banderoles & rubans"),
                 (CA[3], "92–95", "Cartouches"), (CA[4], "96, 98, 100, 101", "Filets & ornements"), (CA[5], "102", "Volute")]
    def planche(src, a, b, kind, i):
        return (f'<button type="button" class="prc-model" data-kind="{kind}" data-i="{i}"><span class="prc-mn">{a}</span>'
                f'<span class="prc-mimg prc-mimg-photo"><img src="{src}" alt="Planche {a}" loading="lazy"></span>'
                f'<span class="prc-ml">{b}<br><em>n° {a}</em></span></button>')
    legende = legende or ("Touchez une planche pour l'agrandir et lire les numéros, puis indiquez le numéro. Un <b>dessin</b> (n° 1 à 74) "
                          "ou un <b>cadre</b> dans lequel s'écrit votre texte (n° 88 à 94, 96, 98, 100 à 102).")
    return (f'<div class="mq-dessins" id="{id_prefix}-dessins" hidden><p class="mq-dh">{titre}</p>'
            f'<p class="prc-legend" id="{id_prefix}-dleg">{legende}</p>'
            f'<div class="prc-grid mq-grid" id="{id_prefix}-gd">' + "".join(planche(s_, a, b, "d", i) for i, (s_, (a, b)) in enumerate(zip(PL, LEG_D)))
            + "".join(planche(s_, a, b, "c", i) for i, (s_, a, b) in enumerate(leg_c)) + '</div>'
            f'<div class="field mq-numf"><label for="{id_prefix}-num">Numéro du dessin ou du cadre</label>'
            f'<div class="mq-numrow"><input type="number" id="{id_prefix}-num" min="1" max="102" inputmode="numeric" placeholder="Ex : 12"/>'
            f'<button type="button" class="mq-numok" id="{id_prefix}-numok">Valider ✓</button></div></div>'
            f'<p class="prc-choisi" id="{id_prefix}-dok" hidden></p><button type="button" class="prc-change" id="{id_prefix}-dchg" hidden>Changer de dessin</button>'
            '</div>')


CSS_PLANCHES = r'''
.mq-dessins{margin:-4px 0 14px}.mq-dessins [hidden]{display:none!important}.mq-dh{font-weight:600;font-size:.9rem;margin:0 0 8px}.mq-dessins .prc-legend b{color:#2b2620}
.mq-grid .prc-mimg{aspect-ratio:3/4;background:#fff}.mq-grid .prc-mimg img{object-position:top}.mq-grid .prc-model[data-kind="c"] .prc-mimg{aspect-ratio:4/3}.prc-ml em{font-style:normal;font-weight:700;color:var(--gold-dark,#a98935)}
.mq-numf{margin:12px 0 0}.mq-numrow{display:flex;gap:8px;align-items:stretch}.mq-numf input{flex:1;min-width:0;width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #e0d3b0;background:#fffdf8;font:inherit}.mq-numok{flex:none;border:0;border-radius:10px;padding:0 16px;background:linear-gradient(#c9a24b,#a98935);color:#fff;font:inherit;font-weight:700;cursor:pointer}.mq-numok:disabled{opacity:.4;cursor:default}
.mq-zoom{position:fixed;inset:0;background:rgba(20,15,8,.72);z-index:5000;display:flex;align-items:center;justify-content:center;padding:14px}
.mq-zoom-in{position:relative;max-width:680px;width:100%;max-height:92vh;overflow:auto;background:#fff;border-radius:12px;padding:10px}.mq-zoom-in img{width:100%;height:auto;display:block;border-radius:8px}
.mq-zoom-x{position:absolute;top:6px;right:6px;width:38px;height:38px;border-radius:50%;border:0;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.3);font-size:22px;cursor:pointer;color:#2b2620;z-index:5}
'''

# JS de la grille : zoom d'une planche, numéro tapé, grille repliée. mqPlanches(prefix, ok, onChange) → {num}
JS_PLANCHES = r'''
window.mqZoom=function(src){var o=document.createElement('div');o.className='mq-zoom';o.innerHTML='<div class="mq-zoom-in"><button type="button" class="mq-zoom-x" aria-label="Fermer">×</button><img alt=""/></div>';o.querySelector('img').src=src;
  o.addEventListener('click',function(e){if(e.target===o||e.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)};
window.mqPlanches=function(prefix,ok,onChange){var st={num:0};var gd=document.getElementById(prefix+'-gd'),num=document.getElementById(prefix+'-num'),dok=document.getElementById(prefix+'-dok'),dchg=document.getElementById(prefix+'-dchg'),dleg=document.getElementById(prefix+'-dleg');
  if(!gd)return st;[].forEach.call(gd.querySelectorAll('.prc-model'),function(b){b.addEventListener('click',function(){[].forEach.call(gd.querySelectorAll('.prc-model'),function(x){x.classList.toggle('on',x===b)});window.mqZoom(b.querySelector('img').src)})});
  var nok=document.getElementById(prefix+'-numok');
  function plier(v){gd.hidden=v;dleg.hidden=v;dchg.hidden=!v;if(nok)nok.hidden=v}
  num.addEventListener('input',function(){var n=parseInt(num.value,10);st.num=ok.indexOf(n)>=0?n:0;dok.hidden=!num.value;
    dok.textContent=st.num?(st.num>=75?'Cadre n° '+st.num+' choisi ✓ — votre texte s\'écrit au milieu du cadre.':'Dessin n° '+st.num+' choisi ✓'):'Numéro : 1 à 74 pour un dessin, 88 à 94, 96, 98, 100 à 102 pour un cadre.';
    dok.classList.toggle('prc-miss',!st.num);if(onChange&&!st.quiet)onChange(st.num)});
  num.addEventListener('change',function(){if(st.num)plier(true)});num.addEventListener('keydown',function(e){if(e.key==='Enter'&&st.num){e.preventDefault();plier(true)}});
  dchg.addEventListener('click',function(){plier(false);gd.scrollIntoView({behavior:'smooth',block:'start'})});
  if(nok){nok.disabled=true;num.addEventListener('input',function(){nok.disabled=!st.num});nok.addEventListener('click',function(){if(st.num){num.blur();plier(true)}})}
  st.set=function(n){var q=st.quiet;st.quiet=true;num.value=n||'';num.dispatchEvent(new Event('input'));st.quiet=q;plier(!!n)};return st};
'''
