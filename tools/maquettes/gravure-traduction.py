#!/usr/bin/env python3
"""Maquette « Gravure traduite dans la langue de la cliente » (06/11/2026, gérant : « ils tapent le texte, ils choisissent
la langue, ça traduit automatiquement et ça s'affiche sur le verre… fais la maquette »).

La fiche du verre à vin est capturée telle quelle EN LOCAL (`npx next start -p 3140` + curl), ses feuilles de style
intégrées, scripts retirés ; l'étape 2 « Votre texte » du parcours reçoit un menu « Dans quelle langue graver ? »
(Français · Tamoul · Arabe · Hébreu · Chinois). Le texte tapé en français est traduit (phrases connues = dictionnaire
relu ; autre texte = Claude en direct par la capacité `sample` de l'artifact, si elle est accordée) et posé sur la
GRANDE PHOTO du verre vierge, dans le cadre de gravure de la fiche (`engrave.box` lu dans la capture), avec une police
Noto de la langue. Les deux textes (tapé / gravé) s'affichent côte à côte, une case « J'ai vérifié la traduction » doit
être cochée avant l'ajout au panier, et la cliente peut aussi coller son texte déjà écrit dans sa langue.
Les PRIX sont LUS dans la capture (prix du 36 / 47 cl, supplément texte). Rien n'est modifié sur le site.

Usage : python3 tools/maquettes/gravure-traduction.py <vin-src.html> <dossier des css> <sortie.html> <etape2.json>
(etape2.json = l'étape « Écrivez votre texte » du SITE, capturée par Playwright après un clic sur « Mon propre texte » :
 elle est reprise TELLE QUELLE, seul le bloc « Langue de la gravure » est ajouté juste sous le champ du texte — gérant, 06/11 :
 « tu laisses comme c'est, tu touches pas, juste en dessous du texte tu mets les langues, l'anglais aussi, dans l'ordre alphabétique »)
"""
import base64, html as H, io, json, os, re, sys
from urllib.parse import unquote
from PIL import Image

SRC, CSSDIR, OUT, ETAPE2 = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public")
h = open(SRC, encoding="utf-8").read()
brut = h.replace('\\"', '"')

# ---------- prix et cadres de gravure lus dans la page ----------
def prix(taille):
    m = re.search(r'"taille":"%s","title":"À l\'unité","price":([0-9.]+)' % taille, brut)
    if not m: sys.exit("prix %s cl introuvable" % taille)
    return float(m.group(1))
P36, P47 = prix("36"), prix("47")
m = re.search(r'"engravingPricing":\{"textKeys":\[[^\]]*\],"textExtra":([0-9.]+)', brut)
if not m: sys.exit("supplément texte introuvable")
TXT = float(m.group(1))
boxes = re.findall(r'"engrave":\{"box":(\{[^}]*\})[^}]*"maxWidthFrac":([0-9.]+)', brut)
if len(boxes) < 2: sys.exit("cadres de gravure introuvables")
# le 1er cadre suit l'option 47 cl, le 2e est celui du produit (36 cl)
BOX47, BOX36 = (json.loads(boxes[0][0]), float(boxes[0][1])), (json.loads(boxes[1][0]), float(boxes[1][1]))
print("Prix lus : 36 cl %.2f · 47 cl %.2f · texte en plus %.2f · cadres %s / %s" % (P36, P47, TXT, BOX36, BOX47))
def eur(x): return ("%.2f" % x).replace(".", ",") + " €"

# ---------- page : scripts retirés, css intégrées, images en data URI ----------
h = re.sub(r"<script\b.*?</script>", "", h, flags=re.S)
h = re.sub(r"<link[^>]+(preload|modulepreload|prefetch)[^>]*>", "", h)
def css_inline(m):
    css = open(os.path.join(CSSDIR, os.path.basename(m.group(1))), encoding="utf-8").read()
    return "<style>%s</style>" % re.sub(r"url\(/_next/static/media/[^)]+\)", "none", css)
h = re.sub(r'<link rel="stylesheet" href="(/_next/static/css/[^"]+)"[^>]*>', css_inline, h)
cache = {}
def uri(path, w):
    k = (path, w)
    if k not in cache:
        im = Image.open(path).convert("RGB"); im.thumbnail((w, w))
        b = io.BytesIO(); im.save(b, "JPEG", quality=74)
        cache[k] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    return cache[k]
