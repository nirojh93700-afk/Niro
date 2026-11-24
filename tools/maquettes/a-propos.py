"""Maquette « À propos » enrichie (24/11/2026, gérant : « fais la maquette, pas mon nom, mets en France »).

python3 tools/maquettes/a-propos.py <capture /a-propos servie par next start> <sortie.html>
En-tête et pied de page = ceux du vrai site (coquille_site). Seul le contenu de <main> est neuf.
Aucun nom de personne, lieu = « en France ». Photos = celles du site.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coquille_site import coquille, uri, PUB

cap, out = sys.argv[1], sys.argv[2]
c = coquille(cap)
P = lambda p, w=620: uri(os.path.join(PUB, p), w)

UNIVERS = [
    ("Bijoux gravés", "Colliers et bracelets en acier inoxydable, gravés d'un prénom, d'une date ou d'un mot.", "produits/collier-coeur-grave-1.jpg"),
    ("Cristal photo 3D", "Votre photo gravée en relief à l'intérieur d'un bloc de cristal, avec ou sans socle lumineux.", "produits/cristal-h-couple.jpg"),
    ("Verres, carafe & gobelets", "Verres à vin, flûtes, verres à whisky et carafe gravés de vos prénoms, d'un logo ou d'un dessin.", "produits/verre_whisky_papa_monde_banniere.jpg"),
    ("Mariage", "Numéros de table, menus et décoration en bois, dessinés et découpés dans notre atelier.", "produits/numero_table_arche_geometrique_relief_bois.jpeg"),
    ("Bébé & Enfant", "Couverts, puzzles en bois, plaque de porte et veilleuse au prénom de l'enfant.", "produits/couverts_enfants_ex_prenom.jpg"),
    ("Papeterie & petits cadeaux", "Marque-pages, carnets, porte-clés et petites attentions à graver.", "marque-pages/m1/ambiance.jpg"),
]
ETAPES = [
    ("Vous personnalisez", "Sur la fiche, vous écrivez votre texte, choisissez l'écriture, un motif ou votre photo. L'aperçu se met à jour en direct."),
    ("Nous gravons", "Chaque pièce est gravée à la commande, une par une, dans notre atelier en France, en 3 à 5 jours ouvrés."),
    ("Nous emballons", "Pochette, sac ou boîte cadeau selon votre choix : votre pièce part prête à offrir."),
    ("Vous recevez", "Envoi suivi en France et en Europe, en lettre suivie, en point relais ou à domicile."),
]
MATIERES = [
    ("Acier inoxydable", "pour les bijoux : il se porte au quotidien et garde sa gravure nette."),
    ("Cristal optique", "pour les blocs photo 3D : la gravure apparaît en relief, à l'intérieur."),
    ("Verre", "pour les verres et la carafe : la gravure ressort en blanc givré."),
    ("Bois", "contreplaqué et bois clairs pour la décoration, les jeux et la papeterie, dessinés et découpés sur place."),
]
FAQ = [
    ("Où sont fabriqués vos produits ?", "Chaque pièce est gravée et personnalisée à la commande dans notre atelier, en France. Nos créations en bois y sont aussi dessinées et découpées."),
    ("Pouvez-vous graver une image qui m'est personnelle ?", "Oui. Sur les verres, la carafe, le cristal et les autres créations gravées, nous gravons votre photo, votre logo ou votre dessin. Depuis chaque fiche, le bouton « Faire une demande particulière » permet de nous décrire votre idée."),
    ("Combien de temps faut-il pour recevoir ma commande ?", "La gravure demande 3 à 5 jours ouvrés, puis votre colis part en envoi suivi. Le mode de livraison et son prix s'affichent avant le paiement."),
    ("Livrez-vous hors de France ?", "Oui, nous livrons en Europe. Choisissez votre pays dans le panier : le prix de la livraison s'affiche avant le paiement."),
    ("Faites-vous des commandes en quantité, pour un mariage ou une entreprise ?", "Oui : numéros de table, verres gravés au logo, cadeaux d'invités. Écrivez-nous depuis la page Contact, nous vous envoyons un devis."),
]

css = """
.ap2{--ap-gold:#c9a24b;--ap-goldt:#7c6120;--ap-ink:#1a1206;--ap-soft:#5d5142;--ap-sand:#f3e8d3;--ap-line:#e7dcc6;background:#fbf7ee;color:var(--ap-ink)}
.ap2 .w{max-width:1120px;margin:0 auto;padding:0 20px}
.ap2 section{padding:56px 0}
.ap2 .ey{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ap-goldt);font-weight:600;margin:0 0 10px}
.ap2 h1,.ap2 h2{font-family:var(--font-display),Georgia,serif;font-weight:600;line-height:1.15;margin:0 0 14px;text-wrap:balance}
.ap2 h1{font-size:clamp(32px,5vw,52px)} .ap2 h2{font-size:clamp(26px,3.4vw,36px)}
.ap2 h1 em,.ap2 h2 em{color:var(--ap-goldt)}
.ap2 p{line-height:1.65;margin:0 0 14px} .ap2 .lead{font-size:18px;color:var(--ap-soft);max-width:62ch}
.ap2 .hero{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}
.ap2 .mos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ap2 .mos img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px;display:block}
.ap2 .mos img:first-child{grid-row:span 2;aspect-ratio:auto;height:100%}
.ap2 .faits{display:flex;flex-wrap:wrap;gap:8px 18px;margin:18px 0 22px;padding:0;list-style:none;font-size:14px;color:var(--ap-soft)}
.ap2 .faits li::before{content:"✦ ";color:var(--ap-gold)}
.ap2 .btn2{display:inline-block;background:linear-gradient(135deg,#d8b45e,#a98935);color:#1a1206;font-weight:600;padding:13px 22px;border-radius:999px;text-decoration:none}
.ap2 .sand{background:var(--ap-sand)}
.ap2 .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.ap2 .uni{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 14px rgba(26,18,6,.06)}
.ap2 .uni img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
.ap2 .uni div{padding:14px 16px 16px} .ap2 .uni h3{font-size:17px;margin:0 0 6px} .ap2 .uni p{font-size:14px;color:var(--ap-soft);margin:0}
.ap2 .uni span{display:inline-block;margin-top:10px;color:var(--ap-goldt);font-size:14px;font-weight:600}
.ap2 .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:s;margin-top:22px}
.ap2 .step{border-top:2px solid var(--ap-gold);padding-top:14px}
.ap2 .step b{display:block;font-family:var(--font-display),Georgia,serif;font-size:19px;margin-bottom:6px}
.ap2 .step b::before{counter-increment:s;content:counter(s) ". ";color:var(--ap-goldt)}
.ap2 .step p{font-size:15px;color:var(--ap-soft)}
.ap2 .two{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
.ap2 .mat{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px}
.ap2 .mat li{background:#fff;border:1px solid var(--ap-line);border-radius:14px;padding:12px 16px;font-size:15px}
.ap2 .ph{border:2px dashed var(--ap-gold);border-radius:18px;background:#fff;padding:22px;text-align:center;color:var(--ap-goldt);font-size:14px}
.ap2 .ph .row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.ap2 .ph .row div{aspect-ratio:1;border-radius:12px;background:var(--ap-sand);display:flex;align-items:center;justify-content:center;padding:8px;font-size:13px}
.ap2 .conf{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px}
.ap2 .conf div{background:#fff;border-radius:16px;padding:16px;font-size:14px;color:var(--ap-soft)}
.ap2 .conf b{display:block;color:var(--ap-ink);font-size:16px;margin-bottom:4px}
.ap2 .faq{max-width:780px;display:flex;flex-direction:column;gap:10px;margin-top:20px}
.ap2 details{background:#fff;border:1px solid var(--ap-line);border-radius:14px;padding:0 18px}
.ap2 summary{cursor:pointer;list-style:none;padding:16px 28px 16px 0;font-weight:600;position:relative}
.ap2 summary::-webkit-details-marker{display:none}
.ap2 summary::after{content:"+";position:absolute;right:0;top:12px;font-size:22px;color:var(--ap-goldt)}
.ap2 details[open] summary::after{content:"–"} .ap2 details p{margin:0 0 16px}
.ap2 .ident{font-size:14px;color:var(--ap-soft);border-top:1px solid var(--ap-line);padding-top:18px;margin-top:28px}
.ap2 .ident a{color:var(--ap-goldt)}
.ap2 .new{outline:2px dashed #c9a24b;outline-offset:6px;border-radius:6px;position:relative}
.ap2 .tag{position:absolute;top:-14px;right:8px;background:#c9a24b;color:#1a1206;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;letter-spacing:.04em}
.maqbar{background:#fff3d6;color:#6b4e10;padding:12px 20px;font-size:14px;text-align:center}
@media (max-width:900px){.ap2 .hero,.ap2 .two{grid-template-columns:1fr}.ap2 .grid3{grid-template-columns:1fr 1fr}.ap2 .steps,.ap2 .conf{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.ap2 .grid3,.ap2 .steps,.ap2 .conf{grid-template-columns:1fr}.ap2 section{padding:40px 0}}
"""

def tag(t="Nouveau"):
    return f'<span class="tag">{t}</span>'

uni = "".join(f'<a class="uni" href="#" style="text-decoration:none;color:inherit"><img src="{P(img)}" alt="{n}"><div><h3>{n}</h3><p>{d}</p><span>Voir les créations →</span></div></a>' for n, d, img in UNIVERS)
steps = "".join(f'<div class="step"><b>{t}</b><p>{d}</p></div>' for t, d in ETAPES)
mats = "".join(f'<li><b>{t}</b> : {d}</li>' for t, d in MATIERES)
faq = "".join(f'<details{" open" if i == 0 else ""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(FAQ))

main = f"""<main class="ap2">
<div class="maqbar"><b>Maquette — rien n'est en ligne.</b> Les blocs entourés en pointillé doré sont nouveaux. Aucun nom de personne ; l'atelier est dit « en France ».</div>
<section><div class="w hero">
 <div>
  <p class="ey">Notre atelier</p>
  <h1>L'art de graver <em>vos émotions</em></h1>
  <p class="lead">Niv Création est un atelier français de gravure et de découpe laser. Nous gravons à la commande des bijoux, des cristaux photo 3D, des verres et des cadeaux, et nous dessinons puis découpons nos créations en bois, pour célébrer les moments qui comptent.</p>
  <ul class="faits new">{tag()}<li>Gravé à la commande en France</li><li>Aperçu en direct sur chaque fiche</li><li>Livraison suivie en France et en Europe</li></ul>
  <a class="btn2" href="#">Découvrir nos créations</a>
 </div>
 <div class="mos"><img src="{P('produits/cristal-h-famille.jpg', 700)}" alt=""><img src="{P('produits/carafe_gravee.jpg')}" alt=""><img src="{P('produits/collier-coeur-grave-1.jpg')}" alt=""></div>
</div></section>

<section class="sand"><div class="w new">{tag()}
 <p class="ey">Ce que nous gravons</p>
 <h2>Six familles de <em>créations</em></h2>
 <p class="lead">Chaque famille a sa page, avec les prix et l'aperçu de la gravure.</p>
 <div class="grid3">{uni}</div>
</div></section>

<section><div class="w new">{tag()}
 <p class="ey">Comment ça se passe</p>
 <h2>De votre idée <em>à votre colis</em></h2>
 <div class="steps">{steps}</div>
</div></section>

<section class="sand"><div class="w two">
 <div class="new">{tag()}
  <p class="ey">Nos matières</p>
  <h2>Des matières choisies <em>pour durer</em></h2>
  <ul class="mat">{mats}</ul>
 </div>
 <div class="new">{tag("Photos à fournir")}
  <p class="ey">Dans l'atelier</p>
  <h2>Là où vos pièces <em>prennent vie</em></h2>
  <div class="ph">Vos vraies photos de l'atelier rassurent plus que tout le reste.<div class="row"><div>La machine qui grave</div><div>Une pièce en cours</div><div>L'emballage d'un colis</div></div></div>
 </div>
</div></section>

<section><div class="w new">{tag()}
 <p class="ey">Commandez en confiance</p>
 <h2>Ce qui est <em>garanti</em></h2>
 <div class="conf">
  <div><b>Avis clients</b>La vraie note du site, lue en direct, avec le lien vers tous les avis.</div>
  <div><b>Paiement sécurisé</b>Carte bancaire et PayPal ; paiement en plusieurs fois selon disponibilité.</div>
  <div><b>Livraison suivie</b>Offerte dès 45 € d'achat de bijoux ; le prix s'affiche avant le paiement.</div>
  <div><b>Retours</b>14 jours pour les articles non personnalisés ; une pièce gravée à votre nom n'est pas reprise, sauf défaut (garantie légale de 2 ans).</div>
 </div>
</div></section>

<section class="sand"><div class="w new">{tag()}
 <p class="ey">Questions fréquentes</p>
 <h2>Vos questions sur <em>l'atelier</em></h2>
 <div class="faq">{faq}</div>
 <p class="ident">Niv Création · entreprise française · SIRET 105 914 774 00010 · <a href="#">contact.nivcreation@gmail.com</a> · <a href="#">Mentions légales</a> · <a href="#">Conditions de vente</a></p>
 <div style="margin-top:26px"><a class="btn2" href="#">Une question ? Contactez-nous</a></div>
</div></section>
</main>"""

html = f"""<title>À propos enrichi</title>
<style>{c['css']}{css}</style>
<div class="{c['html_class']}">{c['header']}{main}{c['footer']}</div>"""
open(out, "w", encoding="utf-8").write(html)
print(out, len(html) // 1024, "Ko")
