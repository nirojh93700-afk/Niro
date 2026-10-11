#!/usr/bin/env python3
"""Maquette « Marque-pages : 4 idées pour choisir les couleurs d'un coffret » — 11/10/2026. RIEN n'est en ligne.

Gérant (11/10 soir) : la v7 (cases par marque-page) « c'est pas bon du tout, les mots couleurs c'est mal placé, trop en bas, c'était mieux
avant » → plusieurs idées à choisir. La COULEUR reste EN HAUT (comme avant), puis le format. Réutilise le CSS de marque-pages.html.
Sortie : docs/maquettes/marque-pages-idees.html (+ .fragment.html, jamais commité).
"""
import base64, io, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "docs", "maquettes")
A = os.path.join(OUT, "assets", "marque-pages")

def uri(name, w=300, q=74):
    im = Image.open(os.path.join(A, name + ".jpg")).convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

base = open(os.path.join(OUT, "marque-pages.html"), encoding="utf-8").read()
CSS = re.search(r"<style>(.*?)</style>", base, re.S).group(1)
COULEURS = [("Caramel", "nanmu"), ("Blond clair", "buis"), ("Rouge", "santal"), ("Cuivré", "palissandre"), ("Gris anthracite", "ebene"), ("Gris sable", "suanzhi")]
IMG = {n: uri(f) for n, f in COULEURS}
BOX2, BOX4 = uri("boite2", 260, 72), uri("boite4", 260, 72)
def eur(n): return f"{n:.2f}".replace(".", ",") + " €"

def swatches(extra=""):
    h = '<div class="variant-swatches">'
    for i, (n, _) in enumerate(COULEURS):
        h += (f'<button type="button" class="variant-swatch has-img{" active" if i == 0 else ""}" data-c="{i}"><img src="{IMG[n]}" alt="{n}"/>'
              f'<span class="vs-title">{n}</span><span class="vs-price"><span class="vs-now">9,90 €</span></span>{extra}</button>')
    return h + "</div>"

def fmt_cards(prefix, with_one=True):
    cards = [("Seul", "avec son pompon", 1, 0, IMG["Caramel"]), ("En boîte cadeau", "1 marque-page, boîte bleu nuit", 1, 4.9, BOX2),
             ("Coffret de 2", "2 marque-pages, boîte bleu nuit", 2, 5.9, BOX2), ("Coffret de 4", "4 marque-pages, boîte bleu nuit", 4, 7.9, BOX4)]
    h = '<div class="mq-fmts">'
    for i, (t, s, n, box, im) in enumerate(cards):
        h += (f'<button type="button" class="mq-fmt{" on" if i == 0 else ""}" data-n="{n}" data-box="{box:g}"><img class="mq-fimg" src="{im}" alt=""/>'
              f'<span class="mq-ft"><b>{t}</b><span>{s}</span><em>{eur(n * 9.9 + box)}</em></span></button>')
    return h + "</div>"

def panel(key, titre, resume, corps):
    return (f'<section class="mx-p" data-p="{key}" hidden><div class="mx-pitch"><b>{titre}</b><span>{resume}</span></div>'
            f'<div class="mx-phone">{corps}</div></section>')

# ---- A : même couleur pour tout le coffret
pA = panel("A", "Idée A · Une couleur pour tout le coffret",
           "Le plus simple : le client choisit sa couleur, puis son format. Les 2 ou 4 marque-pages d'un coffret sont de cette couleur. Pour mélanger les couleurs, il ajoute un 2ᵉ coffret.",
           '<div class="field"><label>Choisissez votre couleur</label>' + swatches() + '</div>'
           '<div class="field"><label>Choisissez votre format</label>' + fmt_cards("a") + '<p class="mx-note" id="a-note"></p></div>'
           '<div class="mx-total"><span>Total sans gravure</span><b id="a-tot">9,90 €</b></div>')

