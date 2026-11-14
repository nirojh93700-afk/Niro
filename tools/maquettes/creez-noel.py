#!/usr/bin/env python3
"""Maquette « Créez votre déco de Noël » (14/11/2026) — RIEN en ligne.

Le gérant, après la vidéo 57 : « fais-moi la maquette comment on va mettre que les maquettes Noël, et pour le
téléphone tu le mets dans le téléphone ». Seulement les trois créateurs de Noël : décoration à suspendre,
décoration à prénom, maisonnette. Quatre vues : la page, la même page dans un téléphone (comme la vidéo 57),
le bloc sur l'accueil, le menu.

  python3 tools/maquettes/creez-noel.py <page de base> docs/maquettes/assets/creez-le-votre <sortie>

<page de base> = la sortie d'un autre créateur (habillage du site : en-tête, menu, pied de page).
Sortie : index.html (les quatre vues) + page.html (la page seule, chargée dans le téléphone). Publier les deux.
"""
import base64, os, re, sys

base, dimg, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Déco de Noël à créer</title>", tete, count=1, flags=re.S)
ENTREE = '<a class="cn-menu" href="#" data-vue="page">🎄 Créez votre déco de Noël</a>'
BEBE = '<a href="#">Bébé &amp; Enfant</a>'
assert BEBE in tete
tete = tete.replace(BEBE, BEBE + ENTREE, 1)  # gérant, 14/11 : « dans le menu, après Bébé & Enfant »
BANDEAU = r'(<div class="sc-bandeau">).*?(</div>)'


def img(nom):
    return "data:image/webp;base64," + base64.b64encode(open(os.path.join(dimg, nom + ".webp"), "rb").read()).decode()


A = "https://claude.ai/artifact/"
# [nom, phrase, prix, image, lien de la maquette]
OUTILS = [
    ["Décoration à suspendre", "Boule, sapin, étoile, cœur… le prénom découpé, vos dessins de Noël autour.", "dès 9,90 €", "deco-1", A + "RFk8koRobSLSjN9BkdHXxh"],
    ["Décoration à prénom", "Un renne ou un bonnet de Noël : sa première lettre devient la décoration.", "dès 12,90 €", "prenom-1", A + "XY51xPNECRwf4Eemtt9jga"],
    ["Maisonnette en bois", "Une petite maison ajourée, à suspendre au sapin ou à illuminer.", "dès 24,90 €", "maison", A + "BWVe3PyAdcb18PeKpZtxK4"],
]
# [nom du modèle, création, ce qu'on change, image, lien]
MODELES = [
    ["Flocons de neige", "Décoration à suspendre", "Changez le prénom", "deco-1", OUTILS[0][4]],
    ["Le renne", "Décoration à prénom", "Changez le prénom", "prenom-1", OUTILS[1][4]],
    ["Notre premier Noël", "Décoration à suspendre", "Changez les prénoms", "deco-4", OUTILS[0][4]],
    ["La maisonnette", "Maisonnette en bois", "Choisissez le dessin", "maison", OUTILS[2][4]],
    ["Le sapin", "Décoration à suspendre", "Changez le prénom", "deco-2", OUTILS[0][4]],
    ["Le bonnet de Noël", "Décoration à prénom", "Changez le prénom", "prenom-2", OUTILS[1][4]],
    ["Étoile d'hiver", "Décoration à suspendre", "Changez le prénom", "deco-3", OUTILS[0][4]],
    ["Pour Mamie", "Décoration à suspendre", "Changez le texte", "deco-5", OUTILS[0][4]],
]

