#!/usr/bin/env python3
"""Maquette « socle du cristal vertical » (gérant, 30/10/2026) : Petit, Moyen et Grand = petit socle ;
XL = la cliente choisit la taille du socle (petit ou grand), avec les dimensions affichées.

Usage : python3 tools/maquettes/socle-vertical.py <capture fiche verticale .html> <css du site> <sortie .html>
  capture = curl https://nivcreation.fr/produit/cristal-photo-3d-vertical
  css     = les feuilles /_next/static/css/*.css de la capture, mises bout à bout
La fiche en ligne est reprise telle quelle ; seul le bloc du socle est remplacé. Le site n'est pas touché.
"""
import base64, io, os, re, sys
from PIL import Image

SRC, CSS, OUT = sys.argv[1:4]
ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "public")
h = open(SRC, encoding="utf-8").read()
css = open(CSS, encoding="utf-8").read()


def data_uri(path, w=820):
    f = os.path.join(ROOT, path.lstrip("/"))
    if not os.path.isfile(f):
        return None
    im = Image.open(f)
    im.thumbnail((w, w))
    buf = io.BytesIO()
    if im.mode in ("RGBA", "LA", "P") and path.endswith(".png"):
        im.save(buf, "PNG", optimize=True)
        mime = "png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=78)
        mime = "jpeg"
    return f"data:image/{mime};base64," + base64.b64encode(buf.getvalue()).decode()


# Scripts et vidéos retirés (la vidéo devient son image fixe).
h = re.sub(r"<script\b[^>]*>.*?</script>", "", h, flags=re.S)
h = re.sub(r"<link[^>]+>", "", h)
h = re.sub(r'<video[^>]*poster="([^"]+)"[^>]*>(</video>)?', r'<img src="\1" alt="" style="width:100%;height:100%;object-fit:contain"/>', h)

# Bloc du socle remplacé.
debut = h.index('<div><p class="perso-hint">Socle lumineux')
fin = h.index("</select></div>", h.index('id="pf-socle"')) + len("</select></div>")
BLOC = """<div class="field sv">
<label>Socle lumineux LED multicolore<span style="color:var(--ink-soft);font-weight:400"> (facultatif)</span></label>
<p class="perso-hint" style="margin-top:0">Il pose et illumine votre cristal : l'effet 3D est sublimé, surtout le soir.</p>
<p class="sv-base">Votre cristal <b id="sv-taille">Petit</b> pose une base de <b id="sv-base">5 × 5 cm</b>.</p>
<div class="sv-grid">
  <button type="button" class="variant-swatch sv-card active" data-s="sans"><span class="sv-vide">Aucun socle</span><span class="vs-title">Sans socle</span><span class="vs-price"><span class="vs-now">+0 €</span></span></button>
  <button type="button" class="variant-swatch sv-card" data-s="petit"><img src="/produits/socle-led-carre.jpg" alt=""/><span class="vs-title">Petit socle carré</span><span class="vs-sub">Dessus 5 × 5 cm</span><span class="vs-price"><span class="vs-now">+14,90 €</span></span></button>
  <button type="button" class="variant-swatch sv-card" data-s="grand" hidden><img src="/produits/socle-led-rectangle.jpg" alt=""/><span class="vs-title">Grand socle rectangle</span><span class="vs-sub">Dessus 13 × 7 cm</span><span class="vs-price"><span class="vs-now">+19,90 €</span></span></button>
</div>
<p class="perso-hint" id="sv-info">LED multicolores dont les couleurs changent au toucher. Il fonctionne sur une prise secteur, câble USB et adaptateur de prise fournis.</p>
</div>"""
h = h[:debut] + BLOC + h[fin:]

# Images locales intégrées (logo d'origine compris, sans retouche du fichier).
def repl(m):
    p = m.group(1)
    if p == "/logo-niv-creation.jpg":
        f = os.path.join(ROOT, "logo-niv-creation.jpg")
        return 'src="data:image/jpeg;base64,' + base64.b64encode(open(f, "rb").read()).decode() + '"'
    u = data_uri(p, 520 if "socle" in p else 820)
    return f'src="{u}"' if u else m.group(0)
h = re.sub(r'src="(/[^"]+\.(?:jpe?g|png|webp))"', repl, h)