# ---- B : quantité par couleur, la boîte s'adapte
stp = '<span class="mx-stp" hidden><i data-d="-1">−</i><u>0</u><i data-d="1">+</i></span>'
pB = panel("B", "Idée B · Je compose avec des + et des −",
           "Pas de format à choisir : le client ajoute des marque-pages avec + / − sur chaque couleur (jusqu'à 4). Il coche « boîte cadeau » et la boîte s'adapte toute seule (1 → 4,90 €, 2 → 5,90 €, 3 ou 4 → 7,90 €).",
           '<div class="field"><label>Choisissez vos couleurs <em class="mx-cnt" id="b-cnt">0 sur 4 marque-pages</em></label>' + swatches(stp.replace(' hidden', '')) + '</div>'
           '<div class="field"><label class="mx-chk"><input type="checkbox" id="b-box"/> <span>Dans une boîte cadeau bleu nuit <em id="b-boxp"></em></span></label><img class="mx-boxpic" id="b-pic" src="' + BOX2 + '" alt="" hidden/></div>'
           '<div class="mx-total"><span id="b-line">Choisissez au moins un marque-page</span><b id="b-tot">0,00 €</b></div>')

# ---- C : fenêtre « Composer mon coffret »
pC = panel("C", "Idée C · Une fenêtre « Composer mon coffret »",
           "La page reste légère : une seule rangée de couleurs et les formats. En choisissant un coffret, un bouton ouvre une fenêtre où le client remplit les cases une par une ; la page ne garde qu'un petit récapitulatif en photos.",
           '<div class="field"><label>Choisissez votre couleur</label>' + swatches() + '</div>'
           '<div class="field"><label>Choisissez votre format</label>' + fmt_cards("c") +
           '<div class="mx-recap" id="c-recap" hidden><span id="c-rtxt"></span><button type="button" class="mx-btn" id="c-open">Choisir les couleurs</button><div class="mx-strip" id="c-strip"></div></div></div>'
           '<div class="mx-total"><span>Total sans gravure</span><b id="c-tot">9,90 €</b></div>'
           '<div class="mx-sheet" id="c-sheet" hidden><div class="mx-sheetin"><div class="mx-sh"><b id="c-sht">Mon coffret</b><button type="button" id="c-close" aria-label="Fermer">×</button></div>'
           '<div class="mq-slots" id="c-slots"></div><p class="mq-hint" id="c-hint"></p><div class="mx-pick" id="c-pick"></div>'
           '<button type="button" class="mx-btn full" id="c-ok" disabled>Valider mon coffret</button></div></div>')

# ---- D : assortiment choisi par l'atelier
asst = ["Caramel", "Blond clair", "Rouge", "Gris anthracite"]
strip = "".join(f'<span class="mx-ch"><img src="{IMG[n]}" alt=""/><small>{n}</small></span>' for n in asst)
pD = panel("D", "Idée D · L'assortiment choisi par l'atelier",
           "Dans un coffret, deux cartes : « une seule couleur » (la rangée du dessus) ou « assortiment » : on compose pour lui une belle association de couleurs. Aucun choix à faire, aucune case à remplir.",
           '<div class="field"><label>Choisissez votre couleur</label>' + swatches() + '</div>'
           '<div class="field"><label>Choisissez votre format</label>' + fmt_cards("d") +
           '<div class="mx-two" id="d-two" hidden><button type="button" class="mx-opt on" data-m="un"><b>Une seule couleur</b><span>Celle choisie ci-dessus, pour tout le coffret.</span></button>'
           '<button type="button" class="mx-opt" data-m="as"><b>Assortiment de l\'atelier</b><span>Une belle association de couleurs, composée par nous.</span><div class="mx-strip">' + strip + '</div></button></div></div>'
           '<div class="mx-total"><span>Total sans gravure</span><b id="d-tot">9,90 €</b></div>')

