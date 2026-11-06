#!/usr/bin/env python3
"""Maquette (06/11/2026) : verres et bijoux du site gravés avec un texte en TAMOUL traditionnel.
Usage : python3 tools/maquettes/gravure-tamoul.py <dossier polices Noto Tamil> <sortie.html>
Rien n'est touché sur le site : les photos VIERGES de public/produits/ reçoivent le texte en rendu
« gravé » (givré blanc sur le verre, sombre sur le métal, doré sur le gobelet crème).
Les polices (NotoSansTamil.ttf, NotoSerifTamil.ttf, variables) viennent de google/fonts (OFL).
"""
import base64, io, json, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONTS, OUT = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROD = os.path.join(ROOT, "public", "produits")

# ───────── Les phrases (tamoul · prononciation · sens · occasion · note) ─────────
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

# ───────── Où et comment poser le texte sur chaque photo ─────────
# cx, cy = centre du texte (fraction de la photo) · w, h = place maxi (fractions) · angle = rotation (° antihoraire)
# style : glass (givré blanc) · metal (gravé sombre) · gold (doré, gobelet crème)
ITEMS = [
  # ─ verres ─
  dict(id="whisky", prod="Verre à whisky gravé", photo="verre_a_whisky_grave_vide.jpg", lines=["பிறந்தநாள்", "வாழ்த்துகள்"], key="anniv",
       cx=.50, cy=.46, w=.50, h=.32, style="glass", font="serif", crop=(.05,.0,.95,1)),
  dict(id="cocktail", prod="Verre à cocktail gravé", photo="verre_a_cocktail_vierge.jpg", lines=["இனிய", "கிறிஸ்துமஸ்", "வாழ்த்துகள்"], key="noel",
       cx=.50, cy=.40, w=.27, h=.34, style="glass", font="serif", crop=(.2,0,.8,1)),
  dict(id="vin", prod="Verre à vin gravé", photo="verre_vin_vierge.jpg", lines=["இனிய தீபாவளி", "நல்வாழ்த்துகள்"], key="deepa",
       cx=.50, cy=.28, w=.38, h=.16, style="glass", font="serif", crop=(.1, .02, .9, .55)),
  dict(id="flute", prod="Flûte à champagne gravée", photo="flute_vierge.jpg", lines=["திருமண", "நல்வாழ்த்துகள்"], key="mariage",
       cx=.50, cy=.27, w=.33, h=.17, style="glass", font="serif", crop=(.15, .02, .85, .45)),
  dict(id="carafe", prod="Carafe à whisky gravée", photo="carafe_vierge.jpg", lines=["இனிய பொங்கல்", "நல்வாழ்த்துகள்"], key="pongal",
       cx=.50, cy=.58, w=.30, h=.18, style="glass", font="serif", crop=(.2,.1,.8,.95)),
  dict(id="tumbler", prod="Verre tumbler en cristal gravé", photo="verre_tumbler_37_vierge.jpg", lines=["இனிய தமிழ் புத்தாண்டு", "நல்வாழ்த்துகள்"], key="puthandu",
       cx=.50, cy=.40, w=.44, h=.22, style="glass", font="serif"),
  dict(id="gobelet", prod="Gobelet isotherme 40 oz gravé", photo="gobelet-creme-vierge.jpg", lines=["பிறந்தநாள்", "வாழ்த்துகள்", "பிரியா"], key="anniv",
       cx=.56, cy=.60, w=.30, h=.30, style="gold", font="serif", extra="+ le prénom « Priya » (பிரியா)"),
  # ─ bijoux ─
  dict(id="plaque", prod="Collier Plaque acier gravé (doré)", photo="collier_plaque_a_graver_dore.jpg", lines=["அம்மா"], key="amma",
       cx=.56, cy=.55, w=.25, h=.14, style="metal", font="sans", angle=-8, crop=(.2,.15,.9,.9)),
  dict(id="gourmette", prod="Bracelet gourmette à plaque gravée", photo="bracelet-gourmette-plaque-1.jpg", lines=["அப்பா"], key="appa",
       cx=.71, cy=.60, w=.26, h=.09, style="metal", font="sans", angle=34, crop=(.35,.33,.98,.9)),
  dict(id="homme-plaque", prod="Bracelet homme cuir & plaque", photo="bracelet-homme-plaque-1.jpg", lines=["உலகின் சிறந்த அப்பா"], key="best-appa",
       cx=.59, cy=.49, w=.26, h=.045, style="metal", font="sans", angle=-90, crop=(.25,.2,.85,.8)),
  dict(id="quatre-mots", prod="Collier Quatre Mots (barre à 4 faces)", photo="collier-quatre-mots-1.jpg", lines=["என் உயிரே"], key="uyire",
       cx=.50, cy=.68, w=.36, h=.045, style="metal", font="sans", angle=-90, crop=(.2,.28,.8,.95)),
  dict(id="femme", prod="Bracelet femme acier gravé", photo="bracelet_a_graver_dore.jpg", lines=["என் அன்பே"], key="anbe",
       cx=.57, cy=.585, w=.40, h=.07, style="metal", font="sans", angle=20, crop=(.1,.3,1,.9)),
  dict(id="cordon", prod="Bracelet cordon à plaque gravée", photo="bracelet-cordon-plaque-2.jpg", lines=["அன்பு"], key="anbu",
       cx=.39, cy=.65, w=.15, h=.055, style="metal", font="sans", crop=(.15,.35,.75,.85)),
  dict(id="medaillon", prod="Médaillon pivotant gravé", photo="collier-medaillon-pivotant-1.jpg", lines=["உன்னை", "காதலிக்கிறேன்"], key="kadhal",
       cx=.555, cy=.575, w=.25, h=.18, style="metal", font="sans", crop=(.15,.15,.95,.95)),
]

