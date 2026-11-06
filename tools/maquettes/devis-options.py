#!/usr/bin/env python3
"""Maquette « options à cocher sur la page du devis » (06/11/2026, devis DEV-1549 d'Alissia).

Usage : python3 tools/maquettes/devis-options.py <dossier capture> <sortie.html>
Le dossier contient : src.html (curl de /document/<id>), les 3 feuilles CSS du site (*.css),
socle.jpg (/produits/socle-led-carre.jpg), logo.jpg (/logo-niv-creation.jpg, facultatif).
Le site n'est pas touché : seule la page capturée reçoit le bloc « Options de votre cristal ».
"""
import base64, glob, io, os, re, sys

from PIL import Image

src_dir, sortie = sys.argv[1], sys.argv[2]
h = open(os.path.join(src_dir, "src.html"), encoding="utf-8").read()


def uri(path, w=480):
    im = Image.open(path).convert("RGB")
    im.thumbnail((w, w))
    b = io.BytesIO()
    im.save(b, "JPEG", quality=82)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


# 1. Feuilles du site intégrées, scripts retirés (la page est figée, seul notre script tourne).
css = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(src_dir, "*.css"))))
h = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', "", h)
h = re.sub(r"<script\b.*?</script>", "", h, flags=re.S)
h = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", h)
logo = os.path.join(src_dir, "logo.jpg")
if os.path.exists(logo):
    h = re.sub(r'src="[^"]*logo-niv-creation\.jpg[^"]*"', f'src="{uri(logo, 400)}"', h)
h = re.sub(r'(<img[^>]+src=")/(?!/)', r'\1https://nivcreation.fr/', h)
# Photos du site intégrées (la page publiée ne peut rien charger d'ailleurs).
import urllib.request
def _integre(m):
    url = m.group(2).replace("&amp;", "&")
    try:
        data = urllib.request.urlopen(url, timeout=20).read()
        b = io.BytesIO(data); im = Image.open(b).convert("RGB"); im.thumbnail((360, 360))
        o = io.BytesIO(); im.save(o, "JPEG", quality=78)
        return m.group(1) + "data:image/jpeg;base64," + base64.b64encode(o.getvalue()).decode() + '"'
    except Exception:
        return m.group(0)
h = re.sub(r'(<img[^>]+?src=")(https?://[^"]+)"', _integre, h)
h = re.sub(r'\s(srcset|sizes)="[^"]*"', "", h)
h = h.replace('<button class="btn btn-gold" disabled="">Accepter et payer en ligne</button>',
              '<button class="btn btn-gold" id="dvo-payer">Accepter et payer en ligne</button>')

# 2. Repères pour le script : lignes du tableau, total, encadré du bas.
h = h.replace("</tbody></table>", '<tr id="dvo-lignes" style="display:none"></tr></tbody></table>', 1)
h = h.replace("<strong>Total des articles<!-- --> : <!-- -->45,90\u00a0€</strong>",
              '<strong>Total des articles : <span id="dvo-total">45,90 €</span></strong>', 1)
h = h.replace('<span style="color:var(--ink-soft)">Articles</span><b style="white-space:nowrap">45,90\u00a0€</b>',
              '<span style="color:var(--ink-soft)">Articles</span><b style="white-space:nowrap" id="dvo-articles">45,90 €</b>', 1)

FONTS = [("playfair", "Playfair", "'Playfair Display',serif"), ("cinzel", "Cinzel", "'Cinzel',serif"),
         ("cinzel-deco", "Cinzel Décoratif", "'Cinzel Decorative',serif"), ("montserrat", "Montserrat", "'Montserrat',sans-serif"),
         ("inter", "Inter", "'Inter',sans-serif"), ("great-vibes", "Great Vibes", "'Great Vibes',cursive"),
         ("allura", "Allura", "'Allura',cursive"), ("pacifico", "Pacifico", "'Pacifico',cursive")]
opts_font = "".join(f'<button type="button" class="dvo-f{" on" if i == 0 else ""}" data-f="{k}" style="font-family:{ff}">{n}</button>'
                    for i, (k, n, ff) in enumerate(FONTS))

