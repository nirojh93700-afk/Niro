#!/usr/bin/env python3
"""Maquette « Cristal photo 3D » (la page /cristaux du site) dans l'habillage du nouveau site — 09/10/2026.

Gérant : « tout doit ressembler… fais comme sur cette maquette [cristaux-graves] pour les autres blocs de cristal
qui est sur le site… tu changes rien, tu changes juste la mise en page ». Donc : MÊME CONTENU que /cristaux aujourd'hui
(titre, phrase, animation du laser, les 5 créations + le socle avec leurs prix, la note, le retour boutique), et
l'habillage « Mélange » de la maquette cristaux-graves : écrin encre & or en ouverture (l'animation du laser à droite
du titre), cartes claires arrondies avec l'étiquette, le nom et le prix SOUS la photo, pavé note, pied de page du site.

Usage : python3 tools/maquettes/cristaux-blocs.py <capture /cristaux.html>
Sortie : docs/maquettes/cristaux-blocs.html (+ .fragment.html). Rien n'est touché dans le site.
"""
import base64, io, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(OUT, "cristaux-src.html")


def uri(path, w=700, q=74):
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


# ---------------------------------------------------------------- capture du site (coquille : en-tête + pied de page)
src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER = src[body_start:i_main]
FOOTER = src[j_main:src.rfind("</body>")]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)
SITE_MAIN = src[i_main:j_main]

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
root_vars = ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css))
css += ":root{" + root_vars + "}\n"

def local_src(m):
    p = os.path.join(PUB, m.group(2).lstrip("/"))
    return f'{m.group(1)}="{raw_uri(p)}"' if os.path.exists(p) else m.group(0)
