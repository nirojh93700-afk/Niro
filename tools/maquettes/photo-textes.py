#!/usr/bin/env python3
"""Maquette « textes dans l'image » de la fiche verre à vin (26/10/2026).

Gérant : la cliente dit ce qu'il y a d'écrit dans son image (date…), l'agent lit
l'image en direct et valide ; un écart s'affiche AVANT le paiement ; un doute
part en alerte au gérant et sur la fiche atelier.

Usage : photo-textes.py <capture vin.html> <dossier des css du site> <verre vierge.jpg> <sortie.html>
  capture = curl https://nivcreation.fr/produit/verre-a-vin-grave ; css = ses feuilles.
Le site n'est pas touché : la maquette reprend le vrai haut de la fiche (classes du
site) et remplace seulement le parcours par l'étape « photo » avec le nouveau bloc.
Exemple = visuel inventé (prénoms d'exemple), jamais celui d'une vraie cliente.
"""
import base64, glob, json, os, re, sys

cap, cssdir, vierge, out = sys.argv[1:5]
h = open(cap, encoding="utf-8").read()
main = h[h.find("<main"):h.find("</main>")]
main = re.sub(r"<script.*?</script>", "", main, flags=re.S)

css = "\n".join(open(f, encoding="utf-8").read() for f in sorted(glob.glob(os.path.join(cssdir, "*.css"))))
css = re.sub(r"url\((?!['\"]?data:)[^)]*\)", "none", css)  # aucune ressource externe (CSP)
img = "data:image/jpeg;base64," + base64.b64encode(open(vierge, "rb").read()).decode()

# Haut de la fiche (fil d'Ariane, titre, taille, options) = celui du site, « Lot de 4 » choisi.
a = main.find('<div class="product-info"'); b = main.find('<div class="prc"')
top = main[a:b]
top = re.sub(r'<div class="price-lead">[^<]*</div>', '<div class="price-lead">63,90\u00a0€</div>', top)
opts = re.search(r'(<label>Choisissez votre option</label><div class="variant-swatches">)(.*?)(</div></div>)', top, re.S)
sw = opts.group(2).replace('variant-swatch active" aria-pressed="true"', 'variant-swatch" aria-pressed="false"')
sw = sw.replace('<button type="button" class="variant-swatch" aria-pressed="false"><span class="vs-title">Lot de 4',
                '<button type="button" class="variant-swatch active" aria-pressed="true"><span class="vs-title">Lot de 4')
top = top[:opts.start(2)] + sw + top[opts.end(2):]

# Étape 1 du site, carte « Ma photo ou mon logo » choisie.
p = main.find('<div class="prc"'); e1 = main.find('</section>', p) + len('</section>')
step1 = main[p:e1]
cards = step1.split('<button type="button" class="prc-card"')
step1 = '<button type="button" class="prc-card"'.join(cards[:-1]) + '<button type="button" class="prc-card on"' + cards[-1]
step1 = step1.replace('<span class="prc-num">1</span>', '<span class="prc-num done">1</span>')
# Vignettes des cartes : lues dans public/ et intégrées (une page publiée ne charge rien d'ailleurs).
RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public")
def vignette(mt):
    src = mt.group(1); f = os.path.join(RACINE, src.lstrip("/"))
    if not src.startswith("/") or not os.path.exists(f): return mt.group(0)
    from PIL import Image; import io
    im = Image.open(f).convert("RGB"); im.thumbnail((200, 200)); buf = io.BytesIO(); im.save(buf, "JPEG", quality=80)
    return 'src="data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode() + '"'
step1 = re.sub(r'src="([^"]+)"', vignette, step1)
step1 = re.sub(r'\s(srcset|srcSet)="[^"]*"', '', step1)

