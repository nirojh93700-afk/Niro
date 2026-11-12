#!/usr/bin/env python3
"""Démonstration de l'éditeur de l'atelier (12/11/2026), à publier en artifact : le gérant l'essaie sans que rien soit en ligne.

  python3 tools/maquettes/editeur-demo.py public/atelier-outils <sortie>

Copie les trois outils « mode atelier » (retouche-site.py) + editeur.js + fabrique.js + l'arbre « life », ajoute à chaque
outil un petit pont de messages (la page de démonstration ne peut pas lire dans le cadre), fournit les écritures avec la
page (polices.js : un artifact n'a pas le droit de lire Google Fonts par fetch) et écrit index.html : trois onglets,
« Fabriquer les fichiers », liste des fichiers avec aperçu et enregistrement.
"""
import base64, json, os, re, shutil, sys, urllib.request

src, out = sys.argv[1:3]
os.makedirs(os.path.join(out, "arbres"), exist_ok=True)
for n in sorted(os.listdir(os.path.join(src, "arbres"))):
    shutil.copy(os.path.join(src, "arbres", n), os.path.join(out, "arbres", n))
for n in ("editeur.js", "fabrique.js"):
    shutil.copy(os.path.join(src, n), os.path.join(out, n))

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
def lire(url, binaire=False):
    r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60).read()
    return r if binaire else r.decode("utf-8")

PONT = r"""<script>
(function(){
 function dire(m){try{parent.postMessage(m,'*')}catch(_){}}
 window.addEventListener('message',function(ev){var d=ev.data||{};if(d.type!=='niv-fabriquer'||!window.nivAtelier||!nivAtelier.pret)return;
  nivAtelier.fabriquer(function(f,t){dire({type:'niv-progres',fait:f,total:t})}).then(function(F){var al='';try{al=nivAtelier.alerte()||''}catch(_){}
   dire({type:'niv-fichiers',alerte:al,policesKo:[].slice.call(F.policesKo||[]),fichiers:[].map.call(F,function(f){return{nom:f.nom,svg:f.svg,w:f.w,h:f.h,titre:f.titre,matiere:f.matiere,note:f.note}})})
  }).catch(function(e){dire({type:'niv-erreur',message:String(e&&e.message||e)})})});
 var t=setInterval(function(){if(window.nivAtelier&&nivAtelier.pret){clearInterval(t);dire({type:'niv-pret'})}},300);
})();
</script>"""

liens = set()
for n in ("atelier-support.html", "atelier-arbre.html", "atelier-decoration.html"):
    s = open(os.path.join(src, n), encoding="utf-8").read()
    liens.update(re.findall(r'href="(https://fonts\.googleapis\.com/[^"]+)"', s))
    cle = '<script src="fabrique.js"></script>'
    assert s.count(cle) == 1 and s.count("</body></html>") == 1, n
    s = s.replace(cle, '<script src="polices.js"></script>' + cle).replace("</body></html>", PONT + "</body></html>")
    open(os.path.join(out, n), "w", encoding="utf-8").write(s)

# Les écritures (latin et latin étendu), embarquées : même tri que fabrique.js
pol, vus = [], set()
for l in sorted(liens):
    css = lire(l.replace("&amp;", "&"))
    for b in re.findall(r"@font-face\s*\{[^}]*\}", css):
        fam = re.search(r"font-family:\s*['\"]?([^;'\"]+)", b); url = re.search(r"url\((https:[^)]+)\)", b); ur = re.search(r"unicode-range:\s*([^;]+)", b)
        if not fam or not url: continue
        if ur and "U+0000-00FF" not in ur.group(1) and "U+0100" not in ur.group(1): continue
        if (b, url.group(1)) in vus: continue
        vus.add((b, url.group(1)))
        pol.append({"nom": fam.group(1).strip(), "css": b, "url": url.group(1),
                    "data": "data:font/woff2;base64," + base64.b64encode(lire(url.group(1), True)).decode()})
open(os.path.join(out, "polices.js"), "w", encoding="utf-8").write("window.NivPolices=" + json.dumps(pol, ensure_ascii=False) + ";")
print("polices.js", len(pol), "blocs,", round(os.path.getsize(os.path.join(out, "polices.js")) / 1024), "Ko")

