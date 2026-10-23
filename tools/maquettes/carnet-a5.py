#!/usr/bin/env python3
"""Maquette « Carnet A5 gravé » — 23/10/2026. RIEN n'est en ligne.

Gérant : « fais-moi une maquette pour un carnet » + fiche fournisseur (carnet A5 aspect cuir, couverture rigide, élastique,
100 feuilles 80 g, reliure cousue, 21,2 × 14,5 cm, 0,88 € pièce dès 20) ; coloris entourés : marron, noir, gris.
Méthode (comme le puzzle) : fiche ajoutée SUR LA MACHINE SEULEMENT (products.js + productInfo.js, jamais enregistrés ni poussés),
site construit, page /produit/carnet-a5-grave capturée APRÈS avoir choisi « un texte » (Playwright : DOM avec l'aperçu posé sur la
couverture), puis fichiers remis à l'identique. Les couvertures de face sont DESSINÉES (assets/carnet/couverture-*.jpg) : le
fournisseur n'en donne pas sans bandeau « NOTEBOOK ». À remplacer par de vraies photos gravées avant toute mise en ligne.

Usage : python3 tools/maquettes/carnet-a5.py <capture.html> <champ-photo.html>
Sortie : docs/maquettes/carnet-a5.html
"""
import base64, io, json, os, re, sys, urllib.parse
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
PUB = os.path.join(ROOT, "public")
ASSETS = os.path.join(OUT, "assets", "carnet")
SRC = sys.argv[1]
PHOTO_FIELD = open(sys.argv[2], encoding="utf-8").read()


def uri(path, w=900, q=78):
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


src = open(SRC, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="(?:preload|modulepreload|preconnect|dns-prefetch)"[^>]*>', "", src)
body_start = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>") + len("</main>")
HEADER, FOOTER, MAIN = src[body_start:i_main], src[j_main:src.rfind("</body>")], src[i_main:j_main]
HTML_CLASS = re.search(r'<html[^>]*class="([^"]*)"', src).group(1)

css = ""
for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', src):
    css += open(os.path.join(ROOT, ".next", href.replace("/_next/", "", 1)), encoding="utf-8").read() + "\n"
def font_face(m):
    bloc = m.group(0)
    garder = "unicode-range:u+00??" in bloc.lower() or not re.search(r"unicode-range", bloc)
    def url(u):
        return f"url({raw_uri(os.path.join(ROOT, '.next', 'static', 'media', u.group(1)))})" if garder else "url(data:font/woff2;base64,)"
    return re.sub(r"url\(/_next/static/media/([\w.-]+)\)", url, bloc)
css = re.sub(r"@font-face\{[^}]*\}", font_face, css)
css += ":root{" + ";".join(re.findall(r"\.__variable_[0-9a-f]+\{([^}]*)\}", css)) + "}\n"

PHOTOS = {f"zz-maquette-carnet-{n}.jpg": (f"couverture-{n}" if n in ("marron", "noir", "gris") else f"fournisseur-{n}")
          for n in ("marron", "noir", "gris", "couleurs", "pile")}
def local_src(m):
    chemin = m.group(2)
    nom = chemin.rsplit("/", 1)[-1]
    if nom in PHOTOS:
        return f'{m.group(1)}="{uri(os.path.join(ASSETS, PHOTOS[nom] + ".jpg"))}"'
    p = os.path.join(PUB, chemin.lstrip("/"))
    if not os.path.exists(p):
        return m.group(0)
    if p.lower().endswith((".jpg", ".jpeg", ".png")) and os.path.getsize(p) > 120_000:
        return f'{m.group(1)}="{uri(p)}"'
    return f'{m.group(1)}="{raw_uri(p)}"'
def next_image(m):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(m.group(1).replace("&amp;", "&")).query)
    return f'src="{q.get("url", [""])[0]}"'
def nettoie(html):
    html = re.sub(r'<button[^>]*>💬 Une question \?</button>', "", html)
    html = re.sub(r'<a[^>]*href="/boutique">🛍️ La boutique</a>', "", html)
    html = re.sub(r'src="(/_next/image\?[^"]+)"', next_image, html)
    html = re.sub(r'\s(?:srcset|srcSet)="[^"]*"', "", html)
    html = re.sub(r'<div class="cf-shot"><img src="https://cdn\.shopify\.com[^"]*"[^>]*/></div>', "", html)
    html = re.sub(r'(src)="(/[^"]+)"', local_src, html)
    return re.sub(r'href="/[^"]*"', 'href="#"', html)
HEADER, FOOTER, MAIN = nettoie(HEADER), nettoie(FOOTER), nettoie(MAIN)
# la capture est faite page ouverte : retirer la fenêtre « Bienvenue » (fond plein écran qui bloquerait les clics)
def sans_popup(html):
    i = html.find('position: fixed; inset: 0px; z-index: 100')
    while i != -1:
        d = html.rfind("<div", 0, i)
        n, j = 0, d
        while True:
            a, c = html.find("<div", j + 1), html.find("</div>", j + 1)
            if a != -1 and a < c: n += 1; j = a
            else:
                if n == 0: html = html[:d] + html[c + 6:]; break
                n -= 1; j = c
        i = html.find('position: fixed; inset: 0px; z-index: 100')
    return html
