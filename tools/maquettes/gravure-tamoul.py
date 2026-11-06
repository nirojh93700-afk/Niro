#!/usr/bin/env python3
"""Maquette (06/11/2026) : verres et bijoux du site gravés avec un texte en TAMOUL traditionnel,
rendus PAR LE SITE LUI-MÊME (aperçu de chaque fiche en local, texte tamoul tapé dans le champ, capture).
Usage : python3 tools/maquettes/gravure-tamoul.py <dossier des captures> <sortie.html>
Captures : `npx next start -p 3140` + `node capture2.cjs` (scratchpad, Playwright : ouvre /produit/<slug>, choisit
« Mon propre texte », tape le texte, pousse le curseur de taille au maximum, capture .gallery-main ; bijoux à aperçu 3D :
capture du canvas[data-apercu3d]) → recadrées sur le produit → <dossier>/<id>.jpg. Polices Noto Tamil installées dans
~/.fonts pour que Chromium trouve les lettres tamoules (les 8 écritures du site ne les ont pas). Rien n'est touché sur le site.
"""
import base64, io, os, sys
from PIL import Image

CAP, OUT = sys.argv[1], sys.argv[2]

PHRASES = {
  "anniv":   ("பிறந்தநாள் வாழ்த்துகள்", "Piṟantanāḷ vāḻttukaḷ", "Joyeux anniversaire", "Anniversaire", ""),
  "noel":    ("இனிய கிறிஸ்துமஸ் வாழ்த்துகள்", "Iṉiya kiṟistumas vāḻttukaḷ", "Joyeux Noël", "Noël", "pas dans le rapport : formule composée, à relire"),
  "deepa":   ("இனிய தீபாவளி நல்வாழ்த்துகள்", "Iṉiya tīpāvaḷi nalvāḻttukaḷ", "Joyeux Deepavali", "Deepavali (fête des lumières, oct.–nov.)", ""),
  "pongal":  ("இனிய பொங்கல் நல்வாழ்த்துகள்", "Iṉiya poṅkal nalvāḻttukaḷ", "Joyeux Pongal", "Pongal (fête des moissons, mi-janvier)", ""),
  "puthandu":("இனிய தமிழ் புத்தாண்டு நல்வாழ்த்துகள்", "Iṉiya tamiḻ puttāṇṭu nalvāḻttukaḷ", "Bonne année tamoule", "Nouvel An tamoul (mi-avril)", ""),
  "mariage": ("திருமண நல்வாழ்த்துகள்", "Tirumaṇa nalvāḻttukaḷ", "Félicitations pour votre mariage", "Mariage", ""),
  "vazhka":  ("வாழ்க வளமுடன்", "Vāḻka vaḷamuṭaṉ", "Vivez dans la prospérité (bénédiction)", "Bénédiction, toutes occasions", ""),
  "nandri":  ("நன்றி", "Naṉṟi", "Merci", "Remerciement", ""),
  "amma":    ("அம்மா", "Ammā", "Maman", "Fête des mères, anniversaire", ""),
  "appa":    ("அப்பா", "Appā", "Papa", "Fête des pères, anniversaire", ""),
  "best-amma":("உலகின் சிறந்த அம்மா", "Ulakiṉ ciṟanta ammā", "La meilleure maman du monde", "Fête des mères", "à relire"),
  "best-appa":("உலகின் சிறந்த அப்பா", "Ulakiṉ ciṟanta appā", "Le meilleur papa du monde", "Fête des pères", "à relire"),
  "anbu":    ("அன்பு", "Aṉpu", "Amour", "Amoureux, famille", ""),
  "anbe":    ("என் அன்பே", "Eṉ aṉpē", "Mon amour", "Amoureux", ""),
  "uyire":   ("என் உயிரே", "Eṉ uyirē", "Ma vie (mot doux très courant)", "Amoureux", ""),
  "kadhal":  ("உன்னை காதலிக்கிறேன்", "Uṉṉai kātalikkiṟēṉ", "Je t'aime", "Amoureux, Saint-Valentin", ""),
  "enrendrum":("என்றென்றும்", "Eṉṟeṉṟum", "Pour toujours", "Amoureux, mariage", ""),
  "thangam": ("தங்கம்", "Taṅkam", "« Mon or » (mot tendre)", "Amoureux, enfant", ""),
  "sellam":  ("என் செல்லம்", "Eṉ cellam", "Mon chéri, mon petit trésor", "Bébé, enfant", ""),
}