def img_src(m):
    s = H.unescape(m.group(1))
    if s.startswith("/_next/image?url="): s = unquote(s.split("url=", 1)[1].split("&", 1)[0])
    if s.startswith("/"):
        p = os.path.join(PUB, s.lstrip("/"))
        if os.path.exists(p) and not p.endswith(".svg"):
            try: return 'src="%s"' % uri(p, 900 if "gallery-bg" in m.string[max(0, m.start()-120):m.start()] else 520)
            except Exception: pass
    return 'src=""'
h = re.sub(r'src="([^"]+)"', img_src, h)
h = re.sub(r'\s(srcSet|srcset)="[^"]*"', "", h)
VIERGE36 = uri(os.path.join(PUB, "produits/verre_vin_vierge.jpg"), 900)
VIERGE47 = uri(os.path.join(PUB, "produits/verre_vin_47_vierge.jpg"), 900)

# ---------- langues, écritures, phrases connues ----------
LANGS = [("en", "Anglais", "", "ltr"), ("ar", "Arabe", "'Noto Naskh Arabic',serif", "rtl"),
         ("zh", "Chinois", "'Noto Serif SC',serif", "ltr"), ("fr", "Français", "", "ltr"),
         ("he", "Hébreu", "'Noto Serif Hebrew',serif", "rtl"), ("ta", "Tamoul", "'Noto Serif Tamil',serif", "ltr")]
assert [n for _, n, _, _ in LANGS] == sorted([n for _, n, _, _ in LANGS], key=lambda x: x.replace("É", "E")), "ordre alphabétique"
FONTS = [("playfair", "Playfair Display", "'Playfair Display',serif"), ("cinzel", "Cinzel", "Cinzel,serif"),
         ("cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"), ("montserrat", "Montserrat", "Montserrat,sans-serif"),
         ("inter", "Inter", "Inter,sans-serif"), ("great-vibes", "Great Vibes", "'Great Vibes',cursive"),
         ("allura", "Allura", "Allura,cursive"), ("pacifico", "Pacifico", "Pacifico,cursive")]
# phrases relues (rapport « Marché tamoul » + images réseaux du 06/11) ; tout le reste = traduction en direct
PHRASES = {
  "joyeux anniversaire": {"en": "Happy birthday", "ta": "பிறந்தநாள் வாழ்த்துகள்", "ar": "عيد ميلاد سعيد", "he": "יום הולדת שמח", "zh": "生日快乐"},
  "je t'aime": {"en": "I love you", "ta": "நான் உன்னை காதலிக்கிறேன்", "ar": "أحبك", "he": "אני אוהב אותך", "zh": "我爱你"},
  "amour": {"en": "Love", "ta": "அன்பு", "ar": "حب", "he": "אהבה", "zh": "爱"},
  "mon amour": {"en": "My love", "ta": "என் அன்பே", "ar": "حبيبي", "he": "אהובי", "zh": "我的爱"},
  "maman": {"en": "Mom", "ta": "அம்மா", "ar": "ماما", "he": "אמא", "zh": "妈妈"},
  "papa": {"en": "Dad", "ta": "அப்பா", "ar": "بابا", "he": "אבא", "zh": "爸爸"},
  "mon papa": {"en": "My dad", "ta": "என் அப்பா", "ar": "أبي", "he": "אבא שלי", "zh": "我的爸爸"},
  "merci": {"en": "Thank you", "ta": "நன்றி", "ar": "شكرا", "he": "תודה", "zh": "谢谢"},
  "bonne année": {"en": "Happy New Year", "ta": "இனிய புத்தாண்டு நல்வாழ்த்துகள்", "ar": "سنة سعيدة", "he": "שנה טובה", "zh": "新年快乐"},
  "félicitations": {"en": "Congratulations", "ta": "வாழ்த்துகள்", "ar": "مبروك", "he": "מזל טוב", "zh": "恭喜"},
  "joyeux deepavali": {"en": "Happy Deepavali", "ta": "இனிய தீபாவளி நல்வாழ்த்துகள்", "ar": "", "he": "", "zh": ""},
  "bonne fête de l'aïd": {"en": "Eid Mubarak", "ta": "", "ar": "عيد مبارك", "he": "", "zh": ""},
  "joyeux noël": {"en": "Merry Christmas", "ta": "கிறிஸ்துமஸ் வாழ்த்துகள்", "ar": "عيد ميلاد مجيد", "he": "", "zh": "圣诞快乐"},
  "meilleur papa du monde": {"en": "Best dad in the world", "ta": "உலகின் சிறந்த அப்பா", "ar": "أفضل أب في العالم", "he": "האבא הכי טוב בעולם", "zh": "世界上最好的爸爸"},
}

