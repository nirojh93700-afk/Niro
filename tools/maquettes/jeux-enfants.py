#!/usr/bin/env python3
"""Maquette « Jeux pour enfants » — nouvelle catégorie (07/10/2026).

Gérant : « une nouvelle catégorie, c'est des jeux pour les enfants, je te donne les photos » (9 puzzles
à encastrer en bois, découpés et gravés au laser). Page de catégorie : le client choisit un thème, peut
faire graver le prénom de l'enfant, puis ajoute au panier. Même coquille que le site (en-tête, pied de
page, styles, polices) via coquille_site.py ; seul <main> est neuf. Prix = PROPOSITIONS à valider.

Usage : python3 tools/maquettes/jeux-enfants.py <capture d'une page du site, ex. /cristaux>
Sortie : docs/maquettes/jeux-enfants.html (+ .fragment.html pour l'artifact). Rien n'est touché dans le site.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coquille_site import ROOT, uri, coquille, LOGO_JS

OUT = os.path.join(ROOT, "docs", "maquettes")
ASSETS = os.path.join(OUT, "assets", "jeux-enfants")
SHELL = coquille(sys.argv[1])

PRIX = 29.90        # validé par le gérant le 07/10/2026 : prénom compris
PRIX_PRENOM = 0     # prénom compris dans le prix (choix du gérant, 07/10/2026)

# (fichier, nom, famille, pièces)
THEMES = [
    ("foret", "Les animaux de la forêt", "animaux", ["renard", "lapin", "faon", "hibou", "hérisson", "écureuil", "ourson", "raton laveur"]),
    ("savane", "Les animaux de la savane", "animaux", ["lion", "éléphant", "girafe", "zèbre", "rhinocéros", "hippopotame", "singe", "crocodile"]),
    ("australie", "Les animaux d'Australie", "animaux", ["kangourou", "koala", "émeu", "échidné", "ornithorynque", "cacatoès", "phalanger", "dingo"]),
    ("animaux-amerique", "Les animaux du Grand Nord", "animaux", ["bison", "aigle", "ours", "castor", "renard", "lynx", "faon", "tamia"]),
    ("dinosaures", "Les dinosaures", "aventure", ["tyrannosaure", "tricératops", "stégosaure", "spinosaure", "ptérodactyle", "ankylosaure", "diplodocus", "parasaurolophus"]),
    ("vehicules-secours", "Les véhicules de secours", "aventure", ["camion de pompiers", "hélicoptère", "ambulance", "voiture de police", "dépanneuse", "bateau de sauvetage", "4×4 de secours"]),
    ("camping", "L'aventure en camping", "aventure", ["tente", "feu de camp", "lanterne", "sac à dos", "boussole", "sapin", "guimauve", "chaussures de marche"]),
    ("jardin-enchante", "Le jardin enchanté", "jardin", ["fée", "papillon", "lapin", "maison champignon", "arrosoir", "escargot", "fleur", "coccinelle"]),
    ("fruits-legumes", "Les fruits et légumes", "jardin", ["pomme", "banane", "poire", "fraise", "brocoli", "carotte", "citrouille", "maïs"]),
]
FAMILLES = [("tous", "Tous les thèmes"), ("animaux", "Animaux"), ("aventure", "Aventure"), ("jardin", "Jardin & nature")]
FONTS = [("playfair", "Playfair"), ("cinzel", "Cinzel"), ("montserrat", "Montserrat"), ("inter", "Inter"),
         ("pacifico", "Pacifico"), ("great-vibes", "Great Vibes"), ("allura", "Allura"), ("cinzel-deco", "Cinzel Deco")]

IMG = {k: uri(os.path.join(ASSETS, f"{k}.jpg"), 820, 78) for k, *_ in THEMES}


def euro(n):
    return f"{n:.2f}".replace(".", ",") + " €"


ICON = {
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "leaf": '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>',
    "pin": '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "hand": '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v6.5A6.5 6.5 0 0 1 10.5 21h-.6a6 6 0 0 1-4.6-2.2L3 16a1.6 1.6 0 0 1 2.4-2L8 16"/>',
    "pen": '<path d="M4 20l4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20z"/><path d="m14.5 6.5 3 3"/>',
    "puzzle": '<path d="M9 3h4v2a2 2 0 1 0 4 0V3h4v6h-2a2 2 0 1 0 0 4h2v8h-6v-2a2 2 0 1 0-4 0v2H3v-8h2a2 2 0 1 0 0-4H3V3z"/>',
    "gift": '<rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13M12 8S10.5 3 7.5 4.5 9 8 12 8zm0 0s1.5-5 4.5-3.5S15 8 12 8z"/>',
}


def ic(n, cls="jx-ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>')


def tuile(i, t):
    k, nom, fam, pieces = t
    return f'''<button type="button" class="jx-tile" data-i="{i}" data-fam="{fam}" aria-pressed="false">
      <span class="jx-img"><img src="{IMG[k]}" alt="Puzzle en bois : {nom}" loading="lazy"></span>
      <span class="jx-price">{euro(PRIX)}</span>
      <span class="jx-ok" aria-hidden="true">{ic("check")}</span>
      <span class="jx-lab"><b>{nom}</b><span>{len(pieces)} pièces · {", ".join(pieces[:3])}…</span></span>
    </button>'''


TILES = "\n".join(tuile(i, t) for i, t in enumerate(THEMES))
CHIPS = "".join(
    f'<button type="button" class="jx-chip{" on" if k == "tous" else ""}" data-fam="{k}" aria-pressed="{"true" if k == "tous" else "false"}">{lab}'
    f'<span class="jx-n">{len(THEMES) if k == "tous" else sum(1 for t in THEMES if t[2] == k)}</span></button>'
    for k, lab in FAMILLES)
POLICES = "".join(f'<button type="button" class="jx-font fnt-{k}{" on" if k == "playfair" else ""}" data-font="{k}" aria-pressed="{"true" if k == "playfair" else "false"}">{lab}</button>' for k, lab in FONTS)

MAIN = f'''<main class="jx">
<section class="jx-intro">
  <div class="container">
    <p class="jx-k">Nouvelle collection · Jeux pour enfants</p>
    <h1>Des puzzles en bois, <em>gravés au prénom</em> de votre enfant</h1>
    <p class="jx-lede">Des puzzles à encastrer découpés et gravés dans notre atelier : chaque pièce se soulève grâce à
      son encoche, et le plateau peut porter le prénom de l'enfant. Un jeu qui accompagne ses premières découvertes,
      et un cadeau de naissance ou d'anniversaire qui lui ressemble.</p>
    <ul class="jx-trust">
      <li>{ic("leaf")}<span><b>Bois naturel</b>plateau et pièces en bois</span></li>
      <li>{ic("hand")}<span><b>Encoches pour les petits doigts</b>chaque pièce se saisit facilement</span></li>
      <li>{ic("pin")}<span><b>Découpé et gravé en France</b>dans notre atelier</span></li>
    </ul>
  </div>
</section>

<section class="jx-shop" aria-labelledby="t-th">
  <div class="container jx-layout">
    <div class="jx-col">
      <div class="jx-head">
        <h2 id="t-th">Choisissez son thème</h2>
        <p>Touchez un puzzle pour le voir en grand et ajouter son prénom.</p>
      </div>
      <div class="jx-chips" role="group" aria-label="Filtrer les thèmes">{CHIPS}</div>
      <div class="jx-grid">{TILES}</div>
    </div>

    <aside class="jx-panel" id="panneau" aria-labelledby="t-pan" aria-live="polite">
      <div class="jx-stage">
        <div class="jx-empty" id="vide">{ic("puzzle","jx-ic jx-ic-xl")}<p><b>Votre puzzle apparaîtra ici</b>Choisissez un thème dans la galerie.</p></div>
        <img id="grand" alt="" hidden>
        <span class="jx-pv fnt-playfair" id="pv" hidden></span>
      </div>
      <h3 id="t-pan" class="jx-pname">Votre puzzle</h3>
      <p class="jx-pdesc" id="pdesc">Aucun thème choisi pour l'instant.</p>
      <ul class="jx-pieces" id="pieces"></ul>

      <div class="field">
        <label>Prénom gravé sur le plateau (compris, facultatif)</label>
        <button type="button" class="jx-opt" id="prenomon" aria-pressed="false" aria-controls="prenomzone">
          <span class="jx-opt-ic">{ic("pen")}</span>
          <span><b>Ajouter le prénom</b><small>Gravé en bas du plateau, dans l'écriture de votre choix</small></span>
          <span class="jx-opt-p">Compris</span>
          <span class="jx-box" aria-hidden="true">{ic("check")}</span>
        </button>
        <div class="jx-txt" id="prenomzone" hidden>
          <label class="jx-sub" for="prenom">Prénom de l'enfant</label>
          <div class="jx-inp"><input id="prenom" type="text" maxlength="14" placeholder="Ex. Léa" autocomplete="off"><span id="prenomn">0/14</span></div>
          <span class="jx-sub">Écriture</span>
          <div class="jx-fonts" role="group" aria-label="Écriture du prénom">{POLICES}</div>
        </div>
      </div>

      <div class="pd-totbox"><span class="lab">Total tout compris</span><span class="val" id="total">—</span></div>
      <div class="qty-row">
        <div class="qty-stepper"><button type="button" id="moins" aria-label="Moins">−</button><span id="qte">1</span><button type="button" id="plus" aria-label="Plus">+</button></div>
        <button type="button" class="btn btn-gold" id="ajout" style="flex:1" disabled>Ajouter au panier</button>
      </div>
      <p class="jx-hint" id="manque">Choisissez d'abord un thème dans la galerie.</p>
      <div class="pd-perso"><b>✦ Découpé et gravé à la commande</b><p>Chaque puzzle est découpé, gravé et poncé pour vous dans notre atelier.</p></div>
    </aside>
  </div>
</section>

<div class="jx-bar" id="barre" hidden>
  <img id="barimg" alt="">
  <span class="jx-bar-t"><b id="barnom"></b><small id="barprix"></small></span>
  <a class="btn btn-gold" href="#panneau">Ajouter son prénom</a>
</div>

<section class="jx-gift" aria-labelledby="t-gift">
  <div class="container jx-gift-in">
    <span class="jx-gift-ic">{ic("gift","jx-ic jx-ic-xl")}</span>
    <div>
      <h2 id="t-gift">Un cadeau qui grandit avec lui</h2>
      <p>Pour une naissance, un premier anniversaire ou un baptême : le puzzle se joue d'abord, puis se garde en
        souvenir, son prénom gravé sur le plateau.</p>
    </div>
  </div>
</section>
</main>'''

CSS = r'''
.mq-banner{background:#2b2620;color:#d9c79a;text-align:center;font-size:.78rem;padding:8px 14px}
.mq-banner b{color:#e2c67e}
.jx{--jx-gold-t:#836619;--jx-shadow:0 10px 26px rgba(43,38,32,.12);--jx-ring:0 0 0 1px rgba(194,161,78,.28);background:var(--cream)}
.jx .container{max-width:1180px}
.jx-ic{width:20px;height:20px;flex:none}
.jx-ic-xl{width:40px;height:40px}
.jx-k{font-size:.72rem;letter-spacing:3px;text-transform:uppercase;color:var(--jx-gold-t);font-weight:700;margin:0 0 10px}
.jx h1,.jx h2,.jx h3{font-family:var(--font-display),Georgia,serif;color:var(--ink);font-weight:600;letter-spacing:-.01em;text-wrap:balance;margin:0}
.jx h1 em{font-style:normal;color:var(--jx-gold-t)}
.jx-lede{color:var(--ink-soft);font-size:clamp(1rem,2.4vw,1.1rem);line-height:1.6;max-width:62ch;margin:14px auto 0}
.jx-intro{padding:clamp(34px,6vw,64px) 0 clamp(22px,4vw,34px);text-align:center;background:radial-gradient(70% 90% at 50% 0%,rgba(194,161,78,.14),transparent 70%)}
.jx-intro h1{font-size:clamp(1.9rem,5.2vw,3rem);line-height:1.1}
.jx-trust{list-style:none;padding:0;margin:26px auto 0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px}
.jx-trust li{display:flex;align-items:center;gap:10px;text-align:left;color:var(--gold-dark)}
.jx-trust b{display:block;color:var(--ink);font-size:.92rem}
.jx-trust span{color:var(--ink-soft);font-size:.82rem;line-height:1.3}
.jx-shop{padding:8px 0 clamp(48px,7vw,80px)}
.jx-layout{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:clamp(22px,3vw,40px);align-items:start}
.jx-col{min-width:0}
.jx-head h2{font-size:clamp(1.45rem,3.4vw,1.9rem)}
.jx-head p{color:var(--ink-soft);margin:6px 0 0}
.jx-chips{display:flex;flex-wrap:wrap;gap:8px;padding:16px 0 6px}
.jx-chip{display:inline-flex;align-items:center;gap:7px;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s}
.jx-chip:hover{border-color:var(--gold)}
.jx-chip.on{background:var(--ink);border-color:var(--ink);color:#fff}
.jx-n{font-size:.72rem;font-weight:700;min-width:20px;text-align:center;padding:1px 6px;border-radius:999px;background:var(--cream-2);color:var(--ink-soft)}
.jx-chip.on .jx-n{background:rgba(255,255,255,.16);color:#e2c67e}
.jx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px}
.jx-tile{position:relative;display:block;padding:0;border:0;border-radius:16px;overflow:hidden;background:var(--paper);box-shadow:var(--jx-shadow),var(--jx-ring);cursor:pointer;text-align:left;font:inherit;color:var(--ink);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .25s}
.jx-tile:hover{transform:translateY(-3px);box-shadow:0 18px 36px rgba(43,38,32,.18),var(--jx-ring)}
.jx-tile:focus-visible{outline:3px solid var(--gold-dark);outline-offset:3px}
.jx-tile[hidden]{display:none}
.jx-img{display:block;position:relative;aspect-ratio:4/3;overflow:hidden}
.jx-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.22,1,.36,1)}
.jx-tile:hover .jx-img img{transform:scale(1.05)}
.jx-lab{display:block;padding:11px 13px 13px;font-size:.8rem;color:var(--ink-soft);line-height:1.4}
.jx-lab b{display:block;font-family:var(--font-display),Georgia,serif;font-size:1rem;color:var(--ink);margin-bottom:2px}
.jx-price{position:absolute;top:8px;right:8px;z-index:2;background:rgba(255,253,249,.95);color:var(--ink);font-weight:700;font-size:.74rem;padding:4px 9px;border-radius:20px;border:1px solid #e7ddcd}
.jx-ok{position:absolute;top:8px;left:8px;z-index:3;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;box-shadow:0 6px 14px rgba(0,0,0,.25);opacity:0;transform:scale(.6);transition:opacity .2s,transform .35s cubic-bezier(.22,1,.36,1)}
.jx-ok .jx-ic{width:17px;height:17px;stroke-width:2.6}
.jx-tile.on{box-shadow:0 0 0 3px var(--gold),0 14px 30px rgba(169,137,53,.3)}
.jx-tile.on .jx-ok{opacity:1;transform:scale(1)}
.jx-panel{position:sticky;top:16px;background:var(--paper);border-radius:18px;padding:16px 18px 18px;box-shadow:0 18px 40px rgba(43,38,32,.10),var(--jx-ring)}
.jx-stage{position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:radial-gradient(120% 90% at 50% 18%,#fffdf8,#f0e8d8 70%,#e7dcc5)}
.jx-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:jxIn .5s cubic-bezier(.22,1,.36,1)}
@keyframes jxIn{from{opacity:0;transform:scale(1.04);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.jx-empty{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:8px;text-align:center;color:var(--gold-dark);padding:18px}
.jx-empty[hidden]{display:none}
.jx-empty p{margin:0;color:var(--ink-soft);font-size:.88rem}
.jx-empty b{display:block;color:var(--ink);font-family:var(--font-display),Georgia,serif;font-size:1.05rem;margin-bottom:2px}
.jx-pv{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);z-index:2;max-width:70%;padding:2px 14px;color:#5a3a1c;font-size:clamp(1.1rem,2.6vw,1.6rem);line-height:1.15;text-align:center;background:rgba(232,210,170,.86);border-radius:8px;box-shadow:inset 0 0 0 1px rgba(90,58,28,.35);overflow-wrap:anywhere;pointer-events:none}
.jx-pv[hidden]{display:none}
.jx-pname{font-size:1.3rem;margin-top:14px!important}
.jx-pdesc{color:var(--ink-soft);font-size:.9rem;margin:4px 0 8px}
.jx-pieces{list-style:none;padding:0;margin:0 0 4px;display:flex;flex-wrap:wrap;gap:6px}
.jx-pieces li{font-size:.76rem;padding:3px 9px;border-radius:999px;background:var(--cream-2);color:var(--ink-soft)}
.jx-panel .field{margin-top:14px}
.jx-panel .field>label{display:block;font-weight:600;font-size:.92rem;margin-bottom:8px;color:var(--ink)}
.jx-opt{width:100%;display:flex;align-items:center;gap:12px;text-align:left;font:inherit;color:var(--ink);background:var(--paper);border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.jx-opt:hover{border-color:var(--gold)}
.jx-opt b{display:block;font-size:.9rem}
.jx-opt small{display:block;color:var(--ink-soft);font-size:.76rem;line-height:1.35}
.jx-opt-ic{width:46px;height:46px;border-radius:8px;flex:none;display:grid;place-items:center;background:var(--cream-2);color:var(--gold-dark)}
.jx-opt-p{margin-left:auto;font-weight:700;color:var(--jx-gold-t);font-size:.86rem;white-space:nowrap}
.jx-box{flex:none;width:22px;height:22px;border-radius:6px;border:1.5px solid var(--line);display:grid;place-items:center;color:transparent}
.jx-box .jx-ic{width:15px;height:15px;stroke-width:2.6}
.jx-opt.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.jx-opt.on .jx-box{background:var(--gold-dark);border-color:var(--gold-dark);color:#fff}
.jx-txt{margin-top:10px;padding:12px;border-radius:12px;background:#fbf4e6;border:1px solid #e7d3a1;display:grid;gap:8px}
.jx-txt[hidden]{display:none}
.jx-sub{font-size:.8rem;font-weight:600;color:var(--ink-soft)}
.jx-inp{display:flex;align-items:center;gap:8px;background:var(--paper);border:1.5px solid var(--line);border-radius:10px;padding:0 12px}
.jx-inp:focus-within{border-color:var(--gold-dark)}
.jx-inp input{flex:1;min-width:0;box-sizing:border-box;border:0;background:none;font:inherit;font-size:16px;color:var(--ink);padding:11px 0;outline:none}
.jx-inp span{font-size:.75rem;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.jx-fonts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.jx-font{border:1.5px solid var(--line);background:var(--paper);color:var(--ink);border-radius:10px;padding:8px 6px;font-size:1.02rem;cursor:pointer;line-height:1.2}
.jx-font:hover{border-color:var(--gold)}
.jx-font.on{border-color:var(--gold-dark);box-shadow:0 0 0 2px var(--gold)}
.jx-font.fnt-great-vibes,.jx-font.fnt-allura{font-size:1.35rem;padding-block:4px}
.jx-panel .pd-totbox .val{font-variant-numeric:tabular-nums}
.jx-panel .qty-row{margin-bottom:8px}
.jx-panel .btn-gold[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}
.jx-hint{font-size:.82rem;color:#b4452f;margin:0 0 6px}
.jx-hint[hidden]{display:none}
.jx-bar{position:fixed;left:10px;right:10px;bottom:10px;z-index:60;display:none;align-items:center;gap:10px;padding:8px 8px 8px 10px;border-radius:16px;background:rgba(43,38,32,.96);color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.3);transition:opacity .25s,transform .3s}
.jx-bar.off{opacity:0;pointer-events:none;transform:translateY(16px)}
.jx-bar img{width:52px;height:39px;border-radius:8px;object-fit:cover}
.jx-bar-t{min-width:0;flex:1;line-height:1.25}
.jx-bar-t b{display:block;font-size:.86rem;color:#e2c67e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jx-bar-t small{font-size:.76rem;color:rgba(255,255,255,.75)}
.jx-bar .btn{padding:10px 14px;font-size:.84rem;white-space:nowrap}
.jx-gift{padding:clamp(40px,6vw,64px) 0;background:linear-gradient(170deg,#fbf6ec,#f2e7d0);border-top:1px solid var(--line)}
.jx-gift-in{display:flex;align-items:center;gap:22px;max-width:860px!important}
.jx-gift-ic{flex:none;width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:var(--paper);color:var(--gold-dark);box-shadow:var(--jx-ring)}
.jx-gift h2{font-size:clamp(1.4rem,3.2vw,1.9rem)}
.jx-gift p{color:var(--ink-soft);margin:8px 0 0;max-width:60ch}
@media (max-width:1060px){.jx-layout{grid-template-columns:minmax(0,1fr) 340px}.jx-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jx-grid .jx-tile:last-child:nth-child(odd){grid-column:span 2}}
@media (max-width:860px){
  .jx-layout{grid-template-columns:minmax(0,1fr)}
  .jx-panel{position:static}
  .jx-grid{gap:10px}
  .jx-bar:not([hidden]){display:flex}
  .jx-gift-in{flex-direction:column;text-align:center}
}
@media (max-width:480px){.jx-lab span{display:none}.jx-lab{padding:9px 10px 10px}.jx-lab b{font-size:.9rem;margin:0}.jx-trust{justify-content:flex-start;max-width:300px}}
@media (prefers-reduced-motion:reduce){.jx *{animation:none!important;transition:none!important}}
'''

DATA = json.dumps([{"nom": n, "pieces": p} for _, n, _, p in THEMES], ensure_ascii=False)
JS = r'''
(function(){
  var T=__DATA__, PRIX=__PRIX__, PP=__PP__;
  var eur=function(n){return n.toFixed(2).replace('.',',')+' €'};
  var st={i:-1,prenom:false,nom:'',font:'playfair',q:1};
  var $=function(id){return document.getElementById(id)};
  var tiles=[].slice.call(document.querySelectorAll('.jx-tile')), chips=[].slice.call(document.querySelectorAll('.jx-chip'));
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.toggle('on',x===c);x.setAttribute('aria-pressed',x===c)});
    var f=c.dataset.fam;tiles.forEach(function(t){t.hidden=!(f==='tous'||t.dataset.fam===f)});})});
  tiles.forEach(function(t){t.addEventListener('click',function(){
    st.i=+t.dataset.i;var m=T[st.i],src=t.querySelector('img').src;
    tiles.forEach(function(x){var on=x===t;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    var g=$('grand');g.hidden=false;g.src=src;g.alt='Puzzle en bois : '+m.nom;g.style.animation='none';void g.offsetWidth;g.style.animation='';
    $('vide').hidden=true;$('t-pan').textContent='Puzzle « '+m.nom+' »';
    $('pdesc').textContent=m.pieces.length+' pièces à encastrer, chacune avec son encoche :';
    $('pieces').innerHTML=m.pieces.map(function(p){return '<li>'+p+'</li>'}).join('');
    $('barimg').src=src;$('barnom').textContent=m.nom;
    if(window.innerWidth<=860){$('panneau').scrollIntoView({behavior:'smooth',block:'start'})}
    maj();})});
  $('prenomon').addEventListener('click',function(){st.prenom=!st.prenom;this.classList.toggle('on',st.prenom);this.setAttribute('aria-pressed',st.prenom);$('prenomzone').hidden=!st.prenom;if(st.prenom)$('prenom').focus();maj()});
  $('prenom').addEventListener('input',function(){st.nom=this.value.trim();$('prenomn').textContent=this.value.length+'/14';maj()});
  [].forEach.call(document.querySelectorAll('[data-font]'),function(b){b.addEventListener('click',function(){st.font=b.dataset.font;
    [].forEach.call(document.querySelectorAll('[data-font]'),function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});maj()})});
  $('moins').addEventListener('click',function(){st.q=Math.max(1,st.q-1);maj()});
  $('plus').addEventListener('click',function(){st.q=Math.min(9,st.q+1);maj()});
  $('ajout').addEventListener('click',function(){var b=this;b.textContent='Ajouté au panier ✓';setTimeout(function(){b.textContent='Ajouter au panier'},2200)});
  function maj(){
    var avec=st.prenom&&!!st.nom, unit=PRIX+(avec?PP:0), ok=st.i>=0&&(!st.prenom||avec);
    $('qte').textContent=st.q;$('total').textContent=st.i>=0?eur(unit*st.q):'—';
    var a=$('ajout');a.disabled=!ok;$('manque').hidden=ok;
    $('manque').textContent=st.i<0?'Choisissez d\'abord un thème dans la galerie.':'Écrivez le prénom, ou retirez l\'option prénom.';
    var pv=$('pv');pv.hidden=!(avec&&st.i>=0);pv.textContent=st.nom;pv.className='jx-pv fnt-'+st.font;
    var bar=$('barre');bar.hidden=st.i<0;if(st.i>=0)$('barprix').textContent=eur(unit);
  }
  if('IntersectionObserver' in window){new IntersectionObserver(function(e){$('barre').classList.toggle('off',e[0].isIntersecting)},{threshold:.15}).observe($('panneau'))}
  __LOGO__
  maj();
})();
'''.replace("__DATA__", DATA).replace("__PRIX__", str(PRIX)).replace("__PP__", str(PRIX_PRENOM)).replace("__LOGO__", LOGO_JS)

BANNER = '<div class="mq-banner">MAQUETTE — nouvelle catégorie « Jeux pour enfants » · <b>rien n\'est encore sur le site</b></div>'
TITLE = "<title>Jeux pour enfants — Niv Création (maquette)</title>"
STYLE = f"<style>{SHELL['css']}\n{CSS}</style>"
BODY = f'<div class="{SHELL["html_class"]}">' + BANNER + SHELL["header"] + MAIN + SHELL["footer"] + "</div>"
full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        f"{TITLE}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>")
frag = f'<meta charset="utf-8">{TITLE}{STYLE}{BODY}<script>{JS}</script>'
open(os.path.join(OUT, "jeux-enfants.html"), "w", encoding="utf-8").write(full)
open(os.path.join(OUT, "jeux-enfants.fragment.html"), "w", encoding="utf-8").write(frag)
print("ok", len(full) // 1024, "Ko")
