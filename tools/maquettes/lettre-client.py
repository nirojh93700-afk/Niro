#!/usr/bin/env python3
"""Maquette « Lettre de naissance », version SIMPLE pour les clientes (13/11/2026) — RIEN en ligne.

Le gérant, le 13/11 soir, devant l'outil d'atelier « Lettre à incruster » : « tu touches pas à l'atelier que tu m'as fait, j'aime bien
tous les détails… il faut que tu facilites au maximum pour les clients, pour mettre sur le site. Ne mets rien sur le site… dans admin
tu laisses comme c'est… une deuxième version des produits qu'on a mis ».

  python3 tools/maquettes/lettre-client.py <page de base> <clipper.js> <opentype.min.js> <sortie.html>

<page de base> = la sortie d'un autre créateur (arbre-createur.py par exemple) : on en garde l'habillage du site.
Le CALCUL est celui de l'outil d'atelier, sans y toucher : tools/maquettes/lettre-incrustee.js (window.NivLettre) et les champs de
lettre-incrustee.py, posés dans la page mais cachés. Par-dessus, un parcours court : le prénom, la naissance, la couleur, le dessin,
la boîte, le résumé. Aucun réglage de machine, aucune planche, jamais le nombre de pièces : tout se place tout seul.
"""
import ast, base64, json, os, re, sys

base, fclip, fopen, out = sys.argv[1:5]
ici = os.path.dirname(os.path.abspath(__file__))
racine = os.path.dirname(os.path.dirname(ici))
A = os.path.join(racine, "docs/maquettes/assets")

PRIX = {"lettre": 34.9, "boite": 15.0}          # proposés par moi, à valider
HAUT = 165                                      # hauteur de la lettre, mm (valeur de l'outil pour une zone de 180 mm)
EXEMPLE = {"nom": "Camille", "date": "2026-04-13", "heure": "09:20", "taille": "51", "poids": "3160"}

# ---- le moteur de l'outil d'atelier, repris tel quel ----
src_py = open(os.path.join(ici, "lettre-incrustee.py"), encoding="utf-8").read()
POL = ast.literal_eval(re.search(r"^POL = (\[.*?\]\])$", src_py, flags=re.S | re.M).group(1))
HTML_MOTEUR = re.search(r'^HTML = r"""(.*?)"""', src_py, flags=re.S | re.M).group(1)
vue_moteur = re.search(r'<section class="li-vue".*?</section>', HTML_MOTEUR, flags=re.S).group(0)
HTML_MOTEUR = HTML_MOTEUR.replace(vue_moteur, "")            # l'aperçu passe dans la fiche ; le reste est caché
pol = [{"id": i, "nom": n, "role": r, "b": base64.b64encode(open(os.path.join(A, f), "rb").read()).decode()} for i, n, f, r in POL]
moteur = open(os.path.join(ici, "lettre-incrustee.js"), encoding="utf-8").read()
cle = "function cleMem() { return SEULE ? 'niv-boite-seule' : 'niv-lettre-incrustee'; }"
assert moteur.count(cle) == 1
moteur = moteur.replace(cle, "function cleMem() { return 'niv-lettre-cliente-moteur'; }")   # jamais la mémoire de l'atelier
bloc = re.search(r"var ANIMAUX = \[(.*?)\]\];", moteur, flags=re.S).group(1)
rd = "function rendre() { if (!T3) return;"
assert moteur.count(rd) == 1
moteur = moteur.replace(rd, rd + " window.NivLettre3 = T3;")                                  # la page cliente anime cette scène
ANIMAUX = [[a, n, int(c, 16)] for a, n, c in re.findall(r"\['([\w-]+)', '([^']+)', (0x[0-9A-Fa-f]+)\]", bloc)]
assert len(ANIMAUX) > 40
coul = re.search(r"var COULEURS = (\[\[.*?\]\]);", moteur).group(1)
COULEURS = ast.literal_eval(coul)

# ---- l'habillage du site ----
s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Lettre de naissance</title>", tete, count=1, flags=re.S)
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · lettre de naissance, version simple pour les clientes. Rien n'est en ligne, rien n'est vendu.\2", tete, count=1, flags=re.S)
fil = re.search(r"<nav class=\"container\".*?</nav>", s[i_main:j_main], flags=re.S)
fil = fil.group(0) if fil else ""
fil = re.sub(r"(<span[^>]*>|<a[^>]*>)(Déco &amp; Maison|Déco & Maison|Maison &amp; Déco|Maison & Déco)(</span>|</a>)", r"\1Bébé &amp; Enfant\3", fil)

