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


# Où s'écrit le texte dans chaque cadre (lu sur les dessins, 24/10 soir) : [x, y, hauteur du texte] en fractions de l'image,
# ou ["below" | "above", hauteur] = le texte se pose SOUS / AU-DESSUS du dessin (ornement avec un filet : 96, 98 = ornement
# au-dessus d'un filet → texte dessous ; 97, 99 = filet en haut → texte au-dessus). Rubans 88–91 : sur la bande.
# Deux filets (100, 101) : entre les deux. Cartouches 92–94 : centre du vide (calculé). Volutes 102–103 : au centre.
POSE = {88: [0.5, 0.28, 0.4], 89: [0.5, 0.48, 0.4], 90: [0.5, 0.46, 0.4], 91: [0.5, 0.37, 0.36],
        96: ["below", 0.8], 97: ["above", 0.8], 98: ["below", 0.8], 99: ["above", 0.8],
        100: [0.5, 0.62, 0.3], 101: [0.5, 0.655, 0.3], 102: [0.5, 0.5, 0.5], 103: [0.5, 0.5, 0.5]}


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
        if(e.num>=75&&(e.text||'').trim()){var t=document.createElement('span');t.className='t '+(e.font||'fnt-playfair');t.textContent=e.text.trim();el.appendChild(t);var cc=(A.centre||{})[e.num]||[0.5,0.5,0.5];
          if(cc[0]==='below'||cc[0]==='above'){ // le texte se pose sous / au-dessus du dessin : le dessin se serre pour lui laisser la place
            var dh2=Math.min(bw/asp,bh*0.62),dw2=dh2*asp,th=Math.min(bh-dh2,dh2*cc[1]),top0=(bh-dh2-th)/2,bas=cc[0]==='below';
            im.style.cssText='position:absolute;left:'+((bw-dw2)/2)+'px;width:'+dw2+'px;height:'+dh2+'px;top:'+(bas?top0:top0+th)+'px';
            t.style.left=(bw/2)+'px';t.style.top=(bas?top0+dh2+th/2:top0+th/2)+'px';fits.push([t,dw2*0.9,th*0.85]);
          } else {var dw=Math.min(bw,bh*asp),dh=Math.min(bh,bw/asp);t.style.left=((bw-dw)/2+cc[0]*dw)+'px';t.style.top=((bh-dh)/2+cc[1]*dh)+'px';fits.push([t,dw*0.6,dh*(cc[2]||0.5)]);}}
      } else if(e.kind==='photo'){var p=document.createElement('div');p.className='ph';if(e.src){var pi=document.createElement('img');pi.src=e.src;pi.alt='';p.style.border='0';p.appendChild(pi)}else p.textContent='votre photo';el.appendChild(p)}
      else {var t2=document.createElement('span');t2.className='t '+(e.font||'fnt-playfair');t2.textContent=e.text.trim();el.appendChild(t2);fits.push([t2,bw*0.96,bh*0.9]);}
      bm.appendChild(el);
    });
    bm.addEventListener('click',function(){var o=document.createElement('div');o.className='mq-zoom';var inn=document.createElement('div');inn.className='mq-zoom-in';inn.style.maxWidth='none';inn.style.width='auto';inn.innerHTML='<button type="button" class="mq-zoom-x" aria-label="Fermer">×</button>';var c=bm.cloneNode(true);var k=Math.min(0.8*window.innerHeight/H,(window.innerWidth-60)/W);c.style.zoom=k;c.style.cursor='default';inn.appendChild(c);o.appendChild(inn);o.addEventListener('click',function(ev){if(ev.target===o||ev.target.classList.contains('mq-zoom-x'))document.body.removeChild(o)});document.body.appendChild(o)});
    var lab=document.createElement('small');lab.textContent=side==='face'?'Face':'Dos';s.appendChild(bm);s.appendChild(lab);host.appendChild(s);
  });
  fits.forEach(function(f){fit(f[0],f[1],f[2]);centre(f[0])});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fits.forEach(function(f){centre(f[0])})});
  function fit(t,maxW,maxH){var fs=maxH;t.style.fontSize=fs+'px';var n=0;while(n++<40&&fs>4&&t.offsetWidth>maxW){fs*=0.9;t.style.fontSize=fs+'px'}}
  // Centrage sur l'ENCRE des lettres (24/10 soir) : la boîte d'une ligne garde de la place sous les lettres pour les jambages →
  // un prénom sans jambage paraît trop haut (ou, à la verticale, décalé) ; on mesure les lettres réelles et on compense.
  function centre(t){try{var cs=getComputedStyle(t),fs=parseFloat(cs.fontSize);if(!fs)return;var c=centre.c||(centre.c=document.createElement('canvas').getContext('2d'));c.font=cs.fontStyle+' '+cs.fontWeight+' '+fs+'px '+cs.fontFamily;var m=c.measureText(t.textContent);
    var fbA=m.fontBoundingBoxAscent,fbD=m.fontBoundingBoxDescent;if(fbA==null){fbA=fs*0.8;fbD=fs*0.2}var lh=t.offsetHeight||fs,base=(lh-fbA-fbD)/2+fbA;var dy=base-(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2-lh/2;
    var dx=(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2-m.width/2;t.style.setProperty('--dx',dx.toFixed(2)+'px');t.style.setProperty('--dy',dy.toFixed(2)+'px')}catch(err){}}
};
'''


def script_data(modele):
    return "window.MQAP=" + json.dumps(config(modele), ensure_ascii=False) + ";"