def font(kind, size, weight):
    path = os.path.join(FONTS, "NotoSerifTamil.ttf" if kind == "serif" else "NotoSansTamil.ttf")
    f = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    try:
        f.set_variation_by_axes([100, weight])  # axes : wdth, wght
    except Exception:
        pass
    return f

def mesure(f, lines):
    d = ImageDraw.Draw(Image.new("L", (10, 10)))
    ws, hs = [], []
    for t in lines:
        x0, y0, x1, y1 = d.textbbox((0, 0), t, font=f)
        ws.append(x1 - x0); hs.append(y1 - y0)
    return max(ws), hs

def rendu_texte(it, maxw, maxh):
    """Calque RGBA du texte (ajusté à maxw × maxh), avant rotation."""
    weight = 500 if it["style"] == "metal" else 400
    size = 300
    for _ in range(40):
        f = font(it["font"], size, weight)
        w, hs = mesure(f, it["lines"])
        inter = int(size * 0.32)
        h = sum(int(size * 1.15) for _ in hs) + inter * (len(hs) - 1)
        if w <= maxw and h <= maxh: break
        size = int(size * min(maxw / max(w, 1), maxh / max(h, 1)) * 0.97)
    lh = int(size * 1.15); inter = int(size * 0.32)
    W, H = int(maxw * 1.4) + 40, lh * len(it["lines"]) + inter * (len(it["lines"]) - 1) + 40
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    y = 20
    for t in it["lines"]:
        x0, y0, x1, y1 = d.textbbox((0, 0), t, font=f)
        d.text(((W - (x1 - x0)) / 2 - x0, y - y0 + (lh - (y1 - y0)) / 2), t, font=f, fill=(255, 255, 255, 255))
        y += lh + inter
    return lay

