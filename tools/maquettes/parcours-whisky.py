# -*- coding: utf-8 -*-
"""Maquette « parcours guidé » pour le VERRE À WHISKY PERSO (02/10/2026).
Même mise en page que la carafe / le vin / la flûte EN LIGNE (ParcoursGuide.jsx), adaptée à ce
que CETTE fiche propose (rien d'autre n'est ajouté) :
  ① Que voulez-vous graver ? — « Ma photo ou mon logo » / « Mon propre texte » (cartes exclusives)
  ② Où sur le verre ? — face avant (cochée d'office) / fond du verre / les deux (+7 €)
  ③ le détail : photo ou texte, date (+3 €), décor autour du texte, écriture ; si « les deux »,
     un bloc « Et au fond du verre » (photo et/ou texte du fond)
  ④ résumé + total ; bouton « Ajouter au panier » bloqué tant que la gravure n'est pas choisie.
Aucun aperçu ajouté : l'aperçu reste celui du site (grande photo + « Votre aperçu »).
Part du VRAI rendu (whisky-src.html, servi par `next start`). Usage :
  python3 tools/maquettes/parcours-whisky.py
"""
import re, base64, io, json, os, urllib.parse
from PIL import Image

S = os.environ.get("NIV_SCRATCH", "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad")
ROOT = "/home/user/Niro"
SRC = f"{S}/whisky-src.html"
OUT = f"{ROOT}/docs/maquettes/whisky-perso-parcours-guide.html"
PRIX = 19.90          # à l'unité (le choix du lot, à droite, reste celui du site)
EXTRA_TEXTE = 3       # engravingPricing : texte +3 € · date +3 € · face + fond +7 €
EXTRA_DATE = 3
EXTRA_DEUX = 7

POLICES = [("playfair", "Playfair", "fnt-playfair"), ("cinzel", "Cinzel", "fnt-cinzel"), ("cinzel-deco", "Cinzel Decorative", "fnt-cinzel-deco"), ("montserrat", "Montserrat", "fnt-montserrat"),
           ("inter", "Inter", "fnt-inter"), ("great-vibes", "Great Vibes", "fnt-great-vibes"), ("allura", "Allura", "fnt-allura"), ("pacifico", "Pacifico", "fnt-pacifico")]
DECORS = [("", "Aucun"), ("★", "★ texte ★"), ("♥", "♥ texte ♥"), ("✿", "✿ texte ✿"), ("◆", "◆ texte ◆"), ("•", "• texte •")]

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
    if "guide-photo" in rel: return (720, 74)
    if "vide" in rel or "fond_clair" in rel: return (900, 78)
    return (640, 72)

def local_of(src):
    src = src.replace("&amp;", "&")
    if src.startswith("/_next/image?"):
        return urllib.parse.parse_qs(urllib.parse.urlparse(src).query).get("url", [None])[0]
    if src.startswith("/produits/") or src.startswith("/instagram") or src.startswith("/logo"): return src
    return None

