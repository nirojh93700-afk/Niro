# -*- coding: utf-8 -*-
# VIDÉO 43 (30/10/2026) — gérant : « fais-moi une autre vidéo, mais normal, pas Noël, avec d'autres produits ».
# Cristal photo 3D, puzzles, veilleuse au prénom, couverts enfant, plaques de naissance, support téléphone, marque-pages,
# porte-clés cristal (photos où la gravure se voit, produits en vente vérifiés en ligne le 30/10). Mêmes effets que la 41
# (qu'il aime) SANS Noël : fond encre et or, poussière dorée qui monte au lieu de la neige, aucune couleur rouge de Noël.
# ⛔ Aucun prix, aucun nombre de produits, aucune date.
# Usage : python3 tools/video/pub_graves_43.py <dossier de sortie> [--apercu]
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
random.seed(43)

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
    for i, (a, b) in enumerate(zip((14, 20, 30), (30, 22, 14))):
        g[..., i] = a * (1 - yy) + b * yy
    im = Image.fromarray(g.clip(0, 255).astype(np.uint8))
    lum = Image.new("RGB", (W, H)); d = ImageDraw.Draw(lum)
    for _ in range(46):
        r = random.randint(30, 110); x = random.randint(-50, W + 50); y = random.randint(-50, H + 50)
        col = random.choice([(214, 176, 92), (240, 200, 120), (180, 140, 80), (255, 230, 170)])
        k = random.uniform(0.25, 0.7); d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(c * k) for c in col))
    lum = lum.filter(ImageFilter.GaussianBlur(26))
    return ImageChops.add(im, lum)

BOKEH = fond_bokeh()
FLOCONS = [[random.uniform(0, W), random.uniform(-H, H), random.uniform(2, 7), random.uniform(60, 190), random.uniform(0, 6.28)] for _ in range(150)]

def neige(im, t, force=1.0):
    """Poussière dorée qui monte doucement (remplace la neige de Noël)."""
    d = ImageDraw.Draw(im, "RGBA")
    for x, y0, r, v, ph in FLOCONS:
        y = (y0 - v * 0.35 * t) % (H + 40) - 20
        xx = x + 14 * math.sin(t * 0.9 + ph)
        rr = r * 0.45
        a = int(150 * force * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 2.2 + ph))))
        d.ellipse((xx - rr, y - rr, xx + rr, y + rr), fill=(255, 226, 160, min(255, a)))
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


FT_TITRE = F(SERIFB, 80); FT_SOUS = F(SERIF, 46); FT_NOM = F(SERIFB, 60); FT_PIL = F(SANSB, 36); FT_PETIT = F(SANS, 34)
FT_TAMPON = F(SANSB, 44); FT_URL = F(SERIFB, 66); FT_MARQUE = F(SERIFB, 54)

def ph(f): return Image.open(os.path.join(PUB, "..", f)).convert("RGB")
BRUN = (96, 66, 30); VERT = (32, 52, 40); ENCRE = (26, 18, 6)

PRODUITS = [  # (photo, nom, ce qu'on y grave)
    ("produits/cristal-v-couple.jpg", "Cristal photo 3D", "Votre photo, en 3D dans le verre"),
    ("produits/cristal-h-famille.jpg", "Cristal photo 3D horizontal", "Une photo et un texte"),
    ("produits/puzzle-photo-famille.jpg", "Puzzle photo gravé", "Votre photo, en pièces de bois"),
    ("produits/veilleuse-prenom-1.jpg", "Veilleuse Arbre de Vie", "Son prénom, en lumière"),
    ("produits/couverts_enfants_ex_prenom.jpg", "Couverts enfant gravés", "Son prénom sur chaque couvert"),
    ("produits/plaque-naissance-coeur-1.jpg", "Plaque de naissance", "Le prénom et le jour de sa naissance"),
    ("marque-pages/m1/exemple-ex1.jpg", "Marque-page en bois", "Un prénom, un dessin"),
]
CW, CH = 860, 1060
C_PROD = [(carte(ph(f), CW, CH), nom, pil) for f, nom, pil in PRODUITS]
C_AVANT = carte(ph("produits/support-telephone-vierge.jpg"), CW, 700)
C_APRES = carte(ph("produits/support-telephone-photo.jpg"), CW, 700)
TROIS = [("produits/support-telephone-photo.jpg", "Une photo"), ("produits/support-telephone-lettre.jpg", "Une initiale fleurie"),
         ("produits/porte-cles-coeur-demo.jpg", "Un portrait dans le cristal"), ("produits/cristal-v-enfant-chien.jpg", "Un souvenir")]