def grave(im, it):
    W, H = im.size
    lay = rendu_texte(it, it["w"] * W, it["h"] * H)
    ang = it.get("angle", 0)
    if ang: lay = lay.rotate(ang, expand=True, resample=Image.BICUBIC)
    a = lay.split()[3]
    cx, cy = it["cx"] * W, it["cy"] * H
    pos = (int(cx - lay.width / 2), int(cy - lay.height / 2))
    st = it["style"]
    if st == "glass":
        k = max(1, W // 600)
        sh = Image.new("RGBA", lay.size, (70, 76, 86, 0)); sh.putalpha(a.filter(ImageFilter.GaussianBlur(k * 1.5)).point(lambda v: int(v * 0.6)))
        im.paste(sh, (pos[0] + k, pos[1] + k), sh)
        bord = Image.new("RGBA", lay.size, (120, 128, 140, 0)); bord.putalpha(a.filter(ImageFilter.MaxFilter(3)).point(lambda v: int(v * 0.5)))
        im.paste(bord, pos, bord)
        txt = Image.new("RGBA", lay.size, (246, 248, 251, 0)); txt.putalpha(a.point(lambda v: int(v * 0.97)))
        im.paste(txt, pos, txt)
    else:
        col = (176, 130, 48) if st == "gold" else (38, 29, 20)
        hi = Image.new("RGBA", lay.size, (255, 255, 255, 0)); hi.putalpha(a.point(lambda v: int(v * 0.55)))
        im.paste(hi, (pos[0] + 1, pos[1] + 1), hi)
        sh = Image.new("RGBA", lay.size, (0, 0, 0, 0)); sh.putalpha(a.filter(ImageFilter.GaussianBlur(1)).point(lambda v: int(v * 0.35)))
        im.paste(sh, (pos[0] - 1, pos[1] - 1), sh)
        txt = Image.new("RGBA", lay.size, col + (0,)); txt.putalpha(a.point(lambda v: int(v * 0.96)))
        im.paste(txt, pos, txt)
    return im

def uri(im, q=82):
    o = io.BytesIO(); im.save(o, "JPEG", quality=q); return "data:image/jpeg;base64," + base64.b64encode(o.getvalue()).decode()

cards = []
for it in ITEMS:
    im = Image.open(os.path.join(PROD, it["photo"])).convert("RGB")
    im = grave(im, it)
    if "crop" in it:
        l, t, r, b = it["crop"]; im = im.crop((int(l * im.width), int(t * im.height), int(r * im.width), int(b * im.height)))
    # carré pour la carte (fond blanc), 900 px
    s = max(im.size); sq = Image.new("RGB", (s, s), (255, 255, 255)); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    sq.thumbnail((900, 900))
    ta, tr, sens, occ, note = PHRASES[it["key"]]
    it["img"] = uri(sq); it["ta"], it["tr"], it["sens"], it["occ"], it["note"] = ta, tr, sens, occ, note
    print(it["id"], "ok")

# ───────── polices intégrées pour l'affichage du tableau ─────────
def b64(p): return base64.b64encode(open(p, "rb").read()).decode()
fonts_css = f"""
@font-face{{font-family:'Tamil Serif';src:url(data:font/ttf;base64,{b64(os.path.join(FONTS,'NotoSerifTamil.ttf'))}) format('truetype');font-weight:100 900}}
@font-face{{font-family:'Tamil Sans';src:url(data:font/ttf;base64,{b64(os.path.join(FONTS,'NotoSansTamil.ttf'))}) format('truetype');font-weight:100 900}}
"""

def card(it):
    extra = f'<p class="ex">{it["extra"]}</p>' if it.get("extra") else ""
    note = f'<p class="note">⚠ {it["note"]}</p>' if it["note"] else ""
    return f"""<figure class="card rv">
  <img src="{it['img']}" alt="{it['prod']} : {it['sens']} en tamoul">
  <figcaption>
    <p class="prod">{it['prod']}</p>
    <p class="ta" lang="ta">{it['ta']}</p>
    <p class="tr">{it['tr']}</p>
    <p class="sens">{it['sens']} · <span>{it['occ']}</span></p>{extra}{note}
  </figcaption>
</figure>"""

verres = "".join(card(i) for i in ITEMS if i["style"] != "metal")
bijoux = "".join(card(i) for i in ITEMS if i["style"] == "metal")

rows = ""
for k, (ta, tr, sens, occ, note) in PHRASES.items():
    prods = ", ".join(i["prod"].split(" (")[0] for i in ITEMS if i["key"] == k) or "—"
    n = f' <em class="note">⚠ {note}</em>' if note else ""
    rows += f'<tr><td lang="ta" class="ta">{ta}</td><td class="tr">{tr}</td><td>{sens}{n}</td><td>{occ}</td><td>{prods}</td></tr>'

html = f"""<meta charset="utf-8"><title>Gravure tamoule</title>
<style>
{fonts_css}
:root{{--bg:#fbf7ee;--fg:#1a1206;--muted:#6b5e4a;--or:#c9a24b;--or2:#7c6120;--card:#ffffff;--line:#eadfc8;--encre:#1a1206;--sable:#f3e8d3}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--bg:#17120b;--fg:#f3e8d3;--muted:#c2b394;--or2:#e2c67e;--card:#231b10;--line:#3a2e1c;--sable:#2a2114;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#17120b;--fg:#f3e8d3;--muted:#c2b394;--or2:#e2c67e;--card:#231b10;--line:#3a2e1c;--sable:#2a2114;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;margin:0;padding-block:0 60px;padding-inline:16px;line-height:1.5}}
.wrap{{max-width:1120px;margin:0 auto}}
.bandeau{{background:var(--encre);color:#f3e8d3;margin:0 -16px;padding:34px 16px 30px;text-align:center}}
.bandeau h1{{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:clamp(1.7rem,4vw,2.6rem);margin:0 0 8px;text-wrap:balance}}
.bandeau h1 em{{font-style:italic;color:var(--or)}}
.bandeau p{{max-width:62ch;margin:0 auto;color:#d9c9a5;font-size:.98rem}}
.bandeau .ta{{font-family:'Tamil Serif',serif;font-size:1.5rem;color:#fff;margin-top:12px}}
.kicker{{display:inline-block;border:1px solid var(--or);color:var(--or);border-radius:999px;padding:3px 12px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}}
h2{{font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:1.6rem;margin:44px 0 6px;text-wrap:balance}}
h2 em{{font-style:italic;color:var(--or2)}}
.sub{{color:var(--muted);margin:0 0 18px;max-width:70ch}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}}
.card{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;min-width:0}}
.card img{{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#fff}}
.card figcaption{{padding:12px 14px 14px}}
.prod{{margin:0;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}}
.ta{{font-family:'Tamil Serif',serif;font-size:1.35rem;margin:4px 0 0;line-height:1.35}}
.tr{{margin:0;font-style:italic;color:var(--muted);font-size:.9rem}}
.sens{{margin:6px 0 0;font-size:.95rem}} .sens span{{color:var(--muted)}}
.ex{{margin:4px 0 0;font-size:.85rem;color:var(--muted)}}
.note{{color:#b3261e;font-size:.82rem;margin:6px 0 0}}
table{{border-collapse:collapse;width:100%;font-size:.92rem;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}}
th,td{{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}}
th{{background:var(--sable);font-weight:600;font-size:.8rem;letter-spacing:.05em;text-transform:uppercase}}
td.ta{{font-size:1.15rem;white-space:nowrap}} td.tr{{font-style:italic;color:var(--muted)}}
.tablew{{overflow-x:auto;border-radius:14px}}
.avis{{background:var(--sable);border-radius:16px;padding:18px 20px;margin-top:18px}}
.avis h3{{margin:0 0 8px;font-size:1.05rem}} .avis ul{{margin:0;padding-left:20px}} .avis li{{margin:6px 0}}
.rv{{opacity:0;transform:translateY(10px);transition:opacity .5s,transform .5s}} .rv.in{{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){{.rv{{opacity:1;transform:none;transition:none}}}}
@media (max-width:480px){{.grid{{grid-template-columns:1fr 1fr;gap:10px}} .card figcaption{{padding:10px}} .ta{{font-size:1.1rem}}}}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&family=Inter:wght@400;600&display=swap">
<div class="wrap">
<div class="bandeau">
  <span class="kicker">Maquette · rien n'est en ligne</span>
  <h1>Nos gravures en <em>tamoul</em></h1>
  <p>Les verres et les bijoux du site, gravés avec un texte en tamoul traditionnel : vœux d'anniversaire, de Noël et des grandes fêtes sur les verres, mots pour les parents et les amoureux sur les bijoux.</p>
  <p class="ta" lang="ta">வாழ்க வளமுடன்</p>
</div>

<h2>Les verres : <em>un vœu pour chaque fête</em></h2>
<p class="sub">Rendu givré blanc, comme nos gravures sur verre. Le texte tamoul se compte comme n'importe quel texte gravé, au tarif de la fiche.</p>
<div class="grid">{verres}</div>

<h2>Les bijoux : <em>pour les parents, pour les amoureux</em></h2>
<p class="sub">Gravure sombre sur l'acier, comme sur nos bijoux. Un mot court se lit mieux qu'une phrase : அம்மா, அப்பா, அன்பு tiennent sur toutes les plaques.</p>
<div class="grid">{bijoux}</div>

<h2>Toutes les phrases <em>proposées</em></h2>
<p class="sub">Tamoul · prononciation · sens · occasion · produit conseillé. Les lignes marquées ⚠ sont de ma composition et demandent une relecture.</p>
<div class="tablew"><table>
<thead><tr><th>Tamoul</th><th>Prononciation</th><th>Sens</th><th>Occasion</th><th>Produit</th></tr></thead>
<tbody>{rows}</tbody></table></div>

<div class="avis">
  <h3>Avant de mettre quoi que ce soit en ligne</h3>
  <ul>
    <li><b>Relecture.</b> Les phrases viennent du rapport « Marché tamoul » (sauf « Joyeux Noël », « meilleur papa / meilleure maman », composées par moi). Une faute dans une gravure ne se rattrape pas : chaque texte est à faire relire par un locuteur natif avant la première gravure.</li>
    <li><b>Écriture.</b> Les 8 écritures du site n'ont pas les lettres tamoules. Il faudra une 9ᵉ écriture (Noto Serif Tamil pour les verres, Noto Sans Tamil pour les bijoux, gratuites et libres) pour l'aperçu de la fiche, la fiche atelier et le fichier de gravure.</li>
    <li><b>Longueur.</b> « இனிய தமிழ் புத்தாண்டு நல்வாழ்த்துகள் » fait deux lignes sur un verre ; sur une plaque de bracelet, un seul mot (அம்மா, அப்பா, அன்பு) reste lisible.</li>
    <li><b>Où le dire aux clientes.</b> Une page « Gravure en tamoul » avec ces exemples, les phrases prêtes à cocher sur les fiches, et des vidéos autour de Deepavali, Pongal et du Nouvel An tamoul : c'est ce que le rapport conseille.</li>
  </ul>
</div>
</div>
<script>
(function(){{var io=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting){{e.target.classList.add('in');io.unobserve(e.target)}}}})}},{{threshold:.08}});document.querySelectorAll('.rv').forEach(function(el){{io.observe(el)}})}})();
</script>
"""
open(OUT, "w", encoding="utf-8").write(html)
print(OUT, len(html) // 1024, "Ko")
