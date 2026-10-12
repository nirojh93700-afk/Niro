# -*- coding: utf-8 -*-
# MAQUETTE « Précommande — côté Gestion » (12/10/2026). Gérant : « Fais la maquette de la partie Gestion ».
# RIEN n'existe dans le site : la précommande n'est aujourd'hui qu'un affichage dans les maquettes des marque-pages.
# Quatre écrans dans la même page : ① la fiche produit (Produits & stock → panneau) avec le bloc « Précommande »
# ② la file de production avec la colonne « ⏳ Précommandes » ③ l'écran « Précommandes » (suivi des places,
# bouton « Arrivage reçu », message aux clientes) ④ la fiche atelier avec l'encadré « ne pas graver ».
# Usage : python3.13 precommande-gestion.py <dossier css du site> <fichier de sortie>
# Le dossier css = les 3 feuilles de nivcreation.fr (vraies classes .ash-* / .file-* / .ph-* / .dash-chip) ;
# seul le bloc .pc-* est neuf. Photos : docs/maquettes/assets/marque-pages/ (réduites à 160 px).
import base64, glob, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "..", "docs", "maquettes", "assets", "marque-pages")
css_dir, out = sys.argv[1], sys.argv[2]
CSS = "".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(css_dir, "*.css"))))


def uri(name, w=160):
    im = Image.open(os.path.join(ASSETS, name + ".jpg")).convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=72, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


COULEURS = [("caramel", "Caramel", "nanmu", 6), ("blond", "Blond clair", "buis", 5), ("rouge", "Rouge", "santal", 6),
            ("cuivre", "Cuivré", "palissandre", 5), ("anthracite", "Gris anthracite", "ebene", 4), ("sable", "Gris sable", "suanzhi", 4)]
IMG = {c[0]: uri(c[2]) for c in COULEURS}
IMG["boite2"] = uri("boite2"); IMG["boite4"] = uri("boite4")

# Précommandes déjà passées (exemple) : chaque ligne = un marque-page (couleur, texte, dessin) — idée C de la fiche.
ORDERS = [
    dict(ref="1KQ7PZ2M", client="Camille Rousseau", quand="11/10 21:14", total="31,70 €", livr="Lettre suivie · 75011 Paris",
         fmt="Coffret de 2 (boîte bleu nuit)", boite="boite2",
         mp=[dict(c="rouge", t="Léa", d="n° 4"), dict(c="anthracite", t="Paul", d=None)]),
    dict(ref="0XD4VBN8", client="Nadia Benali", quand="12/10 08:02", total="47,50 €", livr="Point relais Mondial Relay — Lyon 3e",
         fmt="Coffret de 4 (boîte bleu nuit)", boite="boite4",
         mp=[dict(c="caramel", t="Mamie", d=None), dict(c="blond", t="Papi", d=None), dict(c="cuivre", t=None, d="n° 11"), dict(c="sable", t=None, d=None)]),
    dict(ref="1ZR2TMA5", client="Thomas Girard", quand="12/10 09:40", total="9,90 €", livr="Lettre suivie · 33000 Bordeaux",
         fmt="Seul", boite=None, mp=[dict(c="rouge", t=None, d=None)]),
]
VENDU = {}
for o in ORDERS:
    for m in o["mp"]:
        VENDU[m["c"]] = VENDU.get(m["c"], 0) + 1

