#!/usr/bin/env python3
"""Maquette de la FICHE « Cristal photo 3D — Vertical » — MÊME PRÉSENTATION que la maquette « Cristaux déjà gravés ».

Gérant, 09/10/2026 soir (après deux versions refusées) : « tu prends la maquette des blocs de cristal déjà gravés, tu regardes,
tu analyses comment t'as fait cette maquette, tu refais la même chose pour la maquette du vertical ». Donc cette page est
construite EXACTEMENT comme `cristaux-graves.py` : son CSS est RELU dans ce fichier (pas recopié, pas « amélioré »), mêmes
blocs dans le même ordre — écrin encre & or (titre, phrase, 3 réassurances, 2 photos dans un cadre doré) → à gauche la galerie
en cartes claires (nom sous la photo) → à droite le panneau blanc « Votre cristal » (grande photo, tailles, photo à graver,
texte en option +5 €, socle, total, quantité, bouton grisé tant que la photo n'est pas envoyée, « Gravé à la commande »), barre
de téléphone → puis, SOUS le panneau, les blocs de la vraie fiche lus dans la capture (description, guide des tailles,
accordéons, « Commandez en toute confiance », « Vous aimerez aussi »). Contenu = celui de la fiche en ligne (titres, textes,
tailles 39,90 / 59,90 / 99,90 / 149,90, socle +14,90 petit / +19,90, texte +5 €, les 8 visuels).

Usage : python3 tools/maquettes/fiche-cristal-vertical.py <capture /produit/cristal-photo-3d-vertical.html>
Sortie : docs/maquettes/fiche-cristal-vertical.html (+ .fragment.html). Rien n'est touché dans le site.
"""
import ast, base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
SRC = sys.argv[1]
REF = open(os.path.join(ROOT, "tools", "maquettes", "cristaux-graves.py"), encoding="utf-8").read()


def uri(path, w=900, q=76):
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


# ---------------------------------------------------------------- la coquille du site (capture de la fiche)
src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER, FOOTER, FICHE = src[body_start:i_main], src[j_main:src.rfind("</body>")], src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        if garder:
            return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})"
        return "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

def local_src(m):
    p = os.path.join(PUB, m.group(2).lstrip("/"))
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
HEADER, FOOTER = nettoie(HEADER), nettoie(FOOTER)

