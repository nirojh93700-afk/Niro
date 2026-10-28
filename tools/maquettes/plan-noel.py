#!/usr/bin/env python3
# Plan Noël 2026 (maquette, 28/10/2026) — gérant : « je veux faire 4000 € par mois… fais le 1 et le 2 ».
# Page à valider : dates limites proposées, bandeau de l'accueil avec la date, calendrier des envois,
# aperçu de la 1re newsletter, étapes Google Merchant Center. RIEN n'est en ligne ni envoyé.
# Usage : python3 tools/maquettes/plan-noel.py <sortie.html>
# Photos = public/produits (toutes GRAVÉES, règle du 22/09).
import base64, io, sys
from PIL import Image

PHOTOS = {
    "cristal": ("cristal-v-femme.jpg", "Cristal photo 3D"),
    "whisky": ("verre_a_whisky_exemple_face.jpg", "Verre à whisky gravé"),
    "carafe": ("carafe_gravee.jpg", "Carafe à whisky gravée"),
    "coeur": ("collier-coeur-grave-1.jpg", "Collier cœur gravé"),
    "double": ("collier-double-coeur-3.jpg", "Collier double cœur"),
    "vin": ("verre_vin_geniet.jpg", "Verre à vin gravé"),
    "cordon": ("bracelet-cordon-plaque-4.jpg", "Bracelet cordon à plaque"),
    "plaques": ("collier-coeur-plaques-1.jpg", "Collier à plaques gravées"),
    "bracelet": ("bracelet-femme-acier-grave.jpg", "Bracelet femme gravé"),
}


def uri(f):
    im = Image.open("public/produits/" + f).convert("RGB")
    im.thumbnail((360, 360))
    b = io.BytesIO()
    im.save(b, "JPEG", quality=72)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


IMG = {k: (uri(f), alt) for k, (f, alt) in PHOTOS.items()}


def img(k, cls=""):
    s, a = IMG[k]
    return f'<img src="{s}" alt="{a}" class="{cls}" loading="lazy">'


CALENDRIER = [
    ("Dès ton accord", "Site", "Date limite ajoutée au bandeau Noël de l'accueil et à la page « Idées de Noël »."),
    ("Dès ton accord", "Google", "Le flux produits est ajouté dans Google Merchant Center (fiches Shopping gratuites)."),
    ("Ven. 6 nov.", "Newsletter 1", "« Vos cadeaux de Noël, gravés dans notre atelier » : les idées de Noël + la date limite."),
    ("Ven. 6 nov.", "Vidéo", "Cristal photo 3D et verres gravés, habillage Noël."),
    ("Ven. 13 nov.", "Vidéo", "Bijoux gravés au prénom."),
    ("Ven. 20 nov.", "Newsletter 2", "Les idées par personne : pour elle, pour lui, pour les enfants."),
    ("Ven. 20 nov.", "Vidéo", "Marque-pages gravés et petits cadeaux."),
    ("Ven. 27 nov.", "Vidéo", "Verres et carafe : « l'apéro de Noël »."),
    ("Ven. 4 déc.", "Newsletter 3", "Rappel : plus que quelques jours pour commander avant le jeudi 10 décembre."),
    ("Mar. 8 déc.", "Relance", "Seulement aux inscrites qui n'ont ni ouvert ni commandé, objet différent."),
    ("Ven. 11 déc.", "Newsletter 4", "Trop tard pour graver ? La carte cadeau, envoyée par e-mail le jour choisi."),
]

ETAPES_GOOGLE = [
    ("Ouvrir Merchant Center", "Va sur <b>merchants.google.com</b> et connecte-toi avec le compte Google du site (celui de la Search Console)."),
    ("Informations de l'entreprise", "Nom : <b>Niv Création</b> · site : <b>https://nivcreation.fr</b> · pays : France · adresse : la domiciliation de Paris."),
    ("Valider le site", "Le site porte déjà la balise de vérification Google : choisis « Valider et revendiquer », la validation se fait seule."),
    ("Ajouter le flux", "Produits → Ajouter des produits → « À partir d'un fichier » → « Saisir un lien » : <b>https://nivcreation.fr/flux-google.xml</b>, mise à jour <b>tous les jours</b>."),
    ("Livraison", "Rien à créer : chaque produit du flux porte déjà son prix de livraison (France, Belgique, Luxembourg)."),
    ("Retours", "Politique de retour : « Pas de retour » pour les pièces personnalisées, avec le lien <b>https://nivcreation.fr/retours</b>."),
    ("Fiches gratuites", "Dans « Croissance → Gérer les programmes », vérifie que les <b>fiches gratuites</b> sont activées. Aucune publicité payante."),
]

