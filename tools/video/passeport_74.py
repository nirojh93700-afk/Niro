# -*- coding: utf-8 -*-
# VIDÉO 74 (22/11/2026) — gérant : « Fais-moi une vidéo pour les produits avec les langues ».
# Style NEUF « passeport » : une couverture de cuir s'ouvre ; sur chaque page, le mot en français s'écrit à la main,
# un tampon de la langue s'abat sur la page, le mot gravé apparaît dans sa langue en or et la photo du produit
# (aperçu du SITE, texte tapé dans la fiche) arrive en polaroïd. Puis les tampons de toutes les langues, et la fin.
# ⛔ Aucun prix, aucun nombre de produits ni de langues. Sans son, 1080 × 1920.
# Usage : python3 tools/video/passeport_74.py <dossier captures> <dossier polices> <sortie> [--apercu]
#   captures : c-vin-ar.png, c-carafe-it.png, c-cocktail-zh.png, c-whisky-pt.png, c-flute-he.png, c-tumbler-es.png,
#              plaque-ta.jpg, c-vin47-en.png, c-flute-de.png, c-whisky-ta.png (captures .gallery-main de next start local)
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

SRC, FD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
APERCU = "--apercu" in sys.argv
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
OR = (196, 152, 62); OR2 = (232, 201, 128); ENCRE = (34, 24, 12); BRUN = (110, 82, 48); PAPIER = (246, 238, 220)
random.seed(74)

def police(nom, taille, axes=None):
    f = ImageFont.truetype(os.path.join(FD, nom + ".ttf"), taille, layout_engine=ImageFont.Layout.RAQM)
    if axes:
        try: f.set_variation_by_axes(axes)
        except Exception: pass
    return f
PLAY = lambda s: police("PlayfairDisplay", s, [600])
PLAYI = lambda s: police("PlayfairDisplayItalic", s, [500])
INTER = lambda s: police("Inter", s, [14, 600])
MAIN = lambda s: police("Caveat", s, [700])
ECR = {
    "ar": lambda s: police("NotoNaskhArabic", s, [700]),
    "he": lambda s: police("NotoSansHebrew", s, [600, 100]),
    "zh": lambda s: police("NotoSansSC", s, [600]),
    "ta": lambda s: police("NotoSerifTamil", s, [600, 100]),
}
def ecr(lg, s): return ECR.get(lg, PLAY)(s)

LANGUES = {  # nom français, nom dans la langue, couleur d'encre du tampon
    "ar": ("ARABE", "العربية", (150, 32, 44)), "it": ("ITALIEN", "Italiano", (28, 96, 62)),
    "zh": ("CHINOIS", "中文", (170, 40, 36)), "pt": ("PORTUGAIS", "Português", (26, 70, 140)),
    "he": ("HÉBREU", "עברית", (40, 60, 130)), "es": ("ESPAGNOL", "Español", (176, 70, 30)),
    "ta": ("TAMOUL", "தமிழ்", (120, 36, 90)), "en": ("ANGLAIS", "English", (30, 50, 110)),
    "de": ("ALLEMAND", "Deutsch", (60, 60, 60)), "fr": ("FRANÇAIS", "Français", (30, 64, 150)),
}
PIECES = [  # capture, langue, ce que la cliente écrit, ce qui est gravé, produit
    ("c-vin-ar.png", "ar", "Je t'aime", "أحبك", "Verre à vin gravé"),
    ("c-carafe-it.png", "it", "Papa", "Papà", "Carafe à whisky gravée"),
    ("c-cocktail-zh.png", "zh", "Bonne année", "新年快乐", "Verre à cocktail gravé"),
    ("c-whisky-pt.png", "pt", "Merci", "Obrigado", "Verre à whisky gravé"),
    ("c-flute-he.png", "he", "Félicitations", "מזל טוב", "Flûte à champagne gravée"),
    ("c-tumbler-es.png", "es", "Je t'aime", "Te quiero", "Verre tumbler en cristal"),
    ("plaque-ta.jpg", "ta", "Maman", "அம்மா", "Collier plaque acier"),
    ("c-vin47-en.png", "en", "Mon amour", "My love", "Verre à vin 47 cl"),
    ("c-flute-de.png", "de", "Santé !", "Prost!", "Flûte à champagne gravée"),
    ("c-whisky-ta.png", "ta", "Papa", "அப்பா", "Verre à whisky gravé"),
]

