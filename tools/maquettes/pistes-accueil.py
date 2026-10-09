#!/usr/bin/env python3
"""Trois PISTES visuelles pour l'accueil (09/10/2026) — après le refus de la version « luxe » par le gérant
(« j'aime pas la maquette que t'as fait… trouver une autre idée »). Une seule page, un sélecteur en haut :
  A · L'Écrin        — écrin de bijouterie : encre et or, cadres dorés à double filet, ruban or qui défile, laser.
  B · Plein cadre    — photo plein écran, textes posés sur l'image, panneaux de verre, grandes cartes arrondies.
  C · Atelier        — chaleureux et clair, comme le site aujourd'hui mais plus généreux : cartes arrondies, sable,
                       et « Trouver un cadeau » en PARCOURS GUIDÉ numéroté (la référence des fiches du site).
Chaque piste montre 4 blocs : héros · « Trouver un cadeau » · bijoux · carafe. Mêmes couleurs, logo intouché.
Usage : python3 tools/maquettes/pistes-accueil.py <cat.json>   → docs/maquettes/pistes-accueil.html (+ .fragment.html)
Rien n'est touché dans le site : ce sont des pistes à choisir."""
import base64, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(ROOT, "docs", "maquettes")
_C = {}
def img(fn, w=800, q=72):
    k = (fn, w)
    if k in _C: return _C[k]
    im = Image.open(os.path.join(ROOT, "public", fn.lstrip("/"))).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    _C[k] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode(); return _C[k]
LOGO = "data:image/jpeg;base64," + base64.b64encode(open(os.path.join(OUT, "assets", "logo-source.jpg"), "rb").read()).decode()

CAT = json.load(open(sys.argv[1], encoding="utf-8")); P = {p["slug"]: p for p in CAT["products"]}
def r90(n): return round(n - 0.9) + 0.9
def fmt(v): return f"{v:.2f}".replace(".", ",") + " €"
def prix(p):
    rem = (lambda v: round(r90(v * 0.9) * 0.9, 2)) if p["category"] == "bijoux" else (lambda v: v)
    return ("dès " if (p["multi"] and p["first"] == p["min"]) else "") + fmt(rem(p["first"])), rem(p["min"]), rem(p["max"])
PHOTO = {"collier-3coeurs": "/produits/collier-3coeurs-3.jpg", "collier-coeur-grave": "/produits/collier-coeur-grave-2.jpg",
         "collier-double-coeur": "/produits/collier-double-coeur-6.jpg", "bracelet-cordon-plaque": "/produits/bracelet-cordon-plaque-4.jpg",
         "bracelet-femme-acier": "/produits/bracelet-femme-acier-grave.jpg", "verre-a-whisky-grave": "/produits/verre_a_whisky_exemple_face.jpg",
         "verre-a-vin-grave": "/produits/verre_vin_exemple_dale.jpg", "carafe-a-whisky-gravee": "/produits/carafe_gravee.jpg",
         "couverts-enfants-personnalises": "/produits/couverts_enfants_ex_prenom.jpg", "verre-a-cocktail-grave": "/produits/verre_a_cocktail_exemple_logo.jpg"}
TC = {}
def tc(f):
    if f not in TC: TC[f] = f"t{len(TC)}"
    return TC[f]
def fichier(s):
    f = PHOTO.get(s) or (P[s]["local"][0] if P[s]["local"] else "")
    return f if f and os.path.exists(os.path.join(ROOT, "public", f.lstrip("/"))) else ""
def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")
COUPLE = {"collier-couple-coeur-lot2", "collier-couple-puzzle", "flute-a-champagne-gravee", "verre-a-vin-grave", "porte-cles-cristal-led-coeur", "cristal-photo-3d-vertical", "cristal-photo-3d-horizontal"}
QX = {"verre-a-cocktail-grave": ["elle", "lui", "couple"], "lampe-led-paris-saint-germain": ["lui", "enfant"], "support-telephone-bois-grave": ["lui", "elle"], "support-telephone-bois-ajoure": ["lui", "elle"],
      "bougeoir-mandala-bois": ["elle", "parents"], "bougeoir-fleur-de-lotus": ["elle", "parents"], "photophore-fee-bois": ["elle", "parents"], "verre-a-vin-grave": ["couple", "elle"], "flute-a-champagne-gravee": ["couple", "elle"],
      "cle-usb-personnalisee": ["lui"], "cle-usb-bois-coffret": ["lui"], "cle-usb-cristal-3d": ["lui"], "porte-cles-cuir-a-graver": ["lui"], "piece-ronde-laiton": ["lui"]}
for s in P:
    if "porte-stylo" in s: QX[s] = ["lui", "enfant"]
def qui(s):
    p, t = P[s], set(QX.get(s, []))
    if "pour-elle" in p["occ"]: t.add("elle")
    if "pour-lui" in p["occ"]: t.add("lui")
    if p["subcategory"] == "couple" or s in COUPLE: t.add("couple")
    if p["subcategory"] == "bebe" or p["category"] in ("naissance",) or "naissance" in p["occ"]: t.add("enfant"); t.add("parents")
    if "famille" in p["occ"]: t.add("parents")
    if not t: t.update({"verres": ["lui"], "cristal": ["parents", "couple"]}.get(p["category"], ["elle"]))
    return " ".join(sorted(t))
def occ(s):
    o = list(P[s]["occ"]) or ["anniversaire", "noel"]
    if not set(o) <= {"mariage", "naissance"}: o.append("anniversaire")
    return " ".join(o)
