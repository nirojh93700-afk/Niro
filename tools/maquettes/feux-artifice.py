#!/usr/bin/env python3
"""Maquette « feu d'artifice de produits » dans les marges des grands écrans (demande du gérant, 13/10/2026 :
« sur l'ordinateur, à gauche et à droite il y a de l'espace… comme les feux d'artifice, des photos des produits qui
montent tout doucement, après elles explosent en étoiles »).
Part du VRAI accueil (capture `curl localhost:3140/` après `npm run build` + `next start`) : mêmes feuilles de style,
polices intégrées, photos locales en data URI, scripts retirés. Seul l'effet est ajouté : une toile fixe qui ne dessine
QUE dans les marges, hors de la largeur du site (1300 px), et qui ne bloque jamais un clic.
Usage : python3 tools/maquettes/feux-artifice.py <accueil-src.html> <sortie.html>
Rien n'est touché dans le site."""
import base64, html, io, json, os, re, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
src = open(sys.argv[1], encoding="utf-8").read()
OUT = sys.argv[2]

def uri(path, w=380, q=62):
    im = Image.open(path).convert("RGB")
    if im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
def raw(path, mime):
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()
def rond(path, s=160):
    """Photo carrée recadrée au centre, en PNG rond (fond transparent)."""
    im = Image.open(path).convert("RGB"); c = min(im.size)
    im = im.crop(((im.width - c) // 2, (im.height - c) // 2, (im.width + c) // 2, (im.height + c) // 2)).resize((s, s), Image.LANCZOS)
    m = Image.new("L", (s, s), 0); ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
    im.putalpha(m); b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

# 1. la vraie page : scripts retirés, feuilles de style et polices intégrées
src = re.sub(r"<script\b[^>]*>.*?</script>", "", src, flags=re.S)
src = re.sub(r'<link[^>]+rel="preload"[^>]*>', "", src)
css = ""
for f in sorted(set(re.findall(r'/_next/static/css/([a-f0-9]+\.css)', src))):
    c = open(os.path.join(ROOT, ".next", "static", "css", f), encoding="utf-8").read()
    c = re.sub(r'url\((/_next/static/media/[^)]+\.woff2)\)', lambda m: "url(" + raw(os.path.join(ROOT, ".next", m.group(1)[len("/_next/"):]), "font/woff2") + ")", c)
    css += c + "\n"
src = re.sub(r'<link[^>]+/_next/static/css/[^>]+>', "", src)
src = src.replace("</head>", f"<style>{css}</style></head>", 1)

# 2. photos : locales en data URI ; logo = copie du logo du site ; photos du CDN (injoignable d'ici) → fond crème
LOGO = uri(os.path.join(ROOT, "docs", "maquettes", "assets", "logo-source.jpg"), 900, 80)
src = re.sub(r'src="https://cdn\.shopify\.com/[^"]*IMG_6758[^"]*"', f'src="{LOGO}"', src)
VIDE = "data:image/svg+xml;base64," + base64.b64encode(b'<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#f3e8d3"/></svg>').decode()
src = re.sub(r'src="https://cdn\.shopify\.com/[^"]*"', f'src="{VIDE}"', src)
src = re.sub(r'srcSet="[^"]*"|srcset="[^"]*"', "", src)
cache = {}
def local(m):
    p = html.unescape(m.group(1)).split("?")[0]
    fp = os.path.join(ROOT, "public", p.lstrip("/"))
    if not os.path.exists(fp): return m.group(0)
    if p not in cache: cache[p] = uri(fp)
    return f'src="{cache[p]}"'
src = re.sub(r'src="(/produits/[^"]+)"', local, src)
src = re.sub(r'src="(/instagram-qr\.png)"', lambda m: f'src="{raw(os.path.join(ROOT, "public", "instagram-qr.png"), "image/png")}"', src)

# 3. les fusées = des pièces GRAVÉES (règle : jamais un produit vierge)
GRAVES = ["collier-3coeurs-1.jpg", "verre_a_whisky_exemple_face.jpg", "cristal-v-femme.jpg", "collier-coeur-grave-1.jpg",
          "carafe_gravee.jpg", "puzzle-savane.jpg", "collier-coeur-plaques-1.jpg", "verre_vin_exemple_dale.jpg",
          "bracelet-cordon-plaque-4.jpg", "cristal-h-couple.jpg", "couverts_enfants_ex_prenom.jpg", "bracelet-femme-acier-porte.jpg"]
PHOTOS = [rond(os.path.join(ROOT, "public", "produits", f)) for f in GRAVES]

BAR = '''<div class="fx-bar" role="region" aria-label="Maquette">
  <div class="fx-in"><b>Maquette, rien n’est en ligne</b>
    <div class="fx-tabs" role="group" aria-label="Quantité"><button type="button" class="on" data-r="discret">Discret</button><button type="button" data-r="fete">Plus de fusées</button></div>
    <button type="button" id="fxDemo" class="fx-btn" aria-pressed="false">Voir comme sur un très grand écran</button>
    <button type="button" id="fxMore" class="fx-btn fx-more" aria-expanded="false">Ce qui change</button></div>
  <ul class="fx-notes" id="fxNotes" hidden>
    <li><b>Où</b> : seulement dans les marges vides à gauche et à droite, quand l’écran est assez large (à partir de 1 560 px environ). Sur téléphone, tablette et portable : rien ne change.</li>
    <li><b>Quoi</b> : une photo ronde d’une de nos pièces gravées monte doucement avec une traînée dorée, s’arrête, grandit un instant puis éclate en étoiles or et crème qui retombent. Une fusée à la fois, de chaque côté à tour de rôle.</li>
    <li><b>Jamais gênant</b> : l’effet ne passe jamais sur le contenu, ne bloque aucun clic, s’arrête quand l’onglet n’est pas regardé, et ne joue pas du tout pour les personnes qui ont demandé moins d’animations à leur ordinateur.</li>
    <li><b>Partout</b> : à la mise en ligne, l’effet peut vivre sur toutes les pages, ou seulement l’accueil. Les photos peuvent être des pièces choisies (comme ici) ou les nouveautés du catalogue.</li>
    <li>« Voir comme sur un très grand écran » rétrécit la page pour faire apparaître les marges si votre fenêtre est plus étroite. Les photos hébergées sur le CDN sont remplacées par un fond crème dans l’aperçu.</li>
  </ul>
</div>'''

FX_CSS = '''
.fx-bar{position:relative;z-index:90;background:#1a1206;color:#d9ccb0;font:400 .82rem/1.4 Inter,system-ui,sans-serif}
.fx-in{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:8px clamp(16px,4.5vw,72px);max-width:1300px;margin:0 auto}
.fx-in>b{color:#e2c67e;font-weight:600}.fx-tabs{display:flex;gap:6px}
.fx-tabs button,.fx-btn{padding:6px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.4);color:#e2c67e;font:600 .82rem/1.4 Inter,system-ui,sans-serif;background:none;border:0;cursor:pointer}
.fx-tabs button.on,.fx-btn[aria-pressed="true"]{background:#c9a24b;color:#1a1206;box-shadow:none}.fx-more{margin-left:auto}
.fx-tabs button:focus-visible,.fx-btn:focus-visible{outline:2px solid #e2c67e;outline-offset:2px}
.fx-notes{margin:0 auto;padding:4px clamp(16px,4.5vw,72px) 16px calc(clamp(16px,4.5vw,72px) + 18px);max-width:1300px;line-height:1.55}
.fx-notes li{margin:6px 0}.fx-notes b{color:#e2c67e;font-weight:600}
#fxCanvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:40}
#fxSite{transform-origin:top center}
.rv{opacity:1!important;transform:none!important}
@media (max-width:640px){.fx-in{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:8px;padding:7px 12px}.fx-in>*{white-space:nowrap;flex:none}.fx-more{margin-left:0}}
'''

FX_JS = r'''
(function(){
var PHOTOS=%s, WRAP=1300, GAP=24;
var cv=document.getElementById('fxCanvas'), ctx=cv.getContext('2d'), site=document.getElementById('fxSite');
var imgs=PHOTOS.map(function(s){var i=new Image();i.src=s;return i});
var reduit=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var rythme='discret', zoom=1, fusees=[], etincelles=[], cote=0, prochaine=0, idx=0, dpr=1, W=0, H=0;
function taille(){dpr=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
function marge(){return (W-WRAP*zoom)/2-GAP}
function lancer(t){
  var m=marge(); if(m<110) return;
  var gauche=(cote++%%2===0), x=gauche? m*(.25+Math.random()*.5) : W-m*(.25+Math.random()*.5);
  fusees.push({x:x, x0:x, y:H+40, cible:H*(.22+Math.random()*.3), img:imgs[idx++%%imgs.length], t0:t, dur:3400+Math.random()*900, r:Math.min(30,m*.16), phase:Math.random()*6, trace:[], etat:'monte'});
}
function eclater(f){
  var n=rythme==='fete'?46:34;
  for(var i=0;i<n;i++){var a=Math.PI*2*i/n+Math.random()*.2, v=1.1+Math.random()*1.9;
    etincelles.push({x:f.x,y:f.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.3,vie:1,dec:.006+Math.random()*.006,c:(function(r){return r<.55?'201,162,75':r<.8?'226,198,126':'169,137,53'})(Math.random()),s:1.2+Math.random()*1.8,etoile:Math.random()<.35})}
}
function etoile(x,y,r){ctx.beginPath();for(var i=0;i<8;i++){var a=Math.PI/4*i,rr=i%%2?r*.38:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill()}
function frame(t){
  requestAnimationFrame(frame);
  if(document.hidden) return;
  ctx.clearRect(0,0,W,H);
  var m=marge();
  if(m>=110 && t>prochaine && fusees.length<(rythme==='fete'?3:2)){lancer(t);prochaine=t+(rythme==='fete'?1500:3200)+Math.random()*900}
  ctx.save();ctx.beginPath();ctx.rect(0,0,Math.max(0,m),H);ctx.rect(W-Math.max(0,m),0,Math.max(0,m),H);ctx.clip();
  fusees=fusees.filter(function(f){
    var p=Math.min(1,(t-f.t0)/f.dur), e=1-Math.pow(1-p,3);
    if(f.etat==='monte'){
      f.y=H+40-(H+40-f.cible)*e; f.x=f.x0+Math.sin(t/600+f.phase)*6*(1-p);
      f.trace.push([f.x,f.y]); if(f.trace.length>26) f.trace.shift();
      for(var i=0;i<f.trace.length;i++){var k=i/f.trace.length;ctx.fillStyle='rgba(226,198,126,'+(k*.45)+')';ctx.beginPath();ctx.arc(f.trace[i][0],f.trace[i][1]+f.r*.8,1+k*2.2,0,7);ctx.fill()}
      if(p>=1){f.etat='fleurit';f.t1=t}
    }
    var g=f.etat==='fleurit'?Math.min(1,(t-f.t1)/520):0, r=f.r*(1+g*.55), a=f.etat==='fleurit'?1-Math.max(0,(g-.6)/.4):1;
    ctx.save();ctx.globalAlpha=a;ctx.shadowColor='rgba(226,198,126,.85)';ctx.shadowBlur=14+g*18;
    ctx.beginPath();ctx.arc(f.x,f.y,r+2.5,0,7);ctx.fillStyle='#c9a24b';ctx.fill();ctx.shadowBlur=0;
    if(f.img.complete){ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.clip();ctx.drawImage(f.img,f.x-r,f.y-r,r*2,r*2)}
    ctx.restore();
    if(f.etat==='fleurit'&&g>=1){eclater(f);return false}
    return true;
  });
  etincelles=etincelles.filter(function(s){
    s.x+=s.vx;s.y+=s.vy;s.vy+=.022;s.vx*=.99;s.vie-=s.dec;
    if(s.vie<=0) return false;
    ctx.fillStyle='rgba('+s.c+','+Math.max(0,s.vie)+')';
    if(s.etoile) etoile(s.x,s.y,s.s*2.4); else {ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,7);ctx.fill()}
    return true;
  });
  ctx.restore();
}
taille();addEventListener('resize',taille);
if(!reduit) requestAnimationFrame(frame);
document.querySelectorAll('.fx-tabs button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.fx-tabs button').forEach(function(x){x.classList.toggle('on',x===b)});rythme=b.dataset.r;prochaine=0})});
document.getElementById('fxDemo').addEventListener('click',function(){
  var on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',on);
  zoom=on?Math.min(1,innerWidth/2300):1; site.style.zoom=zoom; prochaine=0;
});
var more=document.getElementById('fxMore');more.addEventListener('click',function(){var n=document.getElementById('fxNotes');n.hidden=!n.hidden;more.setAttribute('aria-expanded',!n.hidden)});
})();
''' % json.dumps(PHOTOS)

body_open = src.find(">", src.find("<body")) + 1
body_close = src.rfind("</body>")
page = (src[:body_open] + BAR + '<canvas id="fxCanvas" aria-hidden="true"></canvas><div id="fxSite">' + src[body_open:body_close]
        + "</div><script>" + FX_JS + "</script>" + src[body_close:])
page = page.replace("</head>", f"<style>{FX_CSS}</style><title>Feu d’artifice de produits</title></head>", 1)
page = re.sub(r"<title>(?!Feu)[^<]*</title>", "", page, count=1)
open(OUT, "w", encoding="utf-8").write(page)
print(OUT, round(os.path.getsize(OUT) / 1e6, 2), "Mo")
