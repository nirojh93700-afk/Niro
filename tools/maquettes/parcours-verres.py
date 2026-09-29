# -*- coding: utf-8 -*-
"""Maquettes « parcours guidé » pour le VERRE À VIN et la FLÛTE (29/09/2026).
Même mise en page que la carafe EN LIGNE (ParcoursGuide.jsx) : ① Que voulez-vous graver ?
(cartes exclusives) → ② le détail (grille des modèles de LA fiche, 3 par ligne, légende sous
chacun, champs FACULTATIFS) → ③ résumé + bouton bloqué tant qu'aucune gravure n'est choisie.
Aucun aperçu ajouté : l'aperçu reste celui du site (grande photo + « Votre aperçu »).
Part du VRAI rendu (vin-src.html / flute-src.html, servis par `next start`).
"""
import re, base64, io, json, os, urllib.parse
from PIL import Image

S = "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
ROOT = "/home/user/Niro"

# champs (tous FACULTATIFS — règle du gérant, 29/09) : la gravure est validée par le CHOIX
CHAMPS = {
  "prenom": {"label": "Prénoms / nom / texte", "ph": "Ex. Camille · Elli & Ben · « Santé »", "max": 40},
  "date": {"label": "Date", "ph": "Ex. 23.07.2024", "max": 20, "extra": 3},
  "initiale": {"label": "Initiale (monogramme)", "ph": "Ex. C · CL", "max": 3, "extra": 3},
}
DESSIN = ("Dessin (+ prénoms si vous voulez)", ["prenom"])
BANDEROLE = ("Prénoms dans la banderole (+ date)", ["prenom", "date"])
NOMS_DATE = ("Prénoms + date, dans cette écriture", ["prenom", "date"])

VIN = {
  "src": f"{S}/vin-src.html", "out": f"{ROOT}/docs/maquettes/verre-vin-parcours-guide.html",
  "titre": "Personnalisez votre verre", "objet": "verre", "prix": 15.90,
  "groupes": [("couples", "Couples (1–13)", range(1, 14)), ("noms", "Noms & cadres (14–19)", range(14, 20)), ("dessins", "Dessins & occasions (20–30)", range(20, 31))],
  "modeles": {
    **{n: DESSIN for n in range(1, 10)}, 10: BANDEROLE, 11: BANDEROLE, 12: BANDEROLE, 13: BANDEROLE,
    14: ("Dessin seul (ou + prénom)", ["prenom"]), 15: DESSIN, 16: DESSIN, 17: ("Prénoms dans le cœur (+ date)", ["prenom", "date"]),
    18: DESSIN, 19: DESSIN, 20: DESSIN, 21: DESSIN, 22: DESSIN, 23: DESSIN, 24: DESSIN,
    25: ("Votre texte dans cette écriture", ["prenom"]), 26: NOMS_DATE, 27: NOMS_DATE, 28: NOMS_DATE, 29: ("Dessin seul (ou + prénom)", ["prenom"]),
    30: ("Prénoms + nom + date", ["prenom", "date"]),
  },
  "gravures": None,
}
FLUTE = {
  "src": f"{S}/flute-src.html", "out": f"{ROOT}/docs/maquettes/flute-parcours-guide.html",
  "titre": "Personnalisez votre flûte", "objet": "flûte", "prix": 17.90,
  "groupes": [("couples", "Couples (1–13)", range(1, 14)), ("noms", "Noms & banderoles (14–19)", range(14, 20)), ("dessins", "Dessins & occasions (20–35)", range(20, 36)), ("photos", "Gravures en photo (36–40)", range(36, 41))],
  "modeles": {
    **{n: DESSIN for n in range(1, 10)}, 10: BANDEROLE, 11: BANDEROLE, 12: BANDEROLE, 13: BANDEROLE,
    14: NOMS_DATE, 15: NOMS_DATE, 16: NOMS_DATE, 17: ("Prénoms dans les cœurs", ["prenom"]), 18: ("Prénoms dans la banderole (+ date)", ["prenom", "date"]), 19: ("Prénoms dans la banderole (+ date)", ["prenom", "date"]),
    20: ("Dessin seul (ou + prénom)", ["prenom"]), 21: DESSIN, 22: DESSIN, 23: ("Prénoms dans le cœur (+ date)", ["prenom", "date"]), 24: DESSIN, 25: DESSIN, 26: DESSIN, 27: DESSIN, 28: DESSIN, 29: DESSIN, 30: DESSIN,
    31: NOMS_DATE, 32: NOMS_DATE, 33: NOMS_DATE, 34: ("Dessin seul (ou + prénom)", ["prenom"]), 35: ("Prénoms + nom + date", ["prenom", "date"]),
    # gravures réelles en photo = des modèles comme les autres (les prénoms des photos sont des EXEMPLES)
    36: ("Prénoms + date ou initiale, dans ce style", ["prenom", "date", "initiale"]), 37: ("Prénoms + date ou initiale, dans ce style", ["prenom", "date", "initiale"]),
    38: ("Initiales ou prénoms + date, dans ce style", ["prenom", "date", "initiale"]), 39: ("Prénoms + date, dans ce style", ["prenom", "date"]), 40: ("Dessin seul (ou + prénom)", ["prenom"]),
  },
  # les 5 vraies gravures en photo de la fiche → modèles n° 36 à 40
  "photos": [("prenoms-coeur", "Prénoms & cœur", "/produits/flute-grav-06.webp"), ("couronne", "Couronne feuillage", "/produits/flute-grav-05.webp"),
               ("monogramme", "Monogramme & banderole", "/produits/flute-grav-01.jpg"), ("prenoms-script", "Prénoms script", "/produits/flute-grav-04.webp"), ("plume", "Plume", "/produits/flute-grav-02.webp")],
}