PAGE_CSS = r"""
:root{--font-display:'Playfair Display',Georgia,serif;--font-body:'Inter',system-ui,sans-serif;color-scheme:light}
html,body{margin:0;background:#f6f1e7}
body{font-family:var(--font-body);color:var(--ink)}
#pc-app .ash-content{padding-bottom:40px}
.pc-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px}.pc-banner b{color:#e2c67e}
.mp-seg{display:flex;gap:6px;margin:0 0 16px;padding:4px;background:#fff;border:1px solid var(--line);border-radius:12px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.mp-seg button{flex:0 0 auto;border:0;background:transparent;padding:9px 14px;border-radius:9px;font:600 .86rem var(--font-body);color:var(--ink-soft);cursor:pointer;min-height:44px;white-space:nowrap}
.mp-seg button.on{background:#1d1811;color:#f1e3b8}
.pc-h1{font-family:var(--font-display);font-size:1.5rem;margin:0 0 4px;color:var(--ash-ink)}
.pc-sub{color:var(--ink-soft);font-size:.9rem;margin:0 0 16px;max-width:70ch}
.pc-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 14px}
.pc-card h3{margin:0 0 4px;font-size:1rem}.pc-card p{margin:0 0 10px;color:var(--ink-soft);font-size:.86rem}
.pc-pre{border:1.5px solid #c9a24b;background:linear-gradient(180deg,#fff8e6,#fff);border-left-width:5px}
.pc-tog{display:flex;align-items:flex-start;gap:10px;font-weight:600;font-size:.92rem;cursor:pointer;margin:0 0 12px}
.pc-tog input{width:20px;height:20px;accent-color:#a98935;margin-top:2px;flex:0 0 auto}
.pc-tog small{display:block;font-weight:400;color:var(--ink-soft);font-size:.8rem}
.pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:0 0 12px}
.pc-grid label{display:block;font-size:.78rem;font-weight:600;color:var(--ink-soft);margin-bottom:4px}
.pc-grid input,.pc-grid select{width:100%;box-sizing:border-box;min-width:0;padding:9px 11px;border:1px solid var(--line);border-radius:9px;font:inherit;font-size:.9rem;background:#fffdf8}
.pc-places{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 10px}
.pc-pl{display:grid;grid-template-columns:40px minmax(0,1fr);gap:8px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:6px 8px;background:#fff}
.pc-pl img{width:40px;height:40px;object-fit:cover;border-radius:7px}
.pc-pl b{display:block;font-size:.8rem}.pc-pl small{display:block;font-size:.72rem;color:var(--ink-soft)}
.pc-pl input{width:54px;padding:4px 6px;border:1px solid var(--line);border-radius:7px;font:inherit;font-size:.86rem;text-align:center}
.pc-pl small.low{color:#b32b2b;font-weight:700}
.pc-apercu{border:1px dashed #c9b88a;border-radius:12px;padding:10px 12px;background:#fffdf8;font-size:.84rem}
.pc-apercu .badge{display:inline-block;background:#1d1811;color:#f1e3b8;font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:99px;margin-bottom:6px}
.pc-apercu .enc{border:1px solid #c9a24b;border-left-width:4px;border-radius:9px;background:#fbf3df;padding:8px 10px;margin:6px 0;color:#4a3a14;line-height:1.4}
.pc-apercu .btnf{display:inline-block;background:linear-gradient(#c9a24b,#a98935);color:#fff;font-weight:700;padding:8px 16px;border-radius:99px;margin-top:4px}
.pc-alert{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid #e2c98d;background:#fff8e6;border-radius:12px;padding:10px 14px;margin:0 0 14px;font-size:.88rem}
.pc-alert b{font-variant-numeric:tabular-nums}.pc-alert .sp{flex:1}
.pc-alert.ok{border-color:#bcd9c1;background:#e9f4ea}
.file-chip.pre{background:#fff3cf;border-color:#c9a24b;color:#7a5a12}
.file-card.pre{border-color:#c9a24b;background:#fffdf7}
.file-card.pre .btn[disabled]{opacity:.45;cursor:not-allowed}
.pc-mp{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:5px}
.pc-mp li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:center;font-size:.82rem}
.pc-mp img{width:34px;height:34px;object-fit:cover;border-radius:6px}
.pc-mp small{color:var(--ink-soft);display:block}
.pc-tbl{width:100%;border-collapse:collapse;font-size:.86rem}
.pc-tbl th{text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);padding:8px 10px;border-bottom:1px solid var(--line)}
.pc-tbl td{padding:9px 10px;border-bottom:1px solid #f0e8d9;vertical-align:middle;font-variant-numeric:tabular-nums}
.pc-tbl td:first-child{display:flex;align-items:center;gap:8px}.pc-tbl img{width:34px;height:34px;object-fit:cover;border-radius:6px}
.pc-bar{height:7px;border-radius:99px;background:#eee4d2;overflow:hidden;min-width:90px}.pc-bar u{display:block;height:100%;background:var(--gold);text-decoration:none}
.pc-bar.low u{background:#c0392b}
.pc-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.pc-msg{border:1px solid var(--line);border-radius:12px;background:#fffdf8;padding:12px 14px;font-size:.86rem;white-space:pre-line;margin-top:10px;display:none}
.pc-msg.open{display:block}.pc-msg b{display:block;margin-bottom:6px}
.pc-fa{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;max-width:760px}
.pc-fa h2{font-family:var(--font-display);margin:0 0 2px;font-size:1.25rem}.pc-fa .meta{color:var(--ink-soft);font-size:.84rem;margin:0 0 12px}
.pc-stop{border:2px solid #c0392b;background:#fdecec;color:#7a1f16;border-radius:12px;padding:12px 14px;font-weight:700;margin:0 0 12px;font-size:.95rem}
.pc-stop small{display:block;font-weight:400;margin-top:4px;color:#8a2a1f}
.pc-stop.ok{border-color:#2f6b3d;background:#e3efe4;color:#1f4d2a}.pc-stop.ok small{color:#2f6b3d}
.pc-ov{border:2px solid #c0392b;border-radius:12px;padding:10px 12px;margin:0 0 12px;background:#fff}
.pc-ov h4{margin:0 0 6px;color:#b32b2b;font-size:.9rem}.pc-ov li{font-size:.86rem}
.pc-grav{width:100%;border-collapse:collapse;font-size:.9rem;margin:0 0 12px}
.pc-grav th{text-align:left;background:#faf6ef;padding:8px 10px;border:1px solid var(--line);font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft)}
.pc-grav td{padding:10px;border:1px solid var(--line);vertical-align:middle}
.pc-grav td.c{display:flex;align-items:center;gap:8px;font-weight:700}.pc-grav img{width:38px;height:38px;object-fit:cover;border-radius:6px}
.pc-grav .t{font-family:'Allura',cursive;font-size:1.3rem}
.pc-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#1d1811;color:#f1e3b8;padding:12px 18px;border-radius:12px;font-size:.88rem;z-index:99;display:none;max-width:90vw;text-align:center}
.pc-toast.show{display:block}
@media (max-width:600px){.pc-grav,.pc-grav tbody{display:block}.pc-grav thead{display:none}.pc-grav tr{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;border:1px solid var(--line);border-radius:10px;padding:10px;margin:0 0 8px;align-items:center}.pc-grav td{border:0;padding:0}.pc-grav td:first-child{grid-row:1/3;font-weight:800;font-size:1.1rem;color:var(--gold-dark,#a98935)}.pc-grav td.c{grid-column:2}.pc-grav td:nth-child(3){grid-column:2}.pc-grav td:nth-child(4),.pc-grav td:nth-child(5){grid-column:2;font-size:.8rem;color:var(--ink-soft)}.pc-grav td:nth-child(4)::before{content:"Dessin : "}.pc-grav td:nth-child(5)::before{content:"Écriture : "}}
@media (max-width:900px){.pc-tbl thead{display:none}.pc-tbl tr{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;padding:10px 0;border-bottom:1px solid var(--line)}.pc-tbl td{border:0;padding:2px 0}.pc-tbl td:first-child{grid-column:1/-1}.pc-tbl td[data-l]::before{content:attr(data-l) " : ";color:var(--ink-soft);font-size:.72rem;text-transform:uppercase}}
"""

