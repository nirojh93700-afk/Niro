#!/usr/bin/env python3
# Maquette « Gobelet en ligne » (05/11/2026, gérant : « on va le mettre avec les verres, carafe et gobelet…
# le stock c'est pour admin, les gens il faut pas qu'ils sachent… dès que c'est vendu, il faut qu'il soit
# en rupture… fais une maquette pour me montrer »).
# 4 onglets : ① le menu sur téléphone · ② la page « Verres, Carafes & Gobelet » · ③ la fiche : une couleur
# épuisée · ④ le stock dans Gestion (admin seulement). Les onglets ③ et ④ partagent le même stock simulé.
# Le site n'est PAS touché : ① et ② partent d'une capture de la vraie page /boutique/verres.
#
# Usage : python3 tools/maquettes/gobelet-en-ligne.py <capture verres.html> <dossier css> <sortie.html>
import base64, html, io, os, re, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(RACINE, "public")
EX = os.path.join(RACINE, "docs/maquettes/assets/gobelet/exemples")

cap, cssdir, sortie = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(cap, encoding="utf-8").read()


def uri(path, w=None, q=82):
    """Image en data URI (réduite si w). Le logo est servi tel quel (jamais retouché)."""
    raw = open(path, "rb").read()
    if w is None:
        mime = "image/jpeg" if path.lower().endswith((".jpg", ".jpeg")) else "image/png" if path.lower().endswith(".png") else "image/webp"
        return f"data:{mime};base64," + base64.b64encode(raw).decode()
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


# ---------- CSS du site (polices next/font remplacées par Google Fonts) ----------
css = ""
for f in sorted(os.listdir(cssdir)):
    if f.endswith(".css"):
        css += open(os.path.join(cssdir, f), encoding="utf-8").read() + "\n"
css = re.sub(r"@font-face\{[^}]*\}", "", css)
css += """
:root{--font-display:"Playfair Display",Georgia,serif;--font-body:"Inter",system-ui,sans-serif}
body{font-family:var(--font-body)}
"""
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap">'

NOM = "Verres, Carafes &amp; Gobelet"
GOB_IMG = os.path.join(EX, "ex1-creme-papillon-camille.jpg")


def page_capturee(menu_ouvert):
    h = src
    head_end = h.find("</head>")
    body = h[h.find("<header"): h.find("</main>") + len("</main>")]
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
    # 1) Le nom de l'univers partout (menu, onglets, fil d'Ariane, titre)
    body = body.replace("Verres &amp; Carafes", NOM)
    # 2) Une création de plus
    body = body.replace(f'{NOM}<!-- --> <small>7</small>', f'{NOM}<!-- --> <small>8</small>')
    body = body.replace('<p class="mxup-count">7<!-- --> créations</p>', '<p class="mxup-count">8<!-- --> créations</p>')
    body = re.sub(r'Tout <small>(\d+)</small>', lambda m: f'Tout <small>{int(m.group(1)) + 1}</small>', body)
    body = body.replace("<p>Verres à whisky, à cocktail, à vin, flûtes et carafe, gravés à la commande.</p>",
                        "<p>Verres à whisky, à cocktail, à vin, flûtes, carafe et gobelet isotherme, gravés à la commande.</p>")
    # 3) Le nouveau rayon dans la barre des rayons + sa section
    body = body.replace('<a class="puce" href="#r-verres-1" aria-current="false">Vin, champagne, cocktail &amp; carafe</a>',
                        '<a class="puce" href="#r-verres-1" aria-current="false">Vin, champagne, cocktail &amp; carafe</a>'
                        '<a class="puce" href="#r-verres-2" aria-current="false">Gobelet isotherme</a>')
    i = body.find('id="r-verres-1"')
    j = body.find("</section>", i) + len("</section>")
    carte = (
        '<section class="ur rv in" id="r-verres-2"><h3>Gobelet isotherme<!-- --> <small>1 création</small></h3><div class="ug">'
        '<div class="uc gm-neuf" data-prix="47.9" data-prixmax="47.9"><a class="uc-link" href="#fiche">'
        f'<span class="uc-img"><img class="uc-ph" src="{uri(GOB_IMG, 600)}" alt="Gobelet isotherme 40 oz gravé" />'
        '<span class="uc-cta">Personnaliser</span></span>'
        '<span class="uc-meta"><span class="uc-tag">Édition limitée</span><span class="uc-name">Gobelet isotherme 40 oz</span>'
        '<span class="uc-price">47,90 €</span></span></a>'
        '<button type="button" aria-label="Ajouter aux favoris" class="fav-pastille fav-pastille-vignette">♡</button></div>'
        "</div></section>")
    body = body[:j] + carte + body[j:]
    # 4) Images : fichiers du site en data URI
    def repl(m):
        p = m.group(1)
        f = os.path.join(PUB, p.lstrip("/"))
        if not os.path.exists(f):
            return 'src=""'
        if p.endswith("logo-niv-creation.jpg"):
            return f'src="{uri(f)}"'
        return f'src="{uri(f, 520)}"'
    body = re.sub(r'src="(/[^"]+)"', repl, body)
    if menu_ouvert:
        body = body.replace('<nav class="nav ">', '<nav class="nav open">')
        body = body.replace('<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
                            '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>')
        body = body.replace(f'<a href="/boutique/verres">{NOM}</a>',
                            f'<a href="/boutique/verres" class="gm-nouveau">{NOM}</a>')
    extra = """
a{pointer-events:none}
.gm-nouveau{position:relative}
.gm-neuf .uc-img{outline:3px solid #c9a24b;outline-offset:3px;border-radius:inherit}
.nav.open a.gm-nouveau{color:#8a6d1f!important;font-weight:700!important}
"""
    doc = ("<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
           + FONTS + "<style>" + css + extra + "</style></head><body>" + body + "</body></html>")
    return doc


