#!/usr/bin/env python3
"""Maquette « Marque-page métal — peintures célèbres » (modèle 3) — précommande — 23/10/2026. RIEN n'est en ligne.

Gérant : commande fournisseur du 23/10 (PDF de 37 modèles) = 8 tableaux × 5 pièces (n° 1, 2, 9, 10, 11, 14, 22, 24) ; photos
extraites du PDF dans docs/maquettes/assets/marque-pages-metal/ (README avec les descriptions). Même méthode et même parcours
que marque-pages-fenetre.py (modèle 2) : choix du modèle en haut, formats seul / boîte / coffret de 2 / coffret de 4, fenêtre
« Voir et personnaliser mon coffret », texte gravé au verso +2 € par marque-page.
Usage : python3 tools/maquettes/marque-pages-metal.py <capture /produit/marque-pages-metal-peintures.html>
Sortie : docs/maquettes/marque-pages-metal.html (+ .fragment.html, jamais commité).
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "marque-pages-metal")
SRC = sys.argv[1]


def uri(path, w=900, q=78):
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

# n° du PDF fournisseur → fichier extrait (docs/maquettes/assets/marque-pages-metal/)
MODELES = {"01": "01-amandier-en-fleurs-van-gogh", "02": "02-iris-van-gogh", "09": "09-nympheas-monet-pompon",
           "10": "10-roses-blanches-van-gogh-pompon-dore", "11": "11-iris-van-gogh-pompon-dore", "14": "14-nympheas-monet-pompon-dore",
           "22": "22-nympheas-papillon-monet-coffret", "24": "24-tournesols-van-gogh-timbres"}
PHOTOS = {f"zz-maquette-mm-{n}.jpg": f for n, f in MODELES.items()}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom] + ".jpg"))}"'
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
    html = re.sub(r'<div class="cf-shot"><img src="https://cdn\.shopify\.com[^"]*"[^>]*/></div>', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
# Prix par modèle lus dans la fiche capturée (8,90 € ; Papillon en coffret 12,90 €) — proposés, à valider par le gérant.
PRIX = {t: float(re.sub(r"[^0-9,]", "", p).replace(",", ".")) for t, p in
        re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', MAIN)}
assert len(PRIX) == 8, PRIX
PU = PRIX["Amandier en fleurs"]
# La grande image porte un id pour le script ; l'« aperçu témoin » texte du site n'a pas de sens ici.
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
FORMATS = [("Seul", "avec son pompon et sa carte", 1, 0), ("En boîte cadeau", "1 marque-page, boîte bleu nuit", 1, 4.9),
           ("Coffret de 2", "2 marque-pages, boîte bleu nuit", 2, 5.9), ("Coffret de 4", "4 marque-pages, boîte bleu nuit", 4, 7.9)]
def eur(n): return f"{n:.2f}".replace(".", ",") + " €"
BOX_IMG = {1: "boite1", 2: "boite2", 4: "boite4"}
def fmt_card(i, t, sub, n, box):
    img = BOX_IMG[n] if box else None
    pic = f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, img + ".jpg"), 260, 72)}" alt="Boîte cadeau bleu nuit pour {n} marque-page{"s" if n > 1 else ""}"/>' if img else \
          f'<img class="mq-fimg" src="{uri(os.path.join(ASSETS, MODELES["01"] + ".jpg"), 260, 72)}" alt="Marque-page seul avec son pompon"/>'
    return (f'<button type="button" class="mq-fmt{" on" if i == 0 else ""}" data-n="{n}" data-box="{box:g}">{pic}'
            f'<span class="mq-ft"><b>{t}</b><span>{sub}</span><em>{eur(n * PU + box)}</em></span></button>')
FMT = ('<div class="field"><label>Choisissez votre format</label><div class="mq-fmts">' +
       "".join(fmt_card(i, *f) for i, f in enumerate(FORMATS)) + '</div></div>')
RECAP = ('<div class="mq-recap" id="mq-recap" hidden><p class="mq-rtxt"></p><div class="mq-strip"></div>'
         '<button type="button" class="mq-open">Composer mon coffret</button></div>')
GNOTE = '<p class="mq-gnote" id="mq-gnote" hidden>Les marque-pages du coffret sont de tableaux différents : vous pouvez en changer dans « Composer mon coffret ».</p>'
cle = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
assert cle in MAIN
# 23/10, gérant : « sur le métal je peux pas graver, y a pas de place » → le bloc gravure (texte au verso + écriture) est RETIRÉ.
k0 = MAIN.index(cle); k1 = MAIN.index('<div class="pd-totbox"', k0)
MAIN = MAIN[:k0] + FMT + RECAP + GNOTE + MAIN[k1:]
MAIN = re.sub(r"<h3>Un texte au verso</h3>\s*<p>.*?</p>", "", MAIN, count=1, flags=re.S)
MAIN = re.sub(r"Le dos du marque-page est lisse : un texte peut y être gravé \(\+2 €\), dans l(?:'|&#x27;)une des huit écritures du site\.", "Le marque-page n'est pas gravé : il se choisit tel quel, parmi les huit tableaux.", MAIN)
MAIN = re.sub(r"Un marque-page gravé est une pièce personnalisée[^<]*?Un marque-page non gravé peut être retourné sous 14 jours, dans son emballage d(?:'|&#x27;)origine\.", "Le marque-page peut être retourné sous 14 jours, dans son emballage d'origine.", MAIN, count=1)
OLD_H = "<h3>Le coffret de quatre</h3>"
assert OLD_H in MAIN
i0 = MAIN.index(OLD_H); i1 = MAIN.index("</p>", i0) + 4
MAIN = MAIN[:i0] + "<h3>Offrez-le en boîte cadeau</h3><p>Une boîte cadeau bleu nuit pour un ou deux marque-pages, une autre pour quatre : chaque marque-page tient dans son élastique. La boîte coûte 4,90 € pour un, 5,90 € pour deux, 7,90 € pour quatre. Le modèle Papillon arrive déjà dans son propre coffret à fenêtre.</p>" + MAIN[i1:]
BOXTH = "".join(f'<button class="" aria-label="Voir le visuel {k}"><img src="{uri(os.path.join(ASSETS, n + ".jpg"), 900, 74)}" alt=""/></button>' for k, n in ((9, "boite1"), (10, "boite2"), (11, "boite4")))
j0 = MAIN.index('<div class="gallery-thumbs">'); j1 = MAIN.index("</div>", j0)
MAIN = MAIN[:j1] + BOXTH + MAIN[j1:]
MAIN = MAIN.replace('<button class="btn btn-gold" style="flex:1">Ajouter au panier</button>', '<button class="btn btn-gold" style="flex:1">Précommander</button>', 1)
PRE = ('<div class="mq-pre"><b>Précommande · série limitée</b><span>Les marque-pages sont en cours d\'approvisionnement. '
       'Votre commande est enregistrée dès maintenant, puis expédiée à la réception des marque-pages. Quantités limitées : cinq exemplaires par tableau.</span></div>')
MAIN = MAIN.replace('<div class="price-lead">', PRE + '<div class="price-lead">', 1)
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)  # (déjà absent avec noEngravePreview)

CSS = r'''
.mq-recap{margin-top:12px;border:1px solid #e4d9bd;border-radius:14px;background:#fff;padding:12px;display:flex;flex-direction:column;gap:10px}.mq-rtxt{margin:0;font-size:.86rem;color:#5a4d2c;line-height:1.4}
.mq-strip{display:flex;gap:6px;flex-wrap:wrap}.mq-ch{display:flex;flex-direction:column;align-items:center;gap:2px;width:62px}.mq-ch img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.mq-ch small{font-size:.6rem;color:#5a4d2c;text-align:center;line-height:1.1;overflow-wrap:anywhere}.mq-ch b{font-size:.62rem;color:#7c6120;line-height:1.1;text-align:center;overflow-wrap:anywhere}
.mq-open{border:0;border-radius:999px;padding:12px 18px;background:linear-gradient(#c9a24b,#a98935);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.mq-gnote{font-size:.85rem;color:#7a6c48;background:#fbf3df;border-radius:12px;padding:10px 12px;margin:12px 0}.mq-gnote[hidden]{display:none}
.mq-sheet{position:fixed;inset:0;background:rgba(30,24,12,.55);display:flex;align-items:flex-end;justify-content:center;z-index:200}.mq-sheet[hidden]{display:none}
.mq-sheetin{background:#fcfaf4;width:100%;max-width:560px;border-radius:22px 22px 0 0;max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
.mq-shh{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 10px}.mq-shh b{font-family:'Playfair Display',serif;font-size:1.2rem}.mq-shh button{border:0;background:#efe6d2;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer}
.mq-shb{overflow:auto;padding:0 16px 8px;display:flex;flex-direction:column;gap:12px}.mq-shf{padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid #e4d9bd;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fcfaf4}.mq-shf b{font-size:1.1rem;color:#a98935;white-space:nowrap}
.mq-sc{border:1px solid #e4d9bd;border-radius:14px;background:#fff;padding:10px;display:flex;flex-direction:column;gap:8px}.mq-sc input[type=text],.mq-shb select{padding:11px 12px;border:1px solid #e0d3b0;border-radius:10px;background:#fffdf8;font:inherit;font-size:.9rem;color:#2b2620}.mq-sc>p{margin:0;font-weight:700;font-size:.9rem}.mq-sc input[type=text],.mq-shb select{width:100%;box-sizing:border-box;min-width:0}.mq-sc label{display:flex;align-items:center;gap:8px;font-size:.85rem;cursor:pointer}.mq-sc label input{width:18px;height:18px;accent-color:#a98935}
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.mq-fmts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.mq-fmt{display:flex;flex-direction:column;align-items:stretch;gap:8px;text-align:left;padding:8px 8px 10px;border:1.5px solid #e4d9bd;border-radius:14px;background:#fff;color:#2b2620;cursor:pointer;font:inherit}.mq-fimg{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block;background:#efe6d2}.mq-ft{display:flex;flex-direction:column;gap:2px;padding:0 4px}.mq-fmt b{font-size:.92rem}.mq-fmt span{font-size:.74rem;color:#7a6c48;line-height:1.3}.mq-fmt em{font-style:normal;font-weight:700;color:#7c6120;margin-top:2px}.mq-fmt.on{border-color:#a98935;background:#fbf3df;box-shadow:0 0 0 1px #a98935 inset}.mq-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.mq-c{width:100%;padding:3px;border:1.5px solid #e4d9bd;border-radius:10px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font:inherit}.mq-c img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:7px;display:block}.mq-c span{font-size:.6rem;line-height:1.1;color:#5a4d2c;text-align:center;min-height:2.2em;display:flex;align-items:center}.mq-c.on{border-color:#a98935;box-shadow:0 0 0 1px #a98935 inset;background:#fbf3df}.mq-pre{display:flex;flex-direction:column;gap:4px;margin:10px 0 6px;padding:12px 14px;border:1px solid #c9a24b;border-left-width:4px;border-radius:12px;background:#fbf3df;color:#4a3a14;font-size:.88rem;line-height:1.45}.mq-pre b{color:#7c6120;font-size:.95rem}
'''
JS = r'''
(function(){
  var P=__PRIX__, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Amandier en fleurs',q:1,n:1,box:0,slots:[]};
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  var vin=document.getElementById('pf-texte');
  var NOMS=sw.map(function(b){return b.querySelector('.vs-title').textContent.trim()});
  var IMGS=sw.map(function(b){return b.querySelector('img').src});
  var fm=[].slice.call(document.querySelectorAll('.mq-fmt'));
  var recap=document.getElementById('mq-recap'),gnote=document.getElementById('mq-gnote');
  var sheet=document.getElementById('mq-sheet'),shb=document.getElementById('mq-shb'),shn=document.getElementById('mq-shn'),sht=document.getElementById('mq-sht');
  function unit(o){return P[NOMS[o.c]]}
  function base(){if(st.n>1)return st.slots.reduce(function(a,o){return a+unit(o)},0);return P[st.t]}
  function maj(){tot.textContent=eur((base()+st.box)*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;if(shn)shn.textContent=eur(base()+st.box);
    fm.forEach(function(b){var n=+b.dataset.n,bx=+b.dataset.box;var s=n>1&&st.n===n?st.slots.reduce(function(a,o){return a+P[NOMS[o.c]]},0):n*P[st.t];b.querySelector('em').textContent=eur(s+bx)})}
  function reset(){st.slots=[];for(var i=0;i<st.n;i++)st.slots.push({c:st.n>1?i%NOMS.length:NOMS.indexOf(st.t),t:'',touched:false})}
  function draw(){var on=st.n>1;recap.hidden=gnote.hidden=!on;if(!on)return;
    var st2=recap.querySelector('.mq-strip');st2.innerHTML='';var cust=st.slots.some(function(o){return o.touched});
    st.slots.forEach(function(o){var d=document.createElement('span');d.className='mq-ch';d.innerHTML='<img src="'+IMGS[o.c]+'" alt=""/><small>'+NOMS[o.c]+'</small>';st2.appendChild(d)});
    recap.querySelector('.mq-rtxt').textContent=cust?'Votre coffret de '+st.n+' marque-pages :':'Votre coffret de '+st.n+' marque-pages, de tableaux différents. Vous pouvez changer un tableau :'}
  function cards(){shb.innerHTML='';sht.textContent='Mon coffret de '+st.n;
    st.slots.forEach(function(o,i){var d=document.createElement('div');d.className='mq-sc';
      d.innerHTML='<p>Marque-page '+(i+1)+'</p><div class="mq-row"></div>';
      var row=d.querySelector('.mq-row');
      NOMS.forEach(function(w,k){var c=document.createElement('button');c.type='button';c.className='mq-c'+(k===o.c?' on':'');c.setAttribute('aria-label',w);c.innerHTML='<img src="'+IMGS[k]+'" alt=""/><span>'+w+'</span>';
        c.addEventListener('click',function(){o.c=k;o.touched=true;[].forEach.call(row.children,function(x,j){x.classList.toggle('on',j===k)});maj()});row.appendChild(c)});
      shb.appendChild(d)})}
  function ouvre(){cards();maj();sheet.hidden=false}
  function ferme(){sheet.hidden=true;draw();maj()}
  document.querySelector('.mq-open').addEventListener('click',ouvre);
  document.getElementById('mq-close').addEventListener('click',ferme);document.getElementById('mq-ok').addEventListener('click',ferme);
  fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;reset();draw();
    if(st.box){montre(th[{1:8,2:9,4:10}[st.n]])}else{montre(th[NOMS.indexOf(st.t)])}maj()})});
    sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();var k=sw.indexOf(b);if(th[k])montre(th[k]);var im=fm[0].querySelector('.mq-fimg');if(im)im.src=IMGS[k];
    if(st.n===1)reset();draw();maj()})});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.removeAttribute('srcset');main.src=b.querySelector('img').src}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})});
  if(th[0])th[0].classList.add('active');
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])});
  if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  reset();draw();maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX, ensure_ascii=False))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Marque-page métal, peintures célèbres » (précommande, prix proposés à valider) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Marque-page métal, peintures célèbres — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
SHEET = ('<div class="mq-sheet" id="mq-sheet" hidden><div class="mq-sheetin"><div class="mq-shh"><b id="mq-sht">Mon coffret</b><button type="button" id="mq-close" aria-label="Fermer">×</button></div>'
         '<div class="mq-shb" id="mq-shb"></div><div class="mq-shf"><span>Total du coffret<br><b id="mq-shn">0,00 €</b></span><button type="button" class="mq-open" id="mq-ok">Valider mon coffret</button></div></div></div>')
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + SHEET + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "marque-pages-metal.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages-metal.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX)