FOOTER = sans_popup(FOOTER); HEADER = sans_popup(HEADER); MAIN = sans_popup(MAIN)
MAIN = MAIN.replace('class="gallery-bg"', 'class="gallery-bg" id="galmain"', 1)
MAIN = MAIN.replace("Deuxième ligne (facultatif)<", "Deuxième ligne<")
# champ « logo ou dessin » : inséré caché, montré quand on le choisit
PF = nettoie(PHOTO_FIELD).replace('<div class="field">', '<div class="field" id="mq-photo-field" style="display:none">', 1)
MAIN = re.sub(r'(<select id="pf-gravure">.*?</select></div>)', lambda m: m.group(1) + PF, MAIN, count=1, flags=re.S)
MAIN = MAIN.replace('<option value="texte">', '<option value="texte" selected="">', 1)
# l'« aperçu témoin » (plaque) n'a pas de sens : l'aperçu est posé sur la couverture
MAIN = re.sub(r'<div class="engrave-preview">.*?</div></div>', "", MAIN, count=1, flags=re.S)
# 24/10/2026, gérant (reçu Alibaba : 60 carnets, 213,07 € payés port et frais compris = 3,55 € le carnet) : « c'est sept euros
# pour les gravures ». Carnet seul 12,90 € ; gravure de la couverture +7 € ; texte au dos +7 €.
MAIN = MAIN.replace("17,90&nbsp;€", "12,90&nbsp;€")
MAIN = MAIN.replace("Texte à graver (compris dans le prix)", "Texte à graver (+7 €)")
MAIN = MAIN.replace("Texte au dos du carnet (+3 €)", "Texte au dos du carnet (+7 €)")
MAIN = MAIN.replace("<label>Logo ou dessin à graver</label>", "<label>Logo ou dessin à graver (+7 €)</label>")
MAIN = MAIN.replace('<option value="photo">Un logo ou un dessin</option>',
                    '<option value="photo">Un logo ou un dessin</option><option value="sans">Sans gravure (carnet seul)</option>', 1)