# id = fichier de capture · prod = fiche du site · key = phrase · fond = couleur de fond de la capture
ITEMS = [
  dict(id="whisky", prod="Verre à whisky gravé", slug="verre-a-whisky-grave", key="anniv", groupe="verres"),
  dict(id="cocktail", prod="Verre à cocktail gravé", slug="verre-a-cocktail-grave", key="noel", groupe="verres"),
  dict(id="vin", prod="Verre à vin gravé", slug="verre-a-vin-grave", key="deepa", groupe="verres"),
  dict(id="flute", prod="Flûte à champagne gravée", slug="flute-a-champagne-gravee", key="mariage", groupe="verres"),
  dict(id="carafe", prod="Carafe à whisky gravée", slug="carafe-a-whisky-gravee", key="pongal", groupe="verres"),
  dict(id="tumbler", prod="Verre tumbler en cristal gravé", slug="verre-tumbler-cristal-grave", key="puthandu", groupe="verres"),
  dict(id="whisky-court", prod="Verre à whisky gravé", slug="verre-a-whisky-grave", key="appa", groupe="courts"),
  dict(id="tumbler-court", prod="Verre tumbler en cristal gravé", slug="verre-tumbler-cristal-grave", key="nandri", groupe="courts"),
  dict(id="vin-court", prod="Verre à vin gravé", slug="verre-a-vin-grave", key="anbu", groupe="courts"),
  dict(id="plaque", prod="Collier Plaque acier gravé (doré)", slug="collier-plaque-acier", key="amma", groupe="bijoux"),
  dict(id="gourmette", prod="Bracelet Homme Identité (gourmette)", slug="bracelet-homme-identite-gourmette", key="appa", groupe="bijoux"),
  dict(id="chaine", prod="Bracelet homme chaîne acier", slug="bracelet-homme-chaine-acier", key="best-appa", groupe="bijoux"),
  dict(id="silicone", prod="Bracelet homme acier & silicone", slug="bracelet-homme-acier-silicone", key="appa", groupe="bijoux"),
  dict(id="papillon", prod="Bracelet femme papillon ajouré", slug="bracelet-femme-papillon", key="anbe", groupe="bijoux"),
]

def uri(path):
    im = Image.open(path).convert("RGB"); im.thumbnail((900, 900))
    o = io.BytesIO(); im.save(o, "JPEG", quality=84); return "data:image/jpeg;base64," + base64.b64encode(o.getvalue()).decode()

for it in ITEMS:
    ta, tr, sens, occ, note = PHRASES[it["key"]]
    it.update(img=uri(os.path.join(CAP, it["id"] + ".jpg")), ta=ta, tr=tr, sens=sens, occ=occ, note=note)

def card(it):
    note = f'<p class="note">⚠ {it["note"]}</p>' if it["note"] else ""
    return f"""<figure class="card rv">
  <img src="{it['img']}" alt="{it['prod']} : {it['sens']} en tamoul">
  <figcaption>
    <p class="prod"><a href="https://nivcreation.fr/produit/{it['slug']}" target="_blank" rel="noopener">{it['prod']}</a></p>
    <p class="ta" lang="ta">{it['ta']}</p>
    <p class="tr">{it['tr']}</p>
    <p class="sens">{it['sens']} · <span>{it['occ']}</span></p>{note}
  </figcaption>
</figure>"""

