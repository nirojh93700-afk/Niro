# -*- coding: utf-8 -*-
"""Maquette « fiche carafe — parcours guidé en 4 étapes ».
Part du VRAI rendu de /produit/carafe-a-whisky-gravee (carafe-src.html, servi par next start),
inline les feuilles de style, remplace les photos par des data URI, retire les scripts,
et REMPLACE le bloc « Personnalisation — gravure » par le parcours guidé interactif.
"""
import re, base64, io, json, os, sys, urllib.parse
from PIL import Image

S = "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
ROOT = "/home/user/Niro"
OUT = f"{ROOT}/docs/maquettes/carafe-parcours-guide.html"

html = open(f"{S}/carafe-src.html", encoding="utf8").read()

# ---------- 1. scripts / preloads ----------
html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
html = re.sub(r"<script\b[^>]*/>", "", html)
html = re.sub(r'<link rel="preload"[^>]*>', "", html)
html = re.sub(r'<noscript>.*?</noscript>', "", html, flags=re.S)

# ---------- 2. CSS inline ----------
def css_inline(m):
    path = m.group(1)
    css = open(f"{ROOT}/.next{path.replace('/_next','')}", encoding="utf8").read()
    css = css.replace("url(/_next/static/media/", "url(https://nivcreation.fr/_next/static/media/")
    return "<style>" + css + "</style>"
html = re.sub(r'<link rel="stylesheet" href="(/_next/static/css/[^"]+)"[^>]*/?>', css_inline, html)

# ---------- 3. images -> data URI ----------
_cache = {}
def datauri(rel, maxpx=640, q=72):
    key = (rel, maxpx, q)
    if key in _cache: return _cache[key]
    p = f"{ROOT}/public{rel}"
    if not os.path.exists(p):
        print("!! image manquante", rel); return rel
    im = Image.open(p)
    im.thumbnail((maxpx, maxpx))
    buf = io.BytesIO()
    if rel.lower().endswith(".png") and (im.mode in ("RGBA", "LA", "P")):
        im = im.convert("RGBA"); im.save(buf, "PNG", optimize=True); mime = "image/png"
    else:
        im = im.convert("RGB"); im.save(buf, "JPEG", quality=q, optimize=True); mime = "image/jpeg"
    u = f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()
    _cache[key] = u
    return u

def size_for(rel):
    if "carafe-motif" in rel: return (340, 80)
    if rel.endswith("carafe_vierge.jpg"): return (900, 78)
    if "carafe_" in rel: return (900, 74)
    if "alphabet" in rel: return (760, 78)
    return (520, 70)

def local_of(src):
    src = src.replace("&amp;", "&")
    if src.startswith("/_next/image?"):
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(src).query)
        return qs.get("url", [None])[0]
    if src.startswith("/produits/") or src.startswith("/instagram") or src.startswith("/logo"):
        return src
    return None

html = re.sub(r'\s(?:srcSet|imageSrcSet|sizes|imageSizes)="[^"]*"', "", html)
def src_sub(m):
    rel = local_of(m.group(1))
    if not rel: return m.group(0)
    mx, q = size_for(rel)
    return 'src="' + datauri(rel, mx, q) + '"'
html = re.sub(r'src="([^"]+)"', src_sub, html)
def url_sub(m):
    rel = local_of(m.group(1))
    if not rel: return m.group(0)
    mx, q = size_for(rel)
    return "url(" + datauri(rel, mx, q) + ")"
html = re.sub(r"url\((/[^)\"']+)\)", url_sub, html)

# ---------- 4. logo texte (CDN Shopify injoignable d'ici) ----------
html = re.sub(r'<img class="logo-img" src="https://cdn\.shopify\.com[^"]*"[^>]*/>',
              '<span class="logo-txt">Niv <em>Création</em></span>', html)

html = re.sub(r'src="https://cdn\.shopify\.com[^"]*"', 'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23efe6d6%27/%3E%3C/svg%3E"', html)
html = re.sub(r'@font-face\{[^}]*nivcreation\.fr[^}]*\}', '', html)

# ---------- 5. remplacement du bloc de personnalisation ----------
START = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
END = '<div class="pd-totbox">'
i0 = html.index(START); j0 = html.index(END, i0)
old = html[i0:j0]
# le segment doit être équilibré (ouvre = ferme)
opens = len(re.findall(r"<div\b", old)); closes = old.count("</div>")
print("bloc perso :", i0, j0, "div ouverts", opens, "fermés", closes)
assert opens == closes, "segment non équilibré"