def carte(s):
    p = P[s]; lab, lo, hi = prix(p); f = fichier(s)
    pic = f'<span class="ph {tc(f)}"></span>' if f else f'<span class="ph none"></span>'
    return (f'<div class="card" data-prix="{lo}" data-prixmax="{hi}" data-qui="{qui(s)}" data-occ="{occ(s)}"><a href="#">{pic}'
            f'<span class="meta"><span class="nm">{esc(p["name"])}</span><span class="pr">{lab}</span></span></a></div>')
POOL = "".join(carte(s) for s in P)
BIJ = ["collier-3coeurs", "collier-coeur-plaques", "collier-coeur-grave", "collier-double-coeur", "bracelet-femme-acier", "bracelet-cordon-plaque"]
carafe = P["carafe-a-whisky-gravee"]
ICON = {"user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>', "bag": '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
        "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>', "check": '<path d="m5 12 5 5L20 7"/>', "pin": '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
        "star": '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.2 6.1L12 17l-5.5 3 1.2-6.1L3.2 9.6l6.1-.8z"/>', "truck": '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
        "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', "gift": '<path d="M4 11h16v9H4zM2 7h20v4H2zM12 7v13"/>',
        "heart": '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.7 1.1 4.8 2.9 1.1-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>',
        "ring": '<circle cx="12" cy="14" r="6"/><path d="m9 5 3-3 3 3-3 3z"/>', "baby": '<circle cx="12" cy="9" r="5"/><path d="M5 21c0-3.9 3.1-6 7-6s7 2.1 7 6"/>', "family": '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M13 20c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5"/>',
        "man": '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>', "woman": '<circle cx="12" cy="7" r="4"/><path d="M8 21l1-7h6l1 7zM9 14a3 3 0 0 1 6 0"/>', "cake": '<path d="M4 20h16v-6H4zM6 14v-3h12v3M12 7v4M9 8v3M15 8v3"/>', "tree": '<path d="m12 3 5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/>', "rings": '<circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/>'}
def ic(n, cls="ic"): return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
def hdr(cls=""):
    return (f'<header class="hd {cls}"><div class="hd-top"><a href="#" class="logo"><img class="logo-img" src="{LOGO}" alt="Niv Création"></a>'
            f'<div class="hd-acts"><a href="#" aria-label="Mon espace">{ic("user")}</a><a href="#" aria-label="Panier">{ic("bag")}<b>2</b></a><button class="bg" type="button" aria-label="Menu"><span></span><span></span></button></div></div>'
            f'<nav class="hd-nav"><a href="#">Bijoux</a><a href="#">Cristal photo 3D</a><a href="#">Verres &amp; Carafes</a><a href="#">Bébé &amp; Enfant</a><a href="#">Mariage</a><a href="#">Maison &amp; Déco</a><a href="#">Petits cadeaux</a><a class="or" href="#">Offrir</a></nav></header>')
QUI = [("elle", "Pour elle", "woman", "/produits/collier-coeur-grave-2.jpg"), ("lui", "Pour lui", "man", "/produits/verre_a_whisky_exemple_face.jpg"), ("couple", "Pour un couple", "rings", "/produits/cristal-v-couple.jpg"),
       ("enfant", "Pour bébé & enfant", "baby", "/produits/couverts_enfants_ex_enfant.jpg"), ("parents", "Pour des parents", "family", "/produits/cristal-h-famille.jpg")]
OCC = [("noel", "Noël", "tree"), ("naissance", "Naissance", "baby"), ("mariage", "Mariage", "rings"), ("anniversaire", "Anniversaire", "cake"), ("amour", "Amour", "heart")]
BUD = [("0-20", "Moins de 20 €"), ("20-40", "20 à 40 €"), ("40-999", "Plus de 40 €")]
def chips(k, items, cls="chip"):
    return "".join(f'<button class="{cls}" type="button" data-k="{k}" data-v="{v}" aria-pressed="false">{(ic(i) if len(t) > 2 and t[2] else "")}<span>{t[1]}</span></button>' for t in items for v, i in [(t[0], t[2] if len(t) > 2 else None)])
def finder_core(res_cls=""):
    return f'<p class="fd-count">Choisissez un ou plusieurs critères.</p><div class="fd-res {res_cls}"></div>'

