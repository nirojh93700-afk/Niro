#!/usr/bin/env python3
"""Maquette de la page « Créez le vôtre » (13/11/2026) — RIEN en ligne.

Le gérant : « pour mettre sur le site, cherche sur Internet comment on peut mettre » puis « fais-moi une maquette ».
Comme les grands sites de produits à créer soi-même (Nike By You, Zazzle, Popcarte, YourSurprise, Vistaprint) :
une page d'entrée unique, des modèles tout prêts dont on change le prénom, une seule entrée de plus dans le menu,
et un bloc sur l'accueil. Trois vues : la page, le bloc de l'accueil, le menu du téléphone.

  python3 tools/maquettes/creez-le-votre.py <page de base> <dossier des images> <sortie>

<page de base> = la sortie d'un autre créateur (habillage du site : en-tête, menu, pied de page).
<images>       = la sortie de creez-le-votre-images.cjs, allégée en WebP (un fichier par outil ou modèle).
"""
import base64, os, re, sys

base, dimg, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

s = open(base, encoding="utf-8").read()
i_main, j_main = s.find("<main"), s.find("</main>")
tete, pied = s[:i_main], s[j_main + 7:]
pied = pied[:pied.find("<script")]
tete = re.sub(r"<title>.*?</title>", "<title>Créez le vôtre</title>", tete, count=1, flags=re.S)
tete = re.sub(r'(<div class="sc-bandeau">).*?(</div>)',
              r"\1<b>Maquette</b> · la page « Créez le vôtre », son entrée dans le menu et le bloc de l'accueil. Rien n'est en ligne.\2", tete, count=1, flags=re.S)
# la seule chose ajoutée à l'en-tête : une entrée de menu, juste après « Boutique »
ENTREE = '<a class="clv-menu" href="#" data-vue="page">✦ Créez le vôtre</a>'
assert '<a href="#">Boutique</a>' in tete
tete = tete.replace('<a href="#">Boutique</a>', '<a href="#">Boutique</a>' + ENTREE, 1)


def img(nom):
    return "data:image/webp;base64," + base64.b64encode(open(os.path.join(dimg, nom + ".webp"), "rb").read()).decode()


A = "https://claude.ai/artifact/"
# [id, nom, phrase, prix, image, lien de la maquette, étiquette]
OUTILS = [
    ["fleur", "Fleur à prénom", "Une fleur en bois, le prénom découpé sur la tige.", "19,90 €", "fleur-3", A + "VX8XHyYdfhCnJzhj7WdnN6", "Nouveau"],
    ["arbre", "Arbre de vie", "Les prénoms de la famille dans les cœurs de l'arbre.", "dès 24,90 €", "arbre", A + "9h1rXBNMnNEYgkaFH1NTFa", ""],
    ["empile", "Suspension à prénoms", "Une forme par prénom, reliées en une suspension.", "dès 12,90 €", "empile-1", A + "PpnA3aSf9gMaxuoSr5onFp", ""],
    ["deco", "Décoration à suspendre", "46 formes, un prénom découpé ou une photo gravée.", "dès 9,90 €", "deco-2", A + "6Gs8LNkzpdvWMRDNZpE775", "Noël"],
    ["prenom", "Décoration à prénom", "Une grande initiale, le prénom gravé dedans.", "dès 12,90 €", "prenom-2", A + "XY51xPNECRwf4Eemtt9jga", "Noël"],
    ["support", "Support de téléphone", "Votre photo, un dessin ou un prénom gravé.", "dès 12,90 €", "support", A + "ARNf7BxbQxsTvkpJxgQKD7", ""],
]
# [nom du modèle, outil, ce qu'on change, prix, image, lien]
MODELES = [
    ["La rose", "Fleur à prénom", "Changez le prénom", "19,90 €", "fleur-1", OUTILS[0][5]],
    ["Notre famille", "Arbre de vie", "Changez les prénoms", "30,90 €", "arbre", OUTILS[1][5]],
    ["Flocons de neige", "Décoration à suspendre", "Changez le prénom", "19,90 €", "deco-1", OUTILS[3][5]],
    ["Les cœurs", "Suspension à prénoms", "Changez les prénoms", "15,90 €", "empile-1", OUTILS[2][5]],
    ["Pour Maman", "Fleur à prénom", "Changez le prénom", "20,90 €", "fleur-2", OUTILS[0][5]],
    ["Notre premier Noël", "Décoration à suspendre", "Changez les prénoms", "21,90 €", "deco-4", OUTILS[3][5]],
    ["Le renne", "Décoration à prénom", "Changez le prénom", "dès 12,90 €", "prenom-1", OUTILS[4][5]],
    ["Les étoiles", "Suspension à prénoms", "Changez les prénoms", "12,90 €", "empile-2", OUTILS[2][5]],
]

