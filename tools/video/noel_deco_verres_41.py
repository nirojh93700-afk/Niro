# -*- coding: utf-8 -*-
# VIDÉO 41 (29/10/2026) — gérant : « une vidéo de Noël, en disant c'est pour la déco, ambiance Noël… des effets différents,
# effets de vente, fais pas la même chose tout le temps… pour les verres, en montrant tout ce qui est déco Noël, tu changes
# un peu les logos ». Verres vierges du site + dessins de Noël du site (`public/produits/noel/noel-NN-trace.png`), un dessin
# différent par verre. Effets NOUVEAUX (pas ceux des vidéos 33 à 40) : neige qui tombe, lumières floues dorées, titre qui
# s'écrit lettre par lettre, avant / après au rideau, carrousel de dessins sur le même verre (« Modèle de Noël n° X »),
# cartes qui pivotent, écran partagé, tampons qui rebondissent, bouton qui pulse. Sans son, 1080 × 1920.
# ⛔ Aucun prix, aucun nombre de produits, aucune date, jamais Tom et Jerry / Mickey / Grinch (n° 8, 13, 15).
# Usage : python3 tools/video/noel_deco_verres_41.py <dossier de sortie>
import os, sys, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "..", "public", "produits")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (214, 176, 92); GOLD2 = (240, 214, 150); CREAM = (250, 246, 238); NUIT = (12, 22, 38); ROUGE = (150, 28, 30)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANSB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F = lambda p, s: ImageFont.truetype(p, s)
random.seed(41)

# ---------------------------------------------------------------- verres gravés (dessin de Noël posé sur le verre vierge)
def grave(verre, box, n, f=1.0):
    base = Image.open(os.path.join(PUB, verre)).convert("RGB"); bw_, bh_ = base.size
    t, l, w, h = box
    a = Image.open(os.path.join(PUB, "noel", f"noel-{n:02d}-trace.png")).convert("LA").split()[1]
    a = a.crop(a.getbbox())
    sc = min(w * bw_ * f / a.width, h * bh_ * f / a.height)
    a = a.resize((max(1, int(a.width * sc)), max(1, int(a.height * sc))), Image.LANCZOS)
    x = int(l * bw_ + (w * bw_ - a.width) / 2); y = int(t * bh_ + (h * bh_ - a.height) / 2)
    layer = Image.new("L", base.size, 0); layer.paste(a, (x, y))
    out = base.copy()
    out.paste(Image.new("RGB", base.size, (70, 72, 78)), (0, 0), layer.filter(ImageFilter.GaussianBlur(2)).point(lambda v: int(v * 0.35)))
    grain = Image.effect_noise(base.size, 35).point(lambda v: 215 + int((v - 128) * 0.3))
    out.paste(Image.new("RGB", base.size, (110, 113, 119)), (0, 0), ImageChops.multiply(layer, grain))
    return out, base

WHISKY = ("verre_a_whisky_grave_vide.jpg", (0.22, 0.28, 0.44, 0.46))
NOMS = {1: "Cloches de Noël au ruban", 3: "Père Noël, sapin et cadeaux", 4: "Forêt, cerfs et flocon", 7: "Couronne de Noël",
        10: "Cœur, traîneau et sapins", 11: "Renne au bonnet", 14: "Village et traîneau sous la lune", 20: "« Mon beau sapin »",
        23: "« Joyeux Noël »", 26: "Renne aux bois décorés"}
VERRES = [  # (fichier, box, n°, f, nom du verre)
    ("verre_vin_vierge.jpg", (0.15, 0.33, 0.34, 0.27), 10, 1.0, "Verre à vin"),
    ("flute_vierge.jpg", (0.13, 0.37, 0.26, 0.30), 23, 1.0, "Flûte à champagne"),
    ("verre_tumbler_37_vierge.jpg", (0.13, 0.24, 0.52, 0.44), 26, 0.7, "Verre tumbler"),
    ("verre_a_cocktail_vierge.jpg", (0.22, 0.36, 0.28, 0.38), 1, 1.0, "Verre à cocktail"),
    ("carafe_vierge.jpg", (0.48, 0.37, 0.26, 0.22), 4, 1.0, "Carafe à whisky"),
]
DUO = [("verre_vin_47_vierge.jpg", (0.19, 0.30, 0.40, 0.22), 20, 0.8), ("verre_tumbler_39_vierge.jpg", (0.11, 0.31, 0.38, 0.44), 14, 0.85)]
CARROUSEL = [11, 1, 7, 14, 26, 20, 3]

