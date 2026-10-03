# -*- coding: utf-8 -*-
"""Maquette « parcours guidé » du GOBELET ISOTHERME 40 oz (03/10/2026).
Demande du gérant : « retravailler la maquette comme t'as fait pour les verres de vin ».
Part de la maquette VALIDÉE docs/maquettes/gobelet-configurateur-final.html (fiche, 4 couleurs
avec leurs photos, aperçu 3D flottant avec les NUMÉROS, planches, polices) et ne remplace QUE la
carte « Composez votre gravure » par le parcours guidé du site (vrai CSS .prc-* de globals.css) :
  ① Que voulez-vous graver au centre ? — un dessin (1–74) / mon propre texte / ma photo ou mon logo
     (= l'IMAGE PRINCIPALE, obligatoire, au centre de la face — règle validée du 25/09)
  ② le détail : planches (légende + numéros) puis le n°, ou le texte + l'écriture, ou la photo
  ③ Autour de votre gravure (facultatif, +3 € par élément) : dessin n°, cadre/banderole + nom
     (75–103), lettre fleurie + nom, texte — sur la face, les côtés ou tout autour
  ④ résumé + total ; « Ajouter au panier » grisé tant que l'image principale n'est pas choisie.
Règles gardées : 1 élément inclus, +3 € chacun en plus ; 8 écritures du site ; numéros sur le 3D.
Usage : python3 tools/maquettes/parcours-gobelet.py
"""
import re, json

ROOT = "/home/user/Niro"
SRC = f"{ROOT}/docs/maquettes/gobelet-configurateur-final.html"
OUT = f"{ROOT}/docs/maquettes/gobelet-parcours-guide.html"
PRIX = 39.90
EXTRA = 3

# Légendes lues sur les planches (numérotation validée : dessins 1–74, cadres 75–103)
LEG_DESSINS = [("1–10", "Fleurs & papillons"), ("11–27", "Roses"), ("28–36", "Volutes & arabesques"),
               ("37–45", "Cœurs & tiges fleuries"), ("46–51", "Fées & clé de sol"), ("52–55", "Fée & coins fleuris"),
               ("56–58", "Cœurs de couple (prénoms)"), ("59–64", "Cœur prénom, plumes, colibri"),
               ("65–70", "Animaux & oiseaux"), ("71–74", "Colibri, fée, musique")]
LEG_CADRES = [("75–79", "Cadres fleuris"), ("80–81", "Banderoles fleuries"), ("82–91", "Banderoles"),
              ("92–95", "Cadres classiques"), ("96–101", "Filets"), ("102–103", "Volutes")]
POLICES = [("playfair", "Playfair", "'Playfair Display',Georgia,serif"), ("cinzel", "Cinzel", "'Cinzel',serif"),
           ("cinzel-deco", "Cinzel Deco", "'Cinzel Decorative',serif"), ("montserrat", "Montserrat", "'Montserrat',sans-serif"),
           ("inter", "Inter", "'Inter',sans-serif"), ("great-vibes", "Great Vibes", "'Great Vibes',cursive"),
           ("allura", "Allura", "'Allura',cursive"), ("pacifico", "Pacifico", "'Pacifico',cursive")]


def cut(html, start, end, repl="", keep_end=True):
    i = html.index(start); j = html.index(end, i)
    return html[:i] + repl + (html[j:] if keep_end else html[j + len(end):])


