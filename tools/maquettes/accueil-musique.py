#!/usr/bin/env python3
"""Maquette « le produit musique sur l'accueil » (26/11/2026, gérant : « on peut mettre quelque part sur la page d'accueil,
analyse et tu me dis » → « les trois »). Part du VRAI accueil en ligne : mêmes feuilles de style, photos en data URI, scripts
retirés. Trois changements, encadrés en pointillé et numérotés :
  1. la carte du produit passe en tête des « dernières sorties » ;
  2. une ligne dans le bloc de Noël ;
  3. un bloc à lui, juste après les marque-pages.
Rien n'est touché dans le site.
Usage : python3 tools/maquettes/accueil-musique.py <accueil.html> <dossier css> <dossier /api/img> <sortie.html>
  accueil.html = curl https://nivcreation.fr/ · dossier css = ses feuilles /_next/static/css/*.css
  dossier /api/img = les photos /api/img/<id> de la page, un fichier par id."""
import base64, html, io, os, re, sys, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC, CSSDIR, IMGDIR, SORTIE = sys.argv[1:5]
src = open(SRC, encoding="utf-8").read()
PRIX = "14,90 €"   # lu sur la fiche en ligne le 26/11/2026 (node tools/prix-fiche.mjs plaque-musique-a-scanner)
m = re.search(r'href="/produit/plaque-musique-a-scanner".*?class="uc-price">dès (?:<!-- -->)?([^<]+)<', src, re.S)
if m: PRIX = m.group(1).strip()

def uri(path, w=640, q=72):
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
def raw(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()

# 1. scripts retirés, feuilles de style et polices intégrées
src = re.sub(r"<script\b[^>]*>.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", src)
def police(m):
    nom = os.path.basename(m.group(1))
    fp = os.path.join(CSSDIR, "..", "media", nom)
    if not os.path.exists(fp):
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        urllib.request.urlretrieve("https://nivcreation.fr" + m.group(1), fp)
    return "url(" + raw(fp, "font/woff2") + ")"
css = ""
for f in dict.fromkeys(re.findall(r'/_next/static/css/([a-f0-9]+\.css)', src)):
    c = open(os.path.join(CSSDIR, f), encoding="utf-8").read()
    css += re.sub(r'url\((/_next/static/media/[^)]+\.woff2)\)', police, c) + "\n"
src = re.sub(r'<link[^>]+/_next/static/css/[^>]+>', "", src)

# 2. photos en data URI (le mur a plus de 200 vignettes : petites)
cache = {}
def local(m):
    p = html.unescape(m.group(1)).split("?")[0]
    if p.startswith("/api/img/"): fp = os.path.join(IMGDIR, p.rsplit("/", 1)[1])
    else: fp = os.path.join(ROOT, "public", p.lstrip("/"))
    if not os.path.exists(fp): return m.group(0)
    if p not in cache:
        cache[p] = uri(fp, 900 if "logo-niv" in p or "cristal-v-femme" in p else 300 if p.startswith("/vignettes/") else 560,
                       80 if "logo-niv" in p else 68)
    return f'src="{cache[p]}"'
src = re.sub(r'src="(/(?:produits|vignettes|marque-pages|api/img)/[^"]+|/logo-niv-creation\.jpg)"', local, src)
src = re.sub(r'src="(/instagram-qr\.png)"', lambda m: f'src="{raw(os.path.join(ROOT, "public", "instagram-qr.png"), "image/png")}"', src)
src = re.sub(r'href="/', 'href="https://nivcreation.fr/', src)
def img(nom, w=560): return uri(os.path.join(ROOT, "public", "produits", "musique", nom), w, 80)

FLECHE = '<svg class="mxic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
FICHE = "https://nivcreation.fr/produit/plaque-musique-a-scanner"

# ── 1. en tête des dernières sorties ────────────────────────────────────────────────────────────────
i = src.index('id="nouveautes"'); j = src.index('class="mpb', i)
bloc = src[i:j]
m = re.search(r'<div class="uc"[^>]*><a class="uc-link" href="https://nivcreation\.fr/produit/plaque-musique-a-scanner".*?</button></div>', bloc, re.S)
carte = m.group(0)
bloc = bloc.replace(carte, "", 1)
carte = carte.replace('<div class="uc"', '<div class="uc mq-new" id="mq-1"', 1).replace("</button></div>", '</button><span class="mq-tag">1 · Passé en tête</span></div>')
k = bloc.index('<div class="rail"'); k = bloc.index(">", k) + 1
bloc = bloc[:k] + carte + bloc[k:]
src = src[:i] + bloc + src[j:]

# ── 2. une ligne dans le bloc de Noël ───────────────────────────────────────────────────────────────
LIGNE = (f'<p class="mxnoel-note mq-ligne" id="mq-2"><a style="color:inherit;text-decoration:underline;text-underline-offset:3px" href="{FICHE}">'
         f'Nouveau : votre chanson gravée sur du bois, à scanner, dès {PRIX}</a><span class="mq-tag mq-tag-l">2 · Ligne ajoutée</span></p>')
i = src.index('class="mxnoel-copy"'); j = src.index('<div class="fan', i)
k = src.rindex("</div>", i, j)
src = src[:k] + LIGNE + src[k:]

# ── 3. un bloc à lui, juste après les marque-pages ──────────────────────────────────────────────────
BLOC = f'''<section class="msb mq-new" id="mq-3" aria-labelledby="t-msb"><span class="mq-tag">3 · Nouveau bloc</span>
<div class="msb-in">
  <div class="msb-copy">
    <span class="msb-pill"><span class="msb-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Nouveau à l'atelier</span>
    <h2 id="t-msb">Votre chanson, <em>gravée sur du bois</em></h2>
    <p>Celle de votre rencontre, de votre mariage ou de vos vacances. Nous la gravons en QR code sur une plaque ou un porte-clés en bois : on scanne avec le téléphone, et elle se lance.</p>
    <ol class="msb-pas">
      <li><b>Vous collez le lien</b><span>de votre chanson : Spotify, Deezer, Apple Music, YouTube ou SoundCloud.</span></li>
      <li><b>Nous gravons</b><span>le QR code, votre titre, votre dédicace, et même votre photo.</span></li>
      <li><b>On scanne</b><span>avec l'appareil photo du téléphone : la chanson démarre.</span></li>
    </ol>
    <p class="msb-price"><span>à partir de</span><b>{PRIX}</b></p>
    <a class="mxbtn mxbtn-gold" href="{FICHE}"><span>Créer la mienne</span>{FLECHE}</a>
  </div>
  <div class="msb-pics">
    <a class="msb-pic p1" href="{FICHE}"><img src="{img('exemple-photo.jpg')}" alt="Plaque en bois gravée d'une photo de couple, d'un QR code et de « Notre chanson »"/></a>
    <a class="msb-pic p2" href="{FICHE}"><img src="{img('exemple-plaque.jpg')}" alt="Plaque en bois gravée d'un QR code, « Scannez pour écouter »"/></a>
    <a class="msb-pic p3" href="{FICHE}"><img src="{img('exemple-porte-cles.jpg', 420)}" alt="Porte-clés en bois gravé d'un QR code"/></a>
  </div>
</div></section>'''
i = src.index('class="mpb'); i = src.index("</section>", i) + len("</section>")
src = src[:i] + BLOC + src[i:]

BARRE = '''<div class="mq-bar" role="region" aria-label="Maquette"><div class="mq-in"><b>Maquette, rien n'est en ligne</b>
<span>Trois changements, encadrés en pointillé :</span>
<span class="mq-go"><button type="button" data-go="mq-1">1 · En tête des nouveautés</button><button type="button" data-go="mq-2">2 · Ligne dans Noël</button><button type="button" data-go="mq-3">3 · Bloc à lui</button></span></div></div>'''
src = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + BARRE, src, 1)