C_TROIS = [(carte(ph(f), CW, CH), t) for f, t in TROIS]
C_DUO = [carte(ph("produits/puzzle-photo-enfants.jpg"), 470, 660), carte(ph("produits/puzzle-savane.jpg"), 470, 660)]
C_FEE = carte(ph("produits/plaque-naissance-fille-1.jpg"), 700, 640)

def s_intro(im, t, d):
    titre = ["Votre photo,", "votre prénom"]
    n = int(len("".join(titre)) * ease(t / 1.5))
    for i, ligne in enumerate(titre):
        k = max(0, min(len(ligne), n - sum(len(x) for x in titre[:i])))
        if k: texte_centre(im, 700 + i * 110, ligne[:k], FT_TITRE, CREAM)
    a = int(255 * ease((t - 1.5) / 0.6))
    if a > 0:
        texte_centre(im, 960, "gravés pour vous", FT_SOUS, GOLD2, alpha=a)
        texte_centre(im, 1020, "dans notre atelier", FT_SOUS, GOLD2, alpha=a)
    if t > 2.1: pilule(im, W / 2, 1160, "Gravé en France", FT_PIL, GOLD, ENCRE, s=rebond((t - 2.1) / 0.5))

def s_avant_apres(im, t, d):
    cx, cy = W / 2, 1000
    coller(im, C_AVANT, cx, cy, s=0.96 + 0.04 * ease(t / 0.6))
    p = ease((t - 0.8) / 1.8)
    if p > 0:
        larg = int(CW * p)
        if larg > 0:
            clip = C_APRES.crop((0, 0, larg, 700)); im.paste(clip, (int(cx - CW / 2), int(cy - 350)), clip)
            x = int(cx - CW / 2 + larg); dd = ImageDraw.Draw(im, "RGBA")
            dd.rectangle((x - 3, int(cy - 350), x + 3, int(cy + 350)), fill=GOLD2 + (230,))
            for k in range(6):
                yy = cy - 350 + random.random() * 700; dd.ellipse((x - 9, yy - 9, x + 9, yy + 9), fill=(255, 240, 200, 160))
    texte_centre(im, 330, "Avant  ·  Après", FT_NOM, CREAM)
    pilule(im, W / 2 - 230, 440, "Avant", FT_PIL, (60, 64, 72), CREAM, alpha=int(255 * (1 - p)))
    pilule(im, W / 2 + 230, 440, "Après", FT_PIL, GOLD, ENCRE, alpha=int(255 * p))
    if t > 2.6: texte_centre(im, 1440, "Support téléphone en bois", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 2.6) / 0.5)))
    if t > 2.9: texte_centre(im, 1500, "gravé de votre photo", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 2.9) / 0.5)))

def s_produits(im, t, d):
    pas = d / len(C_PROD); i = min(len(C_PROD) - 1, int(t / pas)); u = (t - i * pas) / pas
    c, nom, pil = C_PROD[i]
    e = ease(u / 0.28)
    if e < 1:
        x = c.resize((max(2, int(CW * e)), CH), Image.BILINEAR)
        coller(im, x, W / 2, 980, rot=(1 - e) * 8)
    else:
        coller(im, c, W / 2 - 18 * (u - 0.28), 980, s=1 + 0.03 * (u - 0.28))
    if i > 0 and u < 0.2:
        coller(im, C_PROD[i - 1][0], W / 2 - W * ease(u / 0.2), 980, alpha=1 - u / 0.2)
    a = int(255 * ease((u - 0.2) / 0.2))
    texte_centre(im, 250, nom, FT_NOM, CREAM, alpha=a)
    pilule(im, W / 2, 1560, pil, FT_PIL, VERT, GOLD2, alpha=a)