MAIN = re.sub(r'(<input id="pf-texte"[^>]*?value=")[^"]*(")', r"\1Camille\2", MAIN, count=1)
assert "17,90" not in MAIN and "(+7 €)" in MAIN and 'value="sans"' in MAIN
COUV = {n: uri(os.path.join(ASSETS, f"couverture-{n}.jpg")) for n in ("marron", "noir", "gris")}
assert "te-line" in MAIN and 'id="pf-texte"' in MAIN and "mq-photo-field" in MAIN

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px;letter-spacing:.02em}
.mq-banner b{color:#e2c67e}
.te-block{position:absolute;transform:translate(-50%,-50%);text-align:center;pointer-events:none;white-space:nowrap;line-height:1.15}
.te-line{display:block}
.te-line2{font-size:.5em;margin-top:.25em;letter-spacing:.04em}
.mq-logo{position:absolute;left:48%;top:40%;width:30%;transform:translate(-50%,-50%);mix-blend-mode:multiply;filter:grayscale(1) contrast(1.6);opacity:.85;pointer-events:none}
.mq-logo.clair{mix-blend-mode:screen;filter:grayscale(1) invert(1) contrast(1.4);opacity:.7}
.mq-photo-ok{display:block;margin-top:8px;font-size:.85rem;color:var(--gold-dark,#a98935);font-weight:600}
'''
JS = r'''
(function(){
  var COUV=__COUV__, ENCRE={marron:'#2c160a',noir:'#c9c2b6',gris:'#2f2f31'};
  var BASE=12.9, GRAV=7, eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={c:'marron',q:1};
  var main=document.getElementById('galmain'), gm=main.parentNode;
  var blk=document.querySelector('.te-block'); if(blk&&blk.parentNode!==gm) gm.appendChild(blk);
  var l1=blk.querySelector('.te-line'); var l2=document.createElement('span'); l2.className='te-line te-line2 '+l1.className.replace('te-line','').trim(); blk.appendChild(l2);
  var t1=document.getElementById('pf-texte'), t2=document.getElementById('pf-texte2'), fs=document.getElementById('pf-police'), dos=document.getElementById('pf-texteDos');
  var gsel=document.getElementById('pf-gravure'), pfield=document.getElementById('mq-photo-field');
  var tFields=[t1,t2,fs].map(function(e){return e&&e.closest('.field')});
  var tot=document.querySelector('.pd-totbox .val'), lead=document.querySelector('.price-lead'), qs=document.querySelector('.qty-stepper span'), qb=document.querySelectorAll('.qty-stepper button');
  var logo=null;
  function cnt(inp){var c=inp&&inp.closest('.field').querySelector('.char-count'); if(c) c.textContent=inp.value.length+'/'+inp.maxLength}
  function maj(){
    var mode=gsel.value||'texte';
    tFields.forEach(function(f){if(f)f.style.display=mode==='texte'?'':'none'}); pfield.style.display=mode==='photo'?'':'none';
    var fnt='fnt-'+(fs?fs.value:'playfair');
    [l1,l2].forEach(function(l){l.className=l.className.replace(/fnt-[\w-]+/g,'').trim()+' '+fnt; l.style.color=ENCRE[st.c]});
    l1.textContent=mode==='texte'?t1.value:''; l2.textContent=mode==='texte'?(t2.value||''):'';
    blk.style.display=mode==='texte'?'':'none';
    if(logo){logo.style.display=mode==='photo'?'':'none'; logo.classList.toggle('clair',st.c==='noir')}
    var px=BASE+((mode==='texte'&&t1.value.trim())||(mode==='photo'&&logo)?GRAV:0)+((dos&&dos.value.trim())?GRAV:0);
    tot.textContent=eur(px*st.q); if(lead) lead.textContent=eur(BASE); qs.textContent=st.q;
    [t1,t2,dos].forEach(cnt);
  }
  // couleurs
  var sw=[].slice.call(document.querySelectorAll('.variant-swatches .variant-swatch'));
  sw.forEach(function(b){b.addEventListener('click',function(){sw.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});b.classList.add('active');b.setAttribute('aria-pressed','true');
    st.c=b.querySelector('.vs-title').textContent.trim().toLowerCase(); main.removeAttribute('srcset'); main.src=COUV[st.c]; blk.style.visibility=''; if(logo)logo.style.visibility=''; maj()})});
  [t1,t2,dos].forEach(function(e){if(e)e.addEventListener('input',maj)}); if(fs)fs.addEventListener('change',maj); gsel.addEventListener('change',maj);
  qb[0].addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()}); qb[1].addEventListener('click',function(){st.q=Math.min(20,st.q+1);maj()});
  // vignettes : une photo du fournisseur cache l'aperçu (il n'a de sens que sur une couverture de face)
  var th=[].slice.call(document.querySelectorAll('.gallery-thumbs button'));
  function montre(b){th.forEach(function(x){x.classList.remove('active')});b.classList.add('active');var s=b.querySelector('img').src;main.removeAttribute('srcset');main.src=s;
    var couv=Object.keys(COUV).filter(function(k){return COUV[k]===s})[0]; if(couv){st.c=couv; sw.forEach(function(x){var on=x.querySelector('.vs-title').textContent.trim().toLowerCase()===couv;x.classList.toggle('active',on)})}
    blk.style.visibility=couv?'':'hidden'; if(logo)logo.style.visibility=couv?'':'hidden'; maj()}
  th.forEach(function(b){b.addEventListener('click',function(){montre(b)})}); if(th[0])th[0].classList.add('active');
  function idx(){return Math.max(0,th.indexOf(document.querySelector('.gallery-thumbs button.active')))}
  var nx=document.querySelector('.gallery-arrow-next'),pv=document.querySelector('.gallery-arrow-prev');
  if(nx)nx.addEventListener('click',function(){montre(th[(idx()+1)%th.length])}); if(pv)pv.addEventListener('click',function(){montre(th[(idx()-1+th.length)%th.length])});
  // logo / dessin : posé sur la couverture, comme une gravure
  var inp=pfield.querySelector('input[type=file]');
  if(inp)inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){
    if(!logo){logo=document.createElement('img');logo.className='mq-logo';logo.alt='';gm.appendChild(logo)} logo.src=r.result;
    var ok=pfield.querySelector('.mq-photo-ok');if(!ok){ok=document.createElement('span');ok.className='mq-photo-ok';inp.closest('.photo-upload').appendChild(ok)}ok.textContent='Logo choisi : '+f.name;
    main.src=COUV[st.c]; maj(); window.scrollTo({top:0,behavior:'smooth'})};r.readAsDataURL(f)});
  [].forEach.call(document.querySelectorAll('img.logo-img,img.footer-logo'),function(l){function h(){if(!l.naturalWidth)l.style.visibility='hidden'}if(l.complete)h();else l.addEventListener('error',h)});
  maj();
})();
'''.replace("__COUV__", json.dumps(COUV))

BANNER = '<div class="mq-banner">MAQUETTE — fiche « Carnet A5 gravé » (carnet seul 12,90 € · chaque gravure +7 €, à valider · couvertures dessinées en attendant vos photos gravées) · <b>rien n\'est en ligne</b></div>'
TITLE = "<title>Carnet A5 gravé — Niv Création (maquette)</title>"
STYLE = f"<style>{css}\n{CSS}</style>"
BODY = f'<div class="{HTML_CLASS}">' + BANNER + HEADER + MAIN + FOOTER + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
open(os.path.join(OUT, "carnet-a5.html"), "w", encoding="utf-8").write(full)
print("ok", len(full) // 1024, "Ko")
