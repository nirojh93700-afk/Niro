#!/usr/bin/env python3
"""Maquette « accueil moderne » (03/10/2026) — même thème (or / crème / encre), rendu plus
moderne et fluide. Génère docs/maquettes/accueil-moderne.html (document complet) et
accueil-moderne.fragment.html (version pour artifact, sans <html>/<head>/<body>).
Rien n'est touché dans le site : c'est une maquette, en attente du « applique »."""
import base64, io, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROD = os.path.join(ROOT, "public", "produits")
OUT = os.path.join(ROOT, "docs", "maquettes")

IMGS = {  # clé CSS -> (fichier, largeur max)
 "hero": ("cristal-v-femme.jpg", 1000),
 "cocktail": ("verre_a_cocktail_exemple_couleur.jpg", 640),
 "perles": ("bracelet-perles-pastille-1.jpg", 640),
 "coeur": ("collier-coeur-grave-1.jpg", 640),
 "pastille": ("collier-pastille-1.jpg", 640),
 "carafe": ("carafe_gravee.jpg", 1100),
 "whisky": ("verre_a_whisky_exemple_face.jpg", 900),
 "whisky2": ("verre_a_whisky_card.jpg", 640),
 "vin": ("verre_vin_exemple_dale.jpg", 640),
 "flute": ("flute_ambiance.jpg", 640),
 "carafe2": ("carafe_whiskey_1892.jpg", 640),
 "noel1": ("cristal-h-famille.jpg", 700),
 "noel2": ("collier-coeur-plaques-1.jpg", 700),
 "noel3": ("verre_a_whisky_exemple_face.jpg", 700),
 "c-bijoux": ("collier-3coeurs-3.jpg", 900),
 "c-mariage": ("numero_table_arche_geometrique_relief_bois.jpeg", 800),
 "c-cadeaux": ("cle_usb_en_bois_4gb_avec_boite_en_bois.jpg", 640),
 "c-verres": ("verre_a_whisky_card.jpg", 640),
 "c-deco": ("arbre-vie-rond-1.jpg", 900),
 "at1": ("cristal-v-couple.jpg", 700),
 "at2": ("verre_vin_exemple_dale.jpg", 640),
 "b1": ("collier-3coeurs-3.jpg", 560), "b2": ("collier-coeur-plaques-1.jpg", 560),
 "b3": ("collier-coeur-grave-2.jpg", 560), "b4": ("collier-double-coeur-6.jpg", 560),
 "b5": ("bracelet-femme-acier-grave.jpg", 560), "b6": ("bracelet-cordon-plaque-4.jpg", 560),
 "bhero": ("collier-coeur-plaques-2.jpg", 900),
 "w00": ("cristal-v-femme.jpg", 400),
 "w01": ("collier-3coeurs-3.jpg", 400),
 "w02": ("carafe_gravee.jpg", 400),
 "w03": ("bracelet-cordon-plaque-4.jpg", 400),
 "w04": ("arbre-vie-rond-1.jpg", 400),
 "w05": ("collier-coeur-plaques-1.jpg", 400),
 "w06": ("verre_vin_exemple_dale.jpg", 400),
 "w07": ("plaque-naissance-coeur-1.jpg", 400),
 "w10": ("bracelet-femme-acier-grave.jpg", 400),
 "w11": ("cristal-h-amis.jpg", 400),
 "w12": ("collier-coeur-grave-2.jpg", 400),
 "w13": ("bougeoir-lotus-1.jpg", 400),
 "w14": ("verre_a_whisky_exemple_face.jpg", 400),
 "w15": ("collier-double-coeur-6.jpg", 400),
 "w16": ("cle_usb_en_bois_4gb_avec_boite_en_bois.jpg", 400),
 "w17": ("porte-serviettes-1.jpg", 400),
 "w20": ("collier_plaque_a_graver_acier_noir.jpg", 400),
 "w21": ("flute_ambiance.jpg", 400),
 "w22": ("veilleuse-prenom-1.jpg", 400),
 "w23": ("bracelet-perles-pastille-1.jpg", 400),
 "w24": ("cristal-v-enfant-chien.jpg", 400),
 "w25": ("piece_laiton.jpg", 400),
 "w26": ("couverts_enfants_ex_prenom.jpg", 400),
 "w27": ("collier-pastille-1.jpg", 400),
}

WALL = [[('cristal-v-femme.jpg', 'Cristal Photo 3D — Vertical', 'dès 39,90 €'), ('collier-3coeurs-3.jpg', 'Collier 3 Cœurs entrelacés à graver', '30,51 €'), ('carafe_gravee.jpg', 'Carafe à whisky gravée', '54,90 €'), ('bracelet-cordon-plaque-4.jpg', 'Bracelet cordon à plaque gravée', '17,91 €'), ('arbre-vie-rond-1.jpg', 'Veilleuse Arbre de Vie Ronde', '29,90 €'), ('collier-coeur-plaques-1.jpg', 'Collier Cœur & 2 plaques à graver', 'dès 29,61 €'), ('verre_vin_exemple_dale.jpg', 'Verre à vin gravé', 'dès 15,90 €'), ('plaque-naissance-coeur-1.jpg', 'Plaque de naissance cœur', '11,90 €')], [('bracelet-femme-acier-grave.jpg', 'Bracelet Femme Acier', '22,41 €'), ('cristal-h-amis.jpg', 'Cristal Photo 3D — Horizontal', 'dès 39,90 €'), ('collier-coeur-grave-2.jpg', 'Collier Cœur à graver recto-verso', '30,51 €'), ('bougeoir-lotus-1.jpg', 'Bougeoir Fleur de Lotus', '16,90 €'), ('verre_a_whisky_exemple_face.jpg', 'Verre à whisky portrait personnalisé', 'dès 19,90 €'), ('collier-double-coeur-6.jpg', 'Collier Double Cœur à graver', 'dès 29,61 €'), ('cle_usb_en_bois_4gb_avec_boite_en_bois.jpg', 'Clé USB Bois — Coffret', '24,90 €'), ('porte-serviettes-1.jpg', 'Porte-serviettes en bois — fleur', '11,90 €')], [('collier_plaque_a_graver_acier_noir.jpg', 'Collier Plaque Acier', '26,91 €'), ('flute_ambiance.jpg', 'Flûte à champagne gravée', 'dès 17,90 €'), ('veilleuse-prenom-1.jpg', 'Veilleuse Arbre de Vie au prénom', '34,90 €'), ('bracelet-perles-pastille-1.jpg', 'Bracelet perles à pastille gravée', '30,51 €'), ('cristal-v-enfant-chien.jpg', 'Cristal Photo 3D — Vertical', 'dès 39,90 €'), ('piece_laiton.jpg', 'Pièce ronde laiton à graver', '14,90 €'), ('couverts_enfants_ex_prenom.jpg', 'Couverts enfants personnalisés', '34,90 €'), ('collier-pastille-1.jpg', 'Collier Pastille à graver recto-verso', '27,81 €')]]

