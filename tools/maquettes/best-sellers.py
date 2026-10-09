#!/usr/bin/env python3
"""Maquette « Best-sellers » (10/10/2026, gérant : « tu penses qu'on peut mettre des best-sellers ? » → « oui »).
Proposé : une étiquette « Best-seller » calculée TOUTE SEULE sur les vraies commandes (90 derniers jours, hors annulées /
remboursées / tests, en nombre de pièces), sur les 5 produits qui se vendent le plus, partout où leur carte apparaît, plus
une rangée « Nos meilleures ventes » sur l'accueil, juste après « Les dernières sorties ». L'étiquette posée à la main sur le
Collier 3 Cœurs disparaît (elle n'est gardée que si le collier est vraiment dans le classement).
⚠️ Les ventes réelles ne sont pas lisibles d'ici : le classement de la maquette est un EXEMPLE (bannière en tête).
Part du VRAI accueil (capture `curl localhost:3140/` après `npm run build` + `next start`).
Usage : python3 tools/maquettes/best-sellers.py <accueil-src.html>
Sortie : docs/maquettes/best-sellers.html (+ .fragment.html). Rien n'est touché dans le site."""
import base64, html, io, os, re, sys
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


# 3. le classement d'EXEMPLE (en vrai : calculé chaque jour sur les commandes des 90 derniers jours)
TOP = ["verre-a-whisky-grave", "collier-coeur-grave", "collier-double-coeur", "bracelet-cordon-plaque", "veilleuse-arbre-de-vie-prenom"]
CARD = re.compile(r'<div class="uc"[^>]*>.*?</button></div>', re.S)
cartes = {}
for c in CARD.findall(src):
    m = re.search(r'href="/produit/([^"]+)"', c)
    if m and m.group(1) not in cartes: cartes[m.group(1)] = c
manque = [s for s in TOP if s not in cartes]
assert not manque, manque

def etiquette(c, texte):
    c = re.sub(r'<span class="uc-tag">[^<]*</span>', "", c)
    return c.replace('<span class="uc-meta">', f'<span class="uc-meta"><span class="uc-tag uc-tag-bs">{texte}</span>', 1)

# 3a. l'étiquette posée à la main sur le Collier 3 Cœurs s'en va (il n'est pas dans le classement d'exemple)
src = src.replace('<span class="uc-tag">Best-seller</span>', "")
# 3b. partout où un produit du classement apparaît, il porte « Best-seller »
def partout(m):
    c = m.group(0)
    h = re.search(r'href="/produit/([^"]+)"', c)
    return etiquette(c, "Best-seller") if h and h.group(1) in TOP else c
src = CARD.sub(partout, src)
# 3c. la rangée « Nos meilleures ventes », juste après « Les dernières sorties »
rangee = "".join(etiquette(cartes[s], f"Best-seller · n° {i + 1}") for i, s in enumerate(TOP))
SECTION = f'''<section class="sec rail-sec rv in bs-sec" id="meilleures-ventes" aria-labelledby="t-bs">
<div class="sec-head"><div><h2 id="t-bs">Nos meilleures <em>ventes</em></h2><p class="sub">Les créations les plus commandées ces trois derniers mois.</p></div></div>
<div class="bs-grid">{rangee}</div>
<p class="bs-note">MAQUETTE · classement d'exemple : en vrai, il est calculé chaque jour sur vos commandes des 90 derniers jours.</p>
</section>'''
fin = re.search(r'<section class="sec rail-sec[^"]*" id="nouveautes".*?</section>', src, flags=re.S).end()
src = src[:fin] + SECTION + src[fin:]

CSS = """
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.8rem;padding:9px 14px;line-height:1.45}
.mq-banner b{color:#e2c67e}
.uc-tag.uc-tag-bs{background:#1a1206;color:#e2c67e;border-radius:999px;padding:2px 9px;align-self:flex-start}
.bs-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px}
.bs-note{font-size:.8rem;color:#6b5f4b;margin:14px 0 0}
@media (max-width:900px){.bs-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;padding-bottom:6px}.bs-grid .uc{flex:0 0 calc(50% - 7px);scroll-snap-align:start}}
.rv{opacity:1!important;transform:none!important}
"""
BANNER = ('<div class="mq-banner">MAQUETTE « Best-sellers » · l\'étiquette se pose toute seule sur les 5 produits les plus '
          'vendus des 90 derniers jours · <b>classement d\'exemple, rien n\'est sur le site</b></div>')
src = src.replace("</head>", f"<style>{CSS}</style></head>", 1)
src = re.sub(r"(<body[^>]*>)", r"\1" + BANNER, src, count=1)
src = src.replace("<title>", "<title>Best-sellers (maquette) — ", 1)
open(os.path.join(OUT, "best-sellers.html"), "w", encoding="utf-8").write(src)
body = src[src.find("<body"):]
body = body[body.find(">") + 1:body.rfind("</body>")]
head = re.search(r"<head>(.*?)</head>", src, re.S).group(1)
styles = "".join(re.findall(r"<style>.*?</style>", head, re.S))
open(os.path.join(OUT, "best-sellers.fragment.html"), "w", encoding="utf-8").write('<meta charset="utf-8"><title>Best-sellers (maquette)</title>' + styles + body)
print("ok", len(src) // 1024, "Ko")