# La police des dessins sert aussi aux boutons du choix du dessin. Le navigateur est plus strict que le calcul : on lui en donne une
# copie sans les tables verticales (les dessins des signes ajoutés n'y sont pas déclarés). Le fichier d'origine n'est pas touché.
def police_boutons():
    import io
    from fontTools.ttLib import TTFont
    f = TTFont(os.path.join(A, "lettre/animaux.ttf"))
    for t in ("vhea", "vmtx", "STAT"):
        if t in f: del f[t]
    b = io.BytesIO(); f.save(b); return base64.b64encode(b.getvalue()).decode()

# Images d'exemple (lettre seule, boîte fermée, boîte ouverte), dessinées par l'outil lui-même :
#   NODE_PATH=$(npm root -g) node tools/maquettes/lettre-client-images.cjs <page fabriquée> <three.min.js> docs/maquettes/assets/lettre-cliente
# puis relancer ce générateur. Sans ces images, la page se fabrique quand même (le bloc « Une vraie boîte » est caché).
def image(nom):
    f = os.path.join(A, "lettre-cliente", nom + ".webp")
    return "data:image/webp;base64," + base64.b64encode(open(f, "rb").read()).decode() if os.path.exists(f) else ""
IMG = {n: image(n) for n in ("lettre-seule", "boite-fermee", "boite-ouverte")}
def img(nom, alt):
    return '<img src="%s" alt="%s" loading="lazy">' % (IMG[nom], alt) if IMG[nom] else ""

DONNEES = json.dumps({"prix": PRIX, "policeDessins": police_boutons(), "haut": HAUT, "exemple": EXEMPLE, "animaux": ANIMAUX, "couleurs": COULEURS,
                      "formes": [[p["id"], re.sub(r"\s*\(.*\)", "", p["nom"])] for p in pol if p["role"] == "lettre"],
                      "ecritures": [[p["id"], p["nom"]] for p in pol if p["role"] == "nom"]}, ensure_ascii=False, separators=(",", ":"))