bloc = f'''
<section class="dvo no-print" id="dvo">
  <h3>Options de votre cristal <span>facultatif</span></h3>
  <p class="dvo-lead">Cochez ce que vous voulez ajouter : le total se met à jour, et vous payez tout en une fois.</p>

  <label class="dvo-opt" id="dvo-socle-l">
    <input type="checkbox" id="dvo-socle">
    <img src="{uri(os.path.join(src_dir, 'socle.jpg'))}" alt="Socle lumineux LED">
    <span class="dvo-txt"><b>Socle lumineux LED</b><small>Petit socle carré, couleurs qui changent au toucher, câble USB et adaptateur fournis.</small></span>
    <span class="dvo-px">+14,90 €</span>
  </label>

  <label class="dvo-opt" id="dvo-texte-l">
    <input type="checkbox" id="dvo-texte">
    <span class="dvo-ic">Aa</span>
    <span class="dvo-txt"><b>Un texte gravé en plus</b><small>Un prénom, une date, un petit mot, gravé sous la fée.</small></span>
    <span class="dvo-px">+5,00 €</span>
  </label>
  <div class="dvo-champs" id="dvo-champs" hidden>
    <label class="dvo-l">Votre texte <span id="dvo-n">0 / 40</span></label>
    <input type="text" id="dvo-saisie" maxlength="40" placeholder="Ex : Alissia · 12.11.2026">
    <label class="dvo-l">Écriture</label>
    <div class="dvo-fonts">{opts_font}</div>
    <div class="dvo-apercu" id="dvo-apercu">Votre texte</div>
    <p class="dvo-manque" id="dvo-manque">Écrivez votre texte, ou décochez l'option.</p>
  </div>
</section>
'''
h = h.replace('<section class="dz no-print" id="dz-plus">', bloc + '<section class="dz no-print" id="dz-plus">', 1)

style = '''
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Allura&family=Cinzel&family=Cinzel+Decorative&family=Great+Vibes&family=Inter:wght@400;600&family=Montserrat&family=Pacifico&family=Playfair+Display:wght@400;600&display=swap">
<style>''' + css + '''
.dvo{max-width:760px;margin:22px auto 0;padding:20px 18px;border:1px solid #e7d3a1;border-radius:16px;background:linear-gradient(135deg,#fbf4e6,#fffdf9)}
.dvo h3{margin:0 0 4px;font-family:var(--font-display,'Playfair Display',serif);font-size:1.25rem}
.dvo h3 span{font:500 .72rem/1 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a98935;margin-left:6px}
.dvo-lead{margin:0 0 14px;font-size:.9rem;color:var(--ink-soft,#6b5d48)}
.dvo-opt{display:grid;grid-template-columns:22px 56px minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px;border:1.5px solid #eadfc8;border-radius:12px;background:#fff;cursor:pointer;margin-top:10px;transition:border-color .15s,box-shadow .15s}
.dvo-opt:has(input:checked){border-color:#c9a24b;box-shadow:0 0 0 3px rgba(201,162,75,.18)}
.dvo-opt input{width:20px;height:20px;accent-color:#a98935;margin:0}
.dvo-opt img,.dvo-ic{width:56px;height:56px;border-radius:10px;object-fit:cover}
.dvo-ic{display:grid;place-items:center;background:#f3e8d3;font:600 1.3rem 'Playfair Display',serif;color:#7c6120}
.dvo-txt{display:flex;flex-direction:column;gap:3px;min-width:0}
.dvo-txt small{color:var(--ink-soft,#6b5d48);font-size:.8rem;line-height:1.35}
.dvo-px{font-weight:600;color:#7c6120;white-space:nowrap}
.dvo-champs{margin:8px 0 0;padding:14px;border:1px dashed #d8c393;border-radius:12px;background:#fffdf9}
.dvo-l{display:flex;justify-content:space-between;font-size:.82rem;font-weight:600;margin:6px 0 6px}
.dvo-l span{font-weight:400;color:var(--ink-soft,#6b5d48)}
#dvo-saisie{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d8c393;border-radius:10px;font-size:1rem}
.dvo-fonts{display:flex;flex-wrap:wrap;gap:6px}
@media (max-width:640px){.dvo-fonts{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px}}
.dvo-f{flex:0 0 auto;padding:8px 12px;border:1px solid #eadfc8;border-radius:999px;background:#fff;font-size:1rem;cursor:pointer;min-height:40px}
.dvo-f.on{border-color:#a98935;background:#1a1206;color:#f3e8d3}
.dvo-apercu{margin-top:12px;padding:20px 12px;border-radius:12px;background:radial-gradient(circle at 50% 30%,#2b3a4a,#0f161e);color:#eaf2ff;text-align:center;font-size:1.5rem;min-height:1.5em;text-shadow:0 0 6px rgba(200,225,255,.6);overflow-wrap:anywhere}
.dvo-manque{margin:8px 0 0;font-size:.82rem;color:#b3261e}
.dvo-manque[hidden]{display:none}
#dvo-payer:disabled{opacity:.5}
@media (max-width:480px){.dvo-opt{grid-template-columns:22px 44px minmax(0,1fr);}.dvo-opt img,.dvo-ic{width:44px;height:44px}.dvo-px{grid-column:3}}
</style>
'''
h = h.replace("</head>", style + "</head>", 1)