def build():
    h = open(SRC, encoding="utf8").read()
    PL = json.loads(re.search(r"var PLANCHES=(\[.*?\]);", h).group(1))
    CA = json.loads(re.search(r"var CADRES=(\[.*?\]);", h).group(1))
    GALPHA = re.search(r'var GALPHA="([^"]+)"', h).group(1)
    GC = json.loads(re.search(r"var GCOLORS=(\{.*?\});", h).group(1))
    assert len(PL) == len(LEG_DESSINS) and len(CA) == len(LEG_CADRES)

    pols = "".join(f'<button type="button" class="prc-pol" data-p="{k}" style="font-family:{css}">{lab}</button>' for k, lab, css in POLICES)
    grille = lambda items, legs, kind: "".join(
        f'<button type="button" class="prc-model" data-kind="{kind}" data-i="{i}"><span class="prc-mn">{a}</span>'
        f'<span class="prc-mimg prc-mimg-photo"><img src="{src}" alt="Planche {kind} {a}"></span>'
        f'<span class="prc-ml">{b}<br><em>n° {a}</em></span></button>'
        for i, (src, (a, b)) in enumerate(zip(items, legs)))
    xpols = pols.replace('class="prc-pol"', 'class="prc-pol prc-xpol"')
    g_dessins = grille(PL, LEG_DESSINS, "d")
    g_cadres = grille([c["src"] for c in CA], LEG_CADRES, "c")
    lettres = "".join(f'<button type="button" class="prc-let" data-l="{L}">{L}</button>' for L in "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    eur = lambda n: ("%.2f" % n).replace(".", ",") + " €"
    img_photo = GC["creme"]["g"]

    NEW = f'''<div class="prc" id="prc">
<div class="prc-tag">NOUVEAU — même parcours que la carafe, le vin et la flûte</div>
<div class="prc-head"><p class="prc-title">Personnalisez votre gobelet</p><p class="prc-sub">D'abord ce qui sera gravé au centre, puis — si vous voulez — des éléments autour.</p></div>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="1">1</span><h3>Que voulez-vous graver au centre ?</h3></div>
  <div class="prc-cards prc-trois">
    <button type="button" class="prc-card" data-mode="dessin"><span class="prc-cimg prc-cimg-planche"><img src="{PL[0]}" alt=""></span><span class="prc-ctxt"><b>Un dessin</b><small>Fleurs, papillons, fées, animaux… 74 dessins numérotés, au choix sur les planches.</small></span></button>
    <button type="button" class="prc-card" data-mode="texte"><span class="prc-cimg prc-cimg-aa"><span style="font-family:'Great Vibes',cursive">Aa</span></span><span class="prc-ctxt"><b>Mon propre texte</b><small>Un prénom, une date, un mot — dans l'écriture de votre choix.</small></span></button>
    <button type="button" class="prc-card" data-mode="photo"><span class="prc-cimg prc-cimg-photo"><img src="{img_photo}" alt=""></span><span class="prc-ctxt"><b>Ma photo ou mon logo</b><small>Un portrait, un dessin d'enfant, un logo : transformé en gravure.</small></span></button>
  </div>
  <p class="prc-hint">C'est votre gravure principale, au centre de la face — comprise dans le prix. Vous pouvez changer d'avis à tout moment.</p>
</section>

<section class="prc-step" id="prc-s2" hidden>
  <div class="prc-sh"><span class="prc-num" data-step="2">2</span><h3 id="prc-s2-title">Choisissez votre dessin</h3></div>
  <div class="prc-mode" data-mode="dessin" hidden>
    <p class="prc-legend" id="prc-dleg">Touchez une planche pour l'agrandir et lire les numéros, puis indiquez le numéro du dessin.</p>
    <div class="prc-grid" id="prc-gd">{g_dessins}</div>
    <div class="prc-fields">
      <div class="field"><label>Numéro du dessin (1 à 74)</label><input type="number" id="prc-num" min="1" max="74" inputmode="numeric" placeholder="Ex : 12"></div>
    </div>
    <p class="prc-choisi" id="prc-dok" hidden></p>
    <button type="button" class="prc-change" id="prc-dchg" hidden>Changer de dessin</button>
  </div>
  <div class="prc-mode" data-mode="texte" hidden>
    <div class="prc-fields">
      <div class="field"><label>Votre texte à graver</label><input type="text" id="prc-txt" maxlength="30" placeholder="Prénom, date, message…"><span class="prc-count"><span id="prc-txtn">0</span>/30</span></div>
    </div>
  </div>
  <div class="prc-mode" data-mode="photo" hidden>
    <p class="prc-legend">Téléversez le fichier (JPG, PNG). L'atelier vérifie la qualité avant de graver.</p>
    <div class="prc-fields">
      <div class="field"><label>Votre photo ou logo</label><input type="file" id="prc-file" accept="image/*"><p class="prc-fileok" id="prc-fileok" hidden>Photo ajoutée ✓</p></div>
      <div class="field"><label>Texte sous la photo <span class="prc-opt">(facultatif)</span></label><input type="text" id="prc-ptxt" maxlength="30" placeholder="Prénom, message…"></div>
    </div>
  </div>
  <div class="prc-fields prc-ecrit" id="prc-ecrit" hidden>
    <div class="field"><label>Écriture</label><div class="prc-pols" id="prc-pols">{pols}</div>
      <p class="prc-apercu" id="prc-apercu">Léna &amp; Noah</p></div>
  </div>
</section>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="3">3</span><h3>Autour de votre gravure <span class="prc-opt">— facultatif, +{EXTRA} € par élément</span></h3></div>
  <p class="prc-legend">Un cadre avec un prénom, une lettre fleurie, un 2ᵉ dessin, une date… sur la face, les côtés ou tout autour du gobelet.</p>
  <button type="button" class="prc-change" id="prc-plus">＋ Ajouter un élément autour</button>
  <div class="prc-fields prc-extra" id="prc-xform" hidden>
    <div class="field"><label>Quoi ?</label><div class="prc-chips" id="prc-xkind">
      <button type="button" class="prc-chip on" data-k="cadre">Un cadre ou une banderole + nom</button>
      <button type="button" class="prc-chip" data-k="lettre">Une lettre fleurie + nom</button>
      <button type="button" class="prc-chip" data-k="dessin">Un autre dessin</button>
      <button type="button" class="prc-chip" data-k="texte">Un texte</button></div></div>
    <div class="prc-x" data-k="cadre"><div class="prc-grid prc-grid-c" id="prc-gc">{g_cadres}</div>
      <div class="field"><label>Numéro du cadre (75 à 103)</label><input type="number" id="prc-xcn" min="75" max="103" inputmode="numeric" placeholder="Ex : 82"></div></div>
    <div class="prc-x" data-k="lettre" hidden><img class="prc-alpha" src="{GALPHA}" alt="Alphabet fleuri"><div class="prc-letters" id="prc-xlet">{lettres}</div></div>
    <div class="prc-x" data-k="dessin" hidden><p class="prc-legend">Les numéros sont sur les planches de l'étape 2 (1 à 74).</p>
      <div class="field"><label>Numéro du dessin</label><input type="number" id="prc-xdn" min="1" max="74" inputmode="numeric" placeholder="Ex : 7"></div></div>
    <div class="field" id="prc-xnomf"><label id="prc-xnoml">Nom / texte au milieu du cadre</label><input type="text" id="prc-xnom" maxlength="30" placeholder="Ex : Léna"></div>
    <div class="field" id="prc-xpolf"><label>Écriture</label><div class="prc-pols" id="prc-xpols">{xpols}</div></div>
    <div class="field"><label>Où ?</label><div class="prc-chips" id="prc-xside">
      <button type="button" class="prc-chip on" data-s="face">Face</button><button type="button" class="prc-chip" data-s="gauche">Côté gauche</button>
      <button type="button" class="prc-chip" data-s="droite">Côté droit</button><button type="button" class="prc-chip" data-s="tour">Tout autour</button></div>
      <div class="prc-chips" id="prc-xzone"></div></div>
    <p class="prc-xmsg" id="prc-xmsg"></p>
    <div class="prc-xbtns"><button type="button" class="prc-xadd" id="prc-xadd">Ajouter cet élément (+{EXTRA} €)</button><button type="button" class="prc-change" id="prc-xcancel">Annuler</button></div>
  </div>
  <ul class="prc-xlist" id="prc-xlist"></ul>
</section>

<section class="prc-step">
  <div class="prc-sh"><span class="prc-num" data-step="4">4</span><h3>Résumé de votre gravure</h3></div>
  <div class="prc-sum">
    <div class="prc-sumrow"><span>Couleur</span><b id="prc-sum-col">Crème</b></div>
    <div class="prc-sumrow"><span>Au centre</span><b id="prc-sum-main" class="prc-miss">à choisir (étape 1)</b></div>
    <div class="prc-sumrow" id="prc-sum-x-row" hidden><span>Autour</span><b id="prc-sum-x"></b></div>
    <div class="prc-sumrow prc-sumtot"><span>Total</span><b id="prc-sum-tot">{eur(PRIX)}</b></div>
  </div>
</section>
</div>
'''
    h = cut(h, '<div class="perso">', '<div class="qty-row">', NEW)
    OLDADD = '<div class="add">Ajouter au panier</div>\n      </div>'
    assert OLDADD in h
    h = h.replace(OLDADD, '<button type="button" class="add prc-off" id="prc-add" disabled>Ajouter au panier</button>\n      </div>\n      <p class="prc-addhint" id="prc-addhint">Choisissez votre gravure principale (étape 1).</p>', 1)
    # Ancien câblage du configurateur (côtés, zones, liste, bande de planches) : retiré.
    h = cut(h, 'var sidesEl=document.getElementById("sides")', "var PLANCHES=")
    h = re.sub(r'\(function\(\)\{var strip=document\.getElementById\("strip"\);.*?\}\)\(\);\n', "", h, count=1, flags=re.S)
    i = h.index('var family="dessins";'); i = h.rindex("<script>", 0, i); j = h.index("</script>", i) + len("</script>")
    h = h[:i] + h[j:]
    # Les planches sont maintenant dans les grilles du parcours : plus besoin des tableaux.
    h = re.sub(r"var PLANCHES=\[.*?\];\n?", "", h, count=1, flags=re.S)
    h = re.sub(r"<script>var CADRES=\[.*?\];</script>", "", h, count=1, flags=re.S)
    h = h.replace("var perso=document.querySelector('.perso');", "var perso=document.getElementById('prc');", 1)
    h = h.replace("Maquette — fiche gobelet avec configurateur & aperçu 3D (pas en ligne)", "Maquette — gobelet : parcours guidé comme le verre à vin (pas en ligne)", 1)
    h = re.sub(r"<title>.*?</title>", "<title>Gobelet — parcours guidé</title>", h, count=1, flags=re.S)

    css_site = open(f"{ROOT}/src/app/globals.css", encoding="utf8").read()
    css_prc = css_site[css_site.index("   PARCOURS GUIDÉ de personnalisation"):]
    css_prc = "/*" + css_prc[:css_prc.index("/* ---- Fiche complète d'une commande")]
    STYLE = '''<style>
/* variables et champs du site (globals.css) utilisés par le bloc .prc-* */
:root{--gold-dark:#a98935;--cream-2:#f3ece0;--font-display:"Playfair Display";--font-body:"Inter"}
.field{margin-bottom:18px}.field label{display:block;font-size:.85rem;font-weight:600;margin-bottom:8px}
.field input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--line);background:var(--paper);font:inherit;color:var(--ink)}
/* ---- bloc PARCOURS GUIDÉ = le VRAI CSS du site ---- */
''' + css_prc + '''
.prc{border:2px dashed #d6b25a;margin-top:18px;font-family:"Inter",'Helvetica Neue',Arial,sans-serif}
.prc-tag{position:absolute;top:-11px;left:12px;background:#d6b25a;color:#1d1811;font-size:.66rem;font-weight:800;letter-spacing:.06em;padding:3px 9px;border-radius:999px;text-transform:uppercase}
.prc-trois{grid-template-columns:repeat(3,1fr)}
.prc-cimg-planche img{width:100%;height:100%;object-fit:cover;object-position:top;mix-blend-mode:multiply}
.prc-cimg-photo img{width:100%;height:100%;object-fit:cover;mix-blend-mode:normal}
.prc-grid .prc-mimg{aspect-ratio:3/4;background:#fff}.prc-grid .prc-mimg img{object-position:top}
.prc-ml em{font-style:normal;font-weight:700;color:var(--gold-dark)}
.prc-grid-c{margin-bottom:10px}.prc-grid-c .prc-mimg{aspect-ratio:4/3}
.prc-apercu{margin:10px 0 0;padding:10px 12px;border:1px dashed var(--gold);border-radius:10px;background:#fff;font-size:1.5rem;text-align:center;color:var(--ink);line-height:1.3;overflow-wrap:anywhere}
.prc-fileok{font-size:.8rem;color:#2e7d32;font-weight:600;margin:6px 0 0}
.prc-extra{margin-top:10px}.prc-x{margin-bottom:6px}
.prc-xmsg{min-height:1em;font-size:.8rem;color:#b4552f;margin:0 0 6px}
.prc-xbtns{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.prc-xbtns .prc-change{margin:0}
.prc-xadd{border:0;border-radius:999px;padding:10px 16px;font:600 .85rem/1 "Inter",sans-serif;color:#fff;background:linear-gradient(135deg,var(--gold),var(--gold-dark));cursor:pointer}
.prc-xlist{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
.prc-xlist li{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;font-size:.84rem}
.prc-xlist li span{flex:1;min-width:0;overflow-wrap:anywhere}.prc-xlist li em{font-style:normal;color:var(--ink-soft)}
.prc-xlist li b.p{color:var(--gold-dark);flex:none}
.prc-xlist button{flex:none;width:28px;height:28px;border-radius:50%;border:1px solid var(--line);background:var(--paper);cursor:pointer;font-size:1rem;line-height:1}
#prc-xzone{margin-top:6px}
.thumbs .t{flex:none}
button.add{border:0;font:inherit;cursor:pointer;width:100%}
.prc-addhint{margin:10px 0 0}
.prc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d1811;color:#fff;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:80;opacity:0;transition:opacity .2s;pointer-events:none}.prc-toast.on{opacity:1}
@media (max-width:720px){.prc-trois{grid-template-columns:1fr}.prc-grid-c{grid-template-columns:repeat(2,1fr)}}
</style>
'''
    SCRIPT = r'''<script>
(function(){
  var POL = %s, BASE = %s, XP = %s;
  var $ = function(s, r){ return (r||document).querySelector(s); }, $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var eur = function(n){ return n.toFixed(2).replace(".", ",") + " €"; };
  var polName = function(k){ for (var i=0;i<POL.length;i++) if (POL[i][0]===k) return POL[i][1]; return k; };
  var st = { mode:null, num:0, txt:"", photo:false, ptxt:"", pol:"great-vibes", extras:[] };
  var xs = { k:"cadre", s:"face", z:"", l:"", p:"great-vibes" };
  var SIDEL = { face:"Face", gauche:"Côté gauche", droite:"Côté droit", tour:"Tout autour" };
  var ZONEL = { principal:"centre", haut:"en haut", bas:"en bas", gauche:"à gauche", droite:"à droite" };
  var KINDL = { cadre:"Cadre", lettre:"Lettre fleurie", dessin:"Dessin", texte:"Texte" };

  // Grilles : une planche = zoom (comme sur la fiche validée) + sélection visuelle
  $$(".prc-model").forEach(function(b){ b.addEventListener("click", function(){
    var src = $("img", b).src;
    $$(".prc-model", b.parentNode).forEach(function(x){ x.classList.toggle("on", x===b); });
    if (window.openZoom) window.openZoom(src);
  }); });

  function majPols(){ $$("#prc-pols .prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p===st.pol); }); var a = $("#prc-apercu"); a.style.fontFamily = window.fontCss(st.pol); a.textContent = (st.mode==="photo" ? st.ptxt : st.txt) || "Léna & Noah"; }
  function reset(m){
    st.mode = m; st.num = 0; st.txt = ""; st.photo = false; st.ptxt = "";
    $("#prc-num").value = ""; $("#prc-txt").value = ""; $("#prc-txtn").textContent = "0"; $("#prc-ptxt").value = ""; $("#prc-file").value = ""; $("#prc-fileok").hidden = true;
    $("#prc-dok").hidden = true; $("#prc-gd").hidden = false; $("#prc-dleg").hidden = false; $("#prc-dchg").hidden = true; $$("#prc-gd .prc-model").forEach(function(x){ x.classList.remove("on"); });
  }
  $$(".prc-card").forEach(function(b){ b.addEventListener("click", function(){
    var m = b.dataset.mode; if (st.mode === m) return; reset(m);
    $$(".prc-card").forEach(function(x){ x.classList.toggle("on", x===b); });
    var s2 = $("#prc-s2"); s2.hidden = false; $$(".prc-mode", s2).forEach(function(x){ x.hidden = x.dataset.mode !== m; });
    $("#prc-ecrit").hidden = m === "dessin";
    $("#prc-s2-title").textContent = m==="dessin" ? "Choisissez votre dessin" : m==="texte" ? "Écrivez votre texte" : "Ajoutez votre photo ou votre logo";
    majPols(); refresh(); setTimeout(function(){ s2.scrollIntoView({behavior:"smooth", block:"start"}); }, 60);
  }); });
  $("#prc-num").addEventListener("input", function(e){
    var n = parseInt(e.target.value, 10); st.num = (n>=1 && n<=74) ? n : 0;
    var ok = $("#prc-dok"); ok.hidden = !e.target.value;
    ok.innerHTML = st.num ? "Dessin n° " + st.num + " choisi ✓ — gravé au centre de la face." : "Numéro de dessin : de 1 à 74.";
    ok.classList.toggle("prc-miss", !st.num); refresh();
  });
  // Comme la grille de la carafe : une fois le dessin choisi, les planches se replient.
  function plier(v){ $("#prc-gd").hidden = v; $("#prc-dleg").hidden = v; $("#prc-dchg").hidden = !v; }
  $("#prc-num").addEventListener("change", function(){ if (st.num) plier(true); });
  $("#prc-num").addEventListener("keydown", function(e){ if (e.key==="Enter" && st.num) { e.preventDefault(); plier(true); } });
  $("#prc-dchg").addEventListener("click", function(){ plier(false); $("#prc-gd").scrollIntoView({behavior:"smooth", block:"start"}); });
  $("#prc-txt").addEventListener("input", function(e){ st.txt = e.target.value.trim(); $("#prc-txtn").textContent = e.target.value.length; majPols(); refresh(); });
  $("#prc-ptxt").addEventListener("input", function(e){ st.ptxt = e.target.value.trim(); majPols(); refresh(); });
  $("#prc-file").addEventListener("change", function(e){ st.photo = !!(e.target.files && e.target.files.length); $("#prc-fileok").hidden = !st.photo; refresh(); });
  $$("#prc-pols .prc-pol").forEach(function(b){ b.addEventListener("click", function(){ st.pol = b.dataset.p; xs.p = st.pol; majPols(); refresh(); }); });
  $$("#prc-xpols .prc-pol").forEach(function(b){ b.addEventListener("click", function(){ xs.p = b.dataset.p; majXpols(); }); });
  function majXpols(){ $$("#prc-xpols .prc-pol").forEach(function(x){ x.classList.toggle("on", x.dataset.p===xs.p); }); }

  // ③ éléments autour
  function zonesLibres(){
    var Z = xs.s==="face" ? ["haut","bas","gauche","droite"] : xs.s==="tour" ? ["haut","bas"] : ["principal","haut","bas"];
    return Z.filter(function(z){ return !st.extras.some(function(e){ return e.side===xs.s && e.zone===z; }); });
  }
  function majZones(){
    var L = zonesLibres(), box = $("#prc-xzone"); if (L.indexOf(xs.z) < 0) xs.z = L[0] || "";
    box.innerHTML = L.length ? L.map(function(z){ return '<button type="button" class="prc-chip' + (z===xs.z?" on":"") + '" data-z="' + z + '">' + (z==="principal" ? "Au centre du côté" : ZONEL[z][0].toUpperCase() + ZONEL[z].slice(1)) + "</button>"; }).join("") : '<span class="prc-opt">Toutes les places de ce côté sont prises.</span>';
    $$("button", box).forEach(function(b){ b.addEventListener("click", function(){ xs.z = b.dataset.z; majZones(); }); });
  }
  function majKind(){
    $$("#prc-xkind .prc-chip").forEach(function(x){ x.classList.toggle("on", x.dataset.k===xs.k); });
    $$(".prc-x").forEach(function(x){ x.hidden = x.dataset.k !== xs.k; });
    $("#prc-xnomf").hidden = xs.k === "dessin"; $("#prc-xpolf").hidden = xs.k === "dessin"; majXpols();
    $("#prc-xnoml").textContent = xs.k==="cadre" ? "Nom / texte au milieu du cadre" : xs.k==="lettre" ? "Nom gravé dans la lettre" : "Votre texte";
    $("#prc-xmsg").textContent = "";
  }
  $("#prc-plus").addEventListener("click", function(){ $("#prc-xform").hidden = false; $("#prc-plus").hidden = true; majKind(); majZones(); });
  $("#prc-xcancel").addEventListener("click", function(){ $("#prc-xform").hidden = true; $("#prc-plus").hidden = false; });
  $$("#prc-xkind .prc-chip").forEach(function(b){ b.addEventListener("click", function(){ xs.k = b.dataset.k; majKind(); }); });
  $$("#prc-xside .prc-chip").forEach(function(b){ b.addEventListener("click", function(){ xs.s = b.dataset.s; $$("#prc-xside .prc-chip").forEach(function(x){ x.classList.toggle("on", x===b); }); majZones(); window.phi = xs.s==="tour" ? window.phi : -sbase(xs.s); window.autorot = false; }); });
  $$("#prc-xlet .prc-let").forEach(function(b){ b.addEventListener("click", function(){ xs.l = b.dataset.l; $$("#prc-xlet .prc-let").forEach(function(x){ x.classList.toggle("on", x===b); }); }); });
  $("#prc-xadd").addEventListener("click", function(){
    var msg = $("#prc-xmsg"), nom = $("#prc-xnom").value.trim(), e = { kind:xs.k, side:xs.s, zone:xs.z, fontKey:xs.p };
    if (!xs.z) { msg.textContent = "Toutes les places de ce côté sont prises : choisissez un autre côté."; return; }
    if (xs.k==="cadre") { var n = parseInt($("#prc-xcn").value, 10); if (!(n>=75 && n<=103)) { msg.textContent = "Numéro du cadre : de 75 à 103."; return; } if (!nom) { msg.textContent = "Écrivez le nom à graver au milieu du cadre."; return; } e.cadre = n; e.text = nom; e.label = "Cadre n° " + n + " · « " + nom + " »"; }
    else if (xs.k==="lettre") { if (!xs.l) { msg.textContent = "Choisissez la lettre."; return; } if (!nom) { msg.textContent = "Écrivez le nom à graver dans la lettre."; return; } e.text = xs.l + " · " + nom; e.label = "Lettre fleurie " + xs.l + " · « " + nom + " »"; }
    else if (xs.k==="dessin") { var d = parseInt($("#prc-xdn").value, 10); if (!(d>=1 && d<=74)) { msg.textContent = "Numéro du dessin : de 1 à 74."; return; } e.num = d; e.label = "Dessin n° " + d; }
    else { if (!nom) { msg.textContent = "Écrivez le texte."; return; } e.text = nom; e.label = "Texte « " + nom + " »"; }
    st.extras.push(e); $("#prc-xcn").value = ""; $("#prc-xdn").value = ""; $("#prc-xnom").value = ""; xs.l = ""; $$("#prc-xlet .prc-let").forEach(function(x){ x.classList.remove("on"); });
    $("#prc-xform").hidden = true; $("#prc-plus").hidden = false; liste(); refresh();
  });
  function liste(){
    var ul = $("#prc-xlist"); ul.innerHTML = "";
    st.extras.forEach(function(e, i){
      var li = document.createElement("li");
      li.innerHTML = "<span>" + e.label + " <em>— " + SIDEL[e.side] + (e.side!=="tour" || e.zone ? ", " + (e.zone==="principal" ? "au centre" : ZONEL[e.zone]) : "") + (e.num ? "" : ", écriture " + polName(e.fontKey)) + '</em></span><b class="p">+' + XP + ' €</b><button type="button" aria-label="Retirer">×</button>';
      $("button", li).addEventListener("click", function(){ st.extras.splice(i, 1); liste(); refresh(); });
      ul.appendChild(li);
    });
    $("#prc-plus").textContent = st.extras.length ? "＋ Ajouter un autre élément" : "＋ Ajouter un élément autour";
  }

  function principal(){
    if (st.mode==="dessin") return st.num ? { ok:true, txt:"Dessin n° " + st.num, el:{ zone:"principal", side:"face", num:st.num } } : { ok:false, txt:"Un dessin — numéro à indiquer", manque:"Indiquez le numéro du dessin (étape 2)." };
    if (st.mode==="texte") return st.txt ? { ok:true, txt:"« " + st.txt + " » · écriture " + polName(st.pol), el:{ zone:"principal", side:"face", text:st.txt, fontKey:st.pol } } : { ok:false, txt:"Mon propre texte — à écrire", manque:"Écrivez votre texte (étape 2)." };
    if (st.mode==="photo") return st.photo ? { ok:true, txt:"Votre photo / logo" + (st.ptxt ? " + « " + st.ptxt + " » (" + polName(st.pol) + ")" : ""), el:{ zone:"principal", side:"face", text:"Votre photo", fontKey:"inter" } } : { ok:false, txt:"Ma photo ou mon logo — à ajouter", manque:"Ajoutez votre photo ou votre logo (étape 2)." };
    return { ok:false, txt:null, manque:"Choisissez votre gravure principale (étape 1)." };
  }
  function refresh(){
    var p = principal(), n = st.extras.length, tot = BASE + n * XP;
    $("#prc-sum-main").textContent = p.txt || "à choisir (étape 1)"; $("#prc-sum-main").classList.toggle("prc-miss", !p.ok);
    $("#prc-sum-x-row").hidden = !n; $("#prc-sum-x").textContent = n + " élément" + (n>1?"s":"") + " en plus (+" + (n*XP) + " €)";
    $("#prc-sum-tot").textContent = eur(tot);
    var c = $("#colName"); if (c) $("#prc-sum-col").textContent = c.textContent;
    var btn = $("#prc-add"), hint = $("#prc-addhint"); btn.disabled = !p.ok; btn.classList.toggle("prc-off", !p.ok); hint.hidden = p.ok; hint.textContent = p.manque || "";
    $$(".prc-num").forEach(function(x){ var s = x.dataset.step; x.classList.toggle("done", s==="1" ? !!st.mode : s==="2" ? p.ok : s==="3" ? n>0 : p.ok); });
    // aperçu 3D : les NUMÉROS / textes sur le gobelet (règle validée)
    window.motifs.length = 0; if (p.ok) window.motifs.push(p.el); var tours = st.extras.filter(function(e){ return e.side==="tour"; });
    tours.forEach(function(e, i){ e.spread = Math.PI/4 + i / tours.length * 2 * Math.PI; });
    st.extras.forEach(function(e){ window.motifs.push(e); });
  }
  $$(".swatches .c").forEach(function(s){ s.addEventListener("click", function(){ setTimeout(refresh, 0); }); });
  $("#prc-add").addEventListener("click", function(){ if ($("#prc-add").disabled) return; var t = $("#prc-toast") || (function(){ var d = document.createElement("div"); d.id = "prc-toast"; d.className = "prc-toast"; document.body.appendChild(d); return d; })(); t.textContent = "Ajouté au panier ✓ (maquette : rien n'est réellement ajouté)"; t.classList.add("on"); setTimeout(function(){ t.classList.remove("on"); }, 2600); });
  majPols(); refresh();
})();
</script>''' % (json.dumps([[k, l] for k, l, _ in POLICES], ensure_ascii=False), PRIX, EXTRA)
    h = STYLE + h + SCRIPT
    open(OUT, "w", encoding="utf8").write(h)
    print("écrit", OUT, len(h) // 1024, "Ko")


build()