_cache = {}
def datauri(rel, maxpx=640, q=72):
    key = (rel, maxpx, q)
    if key in _cache: return _cache[key]
    p = f"{ROOT}/public{rel}"
    if not os.path.exists(p): print("!! manquante", rel); return rel
    im = Image.open(p); im.thumbnail((maxpx, maxpx)); buf = io.BytesIO()
    if rel.lower().endswith(".png") and im.mode in ("RGBA", "LA", "P"):
        im.convert("RGBA").save(buf, "PNG", optimize=True); mime = "image/png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=q, optimize=True); mime = "image/jpeg"
    u = f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode(); _cache[key] = u; return u

def size_for(rel):
    if "motif" in rel: return (340, 80)
    if "flute-grav" in rel: return (420, 74)
    if "alphabet" in rel: return (760, 78)
    if "vierge" in rel: return (900, 78)
    return (640, 72)

def local_of(src):
    src = src.replace("&amp;", "&")
    if src.startswith("/_next/image?"):
        return urllib.parse.parse_qs(urllib.parse.urlparse(src).query).get("url", [None])[0]
    if src.startswith("/produits/") or src.startswith("/instagram") or src.startswith("/logo"): return src
    return None

def style_images(slug):
    src = open(f"{ROOT}/src/lib/products.js", encoding="utf8").read()
    i = src.index(f'slug: "{slug}"'); j = src.index("styleImages: {", i); k = src.index("},", j)
    return {int(n): p for n, p in re.findall(r'"(\d+)": "([^"]+)"', src[j:k])}

POLICES = [("playfair", "Playfair", "fnt-playfair"), ("cinzel", "Cinzel", "fnt-cinzel"), ("cinzel-deco", "Cinzel Decorative", "fnt-cinzel-deco"), ("montserrat", "Montserrat", "fnt-montserrat"),
           ("inter", "Inter", "fnt-inter"), ("great-vibes", "Great Vibes", "fnt-great-vibes"), ("allura", "Allura", "fnt-allura"), ("pacifico", "Pacifico", "fnt-pacifico")]

