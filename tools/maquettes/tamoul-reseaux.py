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
        f = font(fam, size, axes=[600, 100])
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

RENDUS = [  # bijoux sans aperçu du site : (id, photo, lignes, cx, cy, w, h, angle, phrase, produit) — mesuré sur la photo
  ("coeur-ouvrable", "catalogue/il_fullxfull.8055354801_l7f2.jpg", ["உன்னை", "காதலிக்கிறேன்"], .585, .575, .17, .11, -14, "kadhal", "Médaillon cœur ouvrable"),
  ("coeur-grave", "collier-coeur-grave-3.jpg", ["அன்பு"], .50, .60, .15, .08, 0, "anbu", "Collier cœur gravé"),
  ("medaillon", "collier-medaillon-pivotant-1.jpg", ["என்றென்றும்"], .478, .635, .13, .05, 0, "enrendrum", "Médaillon pivotant"),
  ("cordon", "bracelet-cordon-plaque-2.jpg", ["அன்பு"], .39, .65, .14, .05, 0, "anbu", "Bracelet cordon à plaque"),
  ("gourmette-photo", "bracelet-gourmette-plaque-1.jpg", ["அப்பா"], .655, .638, .19, .045, 27, "appa", "Bracelet gourmette à plaque"),
  ("homme-plaque-photo", "bracelet-homme-plaque-1.jpg", ["உலகின் சிறந்த அப்பா"], .552, .44, .27, .04, -90, "best-appa", "Bracelet homme cuir & plaque"),
]
# Retirés le 06/11 (texte illisible ou sur une gravure déjà présente) : Quatre Mots (barre de 2 mm déjà gravée sur la photo),
# collier enveloppe (pas de face plane assez grande visible).
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
from PIL import ImageChops
LOGO = Image.open(ROOT + "/public/logo-niv-creation.jpg").convert("RGB")
OR = (201, 162, 75); CREME = (243, 232, 211); ENCRE = (26, 18, 6); GRIS = (190, 172, 135)
ZH = 790                     # hauteur de la zone photo ; le bandeau prend le reste (290 px), rien ne passe dessous
M = 56                       # marge gauche / droite du bandeau
LOGO_W = 200