menu_doc = page_capturee(True)
rayon_doc = page_capturee(False)

# ---------- Onglet ③ : la fiche (couleurs + épuisé) ----------
COULEURS = [  # (id, nom, pastille, stock donné par le gérant le 05/11/2026, image d'exemple)
    ("creme", "Crème", "#efe2c6", 1, "ex1-creme-papillon-camille.jpg"),
    ("blanc", "Blanc", "#ffffff", 3, "ex4-blanc-colibri-ines.jpg"),
    ("marine", "Bleu marine", "#2b3a5b", 2, "ex2-marine-cheval-paul.jpg"),
    ("rose", "Rose", "#e6a6bb", 2, "ex3-rose-rose-lea.jpg"),
]
imgs = {c[0]: uri(os.path.join(EX, c[4]), 620) for c in COULEURS}
stock_js = "{" + ",".join(f'"{c[0]}":{c[3]}' for c in COULEURS) + "}"
noms_js = "{" + ",".join(f'"{c[0]}":"{c[1]}"' for c in COULEURS) + "}"
pastilles_js = "{" + ",".join(f'"{c[0]}":"{c[2]}"' for c in COULEURS) + "}"
imgs_js = "{" + ",".join(f'"{k}":"{v}"' for k, v in imgs.items()) + "}"