EXTRA = """
.sv-base{font-size:.9rem;margin:6px 0 4px}
.sv-xl{font-size:.88rem;margin:4px 0 8px;color:#7c6120;font-weight:600}
.sv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:8px 0}
.sv-card{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:3px;min-width:0}
.sv-card img{width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:1/1!important;object-fit:contain!important;object-position:center!important;background:#f1e9da;border-radius:8px;margin-bottom:4px}
.sv-vide{width:100%;aspect-ratio:1;border-radius:8px;margin-bottom:4px;display:grid;place-items:center;
  background:#f3e8d3;color:#7c6120;font-size:.78rem}
.maq-band{background:#1a1206;color:#e2c67e;font:600 .85rem/1.4 system-ui,sans-serif;padding:10px 16px;text-align:center}
@media (max-width:480px){.sv-grid{gap:6px}.sv-card{padding:8px!important}.sv-card .vs-title{font-size:.8rem}.sv-card .vs-sub{font-size:.72rem}}
"""
BAND = '<div class="maq-band">Maquette — socle du cristal vertical · Petit, Moyen, Grand : petit socle · XL : grand socle · rien n\'est en ligne</div>'
h = h.replace("<header", BAND + "<header", 1)

JS = """<script>
(function(){
  var T={Petit:{p:39.9,b:'5 × 5 cm'},Moyen:{p:59.9,b:'6 × 5 cm'},Grand:{p:99.9,b:'8 × 6 cm'},XL:{p:149.9,b:'10 × 6 cm'}};
  var S={sans:0,petit:14.9,grand:19.9};
  var INFO={sans:'',petit:'Petit socle carré : LED multicolores dont les couleurs changent au toucher. Il fonctionne sur une prise secteur, câble USB et adaptateur de prise fournis.',
    grand:'Grand socle rectangle : LED multicolores dont les couleurs changent au toucher. Il fonctionne sur une prise secteur, câble USB et adaptateur de prise fournis.'};
  var taille='Petit', socle='sans';
  var fmt=function(n){return n.toFixed(2).replace('.',',')+'\\u00a0€';};
  var sizes=document.querySelectorAll('.crystal-sizes .variant-swatch');
  var cards=document.querySelectorAll('.sv-card');
  function maj(){
    var xl=taille==='XL';
    if(!xl&&socle==='grand') socle='petit'; if(xl&&socle==='petit') socle='grand';
    cards.forEach(function(c){var s=c.dataset.s;c.hidden=(s==='grand'&&!xl)||(s==='petit'&&xl);c.classList.toggle('active',s===socle);c.setAttribute('aria-pressed',s===socle);});
    document.getElementById('sv-taille').textContent=taille;
    document.getElementById('sv-base').textContent=T[taille].b;
    var inf=document.getElementById('sv-info');inf.textContent=INFO[socle]||INFO.petit;
    var tot=T[taille].p+S[socle];
    var pl=document.querySelector('.price-lead');if(pl)pl.textContent=fmt(T[taille].p);
    var tv=document.querySelector('.pd-totbox .val');if(tv)tv.textContent=fmt(tot);
  }
  sizes.forEach(function(b){b.addEventListener('click',function(){
    sizes.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false');});
    b.classList.add('active');b.setAttribute('aria-pressed','true');
    taille=b.querySelector('.vs-title').textContent.trim();maj();});});
  cards.forEach(function(c){c.addEventListener('click',function(){socle=c.dataset.s;maj();});});
  window.svTest=function(){return {taille:taille,socle:socle,total:document.querySelector('.pd-totbox .val').textContent};};
  maj();
})();
</script>"""

h = h.replace("</body>", JS + "</body>")
# Page entière (fichier local) + fragment pour l'artifact (le corps seul, avec titre et style).
corps = re.search(r"<body[^>]*>(.*)</body>", h, flags=re.S).group(1)
STYLE = "<title>Socle cristal vertical</title><style>:root{color-scheme:light}body{background:#fbf7ee}" + css + EXTRA + "</style>"
open(OUT.replace(".html", ".fragment.html"), "w", encoding="utf-8").write(STYLE + corps)
h = h.replace("<head>", "<head>" + STYLE, 1)
open(OUT, "w", encoding="utf-8").write(h)
print(OUT, round(len(h) / 1e6, 2), "Mo")