ETAPES_HTML = "".join(f'<li><b class="n">{i}</b><div><h4>{t}</h4><p>{d}</p></div></li>' for i, (t, d) in enumerate(ETAPES_GOOGLE, 1))
CAL_HTML = "".join(
    f'<tr><td class="d">{d}</td><td><span class="tag t-{t.split()[0].lower()}">{t}</span></td><td>{x}</td></tr>' for d, t, x in CALENDRIER
)

HTML = f"""<title>Plan Noël 2026</title>
<style>
:root {{ --bg:#fbf7ee; --card:#ffffff; --fg:#1a1206; --mut:#6b5d47; --line:#e8dcc4; --gold:#c9a24b; --gold-ink:#7c6120;
  --red:#a8281d; --red2:#6e140e; --cream:#f3e8d3; --ok:#2f6b3a; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg:#16110a; --card:#211a10; --fg:#f3e8d3; --mut:#bba98a; --line:#3a2f1f; --gold:#d8b45e; --gold-ink:#e2c67e; --cream:#2a2114; --ok:#7fc28c; color-scheme:dark }} }}
:root[data-theme="dark"] {{ --bg:#16110a; --card:#211a10; --fg:#f3e8d3; --mut:#bba98a; --line:#3a2f1f; --gold:#d8b45e; --gold-ink:#e2c67e; --cream:#2a2114; --ok:#7fc28c; color-scheme:dark }}
body {{ background:var(--bg); color:var(--fg); font:16px/1.6 Inter, system-ui, sans-serif; padding:28px 16px 60px }}
.w {{ max-width:960px; margin:0 auto; display:grid; gap:34px }} .w > * {{ min-width:0 }}
h1,h2,h3 {{ font-family:"Playfair Display", Georgia, serif; text-wrap:balance; margin:0 }}
h1 {{ font-size:clamp(1.9rem,4vw,2.6rem) }} h2 {{ font-size:1.5rem; margin-bottom:12px }} h1 em,h2 em {{ color:var(--gold-ink) }}
p {{ margin:0 }} .mut {{ color:var(--mut) }}
.warn {{ background:var(--cream); border-left:4px solid var(--gold); padding:12px 16px; border-radius:8px }}
.dates {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:14px }}
.date {{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:18px }}
.date .k {{ font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; color:var(--mut) }}
.date .v {{ font-family:"Playfair Display", Georgia, serif; font-size:1.45rem; margin:4px 0 6px }}
.date p {{ font-size:.92rem; color:var(--mut) }}
.noel {{ background:linear-gradient(135deg,#c0392b,#7a1512); color:#fff8ec; border-radius:18px; padding:26px; display:grid; grid-template-columns:1.1fr 1fr; gap:22px; align-items:center }}
.noel h3 {{ font-size:clamp(1.5rem,3.2vw,2rem); color:#fff8ec }} .noel h3 em {{ color:#f0d48a }}
.noel .eb {{ color:#f0d48a; font-size:.8rem; letter-spacing:.12em; text-transform:uppercase; margin-bottom:6px }}
.noel p {{ color:#fbe9d2; margin:10px 0 14px }}
.noel .btn {{ display:inline-block; background:linear-gradient(#e2c67e,#c9a24b); color:#1a1206; font-weight:600; padding:11px 20px; border-radius:999px; text-decoration:none }}
.noel .lim {{ margin-top:14px; background:rgba(255,248,236,.12); border:1px solid rgba(240,212,138,.55); border-radius:12px; padding:10px 14px; font-size:.95rem }}
.noel .lim b {{ color:#f0d48a }}
.noel .new {{ display:inline-block; background:#f0d48a; color:#5a0f0a; font-size:.7rem; font-weight:700; border-radius:6px; padding:2px 7px; margin-right:6px; vertical-align:middle }}
.mos {{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px }} .mos img {{ width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px }}
@media (max-width:720px) {{ .noel {{ grid-template-columns:1fr }} }}
.tbl {{ overflow-x:auto; background:var(--card); border:1px solid var(--line); border-radius:16px }}
table {{ border-collapse:collapse; width:100%; font-size:.94rem }}
@media (max-width:600px) {{ table, tbody, tr, td {{ display:block }} tr {{ padding:10px 14px; border-top:1px solid var(--line) }} tr:first-child {{ border-top:0 }} .tbl td {{ border:0; padding:2px 0 }} td.d {{ display:inline-block; margin-right:8px }} td:nth-child(2) {{ display:inline-block }} }}
td {{ padding:11px 14px; border-top:1px solid var(--line); vertical-align:top }} tr:first-child td {{ border-top:0 }}
td.d {{ white-space:nowrap; font-weight:600; font-variant-numeric:tabular-nums }}
.tag {{ display:inline-block; font-size:.76rem; font-weight:600; padding:2px 9px; border-radius:999px; white-space:nowrap; background:var(--cream); color:var(--gold-ink) }}
.t-newsletter {{ background:#f6e3c6; color:#7a4a0c }} .t-vidéo {{ background:#e7e0f3; color:#4b3a78 }} .t-relance {{ background:#f4dcd8; color:#8a2a1e }}
.t-google {{ background:#dceadf; color:#2f6b3a }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) .tag {{ background:var(--cream); color:var(--gold-ink) }} }}
.mail {{ background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden }}
.mail .hd {{ padding:14px 18px; border-bottom:1px solid var(--line); font-size:.92rem; display:grid; gap:2px }}
.mail .bd {{ padding:22px 18px; display:grid; gap:14px; max-width:600px; margin:0 auto }}
.mail .logo {{ text-align:center; font-family:"Playfair Display", Georgia, serif; font-size:1.4rem; color:var(--gold-ink); letter-spacing:.06em }}
.mail .cards {{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px }}
.mail .cards figure {{ margin:0; background:var(--bg); border-radius:12px; overflow:hidden }}
.mail .cards img {{ width:100%; aspect-ratio:1; object-fit:cover; display:block }}
.mail .cards figcaption {{ padding:8px 10px; font-size:.88rem; font-weight:600 }}
.mail .cta {{ text-align:center }} .mail .cta a {{ display:inline-block; background:linear-gradient(#e2c67e,#c9a24b); color:#1a1206; font-weight:600; padding:12px 22px; border-radius:999px; text-decoration:none }}
.steps {{ list-style:none; margin:0; padding:0; display:grid; gap:12px }}
.steps li {{ display:grid; grid-template-columns:36px 1fr; gap:12px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px }}
.steps .n {{ width:32px; height:32px; border-radius:50%; background:var(--gold); color:#1a1206; display:grid; place-items:center; font-size:.95rem }}
.steps h4 {{ margin:0 0 2px; font-size:1rem }} .steps p {{ color:var(--mut); font-size:.93rem; overflow-wrap:anywhere }}
.ok {{ color:var(--ok); font-weight:600 }}
.todo {{ display:grid; gap:8px; padding-left:20px; margin:0 }}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap">
<div class="w">
  <header style="display:grid;gap:10px">
    <p class="mut" style="font-size:.85rem;letter-spacing:.1em;text-transform:uppercase">Niv Création · maquette du 28 octobre</p>
    <h1>Plan <em>Noël 2026</em></h1>
    <p class="warn">À valider : rien n'est en ligne, rien n'est envoyé. Chaque envoi te sera montré avant, et ne partira qu'après ton « envoie ».</p>
  </header>

  <section>
    <h2>Les dates limites <em>proposées</em></h2>
    <div class="dates">
      <div class="date"><div class="k">Livraison normale</div><div class="v">Jeudi 10 décembre</div>
        <p>Point relais, domicile ou lettre suivie. Commande du 10 = expédiée au plus tard le jeudi 17 (5 jours ouvrés de gravure), livrée vers le 21–23.</p></div>
      <div class="date"><div class="k">Express Chronopost</div><div class="v">Lundi 14 décembre</div>
        <p>Commande du 14 = expédiée au plus tard le lundi 21, livrée en 24 à 48 h. Calcul fait avec la règle de délai du site.</p></div>
      <div class="date"><div class="k">Après le 14 décembre</div><div class="v">Carte cadeau</div>
        <p>Envoyée par e-mail le jour choisi, même le 24 : la vente n'est pas perdue.</p></div>
    </div>
  </section>

  <section>
    <h2>Le bandeau Noël de l'accueil, <em>avec la date</em></h2>
    <p class="mut" style="margin-bottom:12px">Le bandeau en ligne reste tel quel ; seule la ligne marquée « nouveau » s'ajoute, à la place de « pensez-y tôt ».</p>
    <div class="noel">
      <div>
        <div class="eb">✦ Noël 2026</div>
        <h3>Ce Noël, offrez un <em>cadeau unique</em></h3>
        <p>Cristal photo, verres, bijoux gravés : chaque pièce est gravée à la commande dans notre atelier. Une pièce qui n'existe qu'une fois.</p>
        <a class="btn" href="#">Voir les idées de Noël →</a>
        <div class="lim"><span class="new">NOUVEAU</span>Pour être livré à Noël, commandez avant le <b>jeudi 10 décembre</b> (Express : lundi 14 décembre).</div>
      </div>
      <div class="mos">{img("cristal")}{img("whisky")}{img("carafe")}{img("coeur")}{img("double")}{img("cordon")}{img("vin")}{img("bracelet")}{img("plaques")}</div>
    </div>
  </section>

  <section>
    <h2>Le calendrier</h2>
    <div class="tbl"><table>{CAL_HTML}</table></div>
    <p class="mut" style="margin-top:10px;font-size:.9rem">Envois le vendredi matin, comme la newsletter du 4 septembre. Les vidéos n'utilisent que des photos de pièces gravées.</p>
  </section>

  <section>
    <h2>Aperçu de la <em>newsletter 1</em></h2>
    <div class="mail">
      <div class="hd"><span><b>Objet :</b> ✦ Vos cadeaux de Noël, gravés dans notre atelier</span><span class="mut">De : Niv Création · envoi proposé le vendredi 6 novembre</span></div>
      <div class="bd">
        <div class="logo">NiV CRÉATION</div>
        <p>Bonjour,</p>
        <p>Noël approche. Cette année, offrez un cadeau qui ne ressemble à aucun autre : un prénom, une date, une photo, gravés à la main dans notre atelier.</p>
        <div class="cards">
          <figure>{img("cristal")}<figcaption>Cristal photo 3D</figcaption></figure>
          <figure>{img("coeur")}<figcaption>Bijoux gravés au prénom</figcaption></figure>
          <figure>{img("whisky")}<figcaption>Verres gravés</figcaption></figure>
          <figure>{img("carafe")}<figcaption>Carafe à whisky gravée</figcaption></figure>
        </div>
        <p>Chaque pièce est gravée une par une. Pour être livré avant Noël, commandez avant le <b>jeudi 10 décembre</b>.</p>
        <div class="cta"><a href="#">Voir les idées de Noël</a></div>
        <p>Bien cordialement,<br>Niv Création</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Google Shopping : <em>tes 7 étapes</em></h2>
    <p class="mut" style="margin-bottom:12px">C'est ton compte Google : c'est toi qui le crée. Le flux du site est vérifié (<span class="ok">84 produits sur 84, prix identiques aux fiches</span>).</p>
    <ol class="steps">{ETAPES_HTML}</ol>
  </section>

  <section>
    <h2>Après ton accord, <em>je fais</em></h2>
    <ul class="todo">
      <li>la date limite dans le bandeau et sur la page des idées de Noël (avec les dates que tu choisis) ;</li>
      <li>la correction du flux Google (le cristal déjà gravé, dont la fiche redirige, sort du flux) ;</li>
      <li>chaque newsletter : montrée d'abord, envoyée à toi seul pour contrôle, puis à la liste après ton « envoie » ;</li>
      <li>les vidéos, une par semaine, avec description et 5 hashtags.</li>
    </ul>
  </section>
</div>
"""

open(sys.argv[1] if len(sys.argv) > 1 else "docs/maquettes/plan-noel.html", "w").write(HTML)
print("ok")