def data_uri(fn, w):
    im = Image.open(os.path.join(PROD, fn)).convert("RGB")
    if im.width > w:
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=70, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

LOGO_SOURCE = "https://cdn.shopify.com/s/files/1/0675/7738/0907/files/IMG_6758.jpg?v=1780592111"  # le logo du site (Header.jsx)
def logo_uri():
    # Le fichier ORIGINAL du logo, en pleine qualité, s'il est posé dans docs/maquettes/assets/ ;
    # sinon l'adresse source du site (jamais une capture d'écran).
    for n in ("logo-source.png", "logo-source.jpg", "logo-source.jpeg", "logo-source.webp"):
        f = os.path.join(OUT, "assets", n)
        if os.path.exists(f):
            mime = "image/png" if n.endswith("png") else "image/webp" if n.endswith("webp") else "image/jpeg"
            return f"data:{mime};base64," + base64.b64encode(open(f, "rb").read()).decode()
    return LOGO_SOURCE
LOGO = logo_uri()

IMG_CSS = "\n".join(f".i-{k}{{background-image:url({data_uri(f, w)})}}" for k, (f, w) in IMGS.items())

def ph(k, label, cls=""):
    return f'<div class="ph i-{k} {cls}" role="img" aria-label="{label}"></div>'

ICON = {
 "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 "heart": '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.7 1.1 4.8 2.9 1.1-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
 "bag": '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 "pin": '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
 "gem": '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 6 3-6M12 9v12"/>',
 "left": '<path d="m15 6-6 6 6 6"/>', "right": '<path d="m9 6 6 6-6 6"/>',
}
def ic(n, cls="ic"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICON[n]}</svg>'
STAR = '<svg viewBox="0 0 24 24" class="star" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="currentColor"/></svg>'

def tile(k, name, price, badge=""):
    b = f'<span class="badge">{badge}</span>' if badge else ""
    return f'''<a class="pt" href="#" aria-label="{name}">
      <div class="pt-img">{ph(k, name)}{b}<button class="fav" type="button" aria-label="Garder pour plus tard">{ic("heart")}</button><span class="pt-cta">Personnaliser {ic("arrow")}</span></div>
      <div class="pt-meta"><span class="pt-name">{name}</span><span class="pt-price">{price}</span></div></a>'''

def wall_rows():
    out = []
    for r, row in enumerate(WALL):
        tiles = "".join(f'<a class="wt" href="#">{ph(f"w{r}{i}", n, "wt-img")}<span class="wt-l"><span>{n}</span><b>{pr}</b></span></a>' for i, (f, n, pr) in enumerate(row))
        out.append(f'<div class="mq mq-{r}"><div class="mq-track">{tiles}<span class="mq-copy" aria-hidden="true">{tiles}</span></div></div>')
    return "\n".join(out)

def mq(keys):
    return "".join(ph(k, "Création gravée", "mq-i") for k in keys)