CSS = r"""
.lc-stage{background:linear-gradient(#fbf7ee,#f1e7d4)}
.lc-stage .li-scene{position:relative;height:42vh;min-height:250px;max-height:440px}
.lc-stage .li-scene svg,.lc-stage .li-scene canvas{position:absolute;inset:0;width:100%;height:100%;max-height:none;display:block}
.lc-stage .li-scene svg{pointer-events:none;padding:50px 0 12px;box-sizing:border-box}
.lc-stage .li-zone{fill:transparent;stroke:none}
.lc-stage .li-scene canvas{touch-action:none;cursor:grab}
.lc-vue{position:absolute;right:10px;top:10px;z-index:3;display:flex;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:3px}
.lc-vue button{border:0;background:none;font:inherit;font-size:.78rem;font-weight:700;padding:7px 14px;border-radius:999px;cursor:pointer;color:var(--ink-soft);min-height:34px}
.lc-vue button.on{background:var(--ink);color:#fff}
.lc-ex{position:absolute;left:10px;top:10px;z-index:3;font-size:.72rem;font-weight:700;background:var(--gold);color:#1a1206;border-radius:999px;padding:5px 11px}
.lc-dim{position:absolute;left:10px;bottom:10px;z-index:3;font-size:.72rem;font-weight:600;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--ink)}
@media (min-width:901px){.lc-stage .li-scene{height:min(64vh,600px);max-height:none}}
.lc-champ{display:grid;gap:4px;font-size:.82rem;color:var(--ink-soft);min-width:0}
.lc-champ input{min-height:46px;padding:9px 12px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:1rem;background:#fff;color:var(--ink);width:100%;min-width:0;box-sizing:border-box}
.lc-champ input:focus{outline:2px solid var(--gold);outline-offset:1px}
.lc-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lc-case{display:flex;align-items:flex-start;gap:9px;margin:12px 0 0;font-size:.92rem;color:var(--ink);cursor:pointer;line-height:1.35}
.lc-case input{width:20px;height:20px;flex:none;margin:1px 0 0;accent-color:var(--gold-dark)}
.lc-couls{display:flex;flex-wrap:wrap;gap:8px}
.lc-couls button{display:flex;align-items:center;gap:7px;min-height:44px;padding:6px 13px 6px 7px;border:1.5px solid var(--line);border-radius:999px;background:#fff;font:inherit;font-size:.86rem;color:var(--ink);cursor:pointer}
.lc-couls button i{width:26px;height:26px;border-radius:50%;border:1px solid rgba(0,0,0,.14)}
.lc-couls button.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.lc-dessins{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}
@media (max-width:520px){.lc-dessins{grid-template-columns:repeat(4,minmax(0,1fr))}}
.lc-dessins button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:74px;padding:6px 3px 5px;border:1.5px solid var(--line);border-radius:12px;background:#fff;color:var(--ink);cursor:pointer;min-width:0;font:inherit}
.lc-dessins button span{font-family:'lc-animaux';font-size:34px;line-height:1.1}
.lc-dessins button small{font-size:.66rem;line-height:1.15;color:var(--ink-soft);text-align:center;overflow-wrap:anywhere}
.lc-dessins button.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.lc-dessins button.sans span{font:600 .8rem Inter,system-ui,sans-serif;line-height:34px}
.lc-lien{display:inline-block;margin:10px 0 0;background:none;border:0;padding:6px 0;color:var(--gold-dark);font:600 .9rem Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}
.lc-rang{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.lc-pols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.lc-pols button{min-height:60px;padding:6px 8px;border:1.5px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;color:var(--ink);font-size:1.5rem;line-height:1.1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lc-pols button small{display:block;font:500 .68rem Inter,system-ui,sans-serif;color:var(--ink-soft);margin-top:2px}
.lc-pols button.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold);background:#fffaf0}
.lc-pols.nom{grid-template-columns:repeat(2,minmax(0,1fr))}.lc-pols.nom button{font-size:1.2rem}
.lc-plus{margin:14px 0 0;border:1px solid var(--line);border-radius:12px;background:var(--paper)}
.lc-plus summary{cursor:pointer;padding:12px 14px;font-weight:600;font-size:.92rem;list-style:none;display:flex;justify-content:space-between;gap:10px}
.lc-plus summary::-webkit-details-marker{display:none}.lc-plus summary::after{content:"▾";color:var(--ink-soft)}.lc-plus[open] summary::after{content:"▴"}
.lc-plus .in{padding:0 14px 14px;display:grid;gap:10px}
.lc-boites{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.lc-boites .sc-style{display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:8px}
.lc-boites .sc-style img{width:100%;max-width:170px;aspect-ratio:1;object-fit:contain;border-radius:10px;background:linear-gradient(#fbf7ee,#f1e7d4)}
.lc-tour{position:absolute;left:10px;bottom:10px;z-index:3;border:1px solid var(--line);background:rgba(255,255,255,.92);border-radius:999px;font:inherit;font-size:.78rem;font-weight:700;padding:7px 13px;min-height:34px;color:var(--ink);cursor:pointer}
.lc-vraie{margin:18px 0 0;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
.lc-vraie h3{margin:0 0 4px;font-size:1.05rem}.lc-vraie p{margin:0 0 10px;font-size:.9rem;color:var(--ink-soft);line-height:1.45}
.lc-vraie .im{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.lc-vraie figure{margin:0}.lc-vraie img{display:block;width:100%;aspect-ratio:1;object-fit:contain;border-radius:12px;background:linear-gradient(#fbf7ee,#f1e7d4)}
.lc-vraie figcaption{font-size:.8rem;color:var(--ink);margin-top:5px;line-height:1.3;text-align:center}
.lc-note{margin:10px 0 0;padding:9px 12px;border-radius:10px;background:#fdf3e4;color:#7a4a12;font-size:.86rem;line-height:1.4}
.lc-points{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:6px;font-size:.9rem;color:var(--ink)}
.lc-points li{padding-left:22px;position:relative}.lc-points li::before{content:"✦";position:absolute;left:0;color:var(--gold-dark)}
"""

