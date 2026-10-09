#!/usr/bin/env python3
"""Maquette « petite fenêtre Nouveautés » sur l'accueil (demande du gérant, 09/10/2026 soir : la fenêtre flottante
des nouveautés a disparu avec le nouvel accueil ; il la veut de retour, « en deux fenêtres, comme ça on peut
afficher plusieurs produits »). Deux variantes à choisir dans la maquette :
  A · deux fenêtres empilées, un produit chacune ;
  B · une fenêtre, deux produits côte à côte.
Part du VRAI accueil en ligne (capture `curl localhost:3140/` après `npm run build` + `next start`) : mêmes feuilles de
style, polices intégrées, photos en data URI, scripts retirés ; seule la fenêtre est ajoutée.
Usage : python3 tools/maquettes/fenetre-nouveautes.py <accueil-src.html>
Sortie : docs/maquettes/fenetre-nouveautes.html (+ .fragment.html pour l'artifact). Rien n'est touché dans le site."""
import base64, html, io, json, os, re, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, "docs", "maquettes")
src = open(sys.argv[1], encoding="utf-8").read()

def uri(path, w=640, q=72):
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
    if p not in cache: cache[p] = uri(fp, 640 if "cristal-v-femme" not in p else 900)
    return f'src="{cache[p]}"'
src = re.sub(r'src="(/produits/[^"]+)"', local, src)
src = re.sub(r'src="(/instagram-qr\.png)"', lambda m: f'src="{raw(os.path.join(ROOT, "public", "instagram-qr.png"), "image/png")}"', src)

# 3. les nouveautés = les cartes du rail « Les dernières sorties »
rail = re.search(r'id="nouveautes".*?</section>', src, flags=re.S).group(0)
items = []
for c in re.findall(r'<div class="uc".*?</div>', rail, flags=re.S)[:6]:
    href = re.search(r'href="([^"]+)"', c); img = re.search(r'<img class="uc-ph[^"]*" src="([^"]+)"', c)
    name = re.search(r'<span class="uc-name">(.*?)</span>', c); prix = re.search(r'<span class="uc-price">(.*?)</span>', c)
    if href and name:
        items.append({"href": href.group(1), "img": img.group(1) if img else "", "name": html.unescape(re.sub("<[^>]+>", "", name.group(1))), "prix": html.unescape(re.sub("<[^>]+>", "", prix.group(1))) if prix else ""})
assert len(items) >= 4, "pas assez de nouveautés trouvées"

NOTES = '''<div class="mq-bar" role="region" aria-label="Maquette">
  <div class="mq-in"><b>Maquette, rien n’est en ligne</b>
    <div class="mq-tabs" role="tablist"><button type="button" class="on" data-v="deux">A · Deux fenêtres</button><button type="button" data-v="double">B · Une fenêtre, deux produits</button></div>
    <button type="button" class="mq-replay" id="mqReplay">Rejouer</button>
    <button type="button" class="mq-more" id="mqMore" aria-expanded="false">Ce qui change</button></div>
  <ul class="mq-notes" id="mqNotes" hidden>
    <li><b>Ce qui revient</b> : la petite fenêtre « Nouveauté ✦ » qui glissait en bas de l’accueil d’avant, avec les mêmes produits que le rail « Les dernières sorties » (lus dans le catalogue en direct). Elle apparaît après 2,5 s, reste 7 s, passe aux produits suivants, et ne revient plus si on la ferme (mémorisé pour la visite).</li>
    <li><b>A · Deux fenêtres</b> : deux cartes empilées, un produit chacune, qui changent ensemble (produits 1-2, puis 3-4, puis 5-6).</li>
    <li><b>B · Une fenêtre, deux produits</b> : une seule carte, un peu plus large, avec deux produits côte à côte.</li>
    <li><b>Sur téléphone</b> : la fenêtre se pose au-dessus des deux boutons flottants (« Une question ? » et « La boutique »), jamais dessus, et se ferme d’un ✕. Sur ordinateur : en bas à gauche, comme avant.</li>
    <li>Le reste de la page est l’accueil en ligne tel quel (les photos hébergées sur le CDN ne s’affichent pas dans l’aperçu).</li>
  </ul>
</div>'''