# ---------------------------------------------------------------- le CSS, les icônes et les polices : RELUS dans cristaux-graves.py
CSS = "".join(re.findall(r"^CSS \+?= r'''(.*?)'''", REF, re.S | re.M))
ICON = ast.literal_eval("{" + re.search(r"^ICON = \{(.*?)^\}", REF, re.S | re.M).group(1) + "}")
FONTS = ast.literal_eval(re.search(r"^FONTS = (\[.*?\])", REF, re.S | re.M).group(1))
def ic(n, cls="cg-ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>')

# ---------------------------------------------------------------- le contenu de la fiche, lu dans la capture
TITRE = re.search(r"<h1>(.*?)</h1>", FICHE).group(1)
TAGLINE = re.search(r'<p style="color:var\(--ink-soft\);margin-top:0">(.*?)</p>', FICHE).group(1)
TAILLES = re.findall(r'<span class="vs-title">(.*?)</span><span class="vs-sub">(.*?)</span><span class="vs-price"><span class="vs-now">(.*?)</span>', FICHE)
PRIX = {t[0]: float(re.sub(r"[^0-9,]", "", t[2]).replace(",", ".")) for t in TAILLES}
SOCLE_PRIX = {"Petit": 14.90, "Moyen": 19.90, "Grand": 19.90, "XL": 19.90}  # products.js : amount 19,90, 14,90 pour le petit
TEXTE_PRIX = 5.00
HINT_PHOTO = re.search(r'<p class="perso-hint" style="margin-top:8px">(.*?)</p>', FICHE).group(1)
NOTE_PHOTO = re.search(r'<p class="photo-check-note">(.*?)</p>', FICHE).group(1)
POSTER = re.search(r'poster="([^"]+)"', FICHE).group(1)
VISUELS = [POSTER] + re.findall(r'<button class="" aria-label="Voir le visuel \d+"><img src="([^"]+)"', FICHE)
NOMS = ["Amour inconditionnel", "Portrait", "Enfant et son chat", "Couple", "Enfant et son chien", "Entre amis", "Le bloc vierge", "Guide des tailles"]
PRODUCT_DESC = re.search(r'<div class="product-desc">.*?</div>(?=<div class="crystal-guide-section">)', FICHE, re.S).group(0)
GUIDE = re.search(r'<div class="crystal-guide-section">.*?</div></div>(?=<div class="info-accordion">)', FICHE, re.S).group(0)
ACCORD = re.search(r'<div class="info-accordion">.*?</details></div>', FICHE, re.S).group(0)
CONF = re.search(r'<section class="confiance">.*?</section>', FICHE, re.S).group(0)
AUSSI = re.search(r'<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">À découvrir</span><h2>Vous aimerez aussi</h2>.*?</section>', FICHE, re.S)
AUSSI = AUSSI.group(0) if AUSSI else ""
SOCLE = uri(os.path.join(PUB, "produits", "socle-led-rectangle.jpg"), 300, 74)

def tuile(i, src, nom):
    return f'''<button type="button" class="cg-tile{' on' if i == 0 else ''}" data-i="{i}" aria-pressed="{'true' if i == 0 else 'false'}">
      <span class="cg-img"><img src="{uri(os.path.join(PUB, src.lstrip('/')), 640, 76)}" alt="{nom}" loading="lazy"><span class="cg-ok" aria-hidden="true">{ic("check")}</span></span>
      <span class="cg-meta"><span class="cg-tag">{'Le cristal' if i >= 6 else 'Exemple gravé'}</span><b class="cg-nom">{nom}</b></span>
    </button>'''
THUMBS = "".join(f'<button type="button" class="{"active" if i == 0 else ""}" aria-label="Voir le visuel {i + 1}"><img src="{uri(os.path.join(PUB, v.lstrip("/")), 240, 72)}" alt=""></button>' for i, v in enumerate(VISUELS))
BIGS = [uri(os.path.join(PUB, v.lstrip("/")), 900, 78) for v in VISUELS]
SIZES = "".join(
    f'''<button type="button" class="variant-swatch{" active" if t[0] == "Petit" else ""}" data-taille="{t[0]}" aria-pressed="{"true" if t[0] == "Petit" else "false"}">
        <span class="vs-title">{t[0]}</span><span class="vs-sub">{t[1]}</span>
        <span class="vs-price"><span class="vs-now">{t[2]}</span></span></button>''' for t in TAILLES)
POLICES = "".join(f'<button type="button" class="cg-font fnt-{k}{" on" if k == "playfair" else ""}" data-font="{k}" aria-pressed="{"true" if k == "playfair" else "false"}">{lab}</button>' for k, lab in FONTS)
PLACES = "".join(f'<button type="button" class="cg-chip{" on" if k == "bas" else ""}" data-pos="{k}" aria-pressed="{"true" if k == "bas" else "false"}">{lab}</button>' for k, lab in (("bas", "En bas"), ("haut", "En haut"), ("gauche", "À gauche"), ("droite", "À droite")))
GRAND0 = uri(os.path.join(PUB, POSTER.lstrip("/")), 900, 78)

MAIN = f'''<main class="cg">
<section class="cg-intro cg-ecrin">
  <div class="container">
    <div class="cg-ecrin-txt">
    <h1>{TITRE.replace(" — gravure personnalisée en France", " — <em>gravure personnalisée en France</em>")}</h1>
    <p class="cg-lede">{TAGLINE}</p>
    <ul class="cg-trust">
      <li>{ic("gem")}<span><b>Cristal optique K9</b>pureté et éclat</span></li>
      <li>{ic("pin")}<span><b>Gravé en France</b>dans notre atelier</span></li>
      <li>{ic("truck")}<span><b>Livraison suivie</b>colis &amp; point relais</span></li>
    </ul>
    </div>
  </div>
</section>

<section class="cg-shop" id="modeles" aria-labelledby="t-mod">
  <div class="container cg-layout">
    <div class="cg-col">
      <div class="gallery-main gallery-contain" id="galerie"><img id="grand" src="{GRAND0}" alt="Cristal photo 3D vertical"><span class="cg-txtpv fnt-playfair pos-bas" id="txtpv" hidden></span>
        <button type="button" class="gallery-arrow gallery-arrow-prev" aria-label="Photo précédente">‹</button>
        <button type="button" class="gallery-arrow gallery-arrow-next" aria-label="Photo suivante">›</button>
      </div>
      <div class="gallery-thumbs">{THUMBS}</div>
    </div>

    <aside class="cg-panel" id="panneau" aria-labelledby="t-pan" aria-live="polite">
      <h3 class="cg-pname cg-pname-top" id="t-pan">Cristal Photo 3D — Vertical</h3>
      <p class="cg-pdesc" id="pdesc">{TAGLINE}</p>

      <div class="field">
        <label>Choisissez la taille</label>
        <div class="variant-swatches crystal-sizes" id="tailles">{SIZES}</div>
      </div>

      <div class="field">
        <label>Votre photo à graver en 3D</label>
        <button type="button" class="cg-socle" id="photo" aria-pressed="false">
          <span class="cg-txt-ic">{ic("photo")}</span>
          <span><b id="photolab">Choisir une photo</b><small>Nette, bien éclairée, les visages bien visibles</small></span>
          <span class="cg-box" aria-hidden="true">{ic("check")}</span>
        </button>
        <p class="cg-hint">{HINT_PHOTO}</p>
        <p class="cg-hint">{NOTE_PHOTO}</p>
      </div>

      <div class="field">
        <label>Texte gravé en plus (en option)</label>
        <button type="button" class="cg-socle" id="txton" aria-pressed="false" aria-controls="txtzone">
          <span class="cg-txt-ic">{ic("pen")}</span>
          <span><b>Ajouter un texte</b><small>Un prénom, une date, un petit mot, gravé avec la photo</small></span>
          <span class="cg-socle-p">+5,00 €</span>
          <span class="cg-box" aria-hidden="true">{ic("check")}</span>
        </button>
        <div class="cg-txt" id="txtzone" hidden>
          <label class="cg-sub" for="txt">Votre texte</label>
          <div class="cg-inp"><input id="txt" type="text" maxlength="40" placeholder="Prénom, date, petit mot…" autocomplete="off"><span id="txtn">0/40</span></div>
          <span class="cg-sub">Écriture</span>
          <div class="cg-fonts" role="group" aria-label="Écriture du texte">{POLICES}</div>
          <span class="cg-sub">Où placer le texte ?</span>
          <div class="cg-pos" role="group" aria-label="Place du texte">{PLACES}</div>
        </div>
      </div>

      <div class="field">
        <label>Socle lumineux LED (en option)</label>
        <button type="button" class="cg-socle" id="socle" aria-pressed="false">
          <img src="{SOCLE}" alt="">
          <span><b>Ajouter le socle lumineux</b><small>LED multicolores, couleurs au toucher, sur prise secteur</small></span>
          <span class="cg-socle-p" id="soclep">+14,90 €</span>
          <span class="cg-box" aria-hidden="true">{ic("check")}</span>
        </button>
      </div>

      <div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total">—</span></div>
      <div class="qty-row">
        <div class="qty-stepper"><button type="button" id="moins" aria-label="Moins">−</button><span id="qte">1</span><button type="button" id="plus" aria-label="Plus">+</button></div>
        <button type="button" class="btn btn-gold prc-off" id="ajout" style="flex:1" disabled>Ajouter au panier</button>
      </div>
      <p class="prc-addhint" id="manque">Envoyez d'abord la photo à graver.</p>
      <div class="pd-perso"><b>✦ Gravé à la commande</b><p>Chaque cristal est gravé pour vous dans notre atelier, puis emballé avec soin.</p></div>
    </aside>
  </div>
</section>

<section class="cg-fiche">
  <div class="container cg-fiche-in">
    {PRODUCT_DESC}
    {GUIDE}
    {ACCORD}
  </div>
</section>
{CONF}
{AUSSI}

<div class="cg-bar" id="barre" hidden>
  <img id="barimg" src="{GRAND0}" alt="">
  <span class="cg-bar-t"><b>Cristal Photo 3D — Vertical</b><small id="barprix"></small></span>
  <a class="btn btn-gold" href="#panneau">Choisir la taille</a>
</div>
</main>'''
MAIN = nettoie(MAIN)

# Les blocs de la fiche repris SOUS le panneau : même habillage que le reste (rien d'autre n'est ajouté)
CSS += r'''
.cg .gallery-main{border-radius:var(--r);box-shadow:var(--sh);position:relative}
.cg .gallery-main.gallery-contain{background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.cg .gallery-main img{width:100%;height:100%;object-fit:contain}
.cg .gallery-thumbs button{border-radius:12px}.cg .gallery-thumbs button.active{border-color:var(--gold)}
.cg .cg-pname-top{margin-top:0!important}
.cg-fiche{padding:0 0 clamp(40px,6vw,64px)}
.cg-fiche-in{max-width:860px}
.cg-fiche .product-desc h3{font-family:var(--font-display),Georgia,serif;font-weight:600}
.cg-fiche .crystal-guide-section{background:var(--sand);border-radius:var(--r);padding:18px 16px 22px;margin:24px 0}
.cg-fiche .crystal-guide-section h3{font-family:var(--font-display),Georgia,serif;text-align:center}
.cg-fiche .crystal-guide-section .cg-hint{text-align:center;margin-bottom:18px}
.cg-fiche .crystal-guide .cg-item b{color:var(--gold-t)}
.cg-fiche .info-accordion details{border:1.5px solid var(--sand2);border-radius:var(--r2);background:#fff;margin-bottom:8px;padding:0 14px}
.cg-fiche .info-accordion summary{padding:13px 0;font-weight:600}
.cg-fiche .info-accordion .info-body{color:var(--muted);padding-bottom:14px}
.cg .confiance{background:radial-gradient(60% 90% at 85% 0%,rgba(201,162,75,.30),transparent 60%),var(--ink2);color:#fff;padding:clamp(40px,6vw,64px) 0;border:0}
.cg .confiance .cf-eyebrow{display:none}
.cg .confiance .cf-title{color:#fff;font-family:var(--font-display),Georgia,serif;font-weight:600}
.cg .confiance .cf-sub{color:#d9ccb0}
.cg .cf-card{background:rgba(255,255,255,.06);border:1px solid rgba(226,198,126,.35);border-radius:var(--r);box-shadow:none}
.cg .cf-card .cf-t{color:#fff}.cg .cf-card .cf-d{color:#b8a98a}
.cg .cf-real-h{color:var(--gold-l)}
.cg .cf-shot{border-radius:var(--r2);overflow:hidden;box-shadow:0 0 0 1px rgba(226,198,126,.5)}
.cg .cg-stage #grand{animation:none}
'''

JS = r'''
(function(){
  var P=__PRIX__, S=__SOCLE__, TX=__TXT__;
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={taille:'Petit',photo:false,txt:false,texte:'',font:'playfair',pos:'bas',socle:false,q:1};
  var $=function(id){return document.getElementById(id)};
  var BIGS=__BIGS__,th=[].slice.call(document.querySelectorAll('.gallery-thumbs button')),cur=0;
  function montre(i){cur=(i+th.length)%th.length;th.forEach(function(x,k){x.classList.toggle('active',k===cur)});$('grand').src=BIGS[cur];$('barimg').src=BIGS[cur]}
  th.forEach(function(b,i){b.addEventListener('click',function(){montre(i)})});
  document.querySelector('.gallery-arrow-prev').addEventListener('click',function(){montre(cur-1)});
  document.querySelector('.gallery-arrow-next').addEventListener('click',function(){montre(cur+1)});
  [].forEach.call(document.querySelectorAll('[data-taille]'),function(b){b.addEventListener('click',function(){
    st.taille=b.dataset.taille;[].forEach.call(document.querySelectorAll('[data-taille]'),function(x){var on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('photo').addEventListener('click',function(){st.photo=!st.photo;this.classList.toggle('on',st.photo);this.setAttribute('aria-pressed',st.photo);$('photolab').textContent=st.photo?'Photo envoyée':'Choisir une photo';maj()});
  $('socle').addEventListener('click',function(){st.socle=!st.socle;this.classList.toggle('on',st.socle);this.setAttribute('aria-pressed',st.socle);maj()});
  $('txton').addEventListener('click',function(){st.txt=!st.txt;this.classList.toggle('on',st.txt);this.setAttribute('aria-pressed',st.txt);$('txtzone').hidden=!st.txt;if(st.txt)$('txt').focus();maj()});
  $('txt').addEventListener('input',function(){st.texte=this.value.trim();$('txtn').textContent=this.value.length+'/40';maj()});
  [].forEach.call(document.querySelectorAll('[data-font]'),function(b){b.addEventListener('click',function(){st.font=b.dataset.font;[].forEach.call(document.querySelectorAll('[data-font]'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});maj()})});
  [].forEach.call(document.querySelectorAll('[data-pos]'),function(b){b.addEventListener('click',function(){st.pos=b.dataset.pos;[].forEach.call(document.querySelectorAll('[data-pos]'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('moins').addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});
  $('plus').addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  $('ajout').addEventListener('click',function(){var b=this;b.textContent='Ajouté au panier ✓';setTimeout(function(){b.textContent='Ajouter au panier'},2200)});
  function maj(){
    $('soclep').textContent='+'+eur(S[st.taille]);$('qte').textContent=st.q;
    var avecTxt=st.txt&&!!st.texte;
    var unit=P[st.taille]+(st.socle?S[st.taille]:0)+(avecTxt?TX:0);
    var ok=st.photo&&(!st.txt||avecTxt);
    var pv=$('txtpv');pv.hidden=!avecTxt;pv.textContent=st.texte;pv.className='cg-txtpv fnt-'+st.font+' pos-'+st.pos;
    $('total').textContent=eur(unit*st.q);
    var a=$('ajout');a.disabled=!ok;a.classList.toggle('prc-off',!ok);$('manque').hidden=ok;$('manque').textContent=!st.photo?'Envoyez d\'abord la photo à graver.':'Écrivez le texte à graver, ou retirez l\'option texte.';
    $('barprix').textContent=st.taille+' · '+eur(unit);
  }
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  if('IntersectionObserver' in window){new IntersectionObserver(function(e){vu=e[0].isIntersecting;$('barre').classList.toggle('cg-bar-off',vu)},{threshold:.15}).observe($('panneau'))}
  $('barre').hidden=false;maj();
})();
'''.replace("__PRIX__", json.dumps(PRIX)).replace("__BIGS__", json.dumps(BIGS)).replace("__SOCLE__", json.dumps(SOCLE_PRIX)).replace("__TXT__", str(TEXTE_PRIX))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Cristal photo 3D — Vertical », présentée comme la page des cristaux déjà gravés · <b>rien n\'est encore sur le site</b></div>'
TITLE = "<title>Fiche Cristal photo 3D vertical — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "fiche-cristal-vertical.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "fiche-cristal-vertical.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX, len(VISUELS), "visuels")