def ease(t): t = min(max(t, 0), 1); return t * t * (3 - 2 * t)
def out_back(t):
    t = min(max(t, 0), 1); c = 1.9
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
def clamp(t): return min(max(t, 0), 1)

# ------------------------------------------------------------------ papier de passeport (guillochis doré)
def papier():
    a = np.zeros((H, W, 3), np.float32)
    for i, c in enumerate(PAPIER): a[..., i] = c
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2
    a *= (1 - 0.22 * v)[..., None]
    a += np.random.default_rng(74).normal(0, 2.2, (H, W, 1))
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    for k in range(34):  # ondes de guillochis
        pts = [(x, 140 + k * 52 + 18 * math.sin(x / 70 + k * .7) + 9 * math.sin(x / 23 + k)) for x in range(0, W + 8, 8)]
        d.line(pts, fill=OR + (34,), width=2)
    for r in range(60, 420, 26):  # rosace en filigrane
        d.ellipse((W / 2 - r, 1080 - r * .55, W / 2 + r, 1080 + r * .55), outline=OR + (18,), width=2)
    d.rectangle((36, 36, W - 37, H - 37), outline=OR + (150,), width=3)
    d.rectangle((50, 50, W - 51, H - 51), outline=OR + (90,), width=1)
    f = INTER(24)
    t = "PASSEPORT DES MOTS  ✦  NIV CRÉATION"
    t = "PASSEPORT DES MOTS   ·   NIV CRÉATION"
    bb = d.textbbox((0, 0), t, font=f); d.text(((W - bb[2]) / 2, 82), t, font=f, fill=BRUN + (200,))
    return im
PAPIER_IM = papier()

def texte_img(txt, f, col, pad=30):
    d = ImageDraw.Draw(Image.new("L", (4, 4)))
    bb = d.textbbox((0, 0), txt, font=f)
    im = Image.new("RGBA", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=f, fill=col)
    return im

def ajuste(txt, fabrique, taille, maxw):
    while taille > 30:
        f = fabrique(taille); bb = ImageDraw.Draw(Image.new("L", (4, 4))).textbbox((0, 0), txt, font=f)
        if bb[2] - bb[0] <= maxw: return f
        taille = int(taille * .92)
    return fabrique(taille)

def etoile(d, cx, cy, r, col):
    pts = []
    for i in range(8):
        a = math.pi / 4 * i - math.pi / 2; rr = r if i % 2 == 0 else r * .32
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=col)