pastilles = "".join('<button type="button" class="mqt-lang%s" data-lang="%s">%s</button>' % (" on" if k == "fr" else "", k, n) for k, n, _, _ in LANGS)

# l'étape 2 du SITE, telle quelle (seuls des id sont posés pour la brancher) ...
ETAPE = json.load(open(ETAPE2, encoding="utf-8"))[1]
if "Écrivez votre texte" not in ETAPE: sys.exit("étape 2 du site introuvable dans " + ETAPE2)
ETAPE = ETAPE.replace('<section class="prc-step">', '<section class="prc-step mqt" id="mqt" hidden>', 1)
ETAPE = ETAPE.replace('<input maxlength="40"', '<input id="mqt-txt" autocomplete="off" maxlength="40"', 1)
ETAPE = ETAPE.replace('<span class="prc-count">', '<span class="prc-count" id="mqt-count">', 1)
ETAPE = ETAPE.replace('<input maxlength="20"', '<input id="mqt-date" maxlength="20"', 1)
# ... + le bloc des langues JUSTE SOUS le champ du texte
LANGUE = ('<div class="field mqt-langue"><label>Langue de la gravure</label>'
  '<div class="mqt-langs">' + pastilles + '</div>'
  '<p class="mqt-note" id="mqt-lnote"></p>'
  '<label class="mqt-swap" id="mqt-swap" hidden><input type="checkbox" id="mqt-direct"> <span>J’écris directement mon texte dans cette langue (pas de traduction)</span></label>'
  '<div class="mqt-trad" id="mqt-trad" hidden><div class="mqt-two">'
  '<div><small>Vous avez écrit</small><b id="mqt-fr"></b></div>'
  '<div><small id="mqt-lab">Gravé en tamoul</small><b id="mqt-out" class="mqt-script"></b></div></div>'
  '<p class="mqt-etat" id="mqt-etat"></p>'
  '<p class="mqt-conseil">Un doute ? Faites-le relire par une personne qui parle cette langue avant de commander.</p>'
  '<label class="mqt-check"><input type="checkbox" id="mqt-ok"> <span><b>J’ai relu le texte traduit et je confirme qu’il est exact.</b> Il sera gravé exactement comme il s’affiche ci-dessus et ne pourra plus être modifié.</span></label>'
  '</div></div>')
k = ETAPE.find('id="mqt-count"'); k = ETAPE.find('</div>', k) + len('</div>')
ETAPE = ETAPE[:k] + LANGUE + ETAPE[k:]
# où mettre le décor : juste sous les puces du décor du site
PLACE = ('<div class="mqt-place" id="mqt-place" hidden><span class="mqt-plab">Où mettre le décor ?</span>'
  '<div class="prc-chips"><button type="button" class="prc-chip mqt-pl on" data-pl="texte">Autour du texte</button>'
  '<button type="button" class="prc-chip mqt-pl" data-pl="date">Autour de la date</button>'
  '<button type="button" class="prc-chip mqt-pl" data-pl="deux">Les deux</button></div>'
  '<p class="mqt-note" id="mqt-pnote" hidden>Ajoutez une date plus haut pour y mettre le décor.</p></div>')
k = ETAPE.find('prc-decors'); k = ETAPE.find('</div>', k) + len('</div>')
if k < len('</div>'): sys.exit('décor du site introuvable')
ETAPE = ETAPE[:k] + PLACE + ETAPE[k:]
ETAPE = ETAPE.replace('<label>Décor autour du texte <span', '<label>Décor autour du texte ou de la date <span', 1)

# insérer l'étape 2 avant le résumé, renuméroter le résumé
i = h.find('<section class="prc-step"><div class="prc-sh"><span class="prc-num">3</span><h3>Résumé')
if i < 0: sys.exit("résumé introuvable")
h = h[:i] + ETAPE + h[i:]
h = h.replace('<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss">à choisir (étape 1)</b></div>',
              '<div class="prc-sumrow"><span>Gravure</span><b class="prc-miss" id="mqt-sg">à choisir (étape 1)</b></div>'
              '<div class="prc-sumrow" id="mqt-srow" hidden><span>Texte gravé</span><b id="mqt-sp" class="mqt-script"></b></div>'
              '<div class="prc-sumrow" id="mqt-sdate" hidden><span>Date</span><b id="mqt-sd"></b></div>', 1)