CSS2 = '''
.mx-wrap{max-width:1100px;margin:0 auto;padding:18px 16px 60px;font-family:Inter,system-ui,sans-serif;color:#2b2620}
.mx-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.8rem;padding:9px 14px}.mx-banner b{color:#e2c67e}
.mx-wrap h1{font-family:'Playfair Display',serif;font-size:1.5rem;margin:18px 0 6px}.mx-wrap .mx-sub{margin:0 0 16px;color:#6b5f44;font-size:.92rem;line-height:1.5}
.mx-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px}.mx-tab{flex:0 0 auto;border:1.5px solid #e0d3b0;background:#fff;border-radius:999px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer;color:#5a4d2c}.mx-tab.on{background:#2b2620;color:#f2e4bd;border-color:#2b2620}
.mx-pitch{display:flex;flex-direction:column;gap:4px;background:#fbf3df;border-left:4px solid #c9a24b;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:.9rem;line-height:1.45}.mx-pitch b{font-size:1rem;color:#7c6120}
.mx-phone{max-width:480px;margin:0 auto;background:#fcfaf4;border:1px solid #e4d9bd;border-radius:22px;padding:18px 16px 20px}
.mx-phone .field{margin-bottom:16px}.mx-phone label{font-weight:600;font-size:.92rem;display:block;margin-bottom:8px}
.mx-note{font-size:.8rem;color:#7a6c48;margin:8px 0 0;min-height:1.2em}
.mx-total{display:flex;justify-content:space-between;align-items:center;border:1px solid #e0cf9f;background:linear-gradient(#fbf3df,#f6ecd0);border-radius:14px;padding:14px 16px;margin-top:8px}.mx-total b{font-size:1.25rem;color:#a98935;white-space:nowrap}.mx-total span{min-width:0}
.mx-cnt{font-style:normal;font-weight:500;color:#7a6c48;font-size:.82rem;margin-left:6px}
.mx-chk{display:flex!important;gap:8px;align-items:flex-start;cursor:pointer}.mx-chk input{width:18px;height:18px;accent-color:#a98935;margin-top:2px}.mx-chk em{font-style:normal;color:#7c6120;font-weight:700}
.mx-boxpic{width:100%;border-radius:12px;margin-top:8px;display:block}
.variant-swatch{position:relative}.mx-stp{display:flex;align-items:center;gap:6px;margin-top:6px}.mx-stp i{width:28px;height:28px;border-radius:50%;border:1.5px solid #c9b88a;display:flex;align-items:center;justify-content:center;font-style:normal;background:#fff;font-weight:700;cursor:pointer;user-select:none}.mx-stp u{text-decoration:none;min-width:14px;text-align:center;font-weight:700}
.variant-swatch.has-n{border-color:#a98935;box-shadow:0 0 0 1px #a98935 inset;background:#fbf3df}
.mx-recap{margin-top:10px;border:1px solid #e4d9bd;border-radius:14px;background:#fff;padding:12px;display:flex;flex-direction:column;gap:10px}.mx-recap span{font-size:.86rem;color:#5a4d2c}
.mx-btn{border:0;border-radius:999px;padding:12px 18px;background:linear-gradient(#c9a24b,#a98935);color:#fff;font:inherit;font-weight:700;cursor:pointer}.mx-btn.full{width:100%}.mx-btn[disabled]{opacity:.45;cursor:not-allowed}
.mx-strip{display:flex;gap:6px}.mx-ch{display:flex;flex-direction:column;align-items:center;gap:2px;width:56px}.mx-ch img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.mx-ch small{font-size:.58rem;color:#5a4d2c;text-align:center;line-height:1.1}
.mx-sheet{position:fixed;inset:0;background:rgba(30,24,12,.55);display:flex;align-items:flex-end;justify-content:center;z-index:50}.mx-sheet[hidden]{display:none}
.mx-sheetin{background:#fcfaf4;width:100%;max-width:520px;border-radius:22px 22px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));max-height:88vh;overflow:auto}
.mx-sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.mx-sh b{font-family:'Playfair Display',serif;font-size:1.15rem}.mx-sh button{border:0;background:#efe6d2;width:36px;height:36px;border-radius:50%;font-size:1.3rem;cursor:pointer}
.mx-pick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:6px 0 14px}.mx-pk{border:1.5px solid #e4d9bd;border-radius:12px;background:#fff;padding:5px;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}.mx-pk img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.mx-pk span{font-size:.72rem;color:#5a4d2c}
.mx-two{display:grid;gap:8px;margin-top:10px}.mx-opt{text-align:left;border:1.5px solid #e4d9bd;border-radius:14px;background:#fff;padding:12px;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:3px}.mx-opt b{font-size:.95rem}.mx-opt span{font-size:.8rem;color:#7a6c48}.mx-opt.on{border-color:#a98935;background:#fbf3df;box-shadow:0 0 0 1px #a98935 inset}.mx-opt .mx-strip{margin-top:8px}
.mx-p[hidden]{display:none}
'''
JS = r'''
(function(){
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'}, $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var NAMES=__NAMES__, IMGS=__IMGS__;
  // onglets
  var tabs=$$('.mx-tab'),ps=$$('.mx-p');
  function go(k){tabs.forEach(function(t){t.classList.toggle('on',t.dataset.p===k)});ps.forEach(function(p){p.hidden=p.dataset.p!==k});try{history.replaceState(null,'','#'+k)}catch(e){}}
  tabs.forEach(function(t){t.addEventListener('click',function(){go(t.dataset.p)})});
  go((location.hash||'#A').slice(1)||'A');
  // communs : choix d'une couleur (rangée classique) et d'un format
  function radio(root){var sw=$$('.variant-swatch',root),st={c:0};sw.forEach(function(b){b.addEventListener('click',function(e){if(e.target.closest('.mx-stp'))return;sw.forEach(function(x){x.classList.remove('active')});b.classList.add('active');st.c=+b.dataset.c;if(st.onc)st.onc()})});return st}
  function formats(root,st,cb){var fm=$$('.mq-fmt',root);st.n=1;st.box=0;fm.forEach(function(b){b.addEventListener('click',function(){fm.forEach(function(x){x.classList.remove('on')});b.classList.add('on');st.n=+b.dataset.n;st.box=+b.dataset.box;cb()})})}
  function seulImg(root,st){var im=$('.mq-fmt .mq-fimg',root);if(im)im.src=IMGS[st.c]}
  // A
  (function(){var r=$('.mx-p[data-p=A]'),st=radio(r),tot=$('#a-tot'),note=$('#a-note');
    function maj(){seulImg(r,st);tot.textContent=eur(9.9*st.n+st.box);note.textContent=st.n>1?('Les '+st.n+' marque-pages du coffret seront de couleur '+NAMES[st.c].toLowerCase()+'.'):''}
    st.onc=maj;formats(r,st,maj);maj()})();
  // B
  (function(){var r=$('.mx-p[data-p=B]'),sw=$$('.variant-swatch',r),q=sw.map(function(){return 0}),cnt=$('#b-cnt'),box=$('#b-box'),bp=$('#b-boxp'),pic=$('#b-pic'),line=$('#b-line'),tot=$('#b-tot');
    function bx(n){return n<=1?4.9:n===2?5.9:7.9}
    function maj(){var n=q.reduce(function(a,b){return a+b},0);cnt.textContent=n+' sur 4 marque-pages';
      sw.forEach(function(b,i){$('u',b).textContent=q[i];b.classList.toggle('has-n',q[i]>0);b.classList.toggle('active',q[i]>0)});
      var b=n?bx(n):0;bp.textContent=n?('+ '+eur(b)):'';pic.hidden=!(box.checked&&n);pic.src=n>2?'__B4__':'__B2__';
      line.textContent=n?(n+' marque-page'+(n>1?'s':'')+(box.checked?' + boîte cadeau':'')):'Choisissez au moins un marque-page';
      tot.textContent=eur(n*9.9+(box.checked?b:0))}
    sw.forEach(function(b,i){$$('i',b).forEach(function(s){s.addEventListener('click',function(e){e.stopPropagation();var n=q.reduce(function(a,c){return a+c},0),d=+s.dataset.d;if(d>0&&n>=4)return;q[i]=Math.max(0,q[i]+d);maj()})});
      b.addEventListener('click',function(e){if(e.target.closest('.mx-stp'))return;var n=q.reduce(function(a,c){return a+c},0);if(q[i]===0&&n<4){q[i]=1;maj()}})});
    box.addEventListener('change',maj);maj()})();
  // C
  (function(){var r=$('.mx-p[data-p=C]'),st=radio(r),tot=$('#c-tot'),recap=$('#c-recap'),rtxt=$('#c-rtxt'),strip=$('#c-strip'),sheet=$('#c-sheet'),slotsEl=$('#c-slots'),hint=$('#c-hint'),pick=$('#c-pick'),ok=$('#c-ok');
    var sl=[];
    function done(){for(var i=0;i<st.n;i++)if(sl[i]==null)return false;return true}
    function strp(){strip.innerHTML='';for(var i=0;i<st.n;i++){var k=sl[i],d=document.createElement('span');d.className='mx-ch';d.innerHTML=k!=null?'<img src="'+IMGS[k]+'" alt=""/><small>'+NAMES[k]+'</small>':'<img src="'+IMGS[st.c]+'" alt=""/><small>'+NAMES[st.c]+'</small>';strip.appendChild(d)}}
    function maj(){seulImg(r,st);tot.textContent=eur(9.9*st.n+st.box);recap.hidden=st.n<2;if(st.n>1){var any=sl.some(function(x){return x!=null});rtxt.textContent=any&&done()?'Couleurs choisies pour chaque marque-page :':'Tous de couleur '+NAMES[st.c].toLowerCase()+' (ou choisissez une couleur par marque-page) :';strp()}}
    function slots(){slotsEl.innerHTML='';for(var i=0;i<st.n;i++){(function(i){var k=sl[i],b=document.createElement('button');b.type='button';b.className='mq-slot'+(k!=null?' full':'');b.innerHTML=k!=null?'<img src="'+IMGS[k]+'" alt=""/><small>'+NAMES[k]+'</small><i>×</i>':'<span>'+(i+1)+'</span><small>à choisir</small>';b.addEventListener('click',function(){sl[i]=null;slots()});slotsEl.appendChild(b)})(i)}
      var m=0;for(var j=0;j<st.n;j++)if(sl[j]==null)m++;hint.textContent=m?('Touchez une couleur : marque-page '+(st.n-m+1)+' sur '+st.n):'Coffret complet.';hint.className='mq-hint'+(m?'':' ok');ok.disabled=m>0;slotsEl.style.gridTemplateColumns='repeat('+st.n+',minmax(0,92px))';slotsEl.style.justifyContent='center'}
    pick.innerHTML=NAMES.map(function(n,k){return '<button type="button" class="mx-pk" data-k="'+k+'"><img src="'+IMGS[k]+'" alt=""/><span>'+n+'</span></button>'}).join('');
    $$('.mx-pk',pick).forEach(function(b){b.addEventListener('click',function(){var k=+b.dataset.k,i=0;while(i<st.n&&sl[i]!=null)i++;sl[Math.min(i,st.n-1)]=k;slots()})});
    st.onc=maj;formats(r,st,function(){sl=[];maj()});
    $('#c-open').addEventListener('click',function(){$('#c-sht').textContent='Mon coffret de '+st.n;slots();sheet.hidden=false});
    $('#c-close').addEventListener('click',function(){sheet.hidden=true});ok.addEventListener('click',function(){sheet.hidden=true;maj()});maj()})();
  // D
  (function(){var r=$('.mx-p[data-p=D]'),st=radio(r),tot=$('#d-tot'),two=$('#d-two'),opts=$$('.mx-opt',r);
    function maj(){seulImg(r,st);tot.textContent=eur(9.9*st.n+st.box);two.hidden=st.n<2}
    st.onc=maj;formats(r,st,maj);opts.forEach(function(o){o.addEventListener('click',function(){opts.forEach(function(x){x.classList.remove('on')});o.classList.add('on')})});maj()})();
})();
'''.replace("__NAMES__", str([n for n, _ in COULEURS]).replace("'", '"')).replace("__IMGS__", "[" + ",".join('"' + IMG[n] + '"' for n, _ in COULEURS) + "]").replace("__B4__", BOX4).replace("__B2__", BOX2)

