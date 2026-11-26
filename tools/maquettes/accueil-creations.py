#!/usr/bin/env python3
"""Maquette « les outils de création sur l'accueil » (26/11/2026, gérant : « tout ce que j'ai mis en place pour les trucs de
création, est-ce que t'arrives à faire un truc joli pour la page d'accueil ? j'en ai d'autres plus tard »). Part du VRAI accueil
en ligne (mêmes feuilles de style, photos en data URI, scripts retirés) et y pose UN bloc, encadré en pointillé :
« Créez-le vous-même, nous le gravons » = une carte par outil de création EN LIGNE (support de téléphone, plaque et porte-clés
musique), exemples qui défilent, « à partir de » lu dans la page, bouton « Créer le mien ». Juste après les marque-pages.
Le bouton « Voir avec d'autres créations » de la barre montre le bloc avec quatre cartes (exemple pour plus tard).
Rien n'est touché dans le site.
Usage : python3 tools/maquettes/accueil-creations.py <accueil.html> <dossier css> <dossier /api/img> <sortie.html>
  accueil.html = curl https://nivcreation.fr/ · dossier css = ses feuilles /_next/static/css/*.css
  dossier /api/img = les photos /api/img/<id> de la page, un fichier par id."""
import base64, html, io, os, re, sys, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC, CSSDIR, IMGDIR, SORTIE = sys.argv[1:5]
src = open(SRC, encoding="utf-8").read()

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

def prix(slug, defaut):
    m = re.search(r'href="https://nivcreation\.fr/produit/' + slug + r'".*?class="uc-price">dès (?:<!-- -->)?([^<]+)<', src, re.S)
    return m.group(1).strip() if m else defaut
# prix lus dans la page ; à défaut ceux de la fiche en ligne le 26/11/2026 (node tools/prix-fiche.mjs)
P_SUP = prix("support-telephone-bois-grave", "15,90 €"); P_MUS = prix("plaque-musique-a-scanner", "14,90 €")