def blanc(im):
    """Garde la zone blanche de la photo (retire les bords beiges de la galerie), complétée en carré blanc."""
    a = np.array(im.convert("L"), np.float32)
    cols = np.where(a.mean(0) > 247)[0]; rows = np.where(a.mean(1) > 230)[0]
    if len(cols) > 50: im = im.crop((int(cols.min()), 0, int(cols.max()) + 1, im.height))
    w, h = im.size; s = max(w, h)
    c = Image.new("RGB", (s, s), (255, 255, 255)); c.paste(im, ((s - w) // 2, (s - h) // 2))
    return c

def tampon(lg, large=520):
    nom, natif, col = LANGUES[lg]
    h = int(large * .42)
    im = Image.new("RGBA", (large, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 6, large - 7, h - 7), 22, outline=col + (255,), width=7)
    d.rounded_rectangle((20, 20, large - 21, h - 21), 14, outline=col + (255,), width=3)
    f1 = ajuste(nom, INTER, int(h * .30), large - 90)
    b1 = d.textbbox((0, 0), nom, font=f1); d.text(((large - (b1[2] - b1[0])) / 2 - b1[0], h * .2 - b1[1]), nom, font=f1, fill=col + (255,))
    f2 = ajuste(natif, lambda s: ecr(lg, s) if lg in ECR else PLAYI(s), int(h * .27), large - 110)
    b2 = d.textbbox((0, 0), natif, font=f2); d.text(((large - (b2[2] - b2[0])) / 2 - b2[0], h * .56 - b2[1]), natif, font=f2, fill=col + (255,))
    etoile(d, 44, h / 2, 13, col + (255,)); etoile(d, large - 44, h / 2, 13, col + (255,))
    # encre irrégulière
    rng = np.random.default_rng(abs(hash(lg)) % 9999)
    a = np.array(im.split()[3], np.float32)
    bruit = rng.random(a.shape)
    bruit = np.array(Image.fromarray((bruit * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    a *= np.where(bruit < .23, .15, .9)
    im.putalpha(Image.fromarray(a.clip(0, 255).astype(np.uint8)))
    return im

def polaroid(img, cote=760, legende="", rot=0):
    im = img.convert("RGB")
    # cadrage carré autour du produit (les captures ont des bords beiges de la galerie)
    im = blanc(im)
    im = im.resize((cote, cote), Image.LANCZOS)
    bord, bas = 30, 120
    p = Image.new("RGBA", (cote + 2 * bord, cote + bord + bas), (253, 251, 246, 255))
    p.paste(im, (bord, bord))
    if legende:
        f = ajuste(legende, MAIN, 64, cote)
        d = ImageDraw.Draw(p); bb = d.textbbox((0, 0), legende, font=f)
        d.text(((p.width - (bb[2] - bb[0])) / 2 - bb[0], cote + bord + (bas - (bb[3] - bb[1])) / 2 - bb[1]), legende, font=f, fill=(70, 52, 30, 255))
    # ruban adhésif
    ruban = Image.new("RGBA", (220, 64), (236, 222, 180, 170))
    ruban = ruban.rotate(-6, expand=True, resample=Image.BICUBIC)
    p.alpha_composite(ruban, ((p.width - ruban.width) // 2, -8))
    ombre = Image.new("RGBA", (p.width + 80, p.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(ombre).rectangle((40, 50, p.width + 40, p.height + 50), fill=(40, 25, 10, 90))
    ombre = ombre.filter(ImageFilter.GaussianBlur(18))
    ombre.alpha_composite(p, (40, 40))
    return ombre.rotate(rot, expand=True, resample=Image.BICUBIC)

def colle(fond, calque, cx, cy, alpha=1.0, echelle=1.0, rot=0):
    c = calque
    if echelle != 1.0: c = c.resize((max(1, int(c.width * echelle)), max(1, int(c.height * echelle))), Image.BICUBIC)
    if rot: c = c.rotate(rot, expand=True, resample=Image.BICUBIC)
    if alpha < 1.0:
        c = c.copy(); c.putalpha(c.split()[3].point(lambda v: int(v * alpha)))
    fond.alpha_composite(c, (int(cx - c.width / 2), int(cy - c.height / 2)))

# ------------------------------------------------------------------ scènes
DUREE_PIECE = 3.4
class Page:
    def __init__(self, i, p):
        fic, lg, fr, grave, prod = p
        self.lg = lg; self.fr = fr
        self.lab1 = texte_img("Vous écrivez en français", INTER(30), BRUN + (230,), 10)
        self.frim = texte_img(fr, ajuste(fr, MAIN, 128, 860), ENCRE + (255,), 14)
        self.lab2 = texte_img("Nous gravons, en " + LANGUES[lg][0].lower(), INTER(30), BRUN + (230,), 10)
        self.grim = texte_img(grave, ajuste(grave, lambda s: ecr(lg, s), 112, 640), OR + (255,), 18)
        self.tamp = tampon(lg)
        src = Image.open(os.path.join(SRC, fic)).convert("RGB")
        if fic.startswith("plaque"): src = src.crop((140, 0, 940, 790))
        self.pol = polaroid(src, 640, prod, (-2.2 if i % 2 else 2.0))
        self.rot_t = (-9 if i % 2 else 7)
        self.num = i + 1
    def rendu(self, t):
        f = PAPIER_IM.convert("RGBA")
        d = ImageDraw.Draw(f)
        colle(f, self.lab1, 300, 200, ease(t / .3))
        # écriture à la main : révélée de gauche à droite
        k = ease((t - .15) / .75)
        if k > 0:
            fr = self.frim.copy(); m = Image.new("L", fr.size, 0)
            ImageDraw.Draw(m).rectangle((0, 0, int(fr.width * k), fr.height), fill=255)
            a = fr.split()[3]; fr.putalpha(Image.composite(a, Image.new("L", fr.size, 0), m))
            f.alpha_composite(fr, (90, 250))
            # trait de plume sous le mot
            d.line((110, 250 + fr.height - 6, 110 + int((fr.width - 40) * k), 250 + fr.height - 10), fill=OR + (170,), width=4)
        # tampon qui s'abat
        ts = (t - .95) / .32
        if ts > 0:
            e = 1.55 - .55 * out_back(ts)
            colle(f, self.tamp, 770, 492, clamp(ts * 2.2), e, self.rot_t)
        colle(f, self.lab2, 300, 600, ease((t - 1.25) / .3))
        kg = ease((t - 1.35) / .45)
        if kg > 0: colle(f, self.grim, W / 2, 730 - 30 * (1 - kg), kg)
        # photo
        kp = ease((t - .25) / .7)
        colle(f, self.pol, W / 2, 1335 + 560 * (1 - kp), 1.0)
        # numéro de page
        n = f"{self.num:02d}"
        fn = INTER(26); bb = d.textbbox((0, 0), n, font=fn); d.text(((W - bb[2]) / 2, H - 96), n, font=fn, fill=BRUN + (180,))
        return f

def couverture(t):
    """Couverture de cuir encre, titre doré embossé ; elle s'ouvre vers la gauche à la fin."""
    a = np.zeros((H, W, 3), np.float32); base = (44, 30, 16)
    for i, c in enumerate(base): a[..., i] = c
    rng = np.random.default_rng(7)
    grain = np.array(Image.fromarray((rng.random((H // 3, W // 3)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2)), np.float32)
    a += (grain[..., None] - 128) * .10
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); v = ((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2
    a *= (1 - .5 * v)[..., None]
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert("RGBA"); d = ImageDraw.Draw(im)
    d.rectangle((60, 60, W - 61, H - 61), outline=OR + (200,), width=3); d.rectangle((76, 76, W - 77, H - 77), outline=OR + (120,), width=1)
    k = ease(t / .9)
    for r in (150, 132):
        d.ellipse((W / 2 - r, 560 - r, W / 2 + r, 560 + r), outline=OR + (int(220 * k),), width=4 if r == 150 else 2)
    if k > 0:
        et = Image.new("RGBA", (200, 200), (0, 0, 0, 0)); etoile(ImageDraw.Draw(et), 100, 100, 70, OR2 + (255,)); colle(im, et, W / 2, 560, k)
    titre = texte_img("Vos mots", PLAY(150), OR2 + (255,))
    colle(im, titre, W / 2, 900, ease((t - .3) / .6))
    sous = texte_img("dans votre langue", PLAYI(92), OR2 + (255,))
    colle(im, sous, W / 2, 1060, ease((t - .6) / .6))
    ligne = texte_img("GRAVÉS DANS NOTRE ATELIER EN FRANCE", INTER(34), OR + (230,))
    colle(im, ligne, W / 2, 1230, ease((t - .9) / .6))
    # reflet qui passe
    kr = (t - 1.2) / .8
    if 0 < kr < 1:
        x = int(-300 + (W + 600) * kr); m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon([(x, 0), (x + 140, 0), (x - 260, H), (x - 400, H)], fill=60)
        im.alpha_composite(Image.new("RGBA", (W, H), (255, 236, 190, 255)).copy(), (0, 0)) if False else None
        reflet = Image.new("RGBA", (W, H), (255, 236, 190, 0)); reflet.putalpha(m.filter(ImageFilter.GaussianBlur(30)))
        im.alpha_composite(reflet)
    return im

def tourne(a, b, k):
    """Page qui tourne : a part vers la gauche en se rétrécissant, b apparaît dessous."""
    k = ease(k)
    f = b.copy()
    if k < 1:
        w = max(1, int(W * (1 - k)))
        pa = a.resize((w, H), Image.BICUBIC)
        ombre = Image.new("RGBA", (W, H), (0, 0, 0, int(110 * (1 - k))))
        f.alpha_composite(ombre)
        f.alpha_composite(pa, (0, 0))
        dd = ImageDraw.Draw(f)
        for i in range(30): dd.line((w + i, 0, w + i, H), fill=(0, 0, 0, int(80 * (1 - i / 30) * (1 - k))))
    return f

def tous_tampons(t):
    f = PAPIER_IM.convert("RGBA"); d = ImageDraw.Draw(f)
    colle(f, texte_img("Choisissez votre langue", PLAY(84), ENCRE + (255,)), W / 2, 230, ease(t / .4))
    colle(f, texte_img("sur la fiche de votre création", PLAYI(56), BRUN + (255,)), W / 2, 330, ease((t - .2) / .4))
    ordre = ["fr", "en", "ar", "zh", "es", "he", "it", "ta", "de", "pt"]
    pos = [(300, 560), (780, 600), (290, 830), (790, 880), (300, 1100), (780, 1150), (310, 1370), (780, 1420), (300, 1640), (780, 1680)]
    for i, lg in enumerate(ordre):
        ts = (t - .5 - i * .22) / .3
        if ts > 0:
            colle(f, TAMPONS_PETITS[lg], pos[i][0], pos[i][1], clamp(ts * 2), 1.5 - .5 * out_back(ts), (-8 if i % 2 else 6))
    return f
TAMPONS_PETITS = {lg: tampon(lg, 430) for lg in LANGUES}

def fin(t):
    f = PAPIER_IM.convert("RGBA")
    lignes = [("Vous écrivez en français,", PLAY(66), ENCRE), ("nous traduisons,", PLAY(66), ENCRE),
              ("vous relisez,", PLAY(66), ENCRE), ("nous gravons.", PLAY(78), OR)]
    for i, (tx, fo, co) in enumerate(lignes):
        colle(f, texte_img(tx, fo, co + (255,)), W / 2, 520 + i * 130 - 20 * (1 - ease((t - i * .35) / .4)), ease((t - i * .35) / .4))
    kb = ease((t - 1.6) / .5)
    if kb > 0:
        pulse = 1 + .04 * math.sin((t - 1.6) * 5)
        bouton = Image.new("RGBA", (700, 150), (0, 0, 0, 0)); bd = ImageDraw.Draw(bouton)
        bd.rounded_rectangle((0, 0, 699, 149), 75, fill=ENCRE + (255,))
        bd.rounded_rectangle((8, 8, 691, 141), 68, outline=OR + (255,), width=3)
        fo = PLAY(64); bb = bd.textbbox((0, 0), "nivcreation.fr", font=fo)
        bd.text(((700 - (bb[2] - bb[0])) / 2 - bb[0], (150 - (bb[3] - bb[1])) / 2 - bb[1]), "nivcreation.fr", font=fo, fill=OR2 + (255,))
        colle(f, bouton, W / 2, 1220, kb, pulse)
    colle(f, TAMPON_FRANCE, W / 2, 1520, clamp((t - 2.1) * 3), 1.5 - .5 * out_back((t - 2.1) / .3), -6)
    return f
def _tampon_france():
    large = 600; h = 230; col = (26, 64, 140)
    im = Image.new("RGBA", (large, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 6, large - 7, h - 7), 24, outline=col + (255,), width=7)
    d.rounded_rectangle((20, 20, large - 21, h - 21), 16, outline=col + (255,), width=3)
    for tx, fo, y in (("GRAVÉ EN FRANCE", INTER(48), .26), ("dans notre atelier", PLAYI(40), .60)):
        bb = d.textbbox((0, 0), tx, font=fo); d.text(((large - (bb[2] - bb[0])) / 2 - bb[0], h * y - (bb[3] - bb[1]) / 2 - bb[1]), tx, font=fo, fill=col + (255,))
    return im
TAMPON_FRANCE = _tampon_france()

# ------------------------------------------------------------------ montage
PAGES = [Page(i, p) for i, p in enumerate(PIECES)]
SEQ = []  # (durée, fonction(t) -> image)
SEQ.append((2.6, couverture))
for pg in PAGES: SEQ.append((DUREE_PIECE, pg.rendu))
SEQ.append((3.4, tous_tampons))
SEQ.append((3.8, fin))
TOURNE = .38  # chevauchement : la page précédente tourne pendant le début de la suivante

def image_a(T):
    t0 = 0
    for i, (dur, fn) in enumerate(SEQ):
        if T < t0 + dur or i == len(SEQ) - 1:
            t = T - t0
            cur = fn(min(t, dur))
            if i > 0 and t < TOURNE:
                pd, pf = SEQ[i - 1]
                return tourne(pf(pd), cur, t / TOURNE)
            return cur
        t0 += dur
total = sum(d for d, _ in SEQ)

if APERCU:
    T = [1.8] + [2.6 + i * DUREE_PIECE + 2.9 for i in range(len(PAGES))] + [total - 7.4 + 3.0, total - .3]
    vs = [image_a(t).convert("RGB").resize((270, 480)) for t in T]
    pl = Image.new("RGB", (270 * 7, 480 * ((len(vs) + 6) // 7)), "white")
    for i, v in enumerate(vs): pl.paste(v, ((i % 7) * 270, (i // 7) * 480))
    pl.save(os.path.join(OUT, "apercu-74.jpg"), quality=88); print("apercu", total); sys.exit()

brut = os.path.join(OUT, "74-langues-passeport-1080x1920.mp4")
cmd = [FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", brut]
pr = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
n = int(total * FPS)
for i in range(n):
    pr.stdin.write(image_a(i / FPS).convert("RGB").tobytes())
pr.stdin.close(); pr.wait()
leger = os.path.join(OUT, "74-langues-passeport-720x1280.mp4")
subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-preset", "medium",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", leger], stderr=subprocess.DEVNULL)
print("ok", round(total, 1), brut, leger)