MAIN = r"""<main>
__FIL__
<div class="container"><div class="product-layout sc-layout">
 <div class="sc-left">
  <div class="sc-stage lc-stage" id="stage" data-vue="creation">
   <span class="lc-ex" id="exTag" hidden>Exemple</span>
   <div class="lc-vue" role="group" aria-label="Vue"><button type="button" id="vFace" class="on">De face</button><button type="button" id="v3d">3D</button></div>
   <div class="li-scene" id="scene"><svg id="svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu de votre lettre"></svg><canvas id="c3d" hidden></canvas></div>
   <button type="button" class="lc-tour" id="lcTour" hidden>↻ Faire tourner</button>
   <button type="button" id="bNum" hidden></button><button type="button" id="bAuto" hidden></button><p id="aide" hidden></p>
  </div>
  <p class="sc-aide" id="aideC">Votre lettre se dessine au fur et à mesure, tout se place tout seul. Environ __HAUTCM__ cm de haut.</p>
 </div>
 <div class="product-info">
  <div class="breadcrumb"><a href="#">Boutique</a> / <a href="#">Bébé &amp; Enfant</a></div>
  <div class="pd-titrerow"><h1>Lettre de naissance personnalisée : son initiale, décorée de sa naissance</h1></div>
  <p style="color:var(--ink-soft);margin-top:0">La première lettre de son prénom, avec sa date, son heure, sa taille et son poids de naissance, incrustés en blanc dans la lettre de couleur. Un souvenir à poser dans sa chambre.</p>
  <div class="price-lead" id="prixtete"></div>
<div class="prc" id="prc">
 <div class="prc-head"><p class="prc-title">Créez sa lettre</p><p class="prc-sub">Écrivez, choisissez : la lettre se dessine au-dessus.</p></div>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n1">1</span><h3>Son prénom</h3></div>
  <label class="lc-champ"><span>Le prénom</span><input id="c-nom" maxlength="16" autocomplete="off" placeholder="Prénom"></label>
  <p class="prc-hint">La première lettre du prénom fait la grande lettre. Le prénom est posé dessus, sur sa plaque.</p>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num" id="n2">2</span><h3>Sa naissance</h3></div>
  <div class="lc-g2">
   <label class="lc-champ"><span>Date de naissance</span><input id="c-date" type="date"></label>
   <label class="lc-champ"><span>Heure</span><input id="c-heure" type="time"></label>
   <label class="lc-champ"><span>Taille (cm)</span><input id="c-taille" inputmode="decimal" maxlength="5" placeholder="51"></label>
   <label class="lc-champ"><span>Poids (g)</span><input id="c-poids" inputmode="numeric" maxlength="5" placeholder="3160"></label>
  </div>
  <p class="prc-hint">Laissez vide ce que vous ne voulez pas : seul ce que vous écrivez est posé sur la lettre. L'horloge se met toute seule à l'heure de naissance.</p>
  <label class="lc-case"><input type="checkbox" id="c-signe"> Ajouter son signe du zodiaque (il se calcule avec la date de naissance)</label>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">3</span><h3>La couleur de la lettre</h3></div>
  <div class="lc-couls" id="couls"></div>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">4</span><h3>Son petit dessin</h3></div>
  <div class="lc-dessins" id="dessins"></div>
  <button type="button" class="lc-lien" id="tousDessins">Voir tous les dessins</button>
  <p class="prc-legend" style="margin-top:14px">Les petits décors autour</p>
  <div class="sc-styles lc-rang" id="decors"></div>
  <details class="lc-plus"><summary>Changer la forme de la lettre ou l'écriture du prénom</summary><div class="in">
   <p class="prc-legend" style="margin:0">La forme de la grande lettre</p><div class="lc-pols" id="formes"></div>
   <p class="prc-legend" style="margin:0">L'écriture du prénom</p><div class="lc-pols nom" id="ecritures"></div>
  </div></details>
 </section>
 <section class="prc-step">
  <div class="prc-sh"><span class="prc-num done">5</span><h3>Avec sa boîte ?</h3></div>
  <div class="sc-styles lc-boites" id="boites">
   <button type="button" class="sc-style" data-v="0">__IMG_SEULE__<b>La lettre seule</b><small>À poser ou à accrocher</small></button>
   <button type="button" class="sc-style" data-v="1">__IMG_OUVERTE_C__<b>La lettre et sa boîte</b><small id="prixBoite"></small></button>
  </div>
  <p class="prc-hint">Avec la boîte, la lettre décorée devient le couvercle d'une boîte en bois de la même forme : pour garder son bracelet de naissance, sa première tétine, ses petits souvenirs. Choisissez-la : elle s'ouvre devant vous, dans l'aperçu.</p>
 </section>
 <section class="prc-step" id="etape3">
  <div class="prc-sh"><span class="prc-num done">6</span><h3>Votre commande</h3></div>
  <div class="prc-sum" id="resume"></div>
  <p class="lc-note" id="note" hidden></p>
 </section>
</div>
<div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total"></span></div>
<p class="prc-hint prc-miss" id="manque"></p>
<div class="qty-row"><button class="btn btn-gold" id="ajouter" style="flex:1" type="button">Ajouter au panier</button></div>
<div class="lc-vraie"__VRAIE_CACHE__>
 <h3>Une vraie boîte, en forme de sa lettre</h3>
 <p>La lettre décorée est le couvercle. On le soulève : dessous, une boîte en bois de la même forme, pour garder ses premiers souvenirs.</p>
 <div class="im"><figure>__IMG_FERMEE__<figcaption>Fermée : la lettre décorée est le couvercle</figcaption></figure><figure>__IMG_OUVERTE__<figcaption>Ouverte : la place pour ses souvenirs</figcaption></figure></div>
</div>
<ul class="lc-points">
 <li>Montée et collée dans notre atelier : elle arrive prête à offrir.</li>
 <li>Environ __HAUTCM__ cm de haut. Les informations en blanc sont incrustées dans la lettre de couleur, les détails sont gravés.</li>
 <li>Pièce personnalisée, fabriquée à la commande.</li>
</ul>
 </div>
</div></div>

<section class="sc-atelier"><div class="container">
 <h2>De votre côté : rien ne change dans L'atelier</h2>
 <p>Cette page est la version simple, pour les clientes. Elle se sert du même calcul que votre outil « Lettre à incruster » de Gestion : à la commande, vous retrouvez la lettre dans L'atelier avec tous vos réglages (pièces, boîte, machine, fichiers), et vous pouvez tout corriger avant de découper.</p>
 <div class="sc-avalider"><b>À valider avec vous avant de construire</b><ul>
  <li>Prix proposés par moi : __PRIXL__ la lettre décorée, __PRIXB__ de plus avec sa boîte. Relevé du marché : lettre en bois simplement gravée 12 à 21 €, prénom de naissance en bois 35 à 45 €.</li>
  <li>Une seule taille : environ __HAUTCM__ cm de haut (ce que votre machine découpe aujourd'hui dans 180 × 180 mm).</li>
  <li>La cliente ne déplace rien et ne règle aucune pièce : tout se place tout seul. Sur une lettre fine (I, J, L…), la lettre est épaissie toute seule pour faire de la place, et le prénom dépasse sur le côté, comme sur votre outil.</li>
  <li>En 3D, la lettre tourne toute seule sur 360° et, avec la boîte, le couvercle se soulève et se repose : la cliente voit que c'est une boîte. Les images « fermée / ouverte » sont un exemple (prénom Camille) dessiné par l'outil : à remplacer par de vraies photos dès que vous en avez.</li>
  <li>Les sept couleurs sont celles de l'aperçu de votre outil : à remplacer par vos vraies couleurs (peinture ou matière).</li>
  <li>Le signe du zodiaque reste tel qu'il est aujourd'hui dans l'outil (vous l'avez mis de côté) ; la case permet de ne pas le mettre.</li>
  <li>Le texte libre, l'horloge ajourée, « Gravé » au lieu d'« Incrusté » et les réglages de la boîte ne sont pas proposés à la cliente.</li>
 </ul></div>
</div></section>
</main>"""