# ---------------------------------------------------------------- PISTE A · L'Écrin
A = f'''<section class="piste pA" id="pA" hidden>
{hdr("hd-dark")}
<section class="A-hero">
  <div class="A-hero-copy"><h1>Votre photo, <em>sculptée</em> dans le cristal.</h1>
    <p>Gravure photo 3D au cœur d’un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière, et l’émotion.</p>
    <div class="A-ctas"><a class="A-btn" href="#">Créer mon cristal {ic("arrow")}</a><a class="A-btn A-ghost" href="#">Voir les tailles et prix</a></div></div>
  <div class="A-frame"><div class="A-frame-in"><img src="{img("/produits/cristal-v-femme.jpg", 900, 76)}" alt=""><span class="A-laser"></span></div><span class="A-tag">Cristal photo 3D <b>{prix(P["cristal-photo-3d-vertical"])[0]}</b></span></div>
</section>
<div class="A-ruban" aria-hidden="true"><div class="A-ruban-t"><span>Gravé en France</span><i>✦</i><span>4,8/5 sur 286 avis</span><i>✦</i><span>Livraison offerte dès 45 € sur les bijoux</span><i>✦</i><span>Paiement sécurisé</span><i>✦</i><span>Gravé en France</span><i>✦</i><span>4,8/5 sur 286 avis</span><i>✦</i><span>Livraison offerte dès 45 € sur les bijoux</span><i>✦</i><span>Paiement sécurisé</span><i>✦</i></div></div>
<section class="A-finder fd" data-fd>
  <h2>Pour qui cherchez-vous <em>un cadeau</em> ?</h2>
  <div class="A-tiles">{"".join(f'<button class="A-tile" type="button" data-k="qui" data-v="{v}" aria-pressed="false"><img src="{img(ph, 420)}" alt=""><span>{l}</span></button>' for v, l, _, ph in QUI)}</div>
  <div class="A-row"><span>L’occasion</span>{chips("occ", OCC)}</div>
  <div class="A-row"><span>Le budget</span>{chips("budget", BUD)}</div>
  {finder_core()}
</section>
<section class="A-bij">
  <div class="A-bij-head"><h2>Des bijoux gravés <em>avec le prénom</em> de votre choix</h2><p>Colliers et bracelets en acier, gravés à la commande dans notre atelier.</p></div>
  <div class="A-grid">{"".join(carte(s) for s in BIJ)}</div>
  <div class="A-center"><a class="A-btn" href="#">Voir tous les bijoux {ic("arrow")}</a><p class="A-note">Livraison offerte dès 45 € sur les bijoux</p></div>
</section>
<section class="A-carafe">
  <div class="A-frame A-frame-sq"><div class="A-frame-in"><img src="{img("/produits/carafe_gravee.jpg", 900)}" alt=""></div></div>
  <div class="A-carafe-copy"><span class="A-pill"><i></i>Édition limitée</span><h2>La carafe à whisky <em>gravée</em>, un cadeau d’exception</h2>
    <p>Verre taillé, bouchon à facettes, gravée avec votre prénom ou le modèle de votre choix. Livraison offerte dès 60 € d’achat.</p>
    <p class="A-price">{prix(carafe)[0]}</p><a class="A-btn" href="#">Découvrir la carafe {ic("arrow")}</a></div>
</section>
</section>'''

# ---------------------------------------------------------------- PISTE B · Plein cadre
B = f'''<section class="piste pB" id="pB" hidden>
{hdr()}
<section class="B-hero"><img class="B-bg" src="{img("/produits/cristal-v-couple.jpg", 1400, 74)}" alt="">
  <div class="B-hero-copy"><h1>Votre photo, sculptée dans le cristal.</h1><p>Gravure 3D au cœur d’un cristal, réalisée dans notre atelier.</p>
    <div class="B-ctas"><a class="B-btn" href="#">Créer mon cristal {ic("arrow")}</a><a class="B-btn B-ghost" href="#">Les tailles et prix</a></div></div>
</section>
<ul class="B-trust"><li>{ic("pin")}Gravé en France</li><li>{ic("star")}4,8/5 sur 286 avis</li><li>{ic("truck")}Livraison offerte dès 45 €</li><li>{ic("lock")}Paiement sécurisé</li></ul>
<section class="B-finder fd" data-fd>
  <div class="B-sentence"><h2>Je cherche un cadeau</h2>
    <div class="B-line"><span>pour</span><div class="B-seg">{chips("qui", [(v, l) for v, l, _, _ in QUI], "seg")}</div></div>
    <div class="B-line"><span>pour</span><div class="B-seg">{chips("occ", [(v, l) for v, l, _ in OCC], "seg")}</div></div>
    <div class="B-line"><span>avec un budget de</span><div class="B-seg">{chips("budget", BUD, "seg")}</div></div>
  </div>
  {finder_core("B-rail")}
</section>
<section class="B-band"><img class="B-bg" src="{img("/produits/bracelet-femme-acier-porte.jpg", 1400, 72)}" alt="">
  <div class="B-glass"><h2>Des bijoux gravés avec le prénom de votre choix</h2><p>Colliers et bracelets en acier, gravés à la commande dans notre atelier.</p>
    <div class="B-mini">{"".join(carte(s) for s in BIJ[:3])}</div><a class="B-btn" href="#">Voir tous les bijoux {ic("arrow")}</a></div>
</section>
<section class="B-carafe"><div class="B-carafe-img"><img src="{img("/produits/carafe_gravee.jpg", 900)}" alt=""><span class="B-pill">Édition limitée</span></div>
  <div class="B-carafe-copy"><h2>La carafe à whisky gravée, un cadeau d’exception</h2><p>Verre taillé, bouchon à facettes, gravée avec votre prénom ou le modèle de votre choix.</p><p class="B-price">{prix(carafe)[0]} <small>livraison offerte</small></p><a class="B-btn B-ink" href="#">Découvrir la carafe {ic("arrow")}</a></div>
</section>
</section>'''

