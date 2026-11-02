#!/usr/bin/env python3
"""Maquette « Bracelet Gourmette à plaque gravée » (doré / noir) — 02/11/2026. RIEN n'est en ligne.

Gérant : « Nouvelle fiche, fais la maquette 27,90 €, en stock cinq, gravure juste sur la plaque » (Nihaojewelry, acier 304,
plaqué or 18 carats pour le doré, 15 g). Prix : barré 30,90 € → la cliente paie 27,81 € (code 33,90), gravure +3 €.
Méthode = celle du Collier Quatre Mots (fiche ajoutée EN LOCAL, capture de /produit/bracelet-gourmette-plaque, fichiers
remis à l'identique) ; bloc « Votre emballage » = celui du site en ligne (fiche Bracelet Homme Identité, vraies photos) +
bloc Noël rendu par le script ; l'aperçu 3D (qui tourne sur le site) est montré par une capture faite sur la machine.

Usage : python3 tools/maquettes/gourmette-plaque.py <capture /produit/bracelet-gourmette-plaque.html>
Sortie : docs/maquettes/gourmette-plaque.html (+ .fragment.html, non commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "gourmette-doree-noire")
SRC = sys.argv[1]
PRIX = 27.81       # prix payé (barré 30,90 − 10 %)
FACE = 3.00        # texte gravé sur la plaque


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

PHOTOS = {f"zz-maquette-gourm-{n}.jpg": f"{n}.jpg" for n in ["dore-fournisseur", "dore-porte-homme-1", "dore-porte-homme-2", "dore-porte-femme", "noir-fournisseur", "noir-porte-1", "noir-porte-2"]}
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
emb = open(os.path.join(ASSETS, "emballage-site.html"), encoding="utf-8").read()
for rid, f in EMB_PHOTOS.items():
    emb = emb.replace(f"/api/img/{rid}", uri(os.path.join(ASSETS, f), 160, 82))
emb = re.sub(r'<button type="button" class="xn-tog">.*?</button>', '<div id="mq-noel"></div>', emb, flags=re.S)
assert 'id="mq-noel"' in emb and emb.count("data:image/jpeg") == 4
i_emb = MAIN.find('<div style="margin:6px 0 18px"><div style="font-weight:700;font-size:0.95rem;margin-bottom:3px">Votre emballage')
j_emb = MAIN.find('<div class="pd-totbox"', i_emb)
assert i_emb > 0 and j_emb > i_emb
MAIN = MAIN[:i_emb] + emb + MAIN[j_emb:]
# Aperçu 3D : sur le site il tourne au doigt ; ici une capture de la machine, qui suit la couleur choisie.
APERCU = {c: uri(os.path.join(ASSETS, f"apercu3d-{c}.jpg"), 780, 82) for c in ("dore", "noir")}
MAIN = MAIN.replace('<div style="width:100%;height:360px;cursor:grab;touch-action:pan-y"></div>',
    f'<div style="width:100%;position:relative"><img id="mq3d" src="{APERCU["dore"]}" alt="" style="width:100%;display:block;border-radius:12px"><span style="position:absolute;top:8px;left:8px;background:#fff;border:1px solid var(--line);border-radius:99px;padding:2px 9px;font-size:.7rem;color:var(--ink-soft)">Exemple : « Thomas · 14.02.2026 »</span></div>', 1)
assert 'id="mq3d"' in MAIN
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
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
assert MAIN.count('id="pf-texte"') == 1
assert "pd-totbox" in MAIN and "engrave-preview" in MAIN

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-detail{display:block;margin-top:4px;font-size:.8rem;color:var(--ink-soft)}
.mq-px{font-weight:600;color:#7c6120;margin-left:4px}.mq-px.off{color:#1c6b3a}
.ep-plate .ep-line small{display:block;font-family:var(--font-body,system-ui);font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:#7a6a4a;margin-bottom:2px}
'''
JS = r'''
(function(){
  var PRIX=__PRIX__, FACE=__FACE__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={q:1,emb:0};
  var faces=[document.getElementById('pf-texte')], A3D=__A3D__;
  var pol=document.querySelector('.field select');
  var tot=document.querySelector('.pd-totbox .val'),qs=document.querySelector('.qty-stepper span'),qb=document.querySelectorAll('.qty-stepper button');
  var plate=document.querySelector('.engrave-preview .ep-plate');
  var det=document.createElement('span');det.className='mq-detail';document.querySelector('.pd-totbox').appendChild(det);
  function remplies(){return faces.filter(function(f){return f&&f.value.trim()})}
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
  function prixFaces(){
    var f=faces.map(function(x){return !!x.value.trim()}), premiere=f.indexOf(true); if(premiere<0)premiere=0;
    [].forEach.call(document.querySelectorAll('.mq-px'),function(s){var i=+s.dataset.f-1;
      if(i===premiere){s.textContent=f[i]?'(offerte)':'(1re face remplie offerte)';s.className='mq-px off'}else{s.textContent='(+3 €)';s.className='mq-px'}});
  }
  function maj(){
    noel();
    var n=remplies().length, grav=n*FACE, pn=prixNoel(), u=PRIX+grav+st.emb+pn;
    tot.textContent=eur(u*st.q); qs.textContent=st.q;
    det.textContent='Bracelet '+eur(PRIX)+(n?' · texte gravé '+eur(grav):'')+(st.emb?' · emballage '+eur(st.emb):'')+(pn?' · emballage de Noël '+eur(pn):'')+(st.q>1?' · × '+st.q:'');
    var cls='ep-line'+(pol&&pol.value?' fnt-'+pol.value:'');
    var h='';faces.forEach(function(f,i){var v=f.value.trim();if(v)h+='<div class="'+cls+'">'+v.replace(/[<>&]/g,'')+'</div>'});
    plate.innerHTML=h||'<span class="ep-empty">Votre texte gravé apparaîtra ici…</span>';
  }
  faces.forEach(function(f){f.addEventListener('input',function(){
    var c=[].slice.call(f.parentNode.querySelectorAll('*')).filter(function(e){return /^\d+\/25$/.test(e.textContent.trim())})[0];
    if(c)c.textContent=f.value.length+'/25'; maj()})});
  if(pol)pol.addEventListener('change',maj);
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  // Emballage : un choix à la fois, prix lu sur le bouton.
  var titre=[].slice.call(document.querySelectorAll('div')).filter(function(d){return d.textContent.trim()==='Votre emballage'})[0];
  var embs=titre?[].slice.call(titre.parentNode.querySelectorAll('button[type=button]')):[];
  function prixDe(b){var t=b.lastElementChild.textContent.match(/\+\s*([\d,]+)/);return t?parseFloat(t[1].replace(',','.')):0}
  var CATS=['seul','sac','allongee','seul','pack'];
  embs.forEach(function(b,k){b.addEventListener('click',function(){embs.forEach(function(x,kx){x.style.border='1.5px solid var(--line)';x.style.boxShadow='none';x.style.background=kx===4?'linear-gradient(180deg,#fffaf0,#fff)':'var(--paper)';
      var s=x.querySelector('strong');[].forEach.call(s.childNodes,function(t){if(t.nodeType===3)t.textContent=t.textContent.replace(/^✓\s*/,'')})});
    b.style.border='1.5px solid var(--gold)';b.style.background='#fffaf0';b.style.boxShadow='0 0 0 2px rgba(194,161,78,.22)';
    var s=b.querySelector('strong'),t=[].filter.call(s.childNodes,function(x){return x.nodeType===3&&x.textContent.trim()})[0];if(t)t.textContent='✓ '+t.textContent;
    st.emb=prixDe(b);st.cat=CATS[k]||'seul';maj()})});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  var vs=[].slice.call(document.querySelectorAll('.variant-swatch'));
  vs.forEach(function(b,i){b.addEventListener('click',function(){vs.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    b.classList.add('active');b.setAttribute('aria-pressed','true');main.src=b.querySelector('img').src;
    var d=document.getElementById('mq3d');if(d)d.src=A3D[i===0?'dore':'noir'];})});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''.replace("__A3D__", json.dumps(APERCU)).replace("__PRIX__", json.dumps(PRIX)).replace("__FACE__", json.dumps(FACE)).replace("__NOEL__", json.dumps(NOEL)).replace("__COUL__", json.dumps(COULEURS)).replace("__ETIQ__", json.dumps(ETIQ))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Bracelet Gourmette à plaque gravée » · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Bracelet Gourmette Plaque</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "gourmette-plaque.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "gourmette-plaque.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