# ----- données des 33 modèles (lues sur la planche des motifs) -----
# champs : ini1 (1 initiale) · ini2 (2 initiales) · ini3 (3 initiales) · prenom · role · date
MODELES = {
  1: ("Initiale + prénom", ["ini1","prenom"], "R · ROBIN"),
  2: ("Initiale + prénom", ["ini1","prenom"], "T · TONY"),
  3: ("3 initiales (monogramme)", ["ini3"], "ABC"),
  4: ("Initiale + prénom", ["ini1","prenom"], "A · ANDREW"),
  5: ("Initiale + prénom", ["ini1","prenom"], "B · BRADEN"),
  6: ("Initiale + prénom", ["ini1","prenom"], "K · Kevin"),
  7: ("Initiale + prénom et nom", ["ini1","prenom"], "A · Adam Palumbo"),
  8: ("2 initiales", ["ini2"], "JT"),
  9: ("2 initiales", ["ini2"], "S | R"),
  10: ("2 initiales", ["ini2"], "RJ"),
  11: ("2 initiales", ["ini2"], "JR"),
  12: ("Une initiale", ["ini1"], "B"),
  13: ("Initiale + prénom", ["ini1","prenom"], "D · Duarte"),
  14: ("Prénom ou nom", ["prenom"], "ROBINSON"),
  15: ("Initiale + prénom", ["ini1","prenom"], "E · EDWARDS"),
  16: ("Initiale + prénom", ["ini1","prenom"], "W · WATSON"),
  17: ("Prénom ou nom", ["prenom"], "SMITH"),
  18: ("Prénom + rôle + date", ["prenom","role","date"], "Connor · Best Man · 09/09/17"),
  19: ("Initiale + rôle", ["ini1","role"], "E · Best Man"),
  20: ("Sans texte (motif seul)", [], "silhouette"),
  21: ("Initiale + prénom", ["ini1","prenom"], "M · MILLER"),
  22: ("Prénom + rôle + date", ["prenom","role","date"], "RUSSELL · Groom · 29.10.2015"),
  23: ("Prénom seul", ["prenom"], "ANTHONY"),
  24: ("Prénom + rôle + date", ["prenom","role","date"], "DANIEL · BEST MAN · 5.11.18"),
  25: ("Initiale + prénom + année", ["ini1","prenom","date"], "B · Bob · Est. 2016"),
  26: ("Initiale + prénom + rôle + date", ["ini1","prenom","role","date"], "R · ROBERT · GROOM · 8.18.17"),
  27: ("Prénom + rôle + date", ["prenom","role","date"], "GRAYSON · GROOM · 10.30.2018"),
  28: ("Prénom + rôle + date", ["prenom","role","date"], "Justin · Groomsman · 05/05/15"),
  29: ("Sans texte (motif seul)", [], "The Bourbon Room"),
  30: ("Sans texte (motif seul)", [], "Route 66"),
  31: ("Prénom + année", ["prenom","date"], "WHISKY DE STEPHAN · depuis 1989"),
  32: ("Sans texte (motif seul)", [], "étiquette whisky"),
  33: ("Sans texte (motif seul)", [], "Original Whiskey"),
}
def groupe(n): return "mono" if n <= 17 else ("mariage" if n <= 28 else "whisky")
motifs = {n: datauri(f"/produits/carafe-motif-{n:02d}.png", 340, 80) for n in range(1, 34)}
vierge = datauri("/produits/carafe_vierge.jpg", 900, 78)
alphabet = datauri("/produits/alphabet-fleuri.jpg", 760, 78)

FIELDS = {
  "ini1": {"label": "Votre initiale", "ph": "Ex. K", "max": 1, "req": True},
  "ini2": {"label": "Vos 2 initiales", "ph": "Ex. JR", "max": 2, "req": True},
  "ini3": {"label": "Vos 3 initiales", "ph": "Ex. ABC", "max": 3, "req": True},
  "prenom": {"label": "Prénom ou nom", "ph": "Ex. Stephan", "max": 40, "req": True},
  "role": {"label": "Rôle", "ph": "Ex. Papa · Témoin · Best Man", "max": 20, "req": True},
  "date": {"label": "Date ou année", "ph": "Ex. 1989 · 09.09.25", "max": 20, "req": False, "extra": 3},
}
POLICES = [
  ("playfair", "Playfair — Serif élégante", "fnt-playfair"),
  ("cinzel", "Cinzel — Capitales romaines", "fnt-cinzel"),
  ("cinzel-deco", "Cinzel Decorative — Décoratif luxe", "fnt-cinzel-deco"),
  ("montserrat", "Montserrat — Moderne géométrique", "fnt-montserrat"),
  ("inter", "Inter — Sobre & lisible", "fnt-inter"),
  ("great-vibes", "Great Vibes — Calligraphie mariage", "fnt-great-vibes"),
  ("allura", "Allura — Script élégant", "fnt-allura"),
  ("pacifico", "Pacifico — Script rétro", "fnt-pacifico"),
]

grid = []
for n in range(1, 34):
    lab, fl, ex = MODELES[n]
    grid.append(
      f'<button type="button" class="gp-model" data-n="{n}" data-g="{groupe(n)}" aria-label="Modèle n° {n} — {lab}">'
      f'<span class="gp-mn">n° {n}</span><span class="gp-mimg"><img src="{motifs[n]}" alt=""></span>'
      f'<span class="gp-ml">{lab}</span></button>')