CSS = r"""
.cn-menu{color:#a8322d!important;font-weight:700!important;border:1px dashed #c0392b;border-radius:999px;padding:4px 12px}
.cn-vues{position:sticky;top:0;z-index:80;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:8px 12px;background:#2b2620}
.cn-vues button{font:inherit;font-weight:600;font-size:.8rem;min-height:38px;padding:0 14px;border-radius:999px;border:1px solid #6b6259;background:transparent;color:#f3ece0;cursor:pointer}
.cn-vues button.on{background:#e2c67e;color:#1a1206;border-color:#e2c67e}
.cn{padding-bottom:56px}
.cn-fil{font-size:.82rem;color:var(--ink-soft);padding:12px 0 0}
.cn-hero{position:relative;overflow:hidden;margin:14px 0 0;border-radius:24px;padding:34px 22px 30px;text-align:center;color:#fbf3e3;
 background:radial-gradient(120% 90% at 50% 0%,#c0392b 0%,#8f2219 55%,#6d170f 100%)}
.cn-hero::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.55;
 background-image:radial-gradient(2px 2px at 12% 22%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 30% 70%,#fff 50%,transparent 51%),
 radial-gradient(2px 2px at 52% 18%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 70% 60%,#fff 50%,transparent 51%),
 radial-gradient(2px 2px at 88% 30%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 8% 84%,#fff 50%,transparent 51%),
 radial-gradient(1.5px 1.5px at 92% 82%,#fff 50%,transparent 51%),radial-gradient(2px 2px at 44% 90%,#fff 50%,transparent 51%)}
.cn-hero small{display:inline-block;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.72rem;color:#e2c67e;border:1px solid rgba(226,198,126,.6);border-radius:999px;padding:4px 12px}
.cn-hero h1{font-family:var(--font-display),'Playfair Display',serif;font-size:clamp(2rem,5vw,3rem);line-height:1.1;margin:14px 0 10px;text-wrap:balance;color:#fff}
.cn-hero h1 em{font-style:italic;color:#e2c67e}
.cn-hero p{max-width:58ch;margin:0 auto;color:#f6e7d0;font-size:1.02rem;line-height:1.55}
.cn-pas{display:flex;justify-content:center;gap:10px 26px;flex-wrap:wrap;margin:20px 0 0;padding:0;list-style:none;font-size:.9rem;font-weight:600}
.cn-pas li{display:flex;align-items:center;gap:8px}
.cn-pas i{font-style:normal;width:26px;height:26px;border-radius:50%;background:#e2c67e;color:#6d170f;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}
.cn h2{font-family:var(--font-display),'Playfair Display',serif;font-size:clamp(1.4rem,3.4vw,1.9rem);margin:38px 0 4px;text-wrap:balance}
.cn .sous{color:var(--ink-soft);margin:0 0 16px;font-size:.95rem;line-height:1.5}
.cn-rail{display:grid;grid-auto-flow:column;grid-auto-columns:calc(25% - 12px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 14px;scrollbar-width:thin}
.cn-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.cn-carte{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(60,40,20,.07);color:var(--ink);text-decoration:none;scroll-snap-align:start;min-width:0;position:relative}
.cn-carte:hover{box-shadow:0 10px 28px rgba(60,40,20,.14)}
.cn-vis{display:block;position:relative;aspect-ratio:1/1;overflow:hidden;background:linear-gradient(180deg,#f4efe6 0%,#efe8dc 60%,#e6d9c3 60.2%,#eadfcb 100%)}
.cn-vis img{position:absolute;left:14px;top:14px;width:calc(100% - 28px);height:calc(100% - 28px);max-width:none;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(60,40,20,.22))}
.cn-txt{padding:12px 14px 14px;display:flex;flex-direction:column;gap:3px;flex:1}
.cn-txt small{font-size:.72rem;color:var(--ink-soft);font-weight:600;letter-spacing:.03em;text-transform:uppercase}
.cn-txt b{font-size:1rem;line-height:1.25}
.cn-txt span{font-size:.84rem;color:var(--ink-soft);line-height:1.4}
.cn-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:10px}
.cn-prix{font-weight:700;color:#7c6120;font-variant-numeric:tabular-nums;white-space:nowrap}
.cn-bouton{display:inline-flex;align-items:center;min-height:38px;padding:0 14px;border-radius:999px;background:linear-gradient(135deg,#c0392b,#8f2219);color:#fff;font-weight:700;font-size:.82rem;white-space:nowrap;text-decoration:none}
.cn-lien{font-size:.8rem;font-weight:700;color:#a8322d;white-space:nowrap}
.cn-etq{position:absolute;z-index:2;left:10px;top:10px;font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 9px;background:#a8322d;color:#fff}
.cn-date{margin-top:30px;display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #ecd2c9;border-left:5px solid #c0392b;border-radius:14px;padding:14px 16px;font-size:.92rem;line-height:1.45}
.cn-date b{color:#a8322d}
.cn-rassure{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:24px}
.cn-rassure div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px}
.cn-rassure b{display:block;margin-bottom:4px}
.cn-rassure span{font-size:.88rem;color:var(--ink-soft);line-height:1.45}
.cn-valider{margin-top:34px;background:#fffaf0;border:1px solid #e7d3a1;border-radius:16px;padding:16px 18px;font-size:.9rem;line-height:1.5}
.cn-valider ul{margin:8px 0 0;padding-left:20px}
.cn-valider li{margin:4px 0}
/* le téléphone */
.cn-telzone{display:flex;justify-content:center;padding:6px 0 10px}
.cn-tel{position:relative;width:390px;height:780px;flex:none;border:14px solid #16120e;border-radius:52px;background:#16120e;box-shadow:0 26px 60px rgba(60,40,20,.28);transform-origin:top center}
.cn-tel iframe{display:block;width:100%;height:100%;border:0;border-radius:38px;background:#fbf7ee}
.cn-tel::before{content:"";position:absolute;z-index:3;top:8px;left:50%;width:110px;height:26px;margin-left:-55px;border-radius:14px;background:#16120e}
.cn-telnote{text-align:center;color:var(--ink-soft);font-size:.88rem;margin:0 0 12px}
/* le bloc de l'accueil */
.cn-acc{border-radius:24px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:22px;align-items:center;padding:28px;color:#fbf3e3;
 background:radial-gradient(120% 90% at 30% 0%,#c0392b 0%,#8f2219 60%,#6d170f 100%)}
.cn-acc h2{margin:0 0 8px;color:#fff}
.cn-acc p{margin:0 0 16px;color:#f6e7d0;line-height:1.55}
.cn-acc .cn-bouton{background:#e2c67e;color:#1a1206;min-height:46px;padding:0 22px;font-size:.92rem}
.cn-acc .trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cn-acc .trio a{display:block;position:relative;aspect-ratio:3/4;overflow:hidden;background:#fffaf2;border-radius:16px;border:2px solid #e2c67e}
.cn-acc .trio img{position:absolute;left:10px;top:10px;width:calc(100% - 20px);height:calc(100% - 20px);max-width:none;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(60,40,20,.2))}
.cn-nouveau{border:2px dashed #c9a24b;border-radius:28px;padding:10px;position:relative;margin:26px 0}
.cn-nouveau>span{position:absolute;z-index:2;top:-12px;left:22px;background:#c9a24b;color:#1a1206;font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border-radius:999px;padding:3px 10px}
.cn-voisin{border:1px solid var(--line);border-radius:16px;background:repeating-linear-gradient(135deg,#f6f1e8,#f6f1e8 10px,#f1eadf 10px,#f1eadf 20px);padding:22px;text-align:center;color:var(--ink-soft);font-size:.9rem}
.cn-voisin b{display:block;color:var(--ink);font-family:var(--font-display),'Playfair Display',serif;font-size:1.15rem;margin-bottom:2px}
.cn-menutel{max-width:390px;margin:18px auto 0;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:var(--cream,#faf6ee);box-shadow:0 8px 24px rgba(60,40,20,.1)}
.cn-menutel .barre{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);font-weight:700}
.cn-menutel a{display:block;padding:13px 20px;border-bottom:1px solid #efe6d6;color:var(--ink-soft);font-weight:500;font-size:.95rem;text-decoration:none}
.cn-menutel a.cn-menu{margin:10px 16px;border-bottom:1px dashed #c0392b;text-align:center}
[data-cn]{display:none}
[data-cn].on{display:block}
@media (max-width:860px){
 .cn-rail{grid-auto-columns:46%;gap:12px}
 .cn-grille{grid-template-columns:1fr;gap:12px}
 .cn-grille .cn-carte{flex-direction:row}
 .cn-grille .cn-vis{width:38%;flex:none;aspect-ratio:auto;min-height:150px}
 .cn-rassure{grid-template-columns:1fr}
 .cn-acc{grid-template-columns:1fr;padding:20px}
 .cn-txt{padding:10px 10px 12px}
 .cn-bas{flex-direction:column;align-items:flex-start;gap:6px}
 .cn-bouton{min-height:40px}
}
"""