JS = r"""
(function(){
var D=__DONNEES__,N=window.NivLettre,L=window.LI_DONNEES;
function $(i){return document.getElementById(i)}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function eur(v){return v.toFixed(2).replace('.',',')+' €'}
var CLE='niv-lettre-cliente';
var C={nom:'',date:'',heure:'',taille:'',poids:'',signe:true,coul:D.couleurs[0][0],animal:D.animaux[0][0],decor:'etoiles',pol:D.formes[0][0],polNom:D.ecritures[0][0],boite:false};
try{var m=JSON.parse(localStorage.getItem(CLE)||'null');if(m)Object.keys(C).forEach(function(k){if(m[k]!==undefined)C[k]=m[k]})}catch(e){}
function garder(){try{localStorage.setItem(CLE,JSON.stringify(C))}catch(e){}}
/* les écritures de l'outil servent aussi aux boutons */
L.pol.forEach(function(p){try{var f=new FontFace('lc-'+p.id,'url(data:font/ttf;base64,'+(p.id==='animaux'?D.policeDessins:p.b)+')');f.load().then(function(x){document.fonts.add(x)},function(){})}catch(e){}});
function vide(){return !C.nom.trim()&&!C.date&&!C.heure&&!String(C.taille).trim()&&!String(C.poids).trim()}
function initiale(){var l=(vide()?D.exemple.nom:C.nom||'P').trim().charAt(0)||'P';l=l.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();return /[A-Z0-9]/.test(l)?l:'P'}
var DECORS=[['etoiles','Étoiles'],['nuages','Nuages'],['coeurs','Cœurs'],['lune','Lune et étoiles'],['melange','Mélange'],['sans','Sans décor']],tous=false,note='';
function appliquer(){var S=N.etat(),ex=vide(),src=ex?D.exemple:C;
 S.nom=String(src.nom||'').trim();S.lettre='';S.date=src.date||'';S.heure=src.heure||'';S.taille=String(src.taille||'').trim();S.poids=String(src.poids||'').trim();S.libre='';
 S.coul=C.coul;S.animal=C.animal;S.decor=C.decor==='sans'?'etoiles':C.decor;S.nbEt=C.decor==='sans'?0:6;S.signe=C.signe?'auto':'aucun';S.signeStyle='dessin';S.horloge='grave';
 S.pol=C.pol;S.polNom=C.polNom;S.H=D.haut;S.bord=3;S.bt.on=!!C.boite;S.exemple=false;S.num=false;S.sel=null;
 Object.keys(S.el).forEach(function(i){var e=S.el[i];e.on=true;e.mode='inc';e.auto=true;e.k=1});
 /* une lettre fine : on l'épaissit jusqu'à ce que tout tienne */
 var g=null,gras=[0,3,6],i;for(i=0;i<gras.length;i++){S.gras=gras[i];N.maj();g=N.calcul();if(!g.perdus||!g.perdus.length)break}
 note=g&&g.perdus&&g.perdus.length?'Sur cette lettre, il n\'y a pas la place pour : '+g.perdus.map(function(a){return a.d.nom.toLowerCase()}).join(', ')+'. Pour lui faire de la place, retirez le signe du zodiaque ou une information.':'';
 $('exTag').hidden=!ex;
 ecran()}
function total(){return D.prix.lettre+(C.boite?D.prix.boite:0)}
function nomDe(l,id){var x=l.filter(function(q){return q[0]===id})[0];return x?x[1]:''}
function dateFr(d){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(d||'');return m?m[3]+'/'+m[2]+'/'+m[1]:''}
function ecran(){
 $('couls').innerHTML=D.couleurs.map(function(c){return '<button type="button" data-coul="'+c[0]+'" class="'+(C.coul===c[0]?'on':'')+'" aria-pressed="'+(C.coul===c[0])+'"><i style="background:'+c[2]+'"></i>'+esc(c[1])+'</button>'}).join('');
 var la=D.animaux.slice(),ic=la.map(function(a){return a[0]}).indexOf(C.animal);if(!tous){la=la.slice(0,11);if(ic>10)la[10]=D.animaux[ic]}
 $('dessins').innerHTML=la.map(function(a){return '<button type="button" data-an="'+a[0]+'" class="'+(C.animal===a[0]?'on':'')+'" aria-pressed="'+(C.animal===a[0])+'"><span aria-hidden="true">'+String.fromCodePoint(a[2])+'</span><small>'+esc(a[1])+'</small></button>'}).join('')
  +'<button type="button" data-an="aucun" class="sans'+(C.animal==='aucun'?' on':'')+'" aria-pressed="'+(C.animal==='aucun')+'"><span>Aucun</span><small>Sans dessin</small></button>';
 $('tousDessins').textContent=tous?'Voir moins de dessins':'Voir tous les dessins';
 $('decors').innerHTML=DECORS.map(function(d){return '<button type="button" class="sc-style'+(C.decor===d[0]?' on':'')+'" data-dec="'+d[0]+'" aria-pressed="'+(C.decor===d[0])+'"><b>'+d[1]+'</b></button>'}).join('');
 var li=initiale(),pn=(vide()?D.exemple.nom:C.nom.trim())||'Prénom';
 $('formes').innerHTML=D.formes.map(function(f){return '<button type="button" data-pol="'+f[0]+'" class="'+(C.pol===f[0]?'on':'')+'" style="font-family:\'lc-'+f[0]+'\',serif" aria-pressed="'+(C.pol===f[0])+'">'+esc(li)+'<small>'+esc(f[1])+'</small></button>'}).join('');
 $('ecritures').innerHTML=D.ecritures.map(function(f){return '<button type="button" data-ecr="'+f[0]+'" class="'+(C.polNom===f[0]?'on':'')+'" style="font-family:\'lc-'+f[0]+'\',cursive" aria-pressed="'+(C.polNom===f[0])+'">'+esc(pn)+'<small>'+esc(f[1])+'</small></button>'}).join('');
 [].forEach.call(document.querySelectorAll('#boites button'),function(b){var on=(b.getAttribute('data-v')==='1')===!!C.boite;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
 $('prixBoite').textContent='+ '+eur(D.prix.boite);$('c-signe').checked=!!C.signe;
 $('n1').classList.toggle('done',!!C.nom.trim());$('n2').classList.toggle('done',!!(C.date||C.heure||String(C.taille).trim()||String(C.poids).trim()));
 var l=[];if(C.nom.trim()){l.push(['Prénom',esc(C.nom.trim())]);l.push(['Grande lettre',esc(li)])}
 if(C.date)l.push(['Né(e) le',dateFr(C.date)]);if(C.heure)l.push(['Heure',esc(C.heure.replace(':',' h '))]);
 if(String(C.taille).trim())l.push(['Taille',esc(String(C.taille).trim())+' cm']);if(String(C.poids).trim())l.push(['Poids',esc(String(C.poids).trim())+' g']);
 if(C.date)l.push(['Signe du zodiaque',C.signe?'Oui':'Non']);
 l.push(['Couleur',esc(nomDe(D.couleurs,C.coul))]);l.push(['Dessin',C.animal==='aucun'?'Sans dessin':esc(nomDe(D.animaux,C.animal))]);l.push(['Petits décors',nomDe(DECORS,C.decor)]);
 l.push(['Forme de la lettre',esc(nomDe(D.formes,C.pol))]);l.push(['Écriture du prénom',esc(nomDe(D.ecritures,C.polNom))]);
 l.push(['Lettre décorée',eur(D.prix.lettre)]);if(C.boite)l.push(['Sa boîte','+ '+eur(D.prix.boite)]);
 $('resume').innerHTML=l.map(function(r){return '<div class="prc-sumrow"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>'}).join('');
 $('note').hidden=!note;$('note').textContent=note;
 $('total').textContent=eur(total());$('prixtete').innerHTML='<span class="price">'+eur(D.prix.lettre)+'</span> <span style="color:var(--ink-soft);font-size:.9rem">la lettre décorée</span>';
 var ok=!!C.nom.trim();$('ajouter').disabled=!ok;$('manque').textContent=ok?'':'Écrivez le prénom pour continuer.';if(ok&&$('ajouter').textContent!=='Ajouter au panier')$('ajouter').textContent='Ajouter au panier';
 if(N.etat().vue==='3d')lancer();decoller()}
/* ---- la 3D s'anime : un tour complet, et la boîte s'ouvre et se referme ---- */
var A={auto:!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),t:0,dern:0,raf:0},POSE=null;
function lis(u){return u*u*(3-2*u)}
function ouverture(t){var x=t%6.4;return x<1.2?-14:x<2.8?-14+24*lis((x-1.2)/1.6):x<4.8?10:10-24*lis((x-4.8)/1.6)}   /* mm : -14 = posé sur la boîte, +10 = soulevé */
function image(ts){A.raf=0;var S=N.etat(),T=window.NivLettre3;if(S.vue!=='3d')return;if(!T||!T.g.children.length){A.raf=requestAnimationFrame(image);return}
 var g=N.calcul(),dt=A.dern?Math.min(.05,(ts-A.dern)/1000):0;A.dern=ts;
 if(POSE){T.rx=POSE.rx;T.ry=POSE.ry}else{A.t+=dt;if(A.auto)T.ry+=dt*2*Math.PI/12}
 if(g&&g.bt){var ch=T.g.children,nb=g.bt.dos?4:3,kk=100/g.bf.h,dz=(g.bt.Hm+14)/2*kk,o=POSE?POSE.ouv:ouverture(A.t),i;for(i=0;i<ch.length-nb;i++){ch[i].position.z=dz+o*kk;ch[i].position.x=POSE&&POSE.dx?POSE.dx*kk:0}}
 T.g.rotation.set(T.rx,T.ry,0);T.r.render(T.sc,T.cam);if(!POSE&&(A.auto||(g&&g.bt)))A.raf=requestAnimationFrame(image)}
function lancer(){if(!A.raf){A.dern=0;A.raf=requestAnimationFrame(image)}}
function aide3(){var S=N.etat(),en3=S.vue==='3d';$('lcTour').hidden=!en3||A.auto;
 $('aideC').textContent=!en3?'Votre lettre se dessine au fur et à mesure, tout se place tout seul. Environ '+String(D.haut/10).replace('.',',')+' cm de haut.':(C.boite?'Votre lettre est le couvercle : la boîte s\'ouvre et se referme. Faites-la tourner avec le doigt.':'Votre lettre tourne sur elle-même. Faites-la tourner avec le doigt.')}
$('c3d').addEventListener('pointerdown',function(){if(A.auto){A.auto=false;aide3()}});
var att=null;function plusTard(){clearTimeout(att);att=setTimeout(function(){garder();appliquer()},140)}
['nom','date','heure','taille','poids'].forEach(function(k){var el=$('c-'+k);el.value=C[k];el.addEventListener('input',function(){C[k]=el.value;plusTard()});el.addEventListener('change',function(){C[k]=el.value;plusTard()})});
$('c-signe').addEventListener('change',function(){C.signe=this.checked;garder();appliquer()});
document.addEventListener('click',function(ev){var b=ev.target.closest?ev.target.closest('button'):null,a;if(!b)return;
 if((a=b.getAttribute('data-coul')))C.coul=a;else if((a=b.getAttribute('data-an')))C.animal=a;else if((a=b.getAttribute('data-dec')))C.decor=a;
 else if((a=b.getAttribute('data-pol')))C.pol=a;else if((a=b.getAttribute('data-ecr')))C.polNom=a;
 else if(b.parentNode&&b.parentNode.id==='boites'){C.boite=b.getAttribute('data-v')==='1';garder();appliquer();if(C.boite){A.t=0;if(N.etat().vue!=='3d')$('v3d').click();else{lancer();aide3()}}else aide3();return}
 else if(b.id==='v3d'||b.id==='vFace'){setTimeout(function(){if(b.id==='v3d'){A.t=0;lancer()}aide3()},0);return}
 else if(b.id==='lcTour'){A.auto=true;lancer();aide3();return}
 else if(b.id==='tousDessins'){tous=!tous;ecran();return}
 else if(b.id==='ajouter'){b.textContent='Ajouté ✓ (maquette : rien n\'est commandé)';return}
 else return;
 garder();appliquer()});
/* l'aperçu se colle sous l'en-tête du site ; sur téléphone il se retire au résumé */
function sousEntete(){var h=document.querySelector('header'),t=0;if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;document.documentElement.style.setProperty('--sc-top',t+'px')}
sousEntete();window.addEventListener('resize',sousEntete);window.addEventListener('load',sousEntete);
var glisse=false;
function decoller(){glisse=false;var st=$('stage'),fin=$('resume'),d=0;
 if(window.matchMedia('(max-width:900px)').matches){var top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sc-top'))||0;
  d=Math.min(0,fin.getBoundingClientRect().top-(top+st.offsetHeight+8));d=Math.max(d,-(top+st.offsetHeight+30))}
 st.style.transform=d?'translateY('+Math.round(d)+'px)':'';st.style.visibility=d<=-(st.offsetHeight)?'hidden':''}
window.addEventListener('scroll',function(){if(!glisse){glisse=true;requestAnimationFrame(decoller)}},{passive:true});window.addEventListener('resize',decoller);
window.NivLettreCliente={etat:function(){return C},appliquer:appliquer,pose:function(p){POSE=p;A.raf=0;requestAnimationFrame(image)}};
appliquer();
})();
"""

