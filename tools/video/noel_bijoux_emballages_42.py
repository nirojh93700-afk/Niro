# -*- coding: utf-8 -*-
# VIDÉO 42 (30/10/2026) — gérant : « fais-moi une autre vidéo ». Thème choisi : les BIJOUX GRAVÉS et leurs EMBALLAGES DE NOËL
# (nouveauté du site : sachet, pochette, sac à anses, boîte à ruban vert sapin ou bleu nuit, boîte rouge, pack, étiquette offerte).
# Mêmes effets que la vidéo 41, qu'il aime (neige, lumières dorées, titre lettre par lettre, cartes qui pivotent, carrousel,
# écran partagé, éventail, tampons qui rebondissent, bouton qui pulse). Photos de bijoux GRAVÉS seulement (planche regardée),
# photos des emballages = celles du site (`public/produits/noel/emballages/`). Sans son, 1080 × 1920.
# ⛔ Aucun prix, aucun nombre de produits, aucune date.
# Usage : python3 tools/video/noel_bijoux_emballages_42.py <dossier de sortie> [--apercu]
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
random.seed(42)

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


P_EMB = os.path.join(PUB, "noel", "emballages")
def ph(f): return Image.open(os.path.join(PUB, f)).convert("RGB")
def pe(f): return Image.open(os.path.join(P_EMB, f)).convert("RGB")

BIJOUX = [  # photos où la gravure se voit (planche du 30/10)
    ("collier-coeur-grave-1.jpg", "Collier Cœur gravé", "Initiales et date"),
    ("collier-coeur-plaques-1.jpg", "Collier Cœur & plaques", "Un prénom sur chaque plaque"),
    ("collier-double-coeur-3.jpg", "Collier Double Cœur", "Un mot doux au verso"),
    ("bracelet-femme-acier-grave.jpg", "Bracelet femme gravé", "Votre phrase"),
    ("bracelet-cordon-plaque-4.jpg", "Bracelet à plaque gravée", "Des initiales, un symbole"),
    ("collier-coeur-grave-2.jpg", "Collier Cœur gravé", "Un prénom, une date"),
]
EMB = [
    ("7-sachet-rouge-O-remise.jpg", "Sachet rouge de Noël"),
    ("1-pochette-F.jpg", "Pochette à languette dorée"),
    ("2-sac-M.jpg", "Sac de Noël à anses"),
    ("4-boite-rouge-G.jpg", "Boîte rouge au sapin doré"),
    ("3-5-boite-ruban-C-vert-recadree.jpg", "Boîte à ruban « Merry Christmas »"),
]

FT_TITRE = F(SERIFB, 80); FT_SOUS = F(SERIF, 46); FT_NOM = F(SERIFB, 60); FT_PIL = F(SANSB, 36); FT_PETIT = F(SANS, 34)
FT_TAMPON = F(SANSB, 44); FT_URL = F(SERIFB, 66); FT_MARQUE = F(SERIFB, 54)

CW, CH = 860, 1060
C_BIJ = [(carte(ph(f), CW, CH), nom, pil) for f, nom, pil in BIJOUX]
C_EMB = [(carte(pe(f), CW, CH), nom) for f, nom in EMB]
C_VERT = carte(pe("3-5-boite-ruban-C-vert-recadree.jpg"), 460, 660)
C_BLEU = carte(pe("3-5-boite-ruban-J-bleu-recadree.jpg"), 460, 660)
C_PACK = [carte(ph("collier-coeur-grave-1.jpg"), 440, 560), carte(pe("3-5-boite-ruban-C-vert-recadree.jpg"), 440, 560), carte(pe("2-sac-M.jpg"), 440, 560)]
C_ETIQ = carte(pe("6-etiquettes-I.jpg"), 640, 760)

def s_intro(im, t, d):
    titre = ["Un bijou gravé,", "prêt à offrir"]
    n = int(len("".join(titre)) * ease(t / 1.6))
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, 700 + i * 110, ligne[:k], FT_TITRE, CREAM)
    a = int(255 * ease((t - 1.6) / 0.6))
    if a > 0:
        texte_centre(im, 960, "Son prénom gravé,", FT_SOUS, GOLD2, alpha=a)
        texte_centre(im, 1020, "dans un emballage de Noël", FT_SOUS, GOLD2, alpha=a)
    if t > 2.2: pilule(im, W / 2, 1160, "Idée cadeau de Noël", FT_PIL, ROUGE, CREAM, s=rebond((t - 2.2) / 0.5))