def carte_outil(o):
    return ('<a class="cn-carte" href="%s" target="_blank" rel="noopener"><span class="cn-etq">Noël</span><span class="cn-vis"><img src="%s" alt="%s" loading="lazy"></span>'
            '<span class="cn-txt"><b>%s</b><span>%s</span><span class="cn-bas"><span class="cn-prix">%s</span><span class="cn-bouton">Créer la mienne</span></span></span></a>'
            % (o[4], img(o[3]), o[0], o[0], o[1], o[2]))


def carte_modele(m):
    return ('<a class="cn-carte" href="%s" target="_blank" rel="noopener"><span class="cn-vis"><img src="%s" alt="%s" loading="lazy"></span>'
            '<span class="cn-txt"><small>%s</small><b>%s</b><span class="cn-bas"><span class="cn-lien">%s ›</span></span></span></a>'
            % (m[4], img(m[3]), m[0], m[1], m[0], m[2]))


PAGE = ("""<nav class="cn-fil" aria-label="Fil d'Ariane">Accueil <span style="margin:0 6px">›</span> Noël <span style="margin:0 6px">›</span> Créez votre déco de Noël</nav>
 <header class="cn-hero">
  <small>Noël 2026</small>
  <h1>Votre déco de Noël, <em>créée par vous</em></h1>
  <p>Choisissez une décoration, écrivez le prénom, ajoutez vos dessins de Noël : elle se dessine sous vos yeux. Nous la découpons, la gravons et l'assemblons dans notre atelier.</p>
  <ol class="cn-pas"><li><i>1</i>Choisissez votre décoration</li><li><i>2</i>Écrivez le prénom</li><li><i>3</i>Nous la fabriquons</li></ol>
 </header>

 <h2>Trois décorations à créer</h2>
 <p class="sous">À suspendre au sapin, à offrir ou à glisser sur un paquet.</p>
 <div class="cn-grille">""" + "".join(carte_outil(o) for o in OUTILS) + """</div>

 <h2>Ou partez d'un modèle prêt</h2>
 <p class="sous">Le plus simple : prenez un modèle tout fait et changez seulement le prénom.</p>
 <div class="cn-rail">""" + "".join(carte_modele(m) for m in MODELES) + """</div>

 <div class="cn-date"><span aria-hidden="true">🎄</span><span>Pour la recevoir avant Noël, commandez au plus tard le <b>[date à donner]</b>.</span></div>
 <div class="cn-rassure">
  <div><b>Vous voyez avant de commander</b><span>L'aperçu change à chaque lettre tapée, et vous pouvez la regarder en 3D.</span></div>
  <div><b>Gravée et découpée dans notre atelier</b><span>Chaque décoration est faite à la commande, en France, puis assemblée.</span></div>
  <div><b>Prête à suspendre</b><span>Elle arrive avec son fil, prête à accrocher au sapin.</span></div>
 </div>""")