def build():
    html = open(SRC, encoding="utf8").read()
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

    img_face = datauri("/produits/verre_a_whisky_grave_vide.jpg", 640, 74)
    img_fond = datauri("/produits/verre_a_whisky_fond_clair.jpg", 640, 74)
    img_deux = datauri("/produits/verre_a_whisky_exemple_fond.jpg", 640, 74)
    img_photo = datauri("/produits/verre_a_whisky_exemple_face.jpg", 480, 74)
    img_guide = datauri("/produits/guide-photo-gravure.png", 720, 74)
    pols = "".join(f'<button type="button" class="prc-pol {cls}" data-p="{k}">{lab}</button>' for k, lab, cls in POLICES)
    decors = "".join(f'<button type="button" class="prc-chip{" on" if not v else ""}" data-d="{v}">{lab}</button>' for v, lab in DECORS)
    eur = lambda n: ("%.2f" % n).replace(".", ",") + " €"

    NEW = f'''<div class="prc" id="prc">
<div class="prc-tag">NOUVEAU — même parcours que la carafe, le vin et la flûte</div>
<div class="prc-head"><p class="prc-title">Personnalisez votre verre à whisky</p><p class="prc-sub">Dites-nous quoi graver et où, nous faisons le reste.</p></div>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="1">1</span><h3>Que voulez-vous graver ?</h3></div>
  <div class="prc-cards">
    <button type="button" class="prc-card" data-mode="photo"><span class="prc-cimg prc-cimg-photo"><img src="{img_photo}" alt=""></span><span class="prc-ctxt"><b>Ma photo ou mon logo</b><small>Un portrait, une photo de famille, le logo de votre bar ou entreprise : transformé en gravure façon dessin. Avec un texte dessous si vous voulez.</small></span></button>
    <button type="button" class="prc-card" data-mode="texte"><span class="prc-cimg prc-cimg-aa"><span class="fnt-great-vibes">Aa</span></span><span class="prc-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un petit message — dans l'écriture de votre choix, avec un décor autour si vous voulez. Sans photo.</small></span></button>
  </div>
  <p class="prc-hint">Un seul choix par verre. Vous pouvez changer d'avis à tout moment.</p>
</section>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num done" data-step="2">2</span><h3>Où sur le verre ?</h3></div>
  <div class="prc-cofs prc-empl">
    <button type="button" class="prc-cof on" data-e="face"><img src="{img_face}" alt=""><b>Sur la face avant</b><small>La gravure classique, visible de face.</small></button>
    <button type="button" class="prc-cof" data-e="fond"><img src="{img_fond}" alt=""><b>Au fond du verre</b><small>Vue de dessus, à travers le verre : se découvre en buvant.</small></button>
    <button type="button" class="prc-cof" data-e="deux"><img src="{img_deux}" alt=""><b>Les deux : face + fond</b><span class="prc-cp">+ {EXTRA_DEUX} €</span><small>Une gravure sur la face, une autre au fond.</small></button>
  </div>
</section>

<section class="prc-step" id="prc-s3" hidden>
  <div class="prc-sh"><span class="prc-num" data-step="3">3</span><h3 id="prc-s3-title">Ajoutez votre photo ou votre logo</h3></div>
  <div class="prc-mode" data-mode="photo" hidden>
    <p class="prc-legend">Téléversez le fichier (JPG, PNG). Une fois la photo ajoutée, vous la glissez sur le verre, en haut de la fiche, et réglez sa taille — la dimension en cm s'affiche. L'atelier vérifie la qualité avant de graver.</p>
    <div class="prc-fields">
      <div class="field"><label>Votre photo ou logo</label><input type="file" id="prc-file" accept="image/*"><p class="prc-fileok" id="prc-fileok" hidden>Photo ajoutée ✓</p></div>
      <div class="field"><label>Texte sous la photo <span class="prc-opt">(facultatif, +{EXTRA_TEXTE} €)</span></label><input type="text" id="prc-ptxt" maxlength="30" placeholder="Prénom, message…"><span class="prc-count"><span id="prc-ptxtn">0</span>/30</span></div>
    </div>
    <details class="prc-guide"><summary>Réussir sa gravure photo — nos conseils</summary>
      <img src="{img_guide}" alt="Exemples de bonnes et mauvaises photos pour la gravure">
      <p>Choisissez une image nette et bien éclairée (lumière du jour idéale), avec le ou les visages bien visibles et un peu d'espace autour. Évitez les photos sombres, floues, à contre-jour ou trop serrées. Votre photo est transformée en gravure monochrome façon dessin, puis retravaillée à la main par notre atelier. L'aperçu en ligne est indicatif.</p>
    </details>
  </div>
  <div class="prc-mode" data-mode="texte" hidden>
    <div class="prc-fields">
      <div class="field"><label>Votre texte à graver <span class="prc-opt">(+{EXTRA_TEXTE} €)</span></label><input type="text" id="prc-txt" maxlength="30" placeholder="Prénom, message…"><span class="prc-count"><span id="prc-txtn">0</span>/30</span></div>
    </div>
  </div>
  <div class="prc-fields prc-commun" id="prc-commun" hidden>
    <div class="field"><label>Date <span class="prc-opt">(facultatif, +{EXTRA_DATE} €)</span></label><input type="text" id="prc-date" maxlength="30" placeholder="Ex : 12.06.2024"></div>
    <div class="field"><label>Décor autour du texte <span class="prc-opt">(facultatif)</span></label><div class="prc-chips prc-decors">{decors}</div></div>
    <div class="field"><label>Écriture</label><div class="prc-pols">{pols}</div></div>
  </div>
  <div class="prc-fond" id="prc-fond" hidden>
    <p class="prc-ftitle">Et au fond du verre — <em>la 2ᵉ gravure (+{EXTRA_DEUX} €)</em></p>
    <p class="prc-legend">Gravée centrée au fond, elle se découvre à travers le verre. Une photo, un texte, ou les deux.</p>
    <div class="prc-fields">
      <div class="field"><label>Photo pour le fond <span class="prc-opt">(facultatif)</span></label><input type="file" id="prc-ffile" accept="image/*"><p class="prc-fileok" id="prc-ffileok" hidden>Photo du fond ajoutée ✓</p></div>
      <div class="field"><label>Texte pour le fond <span class="prc-opt">(facultatif)</span></label><input type="text" id="prc-ftxt" maxlength="30" placeholder="Prénom, message…"></div>
    </div>
  </div>
</section>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="4">4</span><h3>Résumé de votre gravure</h3></div>
  <div class="prc-sum">
    <div class="prc-sumrow"><span>Gravure</span><b id="prc-sum-grav" class="prc-miss">à choisir (étape 1)</b></div>
    <div class="prc-sumrow" id="prc-sum-detail-row" hidden><span>Détail</span><b id="prc-sum-detail"></b></div>
    <div class="prc-sumrow"><span>Emplacement</span><b id="prc-sum-empl">Face avant</b></div>
    <div class="prc-sumrow" id="prc-sum-fond-row" hidden><span>Au fond</span><b id="prc-sum-fond"></b></div>
    <div class="prc-sumrow prc-sumtot"><span>Total</span><b id="prc-sum-tot">{eur(PRIX)}</b></div>
  </div>
</section>
</div>'''
    html = html[:i0] + NEW + html[j0:]
    OLDBTN = '<button class="btn btn-gold" style="flex:1">Ajouter au panier</button></div>'
    assert OLDBTN in html
    html = html.replace(OLDBTN, '<button class="btn btn-gold prc-off" id="prc-add" style="flex:1" disabled>Ajouter au panier</button></div><p class="prc-addhint" id="prc-addhint">Choisissez votre gravure (étape 1).</p>', 1)

    css_site = open(f"{ROOT}/src/app/globals.css", encoding="utf8").read()
    css_prc = css_site[css_site.index("   PARCOURS GUIDÉ de personnalisation"):]
    css_prc = css_prc[:css_prc.index("/* ---- Fiche complète d'une commande")] if "/* ---- Fiche complète d'une commande" in css_prc else css_prc
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
/* « Où sur le verre ? » : les cartes du coffret, avec une photo du verre */
.prc-empl .prc-cof{align-items:center;text-align:center;padding-top:12px}
.prc-empl .prc-cof img{width:100%;max-width:120px;aspect-ratio:1/1;object-fit:cover;border-radius:10px;background:#efe6d6;margin-bottom:4px}
.prc-empl .prc-cof b{padding-right:0;font-size:.88rem}.prc-empl .prc-cof::before{top:10px;right:10px}
.prc-decors .prc-chip{font-size:.86rem}
.prc-commun{margin-top:10px}
.prc-fond{margin-top:12px;padding:12px 12px 2px;border:1.5px dashed var(--gold);border-radius:12px;background:#fffdf7}
.prc-fond .prc-fields{margin-top:0;padding:0;border:0;background:none}
.prc-guide{margin:10px 0 0;font-size:.82rem;color:var(--ink-soft)}.prc-guide summary{cursor:pointer;font-weight:600;color:var(--gold-dark)}
.prc-guide img{width:100%;border-radius:10px;margin:8px 0 6px;border:1px solid var(--line)}.prc-guide p{margin:0;line-height:1.45}
.prc-fileok{font-size:.8rem;color:#2e7d32;font-weight:600;margin:6px 0 0}
.prc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:80;opacity:0;transition:opacity .2s;pointer-events:none}.prc-toast.on{opacity:1}
@media (max-width:720px){.prc-empl .prc-cof{flex-direction:row;text-align:left;align-items:flex-start;gap:4px 10px;flex-wrap:wrap}.prc-empl .prc-cof img{width:64px;max-width:64px;margin:0}.prc-empl .prc-cof b,.prc-empl .prc-cof small,.prc-empl .prc-cof .prc-cp{flex:1 1 calc(100% - 74px)}}
</style>'''
    html = html.replace("</head>", STYLE + "</head>", 1)
    MQ = ('<div class="mq-bar"><b>MAQUETTE</b><span>Rien n\'est en ligne. Même parcours que la carafe, le vin et la flûte, adapté à ce verre : photo ou texte, face / fond / les deux. '
          'Le choix « À l\'unité / Lot de 2 / Lot de 4 » à droite et, pour un lot, « Les 2 identiques / Chacun différent » restent comme aujourd\'hui ; les prix (texte +3 €, date +3 €, face + fond +7 €) sont ceux de la fiche. '
          'Le bouton s\'allume dès que la gravure est choisie.</span></div>')
    html = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + MQ, html, count=1)
    SCRIPT = r'''<script>
(function(){
  var POL = %s, BASE = %s, XT = %s, XD = %s, XF = %s;
  var st = { mode:null, empl:"face", photo:false, ptxt:"", txt:"", date:"", decor:"", pol:"playfair", fphoto:false, ftxt:"" };
  var $ = function(s, r){ return (r||document).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var eur = function(n){ return n.toFixed(2).replace(".", ",") + " €"; };
  var polName = function(k){ for (var i=0;i<POL.length;i++) if (POL[i][0]===k) return POL[i][1]; return k; };
  var EMPL = { face:"Face avant", fond:"Fond du verre", deux:"Face + fond (+" + XF + " €)" };
  function reset(m){
    st.mode = m; st.photo = false; st.ptxt = ""; st.txt = ""; st.date = ""; st.decor = ""; st.pol = "playfair";
    $$("input[type=text]", $("#prc-s3")).forEach(function(i){ i.value = ""; }); $("#prc-txtn").textContent = "0"; $("#prc-ptxtn").textContent = "0";
    $("#prc-fileok").hidden = true; $("#prc-file").value = "";
    $$(".prc-decors .prc-chip").forEach(function(x){ x.classList.toggle("on", x.dataset.d===""); });
    $$(".prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });
  }
  $$(".prc-card").forEach(function(b){ b.addEventListener("click", function(){
    var m = b.dataset.mode; if (st.mode === m) return; reset(m);
    $$(".prc-card").forEach(function(x){ x.classList.toggle("on", x===b); });
    var s3 = $("#prc-s3"); s3.hidden = false; $$(".prc-mode", s3).forEach(function(x){ x.hidden = x.dataset.mode !== m; }); $("#prc-commun").hidden = false;
    $("#prc-s3-title").textContent = m==="photo" ? "Ajoutez votre photo ou votre logo" : "Écrivez votre texte";
    refresh(); setTimeout(function(){ s3.scrollIntoView({behavior:"smooth", block:"start"}); }, 60);
  }); });
  $$(".prc-empl .prc-cof").forEach(function(b){ b.addEventListener("click", function(){
    st.empl = b.dataset.e; $$(".prc-empl .prc-cof").forEach(function(x){ x.classList.toggle("on", x===b); });
    $("#prc-fond").hidden = st.empl !== "deux"; refresh();
  }); });
  $("#prc-file").addEventListener("change", function(e){ st.photo = !!(e.target.files && e.target.files.length); $("#prc-fileok").hidden = !st.photo; refresh(); });
  $("#prc-ptxt").addEventListener("input", function(e){ st.ptxt = e.target.value.trim(); $("#prc-ptxtn").textContent = e.target.value.length; refresh(); });
  $("#prc-txt").addEventListener("input", function(e){ st.txt = e.target.value.trim(); $("#prc-txtn").textContent = e.target.value.length; refresh(); });
  $("#prc-date").addEventListener("input", function(e){ st.date = e.target.value.trim(); refresh(); });
  $$(".prc-decors .prc-chip").forEach(function(c){ c.addEventListener("click", function(){ st.decor = c.dataset.d; $$(".prc-decors .prc-chip").forEach(function(x){ x.classList.toggle("on", x===c); }); refresh(); }); });
  $$(".prc-pol").forEach(function(b){ b.addEventListener("click", function(){ st.pol = b.dataset.p; $$(".prc-pol").forEach(function(x){ x.classList.toggle("on", x===b); }); refresh(); }); });
  $("#prc-ffile").addEventListener("change", function(e){ st.fphoto = !!(e.target.files && e.target.files.length); $("#prc-ffileok").hidden = !st.fphoto; refresh(); });
  $("#prc-ftxt").addEventListener("input", function(e){ st.ftxt = e.target.value.trim(); refresh(); });
  $$(".prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p==="playfair"); });
  function etat(){
    if (!st.mode) return { ok:false, grav:null, manque:"Choisissez votre gravure (étape 1)." };
    var extra = 0, parts = [], grav;
    var texte = st.mode==="photo" ? st.ptxt : st.txt;
    if (st.mode==="photo") {
      if (!st.photo) return { ok:false, grav:"Ma photo ou mon logo", manque:"Ajoutez votre photo ou votre logo (étape 3)." };
      grav = "Votre photo / logo";
      if (texte) { parts.push("Texte sous la photo : " + (st.decor ? st.decor + " " : "") + texte + (st.decor ? " " + st.decor : "") + " (+" + XT + " €)"); extra += XT; }
    } else {
      if (!texte) return { ok:false, grav:"Mon propre texte", manque:"Écrivez votre texte (étape 3)." };
      grav = "Texte : « " + (st.decor ? st.decor + " " : "") + texte + (st.decor ? " " + st.decor : "") + " » (+" + XT + " €)"; extra += XT;
    }
    if (st.date) { parts.push("Date : " + st.date + " (+" + XD + " €)"); extra += XD; }
    if (texte || st.date) parts.push("Écriture " + polName(st.pol));
    var fond = null;
    if (st.empl==="deux") {
      extra += XF;
      if (!st.fphoto && !st.ftxt) return { ok:false, grav:grav, detail: parts.join(" · "), extra:extra, fond:"à préciser", manque:"Indiquez ce qui sera gravé au fond du verre : une photo ou un texte (étape 3)." };
      fond = [st.fphoto ? "photo" : null, st.ftxt ? "« " + st.ftxt + " »" : null].filter(Boolean).join(" + ");
    }
    return { ok:true, grav:grav, detail: parts.length ? parts.join(" · ") : (st.mode==="photo" ? "photo seule, vérifiée par l'atelier" : ""), extra:extra, fond:fond };
  }
  function refresh(){
    var e = etat(), tot = BASE + (e.extra||0);
    $("#prc-sum-grav").textContent = e.grav ? e.grav + (e.ok || e.fond ? "" : " — à compléter") : "à choisir (étape 1)"; $("#prc-sum-grav").classList.toggle("prc-miss", !e.grav || (!e.ok && !e.fond));
    $("#prc-sum-detail-row").hidden = !e.detail; $("#prc-sum-detail").textContent = e.detail || "";
    $("#prc-sum-empl").textContent = EMPL[st.empl];
    $("#prc-sum-fond-row").hidden = st.empl !== "deux"; $("#prc-sum-fond").textContent = e.fond || "à préciser"; $("#prc-sum-fond").classList.toggle("prc-miss", st.empl==="deux" && !e.ok);
    $("#prc-sum-tot").textContent = eur(tot); var v = $(".pd-totbox .val"); if (v) v.textContent = eur(tot);
    var btn = $("#prc-add"), hint = $("#prc-addhint"); btn.disabled = !e.ok; btn.classList.toggle("prc-off", !e.ok); hint.hidden = e.ok; hint.textContent = e.manque || "";
    $$(".prc-num").forEach(function(n){ var s = n.dataset.step; n.classList.toggle("done", s==="1" ? !!st.mode : s==="2" ? true : e.ok); });
  }
  $("#prc-add").addEventListener("click", function(){ if ($("#prc-add").disabled) return; var t = $("#prc-toast") || (function(){ var d = document.createElement("div"); d.id = "prc-toast"; d.className = "prc-toast"; document.body.appendChild(d); return d; })(); t.textContent = "Ajouté au panier ✓ (maquette : rien n'est réellement ajouté)"; t.classList.add("on"); setTimeout(function(){ t.classList.remove("on"); }, 2600); });
  refresh();
})();
</script>''' % (json.dumps(POLICES, ensure_ascii=False), PRIX, EXTRA_TEXTE, EXTRA_DATE, EXTRA_DEUX)
    html = html.replace("</body>", SCRIPT + "</body>", 1)
    html = re.sub(r"<title>.*?</title>", "<title>Maquette — Whisky perso, parcours guidé</title>", html, count=1, flags=re.S)
    open(OUT, "w", encoding="utf8").write(html)
    print("écrit", OUT, len(html)//1024, "Ko")

build()
