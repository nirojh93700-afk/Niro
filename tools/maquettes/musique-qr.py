#!/usr/bin/env python3
"""Maquette « Plaque et porte-clés musique à scanner » (26/11/2026) — RIEN en ligne.

⚠️ Préfixe des classes = « mzq- » : « mq- » existe déjà dans le CSS du site (marque-pages, .mq-step a width:52px → étapes écrasées sur téléphone).

Gérant : lien du générateur Atomm « Spotify Music QR & Keychain » puis « fais la maquette ».
Repris d'Atomm (analysé le 26/11 dans le navigateur) : la cliente colle le lien de sa chanson, un QR code ordinaire est
calculé par la page et gravé sur du bois ; modèles « plaque simple » (Minimal), « carte musique » (Music card) et
« porte-clés QR » (QR keychain). ⛔ Le porte-clés « vague de son » (code Spotify officiel) n'est PAS repris : les codes
Spotify sont interdits sur des produits vendus (Atomm l'écrit sur sa page). Le mot « Spotify » n'est pas dans le nom.

  python3 tools/maquettes/musique-qr.py <capture d'une fiche du site> <dossier css> <qrcode.js> <jsQR.js> <sortie.html>

capture = curl https://nivcreation.fr/produit/puzzle-photo-grave (seulement pour l'en-tête, le pied de page, les cartes de
confiance) ; qrcode.js = npm pack qrcode-generator@1.4.4 (MIT) ; jsQR.js = npm pack jsqr@1.4.0 dist/jsQR.js (Apache-2.0),
sert à RELIRE le QR dessiné (contrôle « QR vérifié »). La sortie ne se commite pas.
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUB = os.path.join(ROOT, "public")
cap, cssdir, qrpath, jsqrpath, sortie = sys.argv[1:6]


def raw_uri(path):
    ext = path.rsplit(".", 1)[-1].lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "svg": "image/svg+xml"}[ext]
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


src = open(cap, encoding="utf-8").read()
src = re.sub(r"<script\b.*?</script>", "", src, flags=re.S)
b0 = src.find(">", src.find("<body")) + 1
i_main, j_main = src.find("<main"), src.find("</main>")
header, main, footer = src[b0:i_main], src[i_main:j_main], src[j_main + 7:src.rfind("</body>")]


def local_src(m):
    p = os.path.join(PUB, m.group(1).lstrip("/"))
    return f'src="{raw_uri(p)}"' if os.path.exists(p) else m.group(0)


def coquille(part):
    part = re.sub(r'src="(/[^"]+)"', local_src, part)
    for pat in (r"<button[^>]*>💬 Une question \?</button>", r'<a[^>]*href="/boutique">🛍️ La boutique</a>'):
        part = re.sub(pat, "", part)
    return re.sub(r'href="/[^"]*"', 'href="#"', part)


header, footer = coquille(header), coquille(footer)
css = "".join(open(os.path.join(cssdir, f), encoding="utf-8").read() + "\n" for f in sorted(os.listdir(cssdir)) if f.endswith(".css"))
css = re.sub(r"@font-face\{[^}]*\}", "", css).replace("</style", "<\\/style")


def bloc(debut, fin):
    a = main.find(debut)
    z = main.find(fin, a)
    return main[a:z] if a >= 0 and z > a else ""


trust = bloc('<div class="trust-cards">', '<div class="pd-perso">')
confiance = src[src.find('<section class="confiance">'):]
confiance = confiance[:confiance.find("</section>") + 10] if '<section class="confiance">' in src else ""
confiance = coquille(confiance).replace(' loading="lazy"', '')
QR = open(qrpath, encoding="utf-8").read().replace("</script", "<\\/script")
JSQR = open(jsqrpath, encoding="utf-8").read().replace("</script", "<\\/script")

# Mousquetons du porte-clés : photo du gérant du 26/11 découpée en 7 (docs/maquettes/assets/musique-qr/mousquetons/), même prix.
MOUSQ_DIR = os.path.join(ROOT, "docs/maquettes/assets/musique-qr/mousquetons")
MOUSQUETONS = []
for _id, _nom in [("or-rose", "Or rose"), ("anthracite", "Gris anthracite"), ("dore", "Doré"), ("argente", "Argenté"), ("noir", "Noir"), ("bronze", "Bronze"), ("champagne", "Champagne")]:
    _p = os.path.join(MOUSQ_DIR, _id + ".png")
    _wh = __import__("struct").unpack(">II", open(_p, "rb").read()[16:24])
    MOUSQUETONS.append({"id": _id, "nom": _nom, "r": round(_wh[0] / _wh[1], 3), "img": raw_uri(_p)})

# Prix PROPOSÉS (à valider par le gérant) : plus grand = plus cher.
DONNEES = {
    "modeles": [
        {"id": "plaque", "nom": "Plaque simple", "s": "QR au centre, titre dessous"},
        {"id": "carte", "nom": "Carte musique", "s": "note de musique et titre en haut"},
        {"id": "porte", "nom": "Porte-clés", "s": "QR carré, anneau sur le côté"},
    ],
    "tailles": {
        "plaque": [{"id": "p", "nom": "Petite", "w": 80, "prix": 17.9}, {"id": "m", "nom": "Moyenne", "w": 110, "prix": 22.9},
                   {"id": "g", "nom": "Grande", "w": 150, "prix": 27.9}],
        "porte": [{"id": "p", "nom": "Petit", "w": 50, "prix": 16.9}, {"id": "m", "nom": "Moyen", "w": 60, "prix": 17.9},
                  {"id": "g", "nom": "Grand", "w": 70, "prix": 18.9}],
    },
    "polices": [["playfair", "Playfair Display", "'Playfair Display',Georgia,serif"], ["cinzel", "Cinzel", "Cinzel,serif"],
                ["montserrat", "Montserrat", "Montserrat,sans-serif"], ["inter", "Inter", "Inter,sans-serif"],
                ["great-vibes", "Great Vibes", "'Great Vibes',cursive"], ["allura", "Allura", "Allura,cursive"],
                ["pacifico", "Pacifico", "Pacifico,cursive"], ["cinzel-deco", "Cinzel Decorative", "'Cinzel Decorative',serif"]],
    "mousquetons": MOUSQUETONS,
    "exemple": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
}

CSS_MAQ = r"""
:root{color-scheme:light}
body{background:var(--cream);color:var(--ink);font-family:'Inter',system-ui,sans-serif}
.mzq-bandeau{background:#2b2620;color:#f3ece0;font-size:.8rem;line-height:1.45;padding:9px 16px;text-align:center}
.mzq-bandeau b{color:#e2c67e}
.mzq-left{position:sticky;top:calc(var(--mzq-top,0px) + 12px);min-width:0;z-index:1;align-self:start}
.mzq-stage{position:relative;border-radius:var(--radius);border:1px solid var(--line);overflow:hidden;perspective:900px;
background:radial-gradient(120% 90% at 50% 20%,#f6f1e8 0%,#ece3d4 70%,#e2d6c2 100%);aspect-ratio:1/1;display:grid;place-items:center}
.mzq-stage svg{display:block;width:84%;height:84%;transition:transform .6s cubic-bezier(.2,.8,.2,1),filter .6s}
.mzq-stage[data-vue=relief] svg{transform:rotateX(18deg) rotateY(-24deg) rotateZ(2deg);filter:drop-shadow(10px 14px 8px rgba(60,40,15,.35))}
.mzq-tag{position:absolute;left:10px;top:10px;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
background:rgba(255,255,255,.86);border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:#7c6120}
.mzq-ex{position:absolute;left:10px;bottom:10px;font-size:.72rem;font-weight:700;background:#b3261e;color:#fff;border-radius:999px;padding:4px 10px}
.mzq-tools{position:absolute;right:10px;top:10px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.mzq-tools button{font:inherit;font-size:.78rem;font-weight:600;border:1px solid var(--line);background:rgba(255,255,255,.92);border-radius:999px;padding:6px 12px;cursor:pointer;color:var(--ink)}
.mzq-tools button[aria-pressed=true]{background:#2b2620;color:#fff;border-color:#2b2620}
.mzq-scan{margin-top:10px;font-size:.8rem;color:var(--ink-soft);background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 12px;line-height:1.45}
.mzq-step{border:1px solid var(--line);border-radius:14px;background:#fff;padding:14px 14px 16px;margin:0 0 12px}
.mzq-step h3{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:1rem;font-family:var(--font-display),Georgia,serif}
.mzq-n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#c9a24b;color:#fff;display:grid;place-items:center;font:700 .85rem Inter,sans-serif}
.mzq-sub{font-size:.84rem;color:var(--ink-soft);margin:8px 0 0;line-height:1.5}
.mzq-mq{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;margin-top:8px}
.mzq-mq button{font:inherit;font-size:.74rem;border:1.5px solid var(--line);background:#faf7f0;border-radius:12px;padding:8px 4px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--ink)}
.mzq-mq button[aria-pressed=true]{border-color:#c9a24b;background:#fff8e6;box-shadow:0 0 0 2px rgba(201,162,75,.35)}
.mzq-mq img{height:56px;width:auto}
.mzq-lien{display:flex;gap:8px}
.mzq-lien input{flex:1;min-width:0;font:inherit;font-size:.9rem;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;color:var(--ink)}
.mzq-lien input:focus{outline:2px solid rgba(201,162,75,.5);border-color:#c9a24b}
.mzq-lien button{font:inherit;font-size:.84rem;font-weight:600;border:1.5px solid var(--line);background:#fff;border-radius:10px;padding:0 14px;cursor:pointer}
.mzq-ok{margin-top:8px;font-size:.82rem;font-weight:600}
.mzq-ok.bon{color:#2e7d32}.mzq-ok.mauvais{color:#b3261e}
.mzq-plats{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mzq-plats span{display:inline-flex;align-items:center;gap:5px;font-size:.74rem;border:1px solid var(--line);border-radius:999px;padding:4px 10px 4px 7px;color:var(--ink-soft);background:#fff}
.mzq-plats svg{width:15px;height:15px;flex:none}
.mzq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.mzq-opt{font:inherit;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:10px 6px 8px;cursor:pointer;display:flex;
flex-direction:column;align-items:center;gap:6px;font-size:.82rem;font-weight:600;color:var(--ink);text-align:center;min-width:0}
.mzq-opt svg{width:52px;height:44px}
.mzq-opt small{font-weight:500;color:var(--ink-soft);font-size:.72rem;line-height:1.3}
.mzq-opt[aria-pressed=true]{border-color:#c9a24b;background:#fbf6ea;box-shadow:0 0 0 2px rgba(201,162,75,.25)}
.mzq-champ{margin-top:10px}
.mzq-champ label{display:flex;justify-content:space-between;font-size:.82rem;font-weight:600;margin-bottom:4px}
.mzq-champ label small{font-weight:500;color:var(--ink-soft)}
.mzq-champ input,.mzq-champ select{width:100%;box-sizing:border-box;font:inherit;font-size:.9rem;border:1.5px solid var(--line);border-radius:10px;padding:9px 12px;background:#fff;color:var(--ink)}
.mzq-sum{font-size:.86rem;line-height:1.7;margin:0;padding:0;list-style:none}
.mzq-sum li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed var(--line)}
.mzq-sum li span:last-child{font-weight:600;text-align:right;min-width:0;overflow-wrap:anywhere}
.mzq-tot{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;font-weight:700}
.mzq-tot b{font-size:1.35rem;color:#a98935}
.mzq-manque{font-size:.8rem;color:#b3261e;margin:8px 0 0}
.mzq-cart{width:100%;margin-top:10px}
.mzq-cart[disabled]{opacity:.45;cursor:not-allowed}
.mzq-atelier{margin:34px auto 0;padding:18px clamp(16px,4vw,40px) 26px;border-top:3px solid #2b2620;background:#faf7f0}
.mzq-atelier h2{font-size:1.15rem;margin:0 0 4px}
.mzq-atelier p{font-size:.86rem;color:var(--ink-soft);margin:0 0 10px;max-width:70ch}
.mzq-fichier{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;overflow-x:auto}
.mzq-fichier svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto}
.mzq-faits{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.mzq-faits span{font-size:.78rem;background:#fff;border:1px solid var(--line);border-radius:999px;padding:4px 10px;overflow-wrap:anywhere;max-width:100%}
.mzq-faits span.vert{border-color:#9ccc9f;background:#eef8ee;color:#1f5f22;font-weight:600}
.mzq-faits span.rouge{border-color:#f0b3ae;background:#fdeeed;color:#8a1c14;font-weight:600}
.mzq-valider{margin-top:14px;font-size:.84rem;background:#fffbe9;border:1px solid #ecd99a;border-radius:12px;padding:10px 14px}
.mzq-valider li{margin:3px 0}
@media (max-width:900px){main>.container.product-layout,.mzq-atelier{padding-left:16px;padding-right:16px;box-sizing:border-box}
.mzq-left{display:contents}.mzq-stage{position:sticky;top:var(--mzq-top,0px);z-index:20;aspect-ratio:auto;height:36vh;margin:0 -16px;border-radius:0 0 var(--radius) var(--radius);border-left:0;border-right:0;box-shadow:0 8px 18px rgba(43,38,32,.12)}.mzq-scan{margin:10px 0 14px}}
"""

DESC = """<div class="product-desc"><p><strong>Votre chanson gravée sur du bois : on la scanne avec le téléphone, et elle se lance.</strong></p>
<p>La chanson de votre mariage, la musique de votre rencontre, la playlist d'un voyage : collez son lien, nous gravons un QR code sur une plaque ou un porte-clés en bois, avec un titre et une dédicace si vous le souhaitez. Un cadeau qui se garde et qui s'écoute.</p>
<h3>Comment ça marche</h3>
<ul><li>Dans votre appli de musique, touchez « Partager » puis « Copier le lien », et collez-le ici.</li>
<li>Le QR code apparaît sur l'aperçu : scannez-le avec votre téléphone pour vérifier que c'est la bonne chanson.</li>
<li>Fonctionne avec Spotify, Deezer, Apple Music, YouTube et SoundCloud : il suffit d'avoir le lien.</li></ul>
<h3>Dimensions</h3>
<ul><li>Plaque : 8 × 9 cm, 11 × 12,3 cm ou 15 × 16,8 cm.</li><li>Porte-clés : 5, 6 ou 7 cm de large, avec son anneau.</li>
<li>Contreplaqué de 3 mm d'épaisseur.</li></ul></div>
<div class="info-accordion"><details><summary>📏 Taille &amp; Matériaux</summary><div class="info-body">Taille &amp; Matériaux
- Plaque : 8 × 9 cm, 11 × 12,3 cm ou 15 × 16,8 cm.
- Porte-clés : 5 × 4,2 cm, 6 × 5 cm ou 7 × 5,8 cm, anneau fourni.
- Contreplaqué de 3 mm, QR code et textes gravés au laser dans notre atelier en France.</div></details>
<details><summary>✨ Personnalisation &amp; Entretien</summary><div class="info-body">Personnalisation &amp; Entretien
- Collez le lien de votre chanson, album ou playlist. Votre QR code est vérifié par notre atelier avant la gravure.
- Si la playlist devient privée ou est supprimée, le QR code ne mène plus à la musique : gardez-la publique.
- Entretien : un coup de chiffon sec suffit.</div></details>
<details><summary>🚚 Expédition &amp; Retour</summary><div class="info-body">Expédition &amp; Retour
- Expédié en lettre suivie, bien protégé.
- Produit personnalisé : non remboursable une fois la gravure lancée (droit de rétractation exclu, article L221-28).
- Un souci à la réception ? Écrivez-nous avec une photo, nous trouverons une solution ensemble.</div></details></div>"""

FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;700&family=Cinzel:wght@600&family=Cinzel+Decorative:wght@700&family=Montserrat:wght@600&family=Great+Vibes&family=Allura&family=Pacifico&display=swap"

HTML = f"""<title>Musique à scanner</title>
<link rel="stylesheet" href="{FONTS}">
<style>{css}</style><style>{CSS_MAQ}</style>
<div class="mzq-bandeau"><b>Maquette — rien n'est en ligne.</b> Plaque et porte-clés « musique à scanner », sur le modèle du générateur d'Atomm (sans le code Spotify, interdit à la vente).</div>
{header}
<main>
<nav class="container" style="padding-top:14px;font-size:.84rem;color:var(--ink-soft)"><a href="#">Boutique</a> / <a href="#">Petits cadeaux</a></nav>
<div class="container product-layout">
  <div class="mzq-left">
    <div class="mzq-stage" id="stage" data-vue="face">
      <span class="mzq-tag">Votre création</span>
      <div class="mzq-tools"><button type="button" id="bFace" aria-pressed="true">De face</button><button type="button" id="bRelief" aria-pressed="false">En relief</button></div>
      <svg id="svg" aria-label="Aperçu de votre création"></svg>
      <span class="mzq-ex" id="exTag">Exemple : collez votre lien</span>
    </div>
    <div class="mzq-scan">📱 <b>Testez-le :</b> scannez l'aperçu avec l'appareil photo de votre téléphone, la chanson doit s'ouvrir. C'est ce QR code qui sera gravé.</div>
  </div>
  <div class="product-info">
    <h1>Plaque et porte-clés musique à scanner, gravés sur bois</h1>
    <p style="color:var(--ink-soft);margin-top:0">Votre chanson préférée, à scanner avec le téléphone : un QR code gravé sur bois, avec votre dédicace.</p>
    <div class="price-lead" id="prixLead"></div>

    <section class="mzq-step"><h3><span class="mzq-n">1</span>Votre chanson</h3>
      <div class="mzq-lien"><input type="url" id="lien" inputmode="url" autocomplete="off" placeholder="Collez ici le lien de votre chanson"><button type="button" id="coller">Coller</button></div>
      <div class="mzq-ok" id="ok"></div>
      <div class="mzq-plats" aria-label="Plateformes acceptées"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>Spotify</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#A238FF" d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19v-3.03H0zm6.27 0v3.029h5.189v-3.03h-5.19zm6.271 0v3.029h5.19v-3.03h-5.19zm6.27 0v3.029H24v-3.03h-5.19Z"/></svg>Deezer</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FA243C" d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z"/></svg>Apple Music</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTube</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF5500" d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z"/></svg>SoundCloud</span></div>
      <p class="mzq-sub">Dans votre appli de musique : « Partager » puis « Copier le lien ». Une chanson, un album ou une playlist (publique).</p>
    </section>

    <section class="mzq-step"><h3><span class="mzq-n">2</span>Le modèle</h3>
      <div class="mzq-grid" id="modeles"></div>
    </section>

    <section class="mzq-step"><h3><span class="mzq-n">3</span>La taille</h3>
      <div class="mzq-grid" id="tailles"></div>
      <p class="mzq-sub" id="tailleP"></p>
      <div id="mqBloc" hidden><p class="mzq-sub" style="font-weight:700;color:var(--ink)">Couleur du mousqueton <small style="font-weight:500;color:var(--ink-soft)">· même prix</small></p><div class="mzq-mq" id="mousq"></div></div>
    </section>

    <section class="mzq-step" id="etTextes"><h3><span class="mzq-n">4</span>Vos textes <small style="font:500 .78rem Inter,sans-serif;color:var(--ink-soft)">(facultatif, compris)</small></h3>
      <div class="mzq-champ"><label for="titre">Titre <small id="cTitre">0 / 28</small></label><input id="titre" maxlength="28" placeholder="Ex. Notre chanson"></div>
      <div class="mzq-champ"><label for="dedi">Dédicace <small id="cDedi">0 / 36</small></label><input id="dedi" maxlength="36" placeholder="Ex. Léa &amp; Tom · 14.06.2025"></div>
      <div class="mzq-champ"><label for="police">Écriture</label><select id="police"></select></div>
      <div class="mzq-champ"><label><span><input type="checkbox" id="scanTxt" checked style="width:auto;margin:0 6px 0 0;vertical-align:-2px">Graver « Scannez pour écouter »</span></label></div>
    </section>

    <section class="mzq-step" id="etRes"><h3><span class="mzq-n" id="nRes">5</span>Votre création</h3>
      <ul class="mzq-sum" id="resume"></ul>
      <div class="mzq-tot"><span>Total</span><b id="total"></b></div>
      <div class="qty-row" style="margin-top:10px"><button type="button" class="btn btn-gold mzq-cart" id="panier">Ajouter au panier</button></div>
      <p class="mzq-manque" id="manque"></p>
    </section>
    {trust}
    <div class="pd-perso"><b>✦ Pièce personnalisée</b><p>🕒 Gravée à la commande dans notre atelier, puis expédiée en lettre suivie.</p></div>
    {DESC}
  </div>
</div>
<section class="mzq-atelier">
  <h2>De votre côté : le fichier que l'atelier reçoit</h2>
  <p>Fichier à la taille réelle, en millimètres, contreplaqué 3 mm. Rouge = découpe (contour et trou de l'anneau), noir = gravure (QR code et textes). Le lien est écrit en clair et le QR est relu par la page : scannez quand même le fichier avant de graver.</p>
  <div class="mzq-fichier" id="fichier"></div>
  <div class="mzq-faits" id="faits"></div>
  <div class="mzq-valider"><b>À valider par vous :</b><ul>
    <li>les prix proposés : plaque 17,90 / 22,90 / 27,90 € (petite, moyenne, grande) ; porte-clés 16,90 / 17,90 / 18,90 € (relevés au niveau des ateliers français, demande du gérant du 26/11) ;</li>
    <li>les tailles : plaque 8, 11 ou 15 cm de large ; porte-clés 5, 6 ou 7 cm (pas plus petit, sinon le QR devient difficile à lire) ;</li>
    <li>le nom du produit (sans le mot « Spotify », qui est une marque) et le rayon « Petits cadeaux » ;</li>
    <li>le porte-clés « vague de son » d'Atomm n'est pas repris : les codes Spotify officiels sont interdits sur des produits vendus.</li>
  </ul></div>
</section>
{confiance}
</main>
{footer}
<script>{QR}</script>
<script>{JSQR}</script>
<script>window.MQ={json.dumps(DONNEES, ensure_ascii=False)};</script>
<script>
(function(){{
const D=window.MQ, NS="http://www.w3.org/2000/svg", $=id=>document.getElementById(id);
const S={{lien:"", modele:"plaque", tl:"m", titre:"", dedi:"", police:"playfair", scan:true, vue:"face", mq:"argente"}};
const eur=v=>v.toFixed(2).replace(".",",")+"\\u00a0€";
const cm=v=>(Math.round(v)/10).toFixed(1).replace(".0","").replace(".",",");
const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// ---------- lien ----------
const PLATS=[[/(^|\\.)spotify\\.com$|^spotify\\.link$/,"Spotify"],[/(^|\\.)deezer\\.com$|^deezer\\.page\\.link$|^link\\.deezer\\.com$/,"Deezer"],
 [/^music\\.apple\\.com$/,"Apple Music"],[/(^|\\.)youtube\\.com$|^youtu\\.be$/,"YouTube"],[/(^|\\.)soundcloud\\.com$/,"SoundCloud"]];
function lireLien(t){{
  t=(t||"").trim(); if(!t) return null;
  const m=t.match(/https?:\\/\\/\\S+/); if(m) t=m[0];
  if(/^spotify:/.test(t)){{const p=t.split(":");if(p.length>=3) t=`https://open.spotify.com/${{p[1]}}/${{p[2]}}`;}}
  let u; try{{u=new URL(t.startsWith("http")?t:"https://"+t);}}catch(e){{return {{ok:false}};}}
  const h=u.hostname.replace(/^www\\./,""), p=PLATS.find(([r])=>r.test(h));
  if(!p) return {{ok:false}};
  ["si","utm_source","utm_medium","utm_campaign","feature","pp"].forEach(k=>u.searchParams.delete(k));
  let s=u.toString().replace(/\\?$/,"");
  return {{ok:true, plat:p[1], url:s}};
}}
const lienActif=()=>{{const l=lireLien(S.lien);return l&&l.ok?l:null;}};
const urlQR=()=>(lienActif()||{{url:D.exemple}}).url;

// ---------- QR ----------
function matrice(txt){{const q=qrcode(0,"M");q.addData(txt);q.make();const n=q.getModuleCount(),m=[];for(let r=0;r<n;r++){{m.push([]);for(let c=0;c<n;c++)m[r].push(q.isDark(r,c));}}return m;}}
function qrPath(m,x,y,taille){{
  const n=m.length, s=taille/n; let d="";
  for(let r=0;r<n;r++){{let c=0;while(c<n){{if(!m[r][c]){{c++;continue;}}let e=c;while(e<n&&m[r][e])e++;
    d+=`M${{(x+c*s).toFixed(3)}} ${{(y+r*s).toFixed(3)}}h${{((e-c)*s).toFixed(3)}}v${{s.toFixed(3)}}h${{(-(e-c)*s).toFixed(3)}}z`;c=e;}}}}
  return d;
}}

// ---------- géométrie (mm) ----------
const tailles=()=>D.tailles[S.modele==="porte"?"porte":"plaque"];
const taille=()=>tailles().find(t=>t.id===S.tl)||tailles()[1];
const police=()=>D.polices.find(p=>p[0]===S.police);
function geo(){{
  const W=taille().w;
  if(S.modele==="porte"){{
    const B=W*.833, tab=W-B, th=B*.36, hole=W*.08, r=B*.08;
    const contour=`M${{r}} 0H${{B-r}}A${{r}} ${{r}} 0 0 1 ${{B}} ${{r}}V${{(B-th)/2}}H${{B+tab-th/2}}A${{th/2}} ${{th/2}} 0 0 1 ${{B+tab-th/2}} ${{(B+th)/2}}H${{B}}V${{B-r}}A${{r}} ${{r}} 0 0 1 ${{B-r}} ${{B}}H${{r}}A${{r}} ${{r}} 0 0 1 0 ${{B-r}}V${{r}}A${{r}} ${{r}} 0 0 1 ${{r}} 0Z`;
    const q=B*.78;
    return {{w:W,h:B,contour,trou:{{cx:B+tab-th/2,cy:B/2,r:hole/2}},qr:{{x:(B-q)/2,y:(B-q)/2,t:q}},textes:[]}};
  }}
  const H=W*1.121, r=W*.06, contour=`M${{r}} 0H${{W-r}}A${{r}} ${{r}} 0 0 1 ${{W}} ${{r}}V${{H-r}}A${{r}} ${{r}} 0 0 1 ${{W-r}} ${{H}}H${{r}}A${{r}} ${{r}} 0 0 1 0 ${{H-r}}V${{r}}A${{r}} ${{r}} 0 0 1 ${{r}} 0Z`;
  const T=[], f=police()[2], scan=S.scan?"SCANNEZ POUR ÉCOUTER":"";
  if(S.modele==="plaque"){{
    const q=W*.6, y0=W*.2;
    T.push({{ligne:[W*.1,W*.075,W*.9,W*.075]}});
    if(scan) T.push({{t:scan,x:W/2,y:W*.15,s:W*.048,f:"Inter,sans-serif",w:700,ls:W*.004}});
    if(S.titre) T.push({{t:S.titre,x:W/2,y:W*.92,s:W*.075,f,w:600}});
    if(S.dedi) T.push({{t:S.dedi,x:W/2,y:W*1.015,s:W*.045,f:"Inter,sans-serif",w:500}});
    return {{w:W,h:H,contour,qr:{{x:(W-q)/2,y:y0+(S.titre||S.dedi?0:W*.06),t:q}},textes:T}};
  }}
  const q=W*.58;
  T.push({{note:true,x:W*.08,y:W*.07,s:W*.15}});
  if(S.titre) T.push({{t:S.titre,x:W*.27,y:W*.14,s:W*.07,f,w:600,a:"start"}});
  if(S.dedi) T.push({{t:S.dedi,x:W*.27,y:W*.205,s:W*.042,f:"Inter,sans-serif",w:500,a:"start"}});
  if(scan) T.push({{t:scan,x:W/2,y:W*1.055,s:W*.048,f:"Inter,sans-serif",w:700,ls:W*.004}});
  return {{w:W,h:H,contour,qr:{{x:(W-q)/2,y:W*.28,t:q}},textes:T}};
}}
const NOTE="M0.05 0.888A0.17 0.12 -20 1 1 0.37 0.772A0.17 0.12 -20 1 1 0.05 0.888ZM0.335 0.80V0.27H0.375V0.80ZM0.875 0.69V0.15H0.915V0.69ZM0.335 0.36V0.25L0.915 0.12V0.23ZM0.59 0.768A0.17 0.12 -20 1 1 0.91 0.652A0.17 0.12 -20 1 1 0.59 0.768Z";
function noteD(x,y,s){{return `<path transform="translate(${{x}} ${{y}}) scale(${{s}})" d="${{NOTE}}" fill="CLR"/>`;}}
function texteSvg(t,clr,maxW){{
  if(t.ligne) return `<line x1="${{t.ligne[0]}}" y1="${{t.ligne[1]}}" x2="${{t.ligne[2]}}" y2="${{t.ligne[3]}}" stroke="${{clr}}" stroke-width="${{taille().w*.008}}"/>`;
  if(t.note) return noteD(t.x,t.y,t.s).replace("CLR",clr);
  return `<text x="${{t.x}}" y="${{t.y}}" text-anchor="${{t.a||"middle"}}" font-family="${{esc(t.f)}}" font-weight="${{t.w||400}}" font-size="${{t.s}}" letter-spacing="${{t.ls||0}}" fill="${{clr}}" data-max="${{maxW}}">${{esc(t.t)}}</text>`;
}}
function ajuster(svg,maxW){{svg.querySelectorAll("text[data-max]").forEach(e=>{{const w=e.getComputedTextLength?e.getComputedTextLength():0, m=+e.dataset.max*(e.getAttribute("text-anchor")==="start"?.7:1);if(w>m&&w>0){{e.setAttribute("textLength",m);e.setAttribute("lengthAdjust","spacingAndGlyphs");}}}});}}

// ---------- mousqueton du porte-clés (photo du gérant, 7 couleurs, même prix) ----------
const mqChoix=()=>D.mousquetons.find(m=>m.id===S.mq)||D.mousquetons[0];
const MQL=38;
function mqDim(){{const m=mqChoix();return {{L:MQL,W:MQL*m.r}};}}
function mqAx(g){{return g.trou.cx-mqDim().W*0.05;}}
function mqExtra(g){{return Math.max(0,mqAx(g)+MQL-g.w);}}
function mousqSvg(g){{const m=mqChoix(),d=mqDim();return `<g transform="translate(${{mqAx(g)}} ${{g.trou.cy}}) rotate(90)"><image href="${{m.img}}" x="${{-d.W/2}}" y="${{-d.L}}" width="${{d.W}}" height="${{d.L}}" preserveAspectRatio="none"/></g>`;}}
function rendreMq(){{$("mqBloc").hidden=S.modele!=="porte";$("mousq").innerHTML=D.mousquetons.map(m=>`<button type="button" data-v="${{m.id}}" aria-pressed="${{S.mq===m.id}}"><img src="${{m.img}}" alt=""><span>${{m.nom}}</span></button>`).join("");$("mousq").querySelectorAll("button").forEach(b=>b.onclick=()=>{{S.mq=b.dataset.v;rendreMq();dessiner();}});}}

// ---------- aperçu ----------
function dessiner(){{
  const g=geo(), m=matrice(urlQR()), pad=Math.max(g.w,g.h)*.04;
  const svg=$("svg"); svg.setAttribute("viewBox",`${{-pad}} ${{-pad}} ${{g.w+2*pad+0}} ${{g.h+2*pad}}`);
  const clr="#3a2614", maxW=g.w*.86;
  svg.innerHTML=`<defs><linearGradient id="bois" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecd3a8"/><stop offset=".5" stop-color="#e2c393"/><stop offset="1" stop-color="#d9b682"/></linearGradient>
   <pattern id="fil" width="${{g.w}}" height="${{g.h/7}}" patternUnits="userSpaceOnUse"><path d="M0 ${{g.h/14}} C ${{g.w*.3}} ${{g.h/20}}, ${{g.w*.6}} ${{g.h/10}}, ${{g.w}} ${{g.h/14}}" stroke="#b98d55" stroke-opacity=".18" stroke-width="${{g.w*.004}}" fill="none"/></pattern>
   <filter id="omb" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="${{g.w*.012}}" stdDeviation="${{g.w*.012}}" flood-color="#4b3214" flood-opacity=".35"/></filter></defs>
   <g filter="url(#omb)"><path d="${{g.contour}}" fill="url(#bois)"/></g><path d="${{g.contour}}" fill="url(#fil)"/>
   ${{g.trou?`<circle cx="${{g.trou.cx}}" cy="${{g.trou.cy}}" r="${{g.trou.r}}" fill="#e7dccb" stroke="#9c6b3f" stroke-width="${{g.w*.006}}"/><circle cx="${{g.trou.cx}}" cy="${{g.trou.cy}}" r="${{g.trou.r*1.9}}" fill="none" stroke="#b9b9b9" stroke-width="${{g.w*.02}}"/>`:""}}
   <path d="${{qrPath(m,g.qr.x,g.qr.y,g.qr.t)}}" fill="${{clr}}" fill-opacity=".92"/>
   ${{g.textes.map(t=>texteSvg(t,clr,maxW)).join("")}}
   <path d="${{g.contour}}" fill="none" stroke="#9c6b3f" stroke-width="${{g.w*.005}}"/>`;
  ajuster(svg,maxW);
  $("exTag").hidden=!!lienActif();
  fichier(g,m); resume();
}}

// ---------- fichier de l'atelier ----------
function fichier(g,m){{
  const M=4, W=g.w+2*M, H=g.h+2*M+8;
  let s=`<svg xmlns="${{NS}}" viewBox="${{-M}} ${{-M}} ${{W}} ${{H}}" width="${{W}}mm" height="${{H}}mm"><rect x="${{-M}}" y="${{-M}}" width="${{W}}" height="${{H}}" fill="#fff"/>`
   +`<path d="${{qrPath(m,g.qr.x,g.qr.y,g.qr.t)}}" fill="#000"/>`+g.textes.map(t=>texteSvg(t,"#000",g.w*.86)).join("")
   +`<path d="${{g.contour}}" fill="none" stroke="#ff0000" stroke-width=".2"/>`
   +(g.trou?`<circle cx="${{g.trou.cx}}" cy="${{g.trou.cy}}" r="${{g.trou.r}}" fill="none" stroke="#ff0000" stroke-width=".2"/>`:"")
   +`<text x="0" y="${{g.h+6}}" font-size="${{Math.min(3,g.w*.034)}}" fill="#777" font-family="Inter,sans-serif">${{g.w}} × ${{g.h.toFixed(1).replace(".",",")}} mm · rouge = découpe · noir = gravure</text></svg>`;
  $("fichier").innerHTML=s;
  ajuster($("fichier").querySelector("svg"),g.w*.86);
  const l=lienActif(), mod=D.modeles.find(x=>x.id===S.modele);
  const faits=[`Modèle : ${{mod.nom}}`,`Taille : ${{taille().nom}} ${{g.w}} × ${{g.h.toFixed(1).replace(".",",")}} mm`,`Bois : contreplaqué 3 mm`,`QR : ${{m.length}} × ${{m.length}} carrés de ${{(g.qr.t/m.length).toFixed(2).replace(".",",")}} mm`,
    l?`Lien (${{l.plat}}) : ${{l.url}}`:"Lien : exemple, la cliente n'a pas encore collé le sien"];
  if(S.modele!=="porte"){{if(S.titre)faits.push(`Titre : « ${{S.titre}} »`);if(S.dedi)faits.push(`Dédicace : « ${{S.dedi}} »`);if(S.titre||S.dedi)faits.push(`Écriture : ${{police()[1]}}`);}}
  if(S.modele==="porte")faits.push(`Mousqueton : ${{mqChoix().nom}}`);
  $("faits").innerHTML=faits.map(t=>`<span>${{esc(t)}}</span>`).join("")+`<span id="verif">Vérification du QR…</span>`;
  verifier(m,l);
}}
function verifier(m,l){{
  try{{const n=m.length, k=8, q=4, N=(n+2*q)*k, c=document.createElement("canvas");c.width=c.height=N;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,N,N);x.fillStyle="#000";
    for(let r=0;r<n;r++)for(let j=0;j<n;j++)if(m[r][j])x.fillRect((j+q)*k,(r+q)*k,k,k);
    const res=jsQR(x.getImageData(0,0,N,N).data,N,N), v=$("verif"), attendu=urlQR();
    if(res&&res.data===attendu){{v.className="vert";v.textContent=l?"✓ QR vérifié : il ouvre bien ce lien":"✓ QR lisible (exemple)";}}
    else{{v.className="rouge";v.textContent="✗ QR illisible : ne pas graver";}}
  }}catch(e){{}}
}}

// ---------- panneau ----------
function iconeModele(id){{
  if(id==="porte") return `<svg viewBox="0 0 52 44"><path d="M8 6h26a3 3 0 0 1 3 3v8h7a5 5 0 0 1 0 10h-7v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/><circle cx="44" cy="22" r="2" fill="#fff" stroke="#9c6b3f"/><rect x="11" y="12" width="20" height="20" fill="#3a2614" opacity=".75"/></svg>`;
  const carte=id==="carte";
  return `<svg viewBox="0 0 52 44"><rect x="12" y="2" width="28" height="40" rx="3" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/>${{carte?`<path transform="translate(15 5) scale(6)" d="${{NOTE}}" fill="#3a2614"/><rect x="22" y="7" width="13" height="2" fill="#3a2614"/>`:`<rect x="16" y="6" width="20" height="1.4" fill="#3a2614"/>`}}<rect x="17" y="${{carte?14:11}}" width="18" height="18" fill="#3a2614" opacity=".75"/>${{carte?"":`<rect x="18" y="34" width="16" height="2" fill="#3a2614"/>`}}</svg>`;
}}
function boutons(id,items,cle,fn){{
  $(id).innerHTML=items.map(o=>`<button type="button" class="mzq-opt" data-v="${{o.v}}" aria-pressed="${{S[cle]===o.v}}">${{o.icon||""}}<span>${{o.t}}</span>${{o.s?`<small>${{o.s}}</small>`:""}}</button>`).join("");
  $(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{{S[cle]=b.dataset.v;$(id).querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));if(fn)fn();dessiner();}});
}}
function rendreTailles(){{
  const porte=S.modele==="porte";rendreMq();
  boutons("tailles",tailles().map(t=>{{const h=porte?t.w*.833:t.w*1.121;return {{v:t.id,t:t.nom,s:`${{cm(t.w)}} × ${{cm(h)}} cm · ${{eur(t.prix)}}`,
    icon:`<svg viewBox="0 0 52 44"><rect x="${{26-11*t.w/(porte?70:150)}}" y="${{22-11*t.w/(porte?70:150)}}" width="${{22*t.w/(porte?70:150)}}" height="${{22*t.w/(porte?70:150)}}" rx="2" fill="#ecd3a8" stroke="#9c6b3f" stroke-width="1.6"/></svg>`}};}}),"tl");
}}
function resume(){{
  const t=taille(), g=geo(), l=lienActif(), mod=D.modeles.find(x=>x.id===S.modele), m=matrice(urlQR());
  $("prixLead").textContent=eur(t.prix);
  $("tailleP").textContent=`QR code de ${{cm(g.qr.t)}} cm de côté.`+(S.modele==="porte"?" Le mousqueton est fourni, dans la couleur choisie ci-dessous.":"");
  const L=[["Chanson",l?`lien ${{l.plat}}`:"à coller"],["Modèle",mod.nom],["Taille",`${{t.nom}} · ${{cm(g.w)}} × ${{cm(g.h)}} cm`],["Bois","contreplaqué, 3 mm"]];if(S.modele==="porte")L.push(["Mousqueton",mqChoix().nom]);
  if(S.modele!=="porte"){{L.push(["Titre",S.titre||"aucun"]);L.push(["Dédicace",S.dedi||"aucune"]);if(S.titre||S.dedi)L.push(["Écriture",police()[1]]);}}
  $("resume").innerHTML=L.map(([a,b])=>`<li><span>${{a}}</span><span>${{esc(b)}}</span></li>`).join("");
  $("total").textContent=eur(t.prix);
  $("panier").disabled=!l; $("manque").textContent=l?"":"Il manque le lien de votre chanson : collez-le à l'étape 1.";
  $("etTextes").hidden=S.modele==="porte"; $("nRes").textContent=S.modele==="porte"?"4":"5";
}}
function majLien(){{
  S.lien=$("lien").value; const l=lireLien(S.lien), o=$("ok");
  if(!l){{o.className="mzq-ok";o.textContent="";}}
  else if(l.ok){{o.className="mzq-ok bon";o.textContent=`✓ Lien ${{l.plat}} reconnu : le QR code est sur l'aperçu.`;}}
  else{{o.className="mzq-ok mauvais";o.textContent="Ce lien n'est pas un lien de musique (Spotify, Deezer, Apple Music, YouTube, SoundCloud). Vérifiez-le.";}}
  dessiner();
}}
$("lien").oninput=majLien;
$("coller").onclick=async()=>{{try{{const t=await navigator.clipboard.readText();$("lien").value=t;majLien();}}catch(e){{$("lien").focus();$("ok").className="mzq-ok";$("ok").textContent="Appuyez longuement dans la case, puis « Coller ».";}}}};
for(const [id,c,cle] of [["titre","cTitre","titre"],["dedi","cDedi","dedi"]]) $(id).oninput=e=>{{S[cle]=e.target.value;$(c).textContent=`${{S[cle].length}} / ${{e.target.maxLength}}`;dessiner();}};
$("police").innerHTML=D.polices.map(p=>`<option value="${{p[0]}}" style="font-family:${{esc(p[2])}}">${{p[1]}}</option>`).join("");
$("police").onchange=e=>{{S.police=e.target.value;dessiner();}};
$("scanTxt").onchange=e=>{{S.scan=e.target.checked;dessiner();}};
$("bFace").onclick=()=>{{S.vue="face";$("stage").dataset.vue="face";$("bFace").setAttribute("aria-pressed",true);$("bRelief").setAttribute("aria-pressed",false);}};
$("bRelief").onclick=()=>{{S.vue="relief";$("stage").dataset.vue="relief";$("bRelief").setAttribute("aria-pressed",true);$("bFace").setAttribute("aria-pressed",false);}};
boutons("modeles",D.modeles.map(m=>({{v:m.id,t:m.nom,s:m.s,icon:iconeModele(m.id)}})),"modele",()=>{{rendreTailles();}});
rendreTailles();
function sousEntete(){{const h=document.querySelector('header');let t=0;if(h&&/sticky|fixed/.test(getComputedStyle(h).position))t=h.offsetHeight;document.documentElement.style.setProperty('--mzq-top',t+'px');}}
sousEntete();window.addEventListener('resize',sousEntete);
// sur téléphone : l'aperçu reste collé sous l'en-tête pendant les étapes, puis se décolle au résumé (comme le support de téléphone)
var attente=false;function decoller(){{attente=false;var st=$("stage"),e=$("etRes"),d=0;if(matchMedia("(max-width:900px)").matches){{var top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mzq-top"))||0;d=Math.min(0,e.getBoundingClientRect().top-(top+st.offsetHeight+8));d=Math.max(d,-(top+st.offsetHeight+30));}}st.style.transform=d?"translateY("+Math.round(d)+"px)":"";st.style.visibility=d<=-st.offsetHeight?"hidden":"";}}
window.addEventListener("scroll",function(){{if(!attente){{attente=true;requestAnimationFrame(decoller)}}}},{{passive:true}});window.addEventListener("resize",decoller);
dessiner(); if(document.fonts) document.fonts.ready.then(dessiner);
}})();
</script>
"""

open(sortie, "w", encoding="utf-8").write(HTML)
print(sortie, round(len(HTML) / 1e6, 2), "Mo")