INDEX = r"""<title>Éditeur de l'atelier</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@600&display=swap">
<style>
:root{--encre:#1a1206;--encre2:#2b2216;--creme:#fbf7ee;--sable:#efe6d3;--trait:#d9cbb0;--or:#c9a24b;--or2:#a98935;--or3:#e2c67e;--gris:#6b5d4a;--rouge:#8a2d1c;--rougefond:#fdf1ee;--rougetrait:#e9b9ad;--vert:#256b34;color-scheme:light}
html,body{height:100%}
body{margin:0;background:var(--creme);color:var(--encre);font:400 14px/1.45 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
button{font:inherit;color:inherit}
.haut{flex:none;background:var(--encre);color:var(--creme);padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.onglets{display:flex;gap:6px;flex:1 1 260px;min-width:0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.onglets::-webkit-scrollbar{display:none}
.onglets button{flex:none;min-height:40px;padding:0 12px;border:1px solid #6b5d4a;border-radius:10px;background:transparent;color:var(--creme);font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap}
.onglets button[aria-selected="true"]{background:var(--creme);color:var(--encre);border-color:var(--creme)}
.fab{flex:none;min-height:40px;padding:0 14px;border:1px solid var(--or2);border-radius:10px;background:linear-gradient(135deg,var(--or3),var(--or));color:var(--encre);font-weight:700;font-size:13.5px;cursor:pointer}
.fab:disabled{opacity:.55;cursor:default}
.etat{flex:1 1 100%;font-size:12px;color:#d9cbb0;min-height:17px}
.corps{flex:1;min-height:0;position:relative}
.corps iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--creme)}
.fich{position:absolute;inset:0;overflow:auto;background:var(--creme);padding:14px 16px calc(24px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}
.fich h2{margin:0;font:600 19px/1.25 "Playfair Display",Georgia,serif;text-wrap:balance}
.fich .sous{margin:2px 0 12px;font-size:12.5px;color:var(--gris)}
.al{margin:0 0 10px;padding:8px 11px;border-radius:10px;background:var(--rougefond);border:1px solid var(--rougetrait);color:var(--rouge);font-size:13px}
.grille{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr))}
.carte{min-width:0;display:grid;gap:8px;align-content:start;padding:11px;border:1px solid var(--trait);border-radius:14px;background:#fff}
.carte img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff;border:1px solid var(--sable);border-radius:9px}
.carte b{display:block;font-size:14px;overflow-wrap:anywhere}
.carte small{display:block;font-size:12px;color:var(--gris);overflow-wrap:anywhere}
.carte .mm{font-variant-numeric:tabular-nums;font-weight:600;font-size:12.5px}
.btn{min-height:42px;padding:0 13px;border:1px solid var(--trait);border-radius:10px;background:#fff;font-weight:600;font-size:13.5px;cursor:pointer}
.btn.or{border-color:var(--or2);background:linear-gradient(135deg,var(--or3),var(--or))}
.btn:active{background:var(--sable)}
.rang{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0}
.note{margin:12px 0 0;font-size:12.5px;color:var(--gris);max-width:65ch}
.ok{font-size:12.5px;font-weight:600;color:var(--vert);min-height:17px}
</style>
<div class="haut">
 <div class="onglets" role="tablist" aria-label="Les trois outils" id="onglets"></div>
 <button type="button" class="fab" id="fab" disabled>Fabriquer les fichiers</button>
 <div class="etat" id="etat" role="status">L'outil se charge…</div>
</div>
<div class="corps" id="corps">
 <div class="fich" id="fich" hidden></div>
</div>
<script>
(function(){
 var OUTILS=[{id:'support',t:'Support de téléphone',page:'atelier-support.html'},{id:'arbre',t:'Arbre de vie',page:'atelier-arbre.html'},{id:'deco',t:'Décoration',page:'atelier-decoration.html'}];
 var $=function(i){return document.getElementById(i)},cadres={},prets={},cur=null,occupe=false,dl=null,resultat=null;
 function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
 function mm(v){return String(Math.round(v*10)/10).replace('.',',')}
 function etat(t){$('etat').textContent=t}
 function maj(){
  [].forEach.call($('onglets').children,function(b){b.setAttribute('aria-selected',b.getAttribute('data-id')===cur?'true':'false')});
  for(var k in cadres)cadres[k].hidden=k!==cur||!!resultat;
  $('fich').hidden=!resultat;$('fab').disabled=occupe||!prets[cur]||!!resultat;
  if(!occupe)etat(resultat?'Vos fichiers sont prêts.':prets[cur]?'Touchez une pièce pour la régler, puis fabriquez les fichiers.':'L\'outil se charge…')}
 function ouvrir(id){if(occupe)return;cur=id;resultat=null;
  if(!cadres[id]){var o=OUTILS.filter(function(x){return x.id===id})[0],f=document.createElement('iframe');f.title='Outil : '+o.t;f.src=o.page;$('corps').appendChild(f);cadres[id]=f}
  maj()}
 OUTILS.forEach(function(o){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('data-id',o.id);b.textContent=o.t;b.addEventListener('click',function(){ouvrir(o.id)});$('onglets').appendChild(b)});
 $('fab').addEventListener('click',function(){if(!prets[cur]||occupe)return;occupe=true;etat('Fabrication des fichiers…');maj();cadres[cur].contentWindow.postMessage({type:'niv-fabriquer'},'*')});
 function de(ev){for(var k in cadres)if(cadres[k].contentWindow===ev.source)return k;return null}
 window.addEventListener('message',function(ev){var d=ev.data||{},k=de(ev);if(!k||!d.type)return;
  if(d.type==='niv-pret'){prets[k]=true;maj()}
  if(k!==cur)return;
  if(d.type==='niv-progres')etat('Fabrication des fichiers… '+d.fait+' / '+d.total);
  if(d.type==='niv-erreur'){occupe=false;maj();etat('La fabrication a échoué : '+d.message)}
  if(d.type==='niv-fichiers'){occupe=false;resultat=d;montrer(d);maj()}});
 function montrer(d){var h='<h2>Vos fichiers pour la machine</h2><p class="sous">Taille réelle en millimètres. Rouge : découpe. Noir : gravure.</p>';
  if(d.alerte)h+='<p class="al" role="alert">'+esc(d.alerte)+' À corriger avant de découper.</p>';
  if(d.policesKo&&d.policesKo.length)h+='<p class="al" role="alert">Cet appareil n\'a pas su charger l\'écriture '+d.policesKo.map(function(n){return '« '+esc(n)+' »'}).join(', ')+' : regardez bien l\'aperçu avant de graver.</p>';
  h+='<div class="grille">'+d.fichiers.map(function(f,i){return '<div class="carte"><img alt="Aperçu du fichier '+esc(f.titre||f.nom)+'" src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(f.svg)+'">'
   +'<div><b>'+esc(f.titre||f.nom)+'</b><small class="mm">'+mm(f.w)+' × '+mm(f.h)+' mm'+(f.matiere?' · '+esc(f.matiere):'')+'</small>'+(f.note?'<small>'+esc(f.note)+'</small>':'')+'<small>'+esc(f.nom)+'</small></div>'
   +(dl?'<button type="button" class="btn or" data-i="'+i+'">Enregistrer ce fichier</button><div class="ok" role="status"></div>':'')+'</div>'}).join('')+'</div>'
   +'<div class="rang"><button type="button" class="btn" id="encore">‹ Retoucher encore</button></div>'
   +(dl?'':'<p class="note">Ici, l\'enregistrement n\'est pas disponible : cette page sert à essayer l\'éditeur. Dans Gestion, chaque fichier a son bouton « Télécharger ».</p>')
   +'<p class="note">Démonstration : rien n\'est enregistré ni mis en ligne. « Retoucher encore » retrouve l\'outil tel que vous l\'avez laissé.</p>';
  $('fich').innerHTML=h;$('fich').scrollTop=0}
 $('fich').addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  if(b.id==='encore'){resultat=null;maj();return}
  var i=b.getAttribute('data-i');if(i==null||!dl||!resultat)return;var f=resultat.fichiers[+i],ok=b.nextElementSibling;ok.textContent='';
  dl.save({filename:f.nom,data:f.svg}).then(function(){ok.textContent='Fichier enregistré.'},function(e){var c=e&&e.code;
   ok.textContent=c==='declined'?'':c==='rate_limited'?'Un instant, puis réessayez.':'L\'enregistrement n\'a pas abouti ici.'})});
 if(window.claude&&claude.use)claude.use('downloads').then(function(n){dl=n||null;if(resultat){montrer(resultat)}},function(){});
 ouvrir('support');
})();
</script>
"""
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(INDEX)
for n in sorted(os.listdir(out)):
    p = os.path.join(out, n)
    if os.path.isfile(p): print(n, round(os.path.getsize(p) / 1024), "Ko")