grp = lambda g: "".join(card(i) for i in ITEMS if i["groupe"] == g)
rows = ""
for k, (ta, tr, sens, occ, note) in PHRASES.items():
    prods = ", ".join(dict.fromkeys(i["prod"].split(" (")[0] for i in ITEMS if i["key"] == k)) or "—"
    n = f' <em class="note">⚠ {note}</em>' if note else ""
    rows += f'<tr><td lang="ta" class="ta">{ta}</td><td class="tr">{tr}</td><td>{sens}{n}</td><td>{occ}</td><td>{prods}</td></tr>'

html = f"""<meta charset="utf-8"><title>Gravure tamoule</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&family=Inter:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&display=swap">
<style>
:root{{--bg:#fbf7ee;--fg:#1a1206;--muted:#6b5e4a;--or:#c9a24b;--or2:#7c6120;--card:#ffffff;--line:#eadfc8;--encre:#1a1206;--sable:#f3e8d3}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#17120b;--fg:#f3e8d3;--muted:#c2b394;--or2:#e2c67e;--card:#231b10;--line:#3a2e1c;--sable:#2a2114;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#17120b;--fg:#f3e8d3;--muted:#c2b394;--or2:#e2c67e;--card:#231b10;--line:#3a2e1c;--sable:#2a2114;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;margin:0;padding-block:0 60px;padding-inline:16px;line-height:1.5}}
.wrap{{max-width:1120px;margin:0 auto}}
.bandeau{{background:var(--encre);color:#f3e8d3;margin:0 -16px;padding:34px 16px 30px;text-align:center}}
.bandeau h1{{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:clamp(1.7rem,4vw,2.6rem);margin:0 0 8px;text-wrap:balance}}
.bandeau h1 em{{font-style:italic;color:var(--or)}}
.bandeau p{{max-width:62ch;margin:0 auto;color:#d9c9a5;font-size:.98rem}}
.bandeau .ta{{font-family:'Noto Serif Tamil',serif;font-size:1.5rem;color:#fff;margin-top:12px}}
.kicker{{display:inline-block;border:1px solid var(--or);color:var(--or);border-radius:999px;padding:3px 12px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}}
h2{{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:1.6rem;margin:44px 0 6px;text-wrap:balance}}
h2 em{{font-style:italic;color:var(--or2)}}
.sub{{color:var(--muted);margin:0 0 18px;max-width:72ch}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}}
.card{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;min-width:0}}
.card img{{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#faf7f1}}
.card figcaption{{padding:12px 14px 14px}}
.prod{{margin:0;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}} .prod a{{color:inherit;text-decoration:none;border-bottom:1px dotted var(--or)}}
.ta{{font-family:'Noto Serif Tamil',serif;font-size:1.35rem;margin:4px 0 0;line-height:1.35}}
.tr{{margin:0;font-style:italic;color:var(--muted);font-size:.9rem}}
.sens{{margin:6px 0 0;font-size:.95rem}} .sens span{{color:var(--muted)}}
.note{{color:#b3261e;font-size:.82rem;margin:6px 0 0}}
table{{border-collapse:collapse;width:100%;font-size:.92rem;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}}
th,td{{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}}
th{{background:var(--sable);font-weight:600;font-size:.8rem;letter-spacing:.05em;text-transform:uppercase}}
td.ta{{font-size:1.15rem;white-space:nowrap}} td.tr{{font-style:italic;color:var(--muted)}}
.tablew{{overflow-x:auto;border-radius:14px}}
.avis{{background:var(--sable);border-radius:16px;padding:18px 20px;margin-top:18px}}
.avis h3{{margin:0 0 8px;font-size:1.05rem}} .avis ul{{margin:0;padding-left:20px}} .avis li{{margin:6px 0}}
@media (max-width:480px){{.grid{{grid-template-columns:1fr 1fr;gap:10px}} .card figcaption{{padding:10px}} .ta{{font-size:1.1rem}}}}
</style>
<div class="wrap">
<div class="bandeau">
  <span class="kicker">Maquette · rien n'est en ligne</span>
  <h1>Nos gravures en <em>tamoul</em></h1>
  <p>Chaque image est l'aperçu du SITE lui-même : la fiche ouverte, le texte tamoul tapé dans le champ « Mon propre texte », la taille poussée au maximum, exactement ce que la cliente verra avant de commander.</p>
  <p class="ta" lang="ta">வாழ்க வளமுடன்</p>
</div>

<h2>Les verres : <em>un vœu pour chaque fête</em></h2>
<p class="sub">Aperçu du site sur chaque verre. Une phrase longue sort petite : le site plafonne la taille du texte sur le verre. Le texte tamoul se compte comme n'importe quel texte gravé, au tarif de la fiche.</p>
<div class="grid">{grp("verres")}</div>

<h2>Un mot court : <em>plus grand, plus lisible</em></h2>
<p class="sub">Les mêmes verres avec un seul mot : la gravure prend toute la place que le site autorise.</p>
<div class="grid">{grp("courts")}</div>

<h2>Les bijoux : <em>pour les parents, pour les amoureux</em></h2>
<p class="sub">Aperçu 3D du site, tel que la cliente le fait tourner sur la fiche. Seuls les bijoux dont le site dessine l'aperçu 3D sont montrés ici.</p>
<div class="grid">{grp("bijoux")}</div>

<h2>Toutes les phrases <em>proposées</em></h2>
<p class="sub">Tamoul · prononciation · sens · occasion · produit. Les lignes marquées ⚠ sont de ma composition et demandent une relecture.</p>
<div class="tablew"><table>
<thead><tr><th>Tamoul</th><th>Prononciation</th><th>Sens</th><th>Occasion</th><th>Produit montré</th></tr></thead>
<tbody>{rows}</tbody></table></div>

<div class="avis">
  <h3>Ce que le site fait déjà, et ce qu'il faudra changer</h3>
  <ul>
    <li><b>Ça marche tel quel</b> sur les verres (whisky, cocktail, vin, flûte, carafe, tumbler) et sur les bijoux à plaque (plaque acier, gourmette, chaîne acier, silicone, papillon) : le texte tamoul se tape dans le champ, l'aperçu l'affiche, à condition que l'appareil de la cliente ait une police tamoule (iPhone, Android et Windows en ont une). Le fichier de gravure doit lui aussi avoir la police.</li>
    <li><b>Les 8 écritures du site n'ont pas les lettres tamoules</b> : l'aperçu retombe sur la police tamoule de l'appareil. Pour un rendu maîtrisé (fiche, atelier, gravure) : ajouter une 9ᵉ écriture « Tamoul » (Noto Serif Tamil, gratuite et libre).</li>
    <li><b>Collier Quatre Mots et pendentif géométrique : à corriger avant de les proposer en tamoul.</b> Le site empile les lettres une par une à la verticale ; en tamoul, les signes de voyelle se détachent (ரே devient ர + ே, avec un rond pointillé) : il faudra tourner le mot entier au lieu d'empiler les lettres.</li>
    <li><b>Cœur ouvrable, médaillon livre, enveloppe, gobelet</b> : pas montrés, leur aperçu n'affiche pas le texte dans la vue de départ (ou pas d'aperçu du texte sur la photo pour le gobelet).</li>
    <li><b>Relecture.</b> Les phrases viennent du rapport « Marché tamoul », sauf « Joyeux Noël » et « meilleur papa / meilleure maman du monde », composées par moi. Chaque texte est à faire relire avant la première gravure.</li>
  </ul>
</div>
</div>
"""
open(OUT, "w", encoding="utf-8").write(html)
print(OUT, len(html) // 1024, "Ko")