script = '''
<script>
(function(){
  var BASE=45.90, SOCLE=14.90, TEXTE=5.00;
  var $=function(i){return document.getElementById(i)};
  var eur=function(n){return n.toFixed(2).replace('.',',')+' \\u20ac'};
  var FF={'playfair':"'Playfair Display',serif",'cinzel':"'Cinzel',serif",'cinzel-deco':"'Cinzel Decorative',serif",'montserrat':"'Montserrat',sans-serif",'inter':"'Inter',sans-serif",'great-vibes':"'Great Vibes',cursive",'allura':"'Allura',cursive",'pacifico':"'Pacifico',cursive"};
  var NOMS={'playfair':'Playfair','cinzel':'Cinzel','cinzel-deco':'Cinzel Décoratif','montserrat':'Montserrat','inter':'Inter','great-vibes':'Great Vibes','allura':'Allura','pacifico':'Pacifico'};
  var police='playfair';
  var ligne=function(d,p){return '<tr style="border-bottom:1px solid var(--line);background:#fffaf0"><td style="padding:8px 6px">'+d+'</td><td style="padding:8px 6px;text-align:center">1</td><td style="padding:8px 6px;text-align:right">'+eur(p)+'</td><td style="padding:8px 6px;text-align:right">'+eur(p)+'</td></tr>'};
  function maj(){
    var s=$('dvo-socle').checked, t=$('dvo-texte').checked, v=$('dvo-saisie').value.trim();
    $('dvo-champs').hidden=!t;
    $('dvo-n').textContent=$('dvo-saisie').value.length+' / 40';
    $('dvo-apercu').textContent=v||'Votre texte';
    $('dvo-apercu').style.fontFamily=FF[police];
    $('dvo-manque').hidden=!(t&&!v);
    var tot=BASE+(s?SOCLE:0)+(t?TEXTE:0), html='';
    if(s) html+=ligne('Option : socle lumineux LED (petit socle carré)',SOCLE);
    if(t) html+=ligne('Option : texte gravé \\u00ab '+(v||'\\u2026')+' \\u00bb, écriture '+NOMS[police],TEXTE);
    var ref=$('dvo-lignes'); while(ref.previousElementSibling&&ref.previousElementSibling.dataset.opt) ref.previousElementSibling.remove();
    var tmp=document.createElement('tbody'); tmp.innerHTML=html;
    Array.prototype.slice.call(tmp.children).forEach(function(tr){tr.dataset.opt='1'; ref.parentNode.insertBefore(tr,ref)});
    $('dvo-total').textContent=eur(tot); $('dvo-articles').textContent=eur(tot);
    $('dvo-payer').disabled=(t&&!v);
  }
  ['dvo-socle','dvo-texte'].forEach(function(i){$(i).addEventListener('change',maj)});
  $('dvo-saisie').addEventListener('input',maj);
  document.querySelectorAll('.dvo-f').forEach(function(b){b.addEventListener('click',function(){
    document.querySelectorAll('.dvo-f').forEach(function(x){x.classList.remove('on')}); b.classList.add('on'); police=b.dataset.f; maj();})});
  maj();
})();
</script>
'''
h = h.replace("</body>", script + "</body>", 1)
h = re.sub(r"<title>.*?</title>", "<title>Devis : options à cocher</title>", h, count=1, flags=re.S)
open(sortie, "w", encoding="utf-8").write(h)
print(sortie, len(h) // 1024, "Ko")