def eur(v): return ("%.2f" % v).replace(".", ",") + " €"
MAIN = (MAIN.replace("__IMG_SEULE__", img("lettre-seule", "La lettre décorée seule")).replace("__IMG_OUVERTE_C__", img("boite-ouverte", "La lettre et sa boîte, ouverte"))
        .replace("__IMG_FERMEE__", img("boite-fermee", "La boîte fermée")).replace("__IMG_OUVERTE__", img("boite-ouverte", "La boîte ouverte"))
        .replace("__VRAIE_CACHE__", "" if IMG["boite-fermee"] and IMG["boite-ouverte"] else " hidden"))
MAIN = (MAIN.replace("__FIL__", fil).replace("__HAUTCM__", ("%.1f" % (HAUT / 10)).replace(".", ","))
        .replace("__PRIXL__", eur(PRIX["lettre"])).replace("__PRIXB__", eur(PRIX["boite"])))
page = (tete + "<style>" + CSS + "</style>" + MAIN
        + '<div hidden id="moteur">' + HTML_MOTEUR + "</div>" + pied
        + "<script>" + open(fclip, encoding="utf-8").read() + "</script>\n<script>" + open(fopen, encoding="utf-8").read() + "</script>\n"
        + "<script>window.LI_DONNEES=" + json.dumps({"pol": pol}, separators=(",", ":")) + ";</script>\n<script>" + moteur + "</script>\n"
        + "<script>(function(f){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f()})(function(){" + JS.replace("__DONNEES__", DONNEES) + "});</script>\n"
        + "<!-- niv-ok --><script>" + open(os.path.join(ici, "valider-champ.js"), encoding="utf-8").read() + "</script>\n")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(page)
print(out, round(len(page) / 1024), "Ko")
