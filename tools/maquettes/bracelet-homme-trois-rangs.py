#!/usr/bin/env python3
"""Maquette « Bracelet Homme Trois Rangs » — 15/11/2026. RIEN n'est en ligne.

Gérant : récap Nihao NH10938159 / NH40746968 « bracelet homme décontracté en faux cuir, noir + or » (5 pièces, 2,27 €, 37 g)
+ photos (3 couleurs, TOUTES achetées : gérant « j'ai toutes les couleurs », 5 par couleur) + « là
aussi tu remplaces l'anglais par français, tu peux mettre tous les paquets ». Simili cuir (jamais « cuir »), plaque et perles
en acier inoxydable doré, 21 cm. Gravure de la plaque offerte. Prix : 27,90 € net (sans la remise −10 %), au-dessus de tous
les bracelets homme en ligne (17,91 à 27,81 €, gérant : « il y a d'autres bracelets, fais attention »). Emballages bracelet
long + Noël, tous. Photo des mesures en français : tools/maquettes/mesures-bracelet-trois-rangs-fr.py.

Usage : python3 tools/maquettes/bracelet-homme-trois-rangs.py <capture /produit/bracelet-homme-trois-rangs.html>
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "bracelet-homme-trois-rangs")
EMBA = os.path.join(OUT, "assets", "gourmette-doree-noire")
SRC = sys.argv[1]
PRIX = 21.90       # 16/11 (gérant : « 27,90 c'est trop ») : au-dessus des bracelets cuir en ligne (18,81 / 19,71), au niveau acier & silicone 21,51 ; avant 27,90
PXT = f"{PRIX:.2f}".replace(".", ",") + " €"


def uri(path, w=900, q=80):
    im = Image.open(path).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "svg": "image/svg+xml",
            "woff2": "font/woff2"}.get(ext, "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER, FOOTER, MAIN = src[body_start:i_main], src[j_main:src.rfind("</body>")], src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})" if garder else "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

PHOTOS = {"zz-maquette-bht-" + k + ".jpg": k + ".jpg" for k in ("trois-couleurs", "dore", "argente", "noir", "porte-argente", "argente-face", "argente-perles", "argente-fermoir", "mesures-fr")}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom]))}"'
    p = os.path.join(PUB, chemin.lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith((".jpg", ".jpeg", ".png")) and os.path.getsize(p) > 120_000:
        return f'{m.group(1)}="{uri(p)}"'
    return f'{m.group(1)}="{raw_uri(p)}"'
def next_image(m):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(m.group(1).replace("&amp;", "&")).query)
    return f'src="{q.get("url", [""])[0]}"'
def nettoie(html):
    html = re.sub(r'<button[^>]*>💬 Une question \?</button>', "", html)
    html = re.sub(r'<a[^>]*href="/boutique">🛍️ La boutique</a>', "", html)
    html = re.sub(r'src="(/_next/image\?[^"]+)"', next_image, html)
    html = re.sub(r'\s(?:srcset|srcSet)="[^"]*"', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
# Emballage : le bloc RÉEL du site (fiche Collier Pastille en ligne, 02/11/2026) avec les vraies photos de Gestion →
# Emballages (/api/img/<id>, copiées dans assets/barre-verticale/emb-*.jpg). La capture locale n'a pas les réglages de
# Gestion (icônes 🎁 à la place des photos, pas de bloc Noël). Le bloc Noël est rendu par le script (#mq-noel).
EMB_PHOTOS = {"w2B9e5M6txXoStg5VhJd": "emb-sac.jpg", "c0x7HAJqgOXaIwCn6vW5": "emb-boite-allongee.jpg",
              "mxgPGFyztb1et9ZsFiyM": "emb-microfibre.jpg", "Y2jvQFAhB9TKQ374wlfu": "emb-pack-bracelet.jpg"}
emb = open(os.path.join(EMBA, "emballage-site.html"), encoding="utf-8").read()
for rid, f in EMB_PHOTOS.items():
    emb = emb.replace(f"/api/img/{rid}", uri(os.path.join(EMBA, f), 160, 82))
emb = re.sub(r'<button type="button" class="xn-tog">.*?</button>', '<div id="mq-noel"></div>', emb, flags=re.S)
# Depuis le 07/11/2026 (gérant : « retirer la proposition sans emballage ») : plus de ligne « Sans emballage cadeau » sur les
# bijoux ; rien de choisi = pas d'emballage, toucher l'emballage choisi une 2e fois le retire.
emb, n = re.subn(r'<button type="button"[^>]*>(?:(?!</button>).)*?Sans emballage cadeau.*?</button>', "", emb, count=1, flags=re.S)
assert n == 1 and "Sans emballage" not in emb
emb = emb.replace('Choisissez votre présentation cadeau.</p>', 'Choisissez votre présentation cadeau. Touchez à nouveau l\'emballage choisi pour le retirer.</p>', 1)
assert 'id="mq-noel"' in emb and emb.count("data:image/jpeg") == 4
i_emb = MAIN.find('<div style="margin:6px 0 18px"><div style="font-weight:700;font-size:0.95rem;margin-bottom:3px">Votre emballage')
j_emb = MAIN.find('<div class="pd-totbox"', i_emb)
assert i_emb > 0 and j_emb > i_emb
MAIN = MAIN[:i_emb] + emb + MAIN[j_emb:]
NOEL_DIR = os.path.join(PUB, "produits", "noel", "emballages")
NOEL = [
  {"id": "sachet", "nom": "Sachet rouge de Noël", "d": "12 × 17 cm · plat, fermeture adhésive", "prix": 0.9, "photo": "7-sachet-rouge-O-remise.jpg", "colis": False, "fit": ["seul"]},
  {"id": "pochette", "nom": "Pochette à languette dorée", "d": "Bordeaux et or · pour un collier ou un bracelet", "prix": 3.9, "photo": "1-pochette-F.jpg", "colis": False, "fit": ["seul"]},
  {"id": "sac", "nom": "Sac de Noël à anses", "d": "Bordeaux, liseré or, nœud satin · 19 × 15 × 7 cm · plié à plat", "prix": 4.9, "photo": "2-sac-M.jpg", "colis": False, "fit": ["seul", "sac", "carree"]},
  {"id": "ruban", "nom": "Boîte à ruban « Merry Christmas »", "d": "11,5 × 7 × 4,5 cm · aimantée · vert sapin ou bleu nuit", "prix": 3.9, "photo": "3-5-boite-ruban-C-vert-recadree.jpg", "colis": True, "couleurs": True, "fit": ["seul"]},
  {"id": "rouge", "nom": "Boîte rouge au sapin doré", "d": "12 × 6 × 4 cm · ruban rouge et or", "prix": 3.9, "photo": "4-boite-rouge-G.jpg", "colis": True, "fit": ["seul"]},
  {"id": "pack", "nom": "Pack de Noël", "d": "Boîte à ruban (vert ou bleu nuit) + sac de Noël + étiquette", "prix": 7.9, "barre": 8.8, "photo": "2-sac-M.jpg", "colis": True, "couleurs": True, "meil": True, "fit": ["seul"]},
]
for o in NOEL:
    o["photo"] = uri(os.path.join(NOEL_DIR, o["photo"]), 160, 82)
COULEURS = [{"id": "vert", "nom": "Vert sapin", "hex": "#1f5a3a", "photo": uri(os.path.join(NOEL_DIR, "3-5-boite-ruban-C-vert-recadree.jpg"), 520, 80)},
            {"id": "bleu", "nom": "Bleu nuit", "hex": "#1f3561", "photo": uri(os.path.join(NOEL_DIR, "3-5-boite-ruban-J-bleu-recadree.jpg"), 520, 80)}]
ETIQ = uri(os.path.join(NOEL_DIR, "6-etiquettes-I.jpg"), 120, 80)
# 15/11/2026 (gérant : « enlève les 10 % maintenant pour tout ce qu'on va mettre ») : les nouveaux bijoux n'ont PAS la remise
# des bijoux : 19,90 € net, sans prix barré ni badge −10 %.
MAIN, n = re.subn(r'<span class="price-old">27,90\s€</span> <span class="price-sale">25,11\s€</span> <span class="promo-badge"[^>]*>.*?</span>',
                  '<span class="price-sale" style="color:var(--ink)">' + PXT + '</span>', MAIN, count=1, flags=re.S)
assert n == 1
MAIN = re.sub(r'<span class="vs-old">27,90\s€</span><span class="vs-now">25,11\s€</span>', '<span class="vs-now">' + PXT + '</span>', MAIN)
MAIN = re.sub(r'<span class="val">25,11\s€</span>', '<span class="val">' + PXT + '</span>', MAIN, count=1)
assert "25,11" not in MAIN[:MAIN.find("Vous aimerez aussi")]
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
assert "pd-totbox" in MAIN
for mot in ("hypoallerg", "sans nickel", "étanche", "fait main", "plaqué or", "Plaqué Or", "18K", "en or ", "ternit", "nisexe"):
    assert mot not in re.sub(r'data:[^"\')]+', '', MAIN), mot

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-detail{display:block;margin-top:4px;font-size:.8rem;color:var(--ink-soft)}
.mq-px{font-weight:600;color:#7c6120;margin-left:4px}.mq-px.off{color:#1c6b3a}
.ep-plate .ep-line small{display:block;font-family:var(--font-body,system-ui);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#7a6a4a;margin-bottom:2px}
'''
JS = r'''
(function(){
  var PRIX=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={q:1,emb:0};
  var tot=document.querySelector('.pd-totbox .val'),qs=document.querySelector('.qty-stepper span'),qb=document.querySelectorAll('.qty-stepper button');
  var det=document.createElement('span');det.className='mq-detail';document.querySelector('.pd-totbox').appendChild(det);
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));st.coulBijou=sw[0]?sw[0].querySelector('.vs-title').textContent:'';
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  var NOEL=__NOEL__, COUL=__COUL__, ETIQ=__ETIQ__;
  st.cat='seul'; st.noel=''; st.coul='vert'; st.ouvert=false;
  var box=document.getElementById('mq-noel');
  function prixNoel(){var o=NOEL.filter(function(x){return x.id===st.noel})[0];return o?o.prix:0}
  function dispo(){return NOEL.filter(function(o){return o.fit.indexOf(st.cat)>=0})}
  function coulDe(o){return o&&o.couleurs?(COUL.filter(function(c){return c.id===st.coul})[0]||COUL[0]):null}
  function thumb(o){var c=coulDe(o);return c&&o.id==='ruban'?c.photo:o.photo}
  function enColis(o){return (o&&o.colis)||st.cat==='carree'||st.cat==='pack'}
  function port(o){return enColis(o)?'votre bijou part en petit colis — <b>6,90 €</b> à domicile ou <b>4,90 €</b> en point relais, offerte dès 45 € de bijoux.':'votre bijou reste en lettre suivie — <b>4,90 €</b>, offerte dès 45 € de bijoux.'}
  function noel(){
    var d=dispo(), ch=d.filter(function(o){return o.id===st.noel})[0]||null;
    if(!ch)st.noel='';
    if(!d.length){box.innerHTML=st.cat!=='seul'?'<p class="xn-no">🎄 Pas d\'emballage de Noël avec cette présentation : elle n\'y rentre pas.</p>':'';return}
    var mini=Math.min.apply(null,d.map(function(o){return o.prix}));
    if(!st.ouvert){
      box.innerHTML=ch?'<button type="button" class="xn-tog on" data-a="ouvrir"><img class="th" src="'+thumb(ch)+'" alt=""><span style="min-width:0"><strong>🎄 Emballage de Noël : '+ch.nom+(coulDe(ch)?' · '+coulDe(ch).nom.toLowerCase():'')+'</strong><span class="d">étiquette « Merry Christmas » offerte · '+(enColis(ch)?'part en colis':'lettre suivie')+'</span></span><span class="px">+'+eur(ch.prix)+'<i>Modifier</i></span></button>'
        :'<button type="button" class="xn-tog" data-a="ouvrir"><span class="ico">🎄</span><span style="min-width:0"><strong>Ajouter un emballage de Noël</strong><span class="d">facultatif · dès '+eur(mini)+' · '+d.length+' choix</span></span><span class="px"><i>Voir ▾</i></span></button>';
      return;
    }
    var h='<div class="ft-embc xn"><div class="t">🎄 Votre emballage de Noël <button type="button" class="xn-close" data-a="fermer">Fermer ▴</button></div><p class="s">'+(st.cat==='seul'?'Le bijou est glissé dedans, prêt à offrir.':'Votre emballage choisi ci-dessus est glissé dedans, prêt à offrir.')+'</p><div class="opts">';
    d.forEach(function(o){var on=ch&&ch.id===o.id;h+='<button type="button" class="'+(on?'on':'')+'" data-n="'+o.id+'"><img class="th" src="'+thumb(o)+'" alt=""><span style="min-width:0"><strong>'+(on?'✓ ':'')+o.nom+(o.meil?'<span class="meil noel">🎄 NOËL</span>':'')+'</strong><span class="d">'+o.d+(o.colis?' · part en colis':' · reste en lettre suivie')+'</span></span><span class="px">'+(o.barre?'<span class="barre">'+eur(o.barre)+'</span>':'')+'+'+eur(o.prix)+'</span></button>'});
    if(ch)h+='<p class="xn-retirer">Touchez à nouveau l\'emballage choisi pour le retirer.</p>';
    if(ch&&ch.couleurs){h+='<div class="couleur"><div class="couleur-t">Couleur de la boîte <small>— choisissez</small></div><div class="couleur-g">';
      COUL.forEach(function(c){var on=coulDe(ch).id===c.id;h+='<button type="button" class="'+(on?'on':'')+'" style="--c:'+c.hex+'" data-c="'+c.id+'"><span class="couleur-ph"><img src="'+c.photo+'" alt="">'+(on?'<span class="couleur-ok">✓</span>':'')+'</span><span class="couleur-n"><i></i>'+c.nom+(on?' · choisi':'')+'</span></button>'});
      h+='</div></div>'}
    h+='<p class="etqoff"><img src="'+ETIQ+'" alt="">Avec chaque emballage de Noël, l\'étiquette « Merry Christmas » et sa ficelle sont offertes.</p>';
    h+='<p class="xn-port">'+(enColis(ch)?'📦':'✉️')+' Livraison'+(ch?' avec '+ch.nom.toLowerCase():'')+' : '+port(ch)+'</p></div></div>';
    box.innerHTML=h;
  }
  box.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
    if(b.dataset.a==='ouvrir')st.ouvert=true;else if(b.dataset.a==='fermer')st.ouvert=false;
    else if(b.dataset.n)st.noel=st.noel===b.dataset.n?'':b.dataset.n;else if(b.dataset.c)st.coul=b.dataset.c;
    maj()});
  function maj(){
    noel();
    var pn=prixNoel(), u=PRIX+(st.grav||0)+st.emb+pn;
    tot.textContent=eur(u*st.q); qs.textContent=st.q;
    det.textContent='Bracelet '+eur(PRIX)+(st.grav?' · 2e gravure '+eur(st.grav):'')+(st.emb?' · emballage '+eur(st.emb):'')+(pn?' · emballage de Noël '+eur(pn):'')+(st.q>1?' · × '+st.q:'');
  }
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    b.classList.add('active');b.setAttribute('aria-pressed','true');st.coulBijou=b.querySelector('.vs-title').textContent;
    var src=b.querySelector('img').src;main.src=src;th.forEach(function(x){x.classList.toggle('active',x.querySelector('img').src===src)});maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  // Emballage : un choix à la fois, prix lu sur le bouton.
  var titre=[].slice.call(document.querySelectorAll('div')).filter(function(d){return d.textContent.trim()==='Votre emballage'})[0];
  var embs=titre?[].slice.call(titre.parentNode.querySelectorAll('button[type=button]')):[];
  function prixDe(b){var t=b.lastElementChild.textContent.match(/\+\s*([\d,]+)/);return t?parseFloat(t[1].replace(',','.')):0}
  var CATS=['sac','allongee','seul','pack'];
  embs.forEach(function(b,k){b.addEventListener('click',function(){var deja=b.style.background==='rgb(255, 250, 240)';embs.forEach(function(x,kx){x.style.border='1.5px solid var(--line)';x.style.boxShadow='none';x.style.background=kx===3?'linear-gradient(180deg,#fffaf0,#fff)':'var(--paper)';
      var s=x.querySelector('strong');[].forEach.call(s.childNodes,function(t){if(t.nodeType===3)t.textContent=t.textContent.replace(/^✓\s*/,'')})});
    if(deja){st.emb=0;st.cat='seul';maj();return}
    b.style.border='1.5px solid var(--gold)';b.style.background='#fffaf0';b.style.boxShadow='0 0 0 2px rgba(194,161,78,.22)';
    var s=b.querySelector('strong'),t=[].filter.call(s.childNodes,function(x){return x.nodeType===3&&x.textContent.trim()})[0];if(t)t.textContent='✓ '+t.textContent;
    st.emb=prixDe(b);st.cat=CATS[k]||'seul';maj()})});
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  // Gravure : pendentif et bague. La 1re gravure est offerte, la 2e +3 € (règle du moins cher compris).
  var GR=[{id:'pf-texte',nom:'Plaque',max:20}];
  GR.forEach(function(g){g.inp=document.getElementById(g.id);g.lab=document.querySelector('label[for="'+g.id+'"] span');g.cc=g.inp?g.inp.parentNode.querySelector('.char-count'):null});
  var pol=document.getElementById('pf-police'),plate=document.querySelector('.ep-plate');
  st.grav=0;st.txt='';
  function grav(){var pleins=GR.filter(function(g){return g.inp&&g.inp.value.trim()});
    st.grav=pleins.length>1?3:0;
    GR.forEach(function(g){if(g.cc)g.cc.textContent=g.inp.value.length+'/'+g.max;
      var off=pleins.length===0||(pleins[0]===g)||(pleins.length===1&&false);
      if(pleins.length===1&&pleins[0]!==g)off=false;
      if(g.lab){g.lab.textContent=off?'(offert)':'(+3 €)';g.lab.style.color=off?'#1c6b3a':'var(--ink)'}});
    var c=/dor/i.test(st.coulBijou)?['#f3dc9a','#d7b25c','#5c4410','#7a5d1c']:/argent/i.test(st.coulBijou)?['#eceef0','#b9bdc2','#3d4044','#6b6f74']:['#2a2a2d','#141416','#d6d8db','#9a9ca0'];
    if(plate){plate.style.background='linear-gradient(135deg,'+c[0]+','+c[1]+')';
      plate.innerHTML=pleins.length?pleins.map(function(g){return '<span class="ep-line fnt-'+pol.value+'" style="color:'+c[2]+'"><small style="color:'+c[3]+'">'+g.nom+'</small>'+g.inp.value.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>'}).join(''):'<span class="ep-empty">Votre texte gravé apparaîtra ici…</span>'}
    maj()}
  GR.forEach(function(g){if(g.inp)g.inp.addEventListener('input',grav)});sw.forEach(function(b){b.addEventListener('click',grav)});if(pol)pol.addEventListener('change',grav);
  grav();
  maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX)).replace("__NOEL__", json.dumps(NOEL)).replace("__COUL__", json.dumps(COULEURS)).replace("__ETIQ__", json.dumps(ETIQ))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Bracelet Homme Trois Rangs » (nom proposé ; ' + PXT + ' sans remise) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Bracelet Homme Trois Rangs</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "bracelet-homme-trois-rangs.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "bracelet-homme-trois-rangs.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