def photo(chemin, w=760, q=80):
    """Photo mise au format 4 / 3 sans rien couper : une image carrée est élargie avec son propre fond (bords étirés)."""
    im = Image.open(os.path.join(ROOT, chemin)).convert("RGBA")
    if chemin.endswith(".webp"):                      # aperçu détouré d'un autre créateur : posé au milieu d'un fond sable
        fond = Image.new("RGBA", (800, 600), "#f1e6cf"); im.thumbnail((520, 500), Image.LANCZOS)
        fond.paste(im, ((800 - im.width) // 2, (600 - im.height) // 2), im); im = fond
    im = im.convert("RGB")
    if abs(im.width / im.height - 4 / 3) > 0.02 and im.width <= im.height * 4 / 3:
        W = round(im.height * 4 / 3); c = Image.new("RGB", (W, im.height)); x = (W - im.width) // 2
        c.paste(im.crop((0, 0, 6, im.height)).resize((x + 1, im.height)), (0, 0))
        c.paste(im.crop((im.width - 6, 0, im.width, im.height)).resize((W - x - im.width + 1, im.height)), (x + im.width - 1, 0))
        c.paste(im, (x, 0)); im = c
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

FLECHE = '<svg class="mxic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ETOILE = '<svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13"><path fill="currentColor" d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>'

# Une entrée par outil de création EN LIGNE. Pour en ajouter un plus tard : une entrée de plus, rien d'autre.
CREATIONS = [
    dict(slug="support-telephone-bois-grave", nom="Support de téléphone en bois", prix=P_SUP, bouton="Créer le mien",
         texte="La forme, la taille, puis votre gravure : texte, dessin, photo, lettre fleurie ou motif ajouré.",
         vues=[("Votre photo", "public/produits/support-telephone-photo.jpg", "Support de téléphone en bois gravé d'une photo de couple"),
               ("Lettre fleurie", "public/produits/support-telephone-lettre.jpg", "Support de téléphone en bois gravé d'une lettre fleurie")]),
    dict(slug="plaque-musique-a-scanner", nom="Plaque et porte-clés musique à scanner", prix=P_MUS, bouton="Créer la mienne",
         texte="Collez le lien de votre chanson : nous la gravons en QR code sur le bois, avec votre titre et même votre photo.",
         vues=[("Avec photo", "public/produits/musique/exemple-photo.jpg", "Plaque en bois gravée d'une photo de couple, d'un QR code et de « Notre chanson »"),
               ("Plaque", "public/produits/musique/exemple-plaque.jpg", "Plaque en bois gravée d'un QR code, « Scannez pour écouter »"),
               ("Carte", "public/produits/musique/exemple-carte.jpg", "Carte musique en bois gravée d'un QR code et d'une note de musique"),
               ("Porte-clés", "public/produits/musique/exemple-porte-cles.jpg", "Porte-clés en bois gravé d'un QR code")]),
]
# Seulement pour le bouton « Voir avec d'autres créations » de la barre : deux créateurs enregistrés, PAS en ligne.
PLUS_TARD = [
    dict(nom="Arbre de vie à prénoms", texte="Exemple pour plus tard : un outil enregistré, pas encore en vente.",
         vues=[("", "docs/maquettes/assets/creez-le-votre/arbre.webp", "Arbre de vie en bois découpé, un prénom dans chaque cœur")]),
    dict(nom="Maisonnette en bois", texte="Exemple pour plus tard : un outil enregistré, pas encore en vente.",
         vues=[("", "docs/maquettes/assets/creez-le-votre/maison.webp", "Maisonnette en bois découpé")]),
]

def carte(c, exemple=False):
    lien = "https://nivcreation.fr/produit/" + c["slug"] if not exemple else ""
    imgs = "".join('<img' + (' class="on"' if i == 0 else ' loading="lazy"') + f' src="{photo(v[1])}" alt="{html.escape(v[2])}"/>' for i, v in enumerate(c["vues"]))
    scene = f'<a class="crz-scene" href="{lien}">{imgs}</a>' if lien else f'<div class="crz-scene">{imgs}</div>'
    onglets = ""
    if len(c["vues"]) > 1:
        onglets = '<div class="crz-vues" role="group" aria-label="Exemples">' + "".join(
            f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}">{html.escape(v[0])}</button>' for i, v in enumerate(c["vues"])) + "</div>"
    pied = (f'<div class="crz-pied"><p class="crz-prix"><span>à partir de</span><b>{c["prix"]}</b></p>'
            f'<a class="mxbtn mxbtn-gold" href="{lien}"><span>{c["bouton"]}</span>{FLECHE}</a></div>') if lien else \
           '<div class="crz-pied"><span class="crz-ex">Exemple · pas en ligne</span></div>'
    return ('<article class="crz-carte' + (' crz-plus" hidden' if exemple else '"') + f'>{scene}'
            f'<div class="crz-corps"><h3>{html.escape(c["nom"])}</h3><p>{html.escape(c["texte"])}</p>{onglets}{pied}</div></article>')

BLOC = f'''<section class="crz mq-new" id="mq-1" aria-labelledby="t-crz"><span class="mq-tag">Nouveau bloc</span>
<div class="crz-in">
  <div class="crz-tete">
    <div>
      <span class="crz-pill">{ETOILE}À vous de créer</span>
      <h2 id="t-crz">Créez-le vous-même, <em>nous le gravons</em></h2>
      <p>Vous composez votre cadeau à l'écran, il s'affiche tel qu'il sera gravé, puis nous le fabriquons dans notre atelier.</p>
    </div>
    <ol class="crz-pas">
      <li><b>Vous créez</b><span>forme, texte, photo</span></li>
      <li><b>Vous voyez l'aperçu</b><span>avant de commander</span></li>
      <li><b>Nous gravons</b><span>dans notre atelier</span></li>
    </ol>
  </div>
  <div class="crz-liste" data-n="{len(CREATIONS)}">{"".join(carte(c) for c in CREATIONS)}{"".join(carte(c, True) for c in PLUS_TARD)}</div>
</div></section>'''
i = src.index('class="mpb'); i = src.index("</section>", i) + len("</section>")
src = src[:i] + BLOC + src[i:]

BARRE = '''<div class="mq-bar" role="region" aria-label="Maquette"><div class="mq-in"><b>Maquette, rien n'est en ligne</b>
<span>Un nouveau bloc, encadré en pointillé, juste après les marque-pages.</span>
<span class="mq-go"><button type="button" data-go="mq-1">Aller au bloc</button><button type="button" id="mq-plus" aria-pressed="false">Voir avec d'autres créations (exemple pour plus tard)</button></span></div></div>'''
src = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + BARRE, src, 1)

CSS = r'''
.mq-bar{background:#1a1206;color:#d9ccb0;font:400 .82rem/1.45 Inter,system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px)}
.mq-in{display:flex;gap:6px 14px;flex-wrap:wrap;align-items:center;padding:8px max(16px,env(safe-area-inset-left,0px));max-width:1300px;margin:0 auto}.mq-in b{color:#e2c67e}
.mq-go{display:flex;gap:6px;flex-wrap:wrap}
.mq-go button{font:600 .78rem/1.2 Inter,system-ui,sans-serif;color:#1a1206;background:#e2c67e;border:0;border-radius:999px;padding:8px 12px;cursor:pointer;text-align:left}
.mq-go button[aria-pressed="true"]{background:#fff}
.mq-go button:focus-visible{outline:2px solid #fff;outline-offset:2px}
.rv{opacity:1!important;transform:none!important}
.mq-new{position:relative;outline:2px dashed #b3261e;outline-offset:6px;scroll-margin-top:90px}
.mq-tag{position:absolute;top:10px;right:10px;z-index:5;background:#b3261e;color:#fff;font:700 .66rem/1 Inter,system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:6px 9px;border-radius:999px;white-space:nowrap}
/* ── le bloc des outils de création : clair, sur un fond quadrillé (la feuille de travail de l'atelier) ── */
.mx .crz{margin:28px clamp(16px,4.5vw,72px);border-radius:24px;color:#1a1206;border:1px solid rgba(201,162,75,.45);overflow:hidden;
  background:linear-gradient(rgba(124,97,32,.055) 1px,transparent 1px) 0 0/100% 26px,linear-gradient(90deg,rgba(124,97,32,.055) 1px,transparent 1px) 0 0/26px 100%,linear-gradient(135deg,#f5ead4 0%,#fbf7ee 52%,#f2e4c6 100%)}
.mx .crz-in{--pad:clamp(20px,5vw,60px);padding:clamp(30px,5vw,60px) var(--pad);max-width:1180px;margin:0 auto}
.mx .crz-tete{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px clamp(24px,5vw,64px);align-items:end;margin-bottom:clamp(22px,3.4vw,36px)}
.mx .crz-pill{display:inline-flex;align-items:center;gap:7px;font-weight:600;font-size:.74rem;line-height:1;letter-spacing:.08em;text-transform:uppercase;color:#7c6120;background:rgba(255,255,255,.7);border:1px solid rgba(124,97,32,.4);border-radius:999px;padding:7px 12px}
.mx .crz h2{font-family:var(--font-display),"Playfair Display",serif;font-weight:600;font-size:clamp(1.7rem,3.4vw,2.6rem);line-height:1.12;margin:16px 0 12px;color:#1a1206;text-wrap:balance}
.mx .crz h2 em{color:#8a6a1f}
.mx .crz-tete p{margin:0;color:#4b3f2a;line-height:1.6;max-width:52ch}
.mx .crz-pas{list-style:none;counter-reset:pas;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.mx .crz-pas li{counter-increment:pas;position:relative;padding-top:42px;font-size:.84rem;line-height:1.35;color:#5a4c33}
.mx .crz-pas li::before{content:counter(pas);position:absolute;left:0;top:0;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#1a1206;color:#e2c67e;font-weight:700;font-size:.9rem}
.mx .crz-pas li::after{content:"";position:absolute;left:40px;right:-2px;top:16px;border-top:1px dashed rgba(124,97,32,.55)}
.mx .crz-pas li:last-child::after{display:none}
.mx .crz-pas b{display:block;color:#1a1206;font-size:.92rem}
.mx .crz-liste{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(16px,2.4vw,28px)}
.mx .crz-liste.crz-4{grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.mx .crz-carte{display:flex;flex-direction:column;min-width:0;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 14px 34px rgba(60,40,10,.13);border:1px solid rgba(26,18,6,.07)}
.mx .crz-scene{position:relative;display:block;aspect-ratio:4/3;background:#f1e6cf;overflow:hidden}
.mx .crz-scene img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .7s ease,transform 6s ease-out;transform:scale(1.04)}
.mx .crz-scene img.on{opacity:1;transform:none}
.mx .crz-corps{display:flex;flex-direction:column;gap:10px;flex:1;padding:18px 20px 20px}
.mx .crz-corps h3{font-family:var(--font-display),"Playfair Display",serif;font-weight:600;font-size:1.28rem;line-height:1.2;margin:0;color:#1a1206;text-wrap:balance}
.mx .crz-corps>p{margin:0;font-size:.93rem;line-height:1.55;color:#4b3f2a}
.mx .crz-vues{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
.mx .crz-vues button{font-family:inherit;font-weight:600;font-size:.78rem;line-height:1.2;color:#5a4c33;background:#f6efe1;border:1px solid rgba(124,97,32,.28);border-radius:999px;padding:9px 13px;min-height:38px;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.mx .crz-vues button[aria-pressed="true"]{background:#1a1206;border-color:#1a1206;color:#e2c67e}
.mx .crz-vues button:focus-visible{outline:2px solid #a98935;outline-offset:2px}
.mx .crz-pied{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 14px;margin-top:auto;padding-top:8px}
.mx .crz-corps .crz-prix{display:flex;align-items:baseline;gap:7px;margin:0}.mx .crz-prix span{font-size:.82rem;color:#6b5a3a}.mx .crz-prix b{font-size:1.4rem;color:#7c6120;font-variant-numeric:tabular-nums}
.mx .crz-ex{font-weight:700;font-size:.68rem;letter-spacing:.05em;text-transform:uppercase;color:#b3261e;border:1px dashed #b3261e;border-radius:999px;padding:6px 10px}
.mx .crz-4 .crz-corps{padding:16px 16px 18px}.mx .crz-4 .crz-corps h3{font-size:1.12rem}.mx .crz-4 .crz-pied .mxbtn{width:100%;justify-content:center}
@media (prefers-reduced-motion:reduce){.mx .crz-scene img{transition:none;transform:none}}
@media (max-width:1040px){.mx .crz-liste.crz-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:860px){.mx .crz-tete{grid-template-columns:1fr;align-items:start}}
/* téléphone : les cartes se font glisser du doigt, la suivante dépasse à droite */
@media (max-width:700px){
  .mx .crz{margin:22px 16px;border-radius:20px}
  .mx .crz-in{--pad:18px;padding-top:28px;padding-bottom:26px}
  .mx .crz-liste,.mx .crz-liste.crz-4{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 calc(-1*var(--pad));padding:4px var(--pad) 14px;scroll-padding-left:var(--pad);-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .mx .crz-liste::-webkit-scrollbar{display:none}
  .mx .crz-carte{flex:0 0 86%;scroll-snap-align:start}
  .mx .crz-corps{padding:16px 16px 18px}.mx .crz-corps h3{font-size:1.18rem}
  .mx .crz-pas li::after{display:none}
  .mx .crz-pas li{font-size:.78rem}.mx .crz-pas b{font-size:.84rem}
}
'''
JS = '''<script>(function(){
var calme=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll(".crz-carte").forEach(function(c,n){
  var im=c.querySelectorAll(".crz-scene img"),bt=c.querySelectorAll(".crz-vues button"),i=0,t=null;
  if(im.length<2)return;
  function voir(k){i=k;im.forEach(function(e,j){e.classList.toggle("on",j===k);});bt.forEach(function(e,j){e.setAttribute("aria-pressed",j===k?"true":"false");});}
  function stop(){if(t){clearInterval(t);t=null;}}
  bt.forEach(function(b,k){b.addEventListener("click",function(){stop();voir(k);});});
  if(!calme)setTimeout(function(){t=setInterval(function(){voir((i+1)%im.length);},3400);},n*1700);
});
var plus=document.getElementById("mq-plus"),liste=document.querySelector(".crz-liste");
if(plus)plus.addEventListener("click",function(){var on=plus.getAttribute("aria-pressed")!=="true";plus.setAttribute("aria-pressed",on?"true":"false");
  plus.textContent=on?"Revenir aux créations en ligne":"Voir avec d\u2019autres créations (exemple pour plus tard)";
  liste.classList.toggle("crz-4",on);document.querySelectorAll(".crz-plus").forEach(function(e){e.hidden=!on;});
  document.getElementById("mq-1").scrollIntoView({behavior:"smooth",block:"center"});});
document.querySelectorAll("[data-go]").forEach(function(b){b.addEventListener("click",function(){var e=document.getElementById(b.getAttribute("data-go"));if(e)e.scrollIntoView({behavior:"smooth",block:"center"});});});
document.addEventListener("click",function(e){var a=e.target.closest("a");if(a&&(!a.closest(".mq-new")||!a.getAttribute("href")))e.preventDefault();});
})();</script>'''

# la page publiée : pas de <html>/<head>/<body> à nous (l'outil les ajoute) ; classes du <html> et du <body> reportées
h = re.search(r"<html[^>]*class=\"([^\"]*)\"", src); b = re.search(r"<body[^>]*class=\"([^\"]*)\"", src)
corps = re.search(r"<body[^>]*>(.*)</body>", src, re.S).group(1)
page = ('<title>Accueil outils de création</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        f"<style>{css}\n{CSS}\nbody{{background:#fbf7ee;color:#1a1206}}</style>\n"
        f'<div class="{(h.group(1) if h else "")} {(b.group(1) if b else "")}">{corps}</div>\n{JS}\n')
open(SORTIE, "w", encoding="utf-8").write(page)
print(SORTIE, round(len(page) / 1e6, 2), "Mo ·", len(cache), "photos · prix", P_SUP, P_MUS)
