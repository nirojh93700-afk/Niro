#!/usr/bin/env python3
"""Maquette « Les dernières sorties » sur DEUX LIGNES (gérant, 09/10/2026 soir : « je t'ai dit deux lignes, mais ça doit
être comme avant, que les gens ils peuvent défiler… qu'il fasse défiler de la gauche vers la droite comme avant, mais les
deux lignes de produits »). Le rail redevient un rail qu'on fait glisser de gauche à droite, mais sur deux lignes de
produits l'une au-dessus de l'autre. Deux façons à choisir dans la maquette :
  A · les deux lignes glissent ENSEMBLE (un seul rail, deux rangées) ;
  B · chaque ligne glisse SÉPARÉMENT.
Part du VRAI accueil (capture `curl localhost:3140/` après `npm run build` + `next start`) : mêmes feuilles de style,
polices intégrées, photos en data URI, scripts retirés ; seul le rail change.
Usage : python3 tools/maquettes/rail-deux-lignes.py <accueil-src.html>
Sortie : docs/maquettes/rail-deux-lignes.html (+ .fragment.html pour l'artifact). Rien n'est touché dans le site."""
import base64, html, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "docs", "maquettes")
src = open(sys.argv[1], encoding="utf-8").read()

def uri(path, w=520, q=66):
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
def raw(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

# 1. scripts retirés, feuilles de style intégrées (polices next/font intégrées aussi)
src = re.sub(r"<script\b[^>]*>.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", src)
css = ""
for f in sorted(set(re.findall(r'/_next/static/css/([a-f0-9]+\.css)', src))):
    c = open(os.path.join(ROOT, ".next", "static", "css", f), encoding="utf-8").read()
    c = re.sub(r'url\((/_next/static/media/[^)]+\.woff2)\)', lambda m: "url(" + raw(os.path.join(ROOT, ".next", m.group(1)[len("/_next/"):]), "font/woff2") + ")", c)
    css += c + "\n"
src = re.sub(r'<link[^>]+/_next/static/css/[^>]+>', "", src)
src = src.replace("</head>", f"<style>{css}</style></head>", 1)

# 2. photos locales en data URI, logo = copie du logo du site (adresse Shopify injoignable d'ici)
LOGO = uri(os.path.join(OUT, "assets", "logo-source.jpg"), 900, 80)
src = re.sub(r'src="https://cdn\.shopify\.com/[^"]*IMG_6758[^"]*"', f'src="{LOGO}"', src)
cache = {}
def local(m):
    p = html.unescape(m.group(1)).split("?")[0]
    fp = os.path.join(ROOT, "public", p.lstrip("/"))
    if not os.path.exists(fp): return m.group(0)
    if p not in cache: cache[p] = uri(fp, 520 if "cristal-v-femme" not in p else 900)
    return f'src="{cache[p]}"'
src = re.sub(r'src="(/produits/[^"]+)"', local, src)
src = re.sub(r'src="(/instagram-qr\.png)"', lambda m: f'src="{raw(os.path.join(ROOT, "public", "instagram-qr.png"), "image/png")}"', src)
src = src.replace(' loading="lazy"', "")

# 3. les cartes : les 6 du rail + les 4 de « Bébé & Enfant » pour remplir deux lignes (en vrai : les 10 dernières sorties)
sec = re.search(r'<section class="sec rail-sec[^"]*" id="nouveautes".*?</section>', src, flags=re.S)
rail_sec = sec.group(0)
CARD = re.compile(r'<div class="uc[ "].*?</div>', re.S)
cards = CARD.findall(rail_sec)
enf = re.search(r'id="t-enf".*?</section>', src, flags=re.S).group(0)
hrefs = {re.search(r'href="([^"]+)"', c).group(1) for c in cards if 'href="' in c}
for c in CARD.findall(enf):
    h = re.search(r'href="([^"]+)"', c)
    if h and h.group(1) not in hrefs and len(cards) < 10:
        cards.append(c); hrefs.add(h.group(1))
assert len(cards) >= 8, f"pas assez de cartes ({len(cards)})"
half = (len(cards) + 1) // 2
rail_a = '<div class="rail rail-ens" tabindex="0" aria-label="Nouveautés">' + "".join(cards) + '</div>'
rail_b = ('<div class="rail-sep" hidden><div class="rail" tabindex="0" aria-label="Nouveautés, première ligne">' + "".join(cards[:half]) +
          '</div><div class="rail" tabindex="0" aria-label="Nouveautés, deuxième ligne">' + "".join(cards[half:]) + '</div></div>')
new_sec = re.sub(r'<div class="rail" tabindex="0" aria-label="Nouveautés">.*?</div></section>', lambda m: rail_a + rail_b + "</section>", rail_sec, count=1, flags=re.S)
assert new_sec != rail_sec
src = src.replace(rail_sec, new_sec, 1)

NOTES = '''<div class="mq-bar" role="region" aria-label="Maquette">
  <div class="mq-in"><b>Maquette, rien n’est en ligne</b>
    <div class="mq-tabs" role="tablist"><button type="button" class="on" data-v="ens">A · Les deux lignes glissent ensemble</button><button type="button" data-v="sep">B · Chaque ligne glisse séparément</button></div>
    <a class="mq-go" href="#nouveautes">Voir le rail ↓</a>
    <button type="button" class="mq-more" id="mqMore" aria-expanded="false">Ce qui change</button></div>
  <ul class="mq-notes" id="mqNotes" hidden>
    <li><b>Ce qui change</b> : « Les dernières sorties » redevient un rail qu’on fait glisser de gauche à droite avec le doigt (ou les flèches), comme avant, mais sur <b>deux lignes de produits</b> l’une au-dessus de l’autre. Sur téléphone, deux produits par ligne à l’écran, les suivants en glissant.</li>
    <li><b>A · Ensemble</b> : un seul rail à deux rangées, les deux lignes avancent en même temps (les flèches aussi).</li>
    <li><b>B · Séparément</b> : deux rails, chaque ligne se fait glisser à part ; les flèches font avancer les deux.</li>
    <li><b>Les produits</b> : le puzzle « Bientôt » en tête, puis les dernières créations par date d’ajout. Pour remplir deux lignes, le rail montre ici les 6 nouveautés actuelles plus 4 pièces Bébé &amp; Enfant ; en ligne, ce seront les 10 dernières sorties, lues dans le catalogue en direct.</li>
    <li>Le reste de la page est l’accueil en ligne tel quel (les photos hébergées sur le CDN ne s’affichent pas dans l’aperçu).</li>
  </ul>
</div>'''

CSS = '''
.mq-bar{position:relative;z-index:80;background:#1a1206;color:#d9ccb0;font:400 .82rem/1.4 Inter,system-ui,sans-serif}
.mq-in{display:flex;align-items:center;gap:10px 18px;flex-wrap:wrap;padding:8px clamp(16px,4.5vw,72px);max-width:1300px;margin:0 auto}
.mq-in>b{color:#e2c67e;font-weight:600}.mq-tabs{display:flex;gap:6px}
.mq-tabs button,.mq-more,.mq-go{padding:6px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.4);color:#e2c67e;font-weight:600;background:none;border:0;cursor:pointer;font:inherit;text-decoration:none}
.mq-tabs button.on{background:#c9a24b;color:#1a1206;box-shadow:none}.mq-more{margin-left:auto}
.mq-notes{margin:0 auto;padding:4px clamp(16px,4.5vw,72px) 16px calc(clamp(16px,4.5vw,72px) + 18px);max-width:1300px;line-height:1.55}
.mq-notes li{margin:6px 0}.mq-notes b{color:#e2c67e;font-weight:600}
@media (max-width:640px){.mq-in{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:8px;padding:7px 12px}.mq-in>b,.mq-tabs button,.mq-more,.mq-go{white-space:nowrap;flex:none;font-size:.74rem}.mq-more{margin-left:0}}
/* ---- le rail sur deux lignes */
.mx .rail{display:grid;grid-auto-flow:column;grid-template-rows:auto auto;grid-template-columns:none;grid-auto-columns:minmax(230px,1fr);gap:28px 18px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:6px}
.mx .rail-sep .rail{grid-template-rows:auto}
.mx .rail-sep .rail+.rail{margin-top:28px}
.mx .rail-sec .rail-ctrl{display:flex}
@media (max-width:640px){.mx .rail{grid-auto-columns:calc(50% - 7px);gap:22px 14px}.mx .rail-sep .rail+.rail{margin-top:22px}}
'''

JS = '''
(function(){var d=document;
function rails(){return [].slice.call(d.querySelectorAll('#nouveautes .rail')).filter(function(r){return r.offsetParent!==null})}
d.querySelectorAll('#nouveautes .rbtn').forEach(function(b){b.addEventListener('click',function(){var dir=/Suivant/.test(b.getAttribute('aria-label'))?1:-1;rails().forEach(function(r){r.scrollBy({left:r.clientWidth*0.8*dir,behavior:'smooth'})})})});
d.querySelectorAll('.mq-tabs button').forEach(function(b){b.addEventListener('click',function(){d.querySelectorAll('.mq-tabs button').forEach(function(x){x.classList.toggle('on',x===b)});var sep=b.dataset.v==='sep';d.querySelector('#nouveautes .rail-ens').hidden=sep;d.querySelector('#nouveautes .rail-sep').hidden=!sep})});
d.getElementById('mqMore').addEventListener('click',function(){var n=d.getElementById('mqNotes');n.hidden=!n.hidden;this.setAttribute('aria-expanded',!n.hidden)});
d.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});
d.addEventListener('click',function(e){var a=e.target.closest('a');if(a&&a.getAttribute('href')&&a.getAttribute('href')[0]!=='#')e.preventDefault()});
})();
'''

page = src.replace("<body", "<body data-maquette", 1)
page = page.replace("</head>", f"<style>{CSS}</style></head>", 1)
page = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + NOTES, page, count=1)
page = page.replace("</body>", f"<script>{JS}</script></body>", 1)
page = re.sub(r"<title>.*?</title>", "<title>Dernières sorties, deux lignes</title>", page, count=1)
open(os.path.join(OUT, "rail-deux-lignes.html"), "w", encoding="utf-8").write(page)
head = re.search(r"<head>(.*?)</head>", page, flags=re.S).group(1)
head = re.sub(r"<meta[^>]+>", "", head); head = re.sub(r"<link[^>]+>", "", head)
body = re.search(r"<body[^>]*>(.*)</body>", page, flags=re.S).group(1)
open(os.path.join(OUT, "rail-deux-lignes.fragment.html"), "w", encoding="utf-8").write(head + body)
print("ok", len(page) // 1024, "Ko,", len(cards), "cartes")