def bord(im):  # couleur du fond = médiane des pixels du bord
    W, H = im.size; px = [im.getpixel((x, y)) for x in range(0, W, max(1, W // 40)) for y in (0, H - 1)]
    px += [im.getpixel((x, y)) for y in range(0, H, max(1, H // 40)) for x in (0, W - 1)]
    return tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))

def coins(im):  # couleur médiane des quatre coins
    W, H = im.size; px = [im.getpixel((x, y)) for x in (2, W - 3) for y in (2, H - 3)]
    return tuple(sorted(c[i] for c in px)[1] for i in range(3))

def serre(im):  # retire le fond uni de la page (couleur du coin) ; fond de la zone = couleur des coins de ce qui reste
    bg = im.getpixel((3, 3))
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg)).convert("L").point(lambda v: 255 if v > 18 else 0)
    bb = diff.getbbox()
    if not bb or (bb[2] - bb[0]) * (bb[3] - bb[1]) > .92 * im.width * im.height: return im, False, bg
    im = im.crop(bb); return im, True, coins(im)

def zone_photo(src):
    im = Image.open(src).convert("RGB")
    pr, uni, fond = serre(im)
    if not uni:  # photo d'ambiance : elle remplit la zone (recadrage au centre)
        r = 1080 / ZH; W, H = im.size
        if W / H > r: w = int(H * r); im = im.crop(((W - w) // 2, 0, (W - w) // 2 + w, H))
        else: h = int(W / r); top = (H - h) // 2; im = im.crop((0, top, W, top + h))
        return im.resize((1080, ZH), Image.LANCZOS)
    if pr.width > pr.height * 1.6:  # bracelet très large : on garde le centre (la plaque et un peu de chaîne)
        # recadrage centré sur la plaque (la plus grosse masse claire), pas sur le milieu de l'image
        g = ImageChops.difference(pr, Image.new("RGB", pr.size, fond)).convert("L").point(lambda v: 255 if v > 18 else 0)
        cols = [sum(1 for y in range(0, pr.height, 3) if g.getpixel((x, y))) for x in range(pr.width)]
        tot = sum(cols) or 1; cx = sum(x * v for x, v in enumerate(cols)) / tot
        c = int(max(pr.height * 1.6, pr.width * .62)); l = int(min(max(0, cx - c / 2), pr.width - c)); pr = pr.crop((l, 0, l + c, pr.height))
    z = Image.new("RGB", (1080, ZH), fond)
    k = min(960 / pr.width, (ZH - 90) / pr.height); pr = pr.resize((int(pr.width * k), int(pr.height * k)), Image.LANCZOS)
    z.paste(pr, ((1080 - pr.width) // 2, (ZH - pr.height) // 2))
    return z

def largeur(d, t, f): b = d.textbbox((0, 0), t, font=f); return b[2] - b[0]

def ajuste(d, t, fam, size, maxw, axes, mini):
    f = font(fam, size, axes=axes)
    while largeur(d, t, f) > maxw and size > mini: size -= 2; f = font(fam, size, axes=axes)
    return f

def coupe(t):  # deux lignes équilibrées, coupées à un espace
    mots = t.split(); best = None
    for i in range(1, len(mots)):
        a, b = " ".join(mots[:i]), " ".join(mots[i:]); s = max(len(a), len(b))
        if best is None or s < best[0]: best = (s, [a, b])
    return best[1] if best else [t]

def compose(src, key, prod, out):
    canvas = Image.new("RGB", (1080, 1080), ENCRE); canvas.paste(zone_photo(src), (0, 0))
    d = ImageDraw.Draw(canvas)
    d.rectangle([0, ZH, 1080, ZH + 3], fill=OR)
    ta, sens = PH[key]
    colw = 1080 - 2 * M - LOGO_W - 36           # colonne de texte, jamais sous le logo
    TA = [600, 100]
    f = font("NotoSerifTamil", 54, axes=TA); lignes = [ta]
    if largeur(d, ta, f) > colw:
        f2 = ajuste(d, ta, "NotoSerifTamil", 54, colw, TA, 44)
        if largeur(d, ta, f2) <= colw: f = f2
        else:
            lignes = coupe(ta); f = font("NotoSerifTamil", 46, axes=TA)
            while max(largeur(d, l, f) for l in lignes) > colw: f = font("NotoSerifTamil", f.size - 2, axes=TA)
    fs = ajuste(d, sens, "PlayfairDisplay", 38, colw, [500], 26)
    fp = font("Inter", 17, axes=[14, 500]); pl = prod.upper() + "   ·   GRAVÉ EN FRANCE"
    lh = int(f.size * 1.42)
    hb = lh * len(lignes) + 8 + 48 + 16 + 22
    y = ZH + 4 + (1080 - ZH - 4 - hb) // 2
    for l in lignes:
        b = d.textbbox((0, 0), l, font=f); d.text((M - b[0], y + (lh - (b[3] - b[1])) // 2 - b[1]), l, font=f, fill=OR); y += lh
    y += 8; b = d.textbbox((0, 0), sens, font=fs); d.text((M - b[0], y + (48 - (b[3] - b[1])) // 2 - b[1]), sens, font=fs, fill=CREME)
    y += 48 + 16; d.text((M, y), pl, font=fp, fill=GRIS)
    # logo + adresse, colonne de droite
    lg = LOGO.copy(); lg.thumbnail((LOGO_W, 200)); ly = ZH + 4 + (1080 - ZH - 4 - (lg.height + 46)) // 2
    canvas.paste(lg, (1080 - M - lg.width, ly))
    fu = font("Inter", 22, axes=[14, 600]); u = "nivcreation.fr"
    d.text((1080 - M - largeur(d, u, fu), ly + lg.height + 16), u, font=fu, fill=OR)
    # contrôle : aucun texte du bandeau ne dépasse sa colonne
    for l in lignes: assert largeur(d, l, f) <= colw, (out, l)
    assert largeur(d, sens, fs) <= colw, (out, sens)
    assert M + largeur(d, pl, fp) <= 1080 - M - LOGO_W - 36 or y > ly + lg.height + 46, (out, pl)
    canvas.save(out, quality=92)

RETIREES = {5, 10, 21, 22, 23, 24}  # retirées par le gérant le 06/11 (carafe Pongal, gobelet crème, médaillon, cordon, gourmette et cuir sur photo)
for i, (src, key, prod) in enumerate(IMGS, 1):
    if i in RETIREES: continue
    name = f"{i:02d}-{os.path.splitext(os.path.basename(src))[0]}-{key}.jpg"
    compose(src, key, prod, f"{OUT}/{name}"); print(name)