CSS = r"""
.clv-menu{color:#a5822f!important;font-weight:700!important;border:1px dashed #c9a24b;border-radius:999px;padding:4px 12px}
.clv-vues{position:sticky;top:0;z-index:80;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:8px 12px;background:#2b2620}
.clv-vues button{font:inherit;font-weight:600;font-size:.8rem;min-height:38px;padding:0 14px;border-radius:999px;border:1px solid #6b6259;background:transparent;color:#f3ece0;cursor:pointer}
.clv-vues button.on{background:#e2c67e;color:#1a1206;border-color:#e2c67e}
.clv{padding-bottom:56px}
.clv-fil{font-size:.82rem;color:var(--ink-soft);padding:12px 0 0}
.clv-hero{text-align:center;padding:26px 0 8px}
.clv-hero h1{font-family:var(--font-display),'Playfair Display',serif;font-size:clamp(2rem,5vw,3rem);line-height:1.1;margin:0 0 10px;text-wrap:balance}
.clv-hero h1 em{font-style:italic;color:#a5822f}
.clv-hero p{max-width:60ch;margin:0 auto;color:var(--ink-soft);font-size:1.02rem;line-height:1.55}
.clv-pas{display:flex;justify-content:center;gap:10px 26px;flex-wrap:wrap;margin:18px 0 0;padding:0;list-style:none;font-size:.9rem;font-weight:600}
.clv-pas li{display:flex;align-items:center;gap:8px}
.clv-pas i{font-style:normal;width:26px;height:26px;border-radius:50%;background:#f3e8d3;color:#7c6120;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}
.clv h2{font-family:var(--font-display),'Playfair Display',serif;font-size:clamp(1.4rem,3.4vw,1.9rem);margin:38px 0 4px;text-wrap:balance}
.clv .sous{color:var(--ink-soft);margin:0 0 16px;font-size:.95rem;line-height:1.5}
.clv-rail{display:grid;grid-auto-flow:column;grid-auto-columns:calc(25% - 12px);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 14px;scrollbar-width:thin}
.clv-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.clv-carte{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(60,40,20,.07);color:var(--ink);text-decoration:none;scroll-snap-align:start;min-width:0;position:relative}
.clv-carte:hover{box-shadow:0 10px 28px rgba(60,40,20,.14)}
.clv-vis{display:block;position:relative;aspect-ratio:1/1;overflow:hidden;background:linear-gradient(180deg,#f4efe6 0%,#efe8dc 60%,#e6d9c3 60.2%,#eadfcb 100%)}
.clv-vis img{position:absolute;left:14px;top:14px;width:calc(100% - 28px);height:calc(100% - 28px);max-width:none;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(60,40,20,.22))}
.clv-vis.photo img{left:0;top:0;width:100%;height:100%;object-fit:cover;filter:none}
.clv-txt{padding:12px 14px 14px;display:flex;flex-direction:column;gap:3px;flex:1}
.clv-txt small{font-size:.72rem;color:var(--ink-soft);font-weight:600;letter-spacing:.03em;text-transform:uppercase}
.clv-txt b{font-size:1rem;line-height:1.25}
.clv-txt span{font-size:.84rem;color:var(--ink-soft);line-height:1.4}
.clv-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:10px}
.clv-prix{font-weight:700;color:#7c6120;font-variant-numeric:tabular-nums;white-space:nowrap}
.clv-bouton{display:inline-flex;align-items:center;min-height:38px;padding:0 14px;border-radius:999px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;font-weight:700;font-size:.82rem;white-space:nowrap}
.clv-lien{font-size:.8rem;font-weight:700;color:#a5822f;white-space:nowrap}
.clv-etq{position:absolute;z-index:2;left:10px;top:10px;font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:4px 9px;background:#1a1206;color:#fff}
.clv-etq.noel{background:#a8322d}
.clv-rassure{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:34px}
.clv-rassure div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px}
.clv-rassure b{display:block;margin-bottom:4px}
.clv-rassure span{font-size:.88rem;color:var(--ink-soft);line-height:1.45}
.clv-valider{margin-top:34px;background:#fffaf0;border:1px solid #e7d3a1;border-radius:16px;padding:16px 18px;font-size:.9rem;line-height:1.5}
.clv-valider ul{margin:8px 0 0;padding-left:20px}
.clv-valider li{margin:4px 0}
/* le bloc de l'accueil */
.clv-acc{background:#f3e8d3;border-radius:24px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:22px;align-items:center;padding:28px;margin:10px 0}
.clv-acc h2{margin:0 0 8px}
.clv-acc p{margin:0 0 16px;color:var(--ink-soft);line-height:1.55}
.clv-acc .trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.clv-acc .trio a{display:block;position:relative;aspect-ratio:3/4;overflow:hidden;background:#fffaf2;border-radius:16px;border:1px solid #e7d3a1}
.clv-acc .trio img{position:absolute;left:10px;top:10px;width:calc(100% - 20px);height:calc(100% - 20px);max-width:none;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(60,40,20,.2))}
.clv-nouveau{border:2px dashed #c9a24b;border-radius:28px;padding:10px;position:relative;margin:26px 0}
.clv-nouveau>span{position:absolute;top:-12px;left:22px;background:#c9a24b;color:#1a1206;font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border-radius:999px;padding:3px 10px}
.clv-voisin{border:1px solid var(--line);border-radius:16px;background:repeating-linear-gradient(135deg,#f6f1e8,#f6f1e8 10px,#f1eadf 10px,#f1eadf 20px);padding:22px;text-align:center;color:var(--ink-soft);font-size:.9rem}
.clv-voisin b{display:block;color:var(--ink);font-family:var(--font-display),'Playfair Display',serif;font-size:1.15rem;margin-bottom:2px}
.clv-tel{max-width:390px;margin:18px auto 0;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:var(--cream,#faf6ee);box-shadow:0 8px 24px rgba(60,40,20,.1)}
.clv-tel .barre{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);font-weight:700}
.clv-tel a{display:block;padding:13px 20px;border-bottom:1px solid #efe6d6;color:var(--ink-soft);font-weight:500;font-size:.95rem;text-decoration:none}
.clv-tel a.clv-menu{margin:10px 16px;border-bottom:1px dashed #c9a24b;text-align:center}
[data-clv]{display:none}
[data-clv].on{display:block}
@media (max-width:860px){
 .clv-rail{grid-auto-columns:46%;gap:12px}
 .clv-grille{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
 .clv-rassure{grid-template-columns:1fr}
 .clv-acc{grid-template-columns:1fr;padding:20px}
 .clv-txt{padding:10px 10px 12px}
 .clv-bas{flex-direction:column;align-items:flex-start;gap:6px}
 .clv-bouton{min-height:40px}
}
"""