WALLROWS = wall_rows()
BODY = f'''
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top" id="top">
  <nav class="top-l" aria-label="Principal"><a href="#">Boutique</a><a href="#" class="strong">Bijoux</a><a href="#">Verres &amp; Carafes</a><a href="#">Mariage</a></nav>
  <button type="button" class="burger" aria-label="Menu"><span></span><span></span><span></span></button>
  <a class="logo-card" href="#" aria-label="Niv Création — accueil"><img src="{LOGO}" alt="Niv Création — Atelier de personnalisation" ></a>
  <div class="top-r"><nav class="top-links" aria-label="Rubriques"><a href="#">Cristal 3D</a><a href="#" class="hot">Noël</a><a href="#">Offrir</a></nav>
    <div class="tools"><button type="button" aria-label="Rechercher" class="hide-s">{ic("search")}</button><button type="button" aria-label="Mon compte">{ic("user")}</button><button type="button" aria-label="Panier" class="bag">{ic("bag")}<span class="bag-n">2</span></button></div></div>
</header>
<div class="nav" id="nav" aria-hidden="true">
  <a class="nav-logo" href="#" tabindex="-1"><img src="{LOGO}" alt="" ></a>
  <nav class="nav-links"><a href="#" tabindex="-1">Boutique</a><a href="#" tabindex="-1">Bijoux</a><a href="#" tabindex="-1">Verres &amp; Carafes</a><a href="#" tabindex="-1">Mariage</a><a href="#" tabindex="-1">Cristal 3D</a><a href="#" class="hot" tabindex="-1">Noël</a></nav>
  <div class="nav-tools"><button type="button" tabindex="-1" aria-label="Rechercher">{ic("search")}</button><button type="button" tabindex="-1" aria-label="Panier" class="bag">{ic("bag")}<span class="bag-n">2</span></button></div>
</div>

<main id="contenu">
<section class="hero" id="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="hero-copy">
    <h1>Votre photo,<br>sculptée dans le <em>cristal</em>.</h1>
    <span class="laser-line" aria-hidden="true"></span>
    <p class="lead">Gravure photo 3D au cœur d’un cristal K9, réalisée dans notre atelier. Un cadeau qui capte la lumière — et l’émotion.</p>
    <div class="cta-row">
      <a class="btn btn-gold" href="#">Créer mon cristal {ic("arrow")}</a>
      <a class="btn btn-ghost" href="#">Voir les tailles &amp; prix</a>
    </div>
  </div>
  <div class="hero-visual" id="heroVisual">
    <div class="arch-ring" aria-hidden="true"></div>
    <div class="arch" id="arch">{ph("hero", "Cristal photo 3D : portrait de femme gravé dans un bloc de cristal")}<span class="scan" id="scan" aria-hidden="true"></span></div>
    <a class="chip chip-a" href="#">{ic("pin")} Gravé en France</a>
    <a class="chip chip-b" href="#">Cristal Photo 3D <b>dès 39,90 €</b></a>
  </div>
  <ul class="hero-trust" aria-label="Nos engagements">
    <li>Gravé en France</li><li>Cristal K9 premium</li><li>Livraison rapide &amp; suivie</li><li>4,8/5 · 286 avis</li>
  </ul>
</section>


<section class="sec bijoux" aria-labelledby="t-bij">
  <div class="bij-copy">
    <h2 id="t-bij">Des bijoux gravés <em>au prénom de votre choix</em></h2>
    <p>Colliers et bracelets en acier, gravés à la commande dans notre atelier : un prénom, une date, un mot qui compte.</p>
    <div class="bij-cats"><a href="#">Femme</a><a href="#">Homme</a><a href="#">Couple</a><a href="#">Bébé</a></div>
    <a class="btn btn-ink" href="#">Voir tous les bijoux {ic("arrow")}</a>
    <p class="bij-note">Livraison offerte dès 45 € sur les bijoux.</p>
  </div>
  <div class="bij-grid">
    {tile("b1","Collier 3 Cœurs entrelacés à graver","30,51 €")}
    {tile("b2","Collier Cœur &amp; 2 plaques à graver","dès 29,61 €")}
    {tile("b3","Collier Cœur à graver recto-verso","30,51 €")}
    {tile("b4","Collier Double Cœur à graver","dès 29,61 €")}
    {tile("b5","Bracelet Femme Acier","22,41 €")}
    {tile("b6","Bracelet cordon à plaque gravée","17,91 €")}
  </div>
</section>

<section class="sec sec-rail sec-sand" id="nouveautes" aria-labelledby="t-new">
  <div class="sec-head">
    <div><h2 id="t-new">Les dernières sorties de l’atelier</h2><p class="sub">Nos créations ajoutées ces derniers jours.</p></div>
    <div class="rail-ctrl"><a class="link" href="#">Voir toutes les nouveautés {ic("arrow")}</a>
      <button type="button" class="rbtn" data-rail="rail1" data-dir="-1" aria-label="Précédent">{ic("left")}</button>
      <button type="button" class="rbtn" data-rail="rail1" data-dir="1" aria-label="Suivant">{ic("right")}</button></div>
  </div>
  <div class="rail" id="rail1" tabindex="0" aria-label="Nouveautés">
    {tile("cocktail","Verre à cocktail personnalisé","dès 17,90 €","Nouveau")}
    {tile("perles","Bracelet perles à pastille gravée","30,51 €")}
    {tile("coeur","Collier Cœur à graver recto-verso","30,51 €")}
    {tile("pastille","Collier Pastille à graver recto-verso","27,81 €")}
    <a class="pt pt-more" href="#"><span>Voir toute<br>la boutique</span>{ic("arrow")}</a>
  </div>
</section>

<section class="limited" aria-labelledby="t-lim">
  <div class="limited-card">
    <div class="limited-img" id="limImg">{ph("carafe","Carafe à whisky gravée avec son bouchon à facettes")}</div>
    <div class="limited-copy">
      <span class="pill"><i></i> Édition limitée</span>
      <h2 id="t-lim">La carafe à whisky <em>gravée</em>, un cadeau d’exception</h2>
      <p>Verre taillé, bouchon à facettes, gravée à votre prénom ou au modèle de votre choix. Livraison offerte dès 60 € d’achat.</p>
      <a class="btn btn-gold" href="#">Découvrir la carafe {ic("arrow")}</a>
    </div>
  </div>
</section>

<section class="sec sec-sand" aria-labelledby="t-verres">
  <div class="sec-head">
    <div><h2 id="t-verres">Verres &amp; carafes gravés</h2><p class="sub">Whisky, vin, champagne, carafe — gravés à la commande dans notre atelier.</p></div>
    <a class="link" href="#">Voir tous les verres &amp; carafes {ic("arrow")}</a>
  </div>
  <div class="bento-v">
    <a class="bt bt-big" href="#">{ph("whisky","Verre à whisky portrait personnalisé")}<div class="bt-lab"><span class="bt-name">Verre à whisky portrait personnalisé</span><span class="bt-price">dès 19,90 €</span></div></a>
    <a class="bt" href="#">{ph("whisky2","Verre à whisky à personnaliser")}<div class="bt-lab"><span class="bt-name">Verre à whisky à personnaliser</span><span class="bt-price">19,90 €</span></div></a>
    <a class="bt" href="#">{ph("vin","Verre à vin gravé")}<div class="bt-lab"><span class="bt-name">Verre à vin gravé</span><span class="bt-price">dès 15,90 €</span></div></a>
    <a class="bt" href="#">{ph("flute","Flûte à champagne gravée")}<div class="bt-lab"><span class="bt-name">Flûte à champagne gravée</span><span class="bt-price">dès 17,90 €</span></div></a>
    <a class="bt" href="#">{ph("carafe2","Carafe à whisky gravée")}<div class="bt-lab"><span class="bt-name">Carafe à whisky gravée</span><span class="bt-price">54,90 €</span></div></a>
  </div>
</section>

<section class="noel" aria-labelledby="t-noel">
  <div class="noel-copy">
    <h2 id="t-noel">Ce Noël, offrez un <em>cadeau unique</em></h2>
    <p>Cristal photo, verres, bijoux gravés — chaque pièce est gravée à la commande dans notre atelier. Une pièce qui n’existe qu’une fois.</p>
    <a class="btn btn-gold" href="#">Voir les idées de Noël {ic("arrow")}</a>
    <p class="noel-note">Chaque pièce est gravée une par une — pensez-y tôt.</p>
  </div>
  <div class="fan" aria-hidden="true">
    {ph("noel1","", "fan-1")}{ph("noel2","", "fan-2")}{ph("noel3","", "fan-3")}
  </div>
</section>

<section class="sec" aria-labelledby="t-coll">
  <div class="sec-head"><div><h2 id="t-coll">Explorez nos collections</h2><p class="sub">Nos familles de créations, une même exigence : la personnalisation soignée.</p></div></div>
  <div class="bento-c">
    <a class="ct ct-bijoux" href="#">{ph("c-bijoux","Bijoux")}<div class="ct-lab"><h3>Bijoux</h3><p>Colliers &amp; bracelets gravés</p></div><span class="ct-go">{ic("arrow")}</span></a>
    <a class="ct ct-mar" href="#">{ph("c-mariage","Mariage et réception")}<div class="ct-lab"><h3>Mariage &amp; Réception</h3><p>Numéros de table, menus, ronds de serviette</p></div><span class="ct-go">{ic("arrow")}</span></a>
    <a class="ct ct-cad" href="#">{ph("c-cadeaux","Cadeaux et accessoires")}<div class="ct-lab"><h3>Cadeaux &amp; Accessoires</h3><p>Clés USB, porte-clés, médaillons</p></div><span class="ct-go">{ic("arrow")}</span></a>
    <a class="ct ct-ver" href="#">{ph("c-verres","Verres et carafes")}<div class="ct-lab"><h3>Verres &amp; Carafes</h3><p>Whisky, vin, champagne &amp; carafe gravés</p></div><span class="ct-go">{ic("arrow")}</span></a>
    <a class="ct ct-dec" href="#">{ph("c-deco","Déco et maison")}<div class="ct-lab"><h3>Déco &amp; Maison</h3><p>Lampes, cristal 3D, couverts</p></div><span class="ct-go">{ic("arrow")}</span></a>
  </div>
</section>

<section class="atelier" id="atelier" aria-labelledby="t-at">
  <h2 id="t-at" class="visually-hidden">Le savoir-faire de la gravure laser</h2>
  <p class="statement" id="statement">Chaque pièce est dessinée puis gravée au laser dans notre atelier. Prénoms, dates, messages, photos : vos idées deviennent des objets chargés de sens.</p>
  <div class="at-row">
    <div class="at-pics" aria-hidden="true">{ph("at1","", "at-1")}{ph("at2","", "at-2")}</div>
    <div class="at-copy">
      <p>Bois noble, acier inoxydable, cristal : nous choisissons des matériaux durables pour des créations qui traversent le temps.</p>
      <a class="btn btn-gold" href="#">Commander une création {ic("arrow")}</a>
    </div>
  </div>
</section>

<section class="wall" id="wall" aria-labelledby="t-wall">
  <div class="wall-head"><h2 id="t-wall">Toutes nos créations, d’un seul regard</h2>
  <p>Le mur défile tout seul — touchez une pièce pour l’arrêter et voir son nom et son prix ; sans clic, il repart au bout de quelques secondes.</p></div>
  {WALLROWS}
  <div class="wall-foot"><a class="btn btn-gold" href="#">Parcourir toute la boutique {ic("arrow")}</a></div>
</section>

<section class="proof" aria-label="Avis clients">
  <div class="stars" aria-hidden="true">{STAR*5}</div>
  <p><b>4,8/5</b> · 286 avis clients <a class="link" href="#">Lire les avis {ic("arrow")}</a></p>
</section>

<section class="custom" aria-labelledby="t-cus">
  <div class="custom-in">
    <h2 id="t-cus">Une idée précise ? Créons-la <em>ensemble</em></h2>
    <p>Gravure et découpe laser de précision, sur mesure.</p>
    <a class="btn btn-gold" href="#">Demander un projet sur mesure {ic("arrow")}</a>
  </div>
</section>
</main>

<footer class="foot">
  <div class="foot-top"><img class="foot-logo" src="{LOGO}" alt="Niv Création — Atelier de personnalisation">
    <p>Atelier français · gravure laser · Paiement sécurisé par carte via Stripe</p></div>
  <p class="foot-pay">Payez en plusieurs fois sans frais — 4× avec PayPal (dès 30 €) ou 3× avec Klarna (dès 50 €).</p>
</footer>
<button type="button" class="ask">{ic("chat")} Une question ?</button>
'''