def build(P, slug):
    html = open(P["src"], encoding="utf8").read()
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
    html = re.sub(r'<link rel="preload"[^>]*>', "", html)
    html = re.sub(r"<noscript>.*?</noscript>", "", html, flags=re.S)
    def css_inline(m):
        css = open(f"{ROOT}/.next{m.group(1).replace('/_next','')}", encoding="utf8").read()
        css = re.sub(r"@font-face\{[^}]*\}", "", css)  # polices : Google Fonts (ci-dessous)
        return "<style>" + css + "</style>"
    html = re.sub(r'<link rel="stylesheet" href="(/_next/static/css/[^"]+)"[^>]*/?>', css_inline, html)
    html = re.sub(r'\s(?:srcSet|imageSrcSet|sizes|imageSizes)="[^"]*"', "", html)
    def src_sub(m):
        rel = local_of(m.group(1))
        if not rel: return m.group(0)
        mx, q = size_for(rel); return 'src="' + datauri(rel, mx, q) + '"'
    html = re.sub(r'src="([^"]+)"', src_sub, html)
    html = re.sub(r"url\((/[^)\"']+)\)", lambda m: "url(" + datauri(local_of(m.group(1)) or m.group(1), *size_for(m.group(1))) + ")" if local_of(m.group(1)) else m.group(0), html)
    html = re.sub(r'<img class="logo-img" src="https://cdn\.shopify\.com[^"]*"[^>]*/>', '<span class="logo-txt">Niv <em>Création</em></span>', html)
    html = re.sub(r'src="https://cdn\.shopify\.com[^"]*"', 'src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23efe6d6%27/%3E%3C/svg%3E"', html)

    START = '<div style="margin-bottom:6px"><p style="font-size:0.85rem;font-weight:600;margin-bottom:12px">Personnalisation — gravure</p>'
    END = '<div class="pd-totbox">'
    i0 = html.index(START); j0 = html.index(END, i0); old = html[i0:j0]
    assert len(re.findall(r"<div\b", old)) == old.count("</div>"), "segment non équilibré"

    imgs = style_images(slug)
    photos_n = set()
    if P.get("photos"):
        base = max(imgs)
        for k, (v, lab, img) in enumerate(P["photos"]): imgs[base + 1 + k] = img; photos_n.add(base + 1 + k)
    motifs = {n: datauri(p, *size_for(p)) for n, p in imgs.items()}
    alphabet = datauri("/produits/alphabet-fleuri.jpg", 760, 78)
    grp_of = {n: g for g, _, r in P["groupes"] for n in r}
    grid = "".join(
      f'<button type="button" class="prc-model" data-n="{n}" data-g="{grp_of[n]}"><span class="prc-mn">n° {n}</span>'
      f'<span class="prc-mimg{" prc-mimg-photo" if n in photos_n else ""}"><img src="{motifs[n]}" alt=""></span><span class="prc-ml">{P["modeles"][n][0]}</span></button>'
      for n in sorted(imgs))
    chips = '<button type="button" class="prc-chip on" data-g="all">Tous (1–%d)</button>' % len(imgs) + "".join(f'<button type="button" class="prc-chip" data-g="{g}">{lab}</button>' for g, lab, _ in P["groupes"])
    lettres = "".join(f'<button type="button" class="prc-let" data-l="{c}">{c}</button>' for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    pols = "".join(f'<button type="button" class="prc-pol {cls}" data-p="{k}">{lab}</button>' for k, lab, cls in POLICES)
    grav_cards = ""
    if False:
        grav_cards = '<button type="button" class="prc-card" data-mode="gravure"><span class="prc-cimg prc-cimg-photo"><img src="%s" alt=""></span><span class="prc-ctxt"><b>Une gravure réelle</b><small>5 styles déjà gravés, en photo : prénoms & cœur, couronne, monogramme, script, plume.</small></span></button>' % datauri(P["gravures"][0][2], 400, 72)
        grav_grid = "".join(f'<button type="button" class="prc-grav" data-v="{v}"><img src="{datauri(img, 480, 74)}" alt=""><span>{lab}</span></button>' for v, lab, img in P["gravures"])
    obj = P["objet"]
    NEW = f'''<div class="prc" id="prc">
<div class="prc-tag">NOUVEAU — même parcours que la carafe (les modèles, photos et textes de cette fiche sont inchangés)</div>
<div class="prc-head"><p class="prc-title">{P["titre"]}</p><p class="prc-sub">Dites-nous quoi graver, nous faisons le reste.</p></div>
<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="1">1</span><h3>Que voulez-vous graver ?</h3></div>
  <div class="prc-cards">
    <button type="button" class="prc-card" data-mode="modele"><span class="prc-cimg"><img src="{motifs[min(imgs)]}" alt=""></span><span class="prc-ctxt"><b>Un modèle décoré</b><small>{len(imgs)} modèles numérotés : couples, mariés, banderoles, dessins… avec vos prénoms si vous voulez.</small></span></button>
    {grav_cards}
    <button type="button" class="prc-card" data-mode="lettre"><span class="prc-cimg prc-cimg-alpha"><img src="{alphabet}" alt=""></span><span class="prc-ctxt"><b>Une lettre fleurie</b><small>Votre initiale dans un style fleuri, avec un prénom au milieu si vous le souhaitez.</small></span></button>
    <button type="button" class="prc-card" data-mode="texte"><span class="prc-cimg prc-cimg-aa"><span class="fnt-great-vibes">Aa</span></span><span class="prc-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un petit message — dans l'écriture de votre choix. Sans dessin, juste le texte.</small></span></button>
    <button type="button" class="prc-card" data-mode="photo"><span class="prc-cimg prc-cimg-aa"><span class="prc-cimg-ph">📷</span></span><span class="prc-ctxt"><b>Ma photo ou mon logo</b><small>Envoyez votre photo, un dessin ou le logo de votre bar / entreprise : nous le gravons sur le {obj}.</small></span></button>
  </div>
  <p class="prc-hint">Un seul choix par {obj}. Vous pouvez changer d'avis à tout moment.</p>
</section>
<section class="prc-step" id="prc-s2" hidden>
  <div class="prc-sh"><span class="prc-num" data-step="2">2</span><h3 id="prc-s2-title">Choisissez votre modèle</h3></div>
  <div class="prc-mode" data-mode="modele" hidden>
    <div class="prc-chips">{chips}</div>
    <p class="prc-legend">Sous chaque modèle : ce que vous pouvez nous indiquer (rien n'est obligatoire). Les prénoms et dates que vous voyez sont des exemples : vous mettez les vôtres.</p>
    <div class="prc-grid" id="prc-grid">{grid}</div>
    <button type="button" class="prc-change" id="prc-change" hidden>← Changer de modèle (voir les {len(imgs)})</button>
    <p class="prc-choisi" id="prc-choisi" hidden></p>
    <div class="prc-fields" id="prc-mfields" hidden></div>
  </div>
  {'' if True else '<div class="prc-mode" data-mode="gravure" hidden><p class="prc-legend">Ces styles sont de vraies gravures faites dans l&apos;atelier : choisissez celui que vous aimez, nous y mettons vos prénoms.</p><div class="prc-gravs">' + grav_grid + '</div><div class="prc-fields"><div class="field"><label>Prénoms / nom / texte <span class="prc-opt">(facultatif)</span></label><input type="text" id="prc-gnom" maxlength="40" placeholder="Ex. Camille · Elli &amp; Ben"></div><div class="field"><label>Date <span class="prc-opt">(facultatif, +3 €)</span></label><input type="text" id="prc-gdate" maxlength="20" placeholder="Ex. 23.07.2024"></div></div></div>' if P["gravures"] else ''}
  <div class="prc-mode" data-mode="lettre" hidden>
    <p class="prc-legend">Cliquez la lettre voulue : elle sera gravée dans ce style fleuri. Le prénom (facultatif) se grave dans la bande, au milieu de la lettre.</p>
    <img class="prc-alpha" src="{alphabet}" alt="Alphabet fleuri A à Z">
    <div class="prc-letters">{lettres}</div>
    <div class="prc-fields">
      <div class="field"><label>Prénom dans la bande <span class="prc-opt">(facultatif)</span></label><input type="text" id="prc-lnom" maxlength="20" placeholder="Ex. Camille"></div>
      <div class="field"><label>Écriture du prénom</label><div class="prc-pols" data-for="lettre">{pols}</div></div>
    </div>
  </div>
  <div class="prc-mode" data-mode="texte" hidden>
    <div class="prc-fields">
      <div class="field"><label>Votre texte à graver</label><input type="text" id="prc-txt" maxlength="40" placeholder="Ex. Camille · Santé · Merci"><span class="prc-count"><span id="prc-txtn">0</span>/40</span></div>
      <div class="field"><label>Date <span class="prc-opt">(facultatif, +3 €)</span></label><input type="text" id="prc-tdate" maxlength="20" placeholder="Ex. 23.07.2024"></div>
      <div class="field"><label>Écriture</label><div class="prc-pols" data-for="texte">{pols}</div></div>
    </div>
  </div>
  <div class="prc-mode" data-mode="photo" hidden>
    <p class="prc-legend">Une photo, un dessin, un logo : téléversez le fichier (JPG, PNG). Photo seule, ou photo + texte, comme vous voulez. L'atelier vérifie la qualité avant de graver.</p>
    <div class="prc-fields">
      <div class="field"><label>Votre photo ou logo</label><input type="file" id="prc-file" accept="image/*"><p class="prc-fileok" id="prc-fileok" hidden>Photo ajoutée ✓</p></div>
      <div class="field"><label>Texte sous la photo <span class="prc-opt">(facultatif)</span></label><input type="text" id="prc-ptxt" maxlength="40" placeholder="Ex. Camille · 2024"></div>
    </div>
  </div>
</section>
<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="3">3</span><h3>Résumé de votre gravure</h3></div>
  <div class="prc-sum">
    <div class="prc-sumrow"><span>Gravure</span><b id="prc-sum-grav" class="prc-miss">à choisir (étape 1)</b></div>
    <div class="prc-sumrow" id="prc-sum-detail-row" hidden><span>Détail</span><b id="prc-sum-detail"></b></div>
    <div class="prc-sumrow prc-sumtot"><span>Total</span><b id="prc-sum-tot">{('%.2f' % P["prix"]).replace('.', ',')} €</b></div>
  </div>
</section>
</div>'''
    html = html[:i0] + NEW + html[j0:]
    OLDBTN = '<button class="btn btn-gold" style="flex:1">Ajouter au panier</button></div>'
    assert OLDBTN in html
    html = html.replace(OLDBTN, '<button class="btn btn-gold prc-off" id="prc-add" style="flex:1" disabled>Ajouter au panier</button></div><p class="prc-addhint" id="prc-addhint">Choisissez votre gravure (étape 1).</p>', 1)

    css_site = open(f"{ROOT}/src/app/globals.css", encoding="utf8").read()
    css_prc = css_site[css_site.index("   PARCOURS GUIDÉ de personnalisation"):]
    STYLE = '''
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;500;600;700;800&family=Cinzel:wght@400..900&family=Cinzel+Decorative:wght@400;700&family=Montserrat:wght@400;600;700&family=Great+Vibes&family=Allura&family=Pacifico&display=swap" rel="stylesheet">
<style>
html{--font-display:"Playfair Display",serif;--font-body:"Inter",sans-serif;--font-cinzel:"Cinzel",serif;--font-cinzel-deco:"Cinzel Decorative",serif;--font-montserrat:"Montserrat",sans-serif;--font-great-vibes:"Great Vibes",cursive;--font-allura:"Allura",cursive;--font-pacifico:"Pacifico",cursive}
.logo-txt{font-family:var(--font-display),serif;font-size:1.6rem;letter-spacing:.04em;color:var(--ink)}.logo-txt em{font-style:italic;color:var(--gold-dark)}
.mq-bar{position:relative;z-index:60;background:#1d1811;color:#f3e8d3;font:600 .8rem/1.4 var(--font-body),system-ui;padding:8px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mq-bar b{background:#d6b25a;color:#1d1811;border-radius:6px;padding:2px 8px;font-size:.72rem;letter-spacing:.06em}.mq-bar span{opacity:.9;font-weight:500}
/* ---- bloc PARCOURS GUIDÉ = le VRAI CSS du site (globals.css) ---- */
''' + css_prc + '''
.prc{border:2px dashed #d6b25a}
.prc-tag{position:absolute;top:-11px;left:12px;background:#d6b25a;color:#1d1811;font-size:.66rem;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:999px;text-transform:uppercase}
.prc-cimg-photo img{width:100%;height:100%;object-fit:cover}
.prc-mimg-photo img{width:100%;height:100%;object-fit:cover;mix-blend-mode:normal}
.prc-gravs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
.prc-grav{display:flex;flex-direction:column;gap:6px;padding:6px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);cursor:pointer;font:inherit;color:var(--ink)}
.prc-grav img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px}.prc-grav span{font-size:.74rem;font-weight:600;text-align:center}
.prc-grav.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.prc-fileok{font-size:.8rem;color:#2e7d32;font-weight:600;margin:6px 0 0}
.prc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:80;opacity:0;transition:opacity .2s;pointer-events:none}.prc-toast.on{opacity:1}
@media (max-width:720px){.prc-gravs{grid-template-columns:repeat(2,1fr)}}
</style>'''
    html = html.replace("</head>", STYLE + "</head>", 1)
    MQ = ('<div class="mq-bar"><b>MAQUETTE</b><span>Rien n\'est en ligne. Même parcours que la carafe, avec les modèles et photos de CETTE fiche. '
          'Le choix « À l\'unité / Lot de 2 / Lot de 4 » à droite et, pour un lot, « Les 2 identiques / Chacun différent » restent comme aujourd\'hui. '
          'Aucun champ obligatoire : le bouton s\'allume dès qu\'une gravure est choisie.</span></div>')
    html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + MQ, html, count=1)
    modeles_js = {str(n): {"l": P["modeles"][n][0], "c": P["modeles"][n][1]} for n in imgs}
    SCRIPT = r'''<script>
(function(){
  var M = %s, CH = %s, POL = %s, BASE = %s, GRAV = %s;
  var st = { mode:null, model:null, f:{}, grav:null, gnom:"", gdate:"", lettre:null, lnom:"", lpol:"playfair", txt:"", tdate:"", tpol:"playfair", photo:false, ptxt:"" };
  var $ = function(s, r){ return (r||document).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var eur = function(n){ return n.toFixed(2).replace(".", ",") + " €"; };
  var polName = function(k){ for (var i=0;i<POL.length;i++) if (POL[i][0]===k) return POL[i][1]; return k; };
  function reset(m){
    st = { mode:m, model:null, f:{}, grav:null, gnom:"", gdate:"", lettre:null, lnom:"", lpol:"playfair", txt:"", tdate:"", tpol:"playfair", photo:false, ptxt:"" };
    $$(".prc-model,.prc-let,.prc-grav").forEach(function(x){ x.classList.remove("on"); });
    $$("input[type=text]", $("#prc-s2")).forEach(function(i){ i.value = ""; }); $("#prc-txtn").textContent = "0";
    $$(".prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });
    $("#prc-grid").classList.remove("picked"); $("#prc-change").hidden = true; $("#prc-choisi").hidden = true; $("#prc-mfields").hidden = true; $("#prc-mfields").innerHTML = "";
    $("#prc-fileok").hidden = true;
  }
  $$(".prc-card").forEach(function(b){ b.addEventListener("click", function(){
    var m = b.dataset.mode; if (st.mode === m) return; reset(m);
    $$(".prc-card").forEach(function(x){ x.classList.toggle("on", x===b); });
    var s2 = $("#prc-s2"); s2.hidden = false; $$(".prc-mode", s2).forEach(function(x){ x.hidden = x.dataset.mode !== m; });
    $("#prc-s2-title").textContent = {modele:"Choisissez votre modèle", gravure:"Choisissez votre style de gravure", lettre:"Choisissez votre lettre", texte:"Écrivez votre texte", photo:"Ajoutez votre photo ou votre logo"}[m];
    refresh(); setTimeout(function(){ s2.scrollIntoView({behavior:"smooth", block:"start"}); }, 60);
  }); });
  $$(".prc-chip").forEach(function(c){ c.addEventListener("click", function(){ $$(".prc-chip").forEach(function(x){ x.classList.toggle("on", x===c); }); var g = c.dataset.g; $$(".prc-model").forEach(function(x){ x.classList.toggle("hide", g!=="all" && x.dataset.g!==g); }); }); });
  $$(".prc-model").forEach(function(b){ b.addEventListener("click", function(){
    var n = b.dataset.n; st.model = n; st.f = {};
    $$(".prc-model").forEach(function(x){ x.classList.toggle("on", x===b); });
    $("#prc-grid").classList.add("picked"); $("#prc-change").hidden = false;
    var c = $("#prc-choisi"); c.hidden = false; c.innerHTML = "Modèle n° " + n + " choisi ✓ — " + (M[n].c.length ? "indiquez ce que vous voulez y faire graver (facultatif). Regardez la grande photo en haut : il s'y pose." : "ce modèle se grave tel quel.");
    var box = $("#prc-mfields"); box.innerHTML = "";
    if (M[n].c.length) {
      var h = document.createElement("p"); h.className = "prc-ftitle"; h.innerHTML = "Modèle n° " + n + " — <em>" + M[n].l + "</em>"; box.appendChild(h);
      M[n].c.forEach(function(k){ var F = CH[k]; var d = document.createElement("div"); d.className = "field";
        d.innerHTML = '<label>' + F.label + ' <span class="prc-opt">(facultatif' + (F.extra ? ', +' + F.extra + ' €' : '') + ')</span></label><input type="text" maxlength="' + F.max + '" placeholder="' + F.ph + '" data-k="' + k + '">';
        box.appendChild(d); $("input", d).addEventListener("input", function(e){ st.f[k] = e.target.value.trim(); refresh(); }); });
      box.hidden = false;
    } else box.hidden = true;
    refresh();
  }); });
  $("#prc-change").addEventListener("click", function(){ $("#prc-grid").classList.remove("picked"); $("#prc-change").hidden = true; $("#prc-grid").scrollIntoView({behavior:"smooth", block:"start"}); });
  $$(".prc-grav").forEach(function(b){ b.addEventListener("click", function(){ st.grav = b.dataset.v; $$(".prc-grav").forEach(function(x){ x.classList.toggle("on", x===b); }); refresh(); }); });
  var gn = $("#prc-gnom"); if (gn) { gn.addEventListener("input", function(e){ st.gnom = e.target.value.trim(); refresh(); }); $("#prc-gdate").addEventListener("input", function(e){ st.gdate = e.target.value.trim(); refresh(); }); }
  $$(".prc-let").forEach(function(b){ b.addEventListener("click", function(){ st.lettre = b.dataset.l; $$(".prc-let").forEach(function(x){ x.classList.toggle("on", x===b); }); refresh(); }); });
  $("#prc-lnom").addEventListener("input", function(e){ st.lnom = e.target.value.trim(); refresh(); });
  $("#prc-txt").addEventListener("input", function(e){ st.txt = e.target.value.trim(); $("#prc-txtn").textContent = e.target.value.length; refresh(); });
  $("#prc-tdate").addEventListener("input", function(e){ st.tdate = e.target.value.trim(); refresh(); });
  $("#prc-file").addEventListener("change", function(e){ st.photo = !!(e.target.files && e.target.files.length); $("#prc-fileok").hidden = !st.photo; refresh(); });
  $("#prc-ptxt").addEventListener("input", function(e){ st.ptxt = e.target.value.trim(); refresh(); });
  $$(".prc-pols").forEach(function(g){ $$(".prc-pol", g).forEach(function(b){ b.addEventListener("click", function(){ $$(".prc-pol", g).forEach(function(x){ x.classList.toggle("on", x===b); }); if (g.dataset.for==="texte") st.tpol = b.dataset.p; else st.lpol = b.dataset.p; refresh(); }); }); });
  $$(".prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });
  function etat(){
    if (!st.mode) return { ok:false, grav:null, manque:"Choisissez votre gravure (étape 1)." };
    if (st.mode==="modele") { if (!st.model) return { ok:false, grav:"Un modèle décoré", manque:"Cliquez le modèle voulu (étape 2)." };
      var parts = [], extra = 0; M[st.model].c.forEach(function(k){ var v = st.f[k]||""; if (v) { parts.push(CH[k].label + " : " + v); if (CH[k].extra) extra += CH[k].extra; } });
      return { ok:true, grav:"Modèle n° " + st.model + " — " + M[st.model].l, detail: parts.length ? parts.join(" · ") : "gravé tel quel", extra:extra }; }
    if (st.mode==="gravure") { if (!st.grav) return { ok:false, grav:"Une gravure réelle", manque:"Cliquez le style voulu (étape 2)." };
      var lab = ""; GRAV.forEach(function(g){ if (g[0]===st.grav) lab = g[1]; }); var p2 = []; if (st.gnom) p2.push("Prénoms : " + st.gnom); if (st.gdate) p2.push("Date : " + st.gdate + " (+3 €)");
      return { ok:true, grav:"Gravure « " + lab + " »", detail: p2.length ? p2.join(" · ") : "gravé comme la photo", extra: st.gdate ? 3 : 0 }; }
    if (st.mode==="lettre") { if (!st.lettre) return { ok:false, grav:"Une lettre fleurie", manque:"Cliquez votre lettre (étape 2)." };
      return { ok:true, grav:"Lettre fleurie « " + st.lettre + " »", detail: st.lnom ? "Prénom dans la bande : " + st.lnom + " (" + polName(st.lpol) + ")" : "sans prénom", extra:0 }; }
    if (st.mode==="photo") { if (!st.photo) return { ok:false, grav:"Ma photo ou mon logo", manque:"Ajoutez votre photo ou votre logo (étape 2)." };
      return { ok:true, grav:"Votre photo / logo", detail: st.ptxt ? "Texte sous la photo : " + st.ptxt : "photo seule, vérifiée par l'atelier", extra:0 }; }
    if (!st.txt) return { ok:false, grav:"Mon propre texte", manque:"Écrivez votre texte (étape 2)." };
    return { ok:true, grav:"Texte : « " + st.txt + " »", detail:"Écriture " + polName(st.tpol) + (st.tdate ? " · Date : " + st.tdate + " (+3 €)" : ""), extra: st.tdate ? 3 : 0 };
  }
  function refresh(){
    var e = etat(), tot = BASE + (e.extra||0);
    $("#prc-sum-grav").textContent = e.grav ? e.grav + (e.ok ? "" : " — à compléter") : "à choisir (étape 1)"; $("#prc-sum-grav").classList.toggle("prc-miss", !e.ok);
    $("#prc-sum-detail-row").hidden = !e.detail; $("#prc-sum-detail").textContent = e.detail || "";
    $("#prc-sum-tot").textContent = eur(tot); var v = $(".pd-totbox .val"); if (v) v.textContent = eur(tot);
    var btn = $("#prc-add"), hint = $("#prc-addhint"); btn.disabled = !e.ok; btn.classList.toggle("prc-off", !e.ok); hint.hidden = e.ok; hint.textContent = e.manque || "";
    $$(".prc-num").forEach(function(n){ var s = n.dataset.step; n.classList.toggle("done", s==="1" ? !!st.mode : e.ok); });
  }
  $("#prc-add").addEventListener("click", function(){ if ($("#prc-add").disabled) return; var t = $("#prc-toast") || (function(){ var d = document.createElement("div"); d.id = "prc-toast"; d.className = "prc-toast"; document.body.appendChild(d); return d; })(); t.textContent = "Ajouté au panier ✓ (maquette : rien n'est réellement ajouté)"; t.classList.add("on"); setTimeout(function(){ t.classList.remove("on"); }, 2600); });
  refresh();
})();
</script>''' % (json.dumps(modeles_js, ensure_ascii=False), json.dumps(CHAMPS, ensure_ascii=False), json.dumps(POLICES, ensure_ascii=False), P["prix"], json.dumps([], ensure_ascii=False))
    html = html.replace("</body>", SCRIPT + "</body>", 1)
    html = re.sub(r"<title>.*?</title>", f"<title>Maquette — {P['titre'].replace('Personnalisez votre ', '').capitalize()} parcours guidé</title>", html, count=1, flags=re.S)
    open(P["out"], "w", encoding="utf8").write(html)
    print("écrit", P["out"], len(html)//1024, "Ko")

build(VIN, "verre-a-vin-grave")
build(FLUTE, "flute-a-champagne-gravee")
