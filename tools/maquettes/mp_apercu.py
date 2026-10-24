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
def config(modele):
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
    return {"photos": {"face": face, "dos": dos}, "ratio": size[0] / size[1], "zones": zones, "labels": labels, "dessins": d, "aspect": asp, "centre": centre}


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
.mq-sc .mq-ap{padding:8px;margin:0}.mq-zoom-x{z-index:5}.mq-zoom-in .mq-bm{margin:34px auto 0}
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
window.mqApercu=function(host,items,hauteur){
  var A=window.MQAP; if(!A||!host)return; var H=hauteur||+host.dataset.h||460, W=Math.round(H*A.ratio);
  host.innerHTML='';var fits=[];
  ['face','dos'].forEach(function(side){
    var s=document.createElement('div');s.className='mq-aps';
    var bm=document.createElement('div');bm.className='mq-bm';bm.style.width=W+'px';bm.style.height=H+'px';
    var bg=document.createElement('img');bg.className='bg';bg.src=A.photos[side];bg.alt='';bm.appendChild(bg);
    (items||[]).filter(function(e){return e&&e.side===side&&e.kind&&(e.kind!=='texte'||(e.text||'').trim())}).forEach(function(e){
      var z=A.zones[side][e.zone||'haut']; if(!z)return;
      var zz=(e.kind==='texte')?z.nom:z.dessin; var asp=(e.kind==='dessin')?(A.aspect[e.num]||1):(e.kind==='photo'?0.8:9);
      var vertical=(e.zone==='bas')&&(e.kind!=='dessin'||e.num>=75||asp>1.15); // au milieu : texte, cadre et dessin large = à la verticale ; dessin haut = droit
      var x=zz.x*W,y=zz.y*H,w=zz.w*W,h=zz.h*H;
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
            f'<input type="number" id="{id_prefix}-num" min="1" max="102" inputmode="numeric" placeholder="Ex : 12"/></div>'
            f'<p class="prc-choisi" id="{id_prefix}-dok" hidden></p><button type="button" class="prc-change" id="{id_prefix}-dchg" hidden>Changer de dessin</button>'
            '</div>')


CSS_PLANCHES = r'''
.mq-dessins{margin:-4px 0 14px}.mq-dessins [hidden]{display:none!important}.mq-dh{font-weight:600;font-size:.9rem;margin:0 0 8px}.mq-dessins .prc-legend b{color:#2b2620}
.mq-grid .prc-mimg{aspect-ratio:3/4;background:#fff}.mq-grid .prc-mimg img{object-position:top}.mq-grid .prc-model[data-kind="c"] .prc-mimg{aspect-ratio:4/3}.prc-ml em{font-style:normal;font-weight:700;color:var(--gold-dark,#a98935)}
.mq-numf{margin:12px 0 0}.mq-numf input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #e0d3b0;background:#fffdf8;font:inherit}
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
  function plier(v){gd.hidden=v;dleg.hidden=v;dchg.hidden=!v}
  num.addEventListener('input',function(){var n=parseInt(num.value,10);st.num=ok.indexOf(n)>=0?n:0;dok.hidden=!num.value;
    dok.textContent=st.num?(st.num>=75?'Cadre n° '+st.num+' choisi ✓ — votre texte s\'écrit au milieu du cadre.':'Dessin n° '+st.num+' choisi ✓'):'Numéro : 1 à 74 pour un dessin, 88 à 94, 96, 98, 100 à 102 pour un cadre.';
    dok.classList.toggle('prc-miss',!st.num);if(onChange)onChange(st.num)});
  num.addEventListener('change',function(){if(st.num)plier(true)});num.addEventListener('keydown',function(e){if(e.key==='Enter'&&st.num){e.preventDefault();plier(true)}});
  dchg.addEventListener('click',function(){plier(false);gd.scrollIntoView({behavior:'smooth',block:'start'})});return st};
'''