HEADER = re.sub(r'(src)="(/[^"]+)"', local_src, HEADER)
FOOTER = re.sub(r'(src)="(/[^"]+)"', local_src, FOOTER)
for pat in (r'<button[^>]*>💬 Une question \?</button>', r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
    HEADER = re.sub(pat, "", HEADER); FOOTER = re.sub(pat, "", FOOTER)
HEADER = re.sub(r'href="/[^"]*"', 'href="#"', HEADER)
FOOTER = re.sub(r'href="/[^"]*"', 'href="#"', FOOTER)

# ---------------------------------------------------------------- le CONTENU de /cristaux, lu dans la capture (rien d'inventé)
H1 = re.search(r'<h1>(.*?)</h1>', SITE_MAIN, re.S).group(1)                          # « Votre photo devient <em>cristal</em> »
LEDE = re.search(r'<header class="cvb-head">.*?<p>(.*?)</p>', SITE_MAIN, re.S).group(1)
CAPS = ["Le laser <b>s'allume</b>…", "Chaque détail se grave, <b>point par point</b>.", "Votre souvenir <b>prend vie</b>.", "Posé sur son <b>socle multicolore</b>."]
BADGE = re.search(r'<div class="cvb-badge">(.*?)</div>', SITE_MAIN).group(1)
ANIM_IMG = re.search(r'<div class="cvb-ph"><img src="([^"]+)"', SITE_MAIN).group(1)
TILES = []
for m in re.finditer(r'<div class="cvb-tile"(?: id="cvb-socle")?><a class="cvb-cover" aria-label="([^"]+)" href="([^"]+)"></a><div class="cvb-img"><img src="([^"]+)" alt="[^"]*"/><span class="cvb-price">(.*?)</span>.*?<div class="cvb-lab"><b>(.*?)</b>(.*?)</div>', SITE_MAIN, re.S):
    label, href, img, price, nom, sub = m.groups()
    TILES.append({"href": href, "img": img, "price": re.sub(r"<!--.*?-->", "", price).strip(), "nom": nom, "sub": sub})
NOTE = re.search(r'<div class="cvb-info"><div class="cvb-stars">(.*?)</div><b>(.*?)</b><span>(.*?)</span>', SITE_MAIN, re.S).groups()
RETOUR = re.search(r'<a class="link-underline" href="/boutique">(.*?)</a>', SITE_MAIN).group(1)
assert len(TILES) == 6, len(TILES)

ICON = {
    "gem": '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6 3-6M12 9v12"/>',
    "pin": '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "truck": '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "back": '<path d="M19 12H5M11 18l-6-6 6-6"/>',
}
def ic(n, cls="cg-ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>')


def carte(t):
    img = uri(os.path.join(PUB, t["img"].lstrip("/")), 640, 76)
    socle = "socle" in t["href"] or t["nom"].startswith("Socle")
    extra = '<span class="cb-lg" aria-hidden="true"></span>' if t["nom"].startswith("Socle") else ""
    return f'''<a class="cg-tile{' cb-socle' if t["nom"].startswith("Socle") else ''}" href="#" aria-label="{t["nom"]}">
      <span class="cg-img"><img src="{img}" alt="{t["nom"]}" loading="lazy">{extra}</span>
      <span class="cg-meta"><span class="cg-tag">{t["sub"]}</span><b class="cg-nom">{t["nom"]}</b><span class="cg-price">{t["price"]}</span></span>
    </a>'''

CARTES = "\n".join(carte(t) for t in TILES)
ANIM = uri(os.path.join(PUB, ANIM_IMG.lstrip("/")), 760, 78)

MAIN = f'''<main class="cg">
<section class="cg-intro cg-ecrin">
  <div class="container cg-ecrin-grid">
    <div class="cg-ecrin-txt">
    <h1>{H1}</h1>
    <p class="cg-lede">{LEDE}</p>
    <ul class="cg-trust">
      <li>{ic("gem")}<span><b>Cristal optique K9</b>pureté et éclat</span></li>
      <li>{ic("pin")}<span><b>Gravé en France</b>dans notre atelier</span></li>
      <li>{ic("truck")}<span><b>Livraison suivie</b>colis &amp; point relais</span></li>
    </ul>
    </div>
    <div class="cb-anim" id="cvb-anim" aria-hidden="true">
      <div class="cvb-stage">
        <div class="cvb-badge">{BADGE}</div>
        <div class="cvb-ghost"></div>
        <div class="cvb-ph"><img src="{ANIM}" alt=""><div class="cvb-laser"></div></div>
        <div class="cvb-glow"></div>
        <div class="cvb-cap">{CAPS[0]}</div>
      </div>
    </div>
  </div>
</section>

<section class="cg-shop" aria-labelledby="t-cb">
  <div class="container">
    <div class="cg-head">
      <h2 id="t-cb">Choisissez votre cristal</h2>
    </div>
    <div class="cg-grid">
      {CARTES}
      <div class="cg-tile cb-info" role="note">
        <span class="cb-stars">{NOTE[0]}</span><b>{NOTE[1]}</b><span>{NOTE[2]}</span>
      </div>
    </div>
    <p class="cb-retour"><a href="#">{ic("back")} {RETOUR.replace("← ", "")}</a></p>
  </div>
</section>
</main>'''

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.cg{--cream:#fbf7ee;--paper:#fdfaf3;--sand:#f3e8d3;--sand2:#eadbbf;--ink:#1a1206;--ink2:#241a0c;--muted:#6b5f4b;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;--r:20px;--r2:14px;--r3:28px;--sh:0 14px 36px rgba(26,18,6,.10);--ink-soft:var(--muted);--line:var(--sand2);background:var(--cream)}
.cg .container{max-width:1180px}
.cg-ic{width:20px;height:20px;flex:none}
.cg h1,.cg h2,.cg h3{font-family:var(--font-display),Georgia,serif;color:var(--ink);font-weight:600;letter-spacing:-.01em;text-wrap:balance;margin:0}
.cg h1 em,.cg h2 em{font-style:italic;font-weight:500;color:var(--gold-t)}
.cg-lede{color:var(--muted);font-size:clamp(1rem,2.4vw,1.1rem);line-height:1.6;max-width:62ch;margin:12px 0 0}
.cg-trust{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-wrap:wrap;gap:10px 26px}
.cg-trust li{display:flex;align-items:center;gap:10px;text-align:left;color:var(--gold-l)}
.cg-trust b{display:block;color:#fff;font-size:.92rem}
.cg-trust span{color:#b8a98a;font-size:.82rem;line-height:1.3}
/* écrin */
.cg-intro.cg-ecrin{text-align:left;background:radial-gradient(60% 90% at 85% 0%,rgba(201,162,75,.30),transparent 60%),var(--ink2);color:#fff;padding:clamp(40px,7vw,80px) 0 clamp(34px,5vw,56px)}
.cg-ecrin h1{color:#fff;font-size:clamp(2.1rem,5.4vw,3.6rem);line-height:1.06}
.cg-ecrin h1 em{color:var(--gold-l)}
.cg-ecrin .cg-lede{color:#d9ccb0;margin:16px 0 0}
.cg-ecrin-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(22px,4vw,56px);align-items:center}
/* l'animation du laser (reprise telle quelle de la page actuelle, posée dans un cadre doré) */
.cb-anim{border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(226,198,126,.55),0 0 0 4px #1a1206,0 0 0 5px rgba(226,198,126,.35),0 24px 48px -24px rgba(0,0,0,.8)}
.cvb-stage{position:relative;aspect-ratio:16/10;background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.cvb-ph{position:absolute;left:50%;top:49%;transform:translate(-50%,-50%);width:58%;max-width:330px;aspect-ratio:760/481;border-radius:10px;overflow:hidden;box-shadow:0 18px 40px rgba(43,38,32,.30),0 0 0 1px rgba(194,161,78,.4)}
.cvb-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;clip-path:inset(0 0 100% 0)}
.cvb-ghost{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:34%;aspect-ratio:2/3;border-radius:6px;border:1.5px solid rgba(194,161,78,.5);background:linear-gradient(115deg,rgba(255,255,255,.8),rgba(240,232,214,.3) 45%,rgba(255,255,255,.65))}
.cvb-laser{position:absolute;left:-4%;width:108%;height:2.5px;border-radius:3px;opacity:0;z-index:4;background:linear-gradient(90deg,transparent,#fff 18%,#e2c67e 50%,#fff 82%,transparent);box-shadow:0 0 12px 3px rgba(226,198,126,.95),0 0 34px 9px rgba(226,198,126,.5)}
.cvb-glow{position:absolute;left:22%;right:22%;bottom:2%;height:16%;border-radius:50%;filter:blur(16px);opacity:0;z-index:1}
.cvb-cap{position:absolute;left:0;right:0;bottom:7px;z-index:5;text-align:center;font-size:clamp(12px,3.4vw,15px);color:#2b2620}
.cvb-cap b{color:#a98935}
.cvb-badge{position:absolute;top:9px;left:10px;z-index:5;background:rgba(43,38,32,.85);color:#e2c67e;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;padding:5px 10px;border-radius:20px}
@media (prefers-reduced-motion:reduce){.cvb-ph img{clip-path:none!important}.cvb-laser{display:none}}
/* boutique */
.cg-shop{padding:clamp(26px,4vw,40px) 0 clamp(48px,7vw,80px)}
.cg-head h2{font-size:clamp(1.45rem,3.4vw,1.9rem)}
.cg-head p{color:var(--muted);margin:6px 0 0}
.cg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px 14px;margin-top:18px}
.cg-tile{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;text-align:left;font:inherit}
.cg-tile:focus-visible{outline:3px solid var(--gold-d);outline-offset:3px;border-radius:var(--r)}
.cg-img{display:block;position:relative;aspect-ratio:1/1;border-radius:var(--r);overflow:hidden;background:var(--sand);transition:box-shadow .2s}
.cg-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.22,1,.36,1)}
.cg-tile:hover .cg-img img{transform:scale(1.04)}
.cg-tile:hover .cg-img{box-shadow:0 0 0 2px var(--gold)}
.cg-meta{display:flex;flex-direction:column;gap:2px;padding:0 2px}
.cg-tag{font-size:.76rem;font-weight:600;color:var(--gold-t)}
.cg-nom{font-weight:600;font-size:.92rem;line-height:1.3;color:var(--ink)}
.cg-price{font-family:var(--font-display),Georgia,serif;font-size:1rem;color:var(--gold-t)}
.cb-socle .cg-img{background:#17120c}
.cb-socle .cg-img img{opacity:.94}
.cb-lg{position:absolute;left:14%;right:14%;bottom:6%;height:26%;border-radius:50%;filter:blur(16px);z-index:2;opacity:.9;background:radial-gradient(closest-side,hsl(200 95% 60%),transparent)}
.cb-info{align-items:center;justify-content:center;gap:5px;text-align:center;padding:22px 16px;border-radius:var(--r);background:#fff;box-shadow:var(--sh)}
.cb-stars{color:var(--gold-d);font-size:1.05rem;letter-spacing:2px}
.cb-info b{font-family:var(--font-display),Georgia,serif;font-size:1.15rem;color:var(--ink)}
.cb-info span:last-child{color:var(--muted);font-size:.84rem;line-height:1.4}
.cb-retour{text-align:center;margin:30px 0 0}
.cb-retour a{display:inline-flex;align-items:center;gap:8px;color:var(--ink);font-weight:600;text-decoration:none;border-bottom:1.5px solid var(--gold);padding-bottom:2px}
.cb-retour .cg-ic{width:18px;height:18px}
@media (max-width:860px){
  .cg-ecrin-grid{grid-template-columns:1fr;gap:26px}
  .cg-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px}
  .cg-nom{font-size:.86rem}
}
@media (max-width:480px){.cg-trust{gap:8px 18px}}
'''

JS = r'''
(function(){
  var R=document.getElementById('cvb-anim');if(!R)return;
  var CAPS=__CAPS__;
  var clamp=function(v,a,b){return Math.min(b,Math.max(a,v))},ease=function(t){return t*t*(3-2*t)};
  var ph=R.querySelector('.cvb-ph img'),la=R.querySelector('.cvb-laser'),gl=R.querySelector('.cvb-glow'),cap=R.querySelector('.cvb-cap'),slg=document.querySelector('.cb-lg');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ph.style.clipPath='none';cap.innerHTML=CAPS[3];return}
  var t0=performance.now();
  function fr(now){var t=(now-t0)/1000,G=4.4,r=ease(clamp(t/G,0,1));
    ph.style.clipPath='inset(0 0 '+((1-r)*100)+'% 0)';la.style.opacity=t<G?clamp(t/0.4,0,1):0;la.style.top=(r*100)+'%';
    var led=clamp((t-G+0.5)/1.2,0,1),hue=(t*42)%360;gl.style.opacity=0.85*led;gl.style.background='radial-gradient(closest-side,hsl('+hue+' 95% 62%),transparent)';
    if(slg)slg.style.background='radial-gradient(closest-side,hsl('+((hue+120)%360)+' 95% 60%),transparent)';
    var idx=t<1.6?0:t<3.1?1:t<4.9?2:3;if(cap.dataset.i!==String(idx)){cap.dataset.i=String(idx);cap.innerHTML=CAPS[idx]}
    requestAnimationFrame(fr)}
  requestAnimationFrame(fr);
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
})();
'''.replace("__CAPS__", __import__("json").dumps(CAPS, ensure_ascii=False))

BANNER = '<div class="mq-banner">MAQUETTE — page « Cristal photo 3D » (la page /cristaux actuelle, même contenu, nouvel habillage) · <b>rien n\'est encore sur le site</b></div>'
TITLE = "<title>Cristal photo 3D — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "cristaux-blocs.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "cristaux-blocs.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko", [t["nom"] + " " + t["price"] for t in TILES])
