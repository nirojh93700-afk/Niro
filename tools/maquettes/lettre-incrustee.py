#!/usr/bin/env python3
"""Outil de l'atelier « Lettre à incruster » (13/11/2026) — démonstration, RIEN en ligne.

Le gérant (photo d'une lettre « K » de naissance vue sur Instagram) : « tu me crées un petit logiciel… il faut que tu me le
transformes pour que je puisse faire avec ma machine… tout ce qui est en blanc c'est incrusté… le blanc en plusieurs morceaux
et les emplacements pour que je l'intègre après sur le K ». Le K n'est qu'un exemple : toutes les lettres, les 12 signes.

  python3 tools/maquettes/lettre-incrustee.py <clipper.js> <opentype.min.js> <sortie> [complet]

<clipper.js>      = npm pack clipper-lib@6.4.2 → package/clipper.js ; <opentype.min.js> = npm pack opentype.js@1.3.4 → package/dist/.
<sortie>          = fichier .html. Sans « complet » : page d'artifact (sans doctype). Avec : page entière (pour Gestion, plus tard).
Écritures : docs/maquettes/assets/lettre (3 formes de lettre + les 12 signes) et docs/maquettes/assets/fleur/polices (prénom).
Animaux : docs/maquettes/assets/lettre/animaux.ttf = 48 dessins de la police Noto Emoji de Google (licence libre OFL, à côté).
Boîte (v2) : même principe que le « Number Box with Living Hinge » d'Atomm, relevé par tools/maquettes/boite-atomm-releve.cjs.
Le calcul est dans tools/maquettes/lettre-incrustee.js (window.NivLettre).
"""
import base64, json, os, sys

fclip, fopen, out = sys.argv[1:4]
complet = len(sys.argv) > 4
ici = os.path.dirname(os.path.abspath(__file__))
racine = os.path.dirname(os.path.dirname(ici))
A = os.path.join(racine, "docs/maquettes/assets")
POL = [["fredoka", "Ronde (Fredoka)", "lettre/Fredoka-Bold.ttf", "lettre"], ["lilita", "Large (Lilita One)", "lettre/LilitaOne-Regular.ttf", "lettre"],
       ["titan", "Très grasse (Titan One)", "lettre/TitanOne-Regular.ttf", "lettre"], ["signes", "Signes", "lettre/signes.ttf", "signe"], ["animaux", "Animaux", "lettre/animaux.ttf", "animal"],
       ["pacifico", "Pacifico", "fleur/polices/Pacifico-Regular.ttf", "nom"], ["lobster", "Lobster", "fleur/polices/Lobster-Regular.ttf", "nom"],
       ["leckerli", "Leckerli One", "fleur/polices/LeckerliOne-Regular.ttf", "nom"], ["oleo", "Oleo Script", "fleur/polices/OleoScript-Bold.ttf", "nom"],
       ["courgette", "Courgette", "fleur/polices/Courgette-Regular.ttf", "nom"], ["berkshire", "Berkshire Swash", "fleur/polices/BerkshireSwash-Regular.ttf", "nom"]]
pol = [{"id": i, "nom": n, "role": r, "b": base64.b64encode(open(os.path.join(A, f), "rb").read()).decode()} for i, n, f, r in POL]
DONNEES = json.dumps({"pol": pol}, separators=(",", ":"))