VISUEL = """<svg viewBox="0 0 300 230" xmlns="http://www.w3.org/2000/svg" class="vx" aria-label="Exemple de visuel">
  <rect width="300" height="230" fill="#fff"/>
  <text x="150" y="58" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="46">Les témoins</text>
  <text x="150" y="86" text-anchor="middle" font-family="'Playfair Display',serif" font-size="17" letter-spacing="1.5">DE LA MARIÉE</text>
  <line x1="62" y1="100" x2="138" y2="100" stroke="#111"/><line x1="162" y1="100" x2="238" y2="100" stroke="#111"/>
  <text x="150" y="105" text-anchor="middle" font-size="12">♥</text>
  <g font-family="'Playfair Display',serif" font-size="22" text-anchor="middle">
    <text x="52" y="140">∞</text><text x="117" y="140">♡</text><text x="183" y="140">⚓&#xFE0E;</text><text x="248" y="140">◇</text></g>
  <g font-family="'Great Vibes',cursive" font-size="21" text-anchor="middle">
    <text x="52" y="168">Camille</text><text x="117" y="168">Léa</text><text x="183" y="168">Inès</text><text x="248" y="168">Jade</text></g>
  <line x1="58" y1="198" x2="104" y2="198" stroke="#111"/><line x1="196" y1="198" x2="242" y2="198" stroke="#111"/>
  <text x="150" y="203" text-anchor="middle" font-family="'Playfair Display',serif" font-size="16">12.06.2027</text>
</svg>"""
PHOTO = """<svg viewBox="0 0 300 230" xmlns="http://www.w3.org/2000/svg" class="vx" aria-label="Exemple de photo">
  <rect width="300" height="230" fill="#f3efe7"/>
  <circle cx="118" cy="92" r="30" fill="#c9b9a2"/><circle cx="184" cy="98" r="28" fill="#b9a68c"/>
  <path d="M60 230 C70 150 160 140 160 230 Z" fill="#a8927a"/><path d="M140 230 C150 160 240 150 250 230 Z" fill="#94806a"/>
</svg>"""