def carte(img, cw, ch, rayon=36, fond=(255, 255, 255)):
    """Photo ENTIÈRE posée dans une carte blanche arrondie (jamais recadrée)."""
    c = Image.new("RGB", (cw, ch), fond)
    im = img.copy(); im.thumbnail((cw - 40, ch - 40), Image.LANCZOS)
    c.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2))
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), rayon, fill=255)
    out = Image.new("RGBA", (cw, ch)); out.paste(c, (0, 0), m)
    return out

# ---------------------------------------------------------------- fond : nuit, lumières floues dorées, neige
def fond_bokeh():
    g = np.zeros((H, W, 3), np.float32)
    yy = np.linspace(0, 1, H)[:, None]
    for i, (a, b) in enumerate(zip((10, 20, 36), (34, 16, 22))):
        g[..., i] = a * (1 - yy) + b * yy
    im = Image.fromarray(g.clip(0, 255).astype(np.uint8))
    lum = Image.new("RGB", (W, H)); d = ImageDraw.Draw(lum)
    for _ in range(46):
        r = random.randint(30, 110); x = random.randint(-50, W + 50); y = random.randint(-50, H + 50)
        col = random.choice([(214, 176, 92), (240, 200, 120), (190, 60, 50), (255, 230, 170)])
        k = random.uniform(0.25, 0.7); d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(c * k) for c in col))
    lum = lum.filter(ImageFilter.GaussianBlur(26))
    return ImageChops.add(im, lum)

BOKEH = fond_bokeh()
FLOCONS = [[random.uniform(0, W), random.uniform(-H, H), random.uniform(2, 7), random.uniform(60, 190), random.uniform(0, 6.28)] for _ in range(150)]

def neige(im, t, force=1.0):
    d = ImageDraw.Draw(im, "RGBA")
    for x, y0, r, v, ph in FLOCONS:
        y = (y0 + v * t) % (H + 40) - 20
        xx = x + 22 * math.sin(t * 1.3 + ph)
        a = int(200 * force * (0.5 + r / 14))
        d.ellipse((xx - r, y - r, xx + r, y + r), fill=(255, 255, 255, min(255, a)))
    return im

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3
def rebond(x):
    x = max(0.0, min(1.0, x))
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2