CSS = r'''
.mq-bar{background:#1a1206;color:#d9ccb0;font:400 .82rem/1.45 Inter,system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px)}
.mq-in{display:flex;gap:6px 14px;flex-wrap:wrap;align-items:center;padding:8px max(16px,env(safe-area-inset-left,0px));max-width:1300px;margin:0 auto}.mq-in b{color:#e2c67e}
.mq-go{display:flex;gap:6px;flex-wrap:wrap}
.mq-go button{font:600 .78rem/1 Inter,system-ui,sans-serif;color:#1a1206;background:#e2c67e;border:0;border-radius:999px;padding:8px 12px;cursor:pointer}
.mq-go button:focus-visible{outline:2px solid #fff;outline-offset:2px}
.rv{opacity:1!important;transform:none!important}
.mq-new{position:relative;outline:2px dashed #b3261e;outline-offset:6px;scroll-margin-top:90px}
.mq-tag{position:absolute;top:8px;right:8px;z-index:5;background:#b3261e;color:#fff;font:700 .66rem/1 Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:6px 9px;border-radius:999px;white-space:nowrap}
.mx .uc.mq-new{border-radius:20px}.mx .uc.mq-new .mq-tag{top:auto;bottom:-14px;right:50%;transform:translateX(50%)}
.mx .rail-sec .rail{padding-top:10px;padding-left:8px;padding-bottom:22px}
.mx .mq-ligne{position:relative;display:inline-block;outline:2px dashed #fff;outline-offset:6px;border-radius:6px;scroll-margin-top:160px;margin-bottom:26px!important}
.mq-tag-l{top:auto;bottom:-26px;right:auto;left:0;background:#fff;color:#7a1512}
/* le bloc musique : clair (la bande des marque-pages juste au-dessus est sombre), texte à gauche, photos à droite */
.mx .msb{margin:28px clamp(16px,4.5vw,72px);border-radius:24px;background:linear-gradient(135deg,#f3e8d3 0%,#fbf7ee 55%,#f1e2c4 100%);color:#1a1206;border:1px solid rgba(201,162,75,.45);overflow:hidden}
.mx .msb-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(20px,4vw,56px);align-items:center;padding:clamp(28px,5vw,64px);max-width:1180px;margin:0 auto}
.mx .msb-pill{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:.74rem;line-height:1;letter-spacing:.08em;text-transform:uppercase;color:#7c6120;border:1px solid rgba(124,97,32,.45);border-radius:999px;padding:7px 12px}
.mx .msb-eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px}
.mx .msb-eq i{width:3px;border-radius:2px;background:#a98935;height:40%;animation:msb-eq 1.1s ease-in-out infinite}
.mx .msb-eq i:nth-child(2){animation-delay:-.35s}.mx .msb-eq i:nth-child(3){animation-delay:-.7s}.mx .msb-eq i:nth-child(4){animation-delay:-.2s}
@keyframes msb-eq{0%,100%{height:30%}50%{height:100%}}
@media (prefers-reduced-motion:reduce){.mx .msb-eq i{animation:none;height:70%}}
.mx .msb h2{font-family:var(--font-display),"Playfair Display",serif;font-weight:600;font-size:clamp(1.7rem,3.4vw,2.6rem);line-height:1.12;margin:16px 0 12px;color:#1a1206;text-wrap:balance}
.mx .msb h2 em{color:#8a6a1f}
.mx .msb-copy>p{margin:0 0 16px;color:#4b3f2a;line-height:1.6;max-width:54ch}
.mx .msb-pas{list-style:none;counter-reset:pas;padding:0;margin:0 0 20px;display:grid;gap:12px}
.mx .msb-pas li{counter-increment:pas;position:relative;padding-left:44px;min-height:32px;font-size:.94rem;line-height:1.45;color:#4b3f2a}
.mx .msb-pas li::before{content:counter(pas);position:absolute;left:0;top:0;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#1a1206;color:#e2c67e;font-weight:700;font-size:.9rem}
.mx .msb-pas b{display:block;color:#1a1206}
.mx .msb-copy .msb-price{display:flex;align-items:baseline;gap:8px;margin:0 0 18px}.mx .msb-price span{font-size:.85rem;color:#6b5a3a}.mx .msb-price b{font-size:1.5rem;color:#7c6120}
.mx .msb-pics{position:relative;height:clamp(300px,34vw,430px)}
.mx .msb-pic{position:absolute;display:block;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 16px 36px rgba(60,40,10,.22);border:4px solid #fff}
.mx .msb-pic img{display:block;width:100%;height:100%;object-fit:cover}
.mx .msb-pic.p1{left:0;top:6%;width:56%;aspect-ratio:1;transform:rotate(-4deg);z-index:2}
.mx .msb-pic.p2{right:0;top:0;width:50%;aspect-ratio:1;transform:rotate(5deg);z-index:1}
.mx .msb-pic.p3{right:12%;bottom:0;width:36%;aspect-ratio:1;transform:rotate(-2deg);z-index:3}
@media (max-width:820px){.mx .msb-in{grid-template-columns:1fr}.mx .msb-pics{order:-1;height:300px;max-width:420px;width:100%;margin:0 auto}}
@media (max-width:480px){.mx .msb{margin:22px 16px;border-radius:20px}.mx .msb-in{padding:26px 18px 28px}.mx .msb-pics{height:250px}}
'''
JS = '''<script>document.querySelectorAll("[data-go]").forEach(function(b){b.addEventListener("click",function(){var e=document.getElementById(b.getAttribute("data-go"));if(e)e.scrollIntoView({behavior:"smooth",block:"center"});});});
document.addEventListener("click",function(e){var a=e.target.closest("a");if(a&&!a.closest(".mq-new,.mq-ligne"))e.preventDefault();});</script>'''

# la page publiée : pas de <html>/<head>/<body> à nous (l'outil les ajoute) ; classes du <html> et du <body> reportées
h = re.search(r"<html[^>]*class=\"([^\"]*)\"", src); b = re.search(r"<body[^>]*class=\"([^\"]*)\"", src)
corps = re.search(r"<body[^>]*>(.*)</body>", src, re.S).group(1)
page = ('<title>Accueil musique à scanner</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        f"<style>{css}\n{CSS}\nbody{{background:#fbf7ee;color:#1a1206}}</style>\n"
        f'<div class="{(h.group(1) if h else "")} {(b.group(1) if b else "")}">{corps}</div>\n{JS}\n')
open(SORTIE, "w", encoding="utf-8").write(page)
print(SORTIE, round(len(page) / 1e6, 2), "Mo ·", len(cache), "photos · prix", PRIX)