def carte_outil(o):
    etq = '<span class="clv-etq%s">%s</span>' % (" noel" if o[6] == "Noël" else "", o[6]) if o[6] else ""
    return ('<a class="clv-carte" href="%s" target="_blank" rel="noopener">%s<span class="clv-vis%s"><img src="%s" alt="%s" loading="lazy"></span>'
            '<span class="clv-txt"><b>%s</b><span>%s</span><span class="clv-bas"><span class="clv-prix">%s</span><span class="clv-bouton">Créer le mien</span></span></span></a>'
            % (o[5], etq, " photo" if o[0] == "support" else "", img(o[4]), o[1], o[1], o[2], o[3]))


def carte_modele(m):
    return ('<a class="clv-carte" href="%s" target="_blank" rel="noopener"><span class="clv-vis"><img src="%s" alt="%s" loading="lazy"></span>'
            '<span class="clv-txt"><small>%s</small><b>%s</b><span class="clv-bas"><span class="clv-prix">%s</span><span class="clv-lien">%s ›</span></span></span></a>'
            % (m[5], img(m[4]), m[0], m[1], m[0], m[3], m[2]))


MENU_TEL = "".join('<a href="#">%s</a>' % t for t in ["Bijoux", "Verres &amp; Carafes &amp; Gobelets", "Bébé &amp; Enfant", "Mariage", "Maison &amp; Déco", "…"])