GRID = "".join(grid)
LETTRES = "".join(f'<button type="button" class="gp-let" data-l="{c}">{c}</button>' for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
POL_OPTS = "".join(f'<option value="{k}">{lab}</option>' for k, lab, _ in POLICES)
POL_CHIPS = "".join(f'<button type="button" class="gp-pol {cls}" data-p="{k}">{lab.split(" — ")[0]}</button>' for k, lab, cls in POLICES)

NEW = f'''<div class="gp" id="gp">
<div class="gp-tag">NOUVEAU — parcours guidé (remplace l'ancien bloc « Personnalisation — gravure »)</div>
<div class="gp-head"><p class="gp-title">Personnalisez votre carafe</p><p class="gp-sub">4 petites étapes : dites-nous quoi graver, nous faisons le reste.</p></div>

<section class="gp-step" id="gp-s1">
  <div class="gp-sh"><span class="gp-num" data-step="1">1</span><h3>Que voulez-vous graver ?</h3></div>
  <div class="gp-cards">
    <button type="button" class="gp-card" data-mode="modele">
      <span class="gp-cimg"><img src="{motifs[5]}" alt=""></span>
      <span class="gp-ctxt"><b>Un modèle décoré</b><small>33 modèles numérotés : monogramme, blason, mariage, whisky… Vous indiquez juste le prénom ou l'initiale.</small></span>
    </button>
    <button type="button" class="gp-card" data-mode="lettre">
      <span class="gp-cimg gp-cimg-alpha"><img src="{alphabet}" alt=""></span>
      <span class="gp-ctxt"><b>Une lettre fleurie</b><small>Votre initiale dans un style fleuri, avec un prénom au milieu si vous le souhaitez.</small></span>
    </button>
    <button type="button" class="gp-card" data-mode="texte">
      <span class="gp-cimg gp-cimg-aa"><span class="fnt-great-vibes">Aa</span></span>
      <span class="gp-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un petit message — dans l'écriture de votre choix.</small></span>
    </button>
  </div>
  <p class="gp-hint">Un seul choix par carafe. Vous pouvez changer d'avis à tout moment.</p>
</section>

<section class="gp-step" id="gp-s2" hidden>
  <div class="gp-sh"><span class="gp-num" data-step="2">2</span><h3 id="gp-s2-title">Choisissez votre modèle</h3></div>

  <div class="gp-mode" data-mode="modele" hidden>
    <div class="gp-chips">
      <button type="button" class="gp-chip on" data-g="all">Tous (1–33)</button>
      <button type="button" class="gp-chip" data-g="mono">Monogrammes &amp; noms (1–17)</button>
      <button type="button" class="gp-chip" data-g="mariage">Mariage &amp; rôles (18–28)</button>
      <button type="button" class="gp-chip" data-g="whisky">Whisky &amp; déco (29–33)</button>
    </div>
    <p class="gp-legend">Sous chaque modèle : ce que vous nous indiquez. Le prénom de l'exemple sera remplacé par le vôtre, dans la même écriture.</p>
    <div class="gp-split">
      <div><div class="gp-grid" id="gp-grid">{GRID}</div><button type="button" class="gp-change" id="gp-change">← Changer de modèle (voir les 33)</button></div>
      <div class="gp-prev" id="gp-prev">
        <div class="gp-prevbox">
          <img class="gp-previmg" src="{vierge}" alt="">
          <div class="gp-mz" id="gp-mz"><img id="gp-motif" src="" alt=""></div>
          <div class="gp-tz" id="gp-tz" hidden><span id="gp-tz-let" class="gp-tz-let" hidden></span><span id="gp-tz-txt" class="gp-tz-txt"></span><span id="gp-tz-date" class="gp-tz-date"></span></div>
        </div>
        <div class="gp-prevtxt"><b id="gp-prevtitle">Cliquez un modèle</b><span id="gp-prevsub">Il apparaît ici, gravé sur la carafe.</span></div>
      </div>
    </div>
    <div class="gp-fields" id="gp-mfields" hidden></div>
  </div>

  <div class="gp-mode" data-mode="lettre" hidden>
    <p class="gp-legend">Cliquez la lettre voulue : elle sera gravée dans ce style fleuri. Le prénom (facultatif) se grave dans la bande, au milieu de la lettre.</p>
    <div class="gp-split">
      <div>
        <img class="gp-alpha" src="{alphabet}" alt="Alphabet fleuri A à Z">
        <div class="gp-letters">{LETTRES}</div>
        <div class="gp-fields">
          <div class="field"><label>Prénom dans la bande <span class="gp-opt">(facultatif)</span></label><input type="text" id="gp-lnom" maxlength="20" placeholder="Ex. Stephan"></div>
          <div class="field"><label>Écriture du prénom</label><div class="gp-pols" data-for="lettre">{POL_CHIPS}</div></div>
        </div>
      </div>
      <div class="gp-prev gp-prev-b">
        <div class="gp-prevbox">
          <img class="gp-previmg" src="{vierge}" alt="">
          <div class="gp-tz on" id="gp-ltz"><span class="gp-tz-let fnt-playfair" id="gp-ltz-let">?</span><span class="gp-tz-txt" id="gp-ltz-txt"></span></div>
        </div>
        <div class="gp-prevtxt"><b id="gp-lprevtitle">Choisissez une lettre</b><span>Aperçu indicatif — la lettre est gravée dans le style fleuri de la planche.</span></div>
      </div>
    </div>
  </div>

  <div class="gp-mode" data-mode="texte" hidden>
    <div class="gp-split">
      <div class="gp-fields">
        <div class="field"><label>Votre texte à graver <span class="gp-req">obligatoire</span></label><input type="text" id="gp-txt" maxlength="40" placeholder="Ex. Stephan · Pour Papa · Merci"><span class="gp-count"><span id="gp-txtn">0</span>/40</span></div>
        <div class="field"><label>Date ou année <span class="gp-opt">(facultatif, +3 €)</span></label><input type="text" id="gp-tdate" maxlength="20" placeholder="Ex. 1989 · 09.09.25"></div>
        <div class="field"><label>Écriture</label><div class="gp-pols" data-for="texte">{POL_CHIPS}</div></div>
      </div>
      <div class="gp-prev gp-prev-b">
        <div class="gp-prevbox">
          <img class="gp-previmg" src="{vierge}" alt="">
          <div class="gp-tz on" id="gp-ttz"><span class="gp-tz-txt fnt-playfair" id="gp-ttz-txt">Votre texte</span><span class="gp-tz-date fnt-playfair" id="gp-ttz-date"></span></div>
        </div>
        <div class="gp-prevtxt"><b>Votre texte, sur la carafe</b><span>Il se met à jour pendant que vous écrivez.</span></div>
      </div>
    </div>
  </div>
</section>

<section class="gp-step" id="gp-s3">
  <div class="gp-sh"><span class="gp-num" data-step="3">3</span><h3>Carafe seule ou coffret ?</h3></div>
  <div class="gp-cofs">
    <button type="button" class="gp-cof on" data-c="" data-p="0"><b>Carafe seule</b><span class="gp-cp">inclus</span><small>La carafe gravée, dans son emballage protégé.</small></button>
    <button type="button" class="gp-cof" data-c="2verres" data-p="35.8"><b>+ 2 verres assortis</b><span class="gp-cp">+35,80 €</span><small>Gravés au même style que la carafe · 17,90 € le verre au lieu de 19,90 €.</small></button>
    <button type="button" class="gp-cof" data-c="4verres" data-p="71.6"><b>+ 4 verres assortis</b><span class="gp-cp">+71,60 €</span><small>Le coffret complet · 17,90 € le verre au lieu de 19,90 €.</small></button>
  </div>
  <p class="gp-hint">Livraison offerte dès 60 € — c'est le cas avec un coffret.</p>
</section>

<section class="gp-step" id="gp-s4">
  <div class="gp-sh"><span class="gp-num" data-step="4">4</span><h3>Résumé de votre gravure</h3></div>
  <div class="gp-sum" id="gp-sum">
    <div class="gp-sumrow"><span>Gravure</span><b id="gp-sum-grav" class="gp-miss">à choisir (étape 1)</b></div>
    <div class="gp-sumrow" id="gp-sum-detail-row" hidden><span>Détail</span><b id="gp-sum-detail"></b></div>
    <div class="gp-sumrow"><span>Coffret</span><b id="gp-sum-cof">Carafe seule</b></div>
    <div class="gp-sumrow gp-sumtot"><span>Total</span><b id="gp-sum-tot">54,90 €</b></div>
  </div>
  <p class="gp-photo">Vous préférez graver <b>votre photo ou votre logo</b> ? <a href="/contact">Écrivez-nous</a>, on vous prépare ça.</p>
</section>
</div>'''

html = html[:i0] + NEW + html[j0:]

# bouton panier : grisé tant que rien n'est choisi + phrase d'aide
OLDBTN = '<button class="btn btn-gold" style="flex:1">Ajouter au panier</button></div>'
assert OLDBTN in html
html = html.replace(OLDBTN,
  '<button class="btn btn-gold gp-off" id="gp-add" style="flex:1" disabled>Ajouter au panier</button></div>'
  '<p class="gp-addhint" id="gp-addhint">Choisissez d\'abord votre gravure (étape 1) — la carafe ne peut pas être commandée sans gravure.</p>', 1)

# ---------- 6. styles + bandeau maquette + script ----------
STYLE = '''
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@400..900&family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@400;600;700&family=Great+Vibes&family=Allura&family=Pacifico&display=swap" rel="stylesheet">
<style>
html{--font-display:"Playfair Display","__Playfair_Display_8ebac9",serif;--font-body:"Inter","__Inter_8b3a0b",sans-serif;--font-cinzel:"Cinzel","__Cinzel_ade41c",serif;--font-cinzel-deco:"Cinzel Decorative","__Cinzel_Decorative_2b992d",serif;--font-montserrat:"Montserrat","__Montserrat_c2ae68",sans-serif;--font-great-vibes:"Great Vibes","__Great_Vibes_a10525",cursive;--font-allura:"Allura","__Allura_906e28",cursive;--font-pacifico:"Pacifico","__Pacifico_a5c4ba",cursive}
.logo-txt{font-family:var(--font-display),serif;font-size:1.6rem;letter-spacing:.04em;color:var(--ink)}.logo-txt em{font-style:italic;color:var(--gold-dark)}
.mq-bar{position:relative;z-index:60;background:#1d1811;color:#f3e8d3;font:600 .8rem/1.4 var(--font-body),system-ui;padding:8px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mq-bar b{background:#d6b25a;color:#1d1811;border-radius:6px;padding:2px 8px;font-size:.72rem;letter-spacing:.06em}
.mq-bar span{opacity:.9;font-weight:500}
/* ---------- parcours guidé ---------- */
.gp [hidden],.gp-addhint[hidden]{display:none!important}
.gp-grid.picked .gp-model:not(.on){display:none}
.gp-change{display:none;margin:8px 0 0;font:600 .78rem/1 var(--font-body),sans-serif;color:var(--gold-dark);background:none;border:1px solid var(--gold);border-radius:999px;padding:8px 12px;cursor:pointer}
.gp-grid.picked+.gp-change{display:inline-block}
.gp{position:relative;border:2px dashed #d6b25a;border-radius:16px;padding:18px 14px 10px;margin:4px 0 14px;background:#fffdf9}
.gp-tag{position:absolute;top:-11px;left:12px;background:#d6b25a;color:#1d1811;font-size:.66rem;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:999px;text-transform:uppercase}
.gp-head{margin:4px 0 14px}.gp-title{font-family:var(--font-display),serif;font-size:1.25rem;font-weight:700;margin:0}.gp-sub{font-size:.85rem;color:var(--ink-soft);margin:3px 0 0}
.gp-step{border-top:1px solid var(--line);padding:14px 0 12px}
.gp-sh{display:flex;align-items:center;gap:10px;margin-bottom:10px}.gp-sh h3{font-size:1rem;font-weight:700;margin:0;font-family:var(--font-body),sans-serif}
.gp-num{flex:none;width:28px;height:28px;border-radius:50%;background:var(--cream-2);color:var(--ink);font-weight:800;font-size:.85rem;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--line)}
.gp-num.done{background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;border-color:transparent}
.gp-num.done::after{content:"✓"}.gp-num.done{font-size:0}.gp-num.done::after{font-size:.85rem}
.gp-hint{font-size:.78rem;color:var(--ink-soft);margin:8px 0 0}
.gp-legend{font-size:.8rem;color:var(--ink-soft);margin:0 0 10px;line-height:1.45}
.gp-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.gp-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 10px;border:1.5px solid var(--line);border-radius:14px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);text-align:center;transition:border-color .15s,box-shadow .15s}
.gp-card:hover{border-color:var(--gold)}.gp-card.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.gp-card.on .gp-ctxt b::after{content:" ✓";color:var(--gold-dark)}
.gp-cimg{width:78px;height:78px;border-radius:10px;background:#efe6d6;display:flex;align-items:center;justify-content:center;overflow:hidden}
.gp-cimg img{width:86%;height:86%;object-fit:contain;mix-blend-mode:multiply}.gp-cimg-alpha img{width:100%;height:100%;object-fit:cover;object-position:left top}
.gp-cimg-aa span{font-size:2.6rem;color:var(--ink);line-height:1}
.gp-ctxt{display:flex;flex-direction:column;gap:3px}.gp-ctxt b{font-size:.92rem}.gp-ctxt small{font-size:.74rem;color:var(--ink-soft);line-height:1.35}
.gp-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.gp-chip{font:600 .76rem/1 var(--font-body),sans-serif;padding:7px 10px;border-radius:999px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}
.gp-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.gp-split{display:grid;grid-template-columns:1fr 210px;gap:12px;align-items:start}
.gp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:560px;overflow:auto;padding:3px;scrollbar-width:thin}
.gp-model{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 8px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink)}
.gp-model:hover{border-color:var(--gold)}.gp-model.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.gp-model.hide{display:none}
.gp-mn{position:absolute;top:6px;left:6px;font-size:.7rem;font-weight:800;background:var(--ink);color:#fff;border-radius:999px;padding:2px 7px}
.gp-model.on .gp-mn{background:var(--gold-dark)}
.gp-mimg{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:#efe6d6;border-radius:8px;overflow:hidden}
.gp-mimg img{width:80%;height:80%;object-fit:contain;mix-blend-mode:multiply}
.gp-ml{font-size:.72rem;font-weight:600;color:var(--ink-soft);text-align:center;line-height:1.25}
.gp-model.on .gp-ml{color:var(--gold-dark)}
.gp-prev{position:sticky;top:var(--gp-top,90px);border:1px solid var(--line);border-radius:12px;background:var(--paper);padding:6px;display:flex;flex-direction:column;gap:6px}
.gp-prevbox{position:relative;width:100%;aspect-ratio:1/1;border-radius:8px;overflow:hidden;background:#fff}
.gp-previmg{width:100%;height:100%;display:block;object-fit:cover}
.gp-mz{position:absolute;left:35.91%;top:44.73%;width:19.5%;height:24.5%;transform-origin:center;transform:perspective(900px) rotateX(-9deg) rotateY(-17deg) rotate(2deg);display:none}
.gp-mz.on{display:block}.gp-mz img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;filter:grayscale(1) contrast(1.15) brightness(1.02);opacity:.92}
.gp-tz{position:absolute;left:30%;top:46%;width:38%;height:24%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transform:perspective(900px) rotateY(-14deg) rotate(2deg);color:#2b2620;text-align:center;pointer-events:none;mix-blend-mode:multiply;opacity:.88}
.gp-tz-let{font-size:2.2rem;line-height:1;font-weight:700}
.gp-tz-txt{font-size:.68rem;line-height:1.1;font-weight:600;white-space:nowrap}
.gp-tz-date{font-size:.62rem;line-height:1.1}
.gp-prevtxt{display:flex;flex-direction:column;gap:2px;padding:0 4px 2px}.gp-prevtxt b{font-size:.8rem}.gp-prevtxt span{font-size:.7rem;color:var(--ink-soft);line-height:1.3}
.gp-fields{margin-top:12px;padding:12px 12px 2px;border:1px solid #e7d3a1;border-radius:12px;background:#fffaf0}
.gp-fields .field{margin-bottom:12px;position:relative}
.gp-fields .field label{font-size:.82rem}.gp-req{font-size:.68rem;font-weight:700;color:#fff;background:var(--gold-dark);border-radius:999px;padding:2px 7px;margin-left:6px;vertical-align:middle}
.gp-opt{font-weight:400;color:var(--ink-soft)}
.gp-fields .field input{padding:10px 12px}.gp-count{position:absolute;right:10px;top:34px;font-size:.68rem;color:var(--ink-soft)}
.gp-ftitle{font-size:.82rem;font-weight:700;margin:0 0 8px}.gp-ftitle em{font-style:normal;color:var(--gold-dark)}
.gp-alpha{width:100%;border-radius:10px;border:1px solid var(--line);display:block;margin-bottom:8px;background:#fff}
.gp-letters{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin-bottom:6px}
.gp-let{font:700 .9rem/1 var(--font-display),serif;padding:8px 0;border:1.5px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);cursor:pointer}
.gp-let:hover{border-color:var(--gold)}.gp-let.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0;color:var(--gold-dark)}
.gp-pols{display:flex;flex-wrap:wrap;gap:6px}
.gp-pol{font-size:1rem;line-height:1;padding:8px 10px;border:1.5px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);cursor:pointer}
.gp-pol.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.gp-cofs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.gp-cof{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:12px 12px;border:1.5px solid var(--line);border-radius:14px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink);position:relative}
.gp-cof::before{content:"";width:16px;height:16px;border-radius:50%;border:2px solid #cfc4b2;position:absolute;top:12px;right:12px;background:#fff}
.gp-cof.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.gp-cof.on::before{border-color:var(--gold-dark);background:radial-gradient(circle,var(--gold-dark) 45%,#fff 50%)}
.gp-cof b{font-size:.9rem;padding-right:26px}.gp-cp{font-size:.82rem;font-weight:700;color:var(--gold-dark)}.gp-cof small{font-size:.72rem;color:var(--ink-soft);line-height:1.35}
.gp-sum{border:1px solid #e7d3a1;border-radius:12px;background:linear-gradient(135deg,#fbf4e6,#fffdf9);padding:6px 14px}
.gp-sumrow{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #e7d3a1;font-size:.86rem}.gp-sumrow:last-child{border-bottom:0}
.gp-sumrow span{color:var(--ink-soft);flex:none}.gp-sumrow b{text-align:right}
.gp-sumtot b{font-size:1.1rem;color:var(--gold-dark)}
.gp-miss{color:#b4552f;font-weight:600}
.gp-photo{font-size:.8rem;color:var(--ink-soft);margin:10px 0 0;line-height:1.45}.gp-photo a{color:var(--gold-dark);text-decoration:underline;font-weight:600}
.gp-off{opacity:.45;cursor:not-allowed;box-shadow:none!important;filter:grayscale(.6)}
.gp-addhint{font-size:.78rem;color:#b4552f;background:#fff5ee;border:1px solid #f2cdb6;border-radius:10px;padding:8px 12px;margin:-4px 0 12px}
.gp-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:80;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;transition:opacity .2s;pointer-events:none}
.gp-toast.on{opacity:1}
@media (max-width:720px){
  .gp{padding:16px 10px 8px}
  .gp-cards{grid-template-columns:1fr;gap:8px}
  .gp-card{flex-direction:row;text-align:left;padding:10px}.gp-cimg{flex:none;width:64px;height:64px}
  .gp-split{grid-template-columns:1fr}
  .gp-prev{position:sticky;top:var(--gp-top,64px);z-index:5;flex-direction:row;align-items:center;order:-1;padding:6px;box-shadow:0 6px 18px rgba(43,38,32,.12)}
  .gp-prevbox{width:150px;flex:none}
  .logo-txt{font-size:1.15rem}
  .gp-prev-b{flex-direction:row}
  .gp-grid{max-height:none;overflow:visible;grid-template-columns:repeat(2,1fr)}
  .gp-letters{grid-template-columns:repeat(7,1fr)}
  .gp-cofs{grid-template-columns:1fr}
}
</style>'''
html = html.replace("</head>", STYLE + "</head>", 1)

MQBAR = ('<div class="mq-bar"><b>MAQUETTE</b><span>Rien n\'est en ligne. Fiche carafe : nouveau parcours de personnalisation en 4 étapes. '
         'Faites le test : choisissez un modèle, remplissez, regardez le résumé — le bouton « Ajouter au panier » ne s\'allume que quand la gravure est complète.</span></div>')
html = re.sub(r"(<body[^>]*>)", r"\1" + MQBAR.replace("\\", "\\\\"), html, count=1)

SCRIPT = r'''
<script>
(function(){
  var MODELES = %s;
  var FIELDS = %s;
  var POL = %s;
  var BASE = 54.9, DATE_EXTRA = 3;
  var st = { mode:null, model:null, f:{}, lettre:null, lnom:"", lpol:"playfair", txt:"", tdate:"", tpol:"playfair", cof:"", cofp:0 };
  var $ = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var eur = function(n){ return n.toFixed(2).replace(".", ",") + " €"; };
  var polCls = function(k){ for (var i=0;i<POL.length;i++) if (POL[i][0]===k) return POL[i][2]; return "fnt-playfair"; };
  var polName = function(k){ for (var i=0;i<POL.length;i++) if (POL[i][0]===k) return POL[i][1].split(" — ")[0]; return k; };
  function setFont(el, k){ el.className = el.className.replace(/\bfnt-[a-z-]+/g, "").trim() + " " + polCls(k); }

  /* ---- étape 1 : choix exclusif ---- */
  $$(".gp-card").forEach(function(b){ b.addEventListener("click", function(){
    var m = b.dataset.mode;
    if (st.mode === m) return;
    // choisir une façon de graver VIDE les autres
    st = { mode:m, model:null, f:{}, lettre:null, lnom:"", lpol:"playfair", txt:"", tdate:"", tpol:"playfair", cof:st.cof, cofp:st.cofp };
    $$(".gp-card").forEach(function(x){ x.classList.toggle("on", x===b); });
    $$(".gp-model").forEach(function(x){ x.classList.remove("on"); }); $("#gp-grid").classList.remove("picked");
    $$(".gp-let").forEach(function(x){ x.classList.remove("on"); });
    $("#gp-lnom").value = ""; $("#gp-txt").value = ""; $("#gp-tdate").value = ""; $("#gp-txtn").textContent = "0";
    $$(".gp-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });
    $("#gp-mz").classList.remove("on"); $("#gp-mfields").hidden = true; $("#gp-mfields").innerHTML = "";
    $("#gp-prevtitle").textContent = "Cliquez un modèle"; $("#gp-prevsub").textContent = "Il apparaît ici, gravé sur la carafe.";
    $("#gp-ltz-let").textContent = "?"; $("#gp-ltz-txt").textContent = ""; $("#gp-lprevtitle").textContent = "Choisissez une lettre";
    $("#gp-ttz-txt").textContent = "Votre texte"; $("#gp-ttz-date").textContent = "";
    var s2 = $("#gp-s2"); s2.hidden = false;
    $$(".gp-mode", s2).forEach(function(x){ x.hidden = x.dataset.mode !== m; });
    $("#gp-s2-title").textContent = m==="modele" ? "Choisissez votre modèle" : (m==="lettre" ? "Choisissez votre lettre" : "Écrivez votre texte");
    refresh();
    setTimeout(function(){ s2.scrollIntoView({behavior:"smooth", block:"start"}); }, 60);
  }); });

  /* ---- étape 2a : modèles ---- */
  $$(".gp-chip").forEach(function(c){ c.addEventListener("click", function(){
    $$(".gp-chip").forEach(function(x){ x.classList.toggle("on", x===c); });
    var g = c.dataset.g;
    $$(".gp-model").forEach(function(x){ x.classList.toggle("hide", g!=="all" && x.dataset.g!==g); });
  }); });
  $$(".gp-model").forEach(function(b){ b.addEventListener("click", function(){
    var n = b.dataset.n, M = MODELES[n];
    st.model = n; st.f = {};
    $$(".gp-model").forEach(function(x){ x.classList.toggle("on", x===b); });
    var img = $("#gp-motif"); img.src = $("img", b).src; $("#gp-mz").classList.add("on");
    $("#gp-grid").classList.add("picked");
    $("#gp-prevtitle").textContent = "Modèle n° " + n + " choisi ✓";
    $("#gp-prevsub").textContent = M[1].length ? ("L'exemple montre « " + M[2] + " » : vos indications prendront leur place, dans la même écriture.") : "Ce modèle se grave tel quel, sans texte.";
    // SEULS les champs que ce modèle utilise
    var box = $("#gp-mfields"); box.innerHTML = "";
    if (M[1].length) {
      var h = document.createElement("p"); h.className = "gp-ftitle"; h.innerHTML = "Modèle n° " + n + " — <em>" + M[0] + "</em>. Indiquez :"; box.appendChild(h);
      M[1].forEach(function(k){
        var F = FIELDS[k];
        var d = document.createElement("div"); d.className = "field";
        d.innerHTML = '<label>' + F.label + (F.req ? ' <span class="gp-req">obligatoire</span>' : ' <span class="gp-opt">(facultatif' + (F.extra ? ', +' + F.extra + ' €' : '') + ')</span>') + '</label><input type="text" maxlength="' + F.max + '" placeholder="' + F.ph + '" data-k="' + k + '">';
        box.appendChild(d);
        $("input", d).addEventListener("input", function(e){ st.f[k] = e.target.value.trim(); refresh(); });
      });
      box.hidden = false;
      setTimeout(function(){ $("input", box).focus({preventScroll:false}); }, 50);
    } else { box.hidden = true; }
    refresh();
  }); });

  $("#gp-change").addEventListener("click", function(){ $("#gp-grid").classList.remove("picked"); $("#gp-grid").scrollIntoView({behavior:"smooth", block:"start"}); });

  /* ---- étape 2b : lettre fleurie ---- */
  $$(".gp-let").forEach(function(b){ b.addEventListener("click", function(){
    st.lettre = b.dataset.l;
    $$(".gp-let").forEach(function(x){ x.classList.toggle("on", x===b); });
    $("#gp-ltz-let").textContent = st.lettre; $("#gp-lprevtitle").textContent = "Lettre " + st.lettre + " choisie ✓";
    refresh();
  }); });
  $("#gp-lnom").addEventListener("input", function(e){ st.lnom = e.target.value.trim(); $("#gp-ltz-txt").textContent = st.lnom; refresh(); });

  /* ---- étape 2c : texte seul ---- */
  $("#gp-txt").addEventListener("input", function(e){ st.txt = e.target.value.trim(); $("#gp-txtn").textContent = e.target.value.length; $("#gp-ttz-txt").textContent = st.txt || "Votre texte"; refresh(); });
  $("#gp-tdate").addEventListener("input", function(e){ st.tdate = e.target.value.trim(); $("#gp-ttz-date").textContent = st.tdate; refresh(); });
  $$(".gp-pols").forEach(function(g){ $$(".gp-pol", g).forEach(function(b){ b.addEventListener("click", function(){
    $$(".gp-pol", g).forEach(function(x){ x.classList.toggle("on", x===b); });
    if (g.dataset.for === "texte") { st.tpol = b.dataset.p; setFont($("#gp-ttz-txt"), st.tpol); setFont($("#gp-ttz-date"), st.tpol); }
    else { st.lpol = b.dataset.p; setFont($("#gp-ltz-txt"), st.lpol); }
    refresh();
  }); }); });
  $$(".gp-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });

  /* ---- étape 3 : coffret ---- */
  $$(".gp-cof").forEach(function(b){ b.addEventListener("click", function(){
    st.cof = b.dataset.c; st.cofp = parseFloat(b.dataset.p) || 0;
    $$(".gp-cof").forEach(function(x){ x.classList.toggle("on", x===b); });
    refresh();
  }); });

  /* ---- validation + résumé ---- */
  function etat(){
    // renvoie { ok, grav, detail, extra, manque }
    if (!st.mode) return { ok:false, grav:null, manque:"Choisissez votre gravure (étape 1)." };
    if (st.mode === "modele") {
      if (!st.model) return { ok:false, grav:"Un modèle décoré", manque:"Cliquez le modèle voulu (étape 2)." };
      var M = MODELES[st.model], parts = [], extra = 0, miss = [];
      M[1].forEach(function(k){ var F = FIELDS[k], v = st.f[k] || ""; if (F.req && !v) miss.push(F.label.toLowerCase()); if (v) { parts.push(F.label + " : " + v); if (F.extra) extra += F.extra; } });
      if (miss.length) return { ok:false, grav:"Modèle n° " + st.model + " — " + M[0], detail: parts.join(" · "), manque:"Il manque : " + miss.join(", ") + " (étape 2)." };
      return { ok:true, grav:"Modèle n° " + st.model + " — " + M[0], detail: parts.length ? parts.join(" · ") : "gravé tel quel", extra:extra };
    }
    if (st.mode === "lettre") {
      if (!st.lettre) return { ok:false, grav:"Une lettre fleurie", manque:"Cliquez votre lettre (étape 2)." };
      return { ok:true, grav:"Lettre fleurie « " + st.lettre + " »", detail: st.lnom ? ("Prénom dans la bande : " + st.lnom + " (" + polName(st.lpol) + ")") : "sans prénom", extra:0 };
    }
    if (!st.txt) return { ok:false, grav:"Mon propre texte", manque:"Écrivez votre texte (étape 2)." };
    return { ok:true, grav:"Texte : « " + st.txt + " »", detail: "Écriture " + polName(st.tpol) + (st.tdate ? " · Date : " + st.tdate + " (+3 €)" : ""), extra: st.tdate ? DATE_EXTRA : 0 };
  }
  function refresh(){
    var e = etat();
    var tot = BASE + (e.extra||0) + st.cofp;
    $("#gp-sum-grav").textContent = e.grav ? e.grav + (e.ok ? "" : " — à compléter") : "à choisir (étape 1)";
    $("#gp-sum-grav").classList.toggle("gp-miss", !e.ok);
    $("#gp-sum-detail-row").hidden = !e.detail; $("#gp-sum-detail").textContent = e.detail || "";
    $("#gp-sum-cof").textContent = st.cof==="2verres" ? "+ 2 verres assortis (+35,80 €)" : (st.cof==="4verres" ? "+ 4 verres assortis (+71,60 €)" : "Carafe seule");
    $("#gp-sum-tot").textContent = eur(tot);
    var val = $(".pd-totbox .val"); if (val) val.textContent = eur(tot);
    var btn = $("#gp-add"), hint = $("#gp-addhint");
    btn.disabled = !e.ok; btn.classList.toggle("gp-off", !e.ok);
    hint.hidden = e.ok; hint.textContent = e.manque || "";
    // pastilles d'étapes
    $$(".gp-num").forEach(function(n){
      var s = n.dataset.step, done = false;
      if (s==="1") done = !!st.mode; if (s==="2") done = e.ok; if (s==="3") done = e.ok; if (s==="4") done = e.ok;
      n.classList.toggle("done", done);
    });
  }
  $("#gp-add").addEventListener("click", function(){
    if ($("#gp-add").disabled) return;
    var t = $("#gp-toast") || (function(){ var d=document.createElement("div"); d.id="gp-toast"; d.className="gp-toast"; document.body.appendChild(d); return d; })();
    t.textContent = "Ajouté au panier ✓ (maquette : rien n'est réellement ajouté)"; t.classList.add("on"); setTimeout(function(){ t.classList.remove("on"); }, 2600);
  });
  function topVar(){ var h = document.querySelector('header.header'); var hh = h ? h.getBoundingClientRect().height : 0; document.documentElement.style.setProperty('--gp-top', (Math.round(hh) + 8) + 'px'); }
  topVar(); window.addEventListener('resize', topVar);
  refresh();
})();
</script>'''
SCRIPT = SCRIPT % (
  json.dumps({str(k): v for k, v in MODELES.items()}, ensure_ascii=False),
  json.dumps(FIELDS, ensure_ascii=False),
  json.dumps(POLICES, ensure_ascii=False),
)
html = html.replace("</body>", SCRIPT + "</body>", 1)

# titre + description de la page
html = re.sub(r"<title>.*?</title>", "<title>Maquette — Fiche carafe, parcours guidé</title>", html, count=1, flags=re.S)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf8").write(html)
print("écrit", OUT, len(html)//1024, "Ko")