CSS = r"""
:root{--bg:#f6f3ee;--carte:#fffdf9;--fg:#1f1a12;--doux:#6b6257;--ligne:#e2dbcf;--or:#a98935;--or2:#c9a24b;--scene:#e7e1d6;--al:#b3261e;--alf:#fdecea;--ok:#2f6b3c;--okf:#eaf4ec;--sel:#1a1206}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#17140f;--carte:#211d17;--fg:#f1ebdf;--doux:#b0a696;--ligne:#3a342a;--or:#d8b867;--or2:#c9a24b;--scene:#2c2720;--al:#ff8a80;--alf:#3a1f1c;--ok:#8fd19e;--okf:#1c2e21;--sel:#f1ebdf;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#17140f;--carte:#211d17;--fg:#f1ebdf;--doux:#b0a696;--ligne:#3a342a;--or:#d8b867;--or2:#c9a24b;--scene:#2c2720;--al:#ff8a80;--alf:#3a1f1c;--ok:#8fd19e;--okf:#1c2e21;--sel:#f1ebdf;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.li{max-width:1180px;margin:0 auto;padding-inline:16px;padding-block:14px 48px}
.li *{box-sizing:border-box}
.li-top h1{font:700 1.45rem/1.2 Georgia,"Times New Roman",serif;margin:0 0 2px;text-wrap:balance}
.li.seule .pasb,.li:not(.seule) .seulb{display:none!important}
.li-modes{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.li-modes button{font:600 .86rem/1.2 system-ui,sans-serif;padding:9px 14px;border-radius:999px;border:1px solid var(--ligne);background:var(--carte);color:var(--fg);cursor:pointer;min-height:40px}
.li-modes button.on{background:var(--sel);color:var(--bg);border-color:var(--sel)}
.li-top p{margin:0 0 12px;color:var(--doux);font-size:.9rem;max-width:68ch}
.li-ex{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:var(--carte);border:1px solid var(--or2);border-radius:10px;padding:8px 12px;margin:0 0 12px;font-size:.88rem}
.li-corps{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
.li-vue{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding-bottom:6px;min-width:0}
.li-barre{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.li-barre button,.li-btn,.li-ex button{font:600 .82rem/1 system-ui,sans-serif;padding:9px 12px;border-radius:999px;border:1px solid var(--ligne);background:var(--carte);color:var(--fg);cursor:pointer}
.li-barre button.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.li-barre .sp{flex:1}
.li-scene{position:relative;height:40vh;min-height:230px;border-radius:14px;background:var(--scene);overflow:hidden}
.li-scene svg,.li-scene canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
.li-zone{fill:transparent;stroke:none;cursor:grab}.li-zone.al{stroke:#d3392f}.li-zone.sel{stroke:#1a1206}
.li-aide{margin:5px 2px 0;font-size:.8rem;color:var(--doux);min-height:1.2em}
.li-regl{display:grid;gap:10px;min-width:0}
.li details{background:var(--carte);border:1px solid var(--ligne);border-radius:14px;min-width:0}
.li summary{cursor:pointer;padding:12px 14px;font-weight:700;display:flex;align-items:center;gap:10px;list-style:none}
.li summary::-webkit-details-marker{display:none}
.li summary i{font-style:normal;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--or2);color:#1a1206;font-size:.85rem;flex:none}
.li summary::after{content:"▾";margin-left:auto;color:var(--doux)}
.li details[open] summary::after{content:"▴"}
.li-in{padding:2px 14px 14px;display:grid;gap:10px}
.li-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.li label{display:grid;gap:3px;font-size:.8rem;color:var(--doux);min-width:0}
.li label.l2,.li-g>small.l2{grid-column:1/-1}
.li label.li-case{display:flex;flex-direction:row;align-items:flex-start;gap:8px;font-weight:600;color:var(--fg);font-size:.9rem;line-height:1.35}
.li label.li-case input{width:18px;height:18px;flex:none;margin:1px 0 0;accent-color:var(--or)}
.li input,.li select{font:inherit;font-size:16px;color:var(--fg);background:var(--bg);border:1px solid var(--ligne);border-radius:9px;padding:8px 10px;width:100%;min-width:0}
.li small{color:var(--doux);font-size:.78rem}
.li-coul{display:flex;flex-wrap:wrap;gap:6px}
.li-coul button{display:flex;align-items:center;gap:6px;font:500 .8rem/1 system-ui,sans-serif;padding:6px 10px 6px 6px;border-radius:999px;border:1.5px solid var(--ligne);background:var(--bg);color:var(--fg);cursor:pointer}
.li-coul button.on{border-color:var(--sel)}
.li-coul i{width:20px;height:20px;border-radius:50%;border:1px solid rgba(0,0,0,.15)}
.li-piece{border-top:1px solid var(--ligne);padding:7px 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 8px;align-items:center}
.li-piece:first-child{border-top:0}
.li-piece.sel{background:color-mix(in srgb,var(--or2) 12%,transparent);margin-inline:-8px;padding-inline:8px;border-radius:10px}
.li-pl{display:flex;align-items:center;gap:9px;background:none;border:0;padding:4px 0;font:inherit;color:var(--fg);cursor:pointer;text-align:left;min-width:0}
.li-n{display:inline-grid;place-items:center;min-width:26px;height:26px;border-radius:50%;background:var(--fg);color:var(--bg);font-size:.78rem;font-weight:700;flex:none}
.li-pn em{font-style:normal;font-size:.72rem;color:var(--al);border:1px solid var(--al);border-radius:999px;padding:1px 7px;margin-left:4px;white-space:nowrap}
.li-pn em.g{color:var(--doux);border-color:var(--ligne)}
.li-piece select{width:auto;font-size:.85rem;padding:6px 8px}
.li-fiche{grid-column:1/-1;display:grid;gap:8px;padding:4px 0 6px}
.li-rg{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:.82rem}
.li-rg span{color:var(--doux);margin-right:auto}
.li-rg button{width:42px;height:38px;border-radius:9px;border:1px solid var(--ligne);background:var(--bg);color:var(--fg);font-size:1.05rem;cursor:pointer}
.li-rg b{min-width:52px;text-align:center;font-variant-numeric:tabular-nums}
.li-lien{justify-self:start;background:none;border:0;padding:4px 0;color:var(--or);font:600 .85rem/1.2 system-ui,sans-serif;text-decoration:underline;cursor:pointer}
.li-info{margin:0;font-size:.8rem;color:var(--doux)}
.li-al{margin:0;font-size:.82rem;color:var(--al);background:var(--alf);border-radius:8px;padding:6px 9px}
.li-ok{margin:0;font-size:.85rem;color:var(--ok);background:var(--okf);border-radius:8px;padding:8px 10px}
.li-alertes{background:var(--alf);color:var(--al);border-radius:10px;padding:9px 12px;font-size:.84rem}
.li-alertes ul{margin:4px 0 0;padding-left:18px}
.li-res{margin:0;font-size:.84rem;color:var(--doux)}
.li-feuille{border:1px solid var(--ligne);border-radius:12px;padding:10px 12px;display:grid;gap:8px;min-width:0}
.li-ft{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}
.li-ft h4{margin:0;font-size:.92rem}.li-ft span{font-size:.8rem;color:var(--doux);font-variant-numeric:tabular-nums}
.li-feuille svg{width:100%;max-height:300px;background:#fff;border-radius:8px;border:1px solid var(--ligne)}
.li-fn{margin:0;font-size:.78rem;color:var(--doux)}
.li-btn{justify-self:start;background:var(--or2);border-color:var(--or2);color:#1a1206}
@media (min-width:900px){.li-corps{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:22px;align-items:start}.li-vue{top:12px}.li-scene{height:min(68vh,620px)}}
"""