CSS = '''
.mq-bar{position:relative;z-index:80;background:#1a1206;color:#d9ccb0;font:400 .82rem/1.4 Inter,system-ui,sans-serif}
.mq-in{display:flex;align-items:center;gap:10px 18px;flex-wrap:wrap;padding:8px clamp(16px,4.5vw,72px);max-width:1300px;margin:0 auto}
.mq-in>b{color:#e2c67e;font-weight:600}.mq-tabs{display:flex;gap:6px}
.mq-tabs button,.mq-more,.mq-replay{padding:6px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.4);color:#e2c67e;font-weight:600;background:none;border:0;cursor:pointer;font:inherit}
.mq-tabs button.on{background:#c9a24b;color:#1a1206;box-shadow:none}.mq-more{margin-left:auto}
.mq-notes{margin:0 auto;padding:4px clamp(16px,4.5vw,72px) 16px calc(clamp(16px,4.5vw,72px) + 18px);max-width:1300px;line-height:1.55}
.mq-notes li{margin:6px 0}.mq-notes b{color:#e2c67e;font-weight:600}
@media (max-width:640px){.mq-in{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:8px;padding:7px 12px}.mq-in>b,.mq-tabs button,.mq-more,.mq-replay{white-space:nowrap;flex:none;font-size:.74rem}.mq-more{margin-left:0}}
/* ---- la fenêtre Nouveautés */
.nt{position:fixed;left:24px;bottom:24px;z-index:60;display:flex;flex-direction:column;gap:10px;width:320px;max-width:calc(100vw - 20px);pointer-events:none}
.nt.nt-double{width:430px}
.nt-card{position:relative;background:#fff;border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.18);border:1px solid #ece3d2;padding:10px;transform:translateY(160%);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s ease;pointer-events:none}
.nt-card.open{transform:none;opacity:1;pointer-events:auto}
.nt-card.open:nth-child(2){transition-delay:.12s}
.nt-row{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;min-width:0}
.nt-row img{width:56px;height:56px;object-fit:cover;border-radius:10px;flex:none;background:#faf7f0}
.nt-txt{min-width:0;padding-right:18px}
.nt-k{display:block;font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:#a98935;font-weight:700}
.nt-n{display:block;font-size:.9rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nt-p{display:block;font-size:.78rem;color:#a98935}
.nt-x{position:absolute;top:6px;right:6px;border:0;background:rgba(255,255,255,.85);border-radius:999px;width:26px;height:26px;font-size:15px;line-height:1;color:#9a8f7d;cursor:pointer;display:flex;align-items:center;justify-content:center}
.nt-double .nt-card{padding:10px 12px}
.nt-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.nt-two .nt-row{flex-direction:column;align-items:flex-start;gap:8px;padding:6px;border-radius:10px}
.nt-two .nt-row:hover{background:#faf7f0}
.nt-two .nt-row img{width:100%;height:auto;aspect-ratio:1;border-radius:10px}
.nt-two .nt-txt{padding-right:0;width:100%}
.nt-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-right:28px}
.nt-head .nt-k{font-size:.7rem}
@media (max-width:600px){.nt,.nt.nt-double{left:10px;right:10px;bottom:96px;width:auto;gap:8px}.nt-card{padding:12px}.nt-two .nt-row img{width:64px;height:64px;aspect-ratio:auto}.nt-two .nt-row{flex-direction:row;align-items:center}}
'''

JS = '''
(function(){var d=document,ITEMS=__ITEMS__,v='deux',closed=false,timers=[];
var root=d.createElement('div');root.className='nt';d.body.appendChild(root);
function clear(){timers.forEach(clearTimeout);timers=[]}
function card(inner){var c=d.createElement('div');c.className='nt-card';c.innerHTML=inner+'<button class="nt-x" type="button" aria-label="Fermer">✕</button>';return c}
function row(p,k){return '<a class="nt-row" href="'+p.href+'" onclick="return false"><img src="'+p.img+'" alt=""><span class="nt-txt">'+(k?'<span class="nt-k">Nouveauté ✦</span>':'')+'<span class="nt-n">'+p.name+'</span><span class="nt-p">'+(p.prix?p.prix+' · ':'')+'Découvrir →</span></span></a>'}
function render(i){root.innerHTML='';root.className='nt'+(v==='double'?' nt-double':'');var a=ITEMS[i%ITEMS.length],b=ITEMS[(i+1)%ITEMS.length];
  if(v==='deux'){root.appendChild(card(row(a,true)));root.appendChild(card(row(b,true)))}
  else{root.appendChild(card('<div class="nt-head"><span class="nt-k">Nouveautés ✦</span></div><div class="nt-two">'+row(a)+row(b)+'</div>'))}
  requestAnimationFrame(function(){requestAnimationFrame(function(){root.querySelectorAll('.nt-card').forEach(function(c){c.classList.add('open')})})})}
function hide(){root.querySelectorAll('.nt-card').forEach(function(c){c.classList.remove('open')})}
function play(){clear();closed=false;var i=0;function cycle(){if(closed)return;render(i);timers.push(setTimeout(hide,7000));timers.push(setTimeout(function(){i+=2;if(i<ITEMS.length)cycle()},9500))}timers.push(setTimeout(cycle,2500))}
root.addEventListener('click',function(e){if(e.target.closest('.nt-x')){closed=true;clear();hide()}});
d.querySelectorAll('.mq-tabs button').forEach(function(b){b.addEventListener('click',function(){d.querySelectorAll('.mq-tabs button').forEach(function(x){x.classList.toggle('on',x===b)});v=b.dataset.v;play()})});
d.getElementById('mqReplay').addEventListener('click',play);
d.getElementById('mqMore').addEventListener('click',function(){var n=d.getElementById('mqNotes');n.hidden=!n.hidden;this.setAttribute('aria-expanded',!n.hidden)});
d.addEventListener('click',function(e){var a=e.target.closest('a');if(a&&a.getAttribute('href')&&a.getAttribute('href')[0]!=='#')e.preventDefault()});
play()})();
'''.replace("__ITEMS__", json.dumps(items, ensure_ascii=False))

page = src.replace("<body", "<body data-maquette", 1)
page = page.replace("</head>", f"<style>{CSS}</style></head>", 1)
page = re.sub(r"(<body[^>]*>)", r"\1" + NOTES.replace("\\", "\\\\"), page, count=1)
page = page.replace("</body>", f"<script>{JS}</script></body>", 1)
page = re.sub(r"<title>.*?</title>", "<title>Fenêtre Nouveautés</title>", page, count=1)
open(os.path.join(OUT, "fenetre-nouveautes.html"), "w", encoding="utf-8").write(page)
# fragment pour l'artifact : sans <html>/<head>/<body>
head = re.search(r"<head>(.*?)</head>", page, flags=re.S).group(1)
head = re.sub(r"<meta[^>]+>", "", head); head = re.sub(r"<link[^>]+>", "", head)
body = re.search(r"<body[^>]*>(.*)</body>", page, flags=re.S).group(1)
open(os.path.join(OUT, "fenetre-nouveautes.fragment.html"), "w", encoding="utf-8").write(head + body)
print("ok", len(page) // 1024, "Ko,", len(items), "nouveautés :", " · ".join(i["name"] for i in items))