HTML = r"""
<title>Précommandes dans Gestion</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Allura&display=swap" rel="stylesheet">
<style>__CSS__</style>
<style>__PAGE_CSS__</style>
<main id="pc-app">
<div class="pc-banner"><b>MAQUETTE</b> · rien n'est en ligne · comment les précommandes de marque-pages se gèrent dans Gestion · commandes et chiffres d'exemple</div>
<div class="ash">
 <aside class="ash-side">
  <div class="ash-brand"><div class="ash-logo">NiV</div><div class="ash-brand-txt"><div class="ash-brand-t">Niv Création</div><div class="ash-brand-s">Espace gestion</div></div></div>
  <nav class="ash-nav">
   <div class="ash-group"><div class="ash-glabel">Commandes</div>
    <a class="ash-item" href="#" data-go="s2"><span class="ash-ico">▤</span><span class="ash-txt">File de production</span><span class="ash-badge">5</span></a>
    <a class="ash-item" href="#" data-go="s3"><span class="ash-ico">⏳</span><span class="ash-txt">Précommandes</span><span class="ash-badge" id="navPre">3</span></a>
    <a class="ash-item" href="#" data-go="s4"><span class="ash-ico">◈</span><span class="ash-txt">Atelier · fichiers</span></a></div>
   <div class="ash-group"><div class="ash-glabel">Catalogue</div>
    <a class="ash-item" href="#" data-go="s1"><span class="ash-ico">◧</span><span class="ash-txt">Produits &amp; stock</span></a>
    <a class="ash-item" href="#"><span class="ash-ico">▢</span><span class="ash-txt">Matériel &amp; emballages</span></a></div>
  </nav>
 </aside>
 <div class="ash-main">
  <header class="ash-top">
   <div class="ash-crumb"><span class="ash-crumb-g" id="crG">Catalogue</span><span class="ash-crumb-sep">›</span><span class="ash-crumb-t" id="crT">Produits &amp; stock</span></div>
   <div class="ash-top-actions"><a class="ash-assist" href="#">✦ Assistant</a></div>
  </header>
  <main class="ash-content">
   <div class="mp-seg" role="tablist"><button class="on" data-go="s1">① Fiche produit</button><button data-go="s2">② File de production</button><button data-go="s3">③ Précommandes</button><button data-go="s4">④ Fiche atelier</button></div>

   <!-- ① FICHE PRODUIT -->
   <section id="s1">
    <h1 class="pc-h1">Marque-page en bois personnalisé</h1>
    <p class="pc-sub">Produits &amp; stock → panneau de la fiche. Un nouveau bloc « Précommande » s'ajoute sous le stock. Le reste de la fiche (prix, couleurs, gravure) ne change pas.</p>
    <div class="pc-card pc-pre">
     <h3>⏳ Précommande</h3>
     <p>À cocher quand le produit se vend AVANT d'être arrivé. Le client paie tout de suite, comme une commande normale ; la commande attend l'arrivage dans une colonne à part.</p>
     <label class="pc-tog"><input type="checkbox" id="tog" checked/><span>Vendre en précommande<small>Décochée, la fiche redevient une fiche normale (stock suivi ou illimité).</small></span></label>
     <div id="preForm">
      <div class="pc-grid">
       <div><label>Arrivée prévue chez vous</label><input type="date" id="dArr" value="2026-11-15"/></div>
       <div><label>Délai de gravure après l'arrivée</label><select id="dDel"><option value="5">5 jours</option><option value="7" selected>7 jours</option><option value="10">10 jours</option></select></div>
       <div><label>Ce que le client lit sur la fiche</label><input id="dTxt" readonly value=""/></div>
      </div>
      <p style="margin:0 0 6px"><strong>Places disponibles</strong> = ce que vous avez commandé au fournisseur, par couleur. Quand une couleur est à zéro, elle se grise sur la fiche ; quand tout est à zéro, le bouton « Précommander » disparaît.</p>
      <div class="pc-places" id="places"></div>
      <p id="plTot" style="margin:0 0 10px;font-size:.88rem"></p>
      <div class="pc-apercu"><div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);margin-bottom:6px">Aperçu de ce que voit le client</div>
       <span class="badge">Précommande</span>
       <div class="enc"><b>Précommande · série limitée</b><br>Les marque-pages sont en cours d'approvisionnement. Votre commande est enregistrée dès maintenant, puis gravée à la réception. <span id="apTxt"></span><br><span id="apPl"></span></div>
       <span class="btnf">Précommander</span>
      </div>
     </div>
     <div id="preOff" style="display:none" class="notice">La précommande est éteinte : la fiche se vend normalement, le stock suivi est celui saisi ci-dessus.</div>
    </div>
    <div class="pc-card"><h3>Ce qui se passe tout seul</h3>
     <ul style="margin:0;padding-left:18px;font-size:.88rem;line-height:1.6">
      <li>Chaque précommande est marquée <span class="file-chip pre">⏳ Précommande</span> dans la file de production, dans la fiche de la commande et sur la fiche atelier, avec la date d'arrivée prévue.</li>
      <li>Le nombre de places baisse à chaque paiement ; le site refuse une couleur épuisée au paiement (comme une rupture).</li>
      <li>Le mail de confirmation à la cliente reprend la phrase de la fiche (pas de date plus précise que celle écrite ici).</li>
      <li>Quand le colis arrive, le bouton « Arrivage reçu » de l'écran Précommandes passe toutes les commandes en « À préparer » et remet la fiche en vente normale.</li>
     </ul></div>
   </section>

   <!-- ② FILE DE PRODUCTION -->
   <section id="s2" hidden>
    <h1 class="pc-h1">File de production</h1>
    <p class="pc-sub">Les précommandes ont leur colonne, AVANT « À préparer », pour que rien ne se mélange : elles ne sont pas à graver tant que le colis n'est pas arrivé.</p>
    <div class="pc-alert" id="alertFile"><span>⏳</span><span><b id="aN">3</b> précommandes attendent l'arrivage des marque-pages (prévu le <b id="aD">15/11</b>). Elles ne sont pas à graver.</span><span class="sp"></span><a href="#" data-go="s3" class="btn btn-outline" style="padding:7px 12px;font-size:.82rem">Voir les précommandes →</a></div>
    <div class="file-kpis" style="margin-bottom:14px">
     <div class="file-kpi"><small>À préparer</small><b id="kPrep">1</b></div>
     <div class="file-kpi alert"><small>⏳ Précommandes</small><b id="kPre">3</b></div>
     <div class="file-kpi"><small>En fabrication</small><b>1</b></div>
     <div class="file-kpi"><small>Places restantes</small><b id="kPl">—</b></div>
    </div>
    <div class="file-cols">
     <div class="file-col" id="colPre"><div class="file-col-h"><span>⏳ Précommandes · en attente</span><span class="n" id="nPre">3</span></div><div id="preCards"></div></div>
     <div class="file-col"><div class="file-col-h"><span>À préparer</span><span class="n" id="nPrep">1</span></div>
      <div id="prepCards"></div>
      <div class="file-card">
       <div class="file-card-top"><div><span class="file-pos">1</span><span class="file-ref">#1ZNESNSV</span><span class="dash-chip prep" style="margin-left:8px">À préparer</span></div><div style="text-align:right"><div style="font-weight:800">34,90 €</div><div class="file-age">il y a 5 h · 12/10 06:10</div></div></div>
       <div class="file-who"><strong>Élodie Marchand</strong> <span>· Colis à domicile · 69007 Lyon</span></div>
       <ul class="file-items"><li><span class="q">1×</span><span>Verre à whisky gravé<span class="d">✍️ « Pour Papa », écriture Playfair, face avant</span></span></li></ul>
       <div class="file-actions"><button class="btn btn-gold">Commencer la fabrication</button><button class="btn btn-outline">Fiche complète →</button></div>
      </div>
     </div>
     <div class="file-col"><div class="file-col-h"><span>En fabrication</span><span class="n">1</span></div>
      <div class="file-card">
       <div class="file-card-top"><div><span class="file-ref">#0PUMYQBL</span><span class="dash-chip grav" style="margin-left:8px">En fabrication</span></div><div style="text-align:right"><div style="font-weight:800">22,81 €</div><div class="file-age">il y a 2 j · 10/10</div></div></div>
       <div class="file-who"><strong>Jessica Nollez</strong> <span>· Lettre suivie</span></div>
       <ul class="file-items"><li><span class="q">1×</span><span>Bracelet cordon à plaque<span class="d">✍️ « Hugo », écriture Great Vibes</span></span></li></ul>
       <div class="file-actions"><button class="btn btn-gold">Expédier avec n° de suivi</button></div>
      </div>
     </div>
    </div>
   </section>

   <!-- ③ PRÉCOMMANDES -->
   <section id="s3" hidden>
    <h1 class="pc-h1">Précommandes</h1>
    <p class="pc-sub">Nouvel écran sous « Commandes ». Un produit en précommande = une ligne : places vendues, places restantes, arrivée prévue, et le bouton qui bascule tout le jour où le colis arrive.</p>
    <div class="pc-card">
     <table class="pc-tbl"><thead><tr><th>Produit</th><th>Arrivée prévue</th><th>Places vendues</th><th>Restantes</th><th>Encaissé</th></tr></thead>
      <tbody><tr><td><img src="__IMG_caramel__" alt=""/><div><b>Marque-page en bois personnalisé</b><small style="display:block;color:var(--ink-soft)">6 couleurs · précommande ouverte le 12/10</small></div></td>
      <td data-l="Arrivée"><span id="tD">15/11/2026</span></td><td data-l="Vendues"><b id="tV">7</b> sur <span id="tT">30</span><div class="pc-bar" id="tBar"><u style="width:23%"></u></div></td><td data-l="Restantes"><b id="tR">23</b></td><td data-l="Encaissé"><b>89,10 €</b></td></tr></tbody></table>
     <div id="lowRow" style="margin-top:8px;font-size:.84rem;color:#b32b2b;font-weight:700"></div>
     <div class="pc-acts">
      <button class="btn btn-gold" id="recu">✅ Arrivage reçu → passer les précommandes en « À préparer »</button>
      <button class="btn btn-outline" id="msg">✉️ Prévenir les clientes</button>
      <button class="btn btn-outline" id="rbt">↩︎ Rembourser une précommande</button>
     </div>
     <div class="pc-msg" id="msgBox"><b>Brouillon ouvert dans Clients → Messages clients (rien ne part sans votre clic, une cliente à la fois) :</b>Bonjour,

Vos marque-pages sont arrivés à l'atelier. Nous gravons maintenant votre commande #1KQ7PZ2M : un marque-page rouge « Léa » avec le dessin n° 4 et un marque-page gris anthracite « Paul », dans leur boîte cadeau bleu nuit.

Vous recevrez un e-mail avec le numéro de suivi au départ du colis.

Niv Création
nivcreation.fr</div>
     <div class="pc-msg" id="rbtBox"><b>Rembourser une précommande</b>Seul cas prévu : le fournisseur ne livre pas (ou pas la couleur commandée). Le remboursement se fait depuis la commande (bouton « Rembourser » existant, Stripe), la place est rendue, et la cliente reçoit le mail de remboursement du site. La règle « article personnalisé jamais remboursé » ne s'applique pas tant que rien n'a été gravé.</div>
    </div>
    <div class="pc-card"><h3>Les précommandes en cours</h3><p>Dans l'ordre de paiement. La même carte que la file de production, en compact.</p><div id="preList"></div></div>
   </section>

   <!-- ④ FICHE ATELIER -->
   <section id="s4" hidden>
    <h1 class="pc-h1">Fiche atelier</h1>
    <p class="pc-sub">La fiche d'une précommande (écran et papier) : l'encadré du haut dit s'il faut attendre, puis une ligne par marque-page avec sa couleur, son texte et son dessin.</p>
    <div class="pc-fa">
     <h2>Commande #1KQ7PZ2M · Camille Rousseau</h2>
     <p class="meta">Payée le 11/10 à 21:14 · Lettre suivie · 75011 Paris · 31,70 €</p>
     <div class="pc-stop" id="faStop">⏳ PRÉCOMMANDE — ne pas graver avant l'arrivage<small>Marque-pages attendus le <span id="faD">15/11/2026</span>. La commande passera « À préparer » quand vous cliquerez « Arrivage reçu ».</small></div>
     <div class="pc-ov"><h4>🧾 Vendu en plus — à ne pas oublier</h4><ul style="margin:0;padding-left:18px"><li>📦 Boîte cadeau bleu nuit, coffret de 2 (5,90 €)</li><li>✒️ Texte gravé × 2 (+2 € chacun) · dessin n° 4 (+2 €)</li></ul></div>
     <table class="pc-grav"><thead><tr><th>#</th><th>Couleur</th><th>Texte à graver</th><th>Dessin</th><th>Écriture</th></tr></thead>
      <tbody>
       <tr><td>1</td><td class="c"><img src="__IMG_rouge__" alt=""/>Rouge</td><td><span class="t">Léa</span></td><td>n° 4</td><td>Allura</td></tr>
       <tr><td>2</td><td class="c"><img src="__IMG_anthracite__" alt=""/>Gris anthracite</td><td><span class="t">Paul</span></td><td>—</td><td>Allura</td></tr>
      </tbody></table>
     <p style="font-size:.84rem;color:var(--ink-soft);margin:0">Emballage : les 2 marque-pages dans la boîte bleu nuit à 2 élastiques, puis lettre suivie.</p>
    </div>
   </section>
  </main>
 </div>
</div>
<div class="pc-toast" id="toast"></div>
<script>
const COULEURS=__COULEURS__, IMG=__IMG__, VENDU=__VENDU__, ORDERS=__ORDERS__;
const $=s=>document.querySelector(s);
let recu=false; const places={}; COULEURS.forEach(c=>places[c[0]]=c[3]);
function go(id){document.querySelectorAll('section[id^=s]').forEach(s=>s.hidden=s.id!==id);document.querySelectorAll('.mp-seg button').forEach(b=>b.classList.toggle('on',b.dataset.go===id));
 const g={s1:['Catalogue','Produits & stock'],s2:['Commandes','File de production'],s3:['Commandes','Précommandes'],s4:['Commandes','Atelier · fichiers']}[id];$('#crG').textContent=g[0];$('#crT').textContent=g[1];window.scrollTo(0,0);}
function fr(d){const x=new Date(d);return isNaN(x)?'—':x.toLocaleDateString('fr-FR');}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),3200);}
function majTxt(){const d=$('#dArr').value,n=+$('#dDel').value;const t='Expédition à partir du '+fr(addDays(d,n))+'.';$('#dTxt').value=t;$('#apTxt').textContent=t;$('#aD').textContent=fr(d).slice(0,5);$('#tD').textContent=fr(d);$('#faD').textContent=fr(d);}
function majPlaces(){let tot=0,v=0,low=[];const box=$('#places');box.innerHTML='';COULEURS.forEach(c=>{const p=places[c[0]],s=VENDU[c[0]]||0,r=Math.max(0,p-s);tot+=p;v+=s;if(r<=1)low.push(c[1]+' ('+r+')');
  const d=document.createElement('div');d.className='pc-pl';d.innerHTML=`<img src="${IMG[c[0]]}" alt=""/><div><b>${c[1]}</b><small class="${r<=1?'low':''}">${s} vendue${s>1?'s':''} · reste ${r}</small></div><input type="number" min="0" value="${p}" data-c="${c[0]}" aria-label="Places ${c[1]}"/>`;box.appendChild(d);});
 const r=tot-v;$('#plTot').innerHTML=`<b>${tot}</b> places au total · <b>${v}</b> vendues · <b>${r}</b> restantes`;$('#apPl').textContent=r>0?`Plus que ${r} place${r>1?'s':''} sur cette série.`:'Série complète.';
 $('#kPl').textContent=recu?'—':r;$('#tV').textContent=v;$('#tT').textContent=tot;$('#tR').textContent=r;$('#tBar').firstElementChild.style.width=(tot?Math.round(v/tot*100):0)+'%';$('#tBar').classList.toggle('low',r<=3);
 $('#lowRow').textContent=low.length?'⚠️ Presque épuisé : '+low.join(', '):'';}
function carte(o,compact){const li=o.mp.map((m,i)=>`<li><img src="${IMG[m.c]}" alt=""/><span>Marque-page ${i+1} · <b>${COULEURS.find(c=>c[0]===m.c)[1]}</b><small>${m.t?'✍️ « '+m.t+' » · Allura':'sans texte'}${m.d?' · dessin '+m.d:''}</small></span></li>`).join('');
 return `<div class="file-card ${recu?'':'pre'}"><div class="file-card-top"><div><span class="file-ref">#${o.ref}</span><span class="dash-chip prep" style="margin-left:8px">${recu?'À préparer':'Précommande'}</span></div><div style="text-align:right"><div style="font-weight:800">${o.total}</div><div class="file-age">payée le ${o.quand}</div></div></div>
 <div class="file-who"><strong>${o.client}</strong> <span>· ${o.livr}</span></div>
 <ul class="file-items"><li><span class="q">${o.mp.length}×</span><span>Marque-page en bois personnalisé<span class="d">${o.fmt}</span></span></li></ul>
 ${compact?'':`<ul class="pc-mp">${li}</ul>`}
 <div class="file-chips">${recu?'':'<span class="file-chip pre">⏳ Précommande · arrivage prévu le '+$('#tD').textContent+'</span>'}${o.boite?'<span class="file-chip">📦 Boîte cadeau</span>':''}</div>
 ${compact?'':`<div class="file-actions"><button class="btn btn-gold" ${recu?'':'disabled title="Les marque-pages ne sont pas arrivés"'}>Commencer la fabrication</button><button class="btn btn-outline">Fiche complète →</button></div>`}</div>`;}
function majCartes(){const h=ORDERS.map(o=>carte(o,false)).join('');$('#preCards').innerHTML=recu?'<div class="file-empty">Aucune précommande en attente.</div>':h;$('#prepCards').innerHTML=recu?h:'';
 $('#nPre').textContent=recu?0:ORDERS.length;$('#nPrep').textContent=1+(recu?ORDERS.length:0);$('#kPre').textContent=recu?0:ORDERS.length;$('#kPrep').textContent=1+(recu?ORDERS.length:0);$('#navPre').textContent=recu?0:ORDERS.length;
 $('#preList').innerHTML=ORDERS.map(o=>carte(o,true)).join('');
 const a=$('#alertFile');a.classList.toggle('ok',recu);a.innerHTML=recu?'<span>✅</span><span>Arrivage reçu : les '+ORDERS.length+' précommandes sont passées en « À préparer », la fiche se vend normalement.</span>':'<span>⏳</span><span><b>'+ORDERS.length+'</b> précommandes attendent l\'arrivage des marque-pages (prévu le <b>'+$('#tD').textContent.slice(0,5)+'</b>). Elles ne sont pas à graver.</span><span class="sp"></span><a href="#" data-go="s3" class="btn btn-outline" style="padding:7px 12px;font-size:.82rem">Voir les précommandes →</a>';
 const s=$('#faStop');s.classList.toggle('ok',recu);s.innerHTML=recu?'✅ Marque-pages arrivés — à graver<small>Passée « À préparer » le jour de l\'arrivage.</small>':'⏳ PRÉCOMMANDE — ne pas graver avant l\'arrivage<small>Marque-pages attendus le '+$('#tD').textContent+'. La commande passera « À préparer » quand vous cliquerez « Arrivage reçu ».</small>';
 $('#recu').disabled=recu;$('#recu').textContent=recu?'✅ Arrivage reçu le '+new Date().toLocaleDateString('fr-FR'):'✅ Arrivage reçu → passer les précommandes en « À préparer »';
 if(recu){$('#tog').checked=false;$('#preForm').style.display='none';$('#preOff').style.display='block';}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(t){e.preventDefault();go(t.dataset.go);return;}
 if(e.target.closest('#recu')){recu=true;majPlaces();majCartes();toast('Arrivage reçu : '+ORDERS.length+' commandes passées « À préparer », fiche remise en vente normale.');return;}
 if(e.target.closest('#msg')){$('#msgBox').classList.toggle('open');$('#rbtBox').classList.remove('open');return;}
 if(e.target.closest('#rbt')){$('#rbtBox').classList.toggle('open');$('#msgBox').classList.remove('open');return;}});
document.addEventListener('input',e=>{if(e.target.id==='dArr'||e.target.id==='dDel'){majTxt();majCartes();}
 if(e.target.dataset&&e.target.dataset.c){places[e.target.dataset.c]=Math.max(0,+e.target.value||0);majPlaces();}
 if(e.target.id==='tog'){const on=e.target.checked;$('#preForm').style.display=on?'':'none';$('#preOff').style.display=on?'none':'block';}});
majTxt();majPlaces();majCartes();
</script>
</main>
"""
html = (HTML.replace("__CSS__", CSS).replace("__PAGE_CSS__", PAGE_CSS)
        .replace("__COULEURS__", json.dumps(COULEURS, ensure_ascii=False)).replace("__IMG__", json.dumps(IMG))
        .replace("__VENDU__", json.dumps(VENDU)).replace("__ORDERS__", json.dumps(ORDERS, ensure_ascii=False)))
for k in ("caramel", "rouge", "anthracite"):
    html = html.replace(f"__IMG_{k}__", IMG[k])
open(out, "w", encoding="utf-8").write(html)
print(f"{out} : {len(html)//1024} Ko")