# ---------------------------------------------------------------- PISTE C · Atelier (parcours guidé)
C = f'''<section class="piste pC" id="pC" hidden>
{hdr()}
<section class="C-hero">
  <div class="C-hero-copy"><span class="C-kick">Atelier français de gravure</span><h1>Un prénom, une date, une photo : <em>gravés pour toujours.</em></h1>
    <p>Bijoux, cristal photo 3D, verres et cadeaux gravés à la commande dans notre atelier.</p>
    <div class="C-ctas"><a class="C-btn" href="#">Créer mon cristal {ic("arrow")}</a><a class="C-link" href="#">Voir toute la boutique {ic("arrow")}</a></div></div>
  <div class="C-collage"><img class="C-c1" src="{img("/produits/cristal-v-femme.jpg", 700)}" alt=""><img class="C-c2" src="{img("/produits/collier-3coeurs-3.jpg", 520)}" alt=""><img class="C-c3" src="{img("/produits/verre_vin_exemple_dale.jpg", 520)}" alt=""></div>
</section>
<section class="C-finder fd" data-fd>
  <h2>Trouver le bon cadeau <em>en trois étapes</em></h2>
  <div class="C-step"><div class="C-step-h"><b>1</b><span>Pour qui ?</span></div><div class="C-cards">{"".join(f'<button class="C-card" type="button" data-k="qui" data-v="{v}" aria-pressed="false">{ic(i)}<span>{l}</span><i class="C-chk">{ic("check")}</i></button>' for v, l, i, _ in QUI)}</div></div>
  <div class="C-step"><div class="C-step-h"><b>2</b><span>Pour quelle occasion ?</span></div><div class="C-cards">{"".join(f'<button class="C-card" type="button" data-k="occ" data-v="{v}" aria-pressed="false">{ic(i)}<span>{l}</span><i class="C-chk">{ic("check")}</i></button>' for v, l, i in OCC)}</div></div>
  <div class="C-step"><div class="C-step-h"><b>3</b><span>Quel budget ?</span></div><div class="C-cards C-cards-3">{"".join(f'<button class="C-card" type="button" data-k="budget" data-v="{v}" aria-pressed="false"><span>{l}</span><i class="C-chk">{ic("check")}</i></button>' for v, l in BUD)}</div></div>
  {finder_core()}
</section>
<section class="C-bij">
  <div class="C-head"><div><h2>Des bijoux gravés <em>avec le prénom</em> de votre choix</h2><p>Colliers et bracelets en acier, gravés à la commande.</p></div><a class="C-link" href="#">Voir tous les bijoux {ic("arrow")}</a></div>
  <div class="C-grid">{"".join(carte(s) for s in BIJ)}</div>
</section>
<section class="C-carafe"><div class="C-carafe-in"><img src="{img("/produits/carafe_gravee.jpg", 900)}" alt="">
  <div><span class="C-pill"><i></i>Édition limitée</span><h2>La carafe à whisky <em>gravée</em></h2><p>Verre taillé, bouchon à facettes, gravée avec votre prénom ou le modèle de votre choix. Livraison offerte dès 60 €.</p><p class="C-price">{prix(carafe)[0]}</p><a class="C-btn" href="#">Découvrir la carafe {ic("arrow")}</a></div></div>
</section>
</section>'''

SWITCH = '''<div class="sw"><div class="sw-in"><b>3 pistes pour l’accueil, rien n’est en ligne</b>
  <div class="sw-tabs"><button type="button" data-p="pA">A · L’Écrin</button><button type="button" data-p="pB">B · Plein cadre</button><button type="button" data-p="pC">C · Atelier</button></div>
  <span class="sw-note" id="swNote"></span></div></div>'''
NOTES = {"pA": "Écrin de bijouterie : encre et or, cadres dorés à double filet, ruban or, laser sur la photo.",
         "pB": "Photo plein écran, textes posés sur l’image, panneaux de verre, grandes cartes arrondies.",
         "pC": "Chaleureux et clair, cartes arrondies comme le site, « Trouver un cadeau » en parcours numéroté."}