def texte_centre(im, y, txt, font, fill, ombre=True, alpha=255):
    d = ImageDraw.Draw(im, "RGBA"); w = d.textlength(txt, font=font)
    if ombre: d.text(((W - w) / 2 + 3, y + 3), txt, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
    d.text(((W - w) / 2, y), txt, font=font, fill=fill + (alpha,))

def pilule(im, cx, y, txt, font, fond, coul, s=1.0, alpha=255):
    d0 = ImageDraw.Draw(im); w = d0.textlength(txt, font=font); hh = font.size + 30
    pw, ph = int(w + 64), hh
    p = Image.new("RGBA", (pw, ph)); d = ImageDraw.Draw(p)
    d.rounded_rectangle((0, 0, pw - 1, ph - 1), ph // 2, fill=fond + (alpha,))
    d.text((32, 13), txt, font=font, fill=coul + (alpha,))
    if s != 1.0 and s > 0.05: p = p.resize((max(1, int(pw * s)), max(1, int(ph * s))), Image.LANCZOS)
    if s > 0.05: im.paste(p, (int(cx - p.width / 2), int(y + (ph - p.height) / 2)), p)

def coller(im, c, cx, cy, s=1.0, rot=0.0, alpha=1.0):
    if s <= 0.02 or alpha <= 0.01: return
    x = c if s == 1 else c.resize((max(1, int(c.width * s)), max(1, int(c.height * s))), Image.BILINEAR)
    if rot: x = x.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = x.split()[3].point(lambda v: int(v * alpha)); x = x.copy(); x.putalpha(a)
    sh = Image.new("RGBA", x.size, (0, 0, 0, 0)); sh.putalpha(x.split()[3].point(lambda v: int(v * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    im.paste(sh, (int(cx - x.width / 2) + 10, int(cy - x.height / 2) + 22), sh)
    im.paste(x, (int(cx - x.width / 2), int(cy - x.height / 2)), x)

# ---------------------------------------------------------------- polices
FT_TITRE = F(SERIFB, 84); FT_SOUS = F(SERIF, 46); FT_NOM = F(SERIFB, 64); FT_PIL = F(SANSB, 36); FT_PETIT = F(SANS, 34)
FT_TAMPON = F(SANSB, 44); FT_URL = F(SERIFB, 66); FT_MARQUE = F(SERIFB, 54)

# ---------------------------------------------------------------- préparation des cartes
avant_apres = grave(WHISKY[0], WHISKY[1], 11, 0.9)
CW, CH = 860, 1060
C_AVANT = carte(avant_apres[1], CW, CH); C_APRES = carte(avant_apres[0], CW, CH)
C_CAR = [carte(grave(WHISKY[0], WHISKY[1], n, 0.9)[0], CW, CH) for n in CARROUSEL]
C_VERRES = [(carte(grave(v, b, n, f)[0], CW, CH), nom, n) for v, b, n, f, nom in VERRES]
C_DUO = [(carte(grave(v, b, n, f)[0], 500, 820), n) for v, b, n, f in DUO]

# ---------------------------------------------------------------- scènes (début, fin, fonction)
def s_intro(im, t, d):
    titre = ["Une table de Noël", "qui vous ressemble"]
    n = int(len("".join(titre)) * ease(t / 1.6))
    y = 700
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, y + i * 110, ligne[:k], FT_TITRE, CREAM)
    a = int(255 * ease((t - 1.6) / 0.6))
    if a > 0:
        texte_centre(im, 960, "Des verres gravés", FT_SOUS, GOLD2, alpha=a)
        texte_centre(im, 1020, "de dessins de Noël", FT_SOUS, GOLD2, alpha=a)
    a2 = ease((t - 2.2) / 0.5)
    if a2 > 0: pilule(im, W / 2, 1160, "Pour décorer les fêtes", FT_PIL, ROUGE, CREAM, s=rebond((t - 2.2) / 0.5))

def s_avant_apres(im, t, d):
    cx, cy = W / 2, 1000
    coller(im, C_AVANT, cx, cy, s=0.96 + 0.04 * ease(t / 0.6))
    p = ease((t - 0.8) / 1.8)
    if p > 0:
        larg = int(CW * p)
        if larg > 0:
            clip = C_APRES.crop((0, 0, larg, CH)); im.paste(clip, (int(cx - CW / 2), int(cy - CH / 2)), clip)
            x = int(cx - CW / 2 + larg); dd = ImageDraw.Draw(im, "RGBA")
            dd.rectangle((x - 3, int(cy - CH / 2), x + 3, int(cy + CH / 2)), fill=GOLD2 + (230,))
            for k in range(6):
                yy = cy - CH / 2 + random.random() * CH; dd.ellipse((x - 9, yy - 9, x + 9, yy + 9), fill=(255, 240, 200, 160))
    texte_centre(im, 250, "Avant  ·  Après", FT_NOM, CREAM)
    pilule(im, W / 2 - 230, 360, "Avant", FT_PIL, (60, 64, 72), CREAM, alpha=int(255 * (1 - p)))
    pilule(im, W / 2 + 230, 360, "Après", FT_PIL, GOLD, (20, 16, 8), alpha=int(255 * p))
    if t > 2.6: texte_centre(im, 1580, "Gravé à la commande", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 2.6) / 0.5)))
    if t > 2.9: texte_centre(im, 1640, "dans notre atelier", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 2.9) / 0.5)))

def s_carrousel(im, t, d):
    texte_centre(im, 230, "Choisissez votre dessin", FT_NOM, CREAM)
    pas = d / len(CARROUSEL); i = min(len(CARROUSEL) - 1, int(t / pas)); u = (t - i * pas) / pas
    cx, cy = W / 2, 1000
    if i > 0 and u < 0.25:
        coller(im, C_CAR[i - 1], cx, cy, s=1.0, alpha=1 - u / 0.25)
        coller(im, C_CAR[i], cx, cy, s=0.94 + 0.06 * ease(u / 0.25), alpha=u / 0.25)
    else:
        coller(im, C_CAR[i], cx, cy, s=1.0)
    n = CARROUSEL[i]
    pilule(im, W / 2, 1570, f"Modèle de Noël n° {n}", FT_PIL, ROUGE, CREAM, s=rebond(min(1, u / 0.3)))
    texte_centre(im, 1670, NOMS[n], FT_PETIT, CREAM)