h = h.replace('<div class="prc-sumrow prc-sumtot"><span>Total</span><b>', '<div class="prc-sumrow prc-sumtot"><span>Total</span><b id="mqt-tot">', 1)
h = h.replace('<span class="val">', '<span class="val" id="mqt-tot2">', 1)
h = h.replace('<p class="prc-addhint">', '<p class="prc-addhint" id="mqt-hint">', 1)
h = h.replace('<button class="btn btn-gold prc-off" style="flex:1" disabled="">', '<button class="btn btn-gold prc-off" id="mqt-add" style="flex:1" disabled="">', 1)
# calque de gravure sur la grande photo
h = h.replace('<button type="button" class="gallery-arrow gallery-arrow-prev"',
              '<div class="mqt-layer" id="mqt-layer" hidden><span id="mqt-glass"><i id="mqt-gt"></i></span></div><button type="button" class="gallery-arrow gallery-arrow-prev"', 1)

ATELIER = '''<div class="container mqt-atel"><p class="mqt-atel-t">Ce que l’atelier verra sur la fiche de travail</p>
<table class="mqt-tab"><tbody>
<tr><th>Texte tapé par la cliente</th><td id="mqt-a1">—</td></tr>
<tr><th>Langue</th><td id="mqt-a2">Français</td></tr>
<tr><th>Texte à graver</th><td><b id="mqt-a3" class="mqt-script">—</b><div id="mqt-a3d"></div></td></tr>
<tr><th>Écriture</th><td id="mqt-a4">Playfair</td></tr>
<tr><th>Contrôle</th><td id="mqt-a5">—</td></tr>
<tr><th>Fichier à graver<br><small>rangé dans le dossier de la commande</small></th><td><canvas id="mqt-cv" class="mqt-cv" width="600" height="300"></canvas><div class="mqt-fic"><b id="mqt-fn">—</b><span>SVG à l’échelle (lettres en tracés : aucune police à installer dans le logiciel du laser) · aussi en PNG et PDF</span></div></td></tr>
</tbody></table></div>'''
h = h.replace("<footer", ATELIER + "<footer", 1)
BANDEAU = '<div class="mqt-band"><b>Maquette</b> · gravure traduite dans la langue de la cliente, sur le verre à vin. Rien n’est en ligne. Les prix viennent de la fiche.</div>'
h = re.sub(r"(<body[^>]*>)", r"\1" + BANDEAU, h, count=1)