MENU_TEL = "".join('<a href="#">%s</a>' % t for t in ["Bijoux", "Verres &amp; Carafes &amp; Gobelets", "Bébé &amp; Enfant"]) + ENTREE + "".join('<a href="#">%s</a>' % t for t in ["Mariage", "Maison &amp; Déco", "…"])

VALIDER = """<div class="cn-valider"><b>À valider avec vous avant de construire</b><ul>
 <li>Seulement les trois créations de Noël : la lettre, la fleur, l'arbre et la suspension ne sont pas sur cette page.</li>
 <li>Le nom : « Créez votre déco de Noël ». Sa place : une entrée rouge dans le menu juste après « Bébé &amp; Enfant », et un bloc sur l'accueil après les verres et le bloc « Ce Noël, offrez un cadeau unique ».</li>
 <li>Tout est relié à l'interrupteur Noël de Gestion → Fêtes : quand vous éteignez Noël, l'entrée du menu, le bloc de l'accueil et la page disparaissent.</li>
 <li>Prix : la maisonnette dès 24,90 € (donné par vous) ; la décoration à suspendre (dès 9,90 €) et la décoration à prénom (dès 12,90 €) sont mes propositions.</li>
 <li>La date limite pour recevoir avant Noël est à donner par vous.</li>
 <li>Dans la maquette, toucher une carte ouvre la maquette de la création dans un nouvel onglet. Sur le site, un modèle prêt ouvrira la création déjà remplie.</li>
</ul></div>"""

VUES = """<div class="cn-vues" role="group" aria-label="Ce que montre la maquette">
 <button type="button" class="on" data-vue="page">La page</button>
 <button type="button" data-vue="tel">Dans le téléphone</button>
 <button type="button" data-vue="accueil">Sur l'accueil</button>
 <button type="button" data-vue="menu">Le menu</button>
</div>"""