HTML = r"""<div class="li">
<header class="li-top"><h1 id="titre">Lettre à incruster</h1>
<p id="sous">Outil de l'atelier : le fond, le dessus de couleur avec ses emplacements, les pièces blanches à y poser et la gravure, prêts pour la machine. Démonstration : rien n'est en ligne.</p></header>
<p class="li-ex" id="exemple" hidden><span>Un exemple est chargé pour essayer. Remplacez-le par les informations de la commande.</span><button type="button" id="bVider">Tout vider</button></p>
<div class="li-modes" id="modes" role="group" aria-label="Que fabriquer"><button type="button" id="mLettre" class="on">Lettre décorée et sa boîte</button><button type="button" id="mBoite">La boîte seule</button></div>
<div class="li-corps">
<section class="li-vue" aria-label="Aperçu">
 <div class="li-barre"><button type="button" id="vFace" class="on">De face</button><button type="button" id="v3d">3D</button><span class="sp"></span><button type="button" id="bNum" class="pasb">Numéros</button><button type="button" id="bAuto" class="pasb">Tout replacer</button></div>
 <div class="li-scene" id="scene"><svg id="svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu de la lettre"></svg><canvas id="c3d" hidden></canvas></div>
 <p class="li-aide" id="aide"></p>
</section>
<section class="li-regl">
 <details open><summary id="s-1"><i>1</i>La lettre</summary><div class="li-in">
  <div class="li-g">
   <label class="l2 pasb">Modèle<select id="f-modele" disabled><option>Lettre de naissance</option></select></label>
   <label class="l2 seulb">Forme de la boîte<select id="f-bforme"></select><small>Une lettre, un chiffre, ou une boîte simple. Les angles sont arrondis au rayon réglé à l'étape 2.</small></label>
   <label class="pasb">Prénom<input id="f-nom" maxlength="16" autocomplete="off" placeholder="Prénom"></label>
   <label id="l-lettre">Lettre ou chiffre<input id="f-lettre" maxlength="1" autocomplete="off"></label>
   <label id="l-pol">Forme de la lettre<select id="f-pol"></select></label>
   <label class="pasb">Écriture du prénom<select id="f-polNom"></select></label>
   <label><span id="t-H">Hauteur de la lettre (mm)</span><input id="f-H" inputmode="decimal"></label>
   <label id="l-bw" class="seulb">Largeur (mm)<input id="f-bw" inputmode="decimal"></label>
   <label id="l-bord"><span id="t-bord">Bord blanc autour (mm)</span><input id="f-bord" inputmode="decimal"></label>
   <label class="l2" id="l-gras">Épaissir la lettre (mm)<input id="f-gras" inputmode="decimal"><small>Pour une lettre fine (I, J, L…) : 3 à 6 mm donnent plus de place.</small></label>
  </div>
  <div class="pasb"><small>Couleur du dessus (pour l'aperçu)</small><div class="li-coul" id="coul"></div></div>
 </div></details>
 <details open class="pasb"><summary><i>2</i>Les informations</summary><div class="li-in"><div class="li-g">
   <label>Date de naissance<input id="f-date" type="date"></label>
   <label>Heure<input id="f-heure" type="time"></label>
   <label>Taille (cm)<input id="f-taille" inputmode="decimal" maxlength="5"></label>
   <label>Poids (g)<input id="f-poids" inputmode="numeric" maxlength="5"></label>
   <label class="l2">Signe du zodiaque<select id="f-signe"></select><small id="signeAuto"></small></label>
   <label class="l2">Le signe<select id="f-signeStyle"><option value="dessin">En dessin gravé (bélier, lion, balance…)</option><option value="symbole">En symbole découpé (♈ ♌ ♎…)</option></select></label>
   <label class="l2">L'horloge<select id="f-horloge"><option value="grave">Cadran blanc, chiffres et aiguilles gravés (rien à orienter)</option><option value="ajour">Ajourée comme le modèle (anneau et aiguilles blancs)</option></select><small>Les aiguilles se mettent toutes seules à l'heure écrite au-dessus.</small></label>
   <label>Animal ou dessin<select id="f-animal"></select></label>
   <label>Petits décors<select id="f-decor"><option value="etoiles">Étoiles</option><option value="nuages">Nuages</option><option value="coeurs">Cœurs</option><option value="lune">Une lune et des étoiles</option><option value="melange">Mélange</option></select></label>
   <label>Combien de décors (0 à 6)<input id="f-nbEt" inputmode="numeric" maxlength="1"></label>
   <label class="l2">Texte libre (facultatif)<input id="f-libre" maxlength="18" autocomplete="off"></label>
 </div></div></details>
 <details open class="pasb"><summary><i>3</i>Les pièces</summary><div class="li-in">
  <small>Touchez une pièce pour la régler. « Incrusté » : pièce blanche dans son emplacement. « Gravé » : dessiné sur le dessus, sans découpe. Vous pouvez aussi la glisser sur l'aperçu.</small>
  <div id="pieces"></div></div></details>
 <details open><summary><i>4</i>La boîte</summary><div class="li-in">
  <label class="li-case pasb"><input type="checkbox" id="b-on"> Faire une boîte sous la lettre (la lettre décorée devient le couvercle)</label>
  <div class="li-g" id="b-regl">
   <label>Hauteur des côtés (mm)<input id="b-prof" inputmode="decimal"></label>
   <label>Rayon des angles (mm)<input id="b-rayon" inputmode="decimal"></label>
   <label>Rebord du haut (mm)<input id="b-cour" inputmode="decimal"></label>
   <label>Jeu du couvercle (mm)<input id="b-jeuC" inputmode="decimal"></label>
   <label>Écart entre les fentes (mm)<input id="b-pas" inputmode="decimal"></label>
   <label>Fentes en plus avant et après une courbe (mm)<input id="b-pad" inputmode="decimal"></label>
   <label class="l2">Bande de côté en combien de morceaux<select id="b-nb"><option value="0">Automatique (selon la zone de la machine)</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="8">8</option><option value="10">10</option><option value="12">12</option></select><small id="b-info"></small></label>
   <label class="li-case l2 pasb"><input type="checkbox" id="b-plaque"> La boîte suit aussi la plaque du prénom (sinon la plaque dépasse de la boîte et sert de prise)</label>
   <label class="li-case l2"><input type="checkbox" id="b-dos"> Plaque pleine sous la boîte (elle cache les tenons)</label>
   <label class="li-case l2"><input type="checkbox" id="b-rep"> Graver une lettre de repère (A, B, C…) sur chaque morceau de bande et sur le fond</label>
   <small class="l2" id="b-note"></small>
  </div></div></details>
 <details><summary><i>5</i>La machine</summary><div class="li-in"><div class="li-g">
   <label>Zone de travail, largeur (mm)<input id="f-zw" inputmode="decimal"></label>
   <label>Zone de travail, hauteur (mm)<input id="f-zh" inputmode="decimal"></label>
   <label>Trait de coupe (mm)<input id="f-trait" inputmode="decimal"></label>
   <label>Jeu autour des pièces (mm)<input id="f-jeu" inputmode="decimal"></label>
   <label class="l2">Épaisseur du bois (mm)<input id="f-ep" inputmode="decimal"><small>Sert à la boîte (tenons, encoches), à la vue 3D et à la liste. Avec une machine plus grande : changez la zone et la hauteur de la lettre, tout suit.</small></label>
 </div></div></details>
 <details open><summary><i>6</i>Les fichiers pour la machine</summary><div class="li-in" id="fichiers"></div></details>
</section>
</div></div>
"""

corps = ("<title>Lettre à incruster</title>\n<style>" + CSS + "</style>\n" + HTML
         + "<script>" + open(fclip, encoding="utf-8").read() + "</script>\n<script>" + open(fopen, encoding="utf-8").read() + "</script>\n"
         + "<script>window.LI_DONNEES=" + DONNEES + ";</script>\n<script>" + open(os.path.join(ici, "lettre-incrustee.js"), encoding="utf-8").read() + "</script>\n"
         + "<!-- niv-ok --><script>" + open(os.path.join(ici, "valider-champ.js"), encoding="utf-8").read() + "</script>\n")
if complet:
    corps = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
             '<meta name="robots" content="noindex"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + corps + "</body></html>")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(corps)
print(out, round(len(corps) / 1024), "Ko")