CSS = r'''
:root{--cream:#fbf7ee;--sand:#f3e8d3;--ink:#1a1206;--ink2:#241a0c;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#7c6120;--muted:#6b5f4b;--line:rgba(26,18,6,.14);--serif:"Playfair Display",Georgia,serif;--sans:"Inter",system-ui,Arial,sans-serif;--ease:cubic-bezier(.16,1,.3,1)}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--ink);font:400 16px/1.55 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
h1,h2{font-family:var(--serif);font-weight:600;line-height:1.08;margin:0;text-wrap:balance}h1 em,h2 em{font-style:italic;font-weight:500}p{margin:0}
[hidden]{display:none!important}.ic{width:20px;height:20px;flex:none}
::selection{background:var(--gold-l);color:var(--ink)}:focus-visible{outline:2px solid var(--gold-d);outline-offset:3px}
.sw{position:sticky;top:0;z-index:90;background:var(--ink);color:#f3e8d3;font-size:.84rem}
.sw-in{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:8px 16px;max-width:1300px;margin:0 auto}
.sw-in>b{color:var(--gold-l);font-weight:600}.sw-tabs{display:flex;gap:6px}
.sw-tabs button{padding:7px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.5);color:var(--gold-l);font-weight:600}
.sw-tabs button.on{background:var(--gold);color:var(--ink);box-shadow:none}.sw-note{opacity:.85}
@media (max-width:640px){.sw-in{padding:7px 12px}.sw-in>b{width:100%;font-size:.78rem}.sw-note{display:none}.sw-tabs button{padding:6px 11px;font-size:.78rem}}
/* en-tête commun : le logo est celui du site (92 / 64 px, arrondi 10 px) */
.hd{background:var(--cream);border-bottom:1px solid var(--line)}
.hd-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:14px 20px 8px;max-width:1300px;margin:0 auto}
.logo{grid-column:2}.logo-img{height:92px;width:auto;border-radius:10px}
.hd-acts{grid-column:3;justify-self:end;display:flex;gap:6px;align-items:center}.hd-acts a,.bg{position:relative;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%}
.hd-acts a .ic{width:22px;height:22px}.hd-acts b{position:absolute;top:5px;right:5px;min-width:17px;height:17px;border-radius:999px;background:var(--gold);color:var(--ink);font-size:.62rem;display:flex;align-items:center;justify-content:center}
.bg{display:none;flex-direction:column;gap:5px}.bg span{width:20px;height:1.6px;background:var(--ink);display:block}
.hd-nav{display:flex;justify-content:center;flex-wrap:wrap;gap:2px 4px;padding:0 20px 10px}.hd-nav a{padding:8px 11px;font-size:.9rem;font-weight:500;border-radius:999px}.hd-nav a:hover{background:var(--sand)}.hd-nav .or{color:var(--gold-t);font-weight:600}
.hd-dark{background:var(--ink2);border-bottom-color:rgba(226,198,126,.25);color:#f3e8d3}.hd-dark .bg span{background:#f3e8d3}.hd-dark .hd-nav a:hover{background:rgba(226,198,126,.15)}.hd-dark .or{color:var(--gold-l)}
@media (max-width:900px){.hd-nav{display:none}.bg{display:inline-flex}}
@media (max-width:640px){.logo-img{height:64px}.hd-top{padding:12px 14px 8px;grid-template-columns:auto 1fr auto}.logo{justify-self:center}}
/* cartes (réserve commune, habillée par chaque piste) */
.card{position:relative;min-width:0}.card a{display:flex;flex-direction:column;gap:9px}
.ph{display:block;aspect-ratio:1;background:var(--sand) center/cover no-repeat;border-radius:14px;overflow:hidden}.ph.none{background:linear-gradient(160deg,var(--sand),#eadbbf)}
.meta{display:flex;flex-direction:column;gap:2px}.nm{font-weight:600;font-size:.92rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pr{font-family:var(--serif);color:var(--gold-t)}
.fd-count{margin:18px 0 12px;color:var(--muted)}.fd-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:18px 12px}
.chip,.seg{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:9px 16px;border-radius:999px;font-weight:600;font-size:.9rem;transition:background .25s,color .25s,box-shadow .25s,opacity .25s}
.chip .ic,.seg .ic{width:18px;height:18px}.off{opacity:.35;pointer-events:none}
/* ============ A · L'Écrin */
.pA{background:var(--ink2);color:#f3e8d3}
.A-hero{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;max-width:1300px;margin:0 auto;padding:56px 24px 48px;position:relative;isolation:isolate;overflow:hidden}
.A-hero::before{content:"";position:absolute;inset:-20% -10% auto;height:120%;background:radial-gradient(60% 60% at 70% 40%,rgba(201,162,75,.22),transparent 70%);z-index:-1;pointer-events:none}
.A-hero h1{font-size:clamp(2.4rem,5vw,4.6rem);color:#fff}.A-hero h1 em{color:var(--gold-l)}
.A-hero p{margin:20px 0 28px;color:#d9ccb0;max-width:46ch;font-size:1.05rem}
.A-ctas,.A-center{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.A-btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:12px 26px;border-radius:999px;background:linear-gradient(180deg,var(--gold-l),var(--gold));color:var(--ink);font-weight:600;box-shadow:0 10px 30px -12px rgba(201,162,75,.7);transition:transform .4s var(--ease),box-shadow .4s}
.A-btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px -12px rgba(201,162,75,.9)}.A-btn .ic{width:18px;height:18px}
.A-ghost{background:none;color:var(--gold-l);box-shadow:inset 0 0 0 1px rgba(226,198,126,.55)}.A-ghost:hover{background:rgba(226,198,126,.1)}
.A-frame{position:relative;justify-self:center;width:min(100%,520px);padding:12px;border:1px solid rgba(226,198,126,.55);border-radius:6px}
.A-frame::before{content:"";position:absolute;inset:5px;border:1px solid rgba(226,198,126,.35);border-radius:3px;pointer-events:none}
.A-frame-in{position:relative;overflow:hidden;border-radius:3px;aspect-ratio:4/5;background:#000}.A-frame-sq .A-frame-in{aspect-ratio:1}
.A-frame-in img{width:100%;height:100%;object-fit:cover;filter:saturate(.9)}
.A-frame-in::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.14) 50%,transparent 60%);transform:translateX(-120%);animation:sheen 5s var(--ease) 1s infinite}
@keyframes sheen{15%{transform:translateX(120%)}100%{transform:translateX(120%)}}
.A-laser{position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#fff,var(--gold-l),transparent);box-shadow:0 0 16px 3px rgba(226,198,126,.6);animation:laser 2.4s var(--ease) .3s both}
@keyframes laser{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(60vh);opacity:0}}
.A-tag{position:absolute;left:24px;bottom:24px;padding:10px 14px;background:rgba(26,18,6,.85);border:1px solid rgba(226,198,126,.5);color:#f3e8d3;font-size:.85rem;border-radius:4px}.A-tag b{color:var(--gold-l);margin-left:6px}
.A-ruban{overflow:hidden;background:linear-gradient(90deg,var(--gold-d),var(--gold-l),var(--gold-d));color:var(--ink);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;padding:9px 0}
.A-ruban-t{display:flex;gap:28px;width:max-content;animation:ruban 40s linear infinite;white-space:nowrap}.A-ruban-t i{font-style:normal}
@keyframes ruban{to{transform:translateX(-50%)}}
.A-finder{max-width:1300px;margin:0 auto;padding:56px 24px}
.A-finder h2{font-size:clamp(1.8rem,3.4vw,2.8rem);color:#fff;text-align:center;margin-bottom:26px}.A-finder h2 em{color:var(--gold-l)}
.A-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:22px}
.A-tile{position:relative;aspect-ratio:4/5;border-radius:6px;overflow:hidden;border:1px solid rgba(226,198,126,.35);transition:border-color .3s,transform .4s var(--ease)}
.A-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}.A-tile:hover img{transform:scale(1.06)}
.A-tile span{position:absolute;left:0;right:0;bottom:0;padding:34px 12px 12px;background:linear-gradient(transparent,rgba(26,18,6,.9));color:#fff;font-family:var(--serif);font-size:1.05rem;text-align:left}
.A-tile.on{border-color:var(--gold-l);box-shadow:0 0 0 2px var(--gold-l),0 14px 30px -14px rgba(201,162,75,.8);transform:translateY(-3px)}
.A-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}.A-row>span{color:var(--gold-l);font-family:var(--serif);font-size:1.05rem;margin-right:8px}
.pA .chip{box-shadow:inset 0 0 0 1px rgba(226,198,126,.5);color:#f3e8d3}.pA .chip:hover{background:rgba(226,198,126,.12)}.pA .chip.on{background:var(--gold-l);color:var(--ink);box-shadow:none}
.A-finder .fd-count{color:#d9ccb0}.A-finder .card .ph{border-radius:4px;border:1px solid rgba(226,198,126,.4)}.A-finder .nm{color:#f3e8d3}.A-finder .pr{color:var(--gold-l)}
.A-bij{background:var(--cream);color:var(--ink);padding:60px 24px}.A-bij-head{max-width:1300px;margin:0 auto 30px;text-align:center}
.A-bij h2{font-size:clamp(1.9rem,3.6vw,3rem)}.A-bij h2 em{color:var(--gold-t)}.A-bij-head p{color:var(--muted);margin-top:10px}
.A-grid{max-width:1300px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.A-grid .card{padding:10px;border:1px solid rgba(169,137,53,.45);position:relative;background:#fff;transition:transform .45s var(--ease),box-shadow .45s}
.A-grid .card::before{content:"";position:absolute;inset:4px;border:1px solid rgba(169,137,53,.25);pointer-events:none}
.A-grid .card:hover{transform:translateY(-4px);box-shadow:0 24px 40px -24px rgba(26,18,6,.4)}.A-grid .ph{border-radius:2px}.A-grid .meta{padding:6px 4px 2px}
.A-center{justify-content:center;flex-direction:column;margin-top:32px}.A-note{color:var(--gold-t);font-size:.9rem}
.A-carafe{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1300px;margin:0 auto;padding:64px 24px}
.A-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid rgba(226,198,126,.55);color:var(--gold-l);font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:18px}
.A-pill i{width:6px;height:6px;border-radius:50%;background:var(--gold-l);animation:blink 2.4s ease-in-out infinite}@keyframes blink{50%{opacity:.25}}
.A-carafe h2{font-size:clamp(2rem,4vw,3.4rem);color:#fff}.A-carafe h2 em{color:var(--gold-l)}.A-carafe p{color:#d9ccb0;margin:18px 0 20px;max-width:50ch}
.A-price{font-family:var(--serif);font-size:2rem;color:var(--gold-l)!important;margin:0 0 22px!important}
@media (max-width:900px){.A-hero,.A-carafe{grid-template-columns:1fr;gap:28px;padding:36px 20px}.A-frame{width:100%;max-width:420px}.A-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}.A-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}}
@media (max-width:640px){.A-hero h1{font-size:2.3rem}.A-tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.A-tiles .A-tile:last-child{grid-column:span 2;aspect-ratio:2/1}.A-row>span{flex-basis:100%;margin:4px 0 0}.A-frame{padding:8px}.A-finder,.A-bij{padding:40px 16px}.A-laser{display:none}}
/* ============ B · Plein cadre */
.pB{background:var(--cream)}
.B-hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;overflow:hidden;isolation:isolate}
.B-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;transform:scale(1.06);animation:settle 3s var(--ease) forwards}
@keyframes settle{to{transform:scale(1)}}
.B-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(26,18,6,.1) 30%,rgba(26,18,6,.75) 100%)}
.B-hero-copy{padding:40px clamp(20px,5vw,72px) 56px;max-width:760px;color:#fff}
.B-hero h1{font-size:clamp(2.4rem,5.2vw,4.8rem);text-shadow:0 2px 24px rgba(0,0,0,.35)}.B-hero p{margin:16px 0 26px;font-size:1.1rem;color:rgba(255,255,255,.9)}
.B-ctas{display:flex;flex-wrap:wrap;gap:12px}
.B-btn{display:inline-flex;align-items:center;gap:10px;min-height:54px;padding:12px 26px;border-radius:999px;background:#fff;color:var(--ink);font-weight:600;transition:transform .4s var(--ease),background .3s}
.B-btn:hover{transform:translateY(-2px);background:var(--gold-l)}.B-btn .ic{width:18px;height:18px}
.B-ghost{background:rgba(255,255,255,.14);color:#fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}.B-ghost:hover{background:rgba(255,255,255,.26)}
.B-ink{background:var(--ink);color:#fff}.B-ink:hover{background:var(--gold);color:var(--ink)}
.B-trust{list-style:none;margin:0;padding:16px clamp(20px,5vw,72px);display:flex;flex-wrap:wrap;justify-content:center;gap:10px 36px;border-bottom:1px solid var(--line);font-weight:500;font-size:.9rem}
.B-trust li{display:inline-flex;align-items:center;gap:8px}.B-trust .ic{color:var(--gold-d)}
.B-finder{padding:56px clamp(20px,5vw,72px);max-width:1300px;margin:0 auto}
.B-sentence{background:#fff;border-radius:28px;padding:clamp(22px,4vw,40px);box-shadow:0 30px 60px -40px rgba(26,18,6,.35)}
.B-sentence h2{font-size:clamp(1.9rem,3.6vw,3rem);margin-bottom:12px}
.B-line{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 0;border-top:1px solid var(--line)}.B-line>span{font-family:var(--serif);font-size:1.25rem;color:var(--muted)}
.B-seg{display:flex;flex-wrap:wrap;gap:8px}.seg{background:var(--sand);border-radius:14px;padding:10px 16px}.seg.on{background:var(--ink);color:#fff}.seg:hover{background:#eadbbf}
.pB .fd-res.B-rail{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 0 10px;scrollbar-width:none}.B-rail::-webkit-scrollbar{display:none}
.B-rail .card{flex:0 0 220px;scroll-snap-align:start}.pB .ph{border-radius:20px}
.B-band{position:relative;min-height:560px;display:flex;align-items:center;padding:48px clamp(20px,5vw,72px);isolation:isolate;overflow:hidden}
.B-band::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(26,18,6,.45),rgba(26,18,6,.05))}
.B-glass{width:min(100%,560px);padding:28px;border-radius:28px;background:rgba(251,247,238,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 30px 60px -30px rgba(26,18,6,.5)}
.B-glass h2{font-size:clamp(1.7rem,3vw,2.5rem)}.B-glass>p{color:var(--muted);margin:10px 0 18px}
.B-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}.B-mini .ph{border-radius:14px}.B-mini .nm{font-size:.82rem}
.B-carafe{display:grid;grid-template-columns:1fr 1fr;background:var(--sand)}
.B-carafe-img{position:relative;min-height:420px}.B-carafe-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.B-pill{position:absolute;left:20px;top:20px;padding:8px 14px;border-radius:999px;background:rgba(26,18,6,.85);color:var(--gold-l);font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600}
.B-carafe-copy{padding:clamp(28px,5vw,72px);display:flex;flex-direction:column;justify-content:center;gap:16px}
.B-carafe h2{font-size:clamp(2rem,3.8vw,3.2rem)}.B-carafe p{color:var(--muted);max-width:48ch}.B-price{font-family:var(--serif);font-size:2rem;color:var(--ink)!important}.B-price small{font:500 .78rem var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--gold-t);margin-left:10px}
.B-carafe .B-btn{align-self:flex-start}
@media (max-width:900px){.B-carafe{grid-template-columns:1fr}.B-band{min-height:0;padding:32px 20px}.B-hero{min-height:78vh}}
@media (max-width:640px){.B-hero h1{font-size:2.3rem}.B-trust{gap:8px 18px;font-size:.82rem}.B-mini{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.B-glass{padding:20px}.B-line>span{flex-basis:100%;font-size:1.05rem}.B-rail .card{flex-basis:62%}}
/* ============ C · Atelier */
.pC{background:var(--cream)}
.C-hero{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);gap:40px;align-items:center;max-width:1300px;margin:0 auto;padding:48px clamp(20px,5vw,60px)}
.C-kick{display:inline-block;padding:6px 12px;border-radius:999px;background:var(--sand);color:var(--gold-t);font-weight:600;font-size:.8rem;margin-bottom:16px}
.C-hero h1{font-size:clamp(2.2rem,4.6vw,4rem)}.C-hero h1 em{color:var(--gold-t)}.C-hero p{margin:18px 0 26px;color:var(--muted);max-width:46ch;font-size:1.05rem}
.C-ctas{display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center}
.C-btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:12px 26px;border-radius:999px;background:var(--gold);color:var(--ink);font-weight:600;box-shadow:0 12px 26px -14px rgba(169,137,53,.8);transition:transform .4s var(--ease),background .3s}
.C-btn:hover{background:var(--gold-l);transform:translateY(-2px)}.C-btn .ic{width:18px;height:18px}
.C-link{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--gold-t);border-bottom:1px solid currentColor;padding-bottom:2px}.C-link .ic{width:16px;height:16px}
.C-collage{position:relative;height:460px}.C-collage img{position:absolute;object-fit:cover;border-radius:24px;box-shadow:0 30px 50px -28px rgba(26,18,6,.5)}
.C-c1{left:0;top:0;width:62%;height:100%}.C-c2{right:0;top:6%;width:44%;aspect-ratio:1;border:6px solid var(--cream)}.C-c3{right:8%;bottom:0;width:40%;aspect-ratio:1;border:6px solid var(--cream)}
.C-finder{background:var(--sand);padding:56px clamp(20px,5vw,60px)}
.C-finder h2{font-size:clamp(1.9rem,3.6vw,3rem);text-align:center;margin-bottom:28px}.C-finder h2 em{color:var(--gold-t)}
.C-step{max-width:1100px;margin:0 auto 22px}.C-step-h{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.C-step-h b{width:34px;height:34px;border-radius:50%;background:var(--ink);color:var(--gold-l);display:inline-flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.05rem}.C-step-h span{font-family:var(--serif);font-size:1.3rem}
.C-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.C-cards-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.C-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 12px;border-radius:18px;background:#fff;box-shadow:0 1px 0 rgba(26,18,6,.06),0 10px 26px -20px rgba(26,18,6,.4);border:2px solid transparent;transition:border-color .25s,transform .3s var(--ease);min-height:44px}
.C-card .ic{width:28px;height:28px;color:var(--gold-d)}.C-card span{font-weight:600;font-size:.92rem;text-align:center}
.C-card:hover{transform:translateY(-2px)}.C-card.on{border-color:var(--gold)}
.C-chk{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;background:var(--gold);color:var(--ink);display:none;align-items:center;justify-content:center}.C-chk .ic{width:14px;height:14px;color:var(--ink)}.C-card.on .C-chk{display:inline-flex}
.pC .fd-res{max-width:1100px;margin:0 auto}.pC .fd-count{max-width:1100px;margin:22px auto 12px;text-align:center}
.C-bij{max-width:1300px;margin:0 auto;padding:60px clamp(20px,5vw,60px)}
.C-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}.C-head h2{font-size:clamp(1.9rem,3.6vw,3rem)}.C-head h2 em{color:var(--gold-t)}.C-head p{color:var(--muted);margin-top:8px}
.C-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.C-grid .ph{border-radius:20px;transition:transform .9s var(--ease)}.C-grid .card:hover .ph{transform:scale(1.03)}
.C-carafe{padding:0 clamp(20px,5vw,60px) 60px;max-width:1300px;margin:0 auto}
.C-carafe-in{display:grid;grid-template-columns:5fr 7fr;gap:0;border-radius:28px;overflow:hidden;background:var(--sand)}
.C-carafe-in img{width:100%;height:100%;object-fit:cover;min-height:380px}.C-carafe-in>div{padding:clamp(24px,4vw,48px);display:flex;flex-direction:column;justify-content:center;gap:14px}
.C-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:var(--ink);color:var(--gold-l);font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600;align-self:flex-start}.C-pill i{width:6px;height:6px;border-radius:50%;background:var(--gold-l);animation:blink 2.4s ease-in-out infinite}
.C-carafe h2{font-size:clamp(1.9rem,3.6vw,3rem)}.C-carafe h2 em{color:var(--gold-t)}.C-carafe p{color:var(--muted)}.C-price{font-family:var(--serif);font-size:2rem;color:var(--ink)!important}.C-carafe .C-btn{align-self:flex-start}
@media (max-width:900px){.C-hero{grid-template-columns:1fr;gap:28px}.C-collage{height:360px}.C-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.C-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.C-carafe-in{grid-template-columns:1fr}.C-head{flex-direction:column;align-items:flex-start}}
@media (max-width:640px){.C-hero{padding:32px 16px}.C-hero h1{font-size:2.2rem}.C-collage{height:300px}.C-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.C-cards .C-card:nth-child(5){grid-column:span 2}.C-cards-3{grid-template-columns:repeat(3,minmax(0,1fr))}.C-card{padding:14px 8px}.C-finder,.C-bij{padding-left:16px;padding-right:16px}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
'''
JS = r'''
(function(){var d=document,pool=[].slice.call(d.getElementById('pool').children);
function has(l,v){return (' '+(l||'')+' ').indexOf(' '+v+' ')>=0}
function match(c,s){var lo=+c.dataset.prix,hi=+c.dataset.prixmax;if(s.qui&&!has(c.dataset.qui,s.qui))return false;if(s.occ&&!has(c.dataset.occ,s.occ))return false;if(s.budget){var r=s.budget.split('-');if(hi<+r[0]||lo>=+r[1])return false}return true}
d.querySelectorAll('[data-fd]').forEach(function(fd){var res=fd.querySelector('.fd-res'),cnt=fd.querySelector('.fd-count');
  function sel(){var s={};fd.querySelectorAll('[data-k].on').forEach(function(b){s[b.dataset.k]=b.dataset.v});return s}
  function run(){var s=sel();res.innerHTML='';if(!Object.keys(s).length){cnt.textContent='Choisissez un ou plusieurs critères.';grey();return}
    var ok=pool.filter(function(c){return match(c,s)});ok.slice(0,8).forEach(function(c){res.appendChild(c.cloneNode(true))});
    cnt.textContent=!ok.length?'Aucune création ne correspond : retirez un critère.':(ok.length>8?'8 idées parmi '+ok.length:ok.length+' idée'+(ok.length>1?'s':'')+' de cadeau');grey()}
  function grey(){var s=sel();fd.querySelectorAll('[data-k]').forEach(function(b){if(b.classList.contains('on')){b.classList.remove('off');return}var s2={};for(var k in s)s2[k]=s[k];s2[b.dataset.k]=b.dataset.v;b.classList.toggle('off',!pool.some(function(c){return match(c,s2)}))})}
  fd.querySelectorAll('[data-k]').forEach(function(b){b.addEventListener('click',function(){var on=b.classList.contains('on');fd.querySelectorAll('[data-k="'+b.dataset.k+'"]').forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});if(!on){b.classList.add('on');b.setAttribute('aria-pressed','true')}run()})});grey()});
var notes=__NOTES__;function show(id){d.querySelectorAll('.piste').forEach(function(p){p.hidden=p.id!==id});d.querySelectorAll('.sw-tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.p===id)});d.getElementById('swNote').textContent=notes[id]||'';try{history.replaceState(null,'','#'+id)}catch(e){}scrollTo(0,0)}
d.querySelectorAll('.sw-tabs button').forEach(function(b){b.addEventListener('click',function(){show(b.dataset.p)})});
show(/^#p[ABC]$/.test(location.hash)?location.hash.slice(1):'pA');
d.addEventListener('click',function(e){var a=e.target.closest('a[href="#"]');if(a)e.preventDefault()});
})();
'''.replace("__NOTES__", json.dumps(NOTES, ensure_ascii=False))

HEAD = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap">')
T_CSS = "\n".join(f".{c}{{background-image:url({img(f, 440, 68)})}}" for f, c in TC.items())
STYLE = f"<style>{CSS}\n{T_CSS}</style>"
BODY = SWITCH + A + B + C + f'<div id="pool" hidden>{POOL}</div>'
TITLE = "Trois pistes pour l’accueil"
full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>{HEAD}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>'
frag = f'<title>{TITLE}</title>{HEAD}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "pistes-accueil.html"), "w").write(full)
open(os.path.join(OUT, "pistes-accueil.fragment.html"), "w").write(frag)
print("ok pistes-accueil", len(full) // 1024, "Ko")