CSS = r'''
:root{--ink:#1a1206;--ink2:#241a0c;--ink3:#3a2c14;--cream:#fbf7ee;--sand:#f3e8d3;--gold:#c9a24b;--gold-d:#a98935;--gold-l:#e2c67e;--gold-t:#745a14;--red:#7a1512;--red2:#a8281d;
--line:rgba(26,18,6,.13);--muted:#6a5a40;--on-ink:rgba(251,247,238,.74);--ease:cubic-bezier(.22,1,.36,1);
--serif:"Playfair Display",Georgia,"Times New Roman",serif;--sans:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--cream);color:var(--ink);font:400 16px/1.6 var(--sans);overflow-x:hidden;-webkit-font-smoothing:antialiased}
::selection{background:var(--gold);color:var(--ink)}
:focus-visible{outline:2px solid var(--gold-d);outline-offset:3px;border-radius:6px}
.hero :focus-visible,.limited :focus-visible,.atelier :focus-visible,.custom :focus-visible,.foot :focus-visible,.nav :focus-visible,.noel :focus-visible{outline-color:var(--gold-l)}
*{scrollbar-width:thin;scrollbar-color:var(--gold) transparent}
::-webkit-scrollbar{height:8px;width:10px}::-webkit-scrollbar-thumb{background:var(--gold);border-radius:8px}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0}
h1,h2,h3{font-family:var(--serif);font-weight:600;letter-spacing:-.015em;text-wrap:balance;margin:0}
em{font-style:italic;color:var(--gold-t)}
.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:-999px;top:8px;background:var(--gold);color:var(--ink);padding:10px 14px;border-radius:8px;z-index:100}.skip:focus{left:8px}
.ic{width:20px;height:20px;flex:none}
.ph{background-size:cover;background-position:center;background-color:var(--sand)}

/* ── En-tête avec le logo (carte or & crème) ── */
.top{position:relative;z-index:30;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;padding:14px clamp(20px,5vw,72px);background:var(--cream);border-bottom:1px solid var(--line)}
.top-l,.top-links{display:flex;gap:2px;flex-wrap:wrap}
.top-l a,.top-links a{padding:9px 12px;border-radius:999px;font-size:.88rem;font-weight:500;color:var(--ink);transition:background .25s}
.top-l a:hover,.top-links a:hover{background:var(--sand)}
.top-l a.strong{font-weight:700}.top-links a.hot{color:var(--red)}
.top-r{display:flex;align-items:center;justify-content:flex-end;gap:10px}
.tools{display:flex;gap:2px}.tools button{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;transition:background .25s}.tools button:hover{background:var(--sand)}
.logo-card{display:block;line-height:0;border-radius:14px;box-shadow:0 10px 24px -14px rgba(26,18,6,.45);transition:transform .4s var(--ease)}
.logo-card:hover{transform:translateY(-2px)}
.logo-card img{display:block;height:clamp(70px,8vw,96px);width:auto;max-width:44vw;border-radius:14px;object-fit:contain;background:#efe9da}
.burger{display:none;width:42px;height:42px;place-items:center;align-content:center;gap:5px;border-radius:50%}
.burger span{display:block;width:20px;height:1.6px;background:var(--ink);border-radius:2px}
.nav-logo img{display:block;height:34px;width:auto;border-radius:6px;background:#efe9da}

/* ── En-tête flottant (apparaît au défilement) ── */
.nav{position:fixed;z-index:50;top:14px;left:50%;translate:-50% -140%;opacity:0;pointer-events:none;width:min(1180px,calc(100% - 32px));display:flex;align-items:center;gap:20px;padding:10px 14px 10px 22px;border-radius:999px;background:rgba(26,18,6,.82);backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);color:var(--cream);box-shadow:0 10px 30px -12px rgba(26,18,6,.55),0 0 0 1px rgba(226,198,126,.18);transition:translate .5s var(--ease),opacity .4s}
.nav.show{translate:-50% 0;opacity:1;pointer-events:auto}
.logo{display:inline-flex;align-items:center;gap:9px;font:600 1.18rem/1 var(--serif);letter-spacing:.01em;white-space:nowrap}
.logo-mark{color:var(--gold);font-size:.95rem}
.nav-links{display:flex;gap:4px;margin-inline:auto}
.nav-links a{padding:8px 13px;border-radius:999px;font-size:.86rem;font-weight:500;color:var(--on-ink);transition:background .25s,color .25s}
.nav-links a:hover{background:rgba(251,247,238,.1);color:var(--cream)}
.nav-links a.hot{color:var(--gold-l)}
.nav-tools{display:flex;align-items:center;gap:2px}
.nav-tools button{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;transition:background .25s}
.nav-tools button:hover{background:rgba(251,247,238,.12)}
.bag{position:relative}.bag-n{position:absolute;top:3px;right:2px;min-width:17px;height:17px;border-radius:9px;background:var(--gold);color:var(--ink);font:700 .66rem/17px var(--sans);text-align:center;padding-inline:4px}

/* ── Boutons ── */
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font:600 .95rem/1 var(--sans);transition:transform .35s var(--ease),box-shadow .35s var(--ease),background .25s;white-space:nowrap}
.btn .ic{transition:transform .35s var(--ease)}.btn:hover .ic{transform:translateX(4px)}
.btn-gold{background:linear-gradient(180deg,var(--gold-l),var(--gold) 55%,var(--gold-d));color:var(--ink);box-shadow:0 10px 22px -12px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.45)}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 16px 28px -12px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.5)}
.btn-ghost{color:var(--cream);box-shadow:inset 0 0 0 1px rgba(251,247,238,.34)}.btn-ghost:hover{background:rgba(251,247,238,.1)}
.btn-ink{background:var(--ink);color:var(--cream)}.btn-ink:hover{transform:translateY(-2px);background:var(--ink2)}
.link{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.92rem;color:var(--gold-t);border-bottom:1px solid rgba(134,105,28,.35);padding-bottom:2px;transition:border-color .25s,gap .3s}
.link .ic{width:16px;height:16px}.link:hover{border-color:var(--gold-t);gap:12px}

/* ── Hero ── */
.hero{position:relative;background:radial-gradient(120% 90% at 78% 10%,#3a2a10 0,var(--ink2) 38%,var(--ink) 100%);color:var(--cream);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);align-items:center;gap:clamp(24px,5vw,80px);padding:clamp(48px,7vh,80px) clamp(20px,6vw,96px) 76px;min-height:min(calc(100svh - 124px),760px);overflow:hidden}
.hero-glow{position:absolute;inset:auto -10% -30% 30%;height:70%;background:radial-gradient(closest-side,rgba(201,162,75,.22),transparent);pointer-events:none}
.hero-copy{position:relative;z-index:2;padding-bottom:8px}
.hero h1{font-size:clamp(2.7rem,6.6vw,5.6rem);line-height:1.02;letter-spacing:-.025em;color:var(--cream)}
.hero h1 em{color:var(--gold-l)}
.laser-line{display:block;height:2px;width:min(240px,50%);margin:26px 0 24px;background:linear-gradient(90deg,var(--gold-l),var(--gold),transparent);transform-origin:left}
.lead{max-width:46ch;font-size:clamp(1.02rem,1.5vw,1.2rem);color:var(--on-ink);margin:0 0 34px}
.cta-row{display:flex;flex-wrap:wrap;gap:12px}
.hero-visual{position:relative;z-index:2;justify-self:center;width:min(100%,440px);align-self:end}
.arch{position:relative;aspect-ratio:4/5.15;border-radius:999px 999px 22px 22px;overflow:hidden;box-shadow:0 40px 70px -30px rgba(0,0,0,.8)}
.arch .ph{position:absolute;inset:0;transform:scale(1.04);transition:transform 1.2s var(--ease)}
.hero-visual:hover .arch .ph{transform:scale(1.09)}
.arch-ring{position:absolute;inset:-14px -14px 0;border:1px solid rgba(226,198,126,.45);border-bottom:0;border-radius:999px 999px 0 0;pointer-events:none}
.scan{position:absolute;top:0;bottom:0;left:0;width:2px;background:var(--gold-l);opacity:0}
.scan::before{content:"";position:absolute;top:0;bottom:0;right:2px;width:70px;background:linear-gradient(90deg,transparent,rgba(226,198,126,.35))}
.laser .arch{animation:reveal 1.7s var(--ease) both}
.laser .scan{animation:scanline 1.7s var(--ease) both}
.laser .laser-line{animation:draw 1.3s .2s var(--ease) both}
@keyframes reveal{from{clip-path:inset(0 100% 0 0 round 999px 999px 22px 22px)}to{clip-path:inset(0 0 0 0 round 999px 999px 22px 22px)}}
@keyframes scanline{0%{left:0;opacity:1}92%{opacity:1}100%{left:100%;opacity:0}}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.chip{position:absolute;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:rgba(251,247,238,.94);color:var(--ink);font:600 .8rem/1 var(--sans);box-shadow:0 14px 28px -14px rgba(0,0,0,.6);transition:transform .35s var(--ease)}
.chip:hover{transform:translateY(-3px)}.chip .ic{width:15px;height:15px;color:var(--gold-d)}
.chip b{color:var(--gold-t)}
.chip-a{left:-22px;bottom:96px}.chip-b{right:-18px;bottom:34px}
.hero-trust{position:absolute;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 0;list-style:none;margin:0;padding:18px 20px;border-top:1px solid rgba(226,198,126,.18);font-size:.82rem;color:var(--on-ink);background:linear-gradient(0deg,rgba(26,18,6,.7),transparent)}
.hero-trust li{padding-inline:20px;position:relative}
.hero-trust li+li::before{content:"";position:absolute;left:-2px;top:50%;width:4px;height:4px;margin-top:-2px;border-radius:50%;background:var(--gold)}

/* ── Sections ── */
.sec{padding:clamp(56px,8vw,104px) clamp(20px,6vw,96px)}
.sec-sand{background:var(--sand)}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px 40px;flex-wrap:wrap;margin-bottom:34px}
.sec-head h2{font-size:clamp(1.9rem,3.8vw,3rem);line-height:1.08}
.sub{margin:10px 0 0;color:var(--muted);max-width:52ch}
.rail-ctrl{display:flex;align-items:center;gap:10px}
.rail-ctrl .link{margin-right:8px}
.rbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--line);transition:background .25s,color .25s,box-shadow .25s}
.rbtn:hover{background:var(--ink);color:var(--cream)}

/* rail produits */
.rail{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:2px;padding:6px 2px 20px;margin-inline:-2px;overscroll-behavior-x:contain}
.pt{flex:0 0 clamp(210px,24vw,290px);scroll-snap-align:start;display:block;--mx:50%;--my:50%}
.pt-img{position:relative;aspect-ratio:4/5;border-radius:20px;overflow:hidden;background:var(--sand);box-shadow:0 1px 0 var(--line)}
.pt-img .ph{position:absolute;inset:0;transition:transform .9s var(--ease)}
.pt:hover .pt-img .ph{transform:scale(1.07)}
.pt-img::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(240px circle at var(--mx) var(--my),rgba(226,198,126,.28),transparent 60%);opacity:0;transition:opacity .4s;pointer-events:none}
.pt:hover .pt-img::after{opacity:1}
.badge{position:absolute;top:14px;left:14px;padding:6px 11px;border-radius:999px;background:var(--ink);color:var(--gold-l);font:700 .72rem/1 var(--sans);letter-spacing:.08em;text-transform:uppercase}
.fav{position:absolute;top:10px;right:10px;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(251,247,238,.92);color:var(--ink);transition:transform .3s var(--ease),color .2s}
.fav:hover{transform:scale(1.1)}.fav.on{color:#b3261e}.fav.on .ic{fill:currentColor}
.pt-cta{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:999px;background:var(--ink);color:var(--cream);font:600 .85rem/1 var(--sans);translate:0 140%;transition:translate .5s var(--ease)}
.pt-cta .ic{width:16px;height:16px}
.pt:hover .pt-cta,.pt:focus-visible .pt-cta{translate:0 0}
.pt-meta{display:flex;flex-direction:column;gap:4px;padding:14px 4px 0}
.pt-name{font-weight:600;font-size:.95rem;line-height:1.35}
.pt-price{font:600 .92rem/1 var(--serif);color:var(--gold-t);font-variant-numeric:tabular-nums}
.pt-more{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:14px;aspect-ratio:4/5;padding:28px;border-radius:20px;background:var(--ink);color:var(--cream);font:600 1.5rem/1.2 var(--serif);transition:background .3s}
.pt-more .ic{width:30px;height:30px;color:var(--gold);transition:transform .4s var(--ease)}
.pt-more:hover{background:var(--ink3)}.pt-more:hover .ic{transform:translateX(8px)}
@media (hover:none){.pt-cta{display:none}}

/* bijoux au premier plan */
.bijoux{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,5vw,72px);align-items:center}
.bij-copy{display:flex;flex-direction:column;align-items:flex-start;gap:20px}
.bij-copy h2{font-size:clamp(2rem,4vw,3.3rem);line-height:1.06}
.bij-copy p{margin:0;color:var(--muted);max-width:42ch}
.bij-cats{display:flex;flex-wrap:wrap;gap:8px}
.bij-cats a{padding:9px 16px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.88rem;transition:background .25s,color .25s,box-shadow .25s}
.bij-cats a:hover{background:var(--ink);color:var(--cream);box-shadow:none}
.bij-copy .bij-note{font-size:.85rem;color:var(--gold-t);font-weight:600}
.bij-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.bij-grid .pt{flex:none}

/* édition limitée */
.limited{padding:0 clamp(20px,6vw,96px) clamp(56px,8vw,104px)}
.limited-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);border-radius:32px;overflow:hidden;background:linear-gradient(115deg,var(--ink) 0,var(--ink2) 55%,#33260f 100%);color:var(--cream);min-height:440px}
.limited-copy{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:20px;padding:clamp(28px,5vw,64px)}
.limited h2{font-size:clamp(1.8rem,3.5vw,2.9rem);line-height:1.1}.limited h2 em{color:var(--gold-l)}
.limited p{margin:0;color:var(--on-ink);max-width:44ch}
.pill{display:inline-flex;align-items:center;gap:9px;padding:7px 14px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(226,198,126,.5);color:var(--gold-l);font:600 .78rem/1 var(--sans);letter-spacing:.06em;text-transform:uppercase}
.pill i{width:7px;height:7px;border-radius:50%;background:var(--gold)}
.limited-img{position:relative;order:2;overflow:hidden}
.limited-img .ph{position:absolute;inset:-6% 0;transition:transform 1.4s var(--ease);background-position:center 40%}
.limited-card:hover .limited-img .ph{transform:scale(1.05)}
.limited-img::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,var(--ink2),transparent 38%);pointer-events:none}

/* bento verres */
.bento-v{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:clamp(190px,21vw,270px);gap:14px}
.bt{position:relative;border-radius:22px;overflow:hidden;background:var(--ink)}
.bt .ph{position:absolute;inset:0;transition:transform 1s var(--ease)}.bt:hover .ph{transform:scale(1.07)}
.bt::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(26,18,6,.78),transparent 55%)}
.bt-big{grid-column:span 2;grid-row:span 2}
.bt-lab{position:absolute;left:18px;right:18px;bottom:16px;z-index:2;display:flex;flex-direction:column;gap:5px;color:var(--cream)}
.bt-name{font:600 .95rem/1.3 var(--sans)}.bt-big .bt-name{font:600 clamp(1.3rem,2.2vw,1.8rem)/1.15 var(--serif)}
.bt-price{font:600 .9rem/1 var(--serif);color:var(--gold-l);font-variant-numeric:tabular-nums}

/* Noël */
.noel{position:relative;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center;gap:32px;padding:clamp(48px,7vw,88px) clamp(20px,6vw,96px);background:radial-gradient(100% 120% at 85% 20%,var(--red2),var(--red) 70%);color:#fff7ea;overflow:hidden}
.noel::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 110%,rgba(226,198,126,.28),transparent 45%);pointer-events:none}
.noel-copy{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:20px}
.noel h2{font-size:clamp(2rem,4.4vw,3.6rem);line-height:1.06}.noel h2 em{color:#f6e4b0}
.noel p{margin:0;max-width:46ch;color:rgba(255,247,234,.86)}
.noel .noel-note{font-size:.85rem;color:#f6e4b0;font-style:italic}
.fan{position:relative;height:clamp(260px,34vw,400px)}
.fan .ph{position:absolute;width:clamp(150px,20vw,230px);aspect-ratio:3/4;border-radius:16px;border:5px solid #fff7ea;box-shadow:0 26px 40px -18px rgba(0,0,0,.65);transition:transform .8s var(--ease)}
.fan-1{left:4%;top:12%;rotate:-9deg}.fan-2{left:34%;top:0;rotate:2deg;z-index:2}.fan-3{left:62%;top:14%;rotate:10deg}
.noel:hover .fan-1{transform:translateX(-14px) rotate(-3deg)}.noel:hover .fan-3{transform:translateX(14px) rotate(3deg)}.noel:hover .fan-2{transform:translateY(-8px)}

/* collections */
.bento-c{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:clamp(150px,17vw,230px);gap:14px}
.ct{position:relative;border-radius:24px;overflow:hidden;background:var(--ink);color:var(--cream)}
.ct .ph{position:absolute;inset:0;transition:transform 1s var(--ease)}.ct:hover .ph{transform:scale(1.06)}
.ct::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(26,18,6,.82),rgba(26,18,6,.05) 62%)}
.ct-lab{position:absolute;left:22px;right:70px;bottom:20px;z-index:2}
.ct h3{font-size:clamp(1.15rem,1.9vw,1.6rem);line-height:1.15}.ct p{margin:4px 0 0;font-size:.85rem;color:var(--on-ink)}
.ct-go{position:absolute;right:16px;bottom:16px;z-index:2;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--cream);color:var(--ink);transition:background .3s,transform .4s var(--ease)}
.ct:hover .ct-go{background:var(--gold);transform:rotate(-45deg)}
.ct-bijoux{grid-column:1/7;grid-row:1/3}.ct-mar{grid-column:7/13}.ct-cad{grid-column:7/10}.ct-ver{grid-column:10/13}.ct-dec{grid-column:1/13;grid-row:3}
.ct-dec .ph{background-position:center 45%}

/* atelier */
.atelier{background:var(--ink);color:var(--cream);padding:clamp(72px,10vw,140px) clamp(20px,6vw,96px) clamp(64px,8vw,110px)}
.statement{font:500 clamp(1.7rem,4.1vw,3.5rem)/1.22 var(--serif);letter-spacing:-.015em;max-width:24ch;margin:0 0 clamp(40px,6vw,80px);text-wrap:balance}
.statement .w{transition:opacity .25s linear,color .25s}
.js .statement .w{opacity:.3}.js .statement .w.on{opacity:1}
.at-row{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(24px,5vw,72px);align-items:center}
.at-pics{position:relative;height:clamp(260px,34vw,440px)}
.at-pics .ph{position:absolute;border-radius:20px;box-shadow:0 30px 50px -24px rgba(0,0,0,.8);outline:1px solid rgba(226,198,126,.25);outline-offset:-1px}
.at-1{left:0;top:0;width:58%;height:88%}.at-2{right:0;bottom:0;width:46%;height:68%}
.at-copy{display:flex;flex-direction:column;align-items:flex-start;gap:24px}.at-copy p{margin:0;color:var(--on-ink);max-width:42ch;font-size:1.05rem}

/* mur : 3 rangées, comme sur le site */
.wall{background:var(--ink);color:var(--cream);padding:clamp(56px,8vw,96px) 0 clamp(48px,7vw,80px);overflow:hidden}
.wall-head{text-align:center;max-width:720px;margin:0 auto clamp(30px,4vw,44px);padding-inline:20px}
.wall-head h2{font-size:clamp(1.9rem,4vw,3rem);line-height:1.1}
.wall-head p{margin:14px auto 0;color:var(--on-ink);max-width:56ch}
.mq{overflow:hidden;margin-bottom:14px;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.mq-track{display:flex;gap:14px;width:max-content;animation:mq 75s linear infinite}
.mq-copy{display:contents}
.mq-1 .mq-track{animation-direction:reverse;animation-duration:85s}.mq-2 .mq-track{animation-duration:95s}
.mq:hover .mq-track,.mq.stop .mq-track{animation-play-state:paused}
@keyframes mq{to{transform:translateX(calc(-50% - 7px))}}
.wt{position:relative;flex:none;width:clamp(130px,15vw,200px);aspect-ratio:1;border-radius:16px;overflow:hidden;outline:1px solid rgba(226,198,126,.18);outline-offset:-1px}
.wt-img{position:absolute;inset:0;transition:transform .8s var(--ease)}
.wt-l{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:3px;padding:24px 12px 11px;background:linear-gradient(0deg,rgba(26,18,6,.92),transparent);font-size:.78rem;font-weight:600;line-height:1.25;opacity:0;translate:0 10px;transition:opacity .35s,translate .45s var(--ease)}
.wt-l b{font:600 .85rem/1 var(--serif);color:var(--gold-l)}
.wt:hover .wt-img,.wt.show .wt-img{transform:scale(1.06)}
.wt:hover .wt-l,.wt.show .wt-l,.wt:focus-visible .wt-l{opacity:1;translate:0 0}
.wall-foot{display:flex;justify-content:center;margin-top:34px}

/* avis + sur mesure + pied */
.proof{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 20px clamp(48px,6vw,80px);text-align:center}
.stars{display:flex;gap:4px;color:var(--gold)}.star{width:22px;height:22px}
.proof p{margin:0;font-size:1.02rem;display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;align-items:center}.proof b{font-family:var(--serif);font-size:1.3rem}
.custom{position:relative;background:var(--sand);padding:clamp(56px,8vw,104px) clamp(20px,6vw,96px);text-align:center;overflow:hidden}
.custom::before{content:"✦";position:absolute;left:50%;top:22px;translate:-50% 0;color:var(--gold);font-size:1.1rem}
.custom-in{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:760px;margin-inline:auto}
.custom h2{font-size:clamp(1.9rem,4.2vw,3.3rem);line-height:1.1}.custom p{margin:0;color:var(--muted)}
.foot{background:var(--ink);color:var(--on-ink);padding:44px clamp(20px,6vw,96px) 100px;font-size:.9rem}
.foot-top{display:flex;flex-wrap:wrap;gap:12px 36px;align-items:center;justify-content:space-between}
.foot-top p{margin:0}.foot-logo{display:block;height:64px;width:auto;border-radius:10px;background:#efe9da}
.foot-pay{margin:22px 0 0;padding-top:20px;border-top:1px solid rgba(226,198,126,.16)}
.ask{position:fixed;left:16px;bottom:16px;z-index:40;display:inline-flex;align-items:center;gap:9px;padding:12px 18px;border-radius:999px;background:var(--cream);color:var(--ink);font:600 .85rem/1 var(--sans);box-shadow:0 14px 30px -14px rgba(26,18,6,.55),0 0 0 1px var(--line);transition:transform .3s var(--ease)}
.ask:hover{transform:translateY(-3px)}.ask .ic{width:17px;height:17px;color:var(--gold-d)}

/* ── Adaptation ── */
@media (max-width:1020px){
  .nav-links{display:none}.nav{padding-left:14px}.nav-tools{margin-left:auto}
  .top{grid-template-columns:auto 1fr auto;padding-block:10px}.top-l,.top-links{display:none}.burger{display:grid}.logo-card{justify-self:center}
  .bijoux{grid-template-columns:1fr}.bij-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero{grid-template-columns:1fr;padding-top:112px}
  .hero-copy{padding-bottom:12px}
  .hero-visual{width:min(80%,380px)}
  .chip-a{left:-10px}.chip-b{right:-10px}
  .limited-card{grid-template-columns:1fr}.limited-img{order:0;min-height:280px}.limited-img::before{background:linear-gradient(0deg,var(--ink2),transparent 40%)}
  .noel{grid-template-columns:1fr}.fan{height:300px}
  .at-row{grid-template-columns:1fr}
  .bento-v{grid-template-columns:repeat(2,1fr);grid-auto-rows:clamp(160px,38vw,260px)}.bt-big{grid-column:span 2}
  .bento-c{grid-template-columns:repeat(2,1fr);grid-auto-rows:clamp(150px,40vw,230px)}
  .ct-bijoux{grid-column:1/3;grid-row:auto}.ct-mar{grid-column:1/3}.ct-cad,.ct-ver{grid-column:auto}.ct-dec{grid-column:1/3;grid-row:auto}
  .rail-ctrl .rbtn{display:none}
}
@media (max-width:560px){
  .hide-s{display:none}.logo{font-size:1.05rem}.btn{padding:14px 22px}
  .hero-trust{font-size:.75rem}.hero-trust li{padding-inline:10px}
  .fan .ph{width:34vw}.statement{max-width:none}
  .bento-c{grid-template-columns:1fr;grid-auto-rows:clamp(170px,48vw,230px)}
  .ct-bijoux,.ct-mar,.ct-cad,.ct-ver,.ct-dec{grid-column:auto;grid-row:auto}
  .bt-lab{left:12px;right:12px;bottom:12px}.bt-name{font-size:.8rem}.bt-big .bt-name{font-size:1.2rem}.bt-price{font-size:.8rem}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .laser .arch,.laser .scan,.laser .laser-line,.mq-track{animation:none!important}.wt-l{opacity:1;translate:0 0}
  .mq{overflow-x:auto;-webkit-mask:none;mask:none}
  .js .statement .w{opacity:1}
  *{transition-duration:.01ms!important}
}
'''