INDEX_MAIN = (VUES + """<main class="cn"><div class="container">
<div data-cn="page" class="on">""" + PAGE + VALIDER + """</div>
<div data-cn="tel">
 <h2>La même page, sur téléphone</h2>
 <p class="sous">C'est la vraie page, chargée dans un téléphone : faites-la défiler avec le doigt.</p>
 <div class="cn-telzone"><div class="cn-tel" id="tel"><iframe src="page.html" title="La page sur téléphone" loading="lazy"></iframe></div></div>
</div>
<div data-cn="accueil">
 <h2>Où irait le bloc sur l'accueil</h2>
 <p class="sous">Après les verres et le bloc rouge « Ce Noël, offrez un cadeau unique ». Le reste de l'accueil ne change pas. Il disparaît quand vous éteignez Noël. La vraie page d'accueil avec ce bloc est dans une maquette à part.</p>
 <div class="cn-voisin"><b>Verres, carafes &amp; gobelets gravés</b>bloc actuel de l'accueil, inchangé</div>
 <div class="cn-voisin" style="margin-top:10px"><b>Ce Noël, offrez un cadeau unique</b>bloc actuel de l'accueil, inchangé</div>
 <div class="cn-nouveau"><span>Nouveau · bloc ajouté</span>
  <div class="cn-acc">
   <div><h2>Créez votre déco de Noël</h2>
    <p>Une décoration au prénom de chacun, un renne, une petite maison ajourée : écrivez le prénom, elle se dessine en direct.</p>
    <a class="cn-bouton" href="#" data-vue="page">Créer la mienne</a></div>
   <div class="trio"><a href="#" data-vue="page"><img src=\"""" + img("deco-1") + """\" alt="Décoration à suspendre"></a><a href="#" data-vue="page"><img src=\"""" + img("prenom-1") + """\" alt="Décoration à prénom"></a><a href="#" data-vue="page"><img src=\"""" + img("maison") + """\" alt="Maisonnette en bois"></a></div>
  </div>
 </div>
 <div class="cn-voisin"><b>Les dernières sorties de l'atelier</b>bloc actuel de l'accueil, inchangé</div>
</div>
<div data-cn="menu">
 <h2>Le menu, sur téléphone</h2>
 <p class="sous">Une seule entrée en plus, en rouge de Noël, juste après « Bébé &amp; Enfant ». Sur ordinateur, elle est à la même place dans la barre du menu (regardez en haut de cette page).</p>
 <div class="cn-menutel"><div class="barre"><span>Menu</span><span aria-hidden="true">✕</span></div><a href="#">Boutique</a>""" + MENU_TEL + """</div>
</div>
</div></main>""")

PAGE_MAIN = '<main class="cn"><div class="container">' + PAGE + "</div></main>"

JS_INDEX = r"""
(function(){
 function ajuste(){var t=document.getElementById('tel');if(!t)return;var dispo=Math.min(window.innerWidth-32,418);var k=Math.min(1,dispo/418);
  t.style.transform='scale('+k+')';t.parentElement.style.height=(808*k+16)+'px'}
 function vue(v){document.querySelectorAll('[data-cn]').forEach(function(e){e.classList.toggle('on',e.getAttribute('data-cn')===v)});
  document.querySelectorAll('.cn-vues button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-vue')===v)});window.scrollTo(0,0);ajuste()}
 window.addEventListener('resize',ajuste);ajuste();
 document.addEventListener('click',function(e){var a=e.target.closest('[data-vue]');if(a){e.preventDefault();vue(a.getAttribute('data-vue'));var n=document.querySelector('.nav');if(n)n.classList.remove('open');return}
  var m=e.target.closest('.menu-toggle');if(m){var nav=document.querySelector('.nav');if(nav)nav.classList.toggle('open');return}
  var l=e.target.closest('a[href="#"]');if(l)e.preventDefault()});
})();
"""
JS_PAGE = r"""
(function(){document.addEventListener('click',function(e){var m=e.target.closest('.menu-toggle');if(m){var nav=document.querySelector('.nav');if(nav)nav.classList.toggle('open');return}
 var l=e.target.closest('a[href="#"]');if(l)e.preventDefault()})})();
"""


def ecrire(nom, bandeau, main, js, vues=""):
    t = re.sub(BANDEAU, r"\1" + bandeau + r"\2", tete, count=1, flags=re.S)
    i_h = t.find("<header")
    page = t[:i_h] + "<style>" + CSS + "</style>" + vues + t[i_h:] + main + pied + "<script>" + js + "</script>\n"
    if nom != "index.html":  # page chargée dans le téléphone : document complet, pas d'habillage ajouté à la publication
        page = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + page + "</html>"
    open(os.path.join(out, nom), "w", encoding="utf-8").write(page)
    print(nom, round(len(page.encode("utf-8")) / 1024), "Ko")


ecrire("index.html", "<b>Maquette</b> · « Créez votre déco de Noël » : la page, le téléphone, l'accueil et le menu. Rien n'est en ligne.",
       INDEX_MAIN[INDEX_MAIN.find("<main"):], JS_INDEX, vues=VUES)
ecrire("page.html", "<b>Maquette</b> · rien n'est en ligne.", PAGE_MAIN, JS_PAGE)