def s_trois(im, t, d):
    texte_centre(im, 230, "Ce que vous voulez graver", FT_NOM, CREAM)
    pas = d / len(C_TROIS); i = min(len(C_TROIS) - 1, int(t / pas)); u = (t - i * pas) / pas
    cx, cy = W / 2, 1000
    if i > 0 and u < 0.25:
        coller(im, C_TROIS[i - 1][0], cx, cy, alpha=1 - u / 0.25)
        coller(im, C_TROIS[i][0], cx, cy, s=0.94 + 0.06 * ease(u / 0.25), alpha=u / 0.25)
    else:
        coller(im, C_TROIS[i][0], cx, cy, s=1.0 + 0.02 * u)
    pilule(im, W / 2, 1590, C_TROIS[i][1], FT_PIL, BRUN, CREAM, s=rebond(min(1, u / 0.3)))

def s_duo(im, t, d):
    e = ease(t / 0.8)
    coller(im, C_DUO[0], -300 + (W / 2 - 245 + 300) * e, 980, rot=-3 * e)
    coller(im, C_DUO[1], W + 300 - (W + 300 - (W / 2 + 245)) * e, 1020, rot=3 * e)
    a = int(255 * ease((t - 0.6) / 0.5))
    texte_centre(im, 260, "Pour les grands", FT_NOM, CREAM, alpha=a)
    texte_centre(im, 345, "comme pour les petits", FT_NOM, GOLD2, alpha=a)
    texte_centre(im, 1470, "Puzzle photo gravé  ·  Puzzle en bois", FT_PETIT, GOLD2, alpha=int(255 * ease((t - 1.2) / 0.5)))

TAMPONS = [("Gravé à la commande", BRUN), ("Dans notre atelier", VERT), ("Un cadeau unique", (120, 88, 30))]
def s_tampons(im, t, d):
    coller(im, C_FEE, W / 2, 800, s=0.85)
    for k, (txt, col) in enumerate(TAMPONS):
        u = (t - 0.35 - 0.5 * k) / 0.45
        if u > 0: pilule(im, W / 2, 1300 + 120 * k, txt, FT_TAMPON, col, CREAM, s=rebond(u))

def s_fin(im, t, d):
    texte_centre(im, 640, "Un cadeau", FT_TITRE, CREAM, alpha=int(255 * ease(t / 0.5)))
    texte_centre(im, 750, "qui leur ressemble", FT_TITRE, CREAM, alpha=int(255 * ease((t - 0.3) / 0.5)))
    texte_centre(im, 900, "Choisissez, on grave pour vous", FT_SOUS, GOLD2, alpha=int(255 * ease((t - 0.6) / 0.5)))
    if t > 0.9:
        s = 1 + 0.05 * math.sin((t - 0.9) * 5)
        pilule(im, W / 2, 1080, "nivcreation.fr", FT_URL, GOLD, ENCRE, s=rebond((t - 0.9) / 0.5) * s)
    texte_centre(im, 1330, "NiV CRÉATION", FT_MARQUE, GOLD2, alpha=int(200 * ease((t - 1.2) / 0.5)))
    texte_centre(im, 1410, "Gravé en France", FT_PETIT, CREAM, alpha=int(200 * ease((t - 1.4) / 0.5)))

SCENES = [(3.2, s_intro), (4.0, s_avant_apres), (11.2, s_produits), (5.6, s_trois), (3.4, s_duo), (2.8, s_tampons), (3.6, s_fin)]

def main():
    total = sum(d for d, _ in SCENES); nf = int(total * FPS)
    out = os.path.join(OUT, "43-graves-cristal-bois-1080x1920.mp4")
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
    leger = os.path.join(OUT, "43-graves-cristal-bois-720x1280.mp4")
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