CSS = '''<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Allura&family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Great+Vibes&family=Inter:wght@400;600&family=Montserrat:wght@400;600&family=Pacifico&family=Playfair+Display:wght@400;600&family=Noto+Serif+Tamil:wght@500&family=Noto+Naskh+Arabic:wght@500;700&family=Noto+Serif+Hebrew:wght@500&family=Noto+Serif+SC:wght@500&display=swap">
<style>
.mqt-band{background:#1a1206;color:#f3e8d3;font:500 13px/1.4 Inter,system-ui,sans-serif;padding:9px 16px;text-align:center}
.mqt-band b{color:#e2c67e}
.mqt-langue{margin-top:-2px}
.mqt-langs{display:flex;flex-wrap:wrap;gap:8px}
.mqt-lang{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;font:600 .88rem Inter,system-ui,sans-serif;color:var(--ink);cursor:pointer}
.mqt-lang.on{border-color:var(--gold-dark);background:#fffaf0;box-shadow:0 0 0 2px var(--gold)}
.mqt-note{font-size:.8rem;color:var(--ink-soft);margin:6px 0 0;line-height:1.45}
.mqt-place{margin:10px 0 0;display:flex;flex-direction:column;gap:8px}
.mqt-plab{font-size:.86rem;color:var(--ink-soft)}
.mqt-conseil{font-size:.84rem;color:var(--ink-soft);margin:6px 0 8px}
.mqt .field label.mqt-swap{display:flex!important;flex-direction:row;gap:10px;align-items:flex-start;font-size:.86rem;font-weight:400;margin:0 0 12px;color:var(--ink-soft);cursor:pointer}
.mqt .field label.mqt-swap[hidden]{display:none!important}
.mqt .field .mqt-swap input{width:auto!important;flex:none;margin:3px 0 0;padding:0;accent-color:var(--gold-dark)}
.mqt-trad{border:1.5px solid var(--line);border-radius:14px;padding:12px;background:#fff;margin-bottom:12px}
.mqt-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mqt-two>div{min-width:0}
.mqt-two small{display:block;font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);margin-bottom:4px}
.mqt-two b{display:block;font-size:1.15rem;line-height:1.35;overflow-wrap:anywhere}
.mqt-etat{font-size:.8rem;color:var(--ink-soft);margin:10px 0 0;min-height:1.2em}
.mqt-etat.ko{color:#b0332a}
.mqt-check{display:flex;gap:10px;align-items:flex-start;margin-top:10px;padding:10px;border:1.5px solid var(--line);border-radius:10px;font-size:.86rem;line-height:1.4;cursor:pointer}
.mqt-check:has(input:checked){border-color:var(--gold-dark);background:#fffaf0}
.mqt-check input{margin-top:3px;width:18px;height:18px;accent-color:var(--gold-dark);flex:none}
.mqt-check.attend{border-color:#b0332a}
.mqt-layer{position:absolute;inset:0;pointer-events:none}
.mqt-layer span{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2;color:#2f3a44;opacity:.88;text-shadow:0 0 3px rgba(255,255,255,.7)}
.mqt-layer i{font-style:normal;display:inline-block;white-space:pre-wrap;overflow-wrap:normal;word-break:keep-all;max-width:100%}
.gallery-main{position:relative}
.mqt-atel{margin:28px auto}
.mqt-cv{display:block;width:100%;max-width:300px;aspect-ratio:2/1;background:#fff;border:1px solid #c9a24b;border-radius:6px}
.mqt-fic{margin-top:6px;display:flex;flex-direction:column;gap:2px;font-size:.84rem;color:var(--ink-soft)}
.mqt-fic b{color:var(--ink);word-break:break-all}
.mqt-atel-t{font-weight:600;margin:0 0 8px}
.mqt-tab{border-collapse:collapse;width:100%;max-width:640px;font-size:.9rem;background:#fff}
.mqt-tab th,.mqt-tab td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
.mqt-tab th{width:170px;background:#fbf7ee}
.mqt-tab td b{font-size:1.1rem}
@media (max-width:640px){.mqt-two{grid-template-columns:1fr}.mqt-tab th{width:120px}}
</style>'''
h = h.replace("</head>", CSS + "</head>", 1)

