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

Usage : python3 tools/maquettes/fiche-cristal-vertical.py <capture /produit/cristal-photo-3d-vertical.html> [nom de sortie]
  (même générateur pour l'horizontal : capture de /produit/cristal-photo-3d-horizontal + « fiche-cristal-horizontal »)
Sortie : docs/maquettes/fiche-cristal-vertical.html (+ .fragment.html). Rien n'est touché dans le site.
"""
import ast, base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
SRC = sys.argv[1]
SORTIE = sys.argv[2] if len(sys.argv) > 2 else "fiche-cristal-vertical"
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
FORMAT_NOM = "Cristal photo 3D — " + ("Horizontal" if "horizontal" in TITRE.lower() else "Vertical")
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
FICHE_ACTUELLE = FICHE[FICHE.find("<div class=\"container\"><div class=\"product-layout\">"):FICHE.rfind("</main>")]
FICHE_ACTUELLE = re.sub(r'<video class="gallery-bg gallery-video"[^>]*></video>', f'<img src="{POSTER}" alt="{FORMAT_NOM}" id="galmain">', FICHE_ACTUELLE, 1)
FICHE_ACTUELLE = re.sub(r'<button class=" thumb-video" aria-label="Voir la vidéo"><video[^>]*></video></button>',
                        f'<button class="active" aria-label="Voir la vidéo"><img src="{POSTER}" alt=""></button>', FICHE_ACTUELLE, 1)

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
    <p class="cg-h1">{TITRE.replace(" — gravure personnalisée en France", " — <em>gravure personnalisée en France</em>")}</p>
    <p class="cg-lede">{TAGLINE}</p>
    <ul class="cg-trust">
      <li>{ic("gem")}<span><b>Cristal optique K9</b>pureté et éclat</span></li>
      <li>{ic("pin")}<span><b>Gravé en France</b>dans notre atelier</span></li>
      <li>{ic("truck")}<span><b>Livraison suivie</b>colis &amp; point relais</span></li>
    </ul>
    </div>
  </div>
</section>

<!-- EN DESSOUS : la fiche ACTUELLE du site, telle quelle (gérant, 09/10 soir : « tu laisses comme c'est actuellement sur le site ») -->
{FICHE_ACTUELLE}
</main>'''
MAIN = nettoie(MAIN)

# Les blocs de la fiche repris SOUS le panneau : même habillage que le reste (rien d'autre n'est ajouté)
CSS += r'''
.cg .product-layout{padding-top:28px}
.cg-ecrin .cg-h1{font-family:var(--font-display),Georgia,serif;font-weight:600;letter-spacing:-.01em;text-wrap:balance;margin:0;color:#fff;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06}
.cg-ecrin .cg-h1 em{font-style:italic;font-weight:500;color:var(--gold-l)}
'''

JS = r'''
(function(){
  var P={Petit:39.9,Moyen:59.9,Grand:99.9,XL:149.9},S={Petit:14.9,Moyen:19.9,Grand:19.9,XL:19.9};
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={t:'Petit',q:1};
  var sw=[].slice.call(document.querySelectorAll('.crystal-sizes .variant-swatch'));
  var socle=document.getElementById('pf-socle'),txt=document.getElementById('pf-texte'),cnt=document.querySelector('.char-count');
  var tot=document.querySelector('.pd-totbox .val'),lead=document.querySelector('.price-lead'),qs=document.querySelector('.qty-stepper span');
  var qb=document.querySelectorAll('.qty-stepper button');
  function maj(){var u=P[st.t]+(socle.value==='oui'?S[st.t]:0)+(txt.value.trim()?5:0);tot.textContent=eur(u*st.q);lead.textContent=eur(P[st.t]);qs.textContent=st.q;
    var o=socle.options[socle.options.length-1];o.textContent='Avec socle LED — +'+eur(S[st.t])}
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');st.t=b.querySelector('.vs-title').textContent.trim();maj()})});
  socle.addEventListener('change',maj);txt.addEventListener('input',function(){cnt.textContent=txt.value.length+'/40';maj()});
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});qb[1].addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  var main=document.getElementById('galmain'),th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  th.forEach(function(b){b.addEventListener('click',function(){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');main.src=b.querySelector('img').src})});
  document.querySelector('.gallery-arrow-next').addEventListener('click',function(){var i=(th.indexOf(document.querySelector('.gallery-thumbs button.active'))+1)%th.length;th[i].click()});
  document.querySelector('.gallery-arrow-prev').addEventListener('click',function(){var i=(th.indexOf(document.querySelector('.gallery-thumbs button.active'))-1+th.length)%th.length;th[i].click()});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''

BANNER = f'<div class="mq-banner">MAQUETTE — fiche « {FORMAT_NOM} » : l\'écrin en haut, la fiche actuelle du site en dessous · <b>rien n\'est encore sur le site</b></div>'
TITLE = f"<title>Fiche {FORMAT_NOM} — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, f"{SORTIE}.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, f"{SORTIE}.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", PRIX, len(VISUELS), "visuels")