TABS = "".join(f'<button type="button" class="mx-tab" data-p="{k}">{t}</button>' for k, t in
               [("A", "A · Même couleur"), ("B", "B · + et −"), ("C", "C · Fenêtre"), ("D", "D · Assortiment")])
BODY = ('<div class="mx-wrap"><div class="mx-banner">MAQUETTE — 4 idées pour choisir les couleurs d\'un coffret · <b>rien n\'est en ligne</b></div>'
        '<h1>Marque-pages : choisir les couleurs d\'un coffret</h1>'
        '<p class="mx-sub">La couleur reste tout en haut, comme avant, puis le format. Quatre façons de gérer les coffrets de 2 ou 4 marque-pages : touchez les onglets, jouez avec chaque idée.</p>'
        f'<div class="mx-tabs">{TABS}</div>{pA}{pB}{pC}{pD}</div>')
TITLE = "<title>Marque-pages, idées de choix (maquette)</title>"
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;700&display=swap">'
frag = f'<meta charset="utf-8">{TITLE}{FONTS}<style>{CSS}\n{CSS2}</style>{BODY}<script>{JS}</script>'
full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{TITLE}{FONTS}<style>{CSS}\n{CSS2}</style></head><body>{BODY}<script>{JS}</script></body></html>'
open(os.path.join(OUT, "marque-pages-idees.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "marque-pages-idees.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
