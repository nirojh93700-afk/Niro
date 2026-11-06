#!/usr/bin/env python3
"""Images pour les RÉSEAUX SOCIAUX (06/11/2026) : verres, gobelets et bijoux gravés en tamoul. RIEN sur le site.
Usage : python3 tools/maquettes/tamoul-reseaux.py <scratch> <sortie>
  <scratch>/final/*.jpg  = captures des aperçus du SITE (verres en 2 lignes, mots courts, bijoux 3D) — voir gravure-tamoul.py
  <scratch>/gob/*.jpg    = gobelets rendus par le moteur de tools/maquettes/gobelet-exemples.py (rendu(), police Noto Serif Tamil)
  <scratch>/fonts/       = NotoSerifTamil, NotoSansTamil, PlayfairDisplay, Inter (google/fonts, OFL)
Bijoux sans aperçu sur le site (cœur ouvrable, cœur, médaillon pivotant, Quatre Mots, cordon, enveloppe) : texte gravé posé
sur la photo du site (rendu sombre sur métal, comme les exemples du gobelet). Format carré 1080 × 1080, bandeau encre & or.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SC, OUT = sys.argv[1], sys.argv[2]
ROOT = "/home/user/Niro"; PROD = ROOT + "/public/produits"; F = SC + "/fonts"
os.makedirs(OUT, exist_ok=True); os.makedirs(SC + "/rend", exist_ok=True)

def font(name, size, wght=None, axes=None):
    f = ImageFont.truetype(f"{F}/{name}.ttf", size, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f

# ─────────── texte gravé sur une photo de bijou (métal) ───────────
def masque(lines, maxw, maxh, fam="NotoSansTamil"):
    size = 400
    for _ in range(40):
        f = font(fam, size, axes=[100, 600])
        d = ImageDraw.Draw(Image.new("L", (10, 10)))
        bbs = [d.textbbox((0, 0), t, font=f) for t in lines]
        w = max(b[2] - b[0] for b in bbs); lh = int(size * 1.12); inter = int(size * .3)
        h = lh * len(lines) + inter * (len(lines) - 1)
        if w <= maxw and h <= maxh: break
        size = int(size * min(maxw / max(w, 1), maxh / max(h, 1)) * .97)
    W, H = w + 60, h + 60
    m = Image.new("L", (W, H), 0); d = ImageDraw.Draw(m); y = 30
    for t, b in zip(lines, bbs):
        d.text(((W - (b[2] - b[0])) / 2 - b[0], y - b[1] + (lh - (b[3] - b[1])) / 2), t, font=f, fill=255); y += lh + inter
    return m

def grave_metal(photo, lines, cx, cy, w, h, angle=0, out=None):
    im = Image.open(PROD + "/" + photo).convert("RGB"); W, H = im.size
    m = masque(lines, w * W, h * H)
    if angle: m = m.rotate(angle, expand=True, resample=Image.BICUBIC)
    pos = (int(cx * W - m.width / 2), int(cy * H - m.height / 2))
    # reflet clair décalé (arête de la gravure) puis creux sombre
    hi = Image.new("RGBA", m.size, (255, 255, 255, 0)); hi.putalpha(m.point(lambda v: int(v * .45)))
    im.paste(hi, (pos[0] + 2, pos[1] + 2), hi)
    # couleur du creux = la teinte du métal assombrie (lue sous le texte)
    zone = im.crop((pos[0], pos[1], pos[0] + m.width, pos[1] + m.height)).resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    col = tuple(int(c * .32) for c in zone)
    sh = Image.new("RGBA", m.size, col + (0,)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: int(v * .5)))
    im.paste(sh, (pos[0] - 1, pos[1] - 1), sh)
    txt = Image.new("RGBA", m.size, col + (0,)); txt.putalpha(m.point(lambda v: int(v * .95)))
    im.paste(txt, pos, txt)
    im.save(out, quality=94); return out

PH = {  # phrase : tamoul, sens
  "anniv": ("பிறந்தநாள் வாழ்த்துகள்", "Joyeux anniversaire"), "noel": ("இனிய கிறிஸ்துமஸ் வாழ்த்துகள்", "Joyeux Noël"),
  "deepa": ("இனிய தீபாவளி நல்வாழ்த்துகள்", "Joyeux Deepavali"), "pongal": ("இனிய பொங்கல் நல்வாழ்த்துகள்", "Joyeux Pongal"),
  "puthandu": ("இனிய தமிழ் புத்தாண்டு நல்வாழ்த்துகள்", "Bonne année tamoule"), "mariage": ("திருமண நல்வாழ்த்துகள்", "Félicitations pour votre mariage"),
  "nandri": ("நன்றி", "Merci"), "amma": ("அம்மா", "Maman"), "appa": ("அப்பா", "Papa"), "best-appa": ("உலகின் சிறந்த அப்பா", "Le meilleur papa du monde"),
  "anbu": ("அன்பு", "Amour"), "anbe": ("என் அன்பே", "Mon amour"), "uyire": ("என் உயிரே", "Ma vie"), "kadhal": ("உன்னை காதலிக்கிறேன்", "Je t'aime"),
  "enrendrum": ("என்றென்றும்", "Pour toujours"), "anniv-prenom": ("பிறந்தநாள் வாழ்த்துகள் · பிரியா", "Joyeux anniversaire, Priya"),
}

RENDUS = [  # bijoux sans aperçu du site
  ("coeur-ouvrable", "catalogue/il_fullxfull.8055354801_l7f2.jpg", ["உன்னை", "காதலிக்கிறேன்"], .66, .50, .30, .26, -4, "kadhal", "Médaillon cœur ouvrable"),
  ("coeur-grave", "collier-coeur-grave-3.jpg", ["அன்பு"], .50, .60, .15, .08, 0, "anbu", "Collier cœur gravé"),
  ("medaillon", "collier-medaillon-pivotant-1.jpg", ["என்றென்றும்"], .56, .60, .19, .07, 0, "enrendrum", "Médaillon pivotant"),
  ("quatre-mots", "collier-quatre-mots-3.jpg", ["என் உயிரே"], .455, .70, .19, .032, -90, "uyire", "Collier Quatre Mots"),
  ("cordon", "bracelet-cordon-plaque-2.jpg", ["அன்பு"], .39, .65, .14, .05, 0, "anbu", "Bracelet cordon à plaque"),
  ("enveloppe", "catalogue/il_fullxfull.7864685296_55z9.jpg", ["என் உயிரே"], .715, .565, .10, .04, 28, "uyire", "Collier enveloppe message secret"),
  ("gourmette-photo", "bracelet-gourmette-plaque-1.jpg", ["அப்பா"], .71, .60, .26, .09, 34, "appa", "Bracelet gourmette à plaque"),
  ("homme-plaque-photo", "bracelet-homme-plaque-1.jpg", ["உலகின் சிறந்த அப்பா"], .59, .49, .26, .045, -90, "best-appa", "Bracelet homme cuir & plaque"),
]
for id_, photo, lines, cx, cy, w, h, ang, key, prod in RENDUS:
    grave_metal(photo, lines, cx, cy, w, h, ang, out=f"{SC}/rend/{id_}.jpg")

# ─────────── liste des images à composer ───────────
IMGS = [  # (fichier source, phrase, produit)
  (f"{SC}/final/whisky-2l.jpg", "anniv", "Verre à whisky gravé"), (f"{SC}/final/cocktail-2l.jpg", "noel", "Verre à cocktail gravé"),
  (f"{SC}/final/vin-2l.jpg", "deepa", "Verre à vin gravé"), (f"{SC}/final/flute-2l.jpg", "mariage", "Flûte à champagne gravée"),
  (f"{SC}/final/carafe-2l.jpg", "pongal", "Carafe à whisky gravée"), (f"{SC}/final/tumbler-2l.jpg", "puthandu", "Verre tumbler en cristal"),
  (f"{SC}/final/whisky-court.jpg", "appa", "Verre à whisky gravé"), (f"{SC}/final/tumbler-court.jpg", "nandri", "Verre tumbler en cristal"),
  (f"{SC}/final/vin-court.jpg", "anbu", "Verre à vin gravé"),
  (f"{SC}/gob/gobelet-creme-anniv.jpg", "anniv-prenom", "Gobelet isotherme 40 oz"), (f"{SC}/gob/gobelet-marine-appa.jpg", "appa", "Gobelet isotherme 40 oz"),
  (f"{SC}/gob/gobelet-rose-amma.jpg", "amma", "Gobelet isotherme 40 oz"), (f"{SC}/gob/gobelet-blanc-deepavali.jpg", "deepa", "Gobelet isotherme 40 oz"),
  (f"{SC}/final/plaque.jpg", "amma", "Collier plaque acier"), (f"{SC}/final/gourmette.jpg", "appa", "Bracelet gourmette"),
  (f"{SC}/final/chaine.jpg", "best-appa", "Bracelet chaîne acier"), (f"{SC}/final/silicone.jpg", "appa", "Bracelet acier & silicone"),
  (f"{SC}/final/papillon.jpg", "anbe", "Bracelet papillon"),
] + [(f"{SC}/rend/{r[0]}.jpg", r[8], r[9]) for r in RENDUS]

# ─────────── composition 1080 × 1080 ───────────
LOGO = Image.open(ROOT + "/public/logo-niv-creation.jpg").convert("RGB")
OR = (201, 162, 75); CREME = (243, 232, 211); ENCRE = (26, 18, 6)
def compose(src, key, prod, out):
    im = Image.open(src).convert("RGB")
    bg = im.getpixel((3, 3))
    # on serre sur le produit (fond uni), marge 5 %
    from PIL import ImageChops
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg)).convert("L").point(lambda v: 255 if v > 18 else 0)
    bb = diff.getbbox()
    if bb:
        l, t, r, b = bb; px, py = int((r - l) * .05), int((b - t) * .05)
        im = im.crop((max(0, l - px), max(0, t - py), min(im.width, r + px), min(im.height, b + py)))
    if im.width > im.height * 1.15:  # image large (bracelets 3D) : on recadre au centre, la plaque en grand
        c = int(max(im.height * 1.15, im.width * 0.48)); l = (im.width - c) // 2; im = im.crop((l, 0, l + c, im.height))
    s = max(im.size); sq = Image.new("RGB", (s, s), bg); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    sq = sq.resize((1080, 1080), Image.LANCZOS)
    # produit un peu remonté : le bandeau du bas prend 250 px
    canvas = Image.new("RGB", (1080, 1080), bg)
    prodim = sq.resize((860, 860), Image.LANCZOS); canvas.paste(prodim, (110, 0 if False else 10))
    band = Image.new("RGBA", (1080, 250), ENCRE + (235,)); canvas.paste(band, (0, 830), band)
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, 830, 1080, 833], fill=OR)
    ta, sens = PH[key]
    fta = font("NotoSerifTamil", 58, axes=[100, 500])
    while d.textbbox((0, 0), ta, font=fta)[2] > 760: fta = font("NotoSerifTamil", fta.size - 3, axes=[100, 500])
    d.text((48, 862), ta, font=fta, fill=OR)
    d.text((48, 955), sens, font=font("PlayfairDisplay", 40, axes=[500]), fill=CREME)
    d.text((48, 1018), prod.upper() + "  ·  GRAVÉ EN FRANCE", font=font("Inter", 20, axes=[14, 500]), fill=(190, 172, 135))
    lg = LOGO.copy(); lg.thumbnail((190, 110)); canvas.paste(lg, (1080 - lg.width - 44, 850))
    d.text((1080 - 44 - d.textbbox((0, 0), "nivcreation.fr", font=font("Inter", 24, axes=[14, 600]))[2], 982), "nivcreation.fr", font=font("Inter", 24, axes=[14, 600]), fill=OR)
    canvas.save(out, quality=92)

for i, (src, key, prod) in enumerate(IMGS, 1):
    name = f"{i:02d}-{os.path.splitext(os.path.basename(src))[0]}-{key}.jpg"
    compose(src, key, prod, f"{OUT}/{name}"); print(name)