def s_verres(im, t, d):
    pas = d / len(C_VERRES); i = min(len(C_VERRES) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, nom, n = C_VERRES[i]
    # carte qui pivote en entrant (largeur qui s'ouvre) puis qui avance doucement
    e = ease(u / 0.28)
    if e < 1:
        x = c.resize((max(2, int(CW * e)), CH), Image.BILINEAR)
        coller(im, x, W / 2, 980, rot=(1 - e) * 8)
    else:
        coller(im, c, W / 2 - 18 * (u - 0.28), 980, s=1 + 0.03 * (u - 0.28))
    if i > 0 and u < 0.2:
        cp = C_VERRES[i - 1][0]; coller(im, cp, W / 2 - W * ease(u / 0.2), 980, alpha=1 - u / 0.2)
    a = int(255 * ease((u - 0.2) / 0.2))
    texte_centre(im, 250, nom, FT_NOM, CREAM, alpha=a)
    pilule(im, W / 2, 1560, NOMS[n], FT_PIL, (32, 52, 40), GOLD2, alpha=a)

def s_duo(im, t, d):
    e = ease(t / 0.8)
    (c1, n1), (c2, n2) = C_DUO
    coller(im, c1, -300 + (W / 2 - 265 + 300) * e, 1000, rot=-3 * e)
    coller(im, c2, W + 300 - (W + 300 - (W / 2 + 265)) * e, 1040, rot=3 * e)
    a = int(255 * ease((t - 0.6) / 0.5))
    texte_centre(im, 250, "Toute la table", FT_NOM, CREAM, alpha=a)
    texte_centre(im, 330, "aux couleurs de Noël", FT_NOM, CREAM, alpha=a)
    texte_centre(im, 1520, "Un dessin différent sur chaque verre", FT_PETIT, GOLD2, alpha=int(255 * ease((t - 1.2) / 0.5)))

TAMPONS = [("Ajoutez un prénom", ROUGE), ("Gravé dans notre atelier", (32, 52, 40)), ("Pour toute la famille", (120, 88, 30))]
def s_tampons(im, t, d):
    coller(im, C_CAR[0], W / 2, 860, s=0.62)
    for k, (txt, col) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1300 + 120 * k, txt, FT_TAMPON, col, CREAM, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 640, "Votre table de fêtes", FT_TITRE, CREAM, alpha=int(255 * ease(t / 0.5)))
    texte_centre(im, 750, "commence ici", FT_TITRE, CREAM, alpha=int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 900, "Choisissez votre dessin de Noël", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1080, "nivcreation.fr", FT_URL, GOLD, (20, 16, 8), s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, alpha=int(200 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", FT_PETIT, CREAM, alpha=int(200 * ease((t - 1.4) / 0.5)))

SCENES = [(3.4, s_intro), (4.0, s_avant_apres), (4.9, s_carrousel), (10.0, s_verres), (3.4, s_duo), (2.6, s_tampons), (3.6, s_fin)]

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "41-noel-deco-verres-1080x1920.mp4")
    p = subprocess.Popen([FF, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", out],
                         stdin=subprocess.PIPE)
    for f in range(nf):
        t = f / FPS; acc = 0
        for d, fn in SCENES:
            if t < acc + d or fn is SCENES[-1][1]: break
            acc += d
        im = BOKEH.copy().convert("RGBA")
        lt = t - acc
        fn(im, lt, d)
        # fondu au noir entre les scènes (0,18 s)
        neige(im, t)
        rgb = im.convert("RGB")
        k = min(lt / 0.18, (d - lt) / 0.18, 1.0) if fn is not s_intro or lt > 0.2 else lt / 0.2
        if fn is SCENES[-1][1]: k = min(1.0, lt / 0.18)
        if k < 1: rgb = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), rgb, max(0.0, k))
        p.stdin.write(rgb.tobytes())
    p.stdin.close(); p.wait()
    leger = os.path.join(OUT, "41-noel-deco-verres-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "--apercu":
        for ts in [1.5, 3.0, 5.2, 6.4, 9.0, 13.5, 20.0, 24.0, 28.0, 31.0]:
            acc = 0
            for d, fn in SCENES:
                if ts < acc + d: break
                acc += d
            im = BOKEH.copy().convert("RGBA"); fn(im, ts - acc, d); neige(im, ts)
            im.convert("RGB").resize((360, 640)).save(os.path.join(OUT, f"apercu-{ts:05.1f}.jpg"), quality=85)
        print("ok")
    else:
        main()