PAGE = f"""<title>Gobelet en ligne</title>
{FONTS}
<style>
:root{{--bg:#fbf7ee;--card:#fff;--ink:#1a1206;--soft:#6b5d45;--line:#e8dcc2;--gold:#c9a24b;--gold-d:#8a6d1f;--red:#b4452f;--sand:#f3e8d3;--green:#2f6b3f}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#17110a;--card:#221a10;--ink:#f3ead6;--soft:#c3b394;--line:#3a2e1c;--sand:#2b2113;--gold-d:#e2c67e;--red:#ea8a74;--green:#8fd19e;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#17110a;--card:#221a10;--ink:#f3ead6;--soft:#c3b394;--line:#3a2e1c;--sand:#2b2113;--gold-d:#e2c67e;--red:#ea8a74;--green:#8fd19e;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif;margin:0}}
.gm{{max-width:1180px;margin:0 auto;padding-inline:16px;padding-block:18px 60px}}
.gm-top{{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between;margin-bottom:12px}}
.gm-top h1{{font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.4rem,3.4vw,2rem);margin:0;text-wrap:balance}}
.gm-top p{{margin:0;color:var(--soft);font-size:.9rem}}
.gm-tabs{{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px;scrollbar-width:thin}}
.gm-tabs button{{flex:0 0 auto;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:10px 16px;font:600 .9rem Inter,system-ui,sans-serif;cursor:pointer;min-height:44px}}
.gm-tabs button[aria-selected="true"]{{background:var(--ink);color:var(--bg);border-color:var(--ink)}}
.gm-note{{background:var(--sand);border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:.92rem;line-height:1.55;margin-bottom:14px}}
.gm-note b{{color:var(--gold-d)}}
.gm-phone{{width:min(390px,100%);height:760px;margin:0 auto;border:10px solid #1a1206;border-radius:38px;overflow:hidden;background:#fff;box-shadow:0 18px 40px rgba(26,18,6,.18)}}
.gm-phone iframe,.gm-wide iframe{{width:100%;height:100%;border:0;display:block}}
.gm-wide{{height:1120px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff}}
.gm-cols{{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:24px;align-items:start}}
@media (max-width:820px){{.gm-cols{{grid-template-columns:1fr}}.gm-wide{{height:1500px}}}}
.gm-card{{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;min-width:0}}
.gm-photo{{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:1;background:var(--sand)}}
.gm-photo img{{width:100%;height:100%;object-fit:cover;display:block;transition:filter .2s}}
.gm-photo.out img{{filter:grayscale(.55) opacity(.7)}}
.gm-photo .tag{{position:absolute;top:12px;left:12px;background:#b4452f;color:#fff;font:700 .78rem Inter,sans-serif;padding:6px 10px;border-radius:999px}}
.gm-badge{{display:inline-flex;align-items:center;gap:7px;background:#f6ecd3;color:#7c6120;border:1px solid #e7d3a1;border-radius:999px;padding:5px 11px;font:700 .74rem Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase}}
.gm-badge i{{width:7px;height:7px;border-radius:50%;background:#c9a24b;display:inline-block}}
.gm-h2{{font-family:"Playfair Display",Georgia,serif;font-size:1.55rem;margin:10px 0 4px;text-wrap:balance}}
.gm-prix{{font-size:1.5rem;font-weight:700;margin:6px 0 2px}}
.gm-sous{{color:var(--soft);font-size:.86rem;margin:0 0 14px}}
.gm-lbl{{font-size:.92rem;color:var(--soft);margin-bottom:8px}}
.gm-lbl b{{color:var(--gold-d)}}
.gm-sw{{display:flex;flex-wrap:wrap;gap:10px}}
.gm-sw button{{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;cursor:pointer;padding:4px;width:74px;color:var(--ink);font:500 .78rem Inter,sans-serif;min-height:44px}}
.gm-sw .d{{width:40px;height:40px;border-radius:50%;border:2px solid var(--line);position:relative}}
.gm-sw button[aria-pressed="true"] .d{{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,162,75,.28)}}
.gm-sw button[aria-pressed="true"]{{color:var(--gold-d);font-weight:700}}
.gm-sw button.out .d{{opacity:.45}}
.gm-sw button.out .d::after{{content:"";position:absolute;left:50%;top:-4px;bottom:-4px;width:2px;background:#b4452f;transform:translateX(-50%) rotate(45deg)}}
.gm-sw button.out .n{{text-decoration:line-through;color:var(--soft)}}
.gm-sw .ep{{font-size:.68rem;color:var(--red);font-weight:700}}
.gm-btn{{display:block;width:100%;margin-top:16px;border:0;border-radius:999px;padding:14px;font:700 1rem Inter,sans-serif;cursor:pointer;background:linear-gradient(180deg,#d7b663,#b8913a);color:#1a1206;min-height:48px}}
.gm-btn[disabled]{{background:#d9d2c3;color:#6b5d45;cursor:not-allowed}}
.gm-rupt{{margin-top:10px;color:var(--red);font-size:.88rem}}
.gm-alerte{{margin-top:10px;background:#fbf4e6;border:1px solid #e7d3a1;border-radius:12px;padding:12px 14px;color:#1a1206}}
.gm-alerte b{{color:#8a6d1f;font-size:.88rem;display:block;margin-bottom:8px}}
.gm-alerte .row{{display:flex;gap:8px;flex-wrap:wrap}}
.gm-alerte input{{flex:1 1 160px;min-width:0;border:1px solid #e7d3a1;border-radius:10px;padding:10px;font:inherit}}
.gm-alerte span{{border-radius:10px;padding:10px 14px;background:#1a1206;color:#fbf7ee;font-weight:600;font-size:.88rem}}
.gm-tout{{margin-top:12px;background:#fbeae6;border:1px solid #efc3b8;color:#7a2b1c;border-radius:12px;padding:10px 14px;font-size:.9rem}}
.gm-tbl{{width:100%;border-collapse:collapse;font-size:.92rem}}
.gm-tbl th{{text-align:left;color:var(--soft);font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;padding:8px 6px;border-bottom:1px solid var(--line)}}
.gm-tbl td{{padding:10px 6px;border-bottom:1px solid var(--line);vertical-align:middle}}
.gm-tbl .num{{font-variant-numeric:tabular-nums;font-weight:700;font-size:1.05rem}}
.gm-pill{{display:inline-block;border-radius:999px;padding:4px 10px;font-size:.78rem;font-weight:700}}
.gm-pill.ok{{background:#e5f2e8;color:#2f6b3f}}.gm-pill.bas{{background:#fbf0d9;color:#8a5a00}}.gm-pill.ko{{background:#fbe1dc;color:#9a3221}}
.gm-mini{{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:8px 10px;font:600 .8rem Inter,sans-serif;cursor:pointer;min-height:40px}}
.gm-mini[disabled]{{opacity:.45;cursor:not-allowed}}
.gm-adm{{display:flex;align-items:center;gap:8px;font:700 .74rem Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fbf7ee;background:#1a1206;border-radius:10px;padding:8px 12px;margin-bottom:12px;width:max-content;max-width:100%}}
.gm-scroll{{overflow-x:auto}}
.gm-reset{{margin-top:12px}}
[hidden]{{display:none!important}}
</style>
<div class="gm">
  <div class="gm-top">
    <h1>Gobelet isotherme : où il va sur le site</h1>
    <p>Maquette · rien n'est en ligne</p>
  </div>
  <div class="gm-tabs" role="tablist">
    <button role="tab" aria-selected="true" data-t="menu">① Le menu (téléphone)</button>
    <button role="tab" aria-selected="false" data-t="rayon">② La page Verres, Carafes &amp; Gobelet</button>
    <button role="tab" aria-selected="false" data-t="fiche">③ La fiche : couleur épuisée</button>
    <button role="tab" aria-selected="false" data-t="gestion">④ Le stock dans Gestion</button>
  </div>

  <section data-v="menu">
    <div class="gm-note">L'entrée <b>« Verres &amp; Carafes »</b> devient <b>« Verres, Carafes &amp; Gobelet »</b> (en doré ici pour la repérer ; sur le site elle garde la couleur des autres). Même adresse qu'aujourd'hui, rien d'autre ne bouge dans le menu.</div>
    <div class="gm-phone"><iframe title="Menu sur téléphone" srcdoc="{html.escape(menu_doc, quote=True)}"></iframe></div>
  </section>

  <section data-v="rayon" hidden>
    <div class="gm-note">La page garde ses deux rayons (verres à whisky · vin, champagne, cocktail &amp; carafe) et gagne un 3ᵉ rayon <b>« Gobelet isotherme »</b>, avec sa carte « Édition limitée » à 47,90 € (entourée d'or ici seulement). Aucune quantité n'est écrite sur la carte.</div>
    <div class="gm-wide"><iframe title="Page Verres, Carafes et Gobelet" srcdoc="{html.escape(rayon_doc, quote=True)}"></iframe></div>
  </section>

  <section data-v="fiche" hidden id="fiche">
    <div class="gm-note">La cliente ne voit <b>jamais</b> le nombre restant. Quand une couleur est vendue jusqu'au dernier, sa pastille est <b>barrée « Épuisé »</b>, le bouton devient <b>« Épuisé »</b> et un encadré « Prévenez-moi dès son retour » apparaît (comme sur les autres fiches du site). Les autres couleurs restent en vente. Pour essayer : onglet ④, « Vendre 1 ».</div>
    <div class="gm-cols">
      <div class="gm-card">
        <div class="gm-photo" id="ph"><img id="phImg" alt="Gobelet gravé"><span class="tag" id="phTag" hidden>Épuisé</span></div>
      </div>
      <div class="gm-card">
        <span class="gm-badge"><i></i>Édition limitée</span>
        <h2 class="gm-h2">Gobelet isotherme 40 oz gravé</h2>
        <div class="gm-prix">47,90 €</div>
        <p class="gm-sous">Livraison calculée au panier · 1ʳᵉ gravure comprise, +3 € par élément en plus</p>
        <div class="gm-lbl">Couleur : <b id="colNom"></b></div>
        <div class="gm-sw" id="sw"></div>
        <button class="gm-btn" id="add">Ajouter au panier</button>
        <div id="rupt" hidden>
          <p class="gm-rupt">Cette couleur est momentanément épuisée.</p>
          <div class="gm-alerte"><b>📩 Prévenez-moi dès son retour</b><div class="row"><input placeholder="Votre e-mail" aria-label="Votre e-mail"><span>Me prévenir</span></div></div>
        </div>
        <div class="gm-tout" id="tout" hidden>Toutes les couleurs sont épuisées : la carte du gobelet affiche « Épuisé » dans le rayon, et la fiche ne peut plus être commandée.</div>
      </div>
    </div>
  </section>

  <section data-v="gestion" hidden>
    <div class="gm-adm">🔒 Gestion · visible seulement par vous</div>
    <div class="gm-note">Le stock que vous m'avez donné, saisi par couleur dans <b>Gestion → Produits &amp; stock</b>. Chaque commande payée retire 1 tout seul (comme pour les autres produits). Arrivé à 0, la couleur passe en rupture sur le site. « Vendre 1 » simule une commande pour voir la fiche (onglet ③) réagir.</div>
    <div class="gm-card gm-scroll">
      <table class="gm-tbl">
        <thead><tr><th>Couleur</th><th>Stock</th><th>Sur le site</th><th></th></tr></thead>
        <tbody id="tb"></tbody>
      </table>
      <button class="gm-mini gm-reset" id="reset">Remettre le stock de départ (1 · 3 · 2 · 2)</button>
    </div>
  </section>
</div>
<script>
(function(){{
  var DEPART={stock_js}, NOMS={noms_js}, PAST={pastilles_js}, IMGS={imgs_js};
  var ORDRE=["creme","blanc","marine","rose"];
  var stock=JSON.parse(JSON.stringify(DEPART)), choisi="creme";
  function out(c){{return stock[c]<=0;}}
  function rendFiche(){{
    var sw=document.getElementById("sw"); sw.innerHTML="";
    ORDRE.forEach(function(c){{
      var b=document.createElement("button"); b.type="button";
      b.className=out(c)?"out":""; b.setAttribute("aria-pressed",c===choisi?"true":"false");
      b.innerHTML='<span class="d" style="background:'+PAST[c]+'"></span><span class="n">'+NOMS[c]+'</span>'+(out(c)?'<span class="ep">Épuisé</span>':'');
      b.onclick=function(){{choisi=c;rendFiche();}};
      sw.appendChild(b);
    }});
    document.getElementById("colNom").textContent=NOMS[choisi]+(out(choisi)?" — épuisé":"");
    document.getElementById("phImg").src=IMGS[choisi];
    document.getElementById("ph").className="gm-photo"+(out(choisi)?" out":"");
    document.getElementById("phTag").hidden=!out(choisi);
    var add=document.getElementById("add");
    add.disabled=out(choisi); add.textContent=out(choisi)?"Épuisé":"Ajouter au panier";
    document.getElementById("rupt").hidden=!out(choisi);
    document.getElementById("tout").hidden=!ORDRE.every(out);
  }}
  function rendGestion(){{
    var tb=document.getElementById("tb"); tb.innerHTML="";
    ORDRE.forEach(function(c){{
      var s=stock[c], etat=s<=0?'<span class="gm-pill ko">Rupture · grisé</span>':s===1?'<span class="gm-pill bas">En vente · dernier</span>':'<span class="gm-pill ok">En vente</span>';
      var tr=document.createElement("tr");
      tr.innerHTML='<td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid #cdbf9f;background:'+PAST[c]+';vertical-align:-2px;margin-right:8px"></span>'+NOMS[c]+'</td><td class="num">'+s+'</td><td>'+etat+'</td><td></td>';
      var b=document.createElement("button"); b.className="gm-mini"; b.textContent="Vendre 1"; b.disabled=s<=0;
      b.onclick=function(){{stock[c]=Math.max(0,stock[c]-1);rendGestion();rendFiche();}};
      tr.lastChild.appendChild(b); tb.appendChild(tr);
    }});
  }}
  document.getElementById("reset").onclick=function(){{stock=JSON.parse(JSON.stringify(DEPART));rendGestion();rendFiche();}};
  document.querySelectorAll(".gm-tabs button").forEach(function(t){{
    t.onclick=function(){{
      document.querySelectorAll(".gm-tabs button").forEach(function(x){{x.setAttribute("aria-selected",x===t?"true":"false");}});
      document.querySelectorAll("section[data-v]").forEach(function(s){{s.hidden=s.getAttribute("data-v")!==t.getAttribute("data-t");}});
    }};
  }});
  rendFiche(); rendGestion();
}})();
</script>
"""
open(sortie, "w", encoding="utf-8").write(PAGE)
print(sortie, round(len(PAGE) / 1024), "Ko")