JS = '''<script>
(function(){
var P={"36":%(p36)s,"47":%(p47)s}, TXT=%(txt)s, BOX={"36":%(b36)s,"47":%(b47)s}, VIERGE={"36":%(v36)s,"47":%(v47)s};
var LANGS=%(langs)s, FONTS=%(fonts)s, PH=%(phrases)s;
var taille="36", carte=null, lang="fr", trad="", etat="", enCours=0, sample=null, sampleOk=null;
if(window.claude&&claude.use) claude.use("sample").then(function(s){sample=s;sampleOk=!!s;majEtat();}).catch(function(){sampleOk=false;majEtat();}); else sampleOk=false;
var $=function(id){return document.getElementById(id)};
function eur(x){return x.toFixed(2).replace(".",",")+"\\u00a0€"}
var txt=$("mqt-txt"), date=$("mqt-date"), ok=$("mqt-ok"), direct=$("mqt-direct"), police="playfair", policeNom="Playfair", decor="", place="texte";
function orne(x,on){ return (on&&decor&&x) ? decor+"\\u00a0"+x+"\\u00a0"+decor : x; }
function surTexte(){ return place!=="date"; } function surDate(){ return place!=="texte"; }
// écriture et décor : les boutons du SITE, inchangés
[].forEach.call(document.querySelectorAll(".mqt .prc-pol"),function(b){b.addEventListener("click",function(){[].forEach.call(document.querySelectorAll(".mqt .prc-pol"),function(x){x.classList.toggle("on",x===b)}); police=(b.className.match(/fnt-([a-z-]+)/)||[,"playfair"])[1]; policeNom=b.title||b.textContent; maj();});});
[].forEach.call(document.querySelectorAll(".mqt .prc-decors .prc-chip"),function(b){b.addEventListener("click",function(){[].forEach.call(document.querySelectorAll(".mqt .prc-decors .prc-chip"),function(x){x.classList.toggle("on",x===b)}); var t=b.textContent.trim(); decor = /^Aucun/.test(t)?"":t.charAt(0); maj();});});
[].forEach.call(document.querySelectorAll(".mqt-pl"),function(b){b.addEventListener("click",function(){[].forEach.call(document.querySelectorAll(".mqt-pl"),function(x){x.classList.toggle("on",x===b)}); place=b.dataset.pl; maj();});});
var gal=document.querySelector(".gallery-main"), bg=document.querySelector(".gallery-bg"), bg0=bg.getAttribute("src"), layer=$("mqt-layer"), glass=$("mqt-glass");
// taille 36 / 47
var sw=[].slice.call(document.querySelectorAll(".variant-swatches"));
[].slice.call(sw[0].children).forEach(function(b,i){b.addEventListener("click",function(){taille=i?"47":"36";[].forEach.call(sw[0].children,function(x){x.classList.toggle("active",x===b)});document.querySelector(".price-lead").textContent=eur(P[taille]);maj();});});
[].slice.call(sw[1].children).forEach(function(b,i){ if(i>0){b.disabled=true;b.style.opacity=".45";b.title="Dans la maquette, le calcul est montré pour un verre";}});
// étape 1 : seule la carte « Mon propre texte » ouvre l'étape 2 de la maquette
var cards=[].slice.call(document.querySelectorAll(".prc-card"));
cards.forEach(function(c,i){c.addEventListener("click",function(){
  carte = carte===c ? null : c; cards.forEach(function(x){x.classList.toggle("on",x===carte)});
  $("mqt").hidden = !(carte===cards[2]);
  if(carte===cards[2]) $("mqt").scrollIntoView({behavior:"smooth",block:"start"});
  maj();});});
// langue
[].forEach.call(document.querySelectorAll(".mqt-lang"),function(b){b.addEventListener("click",function(){
  lang=b.dataset.lang; [].forEach.call(document.querySelectorAll(".mqt-lang"),function(x){x.classList.toggle("on",x===b)});
  ok.checked=false; traduire(); });});
var L=function(){return LANGS.filter(function(l){return l[0]===lang})[0]};
var tmr=null;
function traduire(){
  var v=txt.value.trim(); trad=""; etat="";
  if(lang==="fr"||direct.checked||!v){ maj(); return; }
  var k=v.toLowerCase().replace(/\\s+/g," ").replace(/[’]/g,"'");
  if(PH[k]&&PH[k][lang]){ trad=PH[k][lang]; etat="Traduction automatique : à vérifier avant de commander"; maj(); return; }
  if(!sample){ etat = sampleOk===false ? "Traduction en direct indisponible dans cet aperçu (sur le site : traduite en 1 à 2 s). Essayez « Joyeux anniversaire », « Je t'aime », « Maman », « Merci »…" : "Traduction en cours…"; maj(); return; }
  clearTimeout(tmr); etat="Traduction en cours…"; maj();
  tmr=setTimeout(function(){
    var mon=++enCours, nom=L()[1];
    var ecrit = lang==="en" ? "Les prénoms et noms propres restent tels quels. " :
      "Écris dans l'écriture de la langue (jamais en lettres latines). Les prénoms et noms propres ne se traduisent pas : transcris-les phonétiquement dans l'écriture de la langue. ";
    sample("Traduis ce texte du français vers la langue : "+nom+". C'est un texte court à graver sur un verre offert en cadeau : "+
      "traduction naturelle et chaleureuse. "+ecrit+"Réponds UNIQUEMENT par le texte traduit, sans guillemets ni explication.\\n\\nTexte : "+v, {modelTier:"quick"})
    .then(function(r){ if(mon!==enCours) return; trad=(r.text||"").trim().replace(/^["«»]+|["«»]+$/g,""); etat="Traduction automatique : à vérifier avant de commander"; maj(); })
    .catch(function(e){ if(mon!==enCours) return; etat = e&&e.code==="not_granted" ? "Traduction refusée dans l'aperçu de la maquette (sur le site, elle se fait sans question)." : "La traduction n'a pas répondu, réessayez."; maj(); });
  }, 500);
}
function majEtat(){ if(lang!=="fr"&&txt.value.trim()&&!direct.checked) traduire(); else maj(); }
function texteGrave(){ var v=txt.value.trim(); if(!v) return ""; if(lang==="fr"||direct.checked) return v; return trad; }
function apercu(){
  var g=texteGrave(), l=L(), d=date.value.trim();
  var show = carte===cards[2] && (g||d);
  layer.hidden=!show; bg.setAttribute("src", show? VIERGE[taille] : bg0);
  if(!show) return;
  var b=BOX[taille][0], mw=BOX[taille][1], W=gal.clientWidth, Hh=gal.clientHeight;
  glass.style.left=(b.left*100)+"%%"; glass.style.top=(b.top*100)+"%%"; glass.style.width=(b.width*100)+"%%"; glass.style.height=(b.height*100)+"%%";
  var fam = !l[2] ? FONTS[police] : l[2];
  var gt=$("mqt-gt"); glass.style.fontFamily=fam; glass.dir=l[3]; gt.textContent = orne(g,surTexte()) + (g&&d? "\\n":"") + orne(d,surDate());
  // la plus grande taille qui tient dans le cadre (largeur plafonnée comme sur le site : maxWidthFrac)
  var maxW=Math.min(b.width,mw)*W, maxH=b.height*Hh;
  var fs=Math.round(Math.min(32, maxH/3.2)); glass.style.fontSize=fs+"px";
  while(fs>9 && (gt.scrollWidth>maxW+1 || gt.offsetHeight>maxH)){ fs-=1; glass.style.fontSize=fs+"px"; }
}
// fichier à graver (aperçu) : 60 × 30 mm, noir sur blanc, texte + date plus petite, comme le fichier rangé dans la commande
function fichier(t1, t2, fam, dir){
  var cv=$("mqt-cv"), c=cv.getContext("2d"), W=cv.width, H=cv.height; c.fillStyle="#fff"; c.fillRect(0,0,W,H);
  var fn=$("mqt-fn"), l=L();
  if(!t1 && !t2){ fn.textContent="—"; return; }
  fn.textContent="gravure-<réf>-verre1-"+l[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")+"-60x30mm.svg";
  c.fillStyle="#000"; c.textAlign="center"; c.textBaseline="middle"; c.direction=dir||"ltr";
  var lignes=[]; if(t1) lignes.push([t1,1]); if(t2) lignes.push([t2,0.62]);
  var fs=200; function mesure(){ var w=0,h=0; lignes.forEach(function(x){ c.font=Math.round(fs*x[1])+"px "+fam; w=Math.max(w,c.measureText(x[0]).width); h+=fs*x[1]*1.3; }); return [w,h]; }
  var m=mesure(); while(fs>6 && (m[0]>W*0.92 || m[1]>H*0.92)){ fs-=2; m=mesure(); }
  var y=(H-m[1])/2; lignes.forEach(function(x){ var s=fs*x[1]; c.font=Math.round(s)+"px "+fam; y+=s*0.65; c.fillText(x[0],W/2,y); y+=s*0.65; });
}
function maj(){
  var v=txt.value.trim(), l=L(), g=texteGrave(), d=date.value.trim(), ouvert = carte===cards[2];
  $("mqt-swap").hidden = lang==="fr";
  $("mqt-lnote").textContent = lang==="fr" ? "Votre texte est gravé tel que vous l'écrivez." : (direct.checked ? "Écrivez votre texte en "+l[1].toLowerCase()+" : il est gravé tel quel." : "Écrivez en français, nous le traduisons en "+l[1].toLowerCase()+"."+(l[2] ? " Le "+l[1].toLowerCase()+" a son propre alphabet : le choix « Écriture » plus bas ne change pas ce texte." : ""));
  var c=$("mqt-count"); if(c) c.textContent=txt.value.length+"/40";
  txt.dir = (direct.checked && l[3]==="rtl") ? "rtl" : "ltr";
  var showTrad = lang!=="fr" && !direct.checked && !!v;
  $("mqt-trad").hidden=!showTrad;
  if(showTrad){ $("mqt-fr").textContent=v; $("mqt-lab").textContent="Gravé en "+l[1].toLowerCase(); var o=$("mqt-out"); o.textContent=trad||"…"; o.style.fontFamily=l[2]; o.dir=l[3];
    var e=$("mqt-etat"); e.textContent=etat; e.classList.toggle("ko", /indisponible|refusée|pas répondu/.test(etat)); }
  var besoinOk = showTrad && !!trad, valide = ouvert && !!g && (!besoinOk || ok.checked);
  document.querySelector(".mqt-check").classList.toggle("attend", besoinOk && !ok.checked && !!trad);
  var extra = d ? TXT : 0, tot = P[taille] + extra;
  $("mqt-tot").textContent=eur(tot); $("mqt-tot2").textContent=eur(tot);
  var sg=$("mqt-sg");
  if(carte&&carte!==cards[2]){ sg.textContent=carte.querySelector("b").textContent; sg.classList.remove("prc-miss"); }
  else if(ouvert&&g){ sg.textContent="Mon propre texte"+(lang!=="fr"?" · en "+l[1].toLowerCase():"")+" · offert (verre 1)"; sg.classList.remove("prc-miss"); }
  else { sg.textContent="à choisir (étape 1)"; sg.classList.add("prc-miss"); }
  $("mqt-srow").hidden=!(ouvert&&g); var sp=$("mqt-sp"); sp.textContent="« "+g+" »"; sp.style.fontFamily=l[2]||""; sp.dir=l[3]; if(g) sp.textContent="« "+orne(g,surTexte())+" »";
  $("mqt-sdate").hidden=!(ouvert&&d); $("mqt-sd").textContent=orne(d,surDate())+" · +"+eur(TXT);
  $("mqt-place").hidden=!decor; $("mqt-pnote").hidden=!(decor&&surDate()&&!d);
  var add=$("mqt-add"), hint=$("mqt-hint"), okAll = valide || (carte&&carte!==cards[2]);
  add.disabled=!okAll; add.classList.toggle("prc-off",!okAll);
  hint.textContent = okAll ? "Maquette : le bouton n'ajoute rien au panier." : (besoinOk && !ok.checked ? "Cochez « J'ai relu le texte traduit » pour continuer." : (ouvert && lang!=="fr" && v && !trad ? "La traduction arrive…" : "Choisissez votre gravure (étape 1)."));
  // atelier
  $("mqt-a1").textContent = v||"—"; $("mqt-a2").textContent = l[1];
  var a3=$("mqt-a3"); a3.textContent = g ? "« "+g+" »" : "—"; a3.style.fontFamily=l[2]||""; a3.dir=l[3]; if(g) a3.textContent="« "+orne(g,surTexte())+" »"; var a3d=$("mqt-a3d"); a3d.textContent = d ? "Date : "+orne(d,surDate()) : "";
  fichier(orne(g,surTexte()), orne(d,surDate()), !l[2] ? FONTS[police] : l[2], l[3]);
  $("mqt-a4").textContent = !l[2] ? policeNom : "Écriture "+l[1].toLowerCase()+" (Noto) — déjà tracée dans le fichier à graver";
  $("mqt-a5").textContent = lang==="fr" ? "—" : (direct.checked ? "Texte fourni par la cliente dans sa langue, gravé tel quel" : (PH[(v||"").toLowerCase()]&&PH[(v||"").toLowerCase()][lang] ? "⚠️ Traduction automatique (phrase de notre liste), relue et validée par la cliente (case cochée) — à relire avant de graver" : "⚠️ Traduction automatique, relue et validée par la cliente (case cochée) — à relire avant de graver"));
  apercu();
}
txt.addEventListener("input",function(){ok.checked=false;traduire();}); direct.addEventListener("change",function(){ok.checked=false;traduire();});
date.addEventListener("input",maj); ok.addEventListener("change",maj);
window.addEventListener("resize",apercu); document.fonts&&document.fonts.ready.then(apercu);
maj();
})();
</script>''' % {"p36": json.dumps(P36), "p47": json.dumps(P47), "txt": json.dumps(TXT),
               "b36": json.dumps([BOX36[0], BOX36[1]]), "b47": json.dumps([BOX47[0], BOX47[1]]),
               "v36": json.dumps(VIERGE36), "v47": json.dumps(VIERGE47),
               "langs": json.dumps(LANGS, ensure_ascii=False), "fonts": json.dumps({k: css for k, _, css in FONTS}),
               "phrases": json.dumps(PHRASES, ensure_ascii=False)}
h = h.replace("</body>", JS + "</body>", 1)

open(OUT, "w", encoding="utf-8").write(h)
head = re.search(r"<head[^>]*>(.*?)</head>", h, flags=re.S).group(1)
head = re.sub(r"<meta[^>]*>", "", head)
body = re.search(r"<body[^>]*>(.*)</body>", h, flags=re.S).group(1)
frag = "<title>Gravure traduite</title>" + re.sub(r"<title>.*?</title>", "", head, flags=re.S) + body
open(OUT.replace(".html", ".fragment.html"), "w", encoding="utf-8").write(frag)
print("OK", OUT, "%.0f Ko" % (len(h) / 1024))