JS = r'''
(function(){
  var d=document,root=d.documentElement,rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  var nav=d.getElementById('nav');
  var top=d.getElementById('top');
  function onScroll(){nav.classList.toggle('show',scrollY>top.offsetHeight+120);nav.setAttribute('aria-hidden',scrollY>top.offsetHeight+120?'false':'true');words();par()}
  /* un seul moment d'écriture : le laser dévoile la photo du héros */
  var hv=d.getElementById('heroVisual'),hero=d.getElementById('hero');
  if(!rm){requestAnimationFrame(function(){hero.classList.add('laser')})}
  /* rails produits */
  d.querySelectorAll('.rbtn').forEach(function(b){b.addEventListener('click',function(){
    var r=d.getElementById(b.dataset.rail);r.scrollBy({left:b.dataset.dir*r.clientWidth*.8,behavior:rm?'auto':'smooth'})})});
  /* halo doré qui suit le curseur sur les vignettes */
  d.querySelectorAll('.pt').forEach(function(t){t.addEventListener('pointermove',function(e){
    var r=t.getBoundingClientRect();t.style.setProperty('--mx',(e.clientX-r.left)+'px');t.style.setProperty('--my',(e.clientY-r.top)+'px')})});
  d.querySelectorAll('.fav').forEach(function(f){f.addEventListener('click',function(e){e.preventDefault();f.classList.toggle('on')})});
  d.querySelectorAll('a[href="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});
  /* phrase de l'atelier : les mots s'allument avec le défilement */
  var st=d.getElementById('statement'),ws=[];
  if(st){var t=st.textContent.trim().split(/\s+/);st.textContent='';t.forEach(function(w,i){var s=d.createElement('span');s.className='w';s.textContent=w;st.appendChild(s);if(i<t.length-1)st.appendChild(d.createTextNode(' '));ws.push(s)})}
  function words(){if(!st||rm)return;var r=st.getBoundingClientRect(),vh=innerHeight;
    var p=Math.min(1,Math.max(0,(vh*.85-r.top)/(vh*.55+r.height*.4)));var n=Math.round(p*ws.length);
    for(var i=0;i<ws.length;i++)ws[i].classList.toggle('on',i<n)}
  /* léger décalage du visuel du héros */
  function par(){if(rm||!hv)return;var y=Math.min(scrollY,700);hv.style.translate='0 '+(y*-.06)+'px'}
  /* mur : toucher une pièce l'arrête et montre nom + prix, il repart après 4 s */
  d.querySelectorAll('.mq').forEach(function(row){var tm;
    row.addEventListener('click',function(e){var t=e.target.closest('.wt');if(!t)return;
      if(!t.classList.contains('show')){e.preventDefault();row.querySelectorAll('.wt.show').forEach(function(x){x.classList.remove('show')});t.classList.add('show');row.classList.add('stop');
        clearTimeout(tm);tm=setTimeout(function(){row.classList.remove('stop');t.classList.remove('show')},4000)}})});
  addEventListener('scroll',onScroll,{passive:true});onScroll();
})();
'''

TITLE = "Accueil Niv Création"
HEAD_LINKS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap">'
STYLE = f"<style>{CSS}\n{IMG_CSS}</style>"

full = f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>{HEAD_LINKS}{STYLE}</head><body>{BODY}<script>{JS}</script></body></html>'
frag = f'<title>{TITLE}</title>{HEAD_LINKS}{STYLE}{BODY}<script>{JS}</script>'
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, "accueil-moderne.html"), "w").write(full)
open(os.path.join(OUT, "accueil-moderne.fragment.html"), "w").write(frag)
print("ok", len(full)//1024, "Ko")