def s_bijoux(im, t, d):
    pas = d / len(C_BIJ); i = min(len(C_BIJ) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, nom, pil = C_BIJ[i]
    e = ease(u / 0.28)
    if e < 1:
        x = c.resize((max(2, int(CW * e)), CH), Image.BILINEAR)
        coller(im, x, W / 2, 980, rot=(1 - e) * 8)
    else:
        coller(im, c, W / 2 - 18 * (u - 0.28), 980, s=1 + 0.03 * (u - 0.28))
    if i > 0 and u < 0.2:
        coller(im, C_BIJ[i - 1][0], W / 2 - W * ease(u / 0.2), 980, alpha=1 - u / 0.2)
    a = int(255 * ease((u - 0.2) / 0.2))
    texte_centre(im, 250, nom, FT_NOM, CREAM, alpha=a)
    pilule(im, W / 2, 1560, pil, FT_PIL, (32, 52, 40), GOLD2, alpha=a)

def s_emballages(im, t, d):
    texte_centre(im, 220, "Ajoutez son", FT_NOM, CREAM)
    texte_centre(im, 300, "emballage de Noël", FT_NOM, GOLD2)
    pas = d / len(C_EMB); i = min(len(C_EMB) - 1, int(t / pas)); u = (t - i * pas) / pas
    cx, cy = W / 2, 1010
    if i > 0 and u < 0.25:
        coller(im, C_EMB[i - 1][0], cx, cy, alpha=1 - u / 0.25)
        coller(im, C_EMB[i][0], cx, cy, s=0.94 + 0.06 * ease(u / 0.25), alpha=u / 0.25)
    else:
        coller(im, C_EMB[i][0], cx, cy, s=1.0 + 0.02 * u)
    pilule(im, W / 2, 1590, C_EMB[i][1], FT_PIL, ROUGE, CREAM, s=rebond(min(1, u / 0.3)))

def s_couleurs(im, t, d):
    e = ease(t / 0.8)
    coller(im, C_VERT, -300 + (W / 2 - 245 + 300) * e, 980, rot=-3 * e)
    coller(im, C_BLEU, W + 300 - (W + 300 - (W / 2 + 245)) * e, 1020, rot=3 * e)
    a = int(255 * ease((t - 0.6) / 0.5))
    texte_centre(im, 260, "Vert sapin", FT_NOM, (150, 205, 165), alpha=a)
    texte_centre(im, 345, "ou bleu nuit ?", FT_NOM, (160, 180, 235), alpha=a)
    texte_centre(im, 1470, "La boîte à ruban, dans la couleur", FT_PETIT, GOLD2, alpha=int(255 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1520, "que vous préférez", FT_PETIT, GOLD2, alpha=int(255 * ease((t - 1.3) / 0.5)))

def s_pack(im, t, d):
    texte_centre(im, 240, "Le pack de Noël", FT_NOM, CREAM, alpha=int(255 * ease(t / 0.5)))
    for k, (c, rot, dx) in enumerate(zip(C_PACK, (-11, 0, 11), (-280, 0, 280))):
        e = ease((t - 0.25 * k) / 0.7)
        if e > 0: coller(im, c, W / 2 + dx * e, 1000 + 40 * abs(dx) / 280 * e, s=0.6 + 0.4 * e, rot=rot * e)
    if t > 1.2: pilule(im, W / 2, 1420, "Le bijou + la boîte + le sac", FT_PIL, (120, 88, 30), CREAM, s=rebond((t - 1.2) / 0.5))
    texte_centre(im, 1560, "Il n'y a plus qu'à offrir", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 1.8) / 0.5)))

TAMPONS = [("Étiquette offerte", ROUGE), ("Gravé dans notre atelier", (32, 52, 40)), ("Prêt à mettre sous le sapin", (120, 88, 30))]
def s_tampons(im, t, d):
    coller(im, C_ETIQ, W / 2, 800, s=0.85)
    for k, (txt, col) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1300 + 120 * k, txt, FT_TAMPON, col, CREAM, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 640, "Offrez un bijou", FT_TITRE, CREAM, alpha=int(255 * ease(t / 0.5)))
    texte_centre(im, 750, "qui porte son prénom", FT_TITRE, CREAM, alpha=int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 900, "Commandez tôt pour Noël", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1080, "nivcreation.fr", FT_URL, GOLD, (20, 16, 8), s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, alpha=int(200 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", FT_PETIT, CREAM, alpha=int(200 * ease((t - 1.4) / 0.5)))

SCENES = [(3.4, s_intro), (10.2, s_bijoux), (6.0, s_emballages), (3.4, s_couleurs), (3.6, s_pack), (2.8, s_tampons), (3.6, s_fin)]

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "42-noel-bijoux-emballages-1080x1920.mp4")
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
    leger = os.path.join(OUT, "42-noel-bijoux-emballages-720x1280.mp4")
    subprocess.run([FF, "-y", "-i", out, "-vf", "scale=720:1280", "-c:v", "libx264", "-crf", "26", "-an", "-movflags", "+faststart", leger], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(out, leger, f"{total:.1f} s")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "--apercu":
        for ts in [2.6, 4.5, 8.0, 12.5, 15.0, 18.0, 21.5, 24.5, 27.5, 30.0, 32.5]:
            acc = 0
            for d, fn in SCENES:
                if ts < acc + d: break
                acc += d
            im = BOKEH.copy().convert("RGBA"); fn(im, ts - acc, d); neige(im, ts)
            im.convert("RGB").resize((360, 640)).save(os.path.join(OUT, f"apercu-{ts:05.1f}.jpg"), quality=85)
        print("ok")
    else:
        main()