MAIN = ("""<div class="clv-vues" role="group" aria-label="Ce que montre la maquette">
 <button type="button" class="on" data-vue="page">La page « Créez le vôtre »</button>
 <button type="button" data-vue="accueil">Le bloc sur l'accueil</button>
 <button type="button" data-vue="menu">Le menu sur téléphone</button>
</div>
<main class="clv">
<div class="container">

<div data-clv="page" class="on">
 <nav class="clv-fil" aria-label="Fil d'Ariane">Accueil <span style="margin:0 6px">›</span> Créez le vôtre</nav>
 <header class="clv-hero">
  <h1>Créez <em>le vôtre</em></h1>
  <p>Choisissez un objet, écrivez vos prénoms : votre création se dessine sous vos yeux. Nous la découpons et la gravons ensuite dans notre atelier.</p>
  <ol class="clv-pas"><li><i>1</i>Choisissez un modèle</li><li><i>2</i>Changez les prénoms</li><li><i>3</i>Nous le fabriquons</li></ol>
 </header>

 <h2>Nos modèles prêts à personnaliser</h2>
 <p class="sous">Le plus simple : prenez un modèle tout fait et changez seulement le prénom. Tout le reste peut encore être modifié.</p>
 <div class="clv-rail" id="rail">""" + "".join(carte_modele(m) for m in MODELES) + """</div>

 <h2>Ou partez de zéro</h2>
 <p class="sous">Six objets à créer vous-même, du début à la fin.</p>
 <div class="clv-grille">""" + "".join(carte_outil(o) for o in OUTILS) + """</div>

 <div class="clv-rassure">
  <div><b>Vous voyez avant de commander</b><span>L'aperçu change à chaque lettre tapée : ce que vous voyez est ce que nous fabriquons.</span></div>
  <div><b>Gravé et découpé dans notre atelier</b><span>Chaque pièce est faite à la commande, en France, à partir de votre création.</span></div>
  <div><b>Rien à installer</b><span>Tout se fait sur cette page, sur téléphone comme sur ordinateur.</span></div>
 </div>
</div>

<div data-clv="accueil">
 <h2>Où irait le bloc sur l'accueil</h2>
 <p class="sous">Proposé : après les verres, carafes et gobelets, juste avant « Les dernières sorties de l'atelier ». Le reste de l'accueil ne change pas.</p>
 <div class="clv-voisin"><b>Verres, carafes &amp; gobelets gravés</b>bloc actuel de l'accueil, inchangé</div>
 <div class="clv-nouveau"><span>Nouveau · bloc ajouté</span>
  <div class="clv-acc">
   <div><h2>Créez votre cadeau vous-même</h2>
    <p>Une fleur à son prénom, l'arbre de la famille, une suspension pour la chambre : écrivez les prénoms, votre création se dessine en direct.</p>
    <a class="clv-bouton" href="#" data-vue="page" style="min-height:46px;padding:0 22px;font-size:.92rem">Créez le vôtre</a></div>
   <div class="trio"><a href="#" data-vue="page"><img src=\"""" + img("fleur-2") + """\" alt="Fleur à prénom"></a><a href="#" data-vue="page"><img src=\"""" + img("arbre") + """\" alt="Arbre de vie"></a><a href="#" data-vue="page"><img src=\"""" + img("empile-1") + """\" alt="Suspension à prénoms"></a></div>
  </div>
 </div>
 <div class="clv-voisin"><b>Les dernières sorties de l'atelier</b>bloc actuel de l'accueil, inchangé</div>
</div>

<div data-clv="menu">
 <h2>Le menu, sur téléphone</h2>
 <p class="sous">Une seule entrée en plus, en doré, tout en haut. Sur ordinateur, elle est dans la barre du menu, juste après « Boutique » (regardez en haut de cette page).</p>
 <div class="clv-tel"><div class="barre"><span>Menu</span><span aria-hidden="true">✕</span></div><a href="#">Boutique</a>""" + ENTREE + MENU_TEL + """</div>
</div>

<div class="clv-valider"><b>À valider avec vous avant de construire</b><ul>
 <li>Le nom de l'entrée : « Créez le vôtre ». Autres possibilités : « À créer vous-même », « L'atelier de création ».</li>
 <li>Sa place dans le menu (juste après « Boutique ») et celle du bloc sur l'accueil (avant « Les dernières sorties de l'atelier »).</li>
 <li>Les huit modèles prêts sont des exemples. Les prix affichés sont ceux des maquettes ; celui de la fleur est proposé par moi.</li>
 <li>Dans la maquette, toucher une carte ouvre la maquette de l'outil dans un nouvel onglet. Sur le site, un modèle prêt ouvrira l'outil déjà rempli.</li>
 <li>Chaque outil aurait aussi sa fiche dans son rayon (Maison &amp; Déco, Bébé &amp; Enfant, Noël), pour être trouvé par Google.</li>
 <li>Les deux décorations de Noël seraient reliées à l'interrupteur Noël : elles disparaissent d'ici quand vous l'éteignez.</li>
 <li>Je conseille de mettre en vente un outil à la fois, après vos essais de découpe.</li>
</ul></div>
</div>
</main>""")

JS = r"""
(function(){
 function vue(v){document.querySelectorAll('[data-clv]').forEach(function(e){e.classList.toggle('on',e.getAttribute('data-clv')===v)});
  document.querySelectorAll('.clv-vues button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-vue')===v)});window.scrollTo(0,0)}
 document.addEventListener('click',function(e){var a=e.target.closest('[data-vue]');if(a){e.preventDefault();vue(a.getAttribute('data-vue'));var n=document.querySelector('.nav');if(n)n.classList.remove('open');return}
  var m=e.target.closest('.menu-toggle');if(m){var nav=document.querySelector('.nav');if(nav)nav.classList.toggle('open');return}
  var l=e.target.closest('a[href="#"]');if(l)e.preventDefault()});
})();
"""

# la barre des vues se place juste sous le bandeau « Maquette », avant l'en-tête du site
i_h = tete.find("<header")
barre, reste = MAIN[:MAIN.find("<main")], MAIN[MAIN.find("<main"):]
page = tete[:i_h] + "<style>" + CSS + "</style>" + barre + tete[i_h:] + reste + pied + "<script>" + JS + "</script>\n"
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
print("index.html", round(len(page.encode("utf-8")) / 1024), "Ko")