html = f"""<title>Textes dans l'image</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>{css}
:root{{--font-display:'Playfair Display',Georgia,serif;--font-body:'Inter',system-ui,sans-serif}}
body{{background:var(--cream,#fbf7ee);font-family:var(--font-body)}}
.mq-band{{background:#1a1206;color:#e2c67e;padding:12px 16px;font:600 13px/1.4 var(--font-body);text-align:center}}
.mq-band b{{color:#fff}}
.mq-part{{max-width:1180px;margin:28px auto 0;padding:0 16px}}
.mq-part h2{{font-family:var(--font-display);font-size:1.45rem;margin:0 0 4px}}
.mq-part>p.mq-lead{{color:var(--ink-soft,#6b5f4f);margin:0 0 14px}}
.mq-tag{{display:inline-block;background:#c9a24b;color:#1a1206;border-radius:999px;padding:2px 10px;font:700 11px var(--font-body);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}}
.mq-try{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}}
.mq-try button{{border:1px solid #d9c9a8;background:#fff;border-radius:999px;padding:7px 14px;font:500 13px var(--font-body);cursor:pointer}}
.mq-try button.on{{background:#1a1206;color:#fff;border-color:#1a1206}}
.gallery-main{{position:relative}}
.gallery-main .gv{{position:absolute;left:31%;top:12%;width:38%;mix-blend-mode:multiply;opacity:.5}}
.gallery-main .gv svg{{width:100%;height:auto;display:block}}
.vx{{width:100%;height:auto;display:block}}
/* nouveau bloc */
.tx{{margin-top:14px;border:1px solid #e6d9bf;border-radius:14px;background:#fffdf8;padding:14px}}
.tx h4{{margin:0 0 4px;font:600 15px var(--font-body)}}
.tx .tx-sub{{margin:0 0 10px;color:#6b5f4f;font-size:13px}}
.tx-chk{{display:flex;gap:10px;align-items:flex-start;border:1.5px solid #e2d5bb;background:#fff;border-radius:12px;padding:11px 12px;cursor:pointer}}
.tx-chk input{{width:18px;height:18px;margin:2px 0 0;accent-color:#a98935;flex:0 0 auto}}
.tx-chk b{{display:block;font-size:14px}} .tx-chk small{{color:#6b5f4f;font-size:12px}}
.tx-opts{{display:flex;flex-wrap:wrap;gap:8px}}
.tx-opts button{{flex:1 1 160px;text-align:left;border:1.5px solid #e2d5bb;background:#fff;border-radius:12px;padding:10px 12px;cursor:pointer;font:inherit}}
.tx-opts button b{{display:block;font-size:14px}}
.tx-opts button small{{color:#6b5f4f;font-size:12px}}
.tx-opts button.on{{border-color:#c9a24b;box-shadow:0 0 0 3px rgba(201,162,75,.18);background:#fffaf0}}
.tx-read{{margin-top:12px;border-radius:12px;padding:11px 13px;font-size:13.5px;line-height:1.5;display:flex;gap:10px;align-items:flex-start}}
.tx-read .ic{{flex:0 0 auto;font-size:16px;line-height:1.3}}
.tx-wait{{background:#f4efe4;color:#5a4f40}}
.tx-ok{{background:#edf7ef;color:#1f5a2c;border:1px solid #cfe8d4}}
.tx-warn{{background:#fff6e5;color:#6b4a07;border:1px solid #f0d9a6}}
.tx-warn .acts{{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}}
.tx-warn .acts button{{border:0;border-radius:999px;padding:7px 13px;font:600 12.5px var(--font-body);cursor:pointer}}
.tx-warn .acts .y{{background:#1a1206;color:#fff}} .tx-warn .acts .n{{background:#fff;border:1px solid #d9c9a8;color:#3a3024}}
.tx-note{{margin:10px 0 0;font-size:12px;color:#6b5f4f}}
.spin{{display:inline-block;width:14px;height:14px;border:2px solid #c9a24b;border-right-color:transparent;border-radius:50%;animation:sp 0.8s linear infinite}}
@keyframes sp{{to{{transform:rotate(360deg)}}}}
@media (prefers-reduced-motion:reduce){{.spin{{animation:none}}}}
.prc-sumrow small{{display:block;color:#6b5f4f;font-weight:400}}
/* alerte + atelier */
.mq-grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}
@media (max-width:860px){{.mq-grid{{grid-template-columns:1fr}}}}
.mail{{background:#fff;border:1px solid #e6dccb;border-radius:14px;overflow:hidden;min-width:0}}
.mail .mh{{background:#f6f1e7;padding:10px 14px;font-size:12.5px;color:#5a4f40;border-bottom:1px solid #ece3d2}}
.mail .mh b{{color:#1a1206}}
.mail .mb{{padding:14px;font-size:14px;line-height:1.55}}
.mail .rouge{{background:#fdecea;border:1px solid #f5c2bc;color:#7a1d12;border-radius:10px;padding:10px 12px;margin:8px 0}}
.mail .btnm{{display:inline-block;background:#c9a24b;color:#1a1206;border-radius:999px;padding:8px 14px;font-weight:600;font-size:13px;margin-top:6px}}
.atl{{background:#fff;border:1px solid #e6dccb;border-radius:14px;padding:14px;min-width:0}}
.atl h3{{margin:0 0 8px;font:600 15px var(--font-body)}}
.atl table{{width:100%;border-collapse:collapse;font-size:13.5px}}
.atl td{{border-top:1px solid #efe7d8;padding:7px 4px;vertical-align:top}}
.atl td:first-child{{color:#6b5f4f;width:42%}}
.atl .vert{{background:#edf7ef;border:1px solid #cfe8d4;color:#1f5a2c;border-radius:10px;padding:9px 12px;margin-bottom:10px;font-size:13.5px}}
.atl .rge{{background:#fdecea;border:1px solid #f5c2bc;color:#7a1d12;border-radius:10px;padding:9px 12px;margin-bottom:10px;font-size:13.5px}}
.mq-q{{max-width:1180px;margin:26px auto 40px;padding:0 16px}}
.mq-q div{{background:#fff;border:1px dashed #c9a24b;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.55}}
</style>
<div class="mq-band">MAQUETTE — rien n'est en ligne · <b>Fiche verre à vin : la cliente coche la date de son image, l'agent l'aide sans jamais bloquer la commande</b></div>

<div class="mq-part">
  <span class="mq-tag">① Sur la fiche — ce que voit la cliente</span>
  <h2>La cliente envoie son image et coche la date, l'agent l'aide sans bloquer</h2>
  <p class="mq-lead">Essayez : choisissez un exemple. La lecture commence dès que l'image est envoyée et prend quelques secondes. Le bouton « Ajouter au panier » reste toujours actif.</p>
  <div class="mq-try"><button type="button" data-ex="visuel" class="on">Exemple 1 : visuel avec titre, prénoms et une date</button><button type="button" data-ex="photo">Exemple 2 : photo sans texte</button></div>
</div>
<main class="container"><div class="product-layout">
  <div><div class="gallery-main"><img src="{img}" alt="Verre à vin 36 cl" width="600" height="600" style="width:100%;height:auto;display:block;border-radius:18px"><div class="gv" id="gv">{VISUEL}</div></div>
  <p style="font-size:12.5px;color:var(--ink-soft);margin:8px 0 0">Aperçu : votre image posée sur le verre (gravée en blanc givré).</p></div>
  {top}
  {step1}
  <section class="prc-step"><div class="prc-sh"><span class="prc-num done">2</span><h3>Ajoutez votre photo ou votre logo</h3></div>
    <div class="prc-mode"><p class="prc-legend">JPG ou PNG. L'atelier vérifie la qualité avant de graver.</p>
      <div class="field"><label>Votre photo ou logo</label>
        <div class="photo-upload"><div class="photo-preview"><span id="thumb" style="width:84px;height:84px;border-radius:10px;border:1px solid var(--line);overflow:hidden;display:block;background:#fff">{VISUEL}</span><span style="font-size:13px">Image envoyée ✓<br><span style="color:var(--ink-soft)">temoins.png</span></span></div></div></div>
      <div class="tx" id="tx">
        <h4>Y a-t-il une date écrite dans votre image ?</h4>
        <p class="tx-sub">Votre image est comprise. Une date écrite dedans se compte comme un texte, au tarif de la fiche.</p>
        <label class="tx-chk"><input type="checkbox" id="chk"> <span><b>Mon image contient une date</b><small>Comptée comme un texte : +9,00 € sur vos 4 verres</small></span></label>
        <div id="read"></div>
        <p class="tx-note">Nous lisons votre image pour vous aider à ne rien oublier. Si quelque chose ne correspond pas, nous vous contactons avant toute gravure.</p>
      </div>
    </div></section>
  <section class="prc-step"><div class="prc-sh"><span class="prc-num" id="n3">3</span><h3>Résumé de votre gravure</h3></div>
    <div class="prc-sum" id="sum"></div></section>
  </div>
  <div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="tot">63,90 €</span></div>
  <div class="qty-row"><div class="qty-stepper"><button aria-label="Moins">−</button><span>1</span><button aria-label="Plus">+</button></div><button class="btn btn-gold" id="add" style="flex:1">Ajouter au panier</button></div>
  <p class="prc-addhint" id="hint" style="display:none"></p>
  </div>
</div></main>

<div class="mq-part">
  <span class="mq-tag">② Pour vous — seulement s'il y a un doute</span>
  <h2>L'alerte que vous recevez, et la fiche atelier</h2>
  <p class="mq-lead">La commande n'est jamais bloquée : la cliente peut toujours ajouter au panier et payer. Quand ce qu'elle a coché correspond à l'image, vous ne recevez rien de plus que la commande habituelle. Si elle a oublié de cocher la date (ou si l'image était illisible), la commande passe quand même et vous recevez cette alerte.</p>
  <div class="mq-grid">
    <div class="mail"><div class="mh">De : <b>Niv Création (site)</b> · À : vous<br>Objet : <b>⚠️ Commande 1ABC23DE — date dans l'image non cochée</b></div>
      <div class="mb">Verre à vin 36 cl · Lot de 4 · Camille D.
        <div class="rouge"><b>Coché par la cliente :</b> pas de date.<br><b>L'agent a lu dans l'image :</b> « 12.06.2027 » (sous les prénoms).<br>Payé : 9,00 € de gravure · avec la date ce serait 18,00 € (9,00 € d'écart).</div>
        La commande est passée normalement. À vous de décider : graver tel quel, ou lui écrire pour le complément (le message est prêt, rien ne part sans vous).<br><span class="btnm">Ouvrir la commande</span> <span class="btnm" style="background:#fff;border:1px solid #d9c9a8">Message préparé pour la cliente</span>
      </div></div>
    <div class="atl"><h3>Fiche atelier — À graver</h3>
      <div class="vert" id="atl-ok">✓ Image vérifiée par l'agent : 1 date (12.06.2027), payée par la cliente.</div>
      <div class="rge">⚠️ Exemple d'écart : date « 12.06.2027 » lue dans l'image, non cochée par la cliente (9,00 € non payés). <b>À regarder avant de graver.</b></div>
      <table><tr><td>Produit</td><td>Verre à vin 36 cl · Lot de 4 · identiques</td></tr>
        <tr><td>Gravure</td><td>Image de la cliente (téléchargeable)</td></tr>
        <tr><td>Lu dans l'image</td><td>Titre « Les témoins de la mariée », 4 symboles, 4 prénoms, date 12.06.2027</td></tr>
        <tr><td>Compté</td><td>Image + 1 date</td></tr></table></div>
  </div>
</div>

<div class="mq-q"><div><b>Comment c'est compté (votre règle du 26/10)</b> : l'image est comprise, titre, prénoms, symboles et logo compris ; seule une <b>date</b> écrite dedans compte comme un texte. Sur un lot de 4 verres identiques : sans date 9,00 € (verres 2 à 4 : +3 € chacun), avec une date 18,00 € (verre 1 : +3 €, verres 2 à 4 : +5 € chacun). Si l'agent n'arrive pas à lire l'image, la commande passe avec la réponse de la cliente et vous recevez l'alerte « image non vérifiée ».</div></div>

<script>
(function(){{
  var VIS = {json.dumps(VISUEL)}, PHO = {json.dumps(PHOTO)};
  var ex = "visuel", lu = null, timer = null;
  var $ = function(id){{ return document.getElementById(id); }};
  function eur(n){{ return n.toFixed(2).replace(".", ",") + " €"; }}
  function render(){{
    var coche = $("chk").checked, read = $("read");
    if (lu === null) read.innerHTML = '<div class="tx-read tx-wait"><span class="ic"><span class="spin"></span></span><span>Nous lisons votre image… vous pouvez continuer.</span></div>';
    else if (lu === "date" && coche) read.innerHTML = '<div class="tx-read tx-ok"><span class="ic">✓</span><span>Parfait : nous voyons bien une date dans votre image (12.06.2027).</span></div>';
    else if (lu === "date") read.innerHTML = '<div class="tx-read tx-warn"><span class="ic">!</span><span>Votre image contient une date : <b>12.06.2027</b>. Vous avez peut-être oublié de cocher la case ci-dessus : une date est comptée comme un texte (+9,00 € sur vos 4 verres).<div class="acts"><button type="button" class="y" data-a="cocher">Cocher la case</button></div></span></div>';
    else if (coche) read.innerHTML = '<div class="tx-read tx-warn"><span class="ic">!</span><span>Nous ne voyons pas de date dans votre image. Si elle n\\'en contient pas, vous pouvez décocher la case.</span></div>';
    else read.innerHTML = '<div class="tx-read tx-ok"><span class="ic">✓</span><span>Rien à ajouter : nous ne voyons pas de date dans votre image.</span></div>';
    var g = coche ? 3 + 3 * 5 : 3 * 3;
    $("sum").innerHTML = '<div class="prc-sumrow"><span>Gravure</span><b>Votre image' + (coche ? " + une date" : "") + '</b></div>'
      + '<div class="prc-sumrow"><span>Verres<small>Lot de 4, 36 cl</small></span><b>63,90 €</b></div>'
      + '<div class="prc-sumrow"><span>Gravure sur les 4 verres<small>' + (coche ? "verre 1 : +3 € · verres 2 à 4 : +5 € chacun" : "verre 1 : compris · verres 2 à 4 : +3 € chacun") + '</small></span><b>' + eur(g) + '</b></div>'
      + '<div class="prc-sumrow prc-sumtot"><span>Total</span><b>' + eur(63.9 + g) + '</b></div>';
    $("tot").textContent = eur(63.9 + g);
    $("n3").classList.add("done");
  }}
  function lire(){{ lu = null; render(); clearTimeout(timer); timer = setTimeout(function(){{ lu = ex === "visuel" ? "date" : "rien"; render(); }}, 2200); }}
  $("chk").addEventListener("change", render);
  $("read").addEventListener("click", function(e){{ if (e.target.closest("[data-a=cocher]")) {{ $("chk").checked = true; render(); }} }});
  $("add").addEventListener("click", function(){{ var h = $("hint"); h.style.display = ""; h.textContent = "Ajouté au panier ✓ (maquette : rien n'est commandé)."; }});
  document.querySelectorAll(".mq-try button").forEach(function(b){{ b.onclick = function(){{
    ex = b.dataset.ex; document.querySelectorAll(".mq-try button").forEach(function(x){{ x.classList.toggle("on", x === b); }});
    $("gv").innerHTML = ex === "visuel" ? VIS : PHO; $("gv").style.display = ex === "visuel" ? "" : "none";
    $("thumb").innerHTML = ex === "visuel" ? VIS : PHO; $("chk").checked = false; $("hint").style.display = "none"; lire();
  }}; }});
  lire();
}})();
</script>
"""
open(out, "w", encoding="utf-8").write(html)
print(out, len(html))
